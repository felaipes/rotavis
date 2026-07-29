import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, AlertCircle, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BRAZILIAN_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO'
];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [state, setState] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, { age, state });
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass" 
        style={{ width: '100%', maxWidth: '500px', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ background: 'var(--green-dark)', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ffffff' }}>
            <UserPlus size={32} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Crie sua conta</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Comece sua jornada personalizada por Foz do Iguaçu.</p>
        </div>

        {/* Mensagem de sucesso */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: 'rgba(27, 94, 60, 0.08)',
                border: '1px solid rgba(27, 94, 60, 0.25)',
                color: 'var(--green-dark)',
                padding: '16px',
                borderRadius: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontWeight: 600
              }}
            >
              <CheckCircle size={22} />
              Conta criada com sucesso! Redirecionando...
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div style={{ background: '#ef444422', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Nome */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '12px 15px 12px 45px', background: 'var(--primary-dark)', borderRadius: '8px', color: 'var(--text-main)' }}
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Idade e Estado – lado a lado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Idade</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '12px 15px 12px 45px', background: 'var(--primary-dark)', borderRadius: '8px', color: 'var(--text-main)' }}
                    placeholder="Ex: 28"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Estado</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '12px 15px 12px 45px', background: 'var(--primary-dark)', borderRadius: '8px', color: 'var(--text-main)', appearance: 'auto' }}
                  >
                    <option value="">UF</option>
                    {BRAZILIAN_STATES.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Senha */}
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
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            {/* Confirmar Senha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Confirmar Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Criando conta...' : 'Cadastrar'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--text-muted)' }}>
          Já tem uma conta? <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>Entrar</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
