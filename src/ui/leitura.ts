/**
 * Como a interface LÊ as relações: em frases, nunca em números.
 *
 * "Vocês têm se afastado desde que ela se mudou para Curitiba." em vez de
 * "proximidade 42". Tudo aqui é derivado do motor (papel, convivência,
 * história, afeto, confiança, atrito, presença) — nada é guardado.
 */

import type { Pessoa, Vida, Vinculo } from '../motor/tipos';
import { idade, idadePessoa, moraCom, vinculosVivos } from '../motor/nucleo';
import { anoDe, MESES, mesDe } from '../motor/tempo';
import { flex, listaNatural } from '../motor/texto';
import { municipio } from '../motor/dados/lugares';
import { descricaoOrigem } from '../motor/sistemas/social';
import { gestacaoEmCurso } from '../motor/sistemas/familia';
import { circuloDe, ehDescendente, estadoCivil, filhosEmComum, importancia, papelDe, parceriaAtual, vinculoReal, type Papel } from '../motor/sistemas/vinculos';
import { pesoDoLuto } from '../motor/sistemas/luto';
import { lutoDe } from '../motor/sistemas/rede';
import { ehAmizade, estadoDaRelacao, porqueDaRelacao } from '../motor/sistemas/lacos';

export type Par = { p: Pessoa; vin: Vinculo };

const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const dele = (p: Pessoa) => flex(p.genero, 'dele', 'dela', 'delu');
const anos = (n: number) => `${n} ${n === 1 ? 'ano' : 'anos'}`;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const cidade = (id: string) => municipio(id).nome;

/* ---------------------------------------------------------------- Círculos */

export interface Circulos {
  nucleo: Par[];
  familia: Par[];
  /** Parentes distantes (tios, primos, sogros) com pouco vínculo: dobrados. */
  familiaExtensa: Par[];
  amigos: Par[];
  contexto: Par[];
  passado: Par[];
  mortos: Par[];
}

const ORDEM_FAMILIA: Partial<Record<Papel, number>> = { genitor: 0, irmao: 1, neto: 2, bisneto: 3, avo: 4, genro: 5, sogro: 6, parente: 7, pet: 8 };

export function circulos(v: Vida): Circulos {
  const vivos = vinculosVivos(v).filter(x => x.p.nome || x.vin.parentesco);
  const out: Circulos = { nucleo: [], familia: [], familiaExtensa: [], amigos: [], contexto: [], passado: [], mortos: [] };
  for (const x of vivos) {
    const c = circuloDe(x.p, x.vin);
    const papel = papelDe(x.p, x.vin);
    if (c === 'nucleo') out.nucleo.push(x);
    else if (c === 'familia') {
      const distante = (papel === 'parente' || papel === 'sogro') && x.vin.proximidade < 65 && !x.vin.convivio.includes('casa');
      (distante ? out.familiaExtensa : out.familia).push(x);
    } else if (c === 'amigos') out.amigos.push(x);
    else if (c === 'contexto') out.contexto.push(x);
    else if (x.vin.historia.length > 0 || x.vin.romance?.estagio === 'ex' || x.vin.estagio === 'afastado') out.passado.push(x);
  }
  const peso = (x: Par) => importancia(v, x.p, x.vin);
  const nucleoOrdem = (x: Par) => {
    const papel = papelDe(x.p, x.vin);
    return papel === 'parceiro' ? 0 : papel === 'saindo' || papel === 'caso' ? 1 : papel === 'filho' ? 2 : 3;
  };
  out.nucleo.sort((a, b) => nucleoOrdem(a) - nucleoOrdem(b) || a.p.tNasc - b.p.tNasc);
  out.familia.sort((a, b) => (ORDEM_FAMILIA[papelDe(a.p, a.vin)] ?? 9) - (ORDEM_FAMILIA[papelDe(b.p, b.vin)] ?? 9) || peso(b) - peso(a));
  out.familiaExtensa.sort((a, b) => peso(b) - peso(a));
  out.amigos.sort((a, b) => peso(b) - peso(a));
  out.contexto.sort((a, b) => b.vin.proximidade - a.vin.proximidade);
  out.passado.sort((a, b) => peso(b) - peso(a));
  out.mortos = Object.values(v.vinculos)
    .map(vin => ({ p: v.pessoas[vin.pessoaId], vin }))
    .filter(x => x.p && !x.p.vivo && (x.vin.parentesco || x.vin.estagio === 'amigo_proximo' || x.vin.estagio === 'amigo' || x.vin.romance && x.vin.romance.estagio !== 'interesse'))
    .sort((a, b) => (b.p.tMorte ?? 0) - (a.p.tMorte ?? 0));
  return out;
}

