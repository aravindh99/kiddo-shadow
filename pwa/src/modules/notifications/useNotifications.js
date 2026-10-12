import { useEffect, useState } from "react";
import {
  getNotifications,
  acknowledgeNotification,
} from "./notifications.api";

export function useNotifications(params = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isStudentRoute =
    typeof window !== "undefined" &&
    (window.location.pathname.startsWith("/student") ||
      window.location.pathname.startsWith("/students"));

  useEffect(() => {
    fetchNotifications();
    const handler = () => fetchNotifications();
    window.addEventListener("notifications:refresh", handler);
    return () => window.removeEventListener("notifications:refresh", handler);
  }, [isStudentRoute, JSON.stringify(params)]);

  async function fetchNotifications() {
    const isStudentDemoRoute = isStudentRoute;
    const hasToken =
      typeof window !== "undefined" && !!localStorage.getItem("token");

    if (isStudentDemoRoute && !hasToken) {
      setItems([
        {
          id: "demo-notice-1",
          title: "Welcome to Demo Mode",
          message: "Notifications are mocked because this route runs without login.",
          is_acknowledged: false,
          created_at: new Date().toISOString(),
        },
      ]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await getNotifications(params);
      setItems(res.data.data || res.data.items || res.data);
      setError(null);
    } catch (err) {
      if (
        err?.response?.status === 401 ||
        err?.code === "ERR_NETWORK" ||
        !err?.response
      ) {
        setItems([]);
        setError(null);
      } else {
        setError("Failed to load notifications");
      }
    } finally {
      setLoading(false);
    }
  }

  async function acknowledge(id) {
    const hasToken =
      typeof window !== "undefined" && !!localStorage.getItem("token");
    if (!hasToken) {
      setItems((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, is_acknowledged: true }
            : n
        )
      );
      return;
    }

    await acknowledgeNotification(id);
    setItems((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, is_acknowledged: true }
          : n
      )
    );
    window.dispatchEvent(new Event("notifications:refresh"));
  }

  return {
    items,
    loading,
    error,
    acknowledge,
    refresh: fetchNotifications,
  };
}
