import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Loader2,
  Hash,
  X,
  Info,
  XCircle,
  LayoutGrid,
  UploadCloud,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getSectionsByClass,
  createSection,
  updateSectionStatus,
} from "./Sections.js";
import { getClasses } from "../classes/class.js";
import { useLocation } from "react-router-dom";
import "./Sections.css";

export default function Sections() {
  const location = useLocation();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false); // Bulk upload modal
  const [file, setFile] = useState(null); // File state

  useEffect(() => {
    if (location.state?.showAdd) {
      setOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  /* form state for multi-section add */
  const [form, setForm] = useState({
    class_id: "",
    sectionNames: [""], // Array of section names
  });

  /* load classes */
  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        const res = await getClasses();
        const data = Array.isArray(res) ? res : res?.items || [];
        setClasses(data);
        if (data.length > 0 && !classId) {
          setClassId(String(data[0].id));
        }
      } catch (err) {
        console.error("Failed to load classes", err);
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  /* load sections */
  const loadSections = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const data = await getSectionsByClass(classId);
      setSections(data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, [classId]);

  /* open modal */
  const handleOpenModal = () => {
    setForm({ class_id: classId, sectionNames: [""] });
    setOpen(true);
  };

  /* field handlers */
  const addField = () => {
    setForm(prev => ({ ...prev, sectionNames: [...prev.sectionNames, ""] }));
  };

  const removeField = (index) => {
    if (form.sectionNames.length > 1) {
      setForm(prev => ({
        ...prev,
        sectionNames: prev.sectionNames.filter((_, i) => i !== index)
      }));
    }
  };

  const updateField = (index, value) => {
    const newNames = [...form.sectionNames];
    newNames[index] = value;
    setForm(prev => ({ ...prev, sectionNames: newNames }));
  };

  /* submit multiple sections */
  const submit = async (e) => {
    e.preventDefault();
    if (!form.class_id) {
      alert("Please select a class");
      return;
    }

    // Filter valid names
    const validNames = form.sectionNames.filter(name => name.trim() !== "");
    if (validNames.length === 0) {
      alert("Please enter at least one section name");
      return;
    }

    try {
      let createdCount = 0;

      // Create each section sequentially
      for (const name of validNames) {
        await createSection({
          class_id: form.class_id,
          name: name.trim()
        });
        createdCount++;
      }

      setOpen(false);
      setForm({ class_id: "", sectionNames: [""] }); // Reset form

      if (String(classId) !== String(form.class_id)) {
        setClassId(form.class_id);
      } else {
        loadSections();
      }
      alert(`Successfully created ${createdCount} section(s).`);

    } catch (err) {
      console.error(err);
      alert("Failed to create some sections. Please check duplicates.");
    }
  };

  const toggleStatus = async (sectionId, currentStatus) => {
    try {
      await updateSectionStatus(sectionId, !currentStatus);
      loadSections();
    } catch (err) {
      console.error("Failed to update section status", err);
      alert("Failed to update section status");
    }
  };

  const filtered = sections.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* bulk upload handler */
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to upload");
      return;
    }

    // TODO: Implement actual API call here
    // const formData = new FormData();
    // formData.append("file", file);
    // await api.post("/api/sections/bulk", formData);

    alert(`File "${file.name}" selected for upload. (Backend integration pending)`);
    setBulkOpen(false);
    setFile(null);
  };

  return (
    <div className="sections-page-wrapper">
      <header className="page-header-premium">
        <div className="header-info">
          <div className="header-icon-box"><Hash size={24} /></div>
          <div>
            <h1>Academic Divisions</h1>
            <p>Institutional subsections and group configurations.</p>
          </div>
        </div>
        <div className="header-actions">
          <Button onClick={() => setBulkOpen(true)} variant="outline" className="h-10 px-4 rounded-xl font-bold border-blue-200 text-blue-600 hover:bg-blue-50 mr-2">
            <UploadCloud size={18} className="mr-2" /> Bulk Upload
          </Button>
          <Button onClick={handleOpenModal} className="h-10 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={18} className="mr-2" /> Add Division
          </Button>
        </div>
      </header>

      <div className="sections-filter-row">
        <div className="sections-left-actions">
          <div className="sections-search-wrap">
            <Search size={18} className="text-slate-400" />
            <input
              placeholder="Filter by division..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="sections-class-select">
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              disabled={loadingClasses}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>Grade {c.class_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="sections-header-badge">
          <LayoutGrid size={16} className="text-blue-600" />
          <span>Card View Only</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state-premium">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="mt-4 font-semibold text-slate-500">Synchronizing Academic Data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-premium">
          <Info size={48} className="mx-auto mb-4 opacity-20" />
          <h3>No Divisions Identified</h3>
          <p>Initialize your academic structure by adding a new division.</p>
        </div>
      ) : (
        <div className="content-reveal-wrapper">
          <div className="sections-grid-premium">
            {paginatedItems.map((s) => (
              <div key={s.id} className="sections-card-premium">
                <div className="card-top">
                  <div className="section-title">
                    <div className="icon-box-small"><Hash size={18} /></div>
                    <span>Division {s.name}</span>
                  </div>
                  <div className={`status-dot ${s.is_active ? "active" : "inactive"}`} title={s.is_active ? "Functional" : "Suspended"} />
                </div>
                <div className="card-details-box">
                  <div className="detail-item">
                    <span className="label">Status</span>
                    <span className="value">{s.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <div className="card-footer-actions">
                  <Button variant="ghost" className="edit-btn" onClick={() => toggleStatus(s.id, s.is_active)}>
                    {s.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="pagination-footer-premium">
              <div className="pagination-info">
                Showing Divisions {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
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

      {/* BULK UPLOAD MODAL */}
      {bulkOpen && (
        <div className="modal-backdrop" onClick={() => setBulkOpen(false)}>
          <div className="modal-container-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="title-info">
                <h2>Bulk Import Divisions</h2>
                <p>Upload a CSV or Excel file to import multiple sections.</p>
              </div>
              <button className="close-x-btn" onClick={() => setBulkOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleBulkUpload}>
              <div className="modal-form-scroll">
                <div className="form-group">
                  <Label>Select File</Label>
                  <div className="file-upload-box h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    <UploadCloud size={32} className="text-slate-400 mb-2" />
                    <span className="text-sm font-semibold text-slate-600">
                      {file ? file.name : "Click to upload or drag file"}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">.csv, .xlsx support</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer-premium">
                <Button type="button" variant="ghost" onClick={() => setBulkOpen(false)} className="cancel-btn">Cancel</Button>
                <Button type="submit" className="submit-btn-premium bg-blue-600 hover:bg-blue-700">Import Data</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SECTION MODAL */}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-container-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="title-info">
                <h2>Provision Division</h2>
                <p>Specify parameters for the new academic subsection.</p>
              </div>
              <button className="close-x-btn" onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-form-scroll">
                <div className="form-group">
                  <Label>Institutional Grade</Label>
                  <select className="modal-input-premium" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                    <option value="">Select Target Grade</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>Grade {c.class_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <Label>Division Designations</Label>
                  <div className="space-y-3">
                    {form.sectionNames.map((name, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          className="modal-input-premium flex-1"
                          placeholder={`Division Name (e.g. ${String.fromCharCode(65 + index)})`}
                          value={name}
                          onChange={(e) => updateField(index, e.target.value)}
                        />
                        {form.sectionNames.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeField(index)}
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
                    onClick={addField}
                    className="mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-sm p-0 h-auto"
                  >
                    <Plus size={16} className="mr-1" /> Add Another Division
                  </Button>
                </div>
              </div>
              <div className="modal-footer-premium">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="cancel-btn">Abort</Button>
                <Button type="submit" className="submit-btn-premium bg-blue-600 hover:bg-blue-700">Provision Division</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
