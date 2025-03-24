const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role, tenantId: decoded.tenantId };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access restricted to ${roles.join(', ')}` });
  }
  next();
};

module.exports = { authenticateToken, restrictTo };