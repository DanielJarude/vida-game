/**
 * VIDA 14 · DEPENDÊNCIAS — o uso que vira problema, com início, intensidade, progressão, consequências, prevenção, ajuda,
 * tratamento, recuperação e recaída. Nunca falha moral: é uma condição de saúde, contada sem glamour e sem sermão.
 *
 * NÃO DUPLICA o que existia: o cigarro e a bebida continuam em `corpo.habitos` (fuma; bebe 'nao' | 'social' | 'muito'),
 * que a saúde, o humor e o resto do jogo já leem; o jogo continua em `apostas` (os anos pesados). Daqui sai a
 * INTENSIDADE (0..100 → uso, uso de risco, dependência, grave), o caminho de saída e o que volta para os hábitos (quem
 * se recupera do cigarro deixa de fumar; quem recai, volta). Novas: outras drogas, compras compulsivas, telas.
 *
 * O ano: a intensidade anda com o estresse, o luto, o apoio e o tratamento; custa (a linha do mês), pesa na saúde, no
 * trabalho e em casa conforme o estágio. A pessoa pode se proteger (limites), pedir ajuda a alguém próximo, tratar-se
 * (grupo de ajuda mútua gratuito, ambulatório, internação) ou tentar parar sozinha. A recaída é parte do caminho.
 */
import { clamp, rngDe } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever, idade, parceiro, vinculosVivos } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { economiaLocal } from '../../dados/lugares';
import { pagar, vereditoDePagar } from '../../sistemas/dinheiro';
import { lancar } from '../../sistemas/extrato';
import {
  DEPENDENCIAS14, NOME_ESTAGIO14, NOME_SUBSTANCIA14,
  type Dependencia14, type Estagio14, type EstadoDependencias14, type ModoTratamento14, type TipoDep14
} from '../../dados14/crencas/crencas';

export { DEPENDENCIAS14, NOME_ESTAGIO14 };
const TIPOS = Object.keys(DEPENDENCIAS14) as TipoDep14[];
const custoLocal = (v: Vida) => Math.max(0.5, economiaLocal(v.moradia.municipioId).custo);
const r100 = (x: number) => Math.round(x / 100) * 100;

export const estagioDe = (d: Dependencia14): Estagio14 => (d.limpoDesde !== undefined ? 'recuperacao' : d.nivel >= 75 ? 'grave' : d.nivel >= 50 ? 'dependencia' : d.nivel >= 25 ? 'risco' : 'uso');
const deps = (v: Vida): EstadoDependencias14 => (v.dependencias14 ??= { lista: {}, marcos: [] });
const marco = (v: Vida, tipo: TipoDep14, o: EstadoDependencias14['marcos'][number]['o']) => { const e = deps(v); e.marcos.push({ t: v.t, tipo, o }); if (e.marcos.length > 40) e.marcos.splice(0, e.marcos.length - 40); };

/** Começa (ou atualiza) uma dependência a partir dos hábitos de sempre e do jogo. */
function sincronizar(v: Vida): void {
  const h = v.corpo.habitos;
  const l = deps(v).lista;
  const garantir = (t: TipoDep14, nivel: number) => {
    const d = l[t];
    if (!d) { l[t] = { nivel, pico: nivel, desde: v.t, recaidas: 0, tentativas: 0 }; marco(v, t, 'inicio'); }
    else if (d.limpoDesde !== undefined) { /* em recuperação: quem decide a recaída é o ano */ }
    else if (d.nivel < nivel) d.nivel = nivel;
  };
  if (h.fuma) garantir('tabaco', 45);
  if (h.bebe === 'muito') garantir('alcool', 50); else if (h.bebe === 'social' && l.alcool && l.alcool.limpoDesde === undefined) l.alcool.nivel = Math.min(l.alcool.nivel, 40);
  const ap = v.apostas?.anosPesados ?? 0;
  if (ap >= 1) garantir('apostas', ap >= 2 ? 55 : 30);
}

