import React, { useState, useMemo } from 'react';
import { Search, Check, X } from 'lucide-react';

// Estados agrupados por região. Uma lista alfabética de 27 itens num <select> obriga a
// pessoa a rolar procurando o próprio estado; por região a busca vira "acho o meu canto
// do país primeiro", que é como as pessoas pensam em geografia.
export const REGIONS = [
  { id: 'sul', label: 'Sul', states: ['Paraná', 'Santa Catarina', 'Rio Grande do Sul'] },
  { id: 'sudeste', label: 'Sudeste', states: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Espírito Santo'] },
  { id: 'centro-oeste', label: 'Centro-Oeste', states: ['Distrito Federal', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul'] },
  { id: 'nordeste', label: 'Nordeste', states: ['Bahia', 'Pernambuco', 'Ceará', 'Maranhão', 'Paraíba', 'Rio Grande do Norte', 'Alagoas', 'Piauí', 'Sergipe'] },
  { id: 'norte', label: 'Norte', states: ['Amazonas', 'Pará', 'Tocantins', 'Rondônia', 'Acre', 'Amapá', 'Roraima'] }
];

// De onde vem a maior parte de quem visita Foz — ficam no topo como atalho, para o caso
// mais comum ser resolvido num toque só.
const COMMON_STATES = ['Paraná', 'São Paulo', 'Santa Catarina', 'Rio Grande do Sul', 'Minas Gerais', 'Rio de Janeiro'];

// Comparação sem acento e sem caixa, para "sao paulo" e "ceara" acharem o estado certo.
const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const StateChip = ({ name, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(name)}
    aria-pressed={selected}
    className={`btn-glass wizard-option ${selected ? 'active' : ''}`}
    style={{
      padding: '8px 14px', borderRadius: '30px', fontSize: '0.88rem', fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      borderColor: selected ? 'var(--green)' : undefined
    }}
  >
    {selected && <Check size={14} />}
    {name}
  </button>
);

const StateSelect = ({ value, onSelect }) => {
  const [query, setQuery] = useState('');
  const q = normalize(query.trim());

  const filteredRegions = useMemo(() => {
    if (!q) return REGIONS;
    return REGIONS
      .map(r => ({ ...r, states: r.states.filter(s => normalize(s).includes(q)) }))
      .filter(r => r.states.length > 0);
  }, [q]);

  const totalFound = filteredRegions.reduce((n, r) => n + r.states.length, 0);

  return (
    <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Atalho para os estados de onde vem a maioria dos visitantes */}
      {!q && (
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Mais comuns
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {COMMON_STATES.map(name => (
              <StateChip key={name} name={name} selected={value === name} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      <div
        className="search-field-wrapper"
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--card-bg)',
          border: '1px solid var(--card-border)', borderRadius: '12px', padding: '11px 14px'
        }}
      >
        <Search size={17} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar seu estado..."
          aria-label="Buscar estado"
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.95rem', color: 'var(--text-main)' }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpar busca"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '320px', overflowY: 'auto' }}>
        {totalFound === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
            Nenhum estado encontrado para "{query}".
          </p>
        )}
        {filteredRegions.map(region => (
          <div key={region.id}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {region.label}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {region.states.map(name => (
                <StateChip key={name} name={name} selected={value === name} onSelect={onSelect} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StateSelect;
