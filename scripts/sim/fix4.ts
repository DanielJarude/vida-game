/**
 * Simulador do FIX #4: as trajetórias do FIX #3 e mais três (família grande,
 * quem investe, quem vive de carro), com a varredura de coerência a cada ano
 * e MÉTRICAS POR FAIXA DE IDADE (0–17, 18–29, 30–39, 40–49, 50–59, 60–69,
 * 70+): linhas biográficas, decisões, relações ativas, família, trabalho e
 * negócio, saúde, patrimônio, luto e política — para ver se há um vale na
 * meia-idade. Também procura as classes de problema do Playtest #4: dono sem
 * renda, eleição sem explicação, luto sem ninguém em volta, "sem dinheiro"
 * com patrimônio, carro sem trajeto.
 *
 *   npx esbuild scripts/sim/fix4.ts --bundle --platform=node --outfile=/tmp/fix4.cjs
 *   VIDAS=25 SAIDA=/tmp/fix4 node /tmp/fix4.cjs
 */

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
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
import { idadePessoa, transacao, vinculosVivos } from '../../src/motor/nucleo';
import { parceriaAtual } from '../../src/motor/sistemas/vinculos';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import { garantirVida } from '../../src/motor/sistemas/filhos';
import { donoIntegral } from '../../src/motor/sistemas/negocio';
import { deslocamento } from '../../src/motor/sistemas/transporte';
import { retrospectiva } from '../../src/motor/sistemas/retrospectiva';

/* ------------------------------------------------ Métricas por faixa de idade */

const FAIXAS = ['0-17', '18-29', '30-39', '40-49', '50-59', '60-69', '70+'];
const faixa = (i: number) => (i < 18 ? '0-17' : i < 30 ? '18-29' : i < 40 ? '30-39' : i < 50 ? '40-49' : i < 60 ? '50-59' : i < 70 ? '60-69' : '70+');
const met: Record<string, Record<string, { soma: number; anos: number }>> = {};
function soma(f: string, k: string, x: number, anos: number) { const m = ((met[f] ??= {})[k] ??= { soma: 0, anos: 0 }); m.soma += x; m.anos += anos; }

function metricasDaVida(v: Vida, ativas: Record<string, number[]>): void {
  const anosNa = new Map<string, number>();
  const porAno = new Map<number, number>();
  for (let i = 0; i <= idade(v); i++) anosNa.set(faixa(i), (anosNa.get(faixa(i)) ?? 0) + 1);
  const cont: Record<string, Record<string, number>> = {};
  const inc = (f: string, k: string) => { (cont[f] ??= {})[k] = ((cont[f] ??= {})[k] ?? 0) + 1; };
  for (const e of v.biografia) {
    const f = faixa(e.idade);
    const bio = e.relevancia === 'marco' || e.relevancia === 'biografia';
    if (bio) { inc(f, 'bio'); porAno.set(e.idade, (porAno.get(e.idade) ?? 0) + 1); }
    if (e.escolha) inc(f, 'decisoes');
    if (!bio) continue;
    if (e.tema === 'familia' || e.tema === 'filhos') inc(f, 'familia');
    if (e.tema === 'trabalho') inc(f, 'trabalho_negocio');
    if (e.tema === 'saude') inc(f, 'saude');
    if (e.tema === 'dinheiro' || e.tema === 'casa') inc(f, 'patrimonio');
    if (e.tema === 'perda') inc(f, 'luto');
    if (e.tema === 'amor') inc(f, 'amor');
  }
  for (const m of v.caminhos.marcas) if (['politica', 'candidatura', 'eleicao', 'derrota', 'fim_politica'].includes(m.tipo)) inc(faixa(Math.floor((m.t - v.eu.tNasc) / 12)), 'politica');
  for (const f of FAIXAS) {
    const anos = anosNa.get(f) ?? 0;
    if (!anos) continue;
    for (const k of ['bio', 'decisoes', 'familia', 'trabalho_negocio', 'saude', 'patrimonio', 'luto', 'amor', 'politica']) soma(f, k, cont[f]?.[k] ?? 0, anos);
    let vazios = 0;
    for (let i = 0; i <= idade(v); i++) if (faixa(i) === f && !porAno.get(i)) vazios++;
    soma(f, 'anos_sem_bio', vazios, anos);
    const a = ativas[f] ?? [];
    soma(f, 'relacoes_ativas', a.reduce((s, x) => s + x, 0), a.length);
  }
}

