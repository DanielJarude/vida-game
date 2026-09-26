/**
 * Cuidar de si: o que a pessoa pode fazer quando a cabeça, o humor ou o
 * corpo pedem. Nada aqui é "+10 cabeça": descansar dá um respiro e o que
 * pesava continua lá; o médico trata o que dá para tratar e diz o que o
 * corpo está cobrando; parar de fumar pode não dar certo na primeira vez.
 *
 * `sugestoes` lê as causas (`estado.ts`) e oferece o cuidado que faz
 * sentido para ELAS — sobrecarga pede tirar algo da semana, luto pede
 * gente por perto, sedentarismo pede movimento — em vez de um cardápio fixo.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Vida } from '../tipos';
import type { Acao } from '../acoes';
import { escrever, idade, marcarFato } from '../nucleo';
import { bloqueio, PERMITIDO, podeTentar, type Veredito } from '../plausibilidade';
import { aplicarPersonalidade } from '../personalidade';
import { abalar } from './abalo';
import { apoios, fatoresCabeca, fatoresHumor, fatoresSaude, sobrecargaDaSemana } from './estado';
import { modeloCondicao } from './corpo';
import { modeloRotina, podeComecarRotina } from './rotinas';
import { semana } from './semana';
import { interacoesPara } from './interacoes';
import { listaNatural } from '../texto';
import { vereditoDePagar } from './dinheiro';

export type TipoCuidado = 'descansar' | 'consulta' | 'parar_fumar' | 'beber_menos';

const feito = (v: Vida, c: TipoCuidado) => v.anoAtual.acoes.includes(`cuidar:${c}`);

/* ------------------------------------------------------- Disponibilidade */

export function disponibilidadeCuidado(v: Vida, c: TipoCuidado): Veredito {
  const i = idade(v);
  if (feito(v, c)) return bloqueio('incompativel', c === 'consulta' ? 'Você já foi ao médico este ano.' : 'Já tentou isso este ano.');
  switch (c) {
    case 'descansar': {
      if (i < 14) return bloqueio('impossivel', 'Criança descansa quando a casa deixa.');
      const e = v.trabalho.atual;
      if (e && (e.contrato === 'autonomo' || e.contrato === 'informal')) {
        const custo = custoDescanso(v);
        if (v.financas.conta < custo) return vereditoDePagar(v, custo, 'Parar uns dias por conta própria custa o que se deixa de ganhar: uns');
      }
      return PERMITIDO;
    }
    case 'consulta':
      if (i < 14) return bloqueio('impossivel', 'Quem leva ao médico são os adultos da casa.');
      return PERMITIDO;
    case 'parar_fumar':
      return v.corpo.habitos.fuma ? PERMITIDO : bloqueio('impossivel', 'Você não fuma.');
    case 'beber_menos':
      return v.corpo.habitos.bebe === 'muito' ? PERMITIDO : bloqueio('impossivel', 'A bebida não é um problema agora.');
  }
}

function custoDescanso(v: Vida): number {
  const e = v.trabalho.atual;
  return e ? Math.round(e.salario * 0.25 / 10) * 10 : 0;
}

/* --------------------------------------------------------------- Execução */

export interface SaidaCuidado { resultado?: string; decisao?: 'sau_tratamento' }

export function executarCuidado(v: Vida, r: Rng, c: TipoCuidado): SaidaCuidado {
  v.anoAtual.acoes.push(`cuidar:${c}`);
  switch (c) {
    case 'descansar': return descansar(v, r);
    case 'consulta': return consulta(v, r);
    case 'parar_fumar': return pararDeFumar(v, r);
    case 'beber_menos': return beberMenos(v, r);
  }
}

function descansar(v: Vida, r: Rng): SaidaCuidado {
  const e = v.trabalho.atual;
  const custo = e && (e.contrato === 'autonomo' || e.contrato === 'informal') ? custoDescanso(v) : 0;
  v.financas.conta -= custo;
  const pesos = fatoresCabeca(v).filter(f => f.efeito >= 6).sort((a, b) => b.efeito - a.efeito);
  abalar(v, 'os dias de descanso', 3, -10);
  const lugar = r.pick(e ? ['Uns dias de férias sem despertador.', 'Uma semana longe do trabalho, de celular desligado.', 'Dias de folga, praia ou sofá — tanto faz: longe da rotina.'] : ['Uns dias sem compromisso nenhum.', 'Uma semana dormindo cedo e acordando sem pressa.']);
  const resto = pesos.length ? ` Voltou mais leve — mas ${pesos[0].texto} continua lá.` : ' Voltou mais leve.';
  escrever(v, { texto: e ? 'Tirou uns dias de descanso.' : 'Parou uns dias para descansar.', relevancia: 'tecnico', tema: 'saude', escolha: true });
  return { resultado: lugar + resto };
}

