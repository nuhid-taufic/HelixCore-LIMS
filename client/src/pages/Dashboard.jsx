import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';

/**
 * @component Dashboard
 * @description Master Research Terminal for HelixCore. 
 * Handles Single Scan, Batch Processing, and Databank Queries.
 */
function Dashboard() {
    // Navigation & UI State
    const [activeTab, setActiveTab] = useState('single');

    // Single Subject Scan States
    const [patientName, setPatientName] = useState('');
    const [phone, setPhone] = useState('');
    const [dnaSequence, setDnaSequence] = useState('');
    const [result, setResult] = useState(null);

    // Batch Operations States
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkResults, setBulkResults] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Databank Query States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    // Global Activity Logs State
    const [recentPatients, setRecentPatients] = useState([]);

    /**
     * Synchronizes the dashboard with the latest 10 clinical records.
     */
    const fetchRecentHistory = async () => {
        try {
            const response = await axios.get('https://helixcore-lims.onrender.com/api/dna/recent-history');
            setRecentPatients(response.data);
        } catch (error) {
            console.error("System Log Sync Failed:", error);
        }
    };

    useEffect(() => {
        fetchRecentHistory();
    }, []);

    /**
     * Extracts the Scientist's Object ID from the localized security token.
     */
    const getScientistId = () => {
        const token = localStorage.getItem('helix_token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role === 'scientist') return payload.id;
        }
        return null;
    };

    /**
     * Identifies the current operator for audit logging purposes.
     */
    const getOperatorName = () => {
        const token = localStorage.getItem('helix_token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role === 'scientist') return payload.id;
            if (payload.role === 'admin') return 'HQ Admin';
        }
        return 'System Core';
    };

    // --- Analytical Execution Handlers ---

    const handleAutoScan = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://helixcore-lims.onrender.com/api/dna/analyze', {
                name: patientName,
                phone,
                dnaSequence: dnaSequence.toUpperCase(),
                scientistObjectId: getScientistId(),
                operatorName: getOperatorName()
            });
            setResult(response.data);
            fetchRecentHistory();
        } catch (error) {
            alert("Scan execution encountered a protocol error.");
        }
    };

    const handleFileUpload = (e) => {
        setBulkFile(e.target.files[0]);
    };

    const processBulkFile = async () => {
        if (!bulkFile) return alert("Please initialize a valid dataset for batch processing.");
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            try {
                const response = await axios.post('https://helixcore-lims.onrender.com/api/dna/analyze-bulk', {
                    patientsData: jsonData,
                    scientistObjectId: getScientistId(),
                    operatorName: getOperatorName()
                });
                setBulkResults(response.data.results);
                fetchRecentHistory();
                alert(response.data.msg);
            } catch (error) {
                const errMsg = error.response?.data?.error || "Batch processing protocol failure.";
                alert(errMsg);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsArrayBuffer(bulkFile);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchError('');
        setSearchResults([]);
        try {
            const response = await axios.get(`https://helixcore-lims.onrender.com/api/dna/patient/${searchQuery}`);
            setSearchResults(response.data);
        } catch (error) {
            setSearchError(error.response?.data?.msg || "Query yielded no results within the databank.");
        } finally {
            setIsSearching(false);
        }
    };

    // --- PDF Reporting Engine (Fail-Safe Implementation) ---

    const downloadReport = async () => {
        if (!result || !result.patient) return;
        await generatePDF(result.patient.patientId, result.patient.name, result.patient.phone || 'N/A', result.isInfected, (result.detectedViruses || []).map(v => v.name));
    };

    const downloadBulkReport = async (res) => {
        await generatePDF(res.patientId, res.name, res.phone || 'N/A', res.isInfected, res.detectedViruses || []);
    };

    const downloadSearchReport = async (patient) => {
        try {
            const history = patient.testHistory || [];
            const isInfected = history.some(t => t.resultStatus === 'Danger');
            const detectedVirusesList = history
                .filter(t => t.resultStatus === 'Danger' && t.virusTested)
                .map(t => typeof t.virusTested === 'object' ? t.virusTested.name : 'Unknown Pathogen');

            await generatePDF(patient.patientId, patient.name, patient.phone || 'N/A', isInfected, [...new Set(detectedVirusesList)]);
        } catch (error) {
            console.error("Critical PDF Failure:", error);
            alert("Error generating clinical report.");
        }
    };

    const generatePDF = async (patientId, name, phoneTxt, isInfected, detectedVirusesList) => {
        try {
            const doc = new jsPDF();

            // Header Configuration
            doc.setFillColor(11, 16, 30);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(28);
            doc.setTextColor(0, 210, 255);
            doc.text("HELIX", 20, 25);
            doc.setTextColor(255, 255, 255);
            doc.text("CORE", 62, 25);
            doc.setFontSize(10);
            doc.setTextColor(200, 200, 200);
            doc.text("ADVANCED CLINICAL PATHOGEN RESEARCH LABORATORY", 20, 33);

            // Subject Identity Block
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(20, 50, 170, 45, 3, 3, 'FD');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(50, 50, 50);
            doc.text("SUBJECT DETAILS", 25, 60);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);
            doc.text(`Patient ID : ${patientId || 'UNKNOWN'}`, 25, 72);
            doc.text(`Full Name : ${name || 'UNKNOWN'}`, 25, 82);
            doc.text(`Phone No  : ${phoneTxt || 'N/A'}`, 110, 72);
            doc.text(`Scan Date : ${new Date().toLocaleDateString()}`, 110, 82);

            // Diagnostic Outcome Block
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("CLINICAL ANALYSIS OUTCOME", 20, 115);

            if (isInfected) {
                doc.setFillColor(255, 230, 230);
                doc.setDrawColor(255, 76, 76);
                doc.roundedRect(20, 122, 170, 35, 3, 3, 'FD');
                doc.setTextColor(255, 50, 50);
                doc.setFontSize(16);
                doc.text("CRITICAL: PATHOGEN DETECTED", 25, 135);
                doc.setFontSize(11);
                doc.setFont("helvetica", "normal");
                const virusText = detectedVirusesList.length > 0 ? detectedVirusesList.join(', ') : 'Inconclusive Pathogen';
                doc.text(`Identified Sequences: ${virusText}`, 25, 148);
            } else {
                doc.setFillColor(230, 255, 240);
                doc.setDrawColor(0, 200, 100);
                doc.roundedRect(20, 122, 170, 35, 3, 3, 'FD');
                doc.setTextColor(0, 150, 50);
                doc.setFontSize(16);
                doc.text("CLEAR: NO KNOWN PATHOGENS DETECTED", 25, 135);
            }

            // Security Verification QR
            try {
                const statusStr = isInfected ? 'INFECTED' : 'CLEAR';
                const qrUrl = `${window.location.origin}/verification?id=${patientId}&status=${statusStr}&date=${new Date().toLocaleDateString()}`;
                const qrImage = await QRCode.toDataURL(qrUrl);
                doc.addImage(qrImage, 'PNG', 150, 175, 40, 40);
                doc.setFontSize(9);
                doc.setTextColor(120, 120, 120);
                doc.text("SCAN TO VERIFY", 158, 220);
            } catch (err) {
                console.error("QR Code Logic Failure:", err);
            }

            doc.save(`HelixCore_Report_${patientId || 'ClinicalDoc'}.pdf`);
        } catch (mainErr) {
            console.error("Main PDF Engine Error:", mainErr);
        }
    };

    // --- UI Styling Configuration ---
    const inputStyle = { width: '100%', padding: '12px', marginTop: '8px', borderRadius: '6px', border: '1px solid #252d3f', background: '#0f1423', color: '#e2e8f0', boxSizing: 'border-box', outline: 'none', fontSize: '14px' };
    const panelStyle = { background: '#151b2b', padding: '25px', borderRadius: '12px', border: '1px solid #252d3f', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' };
    const tabBtnStyle = (active) => ({ flex: 1, padding: '12px', background: active ? 'rgba(0, 210, 255, 0.1)' : 'transparent', color: active ? '#00d2ff' : '#64748b', border: active ? '1px solid rgba(0,210,255,0.3)' : '1px solid #252d3f', borderBottom: active ? '2px solid #00d2ff' : '1px solid #252d3f', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.3s' });

    return (
        <div>
            {/* Header Module */}
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>Research Terminal: <span style={{ color: '#00d2ff' }}>Alpha</span></h1>
                <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>Autonomous DNA sequence matching and pathogen detection interface.</p>
            </div>

            {/* Navigation Matrix */}
            <div style={{ display: 'flex', marginBottom: '20px' }}>
                <button style={tabBtnStyle(activeTab === 'single')} onClick={() => setActiveTab('single')}>Single Subject Scan</button>
                <button style={tabBtnStyle(activeTab === 'bulk')} onClick={() => setActiveTab('bulk')}>Batch Excel Process</button>
                <button style={tabBtnStyle(activeTab === 'search')} onClick={() => setActiveTab('search')}>🔍 Search Databank</button>
            </div>

            {/* ----------------- SINGLE SCAN MODULE ----------------- */}
            {activeTab === 'single' && (
                <div style={{ display: 'flex', gap: '25px', marginTop: '20px' }}>
                    <div style={{ flex: 1, ...panelStyle }}>
                        <h3 style={{ color: '#f8fafc', borderBottom: '1px solid #252d3f', paddingBottom: '15px', marginTop: 0 }}>Input Parameters</h3>
                        <form onSubmit={handleAutoScan}>
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>SUBJECT NAME</label>
                                    <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} required style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>CONTACT NUMBER</label>
                                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. 01..." style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>NUCLEOTIDE SEQUENCE (A, T, C, G)</label>
                                <input type="text" value={dnaSequence} onChange={(e) => setDnaSequence(e.target.value)} required placeholder="ATGC..." className="dna-font" style={{ ...inputStyle, fontSize: '16px', textTransform: 'uppercase', borderColor: '#00d2ff' }} />
                            </div>
                            <button type="submit" style={{ width: '100%', padding: '14px', background: 'linear-gradient(90deg, #00d2ff 0%, #007bff 100%)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                Execute Analysis
                            </button>
                        </form>
                    </div>

                    <div style={{ flex: 1, ...panelStyle }}>
                        <h3 style={{ color: '#f8fafc', borderBottom: '1px solid #252d3f', paddingBottom: '15px', marginTop: 0 }}>Analytical Outcome</h3>
                        {!result ? (
                            <div style={{ display: 'flex', height: '200px', alignItems: 'center', justifyContent: 'center', color: '#475569', fontStyle: 'italic' }}>Awaiting genomic data input...</div>
                        ) : (
                            <div>
                                <div style={{ marginBottom: '15px', padding: '10px', background: '#0f1423', borderRadius: '6px', border: '1px solid #252d3f', color: '#00d2ff', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Subject Record: {result.patient.patientId}</span>
                                    <button onClick={downloadReport} style={{ background: '#00e676', color: '#0b101e', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Download PDF</button>
                                </div>
                                <div style={{ padding: '15px 20px', borderRadius: '8px', fontWeight: '600', background: result.isInfected ? 'rgba(255, 76, 76, 0.1)' : 'rgba(0, 230, 118, 0.1)', color: result.isInfected ? '#ff4c4c' : '#00e676', border: `1px solid ${result.isInfected ? 'rgba(255,76,76,0.3)' : 'rgba(0,230,118,0.3)'}`, marginBottom: '20px' }}>
                                    {result.isInfected ? `CRITICAL ALERT: ${result.detectedViruses.map(v => v.name).join(', ')} identified.` : "CLEAR STATUS: No pathogens detected."}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ----------------- BATCH SCAN MODULE ----------------- */}
            {activeTab === 'bulk' && (
                <div style={{ ...panelStyle, marginTop: '20px' }}>
                    <h3 style={{ color: '#f8fafc', borderBottom: '1px solid #252d3f', paddingBottom: '15px', marginTop: 0 }}>Batch Data Operations</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Upload dataset (.xlsx) mapped with headers: <b>name</b>, <b>phone</b>, <b>dnaSequence</b>.</p>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ color: '#cbd5e1' }} />
                        <button onClick={processBulkFile} disabled={isProcessing} style={{ padding: '10px 20px', background: isProcessing ? '#475569' : '#00e676', color: '#0b101e', border: 'none', borderRadius: '6px', cursor: isProcessing ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                            {isProcessing ? 'Processing Matrix...' : 'Execute Batch Sequence'}
                        </button>
                    </div>

                    {bulkResults.length > 0 && (
                        <div style={{ background: '#0f1423', borderRadius: '8px', border: '1px solid #252d3f', padding: '15px' }}>
                            <h4 style={{ color: '#00d2ff', marginTop: 0 }}>Batch Results Summary ({bulkResults.length} parsed)</h4>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {bulkResults.map((res, i) => (
                                    <div key={i} style={{ padding: '12px 10px', borderBottom: '1px solid #1f2738', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '14px' }}>
                                        <span><b>{res.name}</b> ({res.patientId})</span>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ color: res.isInfected ? '#ff4c4c' : '#00e676', fontWeight: 'bold' }}>
                                                {res.isInfected ? `Pathogens Identified` : 'Clean'}
                                            </span>
                                            <button onClick={() => downloadBulkReport(res)} style={{ background: 'linear-gradient(90deg, #00d2ff 0%, #007bff 100%)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
                                                PDF
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ----------------- DATABANK SEARCH MODULE ----------------- */}
            {activeTab === 'search' && (
                <div style={{ ...panelStyle, marginTop: '20px' }}>
                    <h3 style={{ color: '#f8fafc', borderBottom: '1px solid #252d3f', paddingBottom: '15px', marginTop: 0 }}>Genomic Record Query</h3>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search via Name, Record ID, or Contact..."
                            required
                            style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                        />
                        <button type="submit" disabled={isSearching} style={{ padding: '0 25px', background: '#00e676', color: '#0b101e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {isSearching ? 'Executing Query...' : 'Run Search'}
                        </button>
                    </form>

                    {searchError && <p style={{ color: '#ff4c4c', fontSize: '14px' }}>{searchError}</p>}

                    {searchResults.length > 0 && (
                        <div style={{ background: '#0f1423', borderRadius: '8px', border: '1px solid #252d3f', padding: '15px' }}>
                            <h4 style={{ color: '#00d2ff', marginTop: 0 }}>Search Results ({searchResults.length})</h4>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {searchResults.map((patient) => {
                                    const isInfected = patient.testHistory.some(t => t.resultStatus === 'Danger');
                                    return (
                                        <div key={patient._id} style={{ padding: '15px', borderBottom: '1px solid #1f2738', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ color: '#00d2ff', fontWeight: 'bold', fontSize: '15px' }}>{patient.patientId}</div>
                                                <div style={{ color: '#cbd5e1', fontSize: '14px', margin: '4px 0' }}>{patient.name} | {patient.phone}</div>
                                                <div style={{ color: isInfected ? '#ff4c4c' : '#00e676', fontSize: '12px', fontWeight: 'bold' }}>
                                                    STATUS: {isInfected ? 'CRITICAL' : 'SAFE'}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => downloadSearchReport(patient)}
                                                style={{ background: 'linear-gradient(90deg, #00d2ff 0%, #007bff 100%)', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                            >
                                                Download PDF
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ----------------- SYSTEM ACTIVITY LOG ----------------- */}
            <div style={{ marginTop: '25px', ...panelStyle }}>
                <h3 style={{ color: '#f8fafc', borderBottom: '1px solid #252d3f', paddingBottom: '15px', marginTop: 0 }}>Terminal Activity Logs</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px 15px', borderBottom: '2px solid #252d3f' }}>Subject Record</th>
                            <th style={{ padding: '12px 15px', borderBottom: '2px solid #252d3f' }}>Designation</th>
                            <th style={{ padding: '12px 15px', borderBottom: '2px solid #252d3f' }}>Contact</th>
                            <th style={{ padding: '12px 15px', borderBottom: '2px solid #252d3f' }}>Time Matrix</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentPatients.map((p) => (
                            <tr key={p._id}>
                                <td style={{ padding: '15px', borderBottom: '1px solid #1f2738', color: '#00d2ff', fontWeight: '600' }}>{p.patientId}</td>
                                <td style={{ padding: '15px', borderBottom: '1px solid #1f2738', color: '#cbd5e1' }}>{p.name}</td>
                                <td style={{ padding: '15px', borderBottom: '1px solid #1f2738', color: '#94a3b8' }}>{p.phone || 'N/A'}</td>
                                <td style={{ padding: '15px', borderBottom: '1px solid #1f2738', color: '#64748b' }}>{new Date(p.updatedAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dashboard;