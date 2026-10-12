import Subject from "./subject.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";

/* =========================
   CREATE SUBJECT
========================= */
export const createSubjectService = async ({
    school_id,
    name,
    code,
    category,
}) => {
    const normalizedName = name.trim();

    // Check for duplicates within the school
    const exists = await Subject.findOne({
        where: {
            school_id,
            name: normalizedName,
        },
    });

    if (exists) {
        return { error: "SUBJECT_EXISTS" };
    }

    const subject = await Subject.create({
        school_id,
        name: normalizedName,
        code: code ? code.trim().toUpperCase() : null,
        category,
    });

    return { subject };
};

/* =========================
   GET ALL SUBJECTS
========================= */
export const getAllSubjectsService = async ({ school_id, class_id }) => {
    if (class_id) {
        const assignments = await TeacherAssignment.findAll({
            where: { school_id, class_id, is_active: true },
            include: [{ model: Subject }],
        });

        const subjectMap = new Map();
        assignments.forEach(a => {
            if (a.subject && !subjectMap.has(a.subject.id)) {
                subjectMap.set(a.subject.id, a.subject);
            }
        });

        const rows = Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        return { count: rows.length, rows };
    }

    return Subject.findAndCountAll({
        where: { school_id },
        order: [["name", "ASC"]],
    });
};

/* =========================
   UPDATE SUBJECT
========================= */
export const updateSubjectService = async ({
    school_id,
    subject_id,
    updates,
}) => {
    const subject = await Subject.findOne({
        where: { id: subject_id, school_id },
    });

    if (!subject) {
        return { error: "SUBJECT_NOT_FOUND" };
    }

    // Check name duplicate if name is changing
    if (updates.name && updates.name.trim() !== subject.name) {
        const exists = await Subject.findOne({
            where: {
                school_id,
                name: updates.name.trim(),
            },
        });

        if (exists) {
            return { error: "SUBJECT_EXISTS" };
        }
    }

    if (updates.name) subject.name = updates.name.trim();
    if (updates.code) subject.code = updates.code.trim().toUpperCase();
    if (updates.category) subject.category = updates.category;

    await subject.save();

    return { subject };
};

/* =========================
   DELETE SUBJECT
========================= */
export const deleteSubjectService = async ({ school_id, subject_id }) => {
    const subject = await Subject.findOne({
        where: { id: subject_id, school_id },
    });

    if (!subject) {
        return { error: "SUBJECT_NOT_FOUND" };
    }

    await subject.destroy();
    return { success: true };
};
