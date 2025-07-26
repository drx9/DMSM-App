'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('expo_push_tokens', 'platform', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'unknown',
    });

    await queryInterface.addColumn('expo_push_tokens', 'device_id', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'unknown',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('expo_push_tokens', 'platform');
    await queryInterface.removeColumn('expo_push_tokens', 'device_id');
  }
}; 