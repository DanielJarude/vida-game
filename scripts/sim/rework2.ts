/**
 * Simulador comparativo do REWORK 2 (pessoa, corpo, mente e relações).
 *
 *   npx esbuild scripts/sim/rework2.ts --bundle --platform=node --outfile=/tmp/rw2.cjs
 *   VIDAS=24 ESTRATEGIAS=atleta_cedo,leitor SAIDA=/tmp/rw2 node /tmp/rw2.cjs
 *
 * Cada estratégia é um jogador com um jeito de viver, que só usa o que o
 * jogador pode fazer (`disponibilidade` → `executar`). Não se mede só a taxa
 * final de sucesso: mede-se a TRAJETÓRIA — atributos, habilidades,
 * preparação, tentativas, saúde, bem-estar, relações, a Linha da Vida.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, opcoesDeCurso, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, parceiro, vinculosVivos } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { derivarPredisposicoes } from '../../src/motor/sistemas/pessoa';
import { habilidade } from '../../src/motor/sistemas/frentes';
import { interacoesPara } from '../../src/motor/sistemas/interacoes';
import { ROTINAS } from '../../src/motor/sistemas/rotinas';
import { lerTecnica } from '../../src/motor/sistemas/peneira';

const VIDAS = Number(process.env.VIDAS ?? 24);
const ATE = Number(process.env.ATE ?? 60);
const SAIDA = process.env.SAIDA ?? '/tmp/rw2';

type Pol = { id: string; descricao: string; semente?: (s: number) => boolean; acoes: (v: Vida, r: Rng) => Acao[]; chamado?: 'sim' | 'nao' | 'aleatorio'; decisoes?: 'primeira' | 'aleatoria' };

const R = (id: string, nivel: 1 | 2 | 3 = 1): Acao => ({ tipo: 'rotina', id, ativa: true, nivel });
const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);
/** O jogador que segue a tela: pede o teste quando a técnica está "perto" (ou no fim da janela); na base, treina todo dia. */
const treinoDeAtleta = (v: Vida): Acao[] => [R('futebol', 3), R('futebol', idade(v) >= 9 ? 2 : 1), ...(idade(v) >= 12 && (lerTecnica(v, 'futebol').nivel >= 3 || idade(v) >= 16) ? [P('pedir_teste', 'futebol')] : [])];
const fis = (s: number) => derivarPredisposicoes(`vida-${s.toString(36)}`).fisica;

/** Tenta Medicina pela opção pública (SISU) quando existe; senão, a primeira opção de Medicina. */
function matricularMedicina(v: Vida): Acao[] {
  const ops = opcoesDeCurso(v);
  const i = ops.findIndex(o => o.curso.id === 'medicina' && o.rede === 'publica');
  const j = i >= 0 ? i : ops.findIndex(o => o.curso.id === 'medicina');
  return j >= 0 ? [{ tipo: 'matricular', indice: j }] : [];
}

