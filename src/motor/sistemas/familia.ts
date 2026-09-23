/**
 * Família: a de origem, que segue vivendo, e a que o jogador forma.
 *
 * Os pais trabalham, perdem emprego, se aposentam, às vezes se separam, às
 * vezes têm outro filho. Avós envelhecem e morrem. Irmãos crescem e saem de
 * casa. Ninguém fica congelado esperando o jogador.
 *
 * Filhos não aparecem por botão: há concepção (planejada ou não), descoberta,
 * nove meses de gestação e parto. A fertilidade cai com a idade de quem
 * gesta. Adoção é um processo de anos.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Pessoa, Processo, Vida } from '../tipos';
import {
  emRecessao, escrever, filhos, idade, idadePessoa, irmaos, lembrarCom, marcarFato, novoId, pais, parceiro, vinculosVivos
} from '../nucleo';
import { criarPessoa, vincular, visualHerdado } from '../pessoas';
import { processarCorpoDePessoa } from './corpo';
import { flex, ge, rotuloParentesco } from '../texto';
import { MESES, mesDe } from '../tempo';
import { OCUPACOES, OCUPACOES_POR_CLASSE, ocupacao } from '../dados/ocupacoes';
import { liquido, salarioLocal } from './renda';
import { moraComFamiliaDeOrigem } from './domicilio';
import { sortearNome } from '../dados/nomes';
import { descricaoOrigem } from './social';

/* ----------------------------------------------------------------- Mortes */

const PESO_LUTO: Record<string, number> = { mae: 22, pai: 20, filho: 35, irmao: 14, avo: 8, pet: 6, tio: 3, primo: 2 };

export function processarMortes(v: Vida, r: Rng): void {
  for (const { p, vin } of vinculosVivos(v)) {
    const causa = processarCorpoDePessoa(v, r, p);
    if (!causa) continue;
    p.vivo = false;
    p.tMorte = v.t;
    p.causaMorte = causa;
    const par = vin.parentesco;
    const rotulo = par ? rotuloParentesco(p, par) : undefined;
    const importante = !!par && ['mae', 'pai', 'filho', 'irmao', 'avo', 'pet'].includes(par) || vin.estagio === 'amigo_proximo' || !!vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(vin.romance.estagio);
    const luto = par ? PESO_LUTO[par] ?? 2 : vin.romance ? 30 : vin.estagio === 'amigo_proximo' ? 12 : 2;
    v.mente.felicidade = clamp(v.mente.felicidade - Math.round(luto * vin.proximidade / 80));
    v.mente.estresse = clamp(v.mente.estresse + Math.round(luto / 3));
    if (!importante && vin.proximidade < 40) continue;
    let texto: string;
    if (par === 'pet') texto = `${p.nome} morreu de velhice, depois de ${idadePessoa(v, p)} anos na família.`;
    else if (vin.romance && vin.romance.estagio !== 'ex') texto = `${p.nome} morreu (${causa}). ${flex(ge(v), 'Viúvo', 'Viúva')} aos ${idade(v)}.`;
    else if (rotulo) texto = `${capital(seuSua(p, rotulo))} ${p.nome} morreu, aos ${idadePessoa(v, p)} anos (${causa}).`;
    else texto = `${p.nome}, que você conheceu ${descricaoOrigem(v, vin)}, morreu aos ${idadePessoa(v, p)} anos (${causa}).`;
    escrever(v, { texto, relevancia: importante ? 'marco' : 'biografia', tema: 'perda', tom: 'ruim', pessoas: [p.id] });
    if (vin.romance && vin.romance.estagio !== 'ex') {
      vin.romance.estagio = 'ex';
      vin.convivio = [];
    }
    if (par === 'mae' || par === 'pai') heranca(v, r, p);
    // O outro genitor fica viúvo.
    if (p.parceiroId && v.pessoas[p.parceiroId]) v.pessoas[p.parceiroId].parceiroId = undefined;
  }
}

function seuSua(p: Pessoa, rotulo: string): string {
  return `${flex(p.genero, 'seu', 'sua', 'sue')} ${rotulo}`;
}

