import { Op } from "sequelize";
import Student from "./student.model.js";
import Section from "../sections/section.model.js";
import AppError from "../../shared/appError.js";

export const assertSectionCapacity = async ({
  section_id,
  exclude_student_id = null,
}) => {
  const section = await Section.findByPk(section_id);

  if (!section || !section.is_active) {
    throw new AppError("Section not available", 400);
  }

  const where = {
    section_id,
    is_active: true,
  };

  if (exclude_student_id) {
    where.id = { [Op.ne]: exclude_student_id };
  }

  const count = await Student.count({ where });

  if (count >= section.capacity) {
    throw new AppError(
      `Section capacity exceeded (max ${section.capacity})`,
      409
    );
  }
};
