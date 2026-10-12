import { TableRow, TableCell } from "@mui/material";

export default function SubjectMarks({ subject }) {
  return (
    <TableRow>
      <TableCell>{subject.subject_name}</TableCell>
      <TableCell align="right">
        {subject.marks_obtained}
      </TableCell>
      <TableCell align="right">
        {subject.max_marks}
      </TableCell>
      <TableCell align="right">
        {subject.grade}
      </TableCell>
    </TableRow>
  );
}