/* ------------------------------------------- Classes de problema do Playtest #4 */

const problemas: Record<string, { n: number; exemplo: string }> = {};
const problema = (k: string, ex: string) => { problemas[k] ??= { n: 0, exemplo: ex }; problemas[k].n++; };
function problemasDoAno(v: Vida, t: string, semente: number): void {
  const onde = `${t} ${semente}, ${idade(v)} anos`;
  const n = donoIntegral(v);
  if (n && (n.lucroAno ?? 0) > 5000 && !(n.retiradaAno ?? 0) && !n.passivo) problema('dono_sem_renda_com_lucro', `${onde}: ${n.nome}`);
  const h = v.caminhos.politica?.historico ?? [];
  const ult = h[h.length - 1];
  if (ult && (ult.resultado === 'eleito' || ult.resultado === 'derrotado') && ult.t > v.t - 12 && !ult.fatores) problema('eleicao_sem_explicacao', onde);
  for (const e of v.biografia.slice(-12)) if (e.t > v.t - 12 && /undefined|NaN/.test(e.texto)) problema('texto_quebrado', `${onde}: ${e.texto}`);
  const d = deslocamento(v);
  if (d && d.modo === 'publico' && v.trabalho.licencas.includes('cnh') && v.financas.bens.some(b => b.tipo === 'veiculo' && !b.parado && !b.problema && b.modeloId.startsWith('carro')) && !v.deslocamento) problema('carro_sem_trajeto', onde);
  // Luto de um filho sem ninguém da família em luto junto (a esposa que "não soube").
  for (const e of v.biografia) {
    if (e.t !== v.t && e.t < v.t - 11) continue;
    if (e.evento?.tipo !== 'morte' || !e.evento.pessoaId) continue;
    const morto = v.pessoas[e.evento.pessoaId];
    if (!morto || v.vinculos[morto.id]?.parentesco !== 'filho') continue;
    const outro = morto.genitores?.find(g => g !== 'eu');
    const p = outro ? v.pessoas[outro] : undefined;
    if (p?.vivo && v.vinculos[p.id] && !(p.aperto?.tipo === 'luto')) problema('outro_genitor_sem_luto', `${onde}: ${morto.nome}`);
  }
}

/** A trajetória "família": casa aos 27 e tem dois filhos (para a meia-idade ter de quem falar). */
function comFamilia(v: Vida, semente: number): Vida {
  return transacao(v, x => {
    const r = criarRng(semente + 3);
    const par = criarPessoa(x, r, { idade: 28, municipioId: x.moradia.municipioId, genero: x.eu.genero === 'feminino' ? 'masculino' : 'feminino' });
    const vin = vincular(x, par, { origem: 'romance', proximidade: 80, convivio: ['casa'] });
    vin.romance = { estagio: 'casamento', tEstagio: x.t, tInicio: x.t - 36, envolvimento: 78, planoFilhos: 'sem_planejar' };
    vin.historia.push({ t: x.t, texto: 'Casaram-se.', tipo: 'casamento', peso: 3 });
    if (x.moradia.tipo === 'pais' || x.moradia.tipo === 'parente') { x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1400, padrao: 3, tInicio: x.t }; for (const w of Object.values(x.vinculos)) if (w.pessoaId !== par.id) w.convivio = w.convivio.filter(c => c !== 'casa'); }
    for (const k of [0, 1]) {
      const f = criarPessoa(x, r, { idade: k * 2, municipioId: x.moradia.municipioId, sobrenome: x.eu.sobrenome });
      f.genitores = ['eu', par.id];
      const vf = vincular(x, f, { parentesco: 'filho', origem: 'familia', proximidade: 80, convivio: ['casa'] });
      vf.tInicio = f.tNasc; garantirVida(f);
    }
    void idadePessoa;
  }).vida;
}

const VIDAS = Number(process.env.VIDAS ?? 12);
const SAIDA = process.env.SAIDA ?? '/tmp/fix4';
mkdirSync(SAIDA, { recursive: true });

