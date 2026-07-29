import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Route } from 'lucide-react';
import { getPlaceCoordinates, totalRouteDistanceKm, formatDistanceKm } from '../data/zoneCoordinates';

// Uma cor por dia (até 5 dias, que é o máximo do assistente), para o trajeto de cada
// dia ficar visualmente distinto no mapa e na capa do PDF.
export const DAY_COLORS = ['#1e88e5', '#3d9b4f', '#f2b70a', '#8b5cf6', '#ef4444'];

// Clareia uma cor hex (#rrggbb) para dar um leve degradê ao pino, em vez de cor chapada.
const lightenHex = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * percent / 100));
  return `rgb(${r}, ${g}, ${b})`;
};

const numberedIconCache = new Map();
const buildStopIcon = (color, number) => {
  const cacheKey = `${color}-${number}`;
  if (numberedIconCache.has(cacheKey)) return numberedIconCache.get(cacheKey);
  const icon = L.divIcon({
    html: `
      <div style="position:relative; width:30px; height:40px;">
        <div style="position:absolute; bottom:1px; left:5px; width:20px; height:7px; border-radius:50%; background:rgba(7,11,20,0.3); filter:blur(1.5px);"></div>
        <div style="
          position:absolute; top:0; left:3px; width:24px; height:24px; border-radius:50% 50% 50% 0; transform: rotate(-45deg);
          background: linear-gradient(135deg, ${lightenHex(color, 18)}, ${color});
          border:2.5px solid #ffffff; box-shadow: 0 3px 6px rgba(7,11,20,0.4);
          display:flex; align-items:center; justify-content:center;
        "><span style="transform: rotate(45deg); color:#fff; font-size:11px; font-weight:800; text-shadow:0 1px 1px rgba(0,0,0,0.25);">${number}</span></div>
      </div>`,
    className: 'rotavis-map-icon',
    iconSize: [30, 40],
    iconAnchor: [15, 38],
    tooltipAnchor: [0, -34]
  });
  numberedIconCache.set(cacheKey, icon);
  return icon;
};

// Ajusta o zoom/centro do mapa para enquadrar todas as paradas assim que elas mudam.
const FitToStops = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30], maxZoom: 14 });
    }
  }, [map, positions]);
  return null;
};

const RouteMapView = ({ route, mapRef }) => {
  const dayLines = useMemo(() => {
    return route.map((dayPlan, idx) => {
      const stops = [...dayPlan.manha, ...dayPlan.tarde, ...dayPlan.noite].filter(Boolean);
      const stopCoords = stops.map(place => ({ place, coords: getPlaceCoordinates(place) }));
      return {
        day: dayPlan.day,
        color: DAY_COLORS[idx % DAY_COLORS.length],
        stops: stopCoords,
        distanceKm: totalRouteDistanceKm(stopCoords.map(s => s.coords))
      };
    });
  }, [route]);

  const allPositions = useMemo(
    () => dayLines.flatMap(d => d.stops.map(s => s.coords)),
    [dayLines]
  );

  const totalKm = useMemo(() => dayLines.reduce((sum, d) => sum + d.distanceKm, 0), [dayLines]);

  if (allPositions.length === 0) return null;

  return (
    <div ref={mapRef}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px 18px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
          {dayLines.map(d => (
            <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ width: '18px', height: '4px', borderRadius: '2px', background: d.color, display: 'inline-block' }} />
              Dia {d.day} · {formatDistanceKm(d.distanceKm)}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--green-dark)' }}>
          <Route size={15} />
          {formatDistanceKm(totalKm)} no total
        </div>
      </div>
      <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
        <MapContainer center={allPositions[0]} zoom={12} style={{ height: '420px', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToStops positions={allPositions} />

          {/* Contorno branco atrás de cada linha, para o traçado se destacar do mapa (como em apps de navegação) */}
          {dayLines.map(d => (
            <Polyline
              key={`${d.day}-casing`}
              positions={d.stops.map(s => s.coords)}
              pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
            />
          ))}
          {dayLines.map(d => (
            <Polyline
              key={d.day}
              positions={d.stops.map(s => s.coords)}
              pathOptions={{ color: d.color, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round', dashArray: '1, 12' }}
            />
          ))}

          {dayLines.map(d => d.stops.map((s, i) => (
            <Marker key={`${d.day}-${s.place.id}`} position={s.coords} icon={buildStopIcon(d.color, i + 1)}>
              <Tooltip direction="top" offset={[0, -34]}>Dia {d.day} · {s.place.name}</Tooltip>
            </Marker>
          )))}
        </MapContainer>
      </div>
    </div>
  );
};

// Mini mapa somente do trajeto de um único dia, para encaixar no final do card de cada dia.
// Sem controles de zoom/arraste: é um resumo visual, não uma ferramenta interativa (evita
// "prender" o scroll da página quando o usuário passa o dedo/mouse por cima dele).
export const DayRouteMap = ({ stops, color }) => {
  const stopCoords = useMemo(
    () => stops.map(place => ({ place, coords: getPlaceCoordinates(place) })),
    [stops]
  );
  const positions = useMemo(() => stopCoords.map(s => s.coords), [stopCoords]);

  if (positions.length === 0) return null;

  return (
    <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
      <MapContainer
        center={positions[0]}
        zoom={13}
        style={{ height: '220px', width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitToStops positions={positions} />

        {positions.length > 1 && (
          <Polyline positions={positions} pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }} />
        )}
        {positions.length > 1 && (
          <Polyline positions={positions} pathOptions={{ color, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round', dashArray: '1, 12' }} />
        )}

        {stopCoords.map((s, i) => (
          <Marker key={s.place.id} position={s.coords} icon={buildStopIcon(color, i + 1)} />
        ))}
      </MapContainer>
    </div>
  );
};

export default RouteMapView;
