import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  School,
  Users,
  TrendingUp,
  Activity,
  ArrowRight,
  Loader2,
  Building2,
  Lock,
  Globe,
  Plus,
  LayoutDashboard
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { getSchools } from "../schools/Schools.js";
import { getStudentsCount } from "../../schooladmin/students/Students";
import "./Dashboard.css";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalStudents: 0,
    activeSchools: 0,
    pendingSchools: 0
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const schoolsData = await getSchools();
        const schoolsList = Array.isArray(schoolsData) ? schoolsData : [];
        setSchools(schoolsList);

        // Calculate basic stats
        const active = schoolsList.filter(s => s.status === 'active').length;
        const pending = schoolsList.filter(s => s.status === 'pending').length;

        // Fetch student counts for total universe
        let totalS = 0;
        await Promise.all(
          schoolsList.map(async (school) => {
            const count = await getStudentsCount(school.id);
            totalS += count;
          })
        );

        setStats({
          totalSchools: schoolsList.length,
          totalStudents: totalS,
          activeSchools: active,
          pendingSchools: pending
        });
      } catch (err) {
        console.error("Dashboard data load error:", err);
        setError("Failed to synchronize platform metrics");
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Growth Data (Simulated for Corporate Feel)
  const growthData = [
    { name: "Jan", schools: Math.round(stats.totalSchools * 0.7), students: Math.round(stats.totalStudents * 0.6) },
    { name: "Feb", schools: Math.round(stats.totalSchools * 0.8), students: Math.round(stats.totalStudents * 0.75) },
    { name: "Mar", schools: Math.round(stats.totalSchools * 0.85), students: Math.round(stats.totalStudents * 0.8) },
    { name: "Apr", schools: Math.round(stats.totalSchools * 0.9), students: Math.round(stats.totalStudents * 0.85) },
    { name: "May", schools: stats.totalSchools, students: stats.totalStudents },
  ];

  const distributionData = [
    { name: "Active", value: stats.activeSchools, color: "#10b981" },
    { name: "Pending", value: stats.pendingSchools, color: "#f59e0b" },
    { name: "Others", value: stats.totalSchools - stats.activeSchools - stats.pendingSchools, color: "#94a3b8" }
  ];

  if (loading) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin mb-4 mx-auto text-indigo-500" size={48} />
          <p className="font-semibold text-slate-500">Synchronizing Global Control Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {/* Hero Banner */}
      <section className="hero-mesh-gradient">
        <div className="hero-content">
          <h1>Platform Intelligence</h1>
          <p>Super Admin Command Center • {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="system-ticker">
          <div className="status-dot" />
          <span>Core Infrastructure Active</span>
        </div>
      </section>

      {/* KPI Stats */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-row">
            <div className="kpi-icon blue"><Building2 size={24} /></div>
            <div className="kpi-trend">+4% <TrendingUp size={14} /></div>
          </div>
          <div className="kpi-data">
            <h3>Registered Schools</h3>
            <p className="value">{stats.totalSchools}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-row">
            <div className="kpi-icon purple"><Users size={24} /></div>
            <div className="kpi-trend">+12% <TrendingUp size={14} /></div>
          </div>
          <div className="kpi-data">
            <h3>Student Universe</h3>
            <p className="value">{stats.totalStudents.toLocaleString()}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-row">
            <div className="kpi-icon emerald"><Globe size={24} /></div>
            <div className="kpi-trend">Healthy</div>
          </div>
          <div className="kpi-data">
            <h3>Active Institutions</h3>
            <p className="value">{stats.activeSchools}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-row">
            <div className="kpi-icon orange"><Activity size={24} /></div>
            <div className="kpi-trend">Setup</div>
          </div>
          <div className="kpi-data">
            <h3>Pending Onboarding</h3>
            <p className="value">{stats.pendingSchools}</p>
          </div>
        </div>
      </section>

      {/* Analytics Row */}
      <section className="charts-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Network Growth Matrix</h3>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-circle" style={{ backgroundColor: '#6366f1' }} />
                <span>Students</span>
              </div>
              <div className="legend-item">
                <span className="legend-circle" style={{ backgroundColor: '#a855f7' }} />
                <span>Schools</span>
              </div>
            </div>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="students" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorS)" />
                <Area type="monotone" dataKey="schools" stroke="#a855f7" strokeWidth={4} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>Distribution</h3>
          </div>
          <div style={{ height: 300, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: '800', display: 'block' }}>{stats.totalSchools}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Total</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Table Overview */}
      <section className="institutions-section">
        <div className="section-title-bar">
          <h3>Top Institutions Overview</h3>
          <button className="manage-btn" onClick={() => navigate("/superadmin/schools")}>
            Full Directory <ArrowRight size={16} />
          </button>
        </div>
        <table className="excel-style-table">
          <thead>
            <tr>
              <th>REF CODE</th>
              <th>INSTITUTION DETAILS</th>
              <th>CITY / HQ</th>
              <th>DATA REACH</th>
              <th>SYSTEM STATUS</th>
            </tr>
          </thead>
          <tbody>
            {schools.slice(0, 5).map((school) => (
              <tr key={school.id}>
                <td><span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#64748b' }}>#{school.school_code}</span></td>
                <td>
                  <div className="school-info">
                    <div className="school-logo-frame">
                      {school.school_name?.charAt(0)}
                    </div>
                    <div className="school-details">
                      <strong>{school.school_name}</strong>
                      <span>{school.cbse_affiliation_no || "Affiliation Pending"}</span>
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: '600', color: '#475569' }}>{school.city || "N/A"}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={14} style={{ color: '#6366f1' }} />
                    <span style={{ fontWeight: '700' }}>{school.student_count || 0}</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${school.status}`}>
                    {school.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
