import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AutoAwesome, Image, Send } from "@mui/icons-material";
import { useAuth } from "../../auth/AuthProvider";
import { askAiQuestion } from "../ai-chat/api/aiChat.api";

const DEFAULT_TOPIC = "respiratory system diagram in science";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";

const EMPTY_POSTER = {
  title: "",
  subtitle: "",
  poster_type: "concept",
  center_topic: "",
  labels: [],
  process_steps: [],
};

function buildTutorPrompt(topic) {
  return `You are an AI educational visual designer for the KiddoShadow learning platform.

When a student asks any science or educational question, convert it into a HIGH-QUALITY SCIENCE BOOK STYLE LABELED DIAGRAM POSTER.

Return JSON only in this format:
{
  "title": "",
  "subtitle": "",
  "poster_type": "anatomy",
  "center_topic": "",
  "labels": [
    { "name": "", "note": "" }
  ],
  "process_steps": [""]
}

Rules:
- Create a clean science-book style educational diagram poster only.
- Use simple English for school students.
- Use 4 to 6 labels.
- Each label note must be 1 to 2 short lines.
- subtitle must be one short line.
- process_steps must have 2 to 4 short steps.
- Use poster_type as one of: "anatomy", "process", "cycle", "concept".
- Use "anatomy" for labeled body systems or plant parts.
- Use "cycle" for natural cycles or life cycles.
- Use "process" for steps like photosynthesis, digestion, food chain, water cycle.
- Use "concept" for general school topics.
- Give real educational labels, never generic labels like Main Idea or Part 1.
- Prefer real science labels such as parts, organs, stages, gases, or chambers when needed.
- Make the result look like a neat science textbook diagram with a realistic centered subject and label arrows.
- If the topic is about anatomy or organs, use real body-part labels only.
- If the topic is about a process, use real step names only.
- Do not repeat the student's words blindly. Convert them into proper textbook labels.
- Return valid JSON only. No markdown. No extra text.

Student Topic:
"${topic}"`;
}

async function askVisualTutorWithGemini(prompt) {
  if (!GEMINI_API_KEY) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
      GEMINI_API_KEY
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Gemini visual generation failed.");
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") ||
    "";

  return { answer: text };
}

