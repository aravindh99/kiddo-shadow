import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Users,
  Trash2,
  Edit,
  Loader2,
  X,
  LayoutGrid,
  List,
  Link as LinkIcon,
  UserPlus,
  ChevronRight,
  School,
  ArrowLeft
} from "lucide-react";

import "./Parents.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SuccessModal from "@/components/SuccessModal";
import { useLocation } from "react-router-dom";

import {
  getParents,
  createParent,
  linkParent,
  getParentOptions,
  updateParent,
  deleteParent,
} from "./parents.js";

// We need to fetch students to link them
import { getStudents } from "../students/Students.js";
import { getClasses, getSectionsByClass } from "../classes/class";

export default function Parents() {
  const location = useLocation();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  /* NAVIGATION STATE */
  const [viewLevel, setViewLevel] = useState("classes"); // 'classes' | 'sections' | 'list'
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  /* DYNAMIC DATA STATE */
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingNav, setLoadingNav] = useState(false);

  // Data for Dropdowns
  const [studentOptions, setStudentOptions] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState("table");

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal Mode: "create" | "link"
  const [modalTab, setModalTab] = useState("create");

  const [form, setForm] = useState({
    username: "",
    student_id: "",
    relation_type: "father",
    parent_user_id: "",
  });

  /* ================= FETCH DATA ================= */
  const loadParents = async () => {
    try {
      setLoading(true);
      const res = await getParents();
      setParents(res?.items || []);
    } catch {
      setError("Synchronization failed. Registry unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [studentsRes, parentsRes] = await Promise.all([
        getStudents(),
        getParentOptions(),
      ]);
      const sList = Array.isArray(studentsRes) ? studentsRes : studentsRes?.items || [];
      setStudentOptions(sList);
      setParentOptions(parentsRes || []);
    } catch (e) {
      console.error("Failed to load registry options", e);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await getClasses();
      const list = res.items || res.data || [];
      setClasses(list);
    } catch (e) {
      console.error("Failed to load classes", e);
    }
  };

  const fetchSections = async (classId) => {
    try {
      setLoadingNav(true);
      const list = await getSectionsByClass(classId);
      setSections(list);
    } catch (e) {
      console.error("Failed to load sections", e);
      setSections([]);
    } finally {
      setLoadingNav(false);
    }
  };

  useEffect(() => {
    loadParents();
    loadOptions();
    fetchClasses();
  }, []);

  /* ================= NAVIGATION HANDLERS ================= */
  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
    fetchSections(cls.id);
    setViewLevel("sections");
  };

  const handleSectionSelect = (sec) => {
    setSelectedSection(sec);
    setViewLevel("list");
    setCurrentPage(1); // Reset pagination
  };

  const handleBack = () => {
    if (viewLevel === "list") {
      setViewLevel("sections");
      setSelectedSection(null);
    } else if (viewLevel === "sections") {
      setViewLevel("classes");
      setSelectedClass(null);
      setSections([]);
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (editingId) {
        if (!form.username) throw new Error("Identifier required for update");
        await updateParent(editingId, { username: form.username });
        setSuccess("Registry profile updated successfully");
      } else {
        if (modalTab === "create") {
          if (!form.student_id) throw new Error("Student link required");
          if (!form.relation_type) throw new Error("Relation type required");

          const payload = {
            student_id: Number(form.student_id),
            relation_type: form.relation_type,
          };
          if (form.username) payload.username = form.username;

          await createParent(payload);
          setSuccess("New profile authorized and linked");
        } else {
          if (!form.parent_user_id) throw new Error("Parent profile required");
          if (!form.student_id) throw new Error("Student link required");
          if (!form.relation_type) throw new Error("Relation type required");

          const payload = {
            parent_user_id: Number(form.parent_user_id),
            student_id: Number(form.student_id),
            relation_type: form.relation_type,
          };
          await linkParent(payload);
          setSuccess("Registry linkage finalized");
        }
      }
      resetForm();
      loadParents();
    } catch (e) {
      setError(e?.message || "Protocol execution failure");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ username: "", student_id: "", relation_type: "father", parent_user_id: "", });
    setEditingId(null);
    setOpen(false);
    setModalTab("create");
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setForm({
      username: p.user?.username || "",
      student_id: "",
      relation_type: p.relation_type || "father",
      parent_user_id: "",
    });
    setModalTab("create");
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Decommission this registry profile?")) return;
    try {
      await deleteParent(id);
      loadParents();
    } catch (err) {
      setError("Decommissioning failed.");
    }
  };

  // Filter parents
  const filtered = parents.filter((p) =>
    p.user?.username?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const valA = a.user?.username || "";
    const valB = b.user?.username || "";
    return valA.localeCompare(valB, undefined, { numeric: true });
  });

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* ================= RENDER HELPERS ================= */
  const renderBreadcrumbs = () => (
    <div className="breadcrumbs">
      <span onClick={() => { setViewLevel("classes"); setSelectedClass(null); setSelectedSection(null); }} className="breadcrumb-link">
        Registry
      </span>
      {selectedClass && (
        <>
          <ChevronRight size={14} />
          <span onClick={() => { setViewLevel("sections"); setSelectedSection(null); }} className="breadcrumb-link">
            {selectedClass.name || selectedClass.class_name}
          </span>
        </>
      )}
      {selectedSection && (
        <>
          <ChevronRight size={14} />
          <span className="breadcrumb-current">Section {selectedSection.name}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="parents-page-wrapper">
      <header className="premium-command-bar reveal-up">
        <div className="ai-scanner-line" />
        <div className="header-info">
          {viewLevel !== "classes" && (
            <button onClick={handleBack} className="back-nav-btn" style={{ marginLeft: '-12px', marginRight: '12px' }}>
              <ArrowLeft size={18} color="var(--p-accent)" />
            </button>
          )}
          <h1 className="glitch-text tech-readout" data-text="Guardian Intelligence Node">Guardian Intelligence Node</h1>
          <p className="tech-readout" style={{ fontSize: '0.65rem', marginTop: '4px' }}>Secondary institutional stakeholders and student linkages.</p>
        </div>
        <div className="header-actions">
          {renderBreadcrumbs()}
          <Button onClick={() => setOpen(true)} className="enroll-btn-premium scifi-glass-card" style={{ background: 'var(--sb-nav-active)', color: 'white', border: 'none', padding: '0 24px', marginLeft: '24px' }}>
            <UserPlus size={18} className="mr-2" /> <span className="tech-readout">Authorize Nexus</span>
          </Button>
        </div>
      </header>

      {error && <div className="error-alert">{error}</div>}

      {/* VIEW: CLASSES */}
      {viewLevel === "classes" && (
        <div className="selection-view-container animate-fade-in">
          <h2 className="selection-title">Select Academic Grade</h2>
          <div className="selection-grid">
            {classes.map((cls, idx) => (
              <div key={cls.id} className={`selection-card scifi-glass-card reveal-up stagger-${idx + 1}`} onClick={() => handleClassSelect(cls)}>
                <div className="ai-scanner-line" />
                <div className="selection-icon-box hologram-flicker">
                  <School size={32} color="var(--p-accent)" />
                </div>
                <h3 className="tech-readout font-bold">{cls.name || cls.class_name}</h3>
                <p className="tech-readout" style={{ fontSize: '0.65rem' }}>View Sections & Guardians</p>
                <div className="selection-arrow">
                  <ChevronRight size={20} color="var(--p-accent)" />
                </div>
              </div>
            ))}
            {classes.length === 0 && (
              <div className="empty-selection-msg">No academic grades found.</div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: SECTIONS */}
      {viewLevel === "sections" && (
        <div className="selection-view-container animate-fade-in">
          <h2 className="selection-title">Select Division for {selectedClass?.name || selectedClass?.class_name}</h2>
          {loadingNav ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="selection-grid">
              {sections.map((sec, idx) => (
                <div key={sec.id} className={`selection-card scifi-glass-card reveal-up stagger-${idx + 1}`} onClick={() => handleSectionSelect(sec)}>
                  <div className="ai-scanner-line" />
                  <div className="selection-icon-box purple hologram-flicker">
                    <LayoutGrid size={32} color="#a855f7" />
                  </div>
                  <h3 className="tech-readout font-bold">Section {sec.name}</h3>
                  <p className="tech-readout" style={{ fontSize: '0.65rem' }}>View Guardian List</p>
                  <div className="selection-arrow">
                    <ChevronRight size={20} color="#a855f7" />
                  </div>
                </div>
              ))}
              {sections.length === 0 && (
                <div className="empty-selection-msg">No active divisions found for this grade.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: PARENT LIST */}
      {viewLevel === "list" && (
        <div className="parent-list-view animate-fade-in">
          <div className="parents-filter-row scifi-glass-card" style={{ padding: '16px 24px', borderRadius: '16px', marginBottom: '24px' }}>
            <div className="ai-scanner-line" />
            <div className="parents-search-wrap">
              <Search size={18} color="var(--p-accent)" />
              <input
                className="tech-readout"
                placeholder="SCANNING GUARDIAN ENTITIES..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="parents-view-toggle">
              <button className={`parents-toggle-btn ${viewMode === "card" ? "active" : ""}`} onClick={() => setViewMode("card")}><LayoutGrid size={18} /></button>
              <button className={`parents-toggle-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}><List size={18} /></button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state-premium">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="mt-4 font-semibold text-slate-500">Synchronizing Registry...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state-premium">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p>No matching registry entities identified in {selectedClass?.name || selectedClass?.class_name} - Section {selectedSection?.name}.</p>
            </div>
          ) : (
            <div className="content-reveal-wrapper">
              {viewMode === "card" ? (
                <div className="parent-grid-premium">
                  {paginatedItems.map((p, idx) => (
                    <div key={p.id} className={`parent-card-premium scifi-glass-card reveal-up stagger-${idx + 1}`}>
                      <div className="ai-scanner-line" />
                      <div className="card-top">
                        <div className="parent-avatar-box hologram-flicker">
                          <Users size={20} color="var(--p-accent)" />
                        </div>
                        <div className="parent-info-main">
                          <h3 className="tech-readout font-bold">{p.user?.username}</h3>
                          <div className="ai-status-pulse" />
                        </div>
                      </div>
                      <div className="card-details-box">
                        <div className="detail-item">
                          <span className="label tech-readout">Linked Affiliate</span>
                          <span className="value tech-readout font-bold" style={{ color: 'var(--p-accent)' }}>{p.student?.user?.name || "N/A"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label tech-readout">Academic Cluster</span>
                          <span className="value tech-readout">{p.student?.class?.class_name || p.student?.class?.name} - {p.student?.section?.name}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label tech-readout">Registration Epoch</span>
                          <span className="value tech-readout">{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="card-footer-actions">
                        <Button variant="ghost" className="edit-btn tech-readout" onClick={() => handleEdit(p)}>
                          <Edit size={14} className="mr-2" /> CONFIGURE
                        </Button>
                        <Button variant="ghost" className="delete-btn tech-readout" onClick={() => handleDelete(p.id)}>
                          <Trash2 size={14} className="mr-2" /> TERMINATE
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="table-container-premium">
                  <table className="parents-table">
                    <thead>
                      <tr>
                        <th>Guardian Identity</th>
                        <th>Linked Student</th>
                        <th>Status</th>
                        <th>Registry Date</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="cell-with-icon">
                              <div className="item-icon-small"><Users size={14} /></div>
                              <span className="font-bold">{p.user?.username}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{p.student?.user?.name || "N/A"}</span>
                              <span className="text-[10px] text-blue-600 font-bold uppercase">{p.student?.class?.class_name || p.student?.class?.name} • Section {p.student?.section?.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${p.user?.is_active ? "active" : "inactive"}`}>
                              {p.user?.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <div className="table-row-actions">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Edit size={14} /></Button>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></Button>
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
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="rounded-lg h-9"
                    >
                      Previous
                    </Button>
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(i + 1)}
                        className={`rounded-lg w-9 h-9 p-0 ${currentPage === i + 1 ? 'bg-blue-600 text-white' : ''}`}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="rounded-lg h-9"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="modal-backdrop" onClick={resetForm}>
          <div className="modal-container-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="title-info">
                <h2>{editingId ? "Update Identity" : "Authorize Guardian"}</h2>
                <p>{editingId ? "Modify registry details" : "Create or link stakeholder profile"}</p>
              </div>
              <button className="close-x-btn" onClick={resetForm}><X size={20} /></button>
            </div>
            {!editingId && (
              <div className="modal-tabs-premium">
                <button className={`tab-btn ${modalTab === "create" ? "active" : ""}`} onClick={() => setModalTab("create")}><Plus size={14} className="mr-2 inline" /> Create Profile</button>
                <button className={`tab-btn ${modalTab === "link" ? "active" : ""}`} onClick={() => setModalTab("link")}><LinkIcon size={14} className="mr-2 inline" /> Link Registry</button>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="modal-form-scroll">
                {modalTab === "create" && (
                  <>
                    {!editingId && (
                      <>
                        <div className="form-group">
                          <Label>Dependent Learner *</Label>
                          <select className="modal-input-premium" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
                            <option value="">Select Student</option>
                            {studentOptions.map(s => <option key={s.id} value={s.id}>{s.user?.name || s.admission_no} ({s.admission_no})</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <Label>Relation Logic *</Label>
                          <select className="modal-input-premium" value={form.relation_type} onChange={(e) => setForm({ ...form, relation_type: e.target.value })}>
                            <option value="father">Paternal</option>
                            <option value="mother">Maternal</option>
                            <option value="guardian">Legal Guardian</option>
                          </select>
                        </div>
                      </>
                    )}
                    {editingId && (
                      <div className="form-group">
                        <Label>Registry Identifier *</Label>
                        <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="modal-input-premium" />
                      </div>
                    )}
                  </>
                )}
                {modalTab === "link" && !editingId && (
                  <>
                    <div className="form-group">
                      <Label>Existing Profile *</Label>
                      <select className="modal-input-premium" value={form.parent_user_id} onChange={(e) => setForm({ ...form, parent_user_id: e.target.value })}>
                        <option value="">Select Identity</option>
                        {parentOptions.map(p => <option key={p.id} value={p.id}>{p.name} ({p.username})</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <Label>Dependent Learner *</Label>
                      <select className="modal-input-premium" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
                        <option value="">Select Student</option>
                        {studentOptions.map(s => <option key={s.id} value={s.id}>{s.user?.name || s.admission_no}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <Label>Relation Logic *</Label>
                      <select className="modal-input-premium" value={form.relation_type} onChange={(e) => setForm({ ...form, relation_type: e.target.value })}>
                        <option value="father">Paternal</option>
                        <option value="mother">Maternal</option>
                        <option value="guardian">Legal Guardian</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer-premium">
                <Button type="button" variant="ghost" onClick={resetForm} className="cancel-btn">Abort</Button>
                <Button type="submit" disabled={saving} className="submit-btn-premium bg-blue-600 hover:bg-blue-700">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : editingId ? "Update" : "Authorize"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SuccessModal
        isOpen={!!success}
        onClose={() => setSuccess(null)}
        title="Protocol Confirmed"
        message={success}
      />
    </div>
  );
}
