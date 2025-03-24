const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const routes = require('./src/routes');
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5001; // Matches docker-compose.yml
app.listen(PORT, async () => {
  try {
    // Run Prisma migrations on startup
    console.log('Running Prisma migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

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