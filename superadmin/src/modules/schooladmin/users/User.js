import { api } from "@/services/api";

/* =========================
   GET USERS
   GET /api/admin/users
 ========================= */
export async function getUsers(params = {}) {
    try {
        const res = await api.get("/api/admin/users", { params });

        // Backend returns items containing student_id, teacher_id, or parent_id
        let items = [];
        if (Array.isArray(res?.items)) items = res.items;
        else if (Array.isArray(res?.data)) items = res.data;
        else if (Array.isArray(res)) items = res;

        return {
            total: res?.total || items.length || 0,
            items: items,
        };
    } catch (error) {
        console.error("Failed to fetch users:", error);
        throw error;
    }
}

/* =========================
   CREATE USER
   POST /api/admin/users
 ========================= */
export async function createUser(payload) {
    try {
        const res = await api.post("/api/admin/users", payload);
        return res;
    } catch (error) {
        console.error("Failed to create user:", error);
        throw error;
    }
}

/* =========================
   UPDATE USER
   PATCH /api/admin/users/:id
 ========================= */
export async function updateUser(id, payload) {
    try {
        const res = await api.patch(`/api/admin/users/${id}`, payload);
        return res;
    } catch (error) {
        console.error("Failed to update user:", error);
        throw error;
    }
}

/* =========================
   DELETE USER
   DELETE /api/admin/users/:id
 ========================= */
export async function deleteUser(id) {
    try {
        await api.delete(`/api/admin/users/${id}`);
    } catch (error) {
        console.error("Failed to delete user:", error);
        throw error;
    }
}

/* =========================
   UPDATE USER STATUS
   PATCH /api/admin/users/:id/status
 ========================= */
export async function updateUserStatus(id, isActive) {
    try {
        const res = await api.patch(`/api/admin/users/${id}/status`, {
            is_active: isActive,
        });
        return res;
    } catch (error) {
        console.error("Failed to update user status:", error);
        throw error;
    }
}
