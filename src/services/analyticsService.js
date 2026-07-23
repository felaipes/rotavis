// analyticsService.js
// Serviço de coleta e leitura de dados analíticos dos roteiros gerados.
// Usa localStorage como backend (MVP). Pode ser migrado para Firebase Firestore no futuro.

const ANALYTICS_KEY = 'rotavis_analytics';
const NPS_KEY = 'rotavis_nps';

// Tabela de estimativa de gasto diário por perfil de orçamento
const SPENDING_ESTIMATES = {
  economico: { min: 80, max: 150 },
  conforto: { min: 150, max: 350 },
  luxo: { min: 350, max: 800 }
};

/**
 * Salva um evento de roteiro gerado anonimamente.
 * @param {Object} profile - Perfil do turista (reason, budget, transport, preferences, origin, groupType)
 * @param {Array} route - Array de dias gerados com os locais
 * @param {number} days - Quantidade de dias
 * @param {number} startDay - Dia da semana de chegada (0-6)
 */
export const trackRouteGenerated = (profile, route, days, startDay) => {
  try {
    const events = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');

    // Extrai IDs dos locais, categorias e zonas do roteiro
    const placeIds = [];
    const categories = {};
    const zones = {};
    let totalEntryFees = 0;

    route.forEach(dayPlan => {
      ['manha', 'tarde', 'noite'].forEach(period => {
        if (dayPlan[period]) {
          dayPlan[period].forEach(place => {
            if (place) {
              placeIds.push(place.id);

              // Contabiliza categorias
              categories[place.category] = (categories[place.category] || 0) + 1;

              // Contabiliza zonas
              zones[place.zone] = (zones[place.zone] || 0) + 1;

              // Soma taxas de entrada conhecidas
              if (place.entryFee) totalEntryFees += place.entryFee;
            }
          });
        }
      });
    });

    // Estimar gasto diário
    const budgetRange = SPENDING_ESTIMATES[profile.budget] || SPENDING_ESTIMATES.conforto;
    const estimatedDailySpend = Math.round((budgetRange.min + budgetRange.max) / 2);
    const estimatedTotalSpend = estimatedDailySpend * days + totalEntryFees;

    const event = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      month: new Date().getMonth(), // 0-11
      year: new Date().getFullYear(),
      weekday: startDay,
      days,
      profile: {
        reason: profile.reason,
        budget: profile.budget,
        transport: profile.transport,
        preferences: [...(profile.preferences || [])],
        origin: profile.origin || '',
        groupType: profile.groupType || ''
      },
      placeIds,
      categories,
      zones,
      estimatedDailySpend,
      estimatedTotalSpend
    };

    events.push(event);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Erro ao salvar analytics:', error);
  }
};

/**
 * Salva uma avaliação NPS.
 */
export const trackNps = (score) => {
  try {
    const npsData = JSON.parse(localStorage.getItem(NPS_KEY) || '[]');
    npsData.push({
      score,
      timestamp: new Date().toISOString(),
      month: new Date().getMonth(),
      year: new Date().getFullYear()
    });
    localStorage.setItem(NPS_KEY, JSON.stringify(npsData));
  } catch (error) {
    console.error('Erro ao salvar NPS:', error);
  }
};

/**
 * Retorna todos os eventos de roteiros gerados.
 */
export const getAllEvents = () => {
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
  } catch {
    return [];
  }
};

/**
 * Retorna dados agregados para o dashboard.
 */
export const getDashboardData = () => {
  const events = getAllEvents();
  const npsData = JSON.parse(localStorage.getItem(NPS_KEY) || '[]');

  if (events.length === 0) {
    return {
      totalRoutes: 0,
      avgDays: 0,
      reasonBreakdown: {},
      budgetBreakdown: {},
      transportBreakdown: {},
      preferenceBreakdown: {},
      topPlaces: [],
      topZones: [],
      monthlyTrend: [],
      weekdayDistribution: Array(7).fill(0),
      // New indicators
      originBreakdown: {},
      groupBreakdown: {},
      avgNps: null,
      npsDistribution: { promoters: 0, passives: 0, detractors: 0 },
      npsCount: 0,
      seasonalityIndex: [],
      estimatedAvgDailySpend: 0,
      estimatedTotalRevenue: 0,
      routePatterns: [],
      neglectedPlaces: [],
      alosMonthly: [],
    };
  }

  // Total de roteiros
  const totalRoutes = events.length;

  // Média de dias
  const avgDays = (events.reduce((sum, e) => sum + e.days, 0) / totalRoutes).toFixed(1);

  // Distribuição de motivos (reason)
  const reasonBreakdown = {};
  events.forEach(e => {
    const r = e.profile.reason || 'não informado';
    reasonBreakdown[r] = (reasonBreakdown[r] || 0) + 1;
  });

  // Distribuição de orçamento (budget)
  const budgetBreakdown = {};
  events.forEach(e => {
    const b = e.profile.budget || 'não informado';
    budgetBreakdown[b] = (budgetBreakdown[b] || 0) + 1;
  });

  // Distribuição de transporte
  const transportBreakdown = {};
  events.forEach(e => {
    const t = e.profile.transport || 'não informado';
    transportBreakdown[t] = (transportBreakdown[t] || 0) + 1;
  });

  // Distribuição de preferências
  const preferenceBreakdown = {};
  events.forEach(e => {
    (e.profile.preferences || []).forEach(p => {
      preferenceBreakdown[p] = (preferenceBreakdown[p] || 0) + 1;
    });
  });

  // Top locais (contagem por placeId em todos os roteiros)
  const placeCounts = {};
  events.forEach(e => {
    (e.placeIds || []).forEach(id => {
      placeCounts[id] = (placeCounts[id] || 0) + 1;
    });
  });
  const topPlaces = Object.entries(placeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  // Top zonas
  const zoneCounts = {};
  events.forEach(e => {
    Object.entries(e.zones || {}).forEach(([zone, count]) => {
      zoneCounts[zone] = (zoneCounts[zone] || 0) + count;
    });
  });
  const topZones = Object.entries(zoneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([zone, count]) => ({ zone, count }));

  // Tendência mensal (últimos 12 meses)
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthlyCounts = {};
  events.forEach(e => {
    const key = `${e.year}-${String(e.month).padStart(2, '0')}`;
    monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
  });
  const monthlyTrend = Object.entries(monthlyCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([key, count]) => {
      const [, month] = key.split('-');
      return { name: monthNames[parseInt(month)], roteiros: count };
    });

  // Distribuição por dia da semana
  const weekdayDistribution = Array(7).fill(0);
  events.forEach(e => {
    if (e.weekday !== undefined) {
      weekdayDistribution[e.weekday] += 1;
    }
  });

  // ============ NEW INDICATORS ============

  // --- Origin Breakdown ---
  const originBreakdown = {};
  events.forEach(e => {
    const o = e.profile?.origin || '';
    if (o) originBreakdown[o] = (originBreakdown[o] || 0) + 1;
  });

  // --- Group Type Breakdown ---
  const groupBreakdown = {};
  events.forEach(e => {
    const g = e.profile?.groupType || '';
    if (g) groupBreakdown[g] = (groupBreakdown[g] || 0) + 1;
  });

  // --- NPS ---
  let avgNps = null;
  let npsDistribution = { promoters: 0, passives: 0, detractors: 0 };
  const npsCount = npsData.length;
  if (npsCount > 0) {
    const total = npsData.reduce((s, n) => s + n.score, 0);
    avgNps = (total / npsCount).toFixed(1);
    npsData.forEach(n => {
      if (n.score >= 9) npsDistribution.promoters++;
      else if (n.score >= 7) npsDistribution.passives++;
      else npsDistribution.detractors++;
    });
  }

  // --- Seasonality Index (month-over-month % change) ---
  const seasonalityIndex = monthlyTrend.map((m, i) => {
    if (i === 0) return { ...m, change: 0 };
    const prev = monthlyTrend[i - 1].roteiros;
    const change = prev === 0 ? 100 : Math.round(((m.roteiros - prev) / prev) * 100);
    return { ...m, change };
  });

  // --- Estimated Spending ---
  const validSpend = events.filter(e => e.estimatedDailySpend);
  const estimatedAvgDailySpend = validSpend.length > 0
    ? Math.round(validSpend.reduce((s, e) => s + e.estimatedDailySpend, 0) / validSpend.length)
    : 0;
  const estimatedTotalRevenue = events.reduce((s, e) => s + (e.estimatedTotalSpend || 0), 0);

  // --- Route Patterns (top 5 most common place pairs) ---
  const pairCounts = {};
  events.forEach(e => {
    const ids = e.placeIds || [];
    // Track unique pairs within each route
    const uniqueIds = [...new Set(ids)];
    for (let i = 0; i < uniqueIds.length; i++) {
      for (let j = i + 1; j < uniqueIds.length; j++) {
        const pair = [uniqueIds[i], uniqueIds[j]].sort().join('→');
        pairCounts[pair] = (pairCounts[pair] || 0) + 1;
      }
    }
  });
  const routePatterns = Object.entries(pairCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pair, count]) => ({ pair, count }));

  // --- Neglected Places (places that exist in data.js but rarely appear in routes) ---
  // We'll return placeCounts for the admin to cross-reference with all places
  const allPlaceCounts = { ...placeCounts };

  // --- ALOS Monthly (Average Length of Stay per month) ---
  const monthlyDays = {};
  const monthlyDaysCounts = {};
  events.forEach(e => {
    const key = `${e.year}-${String(e.month).padStart(2, '0')}`;
    monthlyDays[key] = (monthlyDays[key] || 0) + e.days;
    monthlyDaysCounts[key] = (monthlyDaysCounts[key] || 0) + 1;
  });
  const alosMonthly = Object.entries(monthlyDays)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([key, totalDays]) => {
      const [, month] = key.split('-');
      const avg = (totalDays / monthlyDaysCounts[key]).toFixed(1);
      return { name: monthNames[parseInt(month)], dias: parseFloat(avg) };
    });

  return {
    totalRoutes,
    avgDays: parseFloat(avgDays),
    reasonBreakdown,
    budgetBreakdown,
    transportBreakdown,
    preferenceBreakdown,
    topPlaces,
    topZones,
    monthlyTrend,
    weekdayDistribution,
    // New indicators
    originBreakdown,
    groupBreakdown,
    avgNps: avgNps ? parseFloat(avgNps) : null,
    npsDistribution,
    npsCount,
    seasonalityIndex,
    estimatedAvgDailySpend,
    estimatedTotalRevenue,
    routePatterns,
    neglectedPlaces: allPlaceCounts,
    alosMonthly,
  };
};

