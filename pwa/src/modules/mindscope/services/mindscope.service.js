import {
  analyticsMock,
  grammarModes,
  grammarSuggestions,
  mapRegions,
  moreFeatures,
} from "../data/mindscope.mock";

function applyOriginalCase(source, replacement) {
  if (!source) return replacement;
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

const tenseHints = {
  "past-tense": {
    label: "Past Tense",
    matcher: /\b(yesterday|last week|ago|went|ate|studied|played|was|were|had|did)\b/i,
    message: "This sentence should show an action that already happened.",
    convert(text) {
      return String(text || "")
        .replace(/\bI study\b/i, "I studied")
        .replace(/\bI go\b/i, "I went")
        .replace(/\bI eat\b/i, "I ate")
        .replace(/\bI play\b/i, "I played")
        .replace(/\bstudy\b/i, "studied")
        .replace(/\bgo\b/i, "went")
        .replace(/\beat\b/i, "ate")
        .replace(/\bplay\b/i, "played");
    },
  },
  "present-tense": {
    label: "Present Tense",
    matcher: /\b(every day|always|usually|study|studies|go|goes|eat|eats|play|plays|has|have)\b/i,
    message: "This sentence should show a regular action or something happening now.",
    convert(text) {
      return String(text || "")
        .replace(/\bI went\b/i, "I go")
        .replace(/\bI studied\b/i, "I study")
        .replace(/\bI ate\b/i, "I eat")
        .replace(/\bI played\b/i, "I play")
        .replace(/\btomorrow\s+/i, "")
        .replace(/\bwill go\b/i, "goes")
        .replace(/\bwill study\b/i, "studies")
        .replace(/\bwill play\b/i, "plays");
    },
  },
  "future-tense": {
    label: "Future Tense",
    matcher: /\b(tomorrow|next week|will|shall|going to)\b/i,
    message: "This sentence should show an action that will happen later.",
    convert(text) {
      return String(text || "")
        .replace(/\bI study\b/i, "I will study")
        .replace(/\bI go\b/i, "I will go")
        .replace(/\bI eat\b/i, "I will eat")
        .replace(/\bI play\b/i, "I will play")
        .replace(/\bI studied\b/i, "I will study")
        .replace(/\bI went\b/i, "I will go")
        .replace(/\bI ate\b/i, "I will eat")
        .replace(/\bI played\b/i, "I will play");
    },
  },
};

function explainSelectedTense({ source, correctedText, activeMode, issues }) {
  const hint = tenseHints[activeMode];
  if (!hint) return { correctedText, issues };

  if (hint.matcher.test(correctedText)) {
    return {
      correctedText,
      issues,
      tenseExplanation: `This matches ${hint.label}: ${hint.message}`,
    };
  }

  const tenseCorrection = hint.convert(correctedText);
  const nextText = tenseCorrection === correctedText ? correctedText : tenseCorrection;
  return {
    correctedText: nextText,
    issues: [
      ...issues,
      {
        id: `${activeMode}-${issues.length}`,
        type: hint.label,
        original: source,
        suggestion: nextText,
        message: `Selected type is ${hint.label}. ${hint.message}`,
      },
    ],
    tenseExplanation: `Selected type is ${hint.label}. ${hint.message}`,
  };
}

function detectTenseName(text = "") {
  const value = String(text || "").toLowerCase();
  if (/\b(has|have|had)\s+\w+(ed|en)\b/.test(value) || /\b(has|have|had)\s+(completed|done|gone|written|eaten|seen|made)\b/.test(value)) {
    return "Present Perfect Tense";
  }
  if (/\b(will|shall)\b/.test(value)) return "Simple Future Tense";
  if (/\b(went|ate|studied|played|was|were|had|did|completed)\b/.test(value)) return "Simple Past Tense";
  if (/\b(am|is|are)\s+\w+ing\b/.test(value)) return "Present Continuous Tense";
  return "Simple Present Tense";
}

function buildLocalStructure(text = "") {
  const value = String(text || "").trim();
  if (!value) return [];

  if (/^she\s+goes\s+to\s+school\s+every\s+day\.?$/i.test(value)) {
    return [
      { text: "She", role: "Subject" },
      { text: "goes", role: "Verb", note: "correct form" },
      { text: "to school", role: "Object/place" },
      { text: "every day", role: "Time", note: "daily habit" },
    ];
  }

  if (/^i\s+have\s+completed\s+my\s+homework\.?$/i.test(value)) {
    return [
      { text: "I", role: "Subject" },
      { text: "have", role: "Helping verb" },
      { text: "completed", role: "Past participle", note: "V3 of complete" },
      { text: "my homework", role: "Object" },
    ];
  }

  const words = value.replace(/[.!?]+$/g, "").split(/\s+/).filter(Boolean);
  return words.map((word, index) => ({
    text: word,
    role: index === 0 ? "Subject or sentence starter" : "Sentence part",
  }));
}

export function getGrammarModes() {
  return grammarModes;
}

export function getGrammarSample(mode = "all") {
  return grammarModes.find((item) => item.value === mode)?.sample || grammarModes[0].sample;
}

export function checkGrammar(text, mode = "all") {
  const source = String(text || "");
  const issues = [];
  let correctedText = source;
  const activeMode = String(mode || "all");

  grammarSuggestions
    .filter((rule) => activeMode === "all" || rule.modes?.includes(activeMode) || rule.modes?.includes("tense") && activeMode.includes("tense"))
    .forEach((rule) => {
    correctedText = correctedText.replace(rule.pattern, (match) => {
      issues.push({
        id: `${rule.type}-${issues.length}`,
        type: rule.type,
        original: match,
        suggestion: applyOriginalCase(match, rule.replacement),
        message: rule.message,
      });
      return applyOriginalCase(match, rule.replacement);
    });
  });

  if (activeMode === "all" || activeMode === "capitalization" || activeMode === "writing") {
    correctedText = correctedText
      .replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => `${prefix}${letter.toUpperCase()}`)
      .trim();
  } else {
    correctedText = correctedText.trim();
  }

  const tenseResult = explainSelectedTense({ source, correctedText, activeMode, issues });
  correctedText = tenseResult.correctedText;
  issues.splice(0, issues.length, ...tenseResult.issues);

  const explanation = issues.length
    ? issues.slice(0, 2).map((issue) => issue.message).join(" ")
    : tenseResult.tenseExplanation || "This sentence looks clear for the selected grammar type.";

  return {
    correctedText,
    explanation,
    issues,
    mode: activeMode,
    tenseName: detectTenseName(correctedText),
    structure: buildLocalStructure(correctedText),
    score: Math.max(40, 100 - issues.length * 8),
  };
}