/* ------------------------------------------------------------ Etiqueta curta */

/** Uma palavra (ou três) à direita do nome na lista. */
export function etiqueta(v: Vida, p: Pessoa, vin: Vinculo): string {
  if (!p.vivo) return `†${p.tMorte ? anoDe(p.tMorte) : ''}`;
  if (p.especie) return vin.proximidade >= 60 ? 'grudado em você' : 'em casa';
  if (vin.tensao >= 55) return 'relação tensa';
  if (p.aperto && v.t - p.aperto.t <= 24 && vin.proximidade >= 35) return ({ desemprego: 'sem trabalho', separacao: 'se separando', doenca: 'saúde frágil', luto: 'de luto', dinheiro: 'no aperto', fase: 'numa fase difícil' })[p.aperto.tipo];
  // Relações 2.0: à direita do nome vai o ESTADO da relação (o tipo já está no rótulo) — nunca "muito próximo".
  const e = estadoDaRelacao(v, vin);
  if (e === 'rompido') return vin.parentesco ? 'romperam' : 'não se falam';
  if (e === 'conflito') return 'em conflito';
  if (e === 'tensao') return 'em tensão';
  if (e === 'reconciliacao') return 'fizeram as pazes';
  if (vin.convivio.includes('casa')) return 'mora com você';
  if (p.municipioId !== v.moradia.municipioId) return `em ${cidade(p.municipioId)}`;
  if (e === 'aproximando') return 'se aproximando';
  if (e === 'esfriando') return 'esfriando';
  if (e === 'afastado') return 'afastados';
  // Estável: o que descreve a relação é o tempo (amizade) ou a convivência (colega); na família, como se dão.
  const papel = papelDe(p, vin);
  const anos = Math.floor((v.t - vin.tInicio) / 12);
  if (papel === 'amigo' || papel === 'amigo_proximo') return anos >= 2 ? `há ${anos} anos` : 'amizade nova';
  if (papel === 'colega' || papel === 'rival' || papel === 'conhecido' || papel === 'interesse') return vin.convivio.length ? 'convivem' : `desde ${anoDe(vin.tInicio)}`;
  // Família estável: o tipo já está no rótulo e a força na barra (`forcaDaRelacao`) — a etiqueta só fala quando há o que dizer.
  if (v.t - vin.tUltimoContato >= 36) return 'sem contato';
  return '';
}

/* ---------------------------------------------------------------- Leitura */

