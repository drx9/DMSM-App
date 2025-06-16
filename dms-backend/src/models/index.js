const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');

const db = {
  sequelize,
  Sequelize
};

// Import model definitions
const UserModel = require('./User');
const CategoryModel = require('./Category');
const ProductModel = require('./Product');
const OTPModel = require('./OTP');

// Initialize models
db.User = UserModel(sequelize);
db.Category = CategoryModel(sequelize);
db.Product = ProductModel(sequelize);
db.OTP = OTPModel(sequelize);

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Sync models in correct order
const syncModels = async () => {
  try {
    await db.User.sync();
    console.log('User model synchronized');
    
    await db.Category.sync();
    console.log('Category model synchronized');
    
    await db.Product.sync();
    console.log('Product model synchronized');
    
    await db.OTP.sync();
    console.log('OTP model synchronized');
    
    console.log('All models synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing models:', error);
    throw error;
  }
};

module.exports = { ...db, syncModels }; 