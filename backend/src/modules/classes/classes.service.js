// src/modules/classes/classes.service.js
import Class from "./classes.model.js";
import Section from "../sections/section.model.js";
import Teacher from "../teachers/teacher.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import User from "../users/user.model.js";

export const createClassService = async ({
  school_id,
  class_name,
}) => {
  return await Class.create({
    school_id,
    class_name,
  });
};

export const getClassesService = async (school_id) => {
  return await Class.findAndCountAll({
    where: { school_id },
    include: [
      {
        model: Section,
        attributes: ["id", "name", "is_active"],
      },
    ],
    order: [["class_name", "ASC"]],
  });
};

export const getClassByIdService = async (id, school_id) => {
  return await Class.findOne({
    where: { id, school_id },
    include: [
      {
        model: Section,
        attributes: ["id", "name", "is_active"],
      },
    ],
  });
};

export const updateClassService = async (id, school_id, payload) => {
  const cls = await Class.findOne({ where: { id, school_id } });

  if (!cls) return null;

  await cls.update(payload);
  return cls;
};

export const deleteClassService = async (id, school_id) => {
  const cls = await Class.findOne({ where: { id, school_id } });

  if (!cls) return null;

  await cls.destroy();
  return true;
};

/* =========================
   ADMIN: LOGIN ROSTER
========================= */
export const getLoginRosterService = async ({ school_id, query }) => {
  const classWhere = { school_id };
  if (query?.class_id) classWhere.id = Number(query.class_id);

  const sectionWhere = {};
  const filterSection = query?.section_id;
  if (filterSection) sectionWhere.id = Number(filterSection);

  const [teachers, classes] = await Promise.all([
    Teacher.findAll({
      where: { school_id },
      include: [
        {
          model: User,
          required: true,
          attributes: ["id", "username", "name", "is_active"],
        },
      ],
      order: [[User, "username", "ASC"]],
    }),
    Class.findAll({
      where: classWhere,
      include: [
        {
          model: Teacher,
          required: false,
          attributes: ["id", "user_id", "approval_status", "is_active"],
          include: [
            {
              model: User,
              required: true,
              attributes: ["id", "username", "name", "is_active"],
            },
          ],
        },
        {
          model: Section,
          required: Boolean(filterSection),
          where: filterSection ? sectionWhere : undefined,
          attributes: ["id", "name", "is_active"],
          include: [
            {
              model: Student,
              required: false,
              where: { school_id },
              attributes: [
                "id",
                "class_id",
                "section_id",
                "roll_no",
                "admission_no",
                "approval_status",
                "is_active",
              ],
              include: [
                {
                  model: User,
                  required: true,
                  attributes: ["id", "username", "name", "is_active"],
                },
                {
                  model: Parent,
                  required: false,
                  attributes: ["id", "relation_type", "approval_status"],
                  include: [
                    {
                      model: User,
                      required: true,
                      where: { school_id },
                      attributes: ["id", "username", "name", "is_active"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [["class_name", "ASC"]],
    }),
  ]);

  return { teachers, classes };
};
