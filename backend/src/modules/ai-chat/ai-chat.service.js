import { config as loadEnv } from "dotenv";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import { Op } from "sequelize";
import AiChatConversation from "./ai-chat-conversation.model.js";
import AiChatMessage from "./ai-chat-message.model.js";
import AppError from "../../shared/appError.js";
import {
  buildStudentFollowupSuggestions,
  generateAiFollowup,
} from "../ai-followup/aiFollowup.service.js";

loadEnv();

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(MODULE_DIR, "../../../");
const FOLLOWUP_UPLOAD_DIR = path.join(PROJECT_ROOT, "uploads", "ai-followups");
const FOLLOWUP_UPLOAD_URL = "/api/ai-followup/uploads/ai-followups";
const OPENAI_TEXT_MODEL = process.env.OPENAI_FOLLOWUP_MODEL || "gpt-4o-mini";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_FOLLOWUP_IMAGE_MODEL || "gpt-image-1";
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizeTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getTopicText(question) {
  return normalizeText(question)
    .replace(/^(what is|what are|explain|describe)\s+/i, "")
    .replace(/[?.!]+$/g, "");
}

function buildPictureFallbackAnswer({
  originalQuestion,
  previousAnswer,
}) {
  return `
Visual Explanation:
Picture a clean textbook diagram of ${getTopicText(originalQuestion)} with clear labels and arrows.

- Start with the main title on top.
- Put the key concept in the center.
- Add labels for each important part.
- Show the process in the correct order.
- Highlight the main points students should remember.

Text Explanation:
${previousAnswer}
`.trim();
}

async function writeGeneratedImage({
  originalQuestion,
  previousAnswer,
  base64Image,
}) {
  await mkdir(FOLLOWUP_UPLOAD_DIR, { recursive: true });

  const version = Date.now();
  const hash = crypto
    .createHash("sha1")
    .update(`${originalQuestion}\n${previousAnswer}\n${version}`)
    .digest("hex")
    .slice(0, 12);

  const filename = `picture-followup-${hash}.png`;
  const filePath = path.join(FOLLOWUP_UPLOAD_DIR, filename);
  const bytes = Buffer.from(base64Image, "base64");

  await writeFile(filePath, bytes);

  return {
    imageUrl: `${FOLLOWUP_UPLOAD_URL}/${filename}?v=${version}`,
    imageDataUrl: `data:image/png;base64,${base64Image}`,
  };
}

async function generateOpenAiTextFollowup({
  originalQuestion,
  previousAnswer,
  followupType,
}) {
  if (!openai) {
    throw new AppError("OPENAI_API_KEY is missing", 500);
  }

  const instructionsByType = {
    example: "Explain the same topic using 1 or 2 simple real-life examples.",
    step_by_step: "Explain the same topic step by step in short numbered points.",
    short_summary: "Give a very short summary in 2 or 3 simple lines.",
    picture: "Describe the topic like a simple visual textbook diagram for a student.",
  };

  const response = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a friendly educational AI for school students. Keep answers clear, short, accurate, and easy to understand.",
      },
      {
        role: "user",
        content: [
          `Original question: ${originalQuestion}`,
          `Previous answer: ${previousAnswer}`,
          `Follow-up type: ${followupType}`,
          `Instruction: ${
            instructionsByType[followupType] ||
            "Continue the same topic naturally in a student-friendly way."
          }`,
          "Return only the answer text. Do not add labels or markdown fences.",
        ].join("\n\n"),
      },
    ],
  });

  return normalizeText(
    response?.choices?.[0]?.message?.content,
    "Let's continue with a short, clear explanation."
  );
}

async function generateOpenAiPictureFollowup({
  originalQuestion,
  previousAnswer,
}) {
  if (!openai) {
    throw new AppError("OPENAI_API_KEY is missing", 500);
  }

  const topic = getTopicText(originalQuestion);

  const imageResponse = await openai.images.generate({
    model: OPENAI_IMAGE_MODEL,
    prompt: [
      `Create a clean educational textbook-style diagram about ${topic}.`,
      "Use a white background, clear labels, neat arrows, and student-friendly scientific illustration.",
      "Make it look like a school study poster, readable and uncluttered.",
    ].join(" "),
    size: "1536x1024",
  });

  const base64Image = imageResponse?.data?.[0]?.b64_json;
  if (!base64Image) {
    throw new Error("OpenAI image generation returned no image");
  }

  return writeGeneratedImage({
    originalQuestion,
    previousAnswer,
    base64Image,
  });
}

