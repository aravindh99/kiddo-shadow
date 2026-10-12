import db from "../../config/db.js";
import Teacher from "./teacher.model.js";
import User from "../users/user.model.js";

export const bulkApproveTeachersService = async ({
  teacher_ids,
  action,
  admin_user_id,
  school_id,
}) => {
  return db.transaction(async (t) => {
    const teachers = await Teacher.findAll({
      where: {
        id: teacher_ids,
        school_id,
        approval_status: "pending",
      },
      transaction: t,
    });

    if (!teachers.length) {
      return { processed: 0 };
    }

    const teacherUserIds = teachers.map((t) => t.user_id);

    await Teacher.update(
      {
        approval_status: action === "approve" ? "approved" : "rejected",
        approved_by: admin_user_id,
        approved_at: new Date(),
      },
      {
        where: {
          id: teacher_ids,
          school_id,
          approval_status: "pending",
        },
        transaction: t,
      }
    );

    if (action === "approve") {
      await User.update(
        { is_active: true },
        {
          where: {
            id: teacherUserIds,
            school_id,
          },
          transaction: t,
        }
      );
    }

    return { processed: teachers.length };
  });
};
