import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Search, Plus, Minus, MapPin, Lock, Check, RotateCcw } from 'lucide-react';
import { places, categories } from '../data';
import { useCheckIns } from '../context/CheckInContext';
import { TIERS, ACHIEVEMENT_GROUPS } from '../data/achievements';
import { T, fadeUp, stagger } from '../motion';

const StatTile = ({ label, value, sub }) => (
  <div style={{
    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px',
    padding: '16px 18px', flex: '1 1 140px', minWidth: 0
  }}>
    <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--green-dark)', lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{label}</div>
    {sub && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
  </div>
);

const TrophyCard = ({ achievement, index }) => {
  const tier = TIERS[achievement.tier];
  const Icon = achievement.icon;
  const { unlocked, current, goal, percent } = achievement;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={stagger(index)}
      style={{
        border: `1px solid ${unlocked ? tier.color : 'var(--card-border)'}`,
        background: unlocked ? tier.soft : 'var(--card-bg)',
        borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start',
        opacity: unlocked ? 1 : 0.72
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
        background: unlocked ? tier.color : 'var(--card-highlight)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: unlocked ? `0 4px 12px ${tier.soft}` : 'none',
        filter: unlocked ? 'none' : 'grayscale(1)'
      }}>
        {unlocked
          ? <Icon size={24} color="#ffffff" />
          : <Lock size={20} color="var(--text-muted)" />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: '0.98rem' }}>{achievement.title}</strong>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px',
            color: unlocked ? tier.color : 'var(--text-muted)',
            border: `1px solid ${unlocked ? tier.color : 'var(--card-border)'}`,
            borderRadius: '99px', padding: '1px 8px'
          }}>
            {tier.label}
          </span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
          {achievement.description}
        </p>

        <div style={{ marginTop: '10px', height: '6px', background: 'var(--card-border)', borderRadius: '99px', overflow: 'hidden' }}>
          <motion.div
            initial={false}
            animate={{ width: `${percent}%` }}
            transition={T.slow}
            style={{ height: '100%', borderRadius: '99px', background: unlocked ? tier.color : 'var(--green)' }}
          />
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {unlocked && <Check size={12} color={tier.color} />}
          {current} / {goal} {achievement.unit}
        </div>
      </div>
    </motion.div>
  );
};

