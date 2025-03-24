const prisma = require('../config/database');

const getUsers = async (req, res) => {
  const { role, tenantId, status } = req.query;
  if (req.user.tenantId !== tenantId) {
    return res.status(403).json({ error: 'Unauthorized access to this tenant' });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: role ? role.toUpperCase() : undefined,
        tenantId,
        status: status || 'active',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        availability: true,
        verified: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const createUser = async (req, res) => {
  const { email, firstName, lastName, role, tenantId } = req.body;
  if (req.user.tenantId !== tenantId) {
    return res.status(403).json({ error: 'Unauthorized to create user in this tenant' });
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: 'temp_password', // Sync with auth-service later
        firstName,
        lastName,
        role: role.toUpperCase(),
        tenantId,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, status, availability } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || req.user.tenantId !== user.tenantId) {
      return res.status(403).json({ error: 'Unauthorized or user not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role?.toUpperCase(), status, availability },
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const addFeedback = async (req, res) => {
  const { userId, auditId, status, reason } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || req.user.tenantId !== user.tenantId) {
      return res.status(403).json({ error: 'Unauthorized or user not found' });
    }

    const feedback = await prisma.userFeedback.create({
      data: { userId, auditId, status, reason },
    });
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ error: 'Failed to add feedback' });
  }
};

module.exports = { getUsers, createUser, updateUser, addFeedback };