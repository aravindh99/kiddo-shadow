import Section from "./section.model.js";
import Class from "../classes/classes.model.js";

/* =========================
   ADMIN: CREATE SECTION
========================= */
export const createSectionService = async ({
  school_id,
  class_id,
  name,
}) => {
  const cls = await Class.findOne({
    where: { id: class_id, school_id },
  });

  if (!cls) {
    return { error: "CLASS_NOT_FOUND" };
  }

  const normalizedName = name.trim().toUpperCase();

  const exists = await Section.findOne({
    where: {
      school_id,
      class_id,
      name: normalizedName,
    },
  });

  if (exists) {
    return { error: "SECTION_EXISTS" };
  }

  const section = await Section.create({
    school_id,
    class_id,
    name: normalizedName,
  });

  return { section };
};

/* =========================
   ADMIN: LIST SECTIONS BY CLASS
========================= */
export const listSectionsService = async ({ school_id, class_id }) => {
  return Section.findAndCountAll({
    where: { school_id, class_id },
    order: [["name", "ASC"]],
  });
};

/* =========================
   ADMIN: ACTIVATE / DEACTIVATE
========================= */
export const updateSectionStatusService = async ({
  school_id,
  section_id,
  is_active,
}) => {
  const section = await Section.findOne({
    where: { id: section_id, school_id },
  });

  if (!section) {
    return null;
  }

  section.is_active = is_active;
  await section.save();

  return section;
};
