import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Route, X, MapPin, Wallet, Map as MapIcon, Utensils, Beer, Coffee, CupSoda, Bed, Pizza, ShoppingCart, Store, Dumbbell } from 'lucide-react';
import { getPlaceCoordinates, totalRouteDistanceKm, formatDistanceKm } from '../data/zoneCoordinates';

const FOZ_CENTER = [-25.5478, -54.5658];

// Só os ícones realmente usados pelas categorias (ver icon: '...' em data.js), para não
// empacotar a biblioteca lucide-react inteira no bundle. Renomeado "Map" -> "MapIcon" para
// não colidir com o Map (Map/Set) nativo do JavaScript usado no cache abaixo.
const CATEGORY_ICON_COMPONENTS = { Map: MapIcon, Utensils, Beer, Coffee, CupSoda, Bed, Pizza, ShoppingCart, Store, Dumbbell };

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

// Clareia uma cor hex (#rrggbb) para dar um leve degradê ao pino, em vez de cor chapada.
const lightenHex = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * percent / 100));
  return `rgb(${r}, ${g}, ${b})`;
};

// Monta um ícone de mapa (pino redondo colorido + ícone da categoria, igual aos usados
// nos filtros do catálogo) usando L.divIcon, já que CircleMarker não aceita ícone dentro.
const iconCache = new Map();
const buildCategoryIcon = (category, color, selected) => {
  const cacheKey = `${category}-${selected}`;
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey);

  const IconComp = CATEGORY_ICON_COMPONENTS[category] || MapPin;
  const iconSvg = renderToStaticMarkup(<IconComp size={selected ? 17 : 14} color="#ffffff" strokeWidth={2.5} />);
  const size = selected ? 34 : 26;
  const shadowW = Math.round(size * 0.55);

  const icon = L.divIcon({
    html: `
      <div style="position:relative; width:${size}px; height:${size + 8}px;">
        <div style="position:absolute; top:${size - 3}px; left:${(size - shadowW) / 2}px; width:${shadowW}px; height:7px; border-radius:50%; background:rgba(7,11,20,0.32); filter:blur(1.5px);"></div>
        <div style="
          position:absolute; top:0; left:0; width:${size}px; height:${size}px; border-radius:50% 50% 50% 0;
          background: linear-gradient(135deg, ${lightenHex(color, 18)}, ${color}); transform: rotate(-45deg);
          border:${selected ? 3 : 2}px solid ${selected ? '#1e88e5' : '#ffffff'};
          box-shadow:0 3px 6px rgba(7,11,20,0.38);
          display:flex; align-items:center; justify-content:center;
        "><div style="transform: rotate(45deg);">${iconSvg}</div></div>
      </div>`,
    className: 'rotavis-map-icon',
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    tooltipAnchor: [0, -size * 0.8]
  });
  iconCache.set(cacheKey, icon);
  return icon;
};

const InteractiveMap = ({ places, categories }) => {
  const [activeCategories, setActiveCategories] = useState(DEFAULT_ACTIVE_CATEGORIES);
  const [routeStops, setRouteStops] = useState([]);

  const categoryIconName = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[c.id] = c.icon; });
    return map;
  }, [categories]);

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
  const totalDistanceKm = useMemo(() => totalRouteDistanceKm(routeLine), [routeLine]);

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
              <>
                <Polyline
                  positions={routeLine}
                  pathOptions={{ color: '#ffffff', weight: 7, opacity: 0.85, lineCap: 'round' }}
                />
                <Polyline
                  positions={routeLine}
                  pathOptions={{ color: '#1e88e5', weight: 4, opacity: 0.9, dashArray: '1 10', lineCap: 'round' }}
                />
              </>
            )}

            {mappablePlaces.map(place => {
              const coords = getPlaceCoordinates(place);
              const stopIndex = routeStops.findIndex(p => p.id === place.id);
              const inRoute = stopIndex !== -1;
              const iconName = categoryIconName[place.category] || 'MapPin';
              const color = CATEGORY_COLORS[place.category] || '#8a7a63';

              return (
                <Marker key={place.id} position={coords} icon={buildCategoryIcon(iconName, color, inRoute)}>
                  <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={place.image}
                        alt={place.name}
                        style={{ width: '150px', height: '95px', objectFit: 'cover', borderRadius: '8px', display: 'block', marginBottom: '6px' }}
                      />
                      <strong style={{ fontSize: '0.82rem' }}>{place.name}</strong>
                    </div>
                  </Tooltip>
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
                </Marker>
              );
            })}
          </MapContainer>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
          Passe o mouse sobre um marcador para ver a foto do local, ou clique para adicionar à sua rota. As posições são aproximadas, dentro da região de cada local.
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
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--green-dark)', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--card-border)' }}>
              {routeStops.length} {routeStops.length === 1 ? 'parada' : 'paradas'}
              {routeStops.length > 1 && ` · ${formatDistanceKm(totalDistanceKm)} no total`}
            </p>
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
