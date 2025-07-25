const express = require('express');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./socket');
const mainRouter = require('./routes/index');
const db = require('./models');

const app = express();

// Logging middleware for all requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Mount all API routes
app.use('/api', mainRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const server = http.createServer(app);
initSocket(server);
db.sequelize.sync({ alter: true });

module.exports = server; 