function consulta(v: Vida, r: Rng): SaidaCuidado {
  const i = idade(v);
  const semTratar = v.corpo.condicoes.find(x => x.cronica && !x.tratando);
  if (semTratar && i >= 18) {
    if (v.processos.some(p => p.tipo === 'tratamento')) return { resultado: `O médico olhou o encaminhamento: a fila do SUS para ${semTratar.nome} continua andando. Mandou não parar de se cuidar enquanto isso.` };
    return { decisao: 'sau_tratamento' };
  }
  // Um check-up pega cedo o que o corpo ainda não mostrou.
  const riscos: { id: 'hipertensao' | 'diabetes'; chance: number }[] = [];
  const hip = modeloCondicao('hipertensao');
  const dia = modeloCondicao('diabetes');
  if (hip && !v.corpo.condicoes.some(x => x.id === 'hipertensao')) riscos.push({ id: 'hipertensao', chance: Math.min(0.35, hip.risco(v, i) * 3) });
  if (dia && !v.corpo.condicoes.some(x => x.id === 'diabetes')) riscos.push({ id: 'diabetes', chance: Math.min(0.25, dia.risco(v, i) * 3) });
  for (const x of riscos) {
    if (r.chance(x.chance)) {
      const m = modeloCondicao(x.id)!;
      v.corpo.condicoes.push({ id: m.id, nome: m.nome, tInicio: v.t, cronica: true, gravidade: m.gravidade, tratando: true });
      v.fatos[`teve_${m.id}`] = (v.fatos[`teve_${m.id}`] ?? 0) + 1;
      escrever(v, { texto: `Um check-up pegou cedo: ${m.nome}. O tratamento começou antes de o corpo reclamar.`, relevancia: 'biografia', tema: 'saude', tom: 'neutro', escolha: true });
      return { resultado: `O exame pegou ${m.nome} ainda no começo. Remédio desde já — é bem melhor descobrir assim do que por um susto.` };
    }
  }
  const contra = fatoresSaude(v).filter(f => f.efeito <= -0.5 && f.id !== 'idade').sort((a, b) => a.efeito - b.efeito).slice(0, 2);
  const tratando = v.corpo.condicoes.filter(x => x.tratando);
  if (contra.length) return { resultado: `Os exames não mostraram nada novo. O médico foi direto sobre o resto: ${listaNatural(contra.map(f => f.texto))}. Disse que isso pesa mais com os anos.` };
  if (tratando.length) return { resultado: `Acompanhamento em dia: ${listaNatural(tratando.map(x => x.nome))} sob controle. O médico pediu para não largar o remédio.` };
  return { resultado: i < 30 ? 'Exames em ordem. O médico disse que, nessa idade, o melhor remédio é não parar de se mexer.' : 'Exames em ordem. O médico disse para continuar assim e voltar no ano que vem.' };
}

function pararDeFumar(v: Vida, r: Rng): SaidaCuidado {
  const tentativas = v.fatos['tentou_parar_fumar'] ?? 0;
  v.fatos['tentou_parar_fumar'] = tentativas + 1;
  const chance = clamp(0.25 + v.personalidade.tracos.disciplina / 250 - (v.mente.estresse > 55 ? 0.12 : 0) + Math.min(0.15, tentativas * 0.05), 0.08, 0.6);
  aplicarPersonalidade(v, 'acao:parar_fumar', { disciplina: 1 });
  if (r.chance(chance)) {
    v.corpo.habitos.fuma = false;
    marcarFato(v, 'parou_de_fumar');
    escrever(v, { texto: tentativas ? `Parou de fumar, na ${tentativas + 1}ª tentativa.` : 'Parou de fumar.', relevancia: 'marco', tema: 'saude', tom: 'bom', escolha: true });
    return { resultado: 'Os primeiros meses foram de chiclete, irritação e vontade na hora do café. Depois, foi passando.' };
  }
  abalar(v, 'a tentativa de parar de fumar', -2, 4);
  escrever(v, { texto: 'Tentou parar de fumar e não conseguiu.', relevancia: 'cotidiano', tema: 'saude', tom: 'ruim', escolha: true });
  return { resultado: v.mente.estresse > 55 ? 'Durou três semanas. Com a cabeça cheia do jeito que está, a primeira sexta difícil derrubou.' : 'Durou um mês. Voltou numa festa. Quem para, quase sempre tenta mais de uma vez.' };
}

