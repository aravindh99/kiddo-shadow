import rateLimit from "express-rate-limit";

export const ragRateLimit = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 10,                    // 10 requests per minute per user/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many AI requests. Please try again later.",
  },
});
