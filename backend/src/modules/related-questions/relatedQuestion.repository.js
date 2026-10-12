import { ChromaClient } from "chromadb";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = "cbse_books";
const MAX_RECORDS = 100;

const createDefaultClient = () => {
  const url = new URL(
    CHROMA_URL.startsWith("http") ? CHROMA_URL : `http://${CHROMA_URL}`
  );

  return new ChromaClient({
    host: url.hostname,
    port: url.port
      ? Number(url.port)
      : url.protocol === "https:"
        ? 443
        : 80,
    ssl: url.protocol === "https:",
  });
};

const buildDocumentFilter = (keywords) => {
  const searchTerms = [
    ...new Set(
      keywords.flatMap((keyword) => [
        keyword,
        `${keyword.charAt(0).toUpperCase()}${keyword.slice(1)}`,
      ])
    ),
  ];
  const filters = searchTerms.map((keyword) => ({ $contains: keyword }));
  return filters.length === 1 ? filters[0] : { $or: filters };
};

export const createTextbookKeywordRepository = ({
  client = createDefaultClient(),
  collectionName = COLLECTION_NAME,
} = {}) => {
  let collectionPromise;

  const getCollection = () => {
    collectionPromise ||= client.getCollection({ name: collectionName });
    return collectionPromise;
  };

  return Object.freeze({
    async searchByKeywords(keywords) {
      if (!Array.isArray(keywords) || keywords.length === 0) return [];

      const collection = await getCollection();
      const result = await collection.get({
        whereDocument: buildDocumentFilter(keywords),
        include: ["documents", "metadatas"],
        limit: MAX_RECORDS,
      });

      return (result.documents || [])
        .map((text, index) => ({
          id: result.ids?.[index] || null,
          text: String(text || "").trim(),
          metadata: result.metadatas?.[index] || {},
        }))
        .filter((record) => record.text);
    },
  });
};

export const textbookKeywordRepository = createTextbookKeywordRepository();
