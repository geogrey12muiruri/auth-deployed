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

// Middleware to restrict access to Super Admin
const restrictToSuperAdmin = (req, res, next) => {
  if (req.user?.roleName?.toUpperCase() !== 'SUPER_ADMIN') {
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
    adminUser, // Admin user details
  } = req.body;

  // Validate institution type
  const allowedTypes = ['UNIVERSITY', 'COLLEGE', 'SCHOOL', 'INSTITUTE', 'OTHER'];
  if (!allowedTypes.includes(type.toUpperCase())) {
    return res.status(400).json({ error: `Invalid type. Allowed values are: ${allowedTypes.join(', ')}` });
  }

  // Validate required fields
  if (!name || !domain || !email || !type || !adminUser) {
    return res.status(400).json({ error: 'Name, domain, email, type, and adminUser are required' });
  }

  const { email: adminEmail, firstName, lastName, password } = adminUser;
  if (!adminEmail || !firstName || !lastName || !password) {
    return res.status(400).json({ error: 'Admin user details (email, firstName, lastName, password) are required' });
  }

  let tenant;
  let roleId;
  try {
    console.log('Starting tenant creation process...');

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
    console.log('Tenant created successfully:', tenant);

    // Dynamically create the ADMIN role for the tenant
    const adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrator role for the tenant',
        tenantId: tenant.id, // Associate the role with the tenant
      },
    });
    roleId = adminRole.id; // Fetch the roleId
    console.log('Admin role created successfully:', adminRole);

    // Synchronize the role with the auth-service
    try {
      const roleSyncResponse = await axios.post(
        `${process.env.AUTH_SERVICE_URL || 'http://auth-service:5000'}/api/roles`,
        {
          id: roleId,
          name: 'ADMIN',
          description: 'Administrator role for the tenant',
          tenantId: tenant.id,
        },
        { headers: { Authorization: req.headers.authorization } }
      );
      console.log('Role synchronized with auth-service:', roleSyncResponse.data);
    } catch (roleSyncError) {
      console.error('Failed to synchronize role with auth-service:', roleSyncError.response?.data || roleSyncError.message);
      throw new Error('Failed to synchronize role with auth-service');
    }

    // Hash the admin user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user in the tenant-service database
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        firstName,
        lastName,
        password: hashedPassword,
        userRole: 'ADMIN', // Use userRole from the adminUser payload
        roleId, // Assign the ADMIN role ID
        tenantId: tenant.id, // Associate with the created tenant
        verified: true, // Mark as verified since it's created by the Super Admin
      },
    });
    console.log('Admin user created successfully in tenant-service database:', admin);
    console.log('Role ID being sent to auth-service during registration:', roleId);
    // Register the admin user in the auth-service
    try {
      const authResponse = await axios.post(
        `${process.env.AUTH_SERVICE_URL || 'http://auth-service:5000'}/api/register`,
        {
          email: adminEmail,
          password,
          roleId, // Include roleId
          tenantId: tenant.id, // Include tenantId
          tenantName: name, // Include tenantName
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
    console.error('Error during tenant creation:', error);

    // Rollback: Delete the tenant if something goes wrong
    if (tenant) {
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
    }

    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};
const createDepartment = async (req, res) => {
  const { tenantId } = req.params;
  const { name, code, head } = req.body;

  console.log('Starting department creation process...');
  console.log('Request body:', req.body);

  // Validate input
  if (!name || !code || !head || !head.email || !head.firstName || !head.lastName || !head.password) {
    return res.status(400).json({ error: 'Department name, code, and head details are required.' });
  }

  let department; // Define the department variable for rollback
  try {
    // Check if the tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }
    console.log('Tenant found:', tenant);

    // Check if the department code or name already exists for the tenant
    const existingDepartment = await prisma.department.findFirst({
      where: {
        tenantId,
        OR: [{ name }, { code }],
      },
    });
    if (existingDepartment) {
      return res.status(400).json({ error: 'Department name or code already exists for this tenant.' });
    }

    // Create the department in the tenant-service database
    department = await prisma.department.create({
      data: {
        name,
        code,
        tenantId,
        createdBy: req.user.userId, // Admin ID from the request
      },
    });
    console.log('Department created successfully:', department);

    // Fetch or create the HOD role in tenant-service
    let hodRole = await prisma.role.findFirst({ where: { name: 'HOD', tenantId } });
    if (!hodRole) {
      hodRole = await prisma.role.create({
        data: {
          name: 'HOD',
          description: 'Head of Department',
          tenantId,
        },
      });
      console.log('HOD role created:', hodRole);
      // Optionally sync the role with auth-service
      try {
        await axios.post(
          `${process.env.AUTH_SERVICE_URL || 'http://auth-service:5000'}/api/roles`,
          {
            id: hodRole.id,
            name: 'HOD',
            description: 'Head of Department',
            tenantId,
          },
          { headers: { Authorization: req.headers.authorization } }
        );
        console.log('HOD role synced with auth-service');
      } catch (syncError) {
        console.error('Failed to sync HOD role with auth-service:', syncError.response?.data || syncError.message);
        // Optionally handle this failure (e.g., rollback or proceed)
      }
    }

    // Register the HOD in the auth-service
    let hodUserId;
    try {
      const authResponse = await axios.post(
        `${process.env.AUTH_SERVICE_URL || 'http://auth-service:5000'}/api/register`,
        {
          email: head.email,
          password: head.password,
          roleId: hodRole.id, // Use the dynamically fetched/created role ID
          tenantId,
          tenantName: tenant.name,
          firstName: head.firstName,
          lastName: head.lastName,
        },
        { headers: { Authorization: req.headers.authorization } }
      );
      console.log('HOD registered in auth-service:', authResponse.data);

      if (!authResponse.data?.user?.id) {
        throw new Error('Invalid response from auth-service: Missing user ID');
      }
      hodUserId = authResponse.data.user.id;
    } catch (authError) {
      console.error('Error during HOD registration:', authError.response?.data || authError.message);
      // Rollback: Delete the department if HOD registration fails
      await prisma.department.delete({ where: { id: department.id } }).catch((rollbackError) => {
        console.error('Rollback failed:', rollbackError);
      });
      return res.status(500).json({ error: 'Failed to register HOD in auth-service.' });
    }

    // Create the HOD user in the tenant-service database
    const hodUser = await prisma.user.create({
      data: {
        id: hodUserId, // Use the ID from auth-service
        email: head.email,
        firstName: head.firstName,
        lastName: head.lastName,
        password: await bcrypt.hash(head.password, 10), // Hash locally as a fallback
        roleId: hodRole.id, // Use the same role ID
        tenantId,
        verified: false, // HOD needs to verify their email
        userRole: 'HOD', // Fix: Add the userRole field
      },
    });
    console.log('HOD user created in tenant-service:', hodUser);

    // Link the HOD to the department
    const updatedDepartment = await prisma.department.update({
      where: { id: department.id },
      data: { headId: hodUserId },
      include: { head: true }, // Include the head (HOD) details in the response
    });
    console.log('HOD linked to department:', updatedDepartment);

    res.status(201).json({ message: 'Department created successfully.', department: updatedDepartment });
  } catch (error) {
    console.error('Error during department creation:', error);
    // Rollback: Delete the department if it was created
    if (department) {
      await prisma.department.delete({ where: { id: department.id } }).catch((rollbackError) => {
        console.error('Rollback failed:', rollbackError);
      });
    }
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Get all tenants

const createRole = async (req, res) => {
  const { tenantId } = req.params;
  const { name, description } = req.body;

  console.log('Starting role creation process...');
  console.log('Request body:', req.body);

  // Validate input
  if (!name) {
    return res.status(400).json({ error: 'Role name is required.' });
  }

  try {
    // Check if the tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }
    console.log('Tenant found:', tenant);

    // Check if the role already exists for the tenant
    const existingRole = await prisma.role.findFirst({
      where: { name, tenantId },
    });
    if (existingRole) {
      return res.status(400).json({ error: 'Role name already exists for this tenant.' });
    }

    // Create the role in the tenant-service database
    const role = await prisma.role.create({
      data: {
        name,
        description,
        tenantId,
      },
    });
    console.log('Role created successfully in tenant-service:', role);

    // Synchronize the role with the auth-service
    try {
      const roleSyncResponse = await axios.post(
        `${process.env.AUTH_SERVICE_URL || 'http://auth-service:5000'}/api/roles`,
        {
          id: role.id,
          name: role.name,
          description: role.description,
          tenantId,
        },
        { headers: { Authorization: req.headers.authorization } }
      );
      console.log('Role synchronized with auth-service:', roleSyncResponse.data);
    } catch (roleSyncError) {
      console.error('Failed to synchronize role with auth-service:', roleSyncError.response?.data || roleSyncError.message);
      // Optionally rollback the role creation in tenant-service
      await prisma.role.delete({ where: { id: role.id } }).catch(() => {});
      return res.status(500).json({ error: 'Failed to synchronize role with auth-service.' });
    }

    res.status(201).json({ message: 'Role created successfully.', role });
  } catch (error) {
    console.error('Error during role creation:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
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
  const { tenantId } = req.user; // Tenant ID from the logged-in admin
  const { email, roleId, firstName, lastName, password, departmentId } = req.body;

  // Validate input
  if (!email || !roleId || !firstName || !lastName || !password) {
    return res.status(400).json({ error: 'Email, roleId, firstName, lastName, and password are required' });
  }

  try {
    // Check if the tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    // Check if the role exists and belongs to the tenant
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role || role.tenantId !== tenantId) {
      return res.status(400).json({ error: 'Invalid role or role does not belong to the tenant' });
    }

    // Check if the department exists and belongs to the tenant (if provided)
    if (departmentId) {
      const department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department || department.tenantId !== tenantId) {
        return res.status(400).json({ error: 'Invalid department or department does not belong to the tenant' });
      }
    }

    // Register the user in the auth-service
    let authUserId;
    try {
      const authResponse = await axios.post(
        `${process.env.AUTH_SERVICE_URL || 'http://auth-service:5000'}/api/register`,
        {
          email,
          password,
          roleId, // Include roleId
          tenantId,
          tenantName: tenant.name,
          firstName,
          lastName,
        },
        { headers: { Authorization: req.headers.authorization } }
      );
      console.log('User registered in auth-service:', authResponse.data);

      if (!authResponse.data?.user?.id) {
        throw new Error('Invalid response from auth-service: Missing user ID');
      }
      authUserId = authResponse.data.user.id;
    } catch (authError) {
      console.error('Error during user registration in auth-service:', authError.response?.data || authError.message);
      return res.status(500).json({ error: 'Failed to register user in auth-service' });
    }

    // Create the user in the tenant-service database
    const user = await prisma.user.create({
      data: {
        id: authUserId, // Use the ID from auth-service
        email,
        firstName,
        lastName,
        password: await bcrypt.hash(password, 10), // Hash locally as a fallback
        roleId, // Assign the selected role
        tenantId,
        departmentId, // Link to the department (optional)
        verified: false, // User needs to verify their email
      },
    });
    console.log('User created in tenant-service:', user);

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
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
const getTenantDetails = async (req, res) => {
  const { tenantId } = req.params;

  try {
    // Fetch the tenant with related departments and roles
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        departments: {
          include: {
            head: true, // Include the head of each department
          },
        },
        roles: true, // Include all roles for the tenant
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found." });
    }

    res.status(200).json(tenant);
  } catch (error) {
    console.error("Error fetching tenant details:", error);
    res.status(500).json({ error: "Failed to fetch tenant details." });
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
  createRole,
  getTenantDetails,
  completeProfile: [authenticateToken, completeProfile],
  createDepartment, // Correctly reference the function
};

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected');
  process.exit(0);
});