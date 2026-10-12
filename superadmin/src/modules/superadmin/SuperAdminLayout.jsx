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
    School,
    UserCog,
    BarChart3,
    Settings,
    LogOut,
    FolderKanban,
    CreditCard,
    Sun,
    Moon
} from "lucide-react";

import "./SuperAdminLayout.css";

export default function SuperAdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = React.useState(localStorage.getItem("theme") || "light");

    React.useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === "light" ? "dark" : "light");
    };

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/superadmin/dashboard" },
        { label: "Manage Schools", icon: <School size={20} />, path: "/superadmin/schools" },
        { label: "Reference", icon: <FolderKanban size={20} />, path: "/superadmin/reference" },
        { label: "Global Stats", icon: <BarChart3 size={20} />, path: "/superadmin/global-stats" },
        { label: "Subscriptions", icon: <CreditCard size={20} />, path: "/superadmin/subscriptions" },
    ];

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const SidebarContent = () => (
        <>
            <div className="logo">

                <span className="logo-icon"></span>

                <div>
                    <h2>Super Admin</h2>

                </div>
                <br></br>
            </div>

            <nav className="nav">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        className={`nav-btn ${isActive(item.path) ? "active" : ""}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="profile">
                <div className="avatar">SA</div>
                <div>
                    <strong>Super Admin</strong>
                    <span>System Access</span>
                </div>
            </div>

            <button onClick={handleLogout} className="logout-btn">
                <LogOut size={18} />
                <span>Logout</span>
            </button>

            <button className="theme-toggle-btn bottom-toggle" onClick={toggleTheme}>
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </button>
        </>

    );

    return (
        <div className="admin-layout">
            {/* Desktop Sidebar */}
            <aside className="sidebar">
                <SidebarContent />
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                {/* Mobile Menu Trigger */}
                <div className="lg:hidden p-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu size={24} className="text-slate-700" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="bg-[#1e1b4b] border-none p-0 w-[280px]">
                            <div className="sidebar h-full w-full border-none shadow-none relative">
                                <SidebarContent />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Dashboard Content */}
                <Outlet />
            </main>
        </div>
    );
}
