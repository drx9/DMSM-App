"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("Addresses", {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal("uuid_generate_v4()"),
            },
            userId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: "users", key: "id" },
                onDelete: "CASCADE",
            },
            line1: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            line2: {
                type: Sequelize.STRING,
            },
            city: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            state: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            postalCode: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            country: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            isDefault: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            latitude: {
                type: Sequelize.DOUBLE,
                allowNull: true,
            },
            longitude: {
                type: Sequelize.DOUBLE,
                allowNull: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("Addresses");
    },
}; 