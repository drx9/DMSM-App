module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('offers', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('uuid_generate_v4()'),
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            start_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            end_date: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()'),
            },
        });

        await queryInterface.createTable('offer_products', {
            offer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'offers', key: 'id' },
                onDelete: 'CASCADE',
                primaryKey: true,
            },
            product_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'products', key: 'id' },
                onDelete: 'CASCADE',
                primaryKey: true,
            },
            extra_discount: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
                defaultValue: 0,
            },
            custom_offer_text: {
                type: Sequelize.STRING,
                allowNull: true,
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('offer_products');
        await queryInterface.dropTable('offers');
    },
}; 