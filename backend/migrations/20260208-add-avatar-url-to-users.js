/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn("users", "avatar_url", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } catch (error) {
      if (!error.message.includes("already exists")) {
        throw error;
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "avatar_url");
  },
};
