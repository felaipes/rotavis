import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Map, Menu, X, User, LogOut, LogIn } from 'lucide-react';
import Home from './pages/Home';
import RouteGenerator from './pages/RouteGenerator';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="liquid-glass-header" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '15px 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="RotaVis" style={{ height: '58px', mixBlendMode: 'multiply' }} />
        </Link>
        
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }} className="nav-desktop">
          <Link to="/" className={`btn-glass ${location.pathname === '/' ? 'active' : ''}`}>Explorar</Link>
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
        </nav>
      </div>
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
              <Route path="/" element={<Home />} />
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
