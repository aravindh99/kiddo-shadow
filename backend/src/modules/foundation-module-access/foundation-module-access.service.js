import AppError from "../../shared/appError.js";
import Class from "../classes/classes.model.js";
import Parent from "../parents/parent.model.js";
import Student from "../students/student.model.js";

export const FOUNDATION_MIN_AGE = 6;
export const FOUNDATION_MAX_AGE = 7;
export const FOUNDATION_MODES = ["basic", "professional"];

function calculateAgeFromDob(dob) {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

async function resolveStudentForUser({ user, query }) {
  if (user.role === "student") {
    return (
      (await Student.findOne({
        where: { user_id: user.id },
        attributes: ["id", "class_id", "dob"],
        include: [{ model: Class, attributes: ["id", "class_name"] }],
      })) || null
    );
  }

  if (user.role === "parent") {
    const requestedStudentId = Number(query?.student_id);
    const where = { user_id: user.id };

    if (Number.isFinite(requestedStudentId) && requestedStudentId > 0) {
      where.student_id = requestedStudentId;
    }

    const parentLink = await Parent.findOne({
      where,
      include: [
        {
          model: Student,
          attributes: ["id", "class_id", "dob"],
          include: [{ model: Class, attributes: ["id", "class_name"] }],
        },
      ],
      order: [["student_id", "ASC"]],
    });

    return parentLink?.student || null;
  }

  throw new AppError("Unsupported role", 403);
}

function buildAvailability(eligible) {
  return {
    supported_age_range: {
      min: FOUNDATION_MIN_AGE,
      max: FOUNDATION_MAX_AGE,
    },
    supported_modes: FOUNDATION_MODES,
    reason: eligible
      ? "Eligible for this module."
      : `This module is currently available only for students aged ${FOUNDATION_MIN_AGE} to ${FOUNDATION_MAX_AGE}.`,
  };
}

export async function buildFoundationModuleResponse({
  user,
  query,
  mode = "basic",
  moduleDefinition,
}) {
  const selectedMode = FOUNDATION_MODES.includes(mode) ? mode : "basic";
  const student = await resolveStudentForUser({ user, query });
  const age = calculateAgeFromDob(student?.dob);
  const eligible =
    age !== null && age >= FOUNDATION_MIN_AGE && age <= FOUNDATION_MAX_AGE;

  return {
    module: {
      id: moduleDefinition.id,
      title: moduleDefinition.title,
      summary: moduleDefinition.summary,
      mode: selectedMode,
      delivery:
        selectedMode === "professional"
          ? moduleDefinition.professional_delivery
          : moduleDefinition.basic_delivery,
    },
    eligible,
    student: {
      id: student?.id ?? null,
      dob: student?.dob ?? null,
      age,
    },
    class: {
      id: student?.class?.id ?? null,
      name: student?.class?.class_name ?? null,
    },
    availability: buildAvailability(eligible),
  };
}
