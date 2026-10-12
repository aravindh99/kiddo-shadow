import { useEffect, useState } from "react";
import { getReportCard } from "./reportCard.api";

export function useReportCard(reportCardId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reportCardId) return;
    fetchReportCard();
  }, [reportCardId]);

  async function fetchReportCard() {
    try {
      setLoading(true);
      const res = await getReportCard(reportCardId);
      setData(res.data);
    } catch {
      setError("Failed to load report card");
    } finally {
      setLoading(false);
    }
  }

  return {
    data,
    loading,
    error,
  };
}
