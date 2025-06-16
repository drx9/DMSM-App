const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    underscored: true
  });

  // Define self-referential relationship after model definition
  Category.associate = (models) => {
    Category.belongsTo(models.Category, {
      as: 'parentCategory',
      foreignKey: 'parentId',
      targetKey: 'id'
    });
    Category.hasMany(models.Category, {
      as: 'subCategories',
      foreignKey: 'parentId'
    });
  };

  return Category;
}; 