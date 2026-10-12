import { useEffect, useState } from "react";
import { getMyGroupChats } from "./groupChat.api";

export function useGroupChats() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      setLoading(true);
      const res = await getMyGroupChats();
      setGroups(res.data?.items || res.data || []);
    } catch {
      setError("Failed to load group chats");
    } finally {
      setLoading(false);
    }
  }

  return {
    groups,
    loading,
    error,
    refresh: fetchGroups,
  };
}
