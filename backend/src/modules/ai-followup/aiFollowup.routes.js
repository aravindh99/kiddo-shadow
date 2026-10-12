import express from "express";
import path from "path";

import { createAiFollowup } from "./aiFollowup.controller.js";

import { FOLLOWUP_UPLOAD_DIR } from "./aiFollowup.service.js";

const router = express.Router();

const mimeTypeByExtension = new Map([
  [".png", "image/png"],
]);

router.get(
  "/uploads/ai-followups/:filename",
  (req, res) => {
    const filename = path.basename(
      req.params.filename || ""
    );

    if (!filename) {
      return res.status(404).json({
        message: "Generated image not found",
      });
    }

    const extension = path
      .extname(filename)
      .toLowerCase();

    const mimeType =
      mimeTypeByExtension.get(extension);

    if (mimeType) {
      res.type(mimeType);
    }

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.sendFile(
      path.join(
        FOLLOWUP_UPLOAD_DIR,
        filename
      ),
      (err) => {
        if (err && !res.headersSent) {
          return res.status(404).json({
            message:
              "Generated image not found",
          });
        }
      }
    );
  }
);

router.post("/", createAiFollowup);

export default router;