import { api } from "@/services/api";

/* =========================
   BULK CREATE (SINGLE ENTRY)
========================= */
export const bulkCreateData = async (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid bulk payload");
  }

  /* POST /api/bulk/bulk-create */
  const res = await api.post("/api/bulk/bulk-create", payload);
  // The bulk API returns data directly in 'res' or 'res.data' depending on interceptor
  // Based on your message: Response: { "message": ..., "summary": ... }
  return res;
};
