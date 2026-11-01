/**
 * AUDITORIA 12.5 — Retrospectiva da Vida: o que o save registra de cada acontecimento.
 *
 * ~12 vidas variadas (familiar, esportista, carreira comum, poucas conquistas, artista, política, crime) até 70–80 anos.
 * A cada ano, compara o estado com o do ano anterior e anota a VERDADE (o que aconteceu, pelo estado); no fim, grava a
 * vida e a verdade em JSON (OUT) para a análise (`auditoria125MemoriasAnalise.mjs` lê esses arquivos).
 *
 *   npx esbuild scripts/sim/auditoria125Memorias.ts --bundle --platform=node --format=esm --outfile=$HOME/vida-trabalho/a125/mem.mjs \
 *     && OUT=$HOME/vida-trabalho/a125/mem node $HOME/vida-trabalho/a125/mem.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng, type Rng } from '../../src/motor/rng';
import { escolhasDaExperiencia } from '../../src/motor/sistemas/experiencias';
import { animaisDoAbrigo } from '../../src/motor/sistemas/mercado';
import { DESENHOS } from '../../src/motor/dados/tatuagens';
import { NEGOCIOS } from '../../src/motor/dados/negocios';
import type { Classe, Vida } from '../../src/motor/tipos';
import { agente } from './agentes';
import { transacao } from '../../src/motor/nucleo';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { clubesDoPais } from '../../src/motor/dados/clubes';

await carregarMundo();
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/a125/mem`;
mkdirSync(OUT, { recursive: true });
const IDADE_FIM = Number(process.env.IDADE ?? 78);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);
const Pr = (oque: string) => ({ tipo: 'profissao', oque } as unknown as Acao);
const Pol = (oque: string, valor?: string) => ({ tipo: 'politica', oque, valor } as unknown as Acao);

interface Plano { nome: string; agente: string; cidade: string; genero: 'masculino' | 'feminino'; classe: Classe; extras: (v: Vida, r: Rng) => Acao[];
  /** Aos 18, uma vez: empurra a vida para uma carreira que a estratégia sozinha raramente alcança (o atleta profissional). */
  aos18?: (v: Vida) => Vida }

/** O atleta profissional aos 18 (como `futebol1151`): a base do clube da cidade e o primeiro contrato. */
function atleta(d: 'futebol' | 'volei', nivel: number) {
  return (v: Vida) => transacao(v, x => {
    garantirFrente(x, d);
    Object.assign(x.caminhos.frentes[d]!, { habilidade: 86, interesse: 95, meses: 140, auge: 95 });
    x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.educacao.matricula = undefined;
    entrarNaBase(x, d, x.moradia.municipioId, clubesDoPais('BR').find(c => c.cidade === x.moradia.municipioId)?.nome ?? 'Flamengo');
    profissionalizar(x, criarRng(x.t), nivel);
    x.momento = null; x.caminhos.pendente = undefined;
  }).vida;
}

/** O que um jogador "vivo" faz além da estratégia: viajar, tatuar, adotar, um segundo imóvel. */
function lazer(v: Vida, r: Rng, intensidade = 1): Acao[] {
  const out: Acao[] = [];
  const i = idade(v);
  if (i >= 18) for (const id of ['viagem_pais', 'viagem_exterior'] as const) {
    if (!r.chance(0.35 * intensidade)) continue;
    const esc = escolhasDaExperiencia(v, id);
    const e = esc.length ? r.pick(esc) : undefined;
    const a: Acao = { tipo: 'experiencia', id, escolha: e?.id };
    if (tenta(v, a)) out.push(a);
  }
  if (i >= 18 && i <= 50 && r.chance(0.12 * intensidade)) {
    const d = r.pick([...DESENHOS]);
    const a = { tipo: 'tatuar', desenho: d.id, local: d.locais[0] } as Acao;
    if (tenta(v, a)) out.push(a);
  }
  if (i >= 20 && r.chance(0.15 * intensidade)) {
    const bichos = animaisDoAbrigo(v);
    if (bichos.length) { const a: Acao = { tipo: 'adotar_pet', animalId: bichos[0].id }; if (tenta(v, a)) out.push(a); }
  }
  return out;
}