/** Devolve aos hábitos o que a dependência é agora (para a saúde e o resto do jogo lerem do lugar de sempre). */
function devolverAosHabitos(v: Vida, t: TipoDep14, d: Dependencia14): void {
  const h = v.corpo.habitos;
  const limpo = d.limpoDesde !== undefined;
  if (t === 'tabaco') h.fuma = !limpo;
  if (t === 'alcool') h.bebe = limpo ? 'nao' : d.nivel >= 50 ? 'muito' : 'social';
  if (t === 'apostas' && limpo && v.apostas) v.apostas.autoexclusao = Math.max(v.apostas.autoexclusao ?? 0, v.t + 12);
}

/** O início de uma dependência nova (as que não vêm dos hábitos): contexto, nunca sorteio solto. */
function inicios(v: Vida): void {
  const i = idade(v);
  if (i < 15) return;
  const r = rngDe(v.id, 'dep14_inicio', v.t);
  const l = deps(v).lista;
  const est = v.mente.estresse;
  const imp = Math.max(0, v.personalidade.tracos.impulsividade);
  const luto = v.luto.some(x => x.peso >= 25 && v.t - x.t <= 24);
  if (!l.drogas && i <= 40 && r.chance((0.004 + (est > 65 ? 0.008 : 0) + imp / 6000 + (luto ? 0.006 : 0) + (v.mundoCriminal ? 0.01 : 0)))) {
    const s = r.pick(['cannabis', 'cannabis', 'estimulantes', 'sedativos', 'opioides'] as const);
    l.drogas = { nivel: 15, pico: 15, desde: v.t, recaidas: 0, tentativas: 0, substancia: s };
    marco(v, 'drogas', 'inicio');
    escrever(v, { texto: `${s === 'opioides' ? 'Os analgésicos receitados para uma dor não pararam quando a dor parou.' : s === 'sedativos' ? 'Os calmantes começaram para dormir numa fase ruim e foram ficando.' : `Começou a usar ${NOME_SUBSTANCIA14[s]} — em festas, no começo.`}`, relevancia: 'cotidiano', tema: 'saude' });
  }
  if (!l.compras && i >= 18 && v.financas.conta > 0 && r.chance(est > 65 ? 0.012 : 0.003)) {
    l.compras = { nivel: 20, pico: 20, desde: v.t, recaidas: 0, tentativas: 0 };
    marco(v, 'compras', 'inicio');
    escrever(v, { texto: 'Comprar virou o alívio do fim do dia: o carrinho cheio, a caixa na porta, a culpa depois.', relevancia: 'cotidiano', tema: 'dinheiro' });
  }
  if (!l.telas && i <= 35 && r.chance(0.006 + (est > 60 ? 0.006 : 0))) {
    l.telas = { nivel: 25, pico: 25, desde: v.t, recaidas: 0, tentativas: 0 };
    marco(v, 'telas', 'inicio');
    escrever(v, { texto: 'O celular passou a ser a primeira coisa do dia e a última da noite — e as horas no meio somem.', relevancia: 'cotidiano', tema: 'saude' });
  }
}

