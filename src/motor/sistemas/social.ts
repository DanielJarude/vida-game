/**
 * Vida social.
 *
 * Toda relação não familiar nasce num AMBIENTE concreto — esta turma, este
 * emprego, este time de futebol — e se mantém enquanto há convivência. Sem
 * convivência, esfria; em outra cidade, esfria mais rápido. A proximidade
 * cresce com compatibilidade (temperamento da pessoa × traços que o jogador
 * construiu) e com o tempo que o jogador decide dedicar a ela.
 *
 * Estágios: conhecido → colega → amigo → amigo próximo (ou afastado).
 * Nada disso é uma barra para farmar: o jogador não vê números, e o que
 * mais pesa é estar junto ao longo dos anos.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Convivio, Pessoa, Vida, Vinculo } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, vinculosVivos } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { MUNICIPIOS, municipio } from '../dados/lugares';
import { moraComFamiliaDeOrigem } from './domicilio';
import { flex } from '../texto';

/* ------------------------------------------------------------ Ambientes */

export interface Ambiente {
  chave: string;
  tipo: Convivio;
  /** Faixa de idade das pessoas desse ambiente. */
  idade: [number, number];
  /** Quantas pessoas novas aparecem por ano ali. */
  fluxo: number;
  descricao: string;
}

function grupoEscolar(etapa: string): string {
  return etapa === 'creche' || etapa === 'pre' ? 'infantil' : etapa === 'medio' ? 'medio' : etapa === 'fundamental1' ? 'fund1' : 'fund2';
}

export function ambientesAtuais(v: Vida): Ambiente[] {
  const out: Ambiente[] = [];
  const i = idade(v);
  const cidade = v.moradia.municipioId;
  const b = v.educacao.basica;
  if (b) {
    const g = grupoEscolar(b.etapa);
    out.push({
      chave: `escola:${cidade}:${b.rede}:${g}`, tipo: 'escola',
      idade: [i - 1, i + 1], fluxo: g === 'infantil' ? 1 : 2,
      descricao: g === 'medio' ? 'no ensino médio' : g === 'infantil' ? 'na escolinha' : 'na escola'
    });
  }
  const m = v.educacao.matricula;
  if (m && m.modalidade === 'presencial' && !m.trancado) {
    out.push({ chave: `faculdade:${m.cursoId}:${m.tInicio}`, tipo: 'faculdade', idade: [Math.max(17, i - 3), i + 6], fluxo: 2, descricao: 'na faculdade' });
  }
  const e = v.trabalho.atual;
  if (e && e.contrato !== 'informal') {
    out.push({ chave: `trabalho:${e.empregador}:${e.tInicio}`, tipo: 'trabalho', idade: [Math.max(18, i - 15), Math.min(66, i + 20)], fluxo: 1.5, descricao: 'no trabalho' });
  }
  for (const rot of v.rotinas) {
    const social = ROTINAS_SOCIAIS[rot.id];
    if (!social) continue;
    // Criança faz amizade com criança: na igreja há adultos, mas o amigo de uma criança de 6 anos tem 6 anos.
    const amplitude = i < 14 ? Math.min(2, social.amplitude) : i < 18 ? Math.min(4, social.amplitude) : social.amplitude;
    out.push({ chave: `rotina:${rot.id}:${cidade}`, tipo: 'rotina', idade: [Math.max(i < 18 ? 3 : 16, i - amplitude), i + amplitude], fluxo: social.fluxo, descricao: social.onde });
  }
  if (i >= 4 && i <= 16 && moraComFamiliaDeOrigem(v)) {
    out.push({ chave: `vizinhanca:${cidade}:${v.moradia.tInicio}`, tipo: 'vizinhanca', idade: [i - 2, i + 2], fluxo: 0.6, descricao: 'na rua de casa' });
  }
  return out;
}

/** Rotinas que colocam o jogador em contato com gente (preenchido por `rotinas`). */
export const ROTINAS_SOCIAIS: Record<string, { onde: string; fluxo: number; amplitude: number }> = {};

