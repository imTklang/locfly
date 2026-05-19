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
  if (/SUV.*ESPECIAL|ESPECIAL.*SUV|7 LUGAR/.test(s)) return 329.90;
  if (/SUV/.test(s)) return 289.90;
  if (/EXEC.*AUTO|AUTO.*EXEC/.test(s)) return 279.90;
  if (/EXEC/.test(s)) return 249.90;
  if (/INTER.*AUTO|AUTO.*INTER/.test(s)) return 154.90;
  if (/INTER/.test(s)) return 134.90;
  if (/ECON.*ESPECIAL|ESPECIAL.*ECON/.test(s)) return 109.90;
  if (/ECON.*SEDAN|SEDAN.*ECON/.test(s)) return 104.90;
  if (/ECON.*HATCH|HATCH.*ECON/.test(s)) return 97.90;
  if (/ECON/.test(s)) return 94.90;
  if (/COMPAC/.test(s)) return 89.90;
  return 99.90;
}

function mapTransmission(descricao: string): 'Manual' | 'Automático' {
  return /AUTO|AT|TURBO/i.test(descricao) ? 'Automático' : 'Manual';
}

function extractModel(descricaoVeiculoPadrao: string): string {
  const match = descricaoVeiculoPadrao.match(/similar a:\s*([^,]+)/i);
  if (match) {
    return match[1].trim().replace(/\s+\d+\.\d+.*$/, '').trim() + ' ou Similar';
  }
  return descricaoVeiculoPadrao.slice(0, 40);
}

export async function fetchLocalizaGrupos(): Promise<ScrapedOffer[]> {
  const collected: ScrapedOffer[] = [];

  const crawler = createHttpCrawler({
    requestHandler: async ({ body }) => {
      try {
        const data = JSON.parse(body.toString()) as { grupos?: GrupoCarros[] };
        const grupos = data.grupos ?? [];

        const standard = grupos.filter(
          (g) => !g.ehFast && !/BLINDADO|PRIME|HÍBRIDO|HYBRIDO/i.test(g.descricao)
        );

        const seen = new Set<string>();
        for (const g of standard) {
          const key = `${mapCategory(g.descricao)}-${mapPrice(g.descricao)}`;
          if (seen.has(key)) continue;
          seen.add(key);
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
