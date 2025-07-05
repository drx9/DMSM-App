const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Wishlist = sequelize.define('Wishlist', {
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
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'Wishlists',
    });

    Wishlist.associate = (models) => {
        Wishlist.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Wishlist.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    };

    return Wishlist;
}; 