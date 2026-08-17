import { useEffect } from 'react';

// Guarda o roteiro gerado e as respostas do questionário enquanto a aba está aberta.
//
// Sem isto, sair da tela de rota — para Conquistas, para o Mapa, para qualquer lugar —
// desmonta o RouteGenerator e leva junto todo o estado: o roteiro pronto some e o
// questionário volta ao passo 1. Quem tinha acabado de responder oito perguntas
// encontra tudo em branco ao voltar, que é a mesma sensação de ter quebrado.
//
// sessionStorage, e não localStorage, de propósito: o roteiro é de uma sessão de
// planejamento. Fechou a aba, começa de novo — para guardar de verdade existe o botão
// que manda para "Meus Roteiros".
const CHAVE = 'rotavis_route_session';

export const lerSessao = () => {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
};

export const limparSessao = () => {
  try {
    sessionStorage.removeItem(CHAVE);
  } catch { /* aba anônima ou armazenamento bloqueado */ }
};

/**
 * Grava o estado a cada mudança. `dados` deve conter só o que é serializável —
 * nada de ref, função ou elemento do DOM.
 */
export const useRouteSession = (dados, ativo = true) => {
  // Serializa fora do efeito e usa a string como dependência. Passar o objeto direto
  // faria o efeito rodar a cada render, porque o literal é novo toda vez — e cada
  // execução grava um roteiro inteiro em sessionStorage à toa.
  let serializado = null;
  try {
    serializado = JSON.stringify(dados);
  } catch {
    serializado = null; // ciclo ou valor não serializável: melhor não gravar nada
  }

  useEffect(() => {
    if (!ativo || !serializado) return;
    try {
      sessionStorage.setItem(CHAVE, serializado);
    } catch {
      // Cota estourada: o roteiro pode ser grande. Perder a sessão é bem melhor do
      // que estourar uma exceção no meio da navegação.
    }
  }, [serializado, ativo]);
};
