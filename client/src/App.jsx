import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Pages & Components ---
import Login from './pages/Login';
import Register from './pages/Register';
import Verification from './pages/Verification';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Viruses from './pages/Viruses';
import Patients from './pages/Patients';
import Sidebar from './components/Sidebar';

// --- Authentication & Layout Wrappers ---

/**
 * AuthGuard Component
 * Intercepts routing to ensure only authenticated users with proper roles can access protected modules.
 */
const AuthGuard = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('helix_token');
  const role = localStorage.getItem('helix_role');

  // Redirect to login if unauthenticated
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Redirect to standard dashboard if user lacks admin privileges
  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * ProtectedLayout Component
 * Provides the standard application shell (Sidebar + Main Content Area) for authenticated sessions.
 */
const ProtectedLayout = ({ children }) => {
  const styles = {
    container: {
      display: 'flex',
      background: '#0b101e',
      minHeight: '100vh',
      color: '#e2e8f0'
    },
    mainContent: {
      marginLeft: '260px', // Accommodates the fixed sidebar width
      width: '100%',
      padding: '40px',
      boxSizing: 'border-box'
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};

/**
 * Main Application Component
 * Defines the core routing topology and access control for the application.
 */
const App = () => {
  return (
    <Router>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<Login />} />
        <Route path="/register/:token" element={<Register />} />
        <Route path="/verification" element={<Verification />} />

        {/* --- Restricted Admin Route --- */}
        <Route
          path="/admin"
          element={
            <AuthGuard requireAdmin={true}>
              <ProtectedLayout>
                <AdminDashboard />
              </ProtectedLayout>
            </AuthGuard>
          }
        />

        {/* --- Authenticated Scientist Routes --- */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/viruses"
          element={
            <AuthGuard>
              <ProtectedLayout>
                <Viruses />
              </ProtectedLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/patients"
          element={
            <AuthGuard>
              <ProtectedLayout>
                <Patients />
              </ProtectedLayout>
            </AuthGuard>
          }
        />

        {/* --- Fallback Route --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;