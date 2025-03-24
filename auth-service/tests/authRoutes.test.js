const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('../src/routes/index');
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const bcrypt = require('bcryptjs');

jest.mock('@prisma/client');
jest.mock('ioredis');

const app = express();
app.use(bodyParser.json());
app.use('/api', authRoutes);

describe('Auth Routes', () => {
  let prisma;
  let redisClient;

  beforeAll(() => {
    prisma = new PrismaClient();
    redisClient = new Redis();

    prisma.user = {
      findUnique: jest.fn(),
      create: jest.fn(),
    };
  });

  it('should register a new user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ email: 'test@example.com', verified: false });
    redisClient.setex.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/register')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User registered. Please verify using the OTP sent to your email.');
  });

  it('should login a user', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: 'test@example.com', password: 'hashedpassword', verified: true });
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    redisClient.setex.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('OTP sent for login verification');
  });
});