function tryParseTutorJson(rawText) {
  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch {
    const fencedMatch = String(rawText).match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      try {
        return JSON.parse(fencedMatch[1].trim());
      } catch {
        // continue
      }
    }

    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;

    try {
      return JSON.parse(rawText.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function shorten(text, max) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3).trim()}...`;
}

function escapeXml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapSvgText(text, maxCharsPerLine = 18, maxLines = 4) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });

  if (current) lines.push(current);

  return lines.slice(0, maxLines).map((line, index, arr) => {
    if (index === arr.length - 1 && lines.length > maxLines) {
      return shorten(line, maxCharsPerLine);
    }
    return line;
  });
}

function sanitizePoster(parsed, fallbackTopic) {
  const base = parsed && typeof parsed === "object" ? parsed : {};
  const labels = Array.isArray(base.labels) ? base.labels : [];
  const processSteps = Array.isArray(base.process_steps) ? base.process_steps : [];
  const type = String(base.poster_type || "concept").toLowerCase();

  return {
    title: String(base.title || normalizeTopicLabel(fallbackTopic) || "Visual Tutor"),
    subtitle: String(base.subtitle || "A simple educational visual for students."),
    poster_type: ["anatomy", "process", "cycle", "concept"].includes(type)
      ? type
      : "concept",
    center_topic: String(
      base.center_topic || base.title || normalizeTopicLabel(fallbackTopic) || "Topic"
    ),
    labels: labels
      .map((item) => ({
        name: String(item?.name || "").trim(),
        note: String(item?.note || "").trim(),
      }))
      .filter((item) => item.name)
      .slice(0, 6),
    process_steps: processSteps
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 4),
  };
}

function toTitleCase(text) {
  return String(text || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeTopicLabel(topic) {
  return toTitleCase(
    String(topic || "")
      .replace(/\b(with|show|give|diagram|picture|visual|in|science)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function inferTopicKeywords(topic) {
  return String(topic || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !["with", "show", "give", "diagram", "picture", "visual", "explain"].includes(word));
}

function buildAdaptiveLabels(topic) {
  const words = inferTopicKeywords(topic);
  const important = words.filter((word) => word.length > 3).slice(0, 6);
  const titleWord = normalizeTopicLabel(topic) || "Science Topic";

  if (!important.length) {
    return [
      { name: "Definition", note: "This explains the meaning of the topic." },
      { name: "Main Part", note: "This shows one important part of the topic." },
      { name: "Function", note: "This tells what the topic does or how it works." },
      { name: "Example", note: "This gives a simple real-life example." },
    ];
  }

  return important.map((word, index) => {
    const readable = toTitleCase(word);
    const noteTemplates = [
      `${readable} is an important part of ${titleWord}.`,
      `${readable} helps the topic work clearly and correctly.`,
      `${readable} shows one key idea students should remember.`,
      `${readable} connects with the main concept in this diagram.`,
      `${readable} is useful when learning this science topic.`,
      `${readable} explains one special feature of the subject.`,
    ];

    return {
      name: readable,
      note: noteTemplates[index % noteTemplates.length],
    };
  });
}

function buildAdaptiveSteps(topic) {
  const words = inferTopicKeywords(topic);
  const readableTopic = normalizeTopicLabel(topic) || "the topic";

  return [
    `Start by identifying ${readableTopic}.`,
    "Look at the labeled parts carefully.",
    "See how the parts connect and work together.",
    "Remember the main idea of the diagram.",
  ];
}

function detectPresetTopic(topic) {
  const normalized = String(topic || "")
    .toLowerCase()
    .replace(/\b(with|show|give|diagram|picture|visual|explain|about)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.includes("respiratory") || normalized.includes("lungs")) return "respiratory";
  if (normalized.includes("heart") || normalized.includes("circulation")) return "heart";
  if (normalized.includes("photosynthesis")) return "photosynthesis";
  if (normalized.includes("butterfly")) return "butterfly";
  if (normalized.includes("food chain")) return "food-chain";
  if (normalized.includes("water cycle")) return "water-cycle";
  if (normalized.includes("digestive") || normalized.includes("stomach") || normalized.includes("intestine")) return "digestive";
  if (normalized.includes("brain") || normalized.includes("nervous system")) return "brain";
  if (normalized.includes("cell") || normalized.includes("nucleus")) return "cell";
  if (normalized.includes("solar system") || normalized.includes("planet")) return "solar-system";
  return null;
}

function isWeakPoster(poster) {
  const labels = Array.isArray(poster?.labels) ? poster.labels : [];
  const weakNames = new Set([
    "main idea",
    "part 1",
    "part 2",
    "part 3",
    "part 4",
    "idea 1",
    "idea 2",
    "idea 3",
    "idea 4",
    "label 1",
    "label 2",
    "topic",
    "part a",
    "part b",
    "part c",
    "definition",
    "main part",
    "function",
    "example",
  ]);
  const weakNotePatterns = [
    "this part",
    "main school topic",
    "simple educational visual",
    "helps complete",
    "another detail",
    "real-life example",
    "meaning of the topic",
    "important part of the topic",
  ];

  if (!labels.length) return true;

  const weakLabelCount = labels.filter((item) =>
    weakNames.has(String(item?.name || "").trim().toLowerCase())
  ).length;

  const weakNoteCount = labels.filter((item) =>
    weakNotePatterns.some((pattern) =>
      String(item?.note || "").trim().toLowerCase().includes(pattern)
    )
  ).length;

  const genericTitle = ["visual tutor", "educational diagram", "topic"].includes(
    String(poster?.title || "").trim().toLowerCase()
  );

  return (
    weakLabelCount >= Math.max(2, Math.floor(labels.length / 2)) ||
    weakNoteCount >= Math.max(2, Math.floor(labels.length / 2)) ||
    genericTitle
  );
}

function buildFallbackPoster(topic) {
  const cleanTopic = String(topic || "").trim();
  const preset = detectPresetTopic(cleanTopic);

  if (preset === "respiratory") {
    return {
      title: "Respiratory System",
      subtitle:
        "The respiratory system helps us breathe in oxygen and breathe out carbon dioxide.",
      poster_type: "anatomy",
      center_topic: "Respiratory System",
      labels: [
        { name: "Nasal Cavity", note: "Air enters through the nose." },
        { name: "Mouth", note: "Air can also enter through the mouth." },
        { name: "Trachea", note: "This tube carries air toward the lungs." },
        { name: "Bronchi", note: "Two main branches take air into each lung." },
        { name: "Lungs", note: "The lungs exchange oxygen and carbon dioxide." },
        { name: "Diaphragm", note: "This muscle moves during breathing." },
      ],
      process_steps: [
        "Air enters through the nose or mouth.",
        "Air moves down the trachea.",
        "The lungs take in oxygen.",
        "Carbon dioxide leaves during exhalation.",
      ],
    };
  }

  if (preset === "heart") {
    return {
      title: "Heart Anatomy",
      subtitle: "The heart pumps blood through the body and has four main chambers.",
      poster_type: "anatomy",
      center_topic: "Heart Anatomy",
      labels: [
        { name: "Aorta", note: "This large artery carries blood from the heart." },
        { name: "Right Atrium", note: "This chamber receives blood from the body." },
        { name: "Right Ventricle", note: "This chamber pumps blood to the lungs." },
        { name: "Left Atrium", note: "This chamber receives blood from the lungs." },
        { name: "Left Ventricle", note: "This chamber pumps blood to the body." },
        { name: "Septum", note: "This wall separates the left and right sides." },
      ],
      process_steps: [
        "Blood enters the right atrium.",
        "The right ventricle sends blood to the lungs.",
        "Oxygen-rich blood returns to the left atrium.",
        "The left ventricle pumps blood through the body.",
      ],
    };
  }

  if (preset === "photosynthesis") {
    return {
      title: "Photosynthesis",
      subtitle:
        "Plants use sunlight, water, and carbon dioxide to make food.",
      poster_type: "process",
      center_topic: "Photosynthesis",
      labels: [
        { name: "Sunlight", note: "Plants get energy from the sun." },
        { name: "Water", note: "Roots take water from the soil." },
        { name: "Carbon Dioxide", note: "Leaves take this gas from the air." },
        { name: "Chlorophyll", note: "The green pigment traps sunlight." },
        { name: "Glucose", note: "The plant makes food called glucose." },
        { name: "Oxygen", note: "Oxygen is released into the air." },
      ],
      process_steps: [
        "Sunlight reaches the leaf.",
        "Water moves from roots to leaves.",
        "Leaves take in carbon dioxide.",
        "The plant makes food and gives out oxygen.",
      ],
    };
  }

  if (preset === "butterfly") {
    return {
      title: "Life Cycle of Butterfly",
      subtitle: "A butterfly grows through four main stages.",
      poster_type: "cycle",
      center_topic: "Butterfly Life Cycle",
      labels: [
        { name: "Egg", note: "A butterfly lays eggs on leaves." },
        { name: "Larva", note: "The caterpillar hatches and eats leaves." },
        { name: "Pupa", note: "The caterpillar changes inside a chrysalis." },
        { name: "Adult Butterfly", note: "The butterfly comes out and flies." },
      ],
      process_steps: [
        "Egg stage begins the cycle.",
        "Larva grows quickly.",
        "Pupa changes the body.",
        "Adult butterfly starts the cycle again.",
      ],
    };
  }

  if (preset === "food-chain") {
    return {
      title: "Food Chain",
      subtitle:
        "A food chain shows how energy moves from one living thing to another.",
      poster_type: "process",
      center_topic: "Food Chain",
      labels: [
        { name: "Sun", note: "The sun gives energy to plants." },
        { name: "Producer", note: "Plants make their own food." },
        { name: "Primary Consumer", note: "A herbivore eats the plant." },
        { name: "Secondary Consumer", note: "A carnivore eats the herbivore." },
        { name: "Top Consumer", note: "A bigger animal eats smaller animals." },
        { name: "Decomposer", note: "Decomposers return nutrients to the soil." },
      ],
      process_steps: [
        "Sunlight helps plants grow.",
        "Plants are eaten by herbivores.",
        "Herbivores are eaten by carnivores.",
        "Decomposers recycle dead matter.",
      ],
    };
  }

  if (preset === "water-cycle") {
    return {
      title: "Water Cycle",
      subtitle:
        "Water moves through nature again and again in a repeating cycle.",
      poster_type: "cycle",
      center_topic: "Water Cycle",
      labels: [
        { name: "Evaporation", note: "Heat changes water into vapor." },
        { name: "Condensation", note: "Water vapor cools and forms clouds." },
        { name: "Precipitation", note: "Water falls as rain or snow." },
        { name: "Collection", note: "Water gathers in lakes, rivers, and seas." },
      ],
      process_steps: [
        "Water heats up and evaporates.",
        "Vapor cools into clouds.",
        "Clouds release rain.",
        "Water collects and repeats the cycle.",
      ],
    };
  }

  if (preset === "digestive") {
    return {
      title: "Digestive System",
      subtitle: "The digestive system breaks food into nutrients the body can use.",
      poster_type: "anatomy",
      center_topic: "Digestive System",
      labels: [
        { name: "Mouth", note: "Food is chewed and mixed with saliva." },
        { name: "Esophagus", note: "This tube carries food to the stomach." },
        { name: "Stomach", note: "Food is mixed and broken down here." },
        { name: "Small Intestine", note: "Most nutrients are absorbed here." },
        { name: "Large Intestine", note: "Water is absorbed from waste." },
        { name: "Liver", note: "The liver helps with digestion." },
      ],
      process_steps: [
        "Food enters the mouth.",
        "It moves to the stomach.",
        "Nutrients are absorbed in the small intestine.",
        "Waste leaves the body after digestion.",
      ],
    };
  }

  if (preset === "brain") {
    return {
      title: "Brain Diagram",
      subtitle: "The brain controls thinking, movement, memory, and body actions.",
      poster_type: "anatomy",
      center_topic: "Human Brain",
      labels: [
        { name: "Cerebrum", note: "This part helps us think and learn." },
        { name: "Cerebellum", note: "This part helps with balance and movement." },
        { name: "Brain Stem", note: "This part controls breathing and heartbeat." },
        { name: "Frontal Lobe", note: "This area helps with planning and speaking." },
        { name: "Parietal Lobe", note: "This area helps us feel touch and space." },
        { name: "Occipital Lobe", note: "This area helps us see." },
      ],
      process_steps: [
        "The brain receives messages from the body.",
        "It processes information quickly.",
        "It sends signals to different body parts.",
        "The body responds to those signals.",
      ],
    };
  }

  if (preset === "cell") {
    return {
      title: "Cell Structure",
      subtitle: "A cell is the basic unit of life and contains many tiny parts.",
      poster_type: "anatomy",
      center_topic: "Cell Diagram",
      labels: [
        { name: "Cell Membrane", note: "It controls what enters and leaves the cell." },
        { name: "Nucleus", note: "It controls the activities of the cell." },
        { name: "Cytoplasm", note: "This jelly-like part holds the organelles." },
        { name: "Mitochondria", note: "These parts release energy for the cell." },
        { name: "Vacuole", note: "It stores water, food, or waste." },
        { name: "Ribosomes", note: "They help make proteins." },
      ],
      process_steps: [
        "The cell takes in materials.",
        "The nucleus controls activities.",
        "Organelles do special jobs.",
        "The cell grows and functions properly.",
      ],
    };
  }

  if (preset === "solar-system") {
    return {
      title: "Solar System",
      subtitle: "The solar system has the sun at the center and planets around it.",
      poster_type: "concept",
      center_topic: "Solar System",
      labels: [
        { name: "Sun", note: "The sun is the star at the center." },
        { name: "Mercury", note: "Mercury is the closest planet to the sun." },
        { name: "Earth", note: "Earth is the planet where we live." },
        { name: "Mars", note: "Mars is called the red planet." },
        { name: "Jupiter", note: "Jupiter is the largest planet." },
        { name: "Saturn", note: "Saturn is known for its bright rings." },
      ],
      process_steps: [
        "The sun gives light and heat.",
        "Planets move around the sun.",
        "Each planet follows its own path.",
        "The solar system stays together by gravity.",
      ],
    };
  }

  return {
    title: shorten(normalizeTopicLabel(cleanTopic || "Educational Diagram"), 48),
    subtitle: "This topic is shown as a clean science-book style diagram.",
    poster_type: "concept",
    center_topic: shorten(normalizeTopicLabel(cleanTopic || "Topic"), 30),
    labels: buildAdaptiveLabels(cleanTopic),
    process_steps: buildAdaptiveSteps(cleanTopic),
  };
}

function createSun(cx, cy, scale = 1) {
  const rayLines = Array.from({ length: 12 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 12;
    const x1 = cx + Math.cos(angle) * 54 * scale;
    const y1 = cy + Math.sin(angle) * 54 * scale;
    const x2 = cx + Math.cos(angle) * 74 * scale;
    const y2 = cy + Math.sin(angle) * 74 * scale;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f59e0b" stroke-width="${4 * scale}" stroke-linecap="round"/>`;
  }).join("");

  return `
    <g>
      ${rayLines}
      <circle cx="${cx}" cy="${cy}" r="${38 * scale}" fill="#f4c542" stroke="#b7791f" stroke-width="${3 * scale}"/>
      <circle cx="${cx}" cy="${cy}" r="${26 * scale}" fill="#fff7d6" opacity="0.45"/>
    </g>
  `;
}

