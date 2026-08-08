import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Sun, Sunset, Moon, MapPin, Wallet, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { getPlaceCoordinates } from '../data/zoneCoordinates';
import { useAuth } from '../context/AuthContext';
import { T, cssTransition, DUR } from '../motion';

const DAY_COLORS = ['#1e88e5', '#3d9b4f', '#f2b70a', '#8b5cf6', '#ef4444'];
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const PERIOD_ICONS = { manha: Sun, tarde: Sunset, noite: Moon };
const PERIOD_COLORS = { manha: '#1e88e5', tarde: '#f2b70a', noite: '#4f46e5' };

const lightenHex = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * percent / 100));
  return `rgb(${r}, ${g}, ${b})`;
};

const buildIcon = (color, number) => L.divIcon({
  html: `<div style="position:relative; width:24px; height:32px;">
    <div style="position:absolute; top:0; left:2px; width:20px; height:20px; border-radius:50% 50% 50% 0; transform:rotate(-45deg);
      background:linear-gradient(135deg, ${lightenHex(color, 18)}, ${color});
      border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.3);
      display:flex; align-items:center; justify-content:center;">
      <span style="transform:rotate(45deg); color:#fff; font-size:9px; font-weight:800;">${number}</span>
    </div>
  </div>`,
  className: 'rotavis-map-icon',
  iconSize: [24, 32],
  iconAnchor: [12, 30],
});

const FitBounds = ({ positions }) => {
  const map = L.DomUtil.get('active-route-mini-map')?.leafletElement;
  return null;
};

const priceOf = (p) => p?.avgPrice ?? (typeof p?.entryFee === 'number' ? p.entryFee : 0);

