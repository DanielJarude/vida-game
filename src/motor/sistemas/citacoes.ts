/**
 * REWORK 11 · Fase F (NPC-11.2) — QUEM AINDA PODE SER CITADO. Vários registros guardam uma pessoa por id fora dos
 * vínculos: o contato de uma produção (`ContratoAV.pessoaId`), quem se conheceu num trabalho (`ItemCurriculo.pessoaId`),
 * o agente (`AgenteArtistico.pessoaId`). Se essa pessoa morre — pela vida dela (o mundo envelhece: `indiretos`) ou como
 * vínculo (`luto`) —, nenhum texto pode tratá-la como viva: a proposta não "vem dela", o agente não segue representando.
 *
 *  - `pessoaCitavel`: a pessoa, se existe e está viva (o leitor que cita alguém no presente pergunta aqui);
 *  - `citadosEmRegistrosVivos`: os ids que um registro EM CURSO cita (a proposta na mesa, a produção em andamento, o
 *    agente de agora) — o mundo não os mata "sem notícia" enquanto o registro está aberto;
 *  - `esquecerMorto`: quando alguém morre, os registros em curso deixam de citá-lo (o histórico fica: foi verdade).
 */
import type { Pessoa, Vida } from '../tipos';
import { escrever } from '../nucleo';

export function pessoaCitavel(v: Vida, id: string | undefined): Pessoa | undefined {
  const p = id ? v.pessoas[id] : undefined;
  return p && p.vivo ? p : undefined;
}

const EM_CURSO = new Set(['proposta', 'em_producao']);

export function citadosEmRegistrosVivos(v: Vida): string[] {
  const av = v.caminhos.audiovisual;
  if (!av) return [];
  return [...av.contratos.filter(c => EM_CURSO.has(c.status) && c.pessoaId).map(c => c.pessoaId!), ...(av.agente?.pessoaId ? [av.agente.pessoaId] : [])];
}

export function esquecerMorto(v: Vida, id: string): void {
  const av = v.caminhos.audiovisual;
  if (!av) return;
  for (const c of av.contratos) if (c.pessoaId === id && EM_CURSO.has(c.status)) delete c.pessoaId;
  if (av.agente?.pessoaId === id) {
    const nome = av.agente.nome;
    av.agente = undefined;
    escrever(v, { texto: `Com a morte de ${nome}, você ficou sem agente: os testes voltam a depender de você.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
  }
}