function createLungs(cx, cy) {
  return `
    <g>
      <path d="M${cx} ${cy - 146} C ${cx - 20} ${cy - 120}, ${cx - 18} ${cy - 78}, ${cx} ${cy - 28} V ${cy + 124}" stroke="#59a3d8" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M${cx} ${cy - 44} C ${cx - 24} ${cy - 18}, ${cx - 56} ${cy + 4}, ${cx - 88} ${cy + 34}" stroke="#59a3d8" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M${cx} ${cy - 44} C ${cx + 24} ${cy - 18}, ${cx + 56} ${cy + 4}, ${cx + 88} ${cy + 34}" stroke="#59a3d8" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M${cx - 18} ${cy - 6} C ${cx - 124} ${cy - 60}, ${cx - 166} ${cy + 56}, ${cx - 132} ${cy + 170} C ${cx - 96} ${cy + 228}, ${cx - 20} ${cy + 200}, ${cx - 8} ${cy + 106} Z" fill="#f2a0a0" stroke="#b55f6f" stroke-width="5"/>
      <path d="M${cx + 18} ${cy - 6} C ${cx + 124} ${cy - 60}, ${cx + 166} ${cy + 56}, ${cx + 132} ${cy + 170} C ${cx + 96} ${cy + 228}, ${cx + 20} ${cy + 200}, ${cx + 8} ${cy + 106} Z" fill="#f2a0a0" stroke="#b55f6f" stroke-width="5"/>
      <path d="M${cx - 120} ${cy + 208} Q ${cx} ${cy + 258}, ${cx + 120} ${cy + 208}" stroke="#b45f4a" stroke-width="10" fill="none" stroke-linecap="round"/>
    </g>
  `;
}

