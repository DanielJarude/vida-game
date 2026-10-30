/**
 * REWORK 12.3 · C3 — AS PESSOAS DO PROCESSO. Antes, o juiz era um número (a chance de absolvição). Agora quem julga, quem
 * acusa e quem defende têm nome, comarca, rigor, integridade e história com você: na mesma cidade, o mesmo juiz pode
 * voltar num processo anos depois — e lembrar.
 *
 *   COMARCA     cada cidade tem poucas varas (dois a quatro juízes, dois ou três promotores). O processo cai numa delas.
 *   INTEGRIDADE quase todo mundo é íntegro (a maioria entre 70 e 98). Uma minoria pequena é vulnerável — ninguém "é
 *               corrupto": é alguém que, numa circunstância, pode aceitar. Não depende do país (não há ranking de países):
 *               é um parâmetro de jogo sorteado pela comarca e pela pessoa.
 *   RIGOR       o juiz que pesa a mão, o promotor que não larga: muda pouco a sentença e o acordo, nunca decide sozinho.
 *
 * Nada aqui é procedimento: são pessoas com história.
 */
import { clamp, rngDe } from '../rng';
import type { AtorJudicial, Genero, Vida } from '../tipos';
import { sortearNome, sortearSobrenome } from '../dados/nomes';
import { paisDaVida } from '../mundo/vida';
import { anoDe } from '../tempo';

export type PapelJudicial = AtorJudicial['papel'];
const QUANTOS: Record<PapelJudicial, number> = { juiz: 3, promotor: 2, advogado: 4, defensor: 2 };

const tratamento = (a: AtorJudicial) => (a.papel === 'juiz' ? (a.genero === 'feminino' ? 'a juíza' : 'o juiz') : a.papel === 'promotor' ? (a.genero === 'feminino' ? 'a promotora' : 'o promotor') : a.papel === 'defensor' ? (a.genero === 'feminino' ? 'a defensora' : 'o defensor') : (a.genero === 'feminino' ? 'a advogada' : 'o advogado'));
/** "a juíza Helena Prado" */
export const quemE = (a: AtorJudicial) => `${tratamento(a)} ${a.nome}`;
export const atores = (v: Vida) => v.justica?.atores ?? {};
export const ator = (v: Vida, id?: string) => (id ? v.justica?.atores?.[id] : undefined);

/** A pessoa de cada vaga da comarca: sempre a mesma para a mesma cidade e posição (a semente é da cidade, não da vida). */
function daVaga(v: Vida, papel: PapelJudicial, municipioId: string, k: number): AtorJudicial {
  const r = rngDe('comarca', municipioId, papel, k);
  const genero: Genero = r.chance(0.5) ? 'feminino' : 'masculino';
  const pais = paisDaVida(v);
  const nasc = anoDe(v.t) - r.int(32, 62);
  const sobrenome = sortearSobrenome(r, pais);
  const nome = `${sortearNome(r, genero, nasc, pais, undefined, sobrenome)} ${sobrenome}`;
  // A cultura da comarca (só da cidade) desloca pouco; a pessoa decide o resto. A minoria vulnerável existe em toda parte.
  const comarca = rngDe('comarca', municipioId, 'cultura').next() * 10 - 5;
  const vulneravel = r.chance(papel === 'juiz' ? 0.1 : papel === 'promotor' ? 0.08 : 0.15);
  const integridade = clamp(Math.round((vulneravel ? r.int(25, 55) : r.int(70, 98)) + comarca));
  return { id: `jud_${municipioId}_${papel}_${k}`, nome, genero, papel, municipioId, integridade, rigor: r.int(25, 85), tDesde: v.t, processos: 0, historia: [] };
}

/**
 * Quem cai no seu processo: uma das vagas da comarca (quem já cuidou de um processo seu volta com mais chance — a mesma
 * vara). Quem foi afastado não volta: a vaga tem outra pessoa (`k` seguinte).
 */
export function designar(v: Vida, papel: PapelJudicial, municipioId = v.moradia.municipioId, semente = ''): AtorJudicial {
  const j = v.justica!;
  const lista = (j.atores ??= {});
  const r = rngDe(v.id, 'designar', papel, municipioId, v.t, semente);
  const conhecidos = Object.values(lista).filter(a => a.papel === papel && a.municipioId === municipioId && a.afastado === undefined);
  if (conhecidos.length && r.chance(papel === 'advogado' ? 0.75 : 0.45)) {
    const a = r.pick(conhecidos);
    a.processos++;
    return a;
  }
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    const k = r.int(0, QUANTOS[papel] - 1) + tentativa * QUANTOS[papel];
    const id = `jud_${municipioId}_${papel}_${k}`;
    const ja = lista[id];
    if (ja?.afastado !== undefined) continue;
    const a = ja ?? (lista[id] = daVaga(v, papel, municipioId, k));
    a.processos++;
    return a;
  }
  const a = daVaga(v, papel, municipioId, 99);
  lista[a.id] = a;
  a.processos++;
  return a;
}

export function lembrarAtor(v: Vida, id: string | undefined, texto: string): void {
  const a = ator(v, id);
  if (!a) return;
  a.historia.push({ t: v.t, texto });
  if (a.historia.length > 8) a.historia.splice(0, a.historia.length - 8);
}

/** Já se cruzaram antes? (o texto do reencontro). */
export function reencontro(v: Vida, a: AtorJudicial): string | undefined {
  const antes = a.historia.filter(h => h.t < v.t);
  if (!antes.length) return undefined;
  const ult = antes[antes.length - 1];
  return `Não é a primeira vez: em ${anoDe(ult.t)}, ${ult.texto.charAt(0).toLowerCase()}${ult.texto.slice(1).replace(/\.$/, '')}.`;
}

/** O efeito do rigor do juiz na chance de absolvição (pequeno: o rigor não decide sozinho). */
export const ajusteDoJuiz = (a?: AtorJudicial) => (a ? (50 - a.rigor) / 1000 : 0);
