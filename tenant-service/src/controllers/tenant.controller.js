const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt
  = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();
const { UserRole } = require('@prisma/client');

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
    users, // Admin user details are now inside the users array
  } = req.body;

  // Validate institution type
  const allowedTypes = ['UNIVERSITY', 'COLLEGE', 'SCHOOL', 'INSTITUTE', 'OTHER'];
  if (!allowedTypes.includes(type.toUpperCase())) {
    return res.status(400).json({ error: `Invalid type. Allowed values are: ${allowedTypes.join(', ')}` });
  }

  // Validate required fields
  if (!name || !domain || !email || !type || !users || users.length === 0) {
    return res.status(400).json({ error: 'Name, domain, email, type, and adminUser are required' });
  }

  // Extract the admin user from the users array
  const adminUser = users.find((user) => user.role === 'ADMIN');
  if (!adminUser) {
    return res.status(400).json({ error: 'Admin user details are required' });
  }

  const { email: adminEmail, firstName, lastName, password } = adminUser;
  if (!adminEmail || !firstName || !lastName || !password) {
    return res.status(400).json({ error: 'Admin user details (email, firstName, lastName, password) are required' });
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
        createdBy: req.user.userId, // Super Admin ID
      },
    });

    // Hash the admin user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user in the tenant-service database
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        firstName,
        lastName,
        password: hashedPassword,
        role: 'ADMIN', // Admin role
        tenantId: tenant.id, // Associate with the created tenant
        verified: true, // Mark as verified since it's created by the Super Admin
      },
    });

    // Register the admin user in the auth-service
    try {
      const authResponse = await axios.post(
        `${process.env.AUTH_SERVICE_URL || 'http://auth-service:5000'}/api/register`,
        {
          email: adminEmail,
          password,
          role: 'ADMIN',
          tenantId: tenant.id,
          tenantName: name,
          firstName,
          lastName,
        },
        { headers: { Authorization: req.headers.authorization } }
      );

      console.log('Admin user registered in auth-service:', authResponse.data);
    } catch (authError) {
      console.error('Failed to register admin user in auth-service:', authError.response?.data || authError.message);
      // Rollback: Delete the tenant and admin user if auth-service registration fails
      await prisma.user.delete({ where: { id: admin.id } }).catch(() => {});
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
      return res.status(500).json({ error: 'Failed to register admin user in auth-service' });
    }

    res.status(201).json({ tenant, admin });
  } catch (error) {
    console.error('Error creating tenant:', error);

    // Rollback: Delete the tenant if something goes wrong
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

const completeProfile = async (req, res) => {
  const { tenantId } = req.user;
  const { departments, roles } = req.body;

  if (!departments || !roles) {
    return res.status(400).json({ error: "Departments and roles are required" });
  }

  try {
    // Validate and create roles
    const createdRoles = await Promise.all(
      roles.map(async (role) => {
        if (!role.name) throw new Error("Role name is required");
        return prisma.role.create({
          data: {
            name: role.name,
            description: role.description,
            tenantId,
          },
        });
      })
    );

    // Validate and create departments
    const createdDepartments = await Promise.all(
      departments.map(async (department) => {
        if (!department.name || !department.code || !department.head) {
          throw new Error("Department name, code, and head details are required");
        }

        // Hash the department head's password
        const hashedPassword = await bcrypt.hash(department.head.password, 10);

        // Create the department head user
        const headUser = await prisma.user.create({
          data: {
            email: department.head.email,
            firstName: department.head.firstName,
            lastName: department.head.lastName,
            password: hashedPassword,
            roleId: null, // Department heads can have a custom role
            tenantId,
            verified: true,
          },
        });

        // Create the department
        return prisma.department.create({
          data: {
            name: department.name,
            code: department.code,
            tenantId,
            headId: headUser.id,
            createdBy: req.user.userId,
          },
        });
      })
    );

    res.status(201).json({ message: "Profile completed successfully", roles: createdRoles, departments: createdDepartments });
  } catch (error) {
    console.error("Error completing profile:", error);
    res.status(500).json({ error: `Failed to complete profile: ${error.message}` });
  }
};

module.exports = {
  createTenant: [authenticateToken, restrictToSuperAdmin, createTenant],
  getAllTenants, 
  getTenantById,
  deleteTenant: [authenticateToken, restrictToSuperAdmin, deleteTenant],
  createUser: [authenticateToken, createUser],
  getRoles,
  completeProfile: [authenticateToken, completeProfile],
};

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected');
  process.exit(0);
});