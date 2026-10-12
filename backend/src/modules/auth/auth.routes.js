import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { login, changePassword, uploadProfileImage } from "./auth.controller.js";
import { loginSchema, changePasswordSchema } from "./auth.schema.js";
import { validate } from "../../shared/middlewares/validate.js";
import { protect } from "../../shared/middlewares/auth.js";

// Multer config for profile image
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "profile-images");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Only images are allowed"));
  },
});

const router = express.Router();

router.post("/login", validate(loginSchema), login);
router.post(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword
);
router.post(
  "/profile-image",
  protect,
  upload.single("profile_image"),
  uploadProfileImage
);

export default router;
