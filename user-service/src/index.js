require('dotenv').config();
const express = require('express');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = process.env.PORT || 5005;

app.use(express.json());

app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`User service running on port ${port}`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down user service...');
  await require('./config/database').$disconnect();
  process.exit(0);
});