/**
 * VIDA 13 · FAMA — O NÚCLEO ÚNICO DE RECONHECIMENTO.
 *
 * A notoriedade (`notoriedade`) continua sendo o quanto o público conhece você; a ficha da fama (`fama`), o prestígio, o
 * alcance e a imagem. Este módulo junta o resto num só lugar, para TODAS as áreas (esporte, arte, música, negócios,
 * política, redes) — não um reconhecimento por área:
 *
 *   ORIGENS        por que o público conhece você, com o registro que prova: o título, a obra, o mandato, a empresa, a
 *                  conta, o feito, a polêmica. Nada sem registro.
 *   MARCOS         o que mexeu no nome, guardado com a data (`v.fama13.marcos`): conquistas, feitos, controvérsias,
 *                  fracassos, eleições — lidos do estado no ano em que aconteceram (os segredos públicos somem da lista
 *                  depois de dez anos; o marco fica). É daqui que os eventos de histórico (`h13_*`) tiram o passado.
 *   IMAGEM         admiração e rejeição (0..100), derivadas dos marcos (o tempo apaga devagar) e da imagem de agora.
 *   REAÇÕES        o mundo reage na medida do nome: o pass anual `mundoReage13` sorteia (gerador derivado, nunca o
 *                  principal) uma reação (`f13_*`: patrocínio, convite, participação, proposta, pressão, gente querendo
 *                  conhecer, paparazzi, boato com gente de verdade, vaia, homenagem, mobilização) ou uma lembrança do
 *                  histórico (`h13_*`). Quem é anônimo não recebe reação nenhuma; quem não tem passado registrado, nenhuma
 *                  lembrança.
 *   DINHEIRO       o que a fama pagou (`receitas`): campanhas, participações, palestras, conselhos — com valor pelo
 *                  tamanho do nome, o alcance, a imagem e o nível de renda do país, lançado no extrato.
 *
 * As empresas grandes (VIDA 12.9) passam a dar nome: um motivo extra registrado em `notoriedade` (o dono de uma
 * montadora de bilhões não é anônimo).
 */

