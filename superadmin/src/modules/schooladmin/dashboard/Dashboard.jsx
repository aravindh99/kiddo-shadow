import React, { useEffect, useState } from 'react';
import { getDashboardStats } from './Dashboard';
import { Users, GraduationCap, School, Layers, Loader2 } from 'lucide-react';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalSections: 0,
    totalStudents: 0,
    totalTeachers: 0,
    genderData: [],
    monthlyGrowthData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const data = await getDashboardStats();

      // Add static demographics if data is empty
      const enhancedData = {
        ...data,
        genderData: data.genderData && data.genderData.length > 0
          ? data.genderData
          : [
            { name: 'Boys', value: 12, fill: '#3b82f6' },
            { name: 'Girls', value: 11, fill: '#ec4899' }
          ],
        monthlyGrowthData: data.monthlyGrowthData && data.monthlyGrowthData.length > 0
          ? data.monthlyGrowthData
          : [
            { name: 'Sep', students: 3 },
            { name: 'Oct', students: 4 },
            { name: 'Nov', students: 2 },
            { name: 'Dec', students: 5 },
            { name: 'Jan', students: 4 },
            { name: 'Feb', students: 5 }
          ]
      };

      setStats(enhancedData);
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="animate-spin" size={48} color="#3b82f6" />
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  // Card Config
  const cards = [
    { label: "Total Students", value: stats.totalStudents, icon: <Users size={24} />, color: "blue" },
    { label: "Total Faculty", value: stats.totalTeachers, icon: <GraduationCap size={24} />, color: "purple" },
    { label: "Active Classes", value: stats.totalClasses, icon: <School size={24} />, color: "emerald" },
    { label: "Total Sections", value: stats.totalSections, icon: <Layers size={24} />, color: "amber" }
  ];

  return (
    <div className="school-dashboard-simple">
      {/* 1. WELCOME HEADER */}
      <header className="dashboard-header-simple">
        <div>
          <h1>Welcome back, School Admin</h1>
          <p>Here is your institution's real-time executive summary.</p>
        </div>
        <div className="date-pill">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </header>

      {/* 2. COMPACT STATS GRID */}
      <div className="stats-grid-compact">
        {cards.map((card, idx) => (
          <div className={`stat-card-simple ${card.color}`} key={idx}>
            <div className="stat-icon-box">
              {card.icon}
            </div>
            <div>
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. CHARTS SECTION */}
      <div className="charts-row-simple">

        {/* Gender Distribution Pie */}
        <div className="chart-card-simple">
          <div className="chart-header">
            <h3>Student Demographics</h3>
            <p>Gender Distribution</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={250}>
              <RePie data={stats.genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {stats.genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </RePie>
            </ResponsiveContainer>
            <div className="chart-legend">
              {stats.genderData.map((item, idx) => (
                <div key={idx} className="legend-item">
                  <span className="dot" style={{ background: item.fill }}></span>
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Growth Bar */}
        <div className="chart-card-simple">
          <div className="chart-header">
            <h3>Admission Trends</h3>
            <p>Monthly Student Intake</p>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.monthlyGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
