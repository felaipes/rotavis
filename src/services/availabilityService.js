export const WEEKDAY_LABELS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Janelas padrão de cada período do roteiro, em minutos desde 00:00
const PERIOD_WINDOWS = {
  manha: { start: 6 * 60, end: 12 * 60 },
  tarde: { start: 12 * 60, end: 18 * 60 },
  noite: { start: 18 * 60, end: 24 * 60 }
};

const parseTimeToMinutes = (str) => {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + (m || 0);
};

// Converte a string "09:00 às 17:00" / "24 horas" em { open, close } (minutos).
// Retorna null quando o local não informa horário — nesse caso ele é tratado como sempre disponível.
export const parseOpeningHours = (timeStr) => {
  if (!timeStr) return null;
  if (timeStr.toLowerCase().includes('24 hora')) return { open: 0, close: 24 * 60 };

  const match = timeStr.match(/(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/);
  if (!match) return null;

  const open = parseTimeToMinutes(match[1]);
  let close = parseTimeToMinutes(match[2]);
  if (close <= open) close += 24 * 60; // horário que cruza a meia-noite (ex: 18:00 às 00:00)

  return { open, close };
};

export const isOpenDuringPeriod = (place, periodKey) => {
  const window = PERIOD_WINDOWS[periodKey];
  if (!window) return true;

  const hours = parseOpeningHours(place.time);
  if (!hours) return true; // sem horário informado -> não excluir o local

  return hours.open < window.end && hours.close > window.start;
};

// place.daysOpen: array de índices (0=Domingo ... 6=Sábado). Ausente = aberto todos os dias.
export const isOpenOnDay = (place, dayIndex) => {
  if (!place.daysOpen) return true;
  return place.daysOpen.includes(dayIndex);
};

export const isPlaceAvailable = (place, periodKey, dayIndex) => {
  return isOpenOnDay(place, dayIndex) && isOpenDuringPeriod(place, periodKey);
};
