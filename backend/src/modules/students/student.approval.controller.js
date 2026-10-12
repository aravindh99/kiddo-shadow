import {
  requestStudentProfileUpdateService,
  approveStudentProfileService,
} from "./student.approval.service.js";

/* STUDENT */
export const requestStudentProfileUpdate = async (req, res, next) => {
  try {
    const result = await requestStudentProfileUpdateService(
      req.user.id,
      req.body
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
};

/* TEACHER */
export const approveStudentProfile = async (req, res, next) => {
  try {
    const result = await approveStudentProfileService({
      student_id: req.params.student_id,
      teacher_user_id: req.user.id,
      teacher_id: req.user.teacher_id,
      school_id: req.user.school_id,
      action: req.body.action,
      remark: req.body.remark,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
};
