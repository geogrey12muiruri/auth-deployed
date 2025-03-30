const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding for tenant-service...');

  // Create the Dimension Plus tenant
  let dimensionplusTenant = await prisma.tenant.findUnique({
    where: { domain: 'dimensionplus.com' },
  });

  if (!dimensionplusTenant) {
    dimensionplusTenant = await prisma.tenant.create({
      data: {
        name: 'Dimension Plus',
        domain: 'dimensionplus.com',
        email: 'info@dimensionplus.com',
        type: 'OTHER', // Use a valid value from the InstitutionType enum
        status: 'ACTIVE',
        createdBy: 'superadmin@dimensionplus.com',
        address: 'Nairobi, Kenya',
        phone: '+254 700 000 000',
        timezone: 'Africa/Nairobi',
        currency: 'KES',
        establishedYear: 2020,
      },
    });
    console.log('Tenant created:', dimensionplusTenant);
  } else {
    console.log('Tenant already exists:', dimensionplusTenant);
  }

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