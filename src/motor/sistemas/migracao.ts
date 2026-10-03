/**
 * MIGRAÇÃO INTERNACIONAL — mudar de PAÍS (mudar de cidade dentro do país é
 * outra coisa: `processos.mudarAgora`).
 *
 *   intenção → destino → a porta (por onde se entra) → custos → decisão
 *   → mudança → consequências (dinheiro em outra moeda, trabalho, estudo,
 *   casa, quem vai junto, quem fica, a língua, a adaptação, a biografia)
 *
 * A PORTA: o VIDA não é uma planilha de vistos. Há poucas portas, cada uma
 * com o seu porquê, e uma pessoa sem nenhuma não se teleporta:
 *   - cidadania: é do país (nasceu lá, naturalizou-se, herdou dos pais);
 *   - livre: os dois países são de um mesmo bloco de livre residência
 *     (MERCOSUL, União Europeia, CPLP, ...);
 *   - família: a parceria (ou um pai, um filho adulto) é de lá;
 *   - trabalho: uma transferência ou uma vaga — pede um ofício que se leve
 *     (não o cargo público, a farda ou o mandato) e, onde a porta é
 *     seletiva ou restrita, formação e estrada;
 *   - estudo: o ensino médio completo e dinheiro para se manter um ano;
 *   - residência: quem vive do que tem (aposentadoria, patrimônio).
 * O que a porta exige e quanto custa sai de `avaliarMigracao` — a MESMA conta
 * que a tela mostra e que a ação executa.
 *
 * O DINHEIRO atravessa pelo câmbio de mercado (`mundo/moeda`): o valor de
 * mercado se conserva (menos o custo da remessa), e o poder de compra muda —
 * as economias de Belo Horizonte encolhem em Zurique e crescem em Lisboa?
 * Não: em Lisboa os preços são mais altos que os do Brasil — encolhem menos.
 * Os veículos não atravessam (são vendidos); a casa própria fica (dá para
 * vender ou alugar de longe); os bichos vão junto, com papelada.
 */

import { coisasNaMudancaDePais } from './coisas';
import { coisa } from '../dados/coisas';
import type { Rng } from '../rng';
import type { Migracao, MotivoMigracao, Veiculo, Vida } from '../tipos';
import { escrever, idade, marcarFato, moraCom, vinculosVivos } from '../nucleo';
import { cidadesDoPais, economiaLocal, municipio, paisDaCidade, existeMunicipio, type Municipio } from '../dados/lugares';
import { blocosDoPais, circulaLivre, linguasDaPessoa, nacionalidadesDaPessoa, nacionalidadesDaVida, paisDaVida, paisNatal } from '../mundo/vida';
import { converterEntrePaises } from '../mundo/moeda';
import { aoPais, noPais, paisDoCatalogo, paraPais, paisesVivenciaveis, perfilDoPais, temPerfil, nomeDoPais, doPais } from '../mundo/registro';
import { rendaRelativa } from '../mundo/economia';
import { anosParaNaturalizar, regraDeCidadania } from '../mundo/cidadania';
import { bloqueio, type Veredito } from '../plausibilidade';
import { mudarAgora, registrarMigrador } from './processos';
import { valorDeVenda } from './veiculos';
import { extratoAberto, lancar } from './extrato';
import { temEscolaridade, trocarDeSistemaEscolar } from './escola';
import { ocupacao } from '../dados/ocupacoes';
import { marcar } from './marcas';
import { dinheiro as moeda } from '../texto';
import { abalar } from './abalo';
import { patrimonio } from './dinheiro';
import { clamp, criarRng } from '../rng';

export type ViaMigratoria = Migracao['via'];

export const ROTULO_MOTIVO: Record<MotivoMigracao, string> = {
  trabalho: 'para trabalhar', estudo: 'para estudar', familia: 'para ficar perto da família', relacionamento: 'para viver junto de quem ama',
  esporte: 'para jogar', oportunidade: 'atrás de uma oportunidade', pessoal: 'por decisão própria', retorno: 'de volta'
};

export interface AvaliacaoDeMigracao {
  pais: string;
  /** Por onde a porta abre (ausente: não abre). */
  via?: ViaMigratoria;
  veredito: Veredito;
  /** Custo total, na unidade do motor, no país de saída: passagens de quem vai, documentos, instalação, bichos. */
  custo: number;
  /** As partes do custo, em palavras. */
  partes: string[];
  /** O que muda na vida, em palavras (para a tela confirmar antes). */
  consequencias: string[];
  /** O dinheiro de hoje, lá (o mesmo valor de mercado em poder de compra de lá), por unidade daqui. */
  fatorCambio: number;
}

