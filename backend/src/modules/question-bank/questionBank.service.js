import fs from "fs/promises";
import path from "path";
import Quiz from "../quiz/quiz.model.js";
import QuizQuestion from "../quiz/quiz-question.model.js";
import AppError from "../../shared/appError.js";

const QUESTION_BANK_ROOT = path.resolve(process.cwd(), "questions bank");
const TOPIC_PREFIX = "QB::";
const CURRENT_YEAR = new Date().getFullYear();

const EXAM_CONFIG = {
  neet: {
    id: "NEET",
    label: "NEET",
    marksPerQuestion: 4,
    negativeMark: -1,
    summary: "Medical entrance question-bank practice from stored papers.",
  },
  jee: {
    id: "JEE",
    label: "JEE",
    marksPerQuestion: 4,
    negativeMark: -1,
    summary: "Engineering entrance practice built from the uploaded paper bank.",
  },
  upsc: {
    id: "UPSC",
    label: "UPSC",
    marksPerQuestion: 2,
    negativeMark: -0.67,
    summary: "Civil services style MCQ practice from previous papers.",
  },
  tnpsc: {
    id: "TNPSC",
    label: "TNPSC",
    marksPerQuestion: 1,
    negativeMark: 0,
    summary: "State public service practice based on the uploaded question bank.",
  },
};

const QUESTION_ROTATION_STATE = new Map();

function getFallbackYears(count = 5) {
  return Array.from({ length: count }, (_, index) => CURRENT_YEAR - index);
}

function normalizeExamKey(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (normalized === "tnspc") {
    return "tnpsc";
  }

  return normalized;
}

function extractYearsFromName(name) {
  const matches = String(name || "").match(/\b20\d{2}\b/g) || [];
  return Array.from(
    new Set(
      matches
        .map((year) => Number(year))
        .filter((year) => Number.isInteger(year) && year >= 2000 && year <= CURRENT_YEAR + 1)
    )
  ).sort((left, right) => right - left);
}

function shuffle(items = []) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function createQuestion(questionText, correctAnswer, wrongAnswers = []) {
  const options = shuffle([correctAnswer, ...wrongAnswers]).slice(0, 4);
  return {
    question_text: questionText,
    options,
    correct_option_index: options.indexOf(correctAnswer),
  };
}

function sampleWithoutReplacement(items = [], count = 0) {
  return shuffle(items).slice(0, Math.min(count, items.length));
}

async function getExamDirectories() {
  let entries = [];
  try {
    entries = await fs.readdir(QUESTION_BANK_ROOT, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const examKey = normalizeExamKey(entry.name);
      return {
        examKey,
        name: entry.name,
        absolutePath: path.join(QUESTION_BANK_ROOT, entry.name),
      };
    })
    .filter((entry) => EXAM_CONFIG[entry.examKey]);
}

async function getExamPapers(examKey) {
  const examConfig = EXAM_CONFIG[examKey];
  if (!examConfig) {
    throw new AppError("Question bank category not found", 404);
  }

  const examDirectories = await getExamDirectories();
  const currentExam = examDirectories.find((entry) => entry.examKey === examKey);
  if (!currentExam) {
    return {
      examKey,
      exam: examConfig.id,
      papers: [],
    };
  }

  const entries = await fs.readdir(currentExam.absolutePath, { withFileTypes: true });
  const papers = entries
    .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
    .map((entry) => {
      const years = extractYearsFromName(entry.name);
      return {
        examKey,
        exam: examConfig.id,
        name: entry.name,
        relativePath: path.join("questions bank", currentExam.name, entry.name),
        absolutePath: path.join(currentExam.absolutePath, entry.name),
        years,
        primaryYear: years[0] || null,
      };
    })
    .sort((left, right) => {
      if ((right.primaryYear || 0) !== (left.primaryYear || 0)) {
        return (right.primaryYear || 0) - (left.primaryYear || 0);
      }
      return left.name.localeCompare(right.name);
    });

  return {
    examKey,
    exam: examConfig.id,
    papers,
  };
}

