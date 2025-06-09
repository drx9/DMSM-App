const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'dms_mart',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection and sync models
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Import models
    const User = require('../models/User');
    const OTP = require('../models/OTP');

    // Set up associations
    User.hasMany(OTP, { foreignKey: 'userId', onDelete: 'CASCADE' });
    OTP.belongsTo(User, { foreignKey: 'userId' });

    // Drop all tables first
    await sequelize.drop();
    console.log('All tables dropped successfully.');

    // Create tables in order
    await User.sync({ force: true });
    console.log('Users table created successfully.');

    await OTP.sync({ force: true });
    console.log('OTPs table created successfully.');

    console.log('Database models synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

// Initialize database
initializeDatabase();

module.exports = sequelize; 