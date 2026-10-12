import Exam from "./exam.model.js";
import ExamTimetable from "./exam-timetable.model.js";
import Subject from "../subjects/subject.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";

export const createExamService = async ({
  school_id,
  class_id,
  name,
  start_date,
  end_date,
}) => {
  const exists = await Exam.findOne({
    where: { school_id, class_id, name },
  });

  if (exists) throw new AppError("EXAM_EXISTS", 409);

  const exam = await Exam.create({
    school_id,
    class_id,
    name,
    start_date,
    end_date,
  });

  return exam;
};

export const lockExamService = async ({ exam_id, school_id }) => {
  const exam = await Exam.findOne({
    where: { id: exam_id, school_id },
  });
  if (!exam) throw new AppError("EXAM_NOT_FOUND", 404);

  exam.is_locked = true;
  await exam.save();

  return exam;
};

export const listExamsByClassService = async ({
  school_id,
  class_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);

  const whereClause = { school_id };
  if (class_id) whereClause.class_id = class_id;

  return Exam.findAndCountAll({
    where: whereClause,
    order: [["start_date", "DESC"]],
    limit,
    offset,
  });
};

export const addTimetableEntryService = async ({ exam_id, school_id, entries }) => {
  const exam = await Exam.findOne({ where: { id: exam_id, school_id } });
  if (!exam) throw new AppError("EXAM_NOT_FOUND", 404);

  // Clear existing to recreate
  await ExamTimetable.destroy({ where: { exam_id } });

  const toCreate = entries.map(e => ({
    exam_id,
    subject_id: e.subject_id,
    exam_date: e.exam_date,
    start_time: e.start_time || null,
    end_time: e.end_time || null,
    max_marks: e.max_marks || null,
    passing_marks: e.passing_marks || null,
  }));

  await ExamTimetable.bulkCreate(toCreate);

  return ExamTimetable.findAll({
    where: { exam_id },
    include: [{ model: Subject, attributes: ["id", "name"] }],
    order: [["exam_date", "ASC"]],
  });
};

export const listExamTimetableService = async ({ exam_id, school_id }) => {
  const exam = await Exam.findOne({ where: { id: exam_id, school_id } });
  if (!exam) throw new AppError("EXAM_NOT_FOUND", 404);

  return ExamTimetable.findAll({
    where: { exam_id },
    include: [{ model: Subject, attributes: ["id", "name"] }],
    order: [["exam_date", "ASC"]],
  });
};