function romance(v: Vida): Acao[] {
  const out: Acao[] = [];
  for (const { p, vin } of vinculosVivos(v)) {
    const e = vin.romance?.estagio;
    if (e === 'interesse') out.push({ tipo: 'pessoa', pessoaId: p.id, interacao: 'convidar' });
    if (e === 'saindo' && v.t - vin.romance!.tEstagio >= 12) out.push({ tipo: 'pessoa', pessoaId: p.id, interacao: 'pedir_namoro' });
  }
  return out;
}
function apoiar(v: Vida): Acao[] {
  return vinculosVivos(v).filter(x => x.p.aperto && v.t - x.p.aperto.t <= 12 && interacoesPara(v, x.p.id).some(i => i.id === 'apoiar')).map(x => ({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'apoiar' } as Acao));
}
function convivio(v: Vida): Acao[] {
  const amigos = vinculosVivos(v).filter(x => (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo') && !x.p.especie).slice(0, 3);
  return amigos.map(x => ({ tipo: 'pessoa', pessoaId: x.p.id, interacao: interacoesPara(v, x.p.id).some(i => i.id === 'tempo') ? 'tempo' : 'ligar' } as Acao));
}

const ESTRATEGIAS: Pol[] = [
  { id: 'aleatoria', descricao: 'Joga sem plano: uma atividade qualquer de vez em quando, decisões ao acaso.', decisoes: 'aleatoria', chamado: 'aleatorio',
    acoes: (v, r) => (r.chance(0.3) ? [R(r.pick(ROTINAS).id)] : []) },
  { id: 'atleta_cedo', descricao: 'Futebol a sério dos 7 aos 17, pede testes quando a tela diz que dá.',
    acoes: v => (idade(v) >= 7 ? treinoDeAtleta(v) : []) },
  { id: 'atleta_tardio', descricao: 'Começa o futebol a sério aos 14.',
    acoes: v => (idade(v) >= 14 ? treinoDeAtleta(v) : []) },
  { id: 'fisico_sem_pratica', descricao: 'Alta predisposição física, nenhuma prática esportiva (academia a partir dos 15).', semente: s => fis(s) >= 0.35,
    acoes: v => (idade(v) >= 15 ? [R('academia'), P('pedir_teste', 'futebol')] : []) },
  { id: 'mediano_pratica_longa', descricao: 'Predisposição física mediana, futebol a sério dos 7 aos 17.', semente: s => Math.abs(fis(s)) < 0.2,
    acoes: v => (idade(v) >= 7 ? treinoDeAtleta(v) : []) },
  { id: 'estudante', descricao: 'Dedicação na escola, leitura, objetivo Medicina aos 15, cursinho aos 16, ENEM todo ano até entrar.',
    acoes: v => [{ tipo: 'postura', valor: 'dedicada' }, ...(idade(v) >= 8 ? [R('leitura')] : []), ...(idade(v) >= 15 && !v.educacao.objetivo && !v.educacao.matricula && !v.educacao.concluidos.some(c => c.cursoId === 'medicina') ? [{ tipo: 'objetivo_estudo', cursoId: 'medicina' } as Acao] : []),
      ...(idade(v) >= 16 && !v.educacao.matricula ? [R('cursinho')] : []), ...(idade(v) >= 17 && idade(v) <= 24 ? [{ tipo: 'enem' } as Acao, ...matricularMedicina(v)] : [])] },
  { id: 'leitor', descricao: 'Lê desde os 8, a vida inteira.', acoes: v => (idade(v) >= 8 ? [R('leitura')] : []) },
  { id: 'ativo', descricao: 'Academia desde os 15 e corrida.', acoes: v => (idade(v) >= 15 ? [R('academia'), R('corrida')] : []) },
  { id: 'sedentario', descricao: 'Nenhum exercício.', acoes: () => [] },
  { id: 'procura_cuidado', descricao: 'Vai ao médico todo ano a partir dos 18; trata o que aparece.', acoes: v => (idade(v) >= 18 ? [{ tipo: 'cuidar', cuidado: 'consulta' }] : []) },
  { id: 'ignora_saude', descricao: 'Nunca vai ao médico; adia o tratamento.', acoes: () => [], decisoes: 'primeira' },
  { id: 'artista', descricao: 'Instrumento desde os 8, ensaio a sério, monta banda e mostra o trabalho.',
    acoes: v => (idade(v) >= 8 ? [R('musica', idade(v) >= 13 ? 3 : 2), R('musica', 2), R('musica', 1), ...(idade(v) >= 13 ? [P('montar_grupo', 'musica'), P('mostrar_trabalho')] : [])] : []) },
  { id: 'conectado', descricao: 'Voluntariado e igreja; tempo com os amigos; responde a quem procura.', chamado: 'sim',
    acoes: v => [...(idade(v) >= 14 ? [R('voluntariado')] : []), R('igreja'), ...convivio(v)] },
  { id: 'isolado', descricao: 'Nenhuma atividade com gente, nunca procura ninguém, recusa quem procura.', chamado: 'nao', acoes: () => [] },
  { id: 'busca_relacionamento', descricao: 'Solteiro, procura alguém todo ano (18+) e segue o interesse.', chamado: 'sim',
    acoes: (v, r) => [...(idade(v) >= 18 && !parceiro(v) ? [{ tipo: 'atracao', valor: v.eu.atracao ?? (v.eu.genero === 'feminino' ? 'homens' : 'mulheres') } as Acao, { tipo: 'conhecer_alguem', contexto: r.pick(['app', 'amigos', 'atividade', 'estudo_trabalho', 'noite']) } as Acao] : []), ...romance(v)] },
  { id: 'nao_busca', descricao: 'Nunca procura ninguém (o que vier, vem).', acoes: () => [] },
  { id: 'apoia', descricao: 'Apoia quem passa por aperto; aceita os pedidos de ajuda.', chamado: 'sim', acoes: v => apoiar(v) },
  { id: 'nao_reage', descricao: 'Não reage: não apoia e deixa os chamados sem resposta (o silêncio responde).', acoes: () => [] }
];

function responder(v: Vida, r: Rng, pol: Pol): Vida {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
    const livres = v.momento.opcoes.filter(o => !o.bloqueio);
    const o = pol.decisoes === 'aleatoria' ? r.pick(livres.length ? livres : v.momento.opcoes) : (pol.id === 'ignora_saude' && v.momento.situacaoId === 'sau_tratamento' ? v.momento.opcoes.find(x => x.id === 'depois') : undefined) ?? livres[0] ?? v.momento.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: o.id }).vida;
  }
  return v;
}

