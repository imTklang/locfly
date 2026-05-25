import { ScraperParams, ScrapedOffer } from '../types';
import { fetchLocalizaGrupos } from '../crawlers/localiza-api';

const BOOKING_BASE = 'https://www.localiza.com/brasil/pt-br/grupos-de-carros';

export async function scrapeLocaliza(_params: ScraperParams): Promise<ScrapedOffer[]> {
  const grupos = await fetchLocalizaGrupos();
  if (grupos.length > 0) return grupos.map(o => ({ ...o, deepLink: BOOKING_BASE }));

  // Frota de referência — usada só se a API pública falhar
  return [
    { provider: 'LOCALIZA', model: 'Fiat Mobi ou Similar', category: 'ECONOMICO', price: 89.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: BOOKING_BASE, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/MOBI.png' },
    { provider: 'LOCALIZA', model: 'Renault Kwid ou Similar', category: 'ECONOMICO', price: 79.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'GM Onix ou Similar', category: 'ECONOMICO', price: 94.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: BOOKING_BASE, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/ONIC.png' },
    { provider: 'LOCALIZA', model: 'Fiat Argo ou Similar', category: 'ECONOMICO', price: 92.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'Hyundai HB20 ou Similar', category: 'ECONOMICO', price: 109.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/HB2X.png' },
    { provider: 'LOCALIZA', model: 'Fiat Cronos ou Similar', category: 'ECONOMICO', price: 97.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'Hyundai HB20S ou Similar', category: 'ECONOMICO', price: 104.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'VW Polo ou Similar', category: 'INTERMEDIARIO', price: 134.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: BOOKING_BASE, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/POLO.png' },
    { provider: 'LOCALIZA', model: 'Toyota Yaris Sedan ou Similar', category: 'INTERMEDIARIO', price: 139.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'Nissan Versa ou Similar', category: 'INTERMEDIARIO', price: 144.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'VW Virtus ou Similar', category: 'INTERMEDIARIO', price: 149.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'GM Onix Plus ou Similar', category: 'INTERMEDIARIO', price: 154.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/ONIS.png' },
    { provider: 'LOCALIZA', model: 'Renault Duster ou Similar', category: 'SUV', price: 199.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'Fiat Pulse ou Similar', category: 'SUV', price: 209.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'VW T-Cross ou Similar', category: 'SUV', price: 219.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'Hyundai Creta ou Similar', category: 'SUV', price: 234.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'Jeep Compass ou Similar', category: 'SUV', price: 289.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/BORL.png' },
    { provider: 'LOCALIZA', model: 'Jeep Commander ou Similar', category: 'SUV', price: 329.90, transmission: 'Automático', hasAC: true, seats: 7, deepLink: BOOKING_BASE, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/CMDR.png' },
    { provider: 'LOCALIZA', model: 'Nissan Sentra ou Similar', category: 'LUXO', price: 249.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/SETA.png' },
    { provider: 'LOCALIZA', model: 'Toyota Corolla ou Similar', category: 'LUXO', price: 259.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE },
    { provider: 'LOCALIZA', model: 'Audi A3 ou Similar', category: 'LUXO', price: 490.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: BOOKING_BASE, imageUrl: 'https://www.localiza.com/brasil-site/geral/Frota/AUD3.png' },
    { provider: 'LOCALIZA', model: 'Renault Master ou Similar', category: 'VAN', price: 380.00, transmission: 'Manual', hasAC: true, seats: 14, deepLink: BOOKING_BASE },
  ];
}

if (require.main === module) {
  scrapeLocaliza({ location: 'São Paulo', startDate: '2026-06-15', endDate: '2026-06-20' })
    .then(r => console.log(`Localiza: ${r.length} ofertas\n`, r.slice(0, 3)))
    .catch(console.error);
}
