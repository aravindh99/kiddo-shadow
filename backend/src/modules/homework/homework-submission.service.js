import Homework from "./homework.model.js";
import HomeworkSubmission from "./homework-submission.model.js";
import Student from "../students/student.model.js";
import AppError from "../../shared/appError.js";


export const submitHomeworkService = async ({
  school_id,
  homework_id,
  student_id,
  is_completed,
  remark,
}) => {
  const homework = await Homework.findOne({
    where: { id: homework_id, school_id },
  });

  if (!homework) {
    throw new AppError("HOMEWORK_NOT_FOUND", 404);
  }

  const student = await Student.findOne({
    where: {
      id: student_id,
      school_id,
      class_id: homework.class_id,
      section_id: homework.section_id,
      is_active: true,
    },
  });

  if (!student) {
    throw new AppError("INVALID_STUDENT", 403);
  }

  const [submission, created] = await HomeworkSubmission.findOrCreate({
    where: { homework_id, student_id },
    defaults: { is_completed, remark },
  });

  if (!created) {
    submission.is_completed = is_completed;
    submission.remark = remark;
    await submission.save();
  }

  return submission;
};