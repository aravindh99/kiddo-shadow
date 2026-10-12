import db from "../../config/db.js";
import Parent from "./parent.model.js";
import User from "../users/user.model.js";

export const bulkApproveParentsService = async ({
  parent_ids,
  action,
  admin_user_id,
  school_id,
}) => {
  return db.transaction(async (t) => {
    // check caller (admin) exists and has allowed role
    const adminUser = await User.findByPk(admin_user_id, { transaction: t });
    console.log(
      "bulkApproveParentsService called by:",
      admin_user_id,
      adminUser ? adminUser.role : null
    );

    if (!adminUser) {
      const err = new Error("Forbidden: admin user not found");
      err.statusCode = 403;
      throw err;
    }

    const allowedRoles = ["school_admin", "super_admin"];
    if (!allowedRoles.includes(adminUser.role)) {
      const err = new Error("Forbidden: insufficient role");
      err.statusCode = 403;
      throw err;
    }

    if (
      adminUser.role !== "super_admin" &&
      String(adminUser.school_id) !== String(school_id)
    ) {
      const err = new Error("Forbidden: cross-school access");
      err.statusCode = 403;
      throw err;
    }

    const parents = await Parent.findAll({
      where: {
        id: parent_ids,
        approval_status: "pending",
      },
      include: [
        {
          model: User,
          required: true,
          where: { school_id },
          attributes: ["id"],
        },
      ],
      transaction: t,
    });

    if (!parents.length) {
      return { processed: 0 };
    }

    const parentUserIds = parents.map((p) => p.user_id);

    await Parent.update(
      {
        approval_status: action === "approve" ? "approved" : "rejected",
        approved_by: admin_user_id,
        approved_at: new Date(),
      },
      {
        where: { id: parents.map((p) => p.id), approval_status: "pending" },
        transaction: t,
      }
    );

    if (action === "approve") {
      await User.update(
        { is_active: true },
        {
          where: {
            id: parentUserIds,
            school_id,
          },
          transaction: t,
        }
      );
    }

    return { processed: parents.length };
  });
};
