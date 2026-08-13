import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Map, MapPinned, Menu, X, User, LogOut, LogIn, Wallet, Route as RouteIcon, Trophy, ListChecks } from 'lucide-react';
import Home from './pages/Home';
import Mapa from './pages/Mapa';
import RouteGenerator from './pages/RouteGenerator';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import SuaRota from './pages/SuaRota';
import Conquistas from './pages/Conquistas';
import MeusRoteiros from './pages/MeusRoteiros';
import FallsBackground from './components/FallsBackground';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CheckInProvider, useCheckIns } from './context/CheckInContext';
import { TIERS } from './data/achievements';
import { T, scaleIn, pageTransition } from './motion';
import './index.css';

// Aviso de troféu novo. Fica no App para aparecer de qualquer tela — inclusive quando o
// check-in é feito de dentro do catálogo, longe da aba de conquistas.
const UnlockToast = () => {
  const { recentUnlock, dismissUnlock } = useCheckIns();

  useEffect(() => {
    if (!recentUnlock) return;
    const t = setTimeout(dismissUnlock, 5000);
    return () => clearTimeout(t);
  }, [recentUnlock, dismissUnlock]);

  return (
    <AnimatePresence>
      {recentUnlock && (
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          role="status"
          onClick={dismissUnlock}
          style={{
            position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)',
            zIndex: 200, cursor: 'pointer', maxWidth: 'calc(100vw - 32px)',
            background: 'var(--card-bg)', border: `2px solid ${TIERS[recentUnlock.tier].color}`,
            borderRadius: '16px', padding: '14px 20px', boxShadow: '0 12px 32px rgba(7,11,20,0.22)',
            display: 'flex', alignItems: 'center', gap: '14px'
          }}
        >
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            background: TIERS[recentUnlock.tier].color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <recentUnlock.icon size={22} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: TIERS[recentUnlock.tier].color }}>
              Novo troféu {TIERS[recentUnlock.tier].label}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{recentUnlock.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{recentUnlock.description}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
          <Link to="/meus-roteiros" className={`btn-glass ${location.pathname === '/meus-roteiros' ? 'active' : ''}`}>
            <ListChecks size={18} style={{ display: 'inline', marginRight: '5px' }} />
            Meus Roteiros
          </Link>
          {user?.activeRoute && (
            <Link to="/sua-rota" className={`btn-glass ${location.pathname === '/sua-rota' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <RouteIcon size={18} />
              Sua Rota
            </Link>
          )}
          <Link to="/mapa" className={`btn-glass ${location.pathname === '/mapa' ? 'active' : ''}`}>
            <MapPinned size={18} style={{ display: 'inline', marginRight: '5px' }} />
            Mapa
          </Link>
          <Link to="/conquistas" className={`btn-glass ${location.pathname === '/conquistas' ? 'active' : ''}`}>
            <Trophy size={18} style={{ display: 'inline', marginRight: '5px' }} />
            Conquistas
          </Link>

          <div style={{ width: '1px', height: '24px', background: 'var(--card-border)', margin: '0 5px' }}></div>

          {user ? (
            <div 
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <Link
                to="/perfil"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  color: 'var(--green-dark)', textDecoration: 'none',
                  padding: '6px 14px', borderRadius: '8px',
                  transition: 'background 0.2s ease',
                  background: (location.pathname === '/perfil' || showProfileMenu) ? '#ecf5ee' : 'transparent'
                }}
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

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={T.fast}
                    style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                      background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                      borderRadius: '12px', boxShadow: 'var(--card-shadow)',
                      padding: '8px', minWidth: '180px', display: 'flex', flexDirection: 'column',
                      gap: '4px', zIndex: 100
                    }}
                  >
                    <Link to="/perfil" onClick={() => setShowProfileMenu(false)} className="btn-glass" style={{ border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                      <User size={16} /> Meu Perfil
                    </Link>
                    <Link to="/perfil#carteira" onClick={() => setShowProfileMenu(false)} className="btn-glass" style={{ border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                      <Wallet size={16} /> Minha Carteira
                    </Link>
                    <Link to="/mapa" onClick={() => setShowProfileMenu(false)} className="btn-glass" style={{ border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                      <MapPinned size={16} /> Mapa
                    </Link>
                    <div style={{ height: '1px', background: 'var(--card-border)', margin: '4px 0' }} />
                    <button onClick={() => { logout(); setShowProfileMenu(false); }} className="btn-glass" style={{ border: 'none', textAlign: 'left', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                      <LogOut size={16} /> Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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
            transition={T.inOut}
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
              <Link to="/meus-roteiros" onClick={closeMenu} className={`btn-glass ${location.pathname === '/meus-roteiros' ? 'active' : ''}`} style={{ textAlign: 'center' }}>
                <ListChecks size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                Meus Roteiros
              </Link>
              {user?.activeRoute && (
                <Link to="/sua-rota" onClick={closeMenu} className={`btn-glass ${location.pathname === '/sua-rota' ? 'active' : ''}`} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <RouteIcon size={18} style={{ verticalAlign: 'text-bottom' }} />
                  Sua Rota
                </Link>
              )}
              <Link to="/mapa" onClick={closeMenu} className={`btn-glass ${location.pathname === '/mapa' ? 'active' : ''}`} style={{ textAlign: 'center' }}>
                <MapPinned size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                Mapa
              </Link>
              <Link to="/conquistas" onClick={closeMenu} className={`btn-glass ${location.pathname === '/conquistas' ? 'active' : ''}`} style={{ textAlign: 'center' }}>
                <Trophy size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                Conquistas
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

// Troca de página animada: só a entrada é animada, a página que sai é desmontada na
// hora. Sem AnimatePresence de propósito — com mode="wait" a tela nova só monta depois
// de a antiga terminar de sair, e se essa saída não roda (aba em segundo plano, que o
// navegador congela, ou cliques mais rápidos que a animação) a navegação trava
// mostrando a página anterior com a URL já trocada. Animar só a entrada nunca trava e
// ainda corta o tempo total da transição pela metade.
const AnimatedRoutes = () => {
  const location = useLocation();

  // Página nova começa do topo — sem isso a rota trocada herda o scroll da anterior.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <motion.div
      key={location.pathname}
      variants={pageTransition}
      initial="initial"
      animate="animate"
    >
      <Routes location={location}>
        <Route path="/" element={<RouteGenerator />} />
        <Route path="/catalogo" element={<Home />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/rota" element={<RouteGenerator />} />
        <Route path="/conquistas" element={<Conquistas />} />
        <Route path="/meus-roteiros" element={<MeusRoteiros />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/sua-rota" element={<SuaRota />} />
      </Routes>
    </motion.div>
  );
};

function App() {
  return (
    // reducedMotion="user" desliga as animações do Framer Motion para quem pediu
    // "menos movimento" no sistema operacional, sem precisar checar em cada tela.
    <MotionConfig reducedMotion="user" transition={T.base}>
      <AuthProvider>
        <CheckInProvider>
          <Router>
            <div className="app-container">
              {/* Fica antes de tudo e é position:fixed com z-index 0; o conteúdo vem por
                  cima via .app-main (position:relative, z-index 1). */}
              <FallsBackground />
              <Header />
              <main className="app-main">
                {/* Dentro do Router: assim a tela de erro mantém o cabeçalho e a
                    navegação, e dá para sair da rota quebrada sem recarregar. */}
                <ErrorBoundary>
                  <AnimatedRoutes />
                </ErrorBoundary>
              </main>
              <UnlockToast />
            </div>
          </Router>
        </CheckInProvider>
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