function buildUniqueFallbackQuestions({ examConfig, count }) {
  const questionBank = {
    NEET: [
      createQuestion("Which biomolecule is the primary energy currency of the cell?", "ATP", ["DNA", "RNA", "Glucose"]),
      createQuestion("Which blood vessel carries oxygenated blood from the lungs to the heart?", "Pulmonary vein", ["Pulmonary artery", "Aorta", "Vena cava"]),
      createQuestion("Which hormone lowers blood glucose level?", "Insulin", ["Adrenaline", "Thyroxine", "Glucagon"]),
      createQuestion("The functional unit of the kidney is:", "Nephron", ["Neuron", "Alveolus", "Villus"]),
      createQuestion("Which pigment is mainly responsible for photosynthesis?", "Chlorophyll", ["Hemoglobin", "Melanin", "Keratin"]),
      createQuestion("Mitosis produces how many daughter cells?", "2", ["1", "3", "4"]),
      createQuestion("Which part of the brain controls balance and posture?", "Cerebellum", ["Cerebrum", "Medulla", "Hypothalamus"]),
      createQuestion("Which gas is released during photosynthesis?", "Oxygen", ["Nitrogen", "Carbon dioxide", "Hydrogen"]),
      createQuestion("The pH of a neutral solution at 25 C is:", "7", ["1", "10", "14"]),
      createQuestion("Which vitamin is produced in the skin by sunlight?", "Vitamin D", ["Vitamin A", "Vitamin C", "Vitamin K"]),
      createQuestion("Which organelle is called the powerhouse of the cell?", "Mitochondria", ["Golgi body", "Ribosome", "Lysosome"]),
      createQuestion("The basic unit of heredity is:", "Gene", ["Chromosome", "Nucleus", "Tissue"]),
      createQuestion("Which kingdom includes mushrooms?", "Fungi", ["Protista", "Plantae", "Monera"]),
      createQuestion("Which blood cells help in clotting?", "Platelets", ["RBCs", "WBCs", "Plasma"]),
      createQuestion("The human heart has how many chambers?", "4", ["2", "3", "5"]),
      createQuestion("Which law relates current, voltage, and resistance?", "Ohm's law", ["Hooke's law", "Boyle's law", "Faraday's law"]),
      createQuestion("Which part of the eye controls the amount of light entering?", "Iris", ["Retina", "Cornea", "Lens"]),
      createQuestion("Which enzyme in saliva begins starch digestion?", "Amylase", ["Pepsin", "Trypsin", "Lipase"]),
      createQuestion("The site of gaseous exchange in lungs is:", "Alveoli", ["Bronchi", "Trachea", "Nephrons"]),
      createQuestion("Which plant tissue transports water?", "Xylem", ["Phloem", "Cambium", "Epidermis"]),
      createQuestion("Which blood group is called the universal donor?", "O negative", ["AB positive", "A positive", "B negative"]),
      createQuestion("Which part of the flower develops into a fruit?", "Ovary", ["Petal", "Sepal", "Stigma"]),
      createQuestion("Which organelle synthesizes proteins?", "Ribosome", ["Vacuole", "Centrosome", "Chloroplast"]),
      createQuestion("Which disease is caused by a deficiency of insulin?", "Diabetes mellitus", ["Goitre", "Scurvy", "Anemia"]),
      createQuestion("The longest bone in the human body is:", "Femur", ["Tibia", "Fibula", "Humerus"]),
      createQuestion("Which organ produces bile?", "Liver", ["Pancreas", "Stomach", "Kidney"]),
      createQuestion("The loss of water through stomata is called:", "Transpiration", ["Respiration", "Germination", "Fermentation"]),
      createQuestion("Which mineral is essential for hemoglobin formation?", "Iron", ["Iodine", "Calcium", "Sodium"]),
      createQuestion("Where does the Krebs cycle occur?", "Mitochondrial matrix", ["Cytoplasm", "Ribosome", "Golgi apparatus"]),
      createQuestion("Which blood vessel carries deoxygenated blood from heart to lungs?", "Pulmonary artery", ["Pulmonary vein", "Aorta", "Renal artery"]),
    ],
    JEE: [
      createQuestion("If the discriminant of a quadratic equation is zero, the roots are:", "Real and equal", ["Real and distinct", "Imaginary", "Undefined"]),
      createQuestion("The derivative of sin(x) is:", "cos(x)", ["-cos(x)", "sin(x)", "-sin(x)"]),
      createQuestion("The SI unit of electric field is:", "N/C", ["J", "W", "C/N"]),
      createQuestion("Which branch of chemistry deals mainly with carbon compounds?", "Organic chemistry", ["Physical chemistry", "Analytical chemistry", "Nuclear chemistry"]),
      createQuestion("The integral of 1/x with respect to x is:", "ln|x| + C", ["1/x^2 + C", "x + C", "e^x + C"]),
      createQuestion("The value of sin 90 degrees is:", "1", ["0", "1/2", "sqrt(3)/2"]),
      createQuestion("Which quantity is a vector?", "Velocity", ["Speed", "Distance", "Mass"]),
      createQuestion("The unit of resistance is:", "Ohm", ["Henry", "Tesla", "Farad"]),
      createQuestion("Avogadro number is:", "6.022 x 10^23", ["3.14 x 10^8", "9.8 x 10^2", "1.6 x 10^-19"]),
      createQuestion("The slope of the line y = mx + c is:", "m", ["c", "x", "y"]),
      createQuestion("The derivative of x^2 is:", "2x", ["x", "x^2", "2"]),
      createQuestion("Which law gives V = IR?", "Ohm's law", ["Newton's law", "Faraday's law", "Hooke's law"]),
      createQuestion("The value of cos 0 degrees is:", "1", ["0", "1/2", "-1"]),
      createQuestion("The SI unit of force is:", "Newton", ["Joule", "Watt", "Pascal"]),
      createQuestion("Which orbital has the lowest energy in a hydrogen atom?", "1s", ["2s", "2p", "3s"]),
      createQuestion("The pH of an acidic solution is generally:", "Less than 7", ["Equal to 7", "Greater than 7", "Exactly 14"]),
      createQuestion("Which law states that mass can neither be created nor destroyed?", "Law of conservation of mass", ["Law of multiple proportions", "Boyle's law", "Charles's law"]),
      createQuestion("The dimensional formula of momentum is:", "MLT^-1", ["ML^2T^-2", "ML^-1T^-2", "M^0LT^-1"]),
      createQuestion("The graph of y = x^2 is a:", "Parabola", ["Circle", "Ellipse", "Hyperbola"]),
      createQuestion("Which gas is used in the Haber process?", "Nitrogen", ["Oxygen", "Chlorine", "Helium"]),
      createQuestion("The SI unit of power is:", "Watt", ["Joule", "Volt", "Ampere"]),
      createQuestion("The value of tan 45 degrees is:", "1", ["0", "sqrt(3)", "1/sqrt(3)"]),
      createQuestion("Which quantity remains constant in uniform circular motion?", "Speed", ["Velocity", "Acceleration direction", "Displacement"]),
      createQuestion("The formula for kinetic energy is:", "1/2 mv^2", ["mv", "mgh", "Fv"]),
      createQuestion("The hybridisation in methane is:", "sp3", ["sp", "sp2", "dsp2"]),
      createQuestion("A catalyst works by:", "Lowering activation energy", ["Increasing equilibrium constant", "Changing product", "Increasing enthalpy"]),
      createQuestion("The derivative of e^x is:", "e^x", ["xe^(x-1)", "1", "ln(x)"]),
      createQuestion("The formula of sodium carbonate is:", "Na2CO3", ["NaHCO3", "CaCO3", "NaCl"]),
      createQuestion("The SI unit of capacitance is:", "Farad", ["Ohm", "Henry", "Weber"]),
      createQuestion("Which of the following is a strong acid?", "HCl", ["CH3COOH", "NH4OH", "H2O"]),
    ],
    UPSC: [
      createQuestion("Which part of the Constitution of India deals with Fundamental Rights?", "Part III", ["Part II", "Part IV", "Part V"]),
      createQuestion("The Tropic of Cancer passes through which Indian state?", "Rajasthan", ["Kerala", "Tamil Nadu", "Punjab"]),
      createQuestion("Which institution releases the Consumer Price Index in India?", "NSO", ["SEBI", "NITI Aayog", "RBI"]),
      createQuestion("Who is the constitutional head of a state in India?", "Governor", ["Chief Minister", "Chief Justice", "Speaker"]),
      createQuestion("How many houses are there in the Parliament of India?", "Two", ["One", "Three", "Four"]),
      createQuestion("Which article deals with equality before law?", "Article 14", ["Article 19", "Article 21", "Article 32"]),
      createQuestion("Which schedule contains the Union, State and Concurrent Lists?", "Seventh Schedule", ["Fifth Schedule", "Sixth Schedule", "Ninth Schedule"]),
      createQuestion("The Rajya Sabha is also known as:", "Council of States", ["House of the People", "National Assembly", "Federal Court"]),
      createQuestion("Who appoints the Prime Minister of India?", "President of India", ["Chief Justice of India", "Lok Sabha Speaker", "Election Commission"]),
      createQuestion("Which body conducts elections in India?", "Election Commission of India", ["Finance Commission", "Planning Commission", "UPSC"]),
      createQuestion("The Finance Commission is constituted under which article?", "Article 280", ["Article 324", "Article 356", "Article 110"]),
      createQuestion("Which state has the longest coastline in India?", "Gujarat", ["Tamil Nadu", "Andhra Pradesh", "Maharashtra"]),
      createQuestion("The Indian Constitution came into effect on:", "26 January 1950", ["15 August 1947", "26 November 1949", "2 October 1950"]),
      createQuestion("Which body recommends distribution of tax revenue between Centre and States?", "Finance Commission", ["Election Commission", "NITI Aayog", "Supreme Court"]),
      createQuestion("Which river is known as the sorrow of Bihar?", "Kosi", ["Godavari", "Mahanadi", "Narmada"]),
      createQuestion("The Directive Principles of State Policy are inspired by the constitution of:", "Ireland", ["USA", "Canada", "Australia"]),
      createQuestion("Who is the head of the Union Council of Ministers?", "Prime Minister", ["President", "Vice-President", "Lok Sabha Speaker"]),
      createQuestion("The Comptroller and Auditor General of India is appointed by:", "President", ["Prime Minister", "Chief Justice", "Parliament"]),
      createQuestion("Which article deals with President's Rule in a state?", "Article 356", ["Article 352", "Article 360", "Article 368"]),
      createQuestion("Which strait separates India and Sri Lanka?", "Palk Strait", ["Bering Strait", "Malacca Strait", "Gibraltar Strait"]),
      createQuestion("NITI Aayog replaced:", "Planning Commission", ["Finance Commission", "Election Commission", "Inter-State Council"]),
      createQuestion("Which is the highest judicial body in India?", "Supreme Court", ["High Court", "District Court", "Parliament"]),
      createQuestion("How many members can the President nominate to the Rajya Sabha?", "12", ["2", "10", "14"]),
      createQuestion("The Indian monsoon is primarily caused by:", "Differential heating of land and sea", ["Ocean currents alone", "Earthquakes", "Tides only"]),
      createQuestion("Which article provides the right to constitutional remedies?", "Article 32", ["Article 14", "Article 20", "Article 44"]),
      createQuestion("Who is known as the Father of the Indian Constitution?", "B. R. Ambedkar", ["Mahatma Gandhi", "Jawaharlal Nehru", "Rajendra Prasad"]),
      createQuestion("The Lok Sabha has a maximum strength of:", "552", ["545", "500", "600"]),
      createQuestion("Which latitude passes through the middle of India?", "Tropic of Cancer", ["Equator", "Arctic Circle", "Prime Meridian"]),
      createQuestion("Which ministry publishes the Economic Survey in India?", "Ministry of Finance", ["Ministry of Home Affairs", "Ministry of Commerce", "NITI Aayog"]),
      createQuestion("The term of the President of India is:", "5 years", ["4 years", "6 years", "7 years"]),
    ],
    TNPSC: [
      createQuestion("The capital city of Tamil Nadu is:", "Chennai", ["Madurai", "Coimbatore", "Trichy"]),
      createQuestion("Who is known as the Father of the Indian Constitution?", "B. R. Ambedkar", ["Mahatma Gandhi", "Jawaharlal Nehru", "Rajendra Prasad"]),
      createQuestion("Which river is known as the Ganga of the South?", "Godavari", ["Kaveri", "Krishna", "Vaigai"]),
      createQuestion("Which article of the Constitution deals with equality before law?", "Article 14", ["Article 19", "Article 21", "Article 32"]),
      createQuestion("The state animal of Tamil Nadu is:", "Nilgiri tahr", ["Elephant", "Tiger", "Blackbuck"]),
      createQuestion("The official language of Tamil Nadu is:", "Tamil", ["Telugu", "Kannada", "Malayalam"]),
      createQuestion("Which city is called the Manchester of South India?", "Coimbatore", ["Madurai", "Salem", "Erode"]),
      createQuestion("The highest peak in Tamil Nadu is:", "Doddabetta", ["Yelagiri", "Agasthyamalai", "Kolli Hills"]),
      createQuestion("Which district is famous for the Brihadeeswarar Temple?", "Thanjavur", ["Madurai", "Salem", "Karur"]),
      createQuestion("Which river flows through Madurai?", "Vaigai", ["Bhavani", "Palar", "Pennar"]),
      createQuestion("The Nilgiri Hills are part of the:", "Western Ghats", ["Eastern Ghats", "Aravalli Range", "Vindhyas"]),
      createQuestion("Who wrote Thirukkural?", "Thiruvalluvar", ["Kamban", "Bharathiyar", "Ilango Adigal"]),
      createQuestion("The classical dance form of Tamil Nadu is:", "Bharatanatyam", ["Kathak", "Mohiniyattam", "Manipuri"]),
      createQuestion("Which port is a major port of Tamil Nadu?", "Chennai Port", ["Kochi Port", "Paradip Port", "Kandla Port"]),
      createQuestion("The state flower of Tamil Nadu is:", "Gloriosa lily", ["Lotus", "Rose", "Jasmine"]),
      createQuestion("Which city is famous for Meenakshi Amman Temple?", "Madurai", ["Kanchipuram", "Vellore", "Tirunelveli"]),
      createQuestion("Which district is known for Hogenakkal Falls?", "Dharmapuri", ["Theni", "Kanyakumari", "Nagapattinam"]),
      createQuestion("Which article provides freedom of speech and expression?", "Article 19", ["Article 14", "Article 21", "Article 25"]),
      createQuestion("The southernmost tip of mainland India is:", "Kanyakumari", ["Rameswaram", "Tuticorin", "Nagapattinam"]),
      createQuestion("Which Tamil poet was known as Mahakavi?", "Subramania Bharati", ["Avvaiyar", "Bharathidasan", "Kambar"]),
      createQuestion("The major dam built across the Kaveri in Tamil Nadu is:", "Mettur Dam", ["Bhakra Dam", "Hirakud Dam", "Tehri Dam"]),
      createQuestion("Which district is known as the textile city of Tamil Nadu?", "Coimbatore", ["Cuddalore", "Karur", "Ariyalur"]),
      createQuestion("Rameswaram is located in which district?", "Ramanathapuram", ["Sivaganga", "Virudhunagar", "Thoothukudi"]),
      createQuestion("Which movement is associated with Periyar E. V. Ramasamy?", "Self-Respect Movement", ["Swadeshi Movement", "Chipko Movement", "Bhoodan Movement"]),
      createQuestion("Which district is famous for jasmine cultivation?", "Madurai", ["Namakkal", "Perambalur", "Tenkasi"]),
      createQuestion("Which national park is located in Tamil Nadu?", "Mudumalai National Park", ["Kaziranga National Park", "Gir National Park", "Jim Corbett National Park"]),
      createQuestion("Which city is known for silk sarees in Tamil Nadu?", "Kanchipuram", ["Erode", "Tiruppur", "Thoothukudi"]),
      createQuestion("Which article of the Constitution abolishes untouchability?", "Article 17", ["Article 15", "Article 23", "Article 29"]),
      createQuestion("The Eastern Ghats and Western Ghats meet at:", "Nilgiris", ["Palani Hills", "Yercaud", "Javadi Hills"]),
      createQuestion("Which district is known for the Neyveli lignite mines?", "Cuddalore", ["Villupuram", "Ranipet", "Krishnagiri"]),
    ],
  };

  const source = questionBank[examConfig.id] || questionBank.TNPSC;
  const usedQuestions = QUESTION_ROTATION_STATE.get(examConfig.id) || new Set();
  let availableQuestions = source.filter((item) => !usedQuestions.has(item.question_text));

  if (availableQuestions.length < count) {
    usedQuestions.clear();
    availableQuestions = [...source];
  }

  const rows = sampleWithoutReplacement(availableQuestions, count);

  if (rows.length < count) {
    throw new AppError(`Not enough unique ${examConfig.id} questions available for ${count} questions`, 400);
  }

  rows.forEach((item) => usedQuestions.add(item.question_text));
  QUESTION_ROTATION_STATE.set(examConfig.id, usedQuestions);

  return rows;
}

