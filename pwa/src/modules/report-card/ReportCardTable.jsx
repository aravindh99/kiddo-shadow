import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import SubjectMarks from "./SubjectMarks";

export default function ReportCardTable({ subjects }) {
  return (
    <Paper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Subject</TableCell>
            <TableCell align="right">Marks</TableCell>
            <TableCell align="right">Max</TableCell>
            <TableCell align="right">Grade</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {subjects.map((s) => (
            <SubjectMarks
              key={s.subject_id}
              subject={s}
            />
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
