import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { T, SPRING } from '../motion';
import { useMediaQuery } from '../hooks/useMediaQuery';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Projeção de momento da Apple (Designing Fluid Interfaces, WWDC 2018): para onde a
// folha iria parar se continuasse com a velocidade do dedo. Decidir o fechamento por
// esse ponto, e não por onde o dedo soltou, faz um "peteleco" curto fechar a folha.
const project = (velocity, decelerationRate = 0.99) =>
  (velocity / 1000) * decelerationRate / (1 - decelerationRate);

// Folha modal. No celular sobe do rodapé e fecha arrastando para baixo pelo topo (a
// alça e o título); no desktop vira um diálogo centralizado. Em ambos: Esc fecha, o
// foco fica preso dentro enquanto aberta e volta para quem abriu ao fechar, e a página
// de trás não rola.
const Sheet = ({ open, onClose, title, children, hideClose = false, dismissible = true }) => {
  const isPhone = useMediaQuery('(max-width: 768px)');
  const panelRef = useRef(null);
  const dragControls = useDragControls();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Foco no próprio painel, e não no primeiro botão: o leitor de tela anuncia o
    // diálogo pelo título, e quem usa o toque não vê um anel de foco aparecer sozinho
    // no botão de fechar. O Tab seguinte já entra nos controles.
    const raf = requestAnimationFrame(() => {
      panelRef.current?.focus({ preventScroll: true });
    });

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (document.activeElement === panelRef.current) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, dismissible]);

  const handleDragEnd = (_, info) => {
    const height = panelRef.current?.offsetHeight || 400;
    const projected = info.offset.y + project(info.velocity.y);
    if (projected > height * 0.4) onClose();
  };

  // Mesmo caminho na entrada e na saída: a folha sobe do rodapé e desce para ele; o
  // diálogo surge e some no mesmo ponto.
  const panelMotion = isPhone
    ? { initial: { y: '100%' }, animate: { y: 0, transition: SPRING.sheet }, exit: { y: '100%', transition: T.base } }
    : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1, transition: T.base }, exit: { opacity: 0, scale: 0.97, transition: T.exit } };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="sheet-root">
          <motion.div
            className="sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: T.base }}
            exit={{ opacity: 0, transition: T.base }}
            onClick={dismissible ? onClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            className="sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            {...panelMotion}
            drag={isPhone && dismissible ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.9 }}
            dragTransition={{ bounceStiffness: 500, bounceDamping: 40 }}
            onDragEnd={handleDragEnd}
          >
            <div
              className="sheet-header-zone"
              onPointerDown={(e) => { if (isPhone && dismissible) dragControls.start(e); }}
              style={{ touchAction: isPhone ? 'none' : 'auto' }}
            >
              <div className="sheet-grabber" aria-hidden="true" />
              {(title || !hideClose) && (
                <div className="sheet-header">
                  {title ? <h2 id={titleId} className="sheet-title">{title}</h2> : <span style={{ flex: 1 }} />}
                  {!hideClose && dismissible && (
                    <button type="button" onClick={onClose} className="icon-btn" aria-label="Fechar">
                      <X size={22} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="sheet-body">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Sheet;
