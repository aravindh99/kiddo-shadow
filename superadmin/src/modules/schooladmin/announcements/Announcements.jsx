import React, { useEffect, useState } from "react";
import { getAnnouncements, createAnnouncement } from "./Announcements";
import { getClasses } from "../classes/class";
import { getSectionsByClass } from "../sections/Sections";
import {
    Megaphone,
    Plus,
    Bell,
    Users,
    Clock,
    Loader2,
    Search,
    Filter,
    Users2,
    GraduationCap,
    Sparkles,
    Info,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SuccessModal from "../../../components/SuccessModal";
import "./Announcements.css";

export default function Announcements() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [successMsg, setSuccessMsg] = useState(null);

    // Lists for selection
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        message: "",
        target_role: "all",
        class_id: "",
        section_id: ""
    });

    const fetchAll = async () => {
        try {
            setLoading(true);
            const items = await getAnnouncements();
            setList(items || []);
        } catch (err) {
            // Check for the specific enum error caused by "school_admin" role
            if (err.message?.includes("invalid input value for enum") || err.message?.includes("enum_notifications_target_role")) {
                // Determine if we should show a warning or just empty state
                // For now, valid empty state is better than a crash
                console.warn("Notification history unavailable for 'school_admin' role due to backend enum constraint.");
                setList([]);
            } else {
                console.error("Failed to fetch announcements:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadSelectionData = async () => {
        try {
            const cls = await getClasses();
            setClasses(cls?.items || []);
        } catch (err) {
            console.error("Failed to load classes:", err);
        }
    };

    useEffect(() => {
        fetchAll();
        loadSelectionData();
    }, []);

    useEffect(() => {
        if (formData.class_id) {
            const loadSections = async () => {
                const sec = await getSectionsByClass(formData.class_id);
                setSections(sec || []);
            };
            loadSections();
        } else {
            setSections([]);
        }
    }, [formData.class_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const payload = {
                title: formData.title,
                message: formData.message,
                target_role: formData.target_role
            };

            if (formData.class_id) payload.class_id = Number(formData.class_id);
            if (formData.section_id) payload.section_id = Number(formData.section_id);

            await createAnnouncement(payload);
            setSuccessMsg("Broadcast successfully dispatched to the selected audience.");
            setOpen(false);
            setFormData({ title: "", message: "", target_role: "all", class_id: "", section_id: "" });
            fetchAll();
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    const getTargetLabel = (role) => {
        const map = {
            all: "Everyone",
            admin: "Administrators",
            teacher: "Faculty Only",
            parent: "Guardians Only",
            student: "Students Only"
        };
        return map[role] || role;
    };

    const getTargetIcon = (role) => {
        if (role === 'teacher') return <GraduationCap size={14} />;
        if (role === 'all') return <Bell size={14} />;
        return <Users2 size={14} />;
    };

    return (
        <div className="announcements-page">
            <header className="page-header-premium">
                <div className="header-info">
                    <div className="header-icon-box">
                        <Megaphone size={32} />
                    </div>
                    <div>
                        <h1>Academic Broadcasts</h1>
                        <p>Strategically communicate temporal updates across the institution.</p>
                    </div>
                </div>

                <Button className="create-announcement-btn" onClick={() => setOpen(true)}>
                    <Sparkles size={18} style={{ marginRight: 10 }} /> Compose Broadcast
                </Button>

                {open && (
                    <div className="premium-modal-overlay" onClick={() => !processing && setOpen(false)}>
                        <div className="premium-modal-card" onClick={e => e.stopPropagation()}>
                            <div className="modal-header-section">
                                <div>
                                    <h2 className="modal-title-premium">Broadcast Composer</h2>
                                    <p className="modal-subtitle-premium">Define targeted audience and message core.</p>
                                </div>
                                <button className="close-modal-btn" onClick={() => setOpen(false)} disabled={processing}>
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="announcement-form-premium">
                                <div className="input-group">
                                    <Label>Broadcast Title</Label>
                                    <Input
                                        className="premium-input-minimal"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Annual Academic Postponement"
                                        required
                                        disabled={processing}
                                    />
                                </div>

                                <div className="input-group">
                                    <Label>Target Audience</Label>
                                    <div className="select-wrapper-premium">
                                        <select
                                            className="custom-select-premium"
                                            value={formData.target_role}
                                            onChange={e => setFormData({ ...formData, target_role: e.target.value })}
                                            disabled={processing}
                                        >
                                            <option value="all">Global Institution (Everyone)</option>
                                            <option value="admin">Administrative Staff (Admins)</option>
                                            <option value="teacher">Faculty Registry (Teachers)</option>
                                            <option value="parent">Guardian Registry (Parents)</option>
                                            <option value="student">Learner Registry (Students)</option>
                                        </select>
                                    </div>
                                </div>

                                {(formData.target_role === 'student' || formData.target_role === 'parent') && (
                                    <div className="scope-grid-premium">
                                        <div className="input-group">
                                            <Label>Class Scope</Label>
                                            <div className="select-wrapper-premium">
                                                <select
                                                    className="custom-select-premium"
                                                    value={formData.class_id}
                                                    onChange={e => setFormData({ ...formData, class_id: e.target.value, section_id: "" })}
                                                    disabled={processing}
                                                >
                                                    <option value="">Full School Scope</option>
                                                    {classes.map(c => <option key={c.id} value={c.id}>Class {c.class_name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <Label>Section Scope</Label>
                                            <div className="select-wrapper-premium">
                                                <select
                                                    className="custom-select-premium"
                                                    value={formData.section_id}
                                                    onChange={e => setFormData({ ...formData, section_id: e.target.value })}
                                                    disabled={!formData.class_id || processing}
                                                >
                                                    <option value="">All Divisions</option>
                                                    {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="input-group">
                                    <Label>Communication Core</Label>
                                    <textarea
                                        className="premium-textarea"
                                        rows="4"
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Articulate the core message here..."
                                        required
                                        disabled={processing}
                                    />
                                </div>

                                <div className="modal-footer-premium">
                                    <Button variant="ghost" className="cancel-btn-premium" onClick={() => setOpen(false)} disabled={processing}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="execute-btn-premium" disabled={processing}>
                                        {processing ? <Loader2 className="animate-spin mr-2" /> : <Megaphone size={18} className="mr-2" />}
                                        {processing ? "Dispatching..." : "Execute Broadcast"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </header>

            <div className="broadcast-grid">
                {loading ? (
                    <div className="loading-state" style={{ gridColumn: "1/-1", textAlign: "center", padding: "100px" }}>
                        <Loader2 className="animate-spin" size={48} style={{ margin: "0 auto 20px" }} />
                        <p style={{ fontWeight: 600, color: "#64748b" }}>Synchronizing Broadcast History...</p>
                    </div>
                ) : (list || []).length > 0 ? (
                    list.map(item => (
                        <div key={item.id} className="broadcast-card">
                            <div className="broadcast-badge">
                                {getTargetIcon(item.target_role)}
                                {getTargetLabel(item.target_role)}
                            </div>
                            <h3>{item.title}</h3>
                            <p>{item.message}</p>

                            {(item.class_id || item.section_id) && (
                                <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                                    {item.class_id && <span className="badge-pill badge-blue" style={{ fontSize: "0.65rem" }}>C-{item.class_id}</span>}
                                    {item.section_id && <span className="badge-pill badge-gray" style={{ fontSize: "0.65rem" }}>S-{item.section_id}</span>}
                                </div>
                            )}

                            <div className="broadcast-footer">
                                <div className="meta">
                                    <Clock size={14} />
                                    {new Date(item.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="meta" style={{ color: "#10b981" }}>
                                    <Info size={14} />
                                    Propagated
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state-card">
                        <Megaphone size={64} />
                        <h3>Institutional Silence</h3>
                        <p>No academic broadcasts have been propagated yet. Start articulation by clicking "Compose Broadcast".</p>
                    </div>
                )}
            </div>

            <SuccessModal
                isOpen={!!successMsg}
                onClose={() => setSuccessMsg(null)}
                title="Broadcast Propagated"
                message={successMsg}
            />
        </div>
    );
}