/** Quem mora na casa e vai junto (parceria, filhos que moram junto). */
const vaoJunto = (v: Vida) => moraCom(v).filter(p => {
  const vin = Object.values(v.vinculos).find(x => x.pessoaId === p.id);
  return vin && (vin.romance || vin.parentesco === 'filho' || vin.parentesco === 'enteado');
});

/** A distância em passagem (unidade do motor, por pessoa, ida). */
function passagem(de: string, para: string): number {
  const a = paisDoCatalogo(de), b = paisDoCatalogo(para);
  return a.sub === b.sub ? 1400 : a.regiao === b.regiao ? 2600 : 6200;
}

/** Por onde a pessoa entra num país (a mais simples primeiro). */
/** `destino` é o PAÍS. */
function porta(v: Vida, destino: string, motivo: MotivoMigracao): { via?: ViaMigratoria; motivo?: string } {
  const nac = nacionalidadesDaVida(v);
  if (nac.includes(destino)) return { via: 'cidadania' };
  if (circulaLivre(nac, destino)) return { via: 'livre' };
  const familiaLa = vinculosVivos(v).some(({ p, vin }) => (vin.romance && ['morando_junto', 'casamento'].includes(vin.romance.estagio)) || ((vin.parentesco === 'filho' || vin.parentesco === 'mae' || vin.parentesco === 'pai') && idadeDe(v, p.tNasc) >= 18)
    ? nacionalidadesDaPessoa(p).includes(destino) || (existeMunicipio(p.municipioId) && paisDaCidade(p.municipioId) === destino && vin.romance !== undefined)
    : false);
  if (familiaLa) return { via: 'familia' };
  const abertura = perfilDoPais(destino).migracao.abertura;
  if (motivo === 'estudo') {
    if (!temEscolaridade(v, 'medio')) return { motivo: 'Estudar fora pede o ensino médio completo.' };
    const custoAno = 12 * custoDeVidaMensal(destino);
    if (patrimonio(v) < custoAno) return { motivo: `O visto de estudante pede provar que dá para se manter um ano: cerca de ${moeda(custoAno)}.` };
    return { via: 'estudo' };
  }
  // O atleta e o técnico com contrato assinado lá fora: o clube patrocina o visto (é o caminho do esporte no mundo todo).
  if (motivo === 'esporte' && v.trabalho.atual && (v.caminhos.esporte?.fase === 'profissional' || v.caminhos.tecnico)) return { via: 'trabalho' };
  if (motivo === 'trabalho' || motivo === 'oportunidade' || motivo === 'esporte') {
    const e = v.trabalho.atual;
    const oc = e ? ocupacao(e.ocupacaoId) : undefined;
    if (!e || !oc) return { motivo: 'Sem um trabalho e um ofício para levar, ninguém de lá patrocina a vinda.' };
    if (['servidor', 'militar', 'eletivo'].includes(e.contrato) || oc.concurso) return { motivo: 'Um cargo público não se leva para outro país.' };
    const superior = temEscolaridade(v, 'superior');
    const anos = Math.floor((v.trabalho.experiencia[oc.trilha] ?? 0) / 12);
    if (abertura === 'restrita' && !(superior && anos >= 3)) return { motivo: `${capital(oPaisCurto(destino))} só abre a porta do trabalho para quem tem formação superior e alguns anos de estrada.` };
    if (abertura === 'seletiva' && !(superior || anos >= 5 || oc.nivel >= 3)) return { motivo: `${capital(oPaisCurto(destino))} pede formação ou experiência sólida para o visto de trabalho.` };
    return { via: 'trabalho' };
  }
  if (v.trabalho.aposentadoria || patrimonio(v) >= 60 * custoDeVidaMensal(destino)) return { via: 'residencia' };
  return { motivo: 'Sem um motivo que abra a porta — trabalho, estudo, família ou meios para viver de renda —, não há como morar lá legalmente.' };
}

const idadeDe = (v: Vida, tNasc: number) => Math.floor((v.t - tNasc) / 12);
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const oPaisCurto = (p: string) => { const c = paisDoCatalogo(p); return c.artigo ? `${c.artigo} ${c.nome}` : c.nome; };

