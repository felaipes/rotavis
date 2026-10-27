import React, { useState } from 'react';
import Sheet from './Sheet';
import { cssTransition, DUR } from '../motion';

const CATEGORIES = ['Alimentação', 'Transporte', 'Atrações', 'Compras', 'Hospedagem', 'Outros'];
const CURRENCIES = ['BRL', 'USD', 'ARS', 'PYG'];

const AddExpenseModal = ({ isOpen, onClose, onAdd }) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [category, setCategory] = useState('Alimentação');
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;
    
    onAdd({
      amount: parseFloat(amount),
      currency,
      category,
      title
    });
    
    // Reset form
    setAmount('');
    setTitle('');
    onClose();
  };

  return (
    <Sheet open={isOpen} onClose={onClose} title="Novo Gasto">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            aria-label="Moeda"
            className="input-field"
            style={{ width: '88px', padding: '10px', borderRadius: 'var(--r-sm)', background: 'var(--card-highlight)' }}
          >
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input 
            type="number" 
            step="0.01"
            inputMode="decimal" 
            required
            placeholder="0,00"
            aria-label="Valor"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
            style={{ flex: 1, padding: '10px', borderRadius: 'var(--r-sm)', fontSize: '1.2rem', fontWeight: 'bold' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Descrição (opcional)</label>
          <input 
            type="text" 
            placeholder="Ex: Jantar no El Quincho"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-sm)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Categoria</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                style={{
                  padding: '8px 14px', minHeight: '36px', borderRadius: 'var(--r-pill)', fontSize: 'var(--text-footnote)', cursor: 'pointer',
                  border: `1px solid ${category === cat ? 'var(--green)' : 'var(--card-border)'}`,
                  background: category === cat ? 'var(--tint)' : 'var(--secondary-dark)',
                  color: category === cat ? 'var(--on-tint)' : 'var(--text-main)',
                  transition: cssTransition(['background', 'border-color'], DUR.fast)
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-gold" style={{ marginTop: '10px', width: '100%' }}>
          Adicionar Gasto
        </button>
      </form>
    </Sheet>
  );
};

export default AddExpenseModal;