function getConversationTitle(messages = [], preferredTitle = "") {
  const explicit = normalizeText(preferredTitle);
  if (explicit) return explicit.slice(0, 255);

  const firstUserMessage = messages.find((message) => message?.role === "user" && normalizeText(message?.text));
  const raw = normalizeText(firstUserMessage?.text, "New Chat");
  return raw.length > 80 ? `${raw.slice(0, 77)}...` : raw;
}

function getPreviewText(messages = []) {
  const latest = [...messages]
    .reverse()
    .find((message) => normalizeText(message?.text) || normalizeText(message?.image_name));
  return normalizeText(latest?.text || latest?.image_name || "").slice(0, 500) || null;
}

function serializeMessage(message) {
  return {
    id: message.public_id,
    role: message.role,
    text: message.text || "",
    imageName: message.image_name || null,
    imagePreviewUrl: message.image_preview_url || null,
    metadata: message.metadata || null,
    timestamp: message.sent_at,
    deletedAt: message.deleted_at,
    createdAt: message.created_at,
    updatedAt: message.updated_at,
  };
}

function serializeConversation(conversation, messages = null) {
  return {
    id: conversation.public_id,
    title: conversation.title,
    previewText: conversation.preview_text || "",
    classLevel: conversation.class_level || null,
    messageCount: Number(conversation.message_count || 0),
    updatedAt: conversation.last_message_at || conversation.updated_at || conversation.created_at,
    lastSyncedAt: conversation.last_synced_at || null,
    createdAt: conversation.created_at,
    deletedAt: conversation.deleted_at,
    metadata: conversation.metadata || null,
    messages: Array.isArray(messages) ? messages.map(serializeMessage) : undefined,
  };
}

async function requireConversationOwner({ conversationPublicId, userId, includeDeleted = true }) {
  const where = {
    public_id: String(conversationPublicId || ""),
    user_id: userId,
  };

  if (!includeDeleted) {
    where.deleted_at = null;
  }

  const conversation = await AiChatConversation.findOne({ where });
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }
  return conversation;
}

