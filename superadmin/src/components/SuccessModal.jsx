import React from 'react';
import { CheckCircle2, Info, Shield } from 'lucide-react';
import './SuccessModal.css';

export default function SuccessModal({ isOpen, onClose, title, message, type = "success" }) {
    if (!isOpen) return null;

    const isSecurity = type === "security";

    return (
        <div className="success-modal-overlay" onClick={onClose}>
            <div className="success-modal-container" onClick={e => e.stopPropagation()}>
                <div className={`success-illustration ${isSecurity ? 'security-theme' : ''}`}>
                    <div className="success-icon-bg">
                        {isSecurity ? <Shield size={40} /> : <CheckCircle2 size={40} />}
                    </div>
                    <svg className="absolute inset-0 opacity-5 pointer-events-none" viewBox="0 0 400 160">
                        <circle cx="50" cy="80" r="40" fill="currentColor" />
                        <path d="M300 40 Q340 80 300 120" stroke="currentColor" fill="none" strokeWidth="4" />
                    </svg>
                </div>

                <h2>{title || "Success!"}</h2>
                <div className="success-modal-message">{message || "The action was completed successfully."}</div>

                <div className="success-modal-footer">
                    <button className="info-icon-small" title="Learn more">
                        <Info size={20} />
                    </button>
                    <button className="btn-premium-ok" onClick={onClose}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
