/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    const ensureConstraint = async (name, sql) => {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = '${name}'
          ) THEN
            ${sql}
          END IF;
        END $$;
      `);
    };

    await ensureConstraint(
      "homeworks_school_id_fkey",
      `ALTER TABLE homeworks
       ADD CONSTRAINT homeworks_school_id_fkey
       FOREIGN KEY (school_id) REFERENCES schools(id)
       ON UPDATE CASCADE ON DELETE CASCADE;`
    );

    await ensureConstraint(
      "homeworks_class_id_fkey",
      `ALTER TABLE homeworks
       ADD CONSTRAINT homeworks_class_id_fkey
       FOREIGN KEY (class_id) REFERENCES classes(id)
       ON UPDATE CASCADE ON DELETE CASCADE;`
    );

    await ensureConstraint(
      "homeworks_section_id_fkey",
      `ALTER TABLE homeworks
       ADD CONSTRAINT homeworks_section_id_fkey
       FOREIGN KEY (section_id) REFERENCES sections(id)
       ON UPDATE CASCADE ON DELETE CASCADE;`
    );

    await ensureConstraint(
      "homeworks_teacher_assignment_id_fkey",
      `ALTER TABLE homeworks
       ADD CONSTRAINT homeworks_teacher_assignment_id_fkey
       FOREIGN KEY (teacher_assignment_id) REFERENCES teacher_assignments(id)
       ON UPDATE CASCADE ON DELETE CASCADE;`
    );

    await ensureConstraint(
      "homeworks_subject_id_fkey",
      `ALTER TABLE homeworks
       ADD CONSTRAINT homeworks_subject_id_fkey
       FOREIGN KEY (subject_id) REFERENCES subjects(id)
       ON UPDATE CASCADE ON DELETE CASCADE;`
    );

    await ensureConstraint(
      "homeworks_created_by_fkey",
      `ALTER TABLE homeworks
       ADD CONSTRAINT homeworks_created_by_fkey
       FOREIGN KEY (created_by) REFERENCES users(id)
       ON UPDATE CASCADE ON DELETE CASCADE;`
    );
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("homeworks", "homeworks_created_by_fkey");
    await queryInterface.removeConstraint("homeworks", "homeworks_subject_id_fkey");
    await queryInterface.removeConstraint("homeworks", "homeworks_teacher_assignment_id_fkey");
    await queryInterface.removeConstraint("homeworks", "homeworks_section_id_fkey");
    await queryInterface.removeConstraint("homeworks", "homeworks_class_id_fkey");
    await queryInterface.removeConstraint("homeworks", "homeworks_school_id_fkey");
  },
};
