export const grammarSuggestions = [
  {
    pattern: /\bteh\b/gi,
    replacement: "the",
    message: "Use the correct spelling: the.",
    type: "Spelling",
    modes: ["all", "spelling"],
  },
  {
    pattern: /\brecieve\b/gi,
    replacement: "receive",
    message: "Remember: i before e, except after c.",
    type: "Spelling",
    modes: ["all", "spelling"],
  },
  {
    pattern: /\balot\b/gi,
    replacement: "a lot",
    message: "Use two words: a lot.",
    type: "Writing",
    modes: ["all", "writing"],
  },
  {
    pattern: /\bdont\b/gi,
    replacement: "don't",
    message: "Add the apostrophe in don't.",
    type: "Punctuation",
    modes: ["all", "punctuation"],
  },
  {
    pattern: /\bcant\b/gi,
    replacement: "can't",
    message: "Add the apostrophe in can't.",
    type: "Punctuation",
    modes: ["all", "punctuation"],
  },
  {
    pattern: /\bi am\b/g,
    replacement: "I am",
    message: "Capitalize the pronoun I.",
    type: "Grammar",
    modes: ["all", "capitalization"],
  },
  {
    pattern: /\byesterday\s+i\s+go\b/gi,
    replacement: "yesterday I went",
    message: "Use past tense after yesterday.",
    type: "Past Tense",
    modes: ["all", "past-tense", "tense"],
  },
  {
    pattern: /\blast\s+week\s+i\s+eat\b/gi,
    replacement: "last week I ate",
    message: "Use the past tense verb for completed actions.",
    type: "Past Tense",
    modes: ["all", "past-tense", "tense"],
  },
  {
    pattern: /\btomorrow\s+i\s+went\b/gi,
    replacement: "tomorrow I will go",
    message: "Use future tense for tomorrow.",
    type: "Future Tense",
    modes: ["all", "future-tense", "tense"],
  },
  {
    pattern: /\bnext\s+week\s+i\s+played\b/gi,
    replacement: "next week I will play",
    message: "Use future tense for next week.",
    type: "Future Tense",
    modes: ["all", "future-tense", "tense"],
  },
  {
    pattern: /\bhe\s+have\b/gi,
    replacement: "he has",
    message: "Use has with he, she, or it.",
    type: "Present Tense",
    modes: ["all", "present-tense", "tense"],
  },
  {
    pattern: /\bshe\s+go\s+to\b/gi,
    replacement: "she goes to",
    message: "Use goes with she in simple present tense.",
    type: "Present Tense",
    modes: ["all", "present-tense", "tense"],
  },
  {
    pattern: /\s{2,}/g,
    replacement: " ",
    message: "Remove extra spacing between words.",
    type: "Style",
    modes: ["all", "writing", "style"],
  },
];

export const grammarModes = [
  {
    value: "all",
    label: "All Grammar",
    sample: "i am learning teh map lesson and dont understand alot of words.",
  },
  {
    value: "past-tense",
    label: "Past Tense",
    sample: "Yesterday I go to school and last week I eat lunch late.",
  },
  {
    value: "present-tense",
    label: "Present Tense",
    sample: "He have a pencil and she go to class every day.",
  },
  {
    value: "future-tense",
    label: "Future Tense",
    sample: "Tomorrow I went to the library and next week I played cricket.",
  },
  {
    value: "spelling",
    label: "Spelling",
    sample: "I recieve teh homework note.",
  },
  {
    value: "punctuation",
    label: "Punctuation",
    sample: "I dont know the answer and I cant solve it.",
  },
  {
    value: "writing",
    label: "Writing Improvement",
    sample: "I read alot  and write  slowly.",
  },
];

