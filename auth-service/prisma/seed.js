require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting and seeding auth-service database...');

  const users = [
    { email: 'thesuperadmin1@nairobiuni.ac.ke', role: 'SUPER_ADMIN', password: 'admin123', verified: true, tenantId: 'nairobiuni.ac.ke', tenantName: 'Nairobi University' },
    { email: 'student@nairobiuni.ac.ke', role: 'TRAINEE', password: 'student123', verified: true, tenantId: 'nairobiuni.ac.ke', tenantName: 'Nairobi University' },
    { email: 'lecturer@nairobiuni.ac.ke', role: 'TRAINER', password: 'lecturer123', verified: true, tenantId: 'nairobiuni.ac.ke', tenantName: 'Nairobi University' },
    { email: 'hod1@nairobiuni.ac.ke', role: 'HOD', password: 'hod123', verified: true, tenantId: 'nairobiuni.ac.ke', tenantName: 'Nairobi University' },
    { email: 'admin@nairobiuni.ac.ke', role: 'ADMIN', password: 'admin123', verified: true, tenantId: 'nairobiuni.ac.ke', tenantName: 'Nairobi University' },
    { email: 'registrar@nairobiuni.ac.ke', role: 'REGISTRAR', password: 'registrar123', verified: true, tenantId: 'nairobiuni.ac.ke', tenantName: 'Nairobi University' },
    { email: 'staff@nairobiuni.ac.ke', role: 'STAFF', password: 'staff123', verified: true, tenantId: 'nairobiuni.ac.ke', tenantName: 'Nairobi University' },
    { email: 'auditorg@nairobiuni.ac.ke', role: 'MANAGEMENT_REP', password: 'auditor123', verified: true, tenantId: 'nairobiuni.ac.ke', tenantName: 'Nairobi University' },
    { email: 'auditor@nairobiuni.ac.ke', role: 'AUDITOR', password: 'auditor123', verified: true, tenantId: 'nairobiuni.ac.ke', tenantName: 'Nairobi University' },
    { email: 'hod2@nairobiuni.ac.ke', role: 'HOD', password: 'hod123', verified: true, tenantId: 'nairobiuni.ac.ke', tenantName: 'Nairobi University' },
  ];

  const roleModelMap = {
    AUDITOR: 'Auditor',
    MANAGEMENT_REP: 'ManagementRep',
    TRAINEE: 'Trainee',
    TRAINER: 'Trainer',
    HOD: 'HOD',
    ADMIN: 'Admin',
    REGISTRAR: 'Registrar',
    STAFF: 'Staff',
    SUPER_ADMIN: 'SuperAdmin',
  };

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Upsert the user
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {}, // Do not update existing users
      create: {
        email: user.email,
        password: hashedPassword,
        role: user.role,
        verified: user.verified,
        tenantId: user.tenantId,
        tenantName: user.tenantName,
      },
    });

    // Map role to Prisma model
    const roleModel = roleModelMap[user.role];
    if (!roleModel || !prisma[roleModel]) {
      console.error(`Prisma model for role ${user.role} (${roleModel}) is undefined.`);
      continue; // Skip this user
    }

    // Debugging logs
    console.log(`Processing user with role: ${user.role}`);
    console.log(`Mapped to Prisma model: ${roleModel}`);

    // Upsert role-specific record
    await prisma[roleModel].upsert({
      where: { userId: createdUser.id },
      update: {}, // Do not update existing role-specific records
      create: {
        userId: createdUser.id,
        tenantId: user.tenantId,
        tenantName: user.tenantName,
      },
    });
  }

  console.log('Auth-service database reset and seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });