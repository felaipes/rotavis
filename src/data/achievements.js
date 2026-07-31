import {
  Footprints, Compass, Mountain, Flame, Crown,
  MapPin, Map as MapIcon, Gem, Globe,
  Repeat, Heart, Star, Award,
  Layers, Sparkles, Trophy
} from 'lucide-react';

// Faixas dos troféus: quanto mais raro, mais "nobre" a cor.
export const TIERS = {
  bronze: { label: 'Bronze', color: '#bd7b45', soft: 'rgba(189, 123, 69, 0.14)' },
  prata: { label: 'Prata', color: '#7d8797', soft: 'rgba(125, 135, 151, 0.14)' },
  ouro: { label: 'Ouro', color: '#d09a09', soft: 'rgba(242, 183, 10, 0.18)' },
  diamante: { label: 'Diamante', color: '#3f8fd1', soft: 'rgba(63, 143, 209, 0.16)' }
};

// Os quatro eixos de conquista. Cada um mede uma coisa diferente do histórico de visitas.
export const ACHIEVEMENT_GROUPS = [
  { id: 'visitas', label: 'Total de visitas', hint: 'Conta todos os check-ins, inclusive os repetidos.' },
  { id: 'diferentes', label: 'Lugares diferentes', hint: 'Cada local novo conta uma vez só.' },
  { id: 'repetidas', label: 'Visitas repetidas', hint: 'Voltar no mesmo lugar também rende troféu.' },
  { id: 'variedade', label: 'Variedade', hint: 'Conhecer categorias diferentes de lugar.' }
];

// value(stats) devolve o progresso bruto; goal é quanto falta para destravar.
export const ACHIEVEMENTS = [
  // Total de check-ins
  { id: 'visitas-1', group: 'visitas', title: 'Primeiro Passo', description: 'Registre a sua primeira visita', icon: Footprints, tier: 'bronze', goal: 1, unit: 'visita', value: s => s.total },
  { id: 'visitas-5', group: 'visitas', title: 'Pé na Estrada', description: 'Complete 5 visitas', icon: Compass, tier: 'bronze', goal: 5, unit: 'visitas', value: s => s.total },
  { id: 'visitas-15', group: 'visitas', title: 'Aventureiro', description: 'Complete 15 visitas', icon: Mountain, tier: 'prata', goal: 15, unit: 'visitas', value: s => s.total },
  { id: 'visitas-30', group: 'visitas', title: 'Desbravador', description: 'Complete 30 visitas', icon: Flame, tier: 'ouro', goal: 30, unit: 'visitas', value: s => s.total },
  { id: 'visitas-60', group: 'visitas', title: 'Lenda de Foz', description: 'Complete 60 visitas', icon: Crown, tier: 'diamante', goal: 60, unit: 'visitas', value: s => s.total },

  // Lugares distintos
  { id: 'lugares-3', group: 'diferentes', title: 'Curioso', description: 'Conheça 3 lugares diferentes', icon: MapPin, tier: 'bronze', goal: 3, unit: 'lugares', value: s => s.uniqueCount },
  { id: 'lugares-10', group: 'diferentes', title: 'Explorador', description: 'Conheça 10 lugares diferentes', icon: MapIcon, tier: 'prata', goal: 10, unit: 'lugares', value: s => s.uniqueCount },
  { id: 'lugares-25', group: 'diferentes', title: 'Colecionador', description: 'Conheça 25 lugares diferentes', icon: Gem, tier: 'ouro', goal: 25, unit: 'lugares', value: s => s.uniqueCount },
  { id: 'lugares-todos', group: 'diferentes', title: 'Foz Completa', description: 'Conheça todos os lugares do catálogo', icon: Globe, tier: 'diamante', goal: null, unit: 'lugares', value: s => s.uniqueCount, goalFrom: s => s.totalPlaces },

  // Voltar no mesmo lugar
  { id: 'repete-2', group: 'repetidas', title: 'De Volta', description: 'Visite o mesmo lugar 2 vezes', icon: Repeat, tier: 'bronze', goal: 2, unit: 'vezes', value: s => s.maxRepeat },
  { id: 'repete-4', group: 'repetidas', title: 'Freguês', description: 'Visite o mesmo lugar 4 vezes', icon: Heart, tier: 'prata', goal: 4, unit: 'vezes', value: s => s.maxRepeat },
  { id: 'repete-7', group: 'repetidas', title: 'Morador Honorário', description: 'Visite o mesmo lugar 7 vezes', icon: Star, tier: 'ouro', goal: 7, unit: 'vezes', value: s => s.maxRepeat },
  { id: 'repete-varios', group: 'repetidas', title: 'Cliente Fiel', description: 'Volte em 5 lugares diferentes', icon: Award, tier: 'ouro', goal: 5, unit: 'lugares', value: s => s.placesRevisited },

  // Variedade de categorias
  { id: 'variedade-3', group: 'variedade', title: 'Provador', description: 'Visite 3 categorias diferentes', icon: Layers, tier: 'bronze', goal: 3, unit: 'categorias', value: s => s.categoryCount },
  { id: 'variedade-6', group: 'variedade', title: 'Sem Frescura', description: 'Visite 6 categorias diferentes', icon: Sparkles, tier: 'prata', goal: 6, unit: 'categorias', value: s => s.categoryCount },
  { id: 'variedade-todas', group: 'variedade', title: 'Foz por Inteiro', description: 'Visite todas as categorias', icon: Trophy, tier: 'diamante', goal: null, unit: 'categorias', value: s => s.categoryCount, goalFrom: s => s.totalCategories }
];

// Converte o histórico em progresso por troféu. goalFrom existe para as metas que dependem
// do tamanho do catálogo (ex.: "todos os lugares"), que muda quando data.js cresce.
export const evaluateAchievements = (stats) =>
  ACHIEVEMENTS.map(a => {
    const goal = a.goalFrom ? a.goalFrom(stats) : a.goal;
    const raw = a.value(stats);
    const current = Math.min(raw, goal);
    return {
      ...a,
      goal,
      current,
      unlocked: goal > 0 && raw >= goal,
      percent: goal > 0 ? Math.min(100, (raw / goal) * 100) : 0
    };
  });
