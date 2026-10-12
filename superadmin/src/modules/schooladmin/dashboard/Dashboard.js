import { api } from "../../../services/api";

export const getDashboardStats = async () => {
    try {
        // Fetch classes, teachers, and ALL students (high limit) for accurate local stats
        const [classesRes, studentsRes, teachersRes] = await Promise.all([
            api.get("/api/classes").catch(() => ({ items: [] })),
            api.get("/api/students", { params: { limit: 1000 } }).catch(() => ({ items: [] })), // Fetch more for stats
            api.get("/api/teachers").catch(() => ({ items: [] })),
        ]);

        // Helper to extract items array safely
        const getItems = (res) => {
            if (Array.isArray(res)) return res;
            if (Array.isArray(res?.items)) return res.items;
            if (Array.isArray(res?.data?.items)) return res.data.items;
            if (Array.isArray(res?.data)) return res.data;
            return [];
        };

        const classes = getItems(classesRes);
        const students = getItems(studentsRes); // Now matches FRONTEND_API structure
        const teachers = getItems(teachersRes);

        // 1. Calculate Total Counts
        const totalClasses = classes.length;
        const totalTeachers = teachers.length;
        const totalStudents = students.length;

        let totalSections = 0;
        classes.forEach(cls => {
            if (Array.isArray(cls.sections)) {
                totalSections += cls.sections.length;
            }
        });

        // 2. Gender Distribution (Pie Chart)
        let maleCount = 0;
        let femaleCount = 0;
        students.forEach(s => {
            // Student object might have 'gender' directly or in 'user' relation depending on API
            // Checking common paths based on typical API structure
            const g = (s.gender || s.user?.gender || "").toLowerCase();
            if (g === 'male' || g === 'm') maleCount++;
            else if (g === 'female' || g === 'f') femaleCount++;
        });

        const genderData = [
            { name: 'Boys', value: maleCount, fill: '#3b82f6' },  // Blue
            { name: 'Girls', value: femaleCount, fill: '#ec4899' }, // Pink
        ];

        // 3. Monthly Growth (Bar Chart)
        // Group students by created_at month
        const growthMap = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Initialize last 6 months to 0
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${months[d.getMonth()]}`;
            growthMap[key] = 0;
        }

        students.forEach(s => {
            if (s.created_at) {
                const date = new Date(s.created_at);
                const monthName = months[date.getMonth()];
                if (growthMap[monthName] !== undefined) {
                    growthMap[monthName]++;
                }
            }
        });

        const monthlyGrowthData = Object.keys(growthMap).map(key => ({
            name: key,
            students: growthMap[key]
        }));


        return {
            totalClasses,
            totalSections,
            totalStudents,
            totalTeachers,
            genderData,
            monthlyGrowthData
        };
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        return {
            totalClasses: 0,
            totalSections: 0,
            totalStudents: 0,
            totalTeachers: 0,
            genderData: [],
            monthlyGrowthData: []
        };
    }
};

export const getAiAnalytics = async () => {
    try {
        const response = await api.get("/api/analytics/ai/school");
        // backend returns array of { total_calls, total_tokens, role }
        // Ensure we handle potential errors or empty data
        if (Array.isArray(response)) {
            return response;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch AI analytics:", error);
        return [];
    }
};
