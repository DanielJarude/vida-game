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
  emRecessao, escrever, filhos, idade, idadePessoa, irmaos, lembrarCom, marcarFato, novoId, pais, parceiro, temFato, vinculosVivos
} from '../nucleo';
import { criarPessoa, vincular, visualHerdado } from '../pessoas';
import { processarCorpoDePessoa } from './corpo';
import { flex, ge } from '../texto';
import { MESES, mesDe } from '../tempo';
import { OCUPACOES, OCUPACOES_POR_CLASSE, ocupacao } from '../dados/ocupacoes';
import { liquido, salarioLocal } from './renda';
import { modeloMoradia } from '../dados/bens';
import { precoDeImovel } from './mercado';
import { dinheiro as fmt } from '../texto';
import { moraComFamiliaDeOrigem } from './domicilio';
import { sortearNome } from '../dados/nomes';
import { registrarMortes } from './luto';
import { garantirVida } from './filhos';
import { abalar } from './abalo';

/* ----------------------------------------------------------------- Mortes */

/** Quem morre neste ano: o corpo de cada pessoa decide; o luto conta. */
export function processarMortes(v: Vida, r: Rng): void {
  const mortes: { p: Pessoa; vin: Vida['vinculos'][string]; causa: string }[] = [];
  for (const { p, vin } of vinculosVivos(v)) {
    const causa = processarCorpoDePessoa(v, r, p);
    if (causa) mortes.push({ p, vin, causa });
  }
  registrarMortes(v, r, mortes, falecido => heranca(v, r, falecido));
}

const rotuloDeFamilia = (v: Vida, p: Pessoa) => ({ mae: 'mãe', pai: 'pai', avo: flex(p.genero, 'avô', 'avó') } as Record<string, string>)[v.vinculos[p.id]?.parentesco ?? ''] ?? 'parente';

function seuSua(p: Pessoa, rotulo: string): string {
  return `${flex(p.genero, 'seu', 'sua', 'sue')} ${rotulo}`;
}

/**
 * Herança dos pais (simplificada, sem inventário jurídico): o que a família
 * tinha — algum dinheiro guardado e, muitas vezes, a casa — divide-se entre
 * os filhos. Filho único herda a casa; com irmãos, a casa é vendida e o
 * dinheiro, repartido. O cônjuge vivo fica com tudo enquanto viver.
 */
