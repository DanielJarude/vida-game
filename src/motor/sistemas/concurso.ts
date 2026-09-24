/**
 * Concurso público: um PROCESSO, não um clique.
 *
 *   EDITAL     os concursos abrem em anos diferentes (a prefeitura quase todo
 *              ano; a Receita, de tempos em tempos). Não dá para prestar o que
 *              não abriu.
 *   PREPARO    meses de estudo acumulados (a rotina "Estudar para concurso",
 *              em ritmo leve, firme ou de concurseiro). Esfria quando para.
 *   PROVA      a chance depende de quanto preparo o cargo pede, das matérias
 *              que ele cobra (português e raciocínio para tribunal; exatas
 *              para fiscal), da concorrência — e um pouco de sorte no dia.
 *              Polícias e Forças Armadas têm teste físico.
 *   RESULTADO  aprovado nas vagas (nomeação), aprovado fora delas (cadastro
 *              reserva: pode ser chamado depois) ou reprovado — com a
 *              distância dita em palavras. Reprovar não fecha a porta.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Vida } from '../tipos';
import type { Ocupacao } from '../dados/ocupacoes';
import { OCUPACOES, ocupacao } from '../dados/ocupacoes';
import { escrever, idade, marcarFato } from '../nucleo';
import { municipio } from '../dados/lugares';
import { habilidade } from './frentes';
import { marcar } from './marcas';
import { contratar, nomeOcupacao, textoDeContratacao } from './trabalho';
import { anoDe } from '../tempo';
import { flex, ge } from '../texto';
import { registrarDevolutiva } from './devolutivas';
import { abalar } from './abalo';

const NOME_DA_PROVA: Record<string, string> = { exatas: 'matemática e raciocínio lógico', linguagens: 'português', humanas: 'conhecimentos gerais e legislação', ciencias: 'conhecimentos específicos', idiomas: 'língua estrangeira', musica: 'a prova prática' };

interface PerfilConcurso {
  /** Meses de estudo sério que a aprovação costuma pedir. */
  preparo: number;
  /** Teto de chance para quem está bem preparado (concorrência). */
  teto: number;
  /** Chance de abrir edital num ano. */
  frequencia: number;
  /** Matérias que pesam. */
  materias: ('exatas' | 'linguagens' | 'humanas' | 'ciencias' | 'musica')[];
  /** Esfera (para dizer quem abriu). */
  esfera: 'municipal' | 'estadual' | 'federal';
}

const PERFIS: Record<string, PerfilConcurso> = {
  agente_saude: { preparo: 5, teto: 0.22, frequencia: 0.4, materias: ['linguagens'], esfera: 'municipal' },
  guarda_municipal: { preparo: 8, teto: 0.15, frequencia: 0.3, materias: ['linguagens', 'humanas'], esfera: 'municipal' },
  tecnico_publico: { preparo: 14, teto: 0.12, frequencia: 0.6, materias: ['linguagens', 'exatas'], esfera: 'municipal' },
  escriturario_banco: { preparo: 16, teto: 0.1, frequencia: 0.35, materias: ['linguagens', 'exatas'], esfera: 'federal' },
  professor_concursado: { preparo: 14, teto: 0.16, frequencia: 0.5, materias: ['linguagens', 'humanas'], esfera: 'estadual' },
  aluno_pm: { preparo: 12, teto: 0.18, frequencia: 0.4, materias: ['linguagens', 'humanas'], esfera: 'estadual' },
  aluno_bombeiro: { preparo: 14, teto: 0.14, frequencia: 0.3, materias: ['linguagens', 'exatas'], esfera: 'estadual' },
  aluno_sargento: { preparo: 16, teto: 0.14, frequencia: 1, materias: ['linguagens', 'exatas', 'humanas'], esfera: 'federal' },
  cadete: { preparo: 26, teto: 0.07, frequencia: 1, materias: ['exatas', 'linguagens'], esfera: 'federal' },
  policial_civil: { preparo: 20, teto: 0.12, frequencia: 0.25, materias: ['linguagens', 'humanas'], esfera: 'estadual' },
  analista_judiciario: { preparo: 30, teto: 0.1, frequencia: 0.3, materias: ['linguagens', 'humanas'], esfera: 'federal' },
  delegado: { preparo: 40, teto: 0.07, frequencia: 0.2, materias: ['linguagens', 'humanas'], esfera: 'estadual' },
  auditor_fiscal: { preparo: 48, teto: 0.06, frequencia: 0.15, materias: ['exatas', 'linguagens'], esfera: 'federal' },
  professor_univ: { preparo: 14, teto: 0.22, frequencia: 0.3, materias: ['linguagens'], esfera: 'federal' },
  musico_orquestra: { preparo: 6, teto: 0.25, frequencia: 0.12, materias: ['musica'], esfera: 'estadual' },
  professor_substituto: { preparo: 3, teto: 0.45, frequencia: 0.8, materias: ['linguagens'], esfera: 'estadual' },
  pesquisador_instituto: { preparo: 12, teto: 0.14, frequencia: 0.2, materias: ['ciencias', 'linguagens'], esfera: 'federal' },
  policial_penal: { preparo: 10, teto: 0.18, frequencia: 0.35, materias: ['linguagens', 'humanas'], esfera: 'estadual' },
  perito_criminal: { preparo: 26, teto: 0.09, frequencia: 0.2, materias: ['ciencias', 'exatas', 'linguagens'], esfera: 'estadual' },
  policial_rodoviario: { preparo: 24, teto: 0.08, frequencia: 0.2, materias: ['linguagens', 'humanas', 'exatas'], esfera: 'federal' },
  aluno_oficial_pm: { preparo: 22, teto: 0.09, frequencia: 0.3, materias: ['linguagens', 'humanas'], esfera: 'estadual' },
  aluno_oficial_tecnico: { preparo: 18, teto: 0.12, frequencia: 0.8, materias: ['ciencias', 'linguagens'], esfera: 'federal' }
};

