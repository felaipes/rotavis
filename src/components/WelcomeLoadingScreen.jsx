import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MapPin, Route, Sparkles } from 'lucide-react';

const WELCOME_TIPS = [
  'Gere um roteiro personalizado em menos de 1 minuto!',
  'Marque os locais que já visitou direto pelo app.',
  'O mapa te mostra a melhor ordem de visitar cada ponto.',
  'Acompanhe seus gastos dia a dia na Minha Carteira.',
];

const FloatingIcon = ({ Icon, style }) => (
  <motion.div
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
    style={{
      position: 'absolute',
      opacity: 0.08,
      ...style,
    }}
  >
    <Icon size={style.size || 40} color="var(--green-dark)" />
  </motion.div>
);

const WelcomeLoadingScreen = ({ userName, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    // Tip rotation
    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % WELCOME_TIPS.length);
    }, 1200);

    // Progress bar
    let p = 0;
    const progressInterval = setInterval(() => {
      p += 2;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(progressInterval);
        setTimeout(() => onComplete?.(), 300);
      }
    }, 30);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--primary-dark)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Floating decorative icons */}
      <FloatingIcon Icon={MapPin}  style={{ top: '12%',  left: '8%',  size: 48 }} />
      <FloatingIcon Icon={Route}   style={{ top: '18%',  right: '10%', size: 38 }} />
      <FloatingIcon Icon={Map}     style={{ bottom: '15%', left: '12%', size: 44 }} />
      <FloatingIcon Icon={Sparkles} style={{ bottom: '20%', right: '8%',  size: 36 }} />

      {/* Large background circle */}
      <div style={{
        position: 'absolute',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27,94,60,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', maxWidth: '400px', width: '100%', padding: '0 24px' }}>

        {/* Logo + pulsing ring */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.05, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              width: '110px', height: '110px', borderRadius: '50%',
              border: '2px solid var(--green)',
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.04, 0.12] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }}
            style={{
              position: 'absolute',
              width: '140px', height: '140px', borderRadius: '50%',
              border: '1.5px solid var(--accent-gold)',
            }}
          />
          <img src="/logo.png" alt="RotaVis" style={{ height: '70px', mixBlendMode: 'multiply', position: 'relative', zIndex: 1 }} />
        </div>

        {/* Welcome text */}
        <div style={{ textAlign: 'center' }}>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}
          >
            Bem-vindo{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}
          >
            Preparando sua experiência{dots}
          </motion.p>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            height: '6px',
            background: 'rgba(0,0,0,0.07)',
            borderRadius: '99px',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              style={{
                height: '100%', borderRadius: '99px',
                background: 'linear-gradient(90deg, var(--green-dark), var(--green), var(--accent-gold))',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '50%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* Rotating tips */}
        <div style={{
          width: '100%',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '16px 20px',
          minHeight: '56px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--green-dark), var(--green))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: '0.83rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4 }}
            >
              💡 {WELCOME_TIPS[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
};

export default WelcomeLoadingScreen;
