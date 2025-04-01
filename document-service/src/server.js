const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const { getDocuments, uploadDocument } = require('./controllers/documentController');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = {
      userId: decoded.userId,
      roleName: decoded.roleName,
      tenantId: decoded.tenantId,
    };
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to restrict access to Management Representatives
const restrictToManagementRep = (req, res, next) => {
  if (req.user?.roleName?.toUpperCase() !== 'MR') {
    return res.status(403).json({ error: 'Management Representative access required' });
  }
  next();
};

// Route to fetch documents
app.get('/documents', authenticateToken, getDocuments);

// Route to upload documents
app.post('/documents', authenticateToken, restrictToManagementRep, upload.single('file'), uploadDocument);

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Document Service running on port ${PORT}`);
});