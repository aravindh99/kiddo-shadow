import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    Sheet,
    SheetTrigger,
    SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    Menu,
    LayoutDashboard,
    BookOpen,
    Users,
    Layers,
    UserSquare2,
    FileSpreadsheet,
    Settings,
    LogOut,
    Sparkles,
    Sun,
    Moon,
    ClipboardList,
    CheckCircle2,
    Megaphone,
    ClipboardCheck,
    UserCog,
    Plus,
} from "lucide-react";
import { useAppTheme } from "../../context/ThemeContext";
import "./SchoolAdminLayout.css";

export default function SchoolAdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, toggleTheme } = useAppTheme();

    const adminName = localStorage.getItem("adminName") || "School Admin";
    const initials = adminName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/schooladmin/dashboard" },
        { label: "Bulk Upload", icon: <FileSpreadsheet size={20} />, path: "/schooladmin/bulkupload" },
        { label: "Teachers", icon: <UserSquare2 size={20} />, path: "/schooladmin/teachers" },
        { label: "Students", icon: <Users size={20} />, path: "/schooladmin/students" },
        { label: "Parents", icon: <Users size={20} />, path: "/schooladmin/parents" },
        { label: "Classes", icon: <BookOpen size={20} />, path: "/schooladmin/classes" },
        { label: "Subjects", icon: <BookOpen size={20} />, path: "/schooladmin/subjects" },
        { label: "Approvals", icon: <CheckCircle2 size={20} />, path: "/schooladmin/approvals" },
        { label: "Timetables", icon: <Layers size={20} />, path: "/schooladmin/timetable" },
        { label: "Assignments", icon: <ClipboardCheck size={20} />, path: "/schooladmin/assignments" },
        { label: "Announcements", icon: <Megaphone size={20} />, path: "/schooladmin/announcements" },
        { label: "Audit Logs", icon: <ClipboardList size={20} />, path: "/schooladmin/audit-logs" },
        { label: "Report Cards", icon: <FileSpreadsheet size={20} />, path: "/schooladmin/reports" },
        { label: "Settings", icon: <Settings size={20} />, path: "/schooladmin/settings" },
    ];

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <div className="admin-layout">
            {/* CORPORATE SIDEBAR */}
            <aside className="sidebar school-sidebar corporate-sidebar">
                <div className="sidebar-header-action" style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
                    <button
                        className="borderless-theme-toggle"
                        onClick={toggleTheme}
                        title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} mode`}
                    >
                        {mode === "light" ? <Moon size={22} color="#4c1d95" /> : <Sun size={22} color="#fcd34d" />}
                    </button>
                </div>

                <div className="logo corporate-logo">
                    <div className="logo-badge">
                        <Sparkles size={20} />
                    </div>
                    <div className="logo-text">
                        <h2>Kiddo Shadow</h2>
                        <p>Institutional Portal</p>
                    </div>
                </div>

                <nav className="nav corporate-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            className={`nav-btn corporate-nav-btn ${isActive(item.path) ? "active" : ""}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-icon-wrap">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer corporate-footer">
                    <div className="profile-mini">
                        <div className="avatar-shield">{initials}</div>
                        <div className="profile-info">
                            <strong>{adminName}</strong>
                            <span>Administrator</span>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="corporate-logout-btn">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="mobile-utility-header lg:hidden" style={{ background: 'transparent', border: 'none', position: 'absolute', top: 0, left: 0, zIndex: 100 }}>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" sx={{ color: mode === 'light' ? '#0f172a' : '#fff' }}>
                                <Menu size={28} />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="corporate-drawer border-none p-0">
                            {/* ... Content remains same ... */}
                            <div className="p-6 h-full flex flex-col">
                                <div className="logo mb-8">
                                    <div className="logo-badge"><Sparkles size={20} /></div>
                                    <span className="font-bold text-xl ml-3">Kiddo Shadow</span>
                                </div>
                                <nav className="nav overflow-y-auto">
                                    {navItems.map((item) => (
                                        <button
                                            key={item.path}
                                            className={`nav-btn w-full ${isActive(item.path) ? "active" : ""}`}
                                            onClick={() => navigate(item.path)}
                                        >
                                            {item.icon}
                                            <span className="ml-3 font-semibold">{item.label}</span>
                                        </button>
                                    ))}
                                </nav>

                                <div className="mt-auto pt-6 border-t border-slate-700">
                                    <div className="profile flex items-center gap-3 mb-4">
                                        <div className="avatar-shield">{initials}</div>
                                        <div>
                                            <strong className="block text-sm">{adminName}</strong>
                                            <span className="text-xs opacity-60">Admin</span>
                                        </div>
                                    </div>
                                    <button onClick={handleLogout} className="corporate-logout-btn w-full">
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div className="mobile-logo-mini">✨ Kiddo</div>
                </header>
                <Outlet />
            </main>
        </div>
    );
}