const PADRAO: PerfilConcurso = { preparo: 10, teto: 0.35, frequencia: 0.3, materias: ['linguagens'], esfera: 'estadual' };
export const perfilConcurso = (id: string) => PERFIS[id] ?? PADRAO;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/** O edital deste cargo está aberto neste ano, para quem mora aqui? (Estável: o mundo, não a pessoa.) */
export function editalAberto(v: Vida, oc: Ocupacao): boolean {
  if (!oc.concurso) return false;
  const p = perfilConcurso(oc.id);
  const m = municipio(v.moradia.municipioId);
  const onde = p.esfera === 'municipal' ? m.id : p.esfera === 'estadual' ? m.uf : 'BR';
  return hash(`edital:${oc.id}:${onde}:${anoDe(v.t)}`) < p.frequencia;
}

/** Editais abertos agora (para a interface dizer "saiu o edital"). */
export function editaisAbertos(v: Vida): Ocupacao[] {
  return OCUPACOES.filter(oc => oc.concurso && editalAberto(v, oc));
}

/** O preparo efetivo para um cargo: meses de estudo, temperados pelas matérias que ele cobra. */
export function preparoPara(v: Vida, oc: Ocupacao): number {
  const p = perfilConcurso(oc.id);
  const materias = p.materias.map(d => habilidade(v, d)).reduce((s, x) => s + x, 0) / p.materias.length;
  // Matéria boa rende o estudo; matéria fraca come o estudo.
  return v.caminhos.concurso.meses * (0.55 + materias / 110) + Math.max(0, materias - 55) / 4;
}

/** Chance de aprovação (0..1). Sem preparo, quase nenhuma. Com todo o preparo, ainda há concorrência. */
export function chanceNoConcurso(v: Vida, oc: Ocupacao): number {
  const p = perfilConcurso(oc.id);
  const prep = preparoPara(v, oc);
  const x = (prep - p.preparo) / Math.max(4, p.preparo * 0.45);
  const curva = 1 / (1 + Math.exp(-x * 1.6));
  let c = 0.01 + (p.teto - 0.01) * curva;
  if (oc.id === 'musico_orquestra') c = clamp(0.01 + (habilidade(v, 'musica') - 76) / 40, 0.01, p.teto);
  if (oc.id === 'professor_univ') c += v.educacao.concluidos.filter(x => x.nivel === 'doutorado').length ? 0.05 : 0;
  return clamp(c, 0.01, p.teto);
}

/** Palavras para o preparo. */
export function leituraDoPreparo(v: Vida, oc: Ocupacao): string {
  const p = perfilConcurso(oc.id);
  const prep = preparoPara(v, oc);
  if (prep < p.preparo * 0.3) return 'Sem preparo, é quase um bilhete de loteria.';
  if (prep < p.preparo * 0.7) return 'O estudo começou, mas ainda falta bastante.';
  if (prep < p.preparo) return 'Perto do preparo que esse concurso costuma pedir.';
  return 'Preparo de quem vem estudando a sério. Ainda assim, há concorrência.';
}

/* ------------------------------------------------------------- Inscrição */

export function inscrever(v: Vida, oc: Ocupacao): void {
  const c = v.caminhos.concurso;
  // Voltar a tentar depois de reprovar é comportamento: persistência.
  if (c.tentativas > c.aprovacoes && c.ultimaTentativa !== undefined) marcarFato(v, 'persistiu_concurso');
  v.trabalho.candidaturas.push({ id: `c${v.seq++}`, ocupacaoId: oc.id, tInicio: v.t, tResultado: v.t + 6, chance: chanceNoConcurso(v, oc), concurso: true });
  escrever(v, { texto: `Inscreveu-se no concurso para ${nomeOcupacao(v, oc)}.`, relevancia: 'tecnico', tema: 'trabalho', escolha: true });
}

/* ------------------------------------------------------------- O ano */

