
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { User } from './types';
import LandingPage from './components/Landing/LandingPage';
import AuthForm from './components/Forms/AuthForm';
import { ToastProvider } from './components/UI/Toast';
import DashboardLayout from './components/Layout/DashboardLayout';
import RepositoryView from './components/Dashboard/RepositoryView';
import { getProfile, loginUser, logoutUser } from './services/auth';
import SettingsPage from './components/Settings/SettingsPage';
import AdminOverview from './components/Admin/AdminOverview';
import AdminUsers from './components/Admin/AdminUsers';
import UnauthorizedView from './components/Admin/UnauthorizedView';
import AdminUserDetails from './components/Admin/AdminUserDetails';
import { AuthContext } from './contexts/AuthContext';
import AnalyticsView from './components/Dashboard/AnalyticsView';

// --- Protected Route Guard ---
// FIX: Using React.FC with an explicit children prop type to satisfy React 18 / TypeScript requirements
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <UnauthorizedView />;
  return <>{children}</>;
};

const UserRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'user') return <UnauthorizedView />;
  return <>{children}</>;
};

const PublicLayout = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <Outlet />
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    return JSON.parse(localStorage.getItem('eqorascale_user') || 'null');
  });
  const [authLoading, setAuthLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const token = localStorage.getItem('eqorascale_token');
    if (!token) {
      setAuthLoading(false);
      return;
    }

    getProfile()
      .then((profile) => {
        setUser(profile);
        localStorage.setItem('eqorascale_user', JSON.stringify(profile));
      })
      .catch(() => {
        logoutUser();
        setUser(null);
        localStorage.removeItem('eqorascale_user');
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    const profile = await loginUser(usernameOrEmail, password);
    setUser(profile);
    localStorage.setItem('eqorascale_user', JSON.stringify(profile));
    return profile;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    localStorage.removeItem('eqorascale_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading: authLoading }}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Section */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Auth Section */}
            <Route path="/login" element={
              user
                ? <Navigate to={user.role === 'admin' ? '/admin/overview' : '/app/repository/ALL'} replace />
                : <AuthForm onLogin={login} />
            } />

            {/* Dashboard Section */}
            <Route 
              path="/app" 
              element={
                <UserRoute>
                  <DashboardLayout 
                    user={user} 
                    onLogout={logout} 
                    isDarkMode={isDarkMode} 
                    toggleTheme={() => setIsDarkMode(!isDarkMode)} 
                  />
                </UserRoute>
              }
            >
              <Route index element={<Navigate to="repository/ALL" replace />} />
              <Route path="repository/:tab" element={<RepositoryView />} />
              
              {/* Scale placeholders */}
              <Route path="collections" element={
                <div className="p-8 flex items-center justify-center h-full">
                  <div className="text-center opacity-40">
                    <p className="text-4xl font-black mb-2 uppercase tracking-widest">Collections</p>
                    <p className="text-sm font-bold uppercase tracking-widest">Module coming soon</p>
                  </div>
                </div>
              } />
              <Route path="analytics" element={
                <AnalyticsView />
              } />
              <Route path="settings" element={
                <SettingsPage />
              } />
            </Route>

            {/* Admin Section */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <DashboardLayout
                    user={user}
                    onLogout={logout}
                    isDarkMode={isDarkMode}
                    toggleTheme={() => setIsDarkMode(!isDarkMode)}
                  />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserDetails />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthContext.Provider>
  );
};

export default App;