type Traj = 'paralelo' | 'dono' | 'atleta_estudante' | 'militar' | 'bichos' | 'politica' | 'bens' | 'livre' | 'familia' | 'investidor';
const TRAJS: Traj[] = ['paralelo', 'dono', 'atleta_estudante', 'militar', 'bichos', 'politica', 'bens', 'livre', 'familia', 'investidor'];

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
    const ult = v.caminhos.politica?.historico[v.caminhos.politica.historico.length - 1];
    if (ult?.resultado === 'derrotado' && r.chance(0.3)) out.push({ tipo: 'politica', oque: 'trocar_partido' } as unknown as Acao);
  }
  if (t === 'investidor' && i >= 30 && v.financas.conta > 20000) out.push({ tipo: 'investir', produto: r.pick(['pos_fixado', 'inflacao', 'acoes'] as const), valor: Math.round(v.financas.conta * 0.6) } as unknown as Acao);
  if ((t === 'bens' || t === 'investidor') && i >= 18 && !v.trabalho.licencas.includes('cnh')) out.push({ tipo: 'cnh' });
  if (t === 'bens') {
    const carro = v.financas.bens.find(b => b.tipo === 'veiculo');
    if (carro) out.push({ tipo: 'usar_veiculo', bemId: carro.id, oque: r.pick(USOS_VEICULO) });
    out.push({ tipo: 'usar_casa', oque: r.pick(USOS_CASA) });
  }
  // Quem tem dinheiro aplicado e esbarra na conta: tira das aplicações (o jogador consentiu).
  const extra: Acao[] = [];
  for (const a of out) { const d = disponibilidade(v, a); if (!podeTentar(d) && d.resgate) { extra.push({ tipo: 'resgatar_e', acao: a }); conta('resgates_consentidos'); } }
  return [...out, ...extra].filter(a => tenta(v, a));
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
    const escolhida = m.opcoes.find(o => o.id === id);
    if (escolhida?.bloqueio && escolhida.resgate) { conta('decisoes_com_resgate'); v = executar(v, { tipo: 'decidir', opcaoId: id, resgatar: true }).vida; continue; }
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
    const ativasPorFaixa: Record<string, number[]> = {};
    while (!v.morte && idade(v) < 85) {
      if (t === 'familia' && idade(v) === 27 && !parceriaAtual(v)) v = comFamilia(v, semente);
      const fx = faixa(idade(v));
      (ativasPorFaixa[fx] ??= []).push(vinculosVivos(v).filter(x => !x.p.especie && x.vin.proximidade >= 40).length);
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
      problemasDoAno(v, t, semente);
      lidos = v.biografia.length;
    }
    vidas++;
    metricasDaVida(v, ativasPorFaixa);
    const n = v.caminhos.negocio;
    if (n) { conta(`negocio:${n.dedicacao ?? 'integral'}:${n.estado}`); conta(`negocio_tipo:${n.tipo}`); }
    if (v.caminhos.esporte) conta(`esporte:${v.caminhos.esporte.fase}:${v.caminhos.esporte.motivoFim ?? '-'}`);
    if (v.caminhos.militar) conta('militar');
    if (v.caminhos.politica) conta(`politica:${v.caminhos.politica.fase}`);
    conta('trancou', v.biografia.filter(e => /^Trancou /.test(e.texto)).length);
    conta('recusou', v.biografia.filter(e => /^Recusou /.test(e.texto)).length);
    conta('pet_velhice_cedo', v.biografia.filter(e => /morreu.*velhice/.test(e.texto) && /aos [1-7] anos/.test(e.texto) && /gat|cachorr|papagai|jabuti/.test(e.texto)).length);
    if (s < 3) writeFileSync(`${SAIDA}/bio-${t}-${semente}.txt`, [...(v.morte ? ['— O que marcou esta vida —', ...retrospectiva(v), ''] : [])].join('\n') + '\n');
    if (s < 3) appendFileSync(`${SAIDA}/bio-${t}-${semente}.txt`, v.biografia.filter(e => e.relevancia !== 'tecnico').map(e => `${String(e.idade).padStart(2)} ${e.relevancia === 'marco' ? '*' : ' '} ${e.texto}`).join('\n'));
  }
}
const tabela = Object.fromEntries(FAIXAS.map(f => [f, Object.fromEntries(Object.entries(met[f] ?? {}).map(([k, x]) => [k, Math.round(x.soma / Math.max(1, x.anos) * 100) / 100]))]));
const resumo = { vidas, segundos: Math.round((Date.now() - t0) / 1000), porFaixa: tabela, problemas, contagem, incoerencias };
writeFileSync(`${SAIDA}/resumo.json`, JSON.stringify(resumo, null, 2));
console.log(JSON.stringify(resumo, null, 2));
