import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Map, MapPinned, User, LogOut, LogIn, Wallet, Route as RouteIcon, Trophy, ListChecks, Compass, ChevronRight } from 'lucide-react';
import Home from './pages/Home';
import Mapa from './pages/Mapa';
import RouteGenerator from './pages/RouteGenerator';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import SuaRota from './pages/SuaRota';
import Conquistas from './pages/Conquistas';
import MeusRoteiros from './pages/MeusRoteiros';
import Diagnostico from './pages/Diagnostico';
import FallsBackground from './components/FallsBackground';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CheckInProvider, useCheckIns } from './context/CheckInContext';
import { TIERS } from './data/achievements';
import { T, SPRING, pageTransition } from './motion';
import { haptic } from './haptics';
import './index.css';

// As cinco áreas principais. As mesmas no desktop (barra no topo) e no celular (tab
// bar no rodapé), na mesma ordem, para quem troca de aparelho achar tudo no lugar.
// Rótulos de uma palavra só no celular, como pede a HIG para tab bars.
const NAV_ITEMS = [
  { to: '/rota', label: 'Gerar Rota', short: 'Rota', icon: Map, match: ['/', '/rota'] },
  { to: '/catalogo', label: 'Catálogo', short: 'Catálogo', icon: Compass },
  { to: '/meus-roteiros', label: 'Meus Roteiros', short: 'Roteiros', icon: ListChecks },
  { to: '/mapa', label: 'Mapa', short: 'Mapa', icon: MapPinned },
  { to: '/conquistas', label: 'Conquistas', short: 'Conquistas', icon: Trophy }
];

const isActive = (item, pathname) => (item.match || [item.to]).includes(pathname);

// Aviso de troféu novo. Fica no App para aparecer de qualquer tela — inclusive quando o
// check-in é feito de dentro do catálogo, longe da aba de conquistas. Toque fecha;
// arrastar para baixo também, como as notificações do iOS.
const UnlockToast = () => {
  const { recentUnlock, dismissUnlock } = useCheckIns();

  useEffect(() => {
    if (!recentUnlock) return;
    haptic('success');
    const t = setTimeout(dismissUnlock, 5000);
    return () => clearTimeout(t);
  }, [recentUnlock, dismissUnlock]);

  return (
    <div className="toast-anchor">
      <AnimatePresence>
        {recentUnlock && (
          <motion.div
            key={recentUnlock.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING.pop }}
            exit={{ opacity: 0, y: 24, transition: T.exit }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.8 }}
            onDragEnd={(_, info) => { if (info.offset.y > 40 || info.velocity.y > 400) dismissUnlock(); }}
            role="status"
            onClick={dismissUnlock}
            style={{
              cursor: 'pointer', maxWidth: '100%', touchAction: 'none',
              background: 'var(--card-bg)', border: `2px solid ${TIERS[recentUnlock.tier].color}`,
              borderRadius: 'var(--r-lg)', padding: '14px 20px', boxShadow: 'var(--shadow-2)',
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
              <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: TIERS[recentUnlock.tier].color }}>
                Novo troféu {TIERS[recentUnlock.tier].label}
              </div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-body)' }}>{recentUnlock.title}</div>
              <div style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-muted)' }}>{recentUnlock.description}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Menu da conta no desktop. Abre com clique (e teclado), não só com o mouse por cima,
