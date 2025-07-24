require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const routes = require('./routes');
const couponRoutes = require('./routes/couponRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { syncModels } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'https://dmsm-app.vercel.app', // your actual Vercel frontend
  'http://localhost:3000',      // local dev
];
app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin); // Debug log
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', routes);
app.use('/api/coupons', couponRoutes);
app.get('/api/health', (req, res) => res.send('OK'));

// Error handling
app.use(errorHandler);

// Database sync and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required! Set it in Railway backend variables.');
}

startServer(); 