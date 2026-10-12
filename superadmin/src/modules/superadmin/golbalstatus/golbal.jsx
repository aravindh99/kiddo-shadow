import React, { useEffect, useState } from "react";
import {
    BarChart3,
    MapPin,
    School,
    Activity,
    Globe,
    TrendingUp,
    Loader2,
    PieChart,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { getSchools } from "../schools/Schools.js";
import "./golbal.css";

export default function GlobalStats() {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        cities: 0,
        states: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getSchools();
                const schoolsList = data || [];
                setSchools(schoolsList);

                // Calculate Stats
                const active = schoolsList.filter(s => s.status === 'active').length;
                const uniqueCities = new Set(schoolsList.map(s => s.city)).size;
                const uniqueStates = new Set(schoolsList.map(s => s.state)).size;

                setStats({
                    total: schoolsList.length,
                    active,
                    inactive: schoolsList.length - active,
                    cities: uniqueCities,
                    states: uniqueStates
                });
            } catch (err) {
                console.error("Failed to load global stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="global-loader">
                <Loader2 className="animate-spin text-purple-600" size={48} />
                <p>Analyzing global network data...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-content global-stats-view">
            <header className="dash-header">
                <div className="header-info">
                    <h1>System Global Stats 🌐</h1>
                    <p>Real-time analytics and distribution across the school network</p>
                </div>
                <div className="ai-status">
                    <Activity size={20} />
                    <span>Network Live</span>
                </div>
            </header>

            {/* Main Aggregates */}
            <div className="stats-grid-premium">
                <div className="stat-box purple">
                    <div className="box-icon"><School size={28} /></div>
                    <div className="box-content">
                        <span className="label">Total Institutions</span>
                        <strong className="value">{stats.total}</strong>
                    </div>
                    <div className="box-trend">↑ 14% growth</div>
                </div>

                <div className="stat-box green">
                    <div className="box-icon"><CheckCircle2 size={28} /></div>
                    <div className="box-content">
                        <span className="label">Active Schools</span>
                        <strong className="value">{stats.active}</strong>
                    </div>
                    <div className="box-status">Fully Operational</div>
                </div>

                <div className="stat-box blue">
                    <div className="box-icon"><MapPin size={28} /></div>
                    <div className="box-content">
                        <span className="label">Cities Covered</span>
                        <strong className="value">{stats.cities}</strong>
                    </div>
                    <div className="box-status">{stats.states} States Represented</div>
                </div>

                <div className="stat-box orange">
                    <div className="box-icon"><Globe size={28} /></div>
                    <div className="box-content">
                        <span className="label">Network Reach</span>
                        <strong className="value">Global</strong>
                    </div>
                    <div className="box-trend">Cloud Infrastructure Active</div>
                </div>
            </div>

            {/* Detailed Distribution */}
            <div className="global-details-grid">
                <section className="distribution-card">
                    <div className="card-header-flex">
                        <h3>Institutional Distribution</h3>
                        <PieChart size={20} className="text-slate-400" />
                    </div>
                    <div className="dist-list">
                        <div className="dist-item">
                            <div className="item-main">
                                <span>Active Infrastructure</span>
                                <strong>{((stats.active / stats.total) * 100 || 0).toFixed(1)}%</strong>
                            </div>
                            <div className="progress-bar"><div className="fill green" style={{ width: `${(stats.active / stats.total) * 100 || 0}%` }} /></div>
                        </div>
                        <div className="dist-item">
                            <div className="item-main">
                                <span>Pending/Setup</span>
                                <strong>{((stats.inactive / stats.total) * 100 || 0).toFixed(1)}%</strong>
                            </div>
                            <div className="progress-bar"><div className="fill orange" style={{ width: `${(stats.inactive / stats.total) * 100 || 0}%` }} /></div>
                        </div>
                    </div>
                </section>

                <section className="summary-list-card">
                    <div className="card-header-flex">
                        <h3>Recent Institutional Links</h3>
                        <TrendingUp size={20} className="text-purple-500" />
                    </div>
                    <div className="mini-table-wrapper">
                        <table className="mini-table">
                            <thead>
                                <tr>
                                    <th>SCHOOL</th>
                                    <th>LOCATION</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schools.slice(0, 4).map(school => (
                                    <tr key={school.id}>
                                        <td className="font-bold">{school.school_name}</td>
                                        <td>{school.city}</td>
                                        <td>
                                            <span className={`mini-badge ${school.status}`}>
                                                {school.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
