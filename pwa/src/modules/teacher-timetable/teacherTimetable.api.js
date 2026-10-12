import api from "../../api/axios";

export const getMyTeacherTimetable = () =>
  api.get("/timetables/teacher/me");

export const saveTimetable = (data) =>
  api.post("/timetables", data);

export const getMyTeacherAssignments = () =>
  api.get("/teacher-assignments/teacher/me");

export const getSectionAssignments = (sectionId) =>
  api.get(`/teacher-assignments/section/${sectionId}`);

export const getSectionTimetable = (classId, sectionId) =>
  api.get(`/timetables/section`, { params: { class_id: classId, section_id: sectionId } });

export const getSubstituteTeachers = (sectionId, dayOfWeek, startTime, endTime) =>
  api.get(`/teacher-assignments/section/${sectionId}`, {
    params: {
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      substitute_mode: true
    }
  });
