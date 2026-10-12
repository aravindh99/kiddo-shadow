import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Popover,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import { useAuth } from "../../auth/AuthProvider";
import {
  getGamifiedLearningBadges,
  getGamifiedLearningLeaderboards,
  getGamifiedLearningOverview,
  getGamifiedLearningProfile,
  getLogicalThinkingOverview,
} from "./learningAnalytics.api";
import { generateQuiz } from "../quiz/api/quiz.api";
import { HOBBY_LEADERBOARD_STORAGE_KEY } from "./hobbies.data";
import { askAiQuestion } from "../ai-chat/api/aiChat.api";

const getCorrectOptionIndex = (question = {}) => {
  const value =
    question.correct_option_index ??
    question.correctOptionIndex ??
    question.answer_index ??
    question.answerIndex;
  const number = Number(value);
  return Number.isInteger(number) ? number : -1;
};

const getAnswerOptionSx = ({ question, optionIndex, selectedIndex, showFeedback }) => {
  if (!showFeedback) {
    return {
      mx: 0,
      mb: 0.75,
      px: 1.25,
      py: 0.5,
      border: "1px solid transparent",
      borderRadius: 2,
    };
  }

  const correctIndex = getCorrectOptionIndex(question);
  const isCorrectOption = optionIndex === correctIndex;
  const isSelectedWrong = optionIndex === selectedIndex && selectedIndex !== correctIndex;

  return {
    mx: 0,
    mb: 0.75,
    px: 1.25,
    py: 0.5,
    border: "1px solid",
    borderRadius: 2,
    borderColor: isCorrectOption
      ? "success.main"
      : isSelectedWrong
        ? "error.main"
        : "divider",
    bgcolor: isCorrectOption
      ? "rgba(46, 125, 50, 0.12)"
      : isSelectedWrong
        ? "rgba(211, 47, 47, 0.12)"
        : "transparent",
    color: isCorrectOption
      ? "success.dark"
      : isSelectedWrong
        ? "error.dark"
        : "text.primary",
    fontWeight: isCorrectOption || isSelectedWrong ? 800 : 500,
  };
};

const MODULES = {
  "logical-thinking": {
    title: "Logical Thinking",
    intro:
      "Reasoning, patterns, and puzzle-based activities.",
    activities: [
      "Pattern Game",
      "Puzzles",
      "Aptitude",
    ],
    choicesLabel: "Choose one option to continue.",
  },
  "science-exploration": {
    title: "Basic Science Exploration",
    intro:
      "Learn core science ideas through short videos, simple experiments, and quizzes.",
    activities: [
      "Guided experiments",
      "Quick science quizzes",
      "Nature observation tasks",
    ],
    choicesLabel: "Choose one science activity to continue.",
  },
  "intro-coding": {
    title: "Intro to Coding",
    intro:
      "Develop computational thinking with block-based coding and simple projects.",
    activities: [],
  },
  "general-knowledge": {
    title: "General Knowledge",
    intro:
      "Strengthen awareness of India and the world with daily GK practice.",
    activities: [
      "Daily GK quizzes",
      "Current affairs prompts",
      "World facts practice",
      "India and culture discovery",
    ],
    choicesLabel: "Choose 3-4 general knowledge activities to improve awareness.",
  },
  "gamified-learning": {
    title: "Gamified Learning Engagement",
    intro:
      "Stay motivated with XP points, badges, and leaderboard activities.",
    activities: [
      "XP progression",
      "Badge challenges",
      "Leaderboard participation",
    ],
  },
};