const PLANOS: Plano[] = [
  { nome: 'familiar-sp', agente: 'familiar', cidade: 'sao-paulo-sp', genero: 'feminino', classe: 'media', extras: (v, r) => lazer(v, r) },
  { nome: 'familiar-recife', agente: 'familiar', cidade: 'recife-pe', genero: 'masculino', classe: 'trabalhadora', extras: (v, r) => lazer(v, r, 0.5) },
  { nome: 'esportista-1', agente: 'esportista', cidade: 'porto-alegre-rs', genero: 'masculino', classe: 'media', extras: (v, r) => [...lazer(v, r, 0.6), ...(idade(v) >= 8 && idade(v) <= 18 ? [P('teste')] : [])] },
  { nome: 'esportista-2', agente: 'esportista', cidade: 'belo-horizonte-mg', genero: 'feminino', classe: 'media', extras: (v, r) => [...lazer(v, r, 0.6), ...(idade(v) >= 8 && idade(v) <= 18 ? [P('teste')] : [])] },
  { nome: 'social', agente: 'social', cidade: 'salvador-ba', genero: 'feminino', classe: 'media', extras: (v, r) => lazer(v, r, 1.2) },
  { nome: 'ambicioso', agente: 'ambicioso', cidade: 'sao-paulo-sp', genero: 'masculino', classe: 'alta', extras: (v, r) => [...lazer(v, r, 1.5),
    ...(idade(v) >= 40 && !(v.financas.empresas ?? []).length ? [{ tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false } as Acao] : [])] },
  { nome: 'artista', agente: 'estudioso', cidade: 'rio-de-janeiro-rj', genero: 'feminino', classe: 'media', extras: (v, r) => [...lazer(v, r),
    ...(idade(v) >= 16 ? [P('apresentar'), P('montar_grupo'), P('edital'), Pr('lancar')] : [])] },
  { nome: 'economico', agente: 'economico', cidade: 'curitiba-pr', genero: 'masculino', classe: 'trabalhadora', extras: (v, r) => [...lazer(v, r, 0.4),
    ...(idade(v) >= 30 && !v.caminhos.negocio ? NEGOCIOS.map(n => ({ tipo: 'abrir_negocio', negocio: n.id } as Acao)) : [])] },
  { nome: 'passivo', agente: 'passivo', cidade: 'fortaleza-ce', genero: 'feminino', classe: 'trabalhadora', extras: () => [] },
  { nome: 'trabalhador', agente: 'trabalhador', cidade: 'goiania-go', genero: 'masculino', classe: 'trabalhadora', extras: (v, r) => lazer(v, r, 0.3) },
  { nome: 'criminoso', agente: 'criminoso', cidade: 'rio-de-janeiro-rj', genero: 'masculino', classe: 'trabalhadora', extras: (v, r) => lazer(v, r, 0.5) },
  { nome: 'politica', agente: 'familiar', cidade: 'campinas-sp', genero: 'feminino', classe: 'media', extras: (v, r) => {
    const out = lazer(v, r, 0.6);
    if (idade(v) < 25) return out;
    const pol = v.caminhos.politica;
    if (!pol || pol.fase === 'encerrada') out.push(Pol('aproximar'));
    else for (const o of ['filiar', 'bandeira', 'comunidade', 'candidatura']) out.push(Pol(o, o === 'bandeira' ? 'saude' : undefined));
    return out;
  } },
  { nome: 'atleta-futebol', agente: 'esportista', cidade: 'sao-paulo-sp', genero: 'masculino', classe: 'media', extras: (v, r) => lazer(v, r, 0.8), aos18: atleta('futebol', 3) },
  { nome: 'atleta-volei', agente: 'esportista', cidade: 'rio-de-janeiro-rj', genero: 'feminino', classe: 'media', extras: (v, r) => lazer(v, r, 0.8), aos18: atleta('volei', 3) }
];

