import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, Eye, EyeOff, MapPin, Calendar,
  Edit3, Check, X, LogOut, Route, ChevronRight, Shield, Sparkles
} from 'lucide-react';

const BRAZILIAN_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO'
];

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos editáveis
  const [editName, setEditName] = useState(user?.name || '');
  const [editAge, setEditAge] = useState(user?.age || '');
  const [editState, setEditState] = useState(user?.state || '');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: editName, age: editAge, state: editState });
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(user.name);
    setEditAge(user.age || '');
    setEditState(user.state || '');
    setEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const stateName = (uf) => {
    const map = {
      AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',
      DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',
      MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',
      PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',RJ:'Rio de Janeiro',
      RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',RR:'Roraima',
      SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins'
    };
    return map[uf] || uf;
  };

  const savedRoutes = user.savedRoutes || [];

  return (
    <div className="container" style={{ minHeight: '80vh', padding: '40px 20px', maxWidth: '800px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* ── Header do Perfil ── */}
        <div className="liquid-glass" style={{ padding: '40px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
          {/* Background decorativo */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '100px',
            background: 'linear-gradient(135deg, var(--green-dark) 0%, var(--green) 50%, var(--blue) 100%)',
            opacity: 0.08, borderRadius: '12px 12px 0 0'
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', position: 'relative', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--green-dark), var(--green))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '2.2rem', fontWeight: 800,
              boxShadow: '0 6px 20px rgba(27, 94, 60, 0.25)',
              flexShrink: 0, border: '3px solid #fff'
            }}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            {/* Info + Actions */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{user.name}</h1>
                <span style={{
                  background: 'linear-gradient(135deg, var(--green-dark), var(--green))',
                  color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                  padding: '4px 10px', borderRadius: '20px',
                  display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}>
                  <Sparkles size={12} /> Explorador
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.95rem' }}>{user.email}</p>
              {user.state && (
                <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> {stateName(user.state)}
                </p>
              )}

              {/* Botões de ação */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-glass"
                    style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit3 size={15} /> Editar Perfil
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-gold"
                      style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                    >
                      <Check size={15} /> {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn-glass"
                      style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <X size={15} /> Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Dados Pessoais ── */}
        <motion.div
          className="liquid-glass"
          style={{ padding: '30px', marginBottom: '24px' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} style={{ color: 'var(--green-dark)' }} />
            Dados Pessoais
          </h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Nome */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Nome Completo
              </label>
              {editing ? (
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '12px 14px 12px 44px', background: 'var(--primary-dark)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.95rem' }}
                  />
                </div>
              ) : (
                <p style={{ fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={18} style={{ color: 'var(--green-dark)', flexShrink: 0 }} /> {user.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email
              </label>
              <p style={{ fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} style={{ color: 'var(--green-dark)', flexShrink: 0 }} /> {user.email}
              </p>
            </div>

            {/* Senha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Senha
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={18} style={{ color: 'var(--green-dark)', flexShrink: 0 }} />
                <span style={{ fontSize: '1rem', fontWeight: 500, letterSpacing: showPassword ? '0' : '3px' }}>
                  {showPassword ? '123456' : '••••••'}
                </span>
                <button
                  onClick={() => setShowPassword((p) => !p)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Idade e Estado – lado a lado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Idade */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Idade
                </label>
                {editing ? (
                  <div style={{ position: 'relative' }}>
                    <Calendar size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      className="input-field"
                      placeholder="Ex: 28"
                      style={{ width: '100%', padding: '12px 14px 12px 44px', background: 'var(--primary-dark)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.95rem' }}
                    />
                  </div>
                ) : (
                  <p style={{ fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={18} style={{ color: 'var(--green-dark)', flexShrink: 0 }} />
                    {user.age ? `${user.age} anos` : '—'}
                  </p>
                )}
              </div>

              {/* Estado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Estado
                </label>
                {editing ? (
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', padding: '12px 14px 12px 44px', background: 'var(--primary-dark)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.95rem', appearance: 'auto' }}
                    >
                      <option value="">Selecione</option>
                      {BRAZILIAN_STATES.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p style={{ fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={18} style={{ color: 'var(--green-dark)', flexShrink: 0 }} />
                    {user.state ? stateName(user.state) : '—'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Rotas Salvas ── */}
        <motion.div
          className="liquid-glass"
          style={{ padding: '30px', marginBottom: '24px' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Route size={20} style={{ color: 'var(--green-dark)' }} />
            Rotas Salvas
            <span style={{
              background: 'var(--card-highlight)', color: 'var(--green-dark)',
              fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
              marginLeft: '4px'
            }}>
              {savedRoutes.length}
            </span>
          </h2>

          {savedRoutes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
              <Route size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ fontWeight: 500 }}>Nenhuma rota salva ainda.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Explore o gerador de rotas e salve seus roteiros favoritos!</p>
              <Link to="/rota" className="btn-gold" style={{ marginTop: '16px', display: 'inline-flex', padding: '10px 24px', fontSize: '0.9rem' }}>
                Gerar uma Rota
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence>
                {savedRoutes.map((route, i) => (
                  <motion.div
                    key={route.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 18px', background: 'var(--card-highlight)',
                      borderRadius: '10px', border: '1px solid var(--card-border)',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                    whileHover={{ scale: 1.01, boxShadow: '0 4px 12px rgba(27,94,60,0.1)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--green-dark), var(--green))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        flexShrink: 0
                      }}>
                        <Route size={18} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{route.name}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(route.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* ── Sair ── */}
        <motion.div
          style={{ textAlign: 'center', paddingBottom: '40px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', border: '1px solid #ef444444',
              color: '#ef4444', borderRadius: '10px', padding: '12px 30px',
              cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ef444411'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={18} /> Sair da Conta
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;
