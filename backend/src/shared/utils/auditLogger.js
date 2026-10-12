import AuditLog from "../../modules/audit/audit-log.model.js";

export const logApprovalAction = async ({
  entity_type,
  entity_id,
  action,
  remark,
  performed_by,
  new_value,
  transaction,
}) => {
  await AuditLog.create(
    {
      entity_type,
      entity_id: String(entity_id),
      action,
      remark,
      performed_by,
      new_value: new_value || null,
    },
    transaction ? { transaction } : undefined
  );
};
