const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  discountType: {
    type: DataTypes.ENUM('flat', 'percent'),
    allowNull: false,
    field: 'discount_type',
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'discount_value',
  },
  maxUses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'max_uses',
  },
  remainingUses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'remaining_uses',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'coupons',
  timestamps: true,
  underscored: true,
});

Coupon.associate = (models) => {
  Coupon.hasMany(models.CouponUsage, { foreignKey: 'couponId', as: 'usages' });
};

module.exports = Coupon; 