function beberMenos(v: Vida, r: Rng): SaidaCuidado {
  const tentativas = v.fatos['tentou_beber_menos'] ?? 0;
  v.fatos['tentou_beber_menos'] = tentativas + 1;
  const chance = clamp(0.3 + v.personalidade.tracos.disciplina / 250 - (v.mente.estresse > 55 ? 0.12 : 0) - (v.rotinas.some(x => x.id === 'sair_noite') ? 0.15 : 0) + Math.min(0.15, tentativas * 0.05), 0.08, 0.6);
  aplicarPersonalidade(v, 'acao:beber_menos', { disciplina: 1 });
  if (r.chance(chance)) {
    v.corpo.habitos.bebe = 'social';
    escrever(v, { texto: 'Diminuiu a bebida: agora é só de vez em quando.', relevancia: 'biografia', tema: 'saude', tom: 'bom', escolha: true });
    return { resultado: 'As primeiras semanas foram estranhas. Depois, a cabeça clareou de manhã.' };
  }
  abalar(v, 'a tentativa de beber menos', -2, 3);
  return { resultado: v.rotinas.some(x => x.id === 'sair_noite') ? 'Com as saídas de toda semana, não segurou. O copo voltou na primeira sexta.' : 'Segurou por um tempo. Voltou devagar, sem perceber.' };
}

/* ---------------------------------------------------------------- Sugestões */

export interface Sugestao {
  id: string;
  /** O que fazer, em palavras (rótulo do botão). */
  texto: string;
  /** Por que isso, agora (uma frase curta). */
  motivo?: string;
  /** Ação direta (quando existe). */
  acao?: Acao;
  /** Ou: abrir a ficha de alguém. */
  pessoaId?: string;
  /** Ou: ir para outra área. */
  aba?: 'tempo' | 'estudos' | 'pessoas' | 'casa' | 'trabalho';
}

const pode = (v: Vida, a: Acao, disp: (v: Vida, a: Acao) => Veredito) => podeTentar(disp(v, a));

/**
 * Os cuidados que fazem sentido agora para uma dimensão, a partir do que a
 * está pesando. Recebe a disponibilidade (de `acoes`) para não oferecer o
 * que não dá para fazer.
 */
