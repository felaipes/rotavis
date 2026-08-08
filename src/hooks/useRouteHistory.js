import { useState, useEffect, useCallback } from 'react';

// Historico dos roteiros gerados. Guardado no navegador (localStorage), como a carteira
// de gastos e as conquistas, para funcionar sem login.
//
// E diferente das "rotas salvas" do perfil: la so entra o que a pessoa salva de
// proposito (e que gera o PDF), e so se estiver logada. Aqui entra todo roteiro gerado,
// automaticamente — que era justamente o que se perdia ao sair da tela.
const STORAGE_KEY = 'rotavis_route_history';
// Teto para o historico nao crescer sem limite no navegador.
const MAX_ENTRIES = 20;

const read = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch {
    // Cota cheia: o historico e conveniencia, nao vale quebrar a geracao da rota por isso.
  }
};

export function useRouteHistory() {
  const [routes, setRoutes] = useState(read);

  // Outra aba mexeu no historico: mantem as duas em dia.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setRoutes(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Insere ou atualiza pelo id. Atualizar importa porque a pessoa pode trocar entre o
  // roteiro A e o B depois de gerado — e a mesma geracao, nao uma nova.
  const saveRoute = useCallback((entry) => {
    setRoutes(prev => {
      const semEste = prev.filter(r => r.id !== entry.id);
      const next = [entry, ...semEste].slice(0, MAX_ENTRIES);
      write(next);
      return next;
    });
  }, []);

  const removeRoute = useCallback((id) => {
    setRoutes(prev => {
      const next = prev.filter(r => r.id !== id);
      write(next);
      return next;
    });
  }, []);

  const clearRoutes = useCallback(() => {
    write([]);
    setRoutes([]);
  }, []);

  return { routes, saveRoute, removeRoute, clearRoutes };
}
