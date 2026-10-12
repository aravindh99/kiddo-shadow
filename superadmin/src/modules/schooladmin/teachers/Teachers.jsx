import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  User,
  Trash2,
  Edit,
  Loader2,
  X,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import "./Teachers.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SuccessModal from "@/components/SuccessModal";
import { useLocation } from "react-router-dom";

import {
  getTeachers,
  createTeacher,
  updateTeacherStatus,
  deleteTeacher,
} from "./Teachers.js";

export default function Teachers() {
  const location = useLocation();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (location.state?.showAdd) {
      setOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  const [editingId, setEditingId] = useState(null);

  /* FORM STATE */
  const [form, setForm] = useState({
    name: "",
    is_active: true,
  });

  const [saving, setSaving] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState("table");

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ================= FETCH ================= */
  const loadTeachers = async () => {
    try {
      setLoading(true);
      const res = await getTeachers();
      setTeachers(res.items || []);
    } catch {
      setError("Synchronization failure. Registry unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (editingId) {
        const res = await updateTeacherStatus(
          editingId,
          form.is_active
        );

        // Update local state with full record
        setTeachers(prev => prev.map(t =>
          t.id === editingId ? { ...res.teacher } : t
        ));

        setSuccessData({
          title: "Update Executed",
          message: "Faculty record updated successfully",
        });
      } else {
        const res = await createTeacher();
        setSuccessData({
          title: "Faculty Provisioned",
          message: "New faculty provisioned successfully",
          credentials: {
            username: res.username,
            employee_id: res.employee_id,
            password: res.password_hint
          }
        });
        await loadTeachers(); // Refresh list only on create
      }
      resetForm();
    } catch (e) {
      setError(e?.message || "Operation failure");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", is_active: true });
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setForm({
      username: t.user?.username || "",
      is_active: t.is_active ?? true
    });
    setOpen(true);
  };

  const toggleStatus = async (teacher) => {
    const res = await updateTeacherStatus(
      teacher.id,
      !teacher.is_active
    );

    setTeachers((prev) =>
      prev.map((t) =>
        t.id === teacher.id ? res.teacher : t
      )
    );
  };

  const handleDelete = async (teacher) => {
    if (!confirm("Decommission this faculty record permanently?")) return;
    try {
      await deleteTeacher(teacher.id);
      setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setSuccessData({
        title: "Record Decommissioned",
        message: "Faculty profile has been terminated.",
      });
    } catch (e) {
      setError("Decommissioning failed.");
    }
  };


  /* ================= FILTER & PAGINATION ================= */
  const filtered = teachers.filter((t) =>
    t.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.employee_id?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const valA = a.user?.username || a.employee_id || "";
    const valB = b.user?.username || b.employee_id || "";
    return valA.localeCompare(valB, undefined, { numeric: true });
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Helper to remove 'EMP-' prefix for cleaner display
  const cleanEmpId = (id) => id?.replace(/^EMP-/, "") || "N/A";

  return (
    <div className="teachers-page-wrapper">
      <header className="premium-command-bar reveal-up">
        <div className="ai-scanner-line" />
        <div className="header-info">
          <h1 className="glitch-text tech-readout" data-text="Faculty Intelligence Node">Faculty Intelligence Node</h1>
          <p className="tech-readout" style={{ fontSize: '0.65rem', marginTop: '4px' }}>Institutional professional records and authorization status.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="enroll-btn-premium scifi-glass-card" style={{ background: 'var(--sb-nav-active)', color: 'white', border: 'none', padding: '0 24px' }}>
          <Plus size={18} className="mr-2" /> <span className="tech-readout">Provision Entity</span>
        </Button>
      </header>

      {error && <div className="error-alert">{error}</div>}

      <div className="teachers-filter-row scifi-glass-card" style={{ padding: '16px 24px', borderRadius: '16px', marginBottom: '24px' }}>
        <div className="ai-scanner-line" />
        <div className="teachers-search-wrap">
          <Search size={18} color="var(--p-accent)" />
          <input
            className="tech-readout"
            placeholder="ACCESSING NODE DATA..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="teachers-view-toggle">
          <button className={`teachers-toggle-btn ${viewMode === "card" ? "active" : ""}`} onClick={() => setViewMode("card")} title="Card View">
            <LayoutGrid size={18} />
          </button>
          <button className={`teachers-toggle-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")} title="Table View">
            <List size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state-premium">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="mt-4 font-semibold text-slate-500">Synchronizing Faculty Records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-premium">
          <User size={48} className="mx-auto mb-4 opacity-20" />
          <p>No matching faculty entries identified.</p>
        </div>
      ) : (
        <div className="content-reveal-wrapper">
          {viewMode === "card" ? (
            <div className="teacher-grid-premium">
              {paginatedItems.map((t, idx) => (
                <div key={t.id} className={`teacher-card-premium scifi-glass-card reveal-up stagger-${idx + 1}`}>
                  <div className="ai-scanner-line" />
                  <div className="card-top">
                    <div className="teacher-avatar-box hologram-flicker">
                      <div className="avatar-content tech-readout font-bold" style={{ color: 'var(--p-accent)' }}>
                        {t.user?.name ? t.user.name.charAt(0).toUpperCase() : <User size={20} />}
                      </div>
                    </div>
                    <div className="teacher-info-main">
                      <h3 className="tech-readout font-bold">{t.user?.name || "Unassigned Name"}</h3>
                      <p className="tech-readout" style={{ fontSize: '0.65rem' }}>ID: {cleanEmpId(t.employee_id)}</p>
                    </div>
                    <div className="ai-status-pulse" title={t.is_active ? "Authorized" : "Deactivated"} />
                  </div>
                  <div className="card-details-box">
                    <div className="detail-item">
                      <span className="label tech-readout">Registry Date</span>
                      <span className="value tech-readout">{t.joining_date || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label tech-readout">Permission Level</span>
                      <span className="value tech-readout">{t.is_active ? "AUTHORIZED" : "SUSPENDED"}</span>
                    </div>
                  </div>
                  <div className="card-footer-actions">
                    <Button variant="ghost" className="edit-btn tech-readout" onClick={() => handleEdit(t)}>
                      <Edit size={14} className="mr-2" /> CONFIGURE
                    </Button>
                    <Button variant="ghost" onClick={() => toggleStatus(t)} className={t.is_active ? "text-cyan-400" : "text-slate-500"}>
                      {t.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      <span className="ml-2 tech-readout">{t.is_active ? "SYNCED" : "OFFLINE"}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-container-premium">
              <table className="teachers-table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Employee ID</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="cell-with-icon">
                          <div className="item-icon-small">
                            {t.user?.name ? t.user.name.charAt(0).toUpperCase() : <User size={14} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{t.user?.name || "Unknown"}</span>
                            <span className="text-[10px] text-slate-400 font-mono italic">{cleanEmpId(t.employee_id)}</span>
                          </div>
                        </div>
                      </td>
                      <td>{cleanEmpId(t.employee_id)}</td>
                      <td>
                        <span className={`status-badge ${t.is_active ? "status-active" : "status-inactive"}`}>
                          {t.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{t.joining_date || "N/A"}</td>
                      <td className="text-right">
                        <div className="table-row-actions">
                          <Button variant="ghost" size="sm" onClick={() => toggleStatus(t)} title="Toggle Status">
                            {t.user?.is_active ? <CheckCircle2 size={16} className="text-green-600" /> : <XCircle size={16} />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}><Edit size={16} /></Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(t)}><Trash2 size={16} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="pagination-footer-premium">
              <div className="pagination-info">
                Showing entries {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
              </div>
              <div className="pagination-controls">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-lg h-9">Previous</Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button key={i + 1} variant={currentPage === i + 1 ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(i + 1)}
                    className={`rounded-lg w-9 h-9 p-0 ${currentPage === i + 1 ? 'bg-blue-600 text-white' : ''}`}>
                    {i + 1}
                  </Button>
                ))}
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-lg h-9">Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="modal-backdrop" onClick={resetForm}>
          <div className="modal-container-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="title-info">
                <h2>{editingId ? "Update Faculty" : "Provision Faculty"}</h2>
                <p>{editingId ? "Configure institutional professional record parameters." : "Initiate automated faculty provisioning protocol."}</p>
              </div>
              <button className="close-x-btn" onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-form-scroll">
                {!editingId ? (
                  <div className="provision-prompt">
                    <div className="prompt-icon-box">
                      <User size={32} className="text-blue-600" />
                    </div>
                    <p>Are you sure you want to provision a new faculty member? The system will automatically generate a unique <strong>Username</strong>, <strong>Employee ID</strong>, and temporary <strong>Password</strong>.</p>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <Label>Registry Username</Label>
                      <input
                        className="modal-input-premium"
                        type="text"
                        placeholder="Username"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <Label>Institutional Status</Label>
                      <select
                        className="modal-input-premium"
                        value={String(form.is_active)}
                        onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}
                      >
                        <option value="true">Active / Authorized</option>
                        <option value="false">Deactivated / Suspended</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer-premium">
                <Button type="button" variant="ghost" onClick={resetForm} className="cancel-btn">Abort</Button>
                <Button type="submit" disabled={saving} className="submit-btn-premium bg-blue-600 hover:bg-blue-700">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : editingId ? "Execute Update" : "Confirm Provisioning"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SuccessModal
        isOpen={!!successData}
        onClose={() => setSuccessData(null)}
        title={successData?.title}
        message={
          <div className="success-content-wrapper">
            <p className="mb-4">{successData?.message}</p>
            {successData?.credentials && (
              <div className="credentials-leak-box">
                <div className="cred-item">
                  <span className="cred-label">Username</span>
                  <span className="cred-value font-mono">{successData.credentials.username}</span>
                </div>
                <div className="cred-item">
                  <span className="cred-label">Employee ID</span>
                  <span className="cred-value font-mono">{successData.credentials.employee_id}</span>
                </div>
                <div className="cred-item">
                  <span className="cred-label">Temp Password</span>
                  <span className="cred-value font-mono">{successData.credentials.password}</span>
                </div>
                <p className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-wider">Please share these credentials with the faculty member securely.</p>
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}
