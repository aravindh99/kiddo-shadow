/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const [constraints] = await sequelize.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
       AND tc.table_schema = ccu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'users'
        AND tc.constraint_type = 'UNIQUE'
        AND ccu.column_name = 'phone'
    `);

    for (const constraint of constraints) {
      await queryInterface.removeConstraint("users", constraint.constraint_name);
    }

    const indexes = await queryInterface.showIndex("users");
    const phoneUniqueIndexes = indexes.filter(
      (index) =>
        index.unique &&
        Array.isArray(index.fields) &&
        index.fields.length === 1 &&
        index.fields[0]?.attribute === "phone"
    );

    for (const index of phoneUniqueIndexes) {
      await queryInterface.removeIndex("users", index.name);
    }
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const [constraints] = await sequelize.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
       AND tc.table_schema = ccu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'users'
        AND tc.constraint_type = 'UNIQUE'
        AND ccu.column_name = 'phone'
    `);

    if (constraints.length === 0) {
      await queryInterface.addConstraint("users", {
        fields: ["phone"],
        type: "unique",
        name: "users_phone_unique",
      });
    }

    const indexes = await queryInterface.showIndex("users");
    const hasPhoneUniqueIndex = indexes.some(
      (index) =>
        index.unique &&
        Array.isArray(index.fields) &&
        index.fields.length === 1 &&
        index.fields[0]?.attribute === "phone"
    );

    if (!hasPhoneUniqueIndex && constraints.length === 0) {
      await queryInterface.addIndex("users", ["phone"], {
        name: "users_phone_unique_idx",
        unique: true,
      });
    }
  },
};
