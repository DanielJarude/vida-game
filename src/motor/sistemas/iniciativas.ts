/**
 * As outras pessoas também agem.
 *
 *   CONTEXTO (o momento dela e o seu, a relação, a história)
 *   → INICIATIVA dela (pede ajuda, convida, cobra a distância, aparece
 *     quando você está mal, demonstra interesse, pede para conversar)
 *   → PERCEPÇÃO (Pessoas → "Pedem atenção"; a ficha dela)
 *   → REAÇÃO do jogador (responder é escolha; não responder também é)
 *   → CONSEQUÊNCIA na relação (afeto, confiança, atrito, envolvimento)
 *   → MEMÓRIA (a história dos dois; a Linha da Vida, quando importa).
 *
 * Um chamado fica gravado no vínculo (`vin.chamado`) até o jogador reagir
 * ou até o ano seguinte — quando o silêncio vira a resposta. Não é um popup:
 * aparece em Pessoas, com as reações que fazem sentido para ELE.
 *
 * E quando alguém próximo atravessa um aperto (`Pessoa.aperto`), a relação
 * lembra se você esteve por perto: apoiar fica na história; sumir também.
 *
 * Sem energia social, sem obrigação anual: é no máximo uma iniciativa nova
 * por ano, e a convivência continua mantendo quem está perto.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Chamado, Pessoa, TipoChamado, Vida, Vinculo } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, marcarFato, parceiro, temFato, vinculosVivos } from '../nucleo';
import { abalar } from './abalo';
import { flex } from '../texto';
import { papelDe, vinculoReal, type Papel } from './vinculos';
import { atraiGenero, podeTerRomance } from './romance';
import { compatibilidade } from './social';

const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const o = (p: Pessoa) => flex(p.genero, 'o', 'a', 'e');
const afeto = (vin: Vinculo, n: number) => { vin.proximidade = clamp(Math.round(vin.proximidade + n)); };
const confiar = (vin: Vinculo, n: number) => { vin.confianca = clamp(Math.round(vin.confianca + n)); };
const atrito = (vin: Vinculo, n: number) => { vin.tensao = clamp(Math.round(vin.tensao + n)); };

/** Quem importa o bastante para tomar a iniciativa (e para a relação cobrar quando você some). */
function importante(v: Vida, p: Pessoa, vin: Vinculo, papel: Papel): boolean {
  if (p.especie || !p.vivo) return false;
  // Parentesco sem história não toma iniciativa (nem cobra ausência): o mesmo critério de "Pede atenção".
  if (!vinculoReal(v, p, vin)) return false;
  const ip = idadePessoa(v, p);
  if (papel === 'amigo_proximo') return true;
  if (papel === 'amigo') return vin.proximidade >= 48;
  if (papel === 'irmao' || papel === 'genitor' || papel === 'avo') return vin.proximidade >= 42 && ip >= 14;
  if (papel === 'filho' || papel === 'neto') return ip >= 18 && vin.proximidade >= 42;
  return false;
}

const moraJunto = (vin: Vinculo) => vin.convivio.includes('casa');

/* ------------------------------------------------------------ Chamados */

export function temChamado(vin: Vinculo | undefined): vin is Vinculo & { chamado: Chamado } {
  return !!vin?.chamado;
}

/** Os chamados abertos, do mais recente para o mais antigo. */
export function chamadosAbertos(v: Vida): { p: Pessoa; vin: Vinculo; chamado: Chamado }[] {
  return vinculosVivos(v).filter(x => x.vin.chamado).map(x => ({ ...x, chamado: x.vin.chamado! })).sort((a, b) => b.chamado.t - a.chamado.t);
}

