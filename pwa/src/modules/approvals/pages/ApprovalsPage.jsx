import { Box, Typography, Card, CardContent, Button, Avatar, Chip, Container, Stack, Divider, CircularProgress, Alert, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from "@mui/material";
import { Check, Close, HistoryEdu } from "@mui/icons-material";
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getTeacherPendingApprovals, approveRequest, approveParentRequest } from "../approvals.api";
import ApprovalHistorySidebar from "../components/ApprovalHistorySidebar";

const detailFields = [
    "username",
    "name",
    "email",
    "phone",
    "gender",
    "dob",
    "blood_group",
    "address",
    "class",
    "section",
    "father_name",
    "mother_name",
    "guardian_name",
    "admission_no",
    "roll_no",
];

function isInvalidName(value) {
    const v = String(value || "").trim();
    if (!v) return true;
    if (/^student$/i.test(v)) return true;
    if (/^user\s*#?/i.test(v)) return true;
    return false;
}

function getDisplayName(req, tab) {
    const parentName =
        req?.user?.name ||
        req?.name ||
        req?.parent?.user?.name ||
        req?.parent?.name ||
        "";
    const studentName =
        req?.student?.user?.name ||
        req?.student?.name ||
        "";
    const username =
        req?.user?.username ||
        req?.parent?.user?.username ||
        req?.student?.user?.username ||
        req?.username ||
        "";

    const preferred = tab === "parents" ? parentName : studentName || parentName;
    if (!isInvalidName(preferred)) return preferred;
    if (!isInvalidName(parentName)) return parentName;
    if (!isInvalidName(studentName)) return studentName;
    return username;
}

export default function ApprovalsPage() {
    const [studentRequests, setStudentRequests] = useState([]);
    const [parentRequests, setParentRequests] = useState([]);
    const [activeTab, setActiveTab] = useState("students");
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [actionError, setActionError] = useState("");
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, id: null, action: null });
    const [searchParams] = useSearchParams();
    const targetUserId = searchParams.get('user_id');
    const expandedTargetRef = useRef(false);

    const resolveApprovalId = (r) => r.id; // Helper normally outside but assume it's somewhere or use simple r.id
    const resolveParentId = (r) => r.id;

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            const res = await getTeacherPendingApprovals();
            const payload = res?.data ?? res ?? {};
            const data = payload?.data ?? payload;

            const items = data?.items ?? [];
            const students =
                data?.students?.items ??
                data?.students?.rows ??
                data?.students ??
                data?.pending_students?.items ??
                data?.pending_students ??
                data?.student_requests ??
                data?.student_approvals ??
                data?.studentApprovals ??
                (Array.isArray(items) ? items : []);

            const parents =
                data?.parents?.items ??
                data?.parents?.rows ??
                data?.parents ??
                data?.pending_parents?.items ??
                data?.pending_parents ??
                data?.parent_requests ??
                data?.parent_approvals ??
                data?.parentApprovals ??
                [];

            const normalizedStudents = Array.isArray(students) ? students : [];
            const normalizedParents = Array.isArray(parents) ? parents : [];

            if (normalizedParents.length === 0 && Array.isArray(items)) {
                const split = items.reduce(
                    (acc, item) => {
                        const typeHint = String(item?.type || item?.profile_type || item?.request_type || "").toLowerCase();
                        const isParent =
                            typeHint.includes("parent") ||
                            Boolean(item?.parent_id || item?.parent || item?.relation_type);
                        if (isParent) acc.parents.push(item);
                        else acc.students.push(item);
                        return acc;
                    },
                    { students: [], parents: [] }
                );
                setStudentRequests(normalizedStudents.length ? normalizedStudents : split.students);
                setParentRequests(normalizedParents.length ? normalizedParents : split.parents);
            } else {
                setStudentRequests(normalizedStudents);
                setParentRequests(normalizedParents);
            }
        } catch (err) {
            console.error("Failed to load approvals", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    useEffect(() => {
        if (!loading && targetUserId && !expandedTargetRef.current) {
            // Find in students
            const studentMatch = studentRequests.find(r => String(r.user_id) === String(targetUserId) || String(r?.student?.user_id) === String(targetUserId) || String(r?.user?.id) === String(targetUserId));
            if (studentMatch) {
                setActiveTab("students");
                setExpandedId(studentMatch.id);
                expandedTargetRef.current = true;
                return;
            }
            
            // Find in parents
            const parentMatch = parentRequests.find(r => String(r.user_id) === String(targetUserId) || String(r?.parent?.user_id) === String(targetUserId) || String(r?.user?.id) === String(targetUserId));
            if (parentMatch) {
                setActiveTab("parents");
                setExpandedId(parentMatch.id);
                expandedTargetRef.current = true;
            }
        }
    }, [loading, studentRequests, parentRequests, targetUserId]);

    const handleAction = async (type, id, action) => {
        try {
            setActionError("");
            if (type === "parent_profile") {
                await approveParentRequest(id, action);
                setParentRequests(prev => prev.filter(r => String(resolveParentId(r)) !== String(id)));
            } else {
                await approveRequest(type, id, action);
                setStudentRequests(prev => prev.filter(r => String(resolveApprovalId(r)) !== String(id)));
            }
            if (String(expandedId) === String(id)) setExpandedId(null);
            setConfirmDialog({ open: false, type: null, id: null, action: null });
        } catch (err) {
            console.error(`Failed to ${action} request`, err);
            setActionError(err?.response?.data?.message || err?.message || `Failed to ${action} request`);
            setConfirmDialog(prev => ({ ...prev, open: false }));
        }
    };

    const confirmAction = () => {
        if (confirmDialog.type && confirmDialog.id && confirmDialog.action) {
            handleAction(confirmDialog.type, confirmDialog.id, confirmDialog.action);
        }
    };

    const sortApprovalsDescending = useMemo(
        () => (items) =>
            [...items].sort((left, right) => {
                const leftDate = new Date(left.updated_at || left.created_at || left.updatedAt || left.createdAt || 0);
                const rightDate = new Date(right.updated_at || right.created_at || right.updatedAt || right.createdAt || 0);

                const timeDiff = rightDate.getTime() - leftDate.getTime();
                if (timeDiff !== 0) return timeDiff;

                const leftName = getDisplayName(left, activeTab);
                const rightName = getDisplayName(right, activeTab);

                const leftUsername = left?.user?.username || left?.username || "";
                const rightUsername = right?.user?.username || right?.username || "";

                return String(leftUsername).localeCompare(String(rightUsername), undefined, {
                    numeric: true,
                    sensitivity: "base",
                });
            }),
        [activeTab]
    );

    const requests = activeTab === "students"
        ? sortApprovalsDescending(studentRequests)
        : sortApprovalsDescending(parentRequests);

    if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, borderBottom: 1, borderColor: 'divider', pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Pending Approvals
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Review student and parent requests (class teacher scope)
                    </Typography>
                </Box>
                <Button 
                    variant="outlined" 
                    startIcon={<HistoryEdu />} 
                    onClick={() => setIsHistoryOpen(true)}
                >
                    Approval History
                </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, value) => {
                        setActiveTab(value);
                        setExpandedId(null);
                    }}
                    variant="fullWidth"
                >
                    <Tab
                        value="students"
                        label={`Students (${studentRequests.length})`}
                    />
                    <Tab
                        value="parents"
                        label={`Parents (${parentRequests.length})`}
                    />
                </Tabs>
            </Box>
            {actionError ? (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError("")}>
                    {actionError}
                </Alert>
            ) : null}

            {requests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 2 }}>
                    <Check sx={{ fontSize: 60, color: 'success.light', mb: 2 }} />
                    <Typography variant="h6">All caught up!</Typography>
                    <Typography color="text.secondary">
                        No pending {activeTab} requests to review.
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={2}>
                    {requests.map((req) => {
                        const approvalId = resolveApprovalId(req);
                        const parentId = resolveParentId(req);
                        const isExpanded = expandedId === approvalId;
                        const isParentTab = activeTab === "parents";
                        const name = getDisplayName(req, activeTab) || (isParentTab ? "Parent" : "Student");
                        const initial = name?.[0] || "U";
                        const className =
                            req.class?.class_name ||
                            req.student?.class?.class_name ||
                            req.class_id ||
                            "-";
                        const sectionName =
                            req.section?.name ||
                            req.student?.section?.name ||
                            req.section_id ||
                            "-";
                        const requestedText = formatRequestedAt(req.updated_at || req.created_at || req.updatedAt || req.createdAt);
                        return (
                        <Card
                            key={approvalId || `${req.student_id}-${req.section_id}`}
                            sx={{ overflow: 'visible', cursor: 'pointer' }}
                            onClick={() => setExpandedId(isExpanded ? null : approvalId)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <Avatar
                                        src={req.user?.avatar_url || req.student?.user?.avatar_url || req.student?.avatar}
                                        sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
                                    >
                                        {initial}
                                    </Avatar>

                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                            <Typography variant="h6">
                                                {name}
                                            </Typography>
                                            <Chip label={isParentTab ? "Parent Profile" : (req.type || "Profile Update")} size="small" color="info" variant="outlined" />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {isParentTab
                                              ? `${req.relation_type || "Parent"} • Class ${className} - ${sectionName}`
                                              : `Class ${className} - ${sectionName}`}
                                        </Typography>
                                        
                                        {(() => {
                                            const pendingUpdates = req.pending_updates || req.pendingUpdates || {};
                                            const userUpdates = pendingUpdates.user || {};
                                            const entityUpdates = pendingUpdates.student || pendingUpdates.parent || {};
                                            const allUpdates = { ...userUpdates, ...entityUpdates };
                                            const updateKeys = Object.keys(allUpdates);
                                            if (updateKeys.length === 0) return null;

                                            const fieldLabels = {
                                              name: 'Name', phone: 'Phone', email: 'Email',
                                              dob: 'Date of Birth', gender: 'Gender', blood_group: 'Blood Group',
                                              father_name: 'Father Name', mother_name: 'Mother Name',
                                              guardian_name: 'Guardian Name', father_occupation: 'Father Occupation',
                                              mother_occupation: 'Mother Occupation', address: 'Address',
                                              family_income: 'Family Income', relation_type: 'Relation Type',
                                              avatar_url: 'Profile Photo',
                                            };

                                            // Only count fields that actually changed
                                            const changedFields = updateKeys.filter(field => {
                                              if (field === 'avatar_url') return true;
                                              const newVal = allUpdates[field];
                                              const oldVal = req?.student?.user?.[field] ?? req?.student?.[field] ?? req?.user?.[field] ?? req?.[field];
                                              const normalize = (v) => (v ?? '').toString().trim();
                                              return normalize(oldVal) !== normalize(newVal);
                                            });

                                            if (changedFields.length === 0) return null;

                                            // Collapsed: show short summary only (no values)
                                            let shortSummary = '';
                                            if (changedFields.length === 1) {
                                              const f = changedFields[0];
                                              const lbl = fieldLabels[f] || f.replace(/_/g, ' ');
                                              shortSummary = `${lbl} change request`;
                                            } else {
                                              const labels = changedFields.map(f => fieldLabels[f] || f.replace(/_/g, ' '));
                                              shortSummary = `${labels.join(', ')} change request`;
                                            }

                                            return (
                                                <Typography variant="subtitle2" color="error.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                                                    {shortSummary}
                                                </Typography>
                                            );
                                        })()}

                                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line', display: 'block', mt: 0.5 }}>
                                            {requestedText}
                                        </Typography>

                                    </Box>
                                </Box>

                                {isExpanded && (
                                  <>
                                    <Divider sx={{ my: 2 }} />
                                    {/* Changed fields summary at top of expanded view */}
                                    {(() => {
                                      const pendingUpdates = req.pending_updates || req.pendingUpdates || {};
                                      const allUp = { ...(pendingUpdates.user || {}), ...(pendingUpdates.student || pendingUpdates.parent || {}) };
                                      const fieldLabels = {
                                        name: 'Name', phone: 'Phone', email: 'Email', dob: 'Date of Birth',
                                        gender: 'Gender', blood_group: 'Blood Group', father_name: 'Father Name',
                                        mother_name: 'Mother Name', guardian_name: 'Guardian Name',
                                        father_occupation: 'Father Occupation', mother_occupation: 'Mother Occupation',
                                        address: 'Address', family_income: 'Family Income', relation_type: 'Relation Type',
                                        avatar_url: 'Profile Photo',
                                      };
                                      const normalize = (v) => (v ?? '').toString().trim();
                                      const changedLines = Object.keys(allUp).filter(field => {
                                        if (field === 'avatar_url') return true;
                                        const oldV = req?.student?.user?.[field] ?? req?.student?.[field] ?? req?.user?.[field] ?? req?.[field];
                                        return normalize(oldV) !== normalize(allUp[field]);
                                      }).map(field => {
                                        const lbl = fieldLabels[field] || field.replace(/_/g, ' ');
                                        if (field === 'avatar_url') return `• ${lbl}: Updated`;
                                        const oldV = req?.student?.user?.[field] ?? req?.student?.[field] ?? req?.user?.[field] ?? req?.[field];
                                        const oldNorm = normalize(oldV);
                                        return oldNorm
                                          ? `• ${lbl}: ${oldV} → ${allUp[field]}`
                                          : `• ${lbl}: → ${allUp[field]}`;
                                      });
                                      if (changedLines.length === 0) return null;
                                      return (
                                        <Box sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200', borderRadius: 1, p: 1.5, mb: 2 }}>
                                          <Typography variant="caption" fontWeight="bold" color="error.main" sx={{ display: 'block', mb: 0.5 }}>
                                            Changes Requested:
                                          </Typography>
                                          <Typography variant="body2" color="error.dark" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                                            {changedLines.join('\n')}
                                          </Typography>
                                        </Box>
                                      );
                                    })()}
                                    <Stack spacing={0.75} sx={{ mb: 2 }}>

                                      {detailFields.map((field) => {
                                        let oldValue =
                                          req?.student?.user?.[field] ??
                                          req?.student?.[field] ??
                                          req?.user?.[field] ??
                                          req?.[field];

                                        if (field === "username") {
                                          oldValue = req?.student?.user?.username || req?.user?.username || req?.username;
                                        }
                                        if (field === "class") oldValue = className;
                                        if (field === "section") oldValue = sectionName;

                                        const pendingUpdates = req.pending_updates || req.pendingUpdates || {};
                                        const allUpdates = { ...(pendingUpdates.user || {}), ...(pendingUpdates.student || pendingUpdates.parent || {}) };
                                        
                                        const fieldInPending = allUpdates[field] !== undefined;
                                        const newValue = allUpdates[field];
                                        const normalize = (v) => (v ?? '').toString().trim();
                                        // Only treat as a real update if the value actually changed
                                        const hasUpdate = fieldInPending && normalize(newValue) !== normalize(oldValue);

                                        if ((oldValue === undefined || oldValue === null || oldValue === "") && !fieldInPending) return null;

                                        return (
                                          <Box key={field} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
                                            <Typography variant="body2" color={hasUpdate ? "error.main" : "text.secondary"} sx={{ textTransform: 'capitalize', fontWeight: hasUpdate ? 600 : 400 }}>
                                              {field.replace(/_/g, " ")}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {hasUpdate ? (
                                                    <>
                                                        <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
                                                            {String(oldValue || '-')}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">→</Typography>
                                                        <Typography variant="body2" fontWeight="bold" color="error.main">
                                                            {String(newValue)}
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {String(oldValue)}
                                                    </Typography>
                                                )}
                                            </Box>
                                          </Box>
                                        );
                                      })}
                                    </Stack>

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                        <Button
                                          variant="outlined"
                                          color="error"
                                          startIcon={<Close />}
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setConfirmDialog({ 
                                              open: true, 
                                              type: isParentTab ? 'parent_profile' : 'student_profile', 
                                              id: isParentTab ? parentId : approvalId, 
                                              action: 'reject' 
                                            }); 
                                          }}
                                        >
                                          Reject
                                        </Button>
                                        <Button
                                          variant="contained"
                                          color="success"
                                          startIcon={<Check />}
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setConfirmDialog({ 
                                              open: true, 
                                              type: isParentTab ? 'parent_profile' : 'student_profile', 
                                              id: isParentTab ? parentId : approvalId, 
                                              action: 'approve' 
                                            }); 
                                          }}
                                        >
                                          Approve
                                        </Button>
                                      </Box>
                                  </>
                                )}

                            </CardContent>
                        </Card>
                        );
                    })}
                </Stack>
            )}
            
            <ApprovalHistorySidebar open={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} limit={10} />

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ open: false, type: null, id: null, action: null })}
            >
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to {confirmDialog.action === "approve" ? "approve" : "reject"} this request?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, type: null, id: null, action: null })}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={confirmAction} 
                        color={confirmDialog.action === "approve" ? "success" : "error"} 
                        variant="contained"
                        autoFocus
                    >
                        {confirmDialog.action === "approve" ? "Yes, Approve" : "Yes, Reject"}
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}

function resolveApprovalId(req) {
    const raw =
        req?.approval_id ??
        req?.request_id ??
        req?.id ??
        req?.student_id ??
        req?.student?.id ??
        req?.user_id ??
        req?.user?.id ??
        req?.parent_id ??
        req?.parent?.id;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function resolveParentId(req) {
    const raw =
        req?.parent_id ??
        req?.parent?.id ??
        req?.id ??
        req?.user_id ??
        req?.user?.id;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function formatRequestedAt(ts) {
    if (!ts) return "Date: N/A\nTime: N/A";

    const date = new Date(ts);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `Date: ${dateStr}\nTime: ${timeStr}`;
}
