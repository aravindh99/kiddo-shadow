import AppError from "../appError.js";

export function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log("Role:", req.user.role, "Allowed:", allowedRoles);

      return next(new AppError("Forbidden role", 403));
    }

    next();
  };
}
