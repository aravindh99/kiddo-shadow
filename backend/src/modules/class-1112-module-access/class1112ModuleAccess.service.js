import AppError from "../../shared/appError.js";
import Class from "../classes/classes.model.js";
import Parent from "../parents/parent.model.js";
import Student from "../students/student.model.js";

export const CLASS_1112_SUPPORTED_CLASSES = [11, 12];
export const CLASS_1112_MODES = ["basic", "professional"];

function normalizeClassNumber(className) {
  if (!className) return null;

  const raw = String(className).trim();
  const digitMatch = raw.match(/\d+/);
  if (digitMatch) {
    const value = Number(digitMatch[0]);
    return Number.isFinite(value) ? value : null;
  }

  const upper = raw.toUpperCase();
  if (upper === "XI" || upper === "CLASS XI" || upper === "STD XI") return 11;
  if (upper === "XII" || upper === "CLASS XII" || upper === "STD XII") return 12;
  return null;
}

async function resolveStudentForUser({ user, query }) {
  if (user.role === "student") {
    return (
      (await Student.findOne({
        where: { user_id: user.id },
        attributes: ["id", "class_id"],
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
          attributes: ["id", "class_id"],
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
    supported_classes: CLASS_1112_SUPPORTED_CLASSES,
    supported_modes: CLASS_1112_MODES,
    reason: eligible
      ? "Eligible for this module."
      : "This module is currently available only for class 11 and class 12 students.",
  };
}

export async function buildClass1112ModuleResponse({
  user,
  query,
  mode = "basic",
  moduleDefinition,
}) {
  const selectedMode = CLASS_1112_MODES.includes(mode) ? mode : "basic";
  const student = await resolveStudentForUser({ user, query });
  const className = student?.class?.class_name ?? null;
  const classNumber = normalizeClassNumber(className);
  const eligible = CLASS_1112_SUPPORTED_CLASSES.includes(classNumber);

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
      class_id: student?.class_id ?? null,
    },
    class: {
      id: student?.class?.id ?? null,
      name: className,
      number: classNumber,
    },
    availability: buildAvailability(eligible),
  };
}
