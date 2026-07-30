import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useBudget } from '../hooks/useBudget';
import BudgetSummary from '../components/BudgetSummary';
import ExpenseList from '../components/ExpenseList';
import AddExpenseModal from '../components/AddExpenseModal';

const Financas = () => {
  const { 
    expenses, 
    totalBudget, 
    setTotalBudget, 
    addExpense, 
    removeExpense,
    totalSpentBRL,
    chartData
  } = useBudget();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Minha Carteira</h1>
          <p style={{ color: 'var(--text-muted)' }}>Controle seus gastos na tríplice fronteira.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-gold">
          <Plus size={18} />
          <span style={{ display: 'none' }} className="mobile-hide">Novo Gasto</span>
        </button>
      </div>

      <BudgetSummary 
        totalBudget={totalBudget} 
        totalSpent={totalSpentBRL} 
        chartData={chartData} 
        onSetBudget={setTotalBudget} 
      />

      <h2 style={{ fontSize: '1.2rem', color: 'var(--green-dark)', marginBottom: '15px' }}>Histórico</h2>
      <ExpenseList expenses={expenses} onRemove={removeExpense} />

      <AddExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={addExpense} 
      />
      
      {/* Small internal style to handle responsive button text */}
      <style>{`
        @media (min-width: 600px) {
          .mobile-hide { display: inline !important; }
        }
      `}</style>
    </div>
  );
};

export default Financas;
