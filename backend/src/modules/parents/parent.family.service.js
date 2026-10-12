import { Op } from "sequelize";
import User from "../users/user.model.js";
import Parent from "./parent.model.js";
import Student from "../students/student.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";

function normalizePhone(phone) {
  const value = String(phone || "").trim();
  return value || null;
}

export async function resolveParentFamilyUserIds({
  parent_user_id,
  school_id,
  transaction,
}) {
  if (!parent_user_id) return [];

  const currentUser = await User.findOne({
    where: {
      id: parent_user_id,
      role: "parent",
      school_id,
    },
    attributes: ["id", "phone"],
    transaction,
  });

  if (!currentUser) {
    return [Number(parent_user_id)];
  }

  const familyPhone = normalizePhone(currentUser.phone);
  if (!familyPhone) {
    return [Number(currentUser.id)];
  }

  const familyUsers = await User.findAll({
    where: {
      role: "parent",
      school_id,
      phone: familyPhone,
    },
    attributes: ["id"],
    transaction,
    order: [["id", "ASC"]],
  });

  const ids = familyUsers
    .map((item) => Number(item.id))
    .filter(Number.isFinite);

  return ids.length ? [...new Set(ids)] : [Number(currentUser.id)];
}

export async function listApprovedParentLinks({
  parent_user_id,
  school_id,
  transaction,
  includeStudentDetails = false,
}) {
  const familyUserIds = await resolveParentFamilyUserIds({
    parent_user_id,
    school_id,
    transaction,
  });

  const studentInclude = includeStudentDetails
    ? [
        {
          model: User,
          attributes: ["id", "name", "username", "is_active", "phone"],
          required: false,
        },
        {
          model: Class,
          attributes: ["id", "class_name"],
          required: false,
        },
        {
          model: Section,
          attributes: ["id", "name"],
          required: false,
        },
      ]
    : [
        {
          model: User,
          attributes: ["id", "name"],
          required: false,
        },
      ];

  return Parent.findAll({
    where: {
      approval_status: "approved",
      user_id:
        familyUserIds.length > 1
          ? { [Op.in]: familyUserIds }
          : familyUserIds[0] || Number(parent_user_id),
    },
    include: [
      {
        model: Student,
        where: { approval_status: "approved", school_id },
        required: true,
        include: studentInclude,
      },
      {
        model: User,
        attributes: ["id", "name", "phone", "email", "avatar_url", "first_login"],
        required: false,
      },
    ],
    transaction,
    order: [["created_at", "ASC"], ["id", "ASC"]],
  });
}