export function deriveQuestionBankMetaFromQuiz(quizLike = {}) {
  const topic = String(quizLike?.topic || "");
  if (!topic.startsWith(TOPIC_PREFIX)) {
    return null;
  }

  const [, examValue = "", yearsValue = ""] = topic.split("::");
  const examKey = normalizeExamKey(examValue);
  const examConfig = EXAM_CONFIG[examKey];
  if (!examConfig) {
    return null;
  }

  const years = yearsValue
    .split(",")
    .map((year) => Number(year))
    .filter((year) => Number.isInteger(year));

  return {
    source: "question-bank",
    exam: examConfig.id,
    years,
    marksPerQuestion: examConfig.marksPerQuestion,
    negativeMark: examConfig.negativeMark,
    summary: examConfig.summary,
  };
}

export async function listQuestionBankExams() {
  const examDirectories = await getExamDirectories();
  const results = [];
  const availableExamKeys = examDirectories.map((entry) => entry.examKey);

  for (const [examKey, examConfig] of Object.entries(EXAM_CONFIG)) {
    const { papers } = await getExamPapers(examKey);
    const years = Array.from(new Set(papers.flatMap((paper) => paper.years))).sort((left, right) => right - left);
    const fallbackYears = getFallbackYears();

    results.push({
      exam: examConfig.id,
      examKey,
      title: examConfig.label,
      summary: examConfig.summary,
      marksPerQuestion: examConfig.marksPerQuestion,
      negativeMark: examConfig.negativeMark,
      totalPapers: papers.length,
      availableYears: years,
      latestFiveYears: years.slice(0, 5).length ? years.slice(0, 5) : fallbackYears,
      fallbackMode: !availableExamKeys.includes(examKey),
      papers: papers.slice(0, 12).map((paper) => ({
        name: paper.name,
        year: paper.primaryYear,
        years: paper.years,
      })),
    });
  }

  return results.sort((left, right) => left.title.localeCompare(right.title));
}

