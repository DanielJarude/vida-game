/**
 * Romance.
 *
 * interesse → saindo → namoro → morando junto → casamento (ou ex).
 *
 * A outra pessoa tem vontade própria: `envolvimento` é o quanto ELA está na
 * relação. Ele sobe com compatibilidade e tempo juntos, desce com tensão,
 * distância, dinheiro apertado e descaso. Quem termina pode ser ela.
 *
 * IDADE (regras graduais, `regraDeIdade`):
 *  - ninguém com menos de 14 anos;
 *  - dois adolescentes: diferença de até 3 anos;
 *  - adolescente de 16–17 com jovem adulto de até 20, diferença de até 3
 *    anos (colegas de escola, 17 e 18): namoro adolescente — sem morar junto,
 *    casar ou planejar filho antes dos 18;
 *  - qualquer outra combinação de menor com adulto: não existe no jogo;
 *  - dois adultos: permitido; diferença grande só pesa no interesse.
 *
 * CRISES têm causa: o trabalho da outra pessoa, a família dela, o dinheiro, o
 * cansaço dos filhos pequenos. A causa é narrada e fica na história do casal.
 *
 * CASOS: o jogador pode ter um caso escondido. O segredo pesa, pode ser
 * descoberto (a reação do jogador é decisão dele; a da outra pessoa, dela).
 */

import { comecarVidaEmComum, separarVidaMaterial } from './partilha';
import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { EstagioRomance, Genero, Pessoa, Romance, Vida, Vinculo } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, parceiro, vinculosVivos } from '../nucleo';
import { compatibilidade } from './social';
import { flex } from '../texto';
import { bloqueio, PERMITIDO, podeTentar, type Veredito } from '../plausibilidade';
import { aplicarPersonalidade } from '../personalidade';
import { filhosEmComum } from './vinculos';
import { abalar } from './abalo';
import { ficouSabendo, registrarSegredo } from './exposicao';

const ESTAGIOS_ATIVOS: EstagioRomance[] = ['saindo', 'namoro', 'morando_junto', 'casamento'];

export function atraiGenero(atracao: Pessoa['atracao'] | undefined, g: Genero): boolean {
  if (!atracao) return false;
  if (atracao === 'ambos') return true;
  if (g === 'nao_binario') return false;
  return (atracao === 'homens') === (g === 'masculino');
}

/** A regra de idade para duas pessoas começarem algo. */
export function regraDeIdade(a: number, b: number): Veredito {
  const menor = Math.min(a, b);
  const maior = Math.max(a, b);
  const dif = maior - menor;
  if (menor < 14) return bloqueio('ilegal', 'Ninguém namora antes dos 14.');
  if (maior < 18) return dif <= 3 ? PERMITIDO : bloqueio('impossivel', 'Nessa idade, a diferença é grande demais.');
  if (menor < 18) {
    if (menor >= 16 && maior <= 20 && dif <= 3) return { grau: 'permitido', motivo: 'Namoro de adolescente: morar junto e casar, só depois dos 18.' };
    return bloqueio('impossivel', 'Adulto e adolescente com essa diferença de idade: não.');
  }
  return PERMITIDO;
}

/** Um dos dois é menor de idade (romance adolescente, com seus limites). */
export const romanceAdolescente = (v: Vida, p: Pessoa) => idade(v) < 18 || idadePessoa(v, p) < 18;

/** Os dois podem, legal e mutuamente, começar algo? */
export function podeTerRomance(v: Vida, p: Pessoa, vin: Vinculo): boolean {
  if (p.especie || vin.parentesco || !p.vivo) return false;
  if (!podeTentar(regraDeIdade(idade(v), idadePessoa(v, p)))) return false;
  if (!atraiGenero(p.atracao, v.eu.genero)) return false;
  if (v.eu.atracao && !atraiGenero(v.eu.atracao, p.genero)) return false;
  if (p.parceiroId) return false;
  return true;
}

/** O quanto a pessoa se interessa pelo jogador, de saída. */
export function interesseInicial(v: Vida, p: Pessoa): number {
  const c = compatibilidade(v, p);
  const aparencia = (v.corpo.aparencia - 50) / 2;
  const i = idade(v);
  const ip = idadePessoa(v, p);
  const difIdade = Math.abs(i - ip);
  // Diferença grande pesa mais entre gente jovem (25 e 45 não é 55 e 75).
  const fator = Math.min(i, ip) < 30 ? 3 : 1.5;
  return clamp(Math.round(40 + c * 30 + aparencia * 0.5 - Math.max(0, difIdade - 6) * fator));
}

