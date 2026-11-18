/**
 * VIDA 27 · §15 — SAÚDE MENTAL: o sofrimento psicológico como um processo da vida, não um evento solto.
 *
 *   O QUE PESA     lido do estado real (nada sorteado do nada): a depressão ou a ansiedade (tratada pesa pouco; sem
 *                  tratamento, muito), o luto, anos de estresse no limite, a felicidade no chão, o isolamento (ninguém
 *                  próximo por perto), a prisão, as contas atrasadas, o desemprego longo, uma separação recente.
 *   O QUE PROTEGE  o acompanhamento (psicólogo, psiquiatra), uma parceria e pessoas próximas de verdade, o corpo em
 *                  movimento, o apoio que alguém ofereceu e foi aceito.
 *   AS FASES       1 · uma fase difícil · 2 · uma crise · 3 · uma crise com pensamentos de não querer continuar. A fase
 *                  3 nunca vem só por uma condição: só depois de um ano de crise, e com isolamento ou sem cuidado — e,
 *                  mesmo assim, não sempre (sorteio derivado, para não ser destino). Nenhuma condição leva a ela sozinha.
 *   O APOIO        quem está perto (a família de quem é menor, a parceria, o amigo próximo, o irmão) PERCEBE e pergunta;
 *                  dá para se abrir, pedir ajuda para procurar atendimento, ligar para uma linha de apoio emocional.
 *   A RECUPERAÇÃO  com cuidado e apoio, o peso desce ano a ano; a vida registra a crise e a recuperação, com respeito.
 *
 * RESPONSABILIDADE (decisões de design, documentadas): não há ação, opção ou desfecho de morte por suicídio do
 * personagem; nenhum texto descreve método, meio ou cena; a crise nunca é recompensada nem resolve problema algum; o
 * texto da crise sempre aponta caminhos de ajuda (e, fora da ficção, a linha real: no Brasil, o CVV, 188).
 */
import type { Vida } from '../../tipos';
import { clamp, rngDe } from '../../rng';
import { escrever, idade, lembrarCom, parceiro, vinculosVivos, idadePessoa } from '../../nucleo';
import { pesoDoLuto } from '../../sistemas/luto';
import { obrigacoesAtrasadas } from '../../sistemas/dinheiro';
import { paisDaVida } from '../../mundo/vida';
import { anoDe } from '../../tempo';

export interface Crise27 {
  /** 0 nenhuma (em recuperação) · 1 fase difícil · 2 crise · 3 crise com pensamentos de não querer continuar. */
  nivel: 0 | 1 | 2 | 3;
  /** Desde quando está no nível de agora; quando começou o episódio. */
  t: number; inicio: number;
  /** O apoio aceito (quem, quando) — protege por dois anos. */
  apoio?: { pid?: string; t: number; via: 'pessoa' | 'linha' | 'atendimento' }[];
  /** Acompanhamento psiquiátrico (desde quando). O psicológico é a rotina `terapia`. */
  psiquiatra?: number;
  /** Quem já perguntou neste episódio (para não repetir a mesma cena). */
  perceberam?: string[];
  /** A linha do tempo do episódio (para a recuperação e para a tela). */
  historico: { t: number; nivel: number; texto: string }[];
  /** Quando o episódio terminou (o marco da recuperação vem depois). */
  fim?: number;
}

export interface Fator27 { id: string; texto: string; peso: number }

const contatoRecente = (v: Vida, t: number) => v.t - t <= 12;

