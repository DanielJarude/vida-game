// ERAS v4 — saves para o QA da interface: vidas históricas em que a sociedade pesa (a mulher casada no Brasil de 1955, o
// homem negro na Geórgia de 1958 com mandato e uma reforma aprovada, a fiel da igreja na RDA, a sufragista inglesa, a
// militante na Argentina de 1978, a japonesa de 1965) — jogadas por agentes até o ano-alvo. OUT=<pasta>.
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { anoDe } from '../../src/motor/tempo';
import { agente } from '../sim/agentes';
import { movimentosDaVida } from '../../src/motor/eras/v4/movimentos4';
import { garantirHistoria } from '../../src/motor/eras/base/sociedade4';
import type { Vida } from '../../src/motor/tipos';
import { mkdirSync, writeFileSync } from 'node:fs';
await carregarMundo();
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/v4/saves`;
mkdirSync(OUT, { recursive: true });
type Alvo = { nome: string; ano: number; ate: number; municipioId: string; perfil: string; genero: 'feminino' | 'masculino'; classe?: string; negro?: boolean; militar?: boolean; cargo?: string; igreja?: boolean; reforma?: string };
const ALVOS: Alvo[] = [
  { nome: 'V4-BR-1930-1955', ano: 1930, ate: 1955, municipioId: 'sao-paulo-sp', perfil: 'familiar', genero: 'feminino', classe: 'trabalhadora', negro: true, militar: true },
  { nome: 'V4-US-1915-1958', ano: 1915, ate: 1958, municipioId: 'us:atlanta', perfil: 'ambicioso', genero: 'masculino', classe: 'media', negro: true, cargo: 'governador', reforma: 'us_dessegregacao_estadual', militar: true },
  { nome: 'V4-BR-1915-1950', ano: 1915, ate: 1950, municipioId: 'sao-paulo-sp', perfil: 'ambicioso', genero: 'feminino', classe: 'media', cargo: 'deputado_federal' },
  { nome: 'V4-DE-1955-1974', ano: 1955, ate: 1974, municipioId: 'de:leipzig', perfil: 'estudioso', genero: 'feminino', classe: 'media', igreja: true },
  { nome: 'V4-GB-1885x-1912', ano: 1900, ate: 1912, municipioId: 'gb:londres', perfil: 'social', genero: 'feminino', classe: 'alta', militar: true },
  { nome: 'V4-AR-1950-1978', ano: 1950, ate: 1978, municipioId: 'ar:cordoba', perfil: 'social', genero: 'feminino', classe: 'media', militar: true },
  { nome: 'V4-JP-1940-1965', ano: 1940, ate: 1965, municipioId: 'jp:osaka', perfil: 'estudioso', genero: 'feminino', classe: 'vulneravel' }
];
for (const x of ALVOS) {
  const ag = agente(x.perfil), r = criarRng(x.ano + 7);
  let v: Vida = criarVida({ nome: 'Lia', sobrenome: 'Tempo', genero: x.genero, classe: x.classe, municipioId: x.municipioId, semente: 4100 + x.ano, ano: x.ano, era: true, mes: 4, dia: 9 } as never);
  if (x.negro) v.eu.ancestralidade = { af: 1 };
  if (x.igreja) v.crenca14 = { ...(v.crenca14 ?? {}), de: v.eu.nome, atual: 'protestante', familia: 'protestante', pratica: 'regular', desde: v.eu.tNasc } as never;
  const responder = () => { for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida; };
  while (!v.morte && anoDe(v.t) < x.ate) {
    for (const a of ag.agir(v, r)) { if (!podeTentar(disponibilidade(v, a))) continue; v = executar(v, a).vida; responder(); }
    if (x.militar) { const m = movimentosDaVida(v)[0]; if (m) { const a: Acao = { tipo: 'eras4', oque: 'participar', movimento: m.m.id }; if (podeTentar(disponibilidade(v, a))) { v = executar(v, a).vida; responder(); } } }
    v = avancarAno(v).vida; responder(); entrarNaVida(v);
  }
  // A fé praticada (a crença da época é refeita pelo motor ao longo da vida; o QA quer a fiel de igreja no fim).
  if (x.igreja) v.crenca14 = { ...(v.crenca14 ?? {}), atual: 'protestante', pratica: 'regular' } as never;
  if (x.cargo && !v.morte) {
    v.caminhos.politica = { fase: 'mandato', origem: 'comunidade', tInicio: v.t - 24, apoio: 55, reputacao: 45, desgaste: 10, consecutivos: 1, historico: [], mandato: { cargo: x.cargo, tInicio: v.t - 24, tFim: v.t + 24, aprovacao: 58, feito: 1 } } as never;
    if (x.reforma) garantirHistoria(v).alteracoes.push({ reforma: x.reforma, pais: 'US', t: v.t - 12, alcance: 'estadual', divisao: 'GA', por: 'voce', autor: v.eu.nome, antes: 7 });
  }
  writeFileSync(`${OUT}/${x.nome}.json`, JSON.stringify(v));
  console.log(x.nome, anoDe(v.t), v.morte ? 'MORTA' : 'viva', 'movimentos', Object.keys(v.era?.historia?.movimentos ?? {}).join(','), 'encontros', (v.era?.historia?.encontros ?? []).join(','));
}
