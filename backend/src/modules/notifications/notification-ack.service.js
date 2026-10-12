import Notification from "./notification.model.js";
import NotificationAck from "./notification-ack.model.js";
import { getPagination } from "../../shared/utils/pagination.js";
import AppError from "../../shared/appError.js";

export const acknowledgeNotificationService = async ({
  notification_id,
  user_id,
  user_role,
  school_id,
}) => {
  if (!["parent", "teacher", "student", "school_admin"].includes(user_role)) {
    throw new AppError("Not allowed to acknowledge", 403);
  }

  const notification = await Notification.findByPk(notification_id);
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }
  if (String(notification.school_id) !== String(school_id)) {
    throw new AppError("Forbidden", 403);
  }

  await NotificationAck.findOrCreate({
    where: {
      notification_id,
      user_id,
    },
    defaults: {
      user_role,
    },
  });

  return true;
};

/* VIEW ACKS (admin / sender teacher) */
export const listNotificationAcksService = async ({
  notification_id,
  requester,
  query,
}) => {
  const notification = await Notification.findByPk(notification_id);
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (String(notification.school_id) !== String(requester.school_id)) {
    throw new AppError("Forbidden", 403);
  }

  // Permission check
  if (
    requester.role !== "school_admin" &&
    notification.sender_user_id !== requester.id
  ) {
    throw new AppError("Not allowed to view acknowledgements", 403);
  }

  const { limit, offset } = getPagination(query);

  return NotificationAck.findAndCountAll({
    where: { notification_id },
    include: [{ model: Notification }],
    order: [["acknowledged_at", "DESC"]],
    limit,
    offset,
  });
};
