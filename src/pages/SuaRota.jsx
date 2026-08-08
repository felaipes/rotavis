import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Route, MapPinned } from 'lucide-react';
import ActiveRouteDashboard from '../components/ActiveRouteDashboard';
import { useAuth } from '../context/AuthContext';
import { T } from '../motion';

const SuaRota = () => {
  const { user } = useAuth();

  if (!user?.activeRoute) {
    return (
      <div className="container" style={{ padding: '80px 20px', minHeight: '70vh', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={T.base}
          style={{ maxWidth: '500px', margin: '0 auto' }}
        >
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--green-dark), var(--green))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', opacity: 0.15
          }}>
            <Route size={40} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>
            Nenhuma rota ativa
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '28px', lineHeight: 1.6 }}>
            Você ainda não tem uma rota em andamento. Crie um roteiro personalizado e ele aparecerá aqui para você acompanhar dia a dia!
          </p>
          <Link to="/rota" className="btn-gold" style={{ padding: '14px 32px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <MapPinned size={18} /> Gerar Minha Rota
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px', minHeight: '80vh', maxWidth: '900px' }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={T.base}
        style={{ marginBottom: '24px' }}
      >
        <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800, marginBottom: '8px' }} className="text-gradient">
          Sua <span className="gold-gradient">Rota</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Acompanhe sua viagem em tempo real. Marque os locais visitados e veja seu progresso!
        </p>
      </motion.div>

      <ActiveRouteDashboard />
    </div>
  );
};

export default SuaRota;
