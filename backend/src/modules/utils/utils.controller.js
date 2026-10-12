import axios from "axios";
import https from "https";

const cache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const getCached = (pincode) => {
  const entry = cache.get(pincode);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(pincode);
    return null;
  }
  return entry.value;
};

const setCached = (pincode, value) => {
  cache.set(pincode, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const normalizeText = (value) => String(value || "").trim();
const shouldLog = String(process.env.PINCODE_LOG_ERRORS || "").toLowerCase() === "true";

const tryParseJson = (value) => {
  if (value == null) return null;
  if (typeof value === "object") return value;
  const text = String(value).trim();
  try {
    return JSON.parse(text);
  } catch {
    // Some proxies may prepend text; try parsing from the first JSON token.
    const firstObj = text.indexOf("{");
    const firstArr = text.indexOf("[");
    const start = firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr);
    if (start <= 0) return null;
    try {
      return JSON.parse(text.slice(start));
    } catch {
      return null;
    }
  }
};

const proxyHeaders = {
  Accept: "application/json,text/plain,*/*",
  "Accept-Language": "en-IN,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
};

const pickCityStateFromPostOffices = (pincode, upstreamData) => {
  const postOffices = upstreamData?.[0]?.PostOffice;
  const status = upstreamData?.[0]?.Status;
  if (status !== "Success" || !Array.isArray(postOffices) || postOffices.length === 0) return null;

  const tryOffice = (office) => {
    if (!office) return null;
    const state = normalizeText(office?.State);
    const cityCandidate =
      normalizeText(office?.District) ||
      normalizeText(office?.Block) ||
      normalizeText(office?.Circle) ||
      normalizeText(office?.Division) ||
      normalizeText(office?.Region) ||
      normalizeText(office?.Name);

    if (!state && !cityCandidate) return null;
    return { pincode, city: cityCandidate, state };
  };

  // Prefer an office with District + State.
  for (const office of postOffices) {
    const district = normalizeText(office?.District);
    const state = normalizeText(office?.State);
    if (district && state) return { pincode, city: district, state };
  }

  // Otherwise pick the first office that yields any city/state.
  for (const office of postOffices) {
    const picked = tryOffice(office);
    if (picked) return picked;
  }

  return null;
};

const lookupViaJinaProxy = async (pincode) => {
  // Uses a public fetch proxy to avoid server-IP blocks by the upstream.
  // Keeps the call server-side (no CORS issues for the browser).
  const upstream = `https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`;
  const url = `https://r.jina.ai/${upstream}`;

  const { data } = await axios.get(url, {
    timeout: 12000,
    headers: proxyHeaders,
  });

  const text = typeof data === "string" ? data : JSON.stringify(data);
  const extracted = text.includes("Markdown Content:")
    ? text.split("Markdown Content:").slice(1).join("Markdown Content:").trim()
    : text;

  const parsed = tryParseJson(extracted);
  return pickCityStateFromPostOffices(pincode, parsed);
};

const zippoHeaders = {
  Accept: "application/json,text/plain,*/*",
  "Accept-Language": "en-IN,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
};

const parseZippo = (pincode, data) => {
  const place = data?.places?.[0];
  const city = normalizeText(place?.["place name"]);
  const state = normalizeText(place?.state);
  const ok = Boolean(city || state);
  if (!ok) return null;
  return { pincode, city, state };
};

const lookupViaZippopotam = async (pincode) => {
  const candidates = [
    `https://api.zippopotam.us/in/${encodeURIComponent(pincode)}`,
    `https://api.zippopotam.us/IN/${encodeURIComponent(pincode)}`,
  ];

  for (const url of candidates) {
    try {
      const { data } = await axios.get(url, {
        timeout: 12000,
        headers: zippoHeaders,
      });
      const parsed = parseZippo(pincode, data);
      if (parsed) return parsed;
    } catch (err) {
      const status = err?.response?.status;
      // If not found, try next candidate; otherwise bubble up.
      if (status === 404) continue;
      throw err;
    }
  }

  return null;
};

export const lookupPincode = async (req, res) => {
  const pincode = String(req.params.pincode || "").trim();

  if (!/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ message: "Invalid pincode. Must be 6 digits." });
  }

  const cached = getCached(pincode);
  if (cached) {
    res.set("Cache-Control", "public, max-age=86400");
    return res.json(cached);
  }

  let data;
  try {
    const urlHttps = `https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`;
    const urlHttp = `http://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`;
    const commonHeaders = {
      Accept: "application/json,text/plain,*/*",
      "Accept-Language": "en-IN,en;q=0.9",
      // Some upstreams (or CDNs/WAFs) block requests without a browser-like UA.
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    };

    // 1) Try HTTPS normally (preferred).
    try {
      const response = await axios.get(urlHttps, {
        timeout: 12000,
        headers: commonHeaders,
      });
      data = response.data;
    } catch (primaryErr) {
      // 2) Some environments see TLS/certificate issues; optionally allow insecure TLS for this host.
      const allowInsecureTls = String(process.env.PINCODE_TLS_INSECURE || "").toLowerCase() === "true";
      const primaryCode = primaryErr?.code;
      const primaryMessage = String(primaryErr?.message || "");
      const looksLikeTlsProblem =
        primaryCode === "CERT_HAS_EXPIRED" ||
        primaryCode === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
        primaryCode === "DEPTH_ZERO_SELF_SIGNED_CERTIFICATE" ||
        primaryMessage.toLowerCase().includes("certificate");

      if (allowInsecureTls && looksLikeTlsProblem) {
        const response = await axios.get(urlHttps, {
          timeout: 12000,
          headers: commonHeaders,
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });
        data = response.data;
      } else {
        // 3) Fallback to HTTP without following redirects (some hosts redirect back to HTTPS).
        const response = await axios.get(urlHttp, {
          timeout: 12000,
          headers: commonHeaders,
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
        });

        if (response.status >= 300 && response.status < 400) {
          throw primaryErr;
        }
        data = response.data;
      }
    }
  } catch (err) {
    const upstreamStatus = err?.response?.status;
    const code = err?.code;
    const message = err?.message || "Unable to fetch pincode details.";
    if (shouldLog) {
      console.error("Pincode upstream failed:", { pincode, upstreamStatus, code, message });
    }

    // Many deployments get blocked by `api.postalpincode.in` (403). Fallback providers.
    const shouldFallback =
      upstreamStatus === 403 ||
      upstreamStatus === 429 ||
      (upstreamStatus >= 500 && upstreamStatus <= 599);

    if (shouldFallback) {
      try {
        const viaProxy = await lookupViaJinaProxy(pincode);
        if (viaProxy) {
          setCached(pincode, viaProxy);
          res.set("Cache-Control", "public, max-age=86400");
          return res.json(viaProxy);
        }

        const fallback = await lookupViaZippopotam(pincode);
        if (fallback) {
          setCached(pincode, fallback);
          res.set("Cache-Control", "public, max-age=86400");
          return res.json(fallback);
        }
      } catch (fallbackErr) {
        const fbStatus = fallbackErr?.response?.status;
        const fbCode = fallbackErr?.code;
        const fbMessage = fallbackErr?.message || "Fallback pincode provider failed.";
        if (shouldLog) {
          console.error("Pincode fallback failed:", {
            pincode,
            upstreamStatus: fbStatus,
            code: fbCode,
            message: fbMessage,
          });
        }
      }

      // If all providers fail, return empty data (not an error) so the UI can allow manual entry
      // without showing a noisy "502 Bad Gateway".
      return res.json({ pincode, city: "", state: "", message: "Auto-fetch unavailable." });
    }

    return res.status(502).json({ message, code, upstreamStatus });
  }

  const office = data?.[0]?.PostOffice?.[0];
  const ok = data?.[0]?.Status === "Success" && office;

  if (!ok) {
    return res.status(404).json({ message: "Pincode not found." });
  }

  const payload =
    pickCityStateFromPostOffices(pincode, data) || {
      pincode,
      city: office?.District || "",
      state: office?.State || "",
    };

  setCached(pincode, payload);
  res.set("Cache-Control", "public, max-age=86400");
  return res.json(payload);
};
