import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Datas circulam como string "yyyy-mm-dd". Montadas a partir dos componentes locais
// (nunca toISOString, que é UTC e em fuso negativo devolve o dia anterior).
export const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const addDaysISO = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return toISODate(d);
};

// Grade do mês alinhada em semanas completas (domingo a sábado), para o grid de 7 colunas
// nunca ficar com uma linha quebrada.
const buildMonthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: totalCells }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
};

const DateCalendar = ({ value, min, max, rangeStart, onChange }) => {
  const anchor = value || rangeStart || min || toISODate(new Date());
  const anchorDate = new Date(`${anchor}T12:00:00`);
  const [view, setView] = useState({ year: anchorDate.getFullYear(), month: anchorDate.getMonth() });

  const cells = useMemo(() => buildMonthGrid(view.year, view.month), [view]);
  const todayISO = toISODate(new Date());
  const viewMonthISO = `${view.year}-${String(view.month + 1).padStart(2, '0')}`;

  const canGoPrev = !min || viewMonthISO > min.slice(0, 7);
  const canGoNext = !max || viewMonthISO < max.slice(0, 7);

  const shiftMonth = (delta) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const navBtnStyle = (enabled) => ({
    width: '34px', height: '34px', borderRadius: '50%', border: 'none',
    background: 'transparent', color: enabled ? 'var(--green-dark)' : 'var(--card-border)',
    cursor: enabled ? 'pointer' : 'not-allowed',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s ease'
  });

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '18px',
      padding: '18px', width: '100%', maxWidth: '360px', boxShadow: '0 6px 20px rgba(27, 94, 60, 0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => canGoPrev && shiftMonth(-1)}
          disabled={!canGoPrev}
          aria-label="Mês anterior"
          style={navBtnStyle(canGoPrev)}
          onMouseEnter={e => { if (canGoPrev) e.currentTarget.style.background = 'var(--card-highlight)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
          {MONTH_NAMES[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={() => canGoNext && shiftMonth(1)}
          disabled={!canGoNext}
          aria-label="Próximo mês"
          style={navBtnStyle(canGoNext)}
          onMouseEnter={e => { if (canGoNext) e.currentTarget.style.background = 'var(--card-highlight)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '6px' }}>
        {WEEKDAY_INITIALS.map((d, i) => (
          <span key={i} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>
            {d}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map(date => {
          const iso = toISODate(date);
          const outsideMonth = date.getMonth() !== view.month;
          const disabled = (min && iso < min) || (max && iso > max);
          const selected = iso === value;
          const isToday = iso === todayISO;
          const inRange = rangeStart && value && iso > rangeStart && iso < value;
          const isRangeStart = rangeStart && iso === rangeStart;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => !disabled && onChange(iso)}
              disabled={disabled}
              aria-current={selected ? 'date' : undefined}
              style={{
                aspectRatio: '1', border: 'none', borderRadius: '50%', padding: 0,
                fontSize: '0.88rem',
                fontWeight: selected || isToday || isRangeStart ? 700 : 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: selected
                  ? 'var(--green-dark)'
                  : isRangeStart
                    ? 'var(--accent-gold-glow)'
                    : inRange
                      ? 'rgba(61, 155, 79, 0.12)'
                      : 'transparent',
                color: selected
                  ? '#ffffff'
                  : disabled
                    ? 'var(--card-border)'
                    : outsideMonth
                      ? 'var(--text-muted)'
                      : isToday
                        ? 'var(--green-dark)'
                        : 'var(--text-main)',
                opacity: disabled ? 0.6 : outsideMonth ? 0.45 : 1,
                boxShadow: isToday && !selected ? 'inset 0 0 0 1.5px var(--green)' : 'none',
                transition: 'background 0.15s ease, transform 0.15s ease'
              }}
              onMouseEnter={e => { if (!disabled && !selected) e.currentTarget.style.background = 'var(--card-highlight)'; }}
              onMouseLeave={e => {
                if (!selected) {
                  e.currentTarget.style.background = isRangeStart
                    ? 'var(--accent-gold-glow)'
                    : inRange ? 'rgba(61, 155, 79, 0.12)' : 'transparent';
                }
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateCalendar;
