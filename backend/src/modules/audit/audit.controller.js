import { listAuditLogsService, getAuditMetricsService } from "./audit.service.js";

export const listAuditLogs = async (req, res, next) => {
  try {
    const result = await listAuditLogsService({
      school_id: req.user.school_id,
      query: req.query,
    });

    res.json({
      total: result.count,
      items: result.rows,
    });
  } catch (e) {
    next(e);
  }
};

export const getAuditMetrics = async (req, res, next) => {
  try {
    const metrics = await getAuditMetricsService({
      school_id: req.user.school_id,
    });
    res.json(metrics);
  } catch (e) {
    next(e);
  }
};
