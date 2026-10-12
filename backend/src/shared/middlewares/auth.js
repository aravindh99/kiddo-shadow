import jwt from "jsonwebtoken";
import User from "../../modules/users/user.model.js";
import School from "../../modules/schools/school.model.js";
import Teacher from "../../modules/teachers/teacher.model.js";
import Student from "../../modules/students/student.model.js";
import AppError from "../appError.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (process.env.AUTH_BYPASS === "true" && (!header || !header.startsWith("Bearer "))) {
      const bypassId = Number(process.env.AUTH_BYPASS_USER_ID || 1);
      const identity = {
        id: Number.isFinite(bypassId) && bypassId > 0 ? bypassId : 1,
        role: process.env.AUTH_BYPASS_ROLE || "student",
        school_id: null,
        first_login: false,
      };
      if (identity.role === "teacher") {
        const teacher = await Teacher.findOne({ where: { user_id: identity.id } });
        if (teacher) {
          identity.teacher_id = teacher.id;
          identity.school_id = teacher.school_id;
        }
      }
      if (identity.role === "student") {
        const student = await Student.findOne({
          where: { user_id: identity.id },
          attributes: ["id", "class_id", "section_id", "school_id"],
        });
        if (student) {
          identity.student_id = student.id;
          identity.class_id = student.class_id;
          identity.section_id = student.section_id;
          identity.school_id = student.school_id;
        }
      }
      req.user = identity;
      return next();
    }

    // 1️⃣ Extract token
    if (!header || !header.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }

    const token = header.split(" ")[1];

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Load user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError("User not found", 401);
    }

    if (!user.is_active) {
      throw new AppError("User is inactive", 401);
    }

    // 4️⃣ School-level hard stop (except super_admin)
    if (user.role !== "super_admin") {
      const school = await School.findByPk(user.school_id);

      if (!school || school.status !== "active") {
        throw new AppError(`Forbidden: School ${user.school_id} is ${school ? school.status : 'missing'}`, 403);
      }
    }

    // 5️⃣ Attach trusted identity + profile IDs (used across services)
    const identity = {
      id: user.id,
      role: user.role,
      school_id: user.school_id,
      first_login: user.first_login,
    };

    if (user.role === "teacher") {
      const teacher = await Teacher.findOne({
        where: { user_id: user.id, school_id: user.school_id },
      });
      if (!teacher) {
        throw new AppError("Teacher profile not found", 401);
      }
      identity.teacher_id = teacher.id;
    }

    if (user.role === "student") {
      const student = await Student.findOne({
        where: { user_id: user.id, school_id: user.school_id },
        attributes: ["id", "class_id", "section_id"],
      });
      if (!student) {
        throw new AppError("Student profile not found", 401);
      }
      identity.student_id = student.id;
      identity.class_id = student.class_id;
      identity.section_id = student.section_id;
    }

    req.user = identity;

    next();
  } catch (err) {
    next(err); // 🔥 forward EVERYTHING to global errorHandler
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(`Forbidden: Role ${req.user?.role} is not authorized to perform this action.`, 403);
    }
    next();
  };
}
