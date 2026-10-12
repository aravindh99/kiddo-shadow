import fs from "fs";
import path from "path";
import { ChromaClient } from "chromadb";
import dotenv from "dotenv";
import { extractPdfPages } from "./pdfTextExtractor.js";

dotenv.config();



// -------- CONFIG --------
const booksDirArg = process.argv[2];
const BOOKS_DIR = path.resolve(process.cwd(), booksDirArg || ".");
if (!booksDirArg) {
  console.error("❌ Please provide books folder path");
  process.exit(1);
}

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = "cbse_books";

// -------- CHROMA SETUP --------
const chromaUrl = new URL(
  CHROMA_URL.startsWith("http") ? CHROMA_URL : `http://${CHROMA_URL}`
);
const chroma = new ChromaClient({
  host: chromaUrl.hostname,
  port: chromaUrl.port
    ? Number(chromaUrl.port)
    : chromaUrl.protocol === "https:"
    ? 443
    : 80,
  ssl: chromaUrl.protocol === "https:",
});

// -------- HELPERS --------
function getAllPdfFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllPdfFiles(filePath));
    } else if (file.endsWith(".pdf")) {
      results.push(filePath);
    }
  });

  return results;
}

function cleanPdfText(value) {
  return String(value || "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/\0/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function normalizePathSegment(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBookMetadata(filePath, booksDir) {
  const relativePath = path.relative(booksDir, filePath);
  const parts = relativePath.split(path.sep).map((part) => normalizePathSegment(part));
  const fileName = path.basename(filePath);
  const chapterName = fileName.replace(/\.pdf$/i, "");

  const classIndex = parts.findIndex((part) =>
    /(?:^|\s)class\s*\d{1,2}\b|(?:^|\s)\d{1,2}(?:st|nd|rd|th)?\s*std\b/i.test(part)
  );

  const classMatch =
    classIndex >= 0
      ? parts[classIndex].match(/class\s*(\d{1,2})|(\d{1,2})(?:st|nd|rd|th)?\s*std/i)
      : null;

  const className = classMatch?.[1] || classMatch?.[2] || "unknown";
  const subjectName =
    classIndex >= 0 && classIndex + 1 < parts.length - 1
      ? parts[classIndex + 1]
      : parts.length > 1
      ? parts[parts.length - 2]
      : "unknown";

  return {
    relativePath,
    className: className.toLowerCase(),
    subjectName: subjectName.toLowerCase(),
    fileName,
    chapterName,
    safeIdPrefix: relativePath.replace(/[^\w.-]/g, "_"),
  };
}

function splitPageText(pageText, maxChunkSize = 2200) {
  const lines = String(pageText || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const chunks = [];
  let current = "";
  let chunkIndex = 0;

  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length <= maxChunkSize || !current) {
      current = candidate;
      continue;
    }

    chunks.push({
      chunkIndex,
      text: current.trim(),
    });
    chunkIndex += 1;
    current = line;
  }

  if (current.trim()) {
    chunks.push({
      chunkIndex,
      text: current.trim(),
    });
  }

  return chunks;
}

// -------- MAIN INGEST FUNCTION --------
async function ingest() {
  console.log("📚 Starting ingestion...");
  console.log("Books folder:", BOOKS_DIR);

  try {
    await chroma.deleteCollection({ name: COLLECTION_NAME });
    console.log(`🧹 Cleared existing ${COLLECTION_NAME} collection to avoid stale book chunks`);
  } catch (err) {
    const message = String(err?.message || "");
    if (!/not\s+found|does not exist/i.test(message)) {
      console.warn("⚠️ Could not clear existing collection:", message || err);
    }
  }

  const collection = await chroma.getOrCreateCollection({
    name: COLLECTION_NAME,
  });

  const pdfFiles = getAllPdfFiles(BOOKS_DIR);
  console.log(`Found ${pdfFiles.length} PDF files`);

  for (const filePath of pdfFiles) {
    console.log(`\n📄 Processing: ${filePath}`);

    const {
      relativePath,
      className,
      subjectName,
      fileName,
      chapterName,
      safeIdPrefix,
    } = extractBookMetadata(filePath, BOOKS_DIR);

    // ---- Read PDF ----
    let data;
    try {
      data = new Uint8Array(fs.readFileSync(filePath));
    } catch (err) {
      if (err && err.code === "ENOENT") {
        console.warn("⚠️ File missing, skipping:", filePath);
        continue;
      }
      throw err;
    }
    const pages = await extractPdfPages(data);

    for (const page of pages) {
      const pageText = page.text;
      if (!pageText) continue;

      const chunks = splitPageText(pageText);

      for (const chunk of chunks) {
        await collection.upsert({
          ids: [`${safeIdPrefix}-p${String(page.pageNumber).padStart(4, "0")}-c${chunk.chunkIndex}`],
          documents: [chunk.text],
          metadatas: [
            {
              syllabus: "CBSE",
              class: className,
              subject: subjectName,
              book: fileName,
              chapter: chapterName,
              source_path: relativePath,
              page_number: page.pageNumber,
              chunk_index: chunk.chunkIndex,
            },
          ],
        });
      }
    }

    console.log(`✅ Finished ${fileName}`);
  }

  console.log("\n🎉 Ingestion completed successfully!");
}

ingest().catch((err) => {
  console.error("❌ Ingestion failed:", err);
  process.exit(1);
});
