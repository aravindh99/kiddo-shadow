import fs from "fs";
import path from "path";
import { ChromaClient } from "chromadb";
import dotenv from "dotenv";
import { extractPdfPages } from "./pdfTextExtractor.js";

dotenv.config();

const DEFAULT_COLLECTION_NAME = "cbse_books";
const DEFAULT_MISSING_LIST_PATH = path.resolve(
  process.cwd(),
  "rag_data/reports/missing_pdfs_in_chroma.txt"
);

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node src/modules/rag/ingestMissingBooks.js <booksDir> [missingListPath] [--force]",
      "",
      "Examples:",
      "  node src/modules/rag/ingestMissingBooks.js '/home/vishnu/Music/CBSE BOOKS'",
      "  node src/modules/rag/ingestMissingBooks.js '/home/vishnu/Music/CBSE BOOKS' rag_data/reports/missing_pdfs_in_chroma.txt",
      "",
      "Options:",
      "  --force   Re-upsert files even if they already exist in Chroma",
    ].join("\n")
  );
}

function parseArgs(argv) {
  const flags = new Set();
  const positional = [];

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg.startsWith("--")) {
      flags.add(arg);
      continue;
    }

    positional.push(arg);
  }

  const booksDirArg = positional[0];
  if (!booksDirArg) {
    printUsage();
    process.exit(1);
  }

  return {
    booksDir: path.resolve(process.cwd(), booksDirArg),
    missingListPath: path.resolve(process.cwd(), positional[1] || DEFAULT_MISSING_LIST_PATH),
    force: flags.has("--force"),
  };
}

const { booksDir: BOOKS_DIR, missingListPath: MISSING_LIST_PATH, force: FORCE_REINGEST } =
  parseArgs(process.argv.slice(2));

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = DEFAULT_COLLECTION_NAME;

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
    relativePath: relativePath.replace(/\\/g, "/"),
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

function loadMissingPdfPaths(missingListPath) {
  if (!fs.existsSync(missingListPath)) {
    throw new Error(`Missing list file not found: ${missingListPath}`);
  }

  return Array.from(
    new Set(
      fs
        .readFileSync(missingListPath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && /\.pdf$/i.test(line))
        .map((line) => line.replace(/\\/g, "/"))
    )
  );
}

async function sourcePathExists(collection, sourcePath) {
  const existing = await collection.get({
    where: { source_path: sourcePath },
    limit: 1,
    include: ["metadatas"],
  });

  return Array.isArray(existing?.ids) && existing.ids.length > 0;
}

async function ingestPdfFile({ collection, filePath }) {
  const {
    relativePath,
    className,
    subjectName,
    fileName,
    chapterName,
    safeIdPrefix,
  } = extractBookMetadata(filePath, BOOKS_DIR);

  const data = new Uint8Array(fs.readFileSync(filePath));
  const pages = await extractPdfPages(data);

  let chunkCount = 0;

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
      chunkCount += 1;
    }
  }

  return { relativePath, fileName, chunkCount };
}

async function ingestMissingBooks() {
  if (!fs.existsSync(BOOKS_DIR)) {
    throw new Error(`Books directory not found: ${BOOKS_DIR}`);
  }

  const missingPdfPaths = loadMissingPdfPaths(MISSING_LIST_PATH);
  console.log("📚 Starting missing-PDF ingestion...");
  console.log("Books folder:", BOOKS_DIR);
  console.log("Missing list:", MISSING_LIST_PATH);
  console.log(`Target PDFs from list: ${missingPdfPaths.length}`);

  const collection = await chroma.getOrCreateCollection({
    name: COLLECTION_NAME,
  });

  const stats = {
    requested: missingPdfPaths.length,
    processed: 0,
    skippedMissingFile: 0,
    skippedAlreadyIndexed: 0,
    failed: 0,
    chunksUpserted: 0,
  };

  for (const relativePath of missingPdfPaths) {
    const filePath = path.join(BOOKS_DIR, ...relativePath.split("/"));

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Missing on disk, skipping: ${relativePath}`);
      stats.skippedMissingFile += 1;
      continue;
    }

    if (!FORCE_REINGEST && (await sourcePathExists(collection, relativePath))) {
      console.log(`⏭️ Already indexed, skipping: ${relativePath}`);
      stats.skippedAlreadyIndexed += 1;
      continue;
    }

    try {
      console.log(`\n📄 Processing: ${relativePath}`);
      const result = await ingestPdfFile({
        collection,
        filePath,
      });

      stats.processed += 1;
      stats.chunksUpserted += result.chunkCount;
      console.log(`✅ Finished ${result.fileName} (${result.chunkCount} chunks)`);
    } catch (error) {
      stats.failed += 1;
      console.error(`❌ Failed ${relativePath}:`, error?.message || error);
    }
  }

  console.log("\n🎉 Missing-PDF ingestion completed.");
  console.log(JSON.stringify(stats, null, 2));
}

ingestMissingBooks().catch((error) => {
  console.error("❌ Missing-PDF ingestion failed:", error);
  process.exit(1);
});
