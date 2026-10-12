import asyncHandler from "../../shared/asyncHandler.js";
import {
  acknowledgeNotificationService,
  listNotificationAcksService,
} from "./notification-ack.service.js";

/* ACKNOWLEDGE */
export const acknowledgeNotification = asyncHandler(async (req, res) => {
  await acknowledgeNotificationService({
    notification_id: req.params.id,
    user_id: req.user.id,
    user_role: req.user.role,
    school_id: req.user.school_id,
  });

  res.json({
    success: true,
    message: "Acknowledged",
  });
});

/* VIEW ACKS */
export const listNotificationAcks = asyncHandler(async (req, res) => {
  const data = await listNotificationAcksService({
    notification_id: req.params.id,
    requester: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
