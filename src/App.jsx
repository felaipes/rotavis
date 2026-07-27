import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Menu, X, User, LogOut, LogIn, Shield } from 'lucide-react';
import Home from './pages/Home';
import RoteiroAutomatico from './pages/RoteiroAutomatico';
import RouteGenerator from './pages/RouteGenerator';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  return (
    <header className="liquid-glass-header" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '15px 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }} onClick={closeMenu}>
          <img src="/logo.png" alt="RotaVis" style={{ height: '58px', mixBlendMode: 'multiply' }} />
        </Link>

        <nav className="nav-desktop">
          <Link to="/catalogo" className={`btn-glass ${location.pathname === '/catalogo' ? 'active' : ''}`}>Catálogo</Link>
          <Link to="/rota" className={`btn-glass ${location.pathname === '/rota' ? 'active' : ''}`}>
            <Map size={18} style={{ display: 'inline', marginRight: '5px' }} />
            Gerar Rota
          </Link>

          <div style={{ width: '1px', height: '24px', background: 'var(--card-border)', margin: '0 5px' }}></div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--green-dark)' }}>
                <div style={{ background: 'var(--card-border)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} />
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name.split(' ')[0]}</span>
              </div>
              <button
                onClick={logout}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', fontWeight: 500 }}
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-gold" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
              <LogIn size={16} style={{ marginRight: '8px' }} />
              Entrar
            </Link>
          )}

          <a
            href="/admin/"
            title="Acesso Prefeitura"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.5, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
          >
            <Shield size={14} />
          </a>
        </nav>

        <button
          className="mobile-menu-btn"
          onClick={() => setIsOpen(o => !o)}
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', borderTop: '1px solid var(--card-border)' }}
            className="mobile-menu"
          >
            <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px 20px' }}>
              <Link to="/catalogo" onClick={closeMenu} className={`btn-glass ${location.pathname === '/catalogo' ? 'active' : ''}`} style={{ textAlign: 'center' }}>
                Catálogo
              </Link>
              <Link to="/rota" onClick={closeMenu} className={`btn-glass ${location.pathname === '/rota' ? 'active' : ''}`} style={{ textAlign: 'center' }}>
                <Map size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                Gerar Rota
              </Link>

              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--green-dark)' }}>
                    <div style={{ background: 'var(--card-border)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={18} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name.split(' ')[0]}</span>
                  </div>
                  <button
                    onClick={() => { logout(); closeMenu(); }}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', fontWeight: 500 }}
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={closeMenu} className="btn-gold" style={{ justifyContent: 'center' }}>
                  <LogIn size={16} style={{ marginRight: '8px' }} />
                  Entrar
                </Link>
              )}

              <a href="/admin/" onClick={closeMenu} className="btn-glass" style={{ textAlign: 'center', fontSize: '0.85rem', opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Shield size={14} />
                Acesso Prefeitura
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<RoteiroAutomatico />} />
              <Route path="/catalogo" element={<Home />} />
              <Route path="/rota" element={<RouteGenerator />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Register />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