/** O rótulo das duas reações possíveis a um chamado (a ficha mostra as duas). */
export function rotulosDoChamado(p: Pessoa, ch: Chamado): { sim: string; nao: string } {
  switch (ch.tipo) {
    case 'pedido_ajuda': return { sim: ch.assunto === 'dinheiro' ? `Ajudar ${p.nome} com o dinheiro` : ch.assunto === 'consultas' ? `Ir com ${p.nome} às consultas` : ch.assunto === 'lugar' ? `Oferecer um canto para ${p.nome}` : `Ajudar ${p.nome}`, nao: 'Dizer que agora não dá' };
    case 'convite': return { sim: 'Aceitar o convite', nao: 'Agradecer e recusar' };
    case 'reclamacao': return { sim: 'Pedir desculpas e marcar de se ver', nao: 'Explicar que a vida anda corrida' };
    case 'apoio': return { sim: `Contar a ${p.nome} como você está de verdade`, nao: 'Agradecer e dizer que está tudo bem' };
    case 'interesse': return { sim: `Corresponder ao interesse de ${p.nome}`, nao: 'Deixar claro, com cuidado, que não' };
    case 'conversa_casal': return { sim: 'Sentar e conversar de verdade', nao: 'Deixar para depois' };
    case 'aproximacao': return { sim: 'Topar', nao: 'Agradecer e deixar para outro dia' };
    case 'distancia_casal': return { sim: 'Conversar sobre o que fazer com a distância', nao: 'Dizer que está bom assim, por enquanto' };
  }
}

export interface RespostaChamado { resultado: string; titulo?: string }

/**
 * A reação do jogador. `interesse` aceito não é resolvido aqui (a saída
 * vira romance pelo mesmo caminho de qualquer outro começo: `interacoes`).
 */
