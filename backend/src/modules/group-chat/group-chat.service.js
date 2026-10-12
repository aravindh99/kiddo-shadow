import db from "../../config/db.js";

import GroupChat from "./group-chat.model.js";
import GroupChatMember from "./group-chat-member.model.js";
import GroupChatMessage from "./group-chat-message.model.js";

import Teacher from "../teachers/teacher.model.js";
import Student from "../students/student.model.js";

import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import Subject from "../subjects/subject.model.js";

import AppError from "../../shared/appError.js";
import User from "../users/user.model.js";

/**
 * Guard helpers
 */
async function requireTeacher({ userId, schoolId }) {
  const teacher = await Teacher.findOne({ where: { user_id: userId, school_id: schoolId } });
  if (!teacher) throw new AppError("Only teachers can create group chats", 403);
  return teacher;
}

async function requireActiveSection({ sectionId, schoolId }) {
  const section = await Section.findOne({
    where: { id: sectionId, school_id: schoolId, is_active: true },
  });
  if (!section) throw new AppError("Section not found", 404);
  return section;
}

async function requireSubject({ subjectId, schoolId }) {
  const subject = await Subject.findOne({
    where: { id: subjectId, school_id: schoolId },
  });
  if (!subject) throw new AppError("Subject not found", 404);
  return subject;
}

async function requireChatInSchool({ chatId, schoolId }) {
  const chat = await GroupChat.findOne({
    where: { id: chatId },
    include: [
      {
        model: Section,
        attributes: ["id", "school_id"],
        where: { school_id: schoolId },
        required: true,
      },
    ],
  });
  if (!chat) throw new AppError("Group chat not found", 404);
  return chat;
}

export async function ensureChatMembership({ chatId, userId, role }) {
  await GroupChatMember.findOrCreate({
    where: { group_chat_id: chatId, user_id: userId },
    defaults: { role },
  });
}

export async function isUserMemberOfChat(chatId, userId) {
  const member = await GroupChatMember.findOne({
    where: { group_chat_id: chatId, user_id: userId },
  });
  return !!member;
}

export async function assertMemberOrAdmin({ chatId, user }) {
  if (user.role === "school_admin") return;

  const member = await GroupChatMember.findOne({
    where: { group_chat_id: chatId, user_id: user.id },
  });
  if (!member) throw new AppError("You are not a member of this chat", 403);
}

/**
 * Persist a group chat message
 */
export async function createGroupChatMessage({
  chatId,
  senderUserId,
  messageType,
  messageText,
  imageUrl,
}) {
  return GroupChatMessage.create({
    group_chat_id: chatId,
    sender_user_id: senderUserId,
    message_type: messageType,
    message_text: messageText ?? null,
    image_url: imageUrl ?? null,
  });
}

/**
 * Create or return an existing group chat.
 * IMPORTANT: This uses your DB unique constraint logic:
 * - If you truly want ONLY ONE chat per (subject, section) regardless of teacher, then
 *   change your DB unique index too. Right now it's (teacher_id, subject_id, section_id).
 */
export async function createOrGetGroupChat({ user, subjectId, sectionId }) {
  const userId = user.id;
  const schoolId = user.school_id;

  await requireTeacher({ userId, schoolId });
  const section = await requireActiveSection({ sectionId, schoolId });
  await requireSubject({ subjectId, schoolId });

  // Match DB uniqueness: teacher + subject + section
  const existing = await GroupChat.findOne({
    where: { teacher_id: userId, subject_id: subjectId, section_id: sectionId },
  });

  if (existing) {
    await ensureChatMembership({ chatId: existing.id, userId, role: "teacher" });
    return { chatId: existing.id };
  }

  return db.transaction(async (t) => {
    const chat = await GroupChat.create(
      {
        teacher_id: userId,
        subject_id: subjectId,
        class_id: section.class_id,
        section_id: sectionId,
      },
      { transaction: t }
    );

    await GroupChatMember.create(
      { group_chat_id: chat.id, user_id: userId, role: "teacher" },
      { transaction: t }
    );

    const students = await Student.findAll({
      where: { section_id: sectionId, school_id: schoolId },
      attributes: ["user_id"],
      transaction: t,
    });

    if (students.length) {
      await GroupChatMember.bulkCreate(
        students.map((s) => ({
          group_chat_id: chat.id,
          user_id: s.user_id,
          role: "student",
        })),
        { transaction: t, ignoreDuplicates: true }
      );
    }

    return { chatId: chat.id };
  });
}

/**
 * List chats for user (role-aware) + auto-membership.
 */
