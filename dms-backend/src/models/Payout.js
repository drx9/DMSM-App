const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payout = sequelize.define('Payout', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    deliveryBoyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        field: 'delivery_boy_id',
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id',
        },
        field: 'order_id',
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'paid'),
        defaultValue: 'pending',
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paid_at',
    },
}, {
    tableName: 'payouts',
    timestamps: false,
});

Payout.associate = (models) => {
    Payout.belongsTo(models.User, { foreignKey: 'deliveryBoyId', as: 'deliveryBoy' });
    Payout.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
};

module.exports = Payout; 