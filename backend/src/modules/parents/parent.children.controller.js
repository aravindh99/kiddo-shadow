import asyncHandler from "../../shared/asyncHandler.js";
import { getParentChildrenService } from "./parent.dashboard.service.js";

export const getParentChildren = asyncHandler(async (req, res) => {
  const result = await getParentChildrenService({
    parent_user_id: req.user.id,
    school_id: req.user.school_id,
    query: req.query,
  });

  res.json({
    success: true,
    total: result.count,
    data: result.rows.map((row) => ({
      relation_type: row.relation_type,
      student: row.student,
    })),
  });
});
