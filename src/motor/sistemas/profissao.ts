/**
 * Vida profissional: o trabalho como coisa viva, não como catálogo.
 *
 *   MODO — a mesma pergunta ("como vai o trabalho?") tem respostas de natureza
 *   diferente para quem tem carteira, para o servidor, a professora, o dono
 *   de lanchonete, o eletricista por conta, a feirante, o produtor, a atriz,
 *   o jogador, a sargento. `modoDoTrabalho` diz qual é; a tela e as ações
 *   seguem daí. Nunca é o jogador quem escolhe o modo: ele é a vida que há.
 *
 *   RITMO — quem controla a própria carga (turmas, plantões, agenda, balcão,
 *   área plantada) escolhe o ritmo. Puxado rende mais e cobra: cabeça, corpo
 *   (com os anos), a casa (filhos pequenos, parceria). Leve rende menos e
 *   devolve tempo. Trabalho excessivo tem custo; preservar a saúde tem valor.
 *
 *   CLIMA — a relação com a chefia e a equipe (0..100, nunca número na tela):
 *   pesa no desempenho, na promoção, no risco de corte e na cabeça. Mexe com
 *   reconhecimento, conversa, recusa, conflito, blefe.
 *
 *   POR CONTA — quem trabalha por conta investe no próprio trabalho
 *   (equipamento, ponto) e decide quanto cobra. Cobrar caro com agenda cheia
 *   funciona; com agenda vazia, afasta.
 *
 *   AÇÕES — `acoesDoTrabalho` escolhe de 2 a 5 ações que fazem sentido AGORA,
 *   com o porquê; o resto vai para "mais". Nada absurdo aparece: a
 *   disponibilidade do motor filtra, e cada ação só existe no modo em que faz
 *   sentido.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Acao } from '../acoes';
import type { Emprego, Pessoa, Vida } from '../tipos';
import { escrever, filhos, idade, idadePessoa, marcarFato, parceiro, temFato, vinculosVivos } from '../nucleo';
import { ocupacao, ocupacaoOuNula, ROTULO_TRILHA, type Ocupacao } from '../dados/ocupacoes';
import { familiaDaTrilha } from '../dados/carreiras';
import { economiaLocal, municipio } from '../dados/lugares';
import { bloqueio, podeTentar, PERMITIDO, type Veredito } from '../plausibilidade';
import { degrausAcima, eDasForcas, elegibilidade, horizonte, nomeOcupacao, podeAposentar, rendaDeClientela, tetoSalarial } from './trabalho';
import { liquido } from './renda';
import { disponivel, limiteDeCredito, pagar, parcelaPrice, seguranca } from './dinheiro';
import { abrirUnidade, ampliar, negocioAtivo, podeAbrirUnidade, podeAmpliar, reservaDoCaixa, retirarDoCaixa, tamanhoDaEquipe, tetoDoMovimento } from './negocio';
import { guarnicaoPerto, indiceDaGuarnicao } from './militar';
import { aplicarPersonalidade } from '../personalidade';
import { marcar } from './marcas';
import { anoDe } from '../tempo';
import { dinheiro as fmt, flex, ge } from '../texto';
import { abalar } from './abalo';
import { climaDe, comChefia, fatorJornada, fatorRitmoClientela, fatorRitmoSalario, ritmoDe, type Ritmo } from './ritmo';

export { climaDe, comChefia, fatorDeFreguesia, fatorJornada, pesoDoClima, pesoDoRitmo, ritmoDe, type Ritmo } from './ritmo';
import { editaisAbertos } from './concurso';
import { acoesPoliticas } from './politica';

/* ================================================================== Modo */

export type ModoTrabalho =
  | 'crianca' | 'estudante' | 'procurando' | 'aposentado' | 'preso' | 'pausa' | 'base'
  | 'formacao' | 'aprendiz' | 'estagio'
  | 'empregado' | 'servidor' | 'docente' | 'saude' | 'seguranca' | 'militar'
  | 'negocio' | 'autonomo' | 'informal' | 'plataforma' | 'rural' | 'pesca' | 'artista' | 'atleta'
  /** Mandato, campanha sem outro trabalho, eleito à espera da posse. */
  | 'politica';

export function modoDoTrabalho(v: Vida): ModoTrabalho {
  const i = idade(v);
  if (i < 14) return 'crianca';
  if (v.justica?.prisao) return 'preso';
  const e = v.trabalho.atual;
  const pol = v.caminhos.politica;
  if (e?.contrato === 'eletivo' || (!e && pol && (pol.fase === 'candidato' || pol.fase === 'eleito'))) return 'politica';
  if (!e) {
    if (v.trabalho.pausa) return 'pausa';
    if (v.trabalho.aposentadoria) return 'aposentado';
    if (v.caminhos.esporte?.fase === 'base') return 'base';
    if (i < 18 && (v.educacao.basica || v.educacao.matricula)) return 'estudante';
    return 'procurando';
  }
  const oc = ocupacao(e.ocupacaoId);
  const f = familiaDaTrilha(oc.trilha);
  if (e.formacaoAte) return 'formacao';
  if (e.contrato === 'aprendiz') return 'aprendiz';
  if (e.contrato === 'estagio') return 'estagio';
  if (negocioAtivo(v)) return 'negocio';
  if (oc.trilha === 'atleta') return 'atleta';
  if (eDasForcas(oc)) return 'militar';
  if (f.progressao === 'seguranca') return 'seguranca';
  if (oc.id === 'produtor_rural') return 'rural';
  if (oc.id === 'pescador') return 'pesca';
  if (f.progressao === 'docente' || f.progressao === 'academica') return 'docente';
  if (f.progressao === 'arte' && e.clientela !== undefined) return 'artista';
  if (e.contrato === 'servidor') return 'servidor';
  if (f.progressao === 'saude' && e.clientela === undefined) return 'saude';
  if (e.contrato === 'informal') return 'informal';
  if (f.progressao === 'plataforma' && e.contrato !== 'clt') return 'plataforma';
  if (e.clientela !== undefined) return 'autonomo';
  return 'empregado';
}

/** Há chefia e equipe (e, portanto, clima). */
export const temChefia = (v: Vida) => comChefia(v.trabalho.atual);

/* ================================================================= Ritmo */

const RITMO_SALARIO = new Set<ModoTrabalho>(['docente', 'saude']);
const RITMO_CLIENTELA = new Set<ModoTrabalho>(['autonomo', 'informal', 'plataforma', 'artista', 'rural', 'pesca', 'negocio']);

export const temRitmo = (v: Vida) => { const m = modoDoTrabalho(v); return RITMO_SALARIO.has(m) || RITMO_CLIENTELA.has(m); };

/** As palavras do ritmo, no idioma de cada trabalho. */
export function rotulosDoRitmo(v: Vida): { puxado: string; leve: string; normal: string; sobre: string } {
  const m = modoDoTrabalho(v);
  if (m === 'docente') return { puxado: 'Pegar mais turmas', leve: 'Ficar com menos turmas', normal: 'Voltar à carga de sempre', sobre: 'Mais aulas, mais salário — e mais prova para corrigir no domingo.' };
  if (m === 'saude') return { puxado: 'Pegar plantões extras', leve: 'Fazer menos plantões', normal: 'Voltar à escala de sempre', sobre: 'Plantão a mais paga bem e cobra noite de sono.' };
  if (m === 'negocio') return { puxado: 'Estar no balcão todo dia, de manhã à noite', leve: 'Deixar mais com a equipe', normal: 'Voltar ao horário de sempre', sobre: 'Dono presente puxa o movimento; dono exausto erra.' };
  if (m === 'artista') return { puxado: 'Aceitar todo trabalho que aparecer', leve: 'Guardar tempo para a própria obra', normal: 'Voltar ao ritmo de sempre', sobre: 'Todo convite paga conta; nem todo convite faz obra.' };
  if (m === 'rural') return { puxado: 'Plantar mais, de sol a sol', leve: 'Diminuir a área', normal: 'Voltar ao tamanho de sempre', sobre: 'Mais área, mais colheita — e mais corpo cansado.' };
  if (m === 'pesca') return { puxado: 'Sair mais para pescar', leve: 'Pescar menos', normal: 'Voltar às saídas de sempre', sobre: 'Mais saída, mais peixe — e mais madrugada.' };
  return { puxado: 'Aceitar todo serviço (agenda cheia)', leve: 'Deixar a agenda mais leve', normal: 'Voltar à agenda de sempre', sobre: 'Agenda cheia rende e cansa; agenda leve sobra tempo e falta dinheiro.' };
}

