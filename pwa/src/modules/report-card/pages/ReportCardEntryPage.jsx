import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, Container, Snackbar, Alert } from "@mui/material";
import { Save } from "@mui/icons-material";
import { useState } from "react";
import api from "../../../api/axios";

// Helper API call
const saveMarks = (reportCardId, marks) => api.post(`/report-cards/${reportCardId}/marks`, { marks });

export default function ReportCardEntryPage() {
    const [students, setStudents] = useState([
        // Mock data for prototype
        { id: 1, name: "Alice Johnson", roll: "101", marks: 0 },
        { id: 2, name: "Bob Smith", roll: "102", marks: 0 },
        { id: 3, name: "Charlie Davis", roll: "103", marks: 0 },
    ]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleMarkChange = (id, value) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, marks: Number(value) } : s));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            // Mock API call structure
            console.log("Saving marks:", students);
            // await saveMarks(reportCardId, students);
            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError("Failed to save marks");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
            <Box sx={{ width: '100%' }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mb: 4,
                    gap: 2
                }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                        Enter Marks
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={loading}
                        fullWidth={false}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        Save All
                    </Button>
                </Box>

                <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
                    <TableContainer sx={{ maxHeight: '70vh', overflowX: 'auto' }}>
                        <Table stickyHeader aria-label="sticky table" sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Roll No</TableCell>
                                    <TableCell>Student Name</TableCell>
                                    <TableCell align="right">Marks Obtained</TableCell>
                                    <TableCell align="right">Max Marks</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {students.map((student) => (
                                    <TableRow hover role="checkbox" tabIndex={-1} key={student.id}>
                                        <TableCell>{student.roll}</TableCell>
                                        <TableCell fontWeight="medium">{student.name}</TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={student.marks}
                                                onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                sx={{ width: 100 }}
                                                inputProps={{ min: 0, max: 100, style: { textAlign: 'right' } }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">100</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
                <Snackbar
                    open={success}
                    autoHideDuration={3000}
                    onClose={() => setSuccess(false)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert severity="success" onClose={() => setSuccess(false)} variant="filled">
                        Marks saved successfully!
                    </Alert>
                </Snackbar>

                <Snackbar
                    open={!!error}
                    autoHideDuration={4000}
                    onClose={() => setError("")}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert severity="error" onClose={() => setError("")} variant="filled">
                        {error}
                    </Alert>
                </Snackbar>
            </Box>
        </Container>
    );
}
