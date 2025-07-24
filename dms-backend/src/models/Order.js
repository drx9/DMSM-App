const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
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
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled'),
        defaultValue: 'pending',
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    shippingAddress: {
        type: DataTypes.JSONB, // For storing address objects
        allowNull: false,
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        defaultValue: 'pending',
    },
    deliveryBoyId: {
        type: DataTypes.UUID,
        allowNull: true, // Will be assigned later
        references: {
            model: 'users',
            key: 'id',
        }
    },
    deliveryKey: {
        type: DataTypes.STRING(4),
        allowNull: true,
        field: 'delivery_key',
    },
    deliverySlot: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'delivery_slot',
    },
}, {
    tableName: 'orders',
    timestamps: true,
    underscored: true,
});

Order.associate = (models) => {
    Order.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'customer',
    });
    Order.belongsTo(models.User, {
        foreignKey: 'deliveryBoyId',
        as: 'deliveryBoy',
    });
    Order.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'items',
    });
};

module.exports = Order; 