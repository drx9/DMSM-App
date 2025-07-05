const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const allRoutes = require('./routes'); // Import the main router

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081'], // Allow admin, consumer, and delivery app
    credentials: true, // Allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware

// Mount all routes under the /api prefix
app.use('/api', allRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;