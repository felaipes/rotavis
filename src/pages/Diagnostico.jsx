import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, Trash2 } from 'lucide-react';
import { lerErros, limparErros } from '../services/errorLog';

// Tela para ler no próprio aparelho o que quebrou, sem precisar de console. Existe
// porque a falha relatada aparece no celular de quem usa, e não no ambiente de quem
// desenvolve — sem isto, o que sobra é "às vezes quebra", que não dá para investigar.
const Diagnostico = () => {
  const [erros, setErros] = useState(lerErros);
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    const texto = JSON.stringify(erros, null, 2);
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // clipboard exige contexto seguro e permissão; a seleção manual é o plano B.
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="container" style={{ padding: '50px 20px 80px', maxWidth: '720px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <AlertTriangle size={26} color="var(--green)" />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }} className="text-gradient">Diagnóstico</h1>
      </div>

      <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '22px' }}>
        Os últimos erros que aconteceram <strong>neste aparelho</strong>. Ficam guardados
        aqui mesmo, não são enviados para lugar nenhum. Se o app quebrar, abra esta tela,
        toque em copiar e mande o texto para quem for corrigir.
      </p>

      {erros.length === 0 ? (
        <div className="liquid-glass" style={{ padding: '28px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            Nenhum erro registrado neste aparelho.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <button onClick={copiar} className="btn-gold" style={{ padding: '11px 22px', gap: '8px' }}>
              {copiado ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar tudo</>}
            </button>
            <button
              onClick={() => { limparErros(); setErros([]); }}
              className="btn-glass"
              style={{ padding: '11px 22px', gap: '8px' }}
            >
              <Trash2 size={16} /> Limpar
            </button>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {erros.map((e, i) => (
              <div key={i} className="liquid-glass" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--green-dark)', fontSize: '0.9rem' }}>{e.tipo}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {new Date(e.quando).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p style={{ fontSize: '0.92rem', marginBottom: '8px', wordBreak: 'break-word' }}>{e.mensagem}</p>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <div>rota: {e.rota}</div>
                  {e.arquivo && <div>arquivo: {e.arquivo}</div>}
                  <div>tela: {e.tela}</div>
                </div>
                {(e.pilha || e.componente) && (
                  <details style={{ marginTop: '10px' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--green)' }}>
                      detalhes técnicos
                    </summary>
                    <pre style={{
                      background: 'var(--card-highlight)', border: '1px solid var(--card-border)',
                      borderRadius: '8px', padding: '10px', fontSize: '0.7rem', lineHeight: 1.45,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '200px',
                      overflow: 'auto', marginTop: '8px'
                    }}>
                      {(e.pilha || '') + (e.componente ? '\n\n' + e.componente : '')}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Diagnostico;