async function upsertConversationSnapshot({ user, snapshot }) {
  const publicId = normalizeText(snapshot?.id);
  if (!publicId) {
    throw new AppError("Conversation id is required", 400);
  }

  const rawMessages = Array.isArray(snapshot?.messages) ? snapshot.messages : [];
  const normalizedMessages = rawMessages.map((message, index) => ({
    id: normalizeText(message?.id || `${publicId}_msg_${index}_${normalizeTimestamp(message?.timestamp).getTime()}`),
    role: ["user", "ai", "system"].includes(message?.role) ? message.role : "user",
    text: normalizeText(message?.text),
    imageName: normalizeText(message?.imageName || message?.image_name || "") || null,
    imagePreviewUrl: normalizeText(message?.imagePreviewUrl || message?.image_preview_url || "") || null,
    metadata: message?.metadata || null,
    timestamp: normalizeTimestamp(message?.timestamp),
    deletedAt: message?.deletedAt ? normalizeTimestamp(message.deletedAt) : null,
  }));

  const title = getConversationTitle(normalizedMessages, snapshot?.title);
  const previewText = getPreviewText(normalizedMessages);
  const lastMessageAt = normalizedMessages.length
    ? normalizedMessages[normalizedMessages.length - 1].timestamp
    : normalizeTimestamp(snapshot?.updatedAt || snapshot?.createdAt);

  const [conversation, created] = await AiChatConversation.findOrCreate({
    where: { public_id: publicId },
    defaults: {
      public_id: publicId,
      user_id: user.id,
      school_id: user.school_id || null,
      class_level: snapshot?.classLevel || null,
      title,
      preview_text: previewText,
      message_count: normalizedMessages.length,
      last_message_at: lastMessageAt,
      last_synced_at: new Date(),
      metadata: snapshot?.metadata || null,
      deleted_at: snapshot?.deletedAt ? normalizeTimestamp(snapshot.deletedAt) : null,
      created_at: normalizeTimestamp(snapshot?.createdAt),
      updated_at: normalizeTimestamp(snapshot?.updatedAt),
    },
  });

  if (!created && conversation.user_id !== user.id) {
    throw new AppError("Conversation belongs to another user", 403);
  }

  await conversation.update({
    school_id: user.school_id || conversation.school_id || null,
    class_level: snapshot?.classLevel || conversation.class_level || null,
    title,
    preview_text: previewText,
    message_count: Math.max(conversation.message_count || 0, normalizedMessages.length),
    last_message_at: lastMessageAt,
    last_synced_at: new Date(),
    metadata: snapshot?.metadata || conversation.metadata || null,
    deleted_at: snapshot?.deletedAt ? normalizeTimestamp(snapshot.deletedAt) : null,
  });

  for (const message of normalizedMessages) {
    const [row, rowCreated] = await AiChatMessage.findOrCreate({
      where: { public_id: message.id },
      defaults: {
        public_id: message.id,
        conversation_id: conversation.id,
        user_id: user.id,
        role: message.role,
        text: message.text || null,
        image_name: message.imageName,
        image_preview_url: message.imagePreviewUrl,
        metadata: message.metadata,
        sent_at: message.timestamp,
        deleted_at: message.deletedAt,
      },
    });

    if (!rowCreated && row.user_id === user.id) {
      await row.update({
        role: message.role,
        text: message.text || null,
        image_name: message.imageName,
        image_preview_url: message.imagePreviewUrl,
        metadata: message.metadata,
        sent_at: message.timestamp,
        deleted_at: message.deletedAt,
      });
    }
  }

  const totalMessages = await AiChatMessage.count({
    where: {
      conversation_id: conversation.id,
      deleted_at: null,
    },
  });

  if (conversation.message_count !== totalMessages) {
    await conversation.update({ message_count: totalMessages });
  }

  return conversation;
}

export async function syncAiChatConversations({ user, conversations = [] }) {
  const synced = [];
  for (const snapshot of conversations) {
    const conversation = await upsertConversationSnapshot({ user, snapshot });
    synced.push(conversation);
  }
  return synced.map((conversation) => serializeConversation(conversation));
}

export async function upsertAiChatConversation({ user, conversation }) {
  const saved = await upsertConversationSnapshot({ user, snapshot: conversation });
  const messages = await AiChatMessage.findAll({
    where: {
      conversation_id: saved.id,
    },
    order: [["sent_at", "ASC"], ["id", "ASC"]],
  });
  return serializeConversation(saved, messages);
}