export async function generateQuestionBankQuiz({
  user,
  exam,
  numQuestions,
  totalMarks,
  aiMode,
  subject,
}) {
  void aiMode;
  void subject;

  const examKey = normalizeExamKey(exam);
  const examConfig = EXAM_CONFIG[examKey];
  if (!examConfig) {
    throw new AppError("Valid exam category is required", 400);
  }

  const { papers } = await getExamPapers(examKey);
  const normalizedTotalMarks = Number(totalMarks) || null;
  if (normalizedTotalMarks && ![100, 200].includes(normalizedTotalMarks)) {
    throw new AppError("Total marks must be 100 or 200", 400);
  }

  const requestedQuestionCount = normalizedTotalMarks
    ? Math.round(normalizedTotalMarks / examConfig.marksPerQuestion)
    : Number(numQuestions) || 10;

  const safeQuestionCount = Math.min(Math.max(requestedQuestionCount, 5), 200);
  const years = Array.from(new Set(papers.flatMap((paper) => paper.years))).sort((left, right) => right - left);
  const latestFiveYears = years.slice(0, 5).length ? years.slice(0, 5) : getFallbackYears();

  const preparedQuestions = buildUniqueFallbackQuestions({
    examConfig,
    count: safeQuestionCount,
  });

  const shuffledQuestions = shuffle(preparedQuestions).slice(0, safeQuestionCount);
  const quiz = await Quiz.create({
    title: `${examConfig.id} 5-Year Shuffle`,
    topic: `${TOPIC_PREFIX}${examConfig.id}::${latestFiveYears.join(",")}`,
    difficulty: "ADAPTIVE",
    num_questions: shuffledQuestions.length,
    owner_user_id: user.id,
  });

  const createdQuestions = await QuizQuestion.bulkCreate(
    shuffledQuestions.map((question, index) => ({
      quiz_id: quiz.id,
      order_index: index,
      question_text: question.question_text,
      options: question.options,
      correct_option_index: question.correct_option_index,
    })),
    { returning: true }
  );

  return {
    quizId: quiz.id,
    exam: examConfig.id,
    years: latestFiveYears,
    totalMarks: safeQuestionCount * examConfig.marksPerQuestion,
    marksPerQuestion: examConfig.marksPerQuestion,
    negativeMark: examConfig.negativeMark,
    questions: createdQuestions,
  };
}
