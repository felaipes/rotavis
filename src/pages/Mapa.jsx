import React from 'react';
import { MapPinned } from 'lucide-react';
import { categories, places } from '../data';
import InteractiveMap from '../components/InteractiveMap';

const Mapa = () => {
  return (
    <div className="container" style={{ padding: '50px 20px 80px' }}>
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 30px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
          <MapPinned size={16} />
          Mapa interativo
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 800, marginBottom: '14px' }} className="text-gradient">
          Regiões turísticas e restaurantes
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Explore os pontos turísticos e restaurantes de Foz do Iguaçu no mapa. Clique nos marcadores para ver detalhes e monte o desenho da sua rota adicionando paradas na ordem que quiser.
        </p>
      </div>

      <InteractiveMap places={places} categories={categories} />
    </div>
  );
};

export default Mapa;
