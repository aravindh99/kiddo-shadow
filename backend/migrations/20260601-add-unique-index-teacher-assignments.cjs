"use strict";

// Ensures teacher assignments cannot be duplicated due to race conditions or double-submits.
// Uses a Postgres expression index so NULL subject_id values are also treated as duplicates.

module.exports = {
  async up(queryInterface) {
    // Only supported on Postgres; for other dialects this will no-op safely.
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== "postgres") return;

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = 'teacher_assignments_unique_active'
        ) THEN
          CREATE UNIQUE INDEX teacher_assignments_unique_active
          ON teacher_assignments (school_id, teacher_id, section_id, COALESCE(subject_id, 0))
          WHERE is_active = true;
        END IF;
      END
      $$;
    `);
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== "postgres") return;
    await queryInterface.sequelize.query(
      "DROP INDEX IF EXISTS teacher_assignments_unique_active;"
    );
  },
};

