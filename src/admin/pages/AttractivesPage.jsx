import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, Eye } from 'lucide-react';
import { getDashboardData } from '../../services/analyticsService';
import { places, categories as allCategories } from '../../data';
import { AdminBar, AdminTopList } from '../components/Charts';

const AttractivesPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(getDashboardData());
  }, []);

  if (!data) return null;

  const categoryBreakdown = {};
  data.topPlaces.forEach(tp => {
    const place = places.find(p => p.id === tp.id);
    if (place) {
      const catObj = allCategories.find(c => c.id === place.category);
      const catName = catObj ? catObj.name : place.category;
      categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + tp.count;
    }
  });
  const categoryData = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, roteiros: value }));

  const topPlacesDetailed = data.topPlaces.map(tp => {
    const place = places.find(p => p.id === tp.id);
    return {
      name: place ? place.name : tp.id,
      zone: place?.zone || '—',
      category: place?.category || '—',
      priceRange: place?.priceRange || '—',
      count: tp.count
    };
  });

  const priceBreakdown = {};
  data.topPlaces.forEach(tp => {
    const place = places.find(p => p.id === tp.id);
    if (place) {
      const pr = place.priceRange || '—';
      priceBreakdown[pr] = (priceBreakdown[pr] || 0) + tp.count;
    }
  });
  const priceData = Object.entries(priceBreakdown)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, value]) => ({ name, roteiros: value }));

  return (
    <div className="anim-in">
      <div className="page-header">
        <h1>Análise de Atrativos</h1>
        <p className="page-subtitle">Detalhes sobre os pontos turísticos e regiões mais buscadas da cidade.</p>
      </div>

      <div className="kpi-grid anim-in">
        <div className="kpi-card emerald">
          <div className="kpi-icon emerald"><MapPin size={20} /></div>
          <div className="kpi-label">Atrativos Cadastrados</div>
          <div className="kpi-value">{places.length}</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Eye size={20} /></div>
          <div className="kpi-label">Categorias Ativas</div>
          <div className="kpi-value">{allCategories.length}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon amber"><TrendingUp size={20} /></div>
          <div className="kpi-label">Zonas Populares</div>
          <div className="kpi-value">{data.topZones.length}</div>
        </div>
      </div>

      <div className="charts-grid anim-in">
        <AdminBar data={categoryData} dataKey="roteiros" title="Volume por Categoria" icon={TrendingUp} color="var(--amber)" />
        <AdminBar data={priceData} dataKey="roteiros" title="Demanda por Faixa de Preço" icon={TrendingUp} color="var(--blue)" />
      </div>

      <div className="chart-card anim-in" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div className="chart-title" style={{ padding: '22px 22px 0' }}><MapPin size={17} /> Ranking Completo de Atrativos</div>
        <div style={{ overflowX: 'auto', padding: '10px 22px 22px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Atrativo</th>
                <th>Zona</th>
                <th>Preço</th>
                <th style={{ textAlign: 'right' }}>Aparições</th>
              </tr>
            </thead>
            <tbody>
              {topPlacesDetailed.map((place, i) => (
                <tr key={i}>
                  <td>
                    <div className={`top-rank ${i < 3 ? `r${i + 1}` : 'r4'}`}>{i + 1}</div>
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{place.name}</td>
                  <td>{place.zone}</td>
                  <td style={{ color: 'var(--amber)', fontWeight: 500 }}>{place.priceRange}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="top-count">{place.count}×</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="charts-grid anim-in">
        <AdminTopList items={data.topZones} labelKey="zone" valueKey="count" title="Ranking de Regiões" icon={MapPin} />
      </div>
    </div>
  );
};

export default AttractivesPage;
