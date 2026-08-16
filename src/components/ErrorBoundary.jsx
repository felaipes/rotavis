import React from 'react';
import { registrarErro } from '../services/errorLog';

// Sem isto, qualquer erro de renderização derruba a árvore inteira e sobra uma tela
// branca, sem nenhuma pista do que aconteceu — que foi exatamente o relato no celular.
// Aqui o erro vira uma tela legível, com a mensagem à mostra para poder ser repassada.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // Fica no console do aparelho, para quem estiver depurando pelo navegador.
    console.error('[RotaVis] erro de renderização:', error, info?.componentStack);
    // Vai para o mesmo registro da captura global, para /diagnostico mostrar erro de
    // renderização e erro de handler lado a lado, na ordem em que aconteceram.
    registrarErro('renderizacao', {
      mensagem: String(error?.message || error),
      pilha: String(error?.stack || '').slice(0, 1500),
      componente: String(info?.componentStack || '').slice(0, 1500)
    });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="container" style={{ padding: '60px 20px', minHeight: '70vh', maxWidth: '640px' }}>
        <div className="liquid-glass" style={{ padding: '28px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>
            Algo quebrou nesta tela
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.6 }}>
            O RotaVis não conseguiu montar esta parte. Recarregar costuma resolver; se
            acontecer de novo, a mensagem abaixo diz o que falhou.
          </p>

          <pre style={{
            background: 'var(--card-highlight)', border: '1px solid var(--card-border)',
            borderRadius: '10px', padding: '14px', fontSize: '0.78rem', lineHeight: 1.5,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '220px', overflow: 'auto',
            color: 'var(--text-main)', marginBottom: '18px'
          }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => window.location.reload()} className="btn-gold" style={{ padding: '12px 26px' }}>
              Recarregar
            </button>
            <button onClick={() => { window.location.href = '/'; }} className="btn-glass" style={{ padding: '12px 26px' }}>
              Voltar ao início
            </button>
            <button onClick={() => { window.location.href = '/diagnostico'; }} className="btn-glass" style={{ padding: '12px 26px' }}>
              Ver detalhes
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
