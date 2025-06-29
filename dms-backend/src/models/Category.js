const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
});

Category.associate = (models) => {
  Category.hasMany(models.Product, {
    foreignKey: 'categoryId',
    as: 'products',
  });

  Category.belongsTo(models.Category, {
    as: 'parentCategory',
    foreignKey: 'parentId',
    targetKey: 'id',
  });
  Category.hasMany(models.Category, {
    as: 'subCategories',
    foreignKey: 'parentId',
  });
};

module.exports = Category; 