export function getMapRegions() {
  return mapRegions;
}

export function searchMapRegions(query) {
  const search = String(query || "").trim().toLowerCase();
  if (!search) return mapRegions;
  const terms = search.split(/\s+/).filter((term) => term && term !== "map");

  return mapRegions.filter((region) => {
    const values = [
      region.label,
      region.scope,
      region.title,
      region.content,
      ...(region.tags || []),
    ];
    const searchable = values.map((value) => String(value || "").toLowerCase()).join(" ");
    return terms.length ? terms.some((term) => searchable.includes(term)) : searchable.includes(search);
  });
}

export function getAnalyticsSnapshot() {
  const subjects = analyticsMock.subjects;
  const average = Math.round(subjects.reduce((sum, item) => sum + item.score, 0) / subjects.length);
  const strongest = [...subjects].sort((a, b) => b.score - a.score)[0];
  const weakest = [...subjects].sort((a, b) => a.score - b.score)[0];

  return {
    ...analyticsMock,
    average,
    strongest,
    weakest,
    summaries: [
      `Your strongest area is ${strongest.subject}, especially ${strongest.strength.toLowerCase()}.`,
      `${weakest.subject} needs attention. Start with ${weakest.focus.toLowerCase()} practice.`,
      "Progress is improving week by week. Keep short daily revision blocks.",
    ],
  };
}

export function getMoreFeaturePlaceholders() {
  return moreFeatures;
}
