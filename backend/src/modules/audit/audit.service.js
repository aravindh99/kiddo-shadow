import { Op } from "sequelize";
import AuditLog from "./audit-log.model.js";
import { getPagination } from "../../shared/utils/pagination.js";

export const listAuditLogsService = async ({ school_id, query }) => {
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { 
    entity_type, 
    entity_id, 
    from_date, 
    to_date, 
    module, 
    action, 
    status,
    user_id,
    role,
    search // generic search term
  } = safeQuery;

  const where = {};
  
  if (school_id) {
    where.school_id = school_id;
  }

  if (entity_type) where.entity_type = entity_type;
  if (entity_id) where.entity_id = String(entity_id);
  if (module) where.module = module;
  if (action) where.action = action;
  if (status) where.status = status;
  if (user_id) where.user_id = user_id;
  if (role) where.role = role;

  if (search) {
    const q = `%${search}%`;
    where[Op.or] = [
      { user_name: { [Op.iLike]: q } },
      { action: { [Op.iLike]: q } },
      { module: { [Op.iLike]: q } },
      { description: { [Op.iLike]: q } },
      { entity_id: { [Op.iLike]: q } },
    ];
  }

  if (from_date || to_date) {
    where.created_at = {};
    if (from_date) where.created_at[Op.gte] = new Date(from_date);
    if (to_date) where.created_at[Op.lte] = new Date(to_date);
  }

  return AuditLog.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};

export const getAuditMetricsService = async ({ school_id }) => {
  const where = {};
  if (school_id) {
    where.school_id = school_id;
  }
  
  // Total logs
  const total = await AuditLog.count({ where });

  // Today's logs
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = await AuditLog.count({ 
    where: { ...where, created_at: { [Op.gte]: startOfToday } } 
  });

  // Successful vs Failed
  const successful = await AuditLog.count({ where: { ...where, status: "Success" } });
  const failed = await AuditLog.count({ where: { ...where, status: "Failed" } });
  
  // Logins
  const logins = await AuditLog.count({ where: { ...where, action: "Login" } });

  // Warnings / Security
  const warnings = await AuditLog.count({ where: { ...where, status: "Warning" } });

  return {
    total,
    today,
    successful,
    failed,
    logins,
    warnings
  };
};