export function responderChamado(v: Vida, _r: Rng, p: Pessoa, vin: Vinculo, sim: boolean): RespostaChamado {
  const ch = vin.chamado!;
  vin.chamado = undefined;
  vin.tUltimoContato = v.t;
  const tituloP = p.nome;
  switch (ch.tipo) {
    case 'pedido_ajuda': {
      if (!sim) {
        afeto(vin, -3); confiar(vin, -2);
        return { resultado: `${p.nome} disse que entendia. Talvez entenda mesmo.`, titulo: tituloP };
      }
      afeto(vin, 8); confiar(vin, 9); atrito(vin, -8);
      if (ch.assunto === 'dinheiro') v.financas.conta -= Math.min(Math.max(0, v.financas.conta), 800);
      if (ch.assunto === 'consultas') { p.saude = clamp(p.saude + 3); v.mente.estresse = clamp(v.mente.estresse + 3); }
      if (p.aperto && (p.aperto.tipo === 'desemprego' || p.aperto.tipo === 'separacao' || p.aperto.tipo === 'fase')) p.aperto.t -= 6;
      lembrarCom(v, p.id, `Pediu ajuda ${textoAssunto(ch)}, e você foi.`, 'apoio', 2);
      return { resultado: `${ch.assunto === 'dinheiro' ? 'Você mandou o que dava.' : ch.assunto === 'consultas' ? `Sala de espera, exames, a volta de ônibus. ${p.nome} segurou seu braço o caminho todo.` : ch.assunto === 'lugar' ? `${p.nome} ficou umas semanas no sofá. Ajudou a pôr a cabeça no lugar.` : `Você ajudou como pôde: telefonemas, um currículo revisado, uma indicação.`} ${p.nome} não esqueceu.`, titulo: tituloP };
    }
    case 'convite': {
      if (!sim) { afeto(vin, -2); return { resultado: `${p.nome} disse "fica para a próxima".`, titulo: tituloP }; }
      afeto(vin, 7); confiar(vin, 2);
      abalar(v, `${ch.assunto ?? 'o programa'} com ${p.nome}`, 3, -3);
      lembrarCom(v, p.id, `${cap(ch.assunto ?? 'um programa')} juntos, a convite ${flex(p.genero, 'dele', 'dela', 'delu')}.`, 'amizade', 1);
      return { resultado: `Foi bom ter ido. ${cap(ch.assunto ?? 'o programa')} com ${p.nome} rendeu risada para o ano inteiro.`, titulo: tituloP };
    }
    case 'reclamacao': {
      if (!sim) { afeto(vin, 1); atrito(vin, 4); return { resultado: `${p.nome} respondeu "todo mundo anda corrido". Ficou um pouco no ar.`, titulo: tituloP }; }
      afeto(vin, 9); atrito(vin, -12); confiar(vin, 3);
      lembrarCom(v, p.id, 'Cobrou a distância; vocês voltaram a se ver.', 'reconciliacao', 1);
      return { resultado: `Marcaram e foram. Em meia hora, parecia que não tinha passado tempo nenhum.`, titulo: tituloP };
    }
    case 'apoio': {
      if (!sim) { afeto(vin, 1); return { resultado: `${p.nome} disse que está por perto, se precisar.`, titulo: tituloP }; }
      abalar(v, `conversar com ${p.nome}`, 3, -5);
      afeto(vin, 5); confiar(vin, 6);
      lembrarCom(v, p.id, 'Você deixou que cuidasse de você.', 'apoio', 2);
      return { resultado: `Você contou o que não vinha contando. ${p.nome} ouviu sem pressa, e ficou.`, titulo: tituloP };
    }
    case 'interesse': {
      // O sim é tratado em `interacoes` (começar a sair). Aqui, só o não.
      v.fatos[`recusa_romance_${p.id}`] = v.t;
      if (vin.romance?.estagio === 'interesse') vin.romance = undefined;
      atrito(vin, 5); afeto(vin, -4);
      return { resultado: `${p.nome} disse que tudo bem, e que preferia ter sabido logo. Nos dias seguintes, um pouco sem jeito; depois, passou.`, titulo: tituloP };
    }
    case 'aproximacao': {
      if (!sim) { afeto(vin, -2); return { resultado: `${p.nome} disse "outro dia, então". Talvez não chame de novo tão cedo.`, titulo: tituloP }; }
      afeto(vin, 9); confiar(vin, 4);
      vin.aproximacao = v.t;
      lembrarCom(v, p.id, `${cap(ch.assunto ?? 'um café')}, a convite ${flex(p.genero, 'dele', 'dela', 'delu')}: a conversa foi além do de sempre.`, 'amizade', 1);
      return { resultado: `Foi. A conversa saiu do assunto de sempre — e ${p.nome} parecia contente de você ter vindo.`, titulo: tituloP };
    }
    case 'distancia_casal': {
      const rom = vin.romance;
      if (!sim) { if (rom) rom.envolvimento = clamp(rom.envolvimento - 5); return { resultado: `${p.nome} disse "tá". A distância continuou do mesmo tamanho.`, titulo: tituloP }; }
      if (rom) rom.envolvimento = clamp(rom.envolvimento + 4);
      atrito(vin, -6);
      return { resultado: 'Vocês sentaram (cada um numa tela) para falar do que fazer.', titulo: tituloP };
    }
    case 'conversa_casal': {
      const rom = vin.romance;
      if (!sim) {
        if (rom) rom.envolvimento = clamp(rom.envolvimento - 6);
        atrito(vin, 6);
        return { resultado: `${p.nome} disse "tá bom" num tom que não era de tá bom.`, titulo: tituloP };
      }
      if (rom) rom.envolvimento = clamp(rom.envolvimento + 9);
      atrito(vin, -15); confiar(vin, 4);
      lembrarCom(v, p.id, 'Uma conversa séria sobre vocês, na hora certa.', 'reconciliacao', 2);
      return { resultado: `Foi uma conversa longa, com coisas difíceis de dizer e de ouvir. No fim, vocês estavam do mesmo lado da mesa.`, titulo: tituloP };
    }
  }
}

function textoAssunto(ch: Chamado): string {
  return ch.assunto === 'dinheiro' ? 'com dinheiro' : ch.assunto === 'consultas' ? 'com as consultas' : ch.assunto === 'lugar' ? 'um lugar para ficar' : ch.assunto === 'emprego' ? 'para arrumar trabalho' : 'num momento difícil';
}

/* ------------------------------------------------------------ O ano */

