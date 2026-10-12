import { useEffect, useState } from "react";
import { getDiary } from "./diary.api";
import { useAuth } from "../../auth/AuthProvider";

export function useDiary(filters = {}) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filterKey = JSON.stringify(filters || {});

  useEffect(() => {
    if (!user) return;
    fetchDiary(filters);
  }, [user, filterKey]);

  async function fetchDiary(activeFilters = {}) {
    try {
      setLoading(true);

      const params = { ...activeFilters };

      const res = await getDiary(params);
      const data = res?.data;
      const nextItems =
        Array.isArray(data?.items) ? data.items :
        Array.isArray(data?.data) ? data.data :
        Array.isArray(data) ? data :
        [];
      setItems(nextItems);
    } catch {
      setError("Failed to load diary");
    } finally {
      setLoading(false);
    }
  }

  return {
    items,
    loading,
    error,
    refresh: () => fetchDiary(filters),
  };
}