export const romanceAtivo = (vin: Vinculo) => !!vin.romance && ESTAGIOS_ATIVOS.includes(vin.romance.estagio);

export function mudarEstagio(v: Vida, vin: Vinculo, estagio: EstagioRomance, fim?: Romance['fim']): void {
  if (!vin.romance) vin.romance = { estagio, tEstagio: v.t, envolvimento: 50 };
  const rom = vin.romance;
  if (rom.tInicio === undefined && estagio !== 'interesse' && estagio !== 'ex') rom.tInicio = v.t;
  rom.estagio = estagio;
  rom.tEstagio = v.t;
  if (estagio !== 'ex') rom.fim = undefined;
  if (estagio === 'namoro' && !rom.planoFilhos) rom.planoFilhos = 'evitando';
  if ((estagio === 'morando_junto' || estagio === 'casamento') && v.pessoas[vin.pessoaId]) comecarVidaEmComum(v, v.pessoas[vin.pessoaId]);
  if (estagio === 'ex') {
    rom.fim = fim ?? 'termino';
    rom.secreto = undefined;
    vin.estagio = vin.proximidade >= 45 ? 'amigo' : 'afastado';
    vin.convivio = vin.convivio.filter(c => c !== 'casa');
    rom.planoFilhos = undefined;
    rom.segredo = undefined;
  }
}

/* ------------------------------------------------------------- Interesse */

/**
 * De vez em quando alguém do convívio chama atenção. Isso só cria o
 * INTERESSE — o que fazer com ele é decisão do jogador (conteúdo
 * `rom_alguem_especial`). Quem já está num relacionamento raramente sente.
 */
