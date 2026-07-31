import React from 'react';

// Bandeiras desenhadas em SVG em vez de emoji (🇧🇷): o Windows não combina os dois
// "regional indicators" numa bandeira e acaba mostrando as letras do país ("BR", "AR"...).
// Traço simplificado, do tamanho de ícone em que aparecem — brasões complexos viram
// uma forma central, como em qualquer conjunto de bandeiras pequeno.

// Estrela de 5 pontas centrada na origem (raio 3), reaproveitada via transform.
const STAR = '0,-3 0.7,-0.95 2.85,-0.93 1.15,0.36 1.76,2.43 0,1.2 -1.76,2.43 -1.15,0.36 -2.85,-0.93 -0.7,-0.95';

const FLAGS = {
  Brasil: (
    <>
      <rect width="30" height="20" fill="#009B3A" />
      <polygon points="15,2.5 27.5,10 15,17.5 2.5,10" fill="#FEDF00" />
      <circle cx="15" cy="10" r="4.6" fill="#002776" />
      <path d="M11,9.3 Q15,12.6 19,9.3 L19,10.6 Q15,13.9 11,10.6 Z" fill="#ffffff" />
    </>
  ),
  Argentina: (
    <>
      <rect width="30" height="20" fill="#74ACDF" />
      <rect y="6.67" width="30" height="6.67" fill="#ffffff" />
      <circle cx="15" cy="10" r="2" fill="#F6B40E" />
    </>
  ),
  Paraguai: (
    <>
      <rect width="30" height="20" fill="#D52B1E" />
      <rect y="6.67" width="30" height="6.67" fill="#ffffff" />
      <rect y="13.33" width="30" height="6.67" fill="#0038A8" />
      <circle cx="15" cy="10" r="1.8" fill="#ffffff" stroke="#0038A8" strokeWidth="0.4" />
    </>
  ),
  Uruguai: (
    <>
      <rect width="30" height="20" fill="#ffffff" />
      <rect y="2.22" width="30" height="2.22" fill="#0038A8" />
      <rect y="6.67" width="30" height="2.22" fill="#0038A8" />
      <rect y="11.11" width="30" height="2.22" fill="#0038A8" />
      <rect y="15.56" width="30" height="2.22" fill="#0038A8" />
      <rect width="11.5" height="11.11" fill="#ffffff" />
      <circle cx="5.75" cy="5.55" r="2.2" fill="#F6B40E" />
    </>
  ),
  Chile: (
    <>
      <rect width="30" height="20" fill="#ffffff" />
      <rect y="10" width="30" height="10" fill="#D52B1E" />
      <rect width="10" height="10" fill="#0039A6" />
      <polygon points={STAR} fill="#ffffff" transform="translate(5,5) scale(0.95)" />
    </>
  ),
  'Bolívia': (
    <>
      <rect width="30" height="20" fill="#D52B1E" />
      <rect y="6.67" width="30" height="6.67" fill="#F9E300" />
      <rect y="13.33" width="30" height="6.67" fill="#007934" />
    </>
  ),
  'Peru': (
    <>
      <rect width="30" height="20" fill="#D91023" />
      <rect x="10" width="10" height="20" fill="#ffffff" />
    </>
  ),
  'Colômbia': (
    <>
      <rect width="30" height="20" fill="#FCD116" />
      <rect y="10" width="30" height="5" fill="#003893" />
      <rect y="15" width="30" height="5" fill="#CE1126" />
    </>
  ),
  Venezuela: (
    <>
      <rect width="30" height="20" fill="#FCD116" />
      <rect y="6.67" width="30" height="6.67" fill="#00247D" />
      <rect y="13.33" width="30" height="6.67" fill="#CF142B" />
      <polygon points={STAR} fill="#ffffff" transform="translate(15,10) scale(0.28)" />
    </>
  ),
  Equador: (
    <>
      <rect width="30" height="20" fill="#FFDD00" />
      <rect y="10" width="30" height="5" fill="#034EA2" />
      <rect y="15" width="30" height="5" fill="#ED1C24" />
      <circle cx="15" cy="10" r="2.2" fill="#ffffff" stroke="#8B6914" strokeWidth="0.35" />
    </>
  ),
  'México': (
    <>
      <rect width="30" height="20" fill="#006847" />
      <rect x="10" width="10" height="20" fill="#ffffff" />
      <rect x="20" width="10" height="20" fill="#CE1126" />
      <circle cx="15" cy="10" r="2" fill="#8B5A2B" />
    </>
  ),
  Cuba: (
    <>
      <rect width="30" height="20" fill="#ffffff" />
      <rect width="30" height="4" fill="#002A8F" />
      <rect y="8" width="30" height="4" fill="#002A8F" />
      <rect y="16" width="30" height="4" fill="#002A8F" />
      <polygon points="0,0 11.5,10 0,20" fill="#CF142B" />
      <polygon points={STAR} fill="#ffffff" transform="translate(3.8,10) scale(0.8)" />
    </>
  ),
  'Panamá': (
    <>
      <rect width="30" height="20" fill="#ffffff" />
      <rect x="15" width="15" height="10" fill="#DA121A" />
      <rect y="10" width="15" height="10" fill="#072357" />
      <polygon points={STAR} fill="#072357" transform="translate(7.5,5) scale(0.7)" />
      <polygon points={STAR} fill="#DA121A" transform="translate(22.5,15) scale(0.7)" />
    </>
  ),
  'Costa Rica': (
    <>
      <rect width="30" height="20" fill="#002B7F" />
      <rect y="3.33" width="30" height="13.33" fill="#ffffff" />
      <rect y="6.67" width="30" height="6.67" fill="#CE1126" />
    </>
  ),
  Guiana: (
    <>
      <rect width="30" height="20" fill="#009E49" />
      <polygon points="0,0 30,10 0,20" fill="#ffffff" />
      <polygon points="0,0 27,10 0,20" fill="#FCD116" />
      <polygon points="0,0 15,10 0,20" fill="#000000" />
      <polygon points="0,0 13,10 0,20" fill="#CE1126" />
    </>
  ),
  Suriname: (
    <>
      <rect width="30" height="20" fill="#377E3F" />
      <rect y="4" width="30" height="12" fill="#ffffff" />
      <rect y="6" width="30" height="8" fill="#B40A2D" />
      <polygon points={STAR} fill="#ECC81D" transform="translate(15,10) scale(0.75)" />
    </>
  ),
  // Sem bandeira própria: um globo, para "Outro" país.
  Outro: (
    <>
      <rect width="30" height="20" fill="#e8eef5" />
      <circle cx="15" cy="10" r="7" fill="#5b9bd5" />
      <path d="M8,10 h14 M15,3 a10 10 0 0 1 0 14 a10 10 0 0 1 0 -14" fill="none" stroke="#ffffff" strokeWidth="0.9" />
      <circle cx="15" cy="10" r="7" fill="none" stroke="#ffffff" strokeWidth="0.9" />
    </>
  )
};

const CountryFlag = ({ country, width = 22, style }) => {
  const art = FLAGS[country] || FLAGS.Outro;
  return (
    <svg
      viewBox="0 0 30 20"
      width={width}
      height={(width / 30) * 20}
      role="img"
      aria-label={`Bandeira: ${country}`}
      style={{ borderRadius: '2px', display: 'block', flexShrink: 0, boxShadow: '0 0 0 1px rgba(7,11,20,0.12)', ...style }}
    >
      {art}
    </svg>
  );
};

export default CountryFlag;