function createHeart(cx, cy) {
  return `
    <g>
      <path d="M${cx - 18} ${cy - 168} C ${cx - 18} ${cy - 214}, ${cx + 18} ${cy - 214}, ${cx + 18} ${cy - 168} V ${cy - 34}" fill="#ff6262" stroke="#b83030" stroke-width="4"/>
      <path d="M${cx + 18} ${cy - 158} C ${cx + 40} ${cy - 206}, ${cx + 94} ${cy - 210}, ${cx + 116} ${cy - 154} C ${cx + 76} ${cy - 144}, ${cx + 48} ${cy - 120}, ${cx + 30} ${cy - 92}" fill="#ff6262" stroke="#b83030" stroke-width="4"/>
      <path d="M${cx - 18} ${cy - 158} C ${cx - 40} ${cy - 206}, ${cx - 94} ${cy - 210}, ${cx - 116} ${cy - 154} C ${cx - 76} ${cy - 144}, ${cx - 48} ${cy - 120}, ${cx - 30} ${cy - 92}" fill="#ff6262" stroke="#b83030" stroke-width="4"/>
      <path d="M${cx - 130} ${cy - 12} C ${cx - 176} ${cy - 88}, ${cx - 114} ${cy - 176}, ${cx - 34} ${cy - 148} C ${cx + 8} ${cy - 132}, ${cx + 18} ${cy - 98}, ${cx + 2} ${cy - 40} C ${cx - 16} ${cy + 26}, ${cx - 50} ${cy + 114}, ${cx - 6} ${cy + 184} C ${cx + 64} ${cy + 132}, ${cx + 116} ${cy + 40}, ${cx + 132} ${cy - 54} C ${cx + 142} ${cy - 118}, ${cx + 98} ${cy - 164}, ${cx + 42} ${cy - 154} C ${cx + 12} ${cy - 148}, ${cx - 2} ${cy - 132}, ${cx - 14} ${cy - 100} C ${cx - 24} ${cy - 70}, ${cx - 22} ${cy - 38}, ${cx - 20} ${cy - 8} Z" fill="#d33434" stroke="#7f1313" stroke-width="6"/>
      <path d="M${cx + 10} ${cy - 146} C ${cx + 84} ${cy - 146}, ${cx + 128} ${cy - 120}, ${cx + 142} ${cy - 74}" fill="none" stroke="#3663d8" stroke-width="34" stroke-linecap="round"/>
      <path d="M${cx + 18} ${cy - 30} C ${cx - 16} ${cy - 8}, ${cx - 42} ${cy + 22}, ${cx - 64} ${cy + 62}" fill="none" stroke="#3663d8" stroke-width="26" stroke-linecap="round"/>
      <path d="M${cx + 18} ${cy - 30} C ${cx + 36} ${cy + 10}, ${cx + 48} ${cy + 46}, ${cx + 58} ${cy + 78}" fill="none" stroke="#3663d8" stroke-width="26" stroke-linecap="round"/>
      <path d="M${cx - 32} ${cy - 68} L ${cx + 16} ${cy + 148}" stroke="#f5b7b7" stroke-width="7" opacity="0.85"/>
      <path d="M${cx - 102} ${cy - 18} C ${cx - 54} ${cy + 6}, ${cx - 10} ${cy + 54}, ${cx + 24} ${cy + 120}" stroke="#8f1717" stroke-width="4" opacity="0.4" fill="none"/>
      <path d="M${cx + 110} ${cy - 40} C ${cx + 56} ${cy - 10}, ${cx + 20} ${cy + 34}, ${cx - 8} ${cy + 102}" stroke="#8f1717" stroke-width="4" opacity="0.4" fill="none"/>
    </g>
  `;
}

