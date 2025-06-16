const { Sequelize } = require('sequelize');
const { Client } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  // First, connect to postgres database to create our database
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres' // Connect to default postgres database first
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'dms_mart']
    );

    if (result.rowCount === 0) {
      // Create database if it doesn't exist
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'dms_mart'}`);
      console.log('Database created successfully');
    } else {
      console.log('Database already exists');
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    await client.end();
  }

  // Now connect to our database and sync models
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'dms_mart',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: console.log
    }
  );

  try {
    await sequelize.authenticate();
    console.log('Connected to database successfully');

    // Import models
    require('./models/User');
    require('./models/OTP');

    // Sync all models, forcing recreation of tables to ensure a clean schema.
    // WARNING: This will delete ALL data in your database!
    await sequelize.sync();
    console.log('All models were synchronized successfully (forced recreation).');

    // Add a small delay to ensure all operations are complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Error syncing models:', error);
    throw error;
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('Database connection closed');
    }
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('Database setup completed successfully');
    // Add a small delay before exiting
    setTimeout(() => process.exit(0), 1000);
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  }); 