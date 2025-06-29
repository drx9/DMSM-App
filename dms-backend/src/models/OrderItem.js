const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id',
        },
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id',
        },
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
}, {
    tableName: 'order_items',
    timestamps: false, // Often, line items don't need their own timestamps
});

OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order',
    });
    OrderItem.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product',
    });
};

module.exports = OrderItem; 