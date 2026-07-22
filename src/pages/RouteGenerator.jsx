import React, { useState, useRef } from 'react';
import { places } from '../data';
import { Calendar, CheckCircle2, ChevronRight, Sun, Sunset, Moon, Briefcase, Map as MapIcon, Wallet, Star, Coffee, Tent, History, Utensils, GlassWater, Car, Footprints, Download, X, Activity, Rocket, Clock } from 'lucide-react';

import { jsPDF } from 'jspdf';
import PlaceCard from '../components/PlaceCard';
import { motion, AnimatePresence } from 'framer-motion';
import { scorePlaces } from '../services/recommendationService';
import { WEEKDAY_LABELS, WEEKDAY_SHORT, isPlaceAvailable, isOpenOnDay } from '../services/availabilityService';

const RouteGenerator = () => {
  const [days, setDays] = useState(1);
  const [startDay, setStartDay] = useState(new Date().getDay());
  const [route, setRoute] = useState(null);
  const [step, setStep] = useState(1);
  const [modalStage, setModalStage] = useState(null);
  const routeRef = useRef(null);
  const [profile, setProfile] = useState({
    reason: '',
    budget: '',
    transport: '',
    preferences: []
  });

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
    
    // Pequeno atraso para garantir que a interface atualize para 'thankyou' antes do processamento pesado
    setTimeout(() => {
      if (route) {
        try {
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pageHeight = pdf.internal.pageSize.getHeight();
          let yOffset = 20;

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

  const generateRoute = () => {
    // Score and sort places based on user profile
    const scoredPlaces = scorePlaces(places, profile);

    // Separate places by category (they remain sorted by score)
    const cafes = scoredPlaces.filter(p => p.category === 'cafe_da_manha');
    const passeios = scoredPlaces.filter(p => p.category === 'passeios');
    const restaurantes = scoredPlaces.filter(p => p.category === 'restaurantes');
    const bares = scoredPlaces.filter(p => p.category === 'bares');
    const cafeterias = scoredPlaces.filter(p => p.category === 'cafeterias_docerias');

    let generatedDays = [];
    let usedIds = new Set();

    // Filtra o grupo de locais pelos que estão abertos no período/dia-da-semana pedidos.
    // Se ninguém do grupo estiver disponível (caso raro), relaxa a exigência em vez de deixar o dia vazio.
    const filterAvailable = (pool, periodKey, dayIndex) => {
      const openNow = pool.filter(p => isPlaceAvailable(p, periodKey, dayIndex));
      if (openNow.length > 0) return openNow;
      const openToday = pool.filter(p => isOpenOnDay(p, dayIndex));
      return openToday.length > 0 ? openToday : pool;
    };

    const getNextPlace = (pool, { preferredZone = null, periodKey = null, dayIndex = null, isFoot = false, strictProximity = false } = {}) => {
      let available = pool.filter(p => !usedIds.has(p.id));
      if (available.length === 0) return null;

      // 1. Só considera locais abertos no horário/dia planejados
      if (periodKey && dayIndex !== null) {
        available = filterAvailable(available, periodKey, dayIndex);
      }

      // 2. Prioriza proximidade (mesma zona do local anterior no roteiro)
      if (preferredZone) {
        let match = available.find(p => p.zone === preferredZone);
        if (match) {
          usedIds.add(match.id);
          return match;
        }
        // Restaurantes sempre tentam um "hub" central antes de ignorar a proximidade;
        // as demais categorias só fazem isso quando o deslocamento é a pé.
        if (strictProximity || isFoot) {
          let centro = available.find(p => p.zone === 'Centro');
          if (centro) {
            usedIds.add(centro.id);
            return centro;
          }
        }
      }

      let selected = available[0];
      usedIds.add(selected.id);
      return selected;
    };

    for (let i = 0; i < days; i++) {
      let isFoot = profile.transport === 'ape';
      let dayIndex = (startDay + i) % 7;

      let mCafe = getNextPlace(cafes, { periodKey: 'manha', dayIndex });
      let mPasseio = getNextPlace(passeios, { preferredZone: mCafe?.zone, periodKey: 'manha', dayIndex, isFoot });

      let primaryZone = mPasseio?.zone || mCafe?.zone;

      // Restaurantes seguem preço (já aplicado pelo score) + proximidade do local anterior, sempre.
      let tRest = getNextPlace(restaurantes, { preferredZone: primaryZone, periodKey: 'tarde', dayIndex, isFoot, strictProximity: true });
      let tPasseio = getNextPlace(passeios, { preferredZone: tRest?.zone || primaryZone, periodKey: 'tarde', dayIndex, isFoot })
        || getNextPlace(cafeterias, { preferredZone: tRest?.zone || primaryZone, periodKey: 'tarde', dayIndex, isFoot });

      let newPrimaryZone = tPasseio?.zone || tRest?.zone || primaryZone;

      let nLugar = (i % 2 === 0 && bares.filter(p => !usedIds.has(p.id)).length > 0)
        ? getNextPlace(bares, { preferredZone: newPrimaryZone, periodKey: 'noite', dayIndex, isFoot })
        : getNextPlace(restaurantes, { preferredZone: newPrimaryZone, periodKey: 'noite', dayIndex, isFoot, strictProximity: true });

      generatedDays.push({
        day: i + 1,
        weekday: dayIndex,
        manha: [mCafe, mPasseio].filter(Boolean),
        tarde: [tRest, tPasseio].filter(Boolean),
        noite: [nLugar].filter(Boolean)
      });
    }

    setRoute(generatedDays);
    setStep(8);
  };

  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px' }}>
        <h1 style={{ fontSize: 'clamp(1.9rem, 7vw, 3rem)', fontWeight: 800, marginBottom: '20px' }} className="text-gradient">
          Sua <span className="gold-gradient">Rota Perfeita</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '40px' }}>
          Conte-nos um pouco sobre você e criaremos um roteiro sob medida para a sua experiência em Foz do Iguaçu.
        </p>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="liquid-glass" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Qual o motivo da sua viagem?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
                <button 
                  onClick={() => { setProfile({...profile, reason: 'trabalho'}); setStep(2); }}
                  className={`btn-glass ${profile.reason === 'trabalho' ? 'active' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px' }}
                >
                  <Briefcase size={32} color="var(--green)" />
                  <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>Trabalho</span>
                </button>
                <button 
                  onClick={() => { setProfile({...profile, reason: 'passeio'}); setStep(2); }}
                  className={`btn-glass ${profile.reason === 'passeio' ? 'active' : ''}`}
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
              key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="liquid-glass" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Como é o seu orçamento?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', width: '100%' }}>
                {[
                  { id: 'economico', label: 'Econômico (Até R$ 50)', icon: Wallet },
                  { id: 'conforto', label: 'Conforto (R$ 50 - 150)', icon: CheckCircle2 },
                  { id: 'luxo', label: 'Luxo (+ R$ 150)', icon: Star }
                ].map(b => (
                  <button 
                    key={b.id}
                    onClick={() => { setProfile({...profile, budget: b.id}); setStep(3); }}
                    className={`btn-glass ${profile.budget === b.id ? 'active' : ''}`}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '25px' }}
                  >
                    <b.icon size={28} color="var(--green)" />
                    <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{b.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="btn-glass" style={{ marginTop: '10px' }}>Voltar</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3_transport"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="liquid-glass" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Como você vai se locomover?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
                <button 
                  onClick={() => { setProfile({...profile, transport: 'carro'}); setStep(4); }}
                  className={`btn-glass ${profile.transport === 'carro' ? 'active' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px' }}
                >
                  <Car size={32} color="var(--green)" />
                  <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>Carro Próprio</span>
                </button>
                <button 
                  onClick={() => { setProfile({...profile, transport: 'ape'}); setStep(4); }}
                  className={`btn-glass ${profile.transport === 'ape' ? 'active' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '30px' }}
                >
                  <Footprints size={32} color="var(--green)" />
                  <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>A pé / App</span>
                </button>
              </div>
              <button onClick={() => setStep(2)} className="btn-glass" style={{ marginTop: '10px' }}>Voltar</button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="liquid-glass" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Quais são os seus interesses? (Selecione vários)</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
                {[
                  { id: 'cafe', label: 'Café', icon: Coffee },
                  { id: 'natureza', label: 'Natureza', icon: Tent },
                  { id: 'historico', label: 'História', icon: History },
                  { id: 'comidinhas', label: 'Gastronomia', icon: Utensils },
                  { id: 'bebidas', label: 'Vida Noturna', icon: GlassWater },
                  { id: 'familia', label: 'Família', icon: Sun },
                  { id: 'religiao', label: 'Religioso', icon: Star },
                  { id: 'esporte', label: 'Aventura/Esportes', icon: Activity },
                  { id: 'compras', label: 'Compras/Fronteira', icon: Rocket }
                ].map(pref => (
                  <button 
                    key={pref.id}
                    onClick={() => handlePreferenceToggle(pref.id)}
                    className={`btn-glass ${profile.preferences.includes(pref.id) ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 25px', borderRadius: '30px' }}
                  >
                    <pref.icon size={18} color="var(--green)" />
                    {pref.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <button onClick={() => setStep(3)} className="btn-glass">Voltar</button>
                <button onClick={() => setStep(5)} className="btn-gold" style={{ padding: '15px 30px' }}>Próximo <ChevronRight size={18} /></button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5_weekday"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="liquid-glass" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Em que dia da semana você chega?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '-15px', textAlign: 'center' }}>
                Usamos isso para só recomendar lugares abertos em cada dia do seu roteiro.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {WEEKDAY_SHORT.map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => setStartDay(idx)}
                    className={`btn-glass ${startDay === idx ? 'active' : ''}`}
                    style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <button onClick={() => setStep(4)} className="btn-glass">Voltar</button>
                <button onClick={() => setStep(6)} className="btn-gold" style={{ padding: '15px 30px' }}>Próximo <ChevronRight size={18} /></button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6_days"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="liquid-glass" style={{ padding: 'clamp(20px, 6vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Quantos dias você ficará em Foz do Iguaçu?</h2>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => setDays(num)}
                    className={`btn-glass ${days === num ? 'active' : ''}`}
                    style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 'bold' }}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <button onClick={() => setStep(5)} className="btn-glass">Voltar</button>
                <button onClick={generateRoute} className="btn-gold" style={{ padding: '15px 40px', fontSize: '1.1rem' }}>
                  <Calendar style={{ marginRight: '10px' }} />
                  Gerar Meu Roteiro
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step === 8 && route && (
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}
        >
          <div ref={routeRef} style={{ background: 'var(--primary-dark)', padding: '20px', borderRadius: '20px' }}>
            {route.map((dayPlan, index) => (
            <div key={index} style={{ borderLeft: '2px dashed var(--glass-border)', paddingLeft: 'clamp(24px, 8vw, 40px)', position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                left: '-21px', 
                top: 0, 
                background: 'var(--primary-dark)',
                padding: '10px'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: 'var(--accent-gold)', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--green-dark)',
                  fontWeight: 'bold',
                  boxShadow: '0 0 15px var(--accent-gold-glow)'
                }}>
                  {dayPlan.day}
                </div>
              </div>

              <h2 style={{ fontSize: '2rem', marginBottom: '5px' }} className="gold-gradient">
                Dia {dayPlan.day}
              </h2>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '25px' }}>
                <Clock size={15} /> {WEEKDAY_LABELS[dayPlan.weekday]}
              </p>

              {/* Manhã */}
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', marginBottom: '20px', color: 'var(--blue)' }}>
                  <Sun size={24} /> Manhã
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '20px' }}>
                  {dayPlan.manha.map(place => place && (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              </div>

              {/* Tarde */}
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', marginBottom: '20px', color: '#d97706' }}>
                  <Sunset size={24} /> Tarde
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '20px' }}>
                  {dayPlan.tarde.map(place => place && (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              </div>

              {/* Noite */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', marginBottom: '20px', color: '#4f46e5' }}>
                  <Moon size={24} /> Noite
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '20px' }}>
                  {dayPlan.noite.map(place => place && (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              </div>
            </div>
          ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button onClick={() => setStep(1)} className="btn-glass" style={{ padding: '15px 40px', fontSize: '1.1rem' }}>
              Refazer Perfil
            </button>
            <button onClick={handleSaveRoute} className="btn-gold" style={{ padding: '15px 40px', fontSize: '1.1rem' }}>
              <Download style={{ marginRight: '10px' }} />
              Salvar Meu Roteiro
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

    </div>
  );
};

export default RouteGenerator;
