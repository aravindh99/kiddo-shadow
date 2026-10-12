import { Sequelize } from 'sequelize';
import db from '../src/config/db.js';
import User from '../src/modules/users/user.model.js';
import School from '../src/modules/schools/school.model.js';

async function migrate() {
  console.log("Starting School Admin Auth Migration...");

  try {
    const schools = await School.findAll();
    console.log(`Found ${schools.length} schools.`);

    let updatedCount = 0;
    let skippedCount = 0;
    let createdCount = 0;
    let errorCount = 0;

    for (const school of schools) {
      if (!school.email) {
        console.log(`Skipping School ID ${school.id} (${school.school_name}) - No email in school record.`);
        skippedCount++;
        continue;
      }

      const emailToLower = school.email.toLowerCase();

      // Find existing admin
      let admin = await User.findOne({
        where: { school_id: school.id, role: 'school_admin' }
      });

      if (admin) {
        if (!admin.email) {
          // Check if email is already taken
          const existingEmailUser = await User.findOne({
            where: Sequelize.where(Sequelize.fn('lower', Sequelize.col('email')), emailToLower)
          });

          if (existingEmailUser && existingEmailUser.id !== admin.id) {
            console.log(`Error for School ID ${school.id}: Email ${emailToLower} is already taken by User ID ${existingEmailUser.id}.`);
            errorCount++;
          } else {
            admin.email = school.email;
            await admin.save();
            console.log(`Updated School ID ${school.id} (${school.school_name}) - Set email to ${school.email}.`);
            updatedCount++;
          }
        } else {
          console.log(`Skipping School ID ${school.id} (${school.school_name}) - Admin already has an email (${admin.email}).`);
          skippedCount++;
        }
      } else {
        // Create missing admin auth record
        console.log(`Admin record missing for School ID ${school.id}. Creating new one...`);
        
        // Ensure email isn't taken
        const existingEmailUser = await User.findOne({
          where: Sequelize.where(Sequelize.fn('lower', Sequelize.col('email')), emailToLower)
        });

        if (existingEmailUser) {
           console.log(`Cannot create admin for School ID ${school.id}: Email ${emailToLower} is already taken by User ID ${existingEmailUser.id}.`);
           errorCount++;
           continue;
        }

        // Generate username (e.g. from email prefix or school code)
        let usernameBase = school.email.split('@')[0];
        let username = usernameBase;
        let suffix = 1;
        while (await User.findOne({ where: { username } })) {
          username = `${usernameBase}${suffix}`;
          suffix++;
        }

        admin = await User.create({
          role: 'school_admin',
          school_id: school.id,
          username: username,
          email: school.email,
          password: 'Password@123', // temporary fallback password
          first_login: true,
          is_active: true,
          name: 'School Admin'
        });
        console.log(`Created new Admin (User ID: ${admin.id}, Username: ${username}, Email: ${school.email}) for School ID ${school.id}.`);
        createdCount++;
      }
    }

    console.log("------------------------------------------");
    console.log("Migration Complete.");
    console.log(`Updated: ${updatedCount}`);
    console.log(`Created: ${createdCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors:  ${errorCount}`);

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrate();
