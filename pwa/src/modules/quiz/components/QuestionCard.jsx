import {
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

export default function QuestionCard({
  question,
  onAnswer,
  disabled,
  selectedIndex,
}) {
  return (
    <Card>
      <CardContent>
        <Typography sx={{ mb: 2 }}>
          {question.question_text}
        </Typography>

        <RadioGroup
          value={
            typeof selectedIndex === "number"
              ? selectedIndex
              : ""
          }
          onChange={(e) =>
            onAnswer(Number(e.target.value))
          }
        >
          {question.options.map((opt, idx) => (
            <FormControlLabel
              key={idx}
              value={idx}
              control={<Radio />}
              label={opt}
              disabled={disabled}
            />
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
