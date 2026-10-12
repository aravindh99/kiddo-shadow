import asyncHandler from "../../shared/asyncHandler.js";
import { getCareerDiscoveryService } from "./career.service.js";

export const getCareerDiscovery = asyncHandler(async (req, res) => {
  const data = await getCareerDiscoveryService({
    user: req.user,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