/* ---------------------------------------------------------- Compatibilidade */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

/** −1..1: o quanto o jeito da pessoa combina com o jeito que o jogador vem sendo. */
export function compatibilidade(v: Vida, p: Pessoa): number {
  const t = v.personalidade.tracos;
  const tp = p.temperamento;
  const norm = (x: number) => Math.max(-1, Math.min(1, x / 40));
  const parecido = (a: number, b: number) => 1 - Math.abs(a - b); // 1..-1
  let c = 0;
  c += parecido(norm(t.sociabilidade), tp.extroversao) * 0.25;
  c += (norm(t.empatia) * 0.5 + 0.5) * tp.afabilidade * 0.25; // gente afável se dá bem com quem é empático
  c += parecido(norm(t.disciplina - t.impulsividade), tp.responsabilidade) * 0.2;
  c += tp.afabilidade * 0.1 + tp.estabilidade * 0.05;
  const quimica = hash(v.id + p.id) * 2 - 1; // afinidade que não se explica
  return Math.max(-1, Math.min(1, c * 0.6 + quimica * 0.55));
}

/* ------------------------------------------------------------- Convívio */

export function recalcularConvivio(v: Vida): void {
  const chaves = new Map(ambientesAtuais(v).map(a => [a.chave, a.tipo]));
  const naCasaDosPais = moraComFamiliaDeOrigem(v);
  const cidade = v.moradia.municipioId;
  for (const { p, vin } of vinculosVivos(v)) {
    const conv: Convivio[] = [];
    // Casa
    if (moraJunto(v, p, vin, naCasaDosPais)) conv.push('casa');
    // Ambiente de origem ainda frequentado — por quem ainda está na cidade (ou online).
    if (vin.ambiente && chaves.has(vin.ambiente) && (p.municipioId === cidade || chaves.get(vin.ambiente) === 'online')) conv.push(chaves.get(vin.ambiente)!);
    // Mesma cidade, família: contato de fim de semana
    if (!conv.includes('casa') && vin.parentesco && p.municipioId === cidade && vin.parentesco !== 'pet') conv.push('vizinhanca');
    vin.convivio = conv;
  }
}

function moraJunto(v: Vida, p: Pessoa, vin: Vinculo, naCasaDosPais: boolean): boolean {
  const par = vin.parentesco;
  // Casal mora junto — a não ser que um dos dois esteja em outra cidade (relação à distância).
  if (vin.romance && (vin.romance.estagio === 'morando_junto' || vin.romance.estagio === 'casamento') && !vin.romance.secreto) return p.municipioId === v.moradia.municipioId;
  if (naCasaDosPais) {
    if (vin.convivio.includes('casa')) return p.municipioId === v.moradia.municipioId && !saiuDeCasa(v, p, vin);
    return false;
  }
  if (par === 'filho' || par === 'enteado') return vin.convivio.includes('casa') && !saiuDeCasa(v, p, vin);
  if (par === 'pet') return vin.convivio.includes('casa');
  return false;
}

/** Irmãos e filhos crescem e saem de casa. */
function saiuDeCasa(v: Vida, p: Pessoa, vin: Vinculo): boolean {
  if (vin.parentesco !== 'irmao' && vin.parentesco !== 'meio_irmao' && vin.parentesco !== 'filho' && vin.parentesco !== 'enteado') return false;
  return v.fatos[`saiu_de_casa_${p.id}`] !== undefined;
}

/** Um momento difícil passa (ou deixa de ser "recente"). */
export function limparApertos(v: Vida): void {
  for (const p of Object.values(v.pessoas)) if (p.aperto && v.t - p.aperto.t > 36) p.aperto = undefined;
}

/* ------------------------------------------------------ Gente nova */

function populacaoAtiva(v: Vida): number {
  return vinculosVivos(v).filter(x => !x.vin.parentesco && x.vin.estagio !== 'afastado').length;
}

