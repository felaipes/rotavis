import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeLoadingScreen from '../components/WelcomeLoadingScreen';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      // Salva o nome para mostrar na tela de boas-vindas
      setLoggedUser(result?.name || '');
      setShowWelcome(true);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showWelcome && (
          <WelcomeLoadingScreen
            userName={loggedUser}
            onComplete={() => navigate('/')}
          />
        )}
      </AnimatePresence>

      <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass" 
          style={{ width: '100%', maxWidth: '450px', padding: '40px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ background: 'var(--green-dark)', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ffffff' }}>
              <LogIn size={32} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Bem-vindo de volta</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Entre para salvar suas rotas preferidas.</p>
          </div>

          {error && (
            <div style={{ background: '#ef444422', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '12px 15px 12px 45px', background: 'var(--primary-dark)', borderRadius: '8px', color: 'var(--text-main)' }}
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '12px 15px 12px 45px', background: 'var(--primary-dark)', borderRadius: '8px', color: 'var(--text-main)' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-gold" 
              style={{ width: '100%', marginTop: '10px', fontSize: '1.1rem' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--text-muted)' }}>
            Ainda não tem uma conta? <Link to="/cadastro" style={{ color: 'var(--blue)', fontWeight: 600 }}>Cadastre-se</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
