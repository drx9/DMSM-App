'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'fcm_token', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'profile_image'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'fcm_token');
  }
}; 