/** O custo de viver um mês sozinho numa cidade grande do país (aluguel de referência e o resto), na unidade do motor DE LÁ. */
export function custoDeVidaMensal(pais: string): number {
  const cid = cidadesDoPais(pais).find(m => m.perfil === 'metropole') ?? cidadesDoPais(pais)[0];
  if (!cid) return 4000;
  const e = economiaLocal(cid.id);
  return Math.round(e.aluguel * 0.8 + 2200 * e.custo);
}

/** A avaliação inteira de uma mudança de país: porta, custo, consequências. */
export function avaliarMigracao(v: Vida, destinoId: string, motivo: MotivoMigracao): AvaliacaoDeMigracao {
  const aqui = paisDaVida(v);
  const pais = paisDaCidade(destinoId);
  const base: AvaliacaoDeMigracao = { pais, veredito: { grau: 'permitido' }, custo: 0, partes: [], consequencias: [], fatorCambio: converterEntrePaises(1, aqui, pais) };
  const i = idade(v);
  if (pais === aqui) return { ...base, veredito: bloqueio('incompativel', 'É o mesmo país: isso é uma mudança de cidade.') };
  if (!temPerfil(pais)) return { ...base, veredito: bloqueio('impossivel', 'Este país ainda não pode ser vivido no jogo.') };
  if (i < 18) return { ...base, veredito: bloqueio('ilegal', 'Menor de idade não muda de país sozinho.') };
  if (v.trabalho.atual?.contrato === 'eletivo') return { ...base, veredito: bloqueio('incompativel', 'No meio de um mandato, não.') };
  if (v.justica?.prisao || v.justica?.alternativa || v.justica?.processo) return { ...base, veredito: bloqueio('ilegal', 'Com processo ou pena em curso, a Justiça não deixa sair do país.') };
  const p = porta(v, pais, motivo);
  const junto = vaoJunto(v);
  const pets = vinculosVivos(v).filter(x => x.p.especie && x.p.pet?.tutor === 'eu' && x.vin.convivio.includes('casa'));
  const pessoas = 1 + junto.length;
  const aluguel = economiaLocal(destinoId).aluguel;
  // O custo em unidades do motor DAQUI: o de lá convertido de volta pelo câmbio.
  const deLa = (x: number) => converterEntrePaises(x, pais, aqui);
  const partes: [string, number][] = [
    [`passagens (${pessoas === 1 ? 'só você' : `${pessoas} pessoas`})`, passagem(aqui, pais) * pessoas],
    ['os primeiros meses de aluguel e a caução', deLa(aluguel * 3)],
    ...(p.via && p.via !== 'cidadania' && p.via !== 'livre' ? [['documentos, traduções e taxas do visto', 2200 + 600 * (pessoas - 1)] as [string, number]] : p.via === 'livre' ? [['documentos da residência', 600] as [string, number]] : []),
    ...(pets.length ? [[`${pets.length === 1 ? 'o bicho' : 'os bichos'}: vacinas, laudos e o transporte`, 2800 * pets.length] as [string, number]] : [])
  ];
  const custo = Math.round(partes.reduce((s, [, x]) => s + x, 0) / 10) * 10;
  const consequencias = consequenciasDe(v, destinoId, p.via, motivo);
  const veredito: Veredito = !p.via ? bloqueio('requisito', p.motivo ?? 'A porta não abre.') : { grau: 'permitido' };
  return { ...base, via: p.via, veredito, custo, partes: partes.map(([t, x]) => `${t}: ${moeda(x)}`), consequencias };
}

