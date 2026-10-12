import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { submitHomework } from "./homework-submission.controller.js";
import {
  createHomeworkSchema,
  listHomeworkSchema,
  updateHomeworkSchema,
  submitHomeworkSchema,
} from "./homework.schema.js";
import {
  createHomework,
  listHomework,
  updateHomework,
  deleteHomework,
  getHomeworkSummary,
  getHomeworkStudentStatus,
  markHomeworkAsRead,
} from "./homework.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", allowRoles("school_admin", "teacher"), validate(createHomeworkSchema), createHomework);
router.get("/", validate(listHomeworkSchema), listHomework);
router.put("/:id", allowRoles("school_admin", "teacher"), validate(updateHomeworkSchema), updateHomework);
router.delete("/:id", allowRoles("school_admin", "teacher"), deleteHomework);
router.post("/:id/read", markHomeworkAsRead);

router.post(
  "/:homework_id/submit",
  validate(submitHomeworkSchema),
  submitHomework
);

router.get("/analytics/summary", getHomeworkSummary);
router.get(
  "/analytics/:homework_id/students",
  getHomeworkStudentStatus
);

export default router;
