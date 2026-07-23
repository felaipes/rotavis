import React, { useState, useEffect } from 'react';
import { Route, Calendar, Users, TrendingUp, Briefcase, Wallet, Car, Heart, MapPin, Map, MapPinned, DollarSign, ThumbsUp, BarChart3 } from 'lucide-react';
import { getDashboardData, seedDemoData } from '../../services/analyticsService';
import { places } from '../../data';
import { AdminPie, AdminBar, AdminArea, AdminTopList } from '../components/Charts';

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const GROUP_LABELS = {
  familia: 'Família', casal: 'Casal', solo: 'Solo',
  amigos: 'Amigos', corporativo: 'Corporativo'
};

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [hasDemoData, setHasDemoData] = useState(false);

  const loadData = () => {
    const dashData = getDashboardData();
    setData(dashData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedDemo = () => {
    seedDemoData();
    loadData();
    setHasDemoData(true);
  };

  if (!data) return null;

  const weekdayData = data.weekdayDistribution.map((count, i) => ({ name: WEEKDAY_SHORT[i], roteiros: count }));
  
  const topPlacesWithNames = data.topPlaces.map(p => {
    const place = places.find(pl => pl.id === p.id);
    return { name: place ? place.name : p.id, count: p.count };
  });

  const prefsData = Object.entries(data.preferenceBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({
      name: key === 'cafe' ? 'Café' :
            key === 'natureza' ? 'Natureza' :
            key === 'historico' ? 'História' :
            key === 'comidinhas' ? 'Gastronomia' :
            key === 'bebidas' ? 'Vida Noturna' :
            key === 'familia' ? 'Família' :
            key === 'religiao' ? 'Religioso' :
            key === 'esporte' ? 'Aventura' :
            key === 'compras' ? 'Compras' : key,
      roteiros: value
    }));

  // Origin data for chart
  const originData = Object.entries(data.originBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, roteiros: value }));

  // Group data for pie
  const groupData = {};
  Object.entries(data.groupBreakdown).forEach(([key, val]) => {
    groupData[GROUP_LABELS[key] || key] = val;
  });

  // NPS calculation
  const npsScore = data.npsCount > 0
    ? Math.round(((data.npsDistribution.promoters - data.npsDistribution.detractors) / data.npsCount) * 100)
    : null;

  return (
    <div className="anim-in">
      <div className="page-header">
        <h1>Visão Geral do Turismo</h1>
        <p className="page-subtitle">Acompanhe os indicadores e o comportamento dos visitantes em tempo real.</p>
      </div>

      {data.totalRoutes === 0 && !hasDemoData && (
        <div className="seed-banner anim-in">
          <p><strong>Nenhum roteiro registrado ainda.</strong> Gere roteiros no aplicativo ou carregue dados de demonstração.</p>
          <button className="seed-btn" onClick={handleSeedDemo}>Carregar Demo</button>
        </div>
      )}

      {/* KPIs - Row 1 */}
      <div className="kpi-grid anim-in">
        <div className="kpi-card emerald">
          <div className="kpi-icon emerald"><Route size={20} /></div>
          <div className="kpi-label">Total de Roteiros</div>
          <div className="kpi-value">{data.totalRoutes}</div>
        </div>
        
        <div className="kpi-card amber">
          <div className="kpi-icon amber"><Calendar size={20} /></div>
          <div className="kpi-label">Estadia Média (ALOS)</div>
          <div className="kpi-value">{data.avgDays}<span className="kpi-unit">dias</span></div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-icon blue"><DollarSign size={20} /></div>
          <div className="kpi-label">Ticket Médio/Dia</div>
          <div className="kpi-value">R${data.estimatedAvgDailySpend}</div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon purple"><ThumbsUp size={20} /></div>
          <div className="kpi-label">NPS do Destino</div>
          <div className="kpi-value">
            {npsScore !== null ? (
              <>{npsScore > 0 ? '+' : ''}{npsScore}</>
            ) : '—'}
          </div>
        </div>
      </div>

      {/* KPIs - Row 2 */}
      <div className="kpi-grid anim-in">
        <div className="kpi-card emerald">
          <div className="kpi-icon emerald"><Users size={20} /></div>
          <div className="kpi-label">Turismo vs Trabalho</div>
          <div className="kpi-value">{data.reasonBreakdown.passeio || 0}<span className="kpi-unit" style={{margin:'0 4px'}}>/</span>{data.reasonBreakdown.trabalho || 0}</div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-icon blue"><MapPin size={20} /></div>
          <div className="kpi-label">Locais Únicos</div>
          <div className="kpi-value">{data.topPlaces.length}</div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-icon amber"><BarChart3 size={20} /></div>
          <div className="kpi-label">Receita Estimada Total</div>
          <div className="kpi-value">R${(data.estimatedTotalRevenue / 1000).toFixed(0)}<span className="kpi-unit">mil</span></div>
        </div>

        <div className="kpi-card emerald">
          <div className="kpi-icon emerald"><MapPinned size={20} /></div>
          <div className="kpi-label">Origem #1</div>
          <div className="kpi-value" style={{ fontSize: '1.5rem' }}>
            {originData.length > 0 ? originData[0].name : '—'}
          </div>
        </div>
      </div>

      {/* Main Trend Chart */}
      <div className="charts-grid anim-in" style={{ marginBottom: 20 }}>
        <AdminArea data={data.monthlyTrend} dataKey="roteiros" title="Tendência Mensal de Roteiros" icon={TrendingUp} color="#1f5039" />
      </div>

      {/* Origin & Group */}
      <div className="charts-grid anim-in">
        <AdminBar data={originData} dataKey="roteiros" title="Origem dos Visitantes (Estado/País)" icon={MapPinned} color="#3789aa" />
        <AdminPie data={groupData} title="Perfil do Grupo de Viagem" icon={Users} />
      </div>

      {/* Pies Row */}
      <div className="charts-grid anim-in">
        <AdminPie data={data.reasonBreakdown} title="Motivo da Viagem" icon={Briefcase} />
        <AdminPie data={data.budgetBreakdown} title="Perfil Financeiro" icon={Wallet} />
      </div>

      {/* Bar & Pie Row */}
      <div className="charts-grid anim-in">
        <AdminPie data={data.transportBreakdown} title="Mobilidade" icon={Car} />
        <AdminBar data={prefsData} dataKey="roteiros" title="Interesses Declarados" icon={Heart} color="#3789aa" />
      </div>

      {/* ALOS Monthly & Weekday */}
      <div className="charts-grid anim-in">
        <AdminArea data={data.alosMonthly} dataKey="dias" title="Estadia Média Mensal (ALOS)" icon={Calendar} color="#d2ac34" />
        <AdminBar data={weekdayData} dataKey="roteiros" title="Chegadas na Semana (Sazonalidade)" icon={Calendar} color="#1f5039" />
      </div>

      {/* Top Places & Zones */}
      <div className="charts-grid anim-in">
        <AdminTopList items={topPlacesWithNames} labelKey="name" valueKey="count" title="Top 10 Atrativos" icon={MapPin} />
        <AdminTopList items={data.topZones} labelKey="zone" valueKey="count" title="Regiões mais Demandadas" icon={Map} />
      </div>
    </div>
  );
};

export default DashboardPage;
