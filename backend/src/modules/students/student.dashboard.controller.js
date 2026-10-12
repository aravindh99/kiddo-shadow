import { getStudentDashboardService } from "./student.dashboard.service.js";

export const getStudentDashboard = async (req, res, next) => {
    try {
        const data = await getStudentDashboardService({
            student_user_id: req.user.id
        });

        res.json({
            success: true,
            data
        });
    } catch (e) {
        next(e);
    }
};