/** O ano das dependências: progressão, custo, consequências, tratamento, recuperação e recaída. */
export function processarDependencias14(v: Vida): void {
  if (v.morte || idade(v) < 12) return;
  sincronizar(v);
  inicios(v);
  const e = v.dependencias14;
  if (!e) return;
  const r = rngDe(v.id, 'dep14', v.t);
  const est = v.mente.estresse;
  const luto = v.luto.some(x => x.peso >= 25 && v.t - x.t <= 24);
  for (const t of TIPOS) {
    const d = e.lista[t];
    if (!d) continue;
    const info = DEPENDENCIAS14[t];
    const tratando = d.tratamento && v.t <= d.tratamento.fim + 12;
    const apoio = d.apoio && v.t - d.apoio.t <= 24;
    const protegido = (d.protecao ?? 0) > v.t;
    // Recuperação: a recaída fica menos provável com o tempo; cinco anos limpos, superada.
    if (d.limpoDesde !== undefined) {
      const anos = (v.t - d.limpoDesde) / 12;
      if (anos >= 5) { delete e.lista[t]; marco(v, t, 'superada'); escrever(v, { texto: `Cinco anos sem ${info.nome.toLowerCase()}. A ${info.condicao} ficou na história — com cuidado, ainda, nos dias ruins.`, relevancia: 'marco', tema: 'saude', tom: 'bom' }); devolverAosHabitos(v, t, { ...d, limpoDesde: d.limpoDesde }); continue; }
      const p = info.recaida * Math.pow(0.6, anos) * (est > 65 ? 1.6 : 1) * (luto ? 1.5 : 1) * (tratando || d.tratamento?.modo === 'grupo' ? 0.6 : 1) * (apoio ? 0.7 : 1);
      if (r.chance(p)) {
        d.limpoDesde = undefined; d.recaidas += 1; d.nivel = Math.max(40, d.pico * 0.7);
        marco(v, t, 'recaida');
        escrever(v, { texto: `Uma recaída, ${anos < 1 ? 'meses' : `${Math.floor(anos)} ano${anos >= 2 ? 's' : ''}`} depois de parar. Faz parte do caminho de muita gente; recomeçar o tratamento é possível.`, relevancia: 'biografia', tema: 'saude', tom: 'ruim' });
      }
      devolverAosHabitos(v, t, d);
      continue;
    }
    // A intensidade anda.
    const passo = info.ritmo * (0.5 + est / 100) * (luto ? 1.4 : 1) * (protegido ? 0.4 : 1) - (apoio ? 4 : 0) - (tratando ? ({ grupo: 12, ambulatorial: 20, internacao: 35 } as Record<ModoTratamento14, number>)[d.tratamento!.modo] : 0) + r.normal() * 3;
    d.nivel = clamp(d.nivel + passo);
    d.pico = Math.max(d.pico, d.nivel);
    const est0 = estagioDe(d);
    if (tratando && d.nivel <= 12) { d.limpoDesde = v.t; marco(v, t, 'recuperacao'); escrever(v, { texto: `Em recuperação da ${info.condicao}: o tratamento ajudou a parar. Um dia de cada vez.`, relevancia: 'biografia', tema: 'saude', tom: 'bom' }); devolverAosHabitos(v, t, d); continue; }
    if (!tratando && d.nivel <= 3) { delete e.lista[t]; devolverAosHabitos(v, t, { ...d, limpoDesde: v.t }); continue; }
    if ((est0 === 'dependencia' || est0 === 'grave') && !d.contado) { d.contado = true; marco(v, t, 'dependencia'); escrever(v, { texto: `O que era ${t === 'compras' || t === 'telas' ? 'hábito' : 'uso'} virou ${info.condicao}: já não é uma escolha de cada dia. Há tratamento — e gente que passou por isso.`, relevancia: 'biografia', tema: 'saude', tom: 'ruim' }); }
    // O custo (a linha do mês × 12).
    const k = est0 === 'grave' ? 3 : est0 === 'dependencia' ? 2 : est0 === 'risco' ? 1 : 0;
    const renda = (v.trabalho.atual?.salario ?? 0);
    const custo = r100(t === 'compras' ? renda * info.custo[k] * 12 : info.custo[k] * custoLocal(v) * 12);
    if (custo > 0 && idade(v) >= 16) { pagar(v, Math.min(custo, Math.max(0, v.financas.conta) + custo * 0.3)); lancar(v, info.linha, 'despesa', -custo); }
    // As consequências, pelo estágio.
    // (o cigarro e a bebida já pesam na saúde pelos hábitos de sempre — `corpo.habitos`; aqui, só o que é novo: as drogas)
    if (k >= 1) { if (t === 'drogas') v.corpo.saude = clamp(v.corpo.saude - k * 1.5); if (k >= 2) v.mente.estresse = clamp(v.mente.estresse + k - 1); }
    if (k >= 2) {
      const emp = v.trabalho.atual;
      if (emp && t !== 'tabaco') emp.desempenho = clamp(emp.desempenho - (k === 3 ? 8 : 4));
      const par = parceiro(v);
      if (par && t !== 'tabaco') par.vin.tensao = clamp(par.vin.tensao + (k === 3 ? 8 : 4));
      v.mente.felicidade = clamp(v.mente.felicidade - k);
    }
    devolverAosHabitos(v, t, d);
  }
}

/* ================================================================ O que a pessoa faz */

