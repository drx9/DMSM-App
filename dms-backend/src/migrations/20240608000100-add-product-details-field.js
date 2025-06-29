module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('products', 'details', {
            type: Sequelize.JSONB,
            defaultValue: {},
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('products', 'details');
    },
}; 