/**
 * VIDA 14 · EVENTOS MUNDIAIS E EVOLUÇÃO HISTÓRICA.
 *
 * O mundo anda junto com a vida, ano a ano (`processarMundo14`, chamado em `ano.viverAno` logo depois da economia):
 *   - antes de 2026, o que aconteceu de verdade (`HISTORIA_REAL`), contado de forma genérica;
 *   - de 2026 em diante, um futuro plausível e DETERMINÍSTICO por mundo (`rngDe(v.id, ...)`: a mesma família, o mesmo
 *     mundo — a sucessão herda o mundo): marcos de tecnologia e ciência com janela e ordem, crises que vêm de fora
 *     (só quando a economia do país de fato entra em crise), choques de energia e comida, desastres com escopo
 *     geográfico (o país, a região de casa, o outro lado do mundo), pandemias raras e temporárias, acordos e guerras;
 *   - os marcos que JÁ estão nos dados (a profissão que surge ou encolhe, a automação e a expansão de cada família de
 *     carreira) contados no ano dos dados — o mundo explica o que o mercado de trabalho já fazia em silêncio;
 *   - os torneios mundiais no calendário que os esportes já usam (seleções nos anos ≡ 2 mod 4; jogos multiesportivos
 *     nos ≡ 0 mod 4), sem dizer quem ganhou (quem ganha é dos sistemas de esporte).
 *
 * O que aconteceu fica guardado (`Vida.mundo14.eventos`): o passado nunca é sorteado de novo. Os efeitos ativos viram
 * `Vida.mundo14.efeitos`, que os sistemas antigos leem por um campo (trabalho: vagas, demissão, reajuste, clientela;
 * empresas: procura por ramo; experiências: fronteiras fechadas). Efeitos imediatos: inflação (choques), saúde (pandemia,
 * remédios novos), estragos (desastre na região), aparelhos ultrapassados (geração nova). Nada aqui usa o sorteio
 * principal da vida.
 */

import type { Vida } from '../../tipos';
import type { AnoEconomico } from '../../sistemas/economia';
import type { EfeitosMundo14, EventoMundial14, Mundo14, TipoEventoMundial } from '../../dados14/mundo/tipos';
import {
  CAUSAS_CRISE, CENARIO_INTERNACIONAL, CHOQUES, DESASTRES_LONGE, HISTORIA_REAL, MARCOS_FUTUROS, PERIGOS_DO_PAIS, ROTULO_RAMO14, ROTULO_SETOR14,
  TEXTO_AUTOMACAO, TEXTO_EXPANSAO, TEXTO_OCUPACAO, TEXTO_PERIGO, type FatoHistorico, type MarcoFuturo, type Perigo
} from '../../dados14/mundo/catalogo';
import { clamp, rngDe } from '../../rng';
import { anoDe } from '../../tempo';
import { idade } from '../../nucleo';
import { FAMILIAS, familiaDaTrilha } from '../../dados/carreiras';
import { OCUPACOES, ocupacaoOuNula } from '../../dados/ocupacoes';
import { economiaLocal, municipio, nomeDaDivisao, paisDaCidade } from '../../dados/lugares';
import { noPais } from '../../mundo/registro';
import { coisa } from '../../dados/coisas';
import { lancar } from '../../sistemas/extrato';
import { moraComFamiliaDeOrigem } from '../../sistemas/domicilio';

export const ANO_FUTURO14 = 2026;
const MAX_EVENTOS = 120;
/** A última pandemia real (o futuro não repete uma tão cedo). */
const PANDEMIA_REAL = 2020;
const DISTANCIA_PANDEMIAS = 40;

/* ------------------------------------------------------------------ Datas determinísticas */

/** O ano de um marco do futuro neste mundo (dentro da janela, depois do marco de que depende). */
export function anoDoMarco(mundoId: string, id: string, visto: Set<string> = new Set()): number {
  const m = MARCOS_FUTUROS.find(x => x.id === id);
  if (!m) return Number.POSITIVE_INFINITY;
  let ano = rngDe(mundoId, 'marco14', id).int(m.janela[0], m.janela[1]);
  if (m.depois && !visto.has(m.depois)) { visto.add(id); ano = Math.max(ano, anoDoMarco(mundoId, m.depois, visto) + 1); }
  return ano;
}