function consequenciasDe(v: Vida, destinoId: string, via: ViaMigratoria | undefined, motivo: MotivoMigracao): string[] {
  const aqui = paisDaVida(v);
  const pais = paisDaCidade(destinoId);
  const out: string[] = [];
  const k = converterEntrePaises(1, aqui, pais);
  out.push(k < 0.97 ? `O dinheiro encolhe: lá a vida é mais cara — o que você tem vale, em poder de compra, uns ${Math.round(k * 100)}% do que vale aqui.`
    : k > 1.03 ? `O dinheiro rende mais: lá a vida é mais barata — o que você tem compra uns ${Math.round(k * 100)}% do que compra aqui.`
      : 'O dinheiro vale mais ou menos o mesmo lá.');
  const rel = rendaRelativa(pais) / rendaRelativa(aqui);
  out.push(rel > 1.25 ? 'Os salários de lá são, em poder de compra, bem maiores que os daqui.' : rel < 0.8 ? 'Os salários de lá são, em poder de compra, menores que os daqui.' : 'Os salários de lá, em poder de compra, se parecem com os daqui.');
  const e = v.trabalho.atual;
  if (e && via === 'trabalho' && motivo !== 'estudo') out.push('O emprego atual acaba; lá, um contrato no mesmo ofício já espera você.');
  else if (e && !['autonomo', 'informal'].includes(e.contrato)) out.push('O emprego atual acaba na mudança.');
  if (v.financas.bens.some(b => b.tipo === 'veiculo')) out.push('Os veículos não atravessam: são vendidos antes da viagem.');
  if ((v.financas.coisas ?? []).some(t => coisa(t.coisaId)?.daCasa)) out.push('Os móveis e os eletrodomésticos ficam (vendidos usados); o celular, o notebook e o instrumento vão na mala.');
  if (v.moradia.tipo === 'propria') out.push('A casa própria fica: dá para vender ou alugar de longe.');
  if (v.educacao.matricula && v.educacao.matricula.modalidade === 'presencial') out.push('O curso presencial fica trancado.');
  const linguas = linguasDaPessoa(v);
  const lingua = perfilDoPais(pais).idiomas[0];
  if (!linguas.includes(lingua)) out.push(`Lá se fala ${lingua}: os primeiros anos pesam no trabalho e na cabeça até a língua chegar.`);
  const junto = vaoJunto(v);
  if (junto.length) out.push(`Vão junto: ${junto.map(p => p.nome).join(', ')}.`);
  const ficam = vinculosVivos(v).filter(({ p, vin }) => !p.especie && (vin.parentesco === 'mae' || vin.parentesco === 'pai' || vin.parentesco === 'irmao') && p.municipioId !== destinoId).map(x => x.p.nome);
  if (ficam.length) out.push(`Ficam do lado de cá: ${ficam.slice(0, 4).join(', ')}${ficam.length > 4 ? ' e outros' : ''}.`);
  if (via !== 'cidadania') out.push(`A nacionalidade não muda: você ${nacionalidadesDaVida(v).length > 1 ? 'continua com as que tem' : `continua ${gentilicoDa(v)}`}. ${notaNaturalizacao(v, pais)}`);
  return out;
}

function gentilicoDa(v: Vida): string {
  const n = nacionalidadesDaVida(v)[0];
  return temPerfil(n) ? perfilDoPais(n).gentilico[v.eu.genero === 'feminino' ? 1 : 0] : `cidadã${v.eu.genero === 'feminino' ? '' : 'o'} ${doPais(n)}`;
}

function notaNaturalizacao(v: Vida, pais: string): string {
  const anos = anosParaNaturalizar(pais, nacionalidadesDaVida(v), blocosDoPais);
  if (anos === undefined) return `Naturalizar-se ${noPais(pais).replace(/^(no|na|nos|nas|em) /, '')}, na prática, não acontece.`;
  return `Depois de ${anos} ${anos === 1 ? 'ano' : 'anos'} morando lá, dá para pedir a nacionalidade${regraDeCidadania(pais).dupla ? '' : ' (abrindo mão da sua: o país não aceita duas)'}.`;
}

/**
 * Muda de país (a avaliação já disse que pode). Conserva o valor de mercado
 * do dinheiro (menos 1,5% de remessa), vende os veículos, leva a casa e os
 * bichos, encerra o que fica, escreve a história.
 */