export default function LearningModuleIntroPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const studentBase = location.pathname.startsWith("/students") ? "/students" : "/student";
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [gamifiedProfile, setGamifiedProfile] = useState(null);
  const [gamifiedBadges, setGamifiedBadges] = useState([]);
  const [gamifiedLeaderboards, setGamifiedLeaderboards] = useState(null);
  const [selectedLogicalOption, setSelectedLogicalOption] = useState(null);
  const [selectedLogicalTopic, setSelectedLogicalTopic] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [logicalAnswers, setLogicalAnswers] = useState({});
  const [logicalResult, setLogicalResult] = useState(null);
  const [logicalResultOpen, setLogicalResultOpen] = useState(false);
  const [logicalInfoAnchorEl, setLogicalInfoAnchorEl] = useState(null);
  const [selectedScienceOption, setSelectedScienceOption] = useState(null);
  const [selectedScienceTopic, setSelectedScienceTopic] = useState("");
  const [scienceQuestions, setScienceQuestions] = useState([]);
  const [loadingScienceQuestions, setLoadingScienceQuestions] = useState(false);
  const [scienceAnswers, setScienceAnswers] = useState({});
  const [scienceResult, setScienceResult] = useState(null);
  const [scienceResultOpen, setScienceResultOpen] = useState(false);
  const [scienceInfoAnchorEl, setScienceInfoAnchorEl] = useState(null);
  const [selectedGeneralOption, setSelectedGeneralOption] = useState(null);
  const [selectedGeneralTopic, setSelectedGeneralTopic] = useState("");
  const [generalQuestions, setGeneralQuestions] = useState([]);
  const [loadingGeneralQuestions, setLoadingGeneralQuestions] = useState(false);
  const [generalAnswers, setGeneralAnswers] = useState({});
  const [generalResult, setGeneralResult] = useState(null);
  const [generalResultOpen, setGeneralResultOpen] = useState(false);
  const [generalInfoAnchorEl, setGeneralInfoAnchorEl] = useState(null);
  const [selectedCodingTopic, setSelectedCodingTopic] = useState("");
  const [codingPrograms, setCodingPrograms] = useState([]);
  const [loadingCodingQuestions, setLoadingCodingQuestions] = useState(false);
  const [codingAnswers, setCodingAnswers] = useState({});
  const [codingResult, setCodingResult] = useState(null);
  const [codingResultOpen, setCodingResultOpen] = useState(false);
  const [codingInfoAnchorEl, setCodingInfoAnchorEl] = useState(null);

  const logicalThinkingOptions = useMemo(
    () => [
      {
        id: "pattern-game",
        title: "Pattern Game",
        description: "Spot number, shape, and sequence patterns.",
        topics: [
          "Number pattern challenge",
          "Shape sequence finder",
          "Odd one out patterns",
        ],
      },
      {
        id: "puzzles",
        title: "Puzzles",
        description: "Solve short logic and reasoning puzzles.",
        topics: [
          "Simple puzzle challenge",
          "Picture puzzle starter",
          "Logic puzzle practice",
        ],
      },
      {
        id: "aptitude",
        title: "Aptitude",
        description: "Practice aptitude questions with easy examples.",
        topics: [
          "Basic aptitude practice",
          "Number aptitude starter",
          "Speed and accuracy aptitude",
        ],
      },
    ],
    []
  );
  const scienceOptions = useMemo(
    () => [
      {
        id: "guided-experiments",
        title: "Guided Experiments",
        description: "Hands-on science thinking with easy experiment ideas.",
        topics: [
          "Water experiment basics",
          "Plant growth starter",
          "Light and shadow experiment",
        ],
      },
      {
        id: "quick-science-quizzes",
        title: "Quick Science Quizzes",
        description: "Short quiz practice on everyday science topics.",
        topics: [
          "Human body basics",
          "Animals and habitats quiz",
          "Matter and materials quiz",
        ],
      },
      {
        id: "nature-observation",
        title: "Nature Observation Tasks",
        description: "Observe plants, weather, and surroundings through science.",
        topics: [
          "Weather observation task",
          "Leaf and plant observation",
          "Day and night nature study",
        ],
      },
    ],
    []
  );
  const generalKnowledgeOptions = useMemo(
    () => [
      {
        id: "daily-gk-quizzes",
        title: "Daily GK Quizzes",
        description: "Practice useful daily facts in a quick quiz format.",
        topics: [
          "Daily general knowledge quiz",
          "Important India facts",
          "Basic world facts",
        ],
      },
      {
        id: "current-affairs",
        title: "Current Affairs Prompts",
        description: "Build awareness with age-friendly current affairs practice.",
        topics: [
          "Current affairs for students",
          "Science and technology news basics",
          "Sports and awards awareness",
        ],
      },
      {
        id: "world-facts",
        title: "World Facts Practice",
        description: "Learn countries, capitals, oceans, continents, and famous places.",
        topics: [
          "Countries and capitals",
          "Continents and oceans",
          "Famous places around the world",
        ],
      },
      {
        id: "india-culture",
        title: "India and Culture Discovery",
        description: "Explore Indian states, culture, festivals, and history basics.",
        topics: [
          "Indian states and capitals",
          "Indian culture and festivals",
          "Famous Indian leaders and monuments",
        ],
      },
    ],
    []
  );
  useEffect(() => {
    let active = true;

    async function loadOverview() {
      if (moduleId !== "logical-thinking" && moduleId !== "gamified-learning") {
        setOverview(null);
        return;
      }

      setLoadingOverview(true);
      try {
        const res =
          moduleId === "logical-thinking"
            ? await getLogicalThinkingOverview()
            : await getGamifiedLearningOverview();
        if (active) setOverview(res || null);
      } catch (err) {
        console.error(err);
        if (active) setOverview(null);
      } finally {
        if (active) setLoadingOverview(false);
      }
    }

    loadOverview();
    return () => {
      active = false;
    };
  }, [moduleId]);

  useEffect(() => {
    setSelectedLogicalOption(null);
    setSelectedLogicalTopic("");
    setGeneratedQuestions([]);
    setLoadingQuestions(false);
    setLogicalAnswers({});
    setLogicalResult(null);
    setLogicalResultOpen(false);
    setSelectedScienceOption(null);
    setSelectedScienceTopic("");
    setScienceQuestions([]);
    setLoadingScienceQuestions(false);
    setScienceAnswers({});
    setScienceResult(null);
    setScienceResultOpen(false);
    setSelectedGeneralOption(null);
    setSelectedGeneralTopic("");
    setGeneralQuestions([]);
    setLoadingGeneralQuestions(false);
    setGeneralAnswers({});
    setGeneralResult(null);
    setGeneralResultOpen(false);
    setSelectedCodingTopic("");
    setCodingPrograms([]);
    setLoadingCodingQuestions(false);
    setCodingAnswers({});
    setCodingResult(null);
    setCodingResultOpen(false);
  }, [moduleId]);

  useEffect(() => {
    let active = true;

    async function loadGamifiedExtras() {
      if (moduleId !== "gamified-learning") {
        setGamifiedProfile(null);
        setGamifiedBadges([]);
        setGamifiedLeaderboards(null);
        return;
      }

      try {
        const [profileRes, badgeRes, leaderboardRes] = await Promise.all([
          getGamifiedLearningProfile(),
          getGamifiedLearningBadges(),
          getGamifiedLearningLeaderboards(),
        ]);

        if (!active) return;
        setGamifiedProfile(profileRes || null);
        setGamifiedBadges(Array.isArray(badgeRes) ? badgeRes : []);
        setGamifiedLeaderboards(leaderboardRes || null);
      } catch (err) {
        if (!active) return;
        setGamifiedProfile(null);
        setGamifiedBadges([]);
        setGamifiedLeaderboards(null);
      }
    }

    loadGamifiedExtras();
    return () => {
      active = false;
    };
  }, [moduleId]);

  const moduleData = useMemo(() => {
    if (overview?.module) {
      return {
        title: overview.module.title,
        intro: overview.module.summary,
        activities: overview.module.delivery || [],
      };
    }
    return MODULES[moduleId] || null;
  }, [moduleId, overview]);

  const analyticsData = useMemo(() => {
    if (!overview) return null;

    const stats = overview.stats || {};
    const averagePoints = Number(stats.average_xp) || 0;
    const levelStep = 100;
    const level = Math.floor(averagePoints / levelStep) + 1;
    const levelProgress = averagePoints % levelStep;
    const progressPercent = Math.min(
      100,
      Math.round((levelProgress / levelStep) * 100)
    );

    return {
      topicHighlight: overview.topic_highlight || null,
      categories: overview.games?.categories || [],
      gamesConducted: Number(stats.games_conducted) || 0,
      totalPoints: Number(stats.total_xp) || 0,
      averagePoints,
      leaderboard: overview.leaderboard || [],
      level,
      levelProgress,
      levelStep,
      progressPercent,
    };
  }, [overview]);

  const shouldShowLogicalThinkingFlow = moduleId === "logical-thinking";
  const shouldShowScienceFlow = moduleId === "science-exploration";
  const shouldShowGeneralKnowledgeFlow = moduleId === "general-knowledge";
  const shouldShowCodingFlow = moduleId === "intro-coding";
  const logicalInfoOpen = Boolean(logicalInfoAnchorEl);
  const scienceInfoOpen = Boolean(scienceInfoAnchorEl);
  const generalInfoOpen = Boolean(generalInfoAnchorEl);
  const codingInfoOpen = Boolean(codingInfoAnchorEl);

  const buildCodingPrograms = (topic) => {
    const normalizedTopic = String(topic || "").trim().toLowerCase();

    const topicPrograms = [
      {
        match: ["string", "text", "word"],
        programs: [
          {
            title: "Program 1",
            prompt: "Write a simple program to reverse a string.",
            placeholder: "Example: input a word and print it in reverse order.",
          },
          {
            title: "Program 2",
            prompt: "Write a simple program to count vowels in a string.",
            placeholder: "Example: check each letter and count a, e, i, o, u.",
          },
        ],
      },
      {
        match: ["number", "math", "count"],
        programs: [
          {
            title: "Program 1",
            prompt: "Write a simple program to check whether a number is even or odd.",
            placeholder: "Example: input one number and print even or odd.",
          },
          {
            title: "Program 2",
            prompt: "Write a simple program to print numbers from 1 to 10.",
            placeholder: "Example: use a small loop and print each number.",
          },
        ],
      },
      {
        match: ["pattern", "star"],
        programs: [
          {
            title: "Program 1",
            prompt: "Write a simple program to print a small star pattern.",
            placeholder: "Example: print 3 rows of stars.",
          },
          {
            title: "Program 2",
            prompt: "Write a simple program to print number pattern 1 2 3.",
            placeholder: "Example: print a short increasing number pattern.",
          },
        ],
      },
      {
        match: ["debug", "error", "fix"],
        programs: [
          {
            title: "Program 1",
            prompt: "Write a corrected program that adds two numbers and prints the result.",
            placeholder: "Example: take two values and show the sum correctly.",
          },
          {
            title: "Program 2",
            prompt: "Write a corrected program that prints Hello World properly.",
            placeholder: "Example: fix a small output mistake and print the message.",
          },
        ],
      },
      {
        match: ["computer science", "coding", "programming", "code"],
        programs: [
          {
            title: "Program 1",
            prompt: "Write a simple program to print Hello World.",
            placeholder: "Example: print one welcome message on the screen.",
          },
          {
            title: "Program 2",
            prompt: "Write a simple program to add two numbers and print the answer.",
            placeholder: "Example: take two values and show the sum.",
          },
        ],
      },
    ];

    const matchedPrograms =
      topicPrograms.find((entry) =>
        entry.match.some((keyword) => normalizedTopic.includes(keyword))
      )?.programs || [
        {
          title: "Program 1",
          prompt: `Write a simple beginner program related to ${topic}.`,
          placeholder: "Write a short and easy beginner program.",
        },
        {
          title: "Program 2",
          prompt: `Write one more easy practice program related to ${topic}.`,
          placeholder: "Write one more short program with clear steps.",
        },
      ];

    return matchedPrograms.map((program, index) => ({
      id: `${normalizedTopic || "coding"}-program-${index + 1}`,
      ...program,
    }));
  };

  const activeLogicalOption = useMemo(
    () =>
      logicalThinkingOptions.find((option) => option.id === selectedLogicalOption) ||
      null,
    [logicalThinkingOptions, selectedLogicalOption]
  );

  const handleLogicalOptionSelect = (option) => {
    setSelectedLogicalOption(option.id);
    setSelectedLogicalTopic(option.topics[0] || "");
    setGeneratedQuestions([]);
    setLogicalAnswers({});
    setLogicalResult(null);
  };

  const handleGenerateLogicalQuestions = async () => {
    if (!selectedLogicalTopic.trim()) return;

    setLoadingQuestions(true);
    try {
      const response = await generateQuiz({
        topic: selectedLogicalTopic,
        classLevel: user?.class_level || 5,
        difficulty: "EASY",
        numQuestions: 5,
      });

      const nextQuestions = response?.data?.questions || [];
      setGeneratedQuestions(Array.isArray(nextQuestions) ? nextQuestions : []);
      setLogicalAnswers({});
      setLogicalResult(null);
    } catch (error) {
      console.error(error);
      setGeneratedQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const activeScienceOption = useMemo(
    () => scienceOptions.find((option) => option.id === selectedScienceOption) || null,
    [scienceOptions, selectedScienceOption]
  );

  const handleScienceOptionSelect = (option) => {
    setSelectedScienceOption(option.id);
    setSelectedScienceTopic(option.topics[0] || "");
    setScienceQuestions([]);
    setScienceAnswers({});
    setScienceResult(null);
  };

  const handleGenerateScienceQuestions = async () => {
    if (!selectedScienceTopic.trim()) return;

    setLoadingScienceQuestions(true);
    try {
      const response = await generateQuiz({
        topic: selectedScienceTopic,
        classLevel: user?.class_level || 5,
        difficulty: "EASY",
        numQuestions: 5,
      });

      const nextQuestions = response?.data?.questions || [];
      setScienceQuestions(Array.isArray(nextQuestions) ? nextQuestions : []);
      setScienceAnswers({});
      setScienceResult(null);
    } catch (error) {
      console.error(error);
      setScienceQuestions([]);
    } finally {
      setLoadingScienceQuestions(false);
    }
  };

  const handleScienceAnswerChange = (questionIndex, selectedIndex) => {
    setScienceAnswers((current) => ({
      ...current,
      [questionIndex]: selectedIndex,
    }));
  };

  const handleScienceSubmit = () => {
    const totalQuestions = scienceQuestions.length;
    const answeredCount = Object.keys(scienceAnswers).length;

    if (!totalQuestions || answeredCount !== totalQuestions) {
      return;
    }

    const score = scienceQuestions.reduce((total, question, index) => {
      return total + (scienceAnswers[index] === getCorrectOptionIndex(question) ? 1 : 0);
    }, 0);

    const points = score * 10;
    const xp = score * 20;
    const badge =
      score === totalQuestions
        ? "Science Star"
        : score >= Math.ceil(totalQuestions * 0.7)
          ? "Young Explorer"
          : "Nature Learner";

    setScienceResult({
      score,
      totalQuestions,
      points,
      xp,
      badge,
      percentage: Math.round((score / totalQuestions) * 100),
    });
    setScienceResultOpen(true);
  };

  const scienceLeaderboard = useMemo(() => {
    if (!scienceResult) return [];

    return [
      {
        rank: 1,
        name: user?.name || "You",
        points: scienceResult.points,
        xp: scienceResult.xp,
        badge: scienceResult.badge,
        highlight: true,
      },
      {
        rank: 2,
        name: "Aarav",
        points: Math.max(scienceResult.points - 10, 20),
        xp: Math.max(scienceResult.xp - 15, 35),
        badge: "Experiment Pro",
      },
      {
        rank: 3,
        name: "Diya",
        points: Math.max(scienceResult.points - 20, 10),
        xp: Math.max(scienceResult.xp - 25, 20),
        badge: "Quiz Explorer",
      },
      {
        rank: 4,
        name: "Vihaan",
        points: Math.max(scienceResult.points - 30, 5),
        xp: Math.max(scienceResult.xp - 35, 10),
        badge: "Observation Builder",
      },
    ].sort((a, b) => b.points - a.points).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [scienceResult, user?.name]);

  const activeGeneralOption = useMemo(
    () => generalKnowledgeOptions.find((option) => option.id === selectedGeneralOption) || null,
    [generalKnowledgeOptions, selectedGeneralOption]
  );

  const handleGeneralOptionSelect = (option) => {
    setSelectedGeneralOption(option.id);
    setSelectedGeneralTopic(option.topics[0] || "");
    setGeneralQuestions([]);
    setGeneralAnswers({});
    setGeneralResult(null);
  };

  const handleGenerateGeneralQuestions = async () => {
    if (!selectedGeneralTopic.trim()) return;

    setLoadingGeneralQuestions(true);
    try {
      const response = await generateQuiz({
        topic: selectedGeneralTopic,
        classLevel: user?.class_level || 5,
        difficulty: "EASY",
        numQuestions: 5,
      });

      const nextQuestions = response?.data?.questions || [];
      setGeneralQuestions(Array.isArray(nextQuestions) ? nextQuestions : []);
      setGeneralAnswers({});
      setGeneralResult(null);
    } catch (error) {
      console.error(error);
      setGeneralQuestions([]);
    } finally {
      setLoadingGeneralQuestions(false);
    }
  };

  const handleGeneralAnswerChange = (questionIndex, selectedIndex) => {
    setGeneralAnswers((current) => ({
      ...current,
      [questionIndex]: selectedIndex,
    }));
  };

  const handleGeneralSubmit = () => {
    const totalQuestions = generalQuestions.length;
    const answeredCount = Object.keys(generalAnswers).length;

    if (!totalQuestions || answeredCount !== totalQuestions) {
      return;
    }

    const score = generalQuestions.reduce((total, question, index) => {
      return total + (generalAnswers[index] === getCorrectOptionIndex(question) ? 1 : 0);
    }, 0);

    const points = score * 10;
    const xp = score * 20;
    const badge =
      score === totalQuestions
        ? "GK Champion"
        : score >= Math.ceil(totalQuestions * 0.7)
          ? "Awareness Builder"
          : "Fact Learner";
    const result = {
      score,
      totalQuestions,
      points,
      xp,
      badge,
      percentage: Math.round((score / totalQuestions) * 100),
    };

    setGeneralResult(result);
    setGeneralResultOpen(true);
  };

  const generalLeaderboard = useMemo(() => {
    if (!generalResult) return [];

    return [
      {
        rank: 1,
        name: user?.name || "You",
        points: generalResult.points,
        xp: generalResult.xp,
        badge: generalResult.badge,
        highlight: true,
      },
      {
        rank: 2,
        name: "Aarav",
        points: Math.max(generalResult.points - 10, 20),
        xp: Math.max(generalResult.xp - 15, 35),
        badge: "Fact Finder",
      },
      {
        rank: 3,
        name: "Diya",
        points: Math.max(generalResult.points - 20, 10),
        xp: Math.max(generalResult.xp - 25, 20),
        badge: "World Learner",
      },
      {
        rank: 4,
        name: "Vihaan",
        points: Math.max(generalResult.points - 30, 5),
        xp: Math.max(generalResult.xp - 35, 10),
        badge: "India Explorer",
      },
    ].sort((a, b) => b.points - a.points).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [generalResult, user?.name]);

  const handleOpenCodingTopic = async () => {
    const topic = selectedCodingTopic.trim();
    if (!topic) return;

    setLoadingCodingQuestions(true);
    try {
      const prompt = `
Create 2 very basic beginner programming questions for the topic "${topic}" for class level ${user?.class_level || 5}.
These must be real coding practice tasks, not placeholder text.
Use topics like string, computer science, coding, loops, variables, or debugging correctly.
Make each one short, simple, and suitable for intro coding students.
Do not return values like "string" or "placeholder" as the actual prompt text.
Respond ONLY as JSON in this format:
{
  "programs": [
    {
      "title": "Program 1",
      "prompt": "Write a simple program to ...",
      "placeholder": "Example: ..."
    },
    {
      "title": "Program 2",
      "prompt": "Write a simple program to ...",
      "placeholder": "Example: ..."
    }
  ]
}
      `.trim();

      const res = await askAiQuestion({
        question: prompt,
        classLevel: user?.class_level || 5,
      });

      const answerText =
        res?.data?.answer ??
        res?.answer ??
        res?.data?.message ??
        "";

      const parsed = extractJsonObject(answerText);
      const nextPrograms = Array.isArray(parsed?.programs)
        ? parsed.programs
            .slice(0, 2)
            .map((program, index) => sanitizeCodingProgram(topic, program, index))
        : buildCodingPrograms(topic);

      setCodingPrograms(nextPrograms);
      setCodingAnswers({});
      setCodingResult(null);
    } catch (error) {
      console.error(error);
      setCodingPrograms(buildCodingPrograms(topic));
      setCodingAnswers({});
      setCodingResult(null);
    } finally {
      setLoadingCodingQuestions(false);
    }
  };

  const handleCodingAnswerChange = (questionIndex, value) => {
    setCodingAnswers((current) => ({
      ...current,
      [questionIndex]: value,
    }));
  };

  const extractJsonObject = (text) => {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  };

  const sanitizeCodingProgram = (topic, program, index) => {
    const fallbackProgram = buildCodingPrograms(topic)[index] || {
      title: `Program ${index + 1}`,
      prompt: `Write a simple beginner program related to ${topic}.`,
      placeholder: "Type your program answer here...",
    };

    const normalizedPrompt = String(program?.prompt || "").trim();
    const normalizedPlaceholder = String(program?.placeholder || "").trim();
    const invalidValues = ["string", "prompt", "placeholder", "question", "program"];

    const isWeakPrompt =
      !normalizedPrompt ||
      invalidValues.includes(normalizedPrompt.toLowerCase()) ||
      normalizedPrompt.length < 12;

    const isWeakPlaceholder =
      !normalizedPlaceholder ||
      invalidValues.includes(normalizedPlaceholder.toLowerCase()) ||
      normalizedPlaceholder.length < 12;

    return {
      id: `${String(topic || "coding").trim().toLowerCase() || "coding"}-program-${index + 1}`,
      title: String(program?.title || "").trim() || fallbackProgram.title,
      prompt: isWeakPrompt ? fallbackProgram.prompt : normalizedPrompt,
      placeholder: isWeakPlaceholder
        ? fallbackProgram.placeholder
        : normalizedPlaceholder,
    };
  };

  const handleCodingSubmit = async () => {
    const totalQuestions = codingPrograms.length;
    const answeredCount = codingPrograms.filter((_, index) =>
      String(codingAnswers[index] || "").trim()
    ).length;

    if (!totalQuestions || answeredCount !== totalQuestions) {
      return;
    }

    setLoadingCodingQuestions(true);
    try {
      const evaluationPrompt = `
Evaluate these 2 beginner intro coding answers for class level ${user?.class_level || 5}.
These are simple typed program answers, not MCQ.
Respond ONLY as JSON:
{
  "score": number,
  "totalQuestions": 2,
  "percentage": number,
  "points": number,
  "xp": number,
  "badge": "string",
  "feedback": "short feedback"
}

Topic: ${selectedCodingTopic}

Program 1 task: ${codingPrograms[0]?.prompt || ""}
Program 1 answer: ${codingAnswers[0] || ""}

Program 2 task: ${codingPrograms[1]?.prompt || ""}
Program 2 answer: ${codingAnswers[1] || ""}
      `.trim();

      const res = await askAiQuestion({
        question: evaluationPrompt,
        classLevel: user?.class_level || 5,
      });

      const answerText =
        res?.data?.answer ??
        res?.answer ??
        res?.data?.message ??
        "";

      const parsed = extractJsonObject(answerText);
      const score = Number(parsed?.score ?? 0);
      const total = Number(parsed?.totalQuestions ?? 2) || 2;
      const percentage =
        Number(parsed?.percentage ?? Math.round((score / total) * 100));
      const points = Number(parsed?.points ?? score * 20);
      const xp = Number(parsed?.xp ?? score * 40);
      const badge =
        parsed?.badge || (score === total ? "Coding Champion" : "Code Starter");
      const feedback =
        parsed?.feedback || "Gemini reviewed your intro coding answers.";

      setCodingResult({
        score,
        totalQuestions: total,
        points,
        xp,
        badge,
        percentage,
        feedback,
      });
      setCodingResultOpen(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCodingQuestions(false);
    }
  };

  const codingLeaderboard = useMemo(() => {
    if (!codingResult) return [];

    return [
      {
        rank: 1,
        name: user?.name || "You",
        points: codingResult.points,
        xp: codingResult.xp,
        badge: codingResult.badge,
        highlight: true,
      },
      {
        rank: 2,
        name: "Aarav",
        points: Math.max(codingResult.points - 10, 20),
        xp: Math.max(codingResult.xp - 15, 35),
        badge: "Program Pro",
      },
      {
        rank: 3,
        name: "Diya",
        points: Math.max(codingResult.points - 20, 10),
        xp: Math.max(codingResult.xp - 25, 20),
        badge: "Debug Master",
      },
      {
        rank: 4,
        name: "Vihaan",
        points: Math.max(codingResult.points - 30, 5),
        xp: Math.max(codingResult.xp - 35, 10),
        badge: "Sequence Learner",
      },
    ].sort((a, b) => b.points - a.points).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [codingResult, user?.name]);

  const handleLogicalAnswerChange = (questionIndex, selectedIndex) => {
    setLogicalAnswers((current) => ({
      ...current,
      [questionIndex]: selectedIndex,
    }));
  };

  const handleLogicalSubmit = () => {
    const totalQuestions = generatedQuestions.length;
    const answeredCount = Object.keys(logicalAnswers).length;

    if (!totalQuestions || answeredCount !== totalQuestions) {
      return;
    }

    const score = generatedQuestions.reduce((total, question, index) => {
      return total + (logicalAnswers[index] === getCorrectOptionIndex(question) ? 1 : 0);
    }, 0);

    const points = score * 10;
    const xp = score * 20;
    const badge =
      score === totalQuestions
        ? "Aptitude Star"
        : score >= Math.ceil(totalQuestions * 0.7)
          ? "Quick Thinker"
          : "Rising Solver";

    setLogicalResult({
      score,
      totalQuestions,
      points,
      xp,
      badge,
      percentage: Math.round((score / totalQuestions) * 100),
    });
    setLogicalResultOpen(true);
  };

  const logicalLeaderboard = useMemo(() => {
    if (!logicalResult) return [];

    return [
      {
        rank: 1,
        name: user?.name || "You",
        points: logicalResult.points,
        xp: logicalResult.xp,
        badge: logicalResult.badge,
        highlight: true,
      },
      {
        rank: 2,
        name: "Aarav",
        points: Math.max(logicalResult.points - 10, 20),
        xp: Math.max(logicalResult.xp - 15, 35),
        badge: "Pattern Pro",
      },
      {
        rank: 3,
        name: "Diya",
        points: Math.max(logicalResult.points - 20, 10),
        xp: Math.max(logicalResult.xp - 25, 20),
        badge: "Logic Learner",
      },
      {
        rank: 4,
        name: "Vihaan",
        points: Math.max(logicalResult.points - 30, 5),
        xp: Math.max(logicalResult.xp - 35, 10),
        badge: "Focus Builder",
      },
    ].sort((a, b) => b.points - a.points).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [logicalResult, user?.name]);

  useEffect(() => {
    if (!logicalResultOpen || !logicalResult || !shouldShowLogicalThinkingFlow) {
      return undefined;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        HOBBY_LEADERBOARD_STORAGE_KEY,
        JSON.stringify({
          topic: selectedLogicalTopic,
          percentage: logicalResult.percentage,
          entries: logicalLeaderboard,
        })
      );
    }
  }, [
    logicalLeaderboard,
    logicalResult,
    logicalResultOpen,
    selectedLogicalTopic,
    shouldShowLogicalThinkingFlow,
  ]);

  useEffect(() => {
    if (!generalResultOpen || !generalResult || !shouldShowGeneralKnowledgeFlow) {
      return undefined;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        HOBBY_LEADERBOARD_STORAGE_KEY,
        JSON.stringify({
          topic: selectedGeneralTopic,
          percentage: generalResult.percentage,
          entries: generalLeaderboard,
        })
      );
    }
  }, [
    generalLeaderboard,
    generalResult,
    generalResultOpen,
    selectedGeneralTopic,
    shouldShowGeneralKnowledgeFlow,
  ]);

  const gamifiedCards = useMemo(() => {
    if (moduleId !== "gamified-learning" || !gamifiedProfile?.profile) {
      return null;
    }

    return {
      profile: gamifiedProfile.profile,
      student: gamifiedProfile.student,
      badges: gamifiedBadges,
      recentResults: gamifiedProfile.recent_results || [],
      leaderboards: gamifiedLeaderboards,
    };
  }, [gamifiedBadges, gamifiedLeaderboards, gamifiedProfile, moduleId]);

  if (!moduleData) {
    return (
      <Container maxWidth="sm" sx={{ mt: 3, pb: 10 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Module not found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Please choose a module from the sidebar.
            </Typography>
            <Button variant="contained" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 3, pb: 10 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {moduleData.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {moduleData.intro}
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              Activity Choices
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {moduleData.choicesLabel || "Choose any 3-4 activities from this category."}
            </Typography>
            {shouldShowLogicalThinkingFlow ? (
              <Stack spacing={2}>
                <Grid container spacing={1.5}>
                  {logicalThinkingOptions.map((option) => (
                    <Grid item xs={12} sm={4} key={option.id}>
                      <Card
                        variant="outlined"
                        onClick={() => handleLogicalOptionSelect(option)}
                        sx={{
                          cursor: "pointer",
                          height: "100%",
                          borderRadius: 2.5,
                          bgcolor:
                            selectedLogicalOption === option.id
                              ? "rgba(25,118,210,0.08)"
                              : "background.default",
                          borderColor:
                            selectedLogicalOption === option.id
                              ? "primary.main"
                              : "divider",
                        }}
                      >
                        <CardContent sx={{ pb: "16px !important" }}>
                          <Chip
                            size="small"
                            color={
                              selectedLogicalOption === option.id
                                ? "primary"
                                : "default"
                            }
                            label={option.title}
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            {option.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {activeLogicalOption ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Selected: {activeLogicalOption.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Choose a topic placeholder, then generate questions with Gemini.
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                        {activeLogicalOption.topics.map((topic) => (
                          <Chip
                            key={topic}
                            clickable
                            color={selectedLogicalTopic === topic ? "primary" : "default"}
                            variant={selectedLogicalTopic === topic ? "filled" : "outlined"}
                            label={topic}
                            onClick={() => {
                              setSelectedLogicalTopic(topic);
                              setGeneratedQuestions([]);
                            }}
                          />
                        ))}
                      </Stack>
                      <Button
                        variant="contained"
                        onClick={handleGenerateLogicalQuestions}
                        disabled={!selectedLogicalTopic || loadingQuestions}
                      >
                        {loadingQuestions ? "Generating..." : "Generate Questions"}
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}

                {loadingQuestions ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading Gemini questions...
                    </Typography>
                  </Box>
                ) : null}

                {activeLogicalOption && !loadingQuestions ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Topic Placeholder
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {selectedLogicalTopic || "Select one topic to continue."}
                      </Typography>

                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Questions
                      </Typography>
                      {generatedQuestions.length ? (
                        <Stack spacing={1.25}>
                          {generatedQuestions.map((question, index) => (
                            <Card
                              key={question.id || `${selectedLogicalTopic}-${index}`}
                              variant="outlined"
                              sx={{ borderRadius: 2 }}
                            >
                              <CardContent sx={{ pb: "16px !important" }}>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
                                  Q{index + 1}. {question.question_text || question.question || "Generated question"}
                                </Typography>
                                <RadioGroup
                                  value={logicalAnswers[index] ?? ""}
                                  onChange={(event) =>
                                    handleLogicalAnswerChange(index, Number(event.target.value))
                                  }
                                >
                                  {(question.options || []).map((option, optionIndex) => (
                                    <FormControlLabel
                                      key={`${question.id || index}-${optionIndex}`}
                                      value={optionIndex}
                                      control={<Radio size="small" />}
                                      label={`${String.fromCharCode(65 + optionIndex)}. ${option}`}
                                      sx={getAnswerOptionSx({
                                        question,
                                        optionIndex,
                                        selectedIndex: logicalAnswers[index],
                                        showFeedback: Boolean(logicalResult),
                                      })}
                                    />
                                  ))}
                                </RadioGroup>
                              </CardContent>
                            </Card>
                          ))}
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button
                              variant="contained"
                              onClick={handleLogicalSubmit}
                              disabled={
                                !generatedQuestions.length ||
                                Object.keys(logicalAnswers).length !== generatedQuestions.length
                              }
                            >
                              Submit Answers
                            </Button>
                          </Box>
                        </Stack>
                      ) : (
                        <Box sx={{ mt: 1 }}>
                          <IconButton
                            color="primary"
                            onClick={(event) => setLogicalInfoAnchorEl(event.currentTarget)}
                            aria-label="Show logical thinking help"
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: "background.paper",
                            }}
                          >
                            <InfoOutlined />
                          </IconButton>
                          <Popover
                            open={logicalInfoOpen}
                            anchorEl={logicalInfoAnchorEl}
                            onClose={() => setLogicalInfoAnchorEl(null)}
                            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                            transformOrigin={{ vertical: "top", horizontal: "left" }}
                          >
                            <Box sx={{ maxWidth: 280, p: 2 }}>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                                Questions Help
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                No questions yet. Choose a topic and click Generate Questions.
                              </Typography>
                            </Box>
                          </Popover>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {logicalResult ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                        Overall Class Leaderboard
                      </Typography>
                      <Stack spacing={1.25}>
                        {logicalLeaderboard.map((entry) => (
                          <Card
                            key={`${entry.name}-${entry.rank}`}
                            variant="outlined"
                            sx={{
                              borderRadius: 2,
                              bgcolor: entry.highlight ? "rgba(25,118,210,0.06)" : "background.paper",
                              borderColor: entry.highlight ? "primary.main" : "divider",
                            }}
                          >
                            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                justifyContent="space-between"
                              >
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>
                                    #{entry.rank} {entry.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Badge: {entry.badge}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                  <Chip size="small" label={`${entry.points} Points`} />
                                  <Chip size="small" color="primary" label={`${entry.xp} XP`} />
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}
              </Stack>
            ) : shouldShowScienceFlow ? (
              <Stack spacing={2}>
                <Grid container spacing={1.5}>
                  {scienceOptions.map((option) => (
                    <Grid item xs={12} sm={4} key={option.id}>
                      <Card
                        variant="outlined"
                        onClick={() => handleScienceOptionSelect(option)}
                        sx={{
                          cursor: "pointer",
                          height: "100%",
                          borderRadius: 2.5,
                          bgcolor:
                            selectedScienceOption === option.id
                              ? "rgba(25,118,210,0.08)"
                              : "background.default",
                          borderColor:
                            selectedScienceOption === option.id
                              ? "primary.main"
                              : "divider",
                        }}
                      >
                        <CardContent sx={{ pb: "16px !important" }}>
                          <Chip
                            size="small"
                            color={selectedScienceOption === option.id ? "primary" : "default"}
                            label={option.title}
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            {option.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {activeScienceOption ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Selected: {activeScienceOption.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Choose a topic placeholder, then generate science questions with Gemini.
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                        {activeScienceOption.topics.map((topic) => (
                          <Chip
                            key={topic}
                            clickable
                            color={selectedScienceTopic === topic ? "primary" : "default"}
                            variant={selectedScienceTopic === topic ? "filled" : "outlined"}
                            label={topic}
                            onClick={() => {
                              setSelectedScienceTopic(topic);
                              setScienceQuestions([]);
                            }}
                          />
                        ))}
                      </Stack>
                      <Button
                        variant="contained"
                        onClick={handleGenerateScienceQuestions}
                        disabled={!selectedScienceTopic || loadingScienceQuestions}
                      >
                        {loadingScienceQuestions ? "Generating..." : "Generate Questions"}
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}

                {loadingScienceQuestions ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading Gemini questions...
                    </Typography>
                  </Box>
                ) : null}

                {activeScienceOption && !loadingScienceQuestions ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Topic Placeholder
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {selectedScienceTopic || "Select one topic to continue."}
                      </Typography>

                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Questions
                      </Typography>
                      {scienceQuestions.length ? (
                        <Stack spacing={1.25}>
                          {scienceQuestions.map((question, index) => (
                            <Card
                              key={question.id || `${selectedScienceTopic}-${index}`}
                              variant="outlined"
                              sx={{ borderRadius: 2 }}
                            >
                              <CardContent sx={{ pb: "16px !important" }}>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
                                  Q{index + 1}. {question.question_text || question.question || "Generated question"}
                                </Typography>
                                <RadioGroup
                                  value={scienceAnswers[index] ?? ""}
                                  onChange={(event) =>
                                    handleScienceAnswerChange(index, Number(event.target.value))
                                  }
                                >
                                  {(question.options || []).map((option, optionIndex) => (
                                    <FormControlLabel
                                      key={`${question.id || index}-${optionIndex}`}
                                      value={optionIndex}
                                      control={<Radio size="small" />}
                                      label={`${String.fromCharCode(65 + optionIndex)}. ${option}`}
                                      sx={getAnswerOptionSx({
                                        question,
                                        optionIndex,
                                        selectedIndex: scienceAnswers[index],
                                        showFeedback: Boolean(scienceResult),
                                      })}
                                    />
                                  ))}
                                </RadioGroup>
                              </CardContent>
                            </Card>
                          ))}
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button
                              variant="contained"
                              onClick={handleScienceSubmit}
                              disabled={
                                !scienceQuestions.length ||
                                Object.keys(scienceAnswers).length !== scienceQuestions.length
                              }
                            >
                              Submit Answers
                            </Button>
                          </Box>
                        </Stack>
                      ) : (
                        <Box sx={{ mt: 1 }}>
                          <IconButton
                            color="primary"
                            onClick={(event) => setScienceInfoAnchorEl(event.currentTarget)}
                            aria-label="Show science help"
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: "background.paper",
                            }}
                          >
                            <InfoOutlined />
                          </IconButton>
                          <Popover
                            open={scienceInfoOpen}
                            anchorEl={scienceInfoAnchorEl}
                            onClose={() => setScienceInfoAnchorEl(null)}
                            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                            transformOrigin={{ vertical: "top", horizontal: "left" }}
                          >
                            <Box sx={{ maxWidth: 280, p: 2 }}>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                                Questions Help
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                No questions yet. Choose a topic and click Generate Questions.
                              </Typography>
                            </Box>
                          </Popover>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {scienceResult ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                        Overall Class Leaderboard
                      </Typography>
                      <Stack spacing={1.25}>
                        {scienceLeaderboard.map((entry) => (
                          <Card
                            key={`${entry.name}-${entry.rank}`}
                            variant="outlined"
                            sx={{
                              borderRadius: 2,
                              bgcolor: entry.highlight ? "rgba(25,118,210,0.06)" : "background.paper",
                              borderColor: entry.highlight ? "primary.main" : "divider",
                            }}
                          >
                            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                justifyContent="space-between"
                              >
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>
                                    #{entry.rank} {entry.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Badge: {entry.badge}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                  <Chip size="small" label={`${entry.points} Points`} />
                                  <Chip size="small" color="primary" label={`${entry.xp} XP`} />
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}
              </Stack>
            ) : shouldShowGeneralKnowledgeFlow ? (
              <Stack spacing={2}>
                <Grid container spacing={1.5}>
                  {generalKnowledgeOptions.map((option) => (
                    <Grid item xs={12} sm={6} key={option.id}>
                      <Card
                        variant="outlined"
                        onClick={() => handleGeneralOptionSelect(option)}
                        sx={{
                          cursor: "pointer",
                          height: "100%",
                          borderRadius: 2.5,
                          bgcolor:
                            selectedGeneralOption === option.id
                              ? "rgba(25,118,210,0.08)"
                              : "background.default",
                          borderColor:
                            selectedGeneralOption === option.id
                              ? "primary.main"
                              : "divider",
                        }}
                      >
                        <CardContent sx={{ pb: "16px !important" }}>
                          <Chip
                            size="small"
                            color={selectedGeneralOption === option.id ? "primary" : "default"}
                            label={option.title}
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            {option.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {activeGeneralOption ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Selected: {activeGeneralOption.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Choose a general knowledge topic, then generate questions with Gemini.
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                        {activeGeneralOption.topics.map((topic) => (
                          <Chip
                            key={topic}
                            clickable
                            color={selectedGeneralTopic === topic ? "primary" : "default"}
                            variant={selectedGeneralTopic === topic ? "filled" : "outlined"}
                            label={topic}
                            onClick={() => {
                              setSelectedGeneralTopic(topic);
                              setGeneralQuestions([]);
                              setGeneralAnswers({});
                              setGeneralResult(null);
                            }}
                          />
                        ))}
                      </Stack>
                      <Button
                        variant="contained"
                        onClick={handleGenerateGeneralQuestions}
                        disabled={!selectedGeneralTopic || loadingGeneralQuestions}
                      >
                        {loadingGeneralQuestions ? "Generating..." : "Generate Questions"}
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}

                {loadingGeneralQuestions ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading Gemini questions...
                    </Typography>
                  </Box>
                ) : null}

                {activeGeneralOption && !loadingGeneralQuestions ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Topic Placeholder
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {selectedGeneralTopic || "Select one topic to continue."}
                      </Typography>

                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Questions
                      </Typography>
                      {generalQuestions.length ? (
                        <Stack spacing={1.25}>
                          {generalQuestions.map((question, index) => (
                            <Card
                              key={question.id || `${selectedGeneralTopic}-${index}`}
                              variant="outlined"
                              sx={{ borderRadius: 2 }}
                            >
                              <CardContent sx={{ pb: "16px !important" }}>
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
                                  Q{index + 1}. {question.question_text || question.question || "Generated question"}
                                </Typography>
                                <RadioGroup
                                  value={generalAnswers[index] ?? ""}
                                  onChange={(event) =>
                                    handleGeneralAnswerChange(index, Number(event.target.value))
                                  }
                                >
                                  {(question.options || []).map((option, optionIndex) => (
                                    <FormControlLabel
                                      key={`${question.id || index}-${optionIndex}`}
                                      value={optionIndex}
                                      control={<Radio size="small" />}
                                      label={`${String.fromCharCode(65 + optionIndex)}. ${option}`}
                                      sx={getAnswerOptionSx({
                                        question,
                                        optionIndex,
                                        selectedIndex: generalAnswers[index],
                                        showFeedback: Boolean(generalResult),
                                      })}
                                    />
                                  ))}
                                </RadioGroup>
                              </CardContent>
                            </Card>
                          ))}
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button
                              variant="contained"
                              onClick={handleGeneralSubmit}
                              disabled={
                                !generalQuestions.length ||
                                Object.keys(generalAnswers).length !== generalQuestions.length
                              }
                            >
                              Submit Answers
                            </Button>
                          </Box>
                        </Stack>
                      ) : (
                        <Box sx={{ mt: 1 }}>
                          <IconButton
                            color="primary"
                            onClick={(event) => setGeneralInfoAnchorEl(event.currentTarget)}
                            aria-label="Show general knowledge help"
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: "background.paper",
                            }}
                          >
                            <InfoOutlined />
                          </IconButton>
                          <Popover
                            open={generalInfoOpen}
                            anchorEl={generalInfoAnchorEl}
                            onClose={() => setGeneralInfoAnchorEl(null)}
                            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                            transformOrigin={{ vertical: "top", horizontal: "left" }}
                          >
                            <Box sx={{ maxWidth: 280, p: 2 }}>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                                Questions Help
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                No questions yet. Choose a topic and click Generate Questions.
                              </Typography>
                            </Box>
                          </Popover>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {generalResult ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                        Overall Class Leaderboard
                      </Typography>
                      <Stack spacing={1.25}>
                        {generalLeaderboard.map((entry) => (
                          <Card
                            key={`${entry.name}-${entry.rank}`}
                            variant="outlined"
                            sx={{
                              borderRadius: 2,
                              bgcolor: entry.highlight ? "rgba(25,118,210,0.06)" : "background.paper",
                              borderColor: entry.highlight ? "primary.main" : "divider",
                            }}
                          >
                            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                justifyContent="space-between"
                              >
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>
                                    #{entry.rank} {entry.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Badge: {entry.badge}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                  <Chip size="small" label={`${entry.points} Points`} />
                                  <Chip size="small" color="primary" label={`${entry.xp} XP`} />
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}
              </Stack>
            ) : shouldShowCodingFlow ? (
              <Stack spacing={2}>
                <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                      Topic Box
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      Type one coding topic. After that, 2 basic programs will be shown.
                    </Typography>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      alignItems={{ xs: "stretch", sm: "center" }}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        label="Enter Topic"
                        value={selectedCodingTopic}
                        onChange={(event) => {
                          setSelectedCodingTopic(event.target.value);
                          setCodingPrograms([]);
                          setCodingAnswers({});
                          setCodingResult(null);
                        }}
                        placeholder="Example: string, loops, computer science, coding"
                      />
                      <Button
                        variant="contained"
                        onClick={handleOpenCodingTopic}
                        disabled={!selectedCodingTopic.trim() || loadingCodingQuestions}
                        sx={{ minWidth: 120 }}
                      >
                        {loadingCodingQuestions ? "Loading..." : "Open"}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                {codingPrograms.length ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Selected Topic
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {selectedCodingTopic}
                      </Typography>

                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Basic Programs
                      </Typography>
                      <Stack spacing={1.25}>
                        {codingPrograms.map((program, index) => (
                          <Card
                            key={program.id || `${selectedCodingTopic}-${index}`}
                            variant="outlined"
                            sx={{ borderRadius: 2 }}
                          >
                            <CardContent sx={{ pb: "16px !important" }}>
                              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
                                {program.title}. {program.prompt}
                              </Typography>
                              <TextField
                                multiline
                                minRows={4}
                                fullWidth
                                value={codingAnswers[index] || ""}
                                onChange={(event) =>
                                  handleCodingAnswerChange(index, event.target.value)
                                }
                                placeholder={program.placeholder}
                              />
                            </CardContent>
                          </Card>
                        ))}
                        {loadingCodingQuestions ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <CircularProgress size={20} />
                            <Typography variant="body2" color="text.secondary">
                              Gemini is reviewing your 2 basic programs...
                            </Typography>
                          </Box>
                        ) : null}
                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                          <Button
                            variant="contained"
                            onClick={handleCodingSubmit}
                            disabled={
                              !codingPrograms.length ||
                              codingPrograms.some((_, index) => !String(codingAnswers[index] || "").trim()) ||
                              loadingCodingQuestions
                            }
                          >
                            Submit Answers
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}

                {codingResult ? (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                        Overall Class Leaderboard
                      </Typography>
                      <Stack spacing={1.25}>
                        {codingLeaderboard.map((entry) => (
                          <Card
                            key={`${entry.name}-${entry.rank}`}
                            variant="outlined"
                            sx={{
                              borderRadius: 2,
                              bgcolor: entry.highlight ? "rgba(25,118,210,0.06)" : "background.paper",
                              borderColor: entry.highlight ? "primary.main" : "divider",
                            }}
                          >
                            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                justifyContent="space-between"
                              >
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>
                                    #{entry.rank} {entry.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Badge: {entry.badge}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                  <Chip size="small" label={`${entry.points} Points`} />
                                  <Chip size="small" color="primary" label={`${entry.xp} XP`} />
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ) : null}
              </Stack>
            ) : (
              <Grid container spacing={1.5}>
                {moduleData.activities.map((item, index) => (
                  <Grid item xs={12} sm={6} key={item}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderRadius: 2.5,
                        bgcolor: "background.default",
                      }}
                    >
                      <CardContent sx={{ pb: "16px !important" }}>
                        <Chip
                          size="small"
                          color="primary"
                          label={`Choice ${index + 1}`}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {item}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {analyticsData && !shouldShowLogicalThinkingFlow ? (
          <Stack spacing={2}>
            {analyticsData.topicHighlight ? (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                    Topic Highlight
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {analyticsData.topicHighlight.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {analyticsData.topicHighlight.description}
                  </Typography>
                </CardContent>
              </Card>
            ) : null}

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Games Conducted & Total Points
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Chip
                    label={`Games Conducted: ${analyticsData.gamesConducted}`}
                  />
                  <Chip
                    color="primary"
                    label={`Total Points: ${analyticsData.totalPoints}`}
                  />
                  <Chip
                    variant="outlined"
                    label={`Class Average: ${analyticsData.averagePoints}`}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  XP Progression (Class Average)
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Level {analyticsData.level}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {analyticsData.levelProgress} / {analyticsData.levelStep}{" "}
                      XP
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={analyticsData.progressPercent}
                    sx={{ height: 8, borderRadius: 8 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Next level at {analyticsData.levelStep} XP
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {analyticsData.categories.length ? (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  {analyticsData.categories.map((category, index) => (
                    <Box key={category.id || category.title} sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                        {category.title}
                      </Typography>
                      <List disablePadding>
                        {(category.items || []).map((game) => (
                          <ListItem key={game.id || game.title} disableGutters>
                            <ListItemText
                              primary={game.title}
                              secondary={game.description}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                            <Chip label={`${game.points} pts`} />
                          </ListItem>
                        ))}
                      </List>
                      {index < analyticsData.categories.length - 1 ? (
                        <Divider sx={{ my: 2 }} />
                      ) : null}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Student Leaderboard
                </Typography>
                <List disablePadding>
                  {analyticsData.leaderboard.map((entry, index) => (
                    <ListItem key={entry.user?.id || index} disableGutters>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              index === 0
                                ? "#FFD700"
                                : index === 1
                                ? "#C0C0C0"
                                : index === 2
                                ? "#CD7F32"
                                : "grey.300",
                          }}
                          src={entry.user?.avatar_url || undefined}
                        >
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={entry.user?.name || "Player"}
                        secondary={`Total Points: ${entry.total_score || 0}`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                      <Chip label={`${entry.total_score || 0} pts`} />
                    </ListItem>
                  ))}
                </List>
                {!analyticsData.leaderboard.length && !loadingOverview ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No leaderboard data yet.
                  </Typography>
                ) : null}
              </CardContent>
            </Card>
          </Stack>
        ) : null}

        {moduleId === "gamified-learning" && overview && !overview.eligible ? (
          <Alert severity="warning">
            {overview?.availability?.reason || "This module is available only for class 6 and 7 students."}
          </Alert>
        ) : null}

        {gamifiedCards ? (
          <Stack spacing={2}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  My Gamified Profile
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
                  <Avatar src={gamifiedCards.profile.avatar_url || undefined}>
                    {gamifiedCards.profile.name?.[0] || "S"}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700}>{gamifiedCards.profile.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{gamifiedCards.profile.username || "student"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Class {gamifiedCards.student?.class_name || "6-7"} • Level {gamifiedCards.profile.level}
                    </Typography>
                  </Box>
                  <Chip color="primary" label={`${gamifiedCards.profile.total_xp || 0} XP`} />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Earned Badges
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {gamifiedCards.badges.length ? (
                    gamifiedCards.badges.map((badge) => (
                      <Chip
                        key={badge.id || badge.key}
                        color="secondary"
                        variant="outlined"
                        label={badge.name}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No badges earned yet.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Weekly and Module Leaderboards
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                      Weekly Top Players
                    </Typography>
                    <List disablePadding dense>
                      {(gamifiedCards.leaderboards?.weekly || []).slice(0, 5).map((entry) => (
                        <ListItem key={`weekly-${entry.user?.id || entry.rank}`} disableGutters>
                          <ListItemText
                            primary={entry.user?.name || "Player"}
                            secondary={`${entry.weekly_xp || 0} weekly XP`}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                          <Chip label={`#${entry.rank}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                      Pattern Recognition Top Players
                    </Typography>
                    <List disablePadding dense>
                      {(gamifiedCards.leaderboards?.patternRecognition || []).slice(0, 3).map((entry) => (
                        <ListItem key={`pattern-${entry.user?.id || entry.rank}`} disableGutters>
                          <ListItemText
                            primary={entry.user?.name || "Player"}
                            secondary={`${entry.total_xp || 0} XP`}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                          <Chip label={`#${entry.rank}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                      Advanced Coding Top Players
                    </Typography>
                    <List disablePadding dense>
                      {(gamifiedCards.leaderboards?.advancedCoding || []).slice(0, 3).map((entry) => (
                        <ListItem key={`coding-${entry.user?.id || entry.rank}`} disableGutters>
                          <ListItemText
                            primary={entry.user?.name || "Player"}
                            secondary={`${entry.total_xp || 0} XP`}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                          <Chip label={`#${entry.rank}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : null}
      </Stack>

      <Dialog
        open={logicalResultOpen}
        onClose={() => setLogicalResultOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Quiz Result</DialogTitle>
        <DialogContent>
          {logicalResult ? (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Typography variant="h5" fontWeight={800}>
                {logicalResult.score} / {logicalResult.totalQuestions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You scored {logicalResult.percentage}% in {selectedLogicalTopic}.
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip color="primary" label={`${logicalResult.points} Points`} />
                <Chip color="success" label={`${logicalResult.xp} XP`} />
                <Chip variant="outlined" label={logicalResult.badge} />
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogicalResultOpen(false)} variant="contained">
            View Marked Answers
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={scienceResultOpen}
        onClose={() => setScienceResultOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Science Result</DialogTitle>
        <DialogContent>
          {scienceResult ? (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Typography variant="h5" fontWeight={800}>
                {scienceResult.score} / {scienceResult.totalQuestions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You scored {scienceResult.percentage}% in {selectedScienceTopic}.
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip color="primary" label={`${scienceResult.points} Points`} />
                <Chip color="success" label={`${scienceResult.xp} XP`} />
                <Chip variant="outlined" label={scienceResult.badge} />
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScienceResultOpen(false)} variant="contained">
            View Leaderboard
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={generalResultOpen}
        onClose={() => setGeneralResultOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>General Knowledge Result</DialogTitle>
        <DialogContent>
          {generalResult ? (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Typography variant="h5" fontWeight={800}>
                {generalResult.score} / {generalResult.totalQuestions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You scored {generalResult.percentage}% in {selectedGeneralTopic}.
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip color="primary" label={`${generalResult.points} Points`} />
                <Chip color="success" label={`${generalResult.xp} XP`} />
                <Chip variant="outlined" label={generalResult.badge} />
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGeneralResultOpen(false)} variant="contained">
            View Marked Answers
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={codingResultOpen}
        onClose={() => setCodingResultOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Coding Result</DialogTitle>
        <DialogContent>
          {codingResult ? (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Typography variant="h5" fontWeight={800}>
                {codingResult.score} / {codingResult.totalQuestions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You scored {codingResult.percentage}% in {selectedCodingTopic}.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {codingResult.feedback}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip color="primary" label={`${codingResult.points} Points`} />
                <Chip color="success" label={`${codingResult.xp} XP`} />
                <Chip variant="outlined" label={codingResult.badge} />
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodingResultOpen(false)} variant="contained">
            View Leaderboard
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
