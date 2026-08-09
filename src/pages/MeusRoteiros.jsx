import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Route, Trash2, RotateCcw, MapPinned, Users, Wallet, Car, Footprints } from 'lucide-react';
import SavedRouteCard from '../components/SavedRouteCard';
import Folder from '../components/Folder';
import { useRouteHistory } from '../hooks/useRouteHistory';
import { getPlaceCoordinates, totalRouteDistanceKm, formatDistanceKm } from '../data/zoneCoordinates';
import { fadeUp, stagger, T } from '../motion';

const priceOf = (p) => p?.avgPrice ?? (typeof p?.entryFee === 'number' ? p.entryFee : 0);

const summarize = (entry) => {
  const stops = (entry.days || []).flatMap(d => [...(d.manha || []), ...(d.tarde || []), ...(d.noite || [])]);
  const km = (entry.days || []).reduce(
    (sum, d) => sum + totalRouteDistanceKm(
      [...(d.manha || []), ...(d.tarde || []), ...(d.noite || [])].map(getPlaceCoordinates)
    ),
    0
  );
  const perPerson = stops.reduce((s, p) => s + priceOf(p), 0);
  return { stopCount: stops.length, km, cost: perPerson * (entry.travelers || 1) };
};

// Texto miúdo dentro dos papéis da pasta: um resumo de relance quando ela abre.
const paperTextStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '100%', height: '100%',
  fontSize: '13px', fontWeight: 800, color: 'var(--green-dark)'
};

const MeusRoteiros = () => {
  const { routes, removeRoute, clearRoutes } = useRouteHistory();
  // Um roteiro aberto por vez. A pasta e o cartão compartilham este estado, senão dava
  // para ficar com a pasta aberta e o roteiro fechado.
  const [openId, setOpenId] = useState(null);

  if (routes.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 20px', minHeight: '70vh', textAlign: 'center' }}>
        <motion.div variants={fadeUp} initial="initial" animate="animate" style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--green-dark), var(--green))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', opacity: 0.18
          }}>
            <Route size={40} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>
            Nenhum roteiro ainda
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '28px', lineHeight: 1.6 }}>
            Os roteiros que você gerar aparecem aqui automaticamente, para consultar depois
            sem precisar refazer o questionário.
          </p>
          <Link to="/rota" className="btn-gold" style={{ padding: '14px 32px', fontSize: '1rem' }}>
            <MapPinned size={18} /> Gerar meu primeiro roteiro
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px 60px', maxWidth: '900px', minHeight: '80vh' }}>
      <motion.div variants={fadeUp} initial="initial" animate="animate">
        <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800, marginBottom: '6px' }} className="text-gradient">
          Meus <span className="gold-gradient">Roteiros</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '26px' }}>
          {routes.length} {routes.length === 1 ? 'roteiro gerado' : 'roteiros gerados'} ·
          {' '}toque em um deles para ver os dias, os locais e o mapa.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {routes.map((entry, i) => {
            const s = summarize(entry);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={stagger(i)}
              >
                {/* Faixa de resumo acima do cartão: dá para comparar os roteiros sem
                    abrir um por um. A pasta fica aqui, e não no cabeçalho do cartão,
                    porque o cartão tem overflow:hidden — os papéis voando para fora
                    seriam cortados. Aqui sobra espaço acima para eles. */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
                  fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600,
                  padding: '0 4px 6px'
                }}>
                  <div
                    style={{
                      width: '62px', height: '52px', flexShrink: 0, position: 'relative',
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                    }}
                  >
                    <Folder
                      size={0.55}
                      color="#3d9b4f"
                      open={openId === entry.id}
                      onToggle={(next) => setOpenId(next ? entry.id : null)}
                      ariaLabel={openId === entry.id ? `Fechar ${entry.name}` : `Abrir ${entry.name}`}
                      items={[
                        <span key="d" style={paperTextStyle}>{entry.days?.length}d</span>,
                        <span key="p" style={paperTextStyle}>{s.stopCount}</span>,
                        <span key="k" style={paperTextStyle}>{Math.round(s.km)}km</span>
                      ]}
                    />
                  </div>
                  {entry.option && (
                    <span style={{
                      background: 'var(--card-highlight)', color: 'var(--green-dark)',
                      borderRadius: '99px', padding: '2px 9px', fontWeight: 700
                    }}>
                      Opção {entry.option}
                    </span>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Route size={13} /> {s.stopCount} paradas · {formatDistanceKm(s.km)}
                  </span>
                  {s.cost > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Wallet size={13} /> ~R$ {Math.round(s.cost).toLocaleString('pt-BR')}
                    </span>
                  )}
                  {entry.travelers > 1 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={13} /> {entry.travelers} pessoas
                    </span>
                  )}
                  {entry.transport && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      {entry.transport === 'ape' ? <Footprints size={13} /> : <Car size={13} />}
                      {entry.transport === 'ape' ? 'A pé / App' : 'Carro'}
                    </span>
                  )}
                  <button
                    onClick={() => removeRoute(entry.id)}
                    aria-label={`Apagar ${entry.name}`}
                    className="btn-glass"
                    style={{ marginLeft: 'auto', padding: '5px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Trash2 size={13} /> Apagar
                  </button>
                </div>

                <SavedRouteCard
                  route={entry}
                  index={0}
                  expanded={openId === entry.id}
                  onToggle={(next) => setOpenId(next ? entry.id : null)}
                />
              </motion.div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
          <Link to="/rota" className="btn-gold" style={{ padding: '13px 28px' }}>
            <MapPinned size={17} /> Gerar outro roteiro
          </Link>
          <button
            onClick={() => { if (window.confirm('Apagar todos os roteiros do histórico?')) clearRoutes(); }}
            className="btn-glass"
            style={{ padding: '13px 24px', display: 'inline-flex', alignItems: 'center', gap: '7px' }}
          >
            <RotateCcw size={16} /> Limpar histórico
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '18px' }}>
          O histórico fica salvo neste navegador. Guarda os {20} roteiros mais recentes.
        </p>
      </motion.div>
    </div>
  );
};

export default MeusRoteiros;
