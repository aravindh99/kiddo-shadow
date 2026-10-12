import express from "express";
import {
    createSubject,
    getAllSubjects,
    updateSubject,
    deleteSubject,
} from "./subject.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
    createSubjectSchema,
    updateSubjectSchema,
} from "./subject.schema.js";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";

const router = express.Router();

router.use(protect);

router
    .route("/")
    .get(allowRoles("school_admin", "teacher"), getAllSubjects)
    .post(allowRoles("school_admin"), validate(createSubjectSchema), createSubject);

router
    .route("/:id")
    .patch(allowRoles("school_admin"), validate(updateSubjectSchema), updateSubject)
    .delete(allowRoles("school_admin"), deleteSubject);

export default router;
