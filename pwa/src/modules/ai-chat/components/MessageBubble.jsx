import { useEffect, useMemo, useState } from "react";
import { Box, Paper, Typography, Avatar, Skeleton, useTheme } from "@mui/material";
import { SmartToy, Person } from "@mui/icons-material";
import { API_BASE_URL } from "../../../api/config";

const MULTILINGUAL_FONT_STACK = [
  "Noto Sans Tamil",
  "Nirmala UI",
  "Latha",
  "Arial Unicode MS",
  "Noto Sans",
  "Segoe UI",
  "sans-serif",
].join(", ");

export default function MessageBubble({ message, userAvatar }) {
  const theme = useTheme();
  const isAi = message.role === "ai" || message.role === "assistant";
  const aiImageUrl = isAi
    ? normalizeImageUrl(message?.metadata?.imageDataUrl || message?.metadata?.imageUrl)
    : null;
  const parsed = isAi ? parseAiSections(message.text || message.content || "") : null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isAi ? "flex-start" : "flex-end",
        mb: 2,
        gap: 1.5,
        alignItems: "flex-end",
      }}
    >
      {isAi && (
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            width: 32,
            height: 32,
          }}
        >
          <SmartToy sx={{ fontSize: 20, color: "white" }} />
        </Avatar>
      )}

      <Paper
        elevation={isAi ? 1 : 2}
        sx={{
          p: 2,
          maxWidth: "75%",
          fontFamily: MULTILINGUAL_FONT_STACK,
          borderRadius: 2,
          borderBottomLeftRadius: isAi ? 0 : 2,
          borderBottomRightRadius: isAi ? 2 : 0,
          bgcolor: isAi ? theme.palette.background.paper : theme.palette.primary.main,
          color: isAi ? theme.palette.text.primary : theme.palette.primary.contrastText,
        }}
      >
        {!isAi && message.imagePreviewUrl && (
          <Box
            component="img"
            src={message.imagePreviewUrl}
            alt={message.imageName || "Uploaded question"}
            sx={{
              display: "block",
              width: "100%",
              maxWidth: 220,
              maxHeight: 220,
              objectFit: "cover",
              borderRadius: 1.5,
              mb: message.text || message.content ? 1 : 0,
              bgcolor: "rgba(255,255,255,0.16)",
            }}
          />
        )}

        {isAi && aiImageUrl ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <AiEducationalImage
              src={aiImageUrl}
              alt="AI generated visual"
            />
            {(message.text || message.content) && (
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  lineHeight: 1.6,
                }}
              >
                {message.text || message.content}
              </Typography>
            )}
          </Box>
        ) : isAi && parsed ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {parsed.visual && (
              <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: "action.hover" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Visual Explanation
                </Typography>
                {renderVisual(parsed)}
              </Box>
            )}

            {parsed.text && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Text Explanation
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 }}
                >
                  {parsed.text}
                </Typography>
              </Box>
            )}

            {!parsed.visual && !parsed.text && (
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 }}
              >
                {message.text || message.content}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.6,
            }}
          >
            {message.text || message.content}
          </Typography>
        )}
      </Paper>

      {!isAi && (
        <Avatar
          src={userAvatar}
          sx={{
            width: 32,
            height: 32,
            bgcolor: theme.palette.secondary.main,
          }}
        >
          {!userAvatar && <Person />}
        </Avatar>
      )}
    </Box>
  );
}