/* ------------------------------------------------------------------ Efeitos */

const faixa = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** Soma os efeitos dos acontecimentos ativos no ano (multiplicadores se multiplicam; somas se somam). */
export function combinarEfeitos(eventos: EventoMundial14[], ano: number): EfeitosMundo14 | undefined {
  const ativos = eventos.filter(e => e.mods && e.ano <= ano && (e.ate ?? e.ano) >= ano);
  if (!ativos.length) return undefined;
  const out: EfeitosMundo14 = {};
  let dem = 1, con = 0, rea = 0, cli = 0;
  const setores: Record<string, number> = {}, ramos: Record<string, number> = {};
  for (const e of ativos) {
    const m = e.mods!;
    dem *= m.demissao ?? 1; con += m.contratacao ?? 0; rea += m.reajuste ?? 0; cli += m.clientela ?? 0;
    for (const [k, x] of Object.entries(m.setores ?? {})) setores[k] = (setores[k] ?? 1) * (x ?? 1);
    for (const [k, x] of Object.entries(m.ramos ?? {})) ramos[k] = (ramos[k] ?? 1) * (x ?? 1);
  }
  if (dem !== 1) out.demissao = r3(faixa(dem, 0.5, 2.5));
  if (con) out.contratacao = r3(faixa(con, -0.2, 0.1));
  if (rea) out.reajuste = r3(faixa(rea, -0.02, 0.01));
  if (cli) out.clientela = Math.round(faixa(cli, -15, 8));
  const s = Object.entries(setores).filter(([, x]) => x !== 1);
  const r = Object.entries(ramos).filter(([, x]) => x !== 1);
  if (s.length) out.setores = Object.fromEntries(s.map(([k, x]) => [k, r3(faixa(x, 0.4, 1.6))]));
  if (r.length) out.ramos = Object.fromEntries(r.map(([k, x]) => [k, r3(faixa(x, 0.4, 1.6))]));
  return Object.keys(out).length ? out : undefined;
}
const r3 = (x: number) => Math.round(x * 1000) / 1000;

const lista = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

/** O efeito em palavras — só o que o motor aplica (composto a partir dos números). */
export function descreverEfeitos(m: EfeitosMundo14 | undefined): string {
  if (!m) return '';
  const p: string[] = [];
  if ((m.demissao ?? 1) >= 1.05) p.push(`mais risco de demissão${(m.demissao ?? 1) >= 1.4 ? ' (bem mais)' : ''}`);
  else if ((m.demissao ?? 1) <= 0.95) p.push('menos demissões');
  if ((m.contratacao ?? 0) <= -0.02) p.push('vagas mais difíceis de conseguir');
  else if ((m.contratacao ?? 0) >= 0.01) p.push('mais vagas abrindo');
  if ((m.reajuste ?? 0) < 0) p.push('salários perdendo para a inflação no reajuste');
  if ((m.clientela ?? 0) <= -3) p.push('menos clientes para quem trabalha por conta');
  const s = Object.entries(m.setores ?? {});
  const sobe = s.filter(([, x]) => (x ?? 1) > 1.001).map(([k]) => ROTULO_SETOR14[k] ?? k);
  const desce = s.filter(([, x]) => (x ?? 1) < 0.999).map(([k]) => ROTULO_SETOR14[k] ?? k);
  if (sobe.length) p.push(`contratam mais: ${lista(sobe)}`);
  if (desce.length) p.push(`contratam menos e cortam mais: ${lista(desce)}`);
  const r = Object.entries(m.ramos ?? {});
  const vende = r.filter(([, x]) => (x ?? 1) > 1.001).map(([k]) => ROTULO_RAMO14[k] ?? k);
  const perde = r.filter(([, x]) => (x ?? 1) < 0.999).map(([k]) => ROTULO_RAMO14[k] ?? k);
  if (vende.length) p.push(`vendem mais: ${lista(vende)}`);
  if (perde.length) p.push(`vendem menos: ${lista(perde)}`);
  if (!p.length) return '';
  const t = p.join('; ');
  return t.charAt(0).toUpperCase() + t.slice(1) + '.';
}