function createPlant(cx, cy) {
  return `
    <g>
      ${createSun(cx - 146, cy - 116, 0.65)}
      <path d="M${cx} ${cy + 162} C ${cx + 4} ${cy + 96}, ${cx + 5} ${cy + 26}, ${cx + 3} ${cy - 86}" stroke="#355e3b" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M${cx + 5} ${cy - 24} C ${cx + 72} ${cy - 70}, ${cx + 132} ${cy - 44}, ${cx + 146} ${cy + 12} C ${cx + 92} ${cy + 20}, ${cx + 38} ${cy + 18}, ${cx + 5} ${cy - 24} Z" fill="#5b8c62" stroke="#2f4f35" stroke-width="4"/>
      <path d="M${cx - 4} ${cy + 44} C ${cx - 72} ${cy - 8}, ${cx - 138} ${cy + 28}, ${cx - 148} ${cy + 90} C ${cx - 90} ${cy + 92}, ${cx - 36} ${cy + 84}, ${cx - 4} ${cy + 44} Z" fill="#7aa37d" stroke="#355e3b" stroke-width="4"/>
      <path d="M${cx - 74} ${cy + 188} C ${cx - 30} ${cy + 146}, ${cx + 32} ${cy + 146}, ${cx + 76} ${cy + 188}" stroke="#7c5a42" stroke-width="8" fill="none" stroke-linecap="round"/>
    </g>
  `;
}

function createButterfly(cx, cy) {
  return `
    <g transform="translate(${cx} ${cy})">
      <ellipse cx="-94" cy="-42" rx="82" ry="116" fill="#d97706" stroke="#1f2937" stroke-width="4.5" transform="rotate(-16)"/>
      <ellipse cx="94" cy="-42" rx="82" ry="116" fill="#d97706" stroke="#1f2937" stroke-width="4.5" transform="rotate(16)"/>
      <ellipse cx="-70" cy="84" rx="54" ry="74" fill="#f59e0b" stroke="#1f2937" stroke-width="4.5" transform="rotate(16)"/>
      <ellipse cx="70" cy="84" rx="54" ry="74" fill="#f59e0b" stroke="#1f2937" stroke-width="4.5" transform="rotate(-16)"/>
      <path d="M-40 -72 C -68 -90, -96 -94, -122 -68" stroke="#1f2937" stroke-width="3" fill="none"/>
      <path d="M40 -72 C 68 -90, 96 -94, 122 -68" stroke="#1f2937" stroke-width="3" fill="none"/>
      <rect x="-12" y="-68" width="24" height="204" rx="12" fill="#1f2937"/>
      <ellipse cx="-54" cy="-52" rx="14" ry="22" fill="#fff7ed" opacity="0.75"/>
      <ellipse cx="54" cy="-52" rx="14" ry="22" fill="#fff7ed" opacity="0.75"/>
    </g>
  `;
}

function createFoodChain(cx, cy) {
  return `
    <g>
      <circle cx="${cx}" cy="${cy}" r="172" fill="#fbfdf8" stroke="#d8e0ea" stroke-width="4"/>
      ${createSun(cx - 118, cy - 110, 0.58)}
      <path d="M${cx - 54} ${cy + 116} C ${cx - 46} ${cy + 62}, ${cx - 34} ${cy + 20}, ${cx - 22} ${cy - 44}" stroke="#44624a" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M${cx - 20} ${cy - 14} C ${cx + 28} ${cy - 54}, ${cx + 74} ${cy - 36}, ${cx + 86} ${cy + 10} C ${cx + 26} ${cy + 14}, ${cx - 2} ${cy + 4}, ${cx - 20} ${cy - 14} Z" fill="#6b8f5f" stroke="#44624a" stroke-width="3"/>
      <ellipse cx="${cx + 20}" cy="${cy + 28}" rx="38" ry="18" fill="#8b6b4f"/>
      <path d="M${cx + 106} ${cy - 54} C ${cx + 134} ${cy - 84}, ${cx + 156} ${cy - 82}, ${cx + 164} ${cy - 48} C ${cx + 132} ${cy - 42}, ${cx + 110} ${cy - 30}, ${cx + 106} ${cy - 54} Z" fill="#9ca3af" stroke="#475569" stroke-width="3"/>
    </g>
  `;
}

function createWaterCycle(cx, cy) {
  return `
    <g>
      <circle cx="${cx}" cy="${cy}" r="172" fill="#fbfdff" stroke="#d8e0ea" stroke-width="4"/>
      ${createSun(cx - 112, cy - 100, 0.55)}
      <ellipse cx="${cx}" cy="${cy + 96}" rx="126" ry="36" fill="#8ecae6" stroke="#3b82f6" stroke-width="3.5"/>
      <g fill="#ffffff" stroke="#94a3b8" stroke-width="2.5">
        <circle cx="${cx - 12}" cy="${cy - 44}" r="30"/>
        <circle cx="${cx + 18}" cy="${cy - 58}" r="34"/>
        <circle cx="${cx + 52}" cy="${cy - 38}" r="24"/>
        <rect x="${cx - 42}" y="${cy - 40}" width="108" height="28" rx="14"/>
      </g>
      <path d="M${cx - 108} ${cy + 42} Q ${cx - 38} ${cy - 18}, ${cx + 22} ${cy + 18}" stroke="#3b82f6" stroke-width="4" fill="none" opacity="0.5"/>
      <path d="M${cx + 82} ${cy - 10} Q ${cx + 44} ${cy + 28}, ${cx + 18} ${cy + 76}" stroke="#3b82f6" stroke-width="4" fill="none" opacity="0.5"/>
    </g>
  `;
}