export async function listAiChatConversations({
  user,
  classLevel,
  search = "",
  limit = 20,
  offset = 0,
  includeDeleted = false,
}) {
  const where = {
    user_id: user.id,
  };

  if (!includeDeleted) {
    where.deleted_at = null;
  }

  if (classLevel) {
    where.class_level = classLevel;
  }

  const query = normalizeText(search);
  if (query) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${query}%` } },
      { preview_text: { [Op.iLike]: `%${query}%` } },
    ];
  }

  const rows = await AiChatConversation.findAll({
    where,
    order: [["last_message_at", "DESC NULLS LAST"], ["updated_at", "DESC"], ["created_at", "DESC"]],
    limit,
    offset,
  });

  const total = await AiChatConversation.count({ where });

  return {
    items: rows.map((row) => serializeConversation(row)),
    total,
    limit,
    offset,
    hasMore: offset + rows.length < total,
  };
}

export async function getAiChatConversation({ user, conversationId }) {
  const conversation = await requireConversationOwner({
    conversationPublicId: conversationId,
    userId: user.id,
  });

  const messages = await AiChatMessage.findAll({
    where: {
      conversation_id: conversation.id,
      deleted_at: null,
    },
    order: [["sent_at", "ASC"], ["id", "ASC"]],
  });

  return serializeConversation(conversation, messages);
}

export async function getAiChatMessages({
  user,
  conversationId,
  limit = 100,
  offset = 0,
}) {
  const conversation = await requireConversationOwner({
    conversationPublicId: conversationId,
    userId: user.id,
    includeDeleted: false,
  });

  const rows = await AiChatMessage.findAll({
    where: {
      conversation_id: conversation.id,
      deleted_at: null,
    },
    order: [["sent_at", "DESC"], ["id", "DESC"]],
    limit,
    offset,
  });

  const total = await AiChatMessage.count({
    where: {
      conversation_id: conversation.id,
      deleted_at: null,
    },
  });

  return {
    items: rows.reverse().map((row) => serializeMessage(row)),
    total,
    limit,
    offset,
    hasMore: offset + rows.length < total,
  };
}

export async function softDeleteAiChatConversation({ user, conversationId }) {
  const conversation = await requireConversationOwner({
    conversationPublicId: conversationId,
    userId: user.id,
    includeDeleted: false,
  });
  await conversation.update({ deleted_at: new Date() });
  return { message: "Conversation moved to recovery" };
}

export async function restoreAiChatConversation({ user, conversationId }) {
  const conversation = await requireConversationOwner({
    conversationPublicId: conversationId,
    userId: user.id,
    includeDeleted: true,
  });
  await conversation.update({ deleted_at: null, last_synced_at: new Date() });
  return serializeConversation(conversation);
}

export async function generateAiChatFollowup({
  originalQuestion,
  previousAnswer,
  followupType,
}) {
  const safeQuestion = normalizeText(originalQuestion);
  const safeAnswer = normalizeText(previousAnswer);
  const safeType = normalizeText(followupType).toLowerCase();

  if (!safeQuestion || !safeAnswer || !safeType) {
    throw new AppError("Question, previous answer, and followup type are required", 400);
  }

  if (safeType === "picture") {
    try {
      const imageResult = await generateOpenAiPictureFollowup({
        originalQuestion: safeQuestion,
        previousAnswer: safeAnswer,
      });

      return {
        answer: `This picture explains ${getTopicText(safeQuestion)} in a simple visual way.`,
        followupType: safeType,
        source: "ai-chat-followup",
        imageUrl: imageResult.imageUrl,
        imageDataUrl: imageResult.imageDataUrl,
        followupSuggestions: buildStudentFollowupSuggestions({
          originalQuestion: safeQuestion,
          previousAnswer: safeAnswer,
        }),
      };
    } catch (error) {
      try {
        const geminiResult = await generateAiFollowup({
          originalQuestion: safeQuestion,
          previousAnswer: safeAnswer,
          followupType: safeType,
        });

        if (geminiResult?.imageUrl || geminiResult?.imageDataUrl) {
          return {
            answer:
              geminiResult.answer ||
              `This picture explains ${getTopicText(safeQuestion)} in a simple visual way.`,
            followupType: safeType,
            source: "ai-chat-followup",
            imageUrl: geminiResult.imageUrl || null,
            imageDataUrl: geminiResult.imageDataUrl || null,
            followupSuggestions: buildStudentFollowupSuggestions({
              originalQuestion: safeQuestion,
              previousAnswer: safeAnswer,
            }),
          };
        }
      } catch {
        // Fall through to text fallback below.
      }

      const fallbackAnswer = await generateOpenAiTextFollowup({
        originalQuestion: safeQuestion,
        previousAnswer: safeAnswer,
        followupType: safeType,
      }).catch(() =>
        buildPictureFallbackAnswer({
          originalQuestion: safeQuestion,
          previousAnswer: safeAnswer,
        })
      );

      return {
        answer: fallbackAnswer,
        followupType: safeType,
        source: "ai-chat-followup",
        followupSuggestions: buildStudentFollowupSuggestions({
          originalQuestion: safeQuestion,
          previousAnswer: safeAnswer,
        }),
      };
    }
  }

  const answer = await generateOpenAiTextFollowup({
    originalQuestion: safeQuestion,
    previousAnswer: safeAnswer,
    followupType: safeType,
  });

  return {
    answer,
    followupType: safeType,
    source: "ai-chat-followup",
    followupSuggestions: buildStudentFollowupSuggestions({
      originalQuestion: safeQuestion,
      previousAnswer: safeAnswer,
    }),
  };
}
