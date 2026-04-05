import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

/**
 * Register Component
 * Handles new scientist registration using a secure invite token.
 */
const Register = () => {
    // --- State Management ---
    const [credentials, setCredentials] = useState({
        scientistId: '',
        password: ''
    });
    const [status, setStatus] = useState({ error: '', success: '' });
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    // Extracting authorization token from URL parameters
    const { token } = useParams();

    const API_BASE_URL = 'http://localhost:5001/api/auth';

    // --- Action Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));

        // Clear any existing errors when the user starts typing
        if (status.error) {
            setStatus(prev => ({ ...prev, error: '' }));
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setStatus({ error: '', success: '' });
        setIsLoading(true);

        try {
            // Transmitting credentials along with the secure token for validation
            await axios.post(`${API_BASE_URL}/register`, {
                scientistId: credentials.scientistId,
                password: credentials.password,
                token
            });

            setStatus({
                error: '',
                success: 'Access Granted: Profile created successfully. Redirecting to login terminal...'
            });

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            if (err.response && err.response.data && err.response.data.msg) {
                setStatus({ error: err.response.data.msg, success: '' });
            } else {
                setStatus({ error: 'System Error: Unable to reach the backend server.', success: '' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --- UI Constants & Styles ---
    const THEME = {
        bgMain: '#0b101e',
        bgPanel: '#111625',
        primary: '#00d2ff',
        success: '#00e676',
        danger: '#ff4c4c',
        dangerBg: 'rgba(255, 76, 76, 0.1)',
        successBg: 'rgba(0, 230, 118, 0.1)',
        textMain: '#e2e8f0',
        textMuted: '#94a3b8',
        border: '#252d3f'
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
        panel: {
            background: THEME.bgPanel,
            padding: '40px',
            borderRadius: '12px',
            border: `1px solid ${THEME.border}`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            width: '100%',
            maxWidth: '400px'
        },
        header: {
            textAlign: 'center',
            marginBottom: '30px'
        },
        title: {
            margin: 0,
            fontSize: '26px',
            fontWeight: '700',
            letterSpacing: '1px',
            color: THEME.success
        },
        subtitle: {
            color: THEME.primary,
            fontSize: '12px',
            margin: '5px 0 0 0',
            textTransform: 'uppercase',
            letterSpacing: '1px'
        },
        alertBox: (isError) => ({
            padding: '12px',
            marginBottom: '20px',
            background: isError ? THEME.dangerBg : THEME.successBg,
            color: isError ? THEME.danger : THEME.success,
            border: `1px solid ${isError ? 'rgba(255,76,76,0.3)' : 'rgba(0,230,118,0.3)'}`,
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '600'
        }),
        inputGroup: {
            marginBottom: '20px'
        },
        label: {
            fontSize: '13px',
            color: THEME.textMuted,
            fontWeight: '600',
            display: 'block',
            marginBottom: '8px'
        },
        input: {
            width: '100%',
            padding: '14px',
            borderRadius: '6px',
            border: `1px solid ${THEME.border}`,
            background: '#0f1423',
            color: THEME.textMain,
            boxSizing: 'border-box',
            outline: 'none',
            fontSize: '15px',
            transition: 'border-color 0.3s ease'
        },
        submitBtn: {
            width: '100%',
            padding: '14px',
            background: `linear-gradient(90deg, ${THEME.success} 0%, #00b0ff 100%)`,
            color: '#0b101e',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '700',
            textTransform: 'uppercase',
            opacity: isLoading ? 0.7 : 1
        },
        footerText: {
            textAlign: 'center',
            marginTop: '20px',
            color: '#64748b',
            fontSize: '14px'
        },
        link: {
            color: THEME.primary,
            textDecoration: 'none',
            fontWeight: '600'
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.panel}>

                {/* Header Section */}
                <header style={styles.header}>
                    <h1 style={styles.title}>Classified Registration</h1>
                    <p style={styles.subtitle}>Invite Token: Verified</p>
                </header>

                {/* Status Notifications */}
                {status.error && <div style={styles.alertBox(true)}>{status.error}</div>}
                {status.success && <div style={styles.alertBox(false)}>{status.success}</div>}

                {/* Registration Form */}
                <form onSubmit={handleRegister}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>NEW SCIENTIST ID</label>
                        <input
                            type="text"
                            name="scientistId"
                            placeholder="e.g. SC-002"
                            value={credentials.scientistId}
                            onChange={handleInputChange}
                            required
                            style={styles.input}
                            onFocus={(e) => e.target.style.borderColor = THEME.primary}
                            onBlur={(e) => e.target.style.borderColor = THEME.border}
                        />
                    </div>

                    <div style={{ ...styles.inputGroup, marginBottom: '30px' }}>
                        <label style={styles.label}>SET AUTHORIZATION CODE</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Create secure passcode"
                            value={credentials.password}
                            onChange={handleInputChange}
                            required
                            style={styles.input}
                            onFocus={(e) => e.target.style.borderColor = THEME.primary}
                            onBlur={(e) => e.target.style.borderColor = THEME.border}
                        />
                    </div>

                    <button
                        type="submit"
                        style={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing Clearance...' : 'Register Clearance'}
                    </button>
                </form>

                {/* Footer Navigation */}
                <div style={styles.footerText}>
                    <p>Return to <Link to="/" style={styles.link}>Login Terminal</Link></p>
                </div>

            </div>
        </div>
    );
};

export default Register;