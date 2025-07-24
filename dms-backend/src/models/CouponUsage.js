const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CouponUsage = sequelize.define('CouponUsage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  couponId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'coupons', key: 'id' },
    field: 'coupon_id',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    field: 'user_id',
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'orders', key: 'id' },
    field: 'order_id',
  },
  usedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'used_at',
  },
}, {
  tableName: 'coupon_usages',
  timestamps: false,
  underscored: true,
});

CouponUsage.associate = (models) => {
  CouponUsage.belongsTo(models.Coupon, { foreignKey: 'couponId', as: 'coupon' });
  CouponUsage.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  CouponUsage.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
};

module.exports = CouponUsage; 