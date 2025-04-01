const express = require('express');
const { PrismaClient } = require('@prisma/client');
const routes = require('./routes');
const cors = require('cors'); // Import the CORS middleware
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Allow requests from the frontend
app.use(express.json());
app.use('/api', routes); // Ensure the routes are prefixed with /api

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Tenant Service is running' });
});

// get roles for a tenant
app.get("/api/tenants/:id/roles", async (req, res) => {
  const { id } = req.params;

  try {
    const roles = await prisma.role.findMany({
      where: { tenantId: id },
    });
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error.message);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

// get users for a tenant
app.get("/api/tenants/:id/users", async (req, res) => {
  const { id } = req.params;

  try {
    const users = await prisma.user.findMany({
      where: { tenantId: id },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});



// GET: Validate Tenant by ID
app.get("/api/tenants/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return res.status(404).json({ exists: false });
    }
    res.json({ exists: true });
  } catch (error) {
    console.error("Error validating tenant:", error.message);
    res.status(500).json({ error: "Failed to validate tenant" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5001; // Matches docker-compose.yml
app.listen(PORT, async () => {
  try {
    // Connect to the database
    await prisma.$connect();
    console.log('Connected to database');

    console.log(`Tenant Service running on port ${PORT}`);
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('Disconnected from database');
  process.exit(0);
});