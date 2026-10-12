import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
    createSubjectService,
    getAllSubjectsService,
    updateSubjectService,
    deleteSubjectService,
} from "./subject.service.js";

/* =========================
   CREATE SUBJECT
========================= */
export const createSubject = asyncHandler(async (req, res) => {
    const result = await createSubjectService({
        school_id: req.user.school_id,
        ...req.body,
    });

    if (result.error === "SUBJECT_EXISTS") {
        throw new AppError("Subject with this name already exists", 409);
    }

    res.status(201).json({
        success: true,
        data: result.subject,
    });
});

/* =========================
   GET ALL SUBJECTS
========================= */
export const getAllSubjects = asyncHandler(async (req, res) => {
    const result = await getAllSubjectsService({
        school_id: req.user.school_id,
        class_id: req.query.class_id,
    });

    res.status(200).json({
        total: result.count !== undefined ? result.count : result.length,
        items: result.rows !== undefined ? result.rows : result,
    });
});

/* =========================
   UPDATE SUBJECT
========================= */
export const updateSubject = asyncHandler(async (req, res) => {
    const result = await updateSubjectService({
        school_id: req.user.school_id,
        subject_id: req.params.id,
        updates: req.body,
    });

    if (result.error === "SUBJECT_NOT_FOUND") {
        throw new AppError("Subject not found", 404);
    }

    if (result.error === "SUBJECT_EXISTS") {
        throw new AppError("Subject with this name already exists", 409);
    }

    res.status(200).json({
        success: true,
        data: result.subject,
    });
});

/* =========================
   DELETE SUBJECT
========================= */
export const deleteSubject = asyncHandler(async (req, res) => {
    const result = await deleteSubjectService({
        school_id: req.user.school_id,
        subject_id: req.params.id,
    });

    if (result.error === "SUBJECT_NOT_FOUND") {
        throw new AppError("Subject not found", 404);
    }

    res.status(200).json({
        success: true,
        message: "Subject deleted successfully",
    });
});
