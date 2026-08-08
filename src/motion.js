// Sistema de movimento do RotaVis.
//
// Princípios adotados:
// 1. Rápido. Transição de interface é feedback, não espetáculo — nada acima de ~320ms.
//    O olho lê "instantâneo" até ~100ms e "responsivo" até ~250ms.
// 2. Uma curva por intenção. Entrada desacelera (ease-out), saída acelera (ease-in),
//    mudança de estado é simétrica. Nada de linear, que parece mecânico.
// 3. Saída é mais rápida que entrada. O que está saindo já não interessa ao usuário.
// 4. Movimento curto. Deslocamentos de 8–16px bastam para dar direção; distâncias
//    grandes obrigam a duração grande e travam a navegação.
// 5. Escalonamento sutil em listas, com teto — 30ms por item e no máximo ~8 itens,
//    senão o último item de uma lista longa demora demais para aparecer.

export const DUR = {
  instant: 0.1,
  fast: 0.16,
  base: 0.22,
  slow: 0.32
};

export const EASE = {
  out: [0.22, 1, 0.36, 1],
  in: [0.4, 0, 1, 1],
  inOut: [0.65, 0, 0.35, 1]
};

// Transições prontas, para não repetir objeto solto pelos componentes.
export const T = {
  fast: { duration: DUR.fast, ease: EASE.out },
  base: { duration: DUR.base, ease: EASE.out },
  slow: { duration: DUR.slow, ease: EASE.out },
  exit: { duration: DUR.instant, ease: EASE.in },
  inOut: { duration: DUR.base, ease: EASE.inOut }
};

// --- Variantes reutilizáveis ---

// Entrada padrão de bloco de conteúdo.
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: T.base },
  exit: { opacity: 0, y: -8, transition: T.exit }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: T.base },
  exit: { opacity: 0, transition: T.exit }
};

// Modais, toasts e troféus: nasce levemente menor, para parecer que "surge".
export const scaleIn = {
  initial: { opacity: 0, scale: 0.94, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: T.base },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: T.exit }
};

// Troca de página. Só entrada, sem exit: a página que sai é desmontada na hora, para a
// navegação nunca ficar esperando uma animação de saída terminar (ver AnimatedRoutes
// em App.jsx). Deslocamento mínimo — o fade serve só para não haver corte seco.
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.out } }
};

// Passo do questionário: entra pelo lado para sugerir avanço no fluxo.
export const wizardStep = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: T.base },
  exit: { opacity: 0, x: -24, transition: T.exit }
};

// --- Listas escalonadas ---

const STAGGER_STEP = 0.03;
const STAGGER_MAX_ITEMS = 8;

export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: STAGGER_STEP, delayChildren: 0.02 } }
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: T.fast }
};

// Para listas que não usam variants: atraso por índice, com teto para a lista longa
// não terminar de aparecer só depois de segundos.
export const stagger = (index) => ({
  ...T.fast,
  delay: Math.min(index, STAGGER_MAX_ITEMS) * STAGGER_STEP
});

// --- CSS ---
// Mesmos valores para quem anima via style/CSS em vez de Framer Motion.
export const CSS_EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const cssTransition = (props, duration = DUR.base) =>
  props.map(p => `${p} ${duration}s ${CSS_EASE_OUT}`).join(', ');
