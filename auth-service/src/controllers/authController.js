require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const axios = require('axios'); // Add this line

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
});

// Generate and send OTP
const sendOTP = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

  // Try storing OTP
  try {
    await redis.setex(`otp:${email}`, 300, otp); // Expires in 5 minutes
    console.log(`✅ OTP stored in Redis: ${otp} for ${email}`);
  } catch (err) {
    console.error("❌ Failed to store OTP in Redis:", err);
  }

  // Send email
  try {
    await transporter.sendMail({
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${otp}. It expires in 5 minutes.`,
    });
    console.log(`📩 OTP email sent to ${email}`);
  } catch (err) {
    console.error("❌ Failed to send OTP email:", err);
  }
};

exports.register = async (req, res) => {
  const { email, password, role, tenantId, tenantName } = req.body;

  try {
    // Validate required fields
    if (!tenantId || !tenantName) {
      return res.status(400).json({ message: 'Tenant ID and Tenant Name are required' });
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Proceed with user registration
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        tenantId, // Store tenantId
        tenantName, // Store tenantName
      },
    });

    // Send OTP after user creation
    await sendOTP(email);

    res.status(201).json({ message: 'User registered successfully. OTP sent to email.', user });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const storedOTP = await redis.get(`otp:${email}`);
    if (!storedOTP || storedOTP !== otp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    await prisma.user.update({ where: { email }, data: { verified: true } });
    await redis.del(`otp:${email}`);

    return res.json({ message: 'Account verified successfully' });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    return res.status(500).json({ message: 'Server error during OTP verification' });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!prisma.user) {
      console.error('Prisma Client is not properly initialized or user model is missing.');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Find the user by email and explicitly include tenantId and tenantName
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        tenantId: true, // Include tenantId in the query
        tenantName: true, // Include tenantName in the query
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return res.status(400).json({ message: 'User not found' });

    // Verify the password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate access and refresh tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.tenantId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token in Redis
    await redis.setex(`refreshToken:${user.id}`, 7 * 24 * 60 * 60, refreshToken); // 7 days

    // Respond with user and tenant details
    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId, // Include tenantId in the response
        tenantName: user.tenantName, // Include tenantName in the response
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};
// Get current user
exports.getCurrentUser = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, tenantId: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Error verifying token:', error);
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedRefreshToken = await redis.get(`refreshToken:${decoded.userId}`);
    if (refreshToken !== storedRefreshToken) return res.status(401).json({ message: 'Invalid refresh token' });

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({ accessToken });
  } catch (error) {
    console.error('Error during token refresh:', error);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// Logout
exports.logout = async (req, res) => {
  const { userId } = req.body;

  try {
    await redis.del(`refreshToken:${userId}`);
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ message: 'Server error during logout' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const token = crypto.randomBytes(20).toString('hex');
    await redis.setex(`resetPasswordToken:${token}`, 3600, user.id); // Expires in 1 hour

    const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;
    await transporter.sendMail({
      to: email,
      subject: 'Password Reset Link',
      text: `Click the link to reset your password: ${resetLink}`,
    });

    return res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error('Error during forgot password:', error);
    return res.status(500).json({ message: 'Server error during forgot password' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const userId = await redis.get(`resetPasswordToken:${token}`);
    if (!userId) return res.status(400).json({ message: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    await redis.del(`resetPasswordToken:${token}`);

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error during password reset:', error);
    return res.status(500).json({ message: 'Server error during password reset' });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.verified) return res.status(400).json({ message: 'User already verified' });

    await sendOTP(email);
    return res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Error during OTP resend:', error);
    return res.status(500).json({ message: 'Server error during OTP resend' });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await prisma.user.delete({ where: { id: userId } });
    await redis.del(`refreshToken:${userId}`);

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error during account deletion:', error);
    return res.status(500).json({ message: 'Server error during account deletion' });
  }
};

// Rate limit for login
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: 'Too many login attempts. Please try again later.',
});