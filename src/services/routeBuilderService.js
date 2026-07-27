import { scorePlaces } from './recommendationService';
import { isPlaceAvailable, isOpenOnDay } from './availabilityService';

const filterAvailable = (pool, periodKey, dayIndex) => {
  const openNow = pool.filter(p => isPlaceAvailable(p, periodKey, dayIndex));
  if (openNow.length > 0) return openNow;
  const openToday = pool.filter(p => isOpenOnDay(p, dayIndex));
  return openToday.length > 0 ? openToday : pool;
};

// Monta um roteiro automático (perfil padrão) para quantos dias forem pedidos, com
// 2 opções alternativas para cada período (manhã/tarde/noite) de cada dia, para a
// pessoa escolher qual fica no roteiro final — sem precisar preencher o assistente.
export const buildAutoRoute = (places, { days = 3, startDay = new Date().getDay() } = {}) => {
  const defaultProfile = { reason: 'passeio', budget: 'conforto', transport: 'carro', preferences: [] };
  const scoredPlaces = scorePlaces(places, defaultProfile);

  const cafes = scoredPlaces.filter(p => p.category === 'cafe_da_manha');
  const passeios = scoredPlaces.filter(p => p.category === 'passeios');
  const restaurantes = scoredPlaces.filter(p => p.category === 'restaurantes');
  const bares = scoredPlaces.filter(p => p.category === 'bares');
  const cafeterias = scoredPlaces.filter(p => p.category === 'cafeterias_docerias');

  // Um único conjunto de IDs usados para todo o roteiro (todos os dias, as duas opções
  // de cada período) garante que nenhum lugar se repita em nenhuma sugestão.
  const usedIds = new Set();

  const getNextPlace = (pool, { preferredZone = null, periodKey = null, dayIndex = null } = {}) => {
    let available = pool.filter(p => !usedIds.has(p.id));
    if (available.length === 0) return null;
    if (periodKey && dayIndex !== null) available = filterAvailable(available, periodKey, dayIndex);

    if (preferredZone) {
      const match = available.find(p => p.zone === preferredZone);
      if (match) { usedIds.add(match.id); return match; }
      const centro = available.find(p => p.zone === 'Centro');
      if (centro) { usedIds.add(centro.id); return centro; }
    }

    const selected = available[0];
    usedIds.add(selected.id);
    return selected;
  };

  const buildDayOption = (dayIndex) => {
    const mCafe = getNextPlace(cafes, { periodKey: 'manha', dayIndex });
    const mPasseio = getNextPlace(passeios, { preferredZone: mCafe?.zone, periodKey: 'manha', dayIndex });
    const primaryZone = mPasseio?.zone || mCafe?.zone;

    const tRest = getNextPlace(restaurantes, { preferredZone: primaryZone, periodKey: 'tarde', dayIndex });
    const tPasseio = getNextPlace(passeios, { preferredZone: tRest?.zone || primaryZone, periodKey: 'tarde', dayIndex })
      || getNextPlace(cafeterias, { preferredZone: tRest?.zone || primaryZone, periodKey: 'tarde', dayIndex });
    const newPrimaryZone = tPasseio?.zone || tRest?.zone || primaryZone;

    const nLugar = getNextPlace(bares, { preferredZone: newPrimaryZone, periodKey: 'noite', dayIndex })
      || getNextPlace(restaurantes, { preferredZone: newPrimaryZone, periodKey: 'noite', dayIndex });

    return {
      manha: [mCafe, mPasseio].filter(Boolean),
      tarde: [tRest, tPasseio].filter(Boolean),
      noite: [nLugar].filter(Boolean)
    };
  };

  const result = [];
  for (let i = 0; i < days; i++) {
    const dayIndex = (startDay + i) % 7;
    const optionA = buildDayOption(dayIndex);
    const optionB = buildDayOption(dayIndex);

    result.push({
      day: i + 1,
      weekday: dayIndex,
      manha: { optionA: optionA.manha, optionB: optionB.manha },
      tarde: { optionA: optionA.tarde, optionB: optionB.tarde },
      noite: { optionA: optionA.noite, optionB: optionB.noite }
    });
  }

  return result;
};