export function conhecerGente(v: Vida, r: Rng): void {
  const i = idade(v);
  if (i < 2) return;
  for (const amb of ambientesAtuais(v)) {
    const jaTem = vinculosVivos(v).filter(x => x.vin.ambiente === amb.chave).length;
    const primeiraVez = jaTem === 0;
    let n = primeiraVez ? Math.ceil(amb.fluxo * 1.6) : r.chance(amb.fluxo % 1) ? Math.ceil(amb.fluxo) : Math.floor(amb.fluxo);
    if (populacaoAtiva(v) > 30) n = Math.min(n, 1);
    if (jaTem >= 8) n = 0;
    for (let k = 0; k < n; k++) {
      const idadeP = Math.max(amb.tipo === 'escola' ? 2 : 0, r.int(amb.idade[0], amb.idade[1]));
      const p = criarPessoa(v, r, { idade: idadeP, municipioId: v.moradia.municipioId });
      p.ocupacao = idadeP < 18 || amb.tipo === 'escola' || amb.tipo === 'faculdade' ? 'estudante' : undefined;
      if (amb.tipo === 'trabalho') p.renda = 2500;
      vincular(v, p, { origem: amb.tipo, proximidade: r.int(8, 20), convivio: [amb.tipo], estagio: 'conhecido' });
      v.vinculos[p.id].ambiente = amb.chave;
    }
  }
  podarDesconhecidos(v);
}

/** Gente que nunca chegou a importar e não convive mais sai da memória do jogo. */
function podarDesconhecidos(v: Vida): void {
  const citados = new Set(v.biografia.flatMap(e => e.pessoas ?? []));
  for (const { p, vin } of vinculosVivos(v)) {
    if (vin.parentesco || vin.romance) continue;
    if (vin.convivio.length > 0 || citados.has(p.id)) continue;
    if ((vin.estagio === 'conhecido' || vin.estagio === 'colega') && vin.historia.length === 0 && vin.proximidade < 25) {
      delete v.vinculos[p.id];
      delete v.pessoas[p.id];
    }
  }
}

/* ------------------------------------------------------ Evolução */

const ORDEM: Record<string, number> = { conhecido: 0, colega: 1, amigo: 2, amigo_proximo: 3, afastado: -1 };

const proximosAtuais = (v: Vida) => vinculosVivos(v).filter(x => !x.vin.parentesco && x.vin.estagio === 'amigo_proximo').length;

export function limiteDeAmigos(v: Vida): number {
  const s = v.personalidade.tracos.sociabilidade;
  const i = idade(v);
  const base = i < 6 ? 2 : i < 30 ? 5 : i < 60 ? 4 : 3;
  return Math.max(1, Math.round(base + s / 30));
}

export function processarSocial(v: Vida, r: Rng): void {
  const i = idade(v);
  const cidade = v.moradia.municipioId;
  const linhas: { prioridade: number; fazer: () => void }[] = [];

  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie) continue;
    vin.tensao = Math.round(vin.tensao * 0.65);

    if (vin.parentesco && ['filho', 'enteado', 'neto', 'bisneto'].includes(vin.parentesco)) continue; // sistema de filhos
    if (vin.parentesco) {
      // Família: proximidade anda devagar; distância pesa pouco, ausência de contato pesa.
      const junto = vin.convivio.length > 0;
      const contatoRecente = v.t - vin.tUltimoContato < 24;
      const alvo = junto ? 70 : contatoRecente ? 55 : 40;
      vin.proximidade = clamp(Math.round(vin.proximidade + (alvo - vin.proximidade) * 0.08 + r.normal() * 1.5));
      if (junto) vin.tUltimoContato = v.t;
      continue;
    }
    if (vin.romance && vin.romance.estagio !== 'ex') continue; // romance tem seu próprio sistema

    const c = compatibilidade(v, p);
    const junto = vin.convivio.length > 0;
    const outraCidade = p.municipioId !== cidade;
    let delta: number;
    if (junto) {
      delta = 3 + c * 11 + v.personalidade.tracos.sociabilidade / 25 + r.normal() * 4;
      vin.tUltimoContato = v.t;
      if (c < -0.35 && r.chance(0.25)) vin.tensao = clamp(vin.tensao + 25);
    } else {
      const semContato = v.t - vin.tUltimoContato;
      delta = semContato < 12 ? -2 : outraCidade ? -11 : -6;
      if (vin.estagio === 'amigo_proximo') delta *= 0.6; // amizade antiga resiste mais
    }
    delta -= vin.tensao / 12;
    vin.proximidade = clamp(Math.round(vin.proximidade + clamp(delta, -15, 10)));
    // Colega é colega: o afeto de quem ainda não virou amigo tem teto.
    if ((vin.estagio === 'colega' || vin.estagio === 'conhecido') && vin.proximidade > 58) vin.proximidade = 58;
    if (junto && vin.tensao < 30) vin.confianca = clamp(Math.round(vin.confianca + ((vin.estagio === 'amigo_proximo' ? 80 : vin.estagio === 'amigo' ? 65 : 40) - vin.confianca) * 0.08));

    const conhecidosHa = (v.t - vin.tInicio) / 12;
    const antes = vin.estagio ?? 'conhecido';
    let depois = antes;
    const amigosAtuais = vinculosVivos(v).filter(x => !x.vin.parentesco && (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo')).length;
    if (antes === 'afastado') {
      if (junto && vin.proximidade >= 45) depois = 'amigo';
    } else if (vin.proximidade < 28 && ORDEM[antes] >= 2) {
      depois = 'afastado';
    } else if (antes === 'conhecido' && junto && vin.proximidade >= 20) {
      depois = 'colega';
    } else if (antes === 'colega' && vin.proximidade >= 45 && conhecidosHa >= 1 && amigosAtuais < limiteDeAmigos(v)) {
      depois = 'amigo';
    } else if (antes === 'amigo' && vin.proximidade >= 75 && conhecidosHa >= 4 && proximosAtuais(v) < 3) {
      depois = 'amigo_proximo';
    } else if (antes === 'colega' && !junto && vin.proximidade < 20) {
      depois = 'conhecido';
    }
    if (depois !== antes) {
      vin.estagio = depois;
      const onde = descricaoOrigem(v, vin);
      if (depois === 'amigo' && antes !== 'afastado') {
        linhas.push({ prioridade: 2, fazer: () => {
          escrever(v, { texto: textoNovaAmizade(v, p, onde), relevancia: 'biografia', tema: 'amizade', tom: 'bom', pessoas: [p.id], evento: { tipo: 'amizade', pessoaId: p.id, peso: 20 } });
          lembrarCom(v, p.id, `Viraram amigos ${onde}.`, 'amizade', 2);
        } });
      } else if (depois === 'amigo' && antes === 'afastado') {
        linhas.push({ prioridade: 2, fazer: () => { escrever(v, { texto: `A amizade com ${p.nome} voltou a ser o que era.`, relevancia: 'biografia', tema: 'amizade', tom: 'bom', pessoas: [p.id], evento: { tipo: 'reconciliacao', pessoaId: p.id, peso: 20 } }); lembrarCom(v, p.id, 'A amizade voltou.', 'reconciliacao', 2); } });
      } else if (depois === 'amigo_proximo') {
        linhas.push({ prioridade: 3, fazer: () => {
          escrever(v, { texto: variante(v, 'proximo', [
            `${p.nome} passou a ser das pessoas mais próximas da sua vida.`,
            `Em algum momento, sem aviso, ${p.nome} virou a primeira pessoa para quem você liga.`,
            `${p.nome} já sabia das coisas antes de você contar para qualquer outra pessoa.`,
            `A amizade com ${p.nome} virou daquelas que não precisam de explicação.`,
            `${p.nome} entrou para a lista curta de quem você chamaria às três da manhã.`
          ]), relevancia: 'biografia', tema: 'amizade', tom: 'bom', pessoas: [p.id], evento: { tipo: 'amizade', pessoaId: p.id, peso: 35 } });
          lembrarCom(v, p.id, 'Viraram amigos de verdade.', 'amizade', 3);
        } });
      } else if (depois === 'afastado' && antes === 'amigo_proximo') {
        linhas.push({ prioridade: 3, fazer: () => { escrever(v, { texto: textoAfastamento(v, p, outraCidade), relevancia: 'biografia', tema: 'amizade', tom: 'ruim', pessoas: [p.id], evento: { tipo: 'amizade_fim', pessoaId: p.id, peso: 25 } }); lembrarCom(v, p.id, outraCidade ? 'A distância afastou vocês.' : 'Foram se afastando.', 'distancia', 1); } });
      } else if (depois === 'afastado' && antes === 'amigo') {
        linhas.push({ prioridade: 1, fazer: () => escrever(v, { texto: variante(v, 'perdendo', [
          `Você e ${p.nome} foram se perdendo de vista.`,
          `As mensagens com ${p.nome} foram ficando mais espaçadas, até pararem.`,
          `${p.nome} virou alguém de quem você lembra no aniversário, e só.`,
          `A amizade com ${p.nome} ficou para trás, sem briga nenhuma.`,
          `Você e ${p.nome} deixaram de combinar coisas. Ninguém percebeu quando.`
        ]), relevancia: 'cotidiano', tema: 'amizade', pessoas: [p.id] }) });
      }
    }
  }
  // No máximo duas linhas sociais por ano — o resto acontece sem narração.
  linhas.sort((a, b) => b.prioridade - a.prioridade).slice(0, i < 6 ? 1 : 2).forEach(l => l.fazer());
}

/**
 * A vida própria de quem não é da família: estudante cresce e arruma
 * trabalho, trabalho às vezes acaba. Vale para amigos e parceiros.
 */
export function envelhecerConhecidos(v: Vida, r: Rng): void {
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie || vin.parentesco) continue;
    const i = idadePessoa(v, p);
    if (i >= 18 && (p.ocupacao === 'estudante' || (!p.ocupacao && p.renda === 0))) {
      if (r.chance(i >= 23 ? 0.6 : 0.3)) {
        const nivel = hash(p.id) ; // cada pessoa tem sua sorte, estável
        p.renda = Math.round((1500 + nivel * 6500 + (i >= 30 ? 1500 : 0)) / 10) * 10;
        p.ocupacao = undefined;
      }
    } else if (p.renda > 0 && i < 65 && r.chance(0.05)) {
      p.renda = 0;
      p.aperto = { tipo: 'desemprego', t: v.t };
    } else if (p.renda === 0 && i >= 18 && i < 65 && r.chance(0.5)) {
      p.renda = Math.round((1500 + hash(p.id) * 6500) / 10) * 10;
    } else if (i >= 65 && p.renda > 0 && r.chance(0.3)) {
      p.renda = Math.max(1620, Math.round(p.renda * 0.7));
      p.ocupacao = p.genero === 'feminino' ? 'aposentada' : 'aposentado';
    }
    if (p.aperto?.tipo === 'desemprego' && p.renda > 0) p.aperto = undefined;
    // A vida de um amigo próximo também acontece — e fica na história de vocês.
    if (vin.estagio === 'amigo_proximo' && !vin.romance) {
      if (!p.parceiroId && i >= 22 && i <= 50 && r.chance(0.07)) {
        p.parceiroId = 'fora';
        lembrarCom(v, p.id, `Casou${r.chance(0.5) ? ', e você estava lá' : ''}.`, 'romance', 1);
      }
      const anos = Math.floor((v.t - vin.tInicio) / 12);
      if ((anos === 25 || anos === 50) && !vin.historia.some(h => h.texto.startsWith(anos === 25 ? 'Vinte e cinco anos' : 'Cinquenta anos'))) {
        lembrarCom(v, p.id, anos === 25 ? 'Vinte e cinco anos de amizade.' : 'Cinquenta anos de amizade.', 'amizade', 2);
      }
    }
    // Amigos também mudam de cidade — e a amizade passa a ser à distância.
    const amigo = vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo';
    if (amigo && i >= 20 && i <= 60 && !vin.romance && p.municipioId === v.moradia.municipioId && r.chance(0.02)) {
      const destino = r.pick(MUNICIPIOS.filter(m => m.id !== p.municipioId && (m.perfil === 'metropole' || m.perfil === 'capital')));
      p.municipioId = destino.id;
      escrever(v, { texto: variante(v, 'amigo_mudou', [
        `${p.nome} se mudou para ${destino.nome}. A amizade passou a caber no celular.`,
        `${p.nome} arrumou as malas para ${destino.nome}. Fizeram uma despedida no bar de sempre.`,
        `${p.nome} foi morar em ${destino.nome}. Prometeram se visitar.`
      ]), relevancia: vin.estagio === 'amigo_proximo' ? 'biografia' : 'cotidiano', tema: 'amizade', pessoas: [p.id] });
      lembrarCom(v, p.id, `Mudou-se para ${destino.nome}.`, 'distancia', 1);
    }
  }
}

export function descricaoOrigem(_v: Vida, vin: Vinculo): string {
  const a = vin.ambiente ?? '';
  if (a.startsWith('escola:')) return a.includes(':medio') ? 'no ensino médio' : a.includes(':infantil') ? 'na escolinha' : 'na escola';
  if (a.startsWith('faculdade:')) return 'na faculdade';
  if (a.startsWith('trabalho:')) return 'no trabalho';
  if (a.startsWith('rotina:')) return ROTINAS_SOCIAIS[a.split(':')[1]]?.onde ?? 'por aí';
  if (a.startsWith('vizinhanca:')) return 'na rua de casa';
  if (vin.origem === 'apresentado') return 'por amigos em comum';
  return 'por aí';
}

function textoNovaAmizade(v: Vida, p: Pessoa, onde: string): string {
  const i = idade(v);
  const amigo = flex(p.genero, 'amigo', 'amiga', 'amigue');
  if (i <= 10) return `${p.nome} virou ${flex(p.genero, 'o', 'a', 'e')} ${amigo} de todo dia ${onde}.`;
  if (i <= 17) return `${onde.charAt(0).toUpperCase() + onde.slice(1)}, ${p.nome} deixou de ser só ${flex(p.genero, 'colega', 'colega')} e virou ${amigo}.`;
  return `${p.nome}, que você conheceu ${onde}, virou ${amigo} de verdade.`;
}

function textoAfastamento(v: Vida, p: Pessoa, outraCidade: boolean): string {
  if (outraCidade) return variante(v, 'distancia', [
    `A distância fez o que a distância faz: você e ${p.nome} deixaram de ser próximos.`,
    `Cidades diferentes, rotinas diferentes: a amizade com ${p.nome} foi ficando no passado.`,
    `${p.nome} longe, você aqui. As ligações rarearam até sumirem.`
  ]);
  return variante(v, 'afastou', [
    `Sem que ninguém decidisse nada, você e ${p.nome} deixaram de se ver.`,
    `A vida puxou você e ${p.nome} para lados diferentes.`,
    `Você e ${p.nome} continuaram na mesma cidade e, de algum jeito, pararam de se encontrar.`
  ]);
}

/** A n-ésima vez de uma mesma transição na vida usa a n-ésima frase (sem repetir cedo). */
function variante(v: Vida, chave: string, frases: string[]): string {
  const k = `frase_${chave}`;
  const n = (v.fatos[k] ?? 0) as number;
  v.fatos[k] = n + 1;
  return frases[n % frases.length];
}

/** Pessoa conhecida "por aí" — usada por conteúdo que apresenta alguém. */
export function apresentarAlguem(v: Vida, r: Rng, opts: { idade: [number, number]; genero?: Pessoa['genero']; origem?: Vinculo['origem'] }): Pessoa {
  const p = criarPessoa(v, r, { idade: r.int(opts.idade[0], opts.idade[1]), genero: opts.genero, municipioId: v.moradia.municipioId });
  vincular(v, p, { origem: opts.origem ?? 'apresentado', proximidade: r.int(15, 28), estagio: 'conhecido' });
  return p;
}

export const cidadeDe = (id: string) => municipio(id).nome;
