const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'type',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users', // table name
      key: 'id',
    },
  },
}, {
  tableName: 'otps',
  timestamps: true,
  underscored: true,
});

OTP.associate = (models) => {
  OTP.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
};

module.exports = OTP; 