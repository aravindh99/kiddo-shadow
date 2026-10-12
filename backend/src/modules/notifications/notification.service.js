import Notification from "./notification.model.js";
import NotificationAck from "./notification-ack.model.js";
import AppError from "../../shared/appError.js";
import { Op } from "sequelize";
import User from "../users/user.model.js";
import School from "../schools/school.model.js";

export const createNotificationService = async ({
  school_id,
  sender_user_id,
  sender_role,
  title,
  message,
  target_role,
  target_user_id,
  class_id,
  section_id,
}) => {
  /* Role enforcement */
  if (sender_role === "teacher" && target_role === "teacher") {
    throw new AppError("Teachers cannot notify other teachers", 403);
  }

  if (sender_role !== "school_admin" && sender_role !== "teacher") {
    throw new AppError("Not allowed to send notifications", 403);
  }

  const notification = await Notification.create({
    school_id,
    sender_user_id,
    sender_role,
    title,
    message,
    target_role,
    target_user_id,
    class_id,
    section_id,
  });

  return notification;
};


export const listNotificationsForUserService = async ({
  school_id,
  user_role,
  user_id,
  class_ids = [],
  section_ids = [],
  tab = "received",
  status,
  date_filter,
  limit = 50,
  offset = 0,
}) => {
  const baseWhere = { school_id };

  if (date_filter) {
    const now = new Date();
    let past = new Date();
    if (date_filter === "today") {
      past.setHours(0,0,0,0);
    } else if (date_filter === "yesterday") {
      past.setDate(now.getDate() - 1);
      past.setHours(0,0,0,0);
      const endYesterday = new Date(past);
      endYesterday.setHours(23,59,59,999);
      baseWhere.created_at = { [Op.between]: [past, endYesterday] };
    } else if (date_filter === "last_7_days") {
      past.setDate(now.getDate() - 7);
    } else if (date_filter === "last_30_days") {
      past.setDate(now.getDate() - 30);
    }
    
    if (date_filter !== "yesterday") {
      baseWhere.created_at = { [Op.gte]: past };
    }
  }

  if (tab === "sent") {
    // Sent tab: Show only notifications sent by this user
    baseWhere.sender_user_id = user_id;
  } else {
    // Received tab: Show notifications targeted at this user
    if (user_role !== "school_admin" && user_role !== "super_admin") {
      const roleTargets = [user_role, "all"];
      const audienceFilter = { target_role: { [Op.in]: roleTargets } };

      const scopeConditions = [{ class_id: null }];
      if (class_ids.length) scopeConditions.push({ class_id: { [Op.in]: class_ids } });
      if (section_ids.length) scopeConditions.push({ section_id: { [Op.in]: section_ids } });

      const scopedAudienceWhere = {
        [Op.and]: [
          audienceFilter, 
          { [Op.or]: scopeConditions },
          { sender_user_id: { [Op.ne]: user_id } }, // Hide notifications sent by the user themselves
          {
            [Op.or]: [
              { target_user_id: null },
              { target_user_id: user_id }
            ]
          }
        ],
      };

      baseWhere[Op.and] = scopedAudienceWhere[Op.and];
    } else {
       // Admins receive everything by default but we exclude what they sent
       baseWhere.sender_user_id = { [Op.ne]: user_id };
    }
  }

  // Handle status (read/unread) via includes
  const includeAcks = {
    model: NotificationAck,
    attributes: ["id", "user_id", "acknowledged_at"],
    required: status === "read", // Inner join if we only want read ones
    where: { user_id },
  };

  if (status === "unread") {
     // Ensure no ack exists by using a left join and filtering by ack.id = null
     includeAcks.required = false;
     baseWhere['$notification_acks.id$'] = null;
  } else if (!status) {
     includeAcks.required = false;
  }

  return Notification.findAndCountAll({
    where: baseWhere,
    limit,
    offset,
    include: [
      {
        model: User,
        attributes: ["id", "name", "avatar_url", "role"],
        required: false,
      },
      {
        model: School,
        attributes: ["id", "school_name", "logo_url"],
        required: false,
      },
      includeAcks,
    ],
    order: [["created_at", "DESC"]],
    subQuery: false,
  });
};

export const updateNotificationService = async (id, payload, user_id, user_role) => {
  const notification = await Notification.findByPk(id);
  if (!notification) throw new AppError("Notification not found", 404);

  if (user_role === "teacher" && notification.sender_user_id !== user_id) {
    throw new AppError("Not authorized to update this notification", 403);
  }

  await notification.update(payload);
  return notification;
};

export const deleteNotificationService = async (id, user_id, user_role) => {
  const notification = await Notification.findByPk(id);
  if (!notification) throw new AppError("Notification not found", 404);

  if (user_role === "teacher" && notification.sender_user_id !== user_id) {
    throw new AppError("Not authorized to delete this notification", 403);
  }

  await notification.destroy();
  return true;
};
