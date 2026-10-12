import React, { useEffect, useState, useCallback } from "react";
import "./AuditLogs.css";
import {
  Eye,
  Loader2,
  Archive,
  Search,
  Filter,
  Calendar,
  Box,
  User,
  RefreshCw,
  AlertCircle,
  XCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuditLogs, getAuditLogById } from "./AuditLogs";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  // Filters & Pagination
  const [filters, setFilters] = useState({
    entity_type: "",
    entity_id: "",
    from_date: "",
    to_date: "",
  });
  const [offset, setOffset] = useState(0);
  const limit = 10;

  // Detailed View
  const [viewLog, setViewLog] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  /* ================= LOAD ENGINE ================= */
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAuditLogs({
        ...filters,
        limit,
        offset
      });
      setLogs(res.items);
      setTotal(res.total);
      setTotal(res.total);
    } catch (err) {
      // Handle known backend association error gracefully
      if (err.message?.includes("user is not associated")) {
        setErrorMsg("System Notice: Audit logging is currently disabled for this administrative account (Server Config).");
        // Suppress console error for this known issue
      } else {
        setErrorMsg("Failed to synchronize audit registry.");
        console.error("Audit Log Sync Error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, offset, limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  /* ================= INTERACTION HANDLERS ================= */
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setOffset(0); // Reset to first page on filter change
  };

  const openLogDetails = async (id) => {
    setViewLoading(true);
    try {
      const data = await getAuditLogById(id);
      setViewLog(data);
    } catch (err) {
      setErrorMsg("Failed to retrieve immutable log record.");
    } finally {
      setViewLoading(false);
    }
  };

  const handleRefresh = () => {
    setOffset(0);
    loadLogs();
  };

  // Pagination Helper
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  const getActionBadgeClass = (action) => {
    const act = action?.toLowerCase() || "";
    if (act.includes("create")) return "badge-green";
    if (act.includes("update") || act.includes("edit")) return "badge-blue";
    if (act.includes("delete") || act.includes("remove")) return "badge-red";
    return "badge-gray";
  };

  return (
    <div className="audit-page-premium">
      {/* PAGE HEADER */}
      <header className="page-header-premium">
        <div className="header-info">
          <div className="header-icon-box">
            <Archive size={32} />
          </div>
          <div>
            <h1>Audit Registry</h1>
            <p>Monitor immutable administrative activity logs.</p>
          </div>
        </div>

        <div className="header-actions-premium">
          <Button variant="ghost" className="refresh-btn-premium" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="audit-filters-card">
        <div className="filter-grid-premium">
          <div className="filter-item">
            <Label>Entity Type</Label>
            <div className="filter-input-wrap">
              <Box size={16} className="filter-icon" />
              <Input
                placeholder="e.g. USER, CLASS"
                value={filters.entity_type}
                onChange={(e) => handleFilterChange("entity_type", e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item">
            <Label>Entity ID</Label>
            <div className="filter-input-wrap">
              <Info size={16} className="filter-icon" />
              <Input
                placeholder="ID"
                type="number"
                value={filters.entity_id}
                onChange={(e) => handleFilterChange("entity_id", e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item">
            <Label>From Date</Label>
            <div className="filter-input-wrap">
              <Calendar size={16} className="filter-icon" />
              <Input
                type="date"
                value={filters.from_date}
                onChange={(e) => handleFilterChange("from_date", e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item">
            <Label>To Date</Label>
            <div className="filter-input-wrap">
              <Calendar size={16} className="filter-icon" />
              <Input
                type="date"
                value={filters.to_date}
                onChange={(e) => handleFilterChange("to_date", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="audit-table-container">
        {loading ? (
          <div className="loading-state-premium" style={{ padding: "120px" }}>
            <Loader2 className="animate-spin" size={48} />
            <p>Syncing Registry Data...</p>
          </div>
        ) : (
          <>
            <table className="audit-premium-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action Type</th>
                  <th>Target Entity</th>
                  <th style={{ textAlign: "right" }}>Operation</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 600 }}>
                        <Calendar size={14} style={{ opacity: 0.5 }} />
                        {log.created_at ? new Date(log.created_at).toLocaleString('en-IN', { hour12: true }) : "N/A"}
                      </div>
                    </td>
                    <td>
                      <div className="actor-cell-premium">
                        <div className="avatar-placeholder-small">
                          <User size={12} />
                        </div>
                        <span style={{ fontWeight: 700 }}>{log.user?.username || "System Agent"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-pill ${getActionBadgeClass(log.action)}`}>
                        {log.action || "GENERIC_OP"}
                      </span>
                    </td>
                    <td>
                      <div className="entity-cell-premium">
                        <span className="badge-pill badge-outline">{log.entity_type || "GLOBAL"}</span>
                        {log.entity_id && <span className="entity-id-tag">ID: {log.entity_id}</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="action-btn-circle btn-ghost-primary"
                        onClick={() => openLogDetails(log.id)}
                        disabled={viewLoading}
                      >
                        {viewLoading && viewLog?.id === log.id ? <Loader2 className="animate-spin" size={16} /> : <Eye size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "100px", color: "var(--text-muted)" }}>
                      <AlertCircle size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
                      <p>No administrative activity records found for this criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* PAGINATION ENGINE */}
            <div className="pagination-premium">
              <div className="pagination-stats">
                Showing <strong>{offset + 1}-{Math.min(offset + limit, total)}</strong> of <strong>{total}</strong> records
              </div>
              <div className="pagination-controls-premium">
                <Button
                  variant="ghost"
                  disabled={offset === 0}
                  onClick={() => setOffset(prev => Math.max(0, prev - limit))}
                  className="page-nav-btn-premium"
                >
                  Previous Phase
                </Button>
                <div className="page-indicator-premium">
                  {currentPage} / {totalPages}
                </div>
                <Button
                  variant="ghost"
                  disabled={offset + limit >= total}
                  onClick={() => setOffset(prev => prev + limit)}
                  className="page-nav-btn-premium"
                >
                  Next Phase
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* DETAILS MODAL */}
      {viewLog && (
        <div className="premium-modal-overlay" onClick={() => setViewLog(null)}>
          <div className="premium-modal-card wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header-section">
              <div className="header-info">
                <div className="header-icon-box small">
                  <Archive size={20} />
                </div>
                <div>
                  <h2 className="modal-title-premium">Immutable Record Detail</h2>
                  <p className="modal-subtitle-premium">Metadata for activity trace ID: #{viewLog.id}</p>
                </div>
              </div>
              <button className="close-modal-btn" onClick={() => setViewLog(null)}>
                <XCircle size={24} />
              </button>
            </div>

            <div className="modal-content-premium audit-detail-view">
              <div className="audit-meta-grid">
                <div className="meta-card">
                  <Label>Operator</Label>
                  <p>{viewLog.user?.username || "Authenticated Agent"}</p>
                </div>
                <div className="meta-card">
                  <Label>Operation Timestamp</Label>
                  <p>{new Date(viewLog.created_at).toLocaleString()}</p>
                </div>
                <div className="meta-card">
                  <Label>Action Classified</Label>
                  <span className={`badge-pill ${getActionBadgeClass(viewLog.action)}`}>{viewLog.action}</span>
                </div>
                <div className="meta-card">
                  <Label>Target Resource</Label>
                  <p>{viewLog.entity_type} [ID: {viewLog.entity_id || "N/A"}]</p>
                </div>
              </div>

              <div className="json-payload-view">
                <Label>Structured Payload (JSON)</Label>
                <div className="json-container-premium">
                  <pre>{JSON.stringify(viewLog.payload || viewLog, null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="modal-footer-premium">
              <Button onClick={() => setViewLog(null)} className="execute-btn-premium">
                Acknowledge & Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR FEEDBACK */}
      {errorMsg && (
        <div className="toast-premium error">
          <AlertCircle size={24} />
          <div>
            <span>Protocol Synchronous Breach</span>
            <p>{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <XCircle size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
