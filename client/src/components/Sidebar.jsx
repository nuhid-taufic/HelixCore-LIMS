import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

/**
 * Sidebar Component
 * Handles navigation and session termination for HelixCore.
 */
const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Authenticated user role from local storage
    const userRole = localStorage.getItem('helix_role');

    const handleLogout = () => {
        localStorage.removeItem('helix_token');
        localStorage.removeItem('helix_role');
        navigate('/');
    };

    // Style constants for the sidebar
    const styles = {
        container: {
            width: '260px',
            background: '#111625',
            borderRight: '1px solid #252d3f',
            height: '100vh',
            padding: '30px 20px',
            position: 'fixed',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000
        },
        brandSection: {
            marginBottom: '40px',
            paddingLeft: '10px'
        },
        brandTitle: {
            color: '#ffffff',
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            letterSpacing: '1px'
        },
        brandAccent: {
            color: '#00d2ff'
        },
        brandSubtitle: {
            color: '#64748b',
            fontSize: '12px',
            margin: '5px 0 0 0',
            textTransform: 'uppercase',
            letterSpacing: '2px'
        },
        navSection: {
            flex: 1
        },
        sectionLabel: {
            color: '#475569',
            fontSize: '11px',
            fontWeight: '700',
            paddingLeft: '15px',
            textTransform: 'uppercase',
            marginBottom: '15px'
        },
        logoutButton: {
            width: '100%',
            padding: '12px',
            background: 'transparent',
            color: '#ff4c4c',
            border: '1px solid #ff4c4c',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'background 0.3s ease'
        }
    };

    // Helper function to manage dynamic link styling
    const getLinkStyle = (path, isAdminLink = false) => {
        const isActive = location.pathname === path;
        const activeColor = isAdminLink ? '#ff4c4c' : '#00d2ff';
        const activeBg = isAdminLink ? 'rgba(255, 76, 76, 0.1)' : 'rgba(0, 210, 255, 0.1)';

        return {
            color: isActive ? activeColor : '#94a3b8',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: isActive ? '600' : '400',
            display: 'block',
            padding: '12px 15px',
            borderRadius: '8px',
            background: isActive ? activeBg : 'transparent',
            marginBottom: '8px',
            transition: 'all 0.3s ease'
        };
    };

    return (
        <div style={styles.container}>
            {/* Header / Brand Logo */}
            <div style={styles.brandSection}>
                <h2 style={styles.brandTitle}>
                    <span style={styles.brandAccent}>Helix</span>Core
                </h2>
                <p style={styles.brandSubtitle}>Research Terminal</p>
            </div>

            {/* Navigation Modules */}
            <div style={styles.navSection}>
                <p style={styles.sectionLabel}>Modules</p>

                {/* Restricted Admin Route */}
                {userRole === 'admin' && (
                    <Link to="/admin" style={getLinkStyle('/admin', true)}>
                        HQ Terminal
                    </Link>
                )}

                <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
                    Auto-Scan Lab
                </Link>

                <Link to="/viruses" style={getLinkStyle('/viruses')}>
                    Pathogen Database
                </Link>

                <Link to="/patients" style={getLinkStyle('/patients')}>
                    Patient Directory
                </Link>
            </div>

            {/* Footer Actions */}
            <div style={{ marginTop: 'auto' }}>
                <button
                    onClick={handleLogout}
                    style={styles.logoutButton}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255, 76, 76, 0.05)'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                    Terminate Session
                </button>
            </div>
        </div>
    );
};

export default Sidebar;