export type OqueDep14 =
  | { op: 'proteger'; tipo: TipoDep14 }
  | { op: 'ajuda'; tipo: TipoDep14 }
  | { op: 'tratar'; tipo: TipoDep14; modo: ModoTratamento14 }
  | { op: 'parar'; tipo: TipoDep14 };

export function custoDoTratamento14(v: Vida, modo: ModoTratamento14): number {
  return modo === 'grupo' ? 0 : r100((modo === 'internacao' ? 24000 : 4800) * custoLocal(v));
}

export function disponibilidadeDep14(v: Vida, a: OqueDep14): Veredito {
  const d = v.dependencias14?.lista[a.tipo];
  if (!d) return bloqueio('impossivel', 'Não há isso na sua vida agora.');
  const feito = (k: string) => v.anoAtual.acoes.includes(`dep14:${k}:${a.tipo}`);
  switch (a.op) {
    case 'proteger': return feito('proteger') ? bloqueio('incompativel', 'Os limites já foram postos neste ano.') : d.limpoDesde !== undefined ? bloqueio('incompativel', 'Em recuperação: os limites já estão no dia a dia.') : PERMITIDO;
    case 'ajuda': return feito('ajuda') ? bloqueio('incompativel', 'Já conversou com alguém neste ano.') : !vinculosVivos(v).some(x => x.vin.proximidade >= 50) ? bloqueio('requisito', 'Não há alguém próximo o bastante agora: o grupo de ajuda mútua também escuta.') : PERMITIDO;
    case 'tratar':
      if (d.tratamento && v.t <= d.tratamento.fim) return bloqueio('incompativel', 'O tratamento está em andamento.');
      if (d.limpoDesde !== undefined && a.modo !== 'grupo') return bloqueio('incompativel', 'Em recuperação, o que sustenta é o grupo.');
      if (a.modo === 'internacao' && estagioDe(d) !== 'grave' && estagioDe(d) !== 'dependencia') return bloqueio('incompativel', 'Internação é para a dependência que já não se trata fora.');
      return a.modo === 'grupo' ? PERMITIDO : vereditoDePagar(v, custoDoTratamento14(v, a.modo), 'O tratamento custa');
    case 'parar': return d.limpoDesde !== undefined ? bloqueio('incompativel', 'Já parou.') : feito('parar') ? bloqueio('incompativel', 'Já tentou neste ano.') : { grau: 'improvavel', chance: chanceDeParar(d), motivo: 'Sozinho, é a tentativa mais difícil.' };
  }
}

const chanceDeParar = (d: Dependencia14) => clamp(0.6 - d.nivel / 120 + d.tentativas * 0.03, 0.05, 0.7);

