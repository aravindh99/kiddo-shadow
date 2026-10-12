import React, { useState } from "react";
import {
    CheckCircle2,
} from "lucide-react";

import "./Subscriptions.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SuccessModal from "@/components/SuccessModal";

import { createSubscription } from "./Subscriptions.js";

export default function Subscriptions() {
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        schoolId: "",
        status: "active",
        startDate: "",
        endDate: "",
        notes: "",
    });

    /* ================= SUBMIT ================= */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.schoolId || !form.status || !form.startDate || !form.endDate) {
            setError("School ID, Status, Start Date, and End Date are required.");
            return;
        }

        setSaving(true);

        const payload = {
            schoolId: Number(form.schoolId),
            status: form.status,
            startDate: form.startDate,
            endDate: form.endDate,
            notes: form.notes.trim(),
        };

        try {
            await createSubscription(payload);
            setSuccess("Subscription updated successfully");

            // Reset form after success
            setForm({
                schoolId: "",
                status: "active",
                startDate: "",
                endDate: "",
                notes: "",
            });
        } catch (e) {
            setError(e?.message || "Operation failed");
        } finally {
            setSaving(false);
        }
    };

    /* ================= UI ================= */
    return (
        <div className="subscriptions-content">
            <header className="subscriptions-header">
                <div>
                    <h1>Manage Subscription</h1>
                    <p>Create or update school subscription plans</p>
                </div>
            </header>

            {error && <div className="error-alert">{error}</div>}

            {/* SUBSCRIPTION FORM */}
            <div className="subscription-form-container">
                <div className="form-card-premium">
                    <div className="form-card-header">
                        <div className="icon-wrap-premium">
                            <CheckCircle2 size={28} />
                        </div>
                        <div className="title-info">
                            <h2>Subscription Details</h2>
                            <p>Enter the subscription information below</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="subscription-form">
                        <div className="form-grid-2">
                            <div className="form-group">
                                <Label>School ID *</Label>
                                <Input
                                    type="number"
                                    placeholder="School ID"
                                    value={form.schoolId}
                                    onChange={(e) =>
                                        setForm({ ...form, schoolId: e.target.value })
                                    }
                                    className="modal-input-premium"
                                />
                            </div>

                            <div className="form-group">
                                <Label>Status *</Label>
                                <select
                                    className="modal-select-premium"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <Label>Start Date *</Label>
                                <Input
                                    type="date"
                                    value={form.startDate}
                                    onChange={(e) =>
                                        setForm({ ...form, startDate: e.target.value })
                                    }
                                    className="modal-input-premium"
                                />
                            </div>

                            <div className="form-group">
                                <Label>End Date *</Label>
                                <Input
                                    type="date"
                                    value={form.endDate}
                                    onChange={(e) =>
                                        setForm({ ...form, endDate: e.target.value })
                                    }
                                    className="modal-input-premium"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <Label>Notes (Optional)</Label>
                            <textarea
                                placeholder="Add any additional notes about this subscription..."
                                value={form.notes}
                                onChange={(e) =>
                                    setForm({ ...form, notes: e.target.value })
                                }
                                className="modal-textarea-premium"
                                rows="4"
                            />
                        </div>

                        <div className="form-footer">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setForm({
                                    schoolId: "",
                                    status: "active",
                                    startDate: "",
                                    endDate: "",
                                    notes: "",
                                })}
                                className="cancel-btn"
                            >
                                Reset Form
                            </Button>
                            <Button type="submit" disabled={saving} className="submit-btn-premium">
                                {saving ? "Saving..." : "Update Subscription"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <SuccessModal
                isOpen={!!success}
                onClose={() => setSuccess(null)}
                title="Success"
                message={success}
            />
        </div>
    );
}
