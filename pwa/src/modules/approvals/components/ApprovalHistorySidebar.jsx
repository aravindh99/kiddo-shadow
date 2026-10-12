import React, { useState, useEffect, useMemo } from 'react';
import { 
  Drawer, Box, Typography, IconButton, TextField, 
  CircularProgress, Card, CardContent, Chip, Stack, 
  Divider, InputAdornment, Avatar 
} from '@mui/material';
import { Close, Search, HistoryEdu } from '@mui/icons-material';
import { getTeacherApprovalHistory } from '../approvals.api';

export default function ApprovalHistorySidebar({ open, onClose, limit = 10 }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All'); // 'All', 'student', 'parent'
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'approved', 'rejected'
  
  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getTeacherApprovalHistory({ limit });
      const payload = res?.data ?? res ?? {};
      const items = payload?.items ?? payload?.data?.items ?? [];
      setHistoryItems(items);
    } catch (error) {
      console.error("Failed to fetch approval history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      // Name Search
      const name = item?.user?.name || item?.student?.user?.name || item?.parent?.user?.name || item?.student?.name || "";
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type Filter
      const typeMatches = filterType === 'All' || item.history_type === filterType;
      
      // Status Filter
      const statusMatches = filterStatus === 'All' || item.approval_status === filterStatus;
      
      return matchesSearch && typeMatches && statusMatches;
    }).slice(0, limit);
  }, [historyItems, searchQuery, filterType, filterStatus, limit]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400, md: 500 }, p: 0, bgcolor: 'background.default' }
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 1 }}>
        <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
          <HistoryEdu color="primary" /> Approval History
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {/* Filters */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by user name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          }}
        />
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
          <Chip label="All Types" onClick={() => setFilterType('All')} color={filterType === 'All' ? 'primary' : 'default'} variant={filterType === 'All' ? 'filled' : 'outlined'} size="small" />
          <Chip label="Students" onClick={() => setFilterType('student')} color={filterType === 'student' ? 'primary' : 'default'} variant={filterType === 'student' ? 'filled' : 'outlined'} size="small" />
          <Chip label="Parents" onClick={() => setFilterType('parent')} color={filterType === 'parent' ? 'primary' : 'default'} variant={filterType === 'parent' ? 'filled' : 'outlined'} size="small" />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto' }}>
          <Chip label="All Status" onClick={() => setFilterStatus('All')} color={filterStatus === 'All' ? 'primary' : 'default'} variant={filterStatus === 'All' ? 'filled' : 'outlined'} size="small" />
          <Chip label="Approved" onClick={() => setFilterStatus('approved')} color={filterStatus === 'approved' ? 'success' : 'default'} variant={filterStatus === 'approved' ? 'filled' : 'outlined'} size="small" />
          <Chip label="Rejected" onClick={() => setFilterStatus('rejected')} color={filterStatus === 'rejected' ? 'error' : 'default'} variant={filterStatus === 'rejected' ? 'filled' : 'outlined'} size="small" />
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography variant="body1" color="text.secondary">
              No approval history found.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {filteredItems.map((item, index) => {
              const isParent = item.history_type === 'parent';
              const name = item?.user?.name || item?.student?.user?.name || "Unknown User";
              const initial = name?.[0] || "U";
              const className = item?.class?.class_name || item?.student?.class?.class_name || "-";
              const sectionName = item?.section?.name || item?.student?.section?.name || "-";
              
              const dateObj = new Date(item.updated_at || item.approved_at);
              const dateStr = isNaN(dateObj) ? "N/A" : dateObj.toLocaleDateString();
              const timeStr = isNaN(dateObj) ? "N/A" : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              const typeLabel = isParent ? "Parent Profile" : (item.type || "Profile Update");
              const approverName = item?.approver?.name || "Teacher/Admin";
              
              // Extract modified fields
              const changes = [];
              if (item.pending_updates) {
                const pu = item.pending_updates;
                const oldValues = pu._history_old_values || {};
                const allUpdates = { ...(pu.user || {}), ...(pu.student || {}), ...(pu.parent || {}), ...(pu.teacher || {}) };
                
                for (const [key, newValue] of Object.entries(allUpdates)) {
                   const oldVal = oldValues[key] !== undefined ? oldValues[key] : oldValues[`user_${key}`];
                   if (oldVal !== undefined && String(oldVal) !== String(newValue)) {
                     changes.push({ field: key, old: oldVal, new: newValue });
                   } else if (item.approval_status === "rejected") {
                     // For rejected, current DB value is the old value
                     const currentData = { ...(item.user || {}), ...item };
                     changes.push({ field: key, old: currentData[key], new: newValue });
                   }
                }
              }

              return (
                <Card key={item.id + '-' + index} variant="outlined">
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" gap={2} mb={1}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>{initial}</Avatar>
                      <Box flex={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                            {name}
                          </Typography>
                          <Chip 
                            label={item.approval_status.charAt(0).toUpperCase() + item.approval_status.slice(1)} 
                            size="small" 
                            color={getStatusColor(item.approval_status)} 
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {typeLabel} • Class {className} - {sectionName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dateStr} at {timeStr} • Approved By: {approverName}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {changes.length > 0 && (
                      <Box mt={1} p={1} bgcolor="grey.50" borderRadius={1}>
                        <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                          Updated Fields
                        </Typography>
                        {changes.map((c, i) => (
                          <Box key={i} display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                              {c.field}:
                            </Typography>
                            <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'error.main' }}>
                              {c.old || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">→</Typography>
                            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                              {c.new}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {item.rejection_reason && (
                      <Box mt={1} p={1} bgcolor="error.50" borderRadius={1}>
                        <Typography variant="caption" color="error.main" fontWeight="medium">
                          Remarks: {item.rejection_reason}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