/**
 * Chamados do ano anterior que ficaram sem resposta: o silêncio responde.
 * Depois, o que ficou dos apertos das pessoas próximas. Por fim, no máximo
 * uma iniciativa nova (e, quando você atravessa um momento difícil, alguém
 * pode aparecer sem ser chamado).
 */
export function processarIniciativas(v: Vida, r: Rng): void {
  if (idade(v) < 10 || v.justica?.prisao) { expirarChamados(v); return; }
  expirarChamados(v);
  lembrarApertos(v);
  apoioEspontaneo(v, r);
  novaIniciativa(v, r);
}

function expirarChamados(v: Vida): void {
  for (const { p, vin } of vinculosVivos(v)) {
    const ch = vin.chamado;
    if (!ch || ch.t >= v.t) continue;
    vin.chamado = undefined;
    switch (ch.tipo) {
      case 'pedido_ajuda':
        afeto(vin, -8); confiar(vin, -8);
        lembrarCom(v, p.id, `Pediu ajuda ${textoAssunto(ch)}, e a resposta não veio.`, 'distancia', 2, ch.t);
        break;
      case 'convite': afeto(vin, -3); break;
      case 'reclamacao': afeto(vin, -6); atrito(vin, 8); lembrarCom(v, p.id, 'Cobrou a distância; ficou sem resposta.', 'distancia', 1, ch.t); break;
      case 'conversa_casal': if (vin.romance) vin.romance.envolvimento = clamp(vin.romance.envolvimento - 10); atrito(vin, 10); lembrarCom(v, p.id, 'Pediu para conversar sobre vocês; a conversa não aconteceu.', 'conflito', 1, ch.t); break;
      case 'interesse': if (vin.romance?.estagio === 'interesse' && vin.romance.tEstagio <= ch.t) vin.romance = undefined; break;
      case 'apoio': break;
      // O convite de um colega que ficou sem resposta: nada quebra — a chance só passa.
      case 'aproximacao': afeto(vin, -1); break;
      case 'distancia_casal': if (vin.romance) vin.romance.envolvimento = clamp(vin.romance.envolvimento - 7); atrito(vin, 6); lembrarCom(v, p.id, 'Pediu para falar da distância; a conversa não aconteceu.', 'distancia', 1, ch.t); break;
    }
  }
}

/**
 * O aperto de alguém próximo, um ano depois: você esteve por perto? Apoiar
 * fica na história (e a confiança dura); sumir também — e custa mais quando
 * a relação era funda e vocês não conviviam (a ausência foi escolha).
 */
function lembrarApertos(v: Vida): void {
  for (const { p, vin } of vinculosVivos(v)) {
    const ap = p.aperto;
    if (!ap || v.t - ap.t < 12) continue;
    const chave = `aperto_visto_${p.id}_${ap.t}`;
    if (v.fatos[chave] !== undefined) continue;
    const papel = papelDe(p, vin);
    if (!importante(v, p, vin, papel)) continue;
    v.fatos[chave] = v.t;
    const apoiou = vin.historia.some(h => h.tipo === 'apoio' && h.t >= ap.t - 1);
    if (apoiou) { confiar(vin, 4); continue; }
    const perto = vin.convivio.length > 0;
    const contato = vin.tUltimoContato >= ap.t && !perto;
    const peso = papel === 'amigo_proximo' ? 1.3 : papel === 'genitor' || papel === 'irmao' ? 1 : 0.8;
    const quando = { desemprego: 'perdeu o emprego', separacao: 'se separou', doenca: 'adoeceu', luto: 'perdeu alguém', dinheiro: 'passou aperto de dinheiro', fase: 'atravessou uma fase difícil' }[ap.tipo];
    if (perto) {
      afeto(vin, -3 * peso);
      lembrarCom(v, p.id, `Quando ${quando}, você estava por perto, mas não disse nada.`, 'distancia', 1, ap.t);
    } else if (contato) {
      afeto(vin, -2 * peso);
    } else {
      afeto(vin, -7 * peso); confiar(vin, -8 * peso);
      lembrarCom(v, p.id, `Quando ${quando}, você não apareceu.`, 'distancia', 2, ap.t);
      if (papel === 'amigo_proximo' && vin.proximidade < 55) escrever(v, { texto: `${p.nome} ${quando} e você não esteve por perto. Algo entre vocês não voltou a ser igual.`, relevancia: 'biografia', tema: 'amizade', tom: 'ruim', pessoas: [p.id] });
    }
  }
}

