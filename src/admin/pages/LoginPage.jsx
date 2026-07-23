import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn, ChevronLeft } from 'lucide-react';
import { useAdminAuth } from '../App';

const ADMIN_EMAIL = 'admin@rotavis.com';
const ADMIN_PASSWORD = 'admin123';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      login({ name: 'Secretário de Turismo', email: ADMIN_EMAIL, role: 'admin' });
      navigate('/');
    } else {
      setError('Credenciais inválidas. Acesso restrito a administradores.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <Shield size={30} />
        </div>

        <h1>Observatório de Turismo</h1>
        <p className="login-subtitle">Acesso exclusivo para Prefeituras</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            id="admin-email"
            type="email"
            className="login-input"
            placeholder="Email de administrador"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            id="admin-password"
            type="password"
            className="login-input"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button id="admin-login-btn" type="submit" className="login-btn" disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Entrando...' : 'Acessar Painel'}
          </button>
        </form>

        <div className="login-back">
          <a href="/">
            <ChevronLeft size={16} />
            Voltar ao RotaVis
          </a>
        </div>

        <div className="login-demo">
          <div className="login-demo-title">Acesso de Demonstração</div>
          <p>
            Email: <strong>admin@rotavis.com</strong><br />
            Senha: <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
