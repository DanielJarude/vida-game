/**
 * A meia-idade e depois (FIX #7): a vida fica MAIS biográfica com a idade,
 * porque existe mais passado.
 *
 * Nada aqui é sorteado do nada. Cada situação existe porque o estado a
 * sustenta: o filho que casou este ano (e com quem), a separação dele, a
 * casa que esvaziou, o primeiro neto, os vinte e cinco anos com a mesma
 * pessoa, os pais que envelhecem, os irmãos depois dos pais, a amizade de
 * décadas, o plano que ficou no papel, a atividade abandonada, o negócio que
 * alguém pode herdar, a casa da família. Os textos usam os nomes e a
 * história guardada (presença, brigas da adolescência, crises atravessadas,
 * marcos) — o que as outras pessoas dizem sai do que foi registrado, nunca é
 * inventado.
 *
 * Acontecimentos narram o que OUTRAS pessoas fizeram ou o que o tempo
 * marcou; nunca como o jogador reagiu. Decisões dizem, antes, o que cada
 * opção muda. Anos silenciosos continuam permitidos: quase tudo aqui só
 * acontece uma vez por pessoa, numa janela curta.
 */

import type { Conteudo, Ctx } from './base';
import type { Dominio, Imovel, Pessoa, Vida, Vinculo } from '../tipos';
import * as P from './papeis';
import { custa, dinheiro, envolvimento, estresse, feliz, prox, tensao } from './efeitos';
import { clamp } from '../rng';
import { idadePessoa, lembrarCom, temFato, vinculosVivos } from '../nucleo';
import { flex, listaNatural } from '../texto';
import { anoDe, idadeEm } from '../tempo';
import { disponivel as guardado, pagar } from '../sistemas/dinheiro';
import { moraComFamiliaDeOrigem } from '../sistemas/domicilio';
import { mesmaCidade, moraJunto, filhosEmComum } from '../sistemas/vinculos';
import { cidadeDe, descricaoOrigem } from '../sistemas/social';
import { casaPropria, executarImovel, valorDeVendaImovel } from '../sistemas/imoveis';
import { modeloMoradia } from '../dados/bens';
import { aluguelDe, precoDeImovel } from '../sistemas/mercado';
import { modeloRotina, podeComecarRotina } from '../sistemas/rotinas';
import { semana } from '../sistemas/semana';
import { garantirFrente } from '../sistemas/frentes';
import { encerrarEmprego, podeAposentar, valorAposentadoria } from '../sistemas/trabalho';
import { negocioAberto, retiradaMensal, valorDoNegocio, venderNegocio } from '../sistemas/negocio';
import { marcar } from '../sistemas/marcas';
import { ocupacao, ROTULO_TRILHA } from '../dados/ocupacoes';

/* ------------------------------------------------------------- Auxiliares */

const anosDesde = (v: Vida, t: number) => Math.floor((v.t - t) / 12);
const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const dele = (p: Pessoa) => flex(p.genero, 'dele', 'dela', 'delu');
const o = (p: Pessoa) => flex(p.genero, 'o', 'a', 'e');
const fmt = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;
const minusc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const numero = (n: number) => (['nenhuma', 'uma', 'duas', 'três', 'quatro', 'cinco'][n] ?? String(n));

/** Muda o vínculo com alguém que não está num papel da decisão. */
function mexer(v: Vida, id: string | undefined, m: { prox?: number; tensao?: number; confianca?: number; env?: number }): void {
  const vin = id ? v.vinculos[id] : undefined;
  if (!vin) return;
  if (m.prox) vin.proximidade = clamp(vin.proximidade + m.prox);
  if (m.tensao) vin.tensao = clamp(vin.tensao + m.tensao);
  if (m.confianca) vin.confianca = clamp(vin.confianca + m.confianca);
  if (m.env && vin.romance) vin.romance.envolvimento = clamp(vin.romance.envolvimento + m.env);
  vin.tUltimoContato = v.t;
}

const feito = (c: Ctx, chave: string) => { c.v.fatos[chave] = c.v.t; };

/** Os filhos do jogador (de sangue ou de criação), vivos e com nome. */
const filhosVivos = (v: Vida) => vinculosVivos(v).filter(x => (x.vin.parentesco === 'filho' || x.vin.parentesco === 'enteado') && x.p.nome).map(x => x.p);

/** Os filhos de alguém que o jogador conhece (netos, quando é um filho). */
const netosDe = (v: Vida, f: Pessoa) => Object.values(v.pessoas).filter(n => n.vivo && n.nome && n.genitores?.includes(f.id) && v.vinculos[n.id]);

/** A parceria que mora com o jogador. */
const conjugeEmCasa: (v: Vida) => Pessoa[] = v => P.conjuge(v).filter(p => moraJunto(v.vinculos[p.id]));

/** Quantas crises com causa o casal atravessou (ficam na história como "Um tempo difícil"). */
const crisesDoCasal = (vin: Vinculo) => vin.historia.filter(h => h.texto.startsWith('Um tempo difícil')).length;

const irmaosVivos = (v: Vida) => vinculosVivos(v).filter(x => x.vin.parentesco === 'irmao' || x.vin.parentesco === 'meio_irmao').map(x => x.p);

/** "seu pai", "sua mãe". */
const seuGenitor = (p: Pessoa) => flex(p.genero, 'seu pai', 'sua mãe', 'sue mãe');

const nomeDoAvo = (c: Ctx) => c.g('avô', 'avó', 'avó');

/** Custo de uma viagem curta (hotel, estrada ou passagem), pelo que a pessoa tem. */
const custoViagem = (v: Vida) => Math.round(clamp(guardado(v) * 0.05, 2500, 12000) / 100) * 100;

function rotinaCabe(v: Vida, id: string, nivel: 1 | 2 | 3 = 1): true | string {
  if (v.rotinas.some(r => r.id === id && (r.nivel ?? 1) >= nivel)) return true;
  const ver = podeComecarRotina(v, id, nivel);
  return ver.grau === 'permitido' || ver.grau === 'irregular' ? true : ver.motivo ?? 'Não cabe agora.';
}

function comecarRotina(v: Vida, id: string, nivel: 1 | 2 | 3 = 1): void {
  const r = v.rotinas.find(x => x.id === id);
  if (r) { if ((r.nivel ?? 1) < nivel) r.nivel = nivel; return; }
  v.rotinas.push({ id, tInicio: v.t, nivel });
}

/* ------------------------------------------------------ O casamento do filho */

const parceriaDoFilho = (v: Vida, f: Pessoa) => {
  const par = f.parceiroId ? v.pessoas[f.parceiroId] : undefined;
  return par?.vivo && v.vinculos[par.id]?.parentesco === 'genro' ? par : undefined;
};
const noCartorio = (v: Vida, f: Pessoa) => v.fatos[`uniao_cartorio_${f.id}`] !== 0;
const custoDaFesta = (v: Vida) => Math.round(clamp(guardado(v) * 0.12, 3000, 30000) / 500) * 500;

/* ----------------------------------------------------- A separação do filho */

/** Quem se separou do filho (o ex-genro ou a ex-nora), pelo instante da separação. */
function exDoFilho(v: Vida, f: Pessoa): Pessoa | undefined {
  if (f.aperto?.tipo !== 'separacao') return undefined;
  const t = f.aperto.t;
  const ids = Object.keys(v.fatos).filter(k => k.startsWith('ex_genro_') && v.fatos[k] === t).map(k => k.slice('ex_genro_'.length));
  const comNetos = ids.find(id => netosDe(v, f).some(n => n.genitores?.includes(id)));
  const id = comNetos ?? ids[0];
  return id ? v.pessoas[id] : undefined;
}
const netosPequenos = (v: Vida, f: Pessoa) => netosDe(v, f).filter(n => idadePessoa(v, n) < 18);

/* ------------------------------------------------------------ Ninho vazio */

function ultimaSaida(v: Vida): { f: Pessoa; t: number } | undefined {
  let melhor: { f: Pessoa; t: number } | undefined;
  for (const f of filhosVivos(v)) {
    const t = v.fatos[`saiu_de_casa_${f.id}`];
    if (t !== undefined && (!melhor || t > melhor.t)) melhor = { f, t };
  }
  return melhor;
}

function ninhoVazio(v: Vida): boolean {
  const fs = filhosVivos(v).filter(f => v.vinculos[f.id].parentesco === 'filho');
  if (!fs.length || fs.some(f => idadePessoa(v, f) < 18 || moraJunto(v.vinculos[f.id]))) return false;
  const u = ultimaSaida(v);
  return !!u && v.t - u.t <= 36;
}

/** Vender a casa grande e comprar um apartamento de dois quartos na mesma cidade: quanto sobra. */
function trocaDeCasa(v: Vida): { casa: Imovel; venda: number; preco: number; sobra: number } | undefined {
  const casa = casaPropria(v);
  if (!casa || modeloMoradia(casa.modeloId).quartos < 3 || v.financas.dividas.some(d => d.bemId === casa.id)) return undefined;
  const venda = valorDeVendaImovel(casa);
  const preco = precoDeImovel(v, modeloMoradia('apto_2q'), casa.municipioId);
  const sobra = venda - preco;
  return sobra >= 20000 ? { casa, venda, preco, sobra } : undefined;
}

function trocarDeCasa(v: Vida, quem: string[]): void {
  const x = trocaDeCasa(v);
  if (!x) return;
  const m = modeloMoradia('apto_2q');
  v.financas.bens = v.financas.bens.filter(b => b.id !== x.casa.id);
  v.financas.conta += x.sobra;
  const id = `i${v.seq++}`;
  v.financas.bens.push({ id, tipo: 'imovel', modeloId: m.id, nome: m.nome, valor: x.preco, precoPago: x.preco, tCompra: v.t, municipioId: x.casa.municipioId, estado: 80, dono: x.casa.dono, historia: [{ t: v.t, texto: `Comprado depois de vender ${x.casa.nome}${quem.length ? `, onde ${listaNatural(quem)} cresceram` : ''}.` }] });
  v.moradia = { tipo: 'propria', municipioId: x.casa.municipioId, imovelId: id, modeloId: m.id, aluguel: 0, padrao: m.padrao, tInicio: v.t, aceitaPet: true };
}

/* ----------------------------------------------------- O filho olha para trás */

type Balanco = 'gratidao' | 'cobranca' | 'misto';

function balanco(v: Vida, f: Pessoa): { tom: Balanco; fala: string } {
  const vin = v.vinculos[f.id];
  const pres = vin.presenca ?? 30;
  const atrito = vin.habitos?.atrito_adolescencia ?? 0;
  const apoios = vin.historia.filter(h => h.tipo === 'apoio' && /^Você /.test(h.texto));
  const conflitos = vin.historia.filter(h => h.tipo === 'conflito');
  const pagou = vin.historia.find(h => /^Você pagou a faculdade/.test(h.texto));
  const bom = (pres >= 55 && atrito <= 1) || (apoios.length >= 2 && atrito <= 2) || (!!pagou && atrito <= 2 && pres >= 40);
  const ruim = pres < 38 || atrito >= 3 || conflitos.length >= 3;
  const tom: Balanco = bom && !ruim ? 'gratidao' : ruim && !bom ? 'cobranca' : 'misto';
  const lembranca = pagou ?? apoios[apoios.length - 1];
  if (tom === 'gratidao') {
    return { tom, fala: `"${pres >= 55 ? 'Você estava lá' : 'Você segurou as pontas'}.${lembranca ? ` Tem uma coisa que eu nunca esqueci: ${minusc(lembranca.texto)}` : ''}"` };
  }
  if (tom === 'cobranca') {
    if (atrito >= 3) return { tom, fala: `"A gente brigou muito quando eu tinha uns quinze anos. Porta batida, jantar em silêncio. Eu nunca entendi direito por quê."` };
    if (pres < 38) return { tom, fala: `"Eu lembro mais da sua falta do que das brigas. Tinha semana em que a gente mal se via."` };
    const ultimo = conflitos[conflitos.length - 1];
    return { tom, fala: `"Teve coisa entre nós que eu ainda não engoli.${ultimo ? ` ${ultimo.texto}` : ''}"` };
  }
  return { tom, fala: `"Não foi perfeito. ${atrito ? 'A gente brigou' : pres < 50 ? 'Teve anos em que você quase não estava'  : 'Teve coisa difícil'}, mas ${apoios.length || pagou ? 'quando eu precisei você apareceu' : 'eu sabia onde te achar'}."` };
}

/** O que faz alguém olhar para trás: acabou de virar pai ou mãe, ou fez trinta anos. */
function ocasiaoDeOlhar(v: Vida, f: Pessoa): string | undefined {
  const seus = netosDe(v, f);
  const primeiro = seus.sort((a, b) => a.tNasc - b.tNasc)[0];
  if (primeiro && idadePessoa(v, primeiro) <= 1 && seus.length === 1) return `agora que ${primeiro.nome} nasceu`;
  if (idadePessoa(v, f) === 30) return 'no aniversário de trinta anos';
  return undefined;
}

/* --------------------------------------------------------------- As bodas */

const anosDoCasal = (v: Vida, p: Pessoa) => { const vin = v.vinculos[p.id]; return Math.floor((v.t - (vin.romance?.tInicio ?? vin.tInicio)) / 12); };
const marcoDasBodas = (v: Vida, p: Pessoa): 25 | 50 | undefined => { const a = anosDoCasal(v, p); return a >= 25 && a < 27 ? 25 : a >= 50 && a < 52 ? 50 : undefined; };

function historiaDoCasal(v: Vida, par: Pessoa): string {
  const vin = v.vinculos[par.id];
  const filhos = filhosEmComum(v, par.id);
  const vivos = filhos.filter(f => f.vivo && f.nome);
  const mortos = filhos.filter(f => !f.vivo && f.nome);
  const netos = vivos.reduce((s, f) => s + netosDe(v, f).length, 0);
  const crises = crisesDoCasal(vin);
  const partes: string[] = [];
  if (vivos.length) partes.push(`Vieram ${listaNatural(vivos.map(f => f.nome))}${netos ? `, e depois ${netos === 1 ? 'um neto' : `${netos} netos`}` : ''}.`);
  if (mortos.length) partes.push(`Enterraram ${listaNatural(mortos.map(f => f.nome))} juntos.`);
  partes.push(crises ? `Atravessaram ${crises === 1 ? 'uma crise de verdade' : `${numero(crises)} crises de verdade`} — ${crises === 1 ? 'ela está' : 'estão'} na história de vocês.` : 'Nenhuma crise durou o bastante para virar história.');
  return partes.join(' ');
}

/* ------------------------------------------------------ Pais envelhecendo */

function irmaosNaCidade(v: Vida, cidade: string): { perto: Pessoa[]; longe: Pessoa[] } {
  const todos = irmaosVivos(v).filter(p => idadePessoa(v, p) >= 18);
  return { perto: todos.filter(p => p.municipioId === cidade), longe: todos.filter(p => p.municipioId !== cidade) };
}

/* ---------------------------------------------------------- Irmãos depois */

