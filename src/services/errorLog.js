// Registro de erros do aparelho de quem usa.
//
// O ErrorBoundary só enxerga erro de renderização: o React não entrega para ele o que
// estoura dentro de um handler de clique, nem promessa rejeitada, nem erro de script
// solto. Como o relato que temos é "cliquei e quebrou", justamente a categoria que
// escapava, aqui a captura é global.
//
// Fica em localStorage porque no celular não dá para abrir o console no meio do uso —
// depois é só abrir /diagnostico e copiar.

const CHAVE = 'rotavis_error_log';
const MAX = 10;

export const registrarErro = (tipo, dados) => {
  try {
    const anteriores = lerErros();
    const registro = {
      tipo,
      quando: new Date().toISOString(),
      rota: window.location.pathname + window.location.search,
      tela: `${window.innerWidth}x${window.innerHeight}`,
      navegador: navigator.userAgent,
      ...dados
    };
    // Mais recente primeiro, e um teto para não encher o armazenamento do aparelho.
    localStorage.setItem(CHAVE, JSON.stringify([registro, ...anteriores].slice(0, MAX)));
  } catch {
    // localStorage cheio, bloqueado ou em aba anônima: não é motivo para o registro
    // derrubar a aplicação que ele existe para diagnosticar.
  }
};

export const lerErros = () => {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? JSON.parse(bruto) : [];
  } catch {
    return [];
  }
};

export const limparErros = () => {
  try {
    localStorage.removeItem(CHAVE);
  } catch { /* idem */ }
};

let instalado = false;

export const instalarCapturaGlobal = () => {
  if (instalado) return;
  instalado = true;

  // Erro de script solto, inclusive o que estoura dentro de handler de evento.
  window.addEventListener('error', (e) => {
    // Falha ao carregar imagem/script dispara 'error' sem e.error; não é quebra de
    // execução e encheria o registro de ruído.
    if (!e.error && !e.message) return;
    registrarErro('erro', {
      mensagem: String(e.message || e.error?.message || ''),
      arquivo: String(e.filename || '').split('/').pop() + ':' + e.lineno + ':' + e.colno,
      pilha: String(e.error?.stack || '').slice(0, 1500)
    });
  });

  // Promessa rejeitada sem catch — a categoria que some sem deixar rastro nenhum.
  window.addEventListener('unhandledrejection', (e) => {
    registrarErro('promessa', {
      mensagem: String(e.reason?.message || e.reason || ''),
      pilha: String(e.reason?.stack || '').slice(0, 1500)
    });
  });
};
