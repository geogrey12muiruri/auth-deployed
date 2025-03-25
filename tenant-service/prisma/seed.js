const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding for tenant-service...');

  // Tenant 1: Nairobi University
  let tenant1 = await prisma.tenant.findUnique({
    where: { domain: 'thenairobiuni.ac.ke' },
  });

  if (!tenant1) {
    tenant1 = await prisma.tenant.create({
      data: {
        name: 'The Nairobi University',
        domain: 'thenairobiuni.ac.ke',
        email: 'theadmin3@nairobiuni.ac.ke',
        type: 'UNIVERSITY',
        status: 'ACTIVE',
        createdBy: 'thesuperadmin1@nairobiuni.ac.ke',
        address: 'Nairobi, Kenya',
        phone: '+254 123 456 789',
      },
    });
  } else {
    console.log('Tenant already exists:', tenant1);
  }

  await prisma.user.createMany({
    data: [
      { email: 'thesuperadmin1@nairobiuni.ac.ke', role: 'SUPER_ADMIN', firstName: 'John', lastName: 'Admin', verified: true, tenantId: tenant1.id },
      { email: 'trainee@nairobiuni.ac.ke', role: 'TRAINEE', firstName: 'Alice', lastName: 'Mwangi', verified: true, tenantId: tenant1.id },
      { email: 'trainer@nairobiuni.ac.ke', role: 'TRAINER', firstName: 'Peter', lastName: 'Kimani', verified: true, tenantId: tenant1.id },
      { email: 'hod1@nairobiuni.ac.ke', role: 'HOD', firstName: 'Mary', lastName: 'Wambui', verified: true, tenantId: tenant1.id },
      { email: 'admin@nairobiuni.ac.ke', role: 'ADMIN', firstName: 'James', lastName: 'Otieno', verified: true, tenantId: tenant1.id },
      { email: 'registrar@nairobiuni.ac.ke', role: 'REGISTRAR', firstName: 'Susan', lastName: 'Njeri', verified: true, tenantId: tenant1.id },
      { email: 'staff@nairobiuni.ac.ke', role: 'STAFF', firstName: 'David', lastName: 'Kamau', verified: true, tenantId: tenant1.id },
      { email: 'mgmtrep@nairobiuni.ac.ke', role: 'MANAGEMENT_REP', firstName: 'Grace', lastName: 'Mumbi', verified: true, tenantId: tenant1.id },
      { email: 'auditor@nairobiuni.ac.ke', role: 'AUDITOR', firstName: 'Paul', lastName: 'Kiptoo', verified: true, tenantId: tenant1.id },
      { email: 'hod2@nairobiuni.ac.ke', role: 'HOD', firstName: 'Esther', lastName: 'Njoroge', verified: true, tenantId: tenant1.id },
      { email: 'hod3@nairobiuni.ac.ke', role: 'HOD', firstName: 'Michael', lastName: 'Ochieng', verified: true, tenantId: tenant1.id },
    ],
    skipDuplicates: true, // Avoid duplicate user creation
  });

  const hod1 = await prisma.user.findUnique({ where: { email: 'hod1@nairobiuni.ac.ke' } });
  const hod2 = await prisma.user.findUnique({ where: { email: 'hod2@nairobiuni.ac.ke' } });
  const hod3 = await prisma.user.findUnique({ where: { email: 'hod3@nairobiuni.ac.ke' } });

  await prisma.department.createMany({
    data: [
      { name: 'Computer Science', code: 'CS', tenantId: tenant1.id, headId: hod1?.id },
      { name: 'Mathematics', code: 'MATH', tenantId: tenant1.id, headId: hod2?.id },
      { name: 'Physics', code: 'PHYS', tenantId: tenant1.id, headId: hod3?.id },
    ],
    skipDuplicates: true, // Avoid duplicate department creation
  });

  const csDept = await prisma.department.findFirst({ where: { name: 'Computer Science', tenantId: tenant1.id } });
  await prisma.user.updateMany({
    where: { email: { in: ['trainee@nairobiuni.ac.ke', 'trainer@nairobiuni.ac.ke'] } },
    data: { departmentId: csDept?.id },
  });

  // Tenant 2: Kisumu College
  let tenant2 = await prisma.tenant.findUnique({
    where: { domain: 'kisumucollege.ac.ke' },
  });

  if (!tenant2) {
    tenant2 = await prisma.tenant.create({
      data: {
        name: 'Kisumu College',
        domain: 'kisumucollege.ac.ke',
        email: 'admin@kisumucollege.ac.ke',
        type: 'COLLEGE',
        status: 'PENDING',
        createdBy: 'superadmin@kisumucollege.ac.ke',
        address: 'Kisumu, Kenya',
        phone: '+254 987 654 321',
      },
    });
  } else {
    console.log('Tenant already exists:', tenant2);
  }

  await prisma.user.createMany({
    data: [
      { email: 'superadmin@kisumucollege.ac.ke', role: 'SUPER_ADMIN', firstName: 'Linda', lastName: 'Achieng', verified: true, tenantId: tenant2.id },
      { email: 'trainee@kisumucollege.ac.ke', role: 'TRAINEE', firstName: 'Brian', lastName: 'Omondi', verified: true, tenantId: tenant2.id },
      { email: 'trainer@kisumucollege.ac.ke', role: 'TRAINER', firstName: 'Jane', lastName: 'Atieno', verified: true, tenantId: tenant2.id },
      { email: 'hod1@kisumucollege.ac.ke', role: 'HOD', firstName: 'Tom', lastName: 'Okoth', verified: true, tenantId: tenant2.id },
      { email: 'admin@kisumucollege.ac.ke', role: 'ADMIN', firstName: 'Ruth', lastName: 'Akinyi', verified: true, tenantId: tenant2.id },
      { email: 'registrar@kisumucollege.ac.ke', role: 'REGISTRAR', firstName: 'Mark', lastName: 'Odhiambo', verified: true, tenantId: tenant2.id },
      { email: 'staff@kisumucollege.ac.ke', role: 'STAFF', firstName: 'Faith', lastName: 'Anyango', verified: true, tenantId: tenant2.id },
      { email: 'mgmtrep@kisumucollege.ac.ke', role: 'MANAGEMENT_REP', firstName: 'Chris', lastName: 'Owino', verified: true, tenantId: tenant2.id },
      { email: 'auditor@kisumucollege.ac.ke', role: 'AUDITOR', firstName: 'Nancy', lastName: 'Adhiambo', verified: true, tenantId: tenant2.id },
      { email: 'hod2@kisumucollege.ac.ke', role: 'HOD', firstName: 'Daniel', lastName: 'Ogutu', verified: true, tenantId: tenant2.id },
    ],
    skipDuplicates: true,
  });

  const hod1Kc = await prisma.user.findUnique({ where: { email: 'hod1@kisumucollege.ac.ke' } });
  const hod2Kc = await prisma.user.findUnique({ where: { email: 'hod2@kisumucollege.ac.ke' } });

  await prisma.department.createMany({
    data: [
      { name: 'Business', code: 'BUS', tenantId: tenant2.id, headId: hod1Kc?.id },
      { name: 'Education', code: 'EDU', tenantId: tenant2.id, headId: hod2Kc?.id },
    ],
    skipDuplicates: true,
  });

  const busDept = await prisma.department.findFirst({ where: { name: 'Business', tenantId: tenant2.id } });
  await prisma.user.updateMany({
    where: { email: { in: ['trainee@kisumucollege.ac.ke', 'trainer@kisumucollege.ac.ke'] } },
    data: { departmentId: busDept?.id },
  });

  console.log('Seeding completed successfully for tenant-service!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });