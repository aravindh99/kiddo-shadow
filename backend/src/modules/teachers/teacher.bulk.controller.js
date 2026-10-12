import { bulkApproveTeachersService } from "./teacher.bulk.service.js";

export const bulkApproveTeachers = async (req, res, next) => {
  try {
    const result = await bulkApproveTeachersService({
      ...req.body,
      admin_user_id: req.user.id,
      school_id: req.user.school_id,
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
};