function createCell(cx, cy) {
  return `
    <g>
      <ellipse cx="${cx}" cy="${cy}" rx="180" ry="138" fill="#f8d8e6" stroke="#b76e8a" stroke-width="5"/>
      <ellipse cx="${cx}" cy="${cy}" rx="138" ry="102" fill="#f4bfd5" stroke="#c17a95" stroke-width="3"/>
      <circle cx="${cx + 22}" cy="${cy - 8}" r="48" fill="#a78bfa" stroke="#5b21b6" stroke-width="4"/>
      <circle cx="${cx + 22}" cy="${cy - 8}" r="18" fill="#5b21b6"/>
      <ellipse cx="${cx - 70}" cy="${cy - 38}" rx="28" ry="16" fill="#d4a373" stroke="#8c5a2b" stroke-width="2.5"/>
      <ellipse cx="${cx - 86}" cy="${cy + 32}" rx="34" ry="18" fill="#9dc4e6" stroke="#386fa4" stroke-width="2.5"/>
      <ellipse cx="${cx + 88}" cy="${cy + 44}" rx="28" ry="16" fill="#8fb996" stroke="#386641" stroke-width="2.5"/>
      <ellipse cx="${cx + 98}" cy="${cy - 56}" rx="30" ry="18" fill="#d4a5a5" stroke="#8d3b3b" stroke-width="2.5"/>
    </g>
  `;
}

function createBrain(cx, cy) {
  return `
    <g>
      <path d="M${cx - 126} ${cy + 18} C ${cx - 168} ${cy - 82}, ${cx - 108} ${cy - 168}, ${cx - 22} ${cy - 154} C ${cx + 24} ${cy - 196}, ${cx + 122} ${cy - 170}, ${cx + 136} ${cy - 90} C ${cx + 188} ${cy - 50}, ${cx + 176} ${cy + 54}, ${cx + 98} ${cy + 90} C ${cx + 74} ${cy + 150}, ${cx - 10} ${cy + 164}, ${cx - 72} ${cy + 118} C ${cx - 126} ${cy + 114}, ${cx - 162} ${cy + 72}, ${cx - 126} ${cy + 18} Z" fill="#e6b8c8" stroke="#8f5f72" stroke-width="5"/>
      <path d="M${cx - 8} ${cy - 144} V ${cy + 116}" stroke="#8f5f72" stroke-width="3.5" opacity="0.7"/>
      <path d="M${cx - 108} ${cy - 40} C ${cx - 42} ${cy - 74}, ${cx + 30} ${cy - 72}, ${cx + 104} ${cy - 32}" stroke="#b67d92" stroke-width="4.5" fill="none"/>
      <path d="M${cx - 118} ${cy + 24} C ${cx - 40} ${cy - 8}, ${cx + 40} ${cy - 10}, ${cx + 112} ${cy + 30}" stroke="#b67d92" stroke-width="4.5" fill="none"/>
      <path d="M${cx - 92} ${cy + 92} C ${cx - 20} ${cy + 58}, ${cx + 44} ${cy + 62}, ${cx + 92} ${cy + 98}" stroke="#b67d92" stroke-width="4.5" fill="none"/>
      <path d="M${cx - 12} ${cy + 156} C ${cx - 14} ${cy + 186}, ${cx + 14} ${cy + 186}, ${cx + 12} ${cy + 156}" fill="#b08968" stroke="#7f5539" stroke-width="3.5"/>
    </g>
  `;
}

function createDigestiveSystem(cx, cy) {
  return `
    <g>
      <path d="M${cx} ${cy - 188} C ${cx - 12} ${cy - 154}, ${cx - 14} ${cy - 126}, ${cx - 6} ${cy - 88}" stroke="#60a5fa" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M${cx + 6} ${cy - 82} C ${cx + 96} ${cy - 118}, ${cx + 138} ${cy - 48}, ${cx + 102} ${cy + 8} C ${cx + 72} ${cy + 56}, ${cx + 20} ${cy + 26}, ${cx + 12} ${cy - 22} C ${cx + 10} ${cy - 44}, ${cx + 6} ${cy - 62}, ${cx + 6} ${cy - 82} Z" fill="#f87171" stroke="#b91c1c" stroke-width="5"/>
      <path d="M${cx - 10} ${cy - 8} C ${cx - 86} ${cy + 10}, ${cx - 90} ${cy + 106}, ${cx - 18} ${cy + 142} C ${cx + 34} ${cy + 170}, ${cx + 88} ${cy + 156}, ${cx + 100} ${cy + 108}" fill="none" stroke="#fb923c" stroke-width="18" stroke-linecap="round"/>
      <path d="M${cx + 92} ${cy + 108} C ${cx + 58} ${cy + 42}, ${cx + 10} ${cy + 22}, ${cx - 30} ${cy + 52} C ${cx - 82} ${cy + 92}, ${cx - 62} ${cy + 168}, ${cx + 8} ${cy + 182}" fill="none" stroke="#fdba74" stroke-width="14" stroke-linecap="round"/>
      <ellipse cx="${cx - 94}" cy="${cy - 56}" rx="64" ry="34" fill="#b45309" opacity="0.85"/>
      <ellipse cx="${cx + 118}" cy="${cy - 26}" rx="34" ry="18" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
    </g>
  `;
}

function createBookDiagram(cx, cy, poster) {
  const lines = wrapSvgText(poster.center_topic || poster.title, 16, 3);
  return `
    <g>
      <ellipse cx="${cx}" cy="${cy}" rx="198" ry="166" fill="#fbfcfe" stroke="#d7dee8" stroke-width="4"/>
      <path d="M${cx - 156} ${cy + 104} Q ${cx - 54} ${cy + 48}, ${cx} ${cy + 80} Q ${cx + 54} ${cy + 48}, ${cx + 156} ${cy + 104} L ${cx + 156} ${cy - 86} Q ${cx + 58} ${cy - 128}, ${cx} ${cy - 90} Q ${cx - 58} ${cy - 128}, ${cx - 156} ${cy - 86} Z" fill="#ffffff" stroke="#8a99ab" stroke-width="4.5"/>
      <path d="M${cx} ${cy - 90} V ${cy + 80}" stroke="#ccd5e1" stroke-width="3"/>
      ${lines
        .map(
          (line, index) =>
            `<text x="${cx}" y="${cy - 20 + index * 26}" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="24" font-weight="700" fill="#1f3b5b">${escapeXml(
              line
            )}</text>`
        )
        .join("")}
    </g>
  `;
}

