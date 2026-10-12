import { config as loadEnv } from "dotenv";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import fs from "fs";
import path from "path";

loadEnv();

const VALID_FOLLOWUP_TYPES = new Set([
  "example",
  "step_by_step",
  "details",
  "picture",
  "architecture",
  "label_diagram",
  "timeline",
]);

const FOLLOWUP_INSTRUCTIONS = {
  example:
    "Explain the same topic using one simple real-life or textbook-style example for a school student.",
  step_by_step:
    "Explain the same topic in clear step-by-step points for a school student.",
  details:
    "Explain the same topic in a little more detail, but keep it simple and easy for a school student.",
  architecture:
    "Explain the structure or parts of the topic in a clear educational way for a school student.",
  label_diagram:
    "Describe the topic as if explaining a labeled diagram, using short clear points for a school student.",
  timeline:
    "Explain the topic as a simple timeline or sequence of events for a school student.",
};

export const FOLLOWUP_UPLOAD_DIR = path.join(
  process.cwd(),
  "uploads",
  "ai-followups"
);

const FOLLOWUP_UPLOAD_URL =
  "/api/ai-followup/uploads/ai-followups";

const GEMINI_TEXT_MODEL = (
  process.env.GEMINI_FOLLOWUP_MODEL ||
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash-lite"
).replace(/^models\//, "");

const GEMINI_IMAGE_MODEL = (
  process.env.GEMINI_IMAGE_MODEL ||
  process.env.IMAGEN_MODEL ||
  "imagen-4.0-fast-generate-001"
).replace(/^models\//, "");

const GEMINI_IMAGE_PREVIEW_MODEL = (
  process.env.GEMINI_IMAGE_PREVIEW_MODEL ||
  "gemini-3-pro-image-preview"
).replace(/^models\//, "");

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })
  : null;

const PREVIEW_IMAGE_MODELS = [
  GEMINI_IMAGE_PREVIEW_MODEL,
  "gemini-3-pro-image-preview",
].filter(Boolean);

const IMAGE_GENERATION_MODELS = [
  GEMINI_IMAGE_MODEL,
  "imagen-4.0-fast-generate-001",
].filter(Boolean);

const normalizeText = (value) =>
  String(value || "").trim();

const summarizeLine = (
  value,
  maxLength = 80
) => {
  const compact = normalizeText(value).replace(
    /\s+/g,
    " "
  );

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact
    .slice(0, maxLength - 3)
    .trim()}...`;
};

const splitIntoSentences = (value) =>
  normalizeText(value)
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const getTopicText = (question) => {
  const topic = normalizeText(question)
    .replace(
      /^(what is|what are|explain|describe|who is|who was|write about|tell me about)\s+/i,
      ""
    )
    .replace(/[?.!]+$/g, "");

  return summarizeLine(
    topic || question,
    90
  );
};

const isBiologyTopic = (topic = "") =>
  /\b(biology|cell|tissue|organ|organism|plant|animal|human body|digestive|respiratory|circulatory|nervous system|photosynthesis|reproduction|genetics|dna|rna|chromosome|bacteria|virus|fungi|protozoa|ecosystem|food chain|taxonomy|phylum|chordata|hemichordata|prokaryotic|eukaryotic|membrane|mitochondria|nucleus)\b/i.test(
    normalizeText(topic)
  );

const buildEducationalImagePrompt = (
  topic
) => {
  if (isBiologyTopic(topic)) {
    return `
Create a professional textbook-quality educational biology infographic poster on "${topic}".

Design requirements:
- Ultra clean scientific illustration
- White background
- High-resolution educational poster
- Accurate biological structures
- Professional textbook layout
- Student-friendly infographic design
- Balanced spacing and alignment
- Properly aligned labels
- Thin annotation arrows
- Modern educational color palette
- Soft scientific colors
- Crisp vector-style illustration
- Sharp readable text
- No spelling mistakes
- No distorted text
- No overlapping labels
- High-detail scientific drawing
- Professional biology atlas style
- Exam preparation format
- Printable academic poster
- Clean section borders
- Symmetrical composition
- Consistent typography
- Educational publishing quality

Include:
1. Main labeled diagram
2. Identify and label section
3. Key features box
4. Short-answer questions section
5. Quick comparison table if applicable

Label style:
- Straight annotation lines
- Proper spacing between labels
- Horizontal readable text
- Scientific naming format
- Consistent font size

Output style:
- Biology textbook infographic
- Scientific educational chart
- CBSE/NEET exam style poster
- Professional academic illustration
- Museum-quality biology artwork

Quality rules:
- Ultra HD
- 4K quality
- Sharp outlines
- Clean vector finish
- Accurate anatomy
- High readability
- Print-ready poster
- Professional infographic composition

Negative instructions:
- No blurry text
- No distorted labels
- No overlapping annotations
- No messy layout
- No low-quality rendering
- No extra unnecessary objects
- No dark background
- No cartoon style
- No watermark
- No cropped labels
`;
  }

  return `
High quality educational textbook diagram of ${topic}, labeled structure, arrows, white background, clean scientific illustration, student friendly, highly detailed, educational poster style, biology textbook quality, 4k.

IMPORTANT:
- Use REALISTIC educational visuals
- Use science textbook infographic style
- White background
- Educational arrows
- Minimal text
- Student-friendly
- Professional educational design
- Landscape layout

STRICTLY AVOID:
- SVG style
- Text boxes
- UI cards
- Flowchart blocks
- Summary cards
- Mind maps
- Concept diagrams

If topic is food chain:
show realistic:
- grass
- grasshopper
- frog
- snake
- eagle
- fungi and earthworms

Make it look like a real school science textbook infographic.
`;
};

const buildPictureFallbackAnswer = ({
  originalQuestion,
  previousAnswer,
}) => `
Visual Explanation:
Picture this like a clean textbook diagram of ${getTopicText(
  originalQuestion
)} on a white background.

- Put the main title at the top.
- Place the central structure in the middle.
- Add clear labels on the sides with straight arrows pointing to each part.
- Keep related parts grouped neatly.
- Show the flow or function in the correct order from left to right or top to bottom.
- Highlight the most important terms students should remember.

Text Explanation:
${previousAnswer}
`.trim();

const getBase64ImageFromInteraction = (
  interaction
) => {
  const outputs = Array.isArray(
    interaction?.outputs
  )
    ? interaction.outputs
    : [];

  for (const output of outputs) {
    if (output?.type !== "image") {
      continue;
    }

    if (output?.data) {
      return output.data;
    }

    if (output?.inlineData?.data) {
      return output.inlineData.data;
    }

    if (output?.image?.imageBytes) {
      return output.image.imageBytes;
    }
  }

  return "";
};

const getBase64ImageFromGeneratedImages = (
  response
) => {
  const generatedImages = Array.isArray(
    response?.generatedImages
  )
    ? response.generatedImages
    : [];

  for (const generatedImage of generatedImages) {
    if (generatedImage?.image?.imageBytes) {
      return generatedImage.image.imageBytes;
    }

    if (generatedImage?.imageBytes) {
      return generatedImage.imageBytes;
    }
  }

  return "";
};

const toImageDataUrl = (bytes) =>
  `data:image/png;base64,${Buffer.from(
    bytes
  ).toString("base64")}`;

const ensureUploadDir = () => {
  fs.mkdirSync(FOLLOWUP_UPLOAD_DIR, {
    recursive: true,
  });
};

const writeGeneratedImage = ({
  originalQuestion,
  previousAnswer,
  bytes,
}) => {
  ensureUploadDir();

  const version = Date.now();
  const hash = crypto
    .createHash("sha1")
    .update(
      `${originalQuestion}\n${previousAnswer}\n${version}`
    )
    .digest("hex")
    .slice(0, 12);

  const filename = `picture-followup-${hash}.png`;
  const filePath = path.join(
    FOLLOWUP_UPLOAD_DIR,
    filename
  );

  fs.writeFileSync(filePath, bytes);

  return {
    imageUrl: `${FOLLOWUP_UPLOAD_URL}/${filename}?v=${version}`,
    imageDataUrl:
      toImageDataUrl(bytes),
  };
};

const extractGeneratedText = (result) => {
  const directText =
    typeof result?.text === "function"
      ? result.text()
      : result?.text;

  const partsText =
    result?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("") || "";

  return normalizeText(
    directText || partsText
  );
};

const toPictureCaption = (
  answer,
  originalQuestion
) => {
  const cleaned = normalizeText(answer);

  if (cleaned) {
    return (
      cleaned.match(
        /^(.{20,180}?[.!?])(\s|$)/
      )?.[1] ||
      cleaned.slice(0, 180)
    );
  }

  return `This image explains ${getTopicText(
    originalQuestion
  )} in a simple visual way.`;
};

const generateEducationalImage = async ({
  originalQuestion,
  previousAnswer,
}) => {
  if (!ai) {
    return { failed: true };
  }

  const topic =
    getTopicText(originalQuestion);
  const prompt =
    buildEducationalImagePrompt(topic);

  for (const model of PREVIEW_IMAGE_MODELS) {
    try {
      const interaction =
        await ai.interactions.create({
          model,
          input: prompt,
          response_modalities: [
            "image",
          ],
        });

      const imageData =
        getBase64ImageFromInteraction(
          interaction
        );

      if (!imageData) {
        throw new Error(
          "No image data returned from Gemini interaction"
        );
      }

      return writeGeneratedImage({
        originalQuestion,
        previousAnswer,
        bytes: Buffer.from(
          imageData,
          "base64"
        ),
      });
    } catch (err) {
      console.error(
        "AI_FOLLOWUP_IMAGE_PREVIEW_ERROR",
        model,
        err?.message || err
      );
    }
  }

  for (const model of IMAGE_GENERATION_MODELS) {
    try {
      const response =
        await ai.models.generateImages({
          model,
          prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: "16:9",
          },
        });

      const image =
        getBase64ImageFromGeneratedImages(
          response
        );

      if (!image) {
        throw new Error(
          "No image bytes returned"
        );
      }

      return writeGeneratedImage({
        originalQuestion,
        previousAnswer,
        bytes: Buffer.from(
          image,
          "base64"
        ),
      });
    } catch (err) {
      console.error(
        "AI_FOLLOWUP_IMAGE_MODEL_ERROR",
        model,
        err?.message || err
      );
    }
  }

  return {
    failed: true,
  };
};

const buildFollowupPrompt = ({
  originalQuestion,
  previousAnswer,
  followupType,
}) =>
  [
    "You are a professional educational AI assistant for school students.",
    "Use only the context below.",
    "",
    "Original Question:",
    originalQuestion,
    "",
    "Previous AI Answer:",
    previousAnswer,
    "",
    "Follow-up Type:",
    followupType,
    "",
    "Instructions:",
    FOLLOWUP_INSTRUCTIONS[
      followupType
    ] ||
      "Explain the same topic clearly for a school student.",
    "",
    "Rules:",
    "- Stay faithful to the original question and previous answer.",
    "- Do not mention sources, retrieval, search, or books.",
    "- Keep the answer clear, short, and student-friendly.",
    "- Return only the follow-up answer text.",
  ].join("\n");

const generateTextAnswer = async ({
  originalQuestion,
  previousAnswer,
  followupType,
}) => {
  if (!ai) {
    return "Unable to generate answer right now.";
  }

  try {
    const result =
      await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: buildFollowupPrompt({
          originalQuestion,
          previousAnswer,
          followupType,
        }),
      });

    return (
      extractGeneratedText(result) ||
      "Unable to generate answer."
    );
  } catch (err) {
    console.error(
      "AI_FOLLOWUP_TEXT_ERROR",
      err?.message || err
    );

    return "Unable to generate answer.";
  }
};

export const buildStudentFollowupSuggestions =
  ({
    originalQuestion,
    previousAnswer,
  }) => {
    const safeQuestion =
      normalizeText(originalQuestion);
    const safeAnswer =
      normalizeText(previousAnswer);

    if (!safeQuestion || !safeAnswer) {
      return [];
    }

    const topic = getTopicText(
      safeQuestion
    );

    return [
      {
        label: "Explain with Example",
        followupType: "example",
        topic,
      },
      {
        label: "Explain Step by Step",
        followupType:
          "step_by_step",
        topic,
      },
      {
        label: "Explain Details",
        followupType: "details",
        topic,
      },
      {
        label: "Explain Picture",
        followupType: "picture",
        topic,
      },
    ];
  };

export async function generateAiFollowup({
  originalQuestion,
  previousAnswer,
  followupType,
}) {
  const safeQuestion =
    normalizeText(originalQuestion);
  const safeAnswer =
    normalizeText(previousAnswer);
  const safeType = normalizeText(
    followupType
  ).toLowerCase();

  if (!safeQuestion || !safeAnswer) {
    throw new Error(
      "Question and previous answer required"
    );
  }

  if (!safeType) {
    throw new Error(
      "Follow-up type required"
    );
  }

  if (
    !VALID_FOLLOWUP_TYPES.has(safeType)
  ) {
    throw new Error(
      "Invalid follow-up type"
    );
  }

  if (safeType === "picture") {
    const imageResult =
      await generateEducationalImage({
        originalQuestion:
          safeQuestion,
        previousAnswer:
          safeAnswer,
      });

    if (imageResult.failed) {
      return {
        answer:
          buildPictureFallbackAnswer({
            originalQuestion:
              safeQuestion,
            previousAnswer:
              safeAnswer,
          }),
        followupType:
          safeType,
        source: "ai-followup",
        followupSuggestions:
          buildStudentFollowupSuggestions({
            originalQuestion:
              safeQuestion,
            previousAnswer:
              safeAnswer,
          }),
      };
    }

    return {
      type: "image",
      answer: toPictureCaption(
        "",
        safeQuestion
      ),
      followupType:
        safeType,
      source: "ai-followup",
      imageUrl:
        imageResult.imageUrl,
      imageDataUrl:
        imageResult.imageDataUrl,
      followupSuggestions:
        buildStudentFollowupSuggestions({
          originalQuestion:
            safeQuestion,
          previousAnswer:
            safeAnswer,
        }),
    };
  }

  const answer =
    await generateTextAnswer({
      originalQuestion:
        safeQuestion,
      previousAnswer:
        safeAnswer,
      followupType: safeType,
    });

  return {
    answer,
    followupType: safeType,
    source: "ai-followup",
    followupSuggestions:
      buildStudentFollowupSuggestions({
        originalQuestion:
          safeQuestion,
        previousAnswer:
          safeAnswer,
      }),
  };
}
