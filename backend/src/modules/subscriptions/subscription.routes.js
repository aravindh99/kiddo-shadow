import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { upsertSubscription } from "./subscription.controller.js";

const router = express.Router();

router.post(
  "/subscriptions",
  protect,
  allowRoles("super_admin"),
  upsertSubscription
);

export default router;
