import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Route, X, MapPin, Wallet } from 'lucide-react';
import { getPlaceCoordinates } from '../data/zoneCoordinates';

const FOZ_CENTER = [-25.5478, -54.5658];

// Cor do marcador por categoria, para diferenciar rapidamente passeios/restaurantes das demais.
const CATEGORY_COLORS = {
  passeios: '#3d9b4f',
  restaurantes: '#f2b70a',
  bares: '#4f46e5',
  cafe_da_manha: '#1e88e5',
  cafeterias_docerias: '#d97706',
  acomodacoes: '#8a7a63',
  lanches: '#8a7a63',
  mercados: '#8a7a63',
  compras_fronteira: '#8a7a63',
  esportes: '#8a7a63',
  academias: '#8a7a63',
  conveniencias: '#8a7a63'
};

const DEFAULT_ACTIVE_CATEGORIES = ['passeios', 'restaurantes'];

const InteractiveMap = ({ places, categories }) => {
  const [activeCategories, setActiveCategories] = useState(DEFAULT_ACTIVE_CATEGORIES);
  const [routeStops, setRouteStops] = useState([]);

  const toggleCategory = (catId) => {
    setActiveCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const mappablePlaces = useMemo(
    () => places.filter(p => activeCategories.includes(p.category)),
    [places, activeCategories]
  );

  const addToRoute = (place) => {
    setRouteStops(prev => (prev.some(p => p.id === place.id) ? prev : [...prev, place]));
  };

  const removeFromRoute = (placeId) => {
    setRouteStops(prev => prev.filter(p => p.id !== placeId));
  };

  const routeLine = useMemo(() => routeStops.map(p => getPlaceCoordinates(p)), [routeStops]);

  return (
    <div className="interactive-map-layout">
      <div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`btn-glass ${activeCategories.includes(cat.id) ? 'active' : ''}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: CATEGORY_COLORS[cat.id] || '#8a7a63', display: 'inline-block' }} />
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <MapContainer center={FOZ_CENTER} zoom={12} style={{ height: 'min(70vh, 560px)', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {routeLine.length > 1 && (
              <Polyline
                positions={routeLine}
                pathOptions={{ color: '#1e88e5', weight: 4, opacity: 0.8, dashArray: '1 10', lineCap: 'round' }}
              />
            )}

            {mappablePlaces.map(place => {
              const coords = getPlaceCoordinates(place);
              const stopIndex = routeStops.findIndex(p => p.id === place.id);
              const inRoute = stopIndex !== -1;
              return (
                <CircleMarker
                  key={place.id}
                  center={coords}
                  radius={inRoute ? 10 : 7}
                  pathOptions={{
                    color: inRoute ? '#1e88e5' : '#ffffff',
                    weight: inRoute ? 3 : 1.5,
                    fillColor: CATEGORY_COLORS[place.category] || '#8a7a63',
                    fillOpacity: 0.9
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]}>{place.name}</Tooltip>
                  <Popup>
                    <div style={{ minWidth: '180px' }}>
                      <strong>{place.name}</strong>
                      <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#5f7268' }}>{place.address}</p>
                      {(place.avgPrice || place.entryFee !== undefined) && (
                        <p style={{ margin: '4px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Wallet size={13} />
                          {place.avgPrice ? `~R$ ${place.avgPrice} / pessoa` : (place.entryFee === 'Gratuito' ? 'Entrada gratuita' : `R$ ${place.entryFee} / ingresso`)}
                        </p>
                      )}
                      <button
                        onClick={() => (inRoute ? removeFromRoute(place.id) : addToRoute(place))}
                        className={inRoute ? 'btn-glass' : 'btn-gold'}
                        style={{ marginTop: '8px', padding: '6px 12px', fontSize: '0.8rem', width: '100%' }}
                      >
                        {inRoute ? `Remover da rota (parada ${stopIndex + 1})` : 'Adicionar à rota'}
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
          Clique em um marcador para ver detalhes e adicionar à sua rota. As posições são aproximadas, dentro da região de cada local.
        </p>
      </div>

      <div className="liquid-glass" style={{ padding: '20px', position: 'sticky', top: '90px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '14px' }} className="text-gradient">
          <Route size={20} /> Sua rota no mapa
        </h3>

        {routeStops.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Clique nos marcadores do mapa e escolha "Adicionar à rota" para desenhar o seu trajeto entre os lugares.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {routeStops.map((place, idx) => (
                <div key={place.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: 'var(--blue)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    {place.name}
                  </span>
                  <button
                    onClick={() => removeFromRoute(place.id)}
                    aria-label={`Remover ${place.name} da rota`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setRouteStops([])} className="btn-glass" style={{ width: '100%', fontSize: '0.85rem' }}>
              Limpar rota
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default InteractiveMap;
