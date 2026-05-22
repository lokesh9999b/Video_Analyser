import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import OrgRegisterPage from './pages/OrgRegisterPage';
import UserRegisterPage from './pages/UserRegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage';
import LibraryPage from './pages/LibraryPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              className: '!bg-slate-800 !text-white !border !border-white/10 !rounded-xl !shadow-2xl',
              success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
              error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/org" element={<OrgRegisterPage />} />
            <Route path="/register/user" element={<UserRegisterPage />} />
            {/* Legacy /register redirect → org registration */}
            <Route path="/register" element={<Navigate to="/register/org" replace />} />

            {/* Protected Routes inside Layout */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              {/* Redirect root to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="video/:id" element={<VideoPlayerPage />} />

              {/* Editor + Admin only */}
              <Route
                path="upload"
                element={<ProtectedRoute roles={['editor', 'admin']}><UploadPage /></ProtectedRoute>}
              />

              {/* Admin only */}
              <Route
                path="admin"
                element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>}
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
