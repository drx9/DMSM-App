'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('users', 'gender', {
            type: Sequelize.ENUM('Male', 'Female', 'Other'),
            allowNull: true,
        });

        await queryInterface.addColumn('users', 'date_of_birth', {
            type: Sequelize.DATEONLY,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('users', 'gender');
        await queryInterface.removeColumn('users', 'date_of_birth');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_users_gender;');
    }
}; 