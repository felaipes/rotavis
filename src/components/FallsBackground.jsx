import React from 'react';
import { useReducedMotion } from 'framer-motion';

// Fundo do site inteiro: as Cataratas atrás de todas as telas. Fixo (não rola com a
// página), atrás de todo o conteúdo, sem capturar cliques.
//
// Duas camadas: a foto, com um zoom lento que dá o movimento, e um véu creme por cima.
// O véu não é enfeite — é o que garante contraste do texto que fica direto sobre a foto.
// Como agora o fundo vale para o site todo, o véu foi calibrado contra os 5% mais
// escuros da imagem inteira (pedra molhada, mata na sombra), que é o pior caso possível
// atrás de um texto. Ver os tokens de cor no index.css, calibrados junto com ele.
const FallsBackground = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <img
        src="/hero_cataratas.jpg"
        alt=""
        className={`falls-bg ${reduceMotion ? '' : 'falls-bg--drifting'}`}
      />
      <div className="falls-scrim" />
    </div>
  );
};

export default FallsBackground;
