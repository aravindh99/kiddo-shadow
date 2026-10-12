import AppError from "../appError.js";
import TeacherAssignment from "../../modules/teacher-assignments/teacher-assignment.model.js";

/**
 * Admin OR class teacher of the given class
 */
export const allowAdminOrClassTeacher = async (req, res, next) => {
  if (req.user.role === "school_admin") return next();

  const classId =
    req.body.class_id ||
    req.query.class_id ||
    req.params.class_id;

  if (!classId) {
    throw new AppError("class_id is required for permission check", 400);
  }

  const assignment = await TeacherAssignment.findOne({
    where: {
      class_id: classId,
      teacher_id: req.user.teacher_id,
      school_id: req.user.school_id,
      is_class_teacher: true,
      is_active: true,
    },
  });

  if (!assignment) {
    throw new AppError(
      "You are not allowed to manage this class",
      403
    );
  }

  next();
};

/**
 * Admin OR class teacher of section's class
 */
export const allowAdminOrSectionClassTeacher = async (
  req,
  res,
  next
) => {
  if (req.user.role === "school_admin") return next();

  const sectionId =
    req.body.section_id ||
    req.query.section_id ||
    req.params.section_id;

  if (!sectionId) {
    throw new AppError(
      "section_id is required for permission check",
      400
    );
  }

  const assignment = await TeacherAssignment.findOne({
    where: {
      section_id: sectionId,
      teacher_id: req.user.teacher_id,
      school_id: req.user.school_id,
      is_class_teacher: true,
      is_active: true,
    },
  });

  if (!assignment) {
    throw new AppError(
      "You are not allowed to manage this section",
      403
    );
  }

  next();
};