/* ------------------------------------------------------------------ O ano do mundo */

interface Novo { ev: EventoMundial14; relevancia: 'biografia' | 'cotidiano' | 'oculto'; tom?: 'bom' | 'ruim' | 'neutro' }

function evento(ano: number, chave: string, tipo: TipoEventoMundial, titulo: string, texto: string, o: Partial<EventoMundial14> = {}, dura = 0): EventoMundial14 {
  const ev: EventoMundial14 = { id: `${ano}:${chave}`, ano, tipo, escopo: o.escopo ?? 'mundo', titulo, texto, ...o };
  if (ev.mods) ev.ate = ano + dura;
  return ev;
}

/** O mundo da vida (criado vazio na primeira vez). */
export function mundoDe(v: Vida): Mundo14 {
  return (v.mundo14 ??= { eventos: [] });
}

/** Aconteceu (neste mundo) um evento com esta chave desde o ano `desde`? */
const houve = (m: Mundo14, pred: (e: EventoMundial14) => boolean, desde: number) => m.eventos.some(e => e.ano >= desde && pred(e));

/**
 * O ano do mundo. Chamado uma vez por ano, logo depois de a economia andar (`ec`, que pode receber um choque de
 * inflação). Idempotente por ano (`ultimo`).
 */
export function processarMundo14(v: Vida, ec?: Pick<AnoEconomico, 'virou' | 'fase' | 'inflacao'>): EventoMundial14[] {
  const ano = anoDe(v.t);
  const m = mundoDe(v);
  if (m.ultimo !== undefined && m.ultimo >= ano) return [];
  m.ultimo = ano;
  const novos: Novo[] = [];
  const pais = paisDaCidade(v.moradia.municipioId);

  // 1. O passado real, ou o futuro sorteado (por mundo e ano).
  if (ano < ANO_FUTURO14) for (const f of HISTORIA_REAL.filter(x => x.ano === ano)) novos.push({ ev: doFato(f), relevancia: f.tipo === 'pandemia' && f.pandemia?.exteriorMeses ? 'biografia' : 'cotidiano', tom: tomDoTipo(f.tipo, f.mods) });
  else futuro(v, m, ano, pais, ec, novos);

  // 2. Os marcos que já estão nos dados (a profissão que surge ou some; a automação; a expansão).
  marcosDosDados(v, ano, novos);

  // 3. O calendário dos torneios mundiais (o mesmo dos esportes), fora de ano de pandemia.
  const pandemiaAgora = novos.some(n => n.ev.tipo === 'pandemia' && !!n.ev.mods);
  // ERAS HISTÓRICAS: até 2025, as Copas e os Jogos reais vêm da época (`eras/dados`), não os genéricos.
  const reais = !!v.era && ano <= 2025;
  if (!reais && !pandemiaAgora && ano % 4 === 2) novos.push({ ev: evento(ano, 'mundial_selecoes', 'esporte', 'Torneio mundial de seleções', 'O torneio mundial de seleções parou o mundo por um mês: telão na praça, bar lotado em dia de jogo, escritório parado na hora da partida.', { mods: { ramos: { restaurante: 1.04 } } }), relevancia: 'cotidiano', tom: 'bom' });
  if (!reais && !pandemiaAgora && ano % 4 === 0 && ano !== 2020) novos.push({ ev: evento(ano, 'jogos_mundiais', 'esporte', 'Jogos multiesportivos mundiais', 'Os jogos multiesportivos mundiais encheram a televisão por duas semanas. Depois deles, as academias e escolinhas ganharam fila.', { mods: { ramos: { academia: 1.05 } } }), relevancia: 'cotidiano', tom: 'bom' });

  // 4. O que cada um faz agora (inflação, saúde, estragos, aparelhos, fronteiras).
  for (const n of novos) aplicarImediato(v, m, n, ec);
  m.eventos.push(...novos.map(n => n.ev));
  if (m.eventos.length > MAX_EVENTOS) m.eventos.splice(0, m.eventos.length - MAX_EVENTOS);
  m.efeitos = combinarEfeitos(m.eventos, ano);
  if (!m.efeitos) delete m.efeitos;

  // 5. O que se conta: no "Enquanto isso" e na Linha da Vida (sem gastar ids da vida: o id é do evento).
  if (idade(v) >= 6) for (const n of novos) if (n.relevancia !== 'oculto') contar(v, n);
  return novos.map(n => n.ev);
}

