import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { getMyPaymentLogs } from "./payments.api";
import { useNotifications } from "../notifications/useNotifications";
import { useParentChild } from "../parents/ParentChildContext";
import ParentChildSwitcher from "../parents/ParentChildSwitcher";

const isPaymentNotification = (item) => {
  const haystack = `${item?.title || ""} ${item?.message || ""}`.toLowerCase();
  return haystack.includes("payment") || haystack.includes("fee");
};

export default function ParentPaymentsPage() {
  const { selectedChild } = useParentChild();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const { items: notifications, loading: notificationsLoading } = useNotifications(
    selectedChild?.id ? { student_id: selectedChild.id } : {}
  );

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getMyPaymentLogs(selectedChild?.id ? { student_id: selectedChild.id } : {});
        const data = res?.data?.data || {};
        setSummary(data?.totals || null);
        setSchoolInfo(data?.school || null);
        setRows(Array.isArray(data?.items) ? data.items : []);
        setError("");
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load payment details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedChild?.id]);

  const paymentNotifications = useMemo(
    () => (notifications || []).filter(isPaymentNotification).slice(0, 5),
    [notifications]
  );
  const currency = (value) => Number(value || 0).toLocaleString("en-IN");
  const pendingRows = rows.filter((row) => Number(row?.balance || 0) > 0);

  const buildUpiLink = (appScheme = "upi://pay") => {
    if (!selectedRow || !schoolInfo?.upi_id) return null;

    const params = new URLSearchParams({
      pa: schoolInfo.upi_id,
      pn: schoolInfo.school_name || "School",
      am: String(Number(selectedRow.balance || 0)),
      cu: "INR",
      tn: selectedRow.title || `School fee for ${selectedRow.studentName || "student"}`,
    });

    return `${appScheme}?${params.toString()}`;
  };

  const openPaymentLink = (appScheme) => {
    const link = buildUpiLink(appScheme);
    if (!link) return;
    window.location.href = link;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <ParentChildSwitcher label="Student" />
      {selectedChild?.name ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Viewing payments for {selectedChild.name}
        </Typography>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={600}>School Payment Mode</Typography>
                <Chip
                  color="primary"
                  size="small"
                  label={(schoolInfo?.payment_mode || "Not Set").replace(/_/g, " ")}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {schoolInfo?.school_name || "School"} payment summary for parent-linked students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Due</Typography>
              <Typography variant="h6">{currency(summary?.totalDue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Paid</Typography>
              <Typography variant="h6">{currency(summary?.totalPaid)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Balance</Typography>
              <Typography variant="h6">{currency(summary?.totalBalance)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {pendingRows.length ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Payment reminder: {pendingRows.length} student fee {pendingRows.length > 1 ? "entries are" : "entry is"} pending.
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 2 }}>
          All visible parent-linked payment entries are currently settled.
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Student Payment Status</Typography>
          <Stack spacing={1}>
            {rows.length === 0 && (
              <Typography color="text.secondary">No payment records available.</Typography>
            )}
            {rows.map((row) => (
              <Box key={row.studentId}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600}>{row.studentName || "Student"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.class} - {row.section}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {row.title || "School fee allocation"}
                    </Typography>
                    {row.message ? (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {row.message}
                      </Typography>
                    ) : null}
                    <Typography variant="caption" color="text.secondary" display="block">
                      Due: {currency(row.defaultAmount)} | Paid: {currency(row.paidAmount)} | Balance: {currency(row.balance)}
                    </Typography>
                    {row.dueDate ? (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Due Date: {new Date(row.dueDate).toLocaleDateString()}
                      </Typography>
                    ) : null}
                  </Box>
                  <Stack spacing={1} alignItems="flex-end">
                    <Chip
                      size="small"
                      color={row.paymentStatus === "Paid" ? "success" : "warning"}
                      label={`${row.paymentStatus} | Balance: ${currency(row.balance)}`}
                    />
                    {Number(row.balance || 0) > 0 ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedRow(row)}
                      >
                        Pay Options
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
                <Divider sx={{ mt: 1 }} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Payment Notifications</Typography>
          {notificationsLoading ? (
            <Typography color="text.secondary">Loading notifications...</Typography>
          ) : paymentNotifications.length ? (
            <Stack spacing={1}>
              {paymentNotifications.map((n) => (
                <Box key={n.id}>
                  <Typography fontWeight={600}>{n.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{n.message}</Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">No payment notifications found.</Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedRow)} onClose={() => setSelectedRow(null)} fullWidth maxWidth="xs">
        <DialogTitle>Pay Options</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Typography variant="body2">
              Student: {selectedRow?.studentName || "Student"}
            </Typography>
            <Typography variant="body2">
              Balance: {currency(selectedRow?.balance)}
            </Typography>
            {schoolInfo?.upi_id ? (
              <>
                <Typography variant="caption" color="text.secondary">
                  UPI ID: {schoolInfo.upi_id}
                </Typography>
                <Button variant="contained" onClick={() => openPaymentLink("upi://pay")}>
                  Any UPI App
                </Button>
                <Button variant="outlined" onClick={() => openPaymentLink("tez://upi/pay")}>
                  Google Pay
                </Button>
                <Button variant="outlined" onClick={() => openPaymentLink("paytmmp://pay")}>
                  Paytm
                </Button>
                <Button variant="outlined" onClick={() => openPaymentLink("phonepe://pay")}>
                  PhonePe
                </Button>
              </>
            ) : (
              <Alert severity="info">
                School UPI details are not configured yet. Please contact the school to complete payment.
              </Alert>
            )}
            {schoolInfo?.contact_phone ? (
              <Typography variant="caption" color="text.secondary">
                School Contact: {schoolInfo.contact_phone}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