export async function listGroupChatsForUser(user) {
  const userId = user.id;

  const includeMeta = [
    { model: Subject, attributes: ["id", "name"], required: false },
    { model: Class, attributes: ["id", "class_name"], required: false },
    { model: Section, attributes: ["id", "name"], required: false },
  ];

  // Student
  if (user.role === "student" && user.section_id) {
    const chats = await GroupChat.findAll({
      where: { section_id: user.section_id, class_id: user.class_id },
      include: includeMeta,
      attributes: ["id", "subject_id", "class_id", "section_id", "created_at"],
      order: [["created_at", "DESC"]],
    });

    await Promise.all(
      chats.map((c) => ensureChatMembership({ chatId: c.id, userId, role: "student" }))
    );

    return (await hydrateMeta(chats)).map(mapChatDto("student"));
  }

  // Teacher / others: query chats directly (membership filter)
  const chats = await GroupChat.findAll({
    include: [
      {
        model: GroupChatMember,
        attributes: ["role"],
        where: { user_id: userId },
        required: true,
      },
      ...includeMeta,
    ],
    attributes: ["id", "subject_id", "class_id", "section_id", "created_at"],
    order: [["created_at", "DESC"]],
  });

  const hydrated = await hydrateMeta(chats);

  return hydrated.map((c) => ({
    chatId: c.id,
    role:
      c.group_chat_members?.[0]?.role ??
      c.GroupChatMembers?.[0]?.role ??
      "member",
    subject: c.Subject || null,
    class: c.Class || null,
    section: c.Section || null,
    created_at: c.created_at,
    subject_id: c.subject_id,
    class_id: c.class_id,
    section_id: c.section_id,
  }));
}

function mapChatDto(fallbackRole) {
  return (c) => ({
    chatId: c.id,
    role: fallbackRole,
    subject: c.Subject || null,
    class: c.Class || null,
    section: c.Section || null,
    created_at: c.created_at,
    subject_id: c.subject_id,
    class_id: c.class_id,
    section_id: c.section_id,
  });
}

// Fill missing Subject/Class/Section in a single round-trip per model
async function hydrateMeta(chats) {
  const missingSubjectIds = [...new Set(
    chats.filter((c) => !c.Subject && c.subject_id).map((c) => c.subject_id)
  )];
  const missingClassIds = [...new Set(
    chats.filter((c) => !c.Class && c.class_id).map((c) => c.class_id)
  )];
  const missingSectionIds = [...new Set(
    chats.filter((c) => !c.Section && c.section_id).map((c) => c.section_id)
  )];

  const [subjects, classes, sections] = await Promise.all([
    missingSubjectIds.length
      ? Subject.findAll({ where: { id: missingSubjectIds }, attributes: ["id", "name"] })
      : Promise.resolve([]),
    missingClassIds.length
      ? Class.findAll({ where: { id: missingClassIds }, attributes: ["id", "class_name"] })
      : Promise.resolve([]),
    missingSectionIds.length
      ? Section.findAll({ where: { id: missingSectionIds }, attributes: ["id", "name"] })
      : Promise.resolve([]),
  ]);

  const subjectMap = new Map(subjects.map((s) => [String(s.id), s]));
  const classMap = new Map(classes.map((s) => [String(s.id), s]));
  const sectionMap = new Map(sections.map((s) => [String(s.id), s]));

  return chats.map((c) => {
    const base = c.get ? c.get({ plain: true }) : c;
    return {
      ...base,
      Subject: c.Subject || subjectMap.get(String(base.subject_id)) || null,
      Class: c.Class || classMap.get(String(base.class_id)) || null,
      Section: c.Section || sectionMap.get(String(base.section_id)) || null,
      // preserve membership include if present
      group_chat_members: base.group_chat_members || c.group_chat_members || c.GroupChatMembers,
      GroupChatMembers: c.GroupChatMembers,
    };
  });
}

/**
 * Delete chat (teacher owner OR school_admin in same school)
 */
export async function deleteGroupChat({ chatId, user }) {
  const chat = await requireChatInSchool({ chatId, schoolId: user.school_id });

  if (user.role === "teacher" && chat.teacher_id !== user.id) {
    throw new AppError("Forbidden", 403);
  }

  // For school_admin: requireChatInSchool already enforced school scope.

  await db.transaction(async (t) => {
    await GroupChatMessage.destroy({ where: { group_chat_id: chatId }, transaction: t });
    await GroupChatMember.destroy({ where: { group_chat_id: chatId }, transaction: t });
    await chat.destroy({ transaction: t });
  });

  return { message: "Group chat deleted" };
}

/**
 * Get messages (member/admin only)
 */
export async function getGroupMessages({ chatId, user }) {
  await requireChatInSchool({ chatId, schoolId: user.school_id });
  await assertMemberOrAdmin({ chatId, user });

  const messages = await GroupChatMessage.findAll({
    where: { group_chat_id: chatId },
    include: [
      {
        model: User,
        attributes: ["id", "name"],
        as: "Sender",
        required: false,
      },
    ],
    order: [["created_at", "ASC"]],
  });

  return messages.map((m) => ({
    id: m.id,
    sender_id: m.sender_user_id,
    sender_name: m.Sender?.name ?? "Unknown",
    content: m.message_text || m.image_url,
    type: m.message_type,
    created_at: m.created_at,
  }));
}
