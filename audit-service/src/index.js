require("dotenv").config();
const { connectProducer } = require('./services/kafka');
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios"); // Add axios for HTTP requests

consconnectProducer();
const prisma = new PrismaClient();
const port = process.env.PORT || 5004;

app.use(express.json());
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Middleware to authenticate and extract userId from JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Update to use roleName instead of role
    req.user = {
      userId: decoded.userId,
      roleName: decoded.roleName, // Use roleName from the JWT payload
      tenantId: decoded.tenantId,
    };

    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    res.status(403).json({ error: 'Invalid token' });
  }
};

const restrictToAdmin = (req, res, next) => {
  if (req.user?.roleName?.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const restrictToManagementRep = (req, res, next) => {
  if (req.user?.roleName?.toUpperCase() !== 'MR') {
    return res.status(403).json({ error: 'Management Representative access required' });
  }
  next();
};
app.post("/api/audit-programs", authenticateToken, restrictToManagementRep, async (req, res) => {
  const { name, auditProgramObjective, startDate, endDate, audits, tenantId, tenantName } = req.body;
  const { userId } = req.user;

  try {
    if (!Array.isArray(audits)) {
      return res.status(400).json({ error: "Audits must be an array" });
    }

    // Preprocess audits to map `specificAuditObjectives` to `specificAuditObjective`
    const sanitizedAudits = audits.map((audit) => ({
      id: audit.id,
      scope: audit.scope, // Already an array
      specificAuditObjective: audit.specificAuditObjectives, // Map plural to singular
      methods: audit.methods, // Already an array
      criteria: audit.criteria, // Already an array
    }));

    const auditProgram = await prisma.auditProgram.create({
      data: {
        id: `AP-${Date.now()}`,
        name,
        auditProgramObjective: auditProgramObjective || null,
        status: "Draft",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tenantId,
        tenantName,
        createdBy: userId,
        audits: {
          create: sanitizedAudits, // Use the sanitized audits
        },
      },
      include: { audits: true },
    });

    res.status(201).json(auditProgram);
  } catch (error) {
    console.error("Error creating audit program:", error.message, error.stack);
    res.status(500).json({ error: "Failed to create audit program" });
  }
});
// GET: Fetch All Audit Programs (Role-based filtering)
app.get("/api/audit-programs", authenticateToken, async (req, res) => {
  const { tenantId } = req.user;

  try {
    const programs = await prisma.auditProgram.findMany({
      where: { tenantId },
      include: { audits: true },
    });
    res.json(programs);
  } catch (error) {
    console.error("Error fetching audit programs:", error);
    res.status(500).json({ error: "Failed to fetch audit programs" });
  }
});

app.get("/api/audit-programs/admin", authenticateToken, restrictToAdmin, async (req, res) => {
  const { tenantId } = req.user;

  try {
    const programs = await prisma.auditProgram.findMany({
      where: {
        tenantId,
        status: { in: ["Pending Approval", "Scheduled", "Active", "Completed"] },
      },
      include: { audits: true },
    });
    res.json(programs);
  } catch (error) {
    console.error("Error fetching admin audit programs:", error);
    res.status(500).json({ error: "Failed to fetch audit programs for admin" });
  }
});

// POST: Accept Audit Invitation
app.post("/api/audits/:id/accept", authenticateToken, async (req, res) => {
  const { id: auditProgramId } = req.params; // Extract auditProgramId from the request params
  const { userId, role, tenantId } = req.user; // Extract user details from the JWT

  // Log the incoming request details
  console.log("Request received at /api/audits/:id/accept");
  console.log("Audit Program ID:", auditProgramId);
  console.log("User ID:", userId);
  console.log("Role:", role);
  console.log("Tenant ID:", tenantId);

  try {
    // Ensure only auditors can accept invitations
    if (role !== "AUDITOR") {
      return res.status(403).json({ error: "Access restricted to auditors" });
    }

    // Verify the auditor exists in the auth-service
    const authServiceUrl = `${process.env.AUTH_SERVICE_URL}/api/users/${userId}`;
    const { data: user } = await axios.get(authServiceUrl);

    if (!user || user.role !== "AUDITOR" || user.tenantId !== tenantId) {
      return res.status(400).json({ error: "Invalid auditor or unauthorized" });
    }

    const auditProgram = await prisma.auditProgram.findFirst({
      where: {
        id: auditProgramId, // Match the auditProgramId
        tenantId, // Ensure the tenant matches
      },
      include: {
        audits: true, // Include associated audits
      },
    });

    console.log("Audit Program Found:", auditProgram);

    if (!auditProgram) {
      return res.status(404).json({ error: "Audit program not found or unauthorized" });
    }

    // Ensure there is at least one audit under the program
    const audit = auditProgram.audits[0]; // Fetch the first audit
    if (!audit) {
      return res.status(404).json({ error: "No audits found under this program" });
    }

    // Use the correct auditId
    const auditId = audit.id;

    // Record the auditor's acceptance
    const acceptedAudit = await prisma.acceptedAudit.create({
      data: {
        auditId, // Use the correct auditId
        auditorId: userId,
        acceptedAt: new Date(),
      },
    });

    console.log("Accepted Audit Created:", acceptedAudit);

    res.status(201).json({
      message: "Invitation accepted successfully",
      acceptedAudit,
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "Auditor not found in auth-service" });
    }
    console.error("Error accepting audit invitation:", error.message);
    res.status(500).json({ error: "Failed to accept audit invitation" });
  }
});

// GET: Fetch Audit Program by ID
app.get("/api/audit-programs/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { tenantId, roleName } = req.user; // Correctly destructure roleName from req.user

  console.log("Fetching audit program by ID:", id); // Debug log
  console.log("User roleName:", roleName); // Debug log
  console.log("User tenantId:", tenantId); // Debug log

  try {
    const program = await prisma.auditProgram.findUnique({
      where: { id },
      include: { audits: true },
    });
    if (!program) {
      return res.status(404).json({ error: "Audit program not found" });
    }
    if (roleName !== "MR" && program.tenantId !== tenantId) {
      return res.status(403).json({ error: "Access denied to this audit program" });
    }
    res.json(program);
  } catch (error) {
    console.error("Error fetching audit program by ID:", error);
    res.status(500).json({ error: "Failed to fetch audit program" });
  }
});

