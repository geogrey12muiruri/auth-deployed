const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to the database');
  } catch (err) {
    console.error('Error connecting to the database', err);
    process.exit(1); // Exit process if DB connection fails
  }
};

module.exports = connectDB;
