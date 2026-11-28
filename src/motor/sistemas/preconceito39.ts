/**
 * VIDA 39 · o preconceito do dia a dia (ver `dados39/preconceito`). Uma vez por ano, a vida pode trazer um episódio de
 * preconceito contra quem ela é, no país onde vive. O sorteio usa semente própria (`rngDe`), por ano, e não consome o
 * acaso principal da vida: as outras partes do jogo não mudam por causa dele.
 *
 *   MARCADORES  → de onde a pessoa vem e como é lida (cidade natal, ascendência, gênero, classe, nacionalidade)
 *   CHANCE      → um episódio por ano no máximo; mais marcadores, um pouco mais de chance
 *   EFEITO      → estresse sobe, felicidade cai (na proporção da intensidade); a família ou um amigo pode ouvir e apoiar
 *   MEMÓRIA     → o primeiro episódio de cada tipo entra na biografia; os seguintes, no cotidiano
 *
 * Só para quem tem 12 anos ou mais (o texto é de vida adulta ou de adolescência). Sem decisão: o episódio acontece e
 * deixa marca; o que a pessoa faz com ele é o resto da vida.
 */
import type { Marcador39 } from '../dados39/preconceito';
import { EPISODIOS39, type Episodio39 } from '../dados39/preconceito';
import { ancestralidadeDe } from './identidade';
import { municipio } from '../dados/lugares';
import { escrever, idade, lembrarCom, vinculosVivos } from '../nucleo';
import { clamp, rngDe } from '../rng';
import type { Vida } from '../tipos';
import { registrarGanchoDoAno39 } from './ganchosDoAno39';

/** Os estados do Mezzogiorno (códigos Istat da região), onde está o "sul italiano" de que se fala. */
const SUL_DA_ITALIA = new Set(['65', '67', '72', '75', '77', '78', '82', '88']);

/** O país onde a pessoa vive hoje (pela cidade da moradia), ou `undefined` se não se sabe. */
export function paisDeResidencia39(v: Vida): string | undefined {
  try { return municipio(v.moradia.municipioId).pais; } catch { return undefined; }
}

/** Os marcadores que esta vida carrega, na leitura do jogo (sem sorteio). */
export function marcadoresDe39(v: Vida): Marcador39[] {
  const out: Marcador39[] = [];
  let natal: ReturnType<typeof municipio> | undefined;
  try { natal = municipio(v.eu.municipioNatal); } catch { natal = undefined; }
  if (natal?.pais === 'BR' && natal.regiao === 'Nordeste') out.push('nordestino');
  if (natal?.pais === 'IT' && natal.uf && SUL_DA_ITALIA.has(natal.uf)) out.push('sulista');
  if ((ancestralidadeDe(v.eu).af ?? 0) >= 0.4) out.push('negro');
  if (v.eu.genero === 'feminino') out.push('mulher');
  if (v.origem.classe === 'vulneravel' || v.origem.classe === 'trabalhadora') out.push('classe_baixa');
  const pais = paisDeResidencia39(v);
  const nacional = v.eu.nacionalidades?.[0];
  if (pais && nacional && nacional !== pais) out.push('estrangeiro');
  return out;
}

const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** O processamento do ano: sorteia no máximo um episódio entre os que valem para este país e estes marcadores. */
export function processarPreconceito39(v: Vida): void {
  if (idade(v) < 12) return;
  const pais = paisDeResidencia39(v);
  if (!pais) return;
  const marcadores = marcadoresDe39(v);
  const pool: Episodio39[] = EPISODIOS39.filter(e => e.pais === pais && marcadores.includes(e.marcador));
  if (!pool.length) return;
  const g = rngDe(v.id, 'preconceito39', v.t);
  const chance = Math.min(0.45, 0.2 + 0.05 * (marcadores.length - 1));
  if (!g.chance(chance)) return;
  const ep = g.pick(pool);
  const chave = `preconceito39_${ep.marcador}`;
  const vezes = (v.fatos[chave] ?? 0) as number;
  v.fatos[chave] = vezes + 1;

  // Efeito: a cabeça pesa na proporção da intensidade.
  v.mente.estresse = clamp(v.mente.estresse + 2 + ep.intensidade * 2);
  v.mente.felicidade = clamp(v.mente.felicidade - ep.intensidade * 2);

  // Apoio: alguém próximo que ouve (a família, um amigo). Não é garantido — depende da proximidade.
  let texto = ep.texto;
  const proximos = vinculosVivos(v).filter(x => x.vin.proximidade >= 50);
  if (ep.apoio && proximos.length && g.chance(0.5)) {
    const { p, vin } = g.pick(proximos);
    vin.confianca = clamp(vin.confianca + 2);
    texto = `${ep.texto} ${maiuscula(ep.apoio)}`;
    lembrarCom(v, p.id, 'Ouviu do que você passou e disse que estava do seu lado.', 'apoio', 2);
  }

  escrever(v, {
    texto,
    relevancia: vezes === 0 ? 'biografia' : 'cotidiano',
    tema: ep.tema === 'trabalho' ? 'trabalho' : ep.tema === 'lugar' ? 'lugar' : ep.tema === 'amizade' ? 'amizade' : 'lazer',
    tom: 'ruim',
  });
}

registrarGanchoDoAno39((v) => processarPreconceito39(v));
