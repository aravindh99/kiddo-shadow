const RELATED_QUESTION_STATE_TTL_MS = 15 * 60 * 1000;
const relatedQuestionStateByUser = new Map();

const getRelatedQuestionStateKey = (req) =>
  req.user?.id ? `user:${req.user.id}` : `request:${req.ip || "unknown"}`;

const normalizeRelatedQuestionComparable = (value) =>
  String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

export const getStoredRelatedQuestionState = (req) => {
  const key = getRelatedQuestionStateKey(req);
  const state = relatedQuestionStateByUser.get(key);
  if (!state) return null;

  if (Date.now() - state.createdAt > RELATED_QUESTION_STATE_TTL_MS) {
    relatedQuestionStateByUser.delete(key);
    return null;
  }

  return state;
};

export const storeRelatedQuestionState = (req, { originalQuestion, questions }) => {
  relatedQuestionStateByUser.set(getRelatedQuestionStateKey(req), {
    originalQuestion,
    questions: Array.isArray(questions) ? questions : [],
    createdAt: Date.now(),
  });
};

export const clearRelatedQuestionState = (req) => {
  relatedQuestionStateByUser.delete(getRelatedQuestionStateKey(req));
};

export const findStoredRelatedQuestionSelection = (state, value) => {
  const selected = normalizeRelatedQuestionComparable(value);
  if (!selected || !state?.questions?.length) return null;

  return (
    state.questions.find(
      (question) => normalizeRelatedQuestionComparable(question) === selected
    ) || null
  );
};
