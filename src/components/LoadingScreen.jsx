import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = ({ onFinish }) => {
  const [skipHint, setSkipHint] = useState(false);
  const videoRef = useRef(null);
  const bgVideoRef = useRef(null);

  useEffect(() => {
    // Garante que a tela de carregamento nunca prenda o usuário caso o vídeo falhe.
    const safety = setTimeout(onFinish, 12000);
    return () => clearTimeout(safety);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      onClick={onFinish}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: '#000'
      }}
    >
      {/* Fundo desfocado com o próprio vídeo, preenchendo a tela e eliminando qualquer borda visível */}
      <video
        ref={bgVideoRef}
        src="/logo_animation.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(60px) saturate(1.3) brightness(1.05)',
          transform: 'scale(1.3)'
        }}
      />

      {/* Vídeo nítido em primeiro plano */}
      <video
        ref={videoRef}
        src="/logo_animation.mp4"
        autoPlay
        muted
        playsInline
        onEnded={onFinish}
        onTimeUpdate={() => {
          if (videoRef.current && videoRef.current.currentTime > 1.5) setSkipHint(true);
        }}
        style={{
          position: 'relative',
          width: 'min(70vw, 420px)',
          maxHeight: '60vh',
          objectFit: 'contain',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
          borderRadius: '4px'
        }}
      />

      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: skipHint ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'absolute',
          bottom: '40px',
          color: '#ffffff',
          textShadow: '0 1px 6px rgba(0, 0, 0, 0.5)',
          fontSize: '0.85rem',
          zIndex: 1
        }}
      >
        Toque para pular
      </motion.span>
    </motion.div>
  );
};

export default LoadingScreen;