/** Quem é essa pessoa para você, e desde quando. */
export function quemE(v: Vida, p: Pessoa, vin: Vinculo): string {
  const papel = papelDe(p, vin);
  const tempo = Math.max(0, Math.floor((v.t - vin.tInicio) / 12));
  if (papel === 'filho') {
    const idadeNoNasc = Math.max(0, Math.floor((p.tNasc - v.eu.tNasc) / 12));
    const outro = p.genitores?.find(g => g !== 'eu');
    const outroP = outro ? v.pessoas[outro] : undefined;
    const adotado = v.fatos[`adotado_${p.id}`] !== undefined;
    return adotado
      ? `Chegou à sua vida por adoção, em ${anoDe(vin.tInicio)}${outroP ? `, quando você estava com ${outroP.nome}` : ''}.`
      : `Nasceu em ${MESES[mesDe(p.tNasc)]} de ${anoDe(p.tNasc)}, quando você tinha ${idadeNoNasc}${outroP ? `. ${flex(p.genero, 'Filho seu', 'Filha sua', 'Filhe sue')} e de ${outroP.nome}` : ''}.`;
  }
  if (papel === 'neto' || papel === 'bisneto') {
    const pai = p.genitores?.map(g => v.pessoas[g]).find(Boolean);
    return `Nasceu em ${anoDe(p.tNasc)}${pai ? `, ${flex(p.genero, 'filho', 'filha', 'filhe')} de ${pai.nome}` : ''}.`;
  }
  if (papel === 'genro') {
    const conj = Object.values(v.pessoas).find(x => x.parceiroId === p.id);
    return conj ? `Casad${flex(p.genero, 'o', 'a', 'e')} com ${conj.nome} desde ${anoDe(vin.tInicio)}.` : `Entrou na família em ${anoDe(vin.tInicio)}.`;
  }
  if (papel === 'genitor' || papel === 'irmao' || papel === 'avo' || papel === 'parente' || papel === 'sogro') {
    if (papel === 'irmao' && p.tNasc > v.eu.tNasc) return `Nasceu quando você tinha ${Math.floor((p.tNasc - v.eu.tNasc) / 12)} anos.`;
    return '';
  }
  if (papel === 'parceiro' || papel === 'saindo' || papel === 'caso') {
    const rom = vin.romance!;
    const juntos = Math.max(0, Math.floor((v.t - (rom.tInicio ?? vin.tInicio)) / 12));
    const onde = descricaoOrigem(v, vin);
    const conheceram = vin.origem !== 'romance' ? `Vocês se conheceram ${onde === 'por aí' ? 'em' : `${onde}, em`} ${anoDe(vin.tInicio)}. ` : '';
    const casamento = vin.historia.find(h => h.tipo === 'casamento');
    if (papel === 'caso') return `${conheceram}Vocês se veem escondido desde ${anoDe(rom.tInicio ?? rom.tEstagio)}.`;
    if (rom.estagio === 'casamento' && casamento) {
      const c = Math.floor((v.t - casamento.t) / 12);
      return `${conheceram}Juntos há ${anos(juntos)}${c > 0 && c < juntos ? `, casados há ${anos(c)}` : ''}.`;
    }
    if (rom.estagio === 'saindo') return `${conheceram}Estão saindo desde ${anoDe(rom.tEstagio)}.`;
    return `${conheceram}Juntos há ${juntos < 1 ? 'menos de um ano' : anos(juntos)}.`;
  }
  if (papel === 'pet') return `Na família desde ${anoDe(vin.tInicio)}.`;
  // Gente da formação: o papel que teve ali (não amizade automática).
  if (vin.formacao && vin.formacao.papel !== 'colega') {
    const pap = vin.formacao.papel === 'orientador' ? flex(p.genero, 'Seu orientador', 'Sua orientadora', 'Sue orientadore') : flex(p.genero, 'Seu professor', 'Sua professora', 'Sue professore');
    return `${pap}${p.ocupacao ? ` (${p.ocupacao})` : ''}, desde ${anoDe(vin.tInicio)}.${vin.formacao.tFim !== undefined ? ` A formação acabou em ${anoDe(vin.formacao.tFim)}; a memória ficou.` : ''}`;
  }
  if (vin.formacao?.papel === 'colega' && vin.formacao.tFim !== undefined) return `Estudaram juntos até ${anoDe(vin.formacao.tFim)}${p.ocupacao && p.ocupacao !== 'estudante' ? `; hoje, ${p.ocupacao}` : ''}.`;
  const onde = descricaoOrigem(v, vin);
  return `Vocês se conheceram ${onde === 'por aí' ? 'em' : `${onde}, em`} ${anoDe(vin.tInicio)}${tempo >= 2 ? ` — há ${anos(tempo)}` : ''}.`;
}

/** Onde a pessoa está em relação à sua vida: em casa, na mesma cidade, longe. */
export function ondeEsta(v: Vida, p: Pessoa, vin: Vinculo): string {
  if (!p.vivo || p.especie) return '';
  const semContato = Math.floor((v.t - vin.tUltimoContato) / 12);
  if (vin.convivio.includes('casa')) return 'Mora com você.';
  const longe = p.municipioId !== v.moradia.municipioId;
  const saiu = v.fatos[`saiu_de_casa_${p.id}`];
  const partes: string[] = [];
  if (longe) partes.push(`Mora em ${cidade(p.municipioId)}.`);
  else if (saiu !== undefined && (ehDescendente(papelDe(p, vin)) || papelDe(p, vin) === 'irmao')) partes.push(`Saiu de casa em ${anoDe(saiu)}; mora na mesma cidade.`);
  else if (vin.convivio.length > 0) partes.push(convivioTexto(vin));
  if (semContato >= 3) partes.push(`Não se falam há ${anos(semContato)}.`);
  return partes.join(' ');
}

function convivioTexto(vin: Vinculo): string {
  if (vin.convivio.includes('trabalho')) return 'Trabalham juntos.';
  if (vin.convivio.includes('escola')) return 'Estudam juntos.';
  if (vin.convivio.includes('faculdade')) return 'Estão na mesma faculdade.';
  if (vin.convivio.includes('rotina')) return 'Se veem toda semana.';
  if (vin.convivio.includes('vizinhanca')) return 'Moram perto.';
  return '';
}