const Conquistas = () => {
  const { stats, achievements, unlockedCount, addCheckIn, undoCheckIn, resetCheckIns, checkIns } = useCheckIns();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  const visiblePlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter(p => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.zone || '').toLowerCase().includes(q);
      const matchesCat = categoryFilter === 'todos' || p.category === categoryFilter;
      return matchesQuery && matchesCat;
    });
  }, [query, categoryFilter]);

  const lastVisits = useMemo(() => checkIns.slice(0, 6).map(c => ({
    ...c,
    place: places.find(p => p.id === c.placeId)
  })), [checkIns]);

  return (
    <div className="container" style={{ padding: '40px 20px 60px', maxWidth: '960px', minHeight: '80vh' }}>
      <motion.div variants={fadeUp} initial="initial" animate="animate">
        <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800, marginBottom: '6px' }} className="text-gradient">
          Suas <span className="gold-gradient">Conquistas</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Dê check-in nos lugares que você já visitou e vá destravando troféus.
        </p>

        {/* Barra do quanto de Foz já foi explorado */}
        <div className="liquid-glass" style={{ padding: '22px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
            <strong style={{ fontSize: '1rem' }}>Foz do Iguaçu explorada</strong>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-dark)' }}>
              {stats.percent.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: '12px', background: 'var(--card-border)', borderRadius: '99px', overflow: 'hidden' }}>
            <motion.div
              initial={false}
              animate={{ width: `${stats.percent}%` }}
              transition={T.slow}
              style={{
                height: '100%', borderRadius: '99px',
                background: 'linear-gradient(90deg, var(--blue), var(--green), var(--accent-gold))'
              }}
            />
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {stats.uniqueCount} de {stats.totalPlaces} lugares do catálogo
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '30px' }}>
          <StatTile label="Visitas" value={stats.total} sub="contando repetidas" />
          <StatTile label="Lugares" value={stats.uniqueCount} sub="diferentes" />
          <StatTile label="Troféus" value={`${unlockedCount}/${achievements.length}`} sub="destravados" />
          <StatTile label="Recorde" value={`${stats.maxRepeat}x`} sub="no mesmo lugar" />
        </div>

        {/* Mostruário */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '18px' }}>
          <Trophy size={22} style={{ color: 'var(--accent-gold)' }} /> Mostruário de troféus
        </h2>

        {ACHIEVEMENT_GROUPS.map(group => {
          const items = achievements.filter(a => a.group === group.id);
          const done = items.filter(a => a.unlocked).length;
          return (
            <div key={group.id} style={{ marginBottom: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <strong style={{ fontSize: '0.98rem' }}>{group.label}</strong>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--green-dark)' }}>{done}/{items.length}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{group.hint}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '12px' }}>
                {items.map((a, i) => <TrophyCard key={a.id} achievement={a} index={i} />)}
              </div>
            </div>
          );
        })}

        {/* Últimas visitas */}
        {lastVisits.length > 0 && (
          <div className="liquid-glass" style={{ padding: '18px', marginBottom: '30px' }}>
            <strong style={{ fontSize: '0.98rem' }}>Últimas visitas</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {lastVisits.map((v, i) => (
                <div key={`${v.placeId}-${v.date}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <MapPin size={13} color="var(--green)" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.place ? v.place.name : 'Local removido do catálogo'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', flexShrink: 0 }}>
                    {new Date(v.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { if (window.confirm('Apagar todo o histórico de visitas e troféus?')) resetCheckIns(); }}
              className="btn-glass"
              style={{ marginTop: '14px', fontSize: '0.8rem', padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={13} /> Zerar histórico
            </button>
          </div>
        )}

        {/* Registrar visita */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '14px' }}>Registrar visita</h2>

        <div className="search-field-wrapper" style={{
          display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--card-bg)',
          border: '1px solid var(--card-border)', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px'
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar lugar ou região..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.95rem', color: 'var(--text-main)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button
            onClick={() => setCategoryFilter('todos')}
            className={`btn-glass ${categoryFilter === 'todos' ? 'active' : ''}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`btn-glass ${categoryFilter === cat.id ? 'active' : ''}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visiblePlaces.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0', textAlign: 'center' }}>
              Nenhum lugar encontrado com esse filtro.
            </p>
          )}
          {visiblePlaces.map(place => {
            const count = stats.countByPlace[place.id] || 0;
            return (
              <div
                key={place.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                  background: count > 0 ? 'rgba(61, 155, 79, 0.07)' : 'var(--card-bg)',
                  border: `1px solid ${count > 0 ? 'var(--green)' : 'var(--card-border)'}`,
                  borderRadius: '12px'
                }}
              >
                <img
                  src={place.image}
                  alt={place.name}
                  style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {place.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{place.zone}</div>
                </div>

                {count > 0 && (
                  <>
                    <span style={{
                      background: 'var(--green-dark)', color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                      borderRadius: '99px', padding: '3px 10px', flexShrink: 0
                    }}>
                      {count}x
                    </span>
                    <button
                      onClick={() => undoCheckIn(place.id)}
                      aria-label={`Remover uma visita de ${place.name}`}
                      className="btn-glass"
                      style={{ padding: '6px', display: 'flex', flexShrink: 0 }}
                    >
                      <Minus size={15} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => addCheckIn(place.id)}
                  aria-label={`Registrar visita em ${place.name}`}
                  className="btn-gold"
                  style={{ padding: '7px 12px', fontSize: '0.8rem', flexShrink: 0, gap: '5px' }}
                >
                  <Plus size={14} /> Visitei
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Conquistas;
