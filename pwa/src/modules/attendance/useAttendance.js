import { useEffect, useState } from "react";
import {
  getTeacherAttendanceSummary,
  getParentAttendanceSummary,
  getStudentAttendanceSummary,
} from "./attendance.api";
import { useAuth } from "../../auth/AuthProvider";

export function useAttendance(filters = {}) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.role) return;
    fetchAttendance();
  }, [user?.role, JSON.stringify(filters)]);

  async function fetchAttendance() {
    try {
      setLoading(true);

      const buildSummary = (items = []) => {
        const counts = items.reduce(
          (acc, item) => {
            const status = (item?.status || "").toLowerCase();
            if (status === "present") acc.present += 1;
            else if (status === "absent") acc.absent += 1;
            else if (status === "leave") acc.leave += 1;
            else if (status === "on_duty") acc.on_duty += 1;
            return acc;
          },
          { present: 0, absent: 0, leave: 0, on_duty: 0 }
        );

        const total_days = items.length;
        const effectivePresent = counts.present + counts.on_duty;
        const percentage = total_days ? (effectivePresent / total_days) * 100 : 0;

        return { total_days, percentage, ...counts };
      };

      const params = { limit: 100, ...filters };

      if (user.role === "teacher") {
        const res = await getTeacherAttendanceSummary(params);
        const items = res.data?.items || [];
        setSummary(buildSummary(items));
        setDetails(items);
        return;
      }

      if (user.role === "parent") {
        const res = await getParentAttendanceSummary(params);
        const items = res.data?.items || [];
        setSummary(buildSummary(items));
        setDetails(items);
        return;
      }

      if (user.role === "student") {
        const res = await getStudentAttendanceSummary(params);
        const items = res.data?.items || [];
        setSummary(buildSummary(items));
        setDetails(items);
        return;
      }

      setSummary(null);
      setDetails([]);
      setError("Attendance summary not available for this role.");
    } catch {
      setError("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }

  return {
    summary,
    details,
    loading,
    error,
  };
}