/**
 * Como está a relação, em uma ou duas frases — com causa, quando há.
 * Nunca decide o que o jogador sente: descreve o que existe entre os dois.
 */
export function comoEsta(v: Vida, p: Pessoa, vin: Vinculo): string {
  if (!p.vivo) return comoFoi(v, p, vin);
  if (p.especie) return '';
  const papel = papelDe(p, vin);
  const frases: string[] = [];
  const recente = (h?: { t: number }) => !!h && v.t - h.t <= 36;
  // Causas recentes primeiro.
  const distancia = [...vin.historia].reverse().find(h => h.tipo === 'distancia');
  if (p.aperto && v.t - p.aperto.t <= 24) {
    frases.push(({
      desemprego: `${capital(ele(p))} perdeu o emprego e ainda não se recolocou.`,
      separacao: `${capital(ele(p))} está atravessando uma separação.`,
      doenca: `A saúde ${dele(p)} anda frágil.`,
      luto: `${capital(ele(p))} está ${lutoDe(v, p) ?? 'de luto'}.`,
      dinheiro: `${capital(ele(p))} está com o dinheiro apertado.`,
      fase: `${capital(ele(p))} está numa fase difícil.`
    })[p.aperto.tipo]);
  }
  if (vin.romance?.segredo) frases.push(`${capital(ele(p))} não sabe do caso.`);
  const estado = estadoDaRelacao(v, vin);
  if (estado === 'rompido' && vin.ruptura) frases.push(`${vin.ruptura.porque}${vin.parentesco ? ' Continua sendo família — só não se falam.' : ''}`);
  else if (vin.conflito && estado === 'conflito') frases.push(`${ehAmizade(vin) && (vin.historia.length >= 4 || v.t - vin.tInicio >= 60) ? 'Vocês têm muita história juntos, mas estão brigados' : 'Estão brigados'} — por causa de ${vin.conflito.assunto}.`);
  else if (vin.tensao >= 55) frases.push(papel === 'filho' && idadePessoa(v, p) < 18 ? 'Andam em pé de guerra em casa.' : 'Andam brigando.');
  else if (vin.tensao >= 35) frases.push('Há um atrito no ar.');
  else if (estado === 'reconciliacao') frases.push('Fizeram as pazes há pouco: ainda com cuidado, mas perto.');
  if (vin.confianca < 25 && vin.historia.some(h => h.tipo === 'traicao')) frases.push('A confiança não voltou inteira.');
  if (distancia && recente(distancia) && vin.proximidade < 55) frases.push(`Vocês têm se afastado desde que ${ele(p)} foi para longe.`);

  if (papel === 'parceiro') {
    const env = vin.romance!.envolvimento;
    // Um luto que é dos dois muda o que se pode dizer do casal (ninguém "ri das mesmas coisas" no ano em que perdeu um filho).
    const lutoJunto = p.aperto?.tipo === 'luto' && v.t - p.aperto.t <= 24 && v.luto.some(l => l.pessoaId === p.aperto!.pessoaId);
    if (lutoJunto) frases.push(env >= 60 && vin.tensao < 35 ? 'Têm atravessado a perda juntos.' : vin.tensao >= 35 ? 'A perda pesa entre os dois.' : 'Cada um atravessa a perda no seu canto.');
    else if (env >= 75 && vin.tensao < 35) frases.push('Estão bem: ainda riem das mesmas coisas.');
    else if (env < 40) frases.push(`${capital(ele(p))} anda distante de você.`);
    else if (env < 55 && vin.tensao < 35) frases.push('A rotina tomou conta; faz tempo que não fazem nada só os dois.');
    const filhos = filhosEmComum(v, p.id).filter(f => f.vivo).length;
    if (filhos) frases.push(filhos === 1 ? 'Têm um filho juntos.' : `Têm ${filhos} filhos juntos.`);
  } else if (papel === 'filho') {
    frases.push(presencaTexto(v, p, vin));
  } else if (papel === 'caso') {
    frases.push('Ninguém mais sabe.');
  } else if (frases.length === 0) {
    // Relações 2.0: quem a pessoa é e de onde vem a relação — não um grau de proximidade.
    const n = vin.proximidade;
    const onde = descricaoOrigem(v, vin);
    const anos = Math.floor((v.t - vin.tInicio) / 12);
    const desde = anos >= 1 ? `Vocês se conhecem ${onde === 'por aí' ? '' : `${onde}, `}há ${anos} ${anos === 1 ? 'ano' : 'anos'}.` : `Vocês se conheceram ${onde === 'por aí' ? 'há pouco' : `${onde}, há pouco`}.`;
    if (papel === 'amigo' || papel === 'amigo_proximo') {
      frases.push(desde);
      frases.push(estado === 'esfriando' ? 'A amizade anda esfriando.' : estado === 'aproximando' ? 'Cada vez mais perto.' : estado === 'afastado' ? 'Andam longe um do outro.' : n >= 80 ? 'Uma das pessoas mais importantes da sua vida.' : n >= 55 ? 'Uma amizade firme.' : 'Uma amizade de convivência, ainda sem muita história.');
    } else if (papel === 'afastado') {
      frases.push(porqueDaRelacao(v, vin) ?? 'Foram amigos; a vida afastou, sem briga.');
    } else if (papel === 'ex_amigo') {
      frases.push(vin.ruptura?.porque ?? 'A amizade acabou.');
    } else if (papel === 'rival') {
      frases.push(`Uma rivalidade ${onde}: nenhum dos dois cede.`);
    } else if (papel === 'interesse') {
      frases.push(desde, 'Ainda não aconteceu nada — só o interesse.');
    } else if (papel === 'colega' || papel === 'conhecido') {
      frases.push(vin.convivio.length && onde !== 'por aí' ? `Vocês convivem ${onde}.` : desde);
      if (estado === 'aproximando') frases.push('Vocês têm se aproximado.');
    } else {
      // Família e o resto (REWORK 4): o TIPO está no rótulo ("seu pai"); aqui vai a SÍNTESE — como está e, quando há,
      // por quê. Nunca um rótulo de intensidade ("Muito ligados") como explicação.
      frases.push(sinteseDaRelacao(v, p, vin, papel, estado));
    }
  }
  return frases.filter(Boolean).slice(0, 3).join(' ');
}

