import asyncHandler from "../../shared/asyncHandler.js";
import * as service from "./teacher-class-session.service.js";

export const startClass = asyncHandler(async (req, res) => {
  const session = await service.startSession({
    user: req.user,
    school_id: req.user.school_id,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    data: session,
  });
});

export const endClass = asyncHandler(async (req, res) => {
  const session = await service.endSession({
    session_id: Number(req.params.id),
    user: req.user,
  });

  res.json({
    success: true,
    data: session,
  });
});

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await service.listSessions({
    user: req.user,
    date: req.query.date,
  });

  res.json({
    success: true,
    items: sessions,
  });
});
