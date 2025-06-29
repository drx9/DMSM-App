const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CartItem = sequelize.define('CartItem', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
    });

    return CartItem;
}; 