export const mapRegions = [
  {
    id: "india",
    label: "India",
    scope: "Asia",
    x: 66,
    y: 52,
    color: "#2e7d32",
    tags: ["india", "monsoon", "asia", "himalaya", "thar", "coast"],
    title: "India: Monsoon And Diversity",
    content:
      "India has the Himalayan mountain system in the north, the Thar Desert in the west, and a long coastline that influences monsoon rainfall.",
    quiz: {
      question: "Which seasonal wind system strongly affects rainfall in India?",
      answer: "Monsoon",
      options: ["Trade winds", "Monsoon", "Polar easterlies"],
    },
  },
  {
    id: "amazon",
    label: "Amazon Basin",
    scope: "South America",
    x: 34,
    y: 61,
    color: "#00897b",
    tags: ["amazon", "rainforest", "river", "south america", "forest"],
    title: "Amazon Basin: Rainforest System",
    content:
      "The Amazon Basin contains one of the world's largest rainforest systems and plays an important role in water cycles and biodiversity.",
    quiz: {
      question: "Which river system is connected with this rainforest region?",
      answer: "Amazon",
      options: ["Nile", "Amazon", "Danube"],
    },
  },
  {
    id: "sahara",
    label: "Sahara",
    scope: "Africa",
    x: 50,
    y: 43,
    color: "#f9a825",
    tags: ["sahara", "desert", "africa", "dry", "climate"],
    title: "Sahara: Hot Desert",
    content:
      "The Sahara is a vast hot desert across northern Africa. Its climate is dry because descending air limits cloud formation.",
    quiz: {
      question: "The Sahara is mainly known as a large what?",
      answer: "Desert",
      options: ["Rainforest", "Desert", "Tundra"],
    },
  },
  {
    id: "himalaya",
    label: "Himalayas",
    scope: "Asia",
    x: 64,
    y: 44,
    color: "#546e7a",
    tags: ["himalaya", "mountain", "india", "asia", "fold mountains"],
    title: "Himalayas: Young Fold Mountains",
    content:
      "The Himalayas are young fold mountains formed by plate movement. They influence climate, rivers, and settlement patterns.",
    quiz: {
      question: "The Himalayas are an example of which landform?",
      answer: "Fold mountains",
      options: ["Fold mountains", "Coral island", "Delta"],
    },
  },
  {
    id: "india-steel",
    label: "Steel Manufacturing Locations In India",
    scope: "India",
    x: 58,
    y: 52,
    color: "#455a64",
    tags: [
      "steel",
      "steel production",
      "steel production of india",
      "steel plants",
      "steel plants in india",
      "steel manufacturing",
      "steel manufacturing locations in india",
      "iron and steel",
      "india industry",
      "jamshedpur",
      "bhilai",
      "rourkela",
      "durgapur",
      "bokaro",
      "salem",
      "visakhapatnam",
      "burnpur",
    ],
    title: "Steel Manufacturing Locations In India",
    content:
      "Major steel manufacturing centres in India include Jamshedpur, Bhilai, Rourkela, Durgapur, Bokaro, Burnpur, Salem, and Visakhapatnam.",
    quiz: {
      question: "Which of these is a major steel manufacturing centre in India?",
      answer: "Jamshedpur",
      options: ["Jamshedpur", "Panaji", "Shimla"],
    },
  },
  {
    id: "great-barrier-reef",
    label: "Great Barrier Reef",
    scope: "Australia",
    x: 79,
    y: 70,
    color: "#039be5",
    tags: ["reef", "coral", "australia", "ocean", "great barrier reef"],
    title: "Great Barrier Reef: Coral Ecosystem",
    content:
      "The Great Barrier Reef is a large coral reef system near Australia. Coral ecosystems need warm, shallow, clear sea water.",
    quiz: {
      question: "Which living structures build coral reefs?",
      answer: "Corals",
      options: ["Corals", "Mosses", "Cacti"],
    },
  },
];

export const analyticsMock = {
  subjects: [
    { subject: "English", score: 78, previous: 70, strength: "Vocabulary", focus: "Tenses" },
    { subject: "Science", score: 84, previous: 79, strength: "Concept Recall", focus: "Diagrams" },
    { subject: "Math", score: 69, previous: 64, strength: "Arithmetic", focus: "Word Problems" },
    { subject: "Social", score: 74, previous: 77, strength: "Maps", focus: "Dates" },
  ],
  trend: [
    { label: "Week 1", score: 62 },
    { label: "Week 2", score: 68 },
    { label: "Week 3", score: 73 },
    { label: "Week 4", score: 76 },
    { label: "Week 5", score: 81 },
  ],
  kpis: [
    { label: "Average Score", value: "76%", tone: "success" },
    { label: "Practice Streak", value: "5 days", tone: "primary" },
    { label: "Focus Area", value: "Writing", tone: "warning" },
  ],
};

export const moreFeatures = [
  "Voice-based grammar checks",
  "AI insight reports",
  "Advanced map layers",
  "Custom visual dashboards",
];