export function sugestoes(v: Vida, d: 'humor' | 'cabeca' | 'saude', disp: (v: Vida, a: Acao) => Veredito): Sugestao[] {
  const i = idade(v);
  const out: Sugestao[] = [];
  if (i < 12) return out;
  const junto = (a: Acao) => pode(v, a, disp);

  if (d === 'cabeca') {
    const f = fatoresCabeca(v);
    const pesa = (id: string) => f.some(x => x.id === id && x.efeito > 0);
    if (v.mente.estresse < 35 && !f.some(x => x.efeito >= 10)) return out;
    if (pesa('horas_extras') && junto({ tipo: 'horas_extras', parar: true })) out.push({ id: 'sem_horas_extras', texto: 'Desistir das horas extras deste ano', motivo: 'Elas pesam mais do que parece.', acao: { tipo: 'horas_extras', parar: true } });
    const s = sobrecargaDaSemana(v);
    if (s.fixos > 0.01 || s.atividades > 0.01) {
      const pesada = [...semana(v).rotinas].sort((a, b) => b.peso - a.peso)[0];
      out.push({ id: 'aliviar_semana', texto: 'Aliviar a semana', motivo: pesada ? `A semana tem mais do que cabe — ${pesada.rotulo.replace(/ — .*/, '').toLowerCase()} é o que dá para mexer.` : 'A semana tem mais do que cabe.', aba: 'tempo' });
    }
    // Quando é o dinheiro que pesa, o cuidado é olhar para ele (renegociar, cortar, vender).
    if (pesa('dividas') || pesa('aperto')) out.push({ id: 'dinheiro', texto: pesa('dividas') ? 'Encarar as dívidas: renegociar, cortar, vender' : 'Rever o padrão de vida', motivo: 'O que pesa aqui tem nome e número.', aba: 'casa' });
    if (pesa('casa_pequena')) out.push({ id: 'casa_maior', texto: 'Procurar uma casa que caiba a família', aba: 'casa' });
    if (pesa('carro_parado')) out.push({ id: 'oficina', texto: 'Resolver o carro parado', aba: 'casa' });
    if (junto({ tipo: 'cuidar', cuidado: 'descansar' })) out.push({ id: 'descansar', texto: 'Tirar uns dias de descanso', motivo: v.trabalho.atual ? 'Um respiro não resolve a causa, mas ajuda a atravessar.' : undefined, acao: { tipo: 'cuidar', cuidado: 'descansar' } });
    const quem = desabafo(v);
    if (quem) out.push({ id: 'desabafar', texto: `Desabafar com ${quem.nome}`, motivo: 'Falar do que pesa, com quem escuta.', acao: { tipo: 'pessoa', pessoaId: quem.id, interacao: 'desabafar' } });
    if ((v.mente.estresse >= 55 || v.corpo.condicoes.some(c => c.id === 'ansiedade' || c.id === 'depressao')) && !v.rotinas.some(x => x.id === 'terapia')) {
      const a: Acao = { tipo: 'rotina', id: 'terapia', ativa: true, nivel: 1 };
      out.push({ id: 'terapia', texto: 'Procurar terapia', motivo: 'Quando a pressão dura, ajuda ter alguém de fora.', acao: a });
    }
    const possiveis = out.filter(x => !x.acao || junto(x.acao));
    // Nunca sem saída: se nada direto cabe agora, sobra procurar alguém.
    if (!possiveis.length) possiveis.push({ id: 'procurar', texto: 'Procurar alguém para conversar', motivo: 'Às vezes começa por uma mensagem.', aba: 'pessoas' });
    return possiveis.slice(0, 3);
  }

  if (d === 'humor') {
    const f = fatoresHumor(v);
    if (v.mente.felicidade >= 62 && !f.some(x => x.efeito <= -8)) return out;
    const luto = f.find(x => x.id === 'luto');
    const quem = desabafo(v) ?? apoios(v)[0]?.p;
    if (luto) {
      const junto2 = Object.values(v.pessoas).find(p => p.vivo && p.aperto?.tipo === 'luto' && v.vinculos[p.id] && v.t - p.aperto.t <= 24);
      if (junto2) out.push({ id: 'luto_junto', texto: `Estar com ${junto2.nome}, que também sente a falta`, motivo: 'O luto não tem atalho. Atravessar junto ajuda.', pessoaId: junto2.id });
    }
    if (quem) {
      const acoesDela = interacoesPara(v, quem.id).map(x => x.id);
      const id = acoesDela.includes('sair_juntos') ? 'sair_juntos' : acoesDela.includes('tempo') ? 'tempo' : acoesDela.includes('visitar') ? 'visitar' : acoesDela.includes('ligar') ? 'ligar' : undefined;
      if (id && junto({ tipo: 'pessoa', pessoaId: quem.id, interacao: id })) out.push({ id: 'tempo_com', texto: `Passar um tempo com ${quem.nome}`, acao: { tipo: 'pessoa', pessoaId: quem.id, interacao: id } });
    }
    const antiga = hobbyAntigo(v);
    if (antiga) out.push({ id: 'retomar', texto: `Voltar a ${antiga.verbo}`, motivo: 'Uma coisa que você gostava de fazer.', acao: { tipo: 'rotina', id: antiga.id, ativa: true, nivel: 1 } });
    if (f.some(x => x.id === 'sem_trabalho')) out.push({ id: 'trabalho', texto: 'Procurar trabalho', motivo: 'Estar parado pesa no dia a dia.', aba: 'trabalho' });
    if (f.some(x => x.id === 'solidao')) {
      const social = ['voluntariado', 'igreja', 'futebol', 'danca'].find(id => podeComecarRotina(v, id).grau === 'permitido');
      if (social) out.push({ id: 'gente', texto: `Começar: ${modeloRotina(social)!.nome.toLowerCase()}`, motivo: 'Lugar com gente toda semana.', acao: { tipo: 'rotina', id: social, ativa: true, nivel: 1 } });
      else out.push({ id: 'gente', texto: 'Procurar alguém de antes', aba: 'pessoas' });
    }
    // Se a cabeça também pesa, o descanso já aparece lá (não duplica).
    if (v.mente.estresse < 35 && junto({ tipo: 'cuidar', cuidado: 'descansar' }) && out.length < 2) out.push({ id: 'descansar', texto: 'Tirar uns dias para você', acao: { tipo: 'cuidar', cuidado: 'descansar' } });
    const possiveis = out.filter(x => !x.acao || junto(x.acao));
    if (!possiveis.length) possiveis.push({ id: 'procurar', texto: 'Procurar alguém de antes', motivo: 'Gente por perto é o que mais segura o humor.', aba: 'pessoas' });
    return possiveis.slice(0, 3);
  }

  // Saúde
  const f = fatoresSaude(v);
  const pesa = (id: string) => f.some(x => x.id === id && x.efeito < 0);
  const semTratar = v.corpo.condicoes.some(x => x.cronica && !x.tratando);
  if (v.corpo.saude >= 80 && !semTratar && !pesa('fuma') && !pesa('bebe') && !(pesa('forma') && i >= 30)) return out;
  if (junto({ tipo: 'cuidar', cuidado: 'consulta' })) out.push({ id: 'consulta', texto: semTratar ? 'Ir ao médico tratar' : 'Ir ao médico, fazer um check-up', motivo: semTratar ? 'Tem uma condição sem tratamento.' : undefined, acao: { tipo: 'cuidar', cuidado: 'consulta' } });
  if (pesa('fuma') && junto({ tipo: 'cuidar', cuidado: 'parar_fumar' })) out.push({ id: 'parar_fumar', texto: 'Tentar parar de fumar', acao: { tipo: 'cuidar', cuidado: 'parar_fumar' } });
  if (pesa('bebe') && junto({ tipo: 'cuidar', cuidado: 'beber_menos' })) out.push({ id: 'beber_menos', texto: 'Tentar beber menos', acao: { tipo: 'cuidar', cuidado: 'beber_menos' } });
  if (pesa('forma') && i >= 14) {
    const mov = (['corrida', 'academia', 'futebol', 'danca'] as const).find(id => !v.rotinas.some(x => x.id === id) && podeComecarRotina(v, id).grau === 'permitido');
    if (mov) out.push({ id: 'mexer', texto: `Começar: ${modeloRotina(mov)!.nome.toLowerCase()}`, motivo: 'O corpo parado é o que mais pesa na saúde depois da idade.', acao: { tipo: 'rotina', id: mov, ativa: true, nivel: 1 } });
    else out.push({ id: 'mexer', texto: 'Arrumar espaço na semana para se mexer', aba: 'tempo' });
  }
  return out.slice(0, 3);
}