const tomDoTipo = (t: TipoEventoMundial, mods?: EfeitosMundo14): 'bom' | 'ruim' | 'neutro' =>
  t === 'desastre' || t === 'pandemia' || (t === 'economia' && (mods?.demissao ?? 1) > 1) ? 'ruim' : t === 'ciencia' || t === 'esporte' ? 'bom' : 'neutro';

function doFato(f: FatoHistorico): EventoMundial14 {
  return evento(f.ano, f.chave, f.tipo, f.titulo, f.texto, { real: true, ...(f.mods ? { mods: f.mods } : {}), ...(f.tipo === 'produtos' || f.tipo === 'tecnologia' || f.tipo === 'ciencia' ? { marco: true } : {}) }, f.dura ?? 0);
}

function futuro(v: Vida, m: Mundo14, ano: number, pais: string, ec: Pick<AnoEconomico, 'virou' | 'fase' | 'inflacao'> | undefined, novos: Novo[]): void {
  const r = rngDe(v.id, 'mundo14', ano);
  // Os marcos da tecnologia e da ciência, no ano deste mundo.
  for (const mf of MARCOS_FUTUROS) if (anoDoMarco(v.id, mf.id) === ano) novos.push({ ev: doMarco(mf, ano), relevancia: 'cotidiano', tom: mf.tratamento ? 'bom' : 'neutro' });
  // A pandemia que acabou no ano passado: a recuperação (vacina, rua cheia de novo — e o resto da conta).
  const passada = m.eventos.find(e => e.tipo === 'pandemia' && e.ano === ano - 1 && !!e.mods);
  if (passada) novos.push({ ev: evento(ano, 'pos_pandemia', 'ciencia', 'A vacina e a volta', 'A vacina chegou e a vida voltou para a rua aos poucos. Algumas lojas não reabriram; o trabalho de casa ficou para muita gente.', { mods: { demissao: 1.15, setores: { alimentacao: 0.88, beleza: 0.9, saude: 1.08 }, ramos: { restaurante: 0.88, hotel: 0.8, aerea: 0.8, online: 1.08 } } }), relevancia: 'cotidiano', tom: 'bom' });
  let sorteados = 0;
  // Uma crise que vem de fora: só quando a economia do país de fato entrou em crise (nunca contra ela).
  if (ec?.virou && ec.fase === 'crise' && r.chance(0.6)) {
    const c = r.pick(CAUSAS_CRISE);
    novos.push({ ev: evento(ano, `crise_${c.chave}`, 'economia', c.titulo, `${c.texto} A crise chegou aqui também: no país, o risco de demissão dobra, as vagas rareiam e o reajuste fica abaixo da inflação.`, c.ramos ? { mods: { ramos: c.ramos } } : {}, 1), relevancia: 'biografia', tom: 'ruim' });
    sorteados++;
  }
  // A pandemia: rara (no máximo uma a cada 40 anos, contando a real), forte por um ano.
  const ultimaPandemia = Math.max(PANDEMIA_REAL, ...m.eventos.filter(e => e.tipo === 'pandemia' && e.mods).map(e => e.ano));
  if (!passada && ano >= 2030 && ano - ultimaPandemia >= DISTANCIA_PANDEMIAS && r.chance(0.011)) {
    const forca = 0.75 + r.next() * 0.35;
    const k = (x: number) => r3(1 + (x - 1) * forca);
    novos.push({ ev: evento(ano, 'pandemia', 'pandemia', 'Pandemia', r.pick([
      'Um vírus respiratório novo correu o planeta em poucas semanas. Fronteiras fechadas, aulas pela tela, máscara no rosto de novo.',
      'Uma gripe nova, das fortes, virou pandemia. Os aeroportos fecharam, os hospitais lotaram e as cidades se recolheram por meses.'
    ]), { mods: { demissao: k(1.6), contratacao: r3(-0.1 * forca), clientela: Math.round(-10 * forca), setores: { alimentacao: k(0.6), beleza: k(0.6), comercio: k(0.8), esporte: k(0.6), transporte: k(0.8), saude: k(1.25), tecnologia: k(1.15), logistica: k(1.15) }, ramos: { restaurante: k(0.6), hotel: k(0.45), academia: k(0.55), museu: k(0.45), zoologico: k(0.6), estudio: k(0.75), loja: k(0.8), aerea: k(0.45), online: k(1.3), clinica: k(1.1), tecnologia: k(1.1) } } }), relevancia: 'biografia', tom: 'ruim' });
    sorteados++;
  }
  const pandemia = sorteados > 0 && novos.some(n => n.ev.tipo === 'pandemia');
  // O choque de energia ou de comida (no máximo um a cada dez anos).
  if (!pandemia && sorteados < 2 && !houve(m, e => e.id.includes(':choque_'), ano - 10) && r.chance(0.025)) {
    const c = r.pick(CHOQUES);
    novos.push({ ev: evento(ano, `choque_${c.chave}`, 'economia', c.titulo, c.texto, { mods: c.mods }), relevancia: 'cotidiano', tom: 'ruim' });
    sorteados++;
  }
  // O desastre no país (às vezes, na região de casa).
  if (sorteados < 2 && r.chance(0.06)) {
    const perigos: Perigo[] = PERIGOS_DO_PAIS[pais] ?? ['enchente', 'calor', 'seca'];
    const p = r.pick(perigos);
    const aqui = r.chance(0.35);
    const regiao = nomeDaDivisao(municipio(v.moradia.municipioId));
    const [titulo, longe, perto] = TEXTO_PERIGO[p];
    novos.push({ ev: evento(ano, `desastre_${p}`, 'desastre', titulo, aqui ? `${regiao}: ${perto}` : longe.replace('{no}', 'em outra parte do país'), { escopo: aqui ? 'regiao' : 'pais', lugar: aqui ? regiao : undefined, mods: aqui ? { contratacao: 0.01, setores: { construcao: 1.15, manutencao: 1.08 } } : { setores: { construcao: 1.04 } } }, aqui ? 1 : 0), relevancia: aqui ? 'biografia' : 'cotidiano', tom: 'ruim' });
    sorteados++;
  }
  // O desastre do outro lado do mundo (o que mexe aqui: a fábrica de peças parada).
  if (sorteados < 2 && r.chance(0.06)) {
    const op = DESASTRES_LONGE.filter(d => d[0] !== pais);
    const [onde, p, mods] = r.pick(op);
    const [titulo, longe] = TEXTO_PERIGO[p];
    let lugar = onde;
    try { lugar = noPais(onde); } catch { lugar = 'do outro lado do mundo'; }
    novos.push({ ev: evento(ano, `longe_${p}_${onde}`, 'desastre', titulo, longe.replace('{no}', lugar) + (mods ? ' Fábricas de lá pararam, e o efeito chegou às prateleiras daqui.' : ''), { escopo: 'exterior', lugar: lugar.replace(/^(n[oa]s?|em) /, ''), ...(mods ? { mods } : {}) }), relevancia: mods ? 'cotidiano' : 'oculto', tom: 'ruim' });
    sorteados++;
  }
  // O cenário internacional: acordos, taxas, guerras e pazes (sem repetir o mesmo em oito anos).
  if (sorteados < 2 && r.chance(0.035)) {
    const op = CENARIO_INTERNACIONAL.filter(c => !houve(m, e => e.id.endsWith(`:${c.chave}`), ano - 8) && (c.chave !== 'paz' || houve(m, e => e.id.endsWith(':conflito'), ano - 15)));
    const c = op.length ? r.pick(op) : undefined;
    if (c) novos.push({ ev: evento(ano, c.chave, 'internacional', c.titulo, c.texto, { mods: c.mods }, c.dura ?? 0), relevancia: 'cotidiano', tom: c.chave === 'paz' || c.chave === 'acordo_comercial' ? 'bom' : 'neutro' });
  }
}

