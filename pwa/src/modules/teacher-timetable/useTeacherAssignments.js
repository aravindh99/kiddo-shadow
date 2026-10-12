import { useEffect, useState } from "react";
import { getMyTeacherAssignments } from "./teacherTimetable.api";

export function useTeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      setLoading(true);
      const res = await getMyTeacherAssignments();
      const data = res?.data?.data ?? res?.data ?? [];
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load assignments");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }

  const classTeacherSections = assignments.filter(
    (a) => a.is_class_teacher
  );

  return {
    assignments,
    classTeacherSections,
    loading,
    error,
    refresh: fetchAssignments,
  };
}