export function surgirInteresse(v: Vida, r: Rng): void {
  const i = idade(v);
  if (i < 13) return;
  const temParceiro = !!parceiro(v);
  const chance = temParceiro ? 0.05 : i < 16 ? 0.35 : i < 30 ? 0.4 : i < 50 ? 0.24 : i < 70 ? 0.14 : 0.07;
  if (!r.chance(chance)) return;
  const jaInteressado = vinculosVivos(v).some(x => x.vin.romance?.estagio === 'interesse' || (x.vin.romance?.estagio === 'saindo'));
  if (jaInteressado) return;
  // Quem desperta interesse é alguém do convívio (ou amigo). O jogador
  // ainda sem orientação definida pode se interessar por qualquer gênero —
  // quem define isso é o jogador, na decisão que vem a seguir.
  const candidatos = vinculosVivos(v).filter(({ p, vin }) =>
    !vin.parentesco && (!vin.romance || vin.romance.estagio === 'ex' && vin.romance.fim !== 'morte') &&
    (vin.convivio.length > 0 || vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo') &&
    // Quem acabou de dizer "prefiro a amizade" não vira, de novo, a pessoa em quem você pensa.
    !(v.fatos[`recusa_romance_${p.id}`] !== undefined && v.t - v.fatos[`recusa_romance_${p.id}`] < 36) &&
    podeTerRomanceSemOrientacaoDoJogador(v, p, vin));
  const escolhido = r.weighted(candidatos, ({ p }) => 1 + Math.max(0, compatibilidade(v, p) + 0.5) * 2);
  if (!escolhido) return;
  const antigo = escolhido.vin.romance;
  escolhido.vin.romance = { estagio: 'interesse', tEstagio: v.t, envolvimento: interesseInicial(v, escolhido.p), tInicio: antigo?.tInicio };
}

function podeTerRomanceSemOrientacaoDoJogador(v: Vida, p: Pessoa, vin: Vinculo): boolean {
  if (v.eu.atracao) return podeTerRomance(v, p, vin);
  const atracaoOriginal = v.eu.atracao;
  v.eu.atracao = 'ambos';
  const ok = podeTerRomance(v, p, vin);
  v.eu.atracao = atracaoOriginal;
  return ok;
}

/* ---------------------------------------------------------- Evolução */

export function processarRomance(v: Vida, r: Rng): void {
  for (const { p, vin } of vinculosVivos(v)) {
    const rom = vin.romance;
    if (!rom) continue;
    const meses = v.t - rom.tEstagio;

    if (rom.estagio === 'interesse') {
      // Quem pediu um tempo responde — a resposta é dela, e nasce do que
      // aconteceu entre vocês nesse meio-tempo.
      if (rom.pediuTempo !== undefined && v.t - rom.pediuTempo >= 6) { responderDepoisDoTempo(v, r, p, vin); continue; }
      // Interesse sem atitude se dissolve.
      if (meses >= 24) vin.romance = rom.tInicio !== undefined ? { ...rom, estagio: 'ex', fim: rom.fim ?? 'termino' } : undefined;
      continue;
    }
    if (rom.estagio === 'ex') continue;
    if (rom.secreto) { processarCaso(v, r, p, vin); continue; }

    const c = compatibilidade(v, p);
    const longe = p.municipioId !== v.moradia.municipioId;
    const cuidou = v.anoAtual.acoes.some(a => a.endsWith(`:${p.id}`));
    // Para onde a relação tende a ir: compatibilidade e cuidado definem o
    // patamar; desgaste, dinheiro curto, estresse e filhos pequenos puxam
    // para baixo. O envolvimento anda em direção a esse alvo, com ruído.
    const anosJuntos = (v.t - (rom.tInicio ?? vin.tInicio)) / 12;
    const pequenos = vinculosVivos(v).filter(x => x.vin.parentesco === 'filho' && idadePessoa(v, x.p) < 5).length;
    let alvo = 52 + c * 30 + (cuidou ? 10 : -8) + (v.rotinas.some(x => x.id === 'tempo_familia') ? 6 : 0) - (longe ? 15 : 0);
    alvo -= vin.tensao / 4;
    alvo += (vin.confianca - 60) / 8;
    if (v.financas.negativado) alvo -= 8;
    // Desemprego longo pesa na relação; uma pausa combinada para cuidar da casa, não.
    const semTrabalho = !v.trabalho.atual && !v.trabalho.aposentadoria && !v.trabalho.pausa && !v.educacao.matricula && v.trabalho.desempregadoDesde !== undefined && v.t - v.trabalho.desempregadoDesde >= 24;
    if (semTrabalho) alvo -= 5;
    // O que se esconde da parceria (um dinheiro por fora) também.
    if (v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined) alvo -= 4;
    if (v.mente.estresse > 65) alvo -= 6;
    if (v.personalidade.tracos.empatia > 20) alvo += 4;
    if (v.personalidade.tracos.impulsividade > 30) alvo -= 5;
    if (anosJuntos > 4) alvo -= Math.min(16, 4 + (anosJuntos - 4) * 0.6);
    alvo -= pequenos * 4;
    // Quem queria filhos e ouviu "nunca" carrega isso.
    if (v.fatos[`recusou_filhos_${p.id}`] !== undefined && p.querFilhos === 'sim') alvo -= 8;
    // Crises que vêm de fora: a outra pessoa também muda, adoece, se cansa.
    // Toda crise tem causa, e a causa fica na história.
    const ultimaCrise = v.fatos[`crise_${p.id}`];
    const chanceCrise = ultimaCrise !== undefined && v.t - ultimaCrise < 36 ? 0.04 : 0.11;
    if (rom.estagio !== 'saindo' && r.chance(chanceCrise)) {
      crise(v, r, p, vin, pequenos);
      alvo -= 15;
    }
    rom.envolvimento = clamp(Math.round(rom.envolvimento + (alvo - rom.envolvimento) * 0.3 + r.normal() * 5));
    vin.proximidade = clamp(Math.round(vin.proximidade * 0.6 + rom.envolvimento * 0.4));
    vin.tensao = Math.round(vin.tensao * 0.7);
    // Confiança se constrói devagar, quando não há motivo para quebrá-la.
    if (vin.tensao < 40) vin.confianca = clamp(Math.round(vin.confianca + (85 - vin.confianca) * 0.06));
    vin.tUltimoContato = v.t;
    // Guardar um segredo pesa em quem guarda. Um caso que acabou há anos vai
    // ficando para trás — o segredo continua existindo, mas pesa menos.
    if (rom.segredo) {
      const caso = v.vinculos[rom.segredo.pessoaId]?.romance;
      const acabou = !caso || caso.estagio === 'ex';
      // O peso de guardar o segredo entra na cabeça pelo equilíbrio (`estado.ts`).
      if (acabou && v.t - (caso?.tEstagio ?? rom.segredo.t) > 60) rom.segredo = undefined;
    }

    if (rom.estagio === 'saindo') {
      if (rom.envolvimento < 32 || (meses >= 24 && rom.envolvimento < 55)) {
        mudarEstagio(v, vin, 'ex');
        vin.estagio = 'conhecido';
        escrever(v, { texto: `As saídas com ${p.nome} foram rareando até pararem.`, relevancia: 'cotidiano', tema: 'amor', pessoas: [p.id] });
      }
      continue;
    }

    // Namoro em diante: a outra pessoa pode terminar — de vez, ou na zona morna.
    const morno = rom.envolvimento < 45 && r.chance(rom.estagio === 'namoro' ? 0.3 : 0.2);
    if (rom.envolvimento < 18 || vin.tensao >= 85 || morno) {
      terminar(v, p, vin, 'ela');
    }
  }
}

/**
 * A resposta de quem pediu um tempo. Estar por perto nesse meio-tempo
 * (qualquer momento juntos no ano) pesa a favor; o resto é quem ela é.
 */
function responderDepoisDoTempo(v: Vida, r: Rng, p: Pessoa, vin: Vinculo): void {
  const rom = vin.romance!;
  const perto = v.anoAtual.acoes.some(a => a.endsWith(`:${p.id}`));
  const valor = rom.envolvimento + (perto ? 8 : -4) + compatibilidade(v, p) * 6 + r.normal() * 6;
  const ele = flex(p.genero, 'ele', 'ela', 'elu');
  const outra = vinculosVivos(v).some(x => x.p.id !== p.id && x.vin.romance?.estagio === 'saindo' && !x.vin.romance.secreto);
  if (valor >= 56 && !parceiro(v) && !p.parceiroId && !outra) {
    mudarEstagio(v, vin, 'saindo');
    rom.envolvimento = Math.max(rom.envolvimento, 58);
    rom.pediuTempo = undefined;
    escrever(v, { texto: `${p.nome} procurou você: pensou e quer tentar. Começaram a sair.`, relevancia: 'biografia', tema: 'amor', tom: 'bom', pessoas: [p.id], evento: { tipo: 'namoro', pessoaId: p.id, peso: 15 } });
    lembrarCom(v, p.id, `Depois de pensar, ${ele} disse sim.`, 'romance', 2);
    abalar(v, `o sim de ${p.nome}`, 6, 0);
    return;
  }
  vin.romance = undefined;
  v.fatos[`recusa_romance_${p.id}`] = v.t;
  escrever(v, { texto: `${p.nome} respondeu, com cuidado, que prefere continuar só amizade.`, relevancia: 'cotidiano', tema: 'amor', pessoas: [p.id] });
  lembrarCom(v, p.id, `Depois de pensar, ${ele} preferiu a amizade.`, 'romance', 1);
  abalar(v, `a resposta de ${p.nome}`, -4, 2);
}

/** Uma crise com causa. A causa é do mundo; o que fazer com ela é do jogador. */
function crise(v: Vida, r: Rng, p: Pessoa, vin: Vinculo, pequenos: number): void {
  const ele = flex(p.genero, 'ele', 'ela', 'elu');
  const causas: { texto: string; curto: string; fase?: boolean }[] = [];
  if (p.renda > 0) causas.push({ texto: `O trabalho de ${p.nome} apertou: chegava tarde, dormia mal, respondia seco. A casa sentiu.`, curto: 'o trabalho apertou' });
  if (pequenos > 0) causas.push({ texto: `O cansaço dos primeiros anos das crianças: você e ${p.nome} viraram dois turnos de uma mesma casa.`, curto: 'o cansaço das crianças pequenas' });
  if (v.financas.negativado || v.financas.conta < 0) causas.push({ texto: `O dinheiro curto virou assunto de toda noite entre você e ${p.nome}.`, curto: 'o dinheiro curto' });
  // As causas da meia-idade: o que a casa atravessa depois dos filhos pequenos (FIX #7).
  const casa = vinculosVivos(v).filter(x => x.vin.convivio.includes('casa'));
  const adolescente = casa.find(x => (x.vin.parentesco === 'filho' || x.vin.parentesco === 'enteado') && idadePessoa(v, x.p) >= 13 && idadePessoa(v, x.p) <= 17);
  if (adolescente) causas.push({ texto: `A adolescência de ${adolescente.p.nome} dentro de casa: porta batida, castigo discutido, e você e ${p.nome} de lados diferentes em quase toda briga.`, curto: `a adolescência de ${adolescente.p.nome}` });
  const filhos = vinculosVivos(v).filter(x => x.vin.parentesco === 'filho');
  const saidas = filhos.map(x => v.fatos[`saiu_de_casa_${x.p.id}`]).filter((t): t is number => t !== undefined);
  if (filhos.length && filhos.every(x => !x.vin.convivio.includes('casa')) && saidas.length && v.t - Math.max(...saidas) <= 36) {
    causas.push({ texto: `Com a casa vazia, você e ${p.nome} perceberam que quase só falavam dos filhos. O silêncio do jantar ficou grande.`, curto: 'a casa vazia' });
  }
  const cuidado = casa.find(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai' || x.vin.parentesco === 'sogro') && idadePessoa(v, x.p) >= 70)
    ?? vinculosVivos(v).find(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai') && x.p.aperto?.tipo === 'doenca' && v.t - x.p.aperto.t < 24);
  if (cuidado && idade(v) >= 35) causas.push({ texto: `O cuidado com ${cuidado.p.nome} tomou as noites e os fins de semana; sobrou pouco para vocês dois.`, curto: `o cuidado com ${cuidado.p.nome}` });
  const e = v.trabalho.atual;
  if (e && idade(v) >= 40 && idade(v) < 62 && v.t - (e.tPosto ?? e.tInicio) >= 120) causas.push({ texto: `Os anos parados no mesmo posto viraram assunto em casa — e, entre você e ${p.nome}, cobrança.`, curto: 'o trabalho parado no mesmo lugar' });
  const apo = v.trabalho.aposentadoria;
  if (apo && v.t - apo.t <= 24) causas.push({ texto: `A aposentadoria pôs vocês dois em casa o dia inteiro, e a rotina de ${p.nome} não tinha lugar para isso.`, curto: 'a aposentadoria' });
  causas.push({ texto: `${p.nome} atravessou uma fase difícil: ${ele} ficou calad${flex(p.genero, 'o', 'a', 'e')}, distante, com a cabeça longe.`, curto: 'uma fase difícil', fase: true });
  causas.push({ texto: `A família de ${p.nome} entrou em crise, e ${ele} passou meses indo e voltando da casa dos pais.`, curto: 'a família dele em crise'.replace('dele', flex(p.genero, 'dele', 'dela', 'delu')), fase: true });
  const x = r.pick(causas);
  vin.tensao = clamp(vin.tensao + r.int(25, 40));
  v.fatos[`crise_${p.id}`] = v.t;
  if (x.fase) p.aperto = { tipo: 'fase', t: v.t };
  escrever(v, { texto: x.texto, relevancia: 'cotidiano', tema: 'amor', tom: 'ruim', pessoas: [p.id] });
  lembrarCom(v, p.id, `Um tempo difícil: ${x.curto}.`, 'conflito', 1);
}

/** Fim de relacionamento. `quem`: 'jogador' ou 'ela' (a outra pessoa, qualquer gênero). */
export function terminar(v: Vida, p: Pessoa, vin: Vinculo, quem: 'jogador' | 'ela', motivo?: 'traicao'): void {
  const rom = vin.romance;
  if (!rom) return;
  const anos = Math.max(1, Math.round((v.t - (rom.tInicio ?? vin.tInicio)) / 12));
  const era = rom.estagio;
  const moravam = era === 'morando_junto' || era === 'casamento';
  const emComum = filhosEmComum(v, p.id).filter(f => f.vivo);
  mudarEstagio(v, vin, 'ex', era === 'casamento' ? 'divorcio' : 'termino');
  let texto: string;
  if (era === 'casamento') {
    texto = quem === 'jogador'
      ? `Pediu o divórcio. ${anos} anos com ${p.nome} terminaram num cartório.`
      : motivo === 'traicao' ? `${p.nome} pediu o divórcio depois de descobrir a traição. Eram ${anos} anos juntos.` : `${p.nome} pediu o divórcio depois de ${anos} anos juntos.`;
  } else if (moravam) {
    texto = quem === 'jogador' ? `Decidiu se separar de ${p.nome}. Cada um foi para um lado.` : motivo === 'traicao' ? `${p.nome} fez as malas no mesmo dia em que soube.` : `${p.nome} fez as malas e foi embora.`;
  } else {
    texto = quem === 'jogador' ? `Terminou o namoro com ${p.nome}.` : `${p.nome} terminou o namoro.`;
  }
  escrever(v, {
    texto, relevancia: era === 'namoro' && anos < 2 ? 'biografia' : 'marco', tema: 'amor', tom: 'ruim', pessoas: [p.id], escolha: quem === 'jogador',
    evento: { tipo: era === 'casamento' ? 'divorcio' : 'termino', pessoaId: p.id, peso: moravam ? 70 : 30 }
  });
  lembrarCom(v, p.id, era === 'casamento' ? 'Divorciaram-se.' : moravam ? 'Separaram-se.' : 'Terminaram.', 'conflito', moravam ? 3 : 2);
  abalar(v, era === 'casamento' ? `o divórcio de ${p.nome}` : moravam ? `a separação de ${p.nome}` : `o fim do namoro com ${p.nome}`, -(era === 'casamento' ? 18 : 10), moravam ? 14 : 6);
  vin.confianca = clamp(vin.confianca - (motivo === 'traicao' ? 40 : 15));

  // Os filhos atravessam a separação dos pais.
  for (const f of emComum) {
    const vf = v.vinculos[f.id];
    if (!vf) continue;
    const i = idadePessoa(v, f);
    lembrarCom(v, f.id, i < 18 ? `Você e ${p.nome} se separaram quando ${flex(f.genero, 'ele', 'ela', 'elu')} tinha ${i} anos.` : `Viu os pais se separarem, já adult${flex(f.genero, 'o', 'a', 'e')}.`, 'conflito', 2);
    if (i >= 6 && i < 25) f.aperto = { tipo: 'separacao', t: v.t };
    if (motivo === 'traicao' && i >= 10) { vf.tensao = clamp(vf.tensao + 20); vf.confianca = clamp(vf.confianca - 15); }
  }
  if (moravam) dividirVida(v, p, era);
}

/** Separação de quem morava junto: partilha, casa e filhos. */
function dividirVida(v: Vida, p: Pessoa, era: string): void {
  // Filhos menores: ficam com quem gestou na maioria das vezes.
  for (const { p: filho, vin } of vinculosVivos(v)) {
    if (vin.parentesco !== 'filho' || idadePessoa(v, filho) >= 18) continue;
    if (filho.genitores && !filho.genitores.includes(p.id)) continue;
    const ficaComigo = v.corpo.podeGestar || !p.vivo;
    if (!ficaComigo) {
      vin.convivio = vin.convivio.filter(c => c !== 'casa');
      filho.municipioId = p.municipioId;
      v.fatos[`guarda_outro_${filho.id}`] = v.t;
    }
  }
  separarVidaMaterial(v, p, era);
}

/* ---------------------------------------------------------------- Casos */

/** Começa um caso escondido com alguém, estando com outra pessoa. É escolha do jogador. */
export function iniciarCaso(v: Vida, p: Pessoa, vin: Vinculo): void {
  const par = parceiro(v);
  const env = vin.romance?.envolvimento ?? interesseInicial(v, p);
  vin.romance = { estagio: 'saindo', tEstagio: v.t, tInicio: v.t, envolvimento: Math.max(50, env), secreto: true };
  if (par?.vin.romance) par.vin.romance.segredo = { pessoaId: p.id, t: v.t };
  // Um segredo: por ora, só os dois sabem (`sistemas/exposicao`).
  registrarSegredo(v, 'caso', [p.id], p.id);
  lembrarCom(v, p.id, 'Começaram a se ver escondido.', 'romance', 2);
  escrever(v, {
    texto: par ? `Começou um caso com ${p.nome}, escondido de ${par.p.nome}.` : `Começou a se ver com ${p.nome}, escondido.`,
    relevancia: 'biografia', tema: 'amor', escolha: true, pessoas: par ? [p.id, par.p.id] : [p.id],
    evento: { tipo: 'traicao', pessoaId: p.id, peso: 50 }
  });
  aplicarPersonalidade(v, 'acao:caso', { impulsividade: 2, empatia: -1 });
}

/** Um caso escondido segue: a outra pessoa quer mais ou cansa; o segredo pode aparecer. */
function processarCaso(v: Vida, r: Rng, p: Pessoa, vin: Vinculo): void {
  const rom = vin.romance!;
  const par = parceiro(v);
  if (!par || !par.vin.romance?.segredo) {
    // Sem relação principal (terminou, morreu): deixa de ser segredo.
    rom.secreto = undefined;
    return;
  }
  const meses = v.t - (rom.tInicio ?? rom.tEstagio);
  const c = compatibilidade(v, p);
  const cuidou = v.anoAtual.acoes.some(a => a.endsWith(`:${p.id}`));
  const alvo = 50 + c * 25 + (cuidou ? 8 : -10) - Math.max(0, meses / 12 - 2) * 4;
  rom.envolvimento = clamp(Math.round(rom.envolvimento + (alvo - rom.envolvimento) * 0.3 + r.normal() * 5));
  vin.proximidade = clamp(Math.round(vin.proximidade * 0.7 + rom.envolvimento * 0.3));
  vin.tUltimoContato = v.t;

  if (rom.envolvimento < 30) {
    mudarEstagio(v, vin, 'ex');
    escrever(v, { texto: `${p.nome} terminou o caso. Disse que não queria mais ser segredo de ninguém.`, relevancia: 'biografia', tema: 'amor', pessoas: [p.id] });
    lembrarCom(v, p.id, 'O caso acabou.', 'conflito', 1);
    return;
  }
  // Descoberta: quanto mais tempo, mais descuido; o mesmo trabalho, mais olhos.
  const risco = 0.15 + Math.min(0.25, (meses / 12) * 0.06)
    + (vin.convivio.includes('trabalho') ? 0.05 : 0)
    + (v.personalidade.tracos.impulsividade > 30 ? 0.06 : 0);
  if (!Object.keys(v.fatos).some(k => k.startsWith('caso_descoberto:')) && r.chance(risco)) {
    v.fatos[`caso_descoberto:${p.id}`] = v.t;
    return;
  }
  if (meses >= 24 && rom.envolvimento >= 62 && v.fatos[`caso_ultimato_${p.id}`] === undefined) v.fatos[`caso_ultimato_${p.id}`] = v.t;
}

/**
 * A outra pessoa descobriu (ou ouviu a confissão). A reação dela é dela:
 * depende do quanto ainda está na relação, do jeito dela e de ter ouvido a
 * verdade do jogador ou de terceiros.
 */
export function reacaoATraicao(v: Vida, r: Rng, par: Pessoa, vinPar: Vinculo, confessou: boolean): 'ficou' | 'foi_embora' {
  const rom = vinPar.romance!;
  vinPar.tensao = clamp(vinPar.tensao + 60);
  vinPar.confianca = confessou ? 15 : 5;
  // Agora a parceria também sabe — o que ela fizer com isso é dela.
  ficouSabendo(v, 'caso', par.id, rom.segredo?.pessoaId);
  rom.segredo = undefined;
  const filhosPequenos = filhosEmComum(v, par.id).filter(f => f.vivo && idadePessoa(v, f) < 14).length;
  const chanceFicar = clamp(
    (rom.envolvimento - 35) / 100 + par.temperamento.afabilidade * 0.15 + (confessou ? 0.15 : 0) + filhosPequenos * 0.05,
    0.05, 0.7
  );
  lembrarCom(v, par.id, confessou ? 'Você contou a verdade sobre o caso.' : 'Descobriu a traição.', 'traicao', 3);
  if (r.chance(chanceFicar)) {
    rom.envolvimento = clamp(rom.envolvimento - 25);
    return 'ficou';
  }
  terminar(v, par, vinPar, 'ela', 'traicao');
  return 'foi_embora';
}

/** O caso sai do segredo: termina (o jogador escolheu parar). */
export function encerrarCaso(v: Vida, p: Pessoa, vin: Vinculo): void {
  mudarEstagio(v, vin, 'ex');
  lembrarCom(v, p.id, 'Você terminou o caso.', 'conflito', 1);
}

export function descreverEstagio(g: Genero, estagio: EstagioRomance): string {
  return ({
    interesse: 'alguém especial',
    saindo: 'saindo juntos',
    namoro: flex(g, 'namorado', 'namorada', 'namorade'),
    morando_junto: flex(g, 'companheiro', 'companheira', 'companheire'),
    casamento: flex(g, 'marido', 'esposa', 'cônjuge'),
    ex: flex(g, 'ex', 'ex')
  } as Record<EstagioRomance, string>)[estagio];
}