/** Inflação extra dos choques (para aplicar na economia do ano). */
const INFLACAO: Record<string, number> = Object.fromEntries([
  ...CHOQUES.map(c => [`choque_${c.chave}`, c.inflacao] as const),
  ...CENARIO_INTERNACIONAL.filter(c => c.inflacao).map(c => [c.chave, c.inflacao!] as const),
  ...HISTORIA_REAL.filter(f => f.inflacao).map(f => [f.chave, f.inflacao!] as const)
]);

function doMarco(mf: MarcoFuturo, ano: number): EventoMundial14 {
  return evento(ano, mf.id, mf.tipo, mf.titulo, mf.texto, { marco: true, ...(mf.mods ? { mods: mf.mods } : {}) }, mf.dura ?? 0);
}

function marcosDosDados(v: Vida, ano: number, novos: Novo[]): void {
  const e = v.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  const fam = oc ? familiaDaTrilha(oc.trilha).id : undefined;
  for (const o of OCUPACOES) {
    const surge = o.surge === ano, some = o.declinio === ano;
    if (!surge && !some) continue;
    const nome = o.nome[0];
    const texto = TEXTO_OCUPACAO[o.id] ?? (surge ? `Surgiu uma profissão nova: ${nome}.` : `A profissão de ${nome} começou a encolher.`);
    const efeito = surge ? 'As primeiras vagas abriram (onde há mercado para elas).' : 'As vagas ficam mais raras a cada ano, e quem tem carteira assinada corre mais risco de corte.';
    novos.push({ ev: evento(ano, `${surge ? 'surge' : 'declinio'}_${o.id}`, 'trabalho', surge ? `Profissão nova: ${nome}` : `${nome.charAt(0).toUpperCase()}${nome.slice(1)}: profissão em declínio`, texto, { marco: true, efeito }), relevancia: oc?.id === o.id ? 'biografia' : 'oculto', tom: surge ? 'bom' : 'neutro' });
  }
  for (const f of FAMILIAS) {
    if (f.automacao?.desde === ano) novos.push({ ev: evento(ano, `automacao_${f.id}`, 'trabalho', `Automação: ${f.nome}`, TEXTO_AUTOMACAO[f.id] ?? `A automação chegou a ${f.nome}.`, { marco: true, efeito: 'Daqui em diante, menos vagas e mais risco de corte para quem tem carteira nessa área, ano após ano.' }), relevancia: fam === f.id ? 'biografia' : 'oculto', tom: 'neutro' });
    if (f.expansao?.desde === ano) novos.push({ ev: evento(ano, `expansao_${f.id}`, 'trabalho', `Em alta: ${f.nome}`, TEXTO_EXPANSAO[f.id] ?? `${f.nome} passou a contratar mais.`, { marco: true, efeito: 'Daqui em diante, mais vagas nessa área, ano após ano.' }), relevancia: fam === f.id ? 'biografia' : 'oculto', tom: 'bom' });
  }
}