function AiEducationalImage({ src, alt }) {
  const [status, setStatus] = useState("loading");
  const [resolvedSrc, setResolvedSrc] = useState("");
  const requestSrc = useMemo(() => withCacheBust(src), [src]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function loadImage() {
      if (!requestSrc) {
        if (!cancelled) {
          setResolvedSrc("");
          setStatus("error");
        }
        return;
      }

      if (requestSrc.startsWith("data:")) {
        if (!cancelled) {
          setResolvedSrc(requestSrc);
          setStatus("ready");
        }
        return;
      }

      if (!cancelled) {
        setStatus("loading");
        setResolvedSrc("");
      }

      try {
        const response = await fetch(requestSrc, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Image request failed with status ${response.status}`);
        }

        const blob = await response.blob();
        if (!blob.size) {
          throw new Error("Empty image response");
        }

        const blobType = String(blob.type || "").toLowerCase();
        if (blobType && !blobType.startsWith("image/")) {
          throw new Error(`Unexpected image mime type: ${blobType}`);
        }

        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setResolvedSrc(objectUrl);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setResolvedSrc("");
          setStatus("error");
        }
      }
    }

    void loadImage();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [requestSrc]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {status === "loading" && (
        <Skeleton
          variant="rounded"
          animation="wave"
          sx={{
            width: "100%",
            maxWidth: 420,
            aspectRatio: "16 / 10",
            borderRadius: 1.5,
          }}
        />
      )}

      {status === "ready" && resolvedSrc && (
        <Box
          component="img"
          src={resolvedSrc}
          alt={alt}
          sx={{
            display: "block",
            width: "100%",
            maxWidth: 420,
            aspectRatio: "16 / 10",
            objectFit: "contain",
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#ffffff",
          }}
        />
      )}

      {status === "error" && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 420,
            minHeight: 120,
            px: 2,
            py: 1.5,
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "#dbe7f5",
            bgcolor: "#f8fbff",
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Visual Explanation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              A clean diagram view is being prepared. Use the labels, arrows, and text explanation below as the
              guided picture for this topic.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function normalizeImageUrl(value) {
  const src = String(value || "").trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;

  const apiOrigin = (() => {
    if (/^https?:\/\//i.test(API_BASE_URL)) {
      return API_BASE_URL.replace(/\/api\/?$/, "/");
    }

    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/`;
    }

    return "";
  })();

  try {
    return new URL(src, apiOrigin).toString();
  } catch {
    return src;
  }
}

function withCacheBust(src) {
  const value = String(src || "").trim();
  if (!value || value.startsWith("data:")) return value;

  try {
    const url = new URL(value);
    if (!url.searchParams.has("cb")) {
      url.searchParams.set("cb", String(Date.now()));
    }
    return url.toString();
  } catch {
    const joiner = value.includes("?") ? "&" : "?";
    return `${value}${joiner}cb=${Date.now()}`;
  }
}

function parseAiSections(raw) {
  const text = String(raw || "");
  const bestFormatMatch = text.match(/best format\s*[:\-]\s*(diagram|table|pie)/i);
  const visualMatch = text.match(/visual explanation\s*[:\-]\s*([\s\S]*?)(?=\n\s*text explanation\s*[:\-]|$)/i);
  const textMatch = text.match(/text explanation\s*[:\-]\s*([\s\S]*)$/i);

  if (!visualMatch && !textMatch) return null;

  return {
    bestFormat: (bestFormatMatch?.[1] || "").toLowerCase(),
    visual: visualMatch?.[1]?.trim() || "",
    text: textMatch?.[1]?.trim() || "",
  };
}

function renderVisual(parsed) {
  const visual = String(parsed?.visual || "").trim();
  if (!visual) return null;

  if (parsed?.bestFormat === "table" || hasMarkdownTable(visual)) {
    const rows = parseMarkdownTable(visual);
    if (rows.length >= 2) {
      const headers = rows[0];
      const body = rows.slice(1);
      return (
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 320, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${headers.length}, minmax(110px, 1fr))`,
                bgcolor: "background.paper",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              {headers.map((h, i) => (
                <Typography key={i} variant="caption" sx={{ p: 1, fontWeight: 700 }}>
                  {h}
                </Typography>
              ))}
            </Box>
            {body.map((row, rIdx) => (
              <Box
                key={rIdx}
                sx={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${headers.length}, minmax(110px, 1fr))`,
                  borderBottom: rIdx === body.length - 1 ? "none" : "1px solid",
                  borderColor: "divider",
                }}
              >
                {row.map((cell, cIdx) => (
                  <Typography key={cIdx} variant="caption" sx={{ p: 1 }}>
                    {cell}
                  </Typography>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      );
    }
  }

  if (parsed?.bestFormat === "pie" || hasPieData(visual)) {
    const slices = parsePieData(visual);
    if (slices.length) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {slices.map((slice, idx) => (
            <Box key={idx}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {slice.label}
                </Typography>
                <Typography variant="caption">{slice.value}%</Typography>
              </Box>
              <Box sx={{ width: "100%", height: 8, bgcolor: "grey.300", borderRadius: 999 }}>
                <Box
                  sx={{
                    width: `${Math.min(100, Math.max(0, slice.value))}%`,
                    height: "100%",
                    bgcolor: "primary.main",
                    borderRadius: 999,
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      );
    }
  }

  const diagramSrc = buildFlowDiagramSvg(visual);
  if (diagramSrc) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box
          component="img"
          src={diagramSrc}
          alt="AI visual diagram"
          sx={{
            width: "100%",
            maxWidth: 560,
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#ffffff",
          }}
        />
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 }}>
          {visual}
        </Typography>
      </Box>
    );
  }

  const studyPosterSrc = buildStudyPosterSvg(visual);
  if (studyPosterSrc) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box
          component="img"
          src={studyPosterSrc}
          alt="AI visual study poster"
          sx={{
            width: "100%",
            maxWidth: 560,
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#ffffff",
          }}
        />
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 }}>
          {visual}
        </Typography>
      </Box>
    );
  }

  return (
    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 }}>
      {visual}
    </Typography>
  );
}

function hasMarkdownTable(text) {
  return /\|.+\|/.test(text);
}

function parseMarkdownTable(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((row) => !row.every((cell) => /^:?-{2,}:?$/.test(cell)));
}

function hasPieData(text) {
  return /%/.test(text) && /[:\-]/.test(text);
}

