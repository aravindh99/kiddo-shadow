import { api } from "../../../services/api";

/**
 * ANNOUNCEMENTS API SERVICE
 * Aligned with /api/notifications
 */

export const getAnnouncements = async () => {
    // ⚡ PERFORMANCE FIX: Circuit Breaker for broken backend endpoint
    // "school_admin" role causes 500 Internal Server Error due to enum violation.
    // We strictly skip the call to prevent UI lag and network errors.
    const role = localStorage.getItem("role");
    if (role === 'school_admin' || role === 'schooladmin') {
        console.warn("Skipping Notifications API for school_admin (Backend Constraint).");
        return [];
    }

    try {
        const res = await api.get("/api/notifications");
        // Handle both { success, total, items } and { success, data: { items } }
        if (res?.items) return res.items;
        if (res?.data?.items) return res.data.items;
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        throw error;
    }
};

export const createAnnouncement = async (payload) => {
    try {
        const res = await api.post("/api/notifications", payload);
        // Response structure: { success: true, data: { ... } }
        return res?.data || res;
    } catch (error) {
        console.error("Failed to broadcast notification:", error);
        throw error;
    }
};
