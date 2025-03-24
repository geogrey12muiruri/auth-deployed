const { sendOTP } = require('../src/controllers/authController');
const Redis = require('ioredis');
const nodemailer = require('nodemailer');

jest.mock('ioredis');
jest.mock('nodemailer');

describe('sendOTP', () => {
  let redisClient;
  let transporter;

  beforeAll(() => {
    redisClient = new Redis();
    transporter = {
      sendMail: jest.fn().mockResolvedValue(true),
    };
    nodemailer.createTransport.mockReturnValue(transporter);
  });

  it('should generate and send OTP', async () => {
    const email = 'test@example.com';
    redisClient.setex.mockResolvedValue(true);

    await sendOTP(email);

    expect(redisClient.setex).toHaveBeenCalledWith(expect.stringContaining(`otp:${email}`), 300, expect.any(String));
    expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: email }));
  });
});