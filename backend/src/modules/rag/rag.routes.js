import express from "express";
import multer from "multer";
import { askImageQuestion, askQuestion, speakText } from "./rag.controller.js";
import { protect } from "../../shared/middlewares/auth.js";
import { ragRateLimit } from "../../shared/middlewares/rateLimit.js";

const router = express.Router();
const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const imageMimeTypeByExtension = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);
const getAllowedImageMimeType = (file) => {
  if (allowedImageMimeTypes.has(file.mimetype)) {
    return file.mimetype;
  }

  const extension = String(file.originalname || "")
    .toLowerCase()
    .match(/\.[^.]+$/)?.[0];

  return imageMimeTypeByExtension.get(extension) || null;
};
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const mimeType = getAllowedImageMimeType(file);
    if (mimeType) {
      file.normalizedMimeType = mimeType;
      cb(null, true);
      return;
    }

    cb(new Error("Only jpg, jpeg, png, and webp images are allowed"));
  },
});

const imageUploadFields = imageUpload.any();

const handleImageUpload = (req, res, next) => {
  imageUploadFields(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    console.error("IMAGE_QUESTION_SOLVER_ERROR", err?.message || err);
    res.status(400).json({ message: err.message || "Invalid image upload" });
  });
};

const logImageQuestionRouteHit = (req, res, next) => {
  console.log("IMAGE_QUESTION_ROUTE_HIT");
  next();
};

// student / teacher / parent can all use this
router.get("/ask", ragRateLimit, protect, askQuestion);
router.post("/ask", ragRateLimit, protect, handleImageUpload, askQuestion);
router.post(
  "/image-question",
  ragRateLimit,
  protect,
  logImageQuestionRouteHit,
  handleImageUpload,
  askImageQuestion
);
router.post("/speak", ragRateLimit, protect, speakText);

export default router;
