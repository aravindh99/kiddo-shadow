import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit2, ArrowRightLeft, BookMarked, UserCheck, ShieldCheck } from "lucide-react";
import { getClasses, getSectionsByClass } from "../classes/class.js";
import { getSubjects } from "../subjects/Subjects.js";
import { getTeachers } from "../teachers/Teachers.js";
import { listAssignments, deleteAssignment, assignTeacher, updateAssignment } from "./Assign.js";
import SuccessModal from "@/components/SuccessModal";
import { Button } from "@/components/ui/button";
import "./Assign.css";

/* ---------- STATIC DATA ---------- */

// Classes 6–10 only
const classes = [
  { id: 6, name: "Class 6" },
  { id: 7, name: "Class 7" },
  { id: 8, name: "Class 8" },
  { id: 9, name: "Class 9" },
  { id: 10, name: "Class 10" },
];

// Sections mapped by class
const sectionsByClass = {
  6: [{ id: 1, name: "A" }, { id: 2, name: "B" }],
  7: [{ id: 3, name: "A" }, { id: 4, name: "B" }],
  8: [{ id: 5, name: "A" }],
  9: [{ id: 6, name: "A" }, { id: 7, name: "B" }],
  10: [{ id: 8, name: "A" }],
};

// CBSE Subjects + Others
const subjects = [
  { id: 1, name: "English" },
  { id: 2, name: "Mathematics" },
  { id: 3, name: "Science" },
  { id: 4, name: "Social Science" },
  { id: 5, name: "Hindi" },
  { id: 6, name: "Computer Science" },
  { id: 7, name: "Physics" },
  { id: 8, name: "Chemistry" },
  { id: 9, name: "Biology" },
  { id: 99, name: "Others" },
];

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    teacher_id: "",
    class_id: "",
    section_id: "",
    subject_id: "",
    academic_year: "2025-2026",
    is_class_teacher: false,
  });

  /* Fetch Primary Data */
  const loadData = async () => {
    try {
      setLoading(true);
      const [asn, tchr, cls, sbj] = await Promise.all([
        listAssignments(),
        getTeachers(),
        getClasses(),
        getSubjects()
      ]);
      setAssignments(asn);
      setTeachers(tchr.items || []);
      setClasses(cls.items || []);
      setSubjects(sbj);
    } catch (e) {
      console.error(e);
      setError("Synchronous data retrieval failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* Dynamic Section Fetching */
  useEffect(() => {
    if (form.class_id) {
      getSectionsByClass(form.class_id).then(setSections);
    } else {
      setSections([]);
    }
  }, [form.class_id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "class_id" && { section_id: "" }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        teacher_id: Number(form.teacher_id),
        class_id: Number(form.class_id),
        section_id: Number(form.section_id),
        subject_id: Number(form.subject_id),
        academic_year: form.academic_year,
      };

      if (editingId) {
        await updateAssignment(editingId, payload);
        setSuccess("Teacher allocation updated successfully.");
      } else {
        await assignTeacher(payload);
        setSuccess("Teacher allocation successfully provisioned.");
      }

      setForm({
        teacher_id: "",
        class_id: "",
        section_id: "",
        subject_id: "",
        academic_year: "2025-2026",
        is_class_teacher: false
      });
      setIsModalOpen(false);
      setEditingId(null);
      loadData();
    } catch (e) {
      setError(editingId ? "Update failed." : "Allocation protocol failed. Verify parameters.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a) => {
    setEditingId(a.id);
    setForm({
      teacher_id: a.teacher?.id || "",
      class_id: a.class?.id || "",
      section_id: a.section?.id || "",
      subject_id: a.subject?.id || "",
      academic_year: a.academic_year || "2025-2026",
      is_class_teacher: a.is_class_teacher || false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Permanently rescind this faculty allocation?")) return;
    try {
      await deleteAssignment(id);
      loadData();
    } catch (e) {
      setError("Decommissioning failed.");
    }
  };

  return (
    <div className="assign-page-container">
      <header className="premium-command-bar reveal-up">
        <div className="ai-scanner-line" />
        <div className="header-info">
          <h1 className="glitch-text tech-readout" data-text="Assignment Intelligence Node">Assignment Intelligence Node</h1>
          <p className="tech-readout" style={{ fontSize: '0.65rem', marginTop: '4px' }}>Institutional staff-to-curriculum assignment registry.</p>
        </div>
        <div className="header-actions">
          <Button onClick={() => setIsModalOpen(true)} className="enroll-btn-premium scifi-glass-card" style={{ background: 'var(--sb-nav-active)', color: 'white', border: 'none', padding: '0 24px' }}>
            <Plus size={18} className="mr-2" /> <span className="tech-readout">INITIATE ALLOCATION</span>
          </Button>
        </div>
      </header>

      <div className="assign-content-grid single-panel">
        {/* REGISTRY PANEL */}
        <section className="registry-panel-premium scifi-glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
          <div className="ai-scanner-line" />
          <div className="panel-header">
            <h3 className="tech-readout font-bold uppercase tracking-widest text-lg" style={{ color: 'var(--p-accent)' }}>Active Allocation Matrix</h3>
            <p className="tech-readout" style={{ fontSize: '0.65rem', marginTop: '4px' }}>Authorized institutional faculty-subject linkages.</p>
          </div>

          <div className="registry-table-scroll">
            <table className="allocation-table-premium">
              <thead>
                <tr>
                  <th className="tech-readout">FACULTY IDENTITY</th>
                  <th className="tech-readout">KNOWLEDGE DOMAIN</th>
                  <th className="tech-readout">ACADEMIC CLUSTER</th>
                  <th className="tech-readout">TEMPORAL EPOCH</th>
                  <th className="action-column-header tech-readout text-right">OPERATIONS</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length > 0 ? assignments.map((a, idx) => {
                  // ROBUST DATA RESOLUTION (JSX ONLY - DEFENSIVE MAPPING)
                  const teacherData = a.teacher || teachers.find(t => t.id === a.teacher_id) || {};
                  const teacherName = teacherData.name || teacherData.user?.name || a.teacher_name || "Teacher";
                  const teacherUser = teacherData.username || teacherData.user?.username || a.teacher_username || `TCH-${a.teacher_id || 'UID'}`;

                  const classData = a.class || classes.find(c => c.id === a.class_id) || {};
                  const className = classData.class_name || classData.name || a.class_name || a.class_id || "N/A";

                  // DEEP SECTION RESOLUTION: Search within all classes if not directly provided
                  let resolvedSection = a.section?.name || a.section_name || "N/A";
                  if (resolvedSection === "N/A" && a.section_id) {
                    // Search through all classes to find the section matching section_id
                    classes.forEach(c => {
                      if (c.sections && Array.isArray(c.sections)) {
                        const s = c.sections.find(sec => sec.id === a.section_id);
                        if (s) resolvedSection = s.name;
                      }
                    });
                  }
                  const sectionName = resolvedSection;

                  const subjectData = a.subject || subjects.find(s => s.id === a.subject_id) || {};
                  const subjectName = subjectData.name || subjectData.subject_name || a.subject_name || "N/A";

                  // Academic Year: Handle common variations and provide a smart fallback if missing
                  const academicYear = a.academic_year || a.academicYear || a.ac_year || a.year || "2025-2026";

                  return (
                    <tr key={a.id} className="reveal-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <td>
                        <div className="teacher-info-cell">
                          <span className="teacher-name-main tech-readout font-bold">{teacherName}</span>
                          <span className="teacher-id-sub tech-readout" style={{ color: 'var(--p-accent)' }}>{teacherUser}</span>
                        </div>
                      </td>
                      <td>
                        <div className="item-icon-small hologram-flicker" style={{ background: 'var(--p-accent-glow)', color: 'var(--p-accent)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <BookMarked size={16} />
                        </div>
                        <span className="subject-badge-pill tech-readout font-bold" style={{ background: 'var(--p-scan-line)', color: 'var(--text-main)', border: '1px solid var(--scifi-border)' }}>{subjectName}</span>
                      </td>
                      <td>
                        <div className="grade-section-box scifi-glass-card" style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--p-scan-line)', width: 'fit-content' }}>
                          <span className="grade-val tech-readout font-bold">{className}</span>
                          <span className="divider" style={{ margin: '0 8px', color: 'var(--p-accent)' }}>//</span>
                          <span className="section-val tech-readout font-bold">{sectionName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="academic-year-tag tech-readout font-bold" style={{ color: 'var(--text-muted)' }}>{academicYear}</span>
                      </td>
                      <td>
                        <div className="action-buttons-flex">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(a)} className="edit-action-btn tech-readout" style={{ color: 'var(--p-accent)' }}>
                            <Edit2 size={15} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="delete-action-btn tech-readout" style={{ color: '#ef4444' }}>
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="empty-registry">No active allocations identified.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div className="assignment-modal-overlay">
          <div className="assignment-modal-content">
            <div className="modal-header">
              <h3>{editingId ? "Edit Faculty Allocation" : "New Faculty Allocation"}</h3>
              <button className="close-btn" onClick={() => { setIsModalOpen(false); setEditingId(null); }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="premium-form-layout">
              <div className="form-group-standard">
                <label>Faculty Member</label>
                <select name="teacher_id" value={form.teacher_id} onChange={handleChange} required>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.user?.name || t.name} ({t.user?.username || t.username || t.employee_id || "N/A"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-split">
                <div className="form-group-standard">
                  <label>Academic Grade</label>
                  <select name="class_id" value={form.class_id} onChange={handleChange} required>
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.class_name || c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-standard">
                  <label>Division</label>
                  <select name="section_id" value={form.section_id} onChange={handleChange} required disabled={!form.class_id}>
                    <option value="">Select Section</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>Section {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group-standard">
                <label>Academic Subject</label>
                <select name="subject_id" value={form.subject_id} onChange={handleChange} required>
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name || s.subject_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-standard">
                <label>Academic Year</label>
                <select name="academic_year" value={form.academic_year} onChange={handleChange} required>
                  <option value="">Select Year</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                  <option value="2028-2029">2028-2029</option>
                  <option value="2029-2030">2029-2030</option>
                </select>
              </div>

              <div className="toggle-wrapper">
                <label className="checkbox-pill">
                  <input type="checkbox" name="is_class_teacher" checked={form.is_class_teacher} onChange={handleChange} />
                  <div className="pill-content">
                    <ShieldCheck size={16} />
                    <span>Designate as Class Lead</span>
                  </div>
                </label>
              </div>

              <div className="modal-footer">
                <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="cancel-btn">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="submit-btn-premium bg-blue-600 hover:bg-blue-700">
                  {saving ? <Loader2 className="animate-spin" size={18} /> : (editingId ? <Edit2 size={18} /> : <Plus size={18} />)}
                  {saving ? (editingId ? "Updating..." : "Provisioning...") : (editingId ? "Update Allocation" : "Confirm Allocation")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SuccessModal isOpen={!!success} onClose={() => setSuccess(null)} title="Provisioning Successful" message={success} />
    </div>
  );
};

const Loader2 = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

export default TeacherAssignments;
