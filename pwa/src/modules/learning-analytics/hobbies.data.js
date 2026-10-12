import { Code, Insights, Public, Science } from "@mui/icons-material";

export const HOBBY_SELECTION_STORAGE_KEY = "student-hobby-selection";
export const HOBBY_LEADERBOARD_STORAGE_KEY = "student-hobby-leaderboard";

export const HOBBY_CATEGORIES = [
  {
    id: "logical-thinking",
    title: "Logical Thinking & Aptitude",
    description: "Puzzles, patterns, and reasoning games for sharper thinking.",
    icon: Insights,
  },
  {
    id: "science-exploration",
    title: "Basic Science Exploration",
    description: "Simple experiments, concept videos, and science discovery.",
    icon: Science,
  },
  {
    id: "intro-coding",
    title: "Intro to Coding",
    description: "Starter coding activities with logic, blocks, and mini projects.",
    icon: Code,
  },
  {
    id: "general-knowledge",
    title: "General Knowledge",
    description: "Learn world facts, daily GK, and current awareness topics.",
    icon: Public,
  },
];
