import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function AdminDashboard() {
    const [stats, setStats] = useState({ totalPatients: 0, totalViruses: 0, totalScientists: 0, unusedInvites: 0 });
    const [scientists, setScientists] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [allPatients, setAllPatients] = useState([]);
    const [inviteLink, setInviteLink] = useState('');

    // Fetch core administrative data securely
    const fetchAdminData = async () => {
        try {
            const statsRes = await axios.get('https://helixcore-lims.onrender.com/api/auth/admin/stats');
            setStats(statsRes.data);

            const sciRes = await axios.get('https://helixcore-lims.onrender.com/api/auth/admin/scientists');
            setScientists(sciRes.data);

            const logsRes = await axios.get('https://helixcore-lims.onrender.com/api/auth/admin/audit-logs');
            setAuditLogs(logsRes.data);

            const patRes = await axios.get('https://helixcore-lims.onrender.com/api/auth/admin/all-patients');
            setAllPatients(patRes.data);
        } catch (error) {
            console.error("System synchronization failed.", error);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleGenerateLink = async () => {
        try {
            const res = await axios.post('https://helixcore-lims.onrender.com/api/auth/admin/generate-invite');
            setInviteLink(res.data.inviteLink);
            fetchAdminData();
        } catch (error) {
            alert("Failed to initialize security token.");
        }
    };

    const handleDeleteScientist = async (id) => {
        if (window.confirm("Confirm revocation of personnel access?")) {
            try {
                await axios.delete(`https://helixcore-lims.onrender.com/api/auth/admin/scientists/${id}`);
                fetchAdminData();
            } catch (error) {
                alert("Revocation error encountered.");
            }
        }
    };

    // --- Analytical Computations ---
    const infectedCount = allPatients.filter(p => p.testHistory.some(t => t.resultStatus === 'Danger')).length;
    const safeCount = allPatients.length - infectedCount;

    const pieData = [
        { name: 'Critical (Infected)', value: infectedCount },
        { name: 'Clear (Safe)', value: safeCount }
    ];
    const PIE_COLORS = ['#ff4c4c', '#00e676'];

    const barData = [
        { name: 'Subjects', count: stats.totalPatients },
        { name: 'Pathogens', count: stats.totalViruses },
        { name: 'Personnel', count: stats.totalScientists }
    ];

    // --- Styling Constants ---
    const panelStyle = { background: '#151b2b', padding: '25px', borderRadius: '12px', border: '1px solid #252d3f', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', marginBottom: '25px' };
    const cardStyle = { background: '#0f1423', padding: '20px', borderRadius: '8px', border: '1px solid #252d3f', flex: 1, textAlign: 'center' };
    const thStyle = { padding: '12px 15px', borderBottom: '2px solid #252d3f', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', textAlign: 'left' };
    const tdStyle = { padding: '15px', borderBottom: '1px solid #1f2738', color: '#cbd5e1', fontSize: '14px' };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: '#111625', padding: '10px', border: '1px solid #252d3f', borderRadius: '5px', color: '#fff' }}>
                    <p style={{ margin: 0 }}>{`${payload[0].name} : ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Central Command Interface</h1>
                <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>Global System Overview & Access Control.</p>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
                <div style={cardStyle}><h2 style={{ color: '#00d2ff', margin: 0, fontSize: '32px' }}>{stats.totalPatients}</h2><p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>Registered Subjects</p></div>
                <div style={cardStyle}><h2 style={{ color: '#00e676', margin: 0, fontSize: '32px' }}>{stats.totalViruses}</h2><p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>Cataloged Pathogens</p></div>
                <div style={cardStyle}><h2 style={{ color: '#ffb84d', margin: 0, fontSize: '32px' }}>{stats.totalScientists}</h2><p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>Active Personnel</p></div>
                <div style={cardStyle}><h2 style={{ color: '#ff4c4c', margin: 0, fontSize: '32px' }}>{stats.unusedInvites}</h2><p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>Pending Invitations</p></div>
            </div>

            <div style={{ display: 'flex', gap: '25px', marginBottom: '25px' }}>
                <div style={{ flex: 1, ...panelStyle, marginBottom: 0 }}>
                    <h3 style={{ color: '#f8fafc', borderBottom: '1px solid #252d3f', paddingBottom: '15px', marginTop: 0 }}>Global Status Ratio</h3>
                    <div style={{ width: '100%', height: '250px' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '-20px' }}>
                        <span style={{ color: '#ff4c4c', fontSize: '13px', fontWeight: 'bold' }}>Critical Queue ({infectedCount})</span>
                        <span style={{ color: '#00e676', fontSize: '13px', fontWeight: 'bold' }}>Clear Queue ({safeCount})</span>
                    </div>
                </div>

                <div style={{ flex: 1, ...panelStyle, marginBottom: 0 }}>
                    <h3 style={{ color: '#f8fafc', borderBottom: '1px solid #252d3f', paddingBottom: '15px', marginTop: 0 }}>System Resource Distribution</h3>
                    <div style={{ width: '100%', height: '250px' }}>
                        <ResponsiveContainer>
                            <BarChart data={barData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2738' }} />
                                <Bar dataKey="count" fill="#00d2ff" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '25px' }}>
                <div style={{ flex: 1, ...panelStyle }}>
                    <h3 style={{ color: '#f8fafc', borderBottom: '1px solid #252d3f', paddingBottom: '15px', marginTop: 0 }}>Authentication Matrix</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Issue a one-time cryptographic token for new personnel onboarding.</p>
                    <button onClick={handleGenerateLink} style={{ width: '100%', padding: '14px', background: 'linear-gradient(90deg, #ff4c4c 0%, #ff8080 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
                        Initialize Authorization Token
                    </button>

                    {inviteLink && (
                        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 210, 255, 0.1)', border: '1px solid rgba(0,210,255,0.3)', borderRadius: '6px' }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#00d2ff', fontWeight: 'bold', textTransform: 'uppercase' }}>Token Link Generated:</p>
                            <code style={{ color: '#fff', wordBreak: 'break-all', fontSize: '13px' }}>{inviteLink}</code>
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, ...panelStyle }}>
                    <h3 style={{ color: '#f8fafc', borderBottom: '1px solid #252d3f', paddingBottom: '15px', marginTop: 0 }}>Authorized Personnel Roster</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {scientists.map(sc => (
                            <li key={sc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1f2738' }}>
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>{sc.scientistId}</span>
                                <button onClick={() => handleDeleteScientist(sc._id)} style={{ padding: '6px 12px', background: 'transparent', color: '#ff4c4c', border: '1px solid #ff4c4c', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Terminate Access</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div style={panelStyle}>
                <h3 style={{ color: '#f8fafc', borderBottom: '1px solid #252d3f', paddingBottom: '15px', marginTop: 0 }}>Security Audit Logs (Latest 20)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Timestamp</th>
                            <th style={thStyle}>Operator ID</th>
                            <th style={thStyle}>Subject Reference</th>
                            <th style={thStyle}>Analysis Module</th>
                            <th style={thStyle}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map(log => (
                            log.testHistory.map((test, index) => (
                                <tr key={`${log._id}-${index}`}>
                                    <td style={tdStyle}>{new Date(test.testDate).toLocaleString()}</td>
                                    {/* Robust fallback logic to ensure operator visibility regardless of account type */}
                                    <td style={{ ...tdStyle, color: '#00d2ff', fontWeight: 'bold' }}>
                                        {test.operatorName ? test.operatorName : (test.testedBy ? test.testedBy.scientistId : 'System Core')}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{log.patientId}</span>
                                        <br />
                                        <span style={{ color: '#64748b', fontSize: '12px' }}>{log.name}</span>
                                    </td>
                                    <td style={tdStyle}>{test.virusTested ? test.virusTested.name : 'Standard Protocol'}</td>
                                    <td style={{ ...tdStyle, color: test.resultStatus === 'Danger' ? '#ff4c4c' : '#00e676', fontWeight: 'bold' }}>{test.resultStatus}</td>
                                </tr>
                            ))
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminDashboard;