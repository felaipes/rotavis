import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Brain, Thermometer, Navigation, Route, Sparkles } from 'lucide-react';

const LOADING_STEPS = [
  {
    icon: Brain,
    title: 'Analisando suas preferências...',
    subtitle: 'Processando seu perfil de viajante',
    color: 'var(--green-dark)',
    duration: 1400,
  },
  {
    icon: Thermometer,
    title: 'Consultando condições climáticas...',
    subtitle: 'Verificando previsão dos próximos dias em Foz',
    color: 'var(--blue)',
    duration: 1200,
  },
  {
    icon: Navigation,
    title: 'Calculando rotas otimizadas...',
    subtitle: 'Agrupando locais por proximidade e período',
    color: '#8b5cf6',
    duration: 1300,
  },
  {
    icon: MapPin,
    title: 'Selecionando os melhores locais...',
    subtitle: 'Cruzando avaliações, horários e seu orçamento',
    color: 'var(--accent-gold)',
    duration: 1100,
  },
  {
    icon: Sparkles,
    title: 'Finalizando seu roteiro perfeito...',
    subtitle: 'Tudo pronto para uma experiência inesquecível!',
    color: 'var(--green)',
    duration: 800,
  },
];

const TOTAL_DURATION = LOADING_STEPS.reduce((sum, s) => sum + s.duration, 0);

// Spinner SVG animado
const SpinnerRing = ({ color, size = 80, strokeWidth = 4 }) => {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top: 0, left: 0 }}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(0,0,0,0.07)"
        strokeWidth={strokeWidth}
      />
      {/* Spinner arc */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${c * 0.25} ${c * 0.75}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
      />
    </svg>
  );
};

// Barras de progresso de loading (estilo terminal / AI)
const AIProgressBar = ({ progress, color }) => (
  <div style={{
    width: '100%',
    height: '6px',
    background: 'rgba(0,0,0,0.07)',
    borderRadius: '99px',
    overflow: 'hidden',
    position: 'relative',
  }}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        height: '100%',
        borderRadius: '99px',
        background: `linear-gradient(90deg, ${color}aa, ${color})`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer effect */}
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '60%', height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
        }}
      />
    </motion.div>
  </div>
);

// Bolinha de ponto pulsante (estilo "online")
const PulseDot = ({ color }) => (
  <div style={{ position: 'relative', width: 10, height: 10 }}>
    <motion.div
      animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      style={{
        position: 'absolute', inset: 0,
        background: color, borderRadius: '50%',
      }}
    />
    <div style={{
      position: 'absolute', inset: 2,
      background: color, borderRadius: '50%',
    }} />
  </div>
);

const RouteLoadingScreen = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0); // % dentro do step atual
  const [overallProgress, setOverallProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    let stepIndex = 0;
    let elapsed = 0;

    const advance = () => {
      if (stepIndex >= LOADING_STEPS.length) {
        onComplete?.();
        return;
      }

      const step = LOADING_STEPS[stepIndex];
      const stepStart = elapsed;
      const stepEnd = elapsed + step.duration;
      const intervalMs = 40;

      const intervalId = setInterval(() => {
        const now = Date.now();
        // Use a local timer reference
        const localElapsed = (now - startTime);
        const withinStep = Math.min(1, (localElapsed - stepStart) / step.duration);
        const overall = Math.min(100, ((stepStart + withinStep * step.duration) / TOTAL_DURATION) * 100);

        setStepProgress(Math.round(withinStep * 100));
        setOverallProgress(Math.round(overall));

        if (withinStep >= 1) {
          clearInterval(intervalId);
          setCompletedSteps(prev => [...prev, stepIndex]);
          elapsed = stepEnd;
          stepIndex++;
          setCurrentStepIndex(stepIndex);
          if (stepIndex < LOADING_STEPS.length) {
            advance();
          } else {
            setOverallProgress(100);
            setTimeout(() => onComplete?.(), 350);
          }
        }
      }, intervalMs);
    };

    const startTime = Date.now();
    advance();
  }, []);

  const currentStep = LOADING_STEPS[Math.min(currentStepIndex, LOADING_STEPS.length - 1)];
  const CurrentIcon = currentStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--primary-dark)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Decorative background blobs */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-8%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27,94,60,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-8%',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(242,183,10,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>

        {/* Logo */}
        <motion.img
          src="/logo.png"
          alt="RotaVis"
          style={{ height: '52px', mixBlendMode: 'multiply' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        />

        {/* Icon spinner */}
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <SpinnerRing color={currentStep.color} size={100} strokeWidth={5} />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25 }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `${currentStep.color}14`,
                border: `1.5px solid ${currentStep.color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CurrentIcon size={28} color={currentStep.color} strokeWidth={1.8} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step title & subtitle */}
        <div style={{ textAlign: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${currentStepIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                {currentStepIndex < LOADING_STEPS.length ? currentStep.title : LOADING_STEPS[LOADING_STEPS.length - 1].title}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                {currentStepIndex < LOADING_STEPS.length ? currentStep.subtitle : LOADING_STEPS[LOADING_STEPS.length - 1].subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Overall progress bar */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PulseDot color="var(--green)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Gerando roteiro...
              </span>
            </div>
            <motion.span
              key={overallProgress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--green-dark)' }}
            >
              {overallProgress}%
            </motion.span>
          </div>
          <AIProgressBar progress={overallProgress} color="var(--green)" />
        </div>

        {/* Step checklist */}
        <div style={{
          width: '100%',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {LOADING_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const isDone = completedSteps.includes(i);
            const isActive = i === currentStepIndex && !isDone;
            const isPending = i > currentStepIndex;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                {/* Step indicator */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isDone
                    ? `linear-gradient(135deg, var(--green-dark), var(--green))`
                    : isActive ? `${step.color}18` : 'var(--card-highlight)',
                  border: `1.5px solid ${isDone ? 'var(--green)' : isActive ? step.color : 'var(--card-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}>
                  {isDone ? (
                    <motion.svg
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      width="14" height="14" viewBox="0 0 14 14" fill="none"
                    >
                      <path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  ) : (
                    <StepIcon
                      size={13}
                      color={isActive ? step.color : 'var(--text-muted)'}
                      strokeWidth={2}
                    />
                  )}
                </div>

                {/* Step text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '0.82rem',
                    fontWeight: isDone || isActive ? 600 : 400,
                    color: isDone ? 'var(--green-dark)' : isActive ? 'var(--text-main)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {step.title.replace('...', '')}
                  </p>
                </div>

                {/* Active step mini-progress */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      fontSize: '0.7rem', fontWeight: 700,
                      color: step.color, flexShrink: 0,
                    }}
                  >
                    {stepProgress}%
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom tip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}
        >
          💡 Dica: Você pode marcar os locais visitados na aba "Sua Rota" durante a viagem!
        </motion.p>

      </div>
    </motion.div>
  );
};

export default RouteLoadingScreen;