/**
 * Gera dados fictícios para demonstração do painel (popula localStorage).
 */
export const seedDemoData = () => {
  const existing = getAllEvents();
  if (existing.length > 0) return; // Não sobrescreve dados reais

  const reasons = ['passeio', 'trabalho'];
  const budgets = ['economico', 'conforto', 'luxo'];
  const transports = ['carro', 'ape'];
  const prefs = ['cafe', 'natureza', 'historico', 'comidinhas', 'bebidas', 'familia', 'religiao', 'esporte', 'compras'];
  const origins = ['SP', 'PR', 'SC', 'RS', 'MG', 'RJ', 'GO', 'MS', 'BA', 'MT', 'Paraguai', 'Argentina', 'Outros'];
  const groups = ['familia', 'casal', 'solo', 'amigos', 'corporativo'];
  const samplePlaceIds = [
    'cataratas-lado-brasileiro', 'parque-das-aves', 'itaipu-tour-panoramico',
    'marco-tres-fronteiras', 'templo-budista-chen-tien', 'macuco-safari',
    'rafain-churrascaria-show', 'le-mir-comida-arabe', 'capitao-bar',
    'panificadora-roma', 'dreamland-museu-de-cera', 'coar-cafeteria',
    'sky-bar-viale-tower', 'bufalo-branco', 'bona-trattoria',
    'hotel-das-cataratas', 'bourbon-cataratas-resort', 'ponte-da-amizade-ciudad-del-este'
  ];
  const sampleZones = ['Parque Nacional', 'Centro', 'Avenida das Cataratas', 'Itaipu', 'Porto Meira', 'Vila Yolanda', 'Fronteira'];

  const events = [];
  const nps = [];
  const now = new Date();

  for (let i = 0; i < 87; i++) {
    // Gerar data aleatória nos últimos 6 meses
    const daysAgo = Math.floor(Math.random() * 180);
    const eventDate = new Date(now.getTime() - daysAgo * 86400000);

    const days = Math.ceil(Math.random() * 5);
    const numPrefs = 1 + Math.floor(Math.random() * 4);
    const selectedPrefs = [...prefs].sort(() => 0.5 - Math.random()).slice(0, numPrefs);

    const numPlaces = days * 3 + Math.floor(Math.random() * 3);
    const selectedPlaces = [];
    const categoriesCt = {};
    const zonesCt = {};

    for (let j = 0; j < numPlaces; j++) {
      const pid = samplePlaceIds[Math.floor(Math.random() * samplePlaceIds.length)];
      selectedPlaces.push(pid);
      const cat = pid.includes('cataratas') ? 'passeios' : pid.includes('bar') ? 'bares' : 'restaurantes';
      categoriesCt[cat] = (categoriesCt[cat] || 0) + 1;
      const zone = sampleZones[Math.floor(Math.random() * sampleZones.length)];
      zonesCt[zone] = (zonesCt[zone] || 0) + 1;
    }

    const budget = budgets[Math.floor(Math.random() * budgets.length)];
    const bRange = SPENDING_ESTIMATES[budget];
    const dailySpend = Math.round((bRange.min + bRange.max) / 2);

    // Weighted origin distribution (PR and SP most common)
    const originWeights = [20, 25, 10, 8, 7, 6, 4, 5, 3, 3, 4, 3, 2];
    const totalWeight = originWeights.reduce((s, w) => s + w, 0);
    let rand = Math.random() * totalWeight;
    let originIdx = 0;
    for (let o = 0; o < originWeights.length; o++) {
      rand -= originWeights[o];
      if (rand <= 0) { originIdx = o; break; }
    }

    events.push({
      id: eventDate.getTime().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: eventDate.toISOString(),
      month: eventDate.getMonth(),
      year: eventDate.getFullYear(),
      weekday: Math.floor(Math.random() * 7),
      days,
      profile: {
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        budget,
        transport: transports[Math.floor(Math.random() * transports.length)],
        preferences: selectedPrefs,
        origin: origins[originIdx],
        groupType: groups[Math.floor(Math.random() * groups.length)]
      },
      placeIds: selectedPlaces,
      categories: categoriesCt,
      zones: zonesCt,
      estimatedDailySpend: dailySpend,
      estimatedTotalSpend: dailySpend * days + Math.round(Math.random() * 300)
    });

    // ~70% chance of NPS
    if (Math.random() < 0.7) {
      // Weighted towards 7-10
      const npsScore = Math.min(10, Math.max(0, Math.round(Math.random() * 4 + 6)));
      nps.push({
        score: npsScore,
        timestamp: eventDate.toISOString(),
        month: eventDate.getMonth(),
        year: eventDate.getFullYear()
      });
    }
  }

  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
  localStorage.setItem(NPS_KEY, JSON.stringify(nps));
};
