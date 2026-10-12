import { api } from "@/services/api";

/* =========================
   GET SUBSCRIPTIONS
   GET /api/subscriptions
========================= */
export async function getSubscriptions(params = {}) {
    try {
        const res = await api.get("/api/subscriptions", { params });

        return {
            total: res?.total || 0,
            items: Array.isArray(res?.items) ? res.items : [],
        };
    } catch (error) {
        console.error("Failed to fetch subscriptions:", error);
        throw error;
    }
}

/* =========================
   CREATE/UPDATE SUBSCRIPTION
   POST /api/subscriptions
   Request: { schoolId, status, startDate, endDate, notes }
========================= */
export async function createSubscription(payload) {
    try {
        const res = await api.post("/api/subscriptions", {
            schoolId: Number(payload.schoolId),
            status: payload.status,
            startDate: payload.startDate,
            endDate: payload.endDate,
            notes: payload.notes || "",
        });
        return res;
    } catch (error) {
        console.error("Failed to create/update subscription:", error);
        throw error;
    }
}

/* =========================
   GET SUBSCRIPTION BY SCHOOL
   GET /api/subscriptions/school/:schoolId
========================= */
export async function getSubscriptionBySchool(schoolId) {
    try {
        const res = await api.get(`/api/subscriptions/school/${schoolId}`);
        return res;
    } catch (error) {
        console.error("Failed to fetch school subscription:", error);
        throw error;
    }
}

/* =========================
   DELETE SUBSCRIPTION
   DELETE /api/subscriptions/:id
========================= */
export async function deleteSubscription(id) {
    try {
        await api.delete(`/api/subscriptions/${id}`);
    } catch (error) {
        console.error("Failed to delete subscription:", error);
        throw error;
    }
}
