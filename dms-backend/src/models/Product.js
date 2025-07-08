const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Category = require('./Category');
const User = require('./User');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isOutOfStock: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id',
    },
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  details: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true
});

Product.associate = (models) => {
  Product.belongsTo(models.Category, {
    foreignKey: 'categoryId',
    as: 'category'
  });
  Product.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
  Product.hasMany(models.Review, {
    foreignKey: 'productId',
    as: 'reviews'
  });
  Product.belongsToMany(models.Offer, {
    through: models.OfferProduct,
    foreignKey: 'productId',
    otherKey: 'offerId',
    as: 'offers',
  });
};

module.exports = Product; 