function createConceptVisual(poster, cx, cy) {
  const key = `${poster.title} ${poster.center_topic}`.toLowerCase();

  if (key.includes("respiratory") || key.includes("lung") || key.includes("breath")) {
    return createLungs(cx, cy);
  }

  if (key.includes("heart") || key.includes("cardiac") || key.includes("circulation")) {
    return createHeart(cx, cy);
  }

  if (key.includes("photosynthesis") || key.includes("plant") || key.includes("leaf")) {
    return createPlant(cx, cy);
  }

  if (key.includes("butterfly")) {
    return createButterfly(cx, cy);
  }

  if (key.includes("food chain")) {
    return createFoodChain(cx, cy);
  }

  if (key.includes("water cycle")) {
    return createWaterCycle(cx, cy);
  }

  if (key.includes("cell") || key.includes("nucleus")) {
    return createCell(cx, cy);
  }

  if (key.includes("brain") || key.includes("nervous")) {
    return createBrain(cx, cy);
  }

  if (key.includes("digestive") || key.includes("stomach") || key.includes("intestine")) {
    return createDigestiveSystem(cx, cy);
  }

  return createBookDiagram(cx, cy, poster);
}

function buildPosterSvg(poster) {
  const width = 1200;
  const height = 1380;
  const centerX = width / 2;
  const centerY = 680;
  const title = escapeXml(shorten(poster.title, 48).toUpperCase());
  const subtitleLines = wrapSvgText(poster.subtitle, 52, 2);
  const labelSlots = [
    { boxX: 70, boxY: 300, boxW: 220, boxH: 108, anchorX: 420, anchorY: 420, textSize: 16 },
    { boxX: 70, boxY: 470, boxW: 220, boxH: 108, anchorX: 430, anchorY: 610, textSize: 16 },
    { boxX: 910, boxY: 300, boxW: 220, boxH: 108, anchorX: 780, anchorY: 430, textSize: 16 },
    { boxX: 910, boxY: 470, boxW: 220, boxH: 108, anchorX: 770, anchorY: 620, textSize: 16 },
    { boxX: 150, boxY: 840, boxW: 230, boxH: 108, anchorX: 460, anchorY: 800, textSize: 16 },
    { boxX: 820, boxY: 840, boxW: 230, boxH: 108, anchorX: 740, anchorY: 800, textSize: 16 },
  ];
  const parts = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  );
  parts.push("<defs>");
  parts.push(
    '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#f8fafc"/></linearGradient>'
  );
  parts.push(
    '<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#9aa7c2" flood-opacity="0.22"/></filter>'
  );
  parts.push(
    '<marker id="labelArrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="#64748b"/></marker>'
  );
  parts.push("</defs>");

  parts.push(`<rect width="${width}" height="${height}" rx="36" fill="url(#bg)"/>`);
  parts.push(
    '<rect x="150" y="42" width="900" height="108" rx="18" fill="#ffffff" stroke="#475569" stroke-width="2.5"/>'
  );
  parts.push(
    `<text x="${centerX}" y="110" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="34" font-weight="700" fill="#0f172a">${title}</text>`
  );

  subtitleLines.forEach((line, index) => {
    parts.push(
      `<text x="${centerX}" y="${176 + index * 28}" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="500" fill="#475569">${escapeXml(line)}</text>`
    );
  });

  parts.push(
    '<ellipse cx="600" cy="680" rx="250" ry="300" fill="#ffffff" stroke="#d7dee8" stroke-width="3.5" filter="url(#shadow)"/>'
  );
  parts.push(createConceptVisual(poster, centerX, centerY));

  poster.labels.slice(0, 6).forEach((label, index) => {
    const slot = labelSlots[index];
    const noteLines = wrapSvgText(label.note, 18, 3);
    const labelName = escapeXml(shorten(label.name, 24));
    const startX = slot.boxX < centerX ? slot.boxX + slot.boxW : slot.boxX;
    const startY = slot.boxY + slot.boxH / 2;

    parts.push(
      `<line x1="${startX}" y1="${startY}" x2="${slot.anchorX}" y2="${slot.anchorY}" stroke="#64748b" stroke-width="2.1" marker-end="url(#labelArrow)"/>`
    );
    parts.push(
      `<rect x="${slot.boxX}" y="${slot.boxY}" width="${slot.boxW}" height="${slot.boxH}" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2.2" filter="url(#shadow)"/>`
    );
    parts.push(
      `<text x="${slot.boxX + slot.boxW / 2}" y="${slot.boxY + 28}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="800" fill="#1e3a8a">${labelName}</text>`
    );
    noteLines.forEach((line, lineIndex) => {
      parts.push(
        `<text x="${slot.boxX + slot.boxW / 2}" y="${
          slot.boxY + 58 + lineIndex * 18
        }" text-anchor="middle" font-family="Arial, sans-serif" font-size="${slot.textSize}" font-weight="500" fill="#334155">${escapeXml(line)}</text>`
      );
    });
  });

  parts.push(
    '<rect x="120" y="1060" width="960" height="160" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2.2"/>'
  );
  parts.push(
    '<text x="600" y="1100" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="24" font-weight="700" fill="#0f172a">Process Flow</text>'
  );

  const stepWidth = 190;
  const stepGap = 18;
  const stepStartX = 171;
  poster.process_steps.slice(0, 4).forEach((step, index) => {
    const x = stepStartX + index * (stepWidth + stepGap);
    const lines = wrapSvgText(step, 18, 3);
    parts.push(
      `<rect x="${x}" y="1136" width="${stepWidth}" height="60" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.8"/>`
    );
    parts.push(
      `<text x="${x + 14}" y="1155" font-family="Arial, sans-serif" font-size="12" font-weight="800" fill="#1e3a8a">${index + 1}</text>`
    );
    lines.forEach((line, lineIndex) => {
      parts.push(
        `<text x="${x + stepWidth / 2}" y="${
          1159 + lineIndex * 14
        }" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="#334155">${escapeXml(line)}</text>`
      );
    });
    if (index < Math.min(poster.process_steps.length, 4) - 1) {
      parts.push(
        `<line x1="${x + stepWidth}" y1="1166" x2="${x + stepWidth + stepGap - 4}" y2="1166" stroke="#64748b" stroke-width="2.2" marker-end="url(#labelArrow)"/>`
      );
    }
  });

  parts.push("</svg>");
  return `data:image/svg+xml;utf8,${encodeURIComponent(parts.join(""))}`;
}