/**
 * Como está uma relação de família (ou qualquer uma sem leitura própria), em uma frase com causa: o afeto, a
 * confiança, o atrito, o contato e o que aconteceu por último. "Vocês são próximos e costumam se dar bem." "Há
 * carinho entre vocês, mas estão afastados desde a última discussão."
 */
export function sinteseDaRelacao(v: Vida, p: Pessoa, vin: Vinculo, papel: Papel = papelDe(p, vin), estado = estadoDaRelacao(v, vin)): string {
  const n = vin.proximidade, conf = vin.confianca;
  const h = [...vin.historia].reverse();
  const briga = h.find(x => x.tipo === 'conflito' || x.tipo === 'traicao');
  const paz = h.find(x => x.tipo === 'reconciliacao');
  const apoio = h.find(x => x.tipo === 'apoio' && v.t - x.t <= 60);
  const semContato = Math.floor((v.t - vin.tUltimoContato) / 12);
  const longe = p.municipioId !== v.moradia.municipioId;
  const casa = vin.convivio.includes('casa');
  const carinho = n >= 60 ? 'Há carinho entre vocês' : n >= 40 ? 'Vocês se querem bem' : 'O laço existe';
  if (estado === 'rompido') return 'Continuam sendo família — só não se falam.';
  if ((estado === 'afastado' || estado === 'esfriando') && briga && (!paz || paz.t < briga.t)) return `${carinho}, mas estão afastados desde a última discussão.`;
  if (paz && v.t - paz.t <= 24) return 'Voltaram a se falar há pouco: ainda com cuidado.';
  if (semContato >= 3) return n >= 50 ? `${carinho}, mas faz ${anos(semContato)} que não se falam.` : `Faz ${anos(semContato)} que não se falam.`;
  if (n >= 70) {
    if (conf < 40) return `${carinho}, mas a confiança anda baixa${briga ? ' desde o que aconteceu' : ''}.`;
    if (apoio) return `Vocês são próximos — e ${ele(p)} esteve do seu lado quando precisou.`;
    if (papel === 'genitor') return casa ? `Vocês são próximos e costumam se dar bem; é a ${ele(p)} que você ainda conta as coisas.` : 'Vocês são próximos e costumam se dar bem, mesmo sem morar juntos.';
    if (papel === 'irmao') return 'Vocês são próximos: cresceram juntos e continuam do mesmo lado.';
    if (papel === 'avo') return `Vocês são próximos; ${ele(p)} sempre tem tempo para você.`;
    return longe ? 'Vocês são próximos, mesmo de longe.' : 'Vocês são próximos e costumam se dar bem.';
  }
  if (n >= 50) {
    if (estado === 'aproximando') return 'Têm se aproximado nos últimos tempos.';
    if (estado === 'esfriando') return `${carinho}, mas a convivência tem esfriado${longe ? ' com a distância' : ''}.`;
    return casa ? 'Dividem a casa e se dão bem, sem grandes conversas.' : longe ? `Se dão bem; a distância deixa as conversas mais espaçadas.` : 'Se dão bem, sem grandes conversas.';
  }
  if (n >= 30) return estado === 'aproximando' ? 'Estavam distantes; têm se aproximado.' : longe ? 'Pouco contato: cada um na sua cidade, na sua vida.' : 'Pouco contato: cada um na sua vida.';
  return briga ? 'Quase não se falam — o que aconteceu ainda pesa.' : 'Quase não se falam, hoje.';
}