// POST: Create Audit under Audit Program
app.post("/api/audit-programs/:id/audits", authenticateToken, restrictToManagementRep, async (req, res) => {
  const { id } = req.params;
  const { scope, specificAuditObjective, methods, criteria } = req.body;
  const { tenantId } = req.user;

  try {
    const program = await prisma.auditProgram.findUnique({ where: { id } });
    if (!program || program.tenantId !== tenantId) {
      return res.status(403).json({ error: "Invalid or unauthorized audit program" });
    }

    const audit = await prisma.audit.create({
      data: {
        id: `A-${Date.now()}`,
        auditProgramId: id,
        scope,
        specificAuditObjective, // Array
        methods, // Array
        criteria, // Array
      },
    });
    res.status(201).json(audit);
  } catch (error) {
    console.error("Error creating audit:", error);
    res.status(500).json({ error: "Failed to create audit" });
  }
});

// PUT: Submit Audit Program for Approval
app.put("/api/audit-programs/:id/submit", authenticateToken, restrictToManagementRep, async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  try {
    const program = await prisma.auditProgram.findUnique({ where: { id } });
    if (!program || program.tenantId !== tenantId) {
      return res.status(403).json({ error: "Unauthorized to submit this program" });
    }

    const auditProgram = await prisma.auditProgram.update({
      where: { id },
      data: { status: "Pending Approval" },
      include: { audits: true },
    });
    res.json(auditProgram);
  } catch (error) {
    console.error("Error submitting audit program:", error);
    res.status(500).json({ error: "Failed to submit audit program" });
  }
});