export function podeMudarRitmo(v: Vida, alvo: Ritmo): Veredito {
  const e = v.trabalho.atual;
  if (!e || !temRitmo(v)) return bloqueio('impossivel', 'Nesse trabalho, a carga não é você quem escolhe.');
  if (ritmoDe(e) === alvo) return bloqueio('impossivel', 'Já é assim.');
  if (e.reduzida && alvo === 'puxado') return bloqueio('incompativel', 'A jornada está reduzida para cuidar de alguém.');
  if (v.anoAtual.acoes.includes('ritmo')) return bloqueio('incompativel', 'Você já mexeu no ritmo neste ano.');
  const n = negocioAtivo(v);
  if (n && alvo === 'leve' && tamanhoDaEquipe(n) === 0) return bloqueio('requisito', 'Sem ninguém para dividir o balcão, não há como aliviar.');
  if (alvo === 'puxado' && v.corpo.saude < 35) return bloqueio('requisito', 'O corpo não aguenta mais carga agora.');
  return PERMITIDO;
}

export function mudarRitmo(v: Vida, alvo: Ritmo): string {
  const e = v.trabalho.atual!;
  const antes = ritmoDe(e);
  v.anoAtual.acoes.push('ritmo');
  if (e.clientela === undefined) {
    // Quem ganha por turma ou plantão: o salário muda na hora (e volta quando o ritmo volta).
    e.salario = Math.round(e.salario / fatorRitmoSalario(antes) * fatorRitmoSalario(alvo) / 10) * 10;
  } else if (!negocioAtivo(v)) {
    e.salario = Math.round(e.salario / fatorRitmoClientela(antes) * fatorRitmoClientela(alvo) / 10) * 10;
  }
  e.ritmo = alvo === 'normal' ? undefined : alvo;
  if (alvo !== 'puxado') e.anosPuxado = 0;
  const r = rotulosDoRitmo(v);
  const texto = alvo === 'puxado' ? `${r.puxado}: mais trabalho, mais dinheiro, menos tempo.` : alvo === 'leve' ? `${r.leve}: menos dinheiro, mais vida fora do trabalho.` : 'De volta ao ritmo de sempre.';
  escrever(v, { texto: alvo === 'puxado' ? `Decidiu puxar o ritmo do trabalho: ${r.puxado.toLowerCase()}.` : alvo === 'leve' ? `Decidiu aliviar o ritmo do trabalho: ${r.leve.toLowerCase()}.` : 'Voltou ao ritmo de trabalho de sempre.', relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
  return texto;
}

/**
 * O ano do ritmo: o que o puxado cobra (e o leve devolve) do corpo, da casa,
 * da parceria. A cabeça e a semana leem o ritmo direto (`estado`, `semana`).
 */
export function processarRitmo(v: Vida): void {
  const e = v.trabalho.atual;
  if (!e) return;
  const ritmo = ritmoDe(e);
  const pequenos = filhos(v).filter(f => v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(v, f) < 12);
  const par = parceiro(v);
  const juntos = par && par.vin.convivio.includes('casa');
  if (ritmo === 'puxado') {
    e.anosPuxado = (e.anosPuxado ?? 0) + 1;
    const anos = e.anosPuxado;
    if (anos >= 2) v.corpo.saude = clamp(v.corpo.saude - Math.min(3.5, 0.8 * (anos - 1)));
    if (anos >= 2) v.corpo.forma = clamp(v.corpo.forma - 1);
    for (const f of pequenos) { const vin = v.vinculos[f.id]; vin.presenca = clamp((vin.presenca ?? 50) - 4); vin.proximidade = clamp(vin.proximidade - 1); }
    if (juntos && anos >= 2) par!.vin.tensao = clamp(par!.vin.tensao + 3);
  } else {
    e.anosPuxado = 0;
    if (ritmo === 'leve') for (const f of pequenos) { const vin = v.vinculos[f.id]; vin.presenca = clamp((vin.presenca ?? 50) + 2); }
  }
}

/* ================================================================= Clima */

export function mexerNoClima(v: Vida, delta: number): void {
  const e = v.trabalho.atual;
  if (!e) return;
  e.clima = Math.round(clamp(climaDe(e) + delta));
}

/** Quem chefia hoje (quando a vida tem alguém com nome nesse lugar). */
export function chefiaAtual(v: Vida): Pessoa | undefined {
  const e = v.trabalho.atual;
  if (!e) return undefined;
  const chave = `trabalho:${e.empregador}:${e.tInicio}`;
  return vinculosVivos(v).find(x => x.vin.ambiente === chave && (x.p.ocupacao === 'gestor' || x.p.ocupacao === 'gestora'))?.p;
}

/** O ano do clima: volta devagar ao normal; o desempenho e a relação com quem chefia empurram. */
export function processarClima(v: Vida): void {
  const e = v.trabalho.atual;
  if (!e || !temChefia(v)) return;
  const c = climaDe(e);
  const chefe = chefiaAtual(v);
  const tensaoChefe = chefe ? v.vinculos[chefe.id]?.tensao ?? 0 : 0;
  const delta = (50 - c) * 0.2 + (e.desempenho >= 72 ? 2 : e.desempenho < 40 ? -4 : 0) + (tensaoChefe > 40 ? -3 : 0) + (v.mente.estresse > 72 ? -1.5 : 0);
  e.clima = Math.round(clamp(c + delta));
}

export function leituraDoClima(v: Vida): { palavra: string; texto: string; tom: 'bom' | 'ruim' | 'neutro' } | undefined {
  const e = v.trabalho.atual;
  if (!e || !temChefia(v)) return undefined;
  const c = climaDe(e);
  const chefe = chefiaAtual(v);
  const quem = chefe ? chefe.nome : 'a chefia';
  if (c >= 72) return { palavra: 'bom', texto: `${cap(quem)} confia no seu trabalho; a equipe conta com você.`, tom: 'bom' };
  if (c >= 58) return { palavra: 'tranquilo', texto: `Com ${quem}, tudo em ordem.`, tom: 'neutro' };
  if (c >= 42) return { palavra: 'normal', texto: 'Nem amizade, nem briga: trabalho.', tom: 'neutro' };
  if (c >= 28) return { palavra: 'tenso', texto: `A relação com ${quem} anda estremecida.`, tom: 'ruim' };
  return { palavra: 'ruim', texto: `O clima com ${quem} azedou de vez: cada reunião é um teste.`, tom: 'ruim' };
}

/* ======================================================== Por conta própria */

const POR_CONTA = new Set<ModoTrabalho>(['autonomo', 'informal', 'plataforma']);

export function custoDaEstrutura(v: Vida): number {
  const e = v.trabalho.atual!;
  const oc = ocupacao(e.ocupacaoId);
  const base = Math.max(3000, liquido(e.salario, e.contrato) * 2.2);
  return Math.round(base * (1 + (e.estrutura ?? 0)) * (familiaDaTrilha(oc.trilha).progressao === 'liberal' || familiaDaTrilha(oc.trilha).progressao === 'saude' ? 1.8 : 1) / 500) * 500;
}

export function rotuloDaEstrutura(v: Vida): string {
  const e = v.trabalho.atual!;
  const f = familiaDaTrilha(ocupacao(e.ocupacaoId).trilha);
  const nivel = e.estrutura ?? 0;
  if (f.progressao === 'liberal' || f.progressao === 'saude') return nivel === 0 ? 'Montar uma sala de atendimento' : 'Melhorar o consultório';
  if (f.progressao === 'plataforma') return nivel === 0 ? 'Trocar o equipamento de trabalho' : 'Um veículo de trabalho melhor';
  if (f.progressao === 'arte') return nivel === 0 ? 'Equipamento próprio' : 'Um estúdio/ensaio próprio';
  if (e.contrato === 'informal') return nivel === 0 ? 'Comprar equipamento' : 'Um ponto fixo';
  return nivel === 0 ? 'Ferramentas e equipamento melhores' : 'Um espaço próprio de trabalho';
}

export function podeInvestirEstrutura(v: Vida): Veredito {
  const e = v.trabalho.atual;
  const m = modoDoTrabalho(v);
  if (!e || !(POR_CONTA.has(m) || m === 'artista')) return bloqueio('impossivel', 'Só para quem trabalha por conta.');
  if ((e.estrutura ?? 0) >= 2) return bloqueio('impossivel', 'Já investiu o que dá para investir nesse trabalho.');
  if (v.anoAtual.acoes.includes('estrutura')) return bloqueio('incompativel', 'Você já investiu neste ano.');
  const custo = custoDaEstrutura(v);
  if (disponivel(v) < custo) return bloqueio('requisito', `Custa uns ${fmt(custo)}.`);
  return PERMITIDO;
}

export function investirEstrutura(v: Vida): string {
  const e = v.trabalho.atual!;
  const custo = custoDaEstrutura(v);
  const rotulo = rotuloDaEstrutura(v);
  pagar(v, custo);
  v.anoAtual.acoes.push('estrutura');
  e.estrutura = (e.estrutura ?? 0) + 1;
  e.clientela = clamp((e.clientela ?? 20) + 4);
  e.salario = rendaDeClientela(v, ocupacao(e.ocupacaoId), e.clientela ?? 20, e);
  escrever(v, { texto: `Investiu no próprio trabalho: ${rotulo.toLowerCase()}, por ${fmt(custo)}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
  return `${rotulo}: ${fmt(custo)}. Mais freguesia possível — o retorno vem com o tempo.`;
}

export function podeMudarPreco(v: Vida, alvo: 'baixo' | 'normal' | 'alto'): Veredito {
  const e = v.trabalho.atual;
  const m = modoDoTrabalho(v);
  if (!e || !(POR_CONTA.has(m) || m === 'artista') || m === 'plataforma') return bloqueio('impossivel', 'Aqui, o preço não é você quem faz.');
  if ((e.preco ?? 'normal') === alvo) return bloqueio('impossivel', 'Já cobra assim.');
  if (v.anoAtual.acoes.includes('preco')) return bloqueio('incompativel', 'Você já mexeu no preço neste ano.');
  return PERMITIDO;
}

export function mudarPreco(v: Vida, alvo: 'baixo' | 'normal' | 'alto'): string {
  const e = v.trabalho.atual!;
  v.anoAtual.acoes.push('preco');
  e.preco = alvo === 'normal' ? undefined : alvo;
  e.salario = rendaDeClientela(v, ocupacao(e.ocupacaoId), e.clientela ?? 20, e);
  escrever(v, { texto: alvo === 'alto' ? 'Passou a cobrar mais pelo trabalho.' : alvo === 'baixo' ? 'Baixou o preço para atrair freguesia.' : 'Voltou a cobrar o preço de mercado.', relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
  return alvo === 'alto' ? 'Cobrar mais: cada serviço rende mais; quem não pode pagar vai embora.' : alvo === 'baixo' ? 'Cobrar menos: mais gente procura; cada serviço rende menos.' : 'De volta ao preço de mercado.';
}

/* ================================================================ Leitura */

export interface LeituraTrabalho {
  modo: ModoTrabalho;
  /** O que a pessoa faz, em palavras (o título da tela). */
  titulo: string;
  /** Onde. */
  onde?: string;
  /** Desde quando e há quanto tempo. */
  desde?: string;
  /** O que entra por mês, no bolso. */
  renda?: string;
  /** Como é o vínculo (carteira, servidor, por conta...). */
  vinculo?: string;
  /** Como é a jornada. */
  jornada?: string;
  /** Como vai (satisfação e tensão), numa ou duas frases. */
  frases: string[];
  horizonte?: string;
}

const VINCULO: Record<string, string> = { eletivo: 'mandato eletivo', clt: 'carteira assinada', servidor: 'servidor público', militar: 'carreira militar', informal: 'informal', autonomo: 'por conta própria', estagio: 'estágio', temporario: 'contrato temporário', aprendiz: 'jovem aprendiz' };

export function leituraDoTrabalho(v: Vida): LeituraTrabalho {
  const modo = modoDoTrabalho(v);
  const e = v.trabalho.atual;
  const g = ge(v);
  if (!e) {
    const t = v.trabalho;
    const frases: string[] = [];
    let titulo = 'Sem trabalho';
    if (modo === 'crianca') { titulo = 'Ainda não é hora'; frases.push('Trabalho é proibido antes dos 14 anos. O trabalho agora é crescer.'); }
    else if (modo === 'preso') { titulo = 'Cumprindo pena'; frases.push('O trabalho possível é o da unidade.'); }
    else if (modo === 'pausa') { titulo = flex(g, 'Cuidando', 'Cuidando'); frases.push('Fora do trabalho pago, por um tempo, para cuidar.'); }
    else if (modo === 'aposentado' && t.aposentadoria) { titulo = flex(g, 'Aposentado', 'Aposentada', 'Aposentade'); frases.push(`${fmt(t.aposentadoria.beneficio)} por mês, desde ${anoDe(t.aposentadoria.t)}.`); }
    else if (modo === 'base' && v.caminhos.esporte) { titulo = `Na base do ${v.caminhos.esporte.clube}`; frases.push('Treino todo dia, escola à noite. Quase ninguém da base vira profissional — e quem vira, vira cedo.'); }
    else if (modo === 'estudante') { titulo = 'Estudando'; frases.push(idade(v) < 16 ? 'Aos 14 e 15, só como jovem aprendiz.' : 'Dá para começar como aprendiz ou estagiário, sem largar a escola.'); }
    else {
      const desde = t.desempregadoDesde;
      const anos = desde !== undefined ? Math.floor((v.t - desde) / 12) : 0;
      if (!t.historico.length) { titulo = 'Procurando o primeiro trabalho'; frases.push('Sem experiência, as portas são poucas — e cada uma conta.'); }
      else if (anos >= 2) frases.push(`Sem trabalho fixo desde ${anoDe(desde!)}. Cada ano parado pesa mais na entrevista.`);
      else if (desde !== undefined) frases.push(`Sem trabalho desde ${anoDe(desde)}.`);
    }
    return { modo, titulo, frases };
  }
  const oc = ocupacao(e.ocupacaoId);
  const nome = nomeOcupacao(v, oc);
  const anos = Math.floor((v.t - e.tInicio) / 12);
  const noPosto = Math.floor((v.t - (e.tPosto ?? e.tInicio)) / 12);
  const liq = liquido(e.salario, e.contrato);
  const f = familiaDaTrilha(oc.trilha);
  const variavel = e.clientela !== undefined;
  const renda = `${fmt(liq)} por mês no bolso${variavel ? (f.renda === 'sazonal' ? ', conforme a safra' : f.renda === 'projeto' ? ', conforme os trabalhos' : ', conforme a freguesia') : ''}`;
  const jornada = e.formacaoAte ? 'curso de formação, em tempo integral' : e.reduzida ? 'jornada reduzida (para cuidar de alguém)' : e.carga === 'parcial' ? 'meio período' : oc.jornada === 'plantao' ? 'plantões, com noites e fins de semana' : oc.jornada === 'fora' ? 'dias fora de casa' : oc.jornada === 'longa' ? 'jornada longa' : 'jornada inteira';
  const ritmo = ritmoDe(e) === 'puxado' ? ` · ${rotulosDoRitmo(v).puxado.toLowerCase()}` : ritmoDe(e) === 'leve' ? ` · ${rotulosDoRitmo(v).leve.toLowerCase()}` : '';
  const desde = anos < 1 ? `começou em ${anoDe(e.tInicio)}` : noPosto < anos && noPosto >= 1 ? `${anos} ${anos === 1 ? 'ano' : 'anos'} ali, ${noPosto} no cargo` : `desde ${anoDe(e.tInicio)} · ${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  const onde = e.empregador === 'a própria terra' || /^o sítio|^uma terra|^o próprio sítio/.test(e.empregador) ? cap(e.empregador) : `${cap(e.empregador)}${e.municipioId !== v.moradia.municipioId ? `, em ${municipio(e.municipioId).nome}` : ''}`;
  return { modo, titulo: cap(nome), onde, desde, renda, vinculo: VINCULO[e.contrato], jornada: jornada + ritmo, frases: comoVai(v, e, oc), horizonte: horizonte(v) };
}

/** Como vai o trabalho, em até duas frases: o que dá prazer, o que pesa. */
function comoVai(v: Vida, e: Emprego, oc: Ocupacao): string[] {
  const out: string[] = [];
  const modo = modoDoTrabalho(v);
  const d = e.desempenho;
  const noPosto = (v.t - (e.tPosto ?? e.tInicio)) / 12;
  const f = familiaDaTrilha(oc.trilha);
  if (e.clientela === undefined && !e.formacaoAte) {
    // Os mesmos limiares da promoção (62) e do corte (40): a leitura não contradiz o horizonte.
    if (d >= 76) out.push('O trabalho vai muito bem: é de você que lembram quando aparece algo difícil.');
    else if (d >= 62) out.push('O trabalho vai bem.');
    else if (d >= 40) out.push('O trabalho vai, sem destaque.');
    else out.push('O trabalho vem indo mal, e todo mundo percebe.');
  }
  const sentido = (f.sentido ?? []).some(x => (v.caminhos.frentes[x]?.interesse ?? 0) >= 55);
  if (sentido) out.push('É um trabalho que tem a ver com o que você gosta de fazer.');
  if (ritmoDe(e) === 'puxado' && (e.anosPuxado ?? 0) >= 2) out.push('O ritmo puxado já dura anos; o corpo começa a cobrar.');
  if (e.clientela === undefined && modo !== 'militar' && modo !== 'servidor' && noPosto >= 6 && degrausAcima(oc).length) out.push(`${Math.floor(noPosto)} anos no mesmo cargo.`);
  if (e.clientela === undefined && e.salario / fatorJornada(e) >= tetoSalarial(e) * 0.97 && modo === 'empregado') out.push('O salário já está no teto do que esse cargo paga por aqui.');
  const clima = leituraDoClima(v);
  if (clima && clima.tom !== 'neutro') out.push(clima.texto);
  return out.slice(0, 3);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ================================================================= Ações */

export type OqueProfissao =
  | 'ritmo' | 'promocao' | 'estrutura' | 'preco'
  | 'contratar' | 'demitir' | 'ampliar' | 'unidade' | 'retirar' | 'estrategia' | 'socio' | 'vender' | 'fechar'
  | 'foco' | 'treinador' | 'mercado' | 'pendurar' | 'pos_carreira'
  | 'movimentacao' | 'remocao'
  | 'cooperativa' | 'investir_terra' | 'diversificar' | 'sucessao'
  | 'lancar' | 'estrada';

export type AcaoProfissaoCmd = { tipo: 'profissao'; oque: OqueProfissao; valor?: string; pessoaId?: string };

/** Para onde a tela leva quando a ação não é um comando, mas um lugar. */
export type DestinoTrabalho = 'explorar' | 'rumo' | 'tempo' | 'casa' | 'pessoas';

export interface AcaoProfissional {
  id: string;
  rotulo: string;
  /** Por que agora (uma frase curta). */
  porque?: string;
  acao?: Acao;
  ir?: DestinoTrabalho;
  /** Quanto importa agora (maior primeiro). */
  peso: number;
  /** Uma saída (demitir-se, fechar, pendurar as chuteiras): visualmente separada, nunca em destaque. */
  saida?: boolean;
  /** Aviso (quando a ação é possível mas arriscada). */
  aviso?: string;
}

type Disp = (v: Vida, a: Acao) => Veredito;

/**
 * As ações que fazem sentido agora, com o porquê: as 2–5 mais pesadas vão
 * para "agora"; o resto, para "mais". Nenhuma ação impossível entra.
 */
export function acoesDoTrabalho(v: Vida, disp: Disp): { agora: AcaoProfissional[]; mais: AcaoProfissional[]; saidas: AcaoProfissional[] } {
  const lista: AcaoProfissional[] = idade(v) >= 16 ? acoesPoliticas(v, disp) : [];
  const add = (x: AcaoProfissional) => {
    if (x.acao) {
      const d = disp(v, x.acao);
      if (!podeTentar(d)) return;
      if (d.grau === 'improvavel' || d.grau === 'irregular') x.aviso = x.aviso ?? d.motivo;
    }
    lista.push(x);
  };
  const modo = modoDoTrabalho(v);
  const e = v.trabalho.atual;
  const i = idade(v);
  const seg = seguranca(v);
  const aperto = seg.nivel === 'no_vermelho' || seg.nivel === 'apertado';
  const cabecaCheia = v.mente.estresse >= 62;
  const pequenos = filhos(v).some(f => v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(v, f) < 6);
  const P = (oque: OqueProfissao, extra: Partial<AcaoProfissaoCmd> = {}): Acao => ({ tipo: 'profissao', oque, ...extra } as unknown as Acao);

  /* ---------------------------------------------- Sem trabalho */
  if (!e) {
    if (modo === 'crianca' || modo === 'preso') return { agora: [], mais: [], saidas: [] };
    if (modo === 'pausa') {
      const pa = v.trabalho.pausa!;
      add({ id: 'voltar', rotulo: pa.intensidade === 'parcial' ? 'Voltar à jornada inteira' : 'Voltar ao mercado', acao: { tipo: 'voltar_mercado' }, peso: 6 });
      if (pa.intensidade === 'total') add({ id: 'facultativo', rotulo: pa.facultativo ? 'Parar de pagar o INSS facultativo' : 'Pagar o INSS como facultativo', porque: pa.facultativo ? undefined : 'Para o tempo de aposentadoria não parar.', acao: { tipo: 'facultativo', ativo: !pa.facultativo }, peso: pa.facultativo ? 1 : 5 });
      return separar(lista);
    }
    if (modo === 'aposentado') {
      add({ id: 'voltar', rotulo: 'Procurar algum trabalho', porque: aperto ? 'O benefício não tem fechado o mês.' : 'Pelo gosto, pela conta ou pela companhia.', ir: 'explorar', peso: aperto ? 6 : 2 });
      return separar(lista);
    }
    if (modo === 'estudante' || modo === 'base') {
      if (i >= 14) add({ id: 'aprendiz', rotulo: i < 16 ? 'Procurar vaga de jovem aprendiz' : 'Procurar um primeiro trabalho', porque: 'Sem largar a escola.', ir: 'explorar', peso: 3 });
      return separar(lista);
    }
    // Procurando.
    const anos = v.trabalho.desempregadoDesde !== undefined ? (v.t - v.trabalho.desempregadoDesde) / 12 : 0;
    add({ id: 'vagas', rotulo: 'Ver as vagas que cabem em você', porque: anos >= 1 ? 'Cada ano parado pesa mais.' : undefined, ir: 'explorar', peso: 9 });
    if (editaisAbertos(v).some(oc => podeTentar(elegibilidade(v, oc)))) add({ id: 'concursos', rotulo: 'Ver os concursos com edital aberto', ir: 'explorar', peso: 5 });
    if (i >= 18 && !v.rotinas.some(r => r.id === 'bico')) add({ id: 'bico', rotulo: 'Fazer bicos enquanto procura', porque: aperto ? 'As contas não esperam.' : undefined, ir: 'tempo', peso: aperto ? 7 : 3 });
    if (i >= 17 && !v.educacao.matricula) add({ id: 'estudar', rotulo: 'Voltar a estudar para abrir outras portas', ir: 'rumo', peso: anos >= 2 ? 5 : 2 });
    if (i >= 18) add({ id: 'negocio', rotulo: 'Pensar num negócio próprio', ir: 'explorar', peso: 1 });
    return separar(lista);
  }

  const oc = ocupacao(e.ocupacaoId);
  const rot = rotulosDoRitmo(v);
  const ritmo = ritmoDe(e);

  /* ---------------------------------------------- Ritmo (onde existe) */
  if (temRitmo(v)) {
    if (ritmo !== 'puxado') add({ id: 'ritmo_puxado', rotulo: rot.puxado, porque: aperto ? 'O mês não fecha: mais trabalho, mais dinheiro.' : rot.sobre, acao: P('ritmo', { valor: 'puxado' }), peso: aperto ? 6 : 2 });
    if (ritmo === 'puxado') add({ id: 'ritmo_normal', rotulo: rot.normal, porque: (e.anosPuxado ?? 0) >= 2 ? 'O corpo e a casa vêm cobrando.' : undefined, acao: P('ritmo', { valor: 'normal' }), peso: cabecaCheia || (e.anosPuxado ?? 0) >= 2 ? 8 : 3 });
    if (ritmo !== 'leve') add({ id: 'ritmo_leve', rotulo: rot.leve, porque: cabecaCheia ? 'A cabeça anda cheia.' : pequenos ? 'Filho pequeno em casa.' : undefined, acao: P('ritmo', { valor: 'leve' }), peso: cabecaCheia ? 6 : pequenos ? 4 : 1 });
    if (ritmo === 'leve') add({ id: 'ritmo_normal', rotulo: rot.normal, porque: aperto ? 'O dinheiro anda curto.' : undefined, acao: P('ritmo', { valor: 'normal' }), peso: aperto ? 6 : 2 });
  }

  /* ---------------------------------------------- Com chefia */
  if (modo === 'empregado' || modo === 'saude' || (modo === 'docente' && e.contrato === 'clt')) {
    const hz = horizonte(v) ?? '';
    const aoAlcance = /está ao alcance|está perto/.test(hz);
    const pedeFormacao = /pede formação/.test(hz);
    add({ id: 'promocao', rotulo: 'Conversar sobre uma promoção', porque: aoAlcance ? hz : undefined, acao: P('promocao'), peso: aoAlcance ? 7 : 3 });
    const semAumento = (v.t - Math.max(e.tPosto ?? e.tInicio, v.fatos['ultimo_aumento'] ?? 0)) / 12;
    add({ id: 'aumento', rotulo: 'Pedir aumento', porque: semAumento >= 2 ? `${Math.floor(semAumento)} anos sem aumento.` : undefined, acao: { tipo: 'pedir_aumento' }, peso: semAumento >= 2 && e.salario / fatorJornada(e) < tetoSalarial(e) * 0.9 ? 6 : 2 });
    if (v.trabalho.horasExtras) add({ id: 'sem_horas', rotulo: 'Desistir das horas extras deste ano', porque: cabecaCheia ? 'A cabeça anda cheia.' : undefined, acao: { tipo: 'horas_extras', parar: true }, peso: cabecaCheia ? 8 : 3 });
    else add({ id: 'horas', rotulo: 'Fazer horas extras este ano', porque: aperto ? 'O mês não fecha.' : 'Mais dinheiro, mais cansaço.', acao: { tipo: 'horas_extras' }, peso: aperto ? 6 : 1 });
    if (pedeFormacao) add({ id: 'qualificar', rotulo: 'Estudar para o próximo passo', porque: hz, ir: 'rumo', peso: 6 });
    const estagnado = (v.t - (e.tPosto ?? e.tInicio)) / 12 >= 5;
    add({ id: 'outra_vaga', rotulo: 'Procurar outra vaga', porque: climaDe(e) < 40 ? 'O clima por aqui não anda bom.' : estagnado ? 'Anos no mesmo lugar.' : undefined, ir: 'explorar', peso: climaDe(e) < 40 ? 6 : estagnado ? 4 : 1 });
  }
  if (modo === 'servidor' || (modo === 'docente' && e.contrato === 'servidor')) {
    const temPos = v.educacao.concluidos.some(c => ['pos', 'mestrado', 'doutorado'].includes(c.nivel));
    add({ id: 'titulacao', rotulo: temPos ? 'Mais uma titulação (mestrado, doutorado)' : 'Fazer uma pós: o adicional de titulação', porque: 'Na carreira pública, estudar é o que sobe o salário.', ir: 'rumo', peso: temPos ? 2 : 5 });
    add({ id: 'remocao', rotulo: 'Pedir remoção para outra cidade', porque: familiaLonge(v) ? `${familiaLonge(v)} mora longe.` : undefined, acao: P('remocao'), peso: familiaLonge(v) ? 5 : 1 });
    add({ id: 'concurso', rotulo: 'Prestar outro concurso', porque: 'Mudar de cargo, no serviço público, é outro edital.', ir: 'explorar', peso: 2 });
  }
  if (modo === 'docente' && e.contrato !== 'servidor' && e.contrato !== 'clt') {
    add({ id: 'outra_vaga', rotulo: 'Procurar outra escola ou rede', ir: 'explorar', peso: 2 });
  }

  /* ---------------------------------------------- Negócio */
  const n = negocioAtivo(v);
  if (n) {
    const teto = tetoDoMovimento(n);
    const eq = tamanhoDaEquipe(n);
    const cheio = n.clientela >= teto - 3 && teto < 100;
    add({ id: 'contratar', rotulo: eq === 0 ? 'Contratar a primeira pessoa' : 'Contratar mais alguém', porque: cheio ? (eq === 0 ? 'Sozinho, não dá para atender mais.' : 'A equipe já não dá conta do movimento.') : n.estado === 'apertado' ? 'Com o movimento fraco, é mais uma conta.' : undefined, acao: P('contratar'), peso: cheio ? 8 : n.estado === 'apertado' ? 0 : 2 });
    if (podeTentar(podeAmpliar(v))) add({ id: 'ampliar', rotulo: n.emCasa ? 'Sair de casa: abrir um ponto' : 'Ampliar o negócio', porque: 'A casa enche: dá para crescer — e a conta cresce junto.', acao: P('ampliar'), peso: 6 });
    if (podeTentar(podeAbrirUnidade(v))) add({ id: 'unidade', rotulo: 'Abrir outra unidade', porque: 'O primeiro ponto está firme.', acao: P('unidade'), peso: 5 });
    const sobra = (n.caixa ?? 0) - reservaDoCaixa(v, n);
    if (sobra >= 3000) add({ id: 'retirar', rotulo: `Tirar ${fmt(Math.round(sobra / 100) * 100)} do caixa`, porque: 'O que sobra no caixa não é seu até você tirar.', acao: P('retirar'), peso: aperto ? 8 : 5 });
    if (n.estado === 'apertado' || (v.fatos['negocio_estrategia'] === undefined && (v.t - n.tInicio) / 12 >= 3)) add({ id: 'estrategia', rotulo: 'Mudar o jeito de vender', porque: n.estado === 'apertado' ? 'O movimento não reage.' : undefined, acao: P('estrategia'), peso: n.estado === 'apertado' ? 6 : 2 });
    if (!n.socioId) add({ id: 'socio', rotulo: 'Trazer um sócio', porque: n.estado === 'apertado' ? 'Dinheiro novo, metade do lucro.' : undefined, acao: P('socio'), peso: n.estado === 'apertado' ? 3 : 1 });
    for (const f of n.equipe ?? []) {
      const p = v.pessoas[f.pessoaId];
      if (p) add({ id: `demitir_${p.id}`, rotulo: `Demitir ${p.nome}`, porque: n.estado === 'apertado' ? 'A folha pesa mais do que o movimento paga.' : undefined, acao: P('demitir', { pessoaId: p.id }), peso: n.estado === 'apertado' ? 4 : 0 });
    }
    add({ id: 'vender', rotulo: 'Vender o negócio', porque: i >= 60 ? 'Passar adiante enquanto vale.' : undefined, acao: P('vender'), peso: i >= 60 ? 5 : 0 });
    add({ id: 'fechar', rotulo: 'Fechar o negócio', acao: P('fechar'), peso: 0, saida: true });
  }

  /* ---------------------------------------------- Por conta própria */
  if (POR_CONTA.has(modo) || modo === 'artista') {
    const c = e.clientela ?? 0;
    if (c >= 62 && e.preco !== 'alto') add({ id: 'preco_alto', rotulo: 'Cobrar mais', porque: 'A agenda está cheia.', acao: P('preco', { valor: 'alto' }), peso: 5 });
    if (c < 28 && e.preco !== 'baixo') add({ id: 'preco_baixo', rotulo: 'Baixar o preço', porque: 'A freguesia anda pouca.', acao: P('preco', { valor: 'baixo' }), peso: 4 });
    if (e.preco) add({ id: 'preco_normal', rotulo: 'Voltar ao preço de mercado', acao: P('preco', { valor: 'normal' }), peso: e.preco === 'alto' && c < 40 ? 6 : 1 });
    if (c >= 30) add({ id: 'estrutura', rotulo: rotuloDaEstrutura(v), porque: `Uns ${fmt(custoDaEstrutura(v))}: mais freguesia possível.`, acao: P('estrutura'), peso: 3 });
    add({ id: 'mei', rotulo: 'Formalizar como MEI', porque: 'Nota fiscal, INSS contando, cliente que exige CNPJ.', acao: { tipo: 'mei' }, peso: e.contrato === 'informal' ? 5 : 3 });
    if (c >= 70 && modo === 'autonomo') add({ id: 'negocio', rotulo: 'Abrir o próprio negócio', porque: 'A freguesia é maior do que uma pessoa dá conta.', ir: 'explorar', peso: 4 });
    if (modo === 'informal' || modo === 'plataforma') add({ id: 'carteira', rotulo: 'Procurar trabalho com carteira', ir: 'explorar', peso: c < 30 ? 4 : 1 });
  }

  /* ---------------------------------------------- Campo e água */
  if (modo === 'rural') {
    const ru = v.caminhos.rural;
    if (ru && !ru.cooperativa) add({ id: 'cooperativa', rotulo: 'Entrar para a cooperativa', porque: ru.anosRuins >= 1 ? 'Ano ruim de novo: junto, perde-se menos.' : 'Vender junto, comprar junto.', acao: P('cooperativa'), peso: ru.anosRuins >= 1 ? 6 : 3 });
    if (ru && ru.cultura !== 'misto') add({ id: 'diversificar', rotulo: 'Diversificar a produção', porque: ru.anosRuins >= 1 ? 'Um ano ruim não pode derrubar tudo.' : undefined, acao: P('diversificar'), peso: ru.anosRuins >= 1 ? 5 : 1 });
    add({ id: 'investir_terra', rotulo: 'Investir na produção (crédito rural)', porque: 'Equipamento e irrigação, pagos com a safra.', acao: P('investir_terra'), peso: 2 });
    if (ru?.terra === 'arrendada') add({ id: 'comprar_terra', rotulo: 'Comprar a própria terra', porque: 'Parar de pagar arrendamento.', acao: P('investir_terra', { valor: 'terra' }), peso: 3 });
    if (i >= 58) add({ id: 'sucessao', rotulo: 'Passar a terra adiante', porque: 'Pensar em quem continua.', acao: P('sucessao'), peso: i >= 65 ? 6 : 3 });
  }

  /* ---------------------------------------------- Arte */
  if (modo === 'artista' || (v.caminhos.arte?.ativo && i >= 16)) {
    add({ id: 'lancar', rotulo: v.caminhos.arte?.linguagem === 'musica' || oc.trilha === 'musica' ? 'Gravar e lançar um trabalho' : 'Estrear um trabalho novo', porque: 'Obra na rua é o que faz o público crescer.', acao: P('lancar'), peso: 4 });
    add({ id: 'estrada', rotulo: 'Cair na estrada (uma turnê)', porque: 'Público novo, dinheiro incerto, casa longe.', acao: P('estrada'), peso: 2 });
  }

  /* ---------------------------------------------- Atleta */
  if (modo === 'atleta') {
    const es = v.caminhos.esporte;
    if (es) {
      if (es.foco !== 'forcar') add({ id: 'forcar', rotulo: 'Treinar dobrado', porque: es.espaco === 'reserva' ? 'Para disputar a posição.' : 'Evolui mais — e machuca mais.', acao: P('foco', { valor: 'forcar' }), peso: es.espaco === 'reserva' ? 6 : 2 });
      if (es.foco !== 'preservar') add({ id: 'preservar', rotulo: 'Preservar o corpo', porque: es.lesoes >= 2 || i >= 30 ? 'O corpo tem prazo.' : undefined, acao: P('foco', { valor: 'preservar' }), peso: es.lesoes >= 2 || i >= 30 ? 6 : 1 });
      if (es.foco) add({ id: 'foco_normal', rotulo: 'Voltar ao treino de sempre', acao: P('foco', { valor: 'normal' }), peso: 1 });
      if (es.espaco === 'reserva') add({ id: 'treinador', rotulo: 'Conversar com o treinador', porque: 'Mais um jogo no banco.', acao: P('treinador'), peso: 7 });
      add({ id: 'mercado', rotulo: 'Pedir para ser negociado', porque: es.espaco === 'reserva' ? 'Em outro clube, dá para jogar.' : undefined, acao: P('mercado'), peso: es.espaco === 'reserva' ? 5 : 1 });
      if (i >= 27 && !temFato(v, 'pos_carreira')) add({ id: 'pos', rotulo: 'Preparar a vida depois do esporte', porque: 'Quase ninguém joga depois dos 35.', acao: P('pos_carreira'), peso: i >= 30 ? 7 : 4 });
      add({ id: 'pendurar', rotulo: 'Encerrar a carreira', acao: P('pendurar'), peso: 0, saida: true });
    }
  }

  /* ---------------------------------------------- Forças e segurança */
  if (modo === 'militar') {
    const m = v.caminhos.militar;
    if (m && (familiaLonge(v) || (v.t - m.tGuarnicao) / 12 >= 3)) add({ id: 'movimentacao', rotulo: 'Pedir movimentação', porque: familiaLonge(v) ? `Para perto de ${familiaLonge(v)}.` : 'Anos na mesma guarnição.', acao: P('movimentacao'), peso: familiaLonge(v) ? 5 : 2 });
    if (v.corpo.forma < 55) add({ id: 'taf', rotulo: 'Treinar para o teste físico', porque: 'O TAF é todo ano; quem não passa, espera a promoção.', ir: 'tempo', peso: 6 });
  }

  /* ---------------------------------------------- Comuns */
  if (podeTentar(podeAposentar(v)) && !e.posAposentadoria) add({ id: 'aposentar', rotulo: eDasForcas(oc) || oc.contrato === 'militar' ? 'Ir para a reserva' : 'Aposentar', acao: { tipo: 'aposentar' }, peso: i >= 65 ? 8 : 4 });
  if (e.contrato !== 'militar' && ['empregado', 'saude', 'docente', 'servidor', 'seguranca'].includes(modo) && podeTentar(disp(v, { tipo: 'cuidar_da_casa', intensidade: 'parcial' }))) {
    const cuidaAlguem = pequenos || vinculosVivos(v).some(x => x.vin.convivio.includes('casa') && ['mae', 'pai', 'avo', 'sogro'].includes(x.vin.parentesco ?? '') && idadePessoa(v, x.p) >= 75);
    add({ id: 'reduzir', rotulo: 'Reduzir a jornada para cuidar da família', porque: cuidaAlguem ? 'Quem mora com você precisa de tempo.' : undefined, acao: { tipo: 'cuidar_da_casa', intensidade: 'parcial' }, peso: cuidaAlguem ? 4 : 0 });
  }
  if (!n && modo !== 'atleta' && modo !== 'politica') add({ id: 'sair', rotulo: e.clientela !== undefined ? 'Parar com esse trabalho' : eDasForcas(oc) ? 'Deixar a Força' : e.contrato === 'servidor' ? 'Pedir exoneração' : 'Pedir demissão', acao: { tipo: 'pedir_demissao' }, peso: 0, saida: true });
  return separar(lista);
}

function separar(lista: AcaoProfissional[]): { agora: AcaoProfissional[]; mais: AcaoProfissional[]; saidas: AcaoProfissional[] } {
  const unicas = lista.filter((x, k) => lista.findIndex(y => y.id === x.id) === k);
  const saidas = unicas.filter(x => x.saida);
  const resto = unicas.filter(x => !x.saida).sort((a, b) => b.peso - a.peso);
  // Agora: o que pesa de verdade (2 a 5). Se pouco pesa, completa com o que tem algum motivo — nunca com o que não tem nenhum.
  const fortes = resto.filter(x => x.peso >= 3);
  const agora = (fortes.length >= 2 ? fortes : [...fortes, ...resto.filter(x => x.peso >= 1 && x.peso < 3)].slice(0, 3)).slice(0, 5);
  const mais = resto.filter(x => !agora.includes(x));
  return { agora, mais, saidas };
}

/** Alguém muito próximo mora em outra cidade (parceria, filho pequeno, pais idosos). */
export function familiaLonge(v: Vida): string | undefined {
  const aqui = v.moradia.municipioId;
  const par = parceiro(v);
  if (par && par.p.municipioId !== aqui) return par.p.nome;
  const pais = vinculosVivos(v).filter(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai') && x.p.municipioId !== aqui && idadePessoa(v, x.p) >= 68);
  return pais[0]?.p.nome;
}

/* ============================================================ Processamento */

/** O ano da vida profissional (depois do ano de trabalho): ritmo e clima. */
export function processarProfissao(v: Vida, r: Rng): void {
  processarRitmo(v);
  processarClima(v);
  void r;
  // O limite: anos de ritmo puxado, cabeça cheia — a vida pergunta (conteúdo `trab_limite`).
  const e = v.trabalho.atual;
  if (e && ritmoDe(e) === 'puxado' && (e.anosPuxado ?? 0) >= 3 && v.mente.estresse >= 60 && !temFato(v, `limite_${e.ocupacaoId}_${e.tInicio}`)) {
    marcarFato(v, `limite_${e.ocupacaoId}_${e.tInicio}`);
    v.fatos['trab_limite'] = v.t;
    abalar(v, 'o corpo que deu sinal', -4, 8);
  }
}

export { ocupacaoOuNula, ROTULO_TRILHA };

/* ======================================================= Comando e execução */


const ESPORTISTA = (v: Vida) => v.caminhos.esporte?.fase === 'profissional' && ['jogador_futebol', 'atleta'].includes(v.trabalho.atual?.ocupacaoId ?? '');

/** Quem poderia ser sócio: gente próxima, adulta, com renda. */
export function candidatoASocio(v: Vida): Pessoa | undefined {
  return vinculosVivos(v).filter(x => !x.p.especie && x.p.renda >= 3000 && idadePessoa(v, x.p) >= 25 && !x.vin.romance && (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo' || x.vin.parentesco === 'irmao' || x.vin.parentesco === 'primo' || x.vin.parentesco === 'tio'))
    .sort((a, b) => b.vin.confianca - a.vin.confianca)[0]?.p;
}

/** Quem pode receber a lida da terra: um filho adulto que mora perto. */
export function herdeiroDaTerra(v: Vida): Pessoa | undefined {
  return filhos(v).filter(f => f.vivo && idadePessoa(v, f) >= 18 && f.municipioId === v.moradia.municipioId && (f.renda < 4500)).sort((a, b) => idadePessoa(v, b) - idadePessoa(v, a))[0];
}

const custoCooperativa = (v: Vida) => Math.round(1500 * economiaLocal(v.moradia.municipioId).custo / 100) * 100;
const custoInvestirTerra = (v: Vida) => Math.round(18000 * economiaLocal(v.moradia.municipioId).custo / 1000) * 1000;
const custoLancar = (v: Vida) => Math.round(3500 * economiaLocal(v.moradia.municipioId).custo / 100) * 100;

export function disponibilidadeProfissao(v: Vida, a: AcaoProfissaoCmd): Veredito {
  const e = v.trabalho.atual;
  const modo = modoDoTrabalho(v);
  const n = negocioAtivo(v);
  const semTrabalho = bloqueio('impossivel', 'Não se aplica ao seu trabalho.');
  switch (a.oque) {
    case 'ritmo': return podeMudarRitmo(v, (a.valor as Ritmo) ?? 'normal');
    case 'promocao': {
      if (!e || !['empregado', 'saude', 'docente'].includes(modo) || e.contrato !== 'clt') return semTrabalho;
      if (!degrausAcima(ocupacao(e.ocupacaoId)).length) return bloqueio('impossivel', 'Não há cargo acima deste aqui.');
      if (v.t - (e.tPosto ?? e.tInicio) < 12) return bloqueio('requisito', 'Espere completar um ano no cargo.');
      if (v.fatos['promocao_conversa'] !== undefined && v.t - v.fatos['promocao_conversa'] < 24) return bloqueio('incompativel', 'Você conversou sobre isso há pouco tempo.');
      return PERMITIDO;
    }
    case 'estrutura': return podeInvestirEstrutura(v);
    case 'preco': return podeMudarPreco(v, (a.valor as 'baixo' | 'normal' | 'alto') ?? 'normal');
    case 'contratar': {
      if (!n) return semTrabalho;
      const t = n.porte ?? 1;
      if (tamanhoDaEquipe(n) >= ([0, 2, 4, 7][t] ?? 2) + Math.max(0, (n.unidades ?? 1) - 1) * 2) return bloqueio('requisito', 'Não cabe mais gente no tamanho que o negócio tem.');
      if (v.anoAtual.acoes.includes('contratou')) return bloqueio('incompativel', 'Você já contratou alguém neste ano.');
      return PERMITIDO;
    }
    case 'demitir': return n && n.equipe?.some(f => f.pessoaId === a.pessoaId) ? PERMITIDO : bloqueio('impossivel', 'Essa pessoa não trabalha para você.');
    case 'ampliar': return podeAmpliar(v);
    case 'unidade': return podeAbrirUnidade(v);
    case 'retirar': return n && (n.caixa ?? 0) - reservaDoCaixa(v, n) >= 1000 ? PERMITIDO : bloqueio('requisito', 'O caixa não tem sobra para tirar.');
    case 'estrategia': return n ? (v.fatos['negocio_estrategia'] !== undefined && v.t - v.fatos['negocio_estrategia'] < 24 ? bloqueio('incompativel', 'Você mudou o jeito de vender há pouco; espere o resultado.') : PERMITIDO) : semTrabalho;
    case 'socio': return n && !n.socioId ? PERMITIDO : bloqueio('impossivel', n ? 'O negócio já tem sócio.' : 'Não se aplica.');
    case 'vender': return n ? (v.fatos['neg_venda_recusada'] !== undefined && v.t - v.fatos['neg_venda_recusada'] < 12 ? bloqueio('incompativel', 'Quem queria comprar já foi embora; espere aparecer outro.') : PERMITIDO) : semTrabalho;
    case 'fechar': return n ? PERMITIDO : semTrabalho;
    case 'foco': return ESPORTISTA(v) ? ((v.caminhos.esporte!.foco ?? 'normal') === (a.valor ?? 'normal') ? bloqueio('impossivel', 'Já treina assim.') : PERMITIDO) : semTrabalho;
    case 'treinador': return ESPORTISTA(v) ? (v.anoAtual.acoes.includes('treinador') ? bloqueio('incompativel', 'Você já conversou com o treinador neste ano.') : PERMITIDO) : semTrabalho;
    case 'mercado': return ESPORTISTA(v) ? (v.anoAtual.acoes.includes('mercado') ? bloqueio('incompativel', 'O empresário já está procurando.') : PERMITIDO) : semTrabalho;
    case 'pendurar': return ESPORTISTA(v) ? PERMITIDO : semTrabalho;
    case 'pos_carreira': return ESPORTISTA(v) && !temFato(v, 'pos_carreira') ? PERMITIDO : semTrabalho;
    case 'movimentacao': {
      const m = v.caminhos.militar;
      if (modo !== 'militar' || !m) return semTrabalho;
      if (v.fatos['mil_pedido_destino'] !== undefined) return bloqueio('incompativel', 'Já há um pedido de movimentação esperando.');
      const alvo = alvoDaMovimentacao(v);
      if (!alvo) return bloqueio('requisito', 'Não há unidade da Força perto de quem você quer estar.');
      return PERMITIDO;
    }
    case 'remocao': {
      if (!e || e.contrato !== 'servidor') return semTrabalho;
      if (e.empregador === 'a prefeitura' || /municipal/.test(e.empregador)) return bloqueio('impossivel', 'Servidor da prefeitura não tem para onde ser removido: outra cidade é outro concurso.');
      if (v.t - e.tInicio < 36) return bloqueio('requisito', 'Remoção a pedido, só depois do estágio probatório.');
      if (v.fatos['remocao_negada'] !== undefined && v.t - v.fatos['remocao_negada'] < 24) return bloqueio('incompativel', 'O próximo edital de remoção ainda não abriu.');
      return PERMITIDO;
    }
    case 'cooperativa': {
      const ru = v.caminhos.rural;
      if (modo !== 'rural' || !ru) return semTrabalho;
      if (ru.cooperativa) return bloqueio('impossivel', 'Já é cooperado.');
      return disponivel(v) >= custoCooperativa(v) ? PERMITIDO : bloqueio('requisito', `A cota de entrada é de uns ${fmt(custoCooperativa(v))}.`);
    }
    case 'investir_terra': {
      const ru = v.caminhos.rural;
      if (modo !== 'rural' || !ru) return semTrabalho;
      if (a.valor === 'terra') return ru.terra === 'arrendada' ? PERMITIDO : bloqueio('impossivel', 'A terra já não é arrendada.');
      if ((e!.estrutura ?? 0) >= 2) return bloqueio('impossivel', 'Já investiu o que a terra comporta.');
      if (v.financas.negativado) return bloqueio('requisito', 'Com o nome sujo, não há crédito rural.');
      if (v.anoAtual.acoes.includes('investir_terra')) return bloqueio('incompativel', 'Já pediu crédito neste ano.');
      return limiteDeCredito(v) * 4 >= custoInvestirTerra(v) ? PERMITIDO : bloqueio('requisito', 'O banco não libera tanto para a renda que a terra dá.');
    }
    case 'diversificar': {
      const ru = v.caminhos.rural;
      if (modo !== 'rural' || !ru) return semTrabalho;
      return ru.cultura === 'misto' ? bloqueio('impossivel', 'A produção já é diversificada.') : PERMITIDO;
    }
    case 'sucessao': return modo === 'rural' && idade(v) >= 50 ? PERMITIDO : semTrabalho;
    case 'lancar': {
      if (!(modo === 'artista' || v.caminhos.arte?.ativo)) return semTrabalho;
      if (v.fatos['arte_lancou'] !== undefined && v.t - v.fatos['arte_lancou'] < 24) return bloqueio('incompativel', 'O último trabalho saiu há pouco; o próximo leva tempo.');
      return disponivel(v) >= custoLancar(v) ? PERMITIDO : bloqueio('requisito', `Gravar, imprimir, montar: uns ${fmt(custoLancar(v))}.`);
    }
    case 'estrada': {
      if (!(modo === 'artista' || v.caminhos.arte?.ativo)) return semTrabalho;
      if (publicoDoArtista(v) < 25) return bloqueio('requisito', 'Ainda falta público para uma turnê pagar.');
      if (v.fatos['arte_estrada'] !== undefined && v.t - v.fatos['arte_estrada'] < 24) return bloqueio('incompativel', 'A última turnê foi há pouco.');
      return PERMITIDO;
    }
  }
  return semTrabalho;
}

const publicoDoArtista = (v: Vida) => (v.caminhos.arte?.ativo ? v.caminhos.arte.publico : v.trabalho.atual?.clientela ?? 0);

/** Para onde pedir movimentação: a guarnição da Força perto de quem importa. */
export function alvoDaMovimentacao(v: Vida): string | undefined {
  const m = v.caminhos.militar;
  if (!m) return undefined;
  const par = parceiro(v);
  const pessoas = [par?.p, ...vinculosVivos(v).filter(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai') && idadePessoa(v, x.p) >= 60).map(x => x.p)].filter((p): p is Pessoa => !!p && p.municipioId !== m.guarnicao);
  for (const p of pessoas) { const g = guarnicaoPerto(m.forca, p.municipioId); if (g && g !== m.guarnicao) return g; }
  return undefined;
}

export interface SaidaProfissao { texto?: string; tom?: 'bom' | 'ruim' | 'neutro'; decisao?: string; papeis?: Record<string, string> }

export function executarProfissao(v: Vida, r: Rng, a: AcaoProfissaoCmd): SaidaProfissao {
  const e = v.trabalho.atual;
  switch (a.oque) {
    case 'ritmo': {
      const alvo = (a.valor as Ritmo) ?? 'normal';
      const familia = pequenosEmCasa(v) || (!!parceiro(v)?.vin.convivio.includes('casa'));
      // Puxar o ritmo com criança pequena em casa, ou aliviar por ela, diz algo sobre o que vem primeiro.
      if (alvo === 'puxado' && pequenosEmCasa(v)) aplicarPersonalidade(v, 'acao:ritmo_puxado', { familia: -1 });
      if (alvo === 'leve' && familia) aplicarPersonalidade(v, 'acao:ritmo_leve', { familia: 1 });
      return { texto: mudarRitmo(v, alvo), tom: 'neutro' };
    }
    case 'promocao': v.fatos['promocao_conversa'] = v.t; return { decisao: 'trab_promocao' };
    case 'estrutura': return { texto: investirEstrutura(v), tom: 'bom' };
    case 'preco': return { texto: mudarPreco(v, (a.valor as 'baixo' | 'normal' | 'alto') ?? 'normal') };
    case 'contratar': { v.anoAtual.acoes.push('contratou'); const amigo = candidatoASocio(v); return { decisao: 'neg_contratar', papeis: amigo ? { amigo: amigo.id } : {} }; }
    case 'demitir': return { decisao: 'neg_demitir', papeis: { funcionario: a.pessoaId! } };
    case 'ampliar': aplicarPersonalidade(v, 'acao:ampliar', { coragem: 1 }); ampliar(v); return { texto: 'O negócio cresceu. A conta também — agora é encher a casa.', tom: 'bom' };
    case 'unidade': aplicarPersonalidade(v, 'acao:unidade', { coragem: 1 }); abrirUnidade(v); return { texto: 'Outra porta aberta, outra folha de pagamento.', tom: 'bom' };
    case 'retirar': { const x = retirarDoCaixa(v); return { texto: `${fmt(x)} saíram do caixa para a sua conta.`, tom: 'bom' }; }
    case 'estrategia': return { decisao: 'neg_estrategia' };
    case 'socio': { const s = candidatoASocio(v); return { decisao: 'neg_socio', papeis: s ? { socio: s.id } : {} }; }
    case 'vender': return { decisao: 'neg_vender' };
    case 'fechar': return { decisao: 'neg_fechar' };
    case 'foco': {
      const es = v.caminhos.esporte!;
      es.foco = a.valor === 'forcar' || a.valor === 'preservar' ? a.valor : undefined;
      if (a.valor === 'preservar' && es.lesoes >= 1) aplicarPersonalidade(v, 'acao:preservar_corpo', { disciplina: 1 });
      return { texto: a.valor === 'forcar' ? 'Treino dobrado: evolui mais, machuca mais.' : a.valor === 'preservar' ? 'Treino com cuidado: o corpo agradece, a evolução desacelera.' : 'De volta ao treino de sempre.' };
    }
    case 'treinador': v.anoAtual.acoes.push('treinador'); return { decisao: 'esp_treinador' };
    case 'mercado': v.anoAtual.acoes.push('mercado'); return { decisao: 'esp_mercado' };
    case 'pendurar': return { decisao: 'esp_pendurar' };
    case 'pos_carreira': return { decisao: 'esp_pos' };
    case 'movimentacao': { const alvo = alvoDaMovimentacao(v); if (alvo) v.fatos['mil_pedido_alvo'] = indiceDaGuarnicao(alvo); return { decisao: 'mil_movimentacao' }; }
    case 'remocao': return { decisao: 'pub_remocao' };
    case 'cooperativa': {
      pagar(v, custoCooperativa(v));
      v.caminhos.rural!.cooperativa = true;
      escrever(v, { texto: 'Entrou para a cooperativa: cota paga, assembleia no primeiro sábado do mês.', relevancia: 'biografia', tema: 'trabalho', escolha: true });
      aplicarPersonalidade(v, 'acao:cooperativa', { sociabilidade: 1 });
      return { texto: 'Cooperado: vender junto, comprar junto, perder menos no ano ruim.', tom: 'bom' };
    }
    case 'investir_terra': {
      if (a.valor === 'terra') return { decisao: 'rural_comprar' };
      const valor = custoInvestirTerra(v);
      const j = 0.005;
      v.financas.dividas.push({ id: `d${v.seq++}`, tipo: 'emprestimo', saldo: valor, jurosMes: j, parcela: Math.round(parcelaPrice(valor, j, 72)), descricao: 'Crédito rural: equipamento e irrigação', tInicio: v.t, prazo: 72 });
      v.anoAtual.acoes.push('investir_terra');
      e!.estrutura = (e!.estrutura ?? 0) + 1;
      e!.clientela = clamp((e!.clientela ?? 20) + 8);
      escrever(v, { texto: `Pegou ${fmt(valor)} de crédito rural para investir na terra: equipamento e irrigação, pagos com a safra.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
      return { texto: 'A dívida é de seis anos; a produção deve responder já na próxima safra.', tom: 'bom' };
    }
    case 'diversificar': {
      const ru = v.caminhos.rural!;
      ru.cultura = 'misto';
      e!.clientela = clamp((e!.clientela ?? 20) - 4);
      escrever(v, { texto: 'Diversificou a produção: um pouco de roça, criação, horta. O primeiro ano rende menos; o ano ruim, também dói menos.', relevancia: 'biografia', tema: 'trabalho', escolha: true });
      aplicarPersonalidade(v, 'acao:diversificar', { disciplina: 1 });
      return { texto: 'Menos aposta num único ano.' };
    }
    case 'sucessao': { const f = herdeiroDaTerra(v); return { decisao: 'rural_sucessao', papeis: f ? { filho: f.id } : {} }; }
    case 'lancar': {
      const custo = custoLancar(v);
      pagar(v, custo);
      v.fatos['arte_lancou'] = v.t;
      const p = v.caminhos.arte;
      const deu = r.chance(0.5 + publicoDoArtista(v) / 200);
      if (p?.ativo) p.publico = clamp(p.publico + (deu ? 12 : 4));
      if (e?.clientela !== undefined && modoDoTrabalho(v) === 'artista') e.clientela = clamp(e.clientela + (deu ? 8 : 2));
      const nome = p?.ativo ? p.nome : 'o trabalho novo';
      const texto = deu ? `Lançou ${p?.linguagem === 'musica' || !p ? 'um trabalho novo' : 'um espetáculo novo'}${p?.ativo ? ` com ${p.nome}` : ''}: saiu na rádio da cidade, gente de fora comentou.` : `Lançou ${p?.linguagem === 'musica' || !p ? 'um trabalho novo' : 'um espetáculo novo'}${p?.ativo ? ` com ${p.nome}` : ''}. Quem conhecia gostou; o resto nem ficou sabendo.`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: deu ? 'bom' : undefined, escolha: true });
      if (deu) marcar(v, 'conquista', texto, 2);
      void nome;
      return { texto: deu ? 'O trabalho pegou.' : 'Saiu. Pouca gente viu — por enquanto.', tom: deu ? 'bom' : 'neutro' };
    }
    case 'estrada': v.fatos['arte_estrada'] = v.t; return { decisao: 'arte_estrada' };
  }
    return {};
}

const pequenosEmCasa = (v: Vida) => filhos(v).some(f => v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(v, f) < 6);
