import { useEffect, useState } from "react";
import { getTimetable } from "./timetable.api";
import { useAuth } from "../../auth/AuthProvider";
import { useParentChild } from "../parents/ParentChildContext";

export function useTimetable() {
  const { user } = useAuth();
  const { selectedChild, loading: parentChildLoading } = useParentChild();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.role) return;
    if (user.role === "parent" && parentChildLoading) {
      setLoading(true);
      return;
    }
    fetchTimetable();
  }, [user?.role, selectedChild?.id, selectedChild?.classId, selectedChild?.sectionId, parentChildLoading]);

  async function fetchTimetable() {
    try {
      setLoading(true);
      setError(null);

      const classId = user?.role === "parent" ? selectedChild?.classId : user?.class_id;
      const sectionId = user?.role === "parent" ? selectedChild?.sectionId : user?.section_id;

      if (!classId || !sectionId) {
        if (user?.role === "parent") {
          setTimetable(null);
          return;
        }

        setError("Missing class/section context for timetable.");
        setTimetable(null);
        return;
      }

      const params = {
        class_id: classId,
        section_id: sectionId,
      };

      const res = await getTimetable(params);
      setTimetable(res?.data?.data ?? res?.data ?? null);
    } catch {
      setError("Failed to load timetable");
    } finally {
      setLoading(false);
    }
  }

  return {
    timetable,
    loading,
    error,
  };
}
