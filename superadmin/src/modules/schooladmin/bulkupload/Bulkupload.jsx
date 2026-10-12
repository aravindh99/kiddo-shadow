import React, { useState } from "react";
import { bulkCreateData } from "./Bulkupload";
import "./Bulkupload.css";

import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  Database,
  Settings,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from "lucide-react";

// Initial row structure
const EMPTY_SECTION = { name: "", students: "" };
const EMPTY_CLASS = { name: "", sections: [{ ...EMPTY_SECTION }] };

export default function BulkUpload() {
  const [rows, setRows] = useState([{ ...EMPTY_CLASS }]);
  const [teacherCount, setTeacherCount] = useState(""); // Global teacher count
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  /* ================= HANDLERS ================= */
  const addClass = () => setRows([...rows, { ...EMPTY_CLASS }]);

  const removeClass = (classIndex) =>
    setRows(rows.filter((_, i) => i !== classIndex));

  const updateClassName = (classIndex, name) => {
    const copy = [...rows];
    copy[classIndex].name = name;
    setRows(copy);
  };

  const addSection = (classIndex) => {
    const copy = [...rows];
    copy[classIndex].sections.push({ ...EMPTY_SECTION });
    setRows(copy);
  };

  const removeSection = (classIndex, sectionIndex) => {
    const copy = [...rows];
    copy[classIndex].sections = copy[classIndex].sections.filter((_, i) => i !== sectionIndex);
    setRows(copy);
  };

  const updateSection = (classIndex, sectionIndex, field, value) => {
    const copy = [...rows];
    copy[classIndex].sections[sectionIndex][field] = value;
    setRows(copy);
  };

  /* ================= DATA SUBMISSION ================= */
  const handleSubmit = async () => {
    setError("");
    setResult(null);

    // Deep Validation
    for (let i = 0; i < rows.length; i++) {
      const cls = rows[i];
      if (!cls.name.trim()) {
        setError(`Class ${i + 1}: Name is required.`);
        return;
      }
      for (let j = 0; j < cls.sections.length; j++) {
        const sec = cls.sections[j];
        if (!sec.name.trim()) {
          setError(`Class ${cls.name || (i + 1)}: Section ${j + 1} name is required.`);
          return;
        }
        if (!sec.students || Number(sec.students) <= 0) {
          setError(`Class ${cls.name || (i + 1)}: Section ${sec.name || (j + 1)} capacity must be positive.`);
          return;
        }
      }
    }

    const payload = {
      classes: rows.map(r => ({
        name: r.name.trim(),
        sections: r.sections.map(s => ({
          name: s.name.trim(),
          students: Number(s.students)
        }))
      })),
      teacher_count: Number(teacherCount) || 0
    };

    try {
      setLoading(true);
      const res = await bulkCreateData(payload);
      const data = res?.data || res;
      setResult(data);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || e?.message || "Protocol rejection during bulk provisioning.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-page-premium">
      <header className="page-header-premium">
        <div className="header-info">
          <div className="header-icon-box">
            <Settings size={24} />
          </div>
          <div>
            <h1>Bulk Provisioning</h1>
            <p>Streamline institutional configuration through batch processing.</p>
          </div>
        </div>
        <div className="header-actions-premium">
          <div className="id-cell">
            <Database size={14} className="text-blue-500" />
            <span>Setup Protocol EX-800</span>
          </div>
        </div>
      </header>

      {!result ? (
        <div className="bulk-setup-container">
          {/* TEACHER SECTION */}
          <div className="setup-card" style={{ marginBottom: '24px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RefreshCw size={20} className="text-blue-600" />
              Global Faculty
            </h2>
            <div className="input-group-premium" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '15px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', minWidth: '150px' }}>Total Teachers:</span>
              <input
                className="input-premium"
                type="number"
                min="0"
                placeholder="e.g. 50"
                value={teacherCount}
                onChange={(e) => setTeacherCount(e.target.value)}
                style={{ width: "160px" }}
              />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>System will automatically generate credentials for specified faculty count.</p>
            </div>
          </div>

          <div className="sections-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={22} className="text-blue-500" />
              Institutional Structure
            </h2>
            <Button variant="outline" size="sm" onClick={addClass} className="border-blue-200 text-blue-600 hover:bg-blue-50">
              <Plus size={16} className="mr-2" /> Add Class
            </Button>
          </div>

          <div className="class-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {rows.map((cls, classIdx) => (
              <div key={classIdx} className="setup-card class-card-premium" style={{ borderLeft: '4px solid #3b82f6' }}>
                <div className="class-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                    <span className="label" style={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.7rem' }}>Class ID</span>
                    <input
                      className="input-premium"
                      placeholder="e.g. 7"
                      value={cls.name}
                      onChange={(e) => updateClassName(classIdx, e.target.value)}
                      style={{ maxWidth: '180px', fontWeight: 800, fontSize: '1.1rem' }}
                    />
                  </div>
                  {rows.length > 1 && (
                    <button className="remove-row-btn" onClick={() => removeClass(classIdx)} style={{ padding: '8px', color: '#ef4444' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="sections-grid-premium" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0 12px' }}>Section Identity</th>
                        <th style={{ padding: '0 12px' }}>Student Quota</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cls.sections.map((sec, secIdx) => (
                        <tr key={secIdx}>
                          <td style={{ padding: '0 8px' }}>
                            <input
                              className="input-premium"
                              placeholder="e.g. 7A"
                              value={sec.name}
                              onChange={(e) => updateSection(classIdx, secIdx, "name", e.target.value)}
                            />
                          </td>
                          <td style={{ padding: '0 8px' }}>
                            <input
                              className="input-premium"
                              type="number"
                              placeholder="30"
                              value={sec.students}
                              onChange={(e) => updateSection(classIdx, secIdx, "students", e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {cls.sections.length > 1 && (
                              <button onClick={() => removeSection(classIdx, secIdx)} style={{ color: '#94a3b8', hover: { color: '#ef4444' } }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Button variant="ghost" size="sm" onClick={() => addSection(classIdx)} style={{ marginTop: '10px', width: '100%', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                    <Plus size={14} className="mr-2" /> Add Section to Class {cls.name || (classIdx + 1)}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="error-toast" style={{ marginTop: '24px' }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="main-action-area" style={{ marginTop: '40px' }}>
            <Button
              className="btn-primary-premium"
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', height: '56px', fontSize: '1rem' }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Serializing Institutional Data...
                </>
              ) : (
                <>
                  Execute Automated Registry Protocol
                  <ArrowRight size={20} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="success-result-card">
          <div className="success-icon-wrap">
            <CheckCircle size={32} />
          </div>
          <h2>Provisioning Confirmed</h2>
          <p style={{ color: "#64748b", fontSize: "1rem", marginBottom: "32px", fontWeight: 500 }}>
            {result.message || "Institutional entities have been successfully serialized and indexed."}
          </p>

          <div className="summary-stats-grid">
            <div className="stat-premium-card">
              <span className="stat-label">Classes Generated</span>
              <span className="stat-value">{result.summary?.classes_created || 0}</span>
            </div>
            <div className="stat-premium-card">
              <span className="stat-label">Faculty Provisioned</span>
              <span className="stat-value">{result.summary?.teachers_created || 0}</span>
            </div>
            <div className="stat-premium-card">
              <span className="stat-label">Sections Generated</span>
              <span className="stat-value">{result.summary?.sections_created || 0}</span>
            </div>
            <div className="stat-premium-card">
              <span className="stat-label">Learners Registered</span>
              <span className="stat-value">{result.summary?.students_created || 0}</span>
            </div>
          </div>

          <Button
            className="btn-primary-premium"
            onClick={() => { setResult(null); setRows([{ ...EMPTY_CLASS }]); }}
            style={{ width: "280px", margin: "0 auto" }}
          >
            <RefreshCw size={18} />
            Start New Protocol
          </Button>
        </div>
      )}
    </div>
  );
}