/** A presença do jogador na vida de um filho, em palavras (nunca "bom pai 72/100"). */
function presencaTexto(v: Vida, p: Pessoa, vin: Vinculo): string {
  const i = idadePessoa(v, p);
  const pres = vin.presenca ?? 30;
  const n = vin.proximidade;
  if (i < 3) return pres >= 60 ? 'Você está em cada madrugada.' : 'Os primeiros anos passam rápido.';
  if (i < 13) return pres >= 65 ? 'Você está presente no dia a dia.' : pres >= 40 ? `Você acompanha a vida ${dele(p)} de perto, quando dá.` : `A vida ${dele(p)} anda passando sem você perto.`;
  if (i < 18) return n >= 65 ? `Mesmo adolescente, ${ele(p)} ainda conta as coisas para você.` : n >= 45 ? `${capital(ele(p))} fala pouco em casa, como quase todo adolescente.` : `${capital(ele(p))} anda fechad${flex(p.genero, 'o', 'a', 'e')} com você.`;
  if (n >= 75) return `Ficaram próximos de outro jeito, de adulto para adulto: ${ele(p)} ainda divide a vida com você.`;
  if (n >= 55) return `Próximos. ${capital(ele(p))} liga quando precisa, e quando não precisa.`;
  if (n >= 35) return `Se falam, mas pouco. ${capital(ele(p))} tem a vida ${dele(p)}.`;
  return 'Pouco próximos, hoje.';
}

function comoFoi(v: Vida, p: Pessoa, vin: Vinculo): string {
  const papel = papelDe(p, vin);
  const morte = p.tMorte ? `Morreu em ${anoDe(p.tMorte)}, aos ${Math.floor((p.tMorte - p.tNasc) / 12)} anos${p.causaMorte ? ` (${p.causaMorte})` : ''}.` : '';
  if (papel === 'parceiro' && vin.romance?.fim === 'morte') {
    const juntos = Math.max(1, Math.round(((p.tMorte ?? v.t) - (vin.romance.tInicio ?? vin.tInicio)) / 12));
    return `${morte} Foram ${anos(juntos)} juntos.`;
  }
  return morte;
}

/* ------------------------------------------------------------- A pessoa */

/** A vida própria de um descendente, em linhas (mais recente primeiro). */
export function vidaPropria(p: Pessoa): string[] {
  return (p.vida?.trajetoria ?? []).slice().reverse().slice(0, 8).map(t => `${anoDe(t.t)} — ${t.texto}`);
}

/* -------------------------------------------------------------- Você */

