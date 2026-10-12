import React, { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    X,
    User as UserIcon,
    Mail,
    Shield,
    Fingerprint,
    Search as SearchIcon,
    AlertCircle,
    UserCheck,
    GraduationCap,
    Users as UsersGroup,
    ShieldCheck
} from "lucide-react";

import "./User.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SuccessModal from "@/components/SuccessModal";

import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
} from "./User.js";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        username: "",
        email: "",
        role: "teacher",
        name: "", // Full Name
    });

    /* ================= FETCH ================= */
    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await getUsers();
            setUsers(res.items || []);
        } catch {
            setError("Synchronization failed. Check your registry access.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    /* ================= SUBMIT ================= */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.username || !form.email) {
            setError("Account credentials (Username/Email) are mandatory.");
            return;
        }

        setSaving(true);

        const payload = {
            username: form.username.trim(),
            email: form.email.trim(),
            role: form.role,
            name: form.name.trim(),
        };

        try {
            if (editingId) {
                await updateUser(editingId, payload);
                setSuccess("Access profile reconstructed successfully.");
            } else {
                await createUser(payload);
                setSuccess("New identity provisioned in the school registry.");
            }

            resetForm();
            loadUsers();
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Protocol mismatch during provisioning.");
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({
            username: "",
            email: "",
            role: "teacher",
            name: "",
        });
        setEditingId(null);
        setOpen(false);
    };

    const handleEdit = (u) => {
        setEditingId(u.id);
        setForm({
            username: u.username || "",
            email: u.email || "",
            role: u.role || "teacher",
            name: u.name || "",
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Decommission this identity permanently? This action is irreversible.")) return;
        try {
            await deleteUser(id);
            loadUsers();
        } catch (err) {
            setError("Failed to decommission identity.");
        }
    };

    const toggleStatus = async (user) => {
        try {
            await updateUserStatus(user.id, !user.is_active);
            loadUsers();
        } catch (err) {
            console.error("Failed to update security status", err);
        }
    };

    /* ================= FILTER ================= */
    const filtered = users.filter((u) =>
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.institutional_id?.toLowerCase().includes(search.toLowerCase()) ||
        u.student_id?.toLowerCase().includes(search.toLowerCase()) ||
        u.teacher_id?.toLowerCase().includes(search.toLowerCase()) ||
        u.parent_id?.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
        const idA = a.role === 'student' ? a.student_id : (a.role === 'teacher' ? a.teacher_id : (a.role === 'parent' ? a.parent_id : a.institutional_id)) || a.username || "";
        const idB = b.role === 'student' ? b.student_id : (b.role === 'teacher' ? b.teacher_id : (b.role === 'parent' ? b.parent_id : b.institutional_id)) || b.username || "";
        return idA.localeCompare(idB, undefined, { numeric: true });
    });

    /* ================= UI HELPERS ================= */
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <ShieldCheck size={14} />;
            case 'teacher': return <UserCheck size={14} />;
            case 'student': return <GraduationCap size={14} />;
            case 'parent': return <UsersGroup size={14} />;
            default: return <UserIcon size={14} />;
        }
    };

    return (
        <div className="users-page-premium">
            <header className="page-header-premium">
                <div className="header-info">
                    <div className="header-icon-box">
                        <UsersGroup size={32} />
                    </div>
                    <div>
                        <h1>Identity Registry</h1>
                        <p>Manage faculty, students, and institutional access control.</p>
                    </div>
                </div>

                <Button onClick={() => setOpen(true)} className="add-btn-premium">
                    <Plus size={18} className="mr-2" /> Provision New Identity
                </Button>
            </header>

            {/* SEARCH AND FILTER */}
            <div className="actions-bar-premium">
                <div className="search-wrapper-premium">
                    <SearchIcon className="search-icon-premium" size={20} />
                    <input
                        type="text"
                        placeholder="Search by ID, Name, Username or Email..."
                        className="search-input-premium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="protocol-alert-premium">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="loading-state-premium">
                    <Loader2 className="animate-spin" size={48} />
                    <p>Accessing Identity Database...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state-premium">
                    <div className="empty-icon-box">
                        <Fingerprint size={64} style={{ opacity: 0.1 }} />
                    </div>
                    <h3>No identities found</h3>
                    <p>Adjust your search parameters or provision a new user.</p>
                </div>
            ) : (
                <div className="table-container-premium">
                    <table className="users-premium-table">
                        <thead>
                            <tr>
                                <th>Institutional ID</th>
                                <th>Identity</th>
                                <th>Email Address</th>
                                <th>Permissions</th>
                                <th>Access Status</th>
                                <th style={{ textAlign: "right" }}>Registry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="id-badge-premium">
                                            {u.role === 'student' ? (u.student_id || u.institutional_id) :
                                                u.role === 'teacher' ? (u.teacher_id || u.institutional_id) :
                                                    u.role === 'parent' ? (u.parent_id || u.institutional_id) :
                                                        u.institutional_id || `SYS-${u.id.toString().padStart(3, '0')}`}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="identity-cell">
                                            <div className="avatar-mini">
                                                {u.name ? u.name[0] : (u.username ? u.username[0] : "?")}
                                            </div>
                                            <div className="identity-info">
                                                <span className="full-name">{u.name || "Unnamed Identity"}</span>
                                                <span className="username">@{u.username}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="email-link">
                                            <Mail size={14} />
                                            {u.email}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge role-${u.role}`}>
                                            {getRoleIcon(u.role)}
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => toggleStatus(u)}
                                            className={`status-pill ${u.is_active ? 'active' : 'inactive'}`}
                                            title="Toggle Access"
                                        >
                                            <div className="status-dot"></div>
                                            {u.is_active ? "Authorized" : "Revoked"}
                                        </button>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <div className="row-actions-premium">
                                            <button className="action-circle accent" onClick={() => handleEdit(u)} title="Modify Registry">
                                                <Edit size={16} />
                                            </button>
                                            <button className="action-circle danger" onClick={() => handleDelete(u.id)} title="Decommission Identity">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PROVISIONING MODAL */}
            {open && (
                <div className="premium-modal-overlay" onClick={resetForm}>
                    <div className="premium-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-section">
                            <div>
                                <h2 className="modal-title-premium">{editingId ? "Modify Identity" : "Provision Identity"}</h2>
                                <p className="modal-subtitle-premium">Define institutional access parameters and credentials.</p>
                            </div>
                            <button className="close-modal-btn" onClick={resetForm}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="announcement-form-premium">
                            <div className="form-group-premium">
                                <Label>Full Legal Name *</Label>
                                <Input
                                    placeholder="Enter full name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="custom-select-premium"
                                    required
                                />
                            </div>

                            <div className="scope-grid-premium" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group-premium">
                                    <Label>Account Username *</Label>
                                    <Input
                                        placeholder="e.g. j.doe"
                                        value={form.username}
                                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                                        className="custom-select-premium"
                                        required
                                    />
                                </div>
                                <div className="form-group-premium">
                                    <Label>Email Address *</Label>
                                    <Input
                                        type="email"
                                        placeholder="institutional@domain.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="custom-select-premium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group-premium">
                                <Label>Select Institutional Role *</Label>
                                <div className="select-wrapper-premium">
                                    <select
                                        className="custom-select-premium"
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    >
                                        <option value="student">Learner Registry (Student)</option>
                                        <option value="teacher">Faculty Registry (Teacher)</option>
                                        <option value="parent">Guardian Registry (Parent)</option>
                                        <option value="admin">Administrative Staff (Admin)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer-premium">
                                <Button variant="ghost" className="cancel-btn-premium" onClick={resetForm}>
                                    Terminate
                                </Button>
                                <Button type="submit" disabled={saving} className="execute-btn-premium">
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : editingId ? "Modify Protocol" : "Provision Profile"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <SuccessModal
                isOpen={!!success}
                onClose={() => setSuccess(null)}
                title="Identity Provisioned"
                message={success}
            />
        </div>
    );
}