function ultimoGenitorMorto(v: Vida): Pessoa | undefined {
  const ids = Object.values(v.vinculos).filter(x => x.parentesco === 'mae' || x.parentesco === 'pai').map(x => v.pessoas[x.pessoaId]).filter(Boolean);
  if (!ids.length || ids.some(p => p.vivo)) return undefined;
  return ids.filter(p => p.tMorte !== undefined).sort((a, b) => (b.tMorte ?? 0) - (a.tMorte ?? 0))[0];
}

/* ------------------------------------------------------- Amizade de décadas */

const marcoDaAmizade = (v: Vida, vin: Vinculo): 25 | 40 | undefined => { const a = anosDesde(v, vin.tInicio); return a >= 25 && a < 27 ? 25 : a >= 40 && a < 42 ? 40 : undefined; };
// Um ex com quem se viveu junto (ou se casou) não vira "amizade de décadas": essa história é outra.
const amigosDeVerdade = (v: Vida) => vinculosVivos(v).filter(x => !x.vin.parentesco && !x.p.especie && (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo') && (!x.vin.romance || (x.vin.romance.estagio === 'ex' && x.vin.romance.fim !== 'divorcio' && !x.vin.historia.some(h => h.tipo === 'casamento' || h.tipo === 'casa'))));

/** O marco mais pesado da história com alguém (sem os de aniversário e os de começo). */
function marcoMaisForte(vin: Vinculo) {
  return [...vin.historia].filter(h => h.tipo !== 'inicio' && !/anos de amizade/.test(h.texto)).sort((a, b) => (b.peso ?? 1) - (a.peso ?? 1) || b.t - a.t)[0];
}

/* -------------------------------------------------------- O plano no papel */

interface Plano { chave: string; oque: string; t: number }
const PLANOS: [string, string][] = [
  ['plano_faculdade', 'fazer faculdade'], ['plano_estudar', 'voltar a estudar'], ['plano_tecnico', 'fazer um curso técnico'],
  ['plano_concurso', 'passar num concurso'], ['quis_mudar_area', 'mudar de área']
];

function planoPendente(v: Vida): Plano | undefined {
  const estudouDepois = (t: number) => (v.educacao.matricula && v.educacao.matricula.tInicio >= t) || v.educacao.concluidos.some(x => x.tFim > t);
  const out: Plano[] = [];
  for (const [chave, oque] of PLANOS) {
    const t = v.fatos[chave];
    if (t === undefined || v.t - t < 60) continue;
    if (chave === 'plano_concurso') {
      const servidor = v.trabalho.atual?.contrato === 'servidor' || v.trabalho.historico.some(h => h.contrato === 'servidor' && h.tInicio > t);
      if (servidor || v.caminhos.concurso.aprovacoes > 0) continue;
    } else if (chave === 'quis_mudar_area') {
      if ((v.fatos['mudou_de_carreira'] ?? -1) > t || v.caminhos.marcas.some(m => m.tipo === 'mudanca_carreira' && m.t > t) || estudouDepois(t)) continue;
    } else if (estudouDepois(t)) continue;
    out.push({ chave, oque, t });
  }
  return out.sort((a, b) => a.t - b.t)[0];
}

const rotinaDoPlano = (v: Vida, p: Plano): string | undefined =>
  p.chave === 'plano_concurso' ? 'estudar_concurso' : !v.educacao.concluidos.some(x => x.nivel === 'superior') ? 'cursinho' : undefined;

/** Um filho em idade de estudar, que ainda não tem diploma nem está estudando. */
const filhoParaEstudar = (v: Vida) => filhosVivos(v).filter(f => { const i = idadePessoa(v, f); return i >= 14 && i <= 30 && !f.formacao && !f.estudo; });

/* -------------------------------------------------- O sonho que ficou para trás */

const DOMINIOS_DE_SONHO: Dominio[] = ['futebol', 'volei', 'natacao', 'atletismo', 'lutas', 'musica', 'teatro', 'danca', 'desenho', 'escrita', 'fotografia'];
const VERBO: Partial<Record<Dominio, string>> = { musica: 'tocar', futebol: 'jogar bola', volei: 'jogar vôlei', teatro: 'fazer teatro', danca: 'dançar', desenho: 'desenhar', escrita: 'escrever', natacao: 'nadar', atletismo: 'correr', lutas: 'treinar luta', xadrez: 'jogar xadrez', fotografia: 'fotografar', cozinha: 'cozinhar', idiomas: 'estudar idiomas', programacao: 'programar' };
const ROTINA_DO_DOMINIO: Partial<Record<Dominio, string>> = { escrita: 'escrever', cozinha: 'cozinhar', idiomas: 'ingles' };
const rotinaDe = (d: Dominio) => { const id = ROTINA_DO_DOMINIO[d] ?? d; return modeloRotina(id) ? id : undefined; };

function sonhoParaTras(v: Vida): { d?: Dominio; texto: string; t: number } | undefined {
  const es = v.caminhos.esporte;
  if (es?.fase === 'encerrada' && es.motivoFim === 'dispensa' && es.tFim !== undefined) {
    return { d: es.modalidade, texto: `O clube dispensou você${es.nivel >= 3 ? ' quando o profissional parecia perto' : ''}`, t: es.tFim };
  }
  const m = [...v.caminhos.marcas].reverse().find(x => (x.tipo === 'abandono' || x.tipo === 'fracasso') && x.dominio && DOMINIOS_DE_SONHO.includes(x.dominio));
  return m ? { d: m.dominio, texto: m.texto.replace(/\.$/, ''), t: m.t } : undefined;
}

/* ----------------------------------------------------- Atividade abandonada */

function atividadeParada(v: Vida): { d: Dominio; rotina: string; anos: number; auge: number } | undefined {
  const cand = (Object.entries(v.caminhos.frentes) as [Dominio, NonNullable<Vida['caminhos']['frentes'][Dominio]>][])
    .filter(([d, f]) => f.auge >= 42 && v.t - f.tUltimo >= 96 && !['exatas', 'linguagens', 'ciencias', 'humanas', 'lideranca', 'comunidade', 'vendas', 'campo', 'manual', 'beleza'].includes(d))
    .map(([d, f]) => ({ d, rotina: rotinaDe(d), anos: anosDesde(v, f.tUltimo), auge: f.auge }))
    .filter((x): x is { d: Dominio; rotina: string; anos: number; auge: number } => !!x.rotina && !v.rotinas.some(r => r.id === x.rotina) && podeComecarRotina(v, x.rotina, 1).grau !== 'impossivel')
    .sort((a, b) => b.auge - a.auge);
  return cand[0];
}

/** O que abriu espaço para voltar a alguma coisa (a casa esvaziou, a aposentadoria, a semana folgada). */
function ocasiaoDeRetomar(v: Vida): string | undefined {
  if (v.trabalho.aposentadoria) return 'A aposentadoria devolveu as tardes.';
  const fs = filhosVivos(v);
  if (fs.length && fs.every(f => !moraJunto(v.vinculos[f.id]))) return 'Com os filhos criados e fora de casa, sobram noites que antes eram de dever de casa.';
  if (semana(v).livre >= 0.8) return 'A semana anda com folga.';
  return undefined;
}

/* ----------------------------------------------------------- Carreira */

function marcoDeCarreira(v: Vida): { trilha: string; anos: 20 | 25 | 30 } | undefined {
  const e = v.trabalho.atual;
  if (!e || e.contrato === 'eletivo' || e.posAposentadoria) return undefined;
  const trilha = ocupacao(e.ocupacaoId).trilha;
  const meses = v.trabalho.experiencia[trilha] ?? 0;
  const anos = meses >= 240 && meses < 264 ? 20 : meses >= 300 && meses < 324 ? 25 : meses >= 360 && meses < 384 ? 30 : undefined;
  return anos && !temFato(v, `bio_carreira_${trilha}_${anos}`) ? { trilha, anos } : undefined;
}

const idadeMinimaAposentadoria = (v: Vida) => (v.eu.genero === 'feminino' ? 62 : 65);

/* ------------------------------------------------------------ Conteúdo */

export const BIOGRAFIA: Conteudo[] = [
  /* ============================================== O filho vai se casar */
  {
    id: 'bio_casamento_filho', tipo: 'decisao', idade: [36, 95], tema: 'filhos', prioritario: true, prioridade: 3, repetir: 0,
    papeis: {
      filho: v => P.filho(18)(v).filter(f => { const t = v.fatos[`casou_${f.id}`]; return t !== undefined && v.t - t < 24 && !temFato(v, `bio_casamento_${f.id}`) && !!parceriaDoFilho(v, f); })
    },
    titulo: c => `${c.p.filho.nome} e ${parceriaDoFilho(c.v, c.p.filho)!.nome}`,
    texto: c => {
      const f = c.p.filho;
      const g = parceriaDoFilho(c.v, f)!;
      const vinG = c.v.vinculos[g.id];
      const desde = c.v.fatos[`namoro_${f.id}`];
      const saiu = c.v.fatos[`saiu_de_casa_${f.id}`] !== undefined && c.v.t - c.v.fatos[`saiu_de_casa_${f.id}`] < 24;
      const cartorio = noCartorio(c.v, f);
      return `${f.nome}, aos ${idadePessoa(c.v, f)}, ${cartorio ? `casou no civil com ${g.nome}` : `foi morar com ${g.nome}`}${desde !== undefined ? ` — estão juntos desde ${anoDe(desde)}` : ''}. ${g.nome}${g.ocupacao ? `, ${g.ocupacao},` : ''} ${vinG.proximidade >= 50 ? 'já é de casa nos almoços de domingo' : 'ainda é quase um desconhecido para você'}.${saiu ? ` ${f.nome} deixou o quarto de sempre.` : ''} ${cartorio ? 'A festa vai ser daqui a uns meses, e a lista de convidados já passou de cem.' : 'Estão montando a casa com o que dá.'}`;
    },
    opcoes: [
      {
        id: 'ajudar', texto: c => (noCartorio(c.v, c.p.filho) ? 'Ajudar a pagar a festa' : 'Ajudar a montar a casa nova'), comportamento: { generosidade: 1, familia: 1 },
        disponivel: c => custa(c, custoDaFesta(c.v), 'Não há dinheiro guardado para isso.'),
        consequencia: c => `Saem ${fmt(custoDaFesta(c.v))} do que você tem. ${c.p.filho.nome} e ${parceriaDoFilho(c.v, c.p.filho)!.nome} ficam mais perto de você.`,
        resolver: c => {
          const g = parceriaDoFilho(c.v, c.p.filho)!;
          const valor = custoDaFesta(c.v);
          const cartorio = noCartorio(c.v, c.p.filho);
          return {
            texto: cartorio ? `O salão, o bolo e o DJ ficaram por sua conta. Na hora da valsa, ${c.p.filho.nome} puxou você para a pista.` : `Geladeira, fogão e um sofá de três lugares chegaram numa quarta-feira. ${g.nome} mandou foto da sala pronta.`,
            memoria: cartorio ? `Ajudou a pagar a festa de casamento de ${c.p.filho.nome} e ${g.nome}.` : `Ajudou ${c.p.filho.nome} e ${g.nome} a montar a primeira casa.`,
            tom: 'bom',
            efeito: () => {
              feito(c, `bio_casamento_${c.p.filho.id}`); pagar(c.v, valor);
              prox(c, 'filho', 8); mexer(c.v, g.id, { prox: 12, confianca: 5 });
              lembrarCom(c.v, c.p.filho.id, cartorio ? 'Você ajudou a pagar a festa de casamento.' : 'Você ajudou a montar a primeira casa.', 'apoio', 2);
              lembrarCom(c.v, g.id, cartorio ? 'Você ajudou a pagar a festa do casamento.' : 'Você ajudou a montar a casa.', 'apoio', 2);
            }
          };
        }
      },
      {
        id: 'discurso', texto: c => (noCartorio(c.v, c.p.filho) ? 'Fazer um discurso na festa' : 'Juntar as duas famílias num almoço na sua casa'), comportamento: { familia: 1, sociabilidade: 1 },
        consequencia: c => `Não custa dinheiro. Fica na memória de ${c.p.filho.nome}, e ${parceriaDoFilho(c.v, c.p.filho)!.nome} passa a conhecer melhor a sua família.`,
        resolver: c => {
          const g = parceriaDoFilho(c.v, c.p.filho)!;
          const cartorio = noCartorio(c.v, c.p.filho);
          const infancia = c.v.vinculos[c.p.filho.id].historia.find(h => h.tipo === 'escola' || h.tipo === 'inicio');
          return {
            texto: cartorio
              ? `Você falou por três minutos${infancia ? `, começando por ${minusc(infancia.texto).replace(/\.$/, '')}` : ''}. ${g.nome} pediu o papel do discurso para guardar.`
              : `A mesa não coube na sala e foi para o quintal. A família de ${g.nome} trouxe a sobremesa.`,
            memoria: cartorio ? `Fez o discurso no casamento de ${c.p.filho.nome} e ${g.nome}.` : `Juntou a família de ${g.nome} num almoço, quando ${c.p.filho.nome} foi morar junto.`,
            tom: 'bom',
            efeito: () => {
              feito(c, `bio_casamento_${c.p.filho.id}`);
              prox(c, 'filho', 6); mexer(c.v, g.id, { prox: 7 });
              lembrarCom(c.v, c.p.filho.id, cartorio ? 'Você fez o discurso no casamento.' : 'Você juntou as duas famílias num almoço.', 'ritual', 2);
              if (!cartorio) dinheiro(c, -400);
            }
          };
        }
      },
      {
        id: 'distancia', texto: 'Ir como convidado e não se envolver',
        consequencia: c => `Nada muda por agora; ${parceriaDoFilho(c.v, c.p.filho)!.nome} continua alguém que você conhece pouco.`,
        resolver: c => ({
          texto: 'Você foi, cumprimentou os parentes e voltou cedo.',
          memoria: null,
          efeito: () => { feito(c, `bio_casamento_${c.p.filho.id}`); mexer(c.v, parceriaDoFilho(c.v, c.p.filho)?.id, { prox: -2 }); }
        })
      },
      {
        id: 'nao_ir', texto: 'Não ir', comportamento: { familia: -1 },
        disponivel: c => (c.v.vinculos[c.p.filho.id].tensao >= 35 || c.v.vinculos[c.p.filho.id].proximidade < 35 ? true : false),
        consequencia: c => `${c.p.filho.nome} vai notar a cadeira vazia. A distância entre vocês cresce.`,
        resolver: c => ({
          texto: `Você não foi. As fotos chegaram pelo grupo da família, sem mensagem.`,
          memoria: `Não foi ao casamento de ${c.p.filho.nome}.`, tom: 'ruim',
          efeito: () => { feito(c, `bio_casamento_${c.p.filho.id}`); prox(c, 'filho', -15); tensao(c, 'filho', 15); lembrarCom(c.v, c.p.filho.id, 'Você não foi ao casamento.', 'conflito', 3); }
        })
      }
    ]
  },

  /* ============================================== O filho se separou */
  {
    id: 'bio_separacao_filho', tipo: 'decisao', idade: [38, 100], tema: 'filhos', prioritario: true, prioridade: 3, repetir: 0,
    papeis: { filho: v => P.filho(20)(v).filter(f => f.aperto?.tipo === 'separacao' && v.t - f.aperto.t < 24 && (v.fatos[`bio_separacao_${f.id}`] === undefined || v.t - v.fatos[`bio_separacao_${f.id}`] >= 36)) },
    titulo: c => `${c.p.filho.nome} se separou`,
    texto: c => {
      const f = c.p.filho;
      const ex = exDoFilho(c.v, f);
      const netos = netosPequenos(c.v, f);
      const desde = c.v.fatos[`namoro_${f.id}`];
      const quanto = desde !== undefined ? ` depois de ${Math.max(1, anosDesde(c.v, desde))} anos juntos` : '';
      const criancas = netos.length ? ` ${netos.length === 1 ? `${netos[0].nome}, ${flex(netos[0].genero, 'o neto', 'a neta', 'e nete')}, tem ${idadePessoa(c.v, netos[0])} anos` : `Os netos, ${listaNatural(netos.map(n => n.nome))}, têm ${listaNatural(netos.map(n => String(idadePessoa(c.v, n))))} anos`} e agora ${netos.length === 1 ? 'divide' : 'dividem'} a semana entre duas casas.` : '';
      return `${f.nome} e ${ex?.nome ?? 'a parceria de tantos anos'} se separaram${quanto}.${criancas} ${moraJunto(c.v.vinculos[f.id]) ? '' : `${f.nome} está num lugar provisório${f.renda === 0 ? ', e sem trabalho' : ''}.`}`;
    },
    opcoes: [
      {
        id: 'acolher', texto: c => `Oferecer a sua casa a ${c.p.filho.nome} por um tempo`, comportamento: { familia: 2 },
        disponivel: c => (moraJunto(c.v.vinculos[c.p.filho.id]) ? false : moraComFamiliaDeOrigem(c.v) ? 'Você não mora numa casa sua.' : true),
        consequencia: c => `${c.p.filho.nome} volta a morar com você enquanto se reorganiza: mais gente em casa, mais conta, mais conversa.`,
        resolver: c => ({
          texto: `${c.p.filho.nome} chegou com duas malas e ficou no quarto que já foi ${dele(c.p.filho)}. Na primeira semana, dormiu muito.`,
          memoria: `Depois da separação, ${c.p.filho.nome} voltou a morar com você por um tempo.`,
          efeito: () => {
            const vin = c.v.vinculos[c.p.filho.id];
            feito(c, `bio_separacao_${c.p.filho.id}`);
            if (!vin.convivio.includes('casa')) vin.convivio.push('casa');
            c.p.filho.municipioId = c.v.moradia.municipioId;
            delete c.v.fatos[`saiu_de_casa_${c.p.filho.id}`];
            prox(c, 'filho', 10); vin.confianca = clamp(vin.confianca + 8); estresse(c, 3);
            c.p.filho.aperto!.t -= 8;
            lembrarCom(c.v, c.p.filho.id, 'Voltou para casa depois da separação.', 'casa', 3);
          }
        })
      },
      {
        id: 'netos', texto: c => `Ajudar com ${listaNatural(netosPequenos(c.v, c.p.filho).map(n => n.nome))} nos dias de ${c.p.filho.nome}`, comportamento: { familia: 1 },
        disponivel: c => (netosPequenos(c.v, c.p.filho).length ? (mesmaCidade(c.v, c.p.filho) ? true : 'Moram longe demais para isso.') : false),
        consequencia: c => `Mais tempo com ${netosPequenos(c.v, c.p.filho).length === 1 ? netosPequenos(c.v, c.p.filho)[0].nome : 'os netos'}; um pedaço fixo da sua semana.`,
        resolver: c => {
          const netos = netosPequenos(c.v, c.p.filho);
          return {
            texto: `Buscar na escola às terças, almoço de sábado na sua casa. ${netos.length === 1 ? netos[0].nome : 'As crianças'} já sabe${netos.length === 1 ? '' : 'm'} onde fica o biscoito.`,
            memoria: `Depois da separação de ${c.p.filho.nome}, passou a ajudar com ${netos.length === 1 ? netos[0].nome : 'os netos'}.`,
            efeito: () => {
              feito(c, `bio_separacao_${c.p.filho.id}`);
              for (const n of netos) { mexer(c.v, n.id, { prox: 10 }); const vn = c.v.vinculos[n.id]; vn.presenca = Math.max(vn.presenca ?? 0, 40); }
              comecarRotina(c.v, 'tempo_familia');
              prox(c, 'filho', 6); c.p.filho.aperto!.t -= 6;
              lembrarCom(c.v, c.p.filho.id, 'Você ajudou com as crianças depois da separação.', 'apoio', 2);
            }
          };
        }
      },
      {
        id: 'ex', texto: c => `Manter a porta aberta para ${exDoFilho(c.v, c.p.filho)?.nome}`,
        disponivel: c => { const ex = exDoFilho(c.v, c.p.filho); return ex?.vivo && netosPequenos(c.v, c.p.filho).some(n => n.genitores?.includes(ex.id)) ? true : false; },
        consequencia: c => `${exDoFilho(c.v, c.p.filho)?.nome} continua sendo recebid${o(exDoFilho(c.v, c.p.filho)!)} na sua casa, pelos netos. ${c.p.filho.nome} pode estranhar.`,
        resolver: c => {
          const ex = exDoFilho(c.v, c.p.filho)!;
          return {
            texto: `No aniversário das crianças, ${ex.nome} veio e ficou até o bolo.`,
            memoria: `Depois da separação de ${c.p.filho.nome}, manteve a convivência com ${ex.nome}, pelos netos.`,
            efeito: () => { feito(c, `bio_separacao_${c.p.filho.id}`); mexer(c.v, ex.id, { prox: 8 }); tensao(c, 'filho', 6); lembrarCom(c.v, ex.id, 'Continuou sendo recebido na sua casa depois da separação.'.replace('recebido', `recebid${o(ex)}`), 'apoio', 2); }
          };
        }
      },
      {
        id: 'ouvir', texto: 'Ligar, ouvir e não se meter',
        consequencia: c => `Você fica por perto sem mudar a rotina de ninguém; ${c.p.filho.nome} sabe que pode ligar.`,
        resolver: c => ({ texto: `${c.p.filho.nome} falou por uma hora e desligou dizendo que estava bem.`, memoria: null, efeito: () => { feito(c, `bio_separacao_${c.p.filho.id}`); prox(c, 'filho', 4); } })
      }
    ]
  },

  /* ================================================== A casa esvaziou */
  {
    id: 'bio_ninho_vazio', tipo: 'decisao', idade: [40, 70], tema: 'amor', prioritario: true, prioridade: 2,
    papeis: { par: conjugeEmCasa },
    quando: c => ninhoVazio(c.v),
    titulo: 'A casa ficou grande',
    texto: c => {
      const par = c.p.par;
      const vin = c.v.vinculos[par.id];
      const u = ultimaSaida(c.v)!;
      const velho = filhosVivos(c.v).sort((a, b) => a.tNasc - b.tNasc)[0];
      const env = vin.romance?.envolvimento ?? 50;
      const crises = crisesDoCasal(vin);
      const clima = vin.tensao >= 40 || env < 45
        ? `Sem os filhos no meio, fica mais à vista o que ficou entre vocês${crises ? `: ${crises === 1 ? 'a crise' : `as ${numero(crises)} crises`} que atravessaram não foi${crises === 1 ? '' : 'ram'} bem resolvida${crises === 1 ? '' : 's'}` : ''}. As conversas com ${par.nome} andam curtas.`
        : env >= 65 && vin.tensao < 30
          ? `${par.nome} tem falado das coisas que vocês adiaram por anos${crises ? ` — e vocês já atravessaram ${crises === 1 ? 'uma crise' : `${numero(crises)} crises`} juntos` : ''}.`
          : `A mesa do jantar ficou comprida para dois.`;
      return `${u.f.nome} saiu de casa em ${anoDe(u.t)}. Pela primeira vez desde que ${velho.nome} nasceu, há ${idadePessoa(c.v, velho)} anos, a casa é só sua e de ${par.nome}. ${clima}`;
    },
    opcoes: [
      {
        id: 'viagem', texto: 'Uma viagem só de vocês dois', comportamento: { familia: 1 },
        disponivel: c => custa(c, custoViagem(c.v), 'Não há dinheiro guardado para viajar.'),
        consequencia: c => `Custa ${fmt(custoViagem(c.v))}. ${c.v.vinculos[c.p.par.id].tensao >= 40 ? 'Pode aproximar — ou deixar o silêncio mais evidente, longe de casa.' : `Aproxima você e ${c.p.par.nome}.`}`,
        resolver: c => {
          const tenso = c.v.vinculos[c.p.par.id].tensao >= 40;
          return {
            texto: tenso ? `Uma semana na praia. Nos primeiros dias, vocês quase não se falaram; no último, ficaram até tarde na varanda.` : `Uma semana fora, sem hora para nada. ${c.p.par.nome} voltou falando da próxima.`,
            memoria: `Com a casa vazia, viajou com ${c.p.par.nome}, só os dois.`, tom: 'bom',
            efeito: () => { pagar(c.v, custoViagem(c.v)); envolvimento(c, 'par', tenso ? 4 : 8); tensao(c, 'par', -8); feliz(c, 3); lembrarCom(c.v, c.p.par.id, 'Viajaram só os dois, quando os filhos saíram de casa.', 'ritual', 2); }
          };
        }
      },
      {
        id: 'projeto', texto: 'Começar uma coisa juntos: dança de salão, uma noite por semana', comportamento: { familia: 1, sociabilidade: 1 },
        disponivel: c => rotinaCabe(c.v, 'danca'),
        consequencia: () => 'Uma noite fixa por semana, dos dois (entra na sua semana como atividade).',
        resolver: c => ({
          texto: `Na primeira aula, ${c.p.par.nome} pisou no seu pé quatro vezes. Na quarta aula, três.`,
          memoria: `Começou a fazer dança de salão com ${c.p.par.nome}.`, tom: 'bom',
          efeito: () => { comecarRotina(c.v, 'danca'); envolvimento(c, 'par', 6); tensao(c, 'par', -4); lembrarCom(c.v, c.p.par.id, 'Começaram a dançar juntos, depois que a casa esvaziou.', 'ritual', 2); }
        })
      },
      {
        id: 'terapia', texto: 'Admitir a distância e procurar terapia de casal', comportamento: { empatia: 1 },
        disponivel: c => { const vin = c.v.vinculos[c.p.par.id]; return vin.tensao >= 30 || (vin.romance?.envolvimento ?? 50) < 55 || crisesDoCasal(vin) >= 2 ? custa(c, 2400, 'Não há dinheiro para as sessões.') : false; },
        consequencia: c => `Doze sessões, ${fmt(2400)}. ${c.v.vinculos[c.p.par.id].confianca >= 50 ? 'Com a confiança que existe, tende a aproximar.' : 'A confiança está baixa: ajuda, mas devagar.'}`,
        resolver: c => {
          const conf = c.v.vinculos[c.p.par.id].confianca >= 50;
          return {
            texto: conf ? `Na sexta sessão, ${c.p.par.nome} disse uma coisa que você nunca tinha ouvido. Voltaram para casa de mãos dadas.` : `As sessões foram duras. Algumas terminaram em silêncio no carro. Mas continuaram indo.`,
            memoria: `Fez terapia de casal com ${c.p.par.nome} quando os filhos saíram de casa.`,
            efeito: () => { pagar(c.v, 2400); tensao(c, 'par', -15); envolvimento(c, 'par', conf ? 10 : 4); lembrarCom(c.v, c.p.par.id, 'Fizeram terapia de casal.', 'reconciliacao', 2); }
          };
        }
      },
      {
        id: 'menor', texto: 'Vender a casa e ir para um apartamento menor', comportamento: { independencia: 1 },
        disponivel: c => (trocaDeCasa(c.v) ? true : false),
        consequencia: c => { const x = trocaDeCasa(c.v)!; return `Vende ${x.casa.nome} por cerca de ${fmt(x.venda)} e compra um apartamento de dois quartos por ${fmt(x.preco)}: sobram ${fmt(x.sobra)}. Os quartos dos filhos deixam de existir.`; },
        resolver: c => {
          const quem = filhosVivos(c.v).map(f => f.nome);
          const x = trocaDeCasa(c.v)!;
          return {
            texto: `A mudança levou três fins de semana. As caixas com os desenhos da escola foram para ${quem.length === 1 ? quem[0] : 'os filhos'}.`,
            memoria: `Vendeu ${x.casa.nome}, onde os filhos cresceram, e foi com ${c.p.par.nome} para um apartamento menor.`, relevancia: 'marco',
            efeito: () => { trocarDeCasa(c.v, quem); envolvimento(c, 'par', 2); lembrarCom(c.v, c.p.par.id, 'Trocaram a casa dos filhos por um apartamento menor.', 'casa', 2); }
          };
        }
      },
      {
        id: 'nada', texto: 'Deixar a rotina se ajeitar sozinha',
        consequencia: c => (c.v.vinculos[c.p.par.id].tensao >= 40 ? 'Nada muda por agora — e a distância que já existe pode crescer.' : 'Nada muda por agora.'),
        resolver: c => ({ texto: 'A casa continuou quieta.', memoria: null, efeito: () => { if (c.v.vinculos[c.p.par.id].tensao >= 40) envolvimento(c, 'par', -4); } })
      }
    ]
  },

  /* ======================================== O filho adulto olha para trás */
  {
    id: 'bio_filho_lembra', tipo: 'decisao', idade: [45, 100], tema: 'filhos', prioritario: true, prioridade: 1, repetir: 0,
    papeis: { filho: v => P.filho(25, 55)(v).filter(f => !temFato(v, `bio_lembra_${f.id}`) && v.vinculos[f.id].presenca !== undefined && !!ocasiaoDeOlhar(v, f)) },
    titulo: c => `${c.p.filho.nome} lembra`,
    texto: c => {
      const f = c.p.filho;
      const b = balanco(c.v, f);
      return `Numa conversa na cozinha, ${ocasiaoDeOlhar(c.v, f)}, ${f.nome} começou a falar da infância. ${b.fala}`;
    },
    opcoes: [
      {
        id: 'ouvir', texto: 'Ouvir até o fim, sem se defender', comportamento: { empatia: 1 },
        consequencia: c => `${c.p.filho.nome} se sente ouvid${o(c.p.filho)}; a conversa fica entre vocês.`,
        resolver: c => ({
          texto: `Você não interrompeu. No fim, ${c.p.filho.nome} ficou em silêncio um tempo e depois pediu mais café.`,
          memoria: null,
          efeito: () => { feito(c, `bio_lembra_${c.p.filho.id}`); prox(c, 'filho', 6); tensao(c, 'filho', balanco(c.v, c.p.filho).tom === 'cobranca' ? -8 : -4); lembrarCom(c.v, c.p.filho.id, 'Uma conversa longa sobre a infância.', 'antigo', 2); }
        })
      },
      {
        id: 'desculpas', texto: 'Pedir desculpas pelo que faltou', comportamento: { empatia: 1, familia: 1 },
        disponivel: c => (balanco(c.v, c.p.filho).tom === 'gratidao' ? false : true),
        consequencia: c => `Pesa dizer. ${c.p.filho.nome} passa a confiar mais em você, e o atrito antigo diminui.`,
        resolver: c => ({
          texto: `"Eu fiz o que sabia, e às vezes foi pouco." ${c.p.filho.nome} segurou a sua mão por cima da mesa.`,
          memoria: `Pediu desculpas a ${c.p.filho.nome} pelo que faltou na infância.`, tom: 'bom',
          efeito: () => { feito(c, `bio_lembra_${c.p.filho.id}`); prox(c, 'filho', 10); tensao(c, 'filho', -15); c.v.vinculos[c.p.filho.id].confianca = clamp(c.v.vinculos[c.p.filho.id].confianca + 6); lembrarCom(c.v, c.p.filho.id, 'Você pediu desculpas pelo que faltou.', 'reconciliacao', 3); }
        })
      },
      {
        id: 'explicar', texto: 'Explicar como era a vida naquela época',
        disponivel: c => (balanco(c.v, c.p.filho).tom === 'gratidao' ? false : true),
        consequencia: c => (c.v.vinculos[c.p.filho.id].confianca >= 55 ? `Com a confiança entre vocês, ${c.p.filho.nome} tende a entender.` : `A confiança entre vocês é pouca: pode soar como defesa e reabrir a ferida.`),
        resolver: c => {
          const conf = c.v.vinculos[c.p.filho.id].confianca >= 55;
          return {
            texto: conf ? `${c.p.filho.nome} ouviu e disse que nunca tinha pensado por esse lado.` : `"Sempre tem uma explicação", ${c.p.filho.nome} respondeu, e mudou de assunto.`,
            memoria: null,
            efeito: () => { feito(c, `bio_lembra_${c.p.filho.id}`); if (conf) { prox(c, 'filho', 3); tensao(c, 'filho', -4); } else { prox(c, 'filho', -4); tensao(c, 'filho', 8); } }
          };
        }
      },
      {
        id: 'agradecer', texto: c => `Dizer que também aprendeu muito com ${c.p.filho.nome}`, comportamento: { empatia: 1 },
        disponivel: c => (balanco(c.v, c.p.filho).tom === 'gratidao' ? true : false),
        consequencia: c => `Aproxima vocês dois; vira uma lembrança de ${c.p.filho.nome}.`,
        resolver: c => ({
          texto: `${c.p.filho.nome} riu, meio sem jeito, e contou a história de volta — do jeito que lembrava.`,
          memoria: `${c.p.filho.nome} agradeceu pela infância; foi uma conversa que ficou.`, tom: 'bom',
          efeito: () => { feito(c, `bio_lembra_${c.p.filho.id}`); prox(c, 'filho', 8); lembrarCom(c.v, c.p.filho.id, 'Uma conversa sobre a infância, cheia de gratidão.', 'antigo', 3); }
        })
      }
    ]
  },

  /* ==================================================== O primeiro neto */
  {
    id: 'bio_primeiro_neto', tipo: 'decisao', idade: [35, 100], tema: 'familia', prioritario: true, prioridade: 3,
    papeis: { neto: v => P.neto(0, 2)(v).filter(n => v.vinculos[n.id].parentesco === 'neto' && n.genitores?.some(g => ['filho', 'enteado'].includes(v.vinculos[g]?.parentesco ?? ''))) },
    quando: c => { const t = c.v.fatos['virou_avo']; return t !== undefined && c.v.t - t < 24; },
    titulo: c => c.p.neto.nome,
    texto: c => {
      const n = c.p.neto;
      const pai = paiDoNeto(c.v, n)!;
      const outro = n.genitores?.map(id => c.v.pessoas[id]).find(p => p && p.id !== pai.id);
      const perto = mesmaCidade(c.v, pai);
      return `${n.nome} ainda cabe num braço só. ${pai.nome}${outro ? ` e ${outro.nome}` : ''} ${perto ? 'moram a poucos minutos de você' : `moram em ${cidadeDe(pai.municipioId)}`}${pai.renda > 0 && pai.ocupacao ? `, e ${pai.nome} volta logo ao trabalho de ${pai.ocupacao}` : ''}. Ser ${nomeDoAvo(c)}, aos ${c.idade}, pode ser muita coisa.`;
    },
    opcoes: [
      {
        id: 'perto', texto: c => `Estar com ${c.p.neto.nome} toda semana`, comportamento: { familia: 2 },
        disponivel: c => (mesmaCidade(c.v, paiDoNeto(c.v, c.p.neto)!) ? rotinaCabe(c.v, 'tempo_familia') : 'Moram longe demais para toda semana.'),
        consequencia: c => `Um pedaço fixo da semana (tempo com a família). ${c.p.neto.nome} cresce perto de você.`,
        resolver: c => {
          const pai = paiDoNeto(c.v, c.p.neto)!;
          return {
            texto: `Quarta-feira virou o dia de ${c.p.neto.nome}. ${pai.nome} deixa a bolsa de fraldas na porta e sai correndo.`,
            memoria: `${c.g('Avô', 'Avó', 'Avó')} de primeira viagem, passou a ficar com ${c.p.neto.nome} toda semana.`, tom: 'bom',
            efeito: () => { comecarRotina(c.v, 'tempo_familia'); prox(c, 'neto', 12); const vn = c.v.vinculos[c.p.neto.id]; vn.presenca = Math.max(vn.presenca ?? 0, 45); mexer(c.v, pai.id, { prox: 6 }); lembrarCom(c.v, c.p.neto.id, 'Toda quarta-feira, desde bebê, na casa de vocês.', 'ritual', 2); }
          };
        }
      },
      {
        id: 'dinheiro', texto: 'Ajudar com dinheiro: fraldas, creche, o que faltar', comportamento: { generosidade: 1 },
        disponivel: c => custa(c, ajudaNeto(c.v), 'Não há dinheiro guardado para isso.'),
        consequencia: c => `Saem ${fmt(ajudaNeto(c.v))} do que você tem; ${paiDoNeto(c.v, c.p.neto)!.nome} respira no primeiro ano.`,
        resolver: c => {
          const pai = paiDoNeto(c.v, c.p.neto)!;
          return {
            texto: `${pai.nome} agradeceu por mensagem, com foto de ${c.p.neto.nome} dormindo.`,
            memoria: `Ajudou ${pai.nome} com as despesas do primeiro ano de ${c.p.neto.nome}.`,
            efeito: () => { pagar(c.v, ajudaNeto(c.v)); mexer(c.v, pai.id, { prox: 8, confianca: 4 }); lembrarCom(c.v, pai.id, `Você ajudou com as despesas quando ${c.p.neto.nome} nasceu.`, 'apoio', 2); }
          };
        }
      },
      {
        id: 'visita', texto: c => `Ser ${nomeDoAvo(c)} de visita, sem mudar a sua vida`, comportamento: { independencia: 1 },
        consequencia: c => `Sua rotina segue igual; o laço com ${c.p.neto.nome} cresce no ritmo das visitas.`,
        resolver: () => ({ texto: `Você aparece nos aniversários e nos domingos que dá.`, memoria: null })
      }
    ]
  },

  /* ============================================== O neto adolescente */
  {
    id: 'bio_neto_adolescente', tipo: 'decisao', idade: [50, 110], tema: 'familia', prioritario: true, prioridade: 1, repetir: 0,
    papeis: { neto: v => P.neto(15, 15)(v).filter(n => !temFato(v, `bio_neto15_${n.id}`)) },
    titulo: c => `${c.p.neto.nome}, quinze anos`,
    texto: c => {
      const n = c.p.neto;
      const vin = c.v.vinculos[n.id];
      const pai = paiDoNeto(c.v, n);
      const quanto = (vin.presenca ?? 0) >= 40 ? `ainda passa na sua casa depois da escola` : mesmaCidade(c.v, n) ? `aparece pouco — quinze anos é idade de ter a própria turma` : `mora em ${cidadeDe(n.municipioId)}, e vocês se veem nas férias`;
      return `${n.nome}${pai ? `, ${flex(n.genero, 'filho', 'filha', 'filhe')} de ${pai.nome},` : ''} fez quinze anos e ${quanto}.`;
    },
    opcoes: [
      {
        id: 'viagem', texto: c => `Chamar ${c.p.neto.nome} para uma viagem só vocês dois`, comportamento: { familia: 1 },
        disponivel: c => custa(c, custoViagem(c.v), 'Não há dinheiro guardado para viajar.'),
        consequencia: c => `Custa ${fmt(custoViagem(c.v))}. Vira uma lembrança de ${c.p.neto.nome} com você.`,
        resolver: c => ({
          texto: `Uma semana de estrada. ${c.p.neto.nome} escolheu as músicas do carro e tirou mais fotos do que você.`,
          memoria: `Viajou com ${c.p.neto.nome}, aos quinze anos, só os dois.`, tom: 'bom',
          efeito: () => { feito(c, `bio_neto15_${c.p.neto.id}`); pagar(c.v, custoViagem(c.v)); prox(c, 'neto', 14); lembrarCom(c.v, c.p.neto.id, 'Uma viagem só vocês dois, aos quinze anos.', 'ritual', 3); }
        })
      },
      {
        id: 'ensinar', texto: c => { const d = melhorFrente(c.v); return d ? `Ensinar ${c.p.neto.nome} a ${VERBO[d]}` : 'Ensinar algo que você sabe'; }, comportamento: { familia: 1 },
        disponivel: c => (melhorFrente(c.v) ? true : false),
        consequencia: c => `Algumas tardes por mês com ${c.p.neto.nome}; o que você sabe passa adiante.`,
        resolver: c => {
          const d = melhorFrente(c.v)!;
          return {
            texto: `As primeiras tardes foram desajeitadas. Na quinta, ${c.p.neto.nome} pediu para continuar.`,
            memoria: `Ensinou ${c.p.neto.nome} a ${VERBO[d]}.`,
            efeito: () => { feito(c, `bio_neto15_${c.p.neto.id}`); prox(c, 'neto', 10); lembrarCom(c.v, c.p.neto.id, `Você ensinou a ${VERBO[d]}.`, 'ritual', 2); }
          };
        }
      },
      {
        id: 'deixar', texto: 'Deixar que venha quando quiser',
        consequencia: c => `Nada muda; ${c.p.neto.nome} sabe onde você mora.`,
        resolver: c => ({ texto: 'Você deixou a porta aberta e o bolo de sempre no domingo.', memoria: null, efeito: () => feito(c, `bio_neto15_${c.p.neto.id}`) })
      }
    ]
  },

  /* ======================================================= As bodas */
  {
    id: 'bio_bodas', tipo: 'decisao', idade: [43, 110], tema: 'amor', prioritario: true, prioridade: 2, repetir: 20,
    papeis: { par: v => P.conjuge(v).filter(p => { const m = marcoDasBodas(v, p); return !!m && !temFato(v, `bodas_${p.id}_${m}`); }) },
    titulo: c => (marcoDasBodas(c.v, c.p.par) === 50 ? 'Bodas de ouro' : 'Bodas de prata'),
    texto: c => {
      const par = c.p.par;
      const m = marcoDasBodas(c.v, par)!;
      const vin = c.v.vinculos[par.id];
      return `${m === 50 ? 'Cinquenta' : 'Vinte e cinco'} anos desde que você e ${par.nome} começaram, em ${anoDe(vin.romance?.tInicio ?? vin.tInicio)}. ${historiaDoCasal(c.v, par)}`;
    },
    opcoes: [
      {
        id: 'festa', texto: c => (filhosEmComum(c.v, c.p.par.id).some(f => f.vivo) ? 'Uma festa com os filhos e quem fez parte' : 'Uma festa com quem fez parte'), comportamento: { sociabilidade: 1, familia: 1 },
        disponivel: c => custa(c, custoDaFesta(c.v), 'Não há dinheiro guardado para uma festa.'),
        consequencia: c => `Custa ${fmt(custoDaFesta(c.v))}. ${c.p.par.nome} e a família guardam a data.`,
        resolver: c => {
          const m = marcoDasBodas(c.v, c.p.par)!;
          const filhos = filhosEmComum(c.v, c.p.par.id).filter(f => f.vivo);
          return {
            texto: `${filhos.length ? `${filhos[0].nome} fez a lista de convidados; ` : ''}o salão encheu. Alguém pôs a música do começo de vocês, e a pista abriu sozinha.`,
            memoria: `Festejou ${m === 50 ? 'as bodas de ouro' : 'as bodas de prata'} com ${c.p.par.nome}${filhos.length ? ', com os filhos' : ''}.`, tom: 'bom', relevancia: 'marco',
            efeito: () => {
              feito(c, `bodas_${c.p.par.id}_${m}`); pagar(c.v, custoDaFesta(c.v)); envolvimento(c, 'par', 8); feliz(c, 4);
              for (const f of filhos) mexer(c.v, f.id, { prox: 3 });
              lembrarCom(c.v, c.p.par.id, m === 50 ? 'Bodas de ouro, com festa.' : 'Bodas de prata, com festa.', 'casamento', 3);
            }
          };
        }
      },
      {
        id: 'votos', texto: 'Renovar os votos, numa cerimônia pequena', comportamento: { familia: 1 },
        consequencia: c => `Pouco dinheiro, muita coisa dita em voz alta. Aproxima você e ${c.p.par.nome}${c.v.vinculos[c.p.par.id].tensao >= 40 ? ', mesmo com o clima de agora' : ''}.`,
        resolver: c => {
          const m = marcoDasBodas(c.v, c.p.par)!;
          return {
            texto: `${c.p.par.nome} escreveu os votos num guardanapo e leu tremendo. Você leu os seus de cor.`,
            memoria: `Renovou os votos com ${c.p.par.nome} ${m === 50 ? 'nas bodas de ouro' : 'nas bodas de prata'}.`, tom: 'bom', relevancia: 'marco',
            efeito: () => { feito(c, `bodas_${c.p.par.id}_${m}`); dinheiro(c, -800); envolvimento(c, 'par', 10); tensao(c, 'par', -10); lembrarCom(c.v, c.p.par.id, m === 50 ? 'Renovaram os votos nas bodas de ouro.' : 'Renovaram os votos nas bodas de prata.', 'casamento', 3); }
          };
        }
      },
      {
        id: 'jantar', texto: 'Um jantar a dois, sem alarde',
        consequencia: c => `Quase nada muda; a data fica entre você e ${c.p.par.nome}.`,
        resolver: c => {
          const m = marcoDasBodas(c.v, c.p.par)!;
          return {
            texto: `O restaurante de sempre, a mesa do canto. ${c.p.par.nome} pediu o mesmo prato de ${m === 50 ? 'cinquenta' : 'vinte e cinco'} anos atrás.`,
            memoria: `${m === 50 ? 'Bodas de ouro' : 'Bodas de prata'} com ${c.p.par.nome}, num jantar a dois.`,
            efeito: () => { feito(c, `bodas_${c.p.par.id}_${m}`); dinheiro(c, -300); envolvimento(c, 'par', 4); lembrarCom(c.v, c.p.par.id, m === 50 ? 'Bodas de ouro.' : 'Bodas de prata.', 'casamento', 3); }
          };
        }
      }
    ]
  },

  /* ================================================= Os pais envelhecem */
  {
    id: 'bio_pais_envelhecem', tipo: 'decisao', idade: [30, 85], tema: 'familia', prioritario: true, prioridade: 2, repetir: 4,
    papeis: {
      genitor: v => vinculosVivos(v).filter(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai') && !moraJunto(x.vin) && idadePessoa(v, x.p) >= 75
        && (x.p.saude < 45 || (x.p.aperto?.tipo === 'doenca' && v.t - x.p.aperto.t < 24))).map(x => x.p)
    },
    quando: c => !moraComFamiliaDeOrigem(c.v),
    titulo: c => `${c.p.genitor.nome}, ${idadePessoa(c.v, c.p.genitor)} anos`,
    texto: c => {
      const p = c.p.genitor;
      const recente = p.aperto?.tipo === 'doenca' && c.v.t - p.aperto.t < 24;
      const par = p.parceiroId ? c.v.pessoas[p.parceiroId] : undefined;
      const { perto, longe } = irmaosNaCidade(c.v, p.municipioId);
      const irmaos = perto.length || longe.length
        ? ` ${perto.length ? `${listaNatural(perto.map(x => x.nome))} ${perto.length > 1 ? 'moram' : 'mora'} perto ${dele(p)}` : ''}${perto.length && longe.length ? '; ' : ''}${longe.length ? `${listaNatural(longe.map(x => x.nome))} ${longe.length > 1 ? 'moram' : 'mora'} longe` : ''}.`
        : '';
      return `${seuGenitor(p).replace(/^s/, 'S')}, ${p.nome}, ${recente ? 'voltou do hospital mais devagar do que foi' : 'tem tido a saúde fraca'}. ${par?.vivo ? `Mora com ${par.nome}` : `Mora sozinh${o(p)}`}${p.municipioId !== c.v.moradia.municipioId ? `, em ${cidadeDe(p.municipioId)}` : ', na sua cidade'}.${irmaos}`;
    },
    opcoes: [
      {
        id: 'consultas', texto: c => `Acompanhar ${c.p.genitor.nome} nas consultas`, comportamento: { familia: 1 },
        consequencia: c => `${c.p.genitor.municipioId !== c.v.moradia.municipioId ? 'Viagens a cada consulta (tempo e passagem). ' : ''}Os médicos passam a ter quem pergunte; a saúde ${dele(c.p.genitor)} ganha cuidado, e a sua semana perde um pedaço.`,
        resolver: c => ({
          texto: `Você passou a guardar os exames numa pasta azul. O cardiologista já sabe o seu nome.`,
          memoria: `Passou a acompanhar ${c.p.genitor.nome} nas consultas.`,
          efeito: () => { c.p.genitor.saude = clamp(c.p.genitor.saude + 5); prox(c, 'genitor', 8); estresse(c, 3); if (c.p.genitor.municipioId !== c.v.moradia.municipioId) dinheiro(c, -1500); lembrarCom(c.v, c.p.genitor.id, 'Você passou a ir junto nas consultas.', 'apoio', 2); }
        })
      },
      {
        id: 'cuidadora', texto: 'Pagar uma cuidadora algumas horas por dia', comportamento: { generosidade: 1 },
        disponivel: c => custa(c, 14000, 'Não há dinheiro guardado para um ano de cuidadora.'),
        consequencia: c => `Cerca de ${fmt(14000)} por ano. ${c.p.genitor.nome} fica menos só e mais segur${o(c.p.genitor)}; sua rotina não muda.`,
        resolver: c => ({
          texto: `A cuidadora chega às oito e sai às duas. ${c.p.genitor.nome} reclamou na primeira semana e na segunda já contava a vida para ela.`,
          memoria: `Contratou uma cuidadora para ${c.p.genitor.nome}.`,
          efeito: () => { pagar(c.v, 14000); c.p.genitor.saude = clamp(c.p.genitor.saude + 7); prox(c, 'genitor', 4); lembrarCom(c.v, c.p.genitor.id, 'Você pagou uma cuidadora.', 'apoio', 2); }
        })
      },
      {
        id: 'trazer', texto: c => `Trazer ${c.p.genitor.nome} para morar com você`, comportamento: { familia: 2 },
        disponivel: c => (moraComFamiliaDeOrigem(c.v) ? 'Você não mora numa casa sua.' : true),
        consequencia: c => `${c.p.genitor.nome} ${c.p.genitor.municipioId !== c.v.moradia.municipioId ? 'muda de cidade e ' : ''}passa a morar com você: companhia e cuidado de perto, e uma casa que muda para todo mundo. A resposta é ${dele(c.p.genitor)}.`,
        resolver: c => {
          const p = c.p.genitor;
          const vin = c.v.vinculos[p.id];
          const aceita = vin.proximidade >= 40 && vin.tensao < 45;
          const par = p.parceiroId ? c.v.pessoas[p.parceiroId] : undefined;
          return aceita
            ? {
              texto: `${p.nome} disse que não queria dar trabalho — e veio${par?.vivo ? ` com ${par.nome}` : ''}. O quarto dos fundos ganhou uma barra no banheiro.`,
              memoria: `${p.nome} veio morar com você, já com a saúde fraca.`, relevancia: 'marco',
              efeito: () => {
                for (const x of [p, ...(par?.vivo && c.v.vinculos[par.id] ? [par] : [])]) { const vx = c.v.vinculos[x.id]; if (!vx.convivio.includes('casa')) vx.convivio.push('casa'); x.municipioId = c.v.moradia.municipioId; vx.tUltimoContato = c.v.t; }
                prox(c, 'genitor', 8); estresse(c, 5); p.saude = clamp(p.saude + 4);
                lembrarCom(c.v, p.id, 'Veio morar com você na velhice.', 'casa', 3);
              }
            }
            : { texto: `${p.nome} agradeceu e disse que não sai da casa de sempre.`, memoria: null, efeito: () => { prox(c, 'genitor', 3); lembrarCom(c.v, p.id, 'Você ofereceu a sua casa na velhice.', 'apoio', 1); } };
        }
      },
      {
        id: 'dividir', texto: c => `Dividir o cuidado com ${listaNatural(irmaosVivos(c.v).filter(x => idadePessoa(c.v, x) >= 18).map(x => x.nome))}`, comportamento: { familia: 1 },
        disponivel: c => (irmaosVivos(c.v).some(x => idadePessoa(c.v, x) >= 18) ? true : false),
        consequencia: () => 'Cada um fica com uma parte (consultas, remédios, fins de semana). Como vai depender de quanto vocês se falam hoje.',
        resolver: c => {
          const irmaos = irmaosVivos(c.v).filter(x => idadePessoa(c.v, x) >= 18);
          const topam = irmaos.filter(x => c.v.vinculos[x.id].proximidade >= 45 && c.v.vinculos[x.id].tensao < 40);
          const nao = irmaos.filter(x => !topam.includes(x));
          return {
            texto: topam.length
              ? `Montaram uma escala num grupo de mensagens: ${listaNatural(topam.map(x => x.nome))} ${topam.length > 1 ? 'ficaram' : 'ficou'} com parte dos dias.${nao.length ? ` ${listaNatural(nao.map(x => x.nome))} disse${nao.length > 1 ? 'ram' : ''} que não tinha${nao.length > 1 ? 'm' : ''} como.` : ''}`
              : `${listaNatural(nao.map(x => x.nome))} disse${nao.length > 1 ? 'ram' : ''} que não tinha${nao.length > 1 ? 'm' : ''} como. O grosso ficou com você.`,
            memoria: `Dividiu com os irmãos o cuidado de ${c.p.genitor.nome}.`,
            efeito: () => {
              for (const x of topam) mexer(c.v, x.id, { prox: 5 });
              for (const x of nao) mexer(c.v, x.id, { tensao: 12 });
              c.p.genitor.saude = clamp(c.p.genitor.saude + (topam.length ? 5 : 2));
              prox(c, 'genitor', 5); estresse(c, topam.length ? 2 : 5);
              for (const x of nao) lembrarCom(c.v, x.id, `Não dividiu o cuidado de ${c.p.genitor.nome}.`, 'conflito', 2);
            }
          };
        }
      }
    ]
  },

  /* ============================================ Os irmãos depois dos pais */
  {
    id: 'bio_irmaos_depois', tipo: 'decisao', idade: [30, 100], tema: 'familia', prioritario: true, prioridade: 1,
    papeis: { irmao: v => irmaosVivos(v).filter(p => idadePessoa(v, p) >= 18 && (v.vinculos[p.id].tensao >= 25 || v.vinculos[p.id].proximidade < 45)) },
    quando: c => { const u = ultimoGenitorMorto(c.v); return !!u && c.v.t - (u.tMorte ?? 0) >= 12 && c.v.t - (u.tMorte ?? 0) <= 72; },
    titulo: c => c.p.irmao.nome,
    texto: c => {
      const u = ultimoGenitorMorto(c.v)!;
      const x = c.p.irmao;
      const vin = c.v.vinculos[x.id];
      const briga = vin.historia.find(h => h.tipo === 'conflito' && /casa|Justiça|cuidado/i.test(h.texto));
      const par = x.parceiroId && c.v.pessoas[x.parceiroId] ? c.v.pessoas[x.parceiroId] : undefined;
      const uniao = c.v.fatos[`irmao_uniao_${x.id}`];
      return `Desde que ${u.nome} morreu, em ${anoDe(u.tMorte!)}, não existe mais a casa de ${flex(u.genero, 'pai', 'mãe', 'mãe')} para juntar todo mundo. ${x.nome} ${x.municipioId !== c.v.moradia.municipioId ? `mora em ${cidadeDe(x.municipioId)}` : 'mora na mesma cidade que você'}${par?.vivo ? `, com ${par.nome}${uniao !== undefined ? ` desde ${anoDe(uniao)}` : ''}` : ''}. ${briga ? `${briga.texto.replace(/\.$/, '')} — e isso ainda está entre vocês.` : vin.tensao >= 40 ? 'As conversas terminam rápido.' : 'Vocês se falam nos aniversários, quando lembram.'}`;
    },
    opcoes: [
      {
        id: 'visitar', texto: c => `Ir até ${c.p.irmao.nome}, sem motivo especial`, comportamento: { familia: 1 },
        consequencia: c => `${c.p.irmao.municipioId !== c.v.moradia.municipioId ? `Uma viagem a ${cidadeDe(c.p.irmao.municipioId)}. ` : ''}${c.v.vinculos[c.p.irmao.id].tensao >= 40 ? 'Pode abrir a conversa que ficou para trás — ou esbarrar nela.' : 'Aproxima vocês.'}`,
        resolver: c => {
          const tenso = c.v.vinculos[c.p.irmao.id].tensao >= 40;
          return {
            texto: tenso ? `${c.p.irmao.nome} abriu a porta surpres${o(c.p.irmao)}. O café durou duas horas; o assunto difícil apareceu no fim, e ficou pela metade.` : `Vocês passaram a tarde vendo fotos antigas. ${c.p.irmao.nome} lembrava de coisas que você tinha esquecido.`,
            memoria: `Depois da morte dos pais, foi ver ${c.p.irmao.nome}.`,
            efeito: () => { tensao(c, 'irmao', tenso ? -12 : -5); prox(c, 'irmao', tenso ? 8 : 10); if (c.p.irmao.municipioId !== c.v.moradia.municipioId) dinheiro(c, -1200); lembrarCom(c.v, c.p.irmao.id, 'Você veio sem motivo, depois que os pais se foram.', 'reconciliacao', 2); }
          };
        }
      },
      {
        id: 'almoco', texto: c => `Chamar os irmãos para um almoço no aniversário de ${ultimoGenitorMorto(c.v)!.nome}`, comportamento: { familia: 1, sociabilidade: 1 },
        disponivel: c => (moraComFamiliaDeOrigem(c.v) ? 'Você não tem uma casa sua para receber.' : true),
        consequencia: () => 'Um almoço por ano, na sua casa. Pode virar costume — a casa dos pais passa a ser a sua.',
        resolver: c => {
          const todos = irmaosVivos(c.v).filter(x => idadePessoa(c.v, x) >= 18);
          const vieram = todos.filter(x => c.v.vinculos[x.id].tensao < 55);
          return {
            texto: `${vieram.length ? `${listaNatural(vieram.map(x => x.nome))} ${vieram.length > 1 ? 'vieram' : 'veio'}` : 'Ninguém confirmou; você fez o almoço mesmo assim'}. Alguém trouxe a receita de ${ultimoGenitorMorto(c.v)!.nome}.`,
            memoria: 'Passou a reunir os irmãos no aniversário dos pais.',
            efeito: () => { dinheiro(c, -500); for (const x of vieram) { mexer(c.v, x.id, { prox: 6, tensao: -6 }); lembrarCom(c.v, x.id, 'Almoço dos irmãos, no aniversário dos pais.', 'ritual', 2); } }
          };
        }
      },
      {
        id: 'deixar', texto: 'Deixar como está',
        consequencia: c => `Nada muda; cada um segue a sua vida, e ${c.p.irmao.nome} fica mais longe.`,
        resolver: c => ({ texto: 'A vida seguiu. Os aniversários viraram mensagem.', memoria: null, efeito: () => prox(c, 'irmao', -4) })
      }
    ]
  },

  /* ======================================================= O irmão separou */
  {
    id: 'bio_irmao_separou', tipo: 'decisao', idade: [25, 95], tema: 'familia', prioritario: true, prioridade: 1, repetir: 3,
    papeis: { irmao: v => irmaosVivos(v).filter(p => p.aperto?.tipo === 'separacao' && v.t - p.aperto.t < 12) },
    titulo: c => `${c.p.irmao.nome} se separou`,
    texto: c => {
      const x = c.p.irmao;
      const uniao = c.v.fatos[`irmao_uniao_${x.id}`];
      return `${x.nome} se separou${uniao !== undefined ? ` depois de ${Math.max(1, anosDesde(c.v, uniao))} anos` : ''}. ${x.municipioId !== c.v.moradia.municipioId ? `Está em ${cidadeDe(x.municipioId)}, ` : 'Está '}num apartamento emprestado${x.renda === 0 ? ', e sem trabalho' : ''}.`;
    },
    opcoes: [
      {
        id: 'receber', texto: c => `Chamar ${c.p.irmao.nome} para passar uns dias na sua casa`, comportamento: { familia: 1 },
        disponivel: c => (moraComFamiliaDeOrigem(c.v) ? 'Você não tem uma casa sua para receber.' : true),
        consequencia: c => `Uns dias de casa cheia; ${c.p.irmao.nome} atravessa isso com você por perto.`,
        resolver: c => ({
          texto: `${c.p.irmao.nome} ficou uma semana. Na última noite, vocês ficaram acordados até tarde como quando eram crianças.`,
          memoria: `Recebeu ${c.p.irmao.nome} em casa depois da separação.`,
          efeito: () => { prox(c, 'irmao', 10); tensao(c, 'irmao', -6); c.p.irmao.aperto!.t -= 6; lembrarCom(c.v, c.p.irmao.id, 'Você recebeu em casa depois da separação.', 'apoio', 2); }
        })
      },
      {
        id: 'ligar', texto: 'Ligar toda semana por um tempo',
        consequencia: c => `Pouco custo; ${c.p.irmao.nome} sabe que pode contar com você.`,
        resolver: c => ({ texto: 'As ligações de domingo viraram costume por uns meses.', memoria: null, efeito: () => prox(c, 'irmao', 5) })
      },
      {
        id: 'deixar', texto: 'Mandar uma mensagem e respeitar o espaço',
        consequencia: () => 'Nada muda.',
        resolver: c => ({ texto: `${c.p.irmao.nome} respondeu com um "valeu".`, memoria: null })
      }
    ]
  },

  /* ===================================================== Amizade de décadas */
  {
    id: 'bio_amizade_decadas', tipo: 'decisao', idade: [35, 110], tema: 'amizade', prioritario: true, prioridade: 1, repetir: 0,
    papeis: { amigo: v => amigosDeVerdade(v).filter(x => { const m = marcoDaAmizade(v, x.vin); return !!m && !temFato(v, `bio_amizade_${x.p.id}_${m}`) && (x.vin.estagio === 'amigo_proximo' || x.vin.historia.length >= 3); }).map(x => x.p) },
    titulo: c => `${marcoDaAmizade(c.v, c.v.vinculos[c.p.amigo.id]) === 40 ? 'Quarenta' : 'Vinte e cinco'} anos de ${c.p.amigo.nome}`,
    texto: c => {
      const a = c.p.amigo;
      const vin = c.v.vinculos[a.id];
      const m = marcoMaisForte(vin);
      return `Faz ${anosDesde(c.v, vin.tInicio)} anos que você conheceu ${a.nome} ${descricaoOrigem(c.v, vin)}, aos ${idadeEm(c.v.eu.tNasc, vin.tInicio)}.${a.municipioId !== c.v.moradia.municipioId ? ` Hoje ${ele(a)} mora em ${cidadeDe(a.municipioId)}.` : ''}${m ? ` Da história de vocês, o que mais pesa: ${minusc(m.texto)}` : ''}`;
    },
    opcoes: [
      {
        id: 'reencontro', texto: c => `Juntar a turma de ${descricaoOrigem(c.v, c.v.vinculos[c.p.amigo.id]).replace(/^(n[oa]s?|por|pela) /, '')} para um reencontro`, comportamento: { sociabilidade: 1 },
        disponivel: c => (/^(na|no)/.test(descricaoOrigem(c.v, c.v.vinculos[c.p.amigo.id])) ? true : false),
        consequencia: c => `Uma noite, algum dinheiro, gente que você não vê há anos. Aproxima você de ${c.p.amigo.nome}.`,
        resolver: c => ({
          texto: `Vieram onze. Metade você só reconheceu pela risada. ${c.p.amigo.nome} fez o brinde.`,
          memoria: `Organizou com ${c.p.amigo.nome} um reencontro da turma de ${descricaoOrigem(c.v, c.v.vinculos[c.p.amigo.id]).replace(/^(n[oa]s?|por|pela) /, '')}.`, tom: 'bom',
          efeito: () => { feito(c, `bio_amizade_${c.p.amigo.id}_${marcoDaAmizade(c.v, c.v.vinculos[c.p.amigo.id])}`); dinheiro(c, -300); prox(c, 'amigo', 10); feliz(c, 3); lembrarCom(c.v, c.p.amigo.id, 'Juntaram a turma antiga, décadas depois.', 'ritual', 2); }
        })
      },
      {
        id: 'viagem', texto: c => `Uma viagem com ${c.p.amigo.nome}`, comportamento: { sociabilidade: 1 },
        disponivel: c => custa(c, custoViagem(c.v), 'Não há dinheiro guardado para viajar.'),
        consequencia: c => `Custa ${fmt(custoViagem(c.v))}. Uns dias só de vocês dois, como antes.`,
        resolver: c => ({
          texto: `Três dias numa pousada. Vocês riram das mesmas coisas de ${anosDesde(c.v, c.v.vinculos[c.p.amigo.id].tInicio)} anos atrás.`,
          memoria: `Viajou com ${c.p.amigo.nome} para festejar ${anosDesde(c.v, c.v.vinculos[c.p.amigo.id].tInicio)} anos de amizade.`, tom: 'bom',
          efeito: () => { feito(c, `bio_amizade_${c.p.amigo.id}_${marcoDaAmizade(c.v, c.v.vinculos[c.p.amigo.id])}`); pagar(c.v, custoViagem(c.v)); prox(c, 'amigo', 14); lembrarCom(c.v, c.p.amigo.id, 'Uma viagem pelos anos de amizade.', 'ritual', 3); }
        })
      },
      {
        id: 'ligar', texto: c => `Ligar para ${c.p.amigo.nome} e lembrar a data`,
        consequencia: c => `Não custa nada; ${c.p.amigo.nome} fica sabendo que você lembrou.`,
        resolver: c => ({ texto: `${c.p.amigo.nome} não sabia a data de cabeça. Riu e disse que você sempre foi ${c.g('o', 'a', 'e')} da memória.`, memoria: null, efeito: () => { feito(c, `bio_amizade_${c.p.amigo.id}_${marcoDaAmizade(c.v, c.v.vinculos[c.p.amigo.id])}`); prox(c, 'amigo', 4); } })
      }
    ]
  },

  /* ============================================= O amigo que foi embora */
  {
    id: 'bio_amigo_longe', tipo: 'decisao', idade: [35, 95], tema: 'amizade', prioritario: true, prioridade: 1, repetir: 0,
    papeis: {
      amigo: v => vinculosVivos(v).filter(x => !x.vin.parentesco && !x.p.especie && !x.vin.romance && x.p.municipioId !== v.moradia.municipioId && !temFato(v, `bio_amigo_longe_${x.p.id}`)
        && anosDesde(v, x.vin.tInicio) >= 15 && x.vin.proximidade >= 20 && x.vin.proximidade < 55
        && x.vin.historia.some(h => h.tipo === 'distancia' && /^Mudou-se/.test(h.texto) && v.t - h.t >= 60 && v.t - h.t < 72)).map(x => x.p)
    },
    titulo: c => `${c.p.amigo.nome}, em ${cidadeDe(c.p.amigo.municipioId)}`,
    texto: c => {
      const a = c.p.amigo;
      const vin = c.v.vinculos[a.id];
      const saiu = vin.historia.find(h => h.tipo === 'distancia' && /^Mudou-se/.test(h.texto))!;
      return `Faz ${anosDesde(c.v, saiu.t)} anos que ${a.nome} se mudou para ${cidadeDe(a.municipioId)}. Vocês se conheceram ${descricaoOrigem(c.v, vin)}, há ${anosDesde(c.v, vin.tInicio)} anos. Hoje, a conversa cabe num "feliz aniversário" por ano.`;
    },
    opcoes: [
      {
        id: 'visitar', texto: c => `Ir visitar ${c.p.amigo.nome}`, comportamento: { sociabilidade: 1 },
        disponivel: c => custa(c, 2000, 'Não há dinheiro guardado para a viagem.'),
        consequencia: () => `Passagem e uns dias fora (cerca de ${fmt(2000)}). A amizade volta a ter presença.`,
        resolver: c => ({
          texto: `${c.p.amigo.nome} foi buscar você na rodoviária e mostrou a cidade como se fosse ${dele(c.p.amigo)}. É.`,
          memoria: `Foi visitar ${c.p.amigo.nome} em ${cidadeDe(c.p.amigo.municipioId)}.`, tom: 'bom',
          efeito: () => { feito(c, `bio_amigo_longe_${c.p.amigo.id}`); pagar(c.v, 2000); prox(c, 'amigo', 18); lembrarCom(c.v, c.p.amigo.id, 'Você foi visitar, anos depois da mudança.', 'amizade', 2); }
        })
      },
      {
        id: 'chamada', texto: 'Marcar uma chamada de vídeo de verdade',
        consequencia: () => `Uma noite de conversa; aproxima um pouco, sem sair de casa.`,
        resolver: c => ({ texto: `Duas horas de chamada. ${c.p.amigo.nome} mostrou a casa nova, o cachorro, a vista.`, memoria: null, efeito: () => { feito(c, `bio_amigo_longe_${c.p.amigo.id}`); prox(c, 'amigo', 7); } })
      },
      {
        id: 'deixar', texto: 'Deixar a amizade ser o que virou',
        consequencia: c => `Nada muda; ${c.p.amigo.nome} vai ficando no passado.`,
        resolver: c => ({ texto: 'A mensagem de aniversário continua chegando, pontual.', memoria: null, efeito: () => { feito(c, `bio_amigo_longe_${c.p.amigo.id}`); prox(c, 'amigo', -3); } })
      }
    ]
  },

  /* ============================================ O plano que ficou no papel */
  {
    id: 'bio_plano_no_papel', tipo: 'decisao', idade: [33, 70], tema: 'estudo', prioritario: true, prioridade: 1,
    quando: c => !!planoPendente(c.v) && !c.v.educacao.matricula && !c.v.justica?.prisao,
    titulo: 'O plano que ficou no papel',
    texto: c => {
      const p = planoPendente(c.v)!;
      const i = idadeEm(c.v.eu.tNasc, p.t);
      const nada = p.chave === 'plano_concurso' ? 'nenhuma aprovação veio' : p.chave === 'quis_mudar_area' ? 'o trabalho continuou na mesma área' : 'nenhuma matrícula veio depois';
      const kids = filhoParaEstudar(c.v);
      return `Aos ${i}, você decidiu ${p.oque}. Faz ${anosDesde(c.v, p.t)} anos, e ${nada}.${kids.length ? ` ${listaNatural(kids.map(k => k.nome))} ${kids.length > 1 ? 'estão' : 'está'} na idade em que você fez esse plano.` : ''}`;
    },
    opcoes: [
      {
        id: 'tentar', texto: 'Tentar agora', comportamento: { disciplina: 1, coragem: 1 },
        disponivel: c => { const r = rotinaDoPlano(c.v, planoPendente(c.v)!); return r ? rotinaCabe(c.v, r) : true; },
        consequencia: c => {
          const r = rotinaDoPlano(c.v, planoPendente(c.v)!);
          return r ? `Entra na sua semana: ${modeloRotina(r)!.nome.toLowerCase()}. A matrícula de verdade continua sendo sua, nos estudos.` : 'O plano volta a valer; os cursos e a matrícula estão nos estudos.';
        },
        resolver: c => {
          const p = planoPendente(c.v)!;
          const r = rotinaDoPlano(c.v, p);
          return {
            texto: r ? 'Caderno novo, apostila marcada, mesa da cozinha às nove da noite.' : 'Você abriu a página das inscrições e desta vez não fechou.',
            memoria: `Aos ${c.idade}, voltou ao plano de ${p.oque}, feito aos ${idadeEm(c.v.eu.tNasc, p.t)}.`,
            efeito: () => { if (r) comecarRotina(c.v, r); c.v.fatos[p.chave] = c.v.t; c.v.fatos['plano_estudar'] = c.v.t; marcar(c.v, 'volta_estudos', `Voltou ao plano de ${p.oque}.`, 2); feliz(c, 2); }
          };
        }
      },
      {
        id: 'deixar', texto: 'Deixar o plano ir',
        consequencia: () => 'Nada muda na sua semana; o plano sai da lista.',
        resolver: c => {
          const p = planoPendente(c.v)!;
          return {
            texto: 'Você tirou o folheto da gaveta e jogou fora. Pesou menos do que imaginava.',
            memoria: `Deixou para trás o plano de ${p.oque}.`,
            efeito: () => { for (const [k] of PLANOS) if (c.v.fatos[k] !== undefined && c.v.t - c.v.fatos[k] >= 60) delete c.v.fatos[k]; c.v.fatos['plano_encerrado'] = c.v.t; estresse(c, -2); }
          };
        }
      },
      {
        id: 'passar', texto: c => `Apostar em ${listaNatural(filhoParaEstudar(c.v).map(k => k.nome))}: ajudar a estudar`, comportamento: { familia: 1 },
        disponivel: c => (filhoParaEstudar(c.v).length ? true : false),
        consequencia: c => `O plano passa adiante: você conversa sobre estudo com ${listaNatural(filhoParaEstudar(c.v).map(k => k.nome))}, e isso pesa quando chegar a hora de escolher.`,
        resolver: c => {
          const kids = filhoParaEstudar(c.v);
          const p = planoPendente(c.v)!;
          return {
            texto: `Você contou do plano que não cumpriu. ${kids[0].nome} ouviu sem revirar os olhos.`,
            memoria: `Passou adiante o plano de ${p.oque}: incentivou ${listaNatural(kids.map(k => k.nome))} a estudar.`,
            efeito: () => { for (const k of kids) { c.v.fatos[`fil_conversou_${k.id}`] = c.v.t; mexer(c.v, k.id, { prox: 5 }); lembrarCom(c.v, k.id, `Você contou do plano de ${p.oque}, que não cumpriu.`, 'antigo', 1); } delete c.v.fatos[p.chave]; }
          };
        }
      }
    ]
  },

  /* ======================================== O sonho que ficou para trás */
  {
    id: 'bio_sonho_para_tras', tipo: 'decisao', idade: [45, 55], tema: 'lazer', prioritario: true, prioridade: 1,
    quando: c => { const s = sonhoParaTras(c.v); return !!s && c.v.t - s.t >= 120; },
    titulo: 'O sonho que ficou para trás',
    texto: c => {
      const s = sonhoParaTras(c.v)!;
      return `${s.texto} — foi em ${anoDe(s.t)}, aos ${idadeEm(c.v.eu.tNasc, s.t)}. ${anosDesde(c.v, s.t)} anos depois, ${s.d && VERBO[s.d] ? `você ainda sabe como é ${VERBO[s.d]}` : 'a lembrança ainda aparece'}.`;
    },
    opcoes: [
      {
        id: 'voltar', texto: c => { const d = sonhoParaTras(c.v)!.d; return d && VERBO[d] ? `Voltar a ${VERBO[d]}, por prazer` : 'Voltar, por prazer'; }, comportamento: { coragem: 1 },
        disponivel: c => { const d = sonhoParaTras(c.v)!.d; const r = d && rotinaDe(d); return r ? rotinaCabe(c.v, r) : false; },
        consequencia: () => 'Entra na sua semana, no ritmo mais leve. Sem clube, sem peneira: só pelo gosto.',
        resolver: c => {
          const s = sonhoParaTras(c.v)!;
          const r = rotinaDe(s.d!)!;
          return {
            texto: 'Na primeira vez, o corpo reclamou. Na terceira, a cabeça esqueceu de reclamar.',
            memoria: `Aos ${c.idade}, voltou a ${VERBO[s.d!]}, anos depois de desistir do sonho.`, tom: 'bom',
            efeito: () => { comecarRotina(c.v, r); const f = c.v.caminhos.frentes[s.d!]; if (f) f.interesse = clamp(f.interesse + 20); marcar(c.v, 'retomada', `Voltou a ${VERBO[s.d!]}, por prazer.`, 2, { dominio: s.d }); feliz(c, 3); }
          };
        }
      },
      {
        id: 'ensinar', texto: 'Ensinar a quem está começando (voluntário, num projeto do bairro)', comportamento: { generosidade: 1 },
        disponivel: c => rotinaCabe(c.v, 'voluntariado'),
        consequencia: () => 'Uma parte da semana com crianças que têm o sonho que você teve.',
        resolver: c => ({
          texto: 'O projeto do bairro tinha vinte crianças e nenhum adulto que soubesse ensinar. Agora tem.',
          memoria: 'Passou a ensinar, como voluntário, o que um dia quis fazer da vida.'.replace('voluntário', c.g('voluntário', 'voluntária', 'voluntárie')),
          efeito: () => { comecarRotina(c.v, 'voluntariado'); feliz(c, 3); }
        })
      },
      {
        id: 'guardar', texto: 'Guardar como uma história',
        consequencia: () => 'Nada muda; fica a história para contar.',
        resolver: () => ({ texto: 'Você contou a história no almoço de domingo. Pela primeira vez, rindo.', memoria: null })
      }
    ]
  },

  /* ================================================== Marcos de carreira */
  {
    id: 'bio_marco_carreira', tipo: 'decisao', idade: [36, 72], tema: 'trabalho', prioritario: true, prioridade: 1, repetir: 4,
    quando: c => !!marcoDeCarreira(c.v),
    titulo: c => { const m = marcoDeCarreira(c.v)!; return `${m.anos} anos de ${ROTULO_TRILHA[m.trilha] ?? 'trabalho'}`; },
    texto: c => {
      const m = marcoDeCarreira(c.v)!;
      const e = c.v.trabalho.atual!;
      const promos = c.v.caminhos.marcas.filter(x => x.tipo === 'promocao').length;
      const demissoes = c.v.caminhos.marcas.filter(x => x.tipo === 'demissao').length;
      const noPosto = anosDesde(c.v, e.tPosto ?? e.tInicio);
      const primeiro = c.v.caminhos.marcas.find(x => x.tipo === 'primeiro_emprego');
      return `Somando tudo, são ${m.anos} anos de ${ROTULO_TRILHA[m.trilha] ?? 'trabalho'}${primeiro ? `, desde ${anoDe(primeiro.t)}` : ''}. ${promos ? `${promos === 1 ? 'Uma promoção' : `${numero(promos)} promoções`}${demissoes ? ` e ${demissoes === 1 ? 'uma demissão' : `${numero(demissoes)} demissões`}` : ''} no caminho. ` : demissoes ? `${demissoes === 1 ? 'Uma demissão' : `${numero(demissoes)} demissões`} no caminho. ` : ''}${noPosto >= 8 ? `No mesmo posto há ${noPosto} anos, em ${e.empregador}.` : `Hoje, em ${e.empregador}.`}`;
    },
    opcoes: [
      {
        id: 'formar', texto: 'Pedir para formar quem está chegando', comportamento: { generosidade: 1 },
        consequencia: () => 'O clima no trabalho melhora e você passa a ser referência; a liderança vira parte do que você faz.',
        resolver: c => {
          const m = marcoDeCarreira(c.v);
          if (!m) return { texto: 'A vida mudou antes da conversa; o assunto ficou para depois.', memoria: null };
          return {
            texto: 'Puseram dois novatos com você. Na primeira semana, você se pegou repetindo frases que ouviu no seu começo.',
            memoria: `Com ${m.anos} anos de estrada, passou a formar quem chegava.`,
            efeito: () => { c.v.fatos[`bio_carreira_${m.trilha}_${m.anos}`] = c.v.t; const f = garantirFrente(c.v, 'lideranca'); f.interesse = clamp(f.interesse + 10); f.tUltimo = c.v.t; const e = c.v.trabalho.atual; if (e) e.clima = clamp((e.clima ?? 50) + 8); feliz(c, 2); }
          };
        }
      },
      {
        id: 'atualizar', texto: 'Fazer uma atualização, para não ficar para trás', comportamento: { disciplina: 1 },
        disponivel: c => custa(c, 1800, 'Não há dinheiro guardado para o curso.'),
        consequencia: () => `Um curso de ${fmt(1800)}; o desempenho no trabalho sobe.`,
        resolver: c => {
          const m = marcoDeCarreira(c.v);
          if (!m) return { texto: 'A vida mudou antes da conversa; o assunto ficou para depois.', memoria: null };
          return {
            texto: 'Aula aos sábados, com gente vinte anos mais nova. Você era quem mais perguntava.',
            memoria: null,
            efeito: () => { c.v.fatos[`bio_carreira_${m.trilha}_${m.anos}`] = c.v.t; pagar(c.v, 1800); const e = c.v.trabalho.atual; if (e) { e.tAtualizacao = c.v.t; e.desempenho = clamp(e.desempenho + 6); } }
          };
        }
      },
      {
        id: 'seguir', texto: 'Seguir como está',
        consequencia: () => 'Nada muda.',
        resolver: c => { const m = marcoDeCarreira(c.v); return { texto: 'Segunda-feira foi segunda-feira.', memoria: null, efeito: () => { if (m) c.v.fatos[`bio_carreira_${m.trilha}_${m.anos}`] = c.v.t; } }; }
      }
    ]
  },

  /* ================================================ A aposentadoria chega */
  {
    id: 'bio_aposentadoria_perto', tipo: 'decisao', idade: [55, 66], tema: 'trabalho', prioritario: true, prioridade: 1,
    quando: c => {
      const e = c.v.trabalho.atual;
      const falta = idadeMinimaAposentadoria(c.v) - c.idade;
      return !c.v.trabalho.aposentadoria && !!e && e.contrato !== 'eletivo' && e.contrato !== 'militar' && !e.posAposentadoria && falta >= 3 && falta <= 5;
    },
    titulo: 'A aposentadoria no horizonte',
    texto: c => {
      const falta = idadeMinimaAposentadoria(c.v) - c.idade;
      const anos = Math.floor(c.v.trabalho.contribuicao / 12);
      const minimo = c.v.eu.genero === 'feminino' ? 15 : 20;
      const vai = anos + falta >= minimo;
      return `Faltam ${falta} anos para a idade da aposentadoria. São ${anos} anos de contribuição ao INSS até aqui${vai ? '' : ` — pelo ritmo de hoje, faltarão ${minimo - anos - falta} na data`}. ${c.v.trabalho.atual!.empregador} ainda conta com você.`;
    },
    opcoes: [
      {
        id: 'simular', texto: 'Ir ao INSS e fazer as contas direito', comportamento: { disciplina: 1 },
        consequencia: () => 'Você fica sabendo quanto vai receber e o que falta. Nada muda no trabalho.',
        resolver: c => {
          const beneficio = valorAposentadoria(c.v);
          const ver = podeAposentar(c.v);
          return {
            texto: `O atendente imprimiu a simulação: cerca de ${fmt(beneficio)} por mês, pelas contribuições de hoje. ${ver.motivo ?? ''}`.trim(),
            memoria: null,
            efeito: () => { c.v.fatos['simulou_aposentadoria'] = c.v.t; estresse(c, -3); }
          };
        }
      },
      {
        id: 'passar', texto: 'Começar a passar o que sabe para quem vai ficar', comportamento: { generosidade: 1 },
        consequencia: () => 'O clima no trabalho melhora; a saída, quando vier, deixa alguém preparado.',
        resolver: c => ({
          texto: 'Você passou a escrever num caderno tudo o que só você sabia fazer.',
          memoria: 'Nos últimos anos antes de aposentar, preparou quem ia ficar no seu lugar.',
          efeito: () => { const e = c.v.trabalho.atual; if (e) e.clima = clamp((e.clima ?? 50) + 8); const f = garantirFrente(c.v, 'lideranca'); f.interesse = clamp(f.interesse + 6); f.tUltimo = c.v.t; }
        })
      },
      {
        id: 'depois', texto: c => { const x = atividadeParada(c.v); return x ? `Voltar agora a ${VERBO[x.d] ?? 'uma coisa antiga'}, para ter o que fazer depois` : 'Começar agora algo para depois'; },
        disponivel: c => (atividadeParada(c.v) ? rotinaCabe(c.v, atividadeParada(c.v)!.rotina) : false),
        consequencia: () => 'Entra na sua semana desde já, no ritmo mais leve.',
        resolver: c => {
          const x = atividadeParada(c.v)!;
          return {
            texto: 'A mão estranhou nas primeiras vezes. Depois, lembrou.',
            memoria: `Antes de aposentar, voltou a ${VERBO[x.d] ?? 'praticar'}.`,
            efeito: () => { comecarRotina(c.v, x.rotina); marcar(c.v, 'retomada', `Voltou a ${VERBO[x.d] ?? 'praticar'} depois de ${x.anos} anos.`, 2, { dominio: x.d }); }
          };
        }
      },
      {
        id: 'nada', texto: 'Não pensar nisso agora',
        consequencia: () => 'Nada muda.',
        resolver: () => ({ texto: 'Ainda dá tempo, você disse.', memoria: null })
      }
    ]
  },

  /* ================================================ Sucessão do negócio */
  {
    id: 'bio_sucessao_negocio', tipo: 'decisao', idade: [50, 90], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 5,
    papeis: { filho: v => P.filho(22, 60)(v).filter(f => mesmaCidade(v, f)) },
    quando: c => { const n = negocioAberto(c.v); return !!n && n.estado === 'firme' && c.v.t - n.tInicio >= 120 && !n.passivo; },
    titulo: c => `O futuro de ${negocioAberto(c.v)!.nome}`,
    texto: c => {
      const n = negocioAberto(c.v)!;
      const f = c.p.filho;
      const equipe = n.equipe?.length ?? 0;
      const junto = temFato(c.v, `aprendiz_negocio_${f.id}`);
      return `${n.nome} tem ${anosDesde(c.v, n.tInicio)} anos${equipe ? ` e ${equipe === 1 ? 'uma pessoa' : `${equipe} pessoas`} na equipe` : ''}. ${f.nome}, ${idadePessoa(c.v, f)} anos, ${junto ? 'trabalha com você desde que você chamou' : f.ocupacao ? `hoje trabalha como ${f.ocupacao}` : 'mora na mesma cidade'}${f.formacao ? `, formad${o(f)} em ${f.formacao}` : ''}. Alguém de fora já perguntou se o negócio está à venda.`;
    },
    opcoes: [
      {
        id: 'passar', texto: c => `Passar ${negocioAberto(c.v)!.nome} para ${c.p.filho.nome}`, comportamento: { familia: 2 },
        consequencia: c => `${c.p.filho.nome} assume, e o que o negócio rende passa a ser ${dele(c.p.filho)}. Você deixa de trabalhar nele${c.v.trabalho.aposentadoria ? '' : ' (e fica sem essa renda)'}.`,
        resolver: c => {
          const n = negocioAberto(c.v)!;
          const f = c.p.filho;
          return {
            texto: `Você entregou as chaves numa segunda-feira. Na terça, passou lá "só para ver". ${f.nome} fingiu não notar.`,
            memoria: `Passou ${n.nome} para ${f.nome}, depois de ${anosDesde(c.v, n.tInicio)} anos.`, relevancia: 'marco',
            efeito: () => {
              const retirada = retiradaMensal(c.v, n);
              for (const x of n.equipe ?? []) { const vin = c.v.vinculos[x.pessoaId]; if (vin) { vin.ambiente = undefined; vin.convivio = vin.convivio.filter(k => k !== 'trabalho'); } }
              n.equipe = []; n.caixa = 0; n.estado = 'fechado'; n.tFim = c.v.t;
              if (c.v.trabalho.atual?.ocupacaoId === n.ocupacaoId) encerrarEmprego(c.v, 'passou o negócio para a família');
              f.ocupacao = `${flex(f.genero, 'dono', 'dona', 'dona')} de ${n.nome}`;
              f.renda = Math.max(f.renda, retirada);
              c.v.fatos[`sucessor_${f.id}`] = c.v.t;
              marcar(c.v, 'negocio_fechado', `Passou ${n.nome} para ${f.nome}.`, 3, { ocupacaoId: n.ocupacaoId, pessoaId: f.id });
              prox(c, 'filho', 10); lembrarCom(c.v, f.id, `Você passou ${n.nome} adiante.`, 'trabalho', 3);
            }
          };
        }
      },
      {
        id: 'chamar', texto: c => `Chamar ${c.p.filho.nome} para trabalhar junto por um tempo`,
        disponivel: c => (temFato(c.v, `aprendiz_negocio_${c.p.filho.id}`) ? false : true),
        consequencia: c => `${c.p.filho.nome} aprende o negócio ao seu lado; a decisão fica para daqui a uns anos.`,
        resolver: c => ({
          texto: `${c.p.filho.nome} começou pelo caixa, como você começou.`,
          memoria: `Chamou ${c.p.filho.nome} para aprender o negócio.`,
          efeito: () => { c.v.fatos[`aprendiz_negocio_${c.p.filho.id}`] = c.v.t; prox(c, 'filho', 6); lembrarCom(c.v, c.p.filho.id, `Foi aprender o negócio com você.`, 'trabalho', 2); }
        })
      },
      {
        id: 'vender', texto: 'Vender para quem perguntou',
        consequencia: c => `Cerca de ${fmt(valorDoNegocio(c.v, negocioAberto(c.v)!))} (mais o que houver no caixa). O negócio sai da família.`,
        resolver: c => ({ texto: 'O comprador pediu para manter o nome na fachada.', memoria: null, efeito: () => { venderNegocio(c.v, valorDoNegocio(c.v, negocioAberto(c.v)!)); } })
      },
      {
        id: 'manter', texto: 'Seguir tocando, por enquanto',
        consequencia: () => 'Nada muda; a pergunta volta daqui a uns anos.',
        resolver: () => ({ texto: 'Você disse ao comprador que ainda não.', memoria: null })
      }
    ]
  },

  /* ================================================ Retomar uma atividade */
  {
    id: 'bio_retomar', tipo: 'decisao', idade: [40, 72], tema: 'lazer', prioritario: true, prioridade: 1, repetir: 8,
    quando: c => !!atividadeParada(c.v) && !!ocasiaoDeRetomar(c.v),
    titulo: c => `${capital(VERBO[atividadeParada(c.v)!.d] ?? 'uma coisa antiga')}, de novo?`,
    texto: c => {
      const x = atividadeParada(c.v)!;
      const estreia = c.v.caminhos.marcas.find(m => m.dominio === x.d && (m.tipo === 'destaque' || m.tipo === 'conquista' || m.tipo === 'estreia'));
      return `Faz ${x.anos} anos que você não para para ${VERBO[x.d] ?? 'praticar'}. ${x.auge >= 60 ? 'Houve um tempo em que você era dos bons por aí' : 'Você chegou a fazer isso bem'}${estreia ? ` — ${minusc(estreia.texto).replace(/\.$/, '')}` : ''}. ${ocasiaoDeRetomar(c.v)}`;
    },
    opcoes: [
      {
        id: 'retomar', texto: 'Voltar, no ritmo mais leve', comportamento: { disciplina: 1 },
        disponivel: c => rotinaCabe(c.v, atividadeParada(c.v)!.rotina),
        consequencia: () => 'Entra na sua semana, sem compromisso com ninguém.',
        resolver: c => {
          const x = atividadeParada(c.v)!;
          return {
            texto: 'Nas primeiras vezes, a mão estranhou. Depois, lembrou.',
            memoria: `Voltou a ${VERBO[x.d] ?? 'praticar'} depois de ${x.anos} anos.`, tom: 'bom',
            efeito: () => { comecarRotina(c.v, x.rotina); const f = c.v.caminhos.frentes[x.d]; if (f) { f.interesse = clamp(f.interesse + 20); f.retomadas++; } marcar(c.v, 'retomada', `Voltou a ${VERBO[x.d] ?? 'praticar'} depois de ${x.anos} anos.`, 2, { dominio: x.d }); feliz(c, 2); }
          };
        }
      },
      {
        id: 'turma', texto: 'Voltar com uma turma, com aula e horário',
        disponivel: c => { const x = atividadeParada(c.v)!; return (modeloRotina(x.rotina)?.niveis.length ?? 1) >= 2 ? rotinaCabe(c.v, x.rotina, 2) : false; },
        consequencia: c => { const x = atividadeParada(c.v)!; const n = modeloRotina(x.rotina)!.niveis[1]; return `Mais tempo na semana${n.custo ? ` e cerca de ${fmt(n.custo)} por mês` : ''}; gente nova por perto.`; },
        resolver: c => {
          const x = atividadeParada(c.v)!;
          return {
            texto: 'A turma tinha gente de todas as idades. Você não era o mais velho.'.replace('o mais velho', c.g('o mais velho', 'a mais velha', 'e mais velhe')),
            memoria: `Voltou a ${VERBO[x.d] ?? 'praticar'}, numa turma, depois de ${x.anos} anos.`, tom: 'bom',
            efeito: () => { comecarRotina(c.v, x.rotina, 2); const f = c.v.caminhos.frentes[x.d]; if (f) { f.interesse = clamp(f.interesse + 25); f.retomadas++; } marcar(c.v, 'retomada', `Voltou a ${VERBO[x.d] ?? 'praticar'} depois de ${x.anos} anos.`, 2, { dominio: x.d }); feliz(c, 3); }
          };
        }
      },
      {
        id: 'deixar', texto: 'Deixar onde está',
        consequencia: () => 'Nada muda.',
        resolver: () => ({ texto: 'Ficou como lembrança boa.', memoria: null })
      }
    ]
  },

  /* ================================================== A casa da família */
  {
    id: 'bio_casa_da_familia', tipo: 'decisao', idade: [30, 100], tema: 'casa', prioritario: true, prioridade: 1, repetir: 0,
    quando: c => !!casaHerdadaParada(c.v),
    titulo: 'A casa da família',
    texto: c => {
      const b = casaHerdadaParada(c.v)!;
      const origem = b.historia?.find(h => /^Herdada/.test(h.texto));
      return `A casa da família, em ${cidadeDe(b.municipioId)}, está fechada desde ${anoDe(b.tCompra)}.${origem ? ` ${origem.texto}` : ''} ${b.estado < 50 ? 'A umidade subiu pelas paredes e o mato tomou o quintal.' : 'Um vizinho ainda rega as plantas da frente.'}`;
    },
    opcoes: [
      {
        id: 'vender', texto: 'Vender',
        consequencia: c => `Cerca de ${fmt(valorDeVendaImovel(casaHerdadaParada(c.v)!))}. A casa sai da família.`,
        resolver: c => {
          const b = casaHerdadaParada(c.v)!;
          return {
            texto: 'Antes de entregar as chaves, você passou uma tarde sozinh' + c.g('o', 'a', 'e') + ' lá dentro.',
            memoria: 'Vendeu a casa da família.', relevancia: 'marco',
            efeito: () => { feito(c, `bio_casa_herdada_${b.id}`); c.v.financas.conta += valorDeVendaImovel(b); c.v.financas.bens = c.v.financas.bens.filter(x => x.id !== b.id); }
          };
        }
      },
      {
        id: 'alugar', texto: 'Alugar para outra família',
        consequencia: c => { const b = casaHerdadaParada(c.v)!; return `Uma renda de cerca de ${fmt(Math.round(aluguelDe(c.v, modeloMoradia(b.modeloId), b.municipioId) * (0.75 + b.estado / 400) * 0.9 / 10) * 10)} por mês; a casa continua sua.`; },
        resolver: c => {
          const b = casaHerdadaParada(c.v)!;
          return {
            texto: 'Uma família com duas crianças pequenas assinou o contrato. A mais nova escolheu o seu antigo quarto.',
            memoria: 'Alugou a casa da família.',
            efeito: () => { feito(c, `bio_casa_herdada_${b.id}`); executarImovel(c.v, b, 'alugar'); }
          };
        }
      },
      {
        id: 'manter', texto: 'Manter como está e cuidar dela',
        disponivel: c => custa(c, 4000, 'Não há dinheiro guardado para a manutenção.'),
        consequencia: () => `Uma manutenção de ${fmt(4000)} agora; a casa fica de pé, fechada, esperando.`,
        resolver: c => {
          const b = casaHerdadaParada(c.v)!;
          return {
            texto: 'Pintura, telhado revisado, a luz religada. Você deixou as fotos na parede.',
            memoria: null,
            efeito: () => { feito(c, `bio_casa_herdada_${b.id}`); pagar(c.v, 4000); b.estado = clamp(b.estado + 18); b.tManutencao = c.v.t; (b.historia ??= []).push({ t: c.v.t, texto: 'Manutenção para manter a casa de pé.' }); }
          };
        }
      }
    ]
  },

  /* ================================== O filho largou o curso que você pagava */
  {
    id: 'bio_filho_largou', tipo: 'decisao', idade: [36, 90], tema: 'filhos', prioritario: true, prioridade: 2, repetir: 0,
    papeis: { filho: v => P.filho(17, 40)(v).filter(f => { const t = v.fatos[`largou_paga_${f.id}`]; return t !== undefined && v.t - t < 24 && !temFato(v, `bio_largou_${f.id}`); }) },
    titulo: c => `${c.p.filho.nome} largou o curso`,
    texto: c => {
      const f = c.p.filho;
      const curso = f.vida?.trajetoria.slice().reverse().find(x => x.tipo === 'estudo' && /largou/.test(x.texto));
      const mensal = c.v.fatos[`largou_mensalidade_${f.id}`];
      return `${curso?.texto ?? `${f.nome} largou a faculdade.`} Era o curso que você pagava${mensal ? `, ${fmt(mensal)} por mês` : ''}. ${f.nome} contou por mensagem${f.renda > 0 && f.ocupacao ? `, e disse que vai se dedicar ao trabalho de ${f.ocupacao}` : ''}.`;
    },
    opcoes: [
      {
        id: 'perguntar', texto: 'Perguntar o que aconteceu, sem cobrar', comportamento: { empatia: 1 },
        consequencia: c => `${c.p.filho.nome} confia mais em você; o dinheiro que foi, foi.`,
        resolver: c => ({
          texto: `${c.p.filho.nome} demorou, mas contou: não era aquilo. Tinha medo de te decepcionar.`,
          memoria: null,
          efeito: () => { feito(c, `bio_largou_${c.p.filho.id}`); prox(c, 'filho', 6); c.v.vinculos[c.p.filho.id].confianca = clamp(c.v.vinculos[c.p.filho.id].confianca + 5); lembrarCom(c.v, c.p.filho.id, 'Largou o curso; você perguntou por quê, sem cobrar.', 'apoio', 2); }
        })
      },
      {
        id: 'porta', texto: 'Dizer que, se quiser outro curso, você ajuda de novo', comportamento: { generosidade: 1, familia: 1 },
        consequencia: c => `Nenhum dinheiro agora; se ${c.p.filho.nome} quiser recomeçar, conta com você.`,
        resolver: c => ({
          texto: `${c.p.filho.nome} não respondeu na hora. No fim do mês, mandou o link de um curso técnico.`,
          memoria: `Quando ${c.p.filho.nome} largou a faculdade, deixou a porta aberta para outro curso.`,
          efeito: () => { feito(c, `bio_largou_${c.p.filho.id}`); prox(c, 'filho', 8); c.v.fatos[`fil_conversou_${c.p.filho.id}`] = c.v.t; lembrarCom(c.v, c.p.filho.id, 'Você disse que ajudaria de novo, se quisesse outro curso.', 'apoio', 2); }
        })
      },
      {
        id: 'cobrar', texto: 'Cobrar: foi dinheiro da casa', comportamento: { disciplina: 1 },
        consequencia: c => `${c.p.filho.nome} fica sabendo o quanto pesou; o atrito entre vocês cresce.`,
        resolver: c => ({
          texto: `${c.p.filho.nome} ouviu calad${o(c.p.filho)} e foi embora cedo.`,
          memoria: `Cobrou de ${c.p.filho.nome} a faculdade largada.`, tom: 'ruim',
          efeito: () => { feito(c, `bio_largou_${c.p.filho.id}`); prox(c, 'filho', -8); tensao(c, 'filho', 12); lembrarCom(c.v, c.p.filho.id, 'Você cobrou pela faculdade largada.', 'conflito', 2); }
        })
      }
    ]
  },

  /* ============================================ Acontecimentos: o que o tempo marca */
  {
    // A vida de um filho aos quarenta: o que ela é hoje, dita pelo que foi registrado.
    id: 'bio_filho_quarenta', tipo: 'acontecimento', idade: [55, 110], tema: 'filhos', prioritario: true, repetir: 0,
    papeis: { filho: v => P.filho(40, 40)(v).filter(f => !temFato(v, `bio_quarenta_${f.id}`)) },
    narrar: c => {
      const f = c.p.filho;
      const par = f.parceiroId ? c.v.pessoas[f.parceiroId] : undefined;
      const seus = netosDe(c.v, f).filter(n => n.vivo);
      const partes = [
        f.ocupacao && f.ocupacao !== 'estudante' ? `é ${f.ocupacao}` : undefined,
        par?.vivo ? `vive com ${par.nome}` : /separaram/.test(f.vida?.trajetoria.filter(t => t.tipo === 'amor').pop()?.texto ?? '') ? `está sozinh${o(f)} desde a separação` : undefined,
        seus.length === 1 ? `é ${flex(f.genero, 'pai', 'mãe', 'mãe')} de ${seus[0].nome}` : seus.length > 1 ? `tem ${numero(seus.length).replace('duas', 'dois').replace(/^uma$/, 'um')} filhos` : undefined,
        mesmaCidade(c.v, f) ? 'mora na sua cidade' : `mora em ${cidadeDe(f.municipioId)}`
      ].filter(Boolean) as string[];
      return {
        texto: `${f.nome} fez quarenta anos: ${listaNatural(partes)}.${f.formacao ? ` O diploma de ${f.formacao} ainda está na parede da sua sala.` : ''}`,
        relevancia: 'biografia', tom: 'neutro',
        efeito: () => { feito(c, `bio_quarenta_${f.id}`); }
      };
    }
  },
  {
    // O neto que fez dezoito: o que ele (ou ela) já é, pelo que a vida própria registrou.
    id: 'bio_neto_maior', tipo: 'acontecimento', idade: [50, 115], tema: 'familia', prioritario: true, repetir: 0,
    papeis: { neto: v => P.neto(18, 18)(v).filter(n => !temFato(v, `bio_neto18_${n.id}`)) },
    narrar: c => {
      const n = c.p.neto;
      const vida = n.vida;
      const estudo = n.estudo ? `entrou em ${n.estudo.curso}` : vida?.parouDeEstudar ? 'deixou a escola antes do fim' : vida?.escolaridade === 'medio' ? 'terminou o ensino médio' : 'está terminando a escola';
      const perto = (c.v.vinculos[n.id].presenca ?? 0) >= 40;
      return {
        texto: `${n.nome} fez dezoito anos e ${estudo}.${perto ? ` Mandou a primeira foto da maioridade para você.` : ''}`,
        relevancia: 'biografia', tom: 'bom',
        efeito: () => feito(c, `bio_neto18_${n.id}`)
      };
    }
  },
  {
    // Vinte anos na mesma casa: quem cresceu ali e o que a casa atravessou.
    id: 'bio_casa_vinte_anos', tipo: 'acontecimento', idade: [38, 110], tema: 'casa', prioritario: true, repetir: 0,
    quando: c => { const b = casaPropria(c.v); return !!b && !b.herdado && anosDesde(c.v, b.tCompra) === 20 && !temFato(c.v, `bio_casa20_${b.id}`); },
    narrar: c => {
      const b = casaPropria(c.v)!;
      const cresceram = filhosVivos(c.v).filter(f => f.tNasc + 18 * 12 > b.tCompra && moraJuntoOuMorou(c.v, f));
      const reparos = (b.historia ?? []).filter(h => /^Reparou|Reforma|reforma|Manutenção/.test(h.texto)).length;
      return {
        texto: `Vinte anos ${b.nome.startsWith('casa') ? 'na' : 'no'} ${b.nome}.${cresceram.length ? ` ${listaNatural(cresceram.map(f => f.nome))} ${cresceram.length > 1 ? 'cresceram' : 'cresceu'} ali; as marcas de altura continuam no batente da porta.` : ''}${reparos ? ` ${reparos === 1 ? 'Uma reforma' : `${numero(reparos)} reformas`} depois, ${b.estado >= 60 ? 'está de pé e bem cuidad' + (b.nome.startsWith('casa') ? 'a' : 'o') : 'pede outra'}.` : ''}`,
        relevancia: 'biografia', tom: 'neutro',
        efeito: () => feito(c, `bio_casa20_${b.id}`)
      };
    }
  }
];

/* ---------------------------------------------------- Auxiliares (fim) */

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function paiDoNeto(v: Vida, n: Pessoa): Pessoa | undefined {
  const id = n.genitores?.find(g => ['filho', 'enteado'].includes(v.vinculos[g]?.parentesco ?? ''));
  return id ? v.pessoas[id] : undefined;
}

const ajudaNeto = (v: Vida) => Math.round(clamp(guardado(v) * 0.08, 2000, 15000) / 500) * 500;

/** A frente em que o jogador é melhor, entre as que se ensinam. */
function melhorFrente(v: Vida): Dominio | undefined {
  const cand = (Object.entries(v.caminhos.frentes) as [Dominio, NonNullable<Vida['caminhos']['frentes'][Dominio]>][])
    .filter(([d, f]) => VERBO[d] && f.auge >= 40).sort((a, b) => b[1].auge - a[1].auge);
  return cand[0]?.[0];
}

/** A casa herdada, parada (sem ninguém morando nem inquilino), há de um a cinco anos. */
function casaHerdadaParada(v: Vida): Imovel | undefined {
  return v.financas.bens.find((b): b is Imovel => b.tipo === 'imovel' && !!b.herdado && b.id !== v.moradia.imovelId && !b.alugadoPor
    && v.t - b.tCompra >= 12 && v.t - b.tCompra <= 60 && !temFato(v, `bio_casa_herdada_${b.id}`));
}

/** O filho morou (ou mora) com o jogador — para dizer quem cresceu numa casa. */
function moraJuntoOuMorou(v: Vida, f: Pessoa): boolean {
  return moraJunto(v.vinculos[f.id]) || v.fatos[`saiu_de_casa_${f.id}`] !== undefined;
}

export const _interno = { balanco, planoPendente, atividadeParada, trocaDeCasa, ninhoVazio, marcoDasBodas, exDoFilho };