/** Estado civil em palavras, com quem e desde quando. */
export function situacaoAfetiva(v: Vida): string | null {
  const i = idade(v);
  if (i < 16) return null;
  const g = v.eu.tratamento ?? v.eu.genero;
  const par = parceriaAtual(v);
  const e = estadoCivil(v);
  if (par) {
    const rom = par.vin.romance!;
    const casamento = par.vin.historia.find(h => h.tipo === 'casamento');
    if (rom.estagio === 'casamento') return `${flex(g, 'casado', 'casada', 'casade')} com ${par.p.nome}${casamento ? ` há ${anos(Math.max(1, Math.floor((v.t - casamento.t) / 12)))}` : ''}`;
    if (rom.estagio === 'morando_junto') return `mora junto com ${par.p.nome}`;
    return `namora ${par.p.nome}`;
  }
  if (e === 'viuvo') {
    const falecido = Object.values(v.vinculos).filter(x => x.romance?.fim === 'morte').map(x => v.pessoas[x.pessoaId]).sort((a, b) => (b.tMorte ?? 0) - (a.tMorte ?? 0))[0];
    return `${flex(g, 'viúvo', 'viúva', 'viúve')}${falecido ? ` de ${falecido.nome}, desde ${anoDe(falecido.tMorte ?? v.t)}` : ''}`;
  }
  if (e === 'divorciado') return flex(g, 'divorciado', 'divorciada', 'divorciade');
  if (e === 'separado') return flex(g, 'separado', 'separada', 'separade');
  return i >= 18 ? flex(g, 'solteiro', 'solteira', 'solteire') : null;
}

/** Luto que ainda pesa (para a identidade dizer "de luto por..."). */
export function lutoVisivel(v: Vida): string | null {
  if (pesoDoLuto(v) < 20) return null;
  const maior = [...v.luto].sort((a, b) => b.peso - a.peso)[0];
  const p = maior && v.pessoas[maior.pessoaId];
  return p ? `de luto por ${p.nome}` : null;
}

/* --------------------------------------------------- O que pede atenção */

/**
 * O que pede atenção (REWORK 4: priorizado, não um mural).
 *
 * `tipo` separa o que antes vinha misturado: `urgente` (dá para intervir e custa caro não intervir: um pedido de
 * ajuda, a briga em casa, alguém do núcleo sem emprego), `importante` (muda a vida, mas não é problema: o bebê a
 * caminho, uma perda recente), `noticia` (bom saber: a amiga vai ter um bebê) e `oportunidade` (algo a retomar: o
 * amigo com quem não fala há três anos). A prioridade é a da pessoa (importância), a gravidade, a urgência e a
 * possibilidade de agir — sem número na tela. `global`: aparece em qualquer área; `pessoas`: só em Pessoas.
 */
export type TipoDeSinal = 'urgente' | 'importante' | 'noticia' | 'oportunidade';
export interface Sinal { pessoaId?: string; texto: string; peso: number; escopo: 'global' | 'pessoas'; tipo: TipoDeSinal }

const CHAMADO_URGENTE = new Set(['pedido_ajuda', 'conversa_casal', 'distancia_casal']);
/** Quantos sinais cabem de uma vez: poucos o bastante para cada um importar. */
export const MAX_SINAIS = 3;

/**
 * O que, na vida social, pede atenção agora — não uma lista das mesmas pessoas da tela Pessoas, mas o que mudou ou
 * está pendurado. Uma situação por pessoa (a mais séria), no máximo `MAX_SINAIS`. Cada uma EXPIRA pela própria janela
 * (o chamado respondido sai; o bebê nasce; o contato retomado apaga o "sem se falarem"; o luto de anos atrás não volta).
 */
