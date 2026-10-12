import cron from "node-cron";
import { Op } from "sequelize";
import Notification from "../../modules/notifications/notification.model.js";

const initCronJobs = () => {
  // Run every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("[CRON] Running daily cleanup for old notifications...");

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deletedCount = await Notification.destroy({
        where: {
          created_at: {
            [Op.lt]: sevenDaysAgo,
          },
        },
      });

      console.log(`[CRON] Cleanup complete. Deleted ${deletedCount} notifications older than 7 days.`);
    } catch (error) {
      console.error("[CRON] Error deleting old notifications:", error);
    }
  });

  console.log("[CRON] Cron jobs initialized.");
};

export default initCronJobs;
