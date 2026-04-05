import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Viruses / Pathogen Database Component
 * Manages the registration and monitoring of known viral nucleotide sequences.
 */
const Viruses = () => {
    // --- State Management ---
    const [viruses, setViruses] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        pattern: '',
        severity: 'High'
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isFetching, setIsFetching] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_BASE_URL = 'https://helixcore-lims.onrender.com/api/dna/viruses';

    // --- Data Fetching ---
    const fetchViruses = useCallback(async () => {
        setIsFetching(true);
        try {
            const response = await axios.get(API_BASE_URL);
            setViruses(response.data);
        } catch (error) {
            console.error("Databank Retrieval Failed:", error);
            setStatus({ type: 'error', message: 'System Error: Unable to fetch databank records.' });
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchViruses();
    }, [fetchViruses]);

    // --- Action Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'pattern' ? value.toUpperCase() : value
        }));

        // Clear status messages when user starts typing
        if (status.message) setStatus({ type: '', message: '' });
    };

    const handleAddVirus = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            await axios.post(API_BASE_URL, formData);
            setStatus({ type: 'success', message: 'Pathogen successfully registered in databank.' });

            // Reset form fields
            setFormData({ name: '', pattern: '', severity: 'High' });

            // Refresh the grid
            fetchViruses();
        } catch (error) {
            setStatus({ type: 'error', message: 'Registration Failed: Could not add pathogen.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pathogen-database">
            {/* Header Section */}
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                    Pathogen <span style={{ color: THEME.primary }}>Database</span>
                </h1>
                <p style={{ color: THEME.textMuted, margin: '5px 0 0 0' }}>
                    Manage, classify, and monitor known viral genomic sequences.
                </p>
            </header>

            {/* Main Content Layout */}
            <div style={styles.layoutGrid}>

                {/* Registration Form Module */}
                <div style={styles.formSection}>
                    <PathogenForm
                        formData={formData}
                        onChange={handleInputChange}
                        onSubmit={handleAddVirus}
                        isSubmitting={isSubmitting}
                        status={status}
                    />
                </div>

                {/* Active Databank Grid Module */}
                <div style={styles.dataSection}>
                    <h3 style={styles.sectionTitle}>Active Databank</h3>

                    {isFetching ? (
                        <div style={styles.placeholder}>Syncing with secure servers...</div>
                    ) : viruses.length === 0 ? (
                        <div style={styles.placeholder}>No pathogens found in the current databank.</div>
                    ) : (
                        <div style={styles.cardGrid}>
                            {viruses.map((virus) => (
                                <PathogenCard key={virus._id} virus={virus} />
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

// --- Modular Sub-Components ---

const PathogenForm = ({ formData, onChange, onSubmit, isSubmitting, status }) => (
    <div style={styles.panel}>
        <h3 style={styles.sectionTitle}>Register New Pathogen</h3>

        {/* Status Notification Box */}
        {status.message && (
            <div style={styles.alertBox(status.type === 'error')}>
                {status.message}
            </div>
        )}

        <form onSubmit={onSubmit}>
            <div style={styles.inputGroup}>
                <label style={styles.label}>PATHOGEN NAME</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    required
                    placeholder="e.g. Ebola Virus"
                    style={styles.input}
                />
            </div>

            <div style={styles.inputGroup}>
                <label style={styles.label}>NUCLEOTIDE PATTERN</label>
                <input
                    type="text"
                    name="pattern"
                    value={formData.pattern}
                    onChange={onChange}
                    required
                    placeholder="e.g. GTAG"
                    className="dna-font"
                    style={{ ...styles.input, borderColor: THEME.primary }}
                />
            </div>

            <div style={{ ...styles.inputGroup, marginBottom: '25px' }}>
                <label style={styles.label}>SEVERITY CLASSIFICATION</label>
                <select
                    name="severity"
                    value={formData.severity}
                    onChange={onChange}
                    style={styles.input}
                >
                    <option value="High">High (Critical)</option>
                    <option value="Medium">Medium (Warning)</option>
                    <option value="Low">Low (Monitor)</option>
                </select>
            </div>

            <button
                type="submit"
                style={styles.submitBtn}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Processing...' : 'Commit to Databank'}
            </button>
        </form>
    </div>
);

const PathogenCard = ({ virus }) => {
    // Determine thematic color based on severity level
    const severityColor =
        virus.severity === 'High' ? THEME.danger :
            virus.severity === 'Medium' ? THEME.warning :
                THEME.success;

    return (
        <div style={{ ...styles.card, borderLeft: `4px solid ${severityColor}` }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '15px' }}>
                {virus.name}
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: THEME.textMuted }}>
                Sequence: <span className="dna-font" style={{ fontSize: '14px', color: THEME.primary, marginLeft: '5px' }}>{virus.pattern}</span>
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                Class: <span style={{ color: severityColor }}>{virus.severity}</span>
            </p>
        </div>
    );
};

// --- UI Constants & Styles ---

const THEME = {
    primary: '#00d2ff',
    danger: '#ff4c4c',
    warning: '#ffb84d',
    success: '#00e676',
    bgPanel: '#151b2b',
    bgDark: '#0f1423',
    border: '#252d3f',
    textMain: '#e2e8f0',
    textMuted: '#94a3b8'
};

const styles = {
    layoutGrid: {
        display: 'flex',
        gap: '25px',
        flexWrap: 'wrap'
    },
    formSection: {
        flex: '1 1 300px',
        alignSelf: 'flex-start'
    },
    dataSection: {
        flex: '2 1 500px',
        background: THEME.bgPanel,
        padding: '25px',
        borderRadius: '12px',
        border: `1px solid ${THEME.border}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    },
    panel: {
        background: THEME.bgPanel,
        padding: '25px',
        borderRadius: '12px',
        border: `1px solid ${THEME.border}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    },
    sectionTitle: {
        color: '#f8fafc',
        borderBottom: `1px solid ${THEME.border}`,
        paddingBottom: '15px',
        marginTop: 0,
        fontSize: '16px'
    },
    inputGroup: {
        marginBottom: '15px'
    },
    label: {
        fontSize: '12px',
        color: THEME.textMuted,
        fontWeight: '600',
        letterSpacing: '0.5px'
    },
    input: {
        width: '100%',
        padding: '12px',
        marginTop: '8px',
        borderRadius: '6px',
        border: `1px solid ${THEME.border}`,
        background: THEME.bgDark,
        color: THEME.textMain,
        boxSizing: 'border-box',
        outline: 'none',
        fontSize: '14px',
        transition: 'border 0.3s ease'
    },
    submitBtn: {
        width: '100%',
        padding: '14px',
        background: 'transparent',
        color: THEME.primary,
        border: `1px solid ${THEME.primary}`,
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '700',
        textTransform: 'uppercase',
        transition: 'background 0.3s ease, color 0.3s ease'
    },
    alertBox: (isError) => ({
        padding: '12px',
        marginBottom: '20px',
        background: isError ? 'rgba(255, 76, 76, 0.1)' : 'rgba(0, 230, 118, 0.1)',
        color: isError ? THEME.danger : THEME.success,
        border: `1px solid ${isError ? 'rgba(255,76,76,0.3)' : 'rgba(0,230,118,0.3)'}`,
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600',
        textAlign: 'center'
    }),
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '15px'
    },
    card: {
        background: THEME.bgDark,
        padding: '15px',
        borderRadius: '8px',
        border: `1px solid ${THEME.border}`,
        transition: 'transform 0.2s ease'
    },
    placeholder: {
        padding: '30px',
        textAlign: 'center',
        color: THEME.textMuted,
        fontSize: '14px',
        fontStyle: 'italic'
    }
};

export default Viruses;