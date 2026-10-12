"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'enum_ai_chat_logs_ai_type'
            AND e.enumlabel = 'question_paper'
        ) THEN
          ALTER TYPE "enum_ai_chat_logs_ai_type" ADD VALUE 'question_paper';
        END IF;
      END
      $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'enum_ai_chat_logs_ai_type'
            AND e.enumlabel = 'lesson_summary'
        ) THEN
          ALTER TYPE "enum_ai_chat_logs_ai_type" ADD VALUE 'lesson_summary';
        END IF;
      END
      $$;
    `);
  },

  async down() {
    // Postgres enums do not support removing a single value safely in-place.
  },
};
