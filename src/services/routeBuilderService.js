import { scorePlaces } from './recommendationService';
import { isPlaceAvailable, isOpenOnDay } from './availabilityService';

const filterAvailable = (pool, periodKey, dayIndex) => {
  const openNow = pool.filter(p => isPlaceAvailable(p, periodKey, dayIndex));
  if (openNow.length > 0) return openNow;
  const openToday = pool.filter(p => isOpenOnDay(p, dayIndex));
  return openToday.length > 0 ? openToday : pool;
};

// Monta um dia de exemplo (manhã/tarde/noite) com um perfil padrão, para mostrar
// o valor do gerador de rotas já na Home, sem exigir que a pessoa preencha o assistente.
export const buildExampleDay = (places, { dayIndex = new Date().getDay() } = {}) => {
  const defaultProfile = { reason: 'passeio', budget: 'conforto', transport: 'carro', preferences: [] };
  const scoredPlaces = scorePlaces(places, defaultProfile);

  const cafes = scoredPlaces.filter(p => p.category === 'cafe_da_manha');
  const passeios = scoredPlaces.filter(p => p.category === 'passeios');
  const restaurantes = scoredPlaces.filter(p => p.category === 'restaurantes');
  const bares = scoredPlaces.filter(p => p.category === 'bares');
  const cafeterias = scoredPlaces.filter(p => p.category === 'cafeterias_docerias');

  const usedIds = new Set();
  const getNextPlace = (pool, { preferredZone = null, periodKey = null } = {}) => {
    let available = pool.filter(p => !usedIds.has(p.id));
    if (available.length === 0) return null;
    if (periodKey) available = filterAvailable(available, periodKey, dayIndex);

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

  const mCafe = getNextPlace(cafes, { periodKey: 'manha' });
  const mPasseio = getNextPlace(passeios, { preferredZone: mCafe?.zone, periodKey: 'manha' });
  const primaryZone = mPasseio?.zone || mCafe?.zone;

  const tRest = getNextPlace(restaurantes, { preferredZone: primaryZone, periodKey: 'tarde' });
  const tPasseio = getNextPlace(passeios, { preferredZone: tRest?.zone || primaryZone, periodKey: 'tarde' })
    || getNextPlace(cafeterias, { preferredZone: tRest?.zone || primaryZone, periodKey: 'tarde' });
  const newPrimaryZone = tPasseio?.zone || tRest?.zone || primaryZone;

  const nLugar = getNextPlace(bares, { preferredZone: newPrimaryZone, periodKey: 'noite' })
    || getNextPlace(restaurantes, { preferredZone: newPrimaryZone, periodKey: 'noite' });

  return {
    weekday: dayIndex,
    manha: [mCafe, mPasseio].filter(Boolean),
    tarde: [tRest, tPasseio].filter(Boolean),
    noite: [nLugar].filter(Boolean)
  };
};
