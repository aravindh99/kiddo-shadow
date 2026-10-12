import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createReportCardSchema,
  saveReportCardMarksSchema,
  publishReportCardSchema,
} from "./report-card.schema.js";
import {
  createReportCard,
  saveReportCardMarks,
  publishReportCard,
  getReportCard,
  listReportCards,
} from "./report-card.controller.js";
import { allowRoles } from "../../shared/middlewares/role.js";

const router = express.Router();

router.use(protect);

/* teacher */
router.post(
  "/",
  allowRoles("school_admin", "teacher"),
  validate(createReportCardSchema),
  createReportCard
);
router.post(
  "/:id/marks",
  allowRoles("school_admin", "teacher"),
  validate(saveReportCardMarksSchema),
  saveReportCardMarks
);
router.post(
  "/:id/publish",
  allowRoles("school_admin", "teacher"),
  validate(publishReportCardSchema),
  publishReportCard
);

/* view */
router.get("/student/list", allowRoles("student"), listReportCards);
router.get("/:id", getReportCard);

export default router;
