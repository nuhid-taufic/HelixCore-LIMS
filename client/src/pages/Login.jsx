import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * Login Component
 * Handles authentication for HelixCore system personnel.
 */
const Login = () => {
    // --- State Management ---
    const [credentials, setCredentials] = useState({
        scientistId: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    // In a production environment, this should be imported from process.env
    const API_BASE_URL = 'https://helixcore-lims.onrender.com/api/auth';

    // --- Action Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing again
        if (error) setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/login`, credentials);

            // Securely store authentication tokens and user roles
            localStorage.setItem('helix_token', response.data.token);
            localStorage.setItem('helix_role', response.data.role);

            // Role-based routing mechanism
            if (response.data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            if (err.response && err.response.data && err.response.data.msg) {
                setError(err.response.data.msg);
            } else {
                setError("System unreachable. Please verify backend connection.");
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
        primaryDark: '#007bff',
        danger: '#ff4c4c',
        dangerBg: 'rgba(255, 76, 76, 0.1)',
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
        loginPanel: {
            background: THEME.bgPanel,
            padding: '40px',
            borderRadius: '12px',
            border: `1px solid ${THEME.border}`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            width: '100%',
            maxWidth: '400px'
        },
        headerText: {
            textAlign: 'center',
            marginBottom: '30px'
        },
        brandTitle: {
            margin: 0,
            fontSize: '32px',
            fontWeight: '700',
            letterSpacing: '1px'
        },
        brandSubtitle: {
            color: THEME.textMuted,
            fontSize: '13px',
            margin: '5px 0 0 0',
            textTransform: 'uppercase',
            letterSpacing: '2px'
        },
        errorBox: {
            padding: '12px',
            marginBottom: '20px',
            background: THEME.dangerBg,
            color: THEME.danger,
            border: `1px solid rgba(255, 76, 76, 0.3)`,
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '600'
        },
        inputGroup: {
            marginBottom: '20px'
        },
        label: {
            fontSize: '13px',
            color: THEME.textMuted,
            fontWeight: '600',
            letterSpacing: '1px',
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
            background: `linear-gradient(90deg, ${THEME.primary} 0%, ${THEME.primaryDark} 100%)`,
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            boxShadow: `0 4px 15px rgba(0, 210, 255, 0.3)`,
            opacity: isLoading ? 0.7 : 1,
            marginTop: '10px'
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.loginPanel}>

                {/* Header Section */}
                <header style={styles.headerText}>
                    <h1 style={styles.brandTitle}>
                        <span style={{ color: THEME.primary }}>Helix</span>Core
                    </h1>
                    <p style={styles.brandSubtitle}>Secure Lab Access Portal</p>
                </header>

                {/* Error Notification */}
                {error && (
                    <div style={styles.errorBox}>
                        {error}
                    </div>
                )}

                {/* Authentication Form */}
                <form onSubmit={handleLogin}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>AUTHORIZATION ID</label>
                        <input
                            type="text"
                            name="scientistId"
                            placeholder="e.g. SC-001 or ADMIN-ALPHA"
                            value={credentials.scientistId}
                            onChange={handleInputChange}
                            required
                            style={styles.input}
                            onFocus={(e) => e.target.style.borderColor = THEME.primary}
                            onBlur={(e) => e.target.style.borderColor = THEME.border}
                        />
                    </div>

                    <div style={{ ...styles.inputGroup, marginBottom: '30px' }}>
                        <label style={styles.label}>PASSCODE</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter secure passcode"
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
                        {isLoading ? 'Authenticating...' : 'Initialize Session'}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default Login;