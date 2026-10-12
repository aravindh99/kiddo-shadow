import api from "../../api/axios";

export const getAllSubjects = async () => {
    try {
        const response = await api.get("/subjects");
        return response.data;
    } catch (error) {
        console.error("Failed to fetch subjects", error);
        return { data: [] };
    }
};