// e fecha com Esc ou clique fora.
const AccountMenu = ({ user, logout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemStyle = { border: 'none', justifyContent: 'flex-start', padding: '8px 12px', width: '100%' };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`btn-glass ${(location.pathname === '/perfil' || open) ? 'active' : ''}`}
        style={{ borderColor: 'transparent', padding: '6px 12px 6px 6px', gap: '10px' }}
      >
        <span className="avatar" style={{ width: '32px', height: '32px', fontSize: 'var(--text-footnote)' }}>
          {user.name?.charAt(0)?.toUpperCase() || <User size={16} />}
        </span>
        <span style={{ fontWeight: 600, fontSize: 'var(--text-subhead)' }}>{user.name.split(' ')[0]}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={T.fast}
            style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              transformOrigin: 'top right',
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-2)',
              padding: '6px', minWidth: '200px', display: 'flex', flexDirection: 'column',
              gap: '2px', zIndex: 100
            }}
          >
            <Link role="menuitem" to="/perfil" className="btn-glass" style={itemStyle}>
              <User size={16} /> Meu Perfil
            </Link>
            <Link role="menuitem" to="/perfil#carteira" className="btn-glass" style={itemStyle}>
              <Wallet size={16} /> Minha Carteira
            </Link>
            <div style={{ height: '1px', background: 'var(--card-border)', margin: '4px 0' }} />
            <button role="menuitem" onClick={() => { logout(); setOpen(false); }} className="btn-glass btn-destructive" style={itemStyle}>
              <LogOut size={16} /> Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="liquid-glass-header">
      <div className="container header-row">
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }} aria-label="RotaVis — início">
          <img src="/logo-transparent.png" alt="RotaVis" className="app-logo" />
        </Link>

        <nav className="nav-desktop" aria-label="Principal">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive(item, location.pathname) ? 'page' : undefined}
              className={`btn-glass ${isActive(item, location.pathname) ? 'active' : ''}`}
            >
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
          {user?.activeRoute && (
            <Link
              to="/sua-rota"
              aria-current={location.pathname === '/sua-rota' ? 'page' : undefined}
              className={`btn-glass ${location.pathname === '/sua-rota' ? 'active' : ''}`}
            >
              <RouteIcon size={18} aria-hidden="true" />
              Sua Rota
            </Link>
          )}

          <div style={{ width: '1px', height: '24px', background: 'var(--card-border)', margin: '0 6px' }} />

          {user ? (
            <AccountMenu user={user} logout={logout} />
          ) : (
            <Link to="/login" className="btn-gold" style={{ padding: '8px 18px', fontSize: 'var(--text-subhead)' }}>
              <LogIn size={16} aria-hidden="true" />
              Entrar
            </Link>
          )}
        </nav>

        {/* Celular: a navegação fica na tab bar; aqui só o acesso à conta, no canto
            superior direito, onde o iOS põe o botão de perfil. */}
        <div className="header-account-mobile">
          {user ? (
            <Link to="/perfil" className="icon-btn" aria-label="Meu perfil">
              <span className="avatar" style={{ width: '32px', height: '32px', fontSize: 'var(--text-footnote)' }}>
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </Link>
          ) : (
            <Link to="/login" className="btn-plain" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <LogIn size={18} aria-hidden="true" /> Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const TabBar = () => {
  const location = useLocation();
  return (
    <nav className="tab-bar" aria-label="Principal">
      {NAV_ITEMS.map(item => {
        const active = isActive(item, location.pathname);
        return (
          <Link key={item.to} to={item.to} className="tab-bar__item" aria-current={active ? 'page' : undefined}>
            <item.icon size={24} strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
            <span>{item.short}</span>
          </Link>
        );
      })}
    </nav>
  );
};

// Rota em andamento, acima da tab bar. Some na própria tela da rota.
const RouteAccessory = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user?.activeRoute || location.pathname === '/sua-rota') return null;

  return (
    <Link to="/sua-rota" className="route-accessory">
      <span className="avatar" style={{ width: '34px', height: '34px', borderRadius: 'var(--r-sm)' }}>
        <RouteIcon size={18} aria-hidden="true" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-subhead)' }}>Sua rota em andamento</span>
        <span style={{ display: 'block', fontSize: 'var(--text-footnote)', color: 'var(--text-muted)' }}>Toque para acompanhar o dia</span>
      </span>
      <ChevronRight size={20} color="var(--text-muted)" aria-hidden="true" />
    </Link>
  );
};

const AppMain = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const hasAccessory = !!user?.activeRoute && location.pathname !== '/sua-rota';
  return <main className={`app-main ${hasAccessory ? 'has-accessory' : ''}`}>{children}</main>;
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
        {/* Sem link no menu: é tela de suporte, para abrir quando algo quebra. */}
        <Route path="/diagnostico" element={<Diagnostico />} />
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
              <AppMain>
                {/* Dentro do Router: assim a tela de erro mantém o cabeçalho e a
                    navegação, e dá para sair da rota quebrada sem recarregar. */}
                <ErrorBoundary>
                  <AnimatedRoutes />
                </ErrorBoundary>
              </AppMain>
              <RouteAccessory />
              <TabBar />
              <UnlockToast />
            </div>
          </Router>
        </CheckInProvider>
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
