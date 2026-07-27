import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Sunset, Moon, Sparkles, ArrowRight, Compass, CheckCircle2, Clock } from 'lucide-react';
import { places } from '../data';
import PlaceCard from '../components/PlaceCard';
import { motion } from 'framer-motion';
import { buildAutoRoute } from '../services/routeBuilderService';
import { WEEKDAY_LABELS } from '../services/availabilityService';

const PERIODS = [
  { key: 'manha', label: 'Manhã', icon: Sun, color: 'var(--blue)' },
  { key: 'tarde', label: 'Tarde', icon: Sunset, color: '#d97706' },
  { key: 'noite', label: 'Noite', icon: Moon, color: '#4f46e5' }
];

const RoteiroAutomatico = () => {
  const route = useMemo(() => buildAutoRoute(places, { days: 3 }), []);

  // Guarda qual opção (A ou B) está escolhida em cada período de cada dia. Começa em A.
  const [selections, setSelections] = useState({});
  const getSelection = (dayKey, periodKey) => selections[`${dayKey}-${periodKey}`] || 'A';
  const choose = (dayKey, periodKey, option) => {
    setSelections(prev => ({ ...prev, [`${dayKey}-${periodKey}`]: option }));
  };

  return (
    <div className="container" style={{ padding: '50px 20px 80px' }}>
      <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 50px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
          <Sparkles size={16} />
          Roteiro gerado automaticamente
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 800, marginBottom: '16px' }} className="text-gradient">
          Seu roteiro para Foz do Iguaçu já está pronto
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '28px' }}>
          Montamos {route.length} dias com 2 opções para cada período. Escolha a que preferir em cada um, ou personalize tudo do zero.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/rota" className="btn-gold">
            Personalizar meu roteiro <ArrowRight size={18} />
          </Link>
          <Link to="/catalogo" className="btn-glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} />
            Ver catálogo completo
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
        {route.map(dayPlan => {
          const dayKey = dayPlan.day;
          return (
            <div key={dayKey} style={{ borderLeft: '2px dashed var(--card-border)', paddingLeft: 'clamp(24px, 8vw, 40px)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-21px', top: 0, background: 'var(--primary-dark)', padding: '10px' }}>
                <div style={{
                  width: '40px', height: '40px', background: 'var(--accent-gold)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-dark)',
                  fontWeight: 'bold', boxShadow: '0 0 15px var(--accent-gold-glow)'
                }}>
                  {dayKey}
                </div>
              </div>

              <h2 style={{ fontSize: '1.8rem', marginBottom: '5px' }} className="gold-gradient">
                Dia {dayKey}
              </h2>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '30px' }}>
                <Clock size={15} /> {WEEKDAY_LABELS[dayPlan.weekday]}
              </p>

              {PERIODS.map(period => {
                const periodData = dayPlan[period.key];
                const selected = getSelection(dayKey, period.key);

                return (
                  <div key={period.key} style={{ marginBottom: '40px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', marginBottom: '18px', color: period.color }}>
                      <period.icon size={22} /> {period.label}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '20px' }}>
                      {['A', 'B'].map(optionKey => {
                        const optionPlaces = periodData[`option${optionKey}`];
                        const isChosen = selected === optionKey;
                        if (optionPlaces.length === 0) return null;

                        return (
                          <div
                            key={optionKey}
                            style={{
                              border: `2px solid ${isChosen ? 'var(--green)' : 'var(--card-border)'}`,
                              borderRadius: '14px',
                              padding: '16px',
                              background: isChosen ? 'var(--card-highlight)' : 'transparent',
                              transition: 'border-color 0.25s ease, background 0.25s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Opção {optionKey}</span>
                              <button
                                onClick={() => choose(dayKey, period.key, optionKey)}
                                className={`btn-glass ${isChosen ? 'active' : ''}`}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem' }}
                              >
                                {isChosen ? (<><CheckCircle2 size={15} /> Escolhida</>) : 'Escolher'}
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {optionPlaces.map(place => (
                                <PlaceCard key={place.id} place={place} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginTop: '20px' }}
      >
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          Quer mudar orçamento, interesses ou quantidade de dias?
        </p>
        <Link to="/rota" className="btn-gold">
          Refazer com meu perfil <ArrowRight size={18} />
        </Link>
      </motion.div>
    </div>
  );
};

export default RoteiroAutomatico;
