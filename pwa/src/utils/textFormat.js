export function toTitleCase(value) {
  if (typeof value !== "string") return value;

  return value
    .replace(/\s{2,}/g, " ") // Only collapse multiple spaces, allow single trailing spaces while typing
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeTitleCaseFields(data, fields) {
  if (!data || typeof data !== "object") return data;
  const next = { ...data };

  for (const field of fields || []) {
    if (typeof next[field] === "string" && next[field].trim() !== "") {
      next[field] = toTitleCase(next[field]);
    }
  }

  return next;
}

export function normalizeUpperCaseFields(data, fields) {
  if (!data || typeof data !== "object") return data;
  const next = { ...data };

  for (const field of fields || []) {
    if (typeof next[field] === "string" && next[field].trim() !== "") {
      next[field] = next[field].trim().toUpperCase();
    }
  }

  return next;
}
