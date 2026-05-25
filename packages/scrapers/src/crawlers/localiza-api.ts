import { createHttpCrawler } from './base';
import { ScrapedOffer } from '../types';

const LOCALIZA_GRUPOS_URL =
  'https://canaisdigitais-api.localiza.com/sitelocaliza-api-netcore/v1/GruposCarros/Brasil/resumo?ota=false';

interface GrupoCarros {
  codigo: string;
  descricao: string;
  descricaoVeiculoPadrao: string;
  urlImagem: string;
  ehFast: boolean;
}

function mapCategory(descricao: string): ScrapedOffer['category'] {
  const s = descricao.toUpperCase();
  if (/COMPAC|ECON/.test(s)) return 'ECONOMICO';
  if (/INTER/.test(s)) return 'INTERMEDIARIO';
  if (/SUV|7 LUGAR/.test(s)) return 'SUV';
  if (/EXEC|LUX|PRIM|HÍBRID/.test(s)) return 'LUXO';
  return 'ECONOMICO';
}

function mapPrice(descricao: string): number {
  const s = descricao.toUpperCase();
  if (/PRIME/.test(s)) return 490;
  if (/BLINDAD/.test(s)) return 450;
  if (/HÍBRID|HYBRIDO/.test(s)) return 390;
  if (/GRAND\s*CHEROKEE|CAYENNE|MACAN/.test(s)) return 590;
  if (/SUV.*ESPECIAL|ESPECIAL.*SUV|7 LUGAR|COMMANDER|SW4/.test(s)) return 329.90;
  if (/\bSUV\b|COMPASS|RENEGADE|DUSTER|T.CROSS|CRETA|PULSE|TRACKER|KICKS|KARDIAN|NIVUS/.test(s)) return 219.90;
  if (/EXEC.*AUTO|AUTO.*EXEC|COROLLA|CIVIC|SENTRA/.test(s)) return 279.90;
  if (/EXEC/.test(s)) return 249.90;
  if (/INTER.*AUTO|AUTO.*INTER|VIRTUS|YARIS|VERSA|CITY|HB20S/.test(s)) return 154.90;
  if (/INTER/.test(s)) return 134.90;
  if (/ECON.*ESPECIAL|ESPECIAL.*ECON/.test(s)) return 109.90;
  if (/ECON.*SEDAN|SEDAN.*ECON|CRONOS|HB20S/.test(s)) return 104.90;
  if (/ECON.*HATCH|HATCH.*ECON|HB20\b|ARGO/.test(s)) return 97.90;
  if (/ECON/.test(s)) return 94.90;
  if (/COMPAC|MOBI|KWID/.test(s)) return 89.90;
  return 99.90;
}

function mapTransmission(descricao: string): 'Manual' | 'Automático' {
  return /AUTO|AT|TURBO/i.test(descricao) ? 'Automático' : 'Manual';
}

function extractModel(descricaoVeiculoPadrao: string): string {
  // API returns both Portuguese ("similar a:") and English ("similar to:")
  const match = descricaoVeiculoPadrao.match(/similar (?:a|to):\s*([^,\n]+)/i);
  if (match) {
    return match[1].trim().replace(/\s+\d+\.\d+.*$/, '').trim() + ' ou Similar';
  }
  // Fallback: strip "Vehicle similar to:" prefix if present
  const cleaned = descricaoVeiculoPadrao.replace(/^Vehicle similar to:\s*/i, '').trim();
  return cleaned.slice(0, 40);
}

export async function fetchLocalizaGrupos(): Promise<ScrapedOffer[]> {
  const collected: ScrapedOffer[] = [];

  const crawler = createHttpCrawler({
    requestHandler: async ({ body }) => {
      try {
        const data = JSON.parse(body.toString()) as { grupos?: GrupoCarros[] };
        const grupos = data.grupos ?? [];

        const seen = new Set<string>();
        for (const g of grupos) {
          if (seen.has(g.codigo)) continue;
          seen.add(g.codigo);
          collected.push({
            provider: 'LOCALIZA',
            model: extractModel(g.descricaoVeiculoPadrao),
            category: mapCategory(g.descricao),
            price: mapPrice(g.descricao),
            transmission: mapTransmission(g.descricao),
            hasAC: true,
            seats: /7 LUGAR/i.test(g.descricao) ? 7 : 5,
            deepLink: '',
            imageUrl: g.urlImagem,
          });
        }
      } catch {
        // silent — caller handles empty result
      }
    },
  });

  await crawler.run([LOCALIZA_GRUPOS_URL]);
  return collected;
}

if (require.main === module) {
  fetchLocalizaGrupos()
    .then((r) => console.log(`Localiza grupos via Crawlee: ${r.length} ofertas\n`, r.slice(0, 3)))
    .catch(console.error);
}
