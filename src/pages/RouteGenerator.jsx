import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { places } from '../data';
import { Calendar, CheckCircle2, ChevronRight, Sun, Sunset, Moon, Briefcase, Map as MapIcon, Wallet, Star, Coffee, Tent, History, Utensils, GlassWater, Car, Footprints, Download, X, Activity, Rocket, Clock, Timer, Hourglass, MapPinned, Users, Heart, Route, Plus, Minus } from 'lucide-react';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import PlaceCard from '../components/PlaceCard';
import RouteMapView, { DAY_COLORS, DayRouteMap } from '../components/RouteMapView';
import DateCalendar, { toISODate, addDaysISO } from '../components/DateCalendar';
import CountryFlag from '../components/CountryFlag';
import StateSelect from '../components/StateSelect';
import { useRouteHistory } from '../hooks/useRouteHistory';
import { useRouteSession, lerSessao } from '../hooks/useRouteSession';
import MagicRings from '../components/MagicRings';
import { T, wizardStep, fadeUp, stagger } from '../motion';
import { getPlaceCoordinates, totalRouteDistanceKm, formatDistanceKm, haversineDistanceKm } from '../data/zoneCoordinates';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { scorePlaces } from '../services/recommendationService';
import { trackRouteGenerated, trackNps } from '../services/analyticsService';
import { WEEKDAY_LABELS, isPlaceAvailable, isOpenOnDay } from '../services/availabilityService';
import { useAuth } from '../context/AuthContext';
import RouteLoadingScreen from '../components/RouteLoadingScreen';


// Filtra o grupo de locais pelos que estão abertos no período/dia-da-semana pedidos.
// Se ninguém do grupo estiver disponível (caso raro), relaxa a exigência em vez de deixar o resultado vazio.
const filterAvailable = (pool, periodKey, dayIndex) => {
  const openNow = pool.filter(p => isPlaceAvailable(p, periodKey, dayIndex));
  if (openNow.length > 0) return openNow;
  const openToday = pool.filter(p => isOpenOnDay(p, dayIndex));
  return openToday.length > 0 ? openToday : pool;
};

// Converte uma cor hex (#rrggbb) em {r,g,b} para usar em pdf.setFillColor/setTextColor.
const hexToRgb = (hex) => {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
};

// T12:00:00 evita o "new Date('yyyy-mm-dd')" cair na meia-noite UTC, que em fusos negativos
// (Brasil) mostra o dia da semana anterior ao selecionado no calendário.
const formatFullDate = (iso) => iso
  ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  : '';
const formatShortDate = (iso) => iso
  ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  : '';

// Quantas paradas cabem no tempo livre informado para o roteiro de quem está a trabalho.
const WORK_STOPS = { ate2h: 1, '2a4h': 2, mais4h: 3 };
const WORK_DURATION_OPTIONS = [
  { id: 'ate2h', label: 'Até 2 horas', icon: Clock },
  { id: '2a4h', label: '2 a 4 horas', icon: Timer },
  { id: 'mais4h', label: 'Mais de 4 horas', icon: Hourglass }
];
const WORK_PERIOD_OPTIONS = [
  { id: 'manha', label: 'Manhã', icon: Sun },
  { id: 'tarde', label: 'Tarde', icon: Sunset },
  { id: 'noite', label: 'Noite', icon: Moon }
];
// Categorias que fazem sentido oferecer em cada horário livre entre compromissos de trabalho.
const WORK_POOL_BY_PERIOD = {
  manha: ['cafe_da_manha', 'passeios'],
  tarde: ['passeios', 'restaurantes', 'cafeterias_docerias'],
  noite: ['restaurantes', 'bares']
};
// Quem se desloca a pé não deve caminhar mais que isso por dia; o gerador corta paradas
// que estourariam o limite em vez de montar um dia impossível de cumprir andando.
const FOOT_DAILY_LIMIT_KM = 10;

// Todas as paradas de um roteiro, na ordem, achatadas numa lista só.
const flattenStops = (dayPlans) =>
  dayPlans.flatMap(d => [...(d.manha || []), ...(d.tarde || []), ...(d.noite || [])].filter(Boolean));

const collectPlaceIds = (dayPlans) => flattenStops(dayPlans).map(p => p.id);

// Preço por pessoa de uma parada. Os preços do catálogo já são por pessoa.
const priceOf = (p) => p?.avgPrice ?? (typeof p?.entryFee === 'number' ? p.entryFee : 0);

// Domingo e sábado são masculinos; de segunda a sexta são "feiras", femininas.
const weekdayComArtigo = (dayIndex) =>
  (dayIndex === 0 || dayIndex === 6 ? 'no ' : 'na ') + (WEEKDAY_LABELS[dayIndex] || '').toLowerCase();

// Só os campos que as telas de leitura usam. Guardar o objeto inteiro do lugar encheria
// o localStorage com descrição, galeria de fotos e tags que ninguém lê ali.
const trimPlace = (p) => ({
  id: p.id, name: p.name, category: p.category, address: p.address,
  zone: p.zone, image: p.image, avgPrice: p.avgPrice, entryFee: p.entryFee, icon: p.icon
});

const serializeDays = (dayPlans) => dayPlans.map(d => ({
  day: d.day,
  weekday: d.weekday,
  manha: (d.manha || []).map(trimPlace),
  tarde: (d.tarde || []).map(trimPlace),
  noite: (d.noite || []).map(trimPlace)
}));

// Faixas de gasto por dia usadas pelo scorePlaces. Antes vinham de uma pergunta própria;
// agora saem do orçamento total dividido pelos dias, para não perguntar dinheiro duas vezes.
const budgetTierFromDaily = (dailyBudget) => {
  if (dailyBudget == null) return undefined;
  if (dailyBudget < 150) return 'economico';
  if (dailyBudget <= 350) return 'conforto';
  return 'luxo';
};

// Números que resumem uma opção de roteiro no cartão de escolha. O destaque é o primeiro
// atrativo, não a primeira parada: o café da manhã costuma ser o mesmo nas duas opções
// (só existem 3 no catálogo), então não ajudaria a diferenciá-las.
const summarizeItinerary = (dayPlans) => {
  const stops = flattenStops(dayPlans);
  const cost = dayPlans.reduce((sum, d) => sum + (d.estimatedCost || 0), 0);
  const km = dayPlans.reduce(
    (sum, d) => sum + totalRouteDistanceKm(
      [...(d.manha || []), ...(d.tarde || []), ...(d.noite || [])].filter(Boolean).map(getPlaceCoordinates)
    ),
    0
  );
  const highlight = stops.find(p => p.category === 'passeios') || stops[0];
  return { stopCount: stops.length, cost, km, highlight: highlight?.name || '' };
};
// Grupos cujo tamanho já está no nome — não faz sentido perguntar quantas pessoas são.
const FIXED_GROUP_SIZES = { solo: 1, casal: 2 };
// Chute inicial do contador para os grupos de tamanho aberto, só para não começar em 1.
const DEFAULT_GROUP_SIZES = { familia: 4, amigos: 3, colaboradores: 3 };

const PERIOD_LABELS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
const DURATION_LABELS = { ate2h: 'até 2 horas', '2a4h': '2 a 4 horas', mais4h: 'mais de 4 horas' };
// Passeio tem um passo a menos: ida e volta saem no mesmo calendario, enquanto
// trabalho ainda precisa de data, duracao e periodo em telas separadas.
const totalSteps = (reason) => (reason === 'trabalho' ? 8 : 7);