/** Você atravessa um momento difícil: quem está perto de verdade pode aparecer sem ser chamado. */
function momentoDificil(v: Vida): string | undefined {
  const luto = v.luto.find(l => l.peso >= 25 && v.t - l.t <= 12);
  if (luto) return 'luto';
  if (v.corpo.condicoes.some(c => c.gravidade >= 2 && c.tDiagnostico !== undefined && v.t - c.tDiagnostico <= 12)) return 'doenca';
  if (v.trabalho.desempregadoDesde !== undefined && !v.trabalho.atual && v.t - v.trabalho.desempregadoDesde >= 12 && idade(v) >= 18 && !v.trabalho.aposentadoria) return 'desemprego';
  if (v.mente.felicidade < 40) return 'fase';
  return undefined;
}

function apoioEspontaneo(v: Vida, r: Rng): void {
  const motivo = momentoDificil(v);
  if (!motivo) return;
  const chave = `apoio_recebido_${Math.floor(v.t / 12)}`;
  if (temFato(v, chave) || (v.fatos['apoio_recebido_t'] !== undefined && v.t - v.fatos['apoio_recebido_t'] < 24)) return;
  const candidatos = vinculosVivos(v).filter(({ p, vin }) => {
    const papel = papelDe(p, vin);
    return !vin.chamado && (papel === 'parceiro' || importante(v, p, vin, papel)) && idadePessoa(v, p) >= 14 && vin.tensao < 45;
  });
  const quem = r.weighted(candidatos, ({ p, vin }) => (vin.proximidade / 30) * (1 + p.temperamento.afabilidade * 0.6));
  if (!quem || !r.chance(0.45 + quem.p.temperamento.afabilidade * 0.15)) return;
  const { p, vin } = quem;
  marcarFato(v, chave);
  v.fatos['apoio_recebido_t'] = v.t;
  // O apoio acontece — a pessoa não pede licença para aparecer. Amortece, não apaga.
  abalar(v, `${p.nome} por perto`, 3, -4);
  afeto(vin, 4); confiar(vin, 3);
  const texto = motivo === 'luto' ? `${p.nome} apareceu com comida, ficou, e voltou nos dias seguintes.`
    : motivo === 'doenca' ? `Quando veio o diagnóstico, ${p.nome} foi a primeira pessoa a aparecer — e se ofereceu para ir junto às consultas.`
      : motivo === 'desemprego' ? `${p.nome} mandou vaga, revisou currículo, pagou um almoço sem dizer que era por isso.`
        : `${p.nome} percebeu que você não andava bem e apareceu, sem ser chamad${o(p)}.`;
  lembrarCom(v, p.id, 'Apareceu quando você precisava.', 'apoio', 2);
  escrever(v, { texto, relevancia: 'biografia', tema: papelDe(p, vin) === 'amigo_proximo' || papelDe(p, vin) === 'amigo' ? 'amizade' : papelDe(p, vin) === 'parceiro' ? 'amor' : 'familia', tom: 'bom', pessoas: [p.id] });
  vin.chamado = { tipo: 'apoio', t: v.t, texto };
}

interface Candidato { p: Pessoa; vin: Vinculo; tipo: TipoChamado; peso: number; texto: string; assunto?: string }