function parsePieData(text) {
  const slices = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^[\-\*\d\.\)]*\s*([A-Za-z][A-Za-z0-9\s_]+)\s*[:\-]\s*(\d{1,3})\s*%/);
    if (match) {
      slices.push({ label: match[1].trim(), value: Number(match[2]) });
    }
  }

  return slices;
}

function buildFlowDiagramSvg(visualText) {
  const firstFlowLine = String(visualText || "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /->|â†’/.test(line));

  if (!firstFlowLine) return null;

  const nodes = firstFlowLine
    .split(/->|â†’/g)
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (nodes.length < 2) return null;

  const boxW = 160;
  const boxH = 54;
  const gap = 36;
  const pad = 20;
  const width = pad * 2 + nodes.length * boxW + (nodes.length - 1) * gap;
  const height = 110;

  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  parts.push(`<rect width="${width}" height="${height}" fill="#ffffff"/>`);

  nodes.forEach((node, i) => {
    const x = pad + i * (boxW + gap);
    const y = (height - boxH) / 2;
    const safe = escapeXml(shorten(node, 28));

    parts.push(`<rect x="${x}" y="${y}" rx="10" ry="10" width="${boxW}" height="${boxH}" fill="#eef6ff" stroke="#8ab4f8" />`);
    parts.push(`<text x="${x + boxW / 2}" y="${y + boxH / 2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#1f2937">${safe}</text>`);

    if (i < nodes.length - 1) {
      const ax1 = x + boxW + 6;
      const ax2 = x + boxW + gap - 8;
      const ay = height / 2;
      parts.push(`<line x1="${ax1}" y1="${ay}" x2="${ax2}" y2="${ay}" stroke="#2563eb" stroke-width="2.2" />`);
      parts.push(`<polygon points="${ax2},${ay} ${ax2 - 8},${ay - 5} ${ax2 - 8},${ay + 5}" fill="#2563eb" />`);
    }
  });

  parts.push(`</svg>`);

  return `data:image/svg+xml;utf8,${encodeURIComponent(parts.join(""))}`;
}

function buildStudyPosterSvg(visualText) {
  const lines = String(visualText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const heading = shorten(lines[0].replace(/^[-*]\s*/, ""), 42);
  const bulletLines = lines
    .filter((line, index) => index > 0 && /^[-*]/.test(line))
    .map((line) => shorten(line.replace(/^[-*]\s*/, ""), 48))
    .slice(0, 5);

  if (!bulletLines.length) return null;

  const width = 640;
  const height = 420;
  const centerX = 320;
  const centerY = 132;
  const parts = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  parts.push(`<rect width="${width}" height="${height}" rx="24" fill="#ffffff"/>`);
  parts.push(`<rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="22" fill="#f8fbff" stroke="#dbe7f5"/>`);
  parts.push(`<text x="${centerX}" y="64" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#0f172a">Visual Explanation</text>`);
  parts.push(`<rect x="${centerX - 120}" y="${centerY - 34}" width="240" height="68" rx="18" fill="#eef6ff" stroke="#8ab4f8" stroke-width="2"/>`);
  parts.push(`<text x="${centerX}" y="${centerY - 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#1e3a8a">${escapeXml(heading)}</text>`);
  parts.push(`<text x="${centerX}" y="${centerY + 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#334155">Picture guide generated from the AI explanation</text>`);

  const boxPositions = [
    { x: 58, y: 222 },
    { x: 348, y: 222 },
    { x: 58, y: 306 },
    { x: 348, y: 306 },
    { x: 203, y: 264 },
  ];

  bulletLines.forEach((line, index) => {
    const pos = boxPositions[index];
    if (!pos) return;

    const boxWidth = index === 4 ? 234 : 234;
    const boxHeight = 54;
    const anchorX = pos.x + boxWidth / 2;
    const anchorY = pos.y + boxHeight / 2;
    const lineStartY = centerY + 34;
    const lineEndY = pos.y - 10;

    parts.push(`<line x1="${centerX}" y1="${lineStartY}" x2="${anchorX}" y2="${lineEndY}" stroke="#60a5fa" stroke-width="2.2"/>`);
    parts.push(`<circle cx="${anchorX}" cy="${lineEndY}" r="4" fill="#2563eb"/>`);
    parts.push(`<rect x="${pos.x}" y="${pos.y}" width="${boxWidth}" height="${boxHeight}" rx="16" fill="#ffffff" stroke="#bfdbfe"/>`);
    parts.push(`<text x="${anchorX}" y="${pos.y + 23}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#0f172a">${index + 1}</text>`);
    parts.push(`<text x="${anchorX}" y="${pos.y + 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#334155">${escapeXml(line)}</text>`);
  });

  parts.push(`</svg>`);

  return `data:image/svg+xml;utf8,${encodeURIComponent(parts.join(""))}`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function shorten(str, max) {
  const value = String(str || "").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}â€¦`;
}