export function sinaisSociais(v: Vida, limite = MAX_SINAIS): Sinal[] {
  const out: Sinal[] = [];
  const gest = gestacaoEmCurso(v);
  if (gest?.descoberta) {
    const quem = gest.gestanteId === 'eu' ? 'Você está esperando um bebê' : `${v.pessoas[gest.gestanteId]?.nome ?? ''} está esperando um bebê`;
    out.push({ texto: `${quem} — para ${MESES[mesDe(gest.tParto)]} de ${anoDe(gest.tParto)}.`, peso: 100, pessoaId: gest.gestanteId === 'eu' ? gest.outroId : gest.gestanteId, escopo: 'global', tipo: 'importante' });
  }
  for (const l of v.luto) {
    const p = v.pessoas[l.pessoaId];
    const ha = v.t - (p?.tMorte ?? l.t);
    if (p && l.peso >= 25 && ha <= 24) out.push({ pessoaId: p.id, texto: `${p.nome} se foi em ${anoDe(p.tMorte ?? l.t)}.`, peso: 88 + l.peso / 10 - ha / 2, escopo: ha <= 12 ? 'global' : 'pessoas', tipo: 'importante' });
  }
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie || !p.nome) continue;
    // Quem tomou uma iniciativa e espera uma reação vem primeiro (o silêncio também responde, no ano que vem).
    if (vin.chamado) {
      const urg = CHAMADO_URGENTE.has(vin.chamado.tipo);
      out.push({ pessoaId: p.id, texto: vin.chamado.texto, peso: urg ? 96 : 62 + importancia(v, p, vin) / 5, escopo: urg ? 'global' : 'pessoas', tipo: urg ? 'urgente' : 'oportunidade' });
    }
    const imp = importancia(v, p, vin);
    // Parentesco sem história não pede atenção (o motor diz o que é vínculo real). Quem você afastou, também não.
    if (imp < 25 || !vinculoReal(v, p, vin)) continue;
    if (vin.distancia !== undefined && v.t - vin.distancia < 60) continue;
    const papel = papelDe(p, vin);
    const nucleo = papel === 'parceiro' || ehDescendente(papel) || papel === 'genitor';
    // A gravidez de alguém é notícia, não problema: importante para o núcleo, notícia para o resto.
    if (p.gestacao && v.t < p.gestacao.tParto) out.push({ pessoaId: p.id, texto: `${p.nome} vai ter um bebê em ${MESES[mesDe(p.gestacao.tParto)]}.`, peso: (nucleo ? 64 : 30) + imp / 10, escopo: nucleo ? 'global' : 'pessoas', tipo: nucleo ? 'importante' : 'noticia' });
    if (p.aperto && !p.aperto.resolvido && v.t - p.aperto.t <= 12 && !vin.chamado) {
      const grave = p.aperto.tipo === 'doenca' || p.aperto.tipo === 'luto' || nucleo;
      out.push({ pessoaId: p.id, texto: `${p.nome} — ${({ desemprego: 'perdeu o emprego', separacao: 'está se separando', doenca: 'a saúde piorou', luto: `está ${lutoDe(v, p) ?? 'de luto'}`, dinheiro: 'o dinheiro apertou', fase: 'passa por uma fase difícil' })[p.aperto.tipo]}.`, peso: (grave ? 58 : 38) + imp / 4, escopo: nucleo || papel === 'amigo_proximo' ? 'global' : 'pessoas', tipo: grave ? 'urgente' : 'noticia' });
    }
    if (!vin.chamado && vin.tensao >= 55 && nucleo) out.push({ pessoaId: p.id, texto: `${p.nome} — vocês têm brigado.`, peso: 55 + imp / 5 + (vin.convivio.includes('casa') ? 8 : 0), escopo: vin.convivio.includes('casa') ? 'global' : 'pessoas', tipo: 'urgente' });
    if (!vin.chamado && papel === 'parceiro' && (vin.romance?.envolvimento ?? 50) < 42 && vin.tensao < 55) out.push({ pessoaId: p.id, texto: `${p.nome} anda distante.`, peso: 50 + imp / 5, escopo: 'pessoas', tipo: 'importante' });
    const semContato = Math.floor((v.t - vin.tUltimoContato) / 12);
    if (!vin.chamado && semContato >= 3 && semContato <= 15 && (papel === 'amigo_proximo' || papel === 'filho' || papel === 'genitor' || papel === 'irmao')) {
      // Contexto importa: o pai que nunca esteve por perto não é o amigo próximo esquecido.
      const nuncaProximos = (papel === 'genitor' || papel === 'irmao') && (vin.presenca ?? 50) < 30 && vin.proximidade < 45;
      if (!nuncaProximos) out.push({ pessoaId: p.id, texto: `${p.nome} — ${anos(semContato)} sem se falarem.`, peso: 26 + imp / 5 - semContato, escopo: 'pessoas', tipo: 'oportunidade' });
    }
  }
  // Uma situação por pessoa: a mais séria.
  const vistos = new Set<string>();
  return out.sort((a, b) => b.peso - a.peso).filter(x => { const k = x.pessoaId ?? x.texto; if (vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, limite);
}

/** Quem mora com você, em palavras curtas. */
export function emCasa(v: Vida): { texto: string; pessoas: Pessoa[] } {
  const junto = moraCom(v).filter(p => p.nome);
  if (junto.length === 0) return { texto: `Você mora sozinh${flex(v.eu.tratamento ?? v.eu.genero, 'o', 'a', 'e')}.`, pessoas: [] };
  const nomes = junto.map(p => p.nome);
  return { texto: nomes.length <= 4 ? listaNatural(nomes) : `${listaNatural(nomes.slice(0, 3))} e mais ${nomes.length - 3}`, pessoas: junto };
}
