import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getGlobalSettings, updateGlobalLogo, updateGlobalSettings } from "./setting.controller.js";
import { protect, authorize } from "../../shared/middlewares/auth.js";

const router = express.Router();

// Multer config for logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "global", "branding");
    // Ensure directory exists
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `global_brand_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|svg|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, svg, webp) are allowed"));
  },
});

router.get("/", getGlobalSettings);
router.post("/logo", protect, authorize("super_admin"), upload.single("logo"), updateGlobalLogo);
router.put("/", protect, authorize("super_admin"), updateGlobalSettings);

export default router;
