const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OfferProduct = sequelize.define('OfferProduct', {
    offerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'offers',
            key: 'id',
        },
        primaryKey: true,
        field: 'offer_id',
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id',
        },
        primaryKey: true,
        field: 'product_id',
    },
    extraDiscount: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
        field: 'extra_discount',
    },
    customOfferText: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'custom_offer_text',
    },
}, {
    tableName: 'offer_products',
    timestamps: false,
    underscored: true,
});

module.exports = OfferProduct; 