'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.createTable('system_settings', {
        key: {
          type: Sequelize.STRING,
          allowNull: false,
          primaryKey: true,
        },
        value: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    } catch (error) {
       if (!error.message.includes("already exists")) {
         throw error;
       }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_settings');
  }
};
