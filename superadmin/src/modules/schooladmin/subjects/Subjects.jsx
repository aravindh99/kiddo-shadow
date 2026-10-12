import React, { useEffect, useState, useRef } from "react";
import {
  BookOpen,
  Search as SearchIcon,
  Loader2,
  Trash2,
  Edit,
  X,
  Plus,
  BookMarked,
  Info,
  Layers,
  Sparkles
} from "lucide-react";
import "./Subjects.css";

import { Button } from "@/components/ui/button";
import SuccessModal from "@/components/SuccessModal";

import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "./Subjects.js";

const SUBJECT_LIST = [
  "Mathematics", "Science", "Social Science", "EVS", "General Knowledge",
  "English", "Hindi", "Tamil", "Sanskrit", "French", "German",
  "Physics", "Chemistry", "Biology", "Computer Science",
  "History", "Geography", "Political Science", "Economics",
  "Accountancy", "Business Studies", "Marketing",
  "Physical Education", "Art & Craft", "Music", "Library", "Others"
];

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [customSubject, setCustomSubject] = useState("");

  /* Custom Dropdown State & Refs */
  const [openDropdown, setOpenDropdown] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef(null);

  /* Click Outside Handler */
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  /* Pagination State */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* ================= FETCH ================= */
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await getSubjects();
      setSubjects(data || []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Curriculum synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    let finalName = name;
    if (name === "Others") {
      finalName = customSubject.trim();
    }

    if (!finalName || !finalName.trim()) {
      setError("Subject nomenclature is mandatory.");
      return;
    }

    const payload = {
      name: finalName.trim(),
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateSubject(editingId, payload);
        setSuccess("Subject definition reconstructed successfully.");
      } else {
        await createSubject(payload);
        setSuccess("New subject provisioned in the academic catalog.");
      }

      resetForm();
      fetchSubjects();
    } catch (e) {
      console.error(e);
      setError(e?.message || "Protocol mismatch during subject provisioning.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCustomSubject("");
    setOpenDropdown(false);
    setDropdownSearch("");
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    if (SUBJECT_LIST.includes(s.name)) {
      setName(s.name);
      setCustomSubject("");
    } else {
      setName("Others");
      setCustomSubject(s.name);
    }
    setOpen(true);
  };

  const handleDelete = async (id, subjectName) => {
    if (!confirm(`Decommission ${subjectName} permanently? This action is irreversible.`)) return;
    try {
      await deleteSubject(id);
      fetchSubjects();
    } catch (e) {
      console.error(e);
      setError("Failed to decommission subject.");
    }
  };

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id?.toString().includes(search)
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* ================= UI ================= */
  return (
    <div className="subjects-page-wrapper">
      <header className="page-header-premium">
        <div className="header-info">
          <div className="header-icon-box">
            <BookMarked size={24} />
          </div>
          <div>
            <h1>Academic Curriculum</h1>
            <p>Manage institutional learning paths and course nomenclature.</p>
          </div>
        </div>

        <Button onClick={() => setOpen(true)} className="add-btn-premium bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-xl font-bold text-white">
          <Plus size={18} className="mr-2" /> Provision Subject
        </Button>
      </header>

      <div className="subjects-filter-row scifi-glass-card" style={{ padding: '16px 24px', borderRadius: '16px', marginBottom: '24px' }}>
        <div className="ai-scanner-line" />
        <div className="subjects-search-wrap">
          <SearchIcon size={18} color="var(--p-accent)" />
          <input
            className="tech-readout"
            placeholder="SCANNING CURRICULUM DATA..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="subjects-view-badge tech-readout" style={{ color: 'var(--p-accent)', fontSize: '0.7rem' }}>
          <Layers size={14} className="mr-2" />
          <span>SYNCHRONIZED VIEW</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state-premium">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="mt-4 font-semibold text-slate-500">Synchronizing Curriculum Data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-premium">
          <Info size={48} className="mx-auto mb-4 opacity-20" />
          <h3>No Curriculum Identified</h3>
          <p>Initialize your academic catalog by provisioning a new subject.</p>
        </div>
      ) : (
        <div className="content-reveal-wrapper">
          <div className="subjects-grid-premium">
            {paginatedItems.map((s, idx) => (
              <div key={s.id} className={`subject-card-premium scifi-glass-card reveal-up stagger-${idx + 1}`}>
                <div className="ai-scanner-line" />
                <div className="card-top">
                  <div className="subject-title">
                    <div className="avatar-mini hologram-flicker tech-readout font-bold" style={{ color: 'var(--p-accent)' }}>
                      {s.name[0].toUpperCase()}
                    </div>
                    <span className="tech-readout font-bold">{s.name}</span>
                  </div>
                  <Sparkles size={16} color="var(--p-accent)" className="hologram-flicker" />
                </div>

                <div className="card-details-box">
                  <div className="detail-item">
                    <span className="label tech-readout">Knowledge ID</span>
                    <span className="value tech-readout">SUB-{s.id.toString().padStart(3, '0')}</span>
                  </div>
                  <div className="detail-item mt-2">
                    <span className="label tech-readout">Deployment Status</span>
                    <span className="value status-active tech-readout">OPTIMIZED</span>
                  </div>
                </div>

                <div className="card-footer-actions">
                  <Button variant="ghost" className="edit-btn tech-readout" onClick={() => handleEdit(s)}>
                    REFACTOR
                  </Button>
                  <Button
                    variant="ghost"
                    className="delete-btn tech-readout text-red-500"
                    onClick={() => handleDelete(s.id, s.name)}
                  >
                    TERMINATE
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="pagination-footer-premium">
              <div className="pagination-info">
                Showing Subjects {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
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

      {/* MODAL */}
      {open && (
        <div className="modal-backdrop" onClick={resetForm}>
          <div className="modal-container-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="title-info">
                <h2>{editingId ? "Modify Subject" : "Provision Subject"}</h2>
                <p>Define academic parameters and nomenclature.</p>
              </div>
              <button className="close-x-btn" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-form-scroll">
                <div className="form-group relative" ref={dropdownRef}>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Subject Nomenclature *</label>

                  {/* Custom Searchable Dropdown Trigger */}
                  <div
                    className={`modal-input-premium flex items-center justify-between cursor-pointer ${openDropdown ? 'border-blue-600 ring-2 ring-blue-50' : ''}`}
                    onClick={() => {
                      setOpenDropdown(!openDropdown);
                      setTimeout(() => {
                        if (!openDropdown) {
                          const input = document.getElementById('subject-search-input');
                          if (input) input.focus();
                        }
                      }, 50);
                    }}
                  >
                    <span className={!name ? "text-slate-400" : "text-slate-800 font-medium"}>
                      {name || "Select a Subject"}
                    </span>
                    <div className="flex items-center gap-2">
                      {name && <div className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">SELECTED</div>}
                      <SearchIcon size={16} className="text-slate-400" />
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  {openDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <div className="relative">
                          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            id="subject-search-input"
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all font-medium"
                            placeholder="Search subjects..."
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto p-1.5 bg-white custom-scrollbar-premium">
                        {SUBJECT_LIST.filter(s => s.toLowerCase().includes(dropdownSearch.toLowerCase())).map((subj) => (
                          <div
                            key={subj}
                            className={`px-3 py-3 text-sm rounded-lg cursor-pointer transition-all flex items-center justify-between mb-1 ${name === subj ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600 hover:pl-4 focus:bg-slate-50'}`}
                            onClick={() => {
                              setName(subj);
                              if (subj !== "Others") setCustomSubject("");
                              setOpenDropdown(false);
                            }}
                          >
                            {subj}
                            {name === subj && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                          </div>
                        ))}

                        {SUBJECT_LIST.filter(s => s.toLowerCase().includes(dropdownSearch.toLowerCase())).length === 0 && (
                          <div
                            className="px-3 py-3 text-sm rounded-lg cursor-pointer transition-colors flex items-center justify-between hover:bg-slate-50 text-blue-600 font-semibold"
                            onClick={() => {
                              setName("Others");
                              setOpenDropdown(false);
                            }}
                          >
                            Use "Others" for custom subject
                            <Plus size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {name === "Others" && (
                  <div className="form-group mt-4 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                      Specify Custom Subject *
                    </label>
                    <input
                      className="modal-input-premium border-blue-200 bg-blue-50/50"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="e.g. Robotics, Psychology..."
                      required
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer-premium">
                <Button type="button" variant="ghost" className="cancel-btn" onClick={resetForm}>Terminate</Button>
                <Button type="submit" disabled={saving} className="submit-btn-premium bg-blue-600 hover:bg-blue-700">
                  {saving ? "Syncing..." : editingId ? "Save Refinement" : "Provision Subject"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SuccessModal
        isOpen={!!success}
        onClose={() => setSuccess(null)}
        title="Protocol Successful"
        message={success}
      />
    </div>
  );
}
