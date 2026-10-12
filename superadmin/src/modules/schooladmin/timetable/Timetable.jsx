import React, { useEffect, useState } from "react";
import "./Timetable.css";
import {
  Plus,
  Loader2,
  CalendarDays,
  Search,
  Clock,
  User,
  Coffee,
  Trash2,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  BookOpen,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SuccessModal from "@/components/SuccessModal";

import {
  createTimetable,
  getTimetableBySection,
  getMyTimetable,
  getSectionAssignments,
} from "./Timetable.js";
import { getClasses, getSectionsByClass } from "../classes/class.js";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export default function Timetables() {
  const [role] = useState(localStorage.getItem("role") || "school_admin");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [activeDay, setActiveDay] = useState("monday");

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sectionAssignments, setSectionAssignments] = useState([]);

  // Selection state for creating
  const [createDay, setCreateDay] = useState("monday");
  const [entries, setEntries] = useState([
    {
      start_time: "09:00",
      end_time: "09:40",
      teacher_assignment_id: "",
      title: "",
      is_break: false,
    },
  ]);

  const [timetableData, setTimetableData] = useState({}); // { monday: [...], tuesday: [...] }
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [processing, setProcessing] = useState(false);

  /* ================= FETCH ENGINE ================= */
  const loadTimetable = async (isPersonal = false) => {
    if (!isPersonal && (!classId || !sectionId)) {
      setErrorMsg("Target Class and Section are required for synchronization.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      let data;
      if (isPersonal) {
        data = await getMyTimetable();
      } else {
        data = await getTimetableBySection(classId, sectionId);
      }
      setTimetableData(data || {});
    } catch (err) {
      console.error(err);
      setErrorMsg("Protocol mismatch during timetable retrieval.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    if (role === "teacher") {
      loadTimetable(true);
    }
  }, [role]);

  const fetchClasses = async () => {
    try {
      const { items } = await getClasses();
      setClasses(items || []);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchSections(classId);
    } else {
      setSections([]);
      setSectionId("");
    }
  }, [classId]);

  const fetchSections = async (cid) => {
    try {
      const data = await getSectionsByClass(cid);
      setSections(data || []);
    } catch (err) {
      console.error("Failed to fetch sections:", err);
    }
  };

  useEffect(() => {
    if (sectionId) {
      fetchSectionAssignments(sectionId);
    } else {
      setSectionAssignments([]);
    }
  }, [sectionId]);

  const fetchSectionAssignments = async (sid) => {
    try {
      const data = await getSectionAssignments(sid);
      setSectionAssignments(data || []);
    } catch (err) {
      console.error("Failed to fetch section assignments:", err);
    }
  };

  /* ================= HANDLERS ================= */
  const addEntry = () => {
    setEntries([...entries, {
      start_time: "",
      end_time: "",
      teacher_assignment_id: "",
      title: "",
      is_break: false
    }]);
  };

  const removeEntry = (index) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index, field, value) => {
    const copy = [...entries];
    copy[index][field] = value;
    setEntries(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classId || !sectionId) {
      setErrorMsg("Academic parameters (Class/Section) are required.");
      return;
    }

    const invalidEntry = entries.find(en => !en.is_break && !en.teacher_assignment_id);
    if (invalidEntry) {
      setErrorMsg("All academic sessions require a valid Assignment ID.");
      return;
    }

    // Helper to format time strictly as HH:mm
    const normalizeTime = (timeStr) => {
      if (!timeStr) return "00:00";
      // Handle "9" -> "09:00", "9:30" -> "09:30", "14" -> "14:00"
      const parts = timeStr.trim().split(":");
      let h = parseInt(parts[0], 10);
      let m = parts[1] ? parseInt(parts[1], 10) : 0;

      if (isNaN(h)) h = 0;
      if (isNaN(m)) m = 0;

      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    setProcessing(true);
    try {
      const payload = {
        class_id: Number(classId),
        section_id: Number(sectionId),
        day_of_week: createDay,
        entries: entries.map((en) => {
          const entry = {
            start_time: normalizeTime(en.start_time),
            end_time: normalizeTime(en.end_time),
            is_break: Boolean(en.is_break),
          };
          if (en.is_break) {
            if (en.title) entry.title = en.title;
          } else {
            if (en.teacher_assignment_id) {
              entry.teacher_assignment_id = Number(en.teacher_assignment_id);
            }
          }
          return entry;
        }),
      };

      await createTimetable(payload);
      setSuccessMsg(`Timetable for ${createDay} serialized successfully.`);
      setModalOpen(false);
      loadTimetable(role === "teacher");
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Internal registry failure.");
    } finally {
      setProcessing(false);
    }
  };

  /* ================= RENDER HELPERS ================= */
  const renderDaySchedule = (day) => {
    const dayEntries = timetableData[day] || [];
    if (dayEntries.length === 0) {
      return (
        <div className="empty-day-state" style={{ padding: "32px", textAlign: "center", color: "#64748b", fontStyle: "italic", fontSize: "0.9rem" }}>
          <CalendarDays size={32} style={{ opacity: 0.1, margin: "0 auto 12px" }} />
          No temporal slots provisioned for {day}.
        </div>
      );
    }

    return (
      <div className="schedule-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {dayEntries.map((en, idx) => {
          // Resolve information from assignment lookup if available
          const assignment = en.teacher_assignment || {};
          const subjectName = assignment.subject?.name || assignment.subject?.subject_name || en.title || (en.is_break ? "Rest Interval" : "Academic Session");
          const teacherName = assignment.teacher?.name || assignment.teacher?.user?.name || (en.is_break ? "" : "N/A");

          return (
            <div key={idx} className={`period-card scifi-glass-card reveal-up stagger-${idx + 1} ${en.is_break ? "break" : "session"}`}>
              <div className="ai-scanner-line" />
              <div className="time-slot" style={{ minWidth: "140px" }}>
                <span className="time-val tech-readout" style={{ fontSize: "1.1rem", fontWeight: 800, color: 'var(--p-accent)' }}>{en.start_time} - {en.end_time}</span>
                <span className="duration tech-readout" style={{ fontSize: "0.65rem", opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>
                  {en.is_break ? "SYSTEM HALT" : `SEGMENT #${idx + 1}`}
                </span>
              </div>

              <div className="period-meta" style={{ flexGrow: 1 }}>
                <h4 className="tech-readout font-bold" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{subjectName}</h4>
                {!en.is_break && (
                  <div className="teacher tech-readout" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    <User size={12} className="mr-2 inline" color="var(--p-accent)" />
                    {teacherName}
                  </div>
                )}
              </div>

              <div className="period-icon hologram-flicker" style={{ opacity: 0.8, color: 'var(--p-accent)' }}>
                {en.is_break ? <Coffee size={24} /> : <BookOpen size={24} />}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="timetable-page">
      <header className="premium-command-bar reveal-up">
        <div className="ai-scanner-line" />
        <div className="header-info">
          <h1 className="glitch-text tech-readout" data-text="Temporal Matrix Node">Temporal Matrix Node</h1>
          <p className="tech-readout" style={{ fontSize: '0.65rem', marginTop: '4px' }}>Orchestrate academic temporal slots with institutional precision.</p>
        </div>
        <Button
          onClick={() => {
            setEntries([{ start_time: "09:00", end_time: "09:40", teacher_assignment_id: "", title: "", is_break: false }]);
            setModalOpen(true);
          }}
          className="enroll-btn-premium scifi-glass-card" style={{ background: 'var(--sb-nav-active)', color: 'white', border: 'none', padding: '0 24px' }}
        >
          <Plus size={18} className="mr-2" /> <span className="tech-readout">Provision Temporal Link</span>
        </Button>
      </header>

      <div className="timetable-filters scifi-glass-card" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
        <div className="ai-scanner-line" />
        <div className="filter-input-wrap">
          <span className="filter-label tech-readout">Target Cluster</span>
          <select
            className="tech-readout"
            style={{ height: '44px', width: '100%', background: 'var(--p-scan-line)', border: '1px solid var(--scifi-border)', borderRadius: '12px', padding: '0 12px', color: 'var(--text-main)', fontSize: '0.8rem' }}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-input-wrap">
          <span className="filter-label tech-readout">Target Division</span>
          <select
            className="tech-readout"
            style={{ height: '44px', width: '100%', background: 'var(--p-scan-line)', border: '1px solid var(--scifi-border)', borderRadius: '12px', padding: '0 12px', color: 'var(--text-main)', fontSize: '0.8rem' }}
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
          >
            <option value="">Select Section</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          className="sync-btn-compact scifi-glass-card tech-readout"
          style={{ height: '44px', padding: '0 32px', background: 'var(--p-accent)', color: 'white', border: 'none', borderRadius: '12px' }}
          onClick={loadTimetable}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin text-white" size={16} /> : <Search size={16} />}
          <span className="ml-2">{loading ? "SYNCING..." : "RECONSTRUCT MATRIX"}</span>
        </Button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="day-selector-tabs">
        {DAYS.map(dayName => (
          <button
            key={dayName}
            className={`day-tab-btn ${activeDay === dayName ? "active" : ""}`}
            onClick={() => setActiveDay(dayName)}
          >
            {dayName}
          </button>
        ))}
      </div>

      {/* SCHEDULE VIEW */}
      <div className="schedule-view-area">
        <div className="schedule-day-column">
          <div className="day-column-header">
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <CalendarDays className="text-blue-500" size={18} />
              {activeDay} Provision
            </span>
          </div>
          {renderDaySchedule(activeDay)}
        </div>
      </div>

      {/* CREATE MODAL */}
      {modalOpen && (
        <div className="premium-modal-overlay" onClick={() => !processing && setModalOpen(false)}>
          <div className="premium-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-section">
              <div>
                <h2>Provision Schedule</h2>
                <p style={{ color: "#64748b", margin: 0, fontSize: "0.85rem", fontWeight: 500 }}>
                  Define temporal slots for <strong className="capitalize">{createDay}</strong>
                </p>
              </div>
              <select
                className="custom-select-premium"
                value={createDay}
                onChange={(e) => setCreateDay(e.target.value)}
                disabled={processing}
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="entries-scroll-area">
              {entries.map((en, i) => (
                <div key={i} className="entry-row-premium">
                  <div className="entry-grid-minimal">
                    <div className="minimal-field">
                      <span className="label">Start</span>
                      <Input
                        className="premium-input-minimal"
                        placeholder="09:00"
                        value={en.start_time}
                        onChange={(e) => updateEntry(i, "start_time", e.target.value)}
                        disabled={processing}
                      />
                    </div>
                    <div className="minimal-field">
                      <span className="label">End</span>
                      <Input
                        className="premium-input-minimal"
                        placeholder="09:40"
                        value={en.end_time}
                        onChange={(e) => updateEntry(i, "end_time", e.target.value)}
                        disabled={processing}
                      />
                    </div>
                    <div className="minimal-field">
                      <span className="label text-xs">{en.is_break ? "Legend" : "Assignment"}</span>
                      {en.is_break ? (
                        <Input
                          className="premium-input-minimal"
                          placeholder="Break Label"
                          value={en.title}
                          onChange={(e) => updateEntry(i, "title", e.target.value)}
                          disabled={processing}
                        />
                      ) : (
                        <select
                          className="premium-input-minimal bg-white"
                          value={en.teacher_assignment_id}
                          onChange={(e) => updateEntry(i, "teacher_assignment_id", e.target.value)}
                          disabled={processing}
                        >
                          <option value="">Select Assignment</option>
                          {sectionAssignments.map((as) => (
                            <option key={as.id} value={as.id}>
                              {as.subject?.name} - {as.teacher?.user?.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="row-actions-area">
                    <label className="break-toggle-minimal">
                      <input
                        type="checkbox"
                        checked={en.is_break}
                        onChange={(e) => updateEntry(i, "is_break", e.target.checked)}
                        disabled={processing}
                      />
                      <span>Break Period</span>
                    </label>

                    {entries.length > 1 && (
                      <button
                        className="remove-row-minimal"
                        onClick={() => removeEntry(i)}
                        disabled={processing}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="add-period-btn" onClick={addEntry} disabled={processing}>
              <Plus size={16} /> Insert Temporal Record
            </button>

            <div className="modal-footer">
              <Button
                variant="ghost"
                className="h-10 px-6 rounded-lg font-bold text-sm"
                onClick={() => setModalOpen(false)}
                disabled={processing}
              >
                Terminate
              </Button>
              <Button
                className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm border-none font-bold text-sm"
                onClick={handleSubmit}
                disabled={processing}
              >
                {processing ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                {processing ? "Provisioning..." : "Commit Registry"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK SYSTEM */}
      <SuccessModal
        isOpen={!!successMsg}
        onClose={() => setSuccessMsg(null)}
        title="Registry Confirmed"
        message={successMsg}
      />

      {errorMsg && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: '#0f172a', color: '#f8fafc',
          padding: '16px 24px', borderRadius: '12px',
          fontWeight: 600, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 12, zIndex: 2000,
          borderLeft: '4px solid #ef4444', fontSize: '0.85rem'
        }}>
          <AlertCircle className="text-red-500" size={20} />
          <div>{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} className="ml-2 opacity-50 hover:opacity-100">
            <XCircle size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
