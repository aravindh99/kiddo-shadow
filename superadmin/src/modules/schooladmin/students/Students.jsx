import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  User,
  Trash2,
  Loader2,
  X,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  UploadCloud,
  ChevronRight,

  School,
  ArrowLeft
} from "lucide-react";

import "./Students.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SuccessModal from "@/components/SuccessModal";
import { useLocation } from "react-router-dom";

import {
  getStudents,
  createStudent,
  moveStudent,
  updateStudentStatus,
  bulkUploadStudents,
} from "./Students.js";



import { getClasses, getSectionsByClass } from "../classes/class";

export default function Students() {
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);

  /* NAVIGATION STATE */
  const [viewLevel, setViewLevel] = useState("classes"); // 'classes' | 'sections' | 'list'
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  /* DYNAMIC DATA STATE */
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingNav, setLoadingNav] = useState(false);

  useEffect(() => {
    if (location.state?.showAdd) {
      setOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkStudents, setBulkStudents] = useState([{ name: "", username: "", gender: "male" }]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState("table");

  /* PAGINATION STATE */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [form, setForm] = useState({
    name: "",
    username: "",
    gender: "male",
    class_id: "",
    section_id: ""
  });


  const [modalSections, setModalSections] = useState([]);

  const [moveForm, setMoveForm] = useState({
    section_id: "",
  });

  const [moveSections, setMoveSections] = useState([]);

  /* ================= FETCH DATA ================= */
  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await getStudents();
      setStudents(res.items || []);
    } catch {
      setError("Synchronization failure. Student registry unavailable.");
    } finally {
      setLoading(false);
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
      return list;
    } catch (e) {
      console.error("Failed to load sections", e);
      setSections([]);
      return [];
    } finally {
      setLoadingNav(false);
    }
  };

  useEffect(() => {
    loadStudents();
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

  /* ================= SUBMIT CREATE ================= */
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.username || !form.class_id || !form.section_id) {
      setError("Identity and placement parameters are mandatory.");
      return;
    }
    setSaving(true);
    try {
      await createStudent({
        name: form.name,
        username: form.username,
        gender: form.gender,
        class_id: Number(form.class_id),
        section_id: Number(form.section_id),
      });
      setSuccess("New entity successfully enrolled into institutional registry.");
      resetForm();
      loadStudents();
    } catch (e) {
      setError(e?.message || "Enrollment failure.");
    } finally {
      setSaving(false);
    }
  };


  /* ================= SUBMIT MOVE ================= */
  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !moveForm.section_id) {
      setError("Target division selection required.");
      return;
    }
    setSaving(true);
    try {
      await moveStudent(selectedStudent.id, moveForm.section_id);
      setSuccess("Student relocated successfully.");
      setMoveModalOpen(false);
      setSelectedStudent(null);
      setMoveForm({ section_id: "" });
      loadStudents();
    } catch (e) {
      setError(e?.message || "Relocation protocol failed.");
    } finally {
      setSaving(false);
    }
  };

  /* ================= ACTIONS ================= */
  const handleStatusToggle = async (student) => {
    try {
      await updateStudentStatus(student.id, !student.is_active);
      loadStudents();
    } catch (e) {
      setError("Authorization status update failed.");
    }
  };

  /* Deletion functionality removed as per school policy */

  const openMoveModal = (student) => {
    setSelectedStudent(student);
    setMoveForm({ section_id: "" });

    // Pre-fetch sections for the student's class for the move modal
    const cls = classes.find(c => String(c.id) === String(student.class_id || student.class?.id));
    setMoveSections(cls?.sections || []);

    setMoveModalOpen(true);
  };


  /* ================= BULK ACTIONS ================= */
  const addBulkRow = () => {
    setBulkStudents([...bulkStudents, { name: "", username: "", gender: "male" }]);
  };

  const removeBulkRow = (index) => {
    if (bulkStudents.length > 1) {
      setBulkStudents(bulkStudents.filter((_, i) => i !== index));
    }
  };

  const updateBulkRow = (index, field, value) => {
    const next = [...bulkStudents];
    next[index][field] = value;
    setBulkStudents(next);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedSection) {
      setError("Please select a target division first.");
      return;
    }

    const validStudents = bulkStudents.filter(s => s.name.trim() && s.username.trim());
    if (validStudents.length === 0) {
      setError("Please add at least one valid student record.");
      return;
    }

    setBulkSaving(true);
    try {
      await bulkUploadStudents({
        class_id: selectedClass.id,
        section_id: selectedSection.id,
        students: validStudents
      });
      setSuccess(`${validStudents.length} students enrolled successfully.`);
      setBulkOpen(false);
      setBulkStudents([{ name: "", username: "", gender: "male" }]);
      loadStudents(); // <--- Refresh!
    } catch (err) {
      setError(err?.message || "Bulk enrollment failure.");
    } finally {
      setBulkSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      username: "",
      gender: "male",
      class_id: "",
      section_id: ""
    });
    setModalSections([]);
    setOpen(false);
  };



  useEffect(() => {
    if (open) {
      const initialClassId = selectedClass?.id || "";
      const initialSectionId = selectedSection?.id || "";

      setForm(prev => ({
        ...prev,
        class_id: initialClassId,
        section_id: initialSectionId
      }));


      if (initialClassId) {
        const cls = classes.find(c => String(c.id) === String(initialClassId));
        setModalSections(cls?.sections || []);
      } else {
        setModalSections([]);
      }
    }
  }, [open, selectedClass, selectedSection, classes]);

  const handleModalClassChange = (classId) => {
    setForm(prev => ({ ...prev, class_id: classId, section_id: "" }));
    const cls = classes.find(c => String(c.id) === String(classId));
    setModalSections(cls?.sections || []);
  };

  /* ================= FILTER & PAGINATION ================= */
  // Filter by search AND by selected Class/Section
  const filtered = students.filter((s) => {
    // Identity check (nested or top-level)
    const name = s.user?.name || s.name || "";
    const username = s.user?.username || s.username || "";

    const matchesSearch =
      username.toLowerCase().includes(search.toLowerCase()) ||
      name.toLowerCase().includes(search.toLowerCase());

    // Loose comparison (==) handles String vs Number cases
    const studentClassId = s.class_id || s.class?.id;
    const studentSectionId = s.section_id || s.section?.id;

    const matchesClass = selectedClass ? studentClassId == selectedClass.id : true;
    const matchesSection = selectedSection ? studentSectionId == selectedSection.id : true;

    // Apply specific level filtering
    if (viewLevel === "list") {
      return matchesSearch && matchesClass && matchesSection;
    }
    return matchesSearch;
  }).sort((a, b) => {
    const valA = a.user?.username || a.user?.name || a.username || a.name || "";
    const valB = b.user?.username || b.user?.name || b.username || b.name || "";
    return valA.localeCompare(valB, undefined, { numeric: true });
  });


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
    <div className="students-page-wrapper">
      <header className="premium-command-bar reveal-up">
        <div className="ai-scanner-line" />
        <div className="header-left-group">
          {viewLevel !== "classes" && (
            <button onClick={handleBack} className="borderless-theme-toggle mr-4" title="Go Back">
              <ArrowLeft size={22} color="var(--p-accent)" />
            </button>
          )}
          <div className="header-info">
            <h1 className="glitch-text tech-readout" data-text="Student Intelligence Registry">Student Intelligence Registry</h1>
            <p className="tech-readout" style={{ fontSize: '0.65rem', marginTop: '4px' }}>Level: {viewLevel} | Selected: {selectedClass?.name || 'None'}</p>
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {renderBreadcrumbs()}
          {viewLevel === "list" && (
            <Button onClick={() => setBulkOpen(true)} className="scifi-glass-card" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--p-accent)', border: '1px solid var(--scifi-border)', padding: '0 20px' }}>
              <UploadCloud size={18} className="mr-2" /> <span className="tech-readout">Bulk Enroll</span>
            </Button>
          )}
          <Button onClick={() => setOpen(true)} className="enroll-btn-premium scifi-glass-card" style={{ background: 'var(--sb-nav-active)', color: 'white', border: 'none', padding: '0 24px' }}>

            <Plus size={18} className="mr-2" /> <span className="tech-readout">Enroll Entity</span>
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
                <div className="selection-icon-box">
                  <School size={32} className="hologram-flicker" />
                </div>
                <h3 className="tech-readout">{cls.name || cls.class_name}</h3>
                <p className="tech-readout" style={{ fontSize: '0.6rem' }}>Access Data Stream</p>
                <div className="selection-arrow">
                  <ChevronRight size={20} color="var(--p-accent)" />
                </div>
              </div>
            ))}
            {classes.length === 0 && (
              <div className="empty-selection-msg">No academic grades found. Create classes first.</div>
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
                  <div className="selection-icon-box purple">
                    <LayoutGrid size={32} className="hologram-flicker" />
                  </div>
                  <h3 className="tech-readout">Division {sec.name}</h3>
                  <p className="tech-readout" style={{ fontSize: '0.6rem' }}>Initialize Student Map</p>
                  <div className="selection-arrow">
                    <ChevronRight size={20} color="var(--p-accent)" />
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

      {/* VIEW: STUDENT LIST */}
      {viewLevel === "list" && (
        <div className="student-list-view animate-fade-in">
          <div className="students-filter-row scifi-glass-card" style={{ padding: '16px 24px', borderRadius: '16px', marginBottom: '24px' }}>
            <div className="ai-scanner-line" />
            <div className="students-search-wrap">
              <Search size={18} color="var(--p-accent)" />
              <input
                className="tech-readout"
                placeholder="SCANNING REGISTRY..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="students-view-toggle">
              <button className={`students-toggle-btn ${viewMode === "card" ? "active" : ""}`} onClick={() => setViewMode("card")} title="Card View">
                <LayoutGrid size={18} />
              </button>
              <button className={`students-toggle-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")} title="Table View">
                <List size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state-premium">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="mt-4 font-semibold text-slate-500">Synchronizing registry...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state-premium">
              <User size={48} className="mx-auto mb-4 opacity-20" />
              <p>No matching institutional records identified in {selectedClass?.name || selectedClass?.class_name} - Section {selectedSection?.name}.</p>
            </div>
          ) : (
            <div className="content-reveal-wrapper">
              {viewMode === "card" ? (
                <div className="student-grid-premium">
                  {paginatedItems.map((s, idx) => (
                    <div key={s.id} className={`student-card-premium scifi-glass-card reveal-up stagger-${idx + 1}`}>
                      <div className="ai-scanner-line" />
                      <div className="card-top">
                        <div className="student-avatar-box hologram-flicker"><User size={20} color="var(--p-accent)" /></div>
                        <div className="student-info-main">
                          <h3 className="tech-readout font-bold">{s.user?.username || "N/A"}</h3>
                          <p className="tech-readout" style={{ fontSize: '0.65rem' }}>
                            NODE: {s.class?.class_name || s.class?.name || "G" + s.class_id} - {s.section?.name || "D" + s.section_id}
                          </p>
                        </div>
                        <div className="ai-status-pulse" title={s.is_active ? "Authorized" : "Suspended"} />
                      </div>
                      <div className="card-details-box">
                        <div className="detail-item">
                          <span className="label tech-readout">Identity</span>
                          <span className="value font-bold">{s.user?.name || s.name || "N/A"}</span>

                        </div>
                        <div className="detail-item">
                          <span className="label tech-readout">Verification</span>
                          <span className="value tech-readout">{s.is_active ? "SYNCED" : "OFFLINE"}</span>
                        </div>
                      </div>
                      <div className="card-footer-actions">
                        <Button variant="ghost" onClick={() => openMoveModal(s)} className="edit-btn tech-readout">
                          <ArrowRightLeft size={14} className="mr-2" /> TRANSFER
                        </Button>
                        <Button variant="ghost" onClick={() => handleStatusToggle(s)} className={s.is_active ? "text-cyan-400" : "text-slate-500"}>
                          {s.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          <span className="ml-2 tech-readout">{s.is_active ? "ACTIVE" : "DISABLED"}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="table-container-premium">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>System Username</th>
                        <th>Full Identity</th>
                        <th>Gender</th>
                        <th>Grade</th>
                        <th>Division</th>
                        <th>Access Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <div className="cell-with-icon">
                              <div className="item-icon-small"><User size={14} /></div>
                              <span className="font-bold text-blue-600">{s.user?.username || s.username}</span>
                            </div>
                          </td>
                          <td>{s.user?.name || s.name || "N/A"}</td>

                          <td className="capitalize font-medium">{s.gender || s.user?.gender || "N/A"}</td>
                          <td className="font-semibold text-slate-600">{s.class?.class_name || s.class?.name || s.class_id}</td>
                          <td className="font-semibold text-blue-600">Section {s.section?.name || s.section_id}</td>
                          <td>
                            <span className={`status-badge ${s.is_active ? "status-active" : "status-inactive"}`}>
                              {s.is_active ? "Authorized" : "Disabled"}
                            </span>
                          </td>
                          <td>
                            <div className="table-row-actions">
                              <Button variant="ghost" size="sm" onClick={() => openMoveModal(s)} className="action-pill relocation" title="Relocate Student">
                                <ArrowRightLeft size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleStatusToggle(s)} className={`action-pill ${s.is_active ? 'active' : 'inactive'}`} title={s.is_active ? "Suspend Access" : "Restore Access"}>
                                {s.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                              </Button>
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
        </div>
      )}

      {/* CREATE MODAL */}
      {open && (
        <div className="modal-backdrop" onClick={resetForm}>
          <div className="modal-container-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="title-info">
                <h2>Provision Student</h2>
                <p>Specify parameters for new institutional enrollment.</p>
              </div>
              <button className="close-x-btn" onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-form-scroll">
                <div className="form-group">
                  <Label>Identity Full Name *</Label>
                  <input
                    className="modal-input-premium"
                    placeholder="e.g. Aditi Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <Label>System Username *</Label>
                  <input
                    className="modal-input-premium"
                    placeholder="e.g. aditi_s"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <Label>Gender *</Label>
                  <select
                    className="modal-input-premium"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <Label>Identity Full Name *</Label>
                  <Input
                    className="modal-input-premium"
                    placeholder="e.g. Aditi Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <Label>System Username *</Label>
                  <Input
                    className="modal-input-premium"
                    placeholder="e.g. aditi_s"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <Label>Gender *</Label>
                  <select
                    className="modal-input-premium"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <Label>Primary Grade *</Label>
                  <select
                    className="modal-input-premium"
                    value={form.class_id}
                    onChange={(e) => handleModalClassChange(e.target.value)}
                    required
                  >
                    <option value="">Select Grade</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.class_name || c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <Label>Academic Division *</Label>
                  <select
                    className="modal-input-premium"
                    value={form.section_id}
                    onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                    required
                    disabled={!form.class_id}
                  >
                    <option value="">Select Division</option>
                    {modalSections.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.is_active ? "" : "(Inactive)"}</option>
                    ))}
                  </select>
                </div>


              </div>
              <div className="modal-footer-premium">
                <Button type="button" variant="ghost" onClick={resetForm} className="cancel-btn">Abort</Button>
                <Button type="submit" disabled={saving || !form.section_id} className="submit-btn-premium bg-blue-600 hover:bg-blue-700">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : "Enroll Student"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE MODAL */}
      {moveModalOpen && (
        <div className="modal-backdrop" onClick={() => setMoveModalOpen(false)}>
          <div className="modal-container-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="title-info">
                <h2>Relocate Registry</h2>
                <p>Transfer student to a different institutional division.</p>
              </div>
              <button className="close-x-btn" onClick={() => setMoveModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleMoveSubmit}>
              <div className="modal-form-scroll">
                <div className="form-group">
                  <Label>Target Institutional Division *</Label>
                  <select
                    className="modal-input-premium"
                    value={moveForm.section_id}
                    onChange={(e) => setMoveForm({ ...moveForm, section_id: e.target.value })}
                    required
                  >
                    <option value="">Select Division</option>
                    {moveSections.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.is_active ? "" : "(Inactive)"}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer-premium">
                <Button type="button" variant="ghost" onClick={() => setMoveModalOpen(false)} className="cancel-btn">Abort</Button>
                <Button type="submit" disabled={saving || !moveForm.section_id} className="submit-btn-premium bg-blue-600 hover:bg-blue-700">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : "Execute relocation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SuccessModal isOpen={!!success} onClose={() => setSuccess(null)} title="Protocol Executed" message={success} />

      {/* BULK ENROLL MODAL */}
      {bulkOpen && (
        <div className="modal-backdrop" onClick={() => setBulkOpen(false)}>
          <div className="modal-container-premium" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="title-info">
                <h2>Bulk Division Provisioning</h2>
                <p>Registering learners to: Grade {selectedClass?.name || selectedClass?.class_name}, Section {selectedSection?.name}</p>
              </div>
              <button className="close-x-btn" onClick={() => setBulkOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleBulkSubmit}>
              <div className="modal-form-scroll" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <table className="students-table" style={{ width: '100%', marginBottom: '20px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Full Identity Name</th>
                      <th style={{ width: '30%' }}>System Username</th>
                      <th style={{ width: '20%' }}>Gender</th>
                      <th style={{ width: '10%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkStudents.map((s, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            className="modal-input-premium"
                            placeholder="e.g. John Doe"
                            value={s.name}
                            onChange={(e) => updateBulkRow(idx, "name", e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="modal-input-premium"
                            placeholder="e.g. john_d"
                            value={s.username}
                            onChange={(e) => updateBulkRow(idx, "username", e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <select
                            className="modal-input-premium"
                            value={s.gender}
                            onChange={(e) => updateBulkRow(idx, "gender", e.target.value)}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </td>
                        <td>
                          {bulkStudents.length > 1 && (
                            <button type="button" onClick={() => removeBulkRow(idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Button type="button" variant="ghost" onClick={addBulkRow} className="w-full border-dashed border-2 border-slate-700 hover:border-blue-500 text-slate-400 hover:text-blue-500">
                  <Plus size={16} className="mr-2" /> Add Participant Node
                </Button>
              </div>
              <div className="modal-footer-premium">
                <Button type="button" variant="ghost" onClick={() => setBulkOpen(false)} className="cancel-btn">Abort</Button>
                <Button type="submit" disabled={bulkSaving} className="submit-btn-premium bg-blue-600 hover:bg-blue-700">
                  {bulkSaving ? <Loader2 className="animate-spin" size={16} /> : `Enroll ${bulkStudents.length} Students`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

