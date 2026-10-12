import AppError from "../appError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    // Check if schema is structured (has body/query/params keys)
    const shape = schema.shape;
    const isStructured = shape && (shape.body || shape.query || shape.params);

    if (isStructured) {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (result.body) req.body = result.body;
      if (result.query) Object.assign(req.query, result.query);
      if (result.params) Object.assign(req.params, result.params);
    } else {
      // Legacy: validate body only meant for flat schemas
      req.body = schema.parse(req.body);
    }

    next();
  } catch (err) {
    const firstIssue = err?.issues?.[0] || err?.errors?.[0];
    const path = Array.isArray(firstIssue?.path) ? firstIssue.path.join(".") : "";
    const issueMessage = firstIssue?.message;
    const message =
      path && issueMessage
        ? `${path}: ${issueMessage}`
        : issueMessage || err?.message || "Invalid request";
    next(new AppError(message, 400));
  }
};

