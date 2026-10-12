import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { getQuizHistory } from "./api/quiz.api";

const COMPULSORY_QUIZ_DAYS = new Set([3, 5]);

function isCompulsoryQuizDay(date = new Date()) {
  return COMPULSORY_QUIZ_DAYS.has(date.getDay());
}

function isSameLocalDay(dateValue, referenceDate) {
  if (!dateValue) return false;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return false;

  return (
    parsed.getFullYear() === referenceDate.getFullYear() &&
    parsed.getMonth() === referenceDate.getMonth() &&
    parsed.getDate() === referenceDate.getDate()
  );
}

function hasCompletedQuizToday(items, today) {
  return items.some((item) => {
    const status = String(item?.status || "").toUpperCase();
    const completedAt = item?.ended_at || item?.completed_at || item?.updated_at;

    if (completedAt && isSameLocalDay(completedAt, today)) {
      return true;
    }

    return ["FINISHED", "COMPLETED"].includes(status) && isSameLocalDay(item?.started_at, today);
  });
}

export default function StudentWeeklyQuizGate() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [quizCompletedToday, setQuizCompletedToday] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);

  const basePath = useMemo(
    () => (location.pathname.startsWith("/students") ? "/students" : "/student"),
    [location.pathname]
  );
  const isQuizRoute = location.pathname.startsWith(`${basePath}/quiz`);
  const shouldEnforce = isCompulsoryQuizDay();

  useEffect(() => {
    if (!shouldEnforce) {
      setQuizCompletedToday(false);
      setCheckFailed(false);
      setLoading(false);
      return undefined;
    }

    let active = true;

    async function load() {
      setLoading(true);

      try {
        const res = await getQuizHistory({ limit: 20 });
        if (!active) return;

        const items = Array.isArray(res?.data?.items) ? res.data.items : [];
        setQuizCompletedToday(hasCompletedQuizToday(items, new Date()));
        setCheckFailed(false);
      } catch (error) {
        console.error("Failed to verify compulsory quiz status", error);
        if (!active) return;
        setQuizCompletedToday(false);
        setCheckFailed(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [location.key, shouldEnforce]);

  if (!shouldEnforce) return null;

  if (loading) {
    return <CircularProgress size={20} sx={{ position: "fixed", right: 16, bottom: 90, zIndex: 1400 }} />;
  }

  if (checkFailed || quizCompletedToday || isQuizRoute) {
    return null;
  }

  return (
    <Navigate
      to={`${basePath}/quiz`}
      replace
      state={{
        weeklyQuizRequired: true,
        requiredDays: ["Wednesday", "Friday"],
        redirectFrom: location.pathname,
      }}
    />
  );
}