/* ---------------------------------------------------------------- A verdade, ano a ano (pelo estado) */

interface Verdade { tipo: string; t: number; idade: number; dados?: Record<string, unknown> }
type Foto = {
  municipio: string; pais: string; moradiaT: number; moradiaTipo: string; empregoChave?: string; postos: number; aposentado: boolean;
  bens: Set<string>; romances: Record<string, string>; vivos: Record<string, boolean>; pets: Set<string>; tatuagens: number;
  matricula?: string; basica: boolean; etapa?: string; escolaridade: string; aprovacao?: string; concluidos: number; prisoes: number; condicoes: Set<string>; palmares: number; obrasPremio: number;
  mandato?: string; notoPico: number; seguidores: number; negocio: boolean; empresas: number; migracoes: number; historicoTrab: number;
};
const pais = (m: string) => (m.match(/-([a-z]{2})$/) ? 'BR' : m.split('-').pop() ?? '?');
function foto(v: Vida): Foto {
  const rom: Record<string, string> = {}, vivos: Record<string, boolean> = {};
  for (const [id, vin] of Object.entries(v.vinculos)) { if (vin.romance) rom[id] = `${vin.romance.estagio}|${vin.romance.fim ?? ''}`; }
  for (const [id, p] of Object.entries(v.pessoas)) vivos[id] = p.vivo;
  const e = v.trabalho.atual;
  return {
    municipio: v.moradia.municipioId, pais: pais(v.moradia.municipioId), moradiaT: v.moradia.tInicio, moradiaTipo: v.moradia.tipo,
    empregoChave: e ? `${e.empregador}|${e.tInicio}` : undefined, postos: e?.postos?.length ?? 0, aposentado: !!v.trabalho.aposentadoria,
    bens: new Set(v.financas.bens.map(b => b.id)), romances: rom, vivos,
    pets: new Set(Object.values(v.pessoas).filter(p => p.especie).map(p => p.id)), tatuagens: (v.eu.tatuagens ?? []).length,
    matricula: v.educacao.matricula ? `${v.educacao.matricula.cursoId}|${v.educacao.matricula.tInicio}` : undefined,
    basica: !!v.educacao.basica, etapa: v.educacao.basica?.etapa, escolaridade: v.educacao.escolaridade,
    aprovacao: v.educacao.aprovacao ? `${v.educacao.aprovacao.nome}|${v.educacao.aprovacao.t}` : undefined, concluidos: v.educacao.concluidos.length,
    prisoes: (v.justica?.antecedentes ?? []).filter(a => a.desfecho === 'prisao').length,
    condicoes: new Set(v.corpo.condicoes.filter(c => c.gravidade >= 2).map(c => c.id)),
    palmares: (v.caminhos.palmares ?? []).length, obrasPremio: (v.caminhos.obras ?? []).filter(o => o.premio?.venceu).length,
    mandato: v.caminhos.politica?.mandato ? `${v.caminhos.politica.mandato.cargo}|${v.caminhos.politica.mandato.tInicio}` : undefined,
    notoPico: v.notoriedade?.pico ?? 0, seguidores: Math.max(0, ...Object.values(v.redes?.contas ?? {}).map(c => c.seguidores)),
    negocio: !!v.caminhos.negocio, empresas: (v.financas.empresas ?? []).length, migracoes: v.mundo?.migracoes.length ?? 0,
    historicoTrab: v.trabalho.historico.length
  };
}
const PAR_DIRETO = new Set(['pai', 'mae', 'filho', 'enteado', 'neto', 'bisneto', 'irmao']);
function diff(v: Vida, a: Foto, b: Foto, out: Verdade[]): void {
  const t = v.t, i = idade(v);
  const push = (tipo: string, dados?: Record<string, unknown>) => out.push({ tipo, t, idade: i, dados });
  if (a.municipio !== b.municipio) push(a.pais !== b.pais ? 'mudanca_pais' : 'mudanca_cidade', { de: a.municipio, para: b.municipio });
  else if (a.moradiaT !== b.moradiaT) push('mudanca_residencia', { de: a.moradiaTipo, para: b.moradiaTipo });
  if (b.empregoChave && a.empregoChave !== b.empregoChave) push(a.historicoTrab === 0 && !a.empregoChave && b.historicoTrab === 0 ? 'primeiro_emprego' : 'novo_emprego', { emp: b.empregoChave, ocup: v.trabalho.atual?.ocupacaoId });
  else if (b.empregoChave && b.postos > a.postos) push('promocao', { ocup: v.trabalho.atual?.ocupacaoId });
  if (!a.aposentado && b.aposentado) push('aposentadoria');
  for (const id of b.bens) if (!a.bens.has(id)) { const bem = v.financas.bens.find(x => x.id === id)!; push(bem.tipo === 'imovel' ? 'compra_imovel' : bem.tipo === 'veiculo' ? 'compra_veiculo' : `compra_${bem.tipo}`, { id, nome: bem.nome, herdado: (bem as { origem?: string }).origem }); }
  for (const id of a.bens) if (!b.bens.has(id)) push('bem_saiu', { id });
  for (const [id, s] of Object.entries(b.romances)) {
    const antes = a.romances[id]?.split('|')[0], [est, fim] = s.split('|');
    if (antes === est) continue;
    if (est === 'namoro') push(out.some(x => x.tipo === 'primeiro_namoro') ? 'namoro' : 'primeiro_namoro', { pessoa: id, de: antes });
    if (est === 'casado') push('casamento', { pessoa: id });
    if (est === 'morando_junto' && antes !== 'casado') push('uniao', { pessoa: id });
    if (est === 'ex' && fim === 'divorcio') push('divorcio', { pessoa: id });
  }
  for (const [id, vivo] of Object.entries(b.vivos)) {
    const p = v.pessoas[id], vin = v.vinculos[id];
    if (!(id in a.vivos) && vivo && !p.especie && p.tNasc >= v.t - 12) {
      const par = vin?.parentesco ?? '';
      if (par === 'filho') push('filho_nasceu', { pessoa: id, adotado: (vin as { adotado?: boolean }).adotado });
      else if (par === 'neto') push('neto_nasceu', { pessoa: id });
      else if (par === 'bisneto') push('bisneto_nasceu', { pessoa: id });
    }
    if (a.vivos[id] && !vivo && !p.especie) {
      const par = vin?.parentesco ?? '', rom = vin?.romance;
      if (par === 'pai' || par === 'mae') push('morte_pai_mae', { pessoa: id, par });
      else if (rom && ['casado', 'morando_junto', 'noivado'].includes(rom.estagio)) push('morte_conjuge', { pessoa: id, est: rom.estagio });
      else if (par === 'filho') push('morte_filho', { pessoa: id });
      else if (PAR_DIRETO.has(par) || par === 'avo') push(`morte_${par}`, { pessoa: id });
    }
  }
  for (const id of b.pets) if (!a.pets.has(id)) push('pet', { pessoa: id, especie: v.pessoas[id]?.especie });
  if (b.tatuagens > a.tatuagens) push(a.tatuagens === 0 ? 'primeira_tatuagem' : 'tatuagem');
  if (b.etapa === 'fundamental1' && a.etapa !== 'fundamental1' && !out.some(x => x.tipo === 'entrada_escola')) push('entrada_escola', { rede: v.educacao.basica?.rede });
  if (b.escolaridade !== a.escolaridade && ['medio', 'tecnico', 'superior', 'pos', 'mestrado', 'doutorado'].includes(b.escolaridade) && a.escolaridade === 'medio_incompleto') push('formatura_medio');
  if (b.aprovacao && a.aprovacao !== b.aprovacao) push('aprovacao_curso', { curso: b.aprovacao });
  else if (b.matricula && a.matricula !== b.matricula && !b.aprovacao) push('aprovacao_curso', { curso: b.matricula, direto: true });
  if (b.concluidos > a.concluidos) for (const c of v.educacao.concluidos.slice(a.concluidos)) push('formatura', { nivel: c.nivel, nome: c.nome, inst: c.instituicao });
  if (b.prisoes > a.prisoes) push('prisao');
  for (const id of b.condicoes) if (!a.condicoes.has(id)) push('doenca_grave', { id, nome: v.corpo.condicoes.find(c => c.id === id)?.nome });
  if (b.palmares > a.palmares) for (const c of (v.caminhos.palmares ?? []).slice(a.palmares)) push(`esporte_${c.tipo}`, { comp: c.competicao, clube: c.clube, texto: c.texto });
  if (b.obrasPremio > a.obrasPremio) push('premio_artistico');
  if (b.mandato && a.mandato !== b.mandato) push('mandato', { m: b.mandato });
  for (const lim of [20, 40, 60, 80]) if (a.notoPico < lim && b.notoPico >= lim) push('fama_marco', { lim });
  for (const lim of [10000, 100000, 1000000]) if (a.seguidores < lim && b.seguidores >= lim) push('seguidores_marco', { lim });
  if (!a.negocio && b.negocio) push('abrir_negocio');
  if (b.empresas > a.empresas) push('abrir_empresa');
}

