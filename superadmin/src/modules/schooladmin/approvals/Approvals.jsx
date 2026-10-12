import React, { useEffect, useState } from "react";
import {
  ClipboardCheck,
  ClipboardList,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Backpack,
  User,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SuccessModal from "../../../components/SuccessModal";
import "./Approvals.css";

import {
  getPendingStudentApprovals,
  getPendingAdminApprovals,
  processTeacherApproval,
  processAdminApproval,
} from "./Approvals.js";

export default function Approvals() {
  const [studentApprovals, setStudentApprovals] = useState([]);
  const [teacherApprovals, setTeacherApprovals] = useState([]);
  const [parentApprovals, setParentApprovals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("students");

  // Selection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectItem, setRejectItem] = useState(null); // { type, id, name }
  const [rejectReason, setRejectReason] = useState("");

  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [processing, setProcessing] = useState(false);

  /* ================= FETCH ENGINE ================= */
  const loadApprovals = async () => {
    setLoading(true);
    const role = localStorage.getItem("role") || "";

    try {
      let students = [];
      let adminData = { teachers: [], parents: [] };

      if (role === "teacher") {
        // Teachers: Only fetch student approvals
        students = await getPendingStudentApprovals();
      } else if (role === "school_admin" || role === "schooladmin") {
        // Admins: Fetch teacher/parent approvals AND student approvals if they aren't separately fetched
        adminData = await getPendingAdminApprovals();
        // Fallback: If your system uses student approvals in Admin center, 
        // they might come from getPendingStudentApprovals OR a separate field.
        // Assuming students are purely for teachers or specifically scoped.
      }

      const studentList = students || [];

      setStudentApprovals(studentList);
      setTeacherApprovals(adminData?.teachers || []);
      setParentApprovals(adminData?.parents || []);

      // Logical default tab selection
      if (studentList.length > 0 && activeTab === "") setActiveTab("students");
      else if (adminData?.teachers?.length > 0 && activeTab === "") setActiveTab("teachers");
      else if (adminData?.parents?.length > 0 && activeTab === "") setActiveTab("parents");

    } catch (err) {
      console.error(err);
      setErrorMsg("Synchronization failed. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  /* ================= INTERACTION HANDLERS ================= */
  const handleApprove = async (type, id) => {
    setProcessing(true);
    try {
      if (type === "student") {
        await processTeacherApproval("student", id, "approve");
      } else {
        await processAdminApproval(type, id, "approve");
      }
      setSuccessMsg(`Requested approval for registry entry #${id} granted.`);
      loadApprovals();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Internal protocol error.");
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (type, id, name) => {
    setRejectItem({ type, id, name });
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectItem) return;

    setProcessing(true);
    try {
      if (rejectItem.type === "student") {
        await processTeacherApproval("student", rejectItem.id, "reject", rejectReason);
      } else {
        await processAdminApproval(rejectItem.type, rejectItem.id, "reject", rejectReason);
      }
      setSuccessMsg(`Request for ${rejectItem.name} has been decommissioned.`);
      setRejectModalOpen(false);
      setRejectItem(null);
      loadApprovals();
    } catch (err) {
      setRejectModalOpen(false);
      setErrorMsg(err?.response?.data?.message || err?.message || "Rejection synchronization failed.");
    } finally {
      setProcessing(false);
    }
  };

  /* ================= SUB-COMPONENTS ================= */
  const ApprovalCard = ({ item, type }) => {
    const name = item.user?.name || "Pending Identity";
    const sub = item.user?.email || item.user?.username || "Registry Detail";

    return (
      <div className="approval-premium-card scifi-glass-card reveal-up">
        <div className="ai-scanner-line" />
        <div>
          <div className="card-top">
            <div className="avatar-platinum hologram-flicker" style={{ background: 'var(--p-accent-glow)', border: '1px solid var(--scifi-border)' }}>
              {type === "student" && <Backpack size={24} color="var(--p-accent)" />}
              {type === "teacher" && <Users size={24} color="var(--p-accent)" />}
              {type === "parent" && <User size={24} color="var(--p-accent)" />}
            </div>
            <div className="user-info-box">
              <h3 className="tech-readout font-bold">{name}</h3>
              <span className="sub tech-readout" style={{ opacity: 0.6 }}>{sub}</span>
            </div>
          </div>

          <div className="details-strip" style={{ background: 'var(--p-scan-line)', border: '1px solid var(--scifi-border)', borderRadius: '16px', padding: '16px' }}>
            {type === "student" && (
              <>
                <div className="detail-item">
                  <span className="detail-label tech-readout">CLUSTER</span>
                  <span className="detail-value tech-readout font-bold">{item.class_name || item.class_id || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label tech-readout">DIVISION</span>
                  <span className="detail-value tech-readout font-bold">{item.section_name || item.section_id || "N/A"}</span>
                </div>
              </>
            )}
            {type === "teacher" && (
              <>
                <div className="detail-item">
                  <span className="detail-label tech-readout">DOMAIN</span>
                  <span className="detail-value tech-readout font-bold">{item.subject || "ALL DISCIPLINES"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label tech-readout">EXPERIENCE</span>
                  <span className="detail-value tech-readout font-bold">{item.experience || "NEW PROFILE"}</span>
                </div>
              </>
            )}
            {type === "parent" && (
              <>
                <div className="detail-item">
                  <span className="detail-label tech-readout">COMM-LINK</span>
                  <span className="detail-value tech-readout font-bold">{item.user?.phone || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label tech-readout">DEPENDENT</span>
                  <span className="detail-value tech-readout font-bold">{item.student_name || "SELF-REG"}</span>
                </div>
              </>
            )}
            <div className="detail-item">
              <span className="detail-label tech-readout">NODE ID</span>
              <span className="detail-value tech-readout font-bold">#{item.id}</span>
            </div>
          </div>
        </div>

        <div className="card-actions-premium" style={{ borderTop: '1px solid var(--scifi-border)', paddingTop: '20px', marginTop: 'auto' }}>
          <button
            className="approve-btn-premium tech-readout"
            style={{ flex: 1, height: '40px', background: 'var(--p-accent-glow)', color: 'var(--p-accent)', border: '1px solid var(--scifi-border)', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => handleApprove(type, item.id)}
            disabled={processing}
          >
            <CheckCircle size={14} /> AUTHORIZE
          </button>
          <button
            className="reject-btn-premium tech-readout"
            style={{ flex: 1, height: '40px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => openRejectModal(type, item.id, name)}
            disabled={processing}
          >
            <XCircle size={14} /> DECLINE
          </button>
        </div>
      </div>
    );
  };

  const EmptyState = ({ tabName }) => (
    <div className="empty-illustration-box">
      <div className="empty-icon-wrap">
        <ClipboardList size={40} />
      </div>
      <h3>Registry Clear</h3>
      <p>All pending {tabName} requests have been successfully processed.</p>
    </div>
  );

  /* ================= MAIN UI ================= */
  return (
    <div className="approvals-page-premium">
      <header className="premium-command-bar reveal-up">
        <div className="ai-scanner-line" />
        <div className="header-info">
          <h1 className="glitch-text tech-readout" data-text="Verification Protocol Cluster">Verification Protocol Cluster</h1>
          <p className="tech-readout" style={{ fontSize: '0.65rem', marginTop: '4px' }}>Review and authorize institutional registry requests.</p>
        </div>
        <div className="header-action">
          <Button variant="ghost" className="scifi-glass-card tech-readout" style={{ height: '44px', padding: '0 24px', background: 'var(--p-scan-line)', border: '1px solid var(--scifi-border)', borderRadius: '12px' }} onClick={loadApprovals}>
            <RefreshCw className={loading ? "animate-spin" : "mr-2"} size={16} />
            {loading ? "SYNCING..." : "RECONSTRUCT QUEUE"}
          </Button>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="premium-tabs">
        <button
          className={`premium-tab-btn ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          <Backpack size={16} />
          Students
          <span className="count-badge-pill">{studentApprovals?.length || 0}</span>
        </button>
        <button
          className={`premium-tab-btn ${activeTab === "teachers" ? "active" : ""}`}
          onClick={() => setActiveTab("teachers")}
        >
          <Users size={16} />
          Teachers
          <span className="count-badge-pill">{teacherApprovals?.length || 0}</span>
        </button>
        <button
          className={`premium-tab-btn ${activeTab === "parents" ? "active" : ""}`}
          onClick={() => setActiveTab("parents")}
        >
          <User size={16} />
          Parents
          <span className="count-badge-pill">{parentApprovals?.length || 0}</span>
        </button>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="loading-state-premium">
          <Loader2 className="animate-spin" size={32} />
          <p>Analyzing Registry...</p>
        </div>
      ) : (
        <div className="approvals-container">
          {activeTab === "students" && (
            studentApprovals?.length > 0 ? (
              <div className="approvals-grid">
                {studentApprovals.map(item => <ApprovalCard key={item.id} item={item} type="student" />)}
              </div>
            ) : <EmptyState tabName="Students" />
          )}

          {activeTab === "teachers" && (
            teacherApprovals?.length > 0 ? (
              <div className="approvals-grid">
                {teacherApprovals.map(item => <ApprovalCard key={item.id} item={item} type="teacher" />)}
              </div>
            ) : <EmptyState tabName="Teachers" />
          )}

          {activeTab === "parents" && (
            parentApprovals?.length > 0 ? (
              <div className="approvals-grid">
                {parentApprovals.map(item => <ApprovalCard key={item.id} item={item} type="parent" />)}
              </div>
            ) : <EmptyState tabName="Parents" />
          )}
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectModalOpen && (
        <div className="premium-modal-overlay" onClick={() => !processing && setRejectModalOpen(false)}>
          <div className="premium-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-section">
              <div>
                <h2 className="modal-title-premium">Decline Request</h2>
                <p className="modal-subtitle-premium">Rejecting identity: <strong>{rejectItem?.name}</strong></p>
              </div>
              <button className="close-modal-btn" onClick={() => setRejectModalOpen(false)}>
                <XCircle size={20} />
              </button>
            </div>

            <div className="announcement-form-premium">
              <div className="form-group-premium">
                <Label className="mb-2 block text-xs font-bold uppercase text-slate-500">Reason for Rejection</Label>
                <textarea
                  className="premium-input-minimal"
                  style={{ minHeight: '100px' }}
                  placeholder="e.g. Identity verification failed..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={processing}
                />
              </div>

              <div className="modal-footer-premium">
                <Button variant="ghost" className="cancel-btn-premium h-11" onClick={() => setRejectModalOpen(false)} disabled={processing}>
                  Terminate
                </Button>
                <Button className="execute-btn-premium h-11 bg-red-500 hover:bg-red-600" onClick={handleRejectSubmit} disabled={processing}>
                  {processing ? <Loader2 className="animate-spin" /> : "Decline Entry"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK SYSTEM */}
      <SuccessModal
        isOpen={!!successMsg}
        onClose={() => setSuccessMsg(null)}
        title="Protocol Confirmed"
        message={successMsg}
      />

      {errorMsg && (
        <div className="toast-premium error">
          <AlertCircle size={20} />
          <div>
            <span>Protocol Breach</span>
            <p>{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <XCircle size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
