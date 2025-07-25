const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExpoPushToken = sequelize.define('ExpoPushToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'expo_push_tokens',
  timestamps: true,
  underscored: true,
});

ExpoPushToken.associate = (models) => {
  ExpoPushToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = ExpoPushToken; 