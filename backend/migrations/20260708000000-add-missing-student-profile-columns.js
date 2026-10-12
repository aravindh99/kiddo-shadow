/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("students");

    const addColumnIfMissing = async (columnName, definition) => {
      if (!table[columnName]) {
        await queryInterface.addColumn("students", columnName, definition);
      }
    };

    await addColumnIfMissing("guardian_name", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await addColumnIfMissing("aadhar_no", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await addColumnIfMissing("father_occupation", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await addColumnIfMissing("mother_occupation", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await addColumnIfMissing("family_income", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await addColumnIfMissing("pending_updates", {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await addColumnIfMissing("approval_status", {
      type: Sequelize.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    });
    await addColumnIfMissing("approved_by", {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    });
    await addColumnIfMissing("rejection_reason", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await addColumnIfMissing("approved_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("students");

    const removeColumnIfPresent = async (columnName) => {
      if (table[columnName]) {
        await queryInterface.removeColumn("students", columnName);
      }
    };

    await removeColumnIfPresent("approved_at");
    await removeColumnIfPresent("rejection_reason");
    await removeColumnIfPresent("approved_by");
    await removeColumnIfPresent("approval_status");
    await removeColumnIfPresent("pending_updates");
    await removeColumnIfPresent("family_income");
    await removeColumnIfPresent("mother_occupation");
    await removeColumnIfPresent("father_occupation");
    await removeColumnIfPresent("aadhar_no");
    await removeColumnIfPresent("guardian_name");

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_approval_status";');
  },
};
