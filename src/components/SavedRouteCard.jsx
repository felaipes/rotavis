import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, ChevronDown, ChevronUp, Sun, Sunset, Moon, MapPin, Wallet, Map as MapIcon } from 'lucide-react';
import { getPlaceCoordinates } from '../data/zoneCoordinates';
import { T, cssTransition, DUR } from '../motion';

const FOZ_CENTER = [-25.5478, -54.5658];

const PERIOD_COLORS = {
  manha: '#1e88e5',
  tarde: '#f2b70a',
  noite: '#4f46e5',
};

const CATEGORY_COLORS = {
  passeios: '#3d9b4f',
  restaurantes: '#f2b70a',
  bares: '#4f46e5',
  cafe_da_manha: '#1e88e5',
  cafeterias_docerias: '#d97706',
};

// Ícone minimalista para os marcadores do mapa do perfil
const buildIcon = (color, label) => {
  return L.divIcon({
    html: `<div style="
      width:28px; height:28px; border-radius:50% 50% 50% 0;
      background:${color}; transform:rotate(-45deg);
      border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex; align-items:center; justify-content:center;
    "><div style="transform:rotate(45deg); color:#fff; font-size:10px; font-weight:700;">${label}</div></div>`,
    className: 'rotavis-map-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
};

const WEEKDAY_LABELS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const PeriodSection = ({ label, icon: Icon, color, places }) => {
  if (!places || places.length === 0) return null;
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Icon size={16} style={{ color }} />
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color }}>{label}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {places.map((place, i) => (
          <div key={place.id || i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 14px', background: 'var(--primary-dark)',
            borderRadius: '8px', border: '1px solid var(--card-border)'
          }}>
            {place.image && (
              <img src={place.image} alt={place.name}
                style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {place.name}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={11} /> {place.address || place.zone}
              </p>
            </div>
            {(place.avgPrice || place.entryFee !== undefined) && (
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--green-dark)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wallet size={12} />
                {place.avgPrice ? `R$${place.avgPrice}` : (place.entryFee === 0 || place.entryFee === 'Gratuito' ? 'Grátis' : `R$${place.entryFee}`)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const RouteMap = ({ allPlaces }) => {
  // Organiza os lugares em ordem para a polilinha (manhã → tarde → noite)
  const coordsList = useMemo(() =>
    allPlaces.map(p => getPlaceCoordinates(p)),
    [allPlaces]
  );

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)', marginTop: '16px' }}>
      <MapContainer center={FOZ_CENTER} zoom={12} style={{ height: '320px', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {coordsList.length > 1 && (
          <Polyline
            positions={coordsList}
            pathOptions={{ color: '#1e88e5', weight: 3, opacity: 0.75, dashArray: '1 10', lineCap: 'round' }}
          />
        )}
        {allPlaces.map((place, i) => {
          const color = CATEGORY_COLORS[place.category] || '#8a7a63';
          return (
            <Marker key={place.id || i} position={coordsList[i]} icon={buildIcon(color, i + 1)}>
              <Popup>
                <div style={{ minWidth: '160px' }}>
                  {place.image && (
                    <img src={place.image} alt={place.name}
                      style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} />
                  )}
                  <strong style={{ fontSize: '0.85rem' }}>{place.name}</strong>
                  {place.address && (
                    <p style={{ fontSize: '0.78rem', color: '#5f7268', marginTop: '4px' }}>{place.address}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <p style={{ padding: '8px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--primary-dark)' }}>
        📍 As posições são aproximadas pela região de cada local. Clique nos marcadores para ver detalhes.
      </p>
    </div>
  );
};

// `expanded`/`onToggle` são opcionais: sem eles o cartão continua cuidando do próprio
// estado, como sempre fez no perfil. Em "Meus Roteiros" quem manda é a pasta, e os dois
// precisam abrir juntos — daí o modo controlado.
const SavedRouteCard = ({ route, index, expanded: expandedProp, onToggle }) => {
  const [expandedState, setExpandedState] = useState(false);
  const isControlled = expandedProp !== undefined;
  const expanded = isControlled ? expandedProp : expandedState;
  const toggle = () => (isControlled ? onToggle?.(!expanded) : setExpandedState(e => !e));
  const [showMap, setShowMap] = useState(false);

  const hasDays = route.days && route.days.length > 0;

  // Todos os lugares em ordem para o mapa (manhã → tarde → noite de cada dia)
  const allPlaces = useMemo(() => {
    if (!hasDays) return [];
    return route.days.flatMap(d => [
      ...(d.manha || []),
      ...(d.tarde || []),
      ...(d.noite || []),
    ]);
  }, [route.days, hasDays]);

  const totalPlaces = allPlaces.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      style={{
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--card-bg)',
      }}
    >
      {/* ── Cabeçalho clicável ── */}
      <button
        onClick={toggle}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '16px 18px', textAlign: 'left',
          transition: cssTransition(['background'], DUR.fast),
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--card-highlight)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{
          width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--green-dark), var(--green))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <Route size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{route.name}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {new Date(route.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {totalPlaces > 0 && ` · ${totalPlaces} paradas`}
            {route.days && ` · ${route.days.length} dia${route.days.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* ── Painel expandido ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={T.inOut}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 18px 20px', borderTop: '1px solid var(--card-border)' }}>
              {!hasDays ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <MapIcon size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p>Este roteiro foi salvo antes de registrar os locais.<br />Gere um novo roteiro para ver os detalhes aqui!</p>
                </div>
              ) : (
                <>
                  {route.days.map((dayPlan, di) => (
                    <div key={di} style={{ marginTop: '20px' }}>
                      <h4 style={{
                        fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        paddingBottom: '10px', borderBottom: '1px solid var(--card-border)'
                      }}>
                        <span style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: 'var(--accent-gold)', color: 'var(--green-dark)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 800, flexShrink: 0
                        }}>{dayPlan.day}</span>
                        Dia {dayPlan.day}
                        {dayPlan.weekday !== undefined && (
                          <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                            — {WEEKDAY_LABELS[dayPlan.weekday]}
                          </span>
                        )}
                      </h4>
                      <PeriodSection label="Manhã" icon={Sun} color={PERIOD_COLORS.manha} places={dayPlan.manha} />
                      <PeriodSection label="Tarde" icon={Sunset} color={PERIOD_COLORS.tarde} places={dayPlan.tarde} />
                      <PeriodSection label="Noite" icon={Moon} color={PERIOD_COLORS.noite} places={dayPlan.noite} />
                    </div>
                  ))}

                  {/* ── Botão Mapa + Mapa ── */}
                  {allPlaces.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <button
                        onClick={() => setShowMap(m => !m)}
                        className="btn-glass"
                        style={{ width: '100%', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                      >
                        <MapIcon size={16} />
                        {showMap ? 'Ocultar Mapa' : 'Ver Mapa do Roteiro'}
                      </button>

                      <AnimatePresence>
                        {showMap && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={T.base}
                          >
                            <RouteMap allPlaces={allPlaces} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SavedRouteCard;
