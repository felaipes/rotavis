// Retorno tátil nos momentos que importam — check-in, troféu, erro — e em nenhum outro:
// vibração em todo toque ensina a pessoa a ignorá-la. Usa a Vibration API, que existe
// no Android; no iPhone o Safari não a expõe e a chamada simplesmente não faz nada.
const PATTERNS = {
  selection: 8,
  success: [12, 60, 18],
  warning: [20, 80, 20],
  error: [30, 60, 30, 60, 30]
};

export function haptic(kind = 'selection') {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(PATTERNS[kind] ?? PATTERNS.selection);
    }
  } catch {
    // Alguns navegadores lançam erro quando a página não teve interação ainda.
  }
}
