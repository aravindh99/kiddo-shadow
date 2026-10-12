import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { getParentChildren } from "./parentChildren.api";

const ParentChildContext = createContext(null);
const STORAGE_KEY = "parent_active_child_id";

function normalizeChild(item) {
  const student = item?.student || item?.Student || {};
  const user = student?.user || student?.User || {};
  const classInfo = student?.class || student?.Class || {};
  const sectionInfo = student?.section || student?.Section || {};

  return {
    id: Number(student?.id),
    name: user?.name || student?.name || "Student",
    relationType: item?.relation_type || "parent",
    classId: Number(student?.class_id || classInfo?.id || 0) || null,
    sectionId: Number(student?.section_id || sectionInfo?.id || 0) || null,
    className: classInfo?.class_name || "",
    sectionName: sectionInfo?.name || "",
    admissionNo: student?.admission_no || "",
    raw: item,
  };
}

function dedupeChildren(items) {
  const seen = new Set();
  return items.filter((item) => {
    const id = Number(item?.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function ParentChildProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== "parent") return;

    async function load() {
      try {
        setLoading(true);
        const res = await getParentChildren({ limit: 50 });
        const nextItems = Array.isArray(res?.data?.data)
          ? dedupeChildren(res.data.data.map(normalizeChild).filter((item) => item.id))
          : [];
        setItems(nextItems);

        const storedId =
          typeof window !== "undefined"
            ? Number(window.localStorage.getItem(STORAGE_KEY))
            : null;
        const preferredId = user?.first_login
          ? nextItems[0]?.id || null
          : nextItems.some((item) => item.id === storedId)
            ? storedId
            : nextItems[0]?.id || null;
        setSelectedChildId(preferredId);
      } catch {
        setItems([]);
        setSelectedChildId(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.role]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedChildId) {
      window.localStorage.setItem(STORAGE_KEY, String(selectedChildId));
    }
  }, [selectedChildId]);

  const selectedChild = useMemo(
    () => items.find((item) => item.id === selectedChildId) || items[0] || null,
    [items, selectedChildId]
  );

  const value = useMemo(
    () => ({
      children: items,
      selectedChild,
      selectedChildId: selectedChild?.id || null,
      setSelectedChildId,
      loading,
    }),
    [items, selectedChild, loading]
  );

  return (
    <ParentChildContext.Provider value={value}>
      {children}
    </ParentChildContext.Provider>
  );
}

export function useParentChild() {
  const context = useContext(ParentChildContext);

  return (
    context || {
      children: [],
      selectedChild: null,
      selectedChildId: null,
      setSelectedChildId: () => {},
      loading: false,
    }
  );
}
