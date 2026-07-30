import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3d9b4f', '#f2b70a', '#1e88e5', '#e91e63', '#9c27b0', '#ff9800'];

const BudgetSummary = ({ totalBudget, totalSpent, chartData, onSetBudget }) => {
  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  return (
    <div className="liquid-glass" style={{ padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--green-dark)' }}>Visão Geral</h2>
        <button 
          onClick={() => {
            const newBudget = prompt('Defina seu orçamento total em R$ (BRL):', totalBudget || '');
            if (newBudget && !isNaN(newBudget)) onSetBudget(parseFloat(newBudget));
          }}
          className="btn-glass"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        >
          {totalBudget > 0 ? 'Alterar Orçamento' : 'Definir Orçamento'}
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 200px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Gasto</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: percentage > 100 ? '#ef4444' : 'var(--text-main)' }}>
            R$ {totalSpent.toFixed(2)}
          </p>
          
          {totalBudget > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                <span>Progresso do Orçamento</span>
                <span>{percentage.toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--card-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`, 
                    height: '100%', 
                    background: percentage > 100 ? '#ef4444' : 'var(--green)',
                    transition: 'width 0.3s ease'
                  }} 
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                De R$ {totalBudget.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {chartData.length > 0 && (
          <div style={{ flex: '1 1 200px', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetSummary;