function heranca(v: Vida, r: Rng, falecido: Pessoa): void {
  const conjugeVivo = falecido.parceiroId && v.pessoas[falecido.parceiroId]?.vivo;
  if (conjugeVivo) return; // o cônjuge fica com a casa; a herança vem depois
  const base = { vulneravel: 0, trabalhadora: 8000, media_baixa: 45000, media: 220000, alta: 1300000 }[v.origem.classe];
  if (base === 0) return;
  const herdeiros = 1 + irmaos(v).filter(i => i.vivo).length;
  const valor = Math.round(base * (0.5 + r.next()) / herdeiros / 1000) * 1000;
  if (valor <= 0) return;
  v.financas.conta += valor;
  escrever(v, { texto: `A partilha do inventário deixou R$ ${valor.toLocaleString('pt-BR')} de herança.`, relevancia: 'biografia', tema: 'dinheiro' });
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------ Família de origem */

export function processarFamiliaDeOrigem(v: Vida, r: Rng): void {
  const i = idade(v);
  const [p1, p2] = [pais(v).find(p => p.genero === 'feminino'), pais(v).find(p => p.genero === 'masculino')];

  for (const p of pais(v)) {
    const ip = idadePessoa(v, p);
    // Aposentadoria dos pais
    if (p.ocupacao && !p.ocupacao.startsWith('aposentad') && ip >= (p.genero === 'feminino' ? 62 : 65) && r.chance(0.6)) {
      p.ocupacao = flex(p.genero, 'aposentado', 'aposentada');
      p.renda = Math.max(1620, Math.round(p.renda * 0.7));
      if (i < 40) escrever(v, { texto: `${capital(seuSua(p, v.vinculos[p.id].parentesco === 'mae' ? 'mãe' : 'pai'))} se aposentou.`, relevancia: 'cotidiano', tema: 'familia', pessoas: [p.id] });
      continue;
    }
    if (p.ocupacao?.startsWith('aposentad') || ip < 18) continue;
    // Emprego dos pais oscila: é daqui que vêm os anos apertados da infância.
    // Servidor quase nunca perde o cargo; informal e autônomo, com mais frequência.
    const ocAtual = p.ocupacaoId ? ocupacao(p.ocupacaoId) : undefined;
    const riscoPerda = (!ocAtual ? 0.05 : ocAtual.contrato === 'servidor' ? 0.003 : ocAtual.contrato === 'clt' ? 0.045 : 0.06) * (emRecessao(v) ? 2 : 1);
    if (p.renda > 0 && r.chance(riscoPerda)) {
      p.renda = 0;
      const antes = p.ocupacao;
      p.ocupacao = flex(p.genero, 'desempregado', 'desempregada');
      if (i < 25 && moraComFamiliaDeOrigem(v)) {
        escrever(v, { texto: `${capital(seuSua(p, v.vinculos[p.id].parentesco === 'mae' ? 'mãe' : 'pai'))} perdeu o emprego${antes ? ` de ${antes}` : ''}. O dinheiro em casa encurtou.`, relevancia: 'biografia', tema: 'familia', tom: 'ruim', pessoas: [p.id] });
        v.mente.estresse = clamp(v.mente.estresse + 6);
      }
    } else if (p.renda === 0 && p.ocupacao?.startsWith('desempregad') && r.chance(0.55)) {
      // Recoloca-se na mesma área, quase sempre; às vezes num degrau abaixo.
      const mesmaArea = ocAtual ? OCUPACOES.filter(o => o.trilha === ocAtual.trilha && Math.abs(o.nivel - ocAtual.nivel) <= 1 && !o.concurso && o.contrato !== 'estagio' && o.contrato !== 'aprendiz') : [];
      const oc = mesmaArea.length && r.chance(0.8) ? (r.chance(0.6) ? ocAtual! : r.pick(mesmaArea)) : ocupacao(r.pick(OCUPACOES_POR_CLASSE[v.origem.classe]));
      if (oc.idadeMin <= ip) {
        p.ocupacaoId = oc.id;
        p.ocupacao = p.genero === 'feminino' ? oc.nome[1] : oc.nome[0];
        p.renda = liquido(salarioLocal(oc, p.municipioId, 0.85 + r.next() * 0.3), oc.contrato);
        if (i < 25 && moraComFamiliaDeOrigem(v)) escrever(v, { texto: `${capital(seuSua(p, v.vinculos[p.id].parentesco === 'mae' ? 'mãe' : 'pai'))} arrumou trabalho de novo, como ${p.ocupacao}.`, relevancia: 'cotidiano', tema: 'familia', pessoas: [p.id] });
      }
    }
  }

  // Separação dos pais
  if (p1 && p2 && p1.parceiroId === p2.id && r.chance(i < 18 ? 0.018 : 0.008)) {
    p1.parceiroId = undefined;
    p2.parceiroId = undefined;
    const saiDeCasa = r.chance(0.8) ? p2 : p1;
    const vinSai = v.vinculos[saiDeCasa.id];
    if (moraComFamiliaDeOrigem(v) && vinSai) {
      vinSai.convivio = vinSai.convivio.filter(c => c !== 'casa');
      marcarFato(v, `saiu_de_casa_${saiDeCasa.id}`);
    }
    escrever(v, {
      texto: i < 18
        ? `Seus pais se separaram. ${saiDeCasa.nome} saiu de casa${i < 10 ? ' e a rotina passou a ser de fins de semana alternados' : ''}.`
        : `Seus pais se separaram depois de décadas juntos.`,
      relevancia: 'marco', tema: 'familia', tom: 'ruim', pessoas: [p1.id, p2.id]
    });
    if (i < 18) { v.mente.felicidade = clamp(v.mente.felicidade - 10); v.mente.estresse = clamp(v.mente.estresse + 12); }
  }

  // Irmão mais novo
  const maeCasa = p1 && v.vinculos[p1.id]?.convivio.includes('casa') ? p1 : undefined;
  if (maeCasa && i < 16 && idadePessoa(v, maeCasa) <= 40 && maeCasa.parceiroId) {
    const irmaosAgora = irmaos(v).length;
    const chance = { vulneravel: 0.12, trabalhadora: 0.1, media_baixa: 0.08, media: 0.06, alta: 0.05 }[v.origem.classe] / (1 + irmaosAgora * 0.8);
    if (r.chance(chance)) {
      const g = r.chance(0.5) ? 'masculino' : 'feminino';
      const outro = v.pessoas[maeCasa.parceiroId];
      const bebe = criarPessoa(v, r, { genero: g, idade: 0, municipioId: maeCasa.municipioId, sobrenome: v.eu.sobrenome, visual: visualHerdado(r, g, maeCasa.visual, outro?.visual) });
      const vin = vincular(v, bebe, { parentesco: outro && v.vinculos[outro.id]?.parentesco === 'pai' ? 'irmao' : 'meio_irmao', origem: 'familia', proximidade: 60, convivio: ['casa'] });
      void vin;
      escrever(v, { texto: `Nasceu ${flex(g, 'seu irmão', 'sua irmã')}, ${bebe.nome}.`, relevancia: 'marco', tema: 'familia', tom: 'bom', pessoas: [bebe.id] });
    }
  }

  // Irmãos crescem e saem de casa
  for (const irmao of irmaos(v)) {
    const ii = idadePessoa(v, irmao);
    if (ii < 18) { irmao.ocupacao = ii >= 4 ? 'estudante' : undefined; continue; }
    if (irmao.ocupacao === 'estudante' && ii >= 18) {
      const oc = ocupacao(r.pick(OCUPACOES_POR_CLASSE[v.origem.classe]));
      if (oc.idadeMin <= ii) { irmao.ocupacao = irmao.genero === 'feminino' ? oc.nome[1] : oc.nome[0]; irmao.renda = liquido(salarioLocal(oc, irmao.municipioId), oc.contrato); }
    }
    const vin = v.vinculos[irmao.id];
    if (vin.convivio.includes('casa') && ii >= 19 && r.chance(0.12 + (ii - 19) * 0.03)) {
      marcarFato(v, `saiu_de_casa_${irmao.id}`);
      vin.convivio = vin.convivio.filter(c => c !== 'casa');
      if (moraComFamiliaDeOrigem(v)) escrever(v, { texto: `${irmao.nome} saiu de casa. O quarto ficou vazio.`, relevancia: 'cotidiano', tema: 'familia', pessoas: [irmao.id] });
    }
  }
}

/* ------------------------------------------------------------- Gestação */

export function fertilidadeAnual(idadeGestante: number): number {
  if (idadeGestante < 15) return 0;
  if (idadeGestante < 30) return 0.85;
  if (idadeGestante < 35) return 0.75;
  if (idadeGestante < 38) return 0.6;
  if (idadeGestante < 41) return 0.4;
  if (idadeGestante < 44) return 0.15;
  if (idadeGestante < 48) return 0.03;
  return 0;
}

export const gestacaoEmCurso = (v: Vida) => v.processos.find(p => p.tipo === 'gestacao') as Extract<Processo, { tipo: 'gestacao' }> | undefined;

/** Quem do casal gesta: o jogador ou a outra pessoa. */
function gestanteDoCasal(v: Vida, p: Pessoa): 'eu' | 'parceiro' | null {
  if (v.corpo.podeGestar) return 'eu';
  if (p.genero === 'feminino') return 'parceiro';
  return null;
}

export function processarConcepcao(v: Vida, r: Rng): void {
  if (gestacaoEmCurso(v)) return;
  const par = parceiro(v) ?? vinculosVivos(v).find(x => x.vin.romance?.estagio === 'saindo');
  if (!par || !par.vin.romance) return;
  const quem = gestanteDoCasal(v, par.p);
  if (!quem) return;
  const idadeG = quem === 'eu' ? idade(v) : idadePessoa(v, par.p);
  const fert = fertilidadeAnual(idadeG);
  if (fert === 0) return;
  const plano = par.vin.romance.planoFilhos ?? 'evitando';
  const saindo = par.vin.romance.estagio === 'saindo';
  const impulsivo = v.personalidade.tracos.impulsividade > 25 ? 2 : 1;
  const chance = plano === 'tentando' ? fert : plano === 'sem_planejar' ? fert * 0.45 : (saindo ? 0.01 : 0.025) * impulsivo * (idadeG < 20 ? 1.6 : 1);
  if (!r.chance(chance)) return;
  const tConcepcao = v.t - r.int(1, 11);
  v.processos.push({
    tipo: 'gestacao', id: novoId(v, 'g'), tConcepcao, tParto: tConcepcao + 9,
    gestanteId: quem === 'eu' ? 'eu' : par.p.id, outroId: quem === 'eu' ? par.p.id : 'eu',
    descoberta: false, planejada: plano === 'tentando'
  });
}

/**
 * Anda a gestação: descoberta (dois meses depois), parto (nove meses).
 * Devolve o bebê que nasceu, para o conteúdo perguntar o nome.
 */
export function processarGestacoes(v: Vida, r: Rng): Pessoa | null {
  const g = gestacaoEmCurso(v);
  if (!g) return null;
  const outro = g.gestanteId === 'eu' ? v.pessoas[g.outroId!] : v.pessoas[g.gestanteId];
  if (!g.descoberta && g.tConcepcao + 2 <= v.t) {
    g.descoberta = true;
    const quemGesta = g.gestanteId === 'eu' ? 'Você está grávid' + flex(ge(v), 'o', 'a', 'e') : `${outro?.nome ?? 'Sua parceira'} está grávida`;
    const jaTem = filhos(v).length > 0;
    escrever(v, {
      t: g.tConcepcao + 2,
      texto: g.planejada
        ? jaTem ? `${quemGesta} de novo. Desta vez, a notícia veio sem susto.` : `${quemGesta}. Depois de meses tentando, o teste deu positivo.`
        : jaTem ? `${quemGesta} outra vez — sem planejar.` : `${quemGesta}. Não estava nos planos.`,
      relevancia: 'marco', tema: 'filhos', tom: g.planejada ? 'bom' : 'neutro', pessoas: outro ? [outro.id] : []
    });
    marcarFato(v, `gravidez_descoberta_${g.id}`);
  }
  if (g.tParto > v.t) return null;
  // Parto
  v.processos = v.processos.filter(p => p.id !== g.id);
  if (r.chance(0.12)) {
    escrever(v, { t: g.tConcepcao + 3, texto: 'A gravidez foi interrompida por um aborto espontâneo no terceiro mês.', relevancia: 'marco', tema: 'filhos', tom: 'ruim' });
    v.mente.felicidade = clamp(v.mente.felicidade - 12);
    return null;
  }
  const genero = r.chance(0.5) ? 'masculino' : 'feminino';
  const bebe = criarPessoa(v, r, {
    genero, idade: 0, municipioId: v.moradia.municipioId, sobrenome: v.eu.sobrenome,
    visual: visualHerdado(r, genero, v.eu.visual, outro?.visual)
  });
  bebe.tNasc = g.tParto;
  bebe.nome = '';
  const moraComigo = g.gestanteId === 'eu' || (!!outro && v.vinculos[outro.id]?.convivio.includes('casa')) || moraComFamiliaDeOrigem(v);
  vincular(v, bebe, { parentesco: 'filho', origem: 'familia', proximidade: moraComigo ? 80 : 35, convivio: moraComigo ? ['casa'] : [] });
  v.fatos[`outro_genitor_${bebe.id}`] = outro ? 1 : 0;
  if (g.gestanteId === 'eu') v.corpo.saude = clamp(v.corpo.saude - 3);
  v.mente.estresse = clamp(v.mente.estresse + 8);
  return bebe;
}

export function registrarNascimento(v: Vida, bebe: Pessoa, nome: string): void {
  bebe.nome = nome;
  const mes = MESES[mesDe(bebe.tNasc)];
  const primeiro = filhos(v).filter(f => f.id !== bebe.id).length === 0;
  escrever(v, {
    t: bebe.tNasc,
    texto: `Em ${mes}, nasceu ${nome}. ${primeiro ? `${flex(ge(v), 'Pai', 'Mãe', 'Mãe')} pela primeira vez, aos ${idade(v)}.` : `Mais ${flex(bebe.genero, 'um filho', 'uma filha')} na casa.`}`.replace(/Pai pela|Mãe pela/, m => m),
    relevancia: 'marco', tema: 'filhos', tom: 'bom', pessoas: [bebe.id]
  });
  lembrarCom(v, bebe.id, 'Nasceu.');
  v.mente.felicidade = clamp(v.mente.felicidade + 12);
}

export const NOMES_SUGERIDOS = (r: Rng, g: 'masculino' | 'feminino', ano: number) => {
  const nomes = new Set<string>();
  for (let k = 0; k < 20 && nomes.size < 3; k++) nomes.add(criarNomeBebe(r, g, ano));
  return [...nomes];
};

function criarNomeBebe(r: Rng, g: 'masculino' | 'feminino', ano: number): string {
  return sortearNome(r, g, ano);
}

/* --------------------------------------------------------------- Filhos */

export function processarFilhos(v: Vida, r: Rng): void {
  for (const f of filhos(v)) {
    const vin = v.vinculos[f.id];
    const i = idadePessoa(v, f);
    f.ocupacao = i >= 4 && i < 18 ? 'estudante' : f.ocupacao;
    const tempo = v.anoAtual.acoes.some(a => a.endsWith(`:${f.id}`)) || v.rotinas.some(rot => rot.id === 'tempo_familia');
    const alvo = vin.convivio.includes('casa') ? (tempo ? 85 : 62) : tempo ? 60 : 30;
    vin.proximidade = clamp(Math.round(vin.proximidade + (alvo - vin.proximidade) * 0.2 + r.normal() * 2));
    if (i >= 13 && i <= 17 && !tempo && r.chance(0.3)) vin.tensao = clamp(vin.tensao + 15);
    // Sair de casa
    if (i >= 18 && vin.convivio.includes('casa') && r.chance(0.08 + (i - 18) * 0.04)) {
      marcarFato(v, `saiu_de_casa_${f.id}`);
      vin.convivio = vin.convivio.filter(c => c !== 'casa');
      escrever(v, { texto: `${f.nome} saiu de casa, aos ${i}.`, relevancia: 'biografia', tema: 'filhos', pessoas: [f.id] });
    }
    if (i >= 18 && !f.ocupacao?.length || (i >= 18 && f.ocupacao === 'estudante' && r.chance(0.3))) {
      const oc = ocupacao(r.pick(OCUPACOES_POR_CLASSE[classeDoFilho(v)]));
      if (oc.idadeMin <= i) { f.ocupacao = f.genero === 'feminino' ? oc.nome[1] : oc.nome[0]; f.renda = liquido(salarioLocal(oc, f.municipioId), oc.contrato); }
    }
  }
}

function classeDoFilho(v: Vida): string {
  const renda = v.trabalho.atual?.salario ?? 0;
  return renda > 12000 ? 'alta' : renda > 6000 ? 'media' : renda > 3500 ? 'media_baixa' : renda > 1800 ? 'trabalhadora' : 'vulneravel';
}
