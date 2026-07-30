import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="liquid-glass"
            style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '25px' }}
          >
            <button 
              onClick={onClose}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ marginBottom: '20px', color: 'var(--green-dark)' }}>Novo Gasto</h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input-field"
                  style={{ width: '80px', padding: '10px', borderRadius: '8px', background: 'var(--card-highlight)' }}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}
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
                  style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
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
                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer',
                        border: `1px solid ${category === cat ? 'var(--green)' : 'var(--card-border)'}`,
                        background: category === cat ? 'var(--green-dark)' : 'var(--secondary-dark)',
                        color: category === cat ? '#fff' : 'var(--text-main)',
                        transition: 'all 0.2s'
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddExpenseModal;
