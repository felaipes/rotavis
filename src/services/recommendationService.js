export const scorePlaces = (places, profile) => {
  if (!profile || Object.keys(profile).length === 0) {
    return [...places].sort(() => 0.5 - Math.random());
  }

  const { reason, budget, preferences, travelWith, ageRange } = profile;

  const scoredPlaces = places.map(place => {
    let score = 0;
    const tags = place.tags || [];

    // 1. Motivo
    if (reason === 'trabalho') {
      if (tags.includes('centro') || tags.includes('cafe') || tags.includes('almoco')) score += 1;
      if (tags.includes('aventura') || tags.includes('demorado')) score -= 1;
    } else if (reason === 'passeio') {
      if (tags.includes('passeio') || tags.includes('fotos') || tags.includes('turismo')) score += 1;
    }

    // 2. Orçamento (usando priceRange e tags)
    if (budget === 'economico') {
      if (place.priceRange === '$') score += 3;
      if (tags.includes('barato') || tags.includes('gratis')) score += 2;
      if (place.priceRange === '$$$') score -= 3;
      if (tags.includes('luxo') || tags.includes('sofisticado') || tags.includes('caro')) score -= 2;
    } else if (budget === 'luxo') {
      if (place.priceRange === '$$$') score += 3;
      if (tags.includes('luxo') || tags.includes('sofisticado') || tags.includes('elegante')) score += 2;
      if (place.priceRange === '$') score -= 2;
      if (tags.includes('barato')) score -= 1;
    } else if (budget === 'conforto') {
      if (place.priceRange === '$$') score += 2;
      if (tags.includes('conforto') || tags.includes('familia')) score += 1;
    }

    // 3. Preferências
    if (preferences && preferences.length > 0) {
      preferences.forEach(pref => {
        if (tags.includes(pref)) {
          score += 3; // Preferências explícitas têm peso maior
        }
      });
    }

    // 4. Com quem viaja (travelWith)
    if (travelWith === 'familia') {
      if (tags.includes('familia') || tags.includes('infantil') || tags.includes('acessivel')) score += 3;
      if (tags.includes('bebidas') || tags.includes('balada') || tags.includes('adultos')) score -= 3;
    } else if (travelWith === 'casal') {
      if (tags.includes('romantico') || tags.includes('vista') || tags.includes('jantar_especial')) score += 3;
      if (tags.includes('infantil')) score -= 1;
    } else if (travelWith === 'amigos') {
      if (tags.includes('bebidas') || tags.includes('aventura') || tags.includes('grupo')) score += 3;
      if (tags.includes('solitario')) score -= 1;
    } else if (travelWith === 'solo') {
      if (tags.includes('cafe') || tags.includes('caminhada') || tags.includes('solitario')) score += 2;
    }

    // 5. Faixa etária (ageRange)
    if (ageRange === '18-30') {
      if (tags.includes('aventura') || tags.includes('esporte') || tags.includes('bebidas')) score += 2;
      if (tags.includes('tranquilo') || tags.includes('historico')) score -= 0;
    } else if (ageRange === '31-50') {
      if (tags.includes('gastronomia') || tags.includes('historico') || tags.includes('conforto')) score += 2;
    } else if (ageRange === '51+') {
      if (tags.includes('acessivel') || tags.includes('historico') || tags.includes('tranquilo')) score += 3;
      if (tags.includes('aventura_radical') || tags.includes('balada')) score -= 3;
    }

    return { ...place, score };
  });

  // Ordenar por pontuação (maior primeiro). 
  // Para empatados, adiciona uma leve aleatoriedade para não gerar sempre a mesma rota exata.
  return scoredPlaces.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return 0.5 - Math.random();
  });
};
