import path from "path";
import { pathToFileURL } from "url";

function cleanPdfText(value) {
  return String(value || "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/\0/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function extractPageText(content) {
  const rows = [];

  for (const item of content.items || []) {
    const text = cleanPdfText(item?.str);
    if (!text) continue;

    const x = Number(item?.transform?.[4] || 0);
    const y = Number(item?.transform?.[5] || 0);

    let row = rows.find((candidate) => Math.abs(candidate.y - y) <= 2);
    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }

    row.items.push({ x, text });
  }

  return rows
    .sort((left, right) => right.y - left.y)
    .map((row) =>
      row.items
        .sort((left, right) => left.x - right.x)
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractWithPdfParse(data) {
  const pdfParseModule = await import("pdf-parse");
  const pdfParse = pdfParseModule.default || pdfParseModule;

  const parsed = await pdfParse(Buffer.from(data), {
    pagerender: async (pageData) => {
      const textContent = await pageData.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      });

      return (
        textContent.items
          .map((item) => cleanPdfText(item?.str))
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim() + "\f"
      );
    },
  });

  return String(parsed?.text || "")
    .split("\f")
    .map((text) => cleanPdfText(text))
    .filter(Boolean)
    .map((text, index) => ({ pageNumber: index + 1, text }));
}

async function extractWithPdfJs(data) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const standardFontDataUrl = `${pathToFileURL(
    path.resolve(process.cwd(), "node_modules/pdfjs-dist/standard_fonts")
  ).toString()}/`;

  const pdf = await pdfjsLib.getDocument({
    data,
    standardFontDataUrl,
  }).promise;

  const pages = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const text = extractPageText(content);
    if (text) {
      pages.push({ pageNumber: pageNum, text });
    }
  }

  return pages;
}

export async function extractPdfPages(data) {
  try {
    return await extractWithPdfParse(data);
  } catch (error) {
    console.warn(
      `pdf-parse fallback warning: ${error?.message || error}. Retrying with pdfjs-dist.`
    );
    return extractWithPdfJs(data);
  }
}