export function migrar(v: Vida, r: Rng, destinoId: string, motivo: MotivoMigracao): void {
  const av = avaliarMigracao(v, destinoId, motivo);
  if (!av.via) return;
  const pais = av.pais;
  const origemId = v.moradia.municipioId;
  const f = v.financas;

  // 1. Os veículos não atravessam: vendidos pelo preço do dia (quitando o financiamento, se houver).
  for (const b of f.bens.filter(x => x.tipo === 'veiculo') as Veiculo[]) {
    const divida = f.dividas.find(d => d.bemId === b.id);
    const liquido = valorDeVenda(b) - (divida?.saldo ?? 0);
    f.conta += liquido;
    lancar(v, 'Veículos vendidos antes da mudança de país', 'escolha', liquido);
    f.bens = f.bens.filter(x => x.id !== b.id);
    f.dividas = f.dividas.filter(d => d.bemId !== b.id);
  }
  // 1b. O que é da casa (móveis, eletrodomésticos) fica: vendido pelo valor de usado. O resto vai na mala.
  coisasNaMudancaDePais(v);
  // 2. O custo da mudança, pago aqui.
  f.conta -= av.custo;
  lancar(v, `Mudança ${paraPais(pais)}: passagens, documentos e instalação`, 'escolha', -av.custo);

  // 3. O dinheiro atravessa. O período aberto do extrato passa a ser contado na moeda de lá (o mesmo valor de mercado),
  //    e a remessa cobra a sua parte — com linha.
  const k = av.fatorCambio;
  const antes = patrimonio(v);
  redenominar(v, k);
  const remessa = Math.round(Math.max(0, f.conta) * 0.015);
  f.conta -= remessa;
  lancar(v, 'Câmbio e remessa do dinheiro', 'despesa', -remessa);

  // 4. A casa, o trabalho, o curso, quem vai junto: a mudança de cidade de sempre — agora para outro país.
  // Quem vai junto leva a renda pelo mesmo câmbio (e recomeça lá: a parceria que trabalhava procura de novo).
  // A nacionalidade de quem vai junto fica gravada antes da mudança (ela não muda por morar lá).
  for (const p of vaoJunto(v)) { p.nacionalidades ??= nacionalidadesDaPessoa(p); p.renda = Math.round(p.renda * k); }
  const e = v.trabalho.atual;
  // O contrato de lá já assinado (o clube, o comando técnico) segue como está; o ofício levado vira um contrato do lado de lá.
  const levaOficio = av.via === 'trabalho' && motivo !== 'esporte' && e && e.municipioId !== destinoId ? e : undefined;
  const desde = v.fatos['chegou_pais'] ?? v.eu.tNasc;
  mudarAgora(v, destinoId, '', { internacional: true });
  // A escola (ou o supletivo) passa a ser a do país novo; a de antes vira histórico.
  trocarDeSistemaEscolar(v, paisDaCidade(origemId), pais, desde);
  if (levaOficio) {
    // A porta do trabalho é um contrato no mesmo ofício, do lado de lá (com o salário de lá).
    const oc = ocupacao(levaOficio.ocupacaoId);
    v.trabalho.atual = {
      ...levaOficio, empregador: `uma empresa em ${municipio(destinoId).nome}`, municipioId: destinoId, tInicio: v.t, tPosto: v.t,
      salario: Math.round(oc.salario * economiaLocal(destinoId).salario * (0.95 + r.next() * 0.15) / 10) * 10, via: 'transferência internacional', clima: undefined
    };
    v.trabalho.historico = v.trabalho.historico.filter(h => !(h.tFim === v.t && h.ocupacaoId === levaOficio.ocupacaoId));
    v.trabalho.desempregadoDesde = undefined;
  }

  // 5. O mundo da pessoa: a migração, a adaptação, a língua.
  const linguas = linguasDaPessoa(v);
  const fala = linguas.includes(perfilDoPais(pais).idiomas[0]);
  const ja = (v.mundo?.migracoes ?? []).some(m => paisDaCidade(m.para) === pais) || paisNatal(v) === pais;
  const reg: Migracao = { t: v.t, de: origemId, para: destinoId, motivo, via: av.via, cambio: { antes: Math.round(antes), depois: Math.round(patrimonio(v)) } };
  v.mundo = { migracoes: [...(v.mundo?.migracoes ?? []), reg], adaptacao: ja ? 70 : fala ? 45 : 15, idiomas: v.mundo?.idiomas ?? [], naturalizacao: undefined };
  v.fatos['chegou_pais'] = v.t;
  marcarFato(v, 'migrou');

  // 6. A história, em palavras de gente.
  escrever(v, { texto: textoDaMigracao(v, origemId, destinoId, motivo), relevancia: 'marco', tema: 'lugar', escolha: true });
  marcar(v, 'mudanca_cidade', `${paisNatal(v) === pais ? 'Voltou' : 'Mudou-se'} ${paraPais(pais)}, aos ${idade(v)}.`, 3);
  abalar(v, `a mudança ${paraPais(pais)}`, 0, fala ? 10 : 18);
}

/**
 * A FAMÍLIA SE MUDA DE PAÍS, e a criança (ou o adolescente) vai junto: não é
 * escolha dela (menor não migra sozinho), é a casa inteira que vai — o pai
 * ou a mãe com um trabalho do lado de lá. Quem mora na casa vai; o dinheiro
 * da criança atravessa pelo câmbio; a escola passa a ser a do país novo
 * (`trocarDeSistemaEscolar`), com o histórico guardado; a nacionalidade não
 * muda (a de quem vai fica gravada); a língua e a adaptação começam do zero.
 */