function novaIniciativa(v: Vida, r: Rng): void {
  const eu = idade(v);
  const lista: Candidato[] = [];
  const par = parceiro(v);
  const solteiro = !par && !vinculosVivos(v).some(x => x.vin.romance && !x.vin.romance.secreto && (x.vin.romance.estagio === 'saindo' || x.vin.romance.pediuTempo !== undefined));
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie || vin.chamado || !p.nome) continue;
    const papel = papelDe(p, vin);
    const ip = idadePessoa(v, p);
    const semContato = (v.t - vin.tUltimoContato) / 12;
    const ultimo = v.fatos[`chamado_${p.id}`];
    if (ultimo !== undefined && v.t - ultimo < 24) continue;
    // Quem tomou distância não é procurado (a escolha foi respeitada, por enquanto).
    if (vin.distancia !== undefined && v.t - vin.distancia < 60 && papel !== 'parceiro') continue;
    // O casal em cidades diferentes: alguém pergunta o que fazer com isso.
    if (papel === 'parceiro' && vin.romance && !moraJunto(vin) && p.municipioId !== v.moradia.municipioId && v.t - vin.romance.tEstagio >= 12) {
      lista.push({ p, vin, tipo: 'distancia_casal', peso: 2.2, texto: `${p.nome} perguntou até quando vai ser assim, cada um numa cidade.` });
      continue;
    }
    // O casal: quem está insatisfeito pede para conversar (antes de desistir).
    if (papel === 'parceiro' && vin.romance && (vin.romance.envolvimento < 46 || vin.tensao >= 45)) {
      lista.push({ p, vin, tipo: 'conversa_casal', peso: 3, texto: `${p.nome} disse que precisa conversar sobre vocês.` });
      continue;
    }
    if (!importante(v, p, vin, papel)) {
      // Interesse romântico: alguém do convívio pode tomar a frente.
      if (solteiro && eu >= 15 && ip >= 15 && (papel === 'amigo' || papel === 'colega' || papel === 'conhecido') && vin.convivio.length > 0 && !vin.romance
        && v.eu.atracao && atraiGenero(v.eu.atracao, p.genero) && atraiGenero(p.atracao, v.eu.genero) && !p.parceiroId && podeTerRomance(v, p, vin)
        && v.fatos[`recusa_romance_${p.id}`] === undefined) {
        const comp = compatibilidade(v, p);
        if (comp > 0.1) lista.push({ p, vin, tipo: 'interesse', peso: 0.35 + comp * 0.6 + (v.corpo.aparencia - 55) / 100, texto: `${p.nome} anda procurando você mais do que o normal — e deixou claro que está interessad${o(p)}.` });
      }
      // Um colega que gosta de você dá o primeiro passo (um café, ficar depois do treino). Não é amizade ainda: é a chance.
      const gestoRecente = vin.aproximacao !== undefined && v.t - vin.aproximacao <= 24;
      if (eu >= 15 && ip >= 15 && (papel === 'colega' || papel === 'conhecido') && vin.convivio.length > 0 && !vin.romance && !gestoRecente && vin.proximidade >= 30) {
        const comp = compatibilidade(v, p);
        if (comp > 0.15) {
          const onde = vin.convivio.includes('trabalho') ? r.pick(['almoçar junto', 'um café depois do expediente', 'uma cerveja na sexta, depois do trabalho'])
            : vin.convivio.includes('faculdade') ? r.pick(['estudar junto para a prova', 'um bar depois da aula'])
              : vin.convivio.includes('escola') ? r.pick(['fazer o trabalho junto', 'ir para a casa dele depois da aula'.replace('dele', flex(p.genero, 'dele', 'dela', 'delu'))])
                : r.pick(['ficar para conversar depois da atividade', 'um lanche depois do encontro']);
          lista.push({ p, vin, tipo: 'aproximacao', peso: 0.3 + comp * 0.7 + Math.max(0, p.temperamento.extroversao) * 0.3, texto: `${p.nome} chamou você para ${onde}.`, assunto: onde });
        }
      }
      continue;
    }
    // Pedido de ajuda: quem está num aperto recente e confia em você.
    const ap = p.aperto;
    if (ap && v.t - ap.t <= 12 && eu >= 16 && ap.tipo !== 'luto' && !moraJunto(vin) && vin.confianca >= 40) {
      const assunto = ap.tipo === 'dinheiro' ? 'dinheiro' : ap.tipo === 'desemprego' ? 'emprego' : ap.tipo === 'separacao' ? 'lugar' : ap.tipo === 'doenca' ? 'consultas' : 'fase';
      const texto = assunto === 'dinheiro' ? `${p.nome} pediu ajuda com dinheiro, com vergonha de pedir.`
        : assunto === 'emprego' ? `${p.nome} perdeu o emprego e pediu ajuda: uma indicação, um currículo revisado, qualquer coisa.`
          : assunto === 'lugar' ? `${p.nome} está se separando e perguntou se pode ficar uns dias na sua casa.`
            : assunto === 'consultas' ? `${p.nome} pediu companhia nas consultas.`
              : `${p.nome} ligou numa noite ruim e pediu para você ir até lá.`;
      lista.push({ p, vin, tipo: 'pedido_ajuda', peso: 2.2, texto, assunto });
      continue;
    }
    // Pai ou mãe envelhecendo: pede companhia no médico.
    if (papel === 'genitor' && ip >= 68 && p.saude < 58 && eu >= 20 && !moraJunto(vin)) {
      lista.push({ p, vin, tipo: 'pedido_ajuda', peso: 1.6, texto: `${p.nome} pediu para você ir junto às consultas: a saúde anda pedindo cuidado.`, assunto: 'consultas' });
      continue;
    }
    // A distância cobrada: quem gosta de você e não te vê há anos.
    if (semContato >= 2 && vin.proximidade >= 40 && !moraJunto(vin) && vin.convivio.length === 0 && eu >= 14) {
      const texto = papel === 'genitor' ? `${p.nome} reclamou que você quase não aparece.` : papel === 'irmao' ? `${p.nome} mandou mensagem: "a gente só se vê em enterro e casamento?"` : `${p.nome} mandou mensagem: "sumiu, hein?"`;
      lista.push({ p, vin, tipo: 'reclamacao', peso: 1.2, texto });
      continue;
    }
    // Convite: amigo por perto chama para alguma coisa.
    if ((papel === 'amigo' || papel === 'amigo_proximo') && eu >= 14 && ip >= 14 && p.municipioId === v.moradia.municipioId) {
      const assunto = r.pick(eu < 18 ? ['a festa de aniversário', 'o show no fim de semana', 'um dia de praia ou cachoeira'] : ['uma viagem curta de fim de semana', 'o aniversário', 'um show', 'um churrasco com a turma antiga']);
      lista.push({ p, vin, tipo: 'convite', peso: 0.5 + Math.max(0, p.temperamento.extroversao) * 0.6, texto: `${p.nome} chamou você para ${assunto}.`, assunto });
    }
  }
  if (!lista.length) return;
  // Nem todo ano alguém toma a iniciativa: o mais comum é a vida seguir.
  const peso = lista.reduce((s, x) => s + x.peso, 0);
  if (!r.chance(Math.min(0.6, 0.18 + peso * 0.08))) return;
  const x = r.weighted(lista, c => c.peso);
  if (!x) return;
  x.vin.chamado = { tipo: x.tipo, t: v.t, texto: x.texto, assunto: x.assunto };
  v.fatos[`chamado_${x.p.id}`] = v.t;
  if (x.tipo === 'interesse') x.vin.romance = { estagio: 'interesse', tEstagio: v.t, envolvimento: 58 };
  // Pedidos de ajuda entram na Linha da Vida como textura (o que se fez com eles é que marca).
  const papel = papelDe(x.p, x.vin);
  const familia = papel === 'genitor' || papel === 'irmao' || papel === 'filho' || papel === 'avo';
  escrever(v, { texto: x.texto, relevancia: familia && (x.tipo === 'pedido_ajuda' || x.tipo === 'reclamacao') || x.tipo === 'conversa_casal' ? 'biografia' : 'cotidiano', tema: x.tipo === 'interesse' || x.tipo === 'conversa_casal' ? 'amor' : papelDe(x.p, x.vin) === 'amigo' || papelDe(x.p, x.vin) === 'amigo_proximo' ? 'amizade' : 'familia', pessoas: [x.p.id] });
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
void ele;
