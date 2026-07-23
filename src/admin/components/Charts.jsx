import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts';

const COLORS = ['#1f5039', '#3789aa', '#d2ac34', '#1f5039', '#3789aa', '#d2ac34', '#1f5039', '#3789aa'];

const LABELS = {
  passeio: 'Passeio', trabalho: 'Trabalho',
  economico: 'Econômico', conforto: 'Conforto', luxo: 'Luxo',
  carro: 'Carro Próprio', ape: 'A pé / App',
  cafe: 'Café', natureza: 'Natureza', historico: 'História',
  comidinhas: 'Gastronomia', bebidas: 'Vida Noturna',
  familia: 'Família', religiao: 'Religioso',
  esporte: 'Aventura', compras: 'Compras'
};

const label = (k) => LABELS[k] || k;

const ChartTooltip = ({ active, payload, lab }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)',
      borderRadius: 12, padding: '10px 16px', backdropFilter: 'blur(10px)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <p style={{ color: 'var(--tooltip-text)', fontSize: '0.75rem', marginBottom: 2 }}>{lab || payload[0]?.name}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color || 'var(--tooltip-value)', fontWeight: 700, fontSize: '1rem' }}>
          {e.value}
        </p>
      ))}
    </div>
  );
};

// ---- Pie ----
export const AdminPie = ({ data, title, icon: Icon }) => {
  const items = Object.entries(data || {}).map(([k, v]) => ({ name: label(k), value: v }));
  return (
    <div className="chart-card">
      <div className="chart-title">{Icon && <Icon size={17} />}{title}</div>
      {items.length === 0 ? <div className="chart-empty">Sem dados</div> : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={items} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
              {items.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
              formatter={v => <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

// ---- Bar ----
export const AdminBar = ({ data, dataKey, title, icon: Icon, color }) => (
  <div className="chart-card">
    <div className="chart-title">{Icon && <Icon size={17} />}{title}</div>
    {!data?.length ? <div className="chart-empty">Sem dados</div> : (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(71,85,105,0.3)' }} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Bar dataKey={dataKey} fill={color || '#1f5039'} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
);

// ---- Area ----
export const AdminArea = ({ data, dataKey, title, icon: Icon, color }) => {
  const c = color || '#1f5039';
  return (
    <div className="chart-card wide">
      <div className="chart-title">{Icon && <Icon size={17} />}{title}</div>
      {!data?.length ? <div className="chart-empty">Sem dados</div> : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                <stop offset="95%" stopColor={c} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(71,85,105,0.3)' }} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: c, strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey={dataKey} stroke={c} strokeWidth={2.5} fill="url(#aGrad)"
              dot={{ fill: c, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 6, fill: c, stroke: '#0c1220', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

// ---- Top List ----
export const AdminTopList = ({ items, labelKey, valueKey, title, icon: Icon }) => {
  if (!items?.length) return (
    <div className="chart-card"><div className="chart-title">{Icon && <Icon size={17} />}{title}</div><div className="chart-empty">Sem dados</div></div>
  );
  const max = Math.max(...items.map(i => i[valueKey]));
  return (
    <div className="chart-card">
      <div className="chart-title">{Icon && <Icon size={17} />}{title}</div>
      <div className="top-list">
        {items.map((item, i) => (
          <div key={i} className="top-item">
            <div className={`top-rank ${i < 3 ? `r${i + 1}` : 'r4'}`}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div className="top-name">{item[labelKey]}</div>
              <div className="top-bar-track" style={{ marginTop: 5 }}>
                <div className="top-bar-fill" style={{ width: `${(item[valueKey] / max) * 100}%` }} />
              </div>
            </div>
            <div className="top-count">{item[valueKey]}×</div>
          </div>
        ))}
      </div>
    </div>
  );
};
