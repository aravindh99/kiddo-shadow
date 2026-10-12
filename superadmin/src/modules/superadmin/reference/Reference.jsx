import React, { useEffect, useState } from "react";
import { FolderKanban, Loader2 } from "lucide-react";
import { getSchools } from "../schools/Schools.js";
import { getStudents, getStudentsCount } from "../../schooladmin/students/Students";
import "./reference.css";

export default function Reference() {
    const [schools, setSchools] = useState([]);
    const [studentCounts, setStudentCounts] = useState({});
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSchools();
            // Only show schools that have a reference name
            const schoolsList = Array.isArray(data) ? data.filter(s => s.reference_name) : [];
            setSchools(schoolsList);

            // Fetch student counts for each school using the specialized counting function
            const counts = {};
            await Promise.all(
                schoolsList.map(async (school) => {
                    counts[school.id] = await getStudentsCount(school.id);
                })
            );
            setStudentCounts(counts);
        } catch (err) {
            console.error("Failed to load reference data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="dashboard-content reference-page">
            <section className="dashboard-table-section">
                <div className="table-container-premium">
                    {loading ? (
                        <div className="flex flex-col items-center py-20 gap-4">
                            <Loader2 className="animate-spin text-purple-600" size={40} />
                            <p className="text-slate-500 font-medium">Loading reference data...</p>
                        </div>
                    ) : schools.length === 0 ? (
                        <div className="empty-state py-20">
                            <FolderKanban size={48} className="text-slate-200 mb-4" />
                            <p>No reference data available to display at this time.</p>
                        </div>
                    ) : (
                        <table className="excel-style-table">
                            <thead>
                                <tr>
                                    <th>REFERENCE NAME</th>
                                    <th>INSTITUTION</th>
                                    <th>COMMISSION (%)</th>
                                    <th>STUDENTS</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schools.map((s) => (
                                    <tr key={s.id}>
                                        <td className="font-bold text-slate-900">{s.reference_name}</td>
                                        <td>{s.school_name}</td>
                                        <td>
                                            <span className="percentage-badge">
                                                {s.reference_percentage || 0}%
                                            </span>
                                        </td>
                                        <td>
                                            <div className="student-count-cell">
                                                <strong>{studentCounts[s.id] || 0}</strong>
                                                <span>Students</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${s.status}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
}
