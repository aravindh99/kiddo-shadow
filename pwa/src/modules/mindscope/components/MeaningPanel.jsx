import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Translate } from "@mui/icons-material";
import { explainWordMeaningWithGemini } from "../api/mindscope.api";

export default function MeaningPanel() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    const cleanWord = word.trim();
    if (!cleanWord) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await explainWordMeaningWithGemini({ word: cleanWord });
      setResult(response?.data || null);
    } catch (error) {
      console.error("MindScope word meaning failed:", error);
      setResult({
        word: cleanWord,
        englishMeaning: "Could not explain this word right now. Please try again.",
        tamilMeaning: "இந்த வார்த்தையை இப்போது விளக்க முடியவில்லை. மீண்டும் முயற்சி செய்யவும்.",
        englishExample: "",
        tamilExample: "",
        relatedWords: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={5}>
        <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Translate color="primary" />
              <Typography variant="h6" fontWeight={800}>
                Word Meaning
              </Typography>
            </Stack>

            <TextField
              value={word}
              onChange={(event) => setWord(event.target.value)}
              fullWidth
              label="Type a word"
              placeholder="Example: curious"
              onKeyDown={(event) => {
                if (event.key === "Enter") handleExplain();
              }}
            />

            <Button
              variant="contained"
              onClick={handleExplain}
              disabled={loading || !word.trim()}
              fullWidth
              sx={{ mt: 2, fontWeight: 800 }}
            >
              {loading ? "Explaining..." : "Explain Meaning"}
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={7}>
        <Card variant="outlined" sx={{ borderRadius: 2, minHeight: 280 }}>
          <CardContent>
            {result ? (
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                  <Chip color="primary" label={result.word || word} />
                  {result.source ? <Chip size="small" label={result.source} variant="outlined" /> : null}
                </Stack>

                <Box>
                  <Typography fontWeight={900} gutterBottom>
                    English
                  </Typography>
                  <Typography color="text.secondary">{result.englishMeaning}</Typography>
                </Box>

                <Box>
                  <Typography fontWeight={900} gutterBottom>
                    தமிழ்
                  </Typography>
                  <Typography color="text.secondary">{result.tamilMeaning}</Typography>
                </Box>

                {result.englishExample || result.tamilExample ? (
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50" }}>
                    {result.englishExample ? (
                      <Typography fontWeight={800}>{result.englishExample}</Typography>
                    ) : null}
                    {result.tamilExample ? (
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {result.tamilExample}
                      </Typography>
                    ) : null}
                  </Box>
                ) : null}

                {result.relatedWords?.length ? (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                    {result.relatedWords.map((item) => (
                      <Chip key={item} label={item} variant="outlined" />
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            ) : (
              <Stack sx={{ minHeight: 230 }} alignItems="center" justifyContent="center" textAlign="center">
                <Typography variant="h6" fontWeight={800}>
                  Type any difficult word.
                </Typography>
                <Typography color="text.secondary">
                  MindScope will explain it in English and Tamil.
                </Typography>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
