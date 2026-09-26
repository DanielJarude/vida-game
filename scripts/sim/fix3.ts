/**
 * Simulador do FIX #3: vidas longas atravessando o que o playtest humano
 * encontrou — conflitos de trajetória, negócio paralelo × principal, esporte,
 * serviço militar, pets, bens, política — com a varredura de coerência
 * (`sistemas/coerencia`) a cada ano.
 *
 *   npx esbuild scripts/sim/fix3.ts --bundle --platform=node --outfile=/tmp/fix3.cjs
 *   VIDAS=12 SAIDA=/tmp/fix3 node /tmp/fix3.cjs
 *
 * Saída: resumo.json (contagens, incoerências com o primeiro exemplo) e as
 * biografias em texto (bio-<trajetória>-<semente>.txt) para leitura humana.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Momento, Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { MUNICIPIOS } from '../../src/motor/dados/lugares';
import { estrategia, NOMES_ESTRATEGIAS } from './estrategias';
import { verificarCoerencia } from '../../src/motor/sistemas/coerencia';
import { negocioAberto, negociosPossiveis } from '../../src/motor/sistemas/negocio';
import { acoesDoNegocio } from '../../src/motor/sistemas/gestao';
import { ofertasDePets } from '../../src/motor/sistemas/mercado';
import { USOS_CASA, USOS_VEICULO } from '../../src/motor/sistemas/usos';

const VIDAS = Number(process.env.VIDAS ?? 12);
const SAIDA = process.env.SAIDA ?? '/tmp/fix3';
mkdirSync(SAIDA, { recursive: true });

type Traj = 'paralelo' | 'dono' | 'atleta_estudante' | 'militar' | 'bichos' | 'politica' | 'bens' | 'livre';
const TRAJS: Traj[] = ['paralelo', 'dono', 'atleta_estudante', 'militar', 'bichos', 'politica', 'bens', 'livre'];

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const P = (oque: string, extra: Record<string, string> = {}) => ({ tipo: 'profissao', oque, ...extra } as unknown as Acao);

/** Como cada trajetória responde à pergunta de conflito (pelo texto do plano: é o que o jogador lê). */
function planoDe(t: Traj, m: Momento, r: Rng): string {
  const livres = m.opcoes.filter(o => !o.bloqueio);
  const acha = (re: RegExp) => livres.find(o => re.test(o.texto))?.id;
  switch (t) {
    case 'paralelo': return acha(/manter o trabalho|horas vagas|dar conta/) ?? acha(/Recusar|Não abrir/) ?? livres[0].id;
    case 'dono': return acha(/deixar o trabalho de .* e se dedicar|Dedicar-se/) ?? livres[0].id;
    case 'atleta_estudante': return acha(/trancar/) ?? acha(/dar conta/) ?? livres[0].id;
    case 'militar': return acha(/seguir estudando|adiamento/) ?? livres[0].id;
    default: return r.pick(livres).id;
  }
}

function agirExtra(v: Vida, t: Traj, r: Rng): Acao[] {
  const i = idade(v);
  const out: Acao[] = [];
  const n = negocioAberto(v);
  if ((t === 'paralelo' || t === 'dono') && !n && i >= 26 && i <= 55 && v.trabalho.atual) {
    const lista = negociosPossiveis(v).filter(x => podeTentar(x.veredito)).sort((a, b) => a.custo - b.custo);
    if (lista.length) out.push({ tipo: 'abrir_negocio', negocio: r.pick(lista.slice(0, 4)).t.id });
  }
  if (n) for (const x of acoesDoNegocio(v, disponibilidade)) if (x.acao && !x.saida && r.chance(0.25) && !['vender', 'dedicacao'].includes(x.id)) out.push(x.acao);
  if (n && t === 'paralelo' && n.clientela >= 60 && r.chance(0.3)) out.push(P('dedicacao', { valor: 'integral' }));
  if (t === 'atleta_estudante' && i >= 8 && i <= 22) {
    const rot = v.rotinas.find(x => x.id === 'futebol');
    if (!rot) out.push({ tipo: 'rotina', id: 'futebol', ativa: true, nivel: 1 });
    else if ((rot.nivel ?? 1) < 3 && i >= 10) out.push({ tipo: 'rotina', id: 'futebol', ativa: true, nivel: ((rot.nivel ?? 1) + 1) as 2 | 3 });
  }
  if (t === 'atleta_estudante' && i >= 17 && !v.educacao.matricula && tenta(v, { tipo: 'enem' })) out.push({ tipo: 'enem' });
  if (t === 'atleta_estudante') for (const o of v.caminhos.oportunidades) if (['peneira', 'seletiva', 'convite', 'proposta'].includes(o.tipo)) out.push({ tipo: 'oportunidade', id: o.id, aceitar: true });
  if (t === 'militar' && !v.trabalho.atual && i >= 18) for (const o of v.caminhos.oportunidades) out.push({ tipo: 'oportunidade', id: o.id, aceitar: true });
  if (t === 'bichos' && i >= 20) {
    const of = ofertasDePets(v);
    if (of.length && r.chance(0.3)) out.push({ tipo: 'comprar_pet', ofertaId: r.pick(of).id });
    if (r.chance(0.2)) out.push({ tipo: 'adotar' } as unknown as Acao);
  }
  if (t === 'politica' && i >= 25) {
    for (const oque of ['aproximar', 'filiar', 'comunidade', 'bandeira', 'candidatura']) out.push({ tipo: 'politica', oque } as unknown as Acao);
  }
  if (t === 'bens') {
    const carro = v.financas.bens.find(b => b.tipo === 'veiculo');
    if (carro) out.push({ tipo: 'usar_veiculo', bemId: carro.id, oque: r.pick(USOS_VEICULO) });
    out.push({ tipo: 'usar_casa', oque: r.pick(USOS_CASA) });
  }
  return out.filter(a => tenta(v, a));
}

interface Contagem { [k: string]: number }
const incoerencias: Record<string, { n: number; exemplo: string }> = {};
const contagem: Contagem = {};
const conta = (k: string, d = 1) => { contagem[k] = (contagem[k] ?? 0) + d; };

function responder(v: Vida, t: Traj, perfil: ReturnType<typeof estrategia>, r: Rng): Vida {
  for (let k = 0; k < 14 && v.momento && !v.morte; k++) {
    const m = v.momento;
    let id: string;
    if (m.situacaoId === 'comp_conflito') { conta('perguntas_de_conflito'); id = planoDe(t, m, r); conta(`conflito:${m.opcoes.find(o => o.id === id)?.texto.split(' ')[0] ?? '?'}`); }
    else if (m.situacaoId === 'esp_doping') id = 'recusar';
    else id = perfil.decidir(v, m, r);
    if (!m.opcoes.some(o => o.id === id && !o.bloqueio)) id = (m.opcoes.find(o => !o.bloqueio) ?? m.opcoes[0]).id;
    v = executar(v, { tipo: 'decidir', opcaoId: id }).vida;
  }
  return v;
}

let vidas = 0;
const t0 = Date.now();
for (let s = 0; s < VIDAS; s++) {
  for (const t of TRAJS) {
    const semente = 9000 + s * 17 + TRAJS.indexOf(t);
    const r = criarRng(semente * 7 + 1);
    const perfil = estrategia(NOMES_ESTRATEGIAS[(s + TRAJS.indexOf(t)) % NOMES_ESTRATEGIAS.length]);
    const m = MUNICIPIOS[(semente * 13) % MUNICIPIOS.length];
    let v = criarVida({ nome: 'Sim', sobrenome: 'Fix', genero: t === 'militar' || semente % 2 ? 'masculino' : 'feminino', municipioId: m.id, semente });
    let lidos = 0;
    while (!v.morte && idade(v) < 85) {
      for (const a of [...perfil.agir(v, r), ...agirExtra(v, t, r)]) {
        if (v.morte || v.momento) break;
        if (!tenta(v, a)) continue;
        v = executar(v, a).vida;
        v = responder(v, t, perfil, r);
      }
      v = avancarAno(v).vida;
      v = responder(v, t, perfil, r);
      for (const x of verificarCoerencia(v, lidos)) {
        const chave = x.replace(/"[^"]*"/g, '"…"').replace(/\d+/g, '#').replace(/^[^ ]+ \(/, '(').slice(0, 90);
        incoerencias[chave] ??= { n: 0, exemplo: `${t} semente ${semente}, ${idade(v)} anos: ${x}` };
        incoerencias[chave].n++;
      }
      lidos = v.biografia.length;
    }
    vidas++;
    const n = v.caminhos.negocio;
    if (n) { conta(`negocio:${n.dedicacao ?? 'integral'}:${n.estado}`); conta(`negocio_tipo:${n.tipo}`); }
    if (v.caminhos.esporte) conta(`esporte:${v.caminhos.esporte.fase}:${v.caminhos.esporte.motivoFim ?? '-'}`);
    if (v.caminhos.militar) conta('militar');
    if (v.caminhos.politica) conta(`politica:${v.caminhos.politica.fase}`);
    conta('trancou', v.biografia.filter(e => /^Trancou /.test(e.texto)).length);
    conta('recusou', v.biografia.filter(e => /^Recusou /.test(e.texto)).length);
    conta('pet_velhice_cedo', v.biografia.filter(e => /morreu.*velhice/.test(e.texto) && /aos [1-7] anos/.test(e.texto) && /gat|cachorr|papagai|jabuti/.test(e.texto)).length);
    if (s < 3) writeFileSync(`${SAIDA}/bio-${t}-${semente}.txt`, v.biografia.filter(e => e.relevancia !== 'tecnico').map(e => `${String(e.idade).padStart(2)} ${e.relevancia === 'marco' ? '*' : ' '} ${e.texto}`).join('\n'));
  }
}
const resumo = { vidas, segundos: Math.round((Date.now() - t0) / 1000), contagem, incoerencias };
writeFileSync(`${SAIDA}/resumo.json`, JSON.stringify(resumo, null, 2));
console.log(JSON.stringify(resumo, null, 2));
