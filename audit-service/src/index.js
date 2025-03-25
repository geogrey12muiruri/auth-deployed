require("dotenv").config();

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios"); // Add axios for HTTP requests

const app = express();
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
// Middleware to authenticate and extract user info from JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role, tenantId: decoded.tenantId };
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    res.status(403).json({ error: "Invalid token" });
  }
};

// Middleware to restrict access to admins
const restrictToAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Middleware to restrict to Management Representative
const restrictToManagementRep = (req, res, next) => {
  if (req.user.role !== "MANAGEMENT_REP") {
    return res.status(403).json({ error: "Management Representative access required" });
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

// GET: Fetch Audit Programs for Admin
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

// GET: Fetch Audit Program by ID
app.get("/api/audit-programs/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { tenantId, role } = req.user;

  try {
    const program = await prisma.auditProgram.findUnique({
      where: { id },
      include: { audits: true },
    });
    if (!program) {
      return res.status(404).json({ error: "Audit program not found" });
    }
    if (role !== "MANAGEMENT_REP" && program.tenantId !== tenantId) {
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