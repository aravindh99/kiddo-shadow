import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

export default function DatePickerField({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  disablePast,
  disableFuture,
  fullWidth = true,
  size = "small",
  error,
  helperText,
  format = "DD MMM YYYY",
}) {
  const parsedValue = value ? dayjs(value) : null;
  const parsedMin = minDate ? dayjs(minDate) : undefined;
  const parsedMax = maxDate ? dayjs(maxDate) : undefined;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={parsedValue}
        onChange={(newValue) => {
          onChange?.(newValue ? newValue.format("YYYY-MM-DD") : "");
        }}
        minDate={parsedMin}
        maxDate={parsedMax}
        disablePast={disablePast}
        disableFuture={disableFuture}
        format={format}
        slotProps={{
          textField: {
            fullWidth,
            size,
            error,
            helperText,
          },
        }}
        sx={{
          "& .MuiPickersDay-root.Mui-selected": {
            bgcolor: "primary.main",
            color: "primary.contrastText",
          },
          "& .MuiPickersDay-root.Mui-selected:hover": {
            bgcolor: "primary.dark",
          },
        }}
      />
    </LocalizationProvider>
  );
}