function aplicarImediato(v: Vida, m: Mundo14, n: Novo, ec?: Pick<AnoEconomico, 'inflacao'>): void {
  const ev = n.ev;
  const chave = ev.id.slice(ev.id.indexOf(':') + 1);
  const ano = ev.ano;
  // Inflação de fora: a do ano sobe (e o dinheiro parado perde mais).
  const extra = INFLACAO[chave];
  // ERAS HISTÓRICAS: até 2025, a inflação de uma vida histórica já é a da série real (o choque não se soma).
  if (extra && v.economia && !(v.era && ano <= 2025)) {
    v.economia.inflacao += extra;
    v.economia.precos *= (1 + extra);
    const h = v.economia.historico[v.economia.historico.length - 1];
    if (h && h.ano === ano) h.inflacao = Math.round((h.inflacao + extra) * 10000) / 10000;
    if (ec) ec.inflacao += extra;
    ev.efeito = juntar(ev.efeito, `A inflação do ano subiu uns ${Math.round(extra * 1000) / 10} pontos.`);
  }
  // Pandemia: fronteiras fechadas, o susto (e às vezes a doença).
  const fato = HISTORIA_REAL.find(f => f.ano === ano && f.chave === chave);
  const pand = ev.tipo === 'pandemia' ? (fato?.pandemia ?? (ev.mods ? { exteriorMeses: 12, contagio: 0.35 } : undefined)) : undefined;
  if (pand) {
    if (pand.exteriorMeses) { m.exteriorAte = Math.max(m.exteriorAte ?? 0, v.t + pand.exteriorMeses); ev.efeito = juntar(ev.efeito, 'Viagens para fora do país suspensas até o ano que vem.'); }
    if (ev.mods) { v.mente.estresse = clamp(v.mente.estresse + 5); v.mente.felicidade = clamp(v.mente.felicidade - 3); }
    const rs = rngDe(v.id, 'mundo14-saude', ano);
    if (rs.chance(pand.contagio)) {
      const i = idade(v);
      const dano = rs.int(2, 6) + (i >= 65 ? 6 : i >= 50 ? 2 : 0) + (v.corpo.condicoes.some(c => c.cronica) ? 2 : 0);
      v.corpo.saude = clamp(v.corpo.saude - dano);
      ev.efeito = juntar(ev.efeito, `Você pegou a doença: ${dano >= 8 ? 'semanas de cama, e a saúde demorou a voltar' : 'uns dias de febre e cansaço'}.`);
      n.relevancia = 'biografia';
    }
  }
  // Remédios novos: quem trata uma condição crônica melhora.
  const mf = MARCOS_FUTUROS.find(x => x.id === chave);
  if (mf?.tratamento) {
    const tratadas = v.corpo.condicoes.filter(c => c.cronica && c.tratando && c.gravidade > 1);
    for (const c of tratadas) c.gravidade -= 1;
    if (tratadas.length) { v.corpo.saude = clamp(v.corpo.saude + 3); ev.efeito = juntar(ev.efeito, `O tratamento novo chegou para você: ${tratadas[0].nome} ficou mais leve.`); n.relevancia = 'biografia'; }
  }
  // Uma geração nova de aparelhos: os que você tem envelhecem de uma vez.
  if (mf?.obsoleta || fato?.obsoleta) {
    const velhos = (v.financas.coisas ?? []).filter(t => !t.lembranca && coisa(t.coisaId)?.loja === 'eletronicos' && v.t - t.t >= 24);
    for (const t of velhos) t.estado = Math.max(5, t.estado - 20);
    if (velhos.length) ev.efeito = juntar(ev.efeito, `${velhos.length === 1 ? 'Um aparelho seu ficou' : `${velhos.length} aparelhos seus ficaram`} ultrapassado${velhos.length === 1 ? '' : 's'}: vale${velhos.length === 1 ? '' : 'm'} menos e dura${velhos.length === 1 ? '' : 'm'} menos.`);
  }
  // O desastre na região de casa: o susto e o conserto (de quem tem casa própria para consertar).
  if (ev.escopo === 'regiao' && ev.tipo === 'desastre') {
    v.mente.estresse = clamp(v.mente.estresse + 5);
    if (idade(v) >= 18 && !moraComFamiliaDeOrigem(v) && v.financas.conta > 0) {
      const custo = Math.min(Math.round(v.financas.conta), Math.round(1200 * economiaLocal(v.moradia.municipioId).custo / 10) * 10);
      if (custo > 0) { v.financas.conta -= custo; lancar(v, 'Estragos do desastre', 'acontecimento', -custo); ev.efeito = juntar(ev.efeito, `Em casa, o estrago custou ${custo.toLocaleString('pt-BR')} de conserto.`); }
    }
  }
  if (ev.mods) ev.efeito = juntar(descreverEfeitos(ev.mods) + (ev.ate && ev.ate > ano ? ` Até ${ev.ate}.` : ''), ev.efeito);
}

