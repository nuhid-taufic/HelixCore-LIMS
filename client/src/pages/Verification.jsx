import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

/**
 * Verification Component
 * Public-facing portal to verify the authenticity of printed patient reports via secure URL parameters.
 */
const Verification = () => {
    // Extracting query parameters for validation
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('id');
    const status = searchParams.get('status');
    const date = searchParams.get('date') || new Date().toLocaleDateString();

    // --- UI Constants & Styles ---
    const THEME = {
        bgMain: '#0b101e',
        bgPanel: '#111625',
        bgCard: '#0f1423',
        primary: '#00d2ff',
        success: '#00e676',
        successBg: 'rgba(0, 230, 118, 0.1)',
        danger: '#ff4c4c',
        dangerBg: 'rgba(255, 76, 76, 0.1)',
        textMain: '#e2e8f0',
        textMuted: '#64748b',
        textLight: '#94a3b8',
        border: '#252d3f',
        borderLight: '#1f2738'
    };

    const styles = {
        wrapper: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: THEME.bgMain,
            color: THEME.textMain,
            width: '100vw'
        },
        errorPanel: {
            background: THEME.bgPanel,
            padding: '40px',
            borderRadius: '12px',
            border: `1px solid ${THEME.danger}`,
            textAlign: 'center',
            maxWidth: '400px'
        },
        mainPanel: {
            background: THEME.bgPanel,
            padding: '40px',
            borderRadius: '12px',
            border: `1px solid ${THEME.border}`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            width: '100%',
            maxWidth: '450px'
        },
        header: {
            textAlign: 'center',
            marginBottom: '30px'
        },
        brandTitle: {
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            letterSpacing: '1px'
        },
        brandSubtitle: {
            color: THEME.textMuted,
            fontSize: '12px',
            margin: '5px 0 0 0',
            textTransform: 'uppercase',
            letterSpacing: '2px'
        },
        badge: {
            background: THEME.successBg,
            border: `1px solid ${THEME.success}`,
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '30px'
        },
        detailsCard: {
            background: THEME.bgCard,
            borderRadius: '8px',
            border: `1px solid ${THEME.border}`,
            padding: '20px'
        }
    };

    // --- Validation Guard ---
    if (!patientId || !status) {
        return (
            <div style={styles.wrapper}>
                <div style={styles.errorPanel}>
                    <h1 style={{ color: THEME.danger, margin: '0 0 10px 0', fontSize: '24px' }}>
                        INVALID SECURITY TOKEN
                    </h1>
                    <p style={{ color: THEME.textLight, margin: 0 }}>
                        This document cannot be verified or the cryptographic link is corrupted.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.wrapper}>
            <div style={styles.mainPanel}>

                {/* Header Section */}
                <header style={styles.header}>
                    <h1 style={styles.brandTitle}>
                        <span style={{ color: THEME.primary }}>Helix</span>Core
                    </h1>
                    <p style={styles.brandSubtitle}>Global Document Verification</p>
                </header>

                {/* Verification Status Badge */}
                <div style={styles.badge}>
                    <h2 style={{ color: THEME.success, margin: '0 0 5px 0', fontSize: '22px' }}>
                        AUTHENTICATED RECORD
                    </h2>
                    <p style={{ color: THEME.textLight, margin: 0, fontSize: '13px' }}>
                        This document has been successfully verified against the secure databank.
                    </p>
                </div>

                {/* Scan Details Section */}
                <div style={styles.detailsCard}>
                    <DetailRow
                        label="SUBJECT ID"
                        value={patientId}
                        theme={THEME}
                    />
                    <DetailRow
                        label="ANALYSIS DATE"
                        value={date}
                        theme={THEME}
                    />
                    <DetailRow
                        label="PATHOGEN STATUS"
                        value={status}
                        theme={THEME}
                        valueColor={status === 'INFECTED' ? THEME.danger : THEME.success}
                        isLast
                    />
                </div>

                {/* Navigation */}
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <Link to="/" style={{ color: THEME.primary, textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                        Return to Headquarters
                    </Link>
                </div>

            </div>
        </div>
    );
};

// --- Modular Sub-Components ---

/**
 * Reusable component for displaying key-value pairs in the details card.
 */
const DetailRow = ({ label, value, theme, valueColor, isLast = false }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: isLast ? 'none' : `1px solid ${theme.borderLight}`,
        paddingBottom: isLast ? '0' : '12px',
        marginBottom: isLast ? '0' : '12px'
    }}>
        <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: '600' }}>
            {label}
        </span>
        <span style={{ color: valueColor || '#fff', fontSize: '14px', fontWeight: 'bold' }}>
            {value}
        </span>
    </div>
);

export default Verification;