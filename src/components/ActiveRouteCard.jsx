import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sun, Sunset, Moon, CheckCircle2, Circle } from 'lucide-react';
import { cssTransition, DUR } from '../motion';

const PERIOD_COLORS = {
  manha: '#1e88e5',
  tarde: '#f2b70a',
  noite: '#4f46e5',
};

const WEEKDAY_LABELS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const ActiveRouteCard = ({ route, onToggleVisited, onEndRoute }) => {
  if (!route || !route.days) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        border: '2px solid var(--accent-gold)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--card-bg)',
        boxShadow: '0 8px 24px rgba(212, 175, 55, 0.15)',
        position: 'relative'
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05))',
        padding: '20px', borderBottom: '1px solid var(--card-border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ 
                background: 'var(--accent-gold)', color: '#fff', fontSize: '0.7rem', 
                fontWeight: 800, padding: '3px 8px', borderRadius: '12px', textTransform: 'uppercase'
              }}>
                Em Andamento
              </span>
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', marginTop: '8px' }}>
              {route.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {new Date(route.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              {' · '}{route.days.length} dia(s)
            </p>
          </div>
          <button
            onClick={onEndRoute}
            className="btn-glass"
            style={{ 
              borderColor: '#ef4444', color: '#ef4444', fontSize: '0.85rem', 
              padding: '8px 14px', borderRadius: '8px'
            }}
          >
            Encerrar Rota
          </button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {route.days.map((dayPlan, di) => (
          <div key={di} style={{ marginBottom: di === route.days.length - 1 ? '0' : '24px' }}>
            <h4 style={{
              fontSize: '1rem', fontWeight: 700, marginBottom: '14px',
              display: 'flex', alignItems: 'center', gap: '10px',
              paddingBottom: '8px', borderBottom: '1px solid var(--card-border)'
            }}>
              <span style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--green-dark)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 800
              }}>{dayPlan.day}</span>
              Dia {dayPlan.day} {dayPlan.weekday !== undefined && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— {WEEKDAY_LABELS[dayPlan.weekday]}</span>}
            </h4>

            {['manha', 'tarde', 'noite'].map(period => {
              const places = dayPlan[period];
              if (!places || places.length === 0) return null;
              
              const Icon = period === 'manha' ? Sun : period === 'tarde' ? Sunset : Moon;
              const color = PERIOD_COLORS[period];

              return (
                <div key={period} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Icon size={16} style={{ color }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color, textTransform: 'capitalize' }}>{period}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {places.map(place => (
                      <div 
                        key={place.id} 
                        style={{
                          display: 'flex', alignItems: 'center', gap: '14px',
                          padding: '12px 16px', background: place.visited ? 'rgba(61, 155, 79, 0.05)' : 'var(--primary-dark)',
                          borderRadius: '10px', border: `1px solid ${place.visited ? 'var(--green)' : 'var(--card-border)'}`,
                          transition: cssTransition(['background', 'border-color'], DUR.fast), cursor: 'pointer'
                        }}
                        onClick={() => onToggleVisited(di, period, place.id)}
                      >
                        <button 
                          style={{ 
                            background: 'none', border: 'none', padding: 0, 
                            color: place.visited ? 'var(--green)' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          {place.visited ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ 
                            fontWeight: 600, fontSize: '0.95rem', 
                            color: place.visited ? 'var(--green-dark)' : 'var(--text-main)',
                            textDecoration: place.visited ? 'line-through' : 'none'
                          }}>
                            {place.name}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> {place.address || place.zone}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ActiveRouteCard;
