import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { validate } from "../../shared/middlewares/validate.js";
import { allowRoles } from "../../shared/middlewares/role.js";

import {
  createNotificationSchema,
  updateNotificationSchema,
} from "./notification.schema.js";
import {
  createNotification,
  listNotifications,
  updateNotification,
  deleteNotification,
} from "./notification.controller.js";
import {
  acknowledgeNotification,
  listNotificationAcks,
} from "./notification-ack.controller.js";

const router = express.Router();

router.use(protect);

/* admin & teacher */
router.post(
  "/",
  allowRoles("school_admin", "teacher"),
  validate(createNotificationSchema),
  createNotification
);

router.put(
  "/:id",
  allowRoles("school_admin", "teacher"),
  validate(updateNotificationSchema),
  updateNotification
);

router.delete(
  "/:id",
  allowRoles("school_admin", "teacher"),
  deleteNotification
);

/* all logged-in users */
router.get("/", listNotifications);

router.post(
  "/:id/acknowledge",
  protect,
  acknowledgeNotification
);

router.get(
  "/:id/acknowledgements",
  protect,
  listNotificationAcks
);

export default router;
