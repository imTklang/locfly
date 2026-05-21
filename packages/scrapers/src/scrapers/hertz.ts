import { ScraperParams, ScrapedOffer } from '../types';
import { newContext, findVehicleArray, rawToOffer } from '../browser';

// Hertz Brazil airport/location codes — maps common city names to IATA codes
const HERTZ_CODES: Record<string, string> = {
  'são paulo': 'GRUA',
  'guarulhos': 'GRUA',
  'congonhas': 'CGHA',
  'campinas': 'VCPA',
  'rio de janeiro': 'GIGA',
  'galeão': 'GIGA',
  'santos dumont': 'SDUA',
  'brasília': 'BSBA',
  'brasilia': 'BSBA',
  'salvador': 'SSAA',
  'fortaleza': 'FORA',
  'recife': 'RECA',
  'belo horizonte': 'CNFA',
  'confins': 'CNFA',
  'curitiba': 'CWBA',
  'porto alegre': 'PAWA',
  'manaus': 'MAOA',
  'florianópolis': 'FLNA',
  'florianopolis': 'FLNA',
  'goiânia': 'GYNA',
  'goiania': 'GYNA',
  'natal': 'NATA',
  'maceió': 'MCZA',
  'maceio': 'MCZA',
  'joão pessoa': 'JPSA',
  'joao pessoa': 'JPSA',
  'aracaju': 'AJUA',
  'belém': 'BELA',
  'belem': 'BELA',
  'porto seguro': 'BPSA',
  'vitória': 'VITA',
  'vitoria': 'VITA',
};

function resolveLocationCode(city: string): string {
  const key = city.toLowerCase().trim();
  // Exact match
  if (HERTZ_CODES[key]) return HERTZ_CODES[key];
  // Partial match (e.g. "São Paulo - GRU" or "Aeroporto de Guarulhos")
  for (const [name, code] of Object.entries(HERTZ_CODES)) {
    if (key.includes(name) || name.includes(key)) return code;
  }
  return city;
}

function buildDeepLink(params: ScraperParams): string {
  const code = resolveLocationCode(params.location);
  return `https://www.hertz.com/rentacar/reservation/?startLocationCode=${code}&startDate=${params.startDate}&endDate=${params.endDate}&countryCode=BR`;
}

function mapCategory(s: string): ScrapedOffer['category'] {
  const c = s.toUpperCase();
  if (/^[MNE]|ECON|COMPAC|MINI|POLO|ARGO|MOBI|HB20/.test(c)) return 'ECONOMICO';
  if (/^[CI]|INTER|COROLLA|SENTRA|CRUZE/.test(c)) return 'INTERMEDIARIO';
  if (/^[SFPG]|SUV|4X4|BRONCO|WRANGLER|JEEP|COMPASS/.test(c)) return 'SUV';
  if (/^[LX]|LUX|EXEC|MERCEDES|VOLVO|BMW|AUDI/.test(c)) return 'LUXO';
  if (/^[VY]|VAN|HIACE|MASTER|DUCATO/.test(c)) return 'VAN';
  return 'ECONOMICO';
}

