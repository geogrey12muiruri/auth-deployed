const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Middleware to authenticate and extract userId from JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role, tenantId: decoded.tenantId };
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to restrict access to Super Admin
const restrictToSuperAdmin = (req, res, next) => {
  if (req.user?.role?.toUpperCase() !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }
  next();
};

// Updated required roles reflecting the new enum
const REQUIRED_ROLES = [
  'TRAINEE',
  'TRAINER',
  'HOD',
  'ADMIN',
  'REGISTRAR',
  'STAFF',
  'SUPER_ADMIN',
  'MANAGEMENT_REP',
  'AUDITOR',
];

const createTenant = async (req, res) => {
  const {
    name,
    domain,
    logoUrl,
    address,
    city,
    state,
    country,
    phone,
    email,
    type,
    accreditationNumber,
    establishedYear,
    timezone,
    currency,
    status,
    users,
    departments,
  } = req.body;

  const allowedTypes = ['UNIVERSITY', 'COLLEGE', 'SCHOOL', 'INSTITUTE', 'OTHER'];
  if (!allowedTypes.includes(type.toUpperCase())) {
    return res.status(400).json({ error: `Invalid type. Allowed values are: ${allowedTypes.join(', ')}` });
  }

  if (!name || !domain || !email || !type || !users || !departments || departments.length === 0) {
    return res.status(400).json({ error: 'Name, domain, email, type, users, and at least one department are required' });
  }

  const providedRoles = users.map((u) => u.role.toUpperCase());
  const missingRoles = REQUIRED_ROLES.filter((role) => !providedRoles.includes(role));
  if (missingRoles.length > 0) {
    return res.status(400).json({ error: `Missing users for roles: ${missingRoles.join(', ')}` });
  }

  const userEmails = users.map((u) => u.email);
  if (new Set(userEmails).size !== userEmails.length) {
    return res.status(400).json({ error: 'Duplicate emails provided in users' });
  }

  const hodEmails = departments.map((d) => d.hodEmail);
  const hodUsers = users.filter((u) => u.role.toUpperCase() === 'HOD');
  const invalidHods = hodEmails.filter((email) => !hodUsers.some((u) => u.email === email));
  if (invalidHods.length > 0) {
    return res.status(400).json({ error: `Invalid HOD emails: ${invalidHods.join(', ')}` });
  }

  const deptNames = departments.map((d) => d.name);
  if (new Set(deptNames).size !== deptNames.length) {
    return res.status(400).json({ error: 'Duplicate department names provided' });
  }

  let tenant;
  try {
    // Create the tenant in the database
    tenant = await prisma.tenant.create({
      data: {
        name,
        domain,
        logoUrl,
        address,
        city,
        state,
        country,
        phone,
        email,
        type: type.toUpperCase(),
        accreditationNumber,
        establishedYear: parseInt(establishedYear, 10),
        timezone,
        currency,
        status: status || 'PENDING',
        createdBy: req.user.userId,
      },
    });

    // Associate users with the tenant in the tenant-service database
    const createdUsers = [];
    for (const userData of users) {
      const { email, role, firstName, lastName } = userData;

      // Create the user in the tenant-service database
      const user = await prisma.user.create({
        data: {
          email,
          role: role.toUpperCase(),
          firstName,
          lastName,
          tenantId: tenant.id,
        },
      });

      createdUsers.push(user);
    }

    // Create departments and associate them with the tenant
    const createdDepartments = [];
    for (const deptData of departments) {
      const { name, code, hodEmail } = deptData;

      // Find the HOD in the created users
      const hod = createdUsers.find((u) => u.email === hodEmail && u.role.toUpperCase() === 'HOD');
      if (!hod) {
        throw new Error(`HOD ${hodEmail} not found or does not have the HOD role`);
      }

      // Create the department in the database
      const department = await prisma.department.create({
        data: {
          name,
          code,
          tenantId: tenant.id,
          headId: hod.id, // Associate the HOD with the department
        },
      });

      createdDepartments.push(department);
    }

    res.status(201).json({ tenant, users: createdUsers, departments: createdDepartments });
  } catch (error) {
    console.error('Error creating tenant:', error);
    if (tenant) {
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
    }
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};
// Get all tenants
const getAllTenants = async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: { users: true, departments: { include: { head: true } } },
    });
    res.status(200).json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

// Delete tenant
const deleteTenant = async (req, res) => {
  const { tenantId } = req.params;

  try {
    const tenant = await prisma.tenant.delete({
      where: { id: tenantId },
    });
    res.status(200).json({ message: 'Tenant deleted successfully', tenant });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
};

// Create user
const createUser = async (req, res) => {
  const { tenantId } = req.params;
  const { email, role, firstName, lastName, password } = req.body;

  if (!email || !role || !firstName || !lastName || !password) {
    return res.status(400).json({ error: 'Email, role, firstName, lastName, and password are required' });
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const authResponse = await axios.post(
      `${process.env.AUTH_SERVICE_URL || 'http://auth-service:5000'}/api/auth/register`,
      { email, password, role, tenantId, firstName, lastName },
      { headers: { Authorization: req.headers.authorization } }
    );

    const user = { email, role, firstName, lastName, tenantId };
    res.status(201).json({ user });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data.message || 'Auth service error' });
    }
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// tenant-service/src/controllers/tenant.controller.js
const getTenantById = async (req, res) => {
  const { tenantId } = req.params;

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    res.status(200).json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = Object.keys(prisma.enums.UserRole); // Fetch roles from Prisma schema
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

module.exports = {
  createTenant: [authenticateToken, restrictToSuperAdmin, createTenant],
  getAllTenants, 
  getTenantById,
  deleteTenant: [authenticateToken, restrictToSuperAdmin, deleteTenant],
  createUser: [authenticateToken, createUser],
  getRoles,
};

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected');
  process.exit(0);
});