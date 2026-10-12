import React, { useEffect, useState, useCallback } from "react";
import "./ReportCards.css";
import {
  FileText,
  Plus,
  Eye,
  Loader2,
  Search,
  RefreshCw,
  XCircle,
  Printer,
  TrendingUp,
  Award,
  BookOpen,
  User,
  CheckCircle2,
  AlertCircle,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  listReportCards,
  getReportCardById,
  createReportCard,
  addReportMarks,
  publishReportCard
} from "./ReportCards";

export default function ReportCards() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [search, setSearch] = useState("");

  const [modalType, setModalType] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [createForm, setCreateForm] = useState({ student_id: "", exam_id: "" });
  const [marksForm, setMarksForm] = useState([
    { subject_id: "", marks_obtained: "", max_marks: 100 }
  ]);
  const [remarks, setRemarks] = useState("");

  /* ================= LOAD DATA ================= */
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listReportCards(); // POST
      setReports(data || []);
    } catch (err) {
      setErrorMsg("Failed to synchronize academic registry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  /* ================= HANDLERS ================= */

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createReportCard(createForm);
      setSuccessMsg("Academic registry initialized successfully.");
      setModalType(null);
      loadReports();
    } catch (err) {
      setErrorMsg("Initialization breach. Verify parameters.");
    } finally {
      setActionLoading(false);
    }
  };

  const openMarksEntry = (report) => {
    setSelectedReport(report);
    setMarksForm(
      report.marks?.length
        ? report.marks
        : [{ subject_id: "", marks_obtained: "", max_marks: 100 }]
    );
    setModalType("marks");
  };

  const handleMarksSubmit = async () => {
    setActionLoading(true);
    try {
      await addReportMarks(selectedReport.id, marksForm);
      setSuccessMsg("Scholastic metrics recorded.");
      setModalType(null);
      loadReports();
    } catch (err) {
      setErrorMsg("Failed to encrypt academic metrics.");
    } finally {
      setActionLoading(false);
    }
  };



  const handlePublish = async (id) => {
    setActionLoading(true);
    try {
      await publishReportCard(id, remarks);
      setSuccessMsg("Transcript disseminated successfully.");
      setModalType(null);
      loadReports();
    } catch (err) {
      setErrorMsg("Dissemination protocol failure.");
    } finally {
      setActionLoading(false);
    }
  };

  const openView = async (id) => {
    setActionLoading(true);
    try {
      const data = await getReportCardById(id); // POST
      setSelectedReport(data);
      setModalType("view");
    } catch (err) {
      setErrorMsg("Trace protocol failed for record ID.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReports = reports.filter((r) =>
    r.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.id?.toString().includes(search)
  );

  return (
    <div className="report-page-premium">

      {/* HEADER */}
      <header className="page-header-premium">
        <div className="header-info">
          <div className="header-icon-box">
            <FileText size={32} />
          </div>
          <div>
            <h1>Academic Transcripts</h1>
            <p>Manage and disseminate scholastic performance registries.</p>
          </div>
        </div>

        <div className="header-actions-premium">
          <Button variant="ghost" onClick={loadReports}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button onClick={() => setModalType("create")}>
            <Plus size={18} className="mr-2" /> Initialize Record
          </Button>
        </div>
      </header>

      {/* SEARCH */}
      <div className="report-filters-bar scifi-glass-card" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
        <div className="ai-scanner-line" />
        <div className="search-wrap-premium tech-readout" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--p-scan-line)', border: '1px solid var(--scifi-border)', borderRadius: '12px', padding: '0 16px' }}>
          <Search size={18} style={{ color: 'var(--p-accent)' }} />
          <Input
            className="tech-readout"
            style={{ border: 'none', background: 'transparent', outline: 'none', height: '44px', width: '100%', color: 'var(--text-main)', fontSize: '0.8rem' }}
            placeholder="Search by student name or transcript ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="report-roster-card scifi-glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
        <div className="ai-scanner-line" />
        {loading ? (
          <div style={{ padding: "120px", textAlign: "center" }}>
            <Loader2 className="animate-spin hologram-flicker" size={48} color="var(--p-accent)" />
            <p className="tech-readout mt-4">SYNCHRONIZING ACADEMIC LOGS...</p>
          </div>
        ) : (
          <table className="report-premium-table">
            <thead>
              <tr>
                <th className="tech-readout">TRANSCRIPT ID</th>
                <th className="tech-readout">STUDENT ENTITY</th>
                <th className="tech-readout">EVALUATION METRIC</th>
                <th className="tech-readout">SYSTEM STATUS</th>
                <th className="tech-readout text-right">OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td className="tech-readout font-bold" style={{ color: 'var(--p-accent)' }}>RC-{report.id}</td>
                  <td className="tech-readout font-bold">{report.student?.full_name || "N/A"}</td>
                  <td className="tech-readout">{report.exam?.name || "STANDARD EVALUATION"}</td>
                  <td>
                    {report.is_published ? (
                      <span className="status-pill published tech-readout font-bold" style={{ background: 'var(--p-accent-glow)', color: 'var(--p-accent)', border: '1px solid var(--scifi-border)' }}>
                        <CheckCircle2 size={12} className="mr-2" /> DISSEMINATED
                      </span>
                    ) : (
                      <span className="status-pill draft tech-readout font-bold" style={{ background: 'var(--p-scan-line)', color: 'var(--text-muted)', border: '1px solid var(--scifi-border)' }}>
                        <AlertCircle size={12} className="mr-2" /> DRAFT_STATE
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => openView(report.id)}>
                      <Eye size={18} />
                    </button>
                    <button onClick={() => openMarksEntry(report)}>
                      <TrendingUp size={18} />
                    </button>
                    {!report.is_published && (
                      <button onClick={() => { setSelectedReport(report); setModalType("publish"); }}>
                        <Send size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                    No academic transcripts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
