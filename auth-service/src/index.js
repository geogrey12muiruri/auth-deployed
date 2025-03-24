require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const connectDB = require('./services/db');
const routes = require('./routes/index');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(morgan('dev'));

// Database connection
connectDB();

// Routes
app.use('/api', routes);

// Start server
app.listen(port, () => {
  console.log(`Auth Service running on port ${port}`);
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected');
  process.exit(0);
});