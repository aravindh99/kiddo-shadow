"use strict";

// Strong DB-level protection against duplicate allocations.
// Covers: teacher + subject + class + section + academic_year (active rows only).
// Uses COALESCE(subject_id, 0) so NULL subjects cannot be duplicated either.

module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== "postgres") return;

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        -- drop old index if it exists
        IF EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = 'teacher_assignments_unique_active'
        ) THEN
          DROP INDEX teacher_assignments_unique_active;
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = 'teacher_assignments_unique_active_v2'
        ) THEN
          CREATE UNIQUE INDEX teacher_assignments_unique_active_v2
          ON teacher_assignments (
            school_id,
            teacher_id,
            class_id,
            section_id,
            COALESCE(subject_id, 0),
            academic_year
          )
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
      "DROP INDEX IF EXISTS teacher_assignments_unique_active_v2;"
    );
  },
};