// Indicador de progresso do questionário (não aparece na tela de resultado).
const WizardProgress = ({ step, reason }) => {
  const total = totalSteps(reason);
  if (step > total) return null;
  const percent = Math.round((step / total) * 100);
  return (
    <div style={{ maxWidth: '420px', margin: '0 auto 30px' }}>
      {/* text-main em vez de text-muted: este texto fica sobre a foto das Cataratas, e o
          tom apagado não alcança contraste AA ali (ver .falls-scrim no index.css). */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
        <span>Passo {step} de {total}</span>
        <span>{percent}%</span>
      </div>
      <div style={{ height: '6px', background: 'var(--card-border)', borderRadius: '99px', overflow: 'hidden' }}>
        <motion.div
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={T.slow}
          style={{ height: '100%', background: 'linear-gradient(90deg, var(--blue), var(--green), var(--accent-gold))', borderRadius: '99px' }}
        />
      </div>
    </div>
  );
};

const INTEREST_OPTIONS = [
  { id: 'cafe', label: 'Café', icon: Coffee },
  { id: 'natureza', label: 'Natureza', icon: Tent },
  { id: 'historico', label: 'História', icon: History },
  { id: 'comidinhas', label: 'Gastronomia', icon: Utensils },
  { id: 'bebidas', label: 'Vida Noturna', icon: GlassWater },
  { id: 'familia', label: 'Família', icon: Sun },
  { id: 'religiao', label: 'Religioso', icon: Star },
  { id: 'esporte', label: 'Aventura/Esportes', icon: Activity },
  { id: 'compras', label: 'Compras/Fronteira', icon: Rocket }
];
// Subfiltros exibidos quando o interesse "pai" correspondente está ativo, para refinar a busca.
const SUB_FILTERS = {
  religiao: [
    { id: 'budismo', label: 'Budismo' },
    { id: 'islamismo', label: 'Islamismo' },
    { id: 'catolicismo', label: 'Catolicismo' }
  ],
  comidinhas: [
    { id: 'churrasco', label: 'Churrasco/Carnes' },
    { id: 'frutos do mar', label: 'Frutos do Mar' },
    { id: 'arabe', label: 'Árabe' },
    { id: 'japonesa', label: 'Japonesa' },
    { id: 'italiana', label: 'Italiana' },
    { id: 'baiana', label: 'Nordestina' }
  ]
};

// Tela estreita = celular. Serve para não montar enfeite pesado onde ele custa caro.
const useIsSmallScreen = () => {
  const [small, setSmall] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setSmall(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return small;
};

const RouteGenerator = () => {
  const { user, updateProfile } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const isSmallScreen = useIsSmallScreen();

  // Estado da sessão anterior, para quando a pessoa sai desta tela e volta. Lido uma vez
  // só, no primeiro render, para servir de valor inicial — restaurar depois faria a tela
  // piscar vazia antes de aparecer o roteiro.
  const sessaoRef = useRef(lerSessao());
  const sessao = sessaoRef.current;

  const [days, setDays] = useState(sessao?.days ?? 1);
  const [startDay, setStartDay] = useState(sessao?.startDay ?? new Date().getDay());
  const [arrivalDate, setArrivalDate] = useState(sessao?.arrivalDate ?? '');
  const [departureDate, setDepartureDate] = useState(sessao?.departureDate ?? '');
  // Quantas pessoas viajam ao todo (incluindo quem está preenchendo). O orçamento total
  // é dividido por esse número e pelos dias, porque os preços do catálogo são por pessoa.
  const [travelers, setTravelers] = useState(sessao?.travelers ?? 1);

  // Solo/casal avançam direto; os demais param para informar quantas pessoas são.
  const handleGroupTypeSelect = (groupId) => {
    setProfile(prev => ({ ...prev, groupType: groupId }));
    const fixed = FIXED_GROUP_SIZES[groupId];
    if (fixed) {
      setTravelers(fixed);
      setStep(4);
    } else {
      setTravelers(DEFAULT_GROUP_SIZES[groupId] || 2);
    }
  };
  const todayISO = toISODate(new Date());

  // Deriva o dia da semana da chegada e a quantidade de dias (contagem inclusiva: chegada e
  // saída no mesmo dia = 1 dia; um dia de diferença = 2 dias etc.) a partir das datas escolhidas.
  useEffect(() => {
    if (arrivalDate) {
      setStartDay(new Date(`${arrivalDate}T12:00:00`).getDay());
    }
  }, [arrivalDate]);

  useEffect(() => {
    if (arrivalDate && departureDate) {
      const diff = Math.round((new Date(`${departureDate}T12:00:00`) - new Date(`${arrivalDate}T12:00:00`)) / 86400000);
      setDays(Math.max(1, diff + 1));
    }
  }, [arrivalDate, departureDate]);

  // Se a chegada muda para depois da saída já escolhida, limpa a saída para forçar uma
  // escolha válida. Não há mais teto de duração: o gerador monta quantos dias forem.
  const handleArrivalChange = (val) => {
    setArrivalDate(val);
    if (departureDate && val && departureDate < val) setDepartureDate('');
  };

  // Chegada e saída no mesmo calendário.
  const handleRangeChange = (inicio, fim) => {
    setArrivalDate(inicio);
    setDepartureDate(fim);
  };
  // Duas opções de roteiro; `route` é sempre a que está selecionada, então o resto da
  // tela (mapa, PDF, salvar) continua trabalhando com um roteiro só.
  const [routeOptions, setRouteOptions] = useState(sessao?.routeOptions ?? null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(sessao?.selectedRouteIndex ?? 0);
  const route = routeOptions ? routeOptions[selectedRouteIndex] : null;
  const [step, setStep] = useState(sessao?.step ?? 1);
  const [modalStage, setModalStage] = useState(null);
  const routeRef = useRef(null);
  const mapSnapshotRef = useRef(null);
  // Destino da rolagem quando o roteiro fica pronto.
  const resultRef = useRef(null);
  const [profile, setProfile] = useState(sessao?.profile ?? {
    reason: '',
    transport: '',
    preferences: [],
    timeAvailable: '',
    period: '',
    totalBudget: null,
    originCountry: '',
    originState: '',
  });
  const [showNps, setShowNps] = useState(false);
  const [npsScore, setNpsScore] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mantém o roteiro e as respostas vivos ao navegar para outra tela e voltar. Só o que
  // é serializável entra aqui.
  useRouteSession({
    routeOptions, selectedRouteIndex, step, profile,
    days, startDay, arrivalDate, departureDate, travelers
  });

  const { saveRoute: saveToHistory } = useRouteHistory();
  // Uma geração = uma entrada no histórico. Trocar entre o roteiro A e o B atualiza a
  // mesma entrada em vez de criar outra, porque continua sendo a mesma viagem planejada.
  const generationIdRef = useRef(null);
  // Id da geração já enviada para "Meus Roteiros". O envio é explícito: antes o roteiro
  // ia sozinho assim que era gerado, o que enchia o histórico de tentativas descartadas.
  const [chosenId, setChosenId] = useState(null);
  const isChosen = chosenId !== null && chosenId === generationIdRef.current;

  const handleChooseRoute = () => {
    if (!route || !generationIdRef.current) return;
    const ehTrabalho = profile.reason === 'trabalho';
    saveToHistory({
      id: generationIdRef.current,
      name: ehTrabalho
        ? `Roteiro de trabalho · ${PERIOD_LABELS[profile.period] || ''}`.trim()
        : `Roteiro em Foz (${days} ${days === 1 ? 'dia' : 'dias'})`,
      date: (arrivalDate || toISODate(new Date())),
      createdAt: new Date().toISOString(),
      option: String.fromCharCode(65 + selectedRouteIndex),
      travelers,
      totalBudget: profile.totalBudget ?? null,
      transport: profile.transport,
      days: serializeDays(route)
    });
    setChosenId(generationIdRef.current);
  };

  const handlePreferenceToggle = (pref) => {
    setProfile(prev => {
      const prefs = prev.preferences.includes(pref)
        ? prev.preferences.filter(p => p !== pref)
        : [...prev.preferences, pref];
      return { ...prev, preferences: prefs };
    });
  };

  const handleSaveRoute = () => {
    setModalStage('confirm');
  };

  const handleConfirmSave = async () => {
    setModalStage('thankyou');

    if (user && route) {
      try {
        const newRoute = {
          id: Date.now(),
          name: profile.reason === 'trabalho' ? 'Roteiro Curto de Trabalho' : `Roteiro em Foz (${days} dias)`,
          date: new Date().toISOString().split('T')[0],
          expirationDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
          days: route.map(dayPlan => ({
            day: dayPlan.day,
            weekday: dayPlan.weekday,
            manha: (dayPlan.manha || []).map(p => ({ id: p.id, name: p.name, category: p.category, address: p.address, zone: p.zone, image: p.image, avgPrice: p.avgPrice, entryFee: p.entryFee, icon: p.icon, visited: false, skippedReason: null })),
            tarde: (dayPlan.tarde || []).map(p => ({ id: p.id, name: p.name, category: p.category, address: p.address, zone: p.zone, image: p.image, avgPrice: p.avgPrice, entryFee: p.entryFee, icon: p.icon, visited: false, skippedReason: null })),
            noite: (dayPlan.noite || []).map(p => ({ id: p.id, name: p.name, category: p.category, address: p.address, zone: p.zone, image: p.image, avgPrice: p.avgPrice, entryFee: p.entryFee, icon: p.icon, visited: false, skippedReason: null })),
          }))
        };
        const currentSaved = user.savedRoutes || [];
        if (user.activeRoute) {
          currentSaved.unshift(user.activeRoute);
        }
        await updateProfile({ activeRoute: newRoute, savedRoutes: currentSaved });
      } catch (err) {
        console.error('Erro ao salvar rota no perfil:', err);
      }
    }
    
    // Pequeno atraso para garantir que a interface atualize para 'thankyou' antes do processamento pesado
    setTimeout(async () => {
      if (route) {
        try {
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          let yOffset = 20;

          // Capa: foto do mapa com o caminho de cada dia numa cor, + legenda dos dias
          if (mapSnapshotRef.current) {
            try {
              const canvas = await html2canvas(mapSnapshotRef.current, { useCORS: true, scale: 2, logging: false });
              const imgData = canvas.toDataURL('image/png');
              const imgWidth = pageWidth - 30;
              const imgHeight = (canvas.height / canvas.width) * imgWidth;

              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(22);
              pdf.setTextColor(27, 94, 60);
              pdf.text('Sua Rota Perfeita', pageWidth / 2, 20, { align: 'center' });
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(12);
              pdf.setTextColor(120, 120, 120);
              pdf.text('Foz do Iguaçu - o caminho do seu roteiro, dia a dia', pageWidth / 2, 28, { align: 'center' });

              pdf.addImage(imgData, 'PNG', 15, 36, imgWidth, imgHeight);

              let legendY = 36 + imgHeight + 12;
              pdf.setFontSize(11);
              route.forEach((dayPlan, idx) => {
                const { r, g, b } = hexToRgb(DAY_COLORS[idx % DAY_COLORS.length]);
                pdf.setFillColor(r, g, b);
                pdf.rect(17, legendY - 3.5, 8, 3, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(60, 60, 60);
                pdf.text(`Dia ${dayPlan.day} - ${WEEKDAY_LABELS[dayPlan.weekday] || ''}`, 29, legendY);
                legendY += 6;
              });

              pdf.addPage();
            } catch (mapError) {
              console.error('Error capturing route map for PDF cover:', mapError);
            }
          }

          // Título Principal
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(22);
          pdf.setTextColor(214, 210, 204); // --accent-gold aprox
          pdf.text('Sua Rota Perfeita - Foz do Iguaçu', 105, yOffset, { align: 'center' });
          yOffset += 15;

          route.forEach((dayPlan, index) => {
            // Verifica quebra de página
            if (yOffset > pageHeight - 30) {
              pdf.addPage();
              yOffset = 20;
            }

            // Cabeçalho do Dia
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.setTextColor(245, 158, 11); // Laranja/Ouro
            const weekdayLabel = WEEKDAY_LABELS[dayPlan.weekday] || '';
            pdf.text(`Dia ${dayPlan.day} - ${weekdayLabel}`, 20, yOffset);
            yOffset += 10;

            const periods = [
              { name: 'Manhã', places: dayPlan.manha, color: [96, 165, 250] }, // Azul
              { name: 'Tarde', places: dayPlan.tarde, color: [251, 169, 76] }, // Laranja
              { name: 'Noite', places: dayPlan.noite, color: [129, 140, 248] } // Roxo
            ];

            periods.forEach(period => {
              if (period.places && period.places.length > 0) {
                if (yOffset > pageHeight - 40) {
                  pdf.addPage();
                  yOffset = 20;
                }

                // Nome do período
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(14);
                pdf.setTextColor(period.color[0], period.color[1], period.color[2]);
                pdf.text(period.name, 25, yOffset);
                yOffset += 8;

                period.places.forEach(place => {
                  if (yOffset > pageHeight - 30) {
                    pdf.addPage();
                    yOffset = 20;
                  }

                  // Nome do Local e Categoria
                  pdf.setFont('helvetica', 'bold');
                  pdf.setFontSize(12);
                  pdf.setTextColor(0, 0, 0); // Preto
                  pdf.text(`• ${place.name}`, 30, yOffset);
                  
                  // Detalhes (Endereço, Zona)
                  pdf.setFont('helvetica', 'normal');
                  pdf.setFontSize(10);
                  pdf.setTextColor(100, 100, 100);
                  const details = `${place.category.replace(/_/g, ' ')} | ${place.zone} | ${place.address}`;
                  yOffset += 5;
                  pdf.text(details, 35, yOffset);

                  // Descrição (Quebra de linha automática)
                  yOffset += 5;
                  const lines = pdf.splitTextToSize(place.description || '', 150);
                  pdf.setTextColor(80, 80, 80);
                  pdf.text(lines, 35, yOffset);
                  
                  yOffset += (lines.length * 5) + 5;
                });
                
                yOffset += 2; // Espaçamento extra entre os períodos
              }
            });
            yOffset += 5; // Espaçamento extra entre os dias
          });

          pdf.save('meu_roteiro_foz_do_iguacu.pdf');
        } catch (error) {
          console.error('Error generating PDF:', error);
          alert('Houve um erro ao gerar o PDF. Por favor, tente novamente.');
        }
      }
      setTimeout(() => setModalStage(null), 1000); // Espera um pouco antes de fechar
    }, 500);
  };

  // Monta um roteiro completo. `avoidIds` são os locais já usados na outra opção: o
  // gerador evita repeti-los, mas só enquanto houver alternativa na categoria — algumas
  // (café da manhã, por exemplo) têm poucos lugares, e é melhor repetir um do que
  // devolver um período vazio na segunda opção.
  const buildItinerary = (scoredPlaces, dailyBudget, avoidIds = new Set()) => {
    // Separate places by category (they remain sorted by score)
    const cafes = scoredPlaces.filter(p => p.category === 'cafe_da_manha');
    const passeios = scoredPlaces.filter(p => p.category === 'passeios');
    const restaurantes = scoredPlaces.filter(p => p.category === 'restaurantes');
    const bares = scoredPlaces.filter(p => p.category === 'bares');
    const cafeterias = scoredPlaces.filter(p => p.category === 'cafeterias_docerias');

    let generatedDays = [];
    let usedIds = new Set();

    const getNextPlace = (pool, { preferredZone = null, periodKey = null, dayIndex = null, isFoot = false, strictProximity = false, maxPrice = null, fromCoords = null, maxLegKm = null } = {}) => {
      let available = pool.filter(p => !usedIds.has(p.id));
      if (available.length === 0) return null;

      // 1. Só considera locais abertos no horário/dia planejados
      if (periodKey && dayIndex !== null) {
        available = filterAvailable(available, periodKey, dayIndex);
      }

      // 1a. Segunda opção: descarta o que a primeira já usou, desde que sobre alguém.
      if (avoidIds.size > 0) {
        const fresh = available.filter(p => !avoidIds.has(p.id));
        if (fresh.length > 0) available = fresh;
      }

      // 1b. A pé: o trecho até o próximo local precisa caber no que sobrou do limite diário
      // de caminhada. Sem candidato viável, o período fica sem essa parada — é preferível a
      // devolver um roteiro que o usuário não consegue fazer andando.
      if (maxLegKm != null && fromCoords) {
        available = available.filter(p => haversineDistanceKm(fromCoords, getPlaceCoordinates(p)) <= maxLegKm);
        if (available.length === 0) return null;
        // Mais perto primeiro: aproveita melhor o limite e cabe mais parada no mesmo dia.
        available = [...available].sort((a, b) =>
          haversineDistanceKm(fromCoords, getPlaceCoordinates(a)) - haversineDistanceKm(fromCoords, getPlaceCoordinates(b))
        );
      }

      // Dentre os candidatos, prioriza os que cabem no orçamento restante do dia (quando há um definido).
      const fitsBudget = (p) => maxPrice == null || priceOf(p) <= maxPrice;

      // 2. Prioriza proximidade (mesma zona do local anterior no roteiro)
      if (preferredZone) {
        let zoneMatches = available.filter(p => p.zone === preferredZone);
        let match = zoneMatches.find(fitsBudget) || zoneMatches[0];
        if (match) {
          usedIds.add(match.id);
          return match;
        }
        // Restaurantes sempre tentam um "hub" central antes de ignorar a proximidade;
        // as demais categorias só fazem isso quando o deslocamento é a pé.
        if (strictProximity || isFoot) {
          let centroMatches = available.filter(p => p.zone === 'Centro');
          let centro = centroMatches.find(fitsBudget) || centroMatches[0];
          if (centro) {
            usedIds.add(centro.id);
            return centro;
          }
        }
      }

      let selected = available.find(fitsBudget) || available[0];
      usedIds.add(selected.id);
      return selected;
    };

    for (let i = 0; i < days; i++) {
      let isFoot = profile.transport === 'ape';
      let dayIndex = (startDay + i) % 7;
      let remainingBudget = dailyBudget;

      const spend = (place) => {
        if (remainingBudget != null && place) remainingBudget = Math.max(0, remainingBudget - priceOf(place));
      };

      // A pé, o dia tem um "orçamento" de quilômetros além do de dinheiro; de carro/app, não.
      let remainingKm = isFoot ? FOOT_DAILY_LIMIT_KM : null;
      let lastCoords = null;

      // Marca o local como visitado no trajeto e desconta do limite diário de caminhada.
      const walk = (place) => {
        if (!place) return;
        const coords = getPlaceCoordinates(place);
        if (remainingKm != null && lastCoords) {
          remainingKm = Math.max(0, remainingKm - haversineDistanceKm(lastCoords, coords));
        }
        lastCoords = coords;
      };

      let mCafe = getNextPlace(cafes, { periodKey: 'manha', dayIndex });
      walk(mCafe);
      let mPasseio = getNextPlace(passeios, { preferredZone: mCafe?.zone, periodKey: 'manha', dayIndex, isFoot, maxPrice: remainingBudget, fromCoords: lastCoords, maxLegKm: remainingKm });
      spend(mPasseio);
      walk(mPasseio);

      let primaryZone = mPasseio?.zone || mCafe?.zone;

      // Restaurantes seguem preço (já aplicado pelo score) + proximidade do local anterior, sempre.
      let tRest = getNextPlace(restaurantes, { preferredZone: primaryZone, periodKey: 'tarde', dayIndex, isFoot, strictProximity: true, maxPrice: remainingBudget, fromCoords: lastCoords, maxLegKm: remainingKm });
      spend(tRest);
      walk(tRest);
      let tPasseio = getNextPlace(passeios, { preferredZone: tRest?.zone || primaryZone, periodKey: 'tarde', dayIndex, isFoot, maxPrice: remainingBudget, fromCoords: lastCoords, maxLegKm: remainingKm })
        || getNextPlace(cafeterias, { preferredZone: tRest?.zone || primaryZone, periodKey: 'tarde', dayIndex, isFoot, fromCoords: lastCoords, maxLegKm: remainingKm });
      spend(tPasseio);
      walk(tPasseio);

      let newPrimaryZone = tPasseio?.zone || tRest?.zone || primaryZone;

      let nLugar = (i % 2 === 0 && bares.filter(p => !usedIds.has(p.id)).length > 0)
        ? getNextPlace(bares, { preferredZone: newPrimaryZone, periodKey: 'noite', dayIndex, isFoot, fromCoords: lastCoords, maxLegKm: remainingKm })
        : getNextPlace(restaurantes, { preferredZone: newPrimaryZone, periodKey: 'noite', dayIndex, isFoot, strictProximity: true, maxPrice: remainingBudget, fromCoords: lastCoords, maxLegKm: remainingKm });
      spend(nLugar);
      walk(nLugar);

      const dayPlaces = [mCafe, mPasseio, tRest, tPasseio, nLugar].filter(Boolean);
      const estimatedCost = dayPlaces.reduce((sum, p) => sum + priceOf(p), 0);

      generatedDays.push({
        day: i + 1,
        weekday: dayIndex,
        manha: [mCafe, mPasseio].filter(Boolean),
        tarde: [tRest, tPasseio].filter(Boolean),
        noite: [nLugar].filter(Boolean),
        // Ambos por pessoa, como os preços do catálogo. A tela multiplica pelo número
        // de viajantes quando precisa mostrar o valor do grupo.
        dailyBudget,
        estimatedCost
      });
    }

    return generatedDays;
  };

  const generateRoute = () => {
    // Os preços do catálogo são por pessoa ("~R$ 90 / pessoa", "R$ 30 / ingresso"), então
    // o orçamento total precisa ser dividido pelos dias E pelo número de viajantes para
    // virar o teto de gasto de uma pessoa num dia — que é com o que os preços se comparam.
    const dailyBudget = profile.totalBudget && days > 0 && travelers > 0
      ? Number(profile.totalBudget) / days / travelers
      : null;
    const scoringProfile = { ...profile, travelers, budget: budgetTierFromDaily(dailyBudget) };
    const scoredPlaces = scorePlaces(places, scoringProfile);

    // Duas opções para a pessoa escolher: a segunda evita os lugares da primeira.
    const optionA = buildItinerary(scoredPlaces, dailyBudget);
    const idsA = new Set(collectPlaceIds(optionA));
    const optionB = buildItinerary(scoredPlaces, dailyBudget, idsA);

    setRouteOptions([optionA, optionB]);
    setSelectedRouteIndex(0);
    generationIdRef.current = Date.now();
    setChosenId(null);

    // Track the generated route for the admin observatory
    trackRouteGenerated(scoringProfile, optionA, days, startDay);

    if (profile.totalBudget) {
      localStorage.setItem('rotavis_total_budget', profile.totalBudget.toString());
    } else {
      const totalEstimated = optionA.reduce((acc, day) => acc + day.estimatedCost, 0);
      localStorage.setItem('rotavis_total_budget', totalEstimated.toString());
    }

    // Mostra o loading screen; ele chama onComplete quando terminar
    setIsGenerating(true);
    // Show NPS popup after 3 seconds
    setTimeout(() => setShowNps(true), 3000);
  };

  // Gera 2 alternativas de roteiro curto para o horário livre de quem está em viagem de
  // trabalho. Devolve no MESMO formato do roteiro de passeio (lista de dias com manhã /
  // tarde / noite), só que com um dia e um período preenchido. É o que faz a tela de
  // resultado, o mapa, o PDF e o histórico funcionarem igual para os dois caminhos, em
  // vez de o trabalho ter uma tela própria pela metade.
  const generateWorkRoute = (period, timeAvailable) => {
    const scoredPlaces = scorePlaces(places, profile);
    const cats = WORK_POOL_BY_PERIOD[period];
    const pool = filterAvailable(scoredPlaces.filter(p => cats.includes(p.category)), period, startDay);
    const stops = WORK_STOPS[timeAvailable] || 1;
    const usedIds = new Set();

    const pickChain = () => {
      const chain = [];
      let preferredZone = null;
      for (let k = 0; k < stops; k++) {
        const candidates = pool.filter(p => !usedIds.has(p.id));
        if (candidates.length === 0) break;
        const pick = (preferredZone && candidates.find(p => p.zone === preferredZone)) || candidates[0];
        usedIds.add(pick.id);
        preferredZone = pick.zone;
        chain.push(pick);
      }
      return chain;
    };

    const toDays = (chain) => [{
      day: 1,
      weekday: startDay,
      manha: period === 'manha' ? chain : [],
      tarde: period === 'tarde' ? chain : [],
      noite: period === 'noite' ? chain : [],
      dailyBudget: null,
      estimatedCost: chain.reduce((sum, p) => sum + priceOf(p), 0)
    }];

    setRouteOptions([toDays(pickChain()), toDays(pickChain())]);
    setSelectedRouteIndex(0);
    generationIdRef.current = Date.now();
    setChosenId(null);
    setIsGenerating(true);
  };

  return (
    <>
      {/* Loading screen de IA — aparece quando a rota está sendo "gerada" */}
      <AnimatePresence>
        {isGenerating && (
          <RouteLoadingScreen
            onComplete={() => {
              setIsGenerating(false);
              setStep(9);
              // Sem isto a página fica onde estava, mostrando o fim do questionário, e o
              // roteiro nasce ~1500px abaixo da dobra. No celular parece que o "Gerar"
              // não fez nada. O rAF duplo espera o passo 9 estar no DOM para haver
              // destino para onde rolar.
              requestAnimationFrame(() => requestAnimationFrame(() => {
                resultRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
              }));
            }}
          />
        )}
      </AnimatePresence>

      <div className="container" style={{ padding: '60px 20px', minHeight: '80vh', position: 'relative' }}>
      {/* Anéis atrás do questionário, sobre a foto das Cataratas. pointerEvents none para
          não roubar clique dos botões do formulário — por isso também não usamos os modos
          de interação do componente (followMouse/clickBurst ficam desligados).
          Desligado inteiro em prefers-reduced-motion: é WebGL animando sem parar.

          Também desligado no celular: é enfeite que não se vê direito numa tela estreita
          e, em troca, mantém um contexto WebGL vivo o tempo todo atrás do formulário —
          bateria e memória que o aparelho não tem de sobra. */}
      {!prefersReducedMotion && !isSmallScreen && (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
        >
          <MagicRings
            color="#234832"
            colorTwo="#ca9023"
            ringCount={6}
            speed={0.5}
            attenuation={10}
            lineThickness={2}
            baseRadius={0.25}
            radiusStep={0.1}
            scaleRate={0.1}
            opacity={0.45}
            blur={0}
            noiseAmount={0}
            rotation={0}
            ringGap={1.5}
            fadeIn={0.7}
            fadeOut={0.5}
            followMouse={false}
            clickBurst={false}
          />
        </div>
      )}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px' }}>
        <h1 style={{ fontSize: 'clamp(1.9rem, 7vw, 3rem)', fontWeight: 800, marginBottom: '20px' }} className="text-gradient">
          Sua <span className="gold-gradient">Rota Perfeita</span>
        </h1>
        <p style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginBottom: '30px' }}>
          Conte-nos um pouco sobre você e criaremos um roteiro sob medida para a sua experiência em Foz do Iguaçu.
        </p>

        <WizardProgress step={step} reason={profile.reason} />

          {step === 1 && (
            <motion.div
              key="motivo"
              variants={wizardStep} initial="initial" animate="animate"
              className="liquid-glass wizard-card" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Qual o motivo da sua viagem?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
                <button
                  onClick={() => { setProfile({...profile, reason: 'trabalho'}); setStep(2); }}
                  className={`btn-glass wizard-option ${profile.reason === 'trabalho' ? 'active' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px' }}
                >
                  <Briefcase size={32} color="var(--green)" />
                  <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>Trabalho</span>
                </button>
                <button
                  onClick={() => { setProfile({...profile, reason: 'passeio'}); setStep(2); }}
                  className={`btn-glass wizard-option ${profile.reason === 'passeio' ? 'active' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px' }}
                >
                  <MapIcon size={32} color="var(--green)" />
                  <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>Passeio</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="origem"
              variants={wizardStep} initial="initial" animate="animate"
              className="liquid-glass wizard-card" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}><MapPinned size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />De onde você vem?</h2>

              {/* Escolha país */}
              <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '500px' }}>
                <button
                  onClick={() => setProfile({ ...profile, originCountry: 'brasil', origin: '', originState: '' })}
                  className={`btn-glass wizard-option ${profile.originCountry === 'brasil' ? 'active' : ''}`}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px' }}
                >
                  <CountryFlag country="Brasil" width={52} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Brasil</span>
                </button>
                <button
                  onClick={() => setProfile({ ...profile, originCountry: 'outro', origin: '', originState: '' })}
                  className={`btn-glass wizard-option ${profile.originCountry === 'outro' ? 'active' : ''}`}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px' }}
                >
                  <CountryFlag country="Outro" width={52} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Outro País</span>
                </button>
              </div>

              {/* Brasil → dropdown de estados */}
              {profile.originCountry === 'brasil' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}
                >
                  <label style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Qual estado?</label>
                  <StateSelect
                    value={profile.originState || ''}
                    onSelect={(uf) => setProfile({ ...profile, originState: uf, origin: uf })}
                  />
                  {profile.originState && (
                    <motion.button
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => setStep(3)}
                      className="btn-gold btn-wizard"
                      style={{ padding: '14px 30px' }}
                    >
                      Próximo <ChevronRight size={18} />
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* Outro País → lista da América Latina */}
              {profile.originCountry === 'outro' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ width: '100%', maxWidth: '540px', display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <label style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Qual país?</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                    {[
                      'Argentina', 'Paraguai', 'Uruguai', 'Chile',
                      'Bolívia', 'Peru', 'Colômbia', 'Venezuela',
                      'Equador', 'México', 'Cuba', 'Panamá',
                      'Costa Rica', 'Guiana', 'Suriname', 'Outro'
                    ].map(name => (
                      <button
                        key={name}
                        onClick={() => { setProfile({ ...profile, origin: name, originState: name }); setStep(3); }}
                        className={`btn-glass wizard-option ${profile.origin === name ? 'active' : ''}`}
                        style={{ padding: '10px 18px', borderRadius: '30px', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <CountryFlag country={name} width={20} /> {name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <button onClick={() => setStep(1)} className="btn-glass wizard-option">Voltar</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="grupo"
              variants={wizardStep} initial="initial" animate="animate"
              className="liquid-glass wizard-card" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}><Users size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Com quem você viaja?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', width: '100%' }}>
                {(profile.reason === 'trabalho'
                  ? [
                      { id: 'solo', label: 'Sozinho(a)', icon: MapIcon },
                      { id: 'colaboradores', label: 'Com Colaboradores', icon: Briefcase }
                    ]
                  : [
                      // Sem "Corporativo" aqui: viagem corporativa é o motivo "trabalho",
                      // que tem o seu próprio conjunto de opções logo acima.
                      { id: 'familia', label: 'Família', icon: Users },
                      { id: 'casal', label: 'Casal', icon: Heart },
                      { id: 'solo', label: 'Sozinho(a)', icon: MapIcon },
                      { id: 'amigos', label: 'Amigos', icon: Star }
                    ]
                ).map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleGroupTypeSelect(g.id)}
                    className={`btn-glass wizard-option ${profile.groupType === g.id ? 'active' : ''}`}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '25px' }}
                  >
                    <g.icon size={28} color="var(--green)" />
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>{g.label}</span>
                  </button>
                ))}
              </div>

              {/* Sozinho e casal já dizem quantas pessoas são, então avançam direto. Nos
                  demais o número é aberto, e ele importa: o orçamento é dividido por pessoa. */}
              {profile.groupType && !FIXED_GROUP_SIZES[profile.groupType] && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}
                >
                  <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>Quantas pessoas no total?</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                      onClick={() => setTravelers(n => Math.max(1, n - 1))}
                      disabled={travelers <= 1}
                      aria-label="Uma pessoa a menos"
                      className="btn-glass icon-btn"
                      style={{ borderRadius: '50%', opacity: travelers <= 1 ? 0.4 : 1 }}
                    >
                      <Minus size={18} />
                    </button>
                    <span style={{ fontSize: '2rem', fontWeight: 800, minWidth: '54px', textAlign: 'center', color: 'var(--green-dark)' }}>
                      {travelers}
                    </span>
                    <button
                      onClick={() => setTravelers(n => Math.min(20, n + 1))}
                      disabled={travelers >= 20}
                      aria-label="Uma pessoa a mais"
                      className="btn-glass icon-btn"
                      style={{ borderRadius: '50%', opacity: travelers >= 20 ? 0.4 : 1 }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Contando você. Usamos para dividir o orçamento por pessoa.
                  </p>
                  <button onClick={() => setStep(4)} className="btn-gold btn-wizard" style={{ padding: '13px 32px' }}>
                    Próximo <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}

              <button onClick={() => setStep(2)} className="btn-glass wizard-option" style={{ marginTop: '10px' }}>Voltar</button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="transporte"
              variants={wizardStep} initial="initial" animate="animate"
              className="liquid-glass wizard-card" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Como você vai se locomover?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
                <button 
                  onClick={() => { setProfile({...profile, transport: 'carro'}); setStep(5); }}
                  className={`btn-glass wizard-option ${profile.transport === 'carro' ? 'active' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px' }}
                >
                  <Car size={32} color="var(--green)" />
                  <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>Carro Próprio</span>
                </button>
                <button 
                  onClick={() => { setProfile({...profile, transport: 'ape'}); setStep(5); }}
                  className={`btn-glass wizard-option ${profile.transport === 'ape' ? 'active' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px' }}
                >
                  <Footprints size={32} color="var(--green)" />
                  <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>A pé / App</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-8px' }}>
                    Roteiro de até {FOOT_DAILY_LIMIT_KM} km por dia
                  </span>
                </button>
              </div>
              <button onClick={() => setStep(3)} className="btn-glass wizard-option" style={{ marginTop: '10px' }}>Voltar</button>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="interesses"
              variants={wizardStep} initial="initial" animate="animate"
              className="liquid-glass wizard-card" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Quais são os seus interesses? (Selecione vários)</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
                {INTEREST_OPTIONS.map(pref => (
                  <button
                    key={pref.id}
                    onClick={() => handlePreferenceToggle(pref.id)}
                    className={`btn-glass wizard-option ${profile.preferences.includes(pref.id) ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 25px', borderRadius: '30px' }}
                  >
                    <pref.icon size={18} color="var(--green)" />
                    {pref.label}
                  </button>
                ))}
              </div>

              {Object.keys(SUB_FILTERS).filter(parentId => profile.preferences.includes(parentId)).map(parentId => (
                <div key={parentId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '-15px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Refine {INTEREST_OPTIONS.find(p => p.id === parentId)?.label}:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                    {parentId === 'religiao' && (
                      <button
                        onClick={() => setProfile(prev => ({ ...prev, preferences: prev.preferences.filter(p => !SUB_FILTERS.religiao.some(s => s.id === p)) }))}
                        className={`btn-glass ${SUB_FILTERS.religiao.every(sub => !profile.preferences.includes(sub.id)) ? 'active' : ''}`}
                        style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem' }}
                      >
                        Ver todas
                      </button>
                    )}
                    {SUB_FILTERS[parentId].map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => handlePreferenceToggle(sub.id)}
                        className={`btn-glass ${profile.preferences.includes(sub.id) ? 'active' : ''}`}
                        style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem' }}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <button onClick={() => setStep(4)} className="btn-glass wizard-option">Voltar</button>
                <button onClick={() => setStep(6)} className="btn-gold btn-wizard" style={{ padding: '15px 30px' }}>Próximo <ChevronRight size={18} /></button>
              </div>
            </motion.div>
          )}

          {/* Trabalho continua com data única: quem vem trabalhar informa o dia e, em
              seguida, quanto tempo livre tem — não há intervalo a definir. */}
          {step === 6 && profile.reason === 'trabalho' && (
            <motion.div
              key="data-chegada"
              variants={wizardStep} initial="initial" animate="animate"
              className="liquid-glass wizard-card" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={24} /> Qual a data de chegada?
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '-15px', textAlign: 'center' }}>
                Usamos isso para só recomendar lugares abertos em cada dia do seu roteiro.
              </p>
              <DateCalendar
                value={arrivalDate}
                min={todayISO}
                onChange={handleArrivalChange}
              />
              {arrivalDate && (
                <p style={{ color: 'var(--green-dark)', fontWeight: 600, fontSize: '0.95rem', marginTop: '-10px', textAlign: 'center', textTransform: 'capitalize' }}>
                  {formatFullDate(arrivalDate)}
                </p>
              )}
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <button onClick={() => setStep(5)} className="btn-glass wizard-option">Voltar</button>
                <button
                  onClick={() => setStep(7)}
                  disabled={!arrivalDate}
                  className="btn-gold btn-wizard"
                  style={{ padding: '15px 30px', opacity: arrivalDate ? 1 : 0.5, cursor: arrivalDate ? 'pointer' : 'not-allowed' }}
                >
                  Próximo <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Passeio: ida e volta no mesmo calendário, em vez de duas telas. */}
          {step === 6 && profile.reason !== 'trabalho' && (
            <motion.div
              key="datas-viagem"
              variants={wizardStep} initial="initial" animate="animate"
              className="liquid-glass wizard-card" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={24} /> Quando você vai?
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '-15px', textAlign: 'center' }}>
                {!arrivalDate
                  ? 'Toque no dia da chegada e depois no da saída.'
                  : !departureDate
                    ? 'Agora toque no dia da saída.'
                    : 'Só recomendamos lugares abertos em cada dia do roteiro.'}
              </p>
              <DateCalendar
                range
                start={arrivalDate}
                end={departureDate}
                min={todayISO}
                onRangeChange={handleRangeChange}
              />
              <p style={{
                color: arrivalDate && departureDate ? 'var(--green-dark)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.95rem', marginTop: '-10px', textAlign: 'center',
                textTransform: 'capitalize', minHeight: '1.4em'
              }}>
                {arrivalDate && departureDate
                  ? `${formatShortDate(arrivalDate)} até ${formatShortDate(departureDate)} · ${days} ${days === 1 ? 'dia' : 'dias'}`
                  : arrivalDate
                    ? formatFullDate(arrivalDate)
                    : ''}
              </p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <button onClick={() => setStep(5)} className="btn-glass wizard-option">Voltar</button>
                <button
                  onClick={() => setStep(7)}
                  disabled={!arrivalDate || !departureDate}
                  className="btn-gold btn-wizard"
                  style={{
                    padding: '15px 30px',
                    opacity: arrivalDate && departureDate ? 1 : 0.5,
                    cursor: arrivalDate && departureDate ? 'pointer' : 'not-allowed'
                  }}
                >
                  Próximo <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 7 && profile.reason === 'trabalho' && (
            <motion.div
              key="duracao-trabalho"
              variants={wizardStep} initial="initial" animate="animate"
              className="liquid-glass wizard-card" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Quanto tempo livre você tem por dia para passear?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '-15px', textAlign: 'center' }}>
                Usamos isso para montar um roteiro curto que cabe entre os seus compromissos.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', width: '100%' }}>
                {WORK_DURATION_OPTIONS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { setProfile({ ...profile, timeAvailable: d.id }); setStep(8); }}
                    className={`btn-glass wizard-option ${profile.timeAvailable === d.id ? 'active' : ''}`}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '25px' }}
                  >
                    <d.icon size={28} color="var(--green)" />
                    <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{d.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(6)} className="btn-glass wizard-option" style={{ marginTop: '10px' }}>Voltar</button>
            </motion.div>
          )}

          {step === 8 && profile.reason === 'trabalho' && (
            <motion.div
              key="periodo-trabalho"
              variants={wizardStep} initial="initial" animate="animate"
              className="liquid-glass wizard-card" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Qual horário do dia você costuma ter livre?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', width: '100%' }}>
                {WORK_PERIOD_OPTIONS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setProfile({ ...profile, period: p.id }); generateWorkRoute(p.id, profile.timeAvailable); }}
                    className={`btn-glass wizard-option ${profile.period === p.id ? 'active' : ''}`}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '25px' }}
                  >
                    <p.icon size={28} color="var(--green)" />
                    <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{p.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(7)} className="btn-glass wizard-option" style={{ marginTop: '10px' }}>Voltar</button>
            </motion.div>
          )}

          {step === 7 && profile.reason !== 'trabalho' && (
            <motion.div
              key="orcamento-total"
              variants={wizardStep} initial="initial" animate="animate"
              className="liquid-glass wizard-card" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Qual o orçamento total da sua viagem?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '-15px', textAlign: 'center' }}>
                O valor de todo o grupo. Dividimos pelos {days} {days === 1 ? 'dia' : 'dias'}
                {travelers > 1 && <> e pelas {travelers} pessoas</>} para sugerir lugares que cabem no bolso.
              </p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Faixa larga porque o valor é do grupo inteiro e a viagem deixou de ter
                    teto de 5 dias: 18 dias em quatro pessoas passa fácil dos R$ 3.500 que
                    eram o máximo antes. */}
                {[500, 1000, 2000, 3500, 5000, 7500, 10000].map(val => (
                  <button
                    key={val}
                    onClick={() => setProfile({ ...profile, totalBudget: val })}
                    className={`btn-glass wizard-option ${profile.totalBudget === val ? 'active' : ''}`}
                    style={{ padding: '15px 20px', fontWeight: 500 }}
                  >
                    R$ {val.toLocaleString('pt-BR')}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Ou informe um valor:</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="R$"
                  className="input-field"
                  value={profile.totalBudget ?? ''}
                  onChange={(e) => setProfile({ ...profile, totalBudget: e.target.value === '' ? null : Number(e.target.value) })}
                  style={{ width: '140px', padding: '10px 12px', borderRadius: '8px', fontSize: '1rem' }}
                />
              </div>
              {profile.totalBudget > 0 && (
                <p style={{ color: 'var(--green-dark)', fontWeight: 600, textAlign: 'center', lineHeight: 1.6 }}>
                  ≈ R$ {Math.round(profile.totalBudget / days).toLocaleString('pt-BR')} por dia
                  {travelers > 1 && (
                    <>
                      <br />
                      <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        ou R$ {Math.round(profile.totalBudget / days / travelers).toLocaleString('pt-BR')} por pessoa, por dia
                      </span>
                    </>
                  )}
                </p>
              )}
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <button onClick={() => setStep(6)} className="btn-glass wizard-option">Voltar</button>
                <button onClick={generateRoute} className="btn-generate">
                  <span className="btn-generate__icon" aria-hidden="true">
                    <Calendar size={22} />
                  </span>
                  <span className="btn-generate__text">Gerar Meu Roteiro</span>
                </button>
              </div>
            </motion.div>
          )}
      </div>

      {step === 9 && route && (
        <motion.div
          ref={resultRef}
          variants={fadeUp}
          initial="initial"
          animate="animate"
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '860px', margin: '0 auto' }}
        >
          {/* Escolha entre as duas opções. Tudo abaixo (mapa, dias, PDF) segue a selecionada. */}
          {routeOptions && routeOptions.length > 1 && (
            <div className="liquid-glass" style={{ padding: 'clamp(16px, 3vw, 22px)', borderRadius: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' }}>
                {profile.reason === 'trabalho'
                  ? `2 roteiros para a sua ${PERIOD_LABELS[profile.period] || 'folga'}`
                  : 'Montamos 2 roteiros para você'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                {profile.reason === 'trabalho'
                  ? <>Pensados para {DURATION_LABELS[profile.timeAvailable]} livres, {weekdayComArtigo(startDay)}. Escolha um — dá para trocar quando quiser.</>
                  : 'Escolha o que combina mais com a sua viagem — dá para trocar quando quiser.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '14px' }}>
                {routeOptions.map((option, i) => {
                  const s = summarizeItinerary(option);
                  const isSelected = i === selectedRouteIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedRouteIndex(i)}
                      aria-pressed={isSelected}
                      className="wizard-option"
                      style={{
                        textAlign: 'left', cursor: 'pointer', padding: '16px 18px', borderRadius: '16px',
                        border: `2px solid ${isSelected ? 'var(--green)' : 'var(--card-border)'}`,
                        background: isSelected ? 'rgba(61, 155, 79, 0.07)' : 'var(--card-bg)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                          background: isSelected ? 'var(--green-dark)' : 'var(--card-highlight)',
                          color: isSelected ? '#fff' : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.8rem'
                        }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <strong style={{ fontSize: '1rem' }}>Roteiro {String.fromCharCode(65 + i)}</strong>
                        {isSelected && <CheckCircle2 size={16} color="var(--green)" style={{ marginLeft: 'auto' }} />}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        {s.stopCount} paradas · {formatDistanceKm(s.km)}<br />
                        ~R$ {Math.round(s.cost * travelers).toLocaleString('pt-BR')} no total
                        {travelers > 1 && ` (${travelers} pessoas)`}<br />
                        Destaque: {s.highlight}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="liquid-glass" style={{ padding: 'clamp(16px, 3vw, 24px)', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>
              Sua rota no mapa
            </h2>
            <RouteMapView route={route} mapRef={mapSnapshotRef} />
          </div>

          <div ref={routeRef} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {route.map((dayPlan, index) => {
              const periods = [
                { key: 'manha', label: 'Manhã', icon: Sun, color: 'var(--blue)', bg: 'rgba(30, 136, 229, 0.12)', places: dayPlan.manha },
                { key: 'tarde', label: 'Tarde', icon: Sunset, color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', places: dayPlan.tarde },
                { key: 'noite', label: 'Noite', icon: Moon, color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.12)', places: dayPlan.noite }
              ].filter(p => p.places.length > 0);

              const dayStops = [...dayPlan.manha, ...dayPlan.tarde, ...dayPlan.noite].filter(Boolean);
              const dayDistanceKm = totalRouteDistanceKm(dayStops.map(p => getPlaceCoordinates(p)));

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={stagger(index)}
                  style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid var(--card-border)', boxShadow: '0 6px 24px rgba(27, 94, 60, 0.07)', padding: 'clamp(18px, 4vw, 28px)' }}
                >
                  {/* Cabeçalho do dia, estilo recibo de viagem */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingBottom: '18px', marginBottom: '22px', borderBottom: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%', background: 'var(--green-dark)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0
                      }}>
                        {dayPlan.day}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>Dia {dayPlan.day}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{WEEKDAY_LABELS[dayPlan.weekday]}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {dayStops.length > 1 && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600,
                          padding: '6px 14px', borderRadius: '99px',
                          background: 'var(--card-highlight)', color: 'var(--green-dark)'
                        }}>
                          <Route size={13} />
                          {formatDistanceKm(dayDistanceKm)}
                        </div>
                      )}
                      {dayPlan.dailyBudget != null && (
                        <div
                          title={`~R$ ${Math.round(dayPlan.estimatedCost).toLocaleString('pt-BR')} por pessoa`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600,
                            padding: '6px 14px', borderRadius: '99px',
                            background: dayPlan.estimatedCost > dayPlan.dailyBudget ? 'rgba(220, 38, 38, 0.1)' : 'var(--accent-gold-glow)',
                            color: dayPlan.estimatedCost > dayPlan.dailyBudget ? '#dc2626' : 'var(--green-dark)'
                          }}
                        >
                          <Wallet size={13} />
                          ~R$ {Math.round(dayPlan.estimatedCost * travelers).toLocaleString('pt-BR')} de R$ {Math.round(dayPlan.dailyBudget * travelers).toLocaleString('pt-BR')}
                          {travelers > 1 && (
                            <span style={{ fontWeight: 500, opacity: 0.75 }}>
                              · {travelers} pessoas
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Linha do tempo do dia: um ponto por período, conectados por uma linha fina */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    {periods.map((period, pIdx) => (
                      <div key={period.key} style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: period.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            <period.icon size={15} color={period.color} />
                          </div>
                          {pIdx < periods.length - 1 && (
                            <div style={{ width: '2px', flex: 1, background: 'var(--card-border)', marginTop: '6px' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, paddingBottom: pIdx < periods.length - 1 ? '4px' : 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: period.color, marginBottom: '12px' }}>
                            {period.label}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
                            {period.places.map(place => place && (
                              <PlaceCard key={place.id} place={place} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {dayStops.length > 1 && (
                    <div style={{ marginTop: '22px', paddingTop: '20px', borderTop: '1px solid var(--card-border)' }}>
                      <DayRouteMap stops={dayStops} color={DAY_COLORS[index % DAY_COLORS.length]} />
                      <p style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 600, color: 'var(--green-dark)', marginTop: '10px' }}>
                        {formatDistanceKm(dayDistanceKm)} no trajeto do dia
                        {profile.transport === 'ape' && ` · a pé, dentro do limite de ${FOOT_DAILY_LIMIT_KM} km`}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setStep(1)} className="btn-glass" style={{ padding: '15px 32px', fontSize: '1rem' }}>
              Refazer Perfil
            </button>

            {/* Escolher = mandar para "Meus Roteiros". Antes isso acontecia sozinho na
                geração, o que guardava também as tentativas que a pessoa descartou. */}
            {isChosen ? (
              <>
                <span
                  role="status"
                  className="btn-glass"
                  style={{
                    padding: '15px 28px', fontSize: '1rem', fontWeight: 700,
                    borderColor: 'var(--green)', color: 'var(--green-dark)',
                    display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'default'
                  }}
                >
                  <CheckCircle2 size={18} /> Roteiro {String.fromCharCode(65 + selectedRouteIndex)} escolhido
                </span>
                <Link to="/meus-roteiros" className="btn-gold" style={{ padding: '15px 32px', fontSize: '1rem' }}>
                  Ver em Meus Roteiros <ChevronRight size={18} />
                </Link>
              </>
            ) : (
              <button onClick={handleChooseRoute} className="btn-gold" style={{ padding: '15px 32px', fontSize: '1rem' }}>
                <CheckCircle2 size={18} style={{ marginRight: '8px' }} />
                Escolher o roteiro {String.fromCharCode(65 + selectedRouteIndex)}
              </button>
            )}

            <button onClick={handleSaveRoute} className="btn-glass" style={{ padding: '15px 32px', fontSize: '1rem' }}>
              <Download size={18} style={{ marginRight: '8px' }} />
              Baixar PDF
            </button>
          </div>
        </motion.div>
      )}

      {/* MODAL DE CONFIRMAÇÃO / AGRADECIMENTO */}
      <AnimatePresence>
        {modalStage && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '20px'
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="liquid-glass" style={{ padding: '40px', maxWidth: '500px', width: '100%', textAlign: 'center', position: 'relative' }}
            >
              {modalStage === 'confirm' && (
                <>
                  <button
                    onClick={() => setModalStage(null)}
                    className="icon-btn"
                    aria-label="Fechar"
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={24} />
                  </button>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '20px' }} className="gold-gradient">Quase lá!</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '30px' }}>
                    Você deseja confirmar e baixar este roteiro perfeito para sua viagem a Foz do Iguaçu em PDF?
                  </p>
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button onClick={() => setModalStage(null)} className="btn-glass">Cancelar</button>
                    <button onClick={handleConfirmSave} className="btn-gold">Sim, Baixar PDF</button>
                  </div>
                </>
              )}

              {modalStage === 'thankyou' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={40} color="var(--green-dark)" />
                  </div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700 }} className="gold-gradient">Obrigado!</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Seu roteiro foi gerado com sucesso. O download iniciará em instantes... Aproveite Foz do Iguaçu!
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NPS Popup - Non-blocking */}
      <AnimatePresence>
        {showNps && npsScore === null && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            style={{
              position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
              maxWidth: '340px', width: '100%',
            }}
          >
            <div className="liquid-glass" style={{ padding: '24px', position: 'relative' }}>
              <button
                onClick={() => setShowNps(false)}
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
              <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '8px' }}>
                💬 Avalie sua experiência
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                De 0 a 10, o quanto você recomendaria Foz do Iguaçu para amigos e familiares?
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      trackNps(n);
                      setNpsScore(n);
                      setTimeout(() => setShowNps(false), 2000);
                    }}
                    className="btn-glass"
                    style={{
                      width: '36px', height: '36px', padding: 0,
                      fontSize: '0.85rem', fontWeight: 600, borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: n >= 9 ? 'rgba(31, 80, 57, 0.2)' : n >= 7 ? 'rgba(210, 172, 52, 0.15)' : 'rgba(244, 63, 94, 0.1)',
                      color: n >= 9 ? 'var(--green)' : n >= 7 ? '#d2ac34' : '#f43f5e'
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        {showNps && npsScore !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 60 }}
            style={{
              position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
              maxWidth: '340px', width: '100%',
            }}
          >
            <div className="liquid-glass" style={{ padding: '24px', textAlign: 'center' }}>
              <CheckCircle2 size={32} color="var(--green)" style={{ marginBottom: '8px' }} />
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>Obrigado pela avaliação! 🎉</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sua nota: <strong>{npsScore}/10</strong></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
    </>
  );
};

export default RouteGenerator;
