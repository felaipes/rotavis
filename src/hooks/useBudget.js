import { useState, useEffect } from 'react';

const RATES_TO_BRL = {
  BRL: 1,
  USD: 5.0,     // 1 USD = 5.00 BRL
  ARS: 0.005,   // 1 ARS = 0.005 BRL (200 ARS = 1 BRL)
  PYG: 0.0007,  // 1 PYG = 0.0007 BRL (~1400 PYG = 1 BRL)
};

export function useBudget() {
  const [expenses, setExpenses] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);

  // Load from local storage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('rotavis_expenses');
    const savedBudget = localStorage.getItem('rotavis_total_budget');
    
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
    if (savedBudget) {
      setTotalBudget(parseFloat(savedBudget));
    }
  }, []);

  // Save to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('rotavis_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('rotavis_total_budget', totalBudget.toString());
  }, [totalBudget]);

  const addExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amountInBRL: expense.amount * RATES_TO_BRL[expense.currency]
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const removeExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const clearAll = () => {
    setExpenses([]);
    setTotalBudget(0);
  };

  const totalSpentBRL = expenses.reduce((acc, curr) => acc + curr.amountInBRL, 0);

  // Group by category for charts
  const expensesByCategory = expenses.reduce((acc, curr) => {
    if (!acc[curr.category]) {
      acc[curr.category] = 0;
    }
    acc[curr.category] += curr.amountInBRL;
    return acc;
  }, {});

  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  return {
    expenses,
    totalBudget,
    setTotalBudget,
    addExpense,
    removeExpense,
    clearAll,
    totalSpentBRL,
    chartData,
    RATES_TO_BRL
  };
}