function tentar(v: Vida, r: Rng, pol: Pol, a: Acao): Vida {
  if (v.morte || v.momento) return v;
  if (!podeTentar(disponibilidade(v, a))) return v;
  return responder(executar(v, a).vida, r, pol);
}

interface Linha { [k: string]: number | string | undefined }

function viverVida(pol: Pol, s: number): Linha {
  const r = criarRng(s * 7919);
  let v = criarVida({ nome: 'Ana', sobrenome: 'Souza', genero: s % 2 ? 'feminino' : 'masculino', municipioId: ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'manaus-am'][s % 6], semente: s });
  const fotos: Record<number, Vida> = {};
  let chamSim = 0, chamNao = 0, chamIgnorados = 0;
  let namoros = 0; let maiorRelacao = 0;
  while (!v.morte && idade(v) < ATE) {
    // Chamados: a reação (ou o silêncio) da estratégia.
    for (const { p, vin } of vinculosVivos(v)) {
      if (!vin.chamado) continue;
      const modo = pol.chamado === 'aleatorio' ? (r.chance(0.5) ? 'sim' : 'nao') : pol.chamado;
      if (!modo) { chamIgnorados++; continue; }
      const a: Acao = { tipo: 'pessoa', pessoaId: p.id, interacao: modo === 'sim' ? 'chamado_sim' : 'chamado_nao' };
      if (podeTentar(disponibilidade(v, a))) { v = responder(executar(v, a).vida, r, pol); if (modo === 'sim') chamSim++; else chamNao++; }
    }
    for (const a of pol.acoes(v, r)) v = tentar(v, r, pol, a);
    v = responder(avancarAno(v).vida, r, pol);
    const par = parceiro(v);
    if (par) maiorRelacao = Math.max(maiorRelacao, Math.floor((v.t - (par.vin.romance!.tInicio ?? par.vin.tInicio)) / 12));
    for (const i of [18, 30, 45]) if (idade(v) === i && !fotos[i]) fotos[i] = structuredClone(v);
  }
  const bio = v.biografia;
  namoros = bio.filter(e => e.tema === 'amor' && /namor/i.test(e.texto) && e.relevancia !== 'cotidiano').length;
  const f = (i: number, g: (x: Vida) => number) => (fotos[i] ? Math.round(g(fotos[i]) * 10) / 10 : undefined);
  const amigosProx = (x: Vida) => vinculosVivos(x).filter(y => y.vin.estagio === 'amigo_proximo').length;
  const d = v.caminhos.devolutivas;
  const esp = v.caminhos.esporte;
  const med = v.educacao.concluidos.some(c => c.cursoId === 'medicina') || v.educacao.matricula?.cursoId === 'medicina' || bio.some(e => /Aprovad[oa] em Medicina/.test(e.texto));
  return {
    idadeFinal: idade(v), morreu: v.morte ? 1 : 0, causa: v.morte?.causa,
    forma18: f(18, x => x.corpo.forma), forma30: f(30, x => x.corpo.forma), forma45: f(45, x => x.corpo.forma),
    cog18: f(18, x => x.mente.cognicao), cog45: f(45, x => x.mente.cognicao),
    apar30: f(30, x => x.corpo.aparencia), saude45: f(45, x => x.corpo.saude), humor30: f(30, x => x.mente.felicidade), humor45: f(45, x => x.mente.felicidade),
    futebol18: f(18, x => habilidade(x, 'futebol')), musica18: f(18, x => habilidade(x, 'musica')), musica30: f(30, x => habilidade(x, 'musica')),
    peneiras: v.fatos['peneiras_futebol'] ?? 0, peneirasPassou: d.filter(x => x.tipo === 'peneira' && x.passou).length + (esp ? 1 : 0) > 0 ? 1 : 0,
    base: esp || bio.some(e => /Passou na (peneira|seletiva)/.test(e.texto)) ? 1 : 0, profissional: bio.some(e => /contrato profissional|primeiro contrato/i.test(e.texto)) ? 1 : 0,
    enens: v.educacao.enem.length, melhorEnem: v.educacao.enem.reduce((m, x) => Math.max(m, x.nota), 0) || undefined, medicina: med ? 1 : 0,
    superior: v.educacao.concluidos.some(c => c.nivel === 'superior') ? 1 : 0,
    diagnosticos: Object.keys(v.fatos).filter(k => k.startsWith('diagnostico_')).length, sustos: Object.keys(v.fatos).filter(k => k.startsWith('susto_')).length,
    remissao: v.fatos['remissao_cancer'] !== undefined ? 1 : 0, sinaisAbertos: v.corpo.condicoes.filter(c => c.diagnosticada === false).length,
    tratando: v.corpo.condicoes.filter(c => c.tratando).length,
    amigosProx30: f(30, amigosProx), amigosProx45: f(45, amigosProx), chamSim, chamNao, chamIgnorados,
    apoioRecebido: Object.keys(v.fatos).filter(k => k.startsWith('apoio_recebido_') && k !== 'apoio_recebido_t').length,
    naoApareceu: vinculosVivos(v).reduce((s, x) => s + x.vin.historia.filter(h => /não apareceu|resposta não veio/.test(h.texto)).length, 0),
    buscas: v.fatos['buscas_romance'] ?? 0, namoros, maiorRelacao, casou: bio.some(e => /^Casou-se/.test(e.texto)) ? 1 : 0, uniao: bio.some(e => /^Casou-se|^Foi morar com/.test(e.texto)) ? 1 : 0, separacoes: bio.filter(e => e.evento?.tipo === 'termino' || e.evento?.tipo === 'divorcio').length,
    praticaVida: Object.keys(v.fatos).filter(k => k.startsWith('pratica_vida_')).length,
    marcos: bio.filter(e => e.relevancia === 'marco').length, biografia: bio.filter(e => e.relevancia === 'biografia').length
  };
}

