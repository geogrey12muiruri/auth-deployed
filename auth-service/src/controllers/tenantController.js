const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fetch all tenants
exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany();
    res.status(200).json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch a tenant by ID
exports.getTenantById = async (req, res) => {
  const { tenantId } = req.params;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.status(200).json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};