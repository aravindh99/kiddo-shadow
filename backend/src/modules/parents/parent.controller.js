import jwt from "jsonwebtoken";
import {
  createParentAndLinkService,
  linkExistingParentService,
  updateParentProfileService,
  listParentsService,
  listParentOptionsService,
} from "./parent.service.js";
import { listApprovedParentLinks } from "./parent.family.service.js";
import Parent from "./parent.model.js";
import { triggerNewProfileNotification } from "../notifications/notification-trigger.service.js";

/* =========================
   ADMIN
========================= */
export const createParentAndLink = async (req, res, next) => {
  try {
    const result = await createParentAndLinkService({
      school_id: req.user.school_id,
      ...req.body,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

export const linkExistingParent = async (req, res, next) => {
  try {
    const result = await linkExistingParentService({
      school_id: req.user.school_id,
      ...req.body,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

export const listParents = async (req, res, next) => {
  try {
    const result = await listParentsService({
      school_id: req.user.school_id,
      query: req.query,
    });

    res.json({
      total: result.count,
      items: result.rows,
    });
  } catch (e) {
    next(e);
  }
};

export const listParentOptions = async (req, res, next) => {
  try {
    const result = await listParentOptionsService({
      school_id: req.user.school_id,
    });

    res.json({
      total: result.length,
      items: result,
    });
  } catch (e) {
    next(e);
  }
};

/* =========================
   PARENT
========================= */
export const updateParentProfile = async (req, res, next) => {
  try {
    const user = await updateParentProfileService(req.user.id, req.body);

    // Check if it was a profile completion (assuming first_login was updated to false)
    if (req.body.name || req.body.phone) {
      // Force update first_login to false if not handled in service or to be safe
      await user.update({ first_login: false });
    }

    // Explicitly handle email update here if not handled in service (service does user.update(data))
    // So if email is in req.body, it should be updated by service.

    // Just verifying service implementation:
    // export const updateParentProfileService = async (user_id, data) => { ... await user.update(data); ... }
    // Yes, it updates whatever is in data.

    // Check if we need to do anything specific for email? No.

    const token = jwt.sign(
      {
        id: user.id,
      role: user.role,
      school_id: user.school_id,
      iat: Date.now(),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  // Send notification to school admin if this is their first login completion
  if (req.user.first_login) {
    try {
      await triggerNewProfileNotification({
        school_id: user.school_id,
        sender_user_id: user.id,
        sender_role: "parent",
        user_name: user.name,
      });
    } catch (notifErr) {
      console.error("Failed to send notification:", notifErr);
    }
  }

    res.json({ message: "Profile updated", token, user });
  } catch (e) {
    next(e);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const User = (await import("../users/user.model.js")).default;
    const parentUser = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "role",
        "school_id",
        "username",
        "name",
        "phone",
        "email",
        "avatar_url",
        "first_login",
        "is_active",
      ],
    });

    if (!parentUser) {
      return res.json(req.user);
    }

    const parentLinks = await Parent.findAll({
      where: { user_id: req.user.id },
      attributes: ["id", "student_id", "relation_type", "approval_status"],
      order: [["created_at", "ASC"]],
    });
    const rawParentLinks = parentLinks.map((link) => link.toJSON());
    const approvalStatus = rawParentLinks.length > 0 ? rawParentLinks[0].approval_status : "pending";

    const links = await listApprovedParentLinks({
      parent_user_id: req.user.id,
      school_id: req.user.school_id,
      includeStudentDetails: true,
    });

    const uniqueStudents = [];
    const seenStudentIds = new Set();

    for (const link of links) {
      const student = (link.student ?? link.Student)?.toJSON?.() || (link.student ?? link.Student);
      const studentId = Number(student?.id);
      if (!Number.isFinite(studentId) || seenStudentIds.has(studentId)) continue;
      seenStudentIds.add(studentId);
      uniqueStudents.push(student);
    }

    const linkedStudentUser =
      uniqueStudents[0]?.user ||
      uniqueStudents[0]?.User ||
      {};
    const resolvedPhone = parentUser.phone || linkedStudentUser.phone || "";
    const primaryStudent = uniqueStudents[0] || null;

    res.json({
      ...parentUser.toJSON(),
      approval_status: approvalStatus,
      parent_links: rawParentLinks,
      relation_type: links[0]?.relation_type || rawParentLinks[0]?.relation_type || "guardian",
      student: primaryStudent,
      linked_students: uniqueStudents,
      phone: resolvedPhone,
      user: {
        ...parentUser.toJSON(),
        approval_status: approvalStatus,
        phone: resolvedPhone,
      },
    });
  } catch (e) {
    next(e);
  }
};