function heranca(v: Vida, r: Rng, falecido: Pessoa): void {
  const conjugeVivo = falecido.parceiroId && v.pessoas[falecido.parceiroId]?.vivo;
  if (conjugeVivo) return; // o cônjuge fica com a casa; a herança vem depois
  const classe = v.origem.classe;
  const guardado = { vulneravel: 0, trabalhadora: 6000, media_baixa: 25000, media: 110000, alta: 900000 }[classe] * (0.4 + r.next());
  const temCasa = r.chance({ vulneravel: 0.3, trabalhadora: 0.55, media_baixa: 0.7, media: 0.8, alta: 0.95 }[classe]);
  const modelo = modeloMoradia({ vulneravel: 'casa_simples', trabalhadora: 'casa_simples', media_baixa: 'casa_2q', media: 'casa_3q', alta: 'casa_grande' }[classe]);
  const valorCasa = temCasa ? Math.round(precoDeImovel(v, modelo, falecido.municipioId) * 0.85 / 1000) * 1000 : 0;
  const irmaosVivos = irmaos(v).filter(i => i.vivo).length;
  const herdeiros = 1 + irmaosVivos;
  const dinheiroParte = Math.round(guardado / herdeiros / 1000) * 1000;
  const unico = herdeiros === 1 && valorCasa > 0;
  const parte = unico ? dinheiroParte : dinheiroParte + Math.round(valorCasa * 0.92 / herdeiros / 1000) * 1000;
  if (parte <= 0 && !unico) return;
  v.financas.conta += parte;
  let total = parte;
  if (unico) {
    v.financas.bens.push({ id: `i${v.seq++}`, tipo: 'imovel', modeloId: modelo.id, nome: 'casa da família', valor: valorCasa, tCompra: v.t, municipioId: falecido.municipioId, estado: 55, herdado: true, dono: 'eu', historia: [{ t: v.t, texto: `Herdada de ${falecido.nome}.` }] });
    total += valorCasa;
  }
  v.fatos['herdado_total'] = (v.fatos['herdado_total'] ?? 0) + total;
  const texto = unico
    ? `O inventário de ${falecido.nome} terminou meses depois. A casa onde você cresceu ficou para você${parte > 0 ? `, com ${fmt(parte)} que estavam guardados` : ''}.`
    : `O inventário de ${falecido.nome} terminou meses depois: ${fmt(parte)} de herança${herdeiros > 1 ? `, a mesma parte que coube a cada irmão${valorCasa > 0 ? ' depois de vender a casa' : ''}` : ''}.`;
  escrever(v, { texto, relevancia: 'biografia', tema: 'dinheiro' });
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------ Família de origem */

export function processarFamiliaDeOrigem(v: Vida, r: Rng): void {
  const i = idade(v);
  const [p1, p2] = [pais(v).find(p => p.genero === 'feminino'), pais(v).find(p => p.genero === 'masculino')];

  for (const p of [...pais(v), ...vinculosVivos(v).filter(x => x.vin.parentesco === 'avo').map(x => x.p)]) {
    const ip = idadePessoa(v, p);
    // A saúde de quem envelhece piora — e isso vira um momento difícil em que dá para estar junto.
    if (ip >= 65 && p.saude < 42 && (!p.aperto || v.t - p.aperto.t > 36) && r.chance(0.35)) {
      p.aperto = { tipo: 'doenca', t: v.t };
      if (v.vinculos[p.id].proximidade >= 40) escrever(v, { texto: `${capital(seuSua(p, rotuloDeFamilia(v, p)))} ${p.nome} ficou internad${flex(p.genero, 'o', 'a', 'e')} por uns dias. Voltou para casa mais devagar.`, relevancia: 'cotidiano', tema: 'familia', tom: 'ruim', pessoas: [p.id] });
    }
    if (v.vinculos[p.id].parentesco === 'avo') continue;
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
    const riscoPerda = (!ocAtual ? 0.05 : ocAtual.contrato === 'servidor' || (ocAtual.contrato === 'militar' && !ocAtual.duracao && ocAtual.nivel > 0) ? 0.003 : ocAtual.contrato === 'clt' ? 0.045 : 0.06) * (emRecessao(v) ? 2 : 1);
    if (p.renda > 0 && r.chance(riscoPerda)) {
      p.renda = 0;
      const antes = p.ocupacao;
      p.ocupacao = flex(p.genero, 'desempregado', 'desempregada');
      p.aperto = { tipo: 'desemprego', t: v.t };
      if (i < 25 && moraComFamiliaDeOrigem(v)) {
        escrever(v, { texto: `${capital(seuSua(p, v.vinculos[p.id].parentesco === 'mae' ? 'mãe' : 'pai'))} perdeu o emprego${antes ? ` de ${antes}` : ''}. O dinheiro em casa encurtou.`, relevancia: 'biografia', tema: 'familia', tom: 'ruim', pessoas: [p.id] });
        v.mente.estresse = clamp(v.mente.estresse + 6);
      }
    } else if (p.renda === 0 && p.ocupacao?.startsWith('desempregad') && r.chance(0.55)) {
      // Recoloca-se na mesma área, quase sempre; às vezes num degrau abaixo.
      const mesmaArea = ocAtual ? OCUPACOES.filter(o => o.trilha === ocAtual.trilha && Math.abs(o.nivel - ocAtual.nivel) <= 1 && !o.concurso && o.contrato !== 'estagio' && o.contrato !== 'aprendiz' && o.contrato !== 'militar') : [];
      const oc = mesmaArea.length && r.chance(0.8) ? (r.chance(0.6) && !ocAtual!.concurso && ocAtual!.contrato !== 'militar' && ocAtual!.contrato !== 'servidor' ? ocAtual! : r.pick(mesmaArea)) : ocupacao(r.pick(OCUPACOES_POR_CLASSE[v.origem.classe]));
      if (oc.idadeMin <= ip) {
        p.ocupacaoId = oc.id;
        p.ocupacao = p.genero === 'feminino' ? oc.nome[1] : oc.nome[0];
        p.renda = liquido(salarioLocal(oc, p.municipioId, 0.85 + r.next() * 0.3), oc.contrato);
        if (p.aperto?.tipo === 'desemprego') p.aperto = undefined;
        if (i < 25 && moraComFamiliaDeOrigem(v)) escrever(v, { texto: `${capital(seuSua(p, v.vinculos[p.id].parentesco === 'mae' ? 'mãe' : 'pai'))} arrumou trabalho de novo, como ${p.ocupacao}.`, relevancia: 'cotidiano', tema: 'familia', pessoas: [p.id] });
      }
    }
  }

  // Separação dos pais
  if (p1 && p2 && p1.parceiroId === p2.id && r.chance(i < 18 ? 0.018 : 0.008)) {
    p1.parceiroId = undefined;
    p2.parceiroId = undefined;
    p1.aperto = { tipo: 'separacao', t: v.t };
    p2.aperto = { tipo: 'separacao', t: v.t };
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
      relevancia: 'marco', tema: 'familia', tom: 'ruim', pessoas: [p1.id, p2.id], evento: { tipo: 'ruptura', peso: i < 18 ? 55 : 30 }
    });
    lembrarCom(v, p1.id, i < 18 ? `Seus pais se separaram quando você tinha ${i} anos.` : 'Seus pais se separaram.', 'conflito', 2);
    lembrarCom(v, p2.id, i < 18 ? `Seus pais se separaram quando você tinha ${i} anos.` : 'Seus pais se separaram.', 'conflito', 2);
    if (i < 18) abalar(v, 'a separação dos pais', -10, 12);
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
      vincular(v, bebe, { parentesco: outro && v.vinculos[outro.id]?.parentesco === 'pai' ? 'irmao' : 'meio_irmao', origem: 'familia', proximidade: 60, convivio: ['casa'] });
      bebe.genitores = [maeCasa.id, ...(outro ? [outro.id] : [])];
      lembrarCom(v, bebe.id, `Nasceu quando você tinha ${i} anos.`, 'inicio', 2);
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
    vidaDoIrmao(v, r, irmao, ii);
    // Morando de favor na casa de um irmão, a casa é dele: não é ele quem "sai de casa" (achado da leitura de biografias: um laço anual).
    if (vin.convivio.includes('casa') && ii >= 19 && v.moradia.tipo !== 'parente' && r.chance(0.12 + (ii - 19) * 0.03)) {
      marcarFato(v, `saiu_de_casa_${irmao.id}`);
      vin.convivio = vin.convivio.filter(c => c !== 'casa');
      if (moraComFamiliaDeOrigem(v)) {
        escrever(v, { texto: `${irmao.nome} saiu de casa. O quarto ficou vazio.`, relevancia: 'cotidiano', tema: 'familia', pessoas: [irmao.id] });
        lembrarCom(v, irmao.id, `Dividiram a casa da infância até ${Math.floor(v.t / 12)}, quando ${flex(irmao.genero, 'ele', 'ela', 'elu')} saiu.`, 'casa', 2);
      }
    }
  }
}

