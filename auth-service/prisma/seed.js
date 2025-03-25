require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

console.log('DATABASE_URL:', process.env.DATABASE_URL); // Debugging: Print DATABASE_URL

async function main() {
  console.log('Seeding auth-service...');

  const users = [
    // Users for Tenant 1: Nairobi University
    { email: 'thesuperadmin1@nairobiuni.ac.ke', role: 'SUPER_ADMIN', password: 'admin123', verified: true, tenantId: 'nairobiuni.ac.ke' },
    { email: 'student@nairobiuni.ac.ke', role: 'TRAINEE', password: 'student123', verified: true, tenantId: 'nairobiuni.ac.ke' },
    { email: 'lecturer@nairobiuni.ac.ke', role: 'TRAINER', password: 'lecturer123', verified: true, tenantId: 'nairobiuni.ac.ke' },
    { email: 'hod1@nairobiuni.ac.ke', role: 'HOD', password: 'hod123', verified: true, tenantId: 'nairobiuni.ac.ke' },
    { email: 'admin@nairobiuni.ac.ke', role: 'ADMIN', password: 'admin123', verified: true, tenantId: 'nairobiuni.ac.ke' },
    { email: 'registrar@nairobiuni.ac.ke', role: 'REGISTRAR', password: 'registrar123', verified: true, tenantId: 'nairobiuni.ac.ke' },
    { email: 'staff@nairobiuni.ac.ke', role: 'STAFF', password: 'staff123', verified: true, tenantId: 'nairobiuni.ac.ke' },
    { email: 'auditorg@nairobiuni.ac.ke', role: 'MANAGEMENT_REP', password: 'auditor123', verified: true, tenantId: 'nairobiuni.ac.ke' },
    { email: 'auditor@nairobiuni.ac.ke', role: 'AUDITOR', password: 'auditor123', verified: true, tenantId: 'nairobiuni.ac.ke' },
    { email: 'hod2@nairobiuni.ac.ke', role: 'HOD', password: 'hod123', verified: true, tenantId: 'nairobiuni.ac.ke' },

    // Users for Tenant 2: Kisumu College
    { email: 'superadmin@kisumucollege.ac.ke', role: 'SUPER_ADMIN', password: 'admin123', verified: true, tenantId: 'kisumucollege.ac.ke' },
    { email: 'student@kisumucollege.ac.ke', role: 'TRAINEE', password: 'student123', verified: true, tenantId: 'kisumucollege.ac.ke' },
    { email: 'lecturer@kisumucollege.ac.ke', role: 'TRAINER', password: 'lecturer123', verified: true, tenantId: 'kisumucollege.ac.ke' },
    { email: 'hod1@kisumucollege.ac.ke', role: 'HOD', password: 'hod123', verified: true, tenantId: 'kisumucollege.ac.ke' },
    { email: 'admin@kisumucollege.ac.ke', role: 'ADMIN', password: 'admin123', verified: true, tenantId: 'kisumucollege.ac.ke' },
    { email: 'registrar@kisumucollege.ac.ke', role: 'REGISTRAR', password: 'registrar123', verified: true, tenantId: 'kisumucollege.ac.ke' },
    { email: 'staff@kisumucollege.ac.ke', role: 'STAFF', password: 'staff123', verified: true, tenantId: 'kisumucollege.ac.ke' },
    { email: 'auditorg@kisumucollege.ac.ke', role: 'MANAGEMENT_REP', password: 'auditor123', verified: true, tenantId: 'kisumucollege.ac.ke' },
    { email: 'auditor@kisumucollege.ac.ke', role: 'AUDITOR', password: 'auditor123', verified: true, tenantId: 'kisumucollege.ac.ke' },
    { email: 'hod2@kisumucollege.ac.ke', role: 'HOD', password: 'hod123', verified: true, tenantId: 'kisumucollege.ac.ke' },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: hashedPassword,
        role: user.role,
        verified: user.verified,
        tenantId: user.tenantId,
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