function SectionCard({ icon, title, children }) {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Card
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              boxShadow: 0,
            }}
          >
            {icon}
          </Card>
          <Typography variant="h6" fontWeight={800}>
            {title}
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

export default function StudentVisualTutorPage() {
  const { user } = useAuth();
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [poster, setPoster] = useState(EMPTY_POSTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const classLevel = user?.class_level || user?.class_name || "general";

  const hasPoster = useMemo(
    () => Boolean(poster?.title || poster?.labels?.length),
    [poster]
  );

  const posterSrc = useMemo(() => {
    if (!poster?.labels?.length) return null;
    return buildPosterSvg(poster);
  }, [poster]);

  async function handleGenerate(event) {
    event?.preventDefault?.();
    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      setError("Please type a topic first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const prompt = buildTutorPrompt(cleanTopic);
      let rawText = "";
      const presetTopic = detectPresetTopic(cleanTopic);

      if (GEMINI_API_KEY) {
        const geminiRes = await askVisualTutorWithGemini(prompt);
        rawText = geminiRes?.answer || "";
      } else {
        const res = await askAiQuestion({
          question: prompt,
          classLevel,
        });
        rawText =
          res?.data?.answer ?? res?.answer ?? res?.data?.message ?? "";
      }

      const parsed = tryParseTutorJson(String(rawText));
      const aiPoster = sanitizePoster(parsed, cleanTopic);
      const presetPoster = sanitizePoster(buildFallbackPoster(cleanTopic), cleanTopic);
      const nextPoster =
        presetTopic || !parsed || isWeakPoster(aiPoster) ? presetPoster : aiPoster;

      if (!nextPoster.labels.length) {
        setPoster(presetPoster);
        setError(
          "The AI response was unclear, so a simple science diagram was created."
        );
        return;
      }

      setPoster(nextPoster);
    } catch (err) {
      setPoster(sanitizePoster(buildFallbackPoster(cleanTopic), cleanTopic));
      setError(
        err?.message || "Failed to generate the visual lesson. A fallback diagram was created."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3, pb: 10 }}>
      <Card
        sx={{
          borderRadius: 5,
          p: { xs: 2.5, md: 4 },
          mb: 3,
          color: "#fff",
          background:
            "linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #7c3aed 100%)",
          boxShadow: 6,
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AutoAwesome sx={{ fontSize: 30 }} />
            <Typography variant="h4" fontWeight={900}>
              Visual Tutor
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ maxWidth: 760, opacity: 0.95 }}>
            Ask any science or school topic and get a science-book style diagram.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Class Level: ${classLevel}`}
              sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "#fff" }}
            />
            <Chip
              label="Diagram Output"
              sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "#fff" }}
            />
            <Chip
              label="Science Book Style"
              sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "#fff" }}
            />
          </Stack>
        </Stack>
      </Card>

      <Card sx={{ borderRadius: 4, boxShadow: 2, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack component="form" onSubmit={handleGenerate} spacing={2}>
            <Typography variant="h6" fontWeight={800}>
              Enter Your Topic
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder='Example: "respiratory system diagram in science"'
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={
                  loading ? <CircularProgress size={18} color="inherit" /> : <Send />
                }
                disabled={loading}
                sx={{ borderRadius: 999, px: 3 }}
              >
                {loading ? "Generating..." : "Generate Visual Diagram"}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => setTopic(DEFAULT_TOPIC)}
                disabled={loading}
                sx={{ borderRadius: 999, px: 3 }}
              >
                Use Example Topic
              </Button>
            </Stack>
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </CardContent>
      </Card>

      {!hasPoster && !loading ? (
        <Card sx={{ borderRadius: 4, boxShadow: 2 }}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <AutoAwesome color="primary" sx={{ fontSize: 44, mb: 1 }} />
            <Typography variant="h6" fontWeight={800}>
              Your science diagram will appear here
            </Typography>
            <Typography color="text.secondary">
              Try a topic like "{DEFAULT_TOPIC}" to see a textbook-style poster.
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      {hasPoster ? (
        <Stack spacing={3}>
          <SectionCard icon={<Image />} title={poster.title || "Visual Diagram"}>
            {posterSrc ? (
              <Box
                sx={{
                  width: "100%",
                  overflowX: "auto",
                  borderRadius: 3,
                  bgcolor: "#ffffff",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: 1,
                  p: 1,
                }}
              >
                <Box
                  component="img"
                  src={posterSrc}
                  alt={poster.title || "Visual diagram"}
                  sx={{
                    width: "100%",
                    minWidth: 900,
                    display: "block",
                    borderRadius: 2,
                  }}
                />
              </Box>
            ) : (
              <Typography color="text.secondary">
                Diagram preview is not available yet.
              </Typography>
            )}
          </SectionCard>
        </Stack>
      ) : null}
    </Container>
  );
}
