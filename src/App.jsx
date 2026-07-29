import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MapPinned, Menu, X, User, LogOut, LogIn } from 'lucide-react';
import Home from './pages/Home';
import Mapa from './pages/Mapa';
import RouteGenerator from './pages/RouteGenerator';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
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
          <Link to="/rota" className={`btn-glass ${(location.pathname === '/rota' || location.pathname === '/') ? 'active' : ''}`}>
            <Map size={18} style={{ display: 'inline', marginRight: '5px' }} />
            Gerar Rota
          </Link>
          <Link to="/catalogo" className={`btn-glass ${location.pathname === '/catalogo' ? 'active' : ''}`}>Catálogo</Link>
          <Link to="/mapa" className={`btn-glass ${location.pathname === '/mapa' ? 'active' : ''}`}>
            <MapPinned size={18} style={{ display: 'inline', marginRight: '5px' }} />
            Mapa
          </Link>

          <div style={{ width: '1px', height: '24px', background: 'var(--card-border)', margin: '0 5px' }}></div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Link
                to="/perfil"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  color: 'var(--green-dark)', textDecoration: 'none',
                  padding: '6px 14px', borderRadius: '8px',
                  transition: 'background 0.2s ease',
                  background: location.pathname === '/perfil' ? '#ecf5ee' : 'transparent'
                }}
                onMouseEnter={(e) => { if (location.pathname !== '/perfil') e.currentTarget.style.background = '#ecf5ee'; }}
                onMouseLeave={(e) => { if (location.pathname !== '/perfil') e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, var(--green-dark), var(--green))',
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.8rem'
                }}>
                  {user.name?.charAt(0)?.toUpperCase() || <User size={16} />}
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name.split(' ')[0]}</span>
              </Link>
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
              <Link to="/rota" onClick={closeMenu} className={`btn-glass ${(location.pathname === '/rota' || location.pathname === '/') ? 'active' : ''}`} style={{ textAlign: 'center' }}>
                <Map size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                Gerar Rota
              </Link>
              <Link to="/catalogo" onClick={closeMenu} className={`btn-glass ${location.pathname === '/catalogo' ? 'active' : ''}`} style={{ textAlign: 'center' }}>
                Catálogo
              </Link>
              <Link to="/mapa" onClick={closeMenu} className={`btn-glass ${location.pathname === '/mapa' ? 'active' : ''}`} style={{ textAlign: 'center' }}>
                <MapPinned size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                Mapa
              </Link>

              {user ? (
                <>
                  <Link
                    to="/perfil"
                    onClick={closeMenu}
                    className={`btn-glass ${location.pathname === '/perfil' ? 'active' : ''}`}
                    style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    <div style={{
                      background: 'linear-gradient(135deg, var(--green-dark), var(--green))',
                      width: '28px', height: '28px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0
                    }}>
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    Meu Perfil
                  </Link>
                  <button
                    onClick={() => { logout(); closeMenu(); }}
                    style={{
                      background: 'transparent', border: '1px solid #ef444444',
                      color: '#ef4444', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '8px',
                      fontSize: '0.9rem', fontWeight: 500, padding: '10px',
                      borderRadius: '8px'
                    }}
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={closeMenu} className="btn-gold" style={{ justifyContent: 'center' }}>
                  <LogIn size={16} style={{ marginRight: '8px' }} />
                  Entrar
                </Link>
              )}
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
              <Route path="/" element={<RouteGenerator />} />
              <Route path="/catalogo" element={<Home />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/rota" element={<RouteGenerator />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Register />} />
              <Route path="/perfil" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
