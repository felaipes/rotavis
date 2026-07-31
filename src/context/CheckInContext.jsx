import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { places } from '../data';
import { evaluateAchievements } from '../data/achievements';

// Histórico de visitas do usuário. Guardado em localStorage (como a carteira de gastos),
// para funcionar mesmo sem login. Cada visita é uma entrada própria, então voltar no mesmo
// lugar soma de novo — é isso que alimenta as conquistas de visita repetida.
const STORAGE_KEY = 'rotavis_checkins';

const CheckInContext = createContext(null);

export const CheckInProvider = ({ children }) => {
  const [checkIns, setCheckIns] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));
  }, [checkIns]);

  const addCheckIn = useCallback((placeId) => {
    setCheckIns(prev => [{ placeId, date: new Date().toISOString() }, ...prev]);
  }, []);

  // Desfaz a visita mais recente daquele lugar (não apaga o histórico inteiro dele).
  const undoCheckIn = useCallback((placeId) => {
    setCheckIns(prev => {
      const idx = prev.findIndex(c => c.placeId === placeId);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  }, []);

  const resetCheckIns = useCallback(() => setCheckIns([]), []);

  const stats = useMemo(() => {
    const countByPlace = {};
    checkIns.forEach(c => { countByPlace[c.placeId] = (countByPlace[c.placeId] || 0) + 1; });

    const uniqueIds = Object.keys(countByPlace);
    const categories = new Set();
    uniqueIds.forEach(id => {
      const p = places.find(pl => pl.id === id);
      if (p) categories.add(p.category);
    });

    const repeats = Object.values(countByPlace);
    const totalCategories = new Set(places.map(p => p.category)).size;

    return {
      total: checkIns.length,
      countByPlace,
      uniqueCount: uniqueIds.length,
      totalPlaces: places.length,
      percent: places.length ? (uniqueIds.length / places.length) * 100 : 0,
      maxRepeat: repeats.length ? Math.max(...repeats) : 0,
      placesRevisited: repeats.filter(n => n >= 2).length,
      categoryCount: categories.size,
      totalCategories
    };
  }, [checkIns]);

  const achievements = useMemo(() => evaluateAchievements(stats), [stats]);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Avisa quando um troféu novo é destravado. O primeiro cálculo (ao abrir o site) só
  // registra o que já estava destravado, para não disparar aviso de conquista antiga.
  const [recentUnlock, setRecentUnlock] = useState(null);
  const knownUnlocked = useRef(null);

  useEffect(() => {
    const nowUnlocked = achievements.filter(a => a.unlocked).map(a => a.id);
    if (knownUnlocked.current === null) {
      knownUnlocked.current = new Set(nowUnlocked);
      return;
    }
    const fresh = nowUnlocked.filter(id => !knownUnlocked.current.has(id));
    knownUnlocked.current = new Set(nowUnlocked);
    if (fresh.length > 0) {
      setRecentUnlock(achievements.find(a => a.id === fresh[fresh.length - 1]));
    }
  }, [achievements]);

  const dismissUnlock = useCallback(() => setRecentUnlock(null), []);

  return (
    <CheckInContext.Provider value={{
      checkIns, addCheckIn, undoCheckIn, resetCheckIns,
      stats, achievements, unlockedCount, recentUnlock, dismissUnlock
    }}>
      {children}
    </CheckInContext.Provider>
  );
};

export const useCheckIns = () => {
  const ctx = useContext(CheckInContext);
  if (!ctx) throw new Error('useCheckIns precisa estar dentro de <CheckInProvider>.');
  return ctx;
};
