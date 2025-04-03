const express = require('express');
const dotenv = require('dotenv');
const errorHandler = require('./middlewares/errorHandler');

dotenv.config();

const app = express();

app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Notification service is healthy' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
