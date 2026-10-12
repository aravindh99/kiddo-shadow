import { useEffect, useState } from "react";
import { getQuizQuestions } from "../api/quiz.api";

export function useQuizQuestions(params) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    async function fetchQuestions() {
        try {
            setLoading(true);
            const res = await getQuizQuestions(params);
            setQuestions(res.data);
        } catch {
            setError("Failed to load questions");
        } finally {
            setLoading(false);
        }
    }

    return { questions, loading, error };
}
