// Coordenadas aproximadas de cada região/zona usada em data.js. Baseadas em referências
// reais (Centro, Avenida das Cataratas, Parque Nacional, Itaipu, Ponte da Amizade), com
// estimativa razoável para zonas sem um ponto de referência público exato.
export const ZONE_COORDINATES = {
  'Centro': [-25.5163, -54.5852],
  "Loteamento Sant'Ana": [-25.5051, -54.5747],
  'Vila Portes': [-25.5006, -54.5701],
  'Vila Yolanda': [-25.5459, -54.5548],
  'Avenida das Cataratas': [-25.5815, -54.5282],
  'Rodovia das Cataratas': [-25.5980, -54.5010],
  'Parque Nacional': [-25.6139, -54.4791],
  'Porto Meira': [-25.5545, -54.6075],
  'Fronteira': [-25.5057, -54.6007],
  'Itaipu': [-25.4085, -54.5878],
  'Zona Rural': [-25.4550, -54.6500],
  'Diversas': [-25.5163, -54.5852],
  'Todas': [-25.5163, -54.5852]
};

// Espalha levemente os lugares de uma mesma zona ao redor do ponto central, de forma
// determinística (mesmo lugar sempre cai no mesmo ponto), para não empilhar todos os
// marcadores exatamente na mesma coordenada.
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

export const getPlaceCoordinates = (place) => {
  const base = ZONE_COORDINATES[place.zone] || ZONE_COORDINATES['Centro'];
  const hash = hashString(place.id);
  const angle = (hash % 360) * (Math.PI / 180);
  const radius = 0.006 + ((hash % 100) / 100) * 0.008; // ~600m a ~1.4km de variação
  return [
    base[0] + Math.sin(angle) * radius,
    base[1] + Math.cos(angle) * radius
  ];
};
