const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');

const db = {
  sequelize,
  Sequelize,
  User: require('./User'),
  Category: require('./Category'),
  Product: require('./Product'),
  OTP: require('./OTP'),
  Review: require('./Review'),
  Order: require('./Order'),
  OrderItem: require('./OrderItem'),
  Payout: require('./Payout'),
};

// Define associations
Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db; 