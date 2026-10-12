import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  createParentAndLinkSchema,
  linkExistingParentSchema,
  updateParentProfileSchema,
} from "./parent.schema.js";

import {
  createParentAndLink,
  linkExistingParent,
  listParents,
  listParentOptions,
  updateParentProfile,
  getMyProfile,
} from "./parent.controller.js";

const router = express.Router();

function noStore(req, res, next) {
  delete req.headers["if-none-match"];
  delete req.headers["if-modified-since"];
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
}

/* =========================
   ADMIN ROUTES
========================= */
router.post(
  "/parents",
  protect,
  allowRoles("school_admin"),
  validate(createParentAndLinkSchema),
  createParentAndLink
);

router.post(
  "/parents/link",
  protect,
  allowRoles("school_admin"),
  validate(linkExistingParentSchema),
  linkExistingParent
);

router.get(
  "/parents",
  protect,
  allowRoles("school_admin"),
  listParents
);

router.get(
  "/parents/options",
  protect,
  allowRoles("school_admin"),
  listParentOptions
);

/* =========================
   PARENT ROUTES
========================= */
router.patch(
  "/parents/profile",
  protect,
  allowRoles("parent"),
  validate(updateParentProfileSchema),
  updateParentProfile
);

router.get(
  "/parents/profile",
  noStore,
  protect,
  allowRoles("parent"),
  getMyProfile
);

export default router;
