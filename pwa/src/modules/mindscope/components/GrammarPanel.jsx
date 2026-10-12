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
import { Spellcheck } from "@mui/icons-material";
import { checkGrammarWithGemini } from "../api/mindscope.api";
import { checkGrammar } from "../services/mindscope.service";

const emptyResult = {
  correctedText: "",
  explanation: "Write a sentence and click Check Grammar.",
  issues: [],
  mode: "all",
  tenseName: "",
  structure: [],
};

function isGenericStructure(structure = []) {
  return (
    !Array.isArray(structure) ||
    !structure.length ||
    structure.some((item) => /sentence part|sentence starter/i.test(item?.role || ""))
  );
}

export default function GrammarPanel() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(emptyResult);
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    if (!text.trim()) {
      setResult(emptyResult);
      return;
    }

    const localResult = checkGrammar(text, "all");
    setChecking(true);

    try {
      const response = await checkGrammarWithGemini({
        text,
      });
      const payload = response?.data || {};
      const issues = Array.isArray(payload.issues) ? payload.issues : [];

      setResult({
        ...localResult,
        correctedText: payload.correctedText || localResult.correctedText,
        explanation: payload.explanation || localResult.explanation,
        issues,
        tenseName: payload.tenseName || localResult.tenseName,
        structure: isGenericStructure(payload.structure) ? localResult.structure : payload.structure,
        source: payload.source || "gemini",
      });
    } catch (error) {
      console.error("MindScope Gemini grammar check failed:", error);
      setResult({
        ...localResult,
        source: "local",
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={6}>
        <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Spellcheck color="primary" />
              <Typography variant="h6" fontWeight={800}>
                Grammar & Writing
              </Typography>
            </Stack>
            <TextField
              value={text}
              onChange={(event) => setText(event.target.value)}
              multiline
              minRows={8}
              fullWidth
              label="Write or paste a sentence"
              placeholder="Example: I have completed my homework."
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleCheck} startIcon={<Spellcheck />} disabled={checking}>
                {checking ? "Checking..." : "Check Grammar"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Stack spacing={2}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={800}>
                  Correct Sentence
                </Typography>
                {result.tenseName ? <Chip color="primary" label={result.tenseName} /> : null}
              </Stack>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
                <Typography fontWeight={700}>
                  {result.correctedText || "Your corrected sentence will appear here."}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                Explanation
              </Typography>
              <Typography color="text.secondary">
                {result.explanation}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                Sentence Structure
              </Typography>
              <Stack spacing={1}>
                {result.structure.length ? (
                  result.structure.map((item, index) => (
                    <Box
                      key={`${item.text}-${index}`}
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: "grey.50",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography fontWeight={800}>
                        {item.text} <Box component="span" sx={{ color: "primary.main" }}>-&gt;</Box> {item.role}
                      </Typography>
                      {item.note ? (
                        <Typography variant="body2" color="text.secondary">
                          {item.note}
                        </Typography>
                      ) : null}
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">
                    Grammar parts will appear after checking.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  );
}