const ActiveRouteDashboard = () => {
  const { user, updateProfile } = useAuth();
  const route = user?.activeRoute;

  const stats = useMemo(() => {
    if (!route?.days) return null;
    let totalPlaces = 0;
    let visitedPlaces = 0;
    const dailyCosts = [];

    route.days.forEach(day => {
      let dayCost = 0;
      ['manha', 'tarde', 'noite'].forEach(p => {
        if (day[p]) {
          day[p].forEach(place => {
            totalPlaces++;
            if (place.visited) visitedPlaces++;
            dayCost += priceOf(place);
          });
        }
      });
      dailyCosts.push(dayCost);
    });

    return { totalPlaces, visitedPlaces, dailyCosts, progress: totalPlaces > 0 ? (visitedPlaces / totalPlaces) * 100 : 0 };
  }, [route]);

  const allStops = useMemo(() => {
    if (!route?.days) return [];
    return route.days.flatMap((d, di) => {
      const color = DAY_COLORS[di % DAY_COLORS.length];
      return ['manha', 'tarde', 'noite'].flatMap(p =>
        (d[p] || []).map(place => ({ place, coords: getPlaceCoordinates(place), color, dayIndex: di }))
      );
    });
  }, [route]);

  const dayLines = useMemo(() => {
    if (!route?.days) return [];
    return route.days.map((d, di) => {
      const stops = ['manha', 'tarde', 'noite'].flatMap(p => (d[p] || []));
      return { coords: stops.map(s => getPlaceCoordinates(s)), color: DAY_COLORS[di % DAY_COLORS.length] };
    });
  }, [route]);

  const handleToggle = async (dayIndex, period, placeId) => {
    if (!route) return;
    const newRoute = JSON.parse(JSON.stringify(route));
    const place = newRoute.days[dayIndex][period].find(p => p.id === placeId);
    if (place) {
      place.visited = !place.visited;
      await updateProfile({ activeRoute: newRoute });
    }
  };

  if (!route || !route.days || !stats) return null;

  const expirationDate = new Date(route.expirationDate);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={T.base}
      className="liquid-glass"
      style={{ padding: '0', marginBottom: '35px', overflow: 'hidden', border: '2px solid var(--accent-gold)' }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(27, 94, 60, 0.08), rgba(212, 175, 55, 0.06))',
        padding: '24px 28px', borderBottom: '1px solid var(--card-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              background: 'linear-gradient(135deg, var(--green-dark), var(--green))',
              color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px',
              borderRadius: '14px', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              📍 Rota Ativa
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {daysLeft > 0 ? `${daysLeft} dia(s) restante(s)` : 'Expira hoje'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{route.name}</h2>
        </div>
        <Link to="/perfil" className="btn-gold" style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Ver detalhes <ChevronRight size={16} />
        </Link>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '20px 28px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Progresso da Viagem</span>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--green-dark)' }}>
            {stats.visitedPlaces}/{stats.totalPlaces} locais · {Math.round(stats.progress)}%
          </span>
        </div>
        <div style={{ height: '10px', background: 'var(--card-border)', borderRadius: '99px', overflow: 'hidden' }}>
          <motion.div
            initial={false}
            animate={{ width: `${stats.progress}%` }}
            transition={T.slow}
            style={{
              height: '100%', borderRadius: '99px',
              background: stats.progress === 100
                ? 'linear-gradient(90deg, var(--green), #4ade80)'
                : 'linear-gradient(90deg, var(--green-dark), var(--green), var(--accent-gold))'
            }}
          />
        </div>
      </div>

      {/* Content grid: days + map */}
      <div style={{ padding: '20px 28px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Left: Daily summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {route.days.map((day, di) => {
            const places = ['manha', 'tarde', 'noite'].flatMap(p => day[p] || []);
            const visited = places.filter(p => p.visited).length;
            const total = places.length;
            const dayCost = stats.dailyCosts[di];
            const dayDone = visited === total && total > 0;

            return (
              <div key={di} style={{
                padding: '16px', borderRadius: '12px',
                background: dayDone ? 'rgba(61, 155, 79, 0.06)' : 'var(--primary-dark)',
                border: `1px solid ${dayDone ? 'var(--green)' : 'var(--card-border)'}`,
                transition: cssTransition(['background', 'border-color'])
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: DAY_COLORS[di % DAY_COLORS.length], color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: 800
                    }}>{day.day}</span>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Dia {day.day}</span>
                      {day.weekday !== undefined && (
                        <span style={{ marginLeft: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{WEEKDAY_LABELS[day.weekday]}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {dayDone && <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />}
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: dayDone ? 'var(--green)' : 'var(--text-muted)' }}>
                      {visited}/{total}
                    </span>
                  </div>
                </div>

                {/* Mini place list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {['manha', 'tarde', 'noite'].map(period => {
                    if (!day[period] || day[period].length === 0) return null;
                    const PIcon = PERIOD_ICONS[period];
                    return day[period].map(place => (
                      <div
                        key={place.id}
                        onClick={() => handleToggle(di, period, place.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                          padding: '6px 8px', borderRadius: '8px',
                          opacity: place.visited ? 0.6 : 1,
                          transition: cssTransition(['opacity'], DUR.fast)
                        }}
                      >
                        {place.visited ? <CheckCircle2 size={14} style={{ color: 'var(--green)', flexShrink: 0 }} /> : <Circle size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                        <PIcon size={12} style={{ color: PERIOD_COLORS[period], flexShrink: 0 }} />
                        <span style={{
                          fontSize: '0.82rem', fontWeight: 500,
                          textDecoration: place.visited ? 'line-through' : 'none',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>{place.name}</span>
                      </div>
                    ));
                  })}
                </div>

                {/* Daily cost estimate */}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wallet size={13} style={{ color: 'var(--accent-gold)' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Estimativa: R$ {dayCost.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {allStops.length > 0 && (
            <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--card-border)', flexGrow: 1, minHeight: '280px' }}>
              <MapContainer
                center={allStops[0]?.coords || [-25.5478, -54.5658]}
                zoom={12}
                style={{ height: '100%', width: '100%', minHeight: '280px' }}
                scrollWheelZoom={false}
                dragging={true}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {dayLines.map((d, i) => d.coords.length > 1 && (
                  <React.Fragment key={i}>
                    <Polyline positions={d.coords} pathOptions={{ color: '#ffffff', weight: 7, opacity: 0.85, lineCap: 'round' }} />
                    <Polyline positions={d.coords} pathOptions={{ color: d.color, weight: 4, opacity: 1, lineCap: 'round', dashArray: '1, 10' }} />
                  </React.Fragment>
                ))}
                
                {allStops.map((s, i) => (
                  <Marker key={`${s.place.id}-${i}`} position={s.coords} icon={buildIcon(s.color, i + 1)} />
                ))}
              </MapContainer>
            </div>
          )}
          
          {/* Cost summary */}
          <div style={{
            padding: '16px', borderRadius: '12px',
            background: 'var(--primary-dark)', border: '1px solid var(--card-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Wallet size={18} style={{ color: 'var(--accent-gold)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Resumo Financeiro</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Custo estimado total</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-dark)' }}>
                R$ {stats.dailyCosts.reduce((a, b) => a + b, 0).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActiveRouteDashboard;
