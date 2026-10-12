import asyncHandler from "../../shared/asyncHandler.js";
import Subscription from "./subscription.model.js";

export const upsertSubscription = asyncHandler(async (req, res) => {
  const { schoolId, status, startDate, endDate, notes } = req.body;

  const [subscription] = await Subscription.upsert({
    school_id: schoolId,
    status,
    start_date: startDate ?? null,
    end_date: endDate ?? null,
    notes: notes ?? null,
  });

  res.json({
    message: "Subscription updated",
    subscription,
  });
});