export function migrarComAFamilia(v: Vida, destinoId: string, quem?: string, opcoes: { escrever?: boolean } = {}): string | undefined {
  const aqui = paisDaVida(v);
  const pais = paisDaCidade(destinoId);
  if (pais === aqui || !temPerfil(pais)) return undefined;
  if (v.moradia.tipo !== 'pais' && v.moradia.tipo !== 'parente') return undefined;
  const origemId = v.moradia.municipioId;
  const desde = v.fatos['chegou_pais'] ?? v.eu.tNasc;
  const k = converterEntrePaises(1, aqui, pais);
  const antes = patrimonio(v);
  for (const p of moraCom(v)) { p.nacionalidades ??= nacionalidadesDaPessoa(p); p.renda = Math.round(p.renda * k); }
  redenominar(v, k);
  mudarAgora(v, destinoId, '', { internacional: true, comAFamilia: true });
  trocarDeSistemaEscolar(v, aqui, pais, desde);
  const fala = linguasDaPessoa(v).includes(perfilDoPais(pais).idiomas[0]);
  const ja = (v.mundo?.migracoes ?? []).some(m => paisDaCidade(m.para) === pais) || paisNatal(v) === pais;
  const reg: Migracao = { t: v.t, de: origemId, para: destinoId, motivo: 'familia', via: nacionalidadesDaVida(v).includes(pais) ? 'cidadania' : 'familia', cambio: { antes: Math.round(antes), depois: Math.round(patrimonio(v)) } };
  v.mundo = { migracoes: [...(v.mundo?.migracoes ?? []), reg], adaptacao: ja ? 70 : fala ? 50 : 20, idiomas: v.mundo?.idiomas ?? [], naturalizacao: undefined };
  v.fatos['chegou_pais'] = v.t;
  marcarFato(v, 'migrou');
  const cidade = municipio(destinoId).nome;
  const texto = `A família ${ja ? 'voltou' : 'se mudou'} para ${cidade}, ${noPais(pais)}${quem ? `: ${quem} foi trabalhar lá` : ''}. Você foi junto, com ${idade(v)} anos.`;
  if (opcoes.escrever !== false) escrever(v, { texto, relevancia: 'marco', tema: 'lugar' });
  marcar(v, 'mudanca_cidade', `${ja ? 'Voltou' : 'Mudou-se'} com a família ${paraPais(pais)}, aos ${idade(v)}.`, 3);
  abalar(v, `a mudança ${paraPais(pais)}`, 0, fala ? 10 : 16);
  return texto;
}

/**
 * Para onde uma família que mora aqui se mudaria por trabalho: um país vivível
 * cuja porta abre para os pais (livre circulação, ou um país que não fecha o
 * visto de trabalho), com peso para a mesma língua e a mesma região; a cidade
 * é uma das grandes de lá.
 */
export function destinoDaFamilia(v: Vida, r: Rng): string | undefined {
  const aqui = paisDaVida(v);
  const pais = moraCom(v).filter(p => !p.especie && idadeDe(v, p.tNasc) >= 21);
  if (!pais.length) return undefined;
  const nac = [...new Set(pais.flatMap(p => nacionalidadesDaPessoa(p)))];
  const lingua = perfilDoPais(aqui).idiomas[0];
  const opcoes = paisesComPerfil().filter(p => p !== aqui && (circulaLivre(nac, p) || nac.includes(p) || perfilDoPais(p).migracao.abertura !== 'restrita'));
  if (!opcoes.length) return undefined;
  const destino = r.weighted(opcoes, p => (perfilDoPais(p).idiomas[0] === lingua ? 3 : 1) * (paisDoCatalogo(p).regiao === paisDoCatalogo(aqui).regiao ? 1.5 : 1) * (circulaLivre(nac, p) ? 1.5 : 1) * Math.min(3, rendaRelativa(p) / Math.max(0.2, rendaRelativa(aqui))));
  if (!destino) return undefined;
  const grandes = cidadesDoPais(destino).filter(m => m.perfil === 'metropole' || m.capitalNacional);
  return (grandes.length ? r.pick(grandes) : r.pick(cidadesDoPais(destino) as Municipio[]))?.id;
}