export function processarConcursos(v: Vida, r: Rng): void {
  const c = v.caminhos.concurso;
  // O preparo esfria sem estudo.
  if (!v.rotinas.some(x => x.id === 'estudar_concurso') && c.meses > 0) c.meses = Math.max(0, Math.round(c.meses * 0.85 - 2));

  for (const cand of [...v.trabalho.candidaturas]) {
    if (cand.tResultado > v.t) continue;
    v.trabalho.candidaturas = v.trabalho.candidaturas.filter(x => x.id !== cand.id);
    const oc = ocupacao(cand.ocupacaoId);
    c.tentativas += 1;
    c.ultimaTentativa = v.t;
    // A chance é a do dia da prova (o preparo até lá conta).
    const chance = Math.max(cand.chance, chanceNoConcurso(v, oc));
    const tentativas = (v.fatos[`concurso_${oc.id}`] ?? 0) + 1;
    if (oc.forma && v.corpo.forma < oc.forma) {
      v.fatos[`concurso_${oc.id}`] = tentativas;
      escrever(v, { texto: `Passou na prova escrita para ${nomeOcupacao(v, oc)}, mas não no teste físico.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      marcar(v, 'reprovacao', `${flex(ge(v), 'Reprovado', 'Reprovada', 'Reprovade')} no teste físico: ${nomeOcupacao(v, oc)}.`, 1, { ocupacaoId: oc.id });
      continue;
    }
    const sorte = r.next();
    if (sorte < chance) {
      c.aprovacoes += 1;
      const novo = contratar(v, r, oc, 'concurso');
      escrever(v, { texto: textoDeContratacao(v, oc, novo) + (tentativas > 1 ? ` Na ${tentativas}ª tentativa.` : ''), relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
      continue;
    }
    v.fatos[`concurso_${oc.id}`] = tentativas;
    if (sorte < chance * 1.6 && !c.reserva) {
      c.reserva = { ocupacaoId: oc.id, tAte: v.t + 24 };
      escrever(v, { texto: `${flex(ge(v), 'Aprovado', 'Aprovada')} no concurso para ${nomeOcupacao(v, oc)}, mas fora das vagas: ficou no cadastro reserva.`, relevancia: 'biografia', tema: 'trabalho' });
      marcar(v, 'reprovacao', `Cadastro reserva: ${nomeOcupacao(v, oc)}.`, 2, { ocupacaoId: oc.id });
      continue;
    }
    const perto = sorte < chance * 2.5 && chance > 0.1;
    escrever(v, {
      texto: tentativas === 1
        ? `Não passou no concurso para ${nomeOcupacao(v, oc)}${perto ? ' — ficou a poucas questões da nota de corte' : ''}.`
        : `Mais uma reprovação no concurso para ${nomeOcupacao(v, oc)} — a ${tentativas}ª${perto ? ', agora mais perto' : ''}.`,
      relevancia: tentativas === 1 || tentativas % 3 === 0 || perto ? 'cotidiano' : 'tecnico', tema: 'trabalho', tom: 'ruim'
    });
    marcar(v, 'reprovacao', `${flex(ge(v), 'Reprovado', 'Reprovada', 'Reprovade')} no concurso para ${nomeOcupacao(v, oc)} (${tentativas}ª vez).`, 1, { ocupacaoId: oc.id });
    // O resultado vem com a nota: dá para saber o que pesou.
    const p = perfilConcurso(oc.id);
    const fraca = [...p.materias].sort((a, b) => habilidade(v, a) - habilidade(v, b))[0];
    const falta = preparoPara(v, oc) < p.preparo ? 'preparo' : 'concorrencia';
    const nomeFraca = fraca ? NOME_DA_PROVA[fraca] ?? fraca : undefined;
    registrarDevolutiva(v, {
      tipo: 'concurso', titulo: `Concurso para ${nomeOcupacao(v, oc)}`, passou: false, perto, falta, ocupacaoId: oc.id,
      texto: falta === 'preparo' ? `Faltou preparo${nomeFraca ? `; a nota mais baixa foi em ${nomeFraca}` : ''}.${perto ? ' Ficou perto da nota de corte.' : ''}` : `A nota foi boa, mas a concorrência foi maior${perto ? ' — ficou a poucas questões' : ''}.`
    });
    abalar(v, `a reprovação no concurso`, perto ? -3 : -4, 2);
  }

  // Cadastro reserva: às vezes chamam.
  if (c.reserva) {
    const oc = ocupacao(c.reserva.ocupacaoId);
    if (v.t > c.reserva.tAte) {
      c.reserva = undefined;
      escrever(v, { texto: `O concurso para ${nomeOcupacao(v, oc)} venceu sem que chamassem o cadastro reserva.`, relevancia: 'cotidiano', tema: 'trabalho' });
    } else if (r.chance(0.35) && v.trabalho.atual?.ocupacaoId !== oc.id && !v.trabalho.aposentadoria && idade(v) < 70) {
      c.reserva = undefined;
      c.aprovacoes += 1;
      const novo = contratar(v, r, oc, 'concurso');
      escrever(v, { texto: `Chamaram o cadastro reserva: ${nomeOcupacao(v, oc)} em ${novo.empregador.replace(/^(a|o) /, '')}, com estabilidade.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    }
  }
}
