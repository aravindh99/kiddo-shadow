import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createClassSchema,
  updateClassSchema,
} from "./classes.schema.js";
import {
  createClass,
  getClasses,
  getLoginRoster,
  getClassById,
  updateClass,
  deleteClass,
} from "./classes.controller.js";

const router = express.Router();

router.use(protect);

router.post(
  "/",
  allowRoles("school_admin"),
  validate(createClassSchema),
  createClass
);
router.get("/", allowRoles("school_admin", "teacher"), getClasses);
router.get("/login-roster", allowRoles("school_admin"), getLoginRoster);
router.get("/:id", allowRoles("school_admin", "teacher"), getClassById);
router.patch(
  "/:id",
  allowRoles("school_admin"),
  validate(updateClassSchema),
  updateClass
);
router.delete("/:id", allowRoles("school_admin"), deleteClass);

export default router;
