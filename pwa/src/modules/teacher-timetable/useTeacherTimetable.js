import { useEffect, useState } from "react";
import { getMyTeacherTimetable } from "./teacherTimetable.api";
import { useAuth } from "../../auth/AuthProvider";

export function useTeacherTimetable() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimetable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  async function fetchTimetable() {
    if (user?.role !== "teacher") {
      setTimetable([]);
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      const res = await getMyTeacherTimetable();
      const data = res?.data?.data ?? res?.data ?? [];
      // Backend returns object grouped by day; normalise to object
      setTimetable(Array.isArray(data) ? data : data || {});
    } catch (err) {
      console.error(err);
      setError("Failed to load teacher timetable");
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  }

  return {
    timetable,
    loading,
    error,
    refresh: fetchTimetable,
  };
}
