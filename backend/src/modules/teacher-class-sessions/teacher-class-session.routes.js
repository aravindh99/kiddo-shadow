import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  startClass,
  endClass,
  listSessions,
} from "./teacher-class-session.controller.js";

import {
  startClassSessionSchema,
  listClassSessionSchema,
} from "./teacher-class-session.schema.js";

const router = express.Router();

router.post(
  "/start",
  protect,
  allowRoles("teacher"),
  validate(startClassSessionSchema),
  startClass
);

router.post(
  "/:id/end",
  protect,
  allowRoles("teacher"),
  endClass
);

router.get(
  "/",
  protect,
  allowRoles("teacher"),
  validate(listClassSessionSchema),
  listSessions
);

export default router;
