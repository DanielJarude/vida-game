/**
 * VIDA 30 · O OFÍCIO DEPOIS DE COMPETIR (pedido no meio da atualização: "as carreiras pós-esporte estão superficiais").
 *
 * A VIDA 26 abriu as portas (escolinha, comissão técnica, análise, mídia, gestão — por modalidade e pela trajetória),
 * mas cada uma era um emprego comum: salário, escada de promoção, estresse. Aqui, cada família de ofício tem o seu
 * jogo, lido e escrito ano a ano, com gente e lugares com nome:
 *
 *   MÍDIA      a emissora (nome genérico, nunca um veículo real), o programa, a audiência e a credibilidade, o jeito no
 *              ar (técnico, polêmico, bem-humorado) — que muda o que sobe e o que cai; o ex-companheiro que você comenta
 *              ao vivo; o bônus de audiência; a escada da VIDA 26 (comentarista → TV) anda pelo desempenho.
 *   FORMAÇÃO   a turma (quantos alunos), alunos com nome e talento; a revelação que você indica (ou segura) e que, anos
 *              depois, assina com um clube — a notícia volta para você; a própria escolinha ou academia, com risco.
 *   COMISSÃO   o clube (o da comissão), o técnico com nome e a confiança dele em você, a temporada do clube; quando o
 *              técnico cai, o convite para assumir interino — que vira o comando (a carreira de técnico da VIDA 11.5),
 *              pelo mesmo caminho da proposta com clube do §8.
 *   GESTÃO     o orçamento, as janelas (o craque caro, a promessa barata), os acertos e os erros, a pressão da torcida.
 *
 * Os indicadores mexem no desempenho do emprego (a escada de promoção é a mesma) e, às vezes, no dinheiro e no nome.
 * Sorteios derivados. Só funções declaradas (o pacote vive num ciclo de chunks com o motor).
 */
import type { Pessoa, Vida } from '../../tipos';
import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import { escrever, idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { sortearNome, sortearSobrenome } from '../../dados/nomes';
import { municipio, paisDaCidade } from '../../dados/lugares';
import { ocupacaoOuNula } from '../../dados/ocupacoes';
import { carreirasEsportivas } from '../../sistemas/esporte';
import { lancar } from '../../sistemas/extrato';
import { criarPessoa, vincular } from '../../pessoas';
import { clubesDoPais } from '../../dados/clubes';

export type Familia30 = 'midia' | 'formacao' | 'comissao' | 'gestao';
const FAMILIAS: Record<string, Familia30> = {
  comentarista_esportivo: 'midia', comentarista_tv: 'midia', caster_esports: 'midia', caster_esports_principal: 'midia',
  treinador_escolinha: 'formacao', professor_tenis: 'formacao', treinador_tenistas: 'formacao', professor_natacao: 'formacao', professor_atletismo: 'formacao', instrutor_lutas: 'formacao', instrutor_pilotagem: 'formacao', treinador_pilotos: 'formacao', coordenador_academia: 'formacao',
  auxiliar_tecnico: 'comissao', auxiliar_tecnico_futsal: 'comissao', auxiliar_tecnico_basquete: 'comissao', auxiliar_tecnico_volei: 'comissao', auxiliar_tecnico_natacao: 'comissao', auxiliar_tecnico_atletismo: 'comissao', auxiliar_tecnico_lutas: 'comissao', treinador_goleiros: 'comissao', preparador_fisico: 'comissao', analista_desempenho: 'comissao', coordenador_analise: 'comissao', analista_esports: 'comissao', tecnico_esports: 'comissao',
  gerente_esportivo: 'gestao', diretor_esportivo: 'gestao', gestor_esports: 'gestao'
};
export const familiaDoOficio30 = (ocId: string | undefined): Familia30 | undefined => (ocId ? FAMILIAS[ocId] : undefined);

export interface Aluno30 { nome: string; nasc: number; talento: number; destino?: string; tDestino?: number; indicado?: number; pessoaId?: string }
export interface Oficio30 {
  oc: string;
  familia: Familia30;
  desde: number;
  /** A casa: a emissora, a escolinha, o clube, a organização. */
  casa: string;
  /** Os dois números do ofício (0–100): mídia = audiência e credibilidade; formação = turma e nome; comissão = confiança do chefe e
   *  resultado do time; gestão = acertos e saúde do orçamento. */
  a: number;
  b: number;
  estilo?: 'tecnico' | 'polemico' | 'humor';
  programa?: string;
  chefeId?: string;
  alunos?: Aluno30[];
  propria?: boolean;
  /** Os anos do ofício, em uma frase cada (os últimos 12). */
  anos: { ano: number; texto: string; tom?: 'bom' | 'ruim' }[];
  /** A cena que o ano pediu (aberta pelo fluxo do ano, conferida de novo). */
  cena?: { t: number; id: string; aluno?: number };
}

export const ROTULOS30: Record<Familia30, [string, string]> = { midia: ['Audiência', 'Credibilidade'], formacao: ['Turma', 'Nome na cidade'], comissao: ['Confiança do técnico', 'Resultado do time'], gestao: ['Acertos nas contratações', 'Saúde do orçamento'] };

const EMISSORAS = ['Rádio Cidade Esportes', 'TV Arena', 'Canal Placar', 'Rede Bola em Jogo', 'Rádio Clube AM', 'Canal Esporte Total'];
const CASTER = ['Arena Cast', 'Liga Stream', 'Canal Clutch', 'Hub Gamer TV'];
const PROGRAMAS = ['Mesa Redonda da Noite', 'Bola na Área', 'Resenha do Domingo', 'Papo de Vestiário', 'Pós-Jogo'];

/** A reputação da carreira de atleta que acabou (o ex-jogador começa com nome). */
function nomeDeAtleta(v: Vida): number {
  return Math.max(0, ...carreirasEsportivas(v).map(c => c.reputacao ?? 0), v.esports25?.reputacao ?? 0);
}

function casaDe(v: Vida, familia: Familia30, ocId: string, r: Rng): string {
  const e = v.trabalho.atual;
  if (familia === 'midia') return ocId.startsWith('caster') ? CASTER[Math.floor(r.next() * CASTER.length)] : EMISSORAS[Math.floor(r.next() * EMISSORAS.length)];
  if (familia === 'comissao' || familia === 'gestao') return e?.clube ?? (ocId.includes('esports') ? (v.esports25?.equipe?.nome ?? 'a organização') : e?.empregador?.replace(/^(o|a) /, '') ?? 'o clube');
  const cidade = municipio(v.moradia.municipioId).nome;
  return ocId === 'treinador_escolinha' ? `Escolinha ${cidade} FC` : ocId.includes('natacao') ? `Academia Raia de ${cidade}` : ocId.includes('tenis') || ocId.includes('tenistas') ? `Clube de Tênis de ${cidade}` : ocId.includes('lutas') ? `Centro de Lutas de ${cidade}` : ocId.includes('pilot') ? `Kartódromo de ${cidade}` : `Centro Esportivo de ${cidade}`;
}

/** O ofício de agora (criado ao chegar; um ofício novo quando o emprego muda). */
export function oficio30(v: Vida): Oficio30 | undefined {
  const e = v.trabalho.atual;
  const familia = familiaDoOficio30(e?.ocupacaoId);
  if (!e || !familia) return undefined;
  if (v.oficio30?.oc === e.ocupacaoId && v.oficio30.desde >= e.tInicio) return v.oficio30;
  const r = rngDe(v.id, 'oficio30', e.ocupacaoId, e.tInicio);
  const nome = nomeDeAtleta(v);
  v.oficio30 = { oc: e.ocupacaoId, familia, desde: Math.max(e.tInicio, v.t), casa: casaDe(v, familia, e.ocupacaoId, r), a: clamp(Math.round(35 + nome * 0.35 + r.normal() * 6)), b: clamp(Math.round(50 + r.normal() * 8)), anos: [], ...(familia === 'midia' ? { programa: PROGRAMAS[Math.floor(r.next() * PROGRAMAS.length)] } : {}) };
  return v.oficio30;
}

function registrar(o: Oficio30, ano: number, texto: string, tom?: 'bom' | 'ruim'): void {
  o.anos.push({ ano, texto, ...(tom ? { tom } : {}) });
  if (o.anos.length > 12) o.anos.splice(0, o.anos.length - 12);
}

/** O técnico com quem a comissão trabalha (uma Pessoa da vida: o chefe). */
export function chefeDaComissao30(v: Vida, o: Oficio30): Pessoa | undefined {
  const atual = o.chefeId ? v.pessoas[o.chefeId] : undefined;
  if (atual?.vivo) return atual;
  const r = rngDe(v.id, 'chefe30', v.t);
  const p = criarPessoa(v, r, { idade: clamp(idade(v) + r.int(2, 18), 38, 72), genero: r.chance(0.15) ? 'feminino' : 'masculino', municipioId: v.trabalho.atual?.municipioId ?? v.moradia.municipioId, ocupacao: o.oc.includes('esports') ? 'técnico de e-sports' : 'técnico' });
  vincular(v, p, { origem: 'trabalho', proximidade: 30, estagio: 'colega', convivio: ['trabalho'] });
  o.chefeId = p.id;
  return p;
}

function novoAluno(v: Vida, r: Rng): Aluno30 {
  const genero = r.chance(0.5) ? 'masculino' : 'feminino';
  const nasc = anoDe(v.t) - r.int(9, 15);
  return { nome: `${sortearNome(r, genero, nasc, paisDaCidade(v.moradia.municipioId))} ${sortearSobrenome(r, paisDaCidade(v.moradia.municipioId))}`, nasc, talento: clamp(Math.round(58 + r.normal() * 13)) };
}

/**
 * O ano do ofício (chamado na virada): os números andam, a casa conta a sua história, o desempenho do emprego sente, e
 * às vezes o ano pede uma escolha (devolve o id da cena).
 */
export function anoDoOficio30(v: Vida, semDecisao: boolean): string | undefined {
  const o = oficio30(v);
  const e = v.trabalho.atual;
  if (!o || !e) return undefined;
  const ano = anoDe(v.t) - 1;
  if (o.anos.some(x => x.ano === ano)) return undefined;
  const r = rngDe(v.id, 'oficio30_ano', ano);
  const desemp = e.desempenho;
  const nome = nomeDeAtleta(v);
  let cena: string | undefined;
  if (o.familia === 'midia') {
    const humor = o.estilo === 'humor' ? 4 : 0, polemica = o.estilo === 'polemico';
    o.a = clamp(Math.round(o.a + (desemp - 60) / 10 + nome / 60 + humor + (polemica ? 6 : 0) + r.normal() * 4));
    o.b = clamp(Math.round(o.b + (o.estilo === 'tecnico' ? 4 : 0) - (polemica ? 5 : 0) + (desemp - 60) / 15 + r.normal() * 3));
    const fato = o.a >= 70 ? `O ${o.programa ?? 'programa'} foi o mais assistido da faixa — e o seu comentário virou corte nas redes.` : o.a <= 30 ? `A audiência caiu, e a ${o.casa} mexeu no horário do ${o.programa ?? 'programa'}.` : `Mais uma temporada no ar, na ${o.casa}: ${o.b >= 65 ? 'o público confia no que você diz' : 'opinião não falta'}.`;
    registrar(o, ano, fato, o.a >= 70 ? 'bom' : o.a <= 30 ? 'ruim' : undefined);
    if (o.a >= 70) { const bonus = Math.round(e.salario * 1.5 / 100) * 100; v.financas.conta += bonus; lancar(v, `Bônus de audiência (${o.casa})`, 'renda', bonus); }
    e.desempenho = clamp(Math.round(e.desempenho + (o.a - 50) / 12 + (o.b - 50) / 20));
    if (!o.estilo) cena = 'pos30_estilo';
    else if (r.chance(0.4)) cena = 'pos30_aovivo';
  } else if (o.familia === 'formacao') {
    // A turma se renova: quem passou dos 17 sem assinar seguiu a vida (sai da lista, a não ser quem foi indicado e espera).
    o.alunos = (o.alunos ?? []).filter(x => x.destino || x.indicado !== undefined || anoDe(v.t) - x.nasc <= 17);
    if (o.alunos.length > 24) o.alunos = o.alunos.slice(-24);
    const alunos = o.alunos;
    const vagas = o.propria ? 6 : 4;
    while (alunos.filter(x => !x.destino && x.indicado === undefined).length < vagas) alunos.push(novoAluno(v, r));
    o.a = clamp(Math.round(o.a + (desemp - 60) / 10 + (o.propria ? 3 : 0) + r.normal() * 4));
    o.b = clamp(Math.round(o.b + (o.a - 50) / 15 + nome / 80 + r.normal() * 3));
    // Os alunos crescem; quem foi indicado há uns anos pode assinar (a notícia volta).
    for (const x of alunos) {
      if (x.destino || x.indicado === undefined) continue;
      if (ano - anoDe(x.indicado) >= 2 && r.chance(0.3 + (x.talento - 60) / 80)) {
        const pais = paisDaCidade(v.moradia.municipioId);
        const grandes = clubesDoPais(pais).filter(c => c.porte !== 'regional');
        x.destino = grandes.length ? grandes[Math.floor(r.next() * grandes.length)].nome : 'um clube da capital';
        x.tDestino = v.t;
        registrar(o, ano, `${x.nome}, que começou com você, assinou com o ${x.destino}.`, 'bom');
        escrever(v, { texto: `${x.nome}, ex-alun${x.nome.endsWith('a') ? 'a' : 'o'} da ${o.casa}, assinou o primeiro contrato com o ${x.destino}. Ligou para agradecer.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
        o.b = clamp(o.b + 8);
      }
    }
    if (!o.anos.some(y => y.ano === ano)) registrar(o, ano, o.propria ? `A ${o.casa} fechou o ano com ${alunos.length * 6} alunos e a quadra cheia nos sábados.` : `Mais uma turma na ${o.casa}: ${o.a >= 60 ? 'lista de espera' : 'vagas sobrando'}.`, o.a >= 60 ? 'bom' : undefined);
    if (o.propria) { const lucro = Math.round(e.salario * 12 * ((o.a - 45) / 100) / 100) * 100; v.financas.conta += lucro; lancar(v, `Resultado da ${o.casa}`, lucro >= 0 ? 'renda' : 'despesa', lucro); }
    e.desempenho = clamp(Math.round(e.desempenho + (o.a - 50) / 15));
    // O melhor da turma que ainda ninguém indicou (o talento acima do comum: 63+).
    const livres = alunos.map((x, k) => ({ x, k })).filter(y => !y.x.destino && y.x.indicado === undefined && y.x.talento >= 63).sort((p1, p2) => p2.x.talento - p1.x.talento);
    const talento = livres.length ? livres[0].k : -1;
    if (talento >= 0 && r.chance(0.55)) { o.cena = { t: v.t, id: 'pos30_revelacao', aluno: talento }; cena = 'pos30_revelacao'; }
    else if (!o.propria && v.t - o.desde >= 36 && r.chance(0.3)) cena = 'pos30_propria';
  } else if (o.familia === 'comissao') {
    const chefe = chefeDaComissao30(v, o);
    o.b = clamp(Math.round(45 + r.normal() * 15 + (desemp - 60) / 6));
    o.a = clamp(Math.round(o.a + (desemp - 60) / 8 + (o.b - 50) / 10 + r.normal() * 4));
    const vin = chefe ? v.vinculos[chefe.id] : undefined;
    if (vin) { vin.confianca = clamp(Math.round(vin.confianca + (o.a - 50) / 10)); vin.tUltimoContato = v.t; }
    registrar(o, ano, o.b >= 65 ? `Temporada boa d${o.casa.startsWith('equipe') ? 'a' : 'o'} ${o.casa}: o trabalho da comissão foi elogiado.` : o.b <= 30 ? `Temporada ruim d${o.casa.startsWith('equipe') ? 'a' : 'o'} ${o.casa}: a diretoria começou a cobrar a comissão.` : `Temporada de meio de tabela d${o.casa.startsWith('equipe') ? 'a' : 'o'} ${o.casa}.`, o.b >= 65 ? 'bom' : o.b <= 30 ? 'ruim' : undefined);
    e.desempenho = clamp(Math.round(e.desempenho + (o.a - 50) / 12 + (o.b - 50) / 25));
    const auxiliar = /^auxiliar_tecnico|tecnico_esports|treinador_goleiros/.test(o.oc);
    if (o.b <= 32 && auxiliar && o.a >= 55 && r.chance(0.6)) cena = 'pos30_interino';
    else if (o.a <= 35 && r.chance(0.5)) cena = 'pos30_vestiario';
  } else {
    o.a = clamp(Math.round(o.a + (desemp - 60) / 10 + r.normal() * 6));
    o.b = clamp(Math.round(o.b + (o.a - 50) / 8 + r.normal() * 5));
    registrar(o, ano, o.a >= 65 ? `A janela d${o.casa.startsWith('equipe') ? 'a' : 'o'} ${o.casa} deu certo: os reforços jogaram.` : o.a <= 35 ? `Dois reforços caros não renderam — e a torcida lembrou o seu nome nas arquibancadas.` : `Uma janela de acertos e erros.`, o.a >= 65 ? 'bom' : o.a <= 35 ? 'ruim' : undefined);
    e.desempenho = clamp(Math.round(e.desempenho + (o.a - 50) / 10 + (o.b - 50) / 20));
    if (o.a <= 40 && r.chance(0.5)) cena = 'pos30_pressao';
    else if (r.chance(0.45)) cena = 'pos30_janela';
  }
  if (!semDecisao || !cena) { if (o.cena && o.cena.t !== v.t) delete o.cena; return undefined; }
  if (!o.cena || o.cena.id !== cena) o.cena = { t: v.t, id: cena };
  return cena;
}

/** O aluno da cena (a revelação). */
export function alunoDaCena30(v: Vida): Aluno30 | undefined {
  const o = v.oficio30;
  return o?.cena?.aluno !== undefined ? o.alunos?.[o.cena.aluno] : undefined;
}
/** O ex-companheiro (do tempo de atleta) que a mídia comenta. */
export function exCompanheiro30(v: Vida): Pessoa | undefined {
  const lista = Object.values(v.vinculos).filter(x => x.origem === 'trabalho' && v.pessoas[x.pessoaId]?.vivo && /jogador|atleta|goleir|atacante|zagueir|meio|tenista|nadador|lutador/i.test(v.pessoas[x.pessoaId].ocupacao ?? '')).map(x => v.pessoas[x.pessoaId]);
  return lista[0];
}
/** A cena do ofício está de pé neste ano? */
export const cenaDoOficio30 = (v: Vida, id: string) => v.oficio30?.cena?.t === v.t && v.oficio30.cena.id === id && !!oficio30(v);
/** O nome do ofício (para a tela). */
export const nomeDoOficio30 = (v: Vida) => { const o = v.oficio30; const oc = o ? ocupacaoOuNula(o.oc) : undefined; return oc ? oc.nome[v.eu.genero === 'feminino' ? 1 : 0] : ''; };
