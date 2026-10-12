import Teacher from "../../modules/teachers/teacher.model.js";

export async function resolveTeacherId(user) {
  if (!user) return null;
  if (user.teacher_id) return user.teacher_id;

  if (!user.id || !user.school_id) return null;

  const teacher = await Teacher.findOne({
    where: {
      user_id: user.id,
      school_id: user.school_id,
    },
    attributes: ["id"],
  });

  return teacher?.id || null;
}