const juntar = (a: string | undefined, b: string | undefined) => [a, b].filter(Boolean).join(' ');

/** Escreve na Linha da Vida (e, por ela, no "Enquanto isso"). Sem `novoId`: a sequência de ids da vida não muda. */
function contar(v: Vida, n: Novo): void {
  const ev = n.ev;
  const tema = ev.tipo === 'economia' ? 'dinheiro' : ev.tipo === 'pandemia' ? 'saude' : ev.tipo === 'trabalho' ? 'trabalho' : 'lugar';
  v.biografia.push({
    id: `m14:${ev.id}`, t: v.t, idade: idade(v), texto: ev.efeito ? `${ev.texto} ${ev.efeito}` : ev.texto, relevancia: n.relevancia === 'biografia' ? 'biografia' : 'cotidiano', tema, tom: n.tom,
    fato: { tipo: 'mundo', dados: { categoria: 'mundo', evento: ev.id } }
  });
}

/* ------------------------------------------------------------------ Leituras (UI, outros sistemas) */

/** Viajar para fora está bloqueado agora? (o motivo, ou nada). */
export function fronteirasFechadas(v: Vida): string | undefined {
  return (v.mundo14?.exteriorAte ?? 0) > v.t ? 'As fronteiras estão fechadas pela pandemia.' : undefined;
}