/* ---------------------------------------------------------------- A simulação */

const resumo: string[] = [];
const SO = process.env.SO?.split(',').map(Number);
for (let k = 0; k < PLANOS.length; k++) {
  if (SO && !SO.includes(k)) continue;
  const pl = PLANOS[k];
  const semente = 12500 + k * 37;
  const ag = agente(pl.agente);
  const r = criarRng(semente);
  let v: Vida = criarVida({ nome: 'Ana', sobrenome: 'Memoria', genero: pl.genero, municipioId: pl.cidade, semente, classe: pl.classe });
  const verdade: Verdade[] = [{ tipo: 'nascimento', t: v.eu.tNasc, idade: 0, dados: { municipio: v.eu.municipioNatal } }];
  let ant = foto(v);
  const decidir = () => { for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida; };
  const t0 = Date.now();
  let erros = 0;
  let forcado = false;
  while (!v.morte && idade(v) < IDADE_FIM) {
    if (pl.aos18 && !forcado && idade(v) >= 18) { forcado = true; v = pl.aos18(v); const f = foto(v); diff(v, ant, f, verdade); ant = f; }
    try {
      for (const a of [...ag.agir(v, r), ...pl.extras(v, r)]) {
        if (v.morte || !tenta(v, a)) continue;
        const exp = a.tipo === 'experiencia' ? v.fatos[`exp_${a.id}`] : undefined;
        v = executar(v, a).vida;
        if (a.tipo === 'experiencia' && v.fatos[`exp_${a.id}`] !== exp) verdade.push({ tipo: 'viagem', t: v.t, idade: idade(v), dados: { id: a.id, escolha: a.escolha } });
        decidir();
        const f = foto(v); diff(v, ant, f, verdade); ant = f;
      }
      v = avancarAno(v).vida; decidir();
    } catch (e) { erros++; if (erros > 3) break; console.error(pl.nome, (e as Error).message); v = avancarAno(v).vida; }
    const f = foto(v); diff(v, ant, f, verdade); ant = f;
  }
  writeFileSync(`${OUT}/v${k}.json`, JSON.stringify({ plano: pl.nome, vida: v, verdade }));
  const l = `${pl.nome}: ${idade(v)} anos${v.morte ? ` (morreu: ${v.morte.causa})` : ''}, bio ${v.biografia.length} entradas, verdade ${verdade.length}, ${Math.round((Date.now() - t0) / 1000)} s`;
  console.log(l); resumo.push(l);
}
writeFileSync(`${OUT}/resumo.txt`, resumo.join('\n'));
