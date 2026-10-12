"use strict";

export default {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== "postgres") return;
    
    try {
      await queryInterface.addColumn("teacher_assignments", "academic_year", {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "2025-2026",
      });

      // Backfill just in case (older rows).
      await queryInterface.sequelize.query(`
        UPDATE teacher_assignments
        SET academic_year = COALESCE(academic_year, '2025-2026');
      `);
    } catch (error) {
      if (!error.message.includes("already exists")) {
        throw error;
      }
    }
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== "postgres") return;
    await queryInterface.removeColumn("teacher_assignments", "academic_year");
  },
};