/** O que pesa e o que protege agora, lido do estado (a mesma lista para a regra e para a tela). */
export function fatoresDoSofrimento27(v: Vida): Fator27[] {
  const out: Fator27[] = [];
  const i = idade(v);
  for (const c of v.corpo.condicoes) {
    if (c.id === 'depressao') out.push({ id: 'depressao', texto: c.tratando ? 'a depressão (em tratamento)' : 'a depressão sem tratamento', peso: c.tratando ? 8 : 24 });
    if (c.id === 'ansiedade') out.push({ id: 'ansiedade', texto: c.tratando ? 'a ansiedade (em tratamento)' : 'a ansiedade sem tratamento', peso: c.tratando ? 5 : 12 });
  }
  const luto = pesoDoLuto(v);
  if (luto > 0) out.push({ id: 'luto', texto: 'o luto', peso: Math.min(25, Math.round(luto / 4)) });
  const anos = v.mente.estresseAlto?.anos ?? 0;
  if (anos > 0) out.push({ id: 'estresse', texto: `${anos} ${anos === 1 ? 'ano' : 'anos'} com a cabeça no limite`, peso: Math.min(18, anos * 6) });
  if (v.mente.felicidade < 30) out.push({ id: 'humor', texto: 'os dias sem alegria', peso: Math.round(30 - v.mente.felicidade) });
  const proximos = vinculosVivos(v).filter(({ p, vin }) => !p.especie && vin.proximidade >= 55 && vin.tensao < 50 && (vin.convivio.includes('casa') || contatoRecente(v, vin.tUltimoContato)));
  if (!proximos.length && !parceiro(v)) out.push({ id: 'isolamento', texto: 'ninguém próximo por perto', peso: 14 });
  if (v.justica?.prisao) out.push({ id: 'prisao', texto: i < 18 ? 'a internação' : 'a prisão', peso: 12 });
  if (obrigacoesAtrasadas(v) >= 2) out.push({ id: 'dividas', texto: 'as contas atrasadas', peso: 8 });
  if (i >= 18 && i < 65 && !v.trabalho.atual && !v.trabalho.aposentadoria && v.trabalho.desempregadoDesde !== undefined && v.t - v.trabalho.desempregadoDesde >= 12) out.push({ id: 'desemprego', texto: 'mais de um ano sem trabalho', peso: 8 });
  const sep = Object.values(v.vinculos).find(x => x.romance?.estagio === 'ex' && v.t - x.romance.tEstagio <= 12 && x.romance.fim !== 'morte');
  if (sep) out.push({ id: 'separacao', texto: 'o fim recente de uma relação', peso: 8 });
  // O que protege.
  if (v.rotinas.some(r => r.id === 'terapia')) out.push({ id: 'terapia', texto: 'o acompanhamento com psicólogo', peso: -15 });
  if (v.mente.crise27?.psiquiatra !== undefined) out.push({ id: 'psiquiatra', texto: 'o acompanhamento psiquiátrico', peso: -10 });
  const par = parceiro(v);
  if (par && par.vin.proximidade >= 60 && par.vin.tensao < 40) out.push({ id: 'parceria', texto: `${par.p.nome} por perto`, peso: -8 });
  if (proximos.length >= 2) out.push({ id: 'proximos', texto: 'gente próxima por perto', peso: -6 });
  const apoio = (v.mente.crise27?.apoio ?? []).filter(a => v.t - a.t <= 24);
  if (apoio.length) out.push({ id: 'apoio', texto: 'a ajuda que você aceitou', peso: -10 });
  if (!v.corpo.habitos.sedentario && v.corpo.forma >= 55) out.push({ id: 'corpo', texto: 'o corpo em movimento', peso: -4 });
  return out;
}

export const sofrimento27 = (v: Vida) => clamp(fatoresDoSofrimento27(v).reduce((s, f) => s + f.peso, 0));

const NOMES = ['', 'uma fase difícil', 'uma crise', 'uma crise grave'] as const;
export const nomeDaFase27 = (n: number) => NOMES[n] ?? '';

/** Quem está perto o bastante para perceber (a família de quem é menor, a parceria, o amigo próximo, o irmão). */
export function quemPercebe27(v: Vida): string | undefined {
  const i = idade(v);
  const ja = new Set(v.mente.crise27?.perceberam ?? []);
  const cands = vinculosVivos(v).filter(({ p, vin }) => !p.especie && !ja.has(p.id) && idadePessoa(v, p) >= 12 && vin.proximidade >= 55 && vin.tensao < 55
    && (vin.convivio.includes('casa') || contatoRecente(v, vin.tUltimoContato))
    && (i < 18 ? ['mae', 'pai', 'madrasta', 'padrasto', 'avo', 'irmao', 'tio'].includes(vin.parentesco ?? '') || vin.proximidade >= 70 : true));
  const par = parceiro(v);
  if (par && !ja.has(par.p.id) && par.vin.tensao < 55) return par.p.id;
  return cands.sort((a, b) => b.vin.proximidade - a.vin.proximidade)[0]?.p.id;
}

/** A linha de apoio emocional de onde se vive (o nome real só onde o jogo sabe; no resto, a descrição). */
export function linhaDeApoio27(v: Vida): string {
  if (paisDaVida(v) !== 'BR') return 'uma linha de apoio emocional';
  const ano = anoDe(v.t);
  return ano >= 2015 ? 'o CVV (188)' : ano >= 1962 ? 'o CVV' : 'alguém de confiança';
}

/**
 * O ano da saúde mental (a partir dos 12): o sofrimento decide a fase; a fase 3 pede um ano de crise E isolamento ou
 * falta de cuidado — e um sorteio derivado (contexto, nunca destino). Quem está perto pode perceber (a cena
 * `mental27_percebe`); a crise abre a cena `mental27_crise`, com os caminhos de ajuda.
 */