export function executarDep14(v: Vida, a: OqueDep14): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const d = v.dependencias14!.lista[a.tipo]!;
  const info = DEPENDENCIAS14[a.tipo];
  const r = rngDe(v.id, 'dep14_acao', a.op, a.tipo, v.t);
  v.anoAtual.acoes.push(`dep14:${a.op}:${a.tipo}`);
  const fim = (texto: string, tom: 'bom' | 'ruim' | 'neutro', bio = false) => { escrever(v, { texto, relevancia: bio ? 'biografia' : 'cotidiano', tema: 'saude', escolha: true, tom: tom === 'neutro' ? undefined : tom }); return { texto, tom }; };
  switch (a.op) {
    case 'proteger': {
      d.protecao = v.t + 12;
      d.nivel = clamp(d.nivel - 4);
      if (a.tipo === 'apostas' && v.apostas) v.apostas.autoexclusao = Math.max(v.apostas.autoexclusao ?? 0, v.t + 12);
      return fim(a.tipo === 'apostas' ? 'Pediu a autoexclusão dos jogos por um ano e um limite de gasto no banco.' : a.tipo === 'compras' ? 'Apagou os cartões salvos, saiu das listas de ofertas, pôs um limite no cartão.' : a.tipo === 'telas' ? 'Celular fora do quarto, as redes com hora marcada.' : 'Pôs limites: quanto, quando, onde não. Escrito, para não negociar consigo mesmo.', 'bom');
    }
    case 'ajuda': {
      const p = vinculosVivos(v).filter(x => x.vin.proximidade >= 50).sort((x, y) => y.vin.proximidade - x.vin.proximidade)[0];
      d.apoio = { pessoaId: p?.p.id, t: v.t };
      if (p) p.vin.proximidade = clamp(p.vin.proximidade + 4);
      marco(v, a.tipo, 'ajuda');
      return fim(`Contou para ${p?.p.nome ?? 'alguém próximo'} o que vinha acontecendo com ${info.nome.toLowerCase()}. Não houve sermão: houve um "e agora, como eu te ajudo?".`, 'bom', true);
    }
    case 'tratar': {
      const custo = custoDoTratamento14(v, a.modo);
      if (custo) { pagar(v, custo); lancar(v, 'Tratamento de saúde', 'despesa', -custo); }
      d.tratamento = { modo: a.modo, inicio: v.t, fim: v.t + (a.modo === 'internacao' ? 3 : 12) };
      d.tentativas += 1;
      d.nivel = clamp(d.nivel - (a.modo === 'internacao' ? 25 : a.modo === 'ambulatorial' ? 10 : 5));
      if (a.modo === 'internacao') v.mente.estresse = clamp(v.mente.estresse - 5);
      marco(v, a.tipo, 'tratamento');
      return fim(a.modo === 'grupo' ? `Começou a ir a ${info.grupo}: gente que entende sem precisar explicar, toda semana, de graça.` : a.modo === 'ambulatorial' ? `Começou o tratamento ambulatorial: consulta, acompanhamento, ${a.tipo === 'tabaco' ? 'a reposição de nicotina' : 'terapia'} (${fmt(custo)}).` : `Internou-se por algumas semanas numa clínica de tratamento (${fmt(custo)}). Saiu com um plano e com a lista de quem chamar.`, 'bom', true);
    }
    case 'parar': {
      d.tentativas += 1;
      if (r.chance(chanceDeParar(d))) { d.limpoDesde = v.t; marco(v, a.tipo, 'recuperacao'); devolverAosHabitos(v, a.tipo, d); return fim(`Parou com ${info.nome.toLowerCase()}, por conta própria. Os primeiros meses são os mais difíceis.`, 'bom', true); }
      d.nivel = clamp(d.nivel - 3);
      return fim('Tentou parar sozinho e não segurou. Não é fraqueza: com ajuda, a chance é outra.', 'ruim');
    }
  }
}

/* ================================================================ Leitura e saves */

export function leituraDependencias14(v: Vida) {
  const e = v.dependencias14;
  if (!e) return undefined;
  const lista = (Object.entries(e.lista) as [TipoDep14, Dependencia14][]).map(([t, d]) => ({
    tipo: t, nome: DEPENDENCIAS14[t].nome, condicao: DEPENDENCIAS14[t].condicao, substancia: d.substancia ? NOME_SUBSTANCIA14[d.substancia] : undefined,
    estagio: NOME_ESTAGIO14[estagioDe(d)], est: estagioDe(d), nivel: Math.round(d.nivel), desde: anoDe(d.desde), limpo: d.limpoDesde !== undefined ? anoDe(d.limpoDesde) : undefined,
    tratamento: d.tratamento && v.t <= d.tratamento.fim ? d.tratamento.modo : undefined, recaidas: d.recaidas, grupo: DEPENDENCIAS14[t].grupo,
    custos: { ambulatorial: custoDoTratamento14(v, 'ambulatorial'), internacao: custoDoTratamento14(v, 'internacao') }
  }));
  return lista.length || e.marcos.length ? { lista, marcos: e.marcos.slice(-6).reverse().map(m => ({ ano: anoDe(m.t), tipo: DEPENDENCIAS14[m.tipo].nome, o: m.o })) } : undefined;
}

export function normalizarVida14Dependencias(v: Vida): void {
  const e = v.dependencias14;
  if (!e) return;
  if (typeof e !== 'object' || !e.lista || typeof e.lista !== 'object') { delete v.dependencias14; return; }
  for (const [t, d] of Object.entries(e.lista)) if (!(t in DEPENDENCIAS14) || !d || !Number.isFinite(d.nivel)) delete (e.lista as Record<string, unknown>)[t];
  if (!Array.isArray(e.marcos)) e.marcos = [];
}