/** Com quem dá para desabafar agora (a pessoa com quem a interação existe). */
export function desabafo(v: Vida) {
  for (const a of apoios(v)) {
    if (interacoesPara(v, a.p.id).some(x => x.id === 'desabafar')) return a.p;
  }
  return undefined;
}

const VERBO: Partial<Record<Dominio, string>> = { musica: 'tocar', futebol: 'jogar bola', volei: 'jogar vôlei', teatro: 'fazer teatro', danca: 'dançar', desenho: 'desenhar', escrita: 'escrever', natacao: 'nadar', lutas: 'treinar luta', xadrez: 'jogar xadrez', fotografia: 'fotografar', cozinha: 'cozinhar' };
const ROTINA_DA_FRENTE: Partial<Record<Dominio, string>> = { escrita: 'escrever', cozinha: 'cozinhar' };

/** Uma coisa que a pessoa fazia bem e parou (para "voltar a..."). */
function hobbyAntigo(v: Vida): { id: string; verbo: string } | undefined {
  const lista = (Object.entries(v.caminhos.frentes) as [Dominio, NonNullable<Vida['caminhos']['frentes'][Dominio]>][])
    .filter(([d, f]) => VERBO[d] && f.auge >= 30 && v.t - f.tUltimo >= 24)
    .sort((a, b) => b[1].auge - a[1].auge);
  for (const [d] of lista) {
    const id = ROTINA_DA_FRENTE[d] ?? d;
    if (!v.rotinas.some(x => x.id === id) && podeComecarRotina(v, id).grau === 'permitido') return { id, verbo: VERBO[d]! };
  }
  return undefined;
}

