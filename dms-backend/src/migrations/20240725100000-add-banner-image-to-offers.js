module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('offers', 'banner_image', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('offers', 'banner_image');
  },
}; 