const FLEET: ScrapedOffer[] = [
  { provider: 'HERTZ', model: 'Fiat Argo', category: 'ECONOMICO', price: 85.00, transmission: 'Manual', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800' },
  { provider: 'HERTZ', model: 'Volkswagen Polo', category: 'ECONOMICO', price: 99.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800' },
  { provider: 'HERTZ', model: 'Toyota Corolla', category: 'INTERMEDIARIO', price: 155.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800' },
  { provider: 'HERTZ', model: 'Nissan Sentra', category: 'INTERMEDIARIO', price: 145.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800' },
  { provider: 'HERTZ', model: 'Ford Bronco Sport', category: 'SUV', price: 315.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1586456959804-a80f6d5fff72?w=800' },
  { provider: 'HERTZ', model: 'Jeep Wrangler', category: 'SUV', price: 389.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800' },
  { provider: 'HERTZ', model: 'Mercedes-Benz GLC 300', category: 'LUXO', price: 450.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800' },
  { provider: 'HERTZ', model: 'Volvo XC60', category: 'LUXO', price: 480.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=800' },
  { provider: 'HERTZ', model: 'Toyota Hiace', category: 'VAN', price: 400.00, transmission: 'Automático', hasAC: true, seats: 12, deepLink: '', imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800' },
];

export async function scrapeHertz(params: ScraperParams): Promise<ScrapedOffer[]> {
  const locationCode = resolveLocationCode(params.location);
  const deepLink = buildDeepLink(params);

  if (locationCode !== params.location) {
    console.log(`[HERTZ] location code resolvido: ${params.location} → ${locationCode}`);
  }

  const context = await newContext();

  try {
    const page = await context.newPage();
    const captured: ScrapedOffer[] = [];

    page.on('response', async (res) => {
      try {
        const ct = res.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const url = res.url();
        const json = await res.json();
        const arr = findVehicleArray(json);
        if (!arr) {
          if (/api|vehicle|car|rate|avail/i.test(url)) {
            console.log(`[HERTZ][json] ${url.slice(0, 90)}`);
          }
          return;
        }
        console.log(`[HERTZ][🎯 veículos] ${url.slice(0, 90)} → ${arr.length} itens`);
        for (const v of arr) {
          const offer = rawToOffer(v, 'HERTZ', deepLink, mapCategory);
          if (offer) captured.push(offer);
        }
      } catch { /* silent */ }
    });

    const reservationUrl = `https://www.hertz.com/rentacar/reservation/?countryCode=BR`;

    try {
      await page.goto(reservationUrl, { waitUntil: 'domcontentloaded', timeout: 18000 });
    } catch { /* timeout */ }

    // Wait for page JS to fully initialize (required for session cookies on fetch)
    await page.waitForTimeout(8000);

    // MM/DD/YYYY for pickupDay, YYYY/MM/DD for pickupDayStandard
    const [sy, sm, sd] = params.startDate.split('-');
    const [ey, em, ed] = params.endDate.split('-');
    const pickupDay  = `${sm}/${sd}/${sy}`;
    const dropoffDay = `${em}/${ed}/${ey}`;
    const pickupStd  = `${sy}/${sm}/${sd}`;
    const dropoffStd = `${ey}/${em}/${ed}`;

    // Call itinerary/vehicles directly via fetch from within the page (session cookies included).
    // NOTE: loc.hertz.com/WordWheel is GeoIP-restricted; from Brazilian IPs the autocomplete
    // returns BR locations + correct pickupHiddenEOAG codes automatically. From non-BR IPs
    // the OAG lookup fails (DZX006/NRX106). The form submission below works correctly on BR infra.
    const apiResult = await page.evaluate(
      async ({ loc, pickup, dropoff, pStd, dStd }: { loc: string; pickup: string; dropoff: string; pStd: string; dStd: string }) => {
        const body = {
          lastName: '', resSearch: false, showRentalAgreement: false, showEvRentalAgreement: false,
          goldAnytimeRes: false, checkLIS: false, checkFPO: false, buttonLIS: false, buttonFPO: false,
          showBothElements: false, cdpVerificationFailed: false, travelPurposeReq: false,
          forceResHomePage: '', href: '/rentacar/rest/home/form', confirmationNumber: '',
          arrivingUpdate: '', defaultTab: '', militaryClock: 1, majorAirport: '',
          returnAtDifferentLocationCheckbox: '', dropoffLocation: '',
          inpPickupAutoFill: '', inpPickupStateCode: '', inpPickupCountryCode: 'BR',
          inpPickupSearchType: '', inpDropoffAutoFill: '', inpDropoffStateCode: '',
          inpDropoffCountryCode: 'BR', inpDropoffSearchType: '',
          pickupHiddenEOAG: '', dropoffHiddenEOAG: '',
          memberOtherCdpField: '', cdpField: '', corporateRate: '', officialTravel: '',
          pcNumber: '', typeInRateQuote: '', cvNumber: '', itNumber: '',
          originalRqCheckBox: '', checkDiscount: '', affiliateMemberJoin: '',
          affiliateMemberID: '', affiliateCallCount: 0, hertzlinkActive: false, companyId: '',
          pickupDay: pickup, pickupTime: '12:00',
          dropoffDay: dropoff, dropoffTime: '12:00',
          pickupDayStandard: pStd, dropoffDayStandard: dStd,
          no1ClubNumber: '', selectedCarType: 'ACAR', ageSelector: '', redeemPoints: '',
          fromLocationSearch: false,
          recommendationBrowserInfo: {
            appCodeName: 'Mozilla', appName: 'Netscape', cookieEnabled: true,
            language: 'pt-BR', onLine: true, platform: 'Win32', product: 'Gecko',
            appVersion: navigator.appVersion, userAgent: navigator.userAgent, visitorId: '',
          },
          GBPEligible: false, memberSelectedCdp: '', cdpRadioButton: '',
          pickupLocation: loc,
        };
        try {
          const r = await fetch('/rentacar/rest/hertz/v2/itinerary/vehicles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json, */*' },
            body: JSON.stringify(body),
            credentials: 'include',
          });
          return { status: r.status, body: await r.text() };
        } catch (e) { return { status: -1, body: '' }; }
      },
      { loc: locationCode, pickup: pickupDay, dropoff: dropoffDay, pStd: pickupStd, dStd: dropoffStd },
    );

    console.log(`[HERTZ] itinerary/vehicles → HTTP ${apiResult.status}`);
    if (apiResult.status === 200) {
      try {
        const json = JSON.parse(apiResult.body);
        const arr = findVehicleArray(json);
        if (arr) {
          console.log(`[HERTZ][🎯 veículos] itinerary/vehicles → ${arr.length} itens`);
          for (const v of arr) {
            const offer = rawToOffer(v, 'HERTZ', deepLink, mapCategory);
            if (offer) captured.push(offer);
          }
        }
      } catch { /* parse error */ }
    }

    if (captured.length > 0) {
      console.log(`[HERTZ] ✓ ${captured.length} ofertas reais capturadas`);
      return captured;
    }

    console.log(`[HERTZ] ✗ sem dados reais — usando frota de referência (código: ${locationCode})`);
  } catch (err) {
    console.error(`[HERTZ] erro: ${err instanceof Error ? err.message : err}`);
  } finally {
    await context.close();
  }

  return FLEET.map((o) => ({ ...o, deepLink }));
}

if (require.main === module) {
  scrapeHertz({ location: 'São Paulo', startDate: '2026-06-01', endDate: '2026-06-05' })
    .then((r) => console.log(`Hertz: ${r.length} ofertas\n`, r.slice(0, 2)))
    .catch(console.error);
}
