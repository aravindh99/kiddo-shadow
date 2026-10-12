import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import multer from "multer";

import {
  createSchool,
  updateSchool,
  getSchoolDetails,
  listSchools,
  updateSchoolStatus,
  updateSchoolAdminStatus,
  resetSchoolAdminPassword,
  updateSchoolBranding,
  getMySchoolBranding
} from "./school.controller.js";

import {
  createSchoolSchema,
  updateSchoolSchema,
  updateSchoolStatusSchema,
  updateSchoolAdminStatusSchema,
  resetSchoolAdminPasswordSchema,
} from "./school.schema.js";

const router = express.Router();

// Publicly accessible for logged in users to fetch their own school branding
router.get("/my-branding", protect, getMySchoolBranding);

router.get(
  "/:id/details",
  protect,
  allowRoles("super_admin", "school_admin"),
  getSchoolDetails
);

// Setup multer for memory storage, service will write to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

router.patch(
  "/branding",
  protect,
  allowRoles("school_admin", "super_admin"),
  upload.any(), // Accept any files (logo)
  updateSchoolBranding
);

router.use(protect, allowRoles("super_admin"));

router.post("/", validate(createSchoolSchema), createSchool);
router.put("/:id", validate(updateSchoolSchema), updateSchool);


router.get("/", listSchools);
router.patch("/:id/status", validate(updateSchoolStatusSchema), updateSchoolStatus);
router.patch(
  "/:id/admin-status",
  validate(updateSchoolAdminStatusSchema),
  updateSchoolAdminStatus
);
router.patch(
  "/:id/admin-reset-password",
  validate(resetSchoolAdminPasswordSchema),
  resetSchoolAdminPassword
);

export default router;
