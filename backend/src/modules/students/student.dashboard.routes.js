import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { getStudentDashboard } from "./student.dashboard.controller.js";

const router = express.Router();

router.get(
    "/dashboard",
    protect,
    allowRoles("student"),
    getStudentDashboard
);

export default router;
