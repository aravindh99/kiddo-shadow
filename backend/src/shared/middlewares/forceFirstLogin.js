import AppError from "../appError.js";

export const forceFirstLogin = (req, res, next) => {
  if (req.user.first_login) {
    throw new AppError(
      "Profile completion required",
      403
    );
  }
  next();
};