import type { FonteDoNome, Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { idade } from '../nucleo';
import { anoDe } from '../tempo';
import { flex, ge } from '../texto';
import { faixaDaNotoriedade, imagemPublica, palavraDaNotoriedade, pesoDaExposicao, registrarMotivoDoNome, rendaDeImagem } from './notoriedade';
import { leituraDaFama, prestigioProfissional } from './fama';
import { contasAtivas, publicoReal } from './redesBase';
import { nivelSalarial } from '../mundo/economia';
import { paisDaVida } from '../mundo/vida';
import { lancar } from './extrato';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { oClube } from '../dados/clubes';

export type OrigemDaFama13 = 'esportiva' | 'artistica' | 'musical' | 'empresarial' | 'politica' | 'digital' | 'feito' | 'controversia';
export type TipoDeMarco13 = 'conquista' | 'feito' | 'controversia' | 'fracasso' | 'eleicao' | 'derrota' | 'obra' | 'subiu' | 'caiu' | 'superou' | 'causa';

export interface MarcoDaFama13 {
  t: number;
  tipo: TipoDeMarco13;
  /** A frase curta, a partir do registro ("Campeão da Série A com o Atlético, em 2034"). */
  texto: string;
  /** A chave do registro de origem (nunca dois marcos do mesmo registro). */
  ref: string;
  /** O que pesa na imagem: + admiração, − rejeição (|peso| até ~30). */
  peso: number;
  area?: OrigemDaFama13;
}

export interface Fama13 {
  /** Desde quando o histórico é lido (o primeiro ano com o 13; os registros de antes entram com a data deles). */
  desde?: number;
  marcos?: MarcoDaFama13[];
  /** A notoriedade de cada ano ([ano, valor]): a fama no tempo. */
  serie?: [number, number][];
  /** O que a fama pagou fora da renda mensal (campanhas, participações, palestras, conselhos). */
  receitas?: { t: number; valor: number; rotulo: string }[];
  /** Quantas reações de cada tipo já houve (para a tela e os testes). */
  reacoes?: Record<string, number>;
}

export const ROTULO_ORIGEM: Record<OrigemDaFama13, string> = {
  esportiva: 'Esporte', artistica: 'Arte', musical: 'Música', empresarial: 'Negócios', politica: 'Política', digital: 'Redes', feito: 'Um feito', controversia: 'Polêmica'
};

/* ------------------------------------------------------------------ O nome das empresas grandes */

/**
 * O que uma empresa grande dá de nome ao dono (antes da inércia): pelo valor (escala de dez em dez) e pela reputação.
 * R$ 100 mi ≈ 30 (conhecido na região), R$ 1 bi ≈ 50, R$ 10 bi ≈ 75. Investidor não aparece; a que está abrindo, metade.
 */
export function nomeDasEmpresas13(v: Vida): { valor: number; fonte: FonteDoNome } | undefined {
  let melhor = 0;
  for (const e of v.financas.empresas ?? []) {
    if (e.estado === 'encerrada' || e.papel === 'investidor') continue;
    const aval = Math.max(0, e.avaliacao ?? 0) * (e.papel === 'dono' ? 1 : Math.max(0.4, e.parte));
    if (aval < 5e6) continue;
    const base = (Math.log10(aval) - 6.7) * 24;
    const rep = 0.6 + clamp(e.reputacao ?? 40) / 100 * 0.6;
    melhor = Math.max(melhor, base * rep * (e.estado === 'abrindo' ? 0.5 : 1));
  }
  return melhor >= 1 ? { valor: clamp(melhor), fonte: 'negocio' } : undefined;
}
registrarMotivoDoNome(nomeDasEmpresas13);

/* ------------------------------------------------------------------ Os marcos (lidos do estado) */

const ano = (t: number) => anoDe(t);
const ativasGrandes = (v: Vida) => (v.financas.empresas ?? []).filter(e => e.papel !== 'investidor');

/** Os marcos que o estado registra AGORA (cada um com a sua data e a sua chave). Nada inventado: só o que está escrito. */
export function marcosDoEstado13(v: Vida): MarcoDaFama13[] {
  const out: MarcoDaFama13[] = [];
  const g = ge(v);
  // O esporte: os títulos de quem foi peça central, as seleções, os prêmios, os rebaixamentos.
  for (const c of v.caminhos.palmares ?? []) {
    const onde = c.clube && !c.texto.includes(c.clube) ? ` com ${oClube(c.clube)}` : '';
    if (c.tipo === 'selecao' && /^Campe/.test(c.texto)) out.push({ t: c.t, tipo: 'feito', texto: `${c.texto} (${c.ano})`, ref: `pal:${c.trofeuId ?? c.texto}:${c.ano}`, peso: 30, area: 'esportiva' });
    else if (c.tipo === 'titulo' && c.papel === 'protagonista') out.push({ t: c.t, tipo: 'conquista', texto: `${c.texto}${onde} (${c.ano})`, ref: `pal:${c.trofeuId ?? c.texto}:${c.ano}`, peso: 12, area: 'esportiva' });
    else if (c.tipo === 'premio') out.push({ t: c.t, tipo: 'conquista', texto: `${c.texto} (${c.ano})`, ref: `pal:${c.texto}:${c.ano}`, peso: 10, area: 'esportiva' });
    else if (c.tipo === 'rebaixamento') out.push({ t: c.t, tipo: 'fracasso', texto: `${c.texto}${onde} (${c.ano})`, ref: `pal:${c.texto}:${c.ano}`, peso: -4, area: 'esportiva' });
  }
  // A obra: o que marcou o público, o prêmio vencido.
  for (const o of v.caminhos.obras ?? []) {
    const pub = o.comercial ?? o.recepcao;
    if (o.premio?.venceu) out.push({ t: o.t, tipo: 'conquista', texto: `${o.premio.nome} por "${o.titulo}" (${ano(o.t)})`, ref: `obra:${o.titulo}:${o.t}:p`, peso: 14, area: o.linguagem === 'musica' ? 'musical' : 'artistica' });
    else if (pub >= 3) out.push({ t: o.t, tipo: 'obra', texto: `"${o.titulo}" marcou o público (${ano(o.t)})`, ref: `obra:${o.titulo}:${o.t}`, peso: 9, area: o.linguagem === 'musica' ? 'musical' : 'artistica' });
  }
  for (const x of v.caminhos.curriculo ?? []) {
    if (!x.premio?.venceu) continue;
    const fora = x.premio.alcance === 'internacional';
    out.push({ t: x.t, tipo: fora ? 'feito' : 'conquista', texto: `${x.premio.nome} por "${x.titulo}" (${ano(x.t)})`, ref: `cur:${x.titulo}:${x.t}`, peso: fora ? 24 : 12, area: 'artistica' });
  }
  // A política: as eleições, as derrotas, a cassação, os mandatos bem avaliados, o escândalo.
  const p = v.caminhos.politica;
  for (const h of p?.historico ?? []) {
    if (h.resultado === 'eleito') out.push({ t: h.t, tipo: 'eleicao', texto: `Eleit${flex(g, 'o', 'a', 'e')} para ${h.cargo.replace(/_/g, ' ')} (${ano(h.t)})`, ref: `pol:${h.cargo}:${h.t}:e`, peso: 8, area: 'politica' });
    else if (h.resultado === 'derrotado') out.push({ t: h.t, tipo: 'derrota', texto: `Derrota na eleição para ${h.cargo.replace(/_/g, ' ')} (${ano(h.t)})`, ref: `pol:${h.cargo}:${h.t}:d`, peso: -2, area: 'politica' });
    else if (h.resultado === 'cassado') out.push({ t: h.t, tipo: 'controversia', texto: `Mandato cassado (${ano(h.t)})`, ref: `pol:${h.cargo}:${h.t}:c`, peso: -26, area: 'politica' });
    else if (h.resultado === 'concluiu' && (h.aprovacao ?? 0) >= 65) out.push({ t: h.t, tipo: 'conquista', texto: `Saiu do mandato com ${h.aprovacao}% de aprovação (${ano(h.t)})`, ref: `pol:${h.cargo}:${h.t}:a`, peso: 10, area: 'politica' });
  }
  if (p?.escandalo) out.push({ t: p.escandalo.t, tipo: 'controversia', texto: `Escândalo na vida pública (${ano(p.escandalo.t)})`, ref: `pol:esc:${p.escandalo.t}`, peso: -18, area: 'politica' });
  // O que virou público (o caso, o processo, a prisão).
  for (const s of v.segredos ?? []) {
    if (!s.publico || s.publico <= 0) continue;
    const oque = s.tipo === 'caso' ? 'Um caso fora do casamento virou notícia' : s.tipo === 'prisao' ? 'A prisão virou notícia' : 'Um processo virou notícia';
    out.push({ t: s.publico, tipo: 'controversia', texto: `${oque} (${ano(s.publico)})`, ref: `seg:${s.id}`, peso: s.tipo === 'caso' ? -14 : -20, area: 'controversia' });
  }
  // A frase que pegou mal, a causa abraçada (o último de cada um: o fato guarda só a data).
  const pol = v.fatos['vis_polemica'];
  if (pol !== undefined) out.push({ t: pol, tipo: 'controversia', texto: `Uma fala sua virou polêmica (${ano(pol)})`, ref: `vis:pol:${pol}`, peso: -8, area: 'controversia' });
  const boa = v.fatos['vis_boa'];
  if (boa !== undefined && (v.notoriedade?.valor ?? 0) >= 20) out.push({ t: boa, tipo: 'causa', texto: `O público gostou do que você fez com o nome (${ano(boa)})`, ref: `vis:boa:${boa}`, peso: 5 });
  // Os negócios: o que fechou; a empresa que faliu.
  const n = v.caminhos.negocio;
  if (n?.estado === 'fechado' && n.tFim !== undefined) out.push({ t: n.tFim, tipo: 'fracasso', texto: `${n.nome} fechou as portas (${ano(n.tFim)})`, ref: `neg:${n.nome}:${n.tFim}`, peso: -3, area: 'empresarial' });
  for (const e of ativasGrandes(v)) if (e.estado === 'encerrada' && e.tFim !== undefined && (e.anosNoVermelho ?? 0) >= 1) out.push({ t: e.tFim, tipo: 'fracasso', texto: `${e.nome} encerrou as atividades (${ano(e.tFim)})`, ref: `emp:${e.id}:fim`, peso: (e.avaliacao ?? 0) >= 5e7 ? -10 : -3, area: 'empresarial' });
  // O nome: quando subiu de patamar, quando esfriou (os fatos que a notoriedade grava).
  for (const k of [2, 3, 4]) { const t = v.fatos[`noto_faixa_${k}`]; if (t !== undefined) out.push({ t, tipo: 'subiu', texto: `${k === 4 ? 'O país inteiro passou a reconhecer o seu nome' : k === 3 ? `Ficou ${flex(g, 'famoso', 'famosa', 'famose')}` : `Passou a ser ${flex(g, 'reconhecido', 'reconhecida', 'reconhecide')} na rua`} (${ano(t)})`, ref: `noto:${k}`, peso: 0 }); }
  const esq = v.fatos['noto_esqueceu'];
  if (esq !== undefined) out.push({ t: esq, tipo: 'caiu', texto: `O nome saiu das manchetes (${ano(esq)})`, ref: 'noto:esqueceu', peso: 0 });
  return out;
}

/**
 * O ano dos marcos (silencioso): guarda o que o estado registra e ainda não estava guardado, e a notoriedade do ano.
 * Na primeira vez (saves antigos), guarda tudo o que já está registrado — com a data de cada registro, nunca inventada.
 */
export function registrarMarcos13(v: Vida): void {
  const noto = v.notoriedade?.valor ?? 0;
  const atual = marcosDoEstado13(v);
  if (!v.fama13 && !atual.length && noto <= 0) return;
  const f = (v.fama13 ??= {});
  f.desde ??= v.t;
  const lista = (f.marcos ??= []);
  const vistos = new Set(lista.map(m => m.ref));
  for (const m of atual) if (!vistos.has(m.ref) && m.t <= v.t) { lista.push(m); vistos.add(m.ref); }
  lista.sort((a, b) => a.t - b.t);
  if (lista.length > 60) lista.splice(0, lista.length - 60);
  if (!lista.length) delete f.marcos;
  if (noto > 0 || f.serie?.length) {
    const s = (f.serie ??= []);
    const a = ano(v.t);
    if (s.length && s[s.length - 1][0] === a) s[s.length - 1][1] = Math.round(noto);
    else s.push([a, Math.round(noto)]);
    if (s.length > 40) s.splice(0, s.length - 40);
  }
}

/** Os marcos guardados (os do 13 e, se o ano ainda não passou, os que o estado já tem). */
export function marcosDaFama13(v: Vida): MarcoDaFama13[] {
  const guardados = v.fama13?.marcos ?? [];
  const refs = new Set(guardados.map(m => m.ref));
  return [...guardados, ...marcosDoEstado13(v).filter(m => !refs.has(m.ref))].sort((a, b) => a.t - b.t);
}

/* ------------------------------------------------------------------ A imagem: admiração e rejeição */

/** O peso de um marco hoje: o tempo apaga devagar (meia-vida de seis anos; a controvérsia, oito — a rua lembra mais do ruim). */
const desbota = (v: Vida, m: MarcoDaFama13) => Math.pow(0.5, Math.max(0, v.t - m.t) / 12 / (m.peso < 0 ? 8 : 6));

export interface ImagemDaFama13 { admiracao: number; rejeicao: number; palavra: string; texto: string }

/**
 * Admiração e rejeição (0..100) de quem o público conhece. Não existem para anônimos. A controvérsia que a pessoa
 * enfrentou de frente (`superou`) pesa menos.
 */
export function imagemDaFama13(v: Vida): ImagemDaFama13 | undefined {
  const noto = v.notoriedade?.valor ?? 0;
  if (noto < 15) return undefined;
  let adm = 20, rej = 6;
  const superou = new Set((v.fama13?.marcos ?? []).filter(m => m.tipo === 'superou').map(m => m.ref.replace(/^sup:/, '')));
  for (const m of marcosDaFama13(v)) {
    const w = desbota(v, m) * (superou.has(m.ref) ? 0.4 : 1);
    if (m.peso > 0) adm += m.peso * w * 1.4; else rej += -m.peso * w * 1.6;
  }
  const im = imagemPublica(v);
  if (im?.palavra === 'querida') adm += 14;
  if (im?.palavra === 'marcante') adm += 6;
  if (im?.palavra === 'desgastada') rej += 12;
  if (im?.palavra === 'polêmica') rej += 10;
  // Quem é muito conhecido divide mais: a rejeição cresce um pouco com o tamanho do nome.
  rej += Math.max(0, noto - 50) * 0.12;
  const admiracao = Math.round(clamp(adm));
  const rejeicao = Math.round(clamp(rej));
  const d = admiracao - rejeicao;
  const palavra = rejeicao >= 55 && admiracao < rejeicao ? 'rejeitada' : rejeicao >= 40 && admiracao >= 40 ? 'divide opiniões' : d >= 35 ? 'admirada' : d >= 12 ? 'bem vista' : d <= -15 ? 'malvista' : 'neutra';
  const texto = palavra === 'rejeitada' ? 'Boa parte do público torce o nariz para o seu nome.'
    : palavra === 'divide opiniões' ? 'Quem gosta, gosta muito; quem não gosta, faz questão de dizer.'
      : palavra === 'admirada' ? 'O público fala bem de você — e as portas abrem mais fácil.'
        : palavra === 'bem vista' ? 'A maior parte do que se fala de você é bom.'
          : palavra === 'malvista' ? 'O que mais se lembra de você não é bom.'
            : 'O público conhece o nome sem uma opinião forte sobre ele.';
  return { admiracao, rejeicao, palavra, texto };
}

/* ------------------------------------------------------------------ As origens (com o registro que prova) */

export interface OrigemLida13 { origem: OrigemDaFama13; peso: number; porque: string }

/** Por que o público conhece você — cada origem com o registro que a prova. Ordenadas pelo peso. */
export function origensDaFama13(v: Vida): OrigemLida13[] {
  const n = v.notoriedade;
  const out: OrigemLida13[] = [];
  const os = n?.origens ?? (n?.fonte ? { [n.fonte]: n.pico } : {});
  const pal = v.caminhos.palmares ?? [];
  const add = (origem: OrigemDaFama13, peso: number, porque: string) => { if (peso > 0) out.push({ origem, peso: Math.round(peso), porque }); };
  if (os.esporte) {
    const titulos = pal.filter(x => x.tipo === 'titulo').length;
    const mod = v.caminhos.esporte?.modalidade;
    add('esportiva', os.esporte, titulos ? `${titulos} ${titulos === 1 ? 'título' : 'títulos'} no ${mod === 'futebol' || !mod ? 'futebol' : 'esporte'}${v.caminhos.esporte?.selecao?.jogos ? `, ${v.caminhos.esporte.selecao.jogos} jogos pela seleção` : ''}` : v.caminhos.esporte?.fase === 'profissional' ? 'a carreira profissional, as temporadas na frente da torcida' : 'o que fez no esporte');
  }
  if (os.arte) {
    const musica = v.caminhos.arte?.linguagem === 'musica' || (v.caminhos.obras ?? []).filter(o => o.linguagem === 'musica').length > (v.caminhos.obras ?? []).length / 2
      || ['musica'].includes(ocupacaoOuNula(v.trabalho.atual?.ocupacaoId ?? '')?.trilha ?? '');
    const marcou = (v.caminhos.obras ?? []).filter(o => (o.comercial ?? o.recepcao) >= 3);
    const trabalhos = (v.caminhos.curriculo ?? []).filter(x => (x.publico ?? x.repercussao) >= 2).length;
    add(musica ? 'musical' : 'artistica', os.arte, marcou.length ? `${marcou.length === 1 ? `"${marcou[0].titulo}"` : `${marcou.length} obras que marcaram o público`}${v.caminhos.arte ? ` — ${v.caminhos.arte.nome}` : ''}` : trabalhos ? `${trabalhos} trabalhos que o público viu` : v.caminhos.arte ? `o trabalho com ${v.caminhos.arte.nome}` : 'o palco e os trabalhos');
  }
  if (os.politica) {
    const h = v.caminhos.politica?.historico ?? [];
    const eleito = h.filter(x => x.resultado === 'eleito').length;
    add('politica', os.politica, eleito ? `${eleito} ${eleito === 1 ? 'eleição vencida' : 'eleições vencidas'}${v.caminhos.politica?.mandato ? ', o mandato em curso' : ''}` : 'a vida pública');
  }
  if (os.negocio) {
    const grande = (v.financas.empresas ?? []).filter(e => e.estado !== 'encerrada' && e.papel !== 'investidor').sort((a, b) => (b.avaliacao ?? 0) - (a.avaliacao ?? 0))[0];
    add('empresarial', os.negocio, grande ? `${grande.nome}${grande.unidades > 1 ? `, ${grande.unidades} unidades` : ''}` : v.caminhos.negocio ? `${v.caminhos.negocio.nome}` : 'os negócios');
  }
  if (os.rede) {
    const seg = contasAtivas(v).reduce((s, c) => s + publicoReal(c), 0);
    add('digital', os.rede, seg >= 1000 ? `${seg >= 1e6 ? `${(seg / 1e6).toFixed(1).replace('.', ',')} milhão` : `${Math.round(seg / 1000)} mil`} de pessoas seguindo` : 'o que publica nas redes');
  }
  // O feito: o que atravessou a fronteira (a copa de seleções, o prêmio internacional) — soma ao nome, com prova.
  const feitos = (v.fama13?.marcos ?? marcosDoEstado13(v)).filter(m => m.tipo === 'feito');
  if (feitos.length && (n?.valor ?? 0) >= 10) add('feito', Math.min(100, (n?.pico ?? 0) * 0.9), feitos[feitos.length - 1].texto);
  // A polêmica: quando a rejeição é o que mais se lembra.
  const im = imagemDaFama13(v);
  const contro = marcosDaFama13(v).filter(m => m.tipo === 'controversia' && v.t - m.t <= 120);
  if (im && contro.length && im.rejeicao >= 35) add('controversia', im.rejeicao * 0.9, contro[contro.length - 1].texto);
  return out.sort((a, b) => b.peso - a.peso);
}

/* ------------------------------------------------------------------ A leitura (a tela e os eventos leem daqui) */

export interface LeituraDaFama13 {
  /** Vale mostrar a fama (o público conhece o nome, há um público real nas redes, ou a pessoa é referência no meio). */
  relevante: boolean;
  valor: number;
  nivel: number;
  palavra: string;
  origem?: OrigemDaFama13;
  origens: OrigemLida13[];
  alcance: string;
  imagem?: ImagemDaFama13;
  tendencia: 'subindo' | 'caindo' | 'estável';
  /** O que a fama pagou nos últimos 12 meses e na vida toda (fora da renda mensal de imagem). */
  receitaAno: number;
  receitaTotal: number;
  /** A renda mensal de patrocínio e publicidade (`rendaDeImagem`). */
  imagemMensal: number;
  beneficios: string[];
  custos: string[];
  privacidade: 'tranquila' | 'olhada' | 'difícil' | 'quase nenhuma';
}

export const origemPrincipal13 = (v: Vida): OrigemDaFama13 | undefined => origensDaFama13(v)[0]?.origem;

export function leituraDaFama13(v: Vida): LeituraDaFama13 {
  const valor = Math.round(v.notoriedade?.valor ?? 0);
  const nivel = faixaDaNotoriedade(valor);
  const f = leituraDaFama(v);
  const origens = origensDaFama13(v);
  const imagem = imagemDaFama13(v);
  const serie = v.fama13?.serie ?? [];
  const antes = serie.length >= 3 ? serie[serie.length - 3][1] : serie[0]?.[1] ?? valor;
  const tendencia = valor - antes >= 4 ? 'subindo' : antes - valor >= 4 ? 'caindo' : 'estável';
  const rec = v.fama13?.receitas ?? [];
  const receitaAno = rec.filter(x => v.t - x.t < 12).reduce((s, x) => s + x.valor, 0);
  const receitaTotal = rec.reduce((s, x) => s + x.valor, 0);
  const imagemMensal = rendaDeImagem(v);
  const privacidade = valor >= 78 ? 'quase nenhuma' : valor >= 55 ? 'difícil' : valor >= 30 ? 'olhada' : 'tranquila';
  const beneficios: string[] = [];
  const custos: string[] = [];
  if (imagemMensal > 0) beneficios.push('Patrocínio e publicidade todo mês — as marcas pagam pelo seu rosto.');
  if (nivel >= 2) beneficios.push(nivel >= 3 ? 'Convites chegam sem você pedir: programas, eventos, participações, propostas.' : 'Às vezes chega um convite: uma entrevista, um evento da cidade.');
  if (nivel >= 2 && origens.some(o => o.origem === 'empresarial')) beneficios.push('O mercado presta atenção: parcerias e conselhos procuram você.');
  if (nivel >= 2 && origens.some(o => o.origem === 'politica')) beneficios.push('O que você diz vira pauta — e pesa nas decisões da cidade.');
  if (nivel >= 3) beneficios.push('Gente nova quer conhecer você — de quem admira a quem quer algo.');
  if (imagem && imagem.admiracao >= 55) beneficios.push('A admiração abre portas: homenagens, causas que querem o seu nome.');
  if (nivel >= 3 || (f.digital?.seguidores ?? 0) >= 500_000) beneficios.push('Influência: quando você chama, gente aparece (mobilizar uma causa).');
  if (f.prestigio.valor >= 50) beneficios.push(`Respeito no meio (${f.prestigio.palavra}): ${f.prestigio.por ?? 'pelo trabalho'}.`);
  if (nivel >= 2) custos.push(nivel >= 4 ? 'Anonimato não existe mais: ir à padaria é um evento.' : nivel >= 3 ? 'Sair sem ser parado é difícil; jantar fora, quase impossível.' : 'Na rua, de vez em quando, alguém para você.');
  if (valor >= 45) custos.push('Boatos: perfis de fofoca inventam histórias — às vezes com gente da sua vida.');
  if (valor >= 55) custos.push('Fotógrafos e curiosos: a vida privada vira notícia, e a parceria sente.');
  const peso = pesoDaExposicao(v);
  if (peso) custos.push(`A cabeça paga: ${peso.texto}.`);
  if (imagem && imagem.rejeicao >= 35) custos.push('Rejeição: parte do público vaia, comenta, cobra — e as marcas pensam duas vezes.');
  if (nivel >= 2 && origens.some(o => o.origem === 'politica')) custos.push('Pressão e expectativa: cobram posição sobre tudo, o tempo todo.');
  return {
    // Prestígio de ofício comum não é fama: só o nome conhecido, um público de verdade nas redes ou ser referência no meio.
    relevante: valor >= 10 || (f.digital?.seguidores ?? 0) >= 10_000 || f.prestigio.valor >= 75,
    valor, nivel, palavra: palavraDaNotoriedade(v), origem: origens[0]?.origem, origens,
    alcance: alcance13(v, f.alcance), imagem, tendencia, receitaAno, receitaTotal, imagemMensal, beneficios, custos, privacidade
  };
}

/** O alcance: o da ficha, e "fora do país" também para um feito internacional, a presidência ou uma empresa gigante. */
function alcance13(v: Vida, base: string): string {
  if (base !== 'o país') return base;
  const noto = v.notoriedade?.valor ?? 0;
  const feito = (v.fama13?.marcos ?? []).some(m => m.tipo === 'feito');
  const gigante = (v.financas.empresas ?? []).some(e => e.estado !== 'encerrada' && e.papel !== 'investidor' && (e.avaliacao ?? 0) >= 5e9);
  const presidente = !!v.caminhos.politica?.mandato && v.caminhos.politica.mandato.cargo === 'presidente';
  return noto >= 78 && (feito || gigante || presidente) ? 'fora do país' : base;
}

/** O tamanho das reações (0..1): o nome e até onde ele chega. Quem é anônimo: zero. */
export function intensidade13(v: Vida): number {
  const x = v.notoriedade?.valor ?? 0;
  if (x < 10) return 0;
  return clamp(x / 100 * (alcance13(v, leituraDaFama(v).alcance) === 'fora do país' ? 1.15 : 1), 0, 1);
}

/* ------------------------------------------------------------------ O dinheiro da fama */

/**
 * O valor de uma campanha (o quanto a marca paga por um rosto): pelo nome (curva quadrática), pelo alcance, pela imagem
 * (admiração sobe, rejeição derruba) e pelo nível de renda do país. Em reais (a unidade do motor).
 */
export function valorDaCampanha13(v: Vida, escala = 1): number {
  const x = v.notoriedade?.valor ?? 0;
  if (x < 20) return 0;
  const alc = { 'a cidade': 0.5, 'a região': 0.8, 'o país': 1, 'fora do país': 1.6 }[alcance13(v, leituraDaFama(v).alcance)] ?? 0.4;
  const im = imagemDaFama13(v);
  const imagem = im ? clamp(1 + (im.admiracao - im.rejeicao) / 160, 0.45, 1.4) : 1;
  const pais = nivelSalarial(paisDaVida(v));
  return Math.round(((x - 15) ** 2) * 60 * alc * imagem * pais * escala / 100) * 100;
}

/** Recebe o que a fama pagou: conta, extrato e a lista de receitas da fama. */
export function receberDaFama13(v: Vida, valor: number, rotulo: string): void {
  const x = Math.round(valor);
  if (x <= 0) return;
  v.financas.conta += x;
  lancar(v, rotulo, 'renda', x);
  const rec = ((v.fama13 ??= {}).receitas ??= []);
  rec.push({ t: v.t, valor: x, rotulo });
  if (rec.length > 40) {
    // As mais antigas viram uma linha só (o total da vida não se perde).
    const velhas = rec.splice(0, rec.length - 39);
    rec.unshift({ t: velhas[0].t, valor: velhas.reduce((s, r) => s + r.valor, 0), rotulo: 'Receitas antigas da fama' });
  }
}

/** Conta uma reação (para a tela e os testes). */
export function contarReacao13(v: Vida, id: string): void {
  const r = ((v.fama13 ??= {}).reacoes ??= {});
  r[id] = (r[id] ?? 0) + 1;
}

/** Guarda que uma controvérsia antiga foi enfrentada de frente (a rejeição dela pesa menos daqui para a frente). */
export function superarControversia13(v: Vida, ref: string, texto: string): void {
  const f = (v.fama13 ??= {});
  (f.marcos ??= []).push({ t: v.t, tipo: 'superou', texto, ref: `sup:${ref}`, peso: 4 });
}

/* ------------------------------------------------------------------ O histórico que pode voltar */

/** O título (ou o feito) que faz aniversário redondo este ano: 10, 15, 20, 25, 30, 40 anos. */
export function tituloDeAniversario13(v: Vida): { texto: string; anos: number; clube?: string; doClube: boolean; ref: string } | undefined {
  const a = anoDe(v.t);
  for (const c of v.caminhos.palmares ?? []) {
    if (!(c.tipo === 'titulo' || (c.tipo === 'selecao' && /^Campe/.test(c.texto)))) continue;
    const anos = a - c.ano;
    if ([10, 15, 20, 25, 30, 40].includes(anos)) return { texto: c.texto, anos, clube: c.clube && !c.texto.includes(c.clube) ? c.clube : undefined, doClube: !!c.clube, ref: `pal:${c.trofeuId ?? c.texto}:${c.ano}` };
  }
  return undefined;
}

/** Uma controvérsia guardada, de cinco anos ou mais, ainda não enfrentada. */
export function controversiaAntiga13(v: Vida): MarcoDaFama13 | undefined {
  const sup = new Set((v.fama13?.marcos ?? []).filter(m => m.tipo === 'superou').map(m => m.ref.replace(/^sup:/, '')));
  return (v.fama13?.marcos ?? []).filter(m => m.tipo === 'controversia' && v.t - m.t >= 60 && v.t - m.t <= 360 && !sup.has(m.ref)).sort((a, b) => a.peso - b.peso)[0];
}

/** Um fracasso de negócio de cinco anos ou mais (o nome, o ano). */
export function fracassoAntigo13(v: Vida): MarcoDaFama13 | undefined {
  return (v.fama13?.marcos ?? []).filter(m => m.tipo === 'fracasso' && m.area === 'empresarial' && v.t - m.t >= 60).sort((a, b) => a.t - b.t)[0];
}

/** A vida deu certo depois (um nome, uma empresa grande, um patrimônio): o fracasso antigo vira história para contar. */
export function deuCertoDepois13(v: Vida): boolean {
  return (v.notoriedade?.valor ?? 0) >= 25 || (v.financas.empresas ?? []).some(e => e.estado === 'operando' && e.papel !== 'investidor' && (e.avaliacao ?? 0) >= 2e6) || prestigioProfissional(v).valor >= 55;
}

/** O emprego deixado há dez anos ou mais, por escolha (pediu demissão, trocou) ou por justa causa — com o nome do lugar. */
export function empregoDeixado13(v: Vida): { empregador: string; ano: number; motivo: string; ref: string } | undefined {
  const h = v.trabalho.historico.filter(x => ['pediu demissão', 'trocou de emprego', 'justa causa'].includes(x.motivo) && v.t - x.tFim >= 120 && v.t - x.tFim <= 480 && x.empregador && !/^(conta própria|por conta)/i.test(x.empregador));
  const x = h.sort((a, b) => (b.tFim - b.tInicio) - (a.tFim - a.tInicio))[0];
  return x ? { empregador: x.empregador, ano: anoDe(x.tFim), motivo: x.motivo, ref: `emp:${x.empregador}:${x.tFim}` } : undefined;
}

/** A obra que marcou, de doze anos ou mais. */
export function obraAntiga13(v: Vida): { titulo: string; ano: number } | undefined {
  const o = (v.caminhos.obras ?? []).filter(x => (x.comercial ?? x.recepcao) >= 2 && v.t - x.t >= 144).sort((a, b) => (b.comercial ?? b.recepcao) - (a.comercial ?? a.recepcao) || a.t - b.t)[0];
  return o ? { titulo: o.titulo, ano: anoDe(o.t) } : undefined;
}

/** O mandato bem avaliado, concluído há oito anos ou mais. */
export function mandatoLembrado13(v: Vida): { cargo: string; ano: number; aprovacao: number } | undefined {
  const h = (v.caminhos.politica?.historico ?? []).filter(x => x.resultado === 'concluiu' && (x.aprovacao ?? 0) >= 60 && v.t - x.t >= 96).sort((a, b) => (b.aprovacao ?? 0) - (a.aprovacao ?? 0))[0];
  return h ? { cargo: h.cargo, ano: anoDe(h.t), aprovacao: h.aprovacao ?? 60 } : undefined;
}

/* ------------------------------------------------------------------ O ano: o mundo reage */

/** A chance de uma reação ao nome por faixa (anônimo, local, reconhecido, famoso, muito famoso) e a de uma lembrança. */
export const CHANCE_DE_REACAO13 = [0, 0.1, 0.2, 0.28, 0.36];
export const CHANCE_DE_LEMBRANCA13 = 0.12;

/**
 * O pass anual (depois de tudo do ano). Silencioso: guarda os marcos; depois, com o gerador DERIVADO (`rngDe`, nunca o
 * principal), às vezes sorteia UMA reação ao nome (`f13_*`) ou UMA lembrança do histórico (`h13_*`). A decisão que não
 * cabe agora (outra está aberta) entra na fila do ano. O catálogo e o `preparar` chegam de cima (sem importar o
 * conteúdo daqui: sem ciclo entre pacotes).
 */
export function mundoReage13<C extends { id: string; tipo: string; manual?: boolean; peso?: unknown }, X extends { p: Record<string, { id: string }> }>(
  v: Vida, catalogo: readonly C[], preparar: (c: C, v: Vida, r: ReturnType<typeof rngDe>) => X | null, abrir: (c: C, ctx: X) => boolean
): void {
  if (v.morte) return;
  registrarMarcos13(v);
  if (idade(v) < 16) return;
  const r = rngDe(v.id, 'mundo_reage_13', v.t);
  const k = faixaDaNotoriedade(v.notoriedade?.valor ?? 0);
  const x = r.next();
  const prefixo = x < CHANCE_DE_REACAO13[k] ? 'f13_' : x < CHANCE_DE_REACAO13[k] + CHANCE_DE_LEMBRANCA13 ? 'h13_' : undefined;
  if (!prefixo) return;
  const lista: { c: C; ctx: X }[] = [];
  for (const c of catalogo) {
    if (!c.manual || !c.id.startsWith(prefixo)) continue;
    const ctx = preparar(c, v, r);
    if (ctx) lista.push({ c, ctx });
  }
  const pick = r.weighted(lista, y => (typeof y.c.peso === 'number' ? y.c.peso : typeof y.c.peso === 'function' ? (y.c.peso as (c: X) => number)(y.ctx) : 1));
  if (!pick) return;
  contarReacao13(v, pick.c.id);
  if (pick.c.tipo === 'decisao' && v.momento) (v.fila ??= []).push({ id: pick.c.id, t: v.t, papeis: Object.fromEntries(Object.entries(pick.ctx.p).map(([kk, p]) => [kk, p.id])), prioridade: 1 });
  else abrir(pick.c, pick.ctx);
}

/* ------------------------------------------------------------------ Saves */

/** Saves antigos e corrompidos: o campo é opcional; o que vier torto sai (nada é recalculado para trás). */
export function normalizarVida13Fama(v: Vida): void {
  const f = v.fama13 as Fama13 | undefined;
  if (f === undefined) return;
  if (!f || typeof f !== 'object') { delete v.fama13; return; }
  if (f.marcos && !Array.isArray(f.marcos)) delete f.marcos;
  if (f.marcos) f.marcos = f.marcos.filter(m => m && typeof m.t === 'number' && typeof m.ref === 'string' && typeof m.texto === 'string' && typeof m.peso === 'number');
  if (f.serie && !Array.isArray(f.serie)) delete f.serie;
  if (f.serie) f.serie = f.serie.filter(s => Array.isArray(s) && typeof s[0] === 'number' && typeof s[1] === 'number');
  if (f.receitas && !Array.isArray(f.receitas)) delete f.receitas;
  if (f.receitas) f.receitas = f.receitas.filter(x => x && typeof x.t === 'number' && Number.isFinite(x.valor));
  if (f.reacoes && (typeof f.reacoes !== 'object' || Array.isArray(f.reacoes))) delete f.reacoes;
  if (f.desde !== undefined && typeof f.desde !== 'number') delete f.desde;
}

/** Usado pela tela: o texto de um marco, com o tom (para o ícone). */
export const tomDoMarco13 = (m: MarcoDaFama13): 'bom' | 'ruim' | 'neutro' => (m.peso > 0 || m.tipo === 'subiu' ? 'bom' : m.peso < 0 || m.tipo === 'caiu' ? 'ruim' : 'neutro');

