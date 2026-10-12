import {
  requestTeacherProfileUpdateService,
  approveTeacherProfileService,
} from "./teacher.approval.service.js";

/* TEACHER */
export const requestTeacherProfileUpdate = async (req, res, next) => {
  try {
    const result = await requestTeacherProfileUpdateService(
      req.user.id,
      req.body
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
};

/* ADMIN */
export const approveTeacherProfile = async (req, res, next) => {
  try {
    const result = await approveTeacherProfileService({
      teacher_id: req.params.teacher_id,
      admin_user_id: req.user.id,
      school_id: req.user.school_id,
      action: req.body.action,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
};