export interface ResumoDoMundo {
  ano: number;
  /** Os acontecimentos com efeito agora (e o que fazem). */
  ativos: { ev: EventoMundial14; efeito: string }[];
  efeitoGeral: string;
  restricoes: string[];
  /** A linha do tempo vivida, por década (mais recente primeiro). */
  decadas: { decada: number; eventos: EventoMundial14[] }[];
  /** O que veio antes de a família começar a contar (fatos reais anteriores ao primeiro ano vivido). */
  antes: FatoHistorico[];
}

export function resumoDoMundo14(v: Vida): ResumoDoMundo {
  const ano = anoDe(v.t);
  const evs = v.mundo14?.eventos ?? [];
  const ativos = evs.filter(e => e.mods && e.ano <= ano && (e.ate ?? e.ano) >= ano).map(ev => ({ ev, efeito: descreverEfeitos(ev.mods) }));
  const restricoes: string[] = [];
  const f = fronteirasFechadas(v);
  if (f) restricoes.push(f);
  const por = new Map<number, EventoMundial14[]>();
  for (const e of evs) { const d = Math.floor(e.ano / 10) * 10; por.set(d, [...(por.get(d) ?? []), e]); }
  const decadas = [...por.entries()].sort((a, b) => b[0] - a[0]).map(([decada, eventos]) => ({ decada, eventos: [...eventos].reverse() }));
  const primeiro = Math.min(anoDe(v.eu.tNasc), ...evs.map(e => e.ano));
  const antes = HISTORIA_REAL.filter(x => x.ano < primeiro).slice(-6).reverse();
  return { ano, ativos, efeitoGeral: descreverEfeitos(v.mundo14?.efeitos), restricoes, decadas, antes };
}

/* ------------------------------------------------------------------ Save */

/** Saves antigos: nada a fazer (o mundo começa a contar no próximo ano). Saves novos: confere a forma. Idempotente. */
export function normalizarVida14Mundo(v: Vida): void {
  const m = v.mundo14;
  if (!m) return;
  if (typeof m !== 'object' || !Array.isArray(m.eventos)) { delete v.mundo14; return; }
  m.eventos = m.eventos.filter(e => e && typeof e.id === 'string' && Number.isFinite(e.ano) && typeof e.texto === 'string');
  if (m.eventos.length > MAX_EVENTOS) m.eventos.splice(0, m.eventos.length - MAX_EVENTOS);
  if (m.exteriorAte !== undefined && !Number.isFinite(m.exteriorAte)) delete m.exteriorAte;
  if (m.ultimo !== undefined && !Number.isFinite(m.ultimo)) delete m.ultimo;
  // (os efeitos guardados são os do ano processado: recalcular aqui mudaria o save reaberto — o próximo ano recalcula)
  if (m.efeitos !== undefined && (typeof m.efeitos !== 'object' || m.efeitos === null)) delete m.efeitos;
}
