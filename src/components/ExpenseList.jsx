import React from 'react';
import { Coffee, Car, Map, ShoppingBag, Home as HomeIcon, MoreHorizontal, Trash2 } from 'lucide-react';

const CATEGORY_ICONS = {
  Alimentação: <Coffee size={20} color="#e91e63" />,
  Transporte: <Car size={20} color="#1e88e5" />,
  Atrações: <Map size={20} color="#3d9b4f" />,
  Compras: <ShoppingBag size={20} color="#9c27b0" />,
  Hospedagem: <HomeIcon size={20} color="#f2b70a" />,
  Outros: <MoreHorizontal size={20} color="#ff9800" />
};

const ExpenseList = ({ expenses, onRemove }) => {
  if (expenses.length === 0) {
    return (
      <div className="liquid-glass" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Nenhum gasto registrado ainda.</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '5px' }}>
          Adicione seu primeiro gasto para começar o acompanhamento.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {expenses.map((expense) => (
        <div key={expense.id} className="liquid-glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              background: 'var(--card-highlight)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center' 
            }}>
              {CATEGORY_ICONS[expense.category] || CATEGORY_ICONS['Outros']}
            </div>
            <div>
              <p style={{ fontWeight: 600 }}>{expense.title || expense.category}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {new Date(expense.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {expense.category}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>
                {expense.currency} {parseFloat(expense.amount).toFixed(2)}
              </p>
              {expense.currency !== 'BRL' && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ≈ R$ {expense.amountInBRL.toFixed(2)}
                </p>
              )}
            </div>
            <button 
              onClick={() => onRemove(expense.id)}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
              title="Remover"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;
