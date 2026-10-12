import express from "express";
import rateLimit from "express-rate-limit";
import { lookupPincode } from "./utils.controller.js";

const router = express.Router();

const pincodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.get("/pincode/:pincode", pincodeLimiter, lookupPincode);

export default router;