export function processarMente27(v: Vida): void {
  if (v.morte || idade(v) < 12) return;
  const s = sofrimento27(v);
  const fs = fatoresDoSofrimento27(v);
  const c = v.mente.crise27;
  const antes = c && c.fim === undefined ? c.nivel : 0;
  let nivel: 0 | 1 | 2 | 3 = s >= 62 ? 2 : s >= 40 ? 1 : 0;
  if (nivel === 2 && antes >= 2 && v.t - (c?.t ?? v.t) >= 12) {
    const sem = fs.some(f => f.id === 'isolamento') || !fs.some(f => f.peso < 0 && (f.id === 'terapia' || f.id === 'psiquiatra' || f.id === 'apoio'));
    if (sem && rngDe(v.id, 'mente27', v.t).chance(0.35)) nivel = 3;
  }
  if (antes === 3 && nivel === 2) nivel = s >= 85 ? 3 : 2;
  const pesa = fs.filter(f => f.peso > 0).sort((a, b) => b.peso - a.peso).slice(0, 3).map(f => f.texto);
  if (nivel === 0) {
    if (antes > 0 && c) {
      c.nivel = 0; c.t = v.t; c.fim = v.t;
      const ajudou = fs.filter(f => f.peso < 0).map(f => f.texto);
      const texto = `${cap(NOMES[antes])} foi passando, devagar${ajudou.length ? ` — ${ajudou.slice(0, 2).join(' e ')} ajudaram` : ''}. Não foi de um dia para o outro, e está tudo bem assim.`;
      c.historico.push({ t: v.t, nivel: 0, texto });
      escrever(v, { texto, relevancia: 'biografia', tema: 'saude', tom: 'bom' });
    } else if (c?.fim !== undefined && v.t - c.fim >= 24 && !v.fatos['mente27_dois_anos']) {
      v.fatos['mente27_dois_anos'] = v.t;
      escrever(v, { texto: 'Dois anos depois daquela crise. Ficou uma cicatriz — e a certeza de que pedir ajuda funciona.', relevancia: 'biografia', tema: 'saude', tom: 'bom' });
    }
    return;
  }
  // Um episódio novo ou a mudança de fase.
  const novo = !c || c.fim !== undefined;
  const x: Crise27 = novo ? { nivel, t: v.t, inicio: v.t, historico: [], ...(c?.psiquiatra !== undefined ? { psiquiatra: c.psiquiatra } : {}) } : c!;
  v.mente.crise27 = x;
  if (novo || nivel !== antes) {
    x.nivel = nivel; x.t = v.t;
    const texto = nivel === 1 ? `Começou uma fase difícil: ${pesa.join(', ') || 'um cansaço sem nome'}.`
      : nivel === 2 ? `Os dias ficaram pesados demais — uma crise. O que pesava: ${pesa.join(', ') || 'tudo ao mesmo tempo'}.`
        : 'Houve dias em que pareceu que não valia a pena continuar. Isso é sinal de que é hora de pedir ajuda — e ajuda existe.';
    if (nivel < antes) x.historico.push({ t: v.t, nivel, texto: `A crise aliviou: de ${NOMES[antes]} para ${NOMES[nivel]}.` });
    else x.historico.push({ t: v.t, nivel, texto });
    escrever(v, { texto: nivel < antes ? `A crise aliviou um pouco: ${NOMES[nivel]}, ainda.` : texto, relevancia: nivel >= 2 ? 'biografia' : 'cotidiano', tema: 'saude', tom: 'ruim' });
    if (x.historico.length > 20) x.historico.splice(0, x.historico.length - 20);
  }
  // O peso na vida (sem punição extra: o humor e a cabeça já carregam o que pesa).
  if (nivel >= 2) v.mente.felicidade = clamp(v.mente.felicidade - (nivel === 3 ? 4 : 2));
  // A cena da crise (os caminhos de ajuda) e quem percebe.
  if (nivel >= 2 && (novo || nivel > antes || v.t - (v.fatos['mente27_crise'] ?? -999) >= 12)) v.fatos['mente27_crise'] = v.t;
  const quem = quemPercebe27(v);
  if (quem && (nivel >= 2 || rngDe(v.id, 'mente27_percebe', v.t).chance(0.5))) { v.fatos['mente27_percebe'] = v.t; (x.perceberam ??= []).push(quem); }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** O apoio aceito (a pessoa, a linha, o atendimento): protege por dois anos e fica na história. */
export function aceitarApoio27(v: Vida, via: 'pessoa' | 'linha' | 'atendimento', pid?: string): void {
  const x = v.mente.crise27;
  if (!x) return;
  (x.apoio ??= []).push({ t: v.t, via, ...(pid ? { pid } : {}) });
  if (x.apoio.length > 10) x.apoio.splice(0, x.apoio.length - 10);
  if (pid) { const vin = v.vinculos[pid]; if (vin) { vin.proximidade = clamp(vin.proximidade + 6); vin.confianca = clamp(vin.confianca + 8); } lembrarCom(v, pid, 'Esteve do seu lado numa fase muito difícil.', 'apoio', 3); }
  // A fase grave alivia quando a ajuda chega (os pensamentos não somem num dia — mas não se fica sozinho com eles).
  if (x.nivel === 3) { x.nivel = 2; x.t = v.t; x.historico.push({ t: v.t, nivel: 2, texto: 'Pediu ajuda — e a ajuda veio.' }); }
  v.mente.estresse = clamp(v.mente.estresse - 6);
}
