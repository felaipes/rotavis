import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, LogOut, User, ChevronLeft, Menu, X, Moon, Sun, BarChart3 } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AttractivesPage from './pages/AttractivesPage';
import IndicatorsPage from './pages/IndicatorsPage';

// ---- Simple Admin Auth Context ----
const AdminAuthContext = createContext();

const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('rotavis_admin_session');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (user) => {
    localStorage.setItem('rotavis_admin_session', JSON.stringify(user));
    setAdmin(user);
  };

  const logout = () => {
    localStorage.removeItem('rotavis_admin_session');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);

// ---- Protected Route ----
const ProtectedRoute = ({ children }) => {
  const { admin } = useAdminAuth();
  if (!admin) return <Navigate to="/login" replace />;
  return children;
};

// ---- Sidebar + Layout ----
const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();

  const navItems = [
    { path: '/', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
    { path: '/indicadores', label: 'Indicadores', icon: BarChart3 },
    { path: '/atrativos', label: 'Atrativos & Zonas', icon: MapPin },
  ];

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('rotavis_admin_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('rotavis_admin_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('rotavis_admin_theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="admin-layout">
      {/* Mobile toggle */}
      <button className="mobile-toggle" onClick={() => setSidebarOpen(o => !o)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {sidebarOpen && <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="RotaVis" className="sidebar-logo" />
          <span className="sidebar-badge">Admin</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navegação</div>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              <User size={16} />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{admin?.name || 'Admin'}</div>
              <div className="sidebar-user-role">Prefeitura</div>
            </div>
          </div>

          <button onClick={() => setIsDark(!isDark)} className="sidebar-link" style={{ fontSize: '0.82rem' }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Modo Claro' : 'Modo Escuro'}
          </button>

          <a href="/" className="sidebar-link" style={{ fontSize: '0.82rem' }}>
            <ChevronLeft size={16} />
            Voltar ao RotaVis
          </a>

          <button onClick={handleLogout} className="sidebar-link" style={{ color: 'var(--rose)', fontSize: '0.82rem' }}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};

// ---- App ----
const AdminApp = () => {
  return (
    <AdminAuthProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AdminLayout><DashboardPage /></AdminLayout></ProtectedRoute>} />
          <Route path="/indicadores" element={<ProtectedRoute><AdminLayout><IndicatorsPage /></AdminLayout></ProtectedRoute>} />
          <Route path="/atrativos" element={<ProtectedRoute><AdminLayout><AttractivesPage /></AdminLayout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
};

export default AdminApp;
