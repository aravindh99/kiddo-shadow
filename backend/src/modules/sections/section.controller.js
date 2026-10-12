import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  createSectionService,
  listSectionsService,
  updateSectionStatusService,
} from "./section.service.js";

/* =========================
   CREATE SECTION
========================= */
export const createSection = asyncHandler(async (req, res) => {
  const result = await createSectionService({
    school_id: req.user.school_id,
    ...req.body,
  });

  if (result?.error === "CLASS_NOT_FOUND") {
    throw new AppError("Class not found", 404);
  }

  if (result?.error === "SECTION_EXISTS") {
    throw new AppError("Section already exists for this class", 409);
  }

  res.status(201).json({
    success: true,
    data: result.section,
  });
});

/* =========================
   LIST SECTIONS BY CLASS
========================= */
export const listSections = asyncHandler(async (req, res) => {
  const result = await listSectionsService({
    school_id: req.user.school_id,
    class_id: req.params.class_id,
  });

  res.json({
    total: result.count,
    items: result.rows,
  });
});

/* =========================
   UPDATE SECTION STATUS
========================= */
export const updateSectionStatus = asyncHandler(async (req, res) => {
  const { is_active } = req.body;

  if (typeof is_active !== "boolean") {
    throw new AppError("is_active must be boolean", 400);
  }

  const section = await updateSectionStatusService({
    school_id: req.user.school_id,
    section_id: req.params.id,
    is_active,
  });

  if (!section) {
    throw new AppError("Section not found", 404);
  }

  res.json({
    success: true,
    data: section,
  });
});
