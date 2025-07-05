require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { syncModels } = require('./models');

const PORT = process.env.PORT || 5000;

// Error handling (if not already in app.js)
app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer(); 