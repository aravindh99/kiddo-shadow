import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  UploadCloud,
  GraduationCap,
  Loader2,
  Trash2,
  XCircle,
  Info,
  Layers,
  ChevronRight,
  Hash,
  X,
  LayoutGrid,
  RefreshCw,
} from "lucide-react";
import "./Class.css";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SuccessModal from "@/components/SuccessModal";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createClass,
  updateClass,
  deleteClass,
  getClassesWithSections
} from "./class";
import {
  createSection,
  updateSectionStatus,
  deleteSection
} from "../sections/Sections.js";

const CLASS_OPTIONS = ["6", "7", "8", "9", "10", "11", "12"];

export default function Classes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  /* FORM STATE */
  const [className, setClassName] = useState("");
  const [newSections, setNewSections] = useState(["A"]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [file, setFile] = useState(null);

  /* Pagination State */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getClassesWithSections();
      setClasses(res.items || []);
    } catch (e) {
      console.error(e);
      setError("Failed to synchronize academic structure.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.showAdd) {
      setOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  /* ================= HANDLERS ================= */

  const resetForm = () => {
    setClassName("");
    setNewSections(["A"]);
    setEditingId(null);
    setOpen(false);
    setError(null);
  };

  const handleEdit = (c, e) => {
    if (e) e.stopPropagation();
    setEditingId(c.id);
    setClassName(c.class_name);
    // New divisions buffer
    setNewSections([]);
    setOpen(true);
  };

  const handleDeleteSection = async (secId, e) => {
    if (e) e.stopPropagation();
    if (!confirm("Decommission this division? This action is irreversible.")) return;
    try {
      await deleteSection(secId);
      fetchData();
    } catch (e) {
      setError("Division decommissioning failed.");
    }
  };

  /* AUTO-FILL SECTION 'A' WHEN CLASS SELECTED */
  useEffect(() => {
    if (className && newSections.length === 0 && !editingId) {
      setSectionInput("A");
    }
  }, [className, editingId]);

  const addSectionField = () => {
    setNewSections([...newSections, ""]);
  };

  const removeSectionField = (index) => {
    if (newSections.length > 1) {
      setNewSections(newSections.filter((_, i) => i !== index));
    }
  };

  const updateSectionField = (index, value) => {
    const next = [...newSections];
    next[index] = value;
    setNewSections(next);
  };

  const handleBulkUpload = (e) => {
    e.preventDefault();
    if (!file) return alert("Select file first");
    alert("Bulk upload integration pending backend.");
    setBulkOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!className) {
      setError("Grade designation is mandatory.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let classId = editingId;

      // 1. Create or Update Class
      if (editingId) {
        await updateClass(editingId, { class_name: className });
        setSuccess("Academic grade updated.");
      } else {
        const res = await createClass({ class_name: className });
        // The API might return the created object directly or inside data
        classId = res.id || res.data?.id;
        if (!classId) throw new Error("Failed to retrieve new Grade ID");
      }

      // 2. Create Sections if any
      const validSections = newSections.filter(s => s.trim() !== "");
      if (validSections.length > 0 && classId) {
        for (const secName of validSections) {
          await createSection({ class_id: classId, name: secName.trim().toUpperCase() });
        }
        setSuccess(editingId ? "Grade and new divisions updated." : "New grade and divisions provisioned.");
      }

      resetForm();
      fetchData();
    } catch (e) {
      console.error(e);
      setError(e.message || "Transaction failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Decommission this Grade and ALL its divisions/students?")) return;
    try {
      await deleteClass(id);
      fetchData();
    } catch (e) {
      setError("Decommissioning failed.");
    }
  };

  const handleSectionToggle = async (sec, e) => {
    e.stopPropagation();
    try {
      await updateSectionStatus(sec.id, !sec.is_active);
      fetchData(); // Refresh to show new status
    } catch (e) {
      console.error("Status toggle failed");
    }
  };

  const navigateToStudents = (cls, sec) => {
    // Navigate to students page with state to pre-filter
    navigate("/schooladmin/students", {
      state: { preSelectClassId: cls.id, preSelectSectionId: sec.id }
    });
  };

  /* FILTER & PAGINATION */
  const filtered = classes.filter((c) =>
    String(c.class_name).toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="classes-page-wrapper">
      <header className="premium-command-bar reveal-up">
        <div className="ai-scanner-line" />
        <div className="header-info">
          <h1 className="glitch-text tech-readout" data-text="Neural Class Network">Neural Class Network</h1>
          <p className="tech-readout" style={{ fontSize: '0.65rem', marginTop: '4px' }}>Map academic grades and organizational divisions across the institutional node.</p>
        </div>
        <div className="header-actions">
          <Button onClick={() => setOpen(true)} className="enroll-btn-premium scifi-glass-card" style={{ background: 'var(--sb-nav-active)', color: 'white', border: 'none', padding: '0 24px' }}>
            <Plus size={18} className="mr-2" /> <span className="tech-readout">Provision Grade</span>
          </Button>
        </div>
      </header>

      <div className="classes-filter-row scifi-glass-card" style={{ padding: '16px 24px', borderRadius: '16px', marginBottom: '24px' }}>
        <div className="ai-scanner-line" />
        <div className="classes-search-wrap">
          <Search size={18} color="var(--p-accent)" />
          <input
            className="tech-readout"
            placeholder="SCANNING ACADEMIC NODES..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="classes-view-badge tech-readout" style={{ color: 'var(--p-accent)', fontSize: '0.7rem' }}>
          <Layers size={14} className="mr-2" />
          <span>SYNCHRONIZED VIEW</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state-premium">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="mt-4 font-semibold text-slate-500">Synchronizing Structure...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-premium">
          <Info size={48} className="mx-auto mb-4 opacity-20" />
          <h3>No Grades Found</h3>
          <p>Provision a new academic grade to get started.</p>
        </div>
      ) : (
        <div className="content-reveal-wrapper">
          <div className="classes-grid-premium">
            {paginatedItems.map((c, idx) => (
              <div key={c.id} className={`class-card-premium scifi-glass-card reveal-up stagger-${idx + 1}`}>
                <div className="ai-scanner-line" />
                <div className="card-top">
                  <div className="grade-title">
                    <div className="icon-box-small hologram-flicker"><GraduationCap size={18} color="var(--p-accent)" /></div>
                    <span className="tech-readout font-bold">Grade {c.class_name}</span>
                  </div>
                  <div className="card-actions-mini">
                    <button onClick={(e) => handleEdit(c, e)} className="icon-btn-mini" title="Edit"><Info size={16} color="var(--p-accent)" /></button>
                    <button onClick={(e) => handleDeleteClick(c.id, e)} className="icon-btn-mini text-red-500" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="sections-container">
                  <div className="section-label tech-readout" style={{ fontSize: '0.65rem' }}>IDENTIFIED DIVISIONS ({c.sections?.length || 0}):</div>
                  <div className="sections-list-premium tech-readout">
                    {c.sections && c.sections.length > 0 ? (
                      c.sections.map(sec => (
                        <div key={sec.id} className={`section-row-premium ${sec.is_active ? 'active' : 'inactive'}`} style={{ background: sec.is_active ? 'var(--p-accent-glow)' : 'var(--p-scan-line)', border: '1px solid var(--scifi-border)' }}>
                          <div className="sec-info" onClick={() => navigateToStudents(c, sec)} title="View Students">
                            <span className="sec-name font-bold">{sec.name}</span>
                            <span className="sec-status-pill tech-readout" style={{ fontSize: '0.6rem' }}>{sec.is_active ? "SYNCED" : "OFFLINE"}</span>
                          </div>
                          <div className="sec-actions-box">
                            <button onClick={(e) => handleSectionToggle(sec, e)} className="sec-action-btn" title="Toggle Status">
                              <RefreshCw size={14} />
                            </button>
                            <button onClick={(e) => handleDeleteSection(sec.id, e)} className="sec-action-btn delete" title="Delete Division">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-sections-placeholder">
                        <Info size={14} />
                        <span>No institutional divisions provisioned.</span>
                      </div>
                    )}
                    <button className="add-division-full-btn" onClick={(e) => handleEdit(c, e)}>
                      <Plus size={14} className="mr-2" /> Add Division
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pagination-footer-premium">
              <div className="pagination-info">Page {currentPage} of {totalPages}</div>
              <div className="pagination-controls">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-lg h-9">Previous</Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-lg h-9">Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {open && (
        <div className="modal-backdrop" onClick={() => !saving && resetForm()}>
          <div className="modal-container-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="title-info">
                <h2>{editingId ? "Refactor Academic Grade" : "Provision Grade Structure"}</h2>
                <p>Define grade level and provision initial divisions.</p>
              </div>
              <button className="close-x-btn" onClick={resetForm} disabled={saving}><XCircle size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-form-scroll">
                <div className="form-group">
                  <Label>Grade Designation *</Label>
                  <select className="modal-input-premium" value={className} onChange={e => setClassName(e.target.value)} disabled={saving}>
                    <option value="">Select Grade Level</option>
                    {CLASS_OPTIONS.map(o => <option key={o} value={o}>Grade {o}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <Label>Institutional Divisions</Label>
                  <div className="space-y-3">
                    {newSections.map((name, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                          className="modal-input-premium flex-1"
                          placeholder={`Division (e.g. ${String.fromCharCode(65 + index)})`}
                          value={name}
                          onChange={(e) => updateSectionField(index, e.target.value)}
                          disabled={saving}
                        />
                        {newSections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSectionField(index)}
                            disabled={saving}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={addSectionField}
                    disabled={saving}
                    className="mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-sm p-0 h-auto"
                  >
                    <Plus size={16} className="mr-1" /> Add Another Division
                  </Button>
                </div>
              </div>

              <div className="modal-footer-premium">
                <Button type="button" variant="ghost" className="cancel-btn" onClick={resetForm} disabled={saving}>Abort</Button>
                <Button type="submit" className="submit-btn-premium bg-blue-600 hover:bg-blue-700" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" size={16} /> : "Execute Provisioning"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      <SuccessModal
        isOpen={!!success}
        onClose={() => setSuccess(null)}
        title="Structure Updated"
        message={success}
      />
    </div>
  );
}
