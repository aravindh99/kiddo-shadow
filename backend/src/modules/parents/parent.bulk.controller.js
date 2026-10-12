import { bulkApproveParentsService } from "./parent.bulk.service.js";

export const bulkApproveParents = async (req, res, next) => {
  try {
    const result = await bulkApproveParentsService({
      ...req.body,
      admin_user_id: req.user.id,
      school_id: req.user.school_id,
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
};
