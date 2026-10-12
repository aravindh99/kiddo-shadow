import Student from "./student.model.js";
import Attendance from "../attendance/attendance.model.js";
import Homework from "../homework/homework.model.js";
// import Notification from "../notifications/notification.model.js"; // Verify if available
import AppError from "../../shared/appError.js";
import User from "../users/user.model.js";
import { Op } from "sequelize";
import TokenAccount from "../tokens/token-account.model.js";
import { ensureTokenAccount } from "../tokens/token.service.js";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import AITestSubmission from "../ai-test-assignments/ai-test-submission.model.js";
import AITestAssignment from "../ai-test-assignments/ai-test-assignment.model.js";

export const getStudentDashboardService = async ({ student_user_id }) => {
    const student = await Student.findOne({
        where: { user_id: student_user_id },
        include: [{ model: User, attributes: ["name"] }],
    });
    if (!student) {
        throw new AppError("Student profile not found", 404);
    }

    // 1. Attendance Percentage
    const totalDays = await Attendance.count({
        where: { student_id: student.id },
    });
    const presentDays = await Attendance.count({
        where: {
            student_id: student.id,
            status: 'present'
        },
    });
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const pendingHomeworkCount = await Homework.count({
        where: {
            school_id: student.school_id,
            class_id: student.class_id,
            section_id: student.section_id,
            homework_date: { [Op.gte]: todayStr },
        },
    });

    // 2. AI Tokens (real)
    await ensureTokenAccount(student_user_id);
    const tokenAccount = await TokenAccount.findOne({
        where: { user_id: student_user_id },
        attributes: ["balance"],
    });
    const remaining = tokenAccount?.balance ?? 0;
    const usedTotal = await AiChatLog.sum("tokens_used", {
        where: { user_id: student_user_id },
    });
    const used = usedTotal || 0;
    const total = used + remaining;
    const aiTokens = {
        total,
        used,
        remaining
    };

    const assignedTests = await AITestSubmission.findAll({
        where: {
            school_id: student.school_id,
            student_id: student.id,
        },
        include: [{
            model: AITestAssignment,
            where: { is_active: true },
            attributes: ["id", "title", "lock_mode", "start_time", "end_time", "result_visibility"],
        }],
        order: [["created_at", "DESC"]],
        limit: 5,
    });

    const newAssignedCount = assignedTests.filter((item) => item.status === "pending").length;
    const completedCount = assignedTests.filter((item) => item.status === "completed").length;

    return {
        student: {
            id: student.id,
            name: (student.user ?? student.User)?.name ?? null,
            admission_no: student.admission_no,
            class_id: student.class_id,
            section_id: student.section_id
        },
        metrics: {
            attendance: {
                present: presentDays,
                total: totalDays,
                percentage: attendancePercentage
            },
            ai_tokens: aiTokens,
            homework_pending: pendingHomeworkCount,
            unread_notifications: 0,
            assigned_tests: {
                total: assignedTests.length,
                new_count: newAssignedCount,
                completed: completedCount,
                pending: assignedTests.length - completedCount,
                latest: assignedTests.map((item) => ({
                    id: item.assignment_id,
                    title: item.ai_test_assignment?.title || "Assigned Test",
                    status: item.status,
                    lock_mode: Boolean(item.ai_test_assignment?.lock_mode),
                })),
            }
        },
        notifications: {
            new_assigned_test: newAssignedCount > 0,
            message: newAssignedCount > 0 ? `${newAssignedCount} new test assigned` : "",
        },
    };
};
