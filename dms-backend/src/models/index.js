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
  CartItem: require('./CartItem')(sequelize),
  Address: require('./Address')(sequelize),
  Variant: require('./Variant'),
};

// Define associations
Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

// Associations
db.CartItem.belongsTo(db.User, { foreignKey: 'userId' });
db.CartItem.belongsTo(db.Product, { foreignKey: 'productId' });
db.User.hasMany(db.CartItem, { foreignKey: 'userId' });
db.Product.hasMany(db.CartItem, { foreignKey: 'productId' });

db.Address.belongsTo(db.User, { foreignKey: 'userId' });
db.User.hasMany(db.Address, { foreignKey: 'userId' });

db.Product.hasMany(db.Variant, { foreignKey: 'productId', as: 'variants' });

module.exports = db; 