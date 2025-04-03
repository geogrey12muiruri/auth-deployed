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

  try {
    await redis.setex(`otp:${email}`, 300, otp); // Expires in 5 minutes
    console.log(`✅ OTP stored in Redis: ${otp} for ${email}`);
  } catch (err) {
    console.error("❌ Failed to store OTP in Redis:", err);
    throw new Error('Failed to store OTP. Please try again later.');
  }

  try {
    await transporter.sendMail({
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${otp}. It expires in 5 minutes.`,
    });
    console.log(`📩 OTP email sent to ${email}`);
  } catch (err) {
    console.error("❌ Failed to send OTP email:", err);
    throw new Error('Failed to send OTP email. Please try again later.');
  }
};

exports.register = async (req, res) => {
  const { email, password, roleId, tenantId, tenantName } = req.body;

  try {
    // Validate required fields
    if (!tenantId || !tenantName || !roleId) {
      return res.status(400).json({ message: 'Tenant ID, Tenant Name, and Role ID are required' });
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
        roleId, // Assign the role ID as provided
        tenantId, // Store tenantId as provided
        tenantName, // Store tenantName as provided
      },
    });

    // Send OTP after user creation
    await sendOTP(email);

    res.status(201).json({
      success: true, // Add success field
      message: 'User registered successfully. OTP sent to email.',
      user,
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

exports.createRole = async (req, res) => {
  const { id, name, description, tenantId } = req.body;

  try {
    // Validate required fields
    if (!id || !name || !tenantId) {
      return res.status(400).json({ message: 'Role ID, name, and tenant ID are required' });
    }

    // Check if the role already exists
    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (existingRole) {
      return res.status(400).json({ message: 'Role with this ID already exists' });
    }

    // Create the role in the database
    const role = await prisma.role.create({
      data: {
        id,
        name,
        description,
        tenantId,
      },
    });

    res.status(201).json({ message: 'Role created successfully', role });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Server error during role creation' });
  }
};

// Add a new endpoint to fetch a role by ID
exports.getRoleById = async (req, res) => {
  const { id } = req.params;

  try {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json(role);
  } catch (error) {
    console.error('Error fetching role by ID:', error);
    res.status(500).json({ message: 'Server error while fetching role' });
  }
};

// Get all roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        tenantId: true,
      },
    });

    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Server error while fetching roles' });
  }
}

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const storedOTP = await redis.get(`otp:${email}`);
    if (!storedOTP || storedOTP !== otp) {
      console.warn(`Invalid OTP attempt for email: ${email}`);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

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
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        roleId: true, // Include roleId
        role: { select: { name: true } }, // Include role name
        tenantId: true,
        tenantName: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if the email is verified
    if (!user.verified) {
      // Resend OTP
      await sendOTP(email);
      return res.status(400).json({
        message: 'Email not verified. A new OTP has been sent to your email.',
      });
    }

    // Verify the password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate access and refresh tokens
    const accessToken = jwt.sign(
      { userId: user.id, roleId: user.roleId, roleName: user.role.name, tenantId: user.tenantId },
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
        roleId: user.roleId,
        roleName: user.role.name,
        tenantId: user.tenantId,
        tenantName: user.tenantName,
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

// GET: Fetch User by ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        tenantName: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Server error while fetching user" });
  }
};

// Resend OTP
const resendOTPLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 attempts per IP
  message: 'Too many OTP resend attempts. Please try again later.',
});

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

    await prisma.user.update({ where: { id: userId }, data: { isDeleted: true } });
    await redis.del(`refreshToken:${userId}`);

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error during account deletion:', error);
    return res.status(500).json({ message: 'Server error during account deletion' });
  }
};
exports.logEvent = async (eventType, eventData) => {
  try {
    await prisma.eventLog.create({
      data: {
        eventType,
        eventData: JSON.stringify(eventData),
      },
    });
    console.log(`Event logged: ${eventType}`);
  } catch (error) {
    console.error('Error logging event:', error.message);
  }
};

// Get all users by role and tenant
exports.getUsersByRoleAndTenant = async (req, res) => {
  const { roleId, tenantId } = req.query;

  try {
    // Validate query parameters
    if (!roleId || !tenantId) {
      return res.status(400).json({ message: 'Role ID and tenantId are required' });
    }

    // Query the User table
    const users = await prisma.user.findMany({
      where: {
        roleId, // Match roleId
        tenantId, // Match tenantId
      },
      select: {
        id: true,
        email: true,
        role: { select: { name: true } }, // Include role name
        tenantId: true,
        tenantName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(users);
  } catch (error) {
    console.error('Error fetching users by role and tenant:', error);
    return res.status(500).json({ message: 'Server error while fetching users' });
  }
};
// Rate limit for login
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: 'Too many login attempts. Please try again later.',
});

// Enhanced forgotPassword with rate limiter
exports.forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per IP
  message: 'Too many password reset attempts. Please try again later.',
});