function sementes(pol: Pol): number[] {
  const out: number[] = [];
  for (let s = 1; out.length < VIDAS && s < 20000; s++) if (!pol.semente || pol.semente(s)) out.push(s);
  return out;
}

const media = (xs: (number | string | undefined)[]) => { const n = xs.filter((x): x is number => typeof x === 'number'); return n.length ? Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 10) / 10 : undefined; };

const escolhidas = (process.env.ESTRATEGIAS ?? '').split(',').filter(Boolean);
mkdirSync(SAIDA, { recursive: true });
const resultado: Record<string, Record<string, number | undefined>> = {};
for (const pol of ESTRATEGIAS.filter(p => !escolhidas.length || escolhidas.includes(p.id))) {
  const t0 = Date.now();
  const linhas = sementes(pol).map(s => viverVida(pol, s));
  const chaves = Object.keys(linhas[0]).filter(k => k !== 'causa');
  resultado[pol.id] = Object.fromEntries(chaves.map(k => [k, media(linhas.map(l => l[k]))]));
  writeFileSync(`${SAIDA}/${pol.id}.json`, JSON.stringify({ descricao: pol.descricao, media: resultado[pol.id], vidas: linhas }, null, 1));
  console.log(pol.id, `${((Date.now() - t0) / 1000).toFixed(0)}s`, JSON.stringify(resultado[pol.id]));
}
