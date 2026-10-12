import { api } from "../../../services/api";

/* ================= UTIL ================= */
// Zod-safe cleaner
const clean = (v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  return v;
};

/* Normalize backend response */
const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
};

/* CACHE */
let SCHOOLS_CACHE = null;
let LAST_FETCH = 0;
const CACHE_DURATION = 60000;

/* ================= GET SCHOOLS ================= */
export async function getSchools() {
  const now = Date.now();
  if (SCHOOLS_CACHE && now - LAST_FETCH < CACHE_DURATION) {
    return SCHOOLS_CACHE;
  }

  const res = await api.get("/api/schools");
  const data = normalizeArray(res);

  SCHOOLS_CACHE = data;
  LAST_FETCH = now;
  return data;
}

const invalidateCache = () => {
  SCHOOLS_CACHE = null;
  LAST_FETCH = 0;
};

/* ================= CREATE SCHOOL (FIXED) ================= */
export async function createSchool(formData) {
  const payload = {
    name: formData.school_name,
    code: formData.school_code,    // REQUIRED
    school_type: formData.school_type || "cbse",

    // SEND AFFILIATION IF EXIST, ELSE NULL/EMPTY
    cbse_affiliation_no: formData.cbse_affiliation_no || "",

    address: formData.address,
    city: formData.city,
    state: formData.state,
    zip: formData.zip,
    email: formData.email,

    // Reference details
    reference_name: formData.reference || "",
    reference_percentage: formData.reference_percentage ? Number(formData.reference_percentage) : 0,

    logo_url: formData.logo_url || "",

    // Admin
    admin_username: formData.admin_username,
    admin_password: formData.admin_password,
  };

  console.log("FINAL PAYLOAD →", payload);

  const res = await api.post("/api/schools", payload);
  invalidateCache();
  return res;
}

/* ================= UPDATE STATUS ================= */
export async function updateSchoolStatus(id, status) {
  const res = await api.patch(`/api/schools/${id}/status`, { status });
  invalidateCache();
  return res;
}

/* ================= ADMIN STATUS ================= */
export async function updateSchoolAdminStatus(id, is_active) {
  const res = await api.patch(`/api/schools/${id}/admin-status`, { is_active });
  invalidateCache();
  return res;
}

/* ================= RESET PASSWORD ================= */
export async function resetSchoolAdminPassword(id, new_password) {
  const res = await api.patch(
    `/api/schools/${id}/admin-reset-password`,
    { new_password }
  );
  invalidateCache();
  return res;
}
