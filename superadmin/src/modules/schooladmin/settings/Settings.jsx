import { useState } from "react";
import {
    Settings as SettingsIcon,
    Shield,
    Bell,
    Palette,
    Save,
    Image as ImageIcon
} from "lucide-react";
import "./Settings.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SuccessModal from "@/components/SuccessModal";

export default function Settings() {
    const [showSuccess, setShowSuccess] = useState(false);
    const [modalContent, setModalContent] = useState({ title: "", message: "", type: "success" });

    const handleSaveConfig = () => {
        setModalContent({
            title: "Settings Updated",
            message: "Your school configuration and branding preferences have been successfully applied.",
            type: "success"
        });
        setShowSuccess(true);
    };

    const handleResetPassword = () => {
        setModalContent({
            title: "Security Updated",
            message: "Your administrator password has been successfully reset. Please use your new credentials for the next login.",
            type: "security"
        });
        setShowSuccess(true);
    };

    return (
        <div className="settings-page">
            <header className="page-header-premium">
                <div className="header-info">
                    <div className="header-icon-box">
                        <SettingsIcon size={32} />
                    </div>
                    <div>
                        <h1>System configuration</h1>
                        <p>Configure institutional parameters and branding protocols.</p>
                    </div>
                </div>
                <Button
                    className="execute-btn-premium h-12 px-8 rounded-xl font-bold flex gap-2"
                    onClick={handleSaveConfig}
                >
                    <Save size={18} /> Commit Configuration
                </Button>
            </header>

            <div className="settings-grid">
                {/* Branding Section */}
                <div className="settings-section">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Palette size={20} />
                        </div>
                        <h2 className="text-xl font-bold">School Branding</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <Label className="text-xs font-bold text-slate-500">INSTITUTION NAME</Label>
                            <Input defaultValue="Chinmaya Vidyalaya" className="premium-input h-11" />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                                <ImageIcon size={24} />
                            </div>
                            <Button variant="outline" size="sm">Change Logo</Button>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="settings-section">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-red-100 p-2 rounded-lg text-red-600">
                            <Shield size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Security & Access</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <Label className="text-xs font-bold text-slate-500">ADMIN PASSWORD</Label>
                            <Input type="password" value="********" className="premium-input h-11" />
                        </div>
                        <Button
                            variant="outline"
                            className="text-red-600 border-red-100 hover:bg-red-50"
                            onClick={handleResetPassword}
                        >
                            Reset Security Credentials
                        </Button>
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="settings-section">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                            <Bell size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Preferences</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold text-slate-700">Email Notifications</p>
                                <p className="text-xs text-slate-500">Receive weekly attendance reports</p>
                            </div>
                            <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title={modalContent.title}
                message={modalContent.message}
                type={modalContent.type}
            />
        </div>
    );
}