// PUT: Approve Audit Program (Admin Only)
app.put("/api/audit-programs/:id/approve", authenticateToken, restrictToAdmin, async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  try {
    const program = await prisma.auditProgram.findUnique({ where: { id } });
    if (!program || program.tenantId !== tenantId) {
      return res.status(403).json({ error: "Unauthorized to approve this program" });
    }

    const auditProgram = await prisma.auditProgram.update({
      where: { id },
      data: { status: "Active" },
      include: { audits: true },
    });
    res.json(auditProgram);
  } catch (error) {
    console.error("Error approving audit program:", error);
    res.status(500).json({ error: "Failed to approve audit program" });
  }
});
app.get("/api/audit-programs/auditor", authenticateToken, async (req, res) => {
  const { email, tenantId, role } = req.user; // Use email instead of userId

  try {
    // Ensure only auditors can access this endpoint
    if (role !== "AUDITOR") {
      return res.status(403).json({ error: "Access restricted to auditors" });
    }

    // Fetch audit programs where the auditor is part of the team
    const programs = await prisma.auditProgram.findMany({
      where: {
        tenantId,
        audits: {
          some: {
            OR: [
              { team: { path: ["leader"], equals: email } }, // Check if the auditor is the team leader
              { team: { path: ["members"], array_contains: email } }, // Check if the auditor is in the team members
            ],
          },
        },
      },
      include: {
        audits: true, // Include associated audits
      },
    });

    res.json(programs);
  } catch (error) {
    console.error("Error fetching audit programs for auditor:", error);
    res.status(500).json({ error: "Failed to fetch audit programs for auditor" });
  }
});

// PUT: Reject Audit Program (Admin Only)
app.put("/api/audit-programs/:id/reject", authenticateToken, restrictToAdmin, async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  try {
    const program = await prisma.auditProgram.findUnique({ where: { id } });
    if (!program || program.tenantId !== tenantId) {
      return res.status(403).json({ error: "Unauthorized to reject this program" });
    }

    const auditProgram = await prisma.auditProgram.update({
      where: { id },
      data: { status: "Draft" },
      include: { audits: true },
    });
    res.json(auditProgram);
  } catch (error) {
    console.error("Error rejecting audit program:", error);
    res.status(500).json({ error: "Failed to reject audit program" });
  }
});

// PUT: Update Audit Plan
app.put("/api/audits/:id/update", authenticateToken, async (req, res) => {
  const { id } = req.params; // Audit ID
  const { scope, specificAuditObjective, criteria, methods, team } = req.body; // Updated fields
  const { tenantId } = req.user; // Tenant ID from the authenticated user

  try {
    // Fetch the audit to ensure it exists and belongs to the tenant
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: { auditProgram: true },
    });

    if (!audit || audit.auditProgram.tenantId !== tenantId) {
      return res.status(403).json({ error: "Unauthorized to update this audit" });
    }

    // Update the audit with the provided fields
    const updatedAudit = await prisma.audit.update({
      where: { id },
      data: {
        scope,
        specificAuditObjective,
        criteria,
        methods,
        team, // Stored as JSON
      },
    });

    res.json(updatedAudit);
  } catch (error) {
    console.error("Error updating audit plan:", error);
    res.status(500).json({ error: "Failed to update audit plan" });
  }
});

// PUT: Update Audit Team Post-Approval
app.put("/api/audits/:id", authenticateToken, restrictToManagementRep, async (req, res) => {
  const { id } = req.params;
  const { team } = req.body; // JSON object
  const { tenantId } = req.user;

  try {
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: { auditProgram: true },
    });
    if (!audit || audit.auditProgram.tenantId !== tenantId) {
      return res.status(403).json({ error: "Unauthorized to update this audit" });
    }

    const updatedAudit = await prisma.audit.update({
      where: { id },
      data: { team }, // Stored as JSON
    });
    res.json(updatedAudit);
  } catch (error) {
    console.error("Error updating audit team:", error);
    res.status(500).json({ error: "Failed to update audit team" });
  }
});

// GET: Fetch Auditors for a Tenant
app.get("/api/auditors", authenticateToken, restrictToManagementRep, async (req, res) => {
  const { tenantId } = req.user;

  try {
    const auditors = await prisma.user.findMany({
      where: { tenantId, role: "AUDITOR" },
      select: { id: true, email: true, createdAt: true },
    });
    res.json(auditors);
  } catch (error) {
    console.error("Error fetching auditors:", error);
    res.status(500).json({ error: "Failed to fetch auditors" });
  }
});

app.listen(port, () => {
  console.log(`Audit service running on port ${port}`);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down audit service...");
  await prisma.$disconnect();
  process.exit(0);
});