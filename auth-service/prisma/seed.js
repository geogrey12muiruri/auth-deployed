const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding auth-service...');

  // Tenant 1: Nairobi University
  const tenant1 = await prisma.tenant.upsert({
    where: { domain: 'nairobiuni.ac.ke' },
    update: {},
    create: {
      name: 'The Nairobi University',
      domain: 'thenairobiuni.ac.ke',
      email: 'theadmin3@nairobiuni.ac.ke',
      type: 'UNIVERSITY', // Valid InstitutionType
      status: 'ACTIVE',
      createdBy: 'thesuperadmin1@nairobiuni.ac.ke',
      address: 'Nairobi, Kenya',
      phone: '+254 123 456 789',
    },
  });
  
  const users1 = [
    { email: 'thesuperadmin1@nairobiuni.ac.ke', role: 'SUPER_ADMIN', password: 'admin123', verified: true },
    { email: 'student@nairobiuni.ac.ke', role: 'TRAINEE', password: 'student123', verified: true },
    { email: 'lecturer@nairobiuni.ac.ke', role: 'TRAINER', password: 'lecturer123', verified: true },
    { email: 'hod1@nairobiuni.ac.ke', role: 'HOD', password: 'hod123', verified: true },
    { email: 'admin@nairobiuni.ac.ke', role: 'ADMIN', password: 'admin123', verified: true },
    { email: 'registrar@nairobiuni.ac.ke', role: 'REGISTRAR', password: 'registrar123', verified: true },
    { email: 'staff@nairobiuni.ac.ke', role: 'STAFF', password: 'staff123', verified: true },
    { email: 'auditorg@nairobiuni.ac.ke', role: 'MANAGEMENT_REP', password: 'auditor123', verified: true },
    { email: 'auditor@nairobiuni.ac.ke', role: 'AUDITOR', password: 'auditor123', verified: true },
    { email: 'hod2@nairobiuni.ac.ke', role: 'HOD', password: 'hod123', verified: true },
    { email: 'hod3@nairobiuni.ac.ke', role: 'HOD', password: 'hod123', verified: true },
  ];

  for (const user of users1) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: hashedPassword,
        role: user.role,
        verified: user.verified,
        tenantId: tenant1.id,
      },
    });
  }

  // Tenant 2: Kisumu College
  const tenant2 = await prisma.tenant.upsert({
    where: { domain: 'kisumucollege.ac.ke' },
    update: {},
    create: {
      name: 'Kisumu College',
      domain: 'kisumucollege.ac.ke',
      email: 'admin@kisumucollege.ac.ke',
      type: 'COLLEGE', // Valid InstitutionType
      status: 'PENDING',
      createdBy: 'superadmin@kisumucollege.ac.ke',
      address: 'Kisumu, Kenya',
      phone: '+254 987 654 321',
    },
  });

  const users2 = [
    { email: 'superadmin@kisumucollege.ac.ke', role: 'SUPER_ADMIN', password: 'admin123', verified: true },
    { email: 'student@kisumucollege.ac.ke', role: 'TRAINEE', password: 'student123', verified: true },
    { email: 'lecturer@kisumucollege.ac.ke', role: 'TRAINER', password: 'lecturer123', verified: true },
    { email: 'hod1@kisumucollege.ac.ke', role: 'HOD', password: 'hod123', verified: true },
    { email: 'admin@kisumucollege.ac.ke', role: 'ADMIN', password: 'admin123', verified: true },
    { email: 'registrar@kisumucollege.ac.ke', role: 'REGISTRAR', password: 'registrar123', verified: true },
    { email: 'staff@kisumucollege.ac.ke', role: 'STAFF', password: 'staff123', verified: true },
    { email: 'auditorg@kisumucollege.ac.ke', role: 'MANAGEMENT_REP', password: 'auditor123', verified: true },
    { email: 'auditor@kisumucollege.ac.ke', role: 'AUDITOR', password: 'auditor123', verified: true },
    { email: 'hod2@kisumucollege.ac.ke', role: 'HOD', password: 'hod123', verified: true },
  ];

  for (const user of users2) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: hashedPassword,
        role: user.role,
        verified: user.verified,
        tenantId: tenant2.id,
      },
    });
  }

  console.log('Auth-service seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });