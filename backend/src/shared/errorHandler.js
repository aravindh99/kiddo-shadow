export default function errorHandler(err, req, res, next) {
  // defaults
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let isExpectedError = Boolean(err.isOperational);
  const dbCode = err?.original?.code || err?.parent?.code;
  const errMessage = String(err?.message || "").toLowerCase();

  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    statusCode = 400;
    message = "Invalid JSON body";
    isExpectedError = true;
  }

  if (err?.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    const field = err?.errors?.[0]?.path;
    message = field ? `${field} already in use` : "Unique constraint violation";
    isExpectedError = true;
  }

  if (
    err?.name === "SequelizeConnectionError" ||
    err?.name === "SequelizeConnectionAcquireTimeoutError" ||
    (err?.name === "SequelizeDatabaseError" &&
      (dbCode === "57P03" ||
        errMessage.includes("connection terminated unexpectedly") ||
        errMessage.includes("database system is in recovery mode")))
  ) {
    statusCode = 503;
    message = "Database is temporarily unavailable. Please retry in a moment.";
    isExpectedError = true;
    res.set("Retry-After", "3");
  }

  // log unexpected errors
  if (!isExpectedError) {
    console.error("UNEXPECTED ERROR", err);
  }

  res.status(statusCode).json({
    status: err.status || "error",
    message,
  });
}