/** "Mudou-se para Buenos Aires, na Argentina, para estudar." / "Depois de seis anos na Argentina, voltou ao Brasil." */
export function textoDaMigracao(v: Vida, origemId: string, destinoId: string, motivo: MotivoMigracao): string {
  const de = paisDaCidade(origemId), para = paisDaCidade(destinoId);
  const cidade = municipio(destinoId).nome;
  const anterior = [...(v.mundo?.migracoes ?? [])].reverse().find(m => paisDaCidade(m.para) === de && m.t < v.t);
  const anos = anterior ? Math.round((v.t - anterior.t) / 12) : undefined;
  const volta = paisNatal(v) === para || nacionalidadesDaVida(v).includes(para);
  if (volta && anos !== undefined) return `Depois de ${anos === 0 ? 'menos de um ano' : `${porExtenso(anos)} ${anos === 1 ? 'ano' : 'anos'}`} ${noPais(de)}, voltou ${aoPais(para)}, para ${cidade}.`;
  if (volta) return `Voltou ${aoPais(para)}: mudou-se de ${municipio(origemId).nome} para ${cidade}.`;
  const porque = motivo === 'retorno' ? '' : `, ${ROTULO_MOTIVO[motivo]}`;
  return `Deixou ${municipio(origemId).nome} e mudou-se para ${cidade}, ${noPais(para)}${porque}.`;
}

const EXTENSO = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze'];
const porExtenso = (n: number) => EXTENSO[n] ?? String(n);

/**
 * Re-expressa tudo o que é dinheiro DA PESSOA na moeda de outro país (o
 * mesmo valor de mercado): conta, aplicações, dívidas, bens, negócio, a
 * aposentadoria que segue sendo paga, e o período aberto do extrato (para
 * a conta do ano continuar fechando).
 */
export function redenominar(v: Vida, k: number): void {
  if (Math.abs(k - 1) < 1e-9) return;
  const f = v.financas;
  const x = (n: number) => Math.round(n * k * 100) / 100;
  f.conta = x(f.conta);
  for (const a of f.investimentos) { a.valor = x(a.valor); a.aportado = x(a.aportado); }
  for (const d of f.dividas) { d.saldo = x(d.saldo); d.parcela = x(d.parcela); }
  for (const b of f.bens) { b.valor = x(b.valor); if (b.precoPago !== undefined) b.precoPago = x(b.precoPago); }
  const n = v.caminhos.negocio;
  if (n?.caixa !== undefined) n.caixa = x(n.caixa);
  if (v.trabalho.aposentadoria) v.trabalho.aposentadoria.beneficio = Math.round(v.trabalho.aposentadoria.beneficio * k);
  for (const h of v.trabalho.historico) h.salario = Math.round(h.salario * k);
  const e = extratoAberto(v);
  e.contaInicial = x(e.contaInicial);
  e.aplicadoInicial = x(e.aplicadoInicial);
  for (const l of e.linhas) { l.conta = x(l.conta); l.aplicado = x(l.aplicado); }
}

/** Quem muda de país por outro caminho (a proposta de um clube de fora, a casa do filho no exterior) migra por aqui. */
function motivoDoTexto(t: string): MotivoMigracao {
  if (/jogar|dirigir|clube|seleção/.test(t)) return 'esporte';
  if (/perto d|família|filh/.test(t)) return 'familia';
  if (/trabalh|proposta|transfer/.test(t)) return 'trabalho';
  if (/estud|curso|faculdade/.test(t)) return 'estudo';
  return 'oportunidade';
}
registrarMigrador((v, destinoId, motivo) => {
  const m = motivoDoTexto(motivo);
  if (!avaliarMigracao(v, destinoId, m).via) return;
  migrar(v, criarRng((v.seq * 2654435761 + v.t) >>> 0), destinoId, m);
});

/* --------------------------------------------------------------- O ano */

/**
 * O ano de quem vive fora: a adaptação sobe (mais rápido para quem fala a
 * língua, e com a rede que se faz); a língua chega (uns quatro anos de
 * convivência); a nacionalidade pode ser pedida quando a lei deixa.
 */
