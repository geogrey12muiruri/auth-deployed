require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting and seeding auth-service database...');

  // Create roles for Dimension Plus
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Top-level admin', tenantId: 'dimensionplus.com' },
    { name: 'ADMIN', description: 'Admin role', tenantId: 'dimensionplus.com' },
  ];

  const createdRoles = {};
  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name_tenantId: { name: role.name, tenantId: role.tenantId } },
      update: {},
      create: role,
    });
    createdRoles[role.name] = createdRole;
  }

  console.log('Roles seeded successfully.');

  // Create the Super Admin user for Dimension Plus
  const superAdminUser = {
    email: 'superadmin@dimensionplus.com',
    role: 'SUPER_ADMIN',
    password: 'superadmin123',
    verified: true,
    tenantId: 'dimensionplus.com',
    tenantName: 'Dimension Plus',
  };

  const hashedPassword = await bcrypt.hash(superAdminUser.password, 10);

  const createdSuperAdmin = await prisma.user.upsert({
    where: { email: superAdminUser.email },
    update: {}, // Do not update existing user
    create: {
      email: superAdminUser.email,
      password: hashedPassword,
      role: { connect: { id: createdRoles[superAdminUser.role].id } },
      verified: superAdminUser.verified,
      tenantId: superAdminUser.tenantId,
      tenantName: superAdminUser.tenantName,
    },
  });

  console.log(`Super Admin created: ${createdSuperAdmin.email}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });