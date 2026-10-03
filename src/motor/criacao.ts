/**
 * Nascer.
 *
 * O jogador escolhe nome, gênero, cidade e (opcionalmente) a classe social.
 * O resto é a vida que aconteceu com a pessoa antes de ela ter voz: quem são
 * os pais, se estão juntos, do que vivem, se há irmãos, avós vivos, um
 * cachorro no quintal. Tudo isso é coerente com a classe e o lugar.
 */

import { derivarPredisposicoes } from './sistemas/pessoa';
import { bairroDeOrigem, reservaInicial } from './sistemas/origem';
import { caminhosVazios } from './sistemas/marcas';
import { criarRng, rngDe, type Rng } from './rng';
import { ancestralidadeDe, ancestralidadesDosPais, familiaInicial, misturar, perfilInicial, visualDaAncestralidade, visualDeQuemGerou, visualDosPais } from './sistemas/identidade';
import type { Classe, Genero, Origem, Pessoa, Vida, Visual } from './tipos';
import { tDe, MESES, mesDe, anoDe } from './tempo';
import { criarPessoa, vincular, visualAleatorio, visualHerdado } from './pessoas';
import { escrever } from './nucleo';
import { ocupacoesDaClasse, ocupacao } from './dados/ocupacoes';
import { liquido, salarioLocal } from './sistemas/renda';
import { economiaInicial } from './sistemas/economia';
import { nomeDePet } from './sistemas/mercado';
import { municipio, nomeLugar, grandesCentros, paisDaCidade } from './dados/lugares';
import { perfilDoPais } from './mundo/registro';
import { nacionalidadesAoNascer } from './mundo/cidadania';
import { rendaNoPais } from './mundo/economia';
import { NOMES_PET_CACHORRO, NOMES_PET_GATO } from './dados/nomes';
import { flex, listaNatural, artigo } from './texto';

export interface OpcoesCriacao {
  nome: string;
  sobrenome: string;
  genero: Genero;
  municipioId: string;
  classe?: Classe;
  /** Só relevante para pessoas não binárias; nos demais casos deriva do gênero. */
  podeGestar?: boolean;
  visual?: Visual;
  /** Concordância usada no texto (pessoas não binárias escolhem). */
  tratamento?: Genero;
  /** Pele, olhos e cor do cabelo vêm dos pais (o estilo de cabelo continua o escolhido). */
  herdarCores?: boolean;
  semente: number;
  ano?: number;
}

const CLASSES: Classe[] = ['vulneravel', 'trabalhadora', 'media_baixa', 'media', 'alta'];

export const ROTULO_CLASSE: Record<Classe, string> = {
  vulneravel: 'família pobre',
  trabalhadora: 'família trabalhadora',
  media_baixa: 'família de classe média baixa',
  media: 'família de classe média',
  alta: 'família de classe alta'
};

function sortearClasse(r: Rng, municipioId: string): Classe {
  const m = municipio(municipioId);
  // A distribuição é do país (a desigualdade de cada lugar); a região brasileira é uma desigualdade real do Brasil.
  const pesos: Record<Classe, number> = { ...perfilDoPais(m.pais).economia.classes };
  if (m.regiao === 'Nordeste' || m.regiao === 'Norte') { pesos.vulneravel += 10; pesos.media -= 4; pesos.alta -= 3; }
  if (m.perfil === 'metropole') { pesos.alta += 3; pesos.media += 3; }
  if (m.perfil === 'pequena') { pesos.alta -= 4; pesos.vulneravel += 6; }
  return r.weighted(CLASSES, c => Math.max(0.5, pesos[c]))!;
}

function sortearArranjo(r: Rng, classe: Classe): Origem['arranjo'] {
  const juntos = { vulneravel: 0.44, trabalhadora: 0.58, media_baixa: 0.66, media: 0.74, alta: 0.82 }[classe];
  const x = r.next();
  if (x < juntos) return 'pais_juntos';
  if (x < juntos + (1 - juntos) * 0.78) return 'mae_solo';
  if (x < juntos + (1 - juntos) * 0.88) return 'pai_solo';
  return 'avos';
}

function idadeMaterna(r: Rng, classe: Classe): number {
  const media = { vulneravel: 22, trabalhadora: 25, media_baixa: 27, media: 30, alta: 32 }[classe];
  return Math.max(16, Math.min(43, Math.round(media + r.normal() * 4.5)));
}

function empregarPai(v: Vida, r: Rng, p: Pessoa, classe: Classe, municipioId: string, podeSerDoLar: boolean): void {
  if (podeSerDoLar && r.chance(classe === 'alta' ? 0.08 : 0.16)) {
    p.ocupacao = flex(p.genero, 'do lar', 'do lar');
    p.renda = 0;
    return;
  }
  // Mistura um pouco com a classe vizinha: família não é carimbo.
  const idx = CLASSES.indexOf(classe);
  const vizinha = CLASSES[Math.max(0, Math.min(4, idx + (r.chance(0.25) ? (r.chance(0.5) ? -1 : 1) : 0)))];
  const idadeP = Math.floor((v.t - p.tNasc) / 12);
  const possiveis = ocupacoesDaClasse(vizinha, paisDaCidade(municipioId)).map(ocupacao).filter(x => x.idadeMin <= idadeP);
  if (possiveis.length === 0) {
    p.ocupacao = 'estudante';
    p.renda = 0;
    return;
  }
  const oc = r.pick(possiveis);
  const bruto = salarioLocal(oc, municipioId, 0.85 + r.next() * 0.3);
  p.ocupacao = p.genero === 'feminino' ? oc.nome[1] : oc.nome[0];
  p.ocupacaoId = oc.id;
  p.renda = liquido(bruto, oc.contrato, paisDaCidade(municipioId));
}

/** O plano de saúde da casa ao nascer: depende do sistema do país (onde o público atende todos, quase ninguém paga; onde a saúde é de seguro, quase todos têm um). */
function planoAoNascer(sistema: 'universal' | 'misto' | 'seguro', classe: Classe): boolean {
  if (sistema === 'universal') return classe === 'alta';
  if (sistema === 'seguro') return classe !== 'vulneravel';
  return classe === 'media' || classe === 'alta';
}

function avoVivo(r: Rng, idadeAvo: number): boolean {
  const p = idadeAvo < 60 ? 0.95 : idadeAvo < 70 ? 0.85 : idadeAvo < 80 ? 0.6 : idadeAvo < 90 ? 0.3 : 0.05;
  return r.chance(p);
}

export function criarVida(o: OpcoesCriacao): Vida {
  const r = criarRng(o.semente);
  const ano = o.ano ?? 2026;
  const t = tDe(ano, r.int(0, 11));
  const classe = o.classe ?? sortearClasse(r, o.municipioId);
  const arranjo = sortearArranjo(r, classe);
  const podeGestar = o.genero === 'feminino' ? true : o.genero === 'masculino' ? false : !!o.podeGestar;

  const id = `vida-${o.semente.toString(36)}`;
  const paisNatal = municipio(o.municipioId).pais;
  const perfil = perfilDoPais(paisNatal);
  // Predisposições: da semente, sem gastar o gerador (a vida criada é a mesma de antes, com elas guardadas).
  const pred = derivarPredisposicoes(id);
  const v: Vida = {
    versao: 20,
    id,
    rng: 0,
    seq: 0,
    t,
    eu: {
      nome: o.nome.trim(),
      sobrenome: o.sobrenome.trim(),
      genero: o.genero,
      tNasc: t,
      municipioNatal: o.municipioId,
      // Nasce da terra e dos pais, que são daqui (a família de origem é do lugar onde a vida começa).
      nacionalidades: nacionalidadesAoNascer(paisNatal, [paisNatal]),
      visual: o.visual ?? visualAleatorio(r, o.genero),
      tratamento: o.genero === 'nao_binario' ? o.tratamento ?? 'nao_binario' : undefined
    },
    corpo: {
      saude: Math.round(88 + r.normal() * 5 - (classe === 'vulneravel' ? 4 : 0)),
      forma: Math.round(50 + pred.fisica * 6),
      aparencia: Math.round(55 + r.normal() * 12),
      aparenciaBase: 0,
      condicoes: [],
      habitos: { fuma: false, bebe: 'nao', sedentario: false },
      podeGestar
    },
    mente: {
      felicidade: 75,
      estresse: 8,
      // A facilidade de aprender nasce perto da predisposição cognitiva (e o resto é acaso).
      cognicao: Math.max(15, Math.min(95, Math.round(55 + pred.cognitiva * 10 + r.normal() * 9))),
      abalos: [],
      historico: []
    },
    predisposicoes: pred,
    personalidade: {
      tracos: { empatia: 0, generosidade: 0, disciplina: 0, impulsividade: 0, coragem: 0, sociabilidade: 0, independencia: 0, familia: 0 },
      evidencias: []
    },
    pessoas: {},
    vinculos: {},
    origem: { classe, arranjo, reserva: reservaInicial(id, classe), bairro: bairroDeOrigem(id, classe, o.municipioId) },
    moradia: {
      tipo: 'pais',
      municipioId: o.municipioId,
      aluguel: 0,
      padrao: { vulneravel: 1, trabalhadora: 2, media_baixa: 3, media: 3, alta: 5 }[classe] + (classe === 'media' && r.chance(0.4) ? 1 : 0),
      tInicio: t
    },
    educacao: { escolaridade: 'nenhuma', evadiu: false, concluidos: [], enem: [], postura: 'normal', cursinho: false },
    trabalho: { historico: [], experiencia: {}, candidaturas: [], contribuicao: 0, licencas: [], horasExtras: false },
    financas: {
      conta: 0, investimentos: [], dividas: [], bens: [],
      estilo: 'modesto', planoDeSaude: planoAoNascer(perfil.saude.sistema, classe), negativado: false, razao: [], historico: []
    },
    // A economia tem semente própria, derivada — criar a vida não consome o gerador dela.
    economia: economiaInicial(((o.semente ^ 0x6a09e667) >>> 0) % 2 ** 30 + 1, t),
    processos: [],
    rotinas: [],
    fatos: {},
    biografia: [],
    momento: null,
    ocorrencias: [],
    anoAtual: { acoes: [] },
    luto: [],
    caminhos: caminhosVazios()
  };
  v.eu.visual = o.visual ?? v.eu.visual;
  v.corpo.aparenciaBase = v.corpo.aparencia;

  const cidade = o.municipioId;
  const sob = v.eu.sobrenome;

  // -------------------------------------------------------------- Pais
  const idadeMae = idadeMaterna(r, classe);
  const idadePai = Math.max(17, idadeMae + r.int(-2, 8));
  // REWORK 4: a família da primeira geração — o pai pela tradição do sobrenome escolhido (ou pelo lugar), a mãe quase
  // sempre de origem próxima, às vezes de outra. Depois disso, os PAIS são a fonte de quem nasce (`identidade`).
  const fam = familiaInicial(id, paisNatal, sob);
  const mae = criarPessoa(v, r, { genero: 'feminino', idade: idadeMae, municipioId: cidade, sobrenome: r.chance(0.5) ? sob : undefined, familia: fam.mae });
  const temPai = arranjo !== 'mae_solo' || r.chance(0.7);
  const pai = temPai ? criarPessoa(v, r, { genero: 'masculino', idade: idadePai, municipioId: cidade, sobrenome: sob, familia: fam.pai }) : undefined;
  const ancFilhos = misturar(mae.ancestralidade, pai?.ancestralidade ?? fam.pai.ancestralidade)!;
  v.eu.ancestralidade = ancFilhos;
  v.eu.tradicao = (pai ?? mae).tradicao ?? mae.tradicao;

  // Traços herdados: o bebê puxa os pais em tudo o que é genético (o penteado escolhido pelo jogador fica).
  if (!o.visual || o.herdarCores) {
    const herd = visualHerdado(r, o.genero, mae.visual, pai?.visual, ancFilhos);
    const { pele, corCabelo, olhos, textura, olhosForma, nariz, boca, rosto, sobrancelha } = herd;
    v.eu.visual = { ...v.eu.visual, pele, corCabelo, olhos, textura, olhosForma, nariz, boca, rosto, sobrancelha, ...(o.visual ? {} : { cabelo: herd.cabelo }) };
  }

  const comMae = arranjo === 'pais_juntos' || arranjo === 'mae_solo';
  const comPai = arranjo === 'pais_juntos' || arranjo === 'pai_solo';
  empregarPai(v, r, mae, classe, cidade, arranjo === 'pais_juntos');
  if (pai) empregarPai(v, r, pai, classe, cidade, false);
  if (pai && arranjo === 'pais_juntos') { mae.parceiroId = pai.id; pai.parceiroId = mae.id; }
  const [grandeCentro, outraCapital] = grandesCentros(paisNatal);
  if (pai && arranjo === 'mae_solo' && r.chance(0.3)) pai.municipioId = r.chance(0.5) ? cidade : grandeCentro;

  vincular(v, mae, { parentesco: 'mae', origem: 'familia', proximidade: comMae ? 90 : 45, convivio: comMae ? ['casa'] : [] });
  if (pai) vincular(v, pai, { parentesco: 'pai', origem: 'familia', proximidade: comPai ? 85 : 25, convivio: comPai ? ['casa'] : [] });

  // -------------------------------------------------------------- Avós
  const avosCriados: Pessoa[] = [];
  const avosDe: Record<string, Pessoa[]> = {};
  const ladoMae = mae.sobrenome;
  for (const [genero, base, sobrenome] of [
    ['feminino', idadeMae, ladoMae], ['masculino', idadeMae, ladoMae],
    ['feminino', idadePai, sob], ['masculino', idadePai, sob]
  ] as [Genero, number, string][]) {
    if (!pai && sobrenome === sob && base === idadePai) continue;
    const idadeAvo = base + r.int(20, 32);
    if (!avoVivo(r, idadeAvo)) continue;
    // Os avós: gente de quem o pai ou a mãe herdou (a ancestralidade se divide entre os dois; o rosto lembra o do filho).
    const filhoDoLado = sobrenome === ladoMae && base === idadeMae ? mae : pai!;
    const [ancA, ancB] = ancestralidadesDosPais(rngDe(id, 'avos', filhoDoLado.id), ancestralidadeDe(filhoDoLado));
    const avo = criarPessoa(v, r, { genero, idade: idadeAvo, municipioId: r.chance(0.7) ? cidade : v.moradia.municipioId, sobrenome, familia: { ancestralidade: genero === 'feminino' ? ancA : ancB, tradicao: filhoDoLado.tradicao } });
    avo.visual = visualDeQuemGerou(rngDe(avo.id, 'avo'), genero, avo.ancestralidade!, filhoDoLado.visual!);
    (avosDe[filhoDoLado.id] ??= []).push(avo);
    if (idadeAvo >= 62) {
      avo.ocupacao = flex(genero, 'aposentado', 'aposentada');
      avo.renda = rendaNoPais(paisNatal, 1800);
    } else {
      empregarPai(v, r, avo, classe, avo.municipioId, true);
    }
    avosCriados.push(avo);
    const criadoPorAvos = arranjo === 'avos' && genero === 'feminino' && sobrenome === ladoMae;
    vincular(v, avo, { parentesco: 'avo', origem: 'familia', proximidade: criadoPorAvos ? 92 : r.int(45, 75), convivio: criadoPorAvos ? ['casa'] : [] });
  }
  if (arranjo === 'avos' && !avosCriados.some(a => v.vinculos[a.id].convivio.includes('casa'))) {
    const avo = criarPessoa(v, r, { genero: 'feminino', idade: idadeMae + r.int(20, 28), municipioId: cidade, sobrenome: ladoMae });
    avo.ocupacao = 'aposentada';
    avo.renda = rendaNoPais(paisNatal, 1800);
    vincular(v, avo, { parentesco: 'avo', origem: 'familia', proximidade: 92, convivio: ['casa'] });
    avosCriados.push(avo);
  }
  // Avós que criam o neto: a mãe mora em outro lugar.
  if (arranjo === 'avos') v.vinculos[mae.id].convivio = [];

  // ----------------------------------------------------------- Irmãos
  const maxIrmaos = { vulneravel: 3, trabalhadora: 2, media_baixa: 2, media: 1, alta: 1 }[classe];
  const nIrmaos = Math.min(maxIrmaos, Math.max(0, Math.round(r.next() * (maxIrmaos + 0.6) - 0.3)), Math.max(0, Math.floor((idadeMae - 17) / 2)));
  const irmaosCriados: Pessoa[] = [];
  for (let i = 0; i < nIrmaos; i++) {
    const idadeIrmao = r.int(1, Math.max(1, Math.min(14, idadeMae - 17)));
    const g: Genero = r.chance(0.5) ? 'masculino' : 'feminino';
    const irmao = criarPessoa(v, r, { genero: g, idade: idadeIrmao, municipioId: cidade, sobrenome: sob, visual: visualHerdado(r, g, mae.visual, pai?.visual, ancFilhos), familia: { ancestralidade: ancFilhos, tradicao: v.eu.tradicao } });
    irmao.ocupacao = idadeIrmao >= 4 ? 'estudante' : undefined;
    irmaosCriados.push(irmao);
    vincular(v, irmao, { parentesco: 'irmao', origem: 'familia', proximidade: r.int(60, 80), convivio: ['casa'] });
  }

  // ------------------------------------------------------ Tios e primos
  const nTios = r.int(1, classe === 'vulneravel' || classe === 'trabalhadora' ? 3 : 2);
  for (let i = 0; i < nTios; i++) {
    const lado = r.chance(0.5) ? mae : pai ?? mae;
    const g: Genero = r.chance(0.5) ? 'masculino' : 'feminino';
    const tio = criarPessoa(v, r, { genero: g, idade: Math.max(18, (lado === mae ? idadeMae : idadePai) + r.int(-8, 8)), municipioId: r.chance(0.65) ? cidade : r.pick([grandeCentro, outraCapital, cidade]), sobrenome: lado.sobrenome, familia: { ancestralidade: ancestralidadeDe(lado), tradicao: lado.tradicao } });
    // O tio é irmão do pai ou da mãe: filho dos mesmos avós (quando eles existem no jogo), parecido sem ser igual.
    { const avs = avosDe[lado.id] ?? []; const ra = rngDe(tio.id, 'tio'); tio.visual = avs.length ? visualDosPais(ra, g, ancestralidadeDe(lado), avs[0].visual, avs[1]?.visual ?? lado.visual) : visualDosPais(ra, g, ancestralidadeDe(lado), lado.visual, visualDeQuemGerou(ra, g, ancestralidadeDe(lado), lado.visual!)); }
    empregarPai(v, r, tio, classe, tio.municipioId, false);
    vincular(v, tio, { parentesco: 'tio', origem: 'familia', proximidade: r.int(30, 60) });
    if (r.chance(0.6)) {
      const nPrimos = r.int(1, 2);
      for (let k = 0; k < nPrimos; k++) {
        const gp: Genero = r.chance(0.5) ? 'masculino' : 'feminino';
        const primo = criarPessoa(v, r, { genero: gp, idade: Math.max(0, r.int(-3, 7)), municipioId: tio.municipioId, sobrenome: tio.sobrenome, familia: { ancestralidade: ancestralidadeDe(tio), tradicao: tio.tradicao } });
        // O primo: filho do tio e de alguém de fora da família (de origem do lugar).
        { const rp = rngDe(primo.id, 'primo'); const ancConj = perfilInicial(rp, paisNatal).mix; const conj = visualDaAncestralidade(rp, g === 'masculino' ? 'feminino' : 'masculino', ancConj); primo.ancestralidade = misturar(ancestralidadeDe(tio), ancConj); primo.visual = visualDosPais(rp, gp, primo.ancestralidade!, tio.visual, conj); }
        vincular(v, primo, { parentesco: 'primo', origem: 'familia', proximidade: r.int(25, 50) });
      }
    }
  }

  // --------------------------------------------------------------- Pet
  const chancePet = { vulneravel: 0.3, trabalhadora: 0.38, media_baixa: 0.42, media: 0.45, alta: 0.4 }[classe];
  if (arranjo !== 'avos' && r.chance(chancePet)) {
    const especie = r.chance(0.72) ? 'cachorro' : 'gato';
    const pet = criarPessoa(v, r, { especie, idade: r.int(1, 6), municipioId: cidade, nome: r.pick(especie === 'cachorro' ? NOMES_PET_CACHORRO : NOMES_PET_GATO), sobrenome: '' });
    const rp = criarRng((o.semente ^ 0x5bd1e995) >>> 0);
    pet.nome = nomeDePet(rp, especie, pet.genero, paisDaCidade(cidade));
    const porte = especie === 'gato' ? 'pequeno' : rp.pick(['pequeno', 'medio', 'grande'] as const);
    pet.pet = { porte, origem: 'familia', tChegada: t - (Math.floor((t - pet.tNasc) / 12) * 12), tutor: 'familia', jeito: especie === 'gato' ? 'dono da casa' : 'fiel, late para o carteiro', vidaMax: especie === 'gato' ? rp.int(13, 18) : porte === 'pequeno' ? rp.int(13, 16) : porte === 'medio' ? rp.int(11, 14) : rp.int(9, 12) };
    vincular(v, pet, { parentesco: 'pet', origem: 'familia', proximidade: 60, convivio: ['casa'] });
  }

  // O nascimento é o primeiro marco da história com os pais.
  for (const g of [mae, pai]) if (g) v.vinculos[g.id].historia.push({ t: v.t, texto: `Você nasceu, em ${MESES[mesDe(v.t)]} de ${anoDe(v.t)}.`, tipo: 'inicio', peso: 3 });

  // -------------------------------------------------------- Nascimento
  escreverNascimento(v, r, { mae, pai, arranjo, irmaos: irmaosCriados, avos: avosCriados, classe });

  v.rng = r.estado();
  return v;
}

function escreverNascimento(
  v: Vida,
  r: Rng,
  c: { mae: Pessoa; pai?: Pessoa; arranjo: Origem['arranjo']; irmaos: Pessoa[]; avos: Pessoa[]; classe: Classe }
): void {
  const g = v.eu.tratamento ?? v.eu.genero;
  const mes = MESES[mesDe(v.t)];
  const nascido = flex(g, 'Nasceu', 'Nasceu');
  const lugar = nomeLugar(v.eu.municipioNatal);
  const oc = (p: Pessoa) => (p.ocupacao ? `, ${p.ocupacao}` : '');
  let pais: string;
  if (c.arranjo === 'pais_juntos' && c.pai) {
    pais = `${flex(g, 'filho', 'filha', 'filhe')} de ${c.mae.nome}${oc(c.mae)}, e ${c.pai.nome}${oc(c.pai)}`;
  } else if (c.arranjo === 'mae_solo') {
    pais = `${flex(g, 'filho', 'filha', 'filhe')} de ${c.mae.nome}${oc(c.mae)}, que ${c.pai ? `criou ${flex(g, 'o bebê', 'a bebê', 'o bebê')} sem ${c.pai.nome} por perto` : 'assumiu tudo sozinha'}`;
  } else if (c.arranjo === 'pai_solo' && c.pai) {
    pais = `${flex(g, 'filho', 'filha', 'filhe')} de ${c.pai.nome}${oc(c.pai)}, que ficou com a criação quando ${c.mae.nome} foi embora`;
  } else {
    const avo = c.avos.find(a => v.vinculos[a.id]?.convivio.includes('casa'));
    pais = `${flex(g, 'filho', 'filha', 'filhe')} de ${c.mae.nome}, e desde cedo aos cuidados da avó ${avo?.nome ?? ''}`.trim();
  }

  escrever(v, {
    texto: `${nascido} em ${mes} de ${anoDe(v.t)}, em ${lugar}, ${pais}.`,
    relevancia: 'marco',
    tema: 'nascimento',
    tom: 'bom',
    pessoas: [c.mae.id, ...(c.pai ? [c.pai.id] : [])]
  });

  const detalhes: string[] = [];
  if (c.irmaos.length === 1) {
    const i = c.irmaos[0];
    detalhes.push(`${flex(i.genero, 'O irmão', 'A irmã')} ${i.nome}, de ${Math.floor((v.t - i.tNasc) / 12)} anos, ganhou companhia`);
  } else if (c.irmaos.length > 1) {
    detalhes.push(`A casa já tinha ${listaNatural(c.irmaos.map(i => i.nome))}`);
  }
  const avosVivos = c.avos.length;
  if (avosVivos > 0 && c.arranjo !== 'avos') {
    if (avosVivos === 1) {
      const a = c.avos[0];
      detalhes.push(`${artigo(a.genero).toUpperCase()} ${flex(a.genero, 'avô', 'avó')} ${a.nome} foi ${flex(a.genero, 'o primeiro', 'a primeira')} a chegar no hospital`);
    } else {
      detalhes.push(`Os avós fizeram fila para conhecer ${flex(g, 'o neto', 'a neta', 'e nete')}`);
    }
  }
  const casa = {
    vulneravel: 'A casa era pequena e o dinheiro, contado',
    trabalhadora: 'Em casa, o dinheiro dava para o mês, sem sobra',
    media_baixa: 'A família vivia com o básico garantido e pouca folga',
    media: 'A família tinha uma vida confortável',
    alta: 'A família tinha dinheiro de sobra'
  }[c.classe];
  detalhes.push(casa);
  if (detalhes.length > 0) {
    escrever(v, { texto: detalhes.join('. ') + '.', relevancia: 'biografia', tema: 'familia', pessoas: [...c.irmaos.map(i => i.id)] });
  }
  void r;
}