export function processarMundo(v: Vida, r: Rng): void {
  const mu = v.mundo;
  if (!mu) return;
  const pais = paisDaVida(v);
  const lingua = perfilDoPais(pais).idiomas[0];
  const fala = linguasDaPessoa(v).includes(lingua);
  mu.adaptacao = clamp(mu.adaptacao + (fala ? 11 : 6) + (v.trabalho.atual ? 2 : 0) + (v.educacao.matricula ? 2 : 0), 0, 100);
  const anosLa = Math.floor((v.t - (v.fatos['chegou_pais'] ?? v.t)) / 12);
  if (!fala && anosLa >= 3 && r.chance(0.35 + v.mente.cognicao / 400)) {
    mu.idiomas = [...mu.idiomas, lingua];
    escrever(v, { texto: `Depois de ${anosLa} anos ${noPais(pais)}, o ${lingua} deixou de ser esforço: já sonha nele de vez em quando.`, relevancia: 'biografia', tema: 'lugar', tom: 'bom' });
  }
  // A cabeça de quem chegou há pouco e ainda não fala a língua sente o peso (sem virar drama: passa com os anos).
  if (mu.adaptacao < 40) v.mente.felicidade = clamp(v.mente.felicidade - (40 - mu.adaptacao) / 10, 0, 100);
  // A naturalização pedida sai.
  if (mu.naturalizacao && v.t >= mu.naturalizacao.t) {
    const p = mu.naturalizacao.pais;
    mu.naturalizacao = undefined;
    const dupla = regraDeCidadania(p).dupla;
    const antes = nacionalidadesDaVida(v);
    v.eu.nacionalidades = dupla ? [...antes, p] : [p];
    escrever(v, { texto: `Saiu a naturalização: agora é ${perfilDoPais(p).gentilico[v.eu.genero === 'feminino' ? 1 : 0]}${dupla ? '' : `, e deixou de ser ${antes.map(n => (temPerfil(n) ? perfilDoPais(n).gentilico[v.eu.genero === 'feminino' ? 1 : 0] : nomeDoPais(n))).join(' e ')}`}.`, relevancia: 'marco', tema: 'lugar', tom: 'bom' });
    marcar(v, 'mudanca_cidade', `Naturalizou-se ${perfilDoPais(p).gentilico[v.eu.genero === 'feminino' ? 1 : 0]}.`, 3);
  }
}

/** Pode pedir a nacionalidade do país onde mora? (A mesma conta da tela e da ação.) */
export function podeNaturalizar(v: Vida): Veredito {
  const pais = paisDaVida(v);
  if (nacionalidadesDaVida(v).includes(pais)) return bloqueio('incompativel', 'Você já é deste país.');
  if (v.mundo?.naturalizacao) return bloqueio('incompativel', 'O pedido já está correndo.');
  const anos = anosParaNaturalizar(pais, nacionalidadesDaVida(v), blocosDoPais);
  if (anos === undefined) return bloqueio('impossivel', 'Aqui a naturalização, na prática, não acontece.');
  const morou = Math.floor((v.t - (v.fatos['chegou_pais'] ?? v.t)) / 12);
  if (morou < anos) return bloqueio('requisito', `Pede ${anos} anos morando aqui; você tem ${morou}.`);
  if (v.justica?.antecedentes.some(a => a.desfecho !== 'absolvicao' && v.t - a.t < 120)) return bloqueio('requisito', 'Com antecedentes recentes, o pedido seria negado.');
  return { grau: 'permitido', motivo: regraDeCidadania(pais).dupla ? undefined : 'Este país não aceita dupla nacionalidade: naturalizar-se é deixar a sua.' };
}

export function pedirNaturalizacao(v: Vida): void {
  const pais = paisDaVida(v);
  v.mundo = v.mundo ?? { migracoes: [], adaptacao: 60, idiomas: [] };
  v.mundo.naturalizacao = { pais, t: v.t + 12 };
  escrever(v, { texto: `Pediu a nacionalidade ${doPais(pais).replace(/^de /, 'de ')}: papéis, prova de língua e de vida no país, e um ano de espera.`, relevancia: 'biografia', tema: 'lugar', escolha: true });
}

/** Os países para onde dá para pensar em ir (os que podem ser vividos, menos o atual), com a porta e o custo para a cidade principal. */
export function opcoesDeMigracao(v: Vida, motivo: MotivoMigracao): AvaliacaoDeMigracao[] {
  const aqui = paisDaVida(v);
  return paisesComPerfil().filter(p => p !== aqui).map(p => {
    const cid = cidadesDoPais(p).find(m => m.capitalNacional) ?? cidadesDoPais(p)[0];
    return avaliarMigracao(v, cid.id, motivo);
  });
}

const paisesComPerfil = () => paisesVivenciaveis().map(p => p.id);

