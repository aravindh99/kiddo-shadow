import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  createClassService,
  getClassesService,
  getClassByIdService,
  updateClassService,
  deleteClassService,
  getLoginRosterService,
} from "./classes.service.js";

export const createClass = asyncHandler(async (req, res) => {
  const cls = await createClassService({
    school_id: req.user.school_id,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    data: cls,
  });
});

export const getClasses = asyncHandler(async (req, res) => {
  const result = await getClassesService(req.user.school_id);

  res.json({
    total: result.count,
    items: result.rows,
  });
});

export const getClassById = asyncHandler(async (req, res) => {
  const cls = await getClassByIdService(
    req.params.id,
    req.user.school_id
  );

  if (!cls) {
    throw new AppError("Class not found", 404);
  }

  res.json({
    success: true,
    data: cls,
  });
});

export const updateClass = asyncHandler(async (req, res) => {
  const cls = await updateClassService(
    req.params.id,
    req.user.school_id,
    req.body
  );

  if (!cls) {
    throw new AppError("Class not found", 404);
  }

  res.json({
    success: true,
    data: cls,
  });
});

export const deleteClass = asyncHandler(async (req, res) => {
  const deleted = await deleteClassService(
    req.params.id,
    req.user.school_id
  );

  if (!deleted) {
    throw new AppError("Class not found", 404);
  }

  res.json({
    success: true,
    message: "Class deleted successfully",
  });
});

export const getLoginRoster = asyncHandler(async (req, res) => {
  const data = await getLoginRosterService({
    school_id: req.user.school_id,
    query: req.query,
  });

  res.json({
    success: true,
    data,
  });
});