/**
 * Irmãos também têm vida: namoram, casam, se separam, perdem emprego. O
 * jogador não decide nada disso — fica sabendo, e pode estar junto.
 */
function vidaDoIrmao(v: Vida, r: Rng, irmao: Pessoa, ii: number): void {
  if (ii < 20 || ii > 70) return;
  const vin = v.vinculos[irmao.id];
  const par = irmao.parceiroId ? v.pessoas[irmao.parceiroId] : undefined;
  if (!par) {
    if (ii < 50 && r.chance(ii < 35 ? 0.12 : 0.05)) {
      const p = criarPessoa(v, r, { genero: irmao.genero === 'feminino' ? 'masculino' : 'feminino', idade: ii + r.int(-3, 3), municipioId: irmao.municipioId });
      p.parceiroId = irmao.id;
      irmao.parceiroId = p.id;
      v.fatos[`irmao_uniao_${irmao.id}`] = v.t;
      if (vin.proximidade >= 45) escrever(v, { texto: `${irmao.nome} ${r.chance(0.5) ? 'casou' : 'foi morar'} com ${p.nome}.`, relevancia: 'cotidiano', tema: 'familia', tom: 'bom', pessoas: [irmao.id] });
      lembrarCom(v, irmao.id, `Casou com ${p.nome}.`, 'romance', 1);
    }
    return;
  }
  if (!par.vivo) { irmao.parceiroId = undefined; return; }
  if (r.chance(0.02)) {
    irmao.parceiroId = undefined;
    par.parceiroId = undefined;
    irmao.aperto = { tipo: 'separacao', t: v.t };
    escrever(v, { texto: `${irmao.nome} e ${par.nome} se separaram. ${flex(irmao.genero, 'Ele', 'Ela', 'Elu')} passou uns tempos mal.`, relevancia: vin.proximidade >= 50 ? 'biografia' : 'cotidiano', tema: 'familia', tom: 'ruim', pessoas: [irmao.id] });
    lembrarCom(v, irmao.id, `Separou-se de ${par.nome}.`, 'conflito', 1);
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
  const par = parceiro(v) ?? vinculosVivos(v).find(x => x.vin.romance?.estagio === 'saindo' && !x.vin.romance.secreto);
  if (!par || !par.vin.romance) return;
  // Sem gravidez entre adolescente e adulto, nem antes dos 16.
  const [a, b] = [idade(v), idadePessoa(v, par.p)];
  if (Math.min(a, b) < 16 || (Math.min(a, b) < 18 && Math.max(a, b) >= 18)) return;
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
    // "De novo" é de gravidez: filho que chegou por adoção não conta.
    const jaTem = filhos(v).some(f => !temFato(v, `adotado_${f.id}`));
    escrever(v, {
      t: g.tConcepcao + 2,
      texto: g.planejada
        ? jaTem ? `${quemGesta} de novo. Desta vez, a notícia veio sem susto.` : `${quemGesta}. Depois de meses tentando, o teste deu positivo.`
        : jaTem ? `${quemGesta} outra vez — sem planejar.` : `${quemGesta}. Não estava nos planos.`,
      relevancia: 'marco', tema: 'filhos', tom: g.planejada ? 'bom' : 'neutro', pessoas: outro ? [outro.id] : [],
      evento: { tipo: 'gravidez', pessoaId: outro?.id, peso: 50 }
    });
    marcarFato(v, `gravidez_descoberta_${g.id}`);
    if (outro && v.vinculos[outro.id]) {
      lembrarCom(v, outro.id, g.planejada ? 'O teste deu positivo, depois de tentarem.' : 'Uma gravidez que não estava nos planos.', 'filho', 2, g.tConcepcao + 2);
      if (v.vinculos[outro.id].romance) v.vinculos[outro.id].romance!.planoFilhos = 'evitando';
    }
  }
  if (g.tParto > v.t) return null;
  // Parto
  v.processos = v.processos.filter(p => p.id !== g.id);
  if (r.chance(0.12)) {
    escrever(v, { t: g.tConcepcao + 3, texto: 'A gravidez foi interrompida por um aborto espontâneo no terceiro mês.', relevancia: 'marco', tema: 'filhos', tom: 'ruim' });
    abalar(v, 'a gravidez que não seguiu', -12, 4);
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
  const vinBebe = vincular(v, bebe, { parentesco: 'filho', origem: 'familia', proximidade: moraComigo ? 80 : 35, convivio: moraComigo ? ['casa'] : [] });
  vinBebe.tInicio = g.tParto;
  vinBebe.presenca = moraComigo ? 50 : 15;
  bebe.genitores = ['eu', ...(outro ? [outro.id] : [])];
  garantirVida(bebe);
  v.fatos[`outro_genitor_${bebe.id}`] = outro ? 1 : 0;
  if (g.gestanteId === 'eu') v.corpo.saude = clamp(v.corpo.saude - 3);
  abalar(v, 'a chegada do bebê', 0, 8);
  return bebe;
}

export function registrarNascimento(v: Vida, bebe: Pessoa, nome: string): void {
  bebe.nome = nome;
  const mes = MESES[mesDe(bebe.tNasc)];
  const primeiro = filhos(v).filter(f => f.id !== bebe.id).length === 0;
  const outroId = bebe.genitores?.find(x => x !== 'eu');
  const outro = outroId ? v.pessoas[outroId] : undefined;
  escrever(v, {
    t: bebe.tNasc,
    texto: `Em ${mes}, nasceu ${nome}. ${primeiro ? `${flex(ge(v), 'Pai', 'Mãe', 'Mãe')} pela primeira vez, aos ${idade(v)}.` : `Mais ${flex(bebe.genero, 'um filho', 'uma filha')} na casa.`}`,
    relevancia: 'marco', tema: 'filhos', tom: 'bom', pessoas: [bebe.id, ...(outro ? [outro.id] : [])],
    evento: { tipo: 'filho_nasceu', pessoaId: bebe.id, peso: 80 }
  });
  // Os pais do jogador viram avós: isso também é história deles com você.
  for (const x of vinculosVivos(v)) if (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai') lembrarCom(v, x.p.id, primeiro ? `Viraram avós: nasceu ${nome}.` : `Nasceu ${nome}, mais um neto.`, 'filho', primeiro ? 2 : 1, bebe.tNasc);
  lembrarCom(v, bebe.id, `Nasceu em ${mes} de ${Math.floor(bebe.tNasc / 12)}${outro ? `, ${flex(bebe.genero, 'filho seu', 'filha sua', 'filhe sue')} e de ${outro.nome}` : ''}. Você tinha ${idade(v)} anos.`, 'inicio', 3, bebe.tNasc);
  if (outro && v.vinculos[outro.id]) lembrarCom(v, outro.id, `Nasceu ${nome}, ${primeiro ? 'o primeiro filho de vocês' : 'mais um filho de vocês'}.`.replace('o primeiro filho', flex(bebe.genero, 'o primeiro filho', 'a primeira filha', 'e primeire filhe')), 'filho', 3, bebe.tNasc);
  abalar(v, `o nascimento de ${nome}`, 12, 0);
}

export const NOMES_SUGERIDOS = (r: Rng, g: 'masculino' | 'feminino', ano: number) => {
  const nomes = new Set<string>();
  for (let k = 0; k < 20 && nomes.size < 3; k++) nomes.add(criarNomeBebe(r, g, ano));
  return [...nomes];
};

function criarNomeBebe(r: Rng, g: 'masculino' | 'feminino', ano: number): string {
  return sortearNome(r, g, ano);
}

