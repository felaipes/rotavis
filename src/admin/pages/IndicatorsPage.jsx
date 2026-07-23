import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, MapPin, Zap, DollarSign, BarChart3, ArrowRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { getDashboardData } from '../../services/analyticsService';
import { places } from '../../data';
import { AdminBar, AdminArea } from '../components/Charts';

const IndicatorsPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(getDashboardData());
  }, []);

  if (!data) return null;

  // --- Seasonality Index ---
  const seasonalityData = data.seasonalityIndex.map(m => ({
    name: m.name,
    roteiros: m.roteiros,
    variação: m.change
  }));

  // --- Estimated spending breakdown by budget tier ---
  const spendingByTier = Object.entries(data.budgetBreakdown).map(([tier, count]) => {
    const labels = { economico: 'Econômico', conforto: 'Conforto', luxo: 'Luxo' };
    const avgSpend = { economico: 115, conforto: 250, luxo: 575 };
    return {
      name: labels[tier] || tier,
      gasto: avgSpend[tier] || 0,
      turistas: count
    };
  });

  // --- Route Patterns ---
  const routePatterns = data.routePatterns.map(rp => {
    const [a, b] = rp.pair.split('→');
    const placeA = places.find(p => p.id === a);
    const placeB = places.find(p => p.id === b);
    return {
      from: placeA ? placeA.name : a,
      to: placeB ? placeB.name : b,
      count: rp.count
    };
  });

  // --- Neglected Places (bottom 10 or places with 0 appearances) ---
  const allPlaceAppearances = places.map(p => ({
    id: p.id,
    name: p.name,
    zone: p.zone,
    category: p.category,
    count: data.neglectedPlaces[p.id] || 0
  }));
  const hotPlaces = [...allPlaceAppearances].sort((a, b) => b.count - a.count).slice(0, 10);
  const coldPlaces = [...allPlaceAppearances].sort((a, b) => a.count - b.count).slice(0, 10);

  // --- Seasonality peak/valley ---
  const peakMonth = data.monthlyTrend.reduce((best, m) => m.roteiros > (best?.roteiros || 0) ? m : best, null);
  const valleyMonth = data.monthlyTrend.reduce((worst, m) => m.roteiros < (worst?.roteiros || Infinity) ? m : worst, null);

  return (
    <div className="anim-in">
      <div className="page-header">
        <h1>Indicadores Estratégicos</h1>
        <p className="page-subtitle">Dados avançados para planejamento e tomada de decisão da gestão turística.</p>
      </div>

      {/* Seasonality Highlights */}
      <div className="kpi-grid anim-in">
        <div className="kpi-card emerald">
          <div className="kpi-icon emerald"><TrendingUp size={20} /></div>
          <div className="kpi-label">Mês de Pico</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
            {peakMonth ? `${peakMonth.name} (${peakMonth.roteiros})` : '—'}
          </div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon amber"><TrendingDown size={20} /></div>
          <div className="kpi-label">Mês de Vale</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
            {valleyMonth ? `${valleyMonth.name} (${valleyMonth.roteiros})` : '—'}
          </div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><DollarSign size={20} /></div>
          <div className="kpi-label">Receita Estimada Total</div>
          <div className="kpi-value">R${(data.estimatedTotalRevenue / 1000).toFixed(0)}<span className="kpi-unit">mil</span></div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon purple"><BarChart3 size={20} /></div>
          <div className="kpi-label">Ticket Médio Diário</div>
          <div className="kpi-value">R${data.estimatedAvgDailySpend}</div>
        </div>
      </div>

      {/* Seasonality Chart */}
      <div className="charts-grid anim-in" style={{ marginBottom: 20 }}>
        <AdminArea data={seasonalityData} dataKey="roteiros" title="Índice de Sazonalidade (Variação Mensal)" icon={TrendingUp} color="#1f5039" />
      </div>

      {/* Seasonality % Table */}
      <div className="chart-card anim-in" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div className="chart-title" style={{ padding: '22px 22px 0' }}><TrendingUp size={17} /> Variação % Mês-a-Mês</div>
        <div style={{ overflowX: 'auto', padding: '10px 22px 22px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Mês</th>
                <th style={{ textAlign: 'right' }}>Roteiros</th>
                <th style={{ textAlign: 'right' }}>Variação</th>
              </tr>
            </thead>
            <tbody>
              {data.seasonalityIndex.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</td>
                  <td style={{ textAlign: 'right' }}>{m.roteiros}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{
                      color: m.change > 0 ? '#1f5039' : m.change < 0 ? '#e11d48' : 'var(--text-muted)',
                      fontWeight: 600
                    }}>
                      {m.change > 0 ? '+' : ''}{m.change}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spending Breakdown */}
      <div className="charts-grid anim-in">
        <AdminBar data={spendingByTier} dataKey="gasto" title="Gasto Médio/Dia por Perfil (R$)" icon={DollarSign} color="#d2ac34" />
        <AdminBar data={spendingByTier} dataKey="turistas" title="Volume de Turistas por Perfil" icon={BarChart3} color="#3789aa" />
      </div>

      {/* Route Patterns */}
      <div className="chart-card anim-in" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div className="chart-title" style={{ padding: '22px 22px 0' }}><Zap size={17} /> Top 5 Padrões de Deslocamento</div>
        <p style={{ padding: '0 22px', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '8px' }}>
          Combinações de atrativos que mais aparecem juntos nos roteiros gerados.
        </p>
        <div style={{ overflowX: 'auto', padding: '10px 22px 22px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>De</th>
                <th style={{ width: '30px' }}></th>
                <th>Para</th>
                <th style={{ textAlign: 'right' }}>Frequência</th>
              </tr>
            </thead>
            <tbody>
              {routePatterns.map((rp, i) => (
                <tr key={i}>
                  <td><div className={`top-rank ${i < 3 ? `r${i + 1}` : 'r4'}`}>{i + 1}</div></td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{rp.from}</td>
                  <td style={{ textAlign: 'center' }}><ArrowRight size={14} color="var(--text-muted)" /></td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{rp.to}</td>
                  <td style={{ textAlign: 'right' }}><span className="top-count">{rp.count}×</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory: Hot vs Cold Places */}
      <div className="charts-grid anim-in">
        <div className="chart-card">
          <div className="chart-title"><Eye size={17} /> Atrativos Mais Quentes 🔥</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>Pontos turísticos que dominam os roteiros gerados.</p>
          <div className="top-list">
            {hotPlaces.slice(0, 8).map((p, i) => (
              <div key={i} className="top-item">
                <div className={`top-rank ${i < 3 ? `r${i + 1}` : 'r4'}`}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="top-name">{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.zone}</div>
                </div>
                <span className="top-count">{p.count}×</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title"><EyeOff size={17} /> Atrativos Negligenciados ❄️</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>Pontos cadastrados que raramente aparecem — oportunidades de promoção.</p>
          {coldPlaces.filter(p => p.count <= 2).length === 0 ? (
            <div className="chart-empty">Todos os atrativos têm boa visibilidade!</div>
          ) : (
            <div className="top-list">
              {coldPlaces.filter(p => p.count <= 5).slice(0, 8).map((p, i) => (
                <div key={i} className="top-item">
                  <div className="top-rank r4" style={{ background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48' }}>
                    <AlertTriangle size={12} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="top-name">{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.zone}</div>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#e11d48', fontWeight: 600 }}>
                    {p.count === 0 ? 'Nunca' : `${p.count}×`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndicatorsPage;
