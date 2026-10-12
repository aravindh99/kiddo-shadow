export const schoolScope = (req, res, next) => {
  if (req.user.role === "super_admin") {
    return next();
  }

  const schoolId =
    req.params.school_id ||
    req.body?.school_id ||
    req.query.school_id;

  if (schoolId && String(req.user.school_id) !== String(schoolId)) {
    return res.status(403).json({ message: "Cross-school access denied" });
  }

  next();
}
