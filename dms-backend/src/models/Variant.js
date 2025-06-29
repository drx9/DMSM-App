const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Variant = sequelize.define('Variant', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id',
        },
    },
    name: {
        type: DataTypes.STRING,
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
    }
}, {
    tableName: 'variants',
    timestamps: true,
    underscored: true
});

Variant.associate = (models) => {
    Variant.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'parentProduct'
    });
};

module.exports = Variant; 