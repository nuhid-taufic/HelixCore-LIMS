import React, { useState } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import QRCode from 'qrcode';

/**
 * Patients Directory Component
 * Optimized with Automated PDF Reporting, Relational Data Population, and Admin Deletion.
 */
const Patients = () => {
    const [searchKey, setSearchKey] = useState('');
    const [patientsList, setPatientsList] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const API_BASE_URL = 'https://helixcore-lims.onrender.com/api/dna/patient';

    // --- Action Handlers ---
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchKey.trim()) {
            setError("Please enter a valid search parameter.");
            return;
        }
        setError('');
        setPatientsList([]);
        setIsLoading(true);

        try {
            const response = await axios.get(`${API_BASE_URL}/${searchKey}`);
            setPatientsList(response.data);
        } catch (err) {
            setError("Search yielded no results. Please verify the ID, Name, or Phone.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Admin Delete Logic ---
    const handleDeletePatient = async (id) => {
        if (!window.confirm("WARNING: Are you sure you want to permanently delete this genomic record?")) return;

        try {
            await axios.delete(`${API_BASE_URL}/${id}`);
            alert("Genomic record expunged successfully.");
            // UI theke sathe sathe delete kora patient ke soriye deya
            setPatientsList(prevList => prevList.filter(p => p._id !== id));
        } catch (err) {
            alert("Failed to delete record.");
        }
    };

    // --- PDF Generation Logic ---
    const generatePDF = async (patient) => {
        try {
            const doc = new jsPDF();
            const history = patient.testHistory || [];
            const isInfected = history.some(t => t.resultStatus === 'Danger');
            const detectedViruses = history
                .filter(t => t.resultStatus === 'Danger' && t.virusTested)
                .map(t => typeof t.virusTested === 'object' ? t.virusTested.name : 'Unknown Pathogen');

            // Header Section
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

            // Subject Details Block
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
            doc.text(`Patient ID : ${patient.patientId}`, 25, 72);
            doc.text(`Full Name : ${patient.name}`, 25, 82);
            doc.text(`Phone No  : ${patient.phone || 'N/A'}`, 110, 72);
            doc.text(`Scan Date : ${new Date().toLocaleDateString()}`, 110, 82);

            // Analysis Outcome
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
                doc.text(`Identified Sequences: ${[...new Set(detectedViruses)].join(', ')}`, 25, 148);
            } else {
                doc.setFillColor(230, 255, 240);
                doc.setDrawColor(0, 200, 100);
                doc.roundedRect(20, 122, 170, 35, 3, 3, 'FD');
                doc.setTextColor(0, 150, 50);
                doc.setFontSize(16);
                doc.text("CLEAR: NO KNOWN PATHOGENS DETECTED", 25, 135);
            }

            // Secure Verification QR
            try {
                const statusStr = isInfected ? 'INFECTED' : 'CLEAR';
                const qrUrl = `${window.location.origin}/verification?id=${patient.patientId}&status=${statusStr}&date=${new Date().toLocaleDateString()}`;
                const qrImage = await QRCode.toDataURL(qrUrl);
                doc.addImage(qrImage, 'PNG', 150, 175, 40, 40);
                doc.setFontSize(9);
                doc.setTextColor(120, 120, 120);
                doc.text("SCAN TO VERIFY", 158, 220);
            } catch (err) { console.error(err); }

            doc.save(`HelixCore_Report_${patient.patientId}.pdf`);
        } catch (err) {
            alert("Execution error during PDF generation.");
        }
    };

    return (
        <div className="patients-directory">
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                    Patient <span style={{ color: THEME.primary }}>Directory</span>
                </h1>
                <p style={{ color: THEME.textMuted, margin: '5px 0 0 0' }}>
                    Access genomic records via Subject ID, Name, or Contact Number.
                </p>
            </header>

            <form onSubmit={handleSearch} style={{ ...styles.panel, display: 'flex', gap: '15px' }}>
                <input
                    type="text"
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    placeholder="Enter Name, Phone, or Subject ID..."
                    style={styles.searchInput}
                />
                <button type="submit" style={styles.searchBtn} disabled={isLoading}>
                    {isLoading ? 'Scanning Data...' : 'Execute Search'}
                </button>
            </form>

            {error && <div style={styles.errorAlert}>{error}</div>}

            <div className="results-container">
                {patientsList.map((patient) => (
                    <div key={patient._id} style={styles.resultRow}>
                        <PatientProfile
                            patient={patient}
                            onDownload={() => generatePDF(patient)}
                            onDelete={() => handleDeletePatient(patient._id)} // Delete props pass korlam
                        />

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            <ScanHistory history={patient.testHistory} />
                            <GeneticRelatives relatives={patient.relativesFound} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Modular Sub-Components ---

const PatientProfile = ({ patient, onDownload, onDelete }) => (
    <div style={{ flex: 1, ...styles.panel, marginBottom: 0 }}>
        <h3 style={styles.sectionTitle}>Subject Profile</h3>

        <ProfileRow label="NAME" value={patient.name} />
        <ProfileRow label="SUBJECT ID" value={patient.patientId} highlight />
        <ProfileRow label="CONTACT" value={patient.phone || 'N/A'} />

        <div style={{ marginTop: '20px' }}>
            <p style={{ color: THEME.textMuted, fontSize: '13px', marginBottom: '8px', fontWeight: '600' }}>
                GENOMIC SEQUENCE DATA:
            </p>
            <div className="dna-font" style={styles.dnaBlock}>
                {patient.dnaSequence}
            </div>
        </div>

        {/* Buttons Section: PDF Export & Admin Delete */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
            <button
                onClick={onDownload}
                style={{
                    flex: 1, padding: '12px',
                    background: THEME.primary, color: '#0b101e', border: 'none',
                    borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                }}
            >
                Export PDF
            </button>
            <button
                onClick={onDelete}
                style={{
                    flex: 1, padding: '12px',
                    background: 'rgba(255, 76, 76, 0.1)', color: THEME.danger, border: `1px solid ${THEME.danger}`,
                    borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                }}
            >
                DELETE RECORD
            </button>
        </div>
    </div>
);

const ProfileRow = ({ label, value, highlight = false }) => (
    <p style={{ color: THEME.textMuted, fontSize: '13px', margin: '10px 0' }}>
        {label}:
        <span style={{ color: highlight ? THEME.primary : '#fff', fontSize: '16px', fontWeight: 'bold', marginLeft: '10px' }}>
            {value}
        </span>
    </p>
);

const ScanHistory = ({ history }) => (
    <div style={{ ...styles.panel, marginBottom: 0 }}>
        <h3 style={styles.sectionTitle}>Diagnostic Logs</h3>
        {history && history.length > 0 ? (
            history.map((test, i) => (
                <div key={i} style={styles.listItem}>
                    <span style={{ color: '#cbd5e1', fontSize: '14px' }}>
                        {test.virusTested ? test.virusTested.name : 'Routine Verification'}
                    </span>
                    <span style={{
                        color: test.resultStatus === 'Danger' ? THEME.danger : THEME.success,
                        fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase'
                    }}>
                        {test.resultStatus}
                    </span>
                </div>
            ))
        ) : (
            <span style={{ color: THEME.textMuted, fontSize: '14px' }}>No diagnostic history available.</span>
        )}
    </div>
);

const GeneticRelatives = ({ relatives }) => (
    <div style={{ ...styles.panel, marginBottom: 0 }}>
        <h3 style={styles.sectionTitle}>Identified Genetic Matches</h3>
        {relatives && relatives.length > 0 ? (
            relatives.map((rel, i) => {
                const relName = rel.matchedPatientId?.name || rel.uiPatientName || 'Unknown Subject';
                const relId = rel.matchedPatientId?.patientId || rel.uiPatientId || 'N/A';

                return (
                    <div key={i} style={styles.listItem}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <div>
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>{relName}</span>
                                <span style={{ color: THEME.textMuted, fontSize: '12px', marginLeft: '6px' }}>
                                    ({relId})
                                </span>
                            </div>
                            <div style={{ color: THEME.primary, fontSize: '12px', fontWeight: '600' }}>
                                {rel.relationType} — {rel.matchPercentage}% Match
                            </div>
                        </div>
                    </div>
                );
            })
        ) : (
            <span style={{ color: THEME.textMuted, fontSize: '14px' }}>No relative matches found in the databank.</span>
        )}
    </div>
);

// --- UI Constants & Styles ---

const THEME = {
    primary: '#00d2ff',
    danger: '#ff4c4c',
    success: '#00e676',
    bgPanel: '#151b2b',
    bgDark: '#0f1423',
    border: '#252d3f',
    textMuted: '#94a3b8'
};

const styles = {
    panel: {
        background: THEME.bgPanel,
        padding: '25px',
        borderRadius: '12px',
        border: `1px solid ${THEME.border}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        marginBottom: '25px'
    },
    searchInput: {
        flex: 1,
        padding: '14px 15px',
        borderRadius: '6px',
        border: `1px solid ${THEME.border}`,
        background: THEME.bgDark,
        color: '#fff',
        outline: 'none',
        fontSize: '15px'
    },
    searchBtn: {
        padding: '0 30px',
        background: THEME.primary,
        color: '#0b101e',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '15px'
    },
    errorAlert: {
        color: THEME.danger,
        padding: '15px',
        background: 'rgba(255, 76, 76, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(255,76,76,0.3)',
        marginBottom: '25px',
        fontWeight: '600'
    },
    resultRow: {
        display: 'flex',
        gap: '25px',
        marginBottom: '25px'
    },
    sectionTitle: {
        color: '#f8fafc',
        borderBottom: `1px solid ${THEME.border}`,
        paddingBottom: '15px',
        marginTop: 0,
        fontSize: '16px'
    },
    dnaBlock: {
        background: THEME.bgDark,
        padding: '15px',
        borderRadius: '6px',
        border: `1px solid ${THEME.border}`,
        color: THEME.primary,
        wordBreak: 'break-all',
        lineHeight: '1.6',
        maxHeight: '200px',
        overflowY: 'auto',
        fontFamily: 'monospace'
    },
    listItem: {
        padding: '12px 0',
        borderBottom: `1px solid #1f2738`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }
};

export default Patients;