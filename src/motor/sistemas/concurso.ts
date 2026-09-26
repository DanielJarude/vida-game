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
import type { FocoConcurso, Vida } from '../tipos';
import type { Ocupacao } from '../dados/ocupacoes';
import { OCUPACOES, ocupacao } from '../dados/ocupacoes';
import { escrever, idade, marcarFato } from '../nucleo';
import { municipio } from '../dados/lugares';
import { habilidade } from './frentes';
import { marcar } from './marcas';
import { nomeOcupacao } from './trabalho';
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
import { propor } from './compromissos';

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

/* ------------------------------------------------------------- Foco */

/** A área de cada edital (o que o estudo dirigido cobre). */
export const FOCO_DO_CARGO: Record<string, FocoConcurso> = {
  aluno_pm: 'policial', aluno_bombeiro: 'policial', aluno_sargento: 'policial', cadete: 'policial', policial_civil: 'policial', delegado: 'policial',
  policial_penal: 'policial', perito_criminal: 'policial', policial_rodoviario: 'policial', aluno_oficial_pm: 'policial', aluno_oficial_tecnico: 'policial', guarda_municipal: 'policial',
  tecnico_publico: 'administrativo', analista_judiciario: 'administrativo', auditor_fiscal: 'fiscal', escriturario_banco: 'bancario',
  professor_concursado: 'educacao', professor_substituto: 'educacao', agente_saude: 'saude', professor_univ: 'academico', pesquisador_instituto: 'academico'
};

export const NOME_FOCO: Record<FocoConcurso, string> = {
  policial: 'carreiras policiais e militares', administrativo: 'prefeitura e tribunais', fiscal: 'área fiscal (Receita)', bancario: 'bancos públicos',
  educacao: 'magistério público', saude: 'saúde pública', academico: 'universidade e pesquisa'
};

/**
 * O que a vida já traz para cada área: anos de farda contam no edital de
 * polícia (a rotina, a legislação, o teste físico); o Direito conta no de
 * tribunal e de delegado; Contábeis e Economia, no fiscal; a estrada no
 * banco, no bancário. Não é atalho: é a mesma coisa que um examinador vê.
 */
const TRAJETORIA_DO_FOCO: Record<FocoConcurso, { trilhas: string[]; areas: string[]; rotulo: string }> = {
  policial: { trilhas: ['pm', 'pm_oficial', 'bombeiro', 'guarda', 'penal', 'vigilancia', 'exercito_praca', 'exercito_sargento', 'exercito_oficial', 'policia_civil', 'pericia', 'federal'], areas: ['direito'], rotulo: 'farda' },
  administrativo: { trilhas: ['publico', 'judiciario', 'administrativo'], areas: ['direito', 'administracao'], rotulo: 'serviço público' },
  fiscal: { trilhas: ['contabil', 'financas', 'fiscal'], areas: ['contabilidade', 'economia', 'direito'], rotulo: 'contas' },
  bancario: { trilhas: ['financas', 'administrativo', 'atendimento'], areas: ['economia', 'administracao', 'contabilidade'], rotulo: 'banco' },
  educacao: { trilhas: ['educacao', 'ensino_tecnico', 'idiomas'], areas: ['educacao', 'letras'], rotulo: 'sala de aula' },
  saude: { trilhas: ['saude_publica', 'enfermagem', 'cuidado'], areas: ['enfermagem'], rotulo: 'saúde' },
  academico: { trilhas: ['academia', 'pesquisa', 'docencia_superior'], areas: [], rotulo: 'pesquisa' }
};

/** O que a biografia soma a este edital, em meses equivalentes de estudo — e dito em palavras. */
export function trajetoriaParaConcurso(v: Vida, oc: Ocupacao): { meses: number; motivos: string[] } {
  const foco = FOCO_DO_CARGO[oc.id];
  if (!foco) return { meses: 0, motivos: [] };
  const t = TRAJETORIA_DO_FOCO[foco];
  const motivos: string[] = [];
  let meses = 0;
  const anos = t.trilhas.reduce((s, x) => s + (v.trabalho.experiencia[x] ?? 0), 0) / 12;
  if (anos >= 2) {
    const m = Math.min(18, Math.round(anos * 1.5));
    meses += m;
    const atual = v.trabalho.atual && t.trilhas.includes(ocupacao(v.trabalho.atual.ocupacaoId).trilha) ? nomeOcupacao(v, ocupacao(v.trabalho.atual.ocupacaoId)) : undefined;
    // Anos de vigilância privada são segurança, não farda: o texto diz de onde a estrada veio.
    const maior = t.trilhas.reduce((a, x) => ((v.trabalho.experiencia[x] ?? 0) > (v.trabalho.experiencia[a] ?? 0) ? x : a), t.trilhas[0]);
    const rotulo = foco === 'policial' && maior === 'vigilancia' ? 'segurança privada' : t.rotulo;
    motivos.push(atual ? `Seus ${Math.floor(anos)} anos de ${rotulo}, hoje como ${atual}, contam: a rotina e a matéria da prova não são novidade.` : `Os ${Math.floor(anos)} anos de ${rotulo} contam: boa parte da matéria você já viveu.`);
  }
  const formacao = v.educacao.concluidos.find(c => t.areas.includes(c.area) && ['superior', 'pos', 'mestrado', 'doutorado'].includes(c.nivel));
  if (formacao) { meses += 8; motivos.push(`${formacao.nivel === 'superior' ? `A formação em ${formacao.nome}` : `${formacao.nivel === 'pos' ? 'A' : 'O'} ${formacao.nome.charAt(0).toLowerCase()}${formacao.nome.slice(1)}`} pesa a favor: é o conteúdo específico deste edital.`); }
  if (oc.forma && v.corpo.forma >= oc.forma + 10) motivos.push('O preparo físico está acima do que o teste pede.');
  else if (oc.forma && v.corpo.forma < oc.forma) motivos.push('O teste físico ainda não passaria: corrida e academia entram no preparo.');
  return { meses, motivos };
}

/** O preparo efetivo para um cargo: meses de estudo (dirigido ou não), as matérias, e o que a vida já traz. */
export function preparoPara(v: Vida, oc: Ocupacao): number {
  const p = perfilConcurso(oc.id);
  const c = v.caminhos.concurso;
  const materias = p.materias.map(d => habilidade(v, d)).reduce((s, x) => s + x, 0) / p.materias.length;
  const foco = FOCO_DO_CARGO[oc.id];
  // Estudo dirigido para esta área rende mais que o geral; o geral rende o de sempre; o dirigido para outra área, pouco mais da metade.
  const noFoco = c.foco && foco === c.foco ? Math.min(c.meses, c.mesesFoco ?? 0) : 0;
  const resto = c.meses - noFoco;
  const fator = !c.foco || c.foco === foco ? 1 : 0.65;
  const estudo = noFoco * 1.15 + resto * fator;
  // Matéria boa rende o estudo; matéria fraca come o estudo.
  return estudo * (0.55 + materias / 110) + Math.max(0, materias - 55) / 4 + trajetoriaParaConcurso(v, oc).meses;
}

/** Chance de aprovação (0..1). Sem preparo, quase nenhuma. Com todo o preparo, ainda há concorrência. */
export function chanceNoConcurso(v: Vida, oc: Ocupacao): number {
  const p = perfilConcurso(oc.id);
  const prep = preparoPara(v, oc);
  const x = (prep - p.preparo) / Math.max(4, p.preparo * 0.45);
  const curva = 1 / (1 + Math.exp(-x * 1.6));
  // Quem traz estrada da área passa mais vezes das etapas que não são prova (título, físico, investigação social).
  const teto = p.teto + (trajetoriaParaConcurso(v, oc).meses >= 12 ? 0.04 : 0);
  let c = 0.01 + (teto - 0.01) * curva;
  if (oc.id === 'musico_orquestra') c = clamp(0.01 + (habilidade(v, 'musica') - 76) / 40, 0.01, p.teto);
  if (oc.id === 'professor_univ') c += v.educacao.concluidos.filter(x => x.nivel === 'doutorado').length ? 0.05 : 0;
  return clamp(c, 0.01, teto);
}

/** Em que ponto está o preparo para um edital, do jeito que a vida fala (0 sem preparo … 4 muito competitivo). */
export const PALAVRA_PREPARO = ['sem preparo', 'começando', 'em construção', 'competitivo', 'muito competitivo'] as const;

export function nivelDoPreparo(v: Vida, oc: Ocupacao): number {
  const p = perfilConcurso(oc.id);
  const r = preparoPara(v, oc) / p.preparo;
  return r < 0.3 ? 0 : r < 0.65 ? 1 : r < 0.95 ? 2 : r < 1.3 ? 3 : 4;
}

export interface LeituraPreparo {
  nivel: number;
  palavra: string;
  /** A frase principal. */
  frase: string;
  /** O que pesa (a favor e contra), em palavras. */
  fatores: string[];
  /** Comparação com a última vez que tentou este edital (ou um da mesma área). */
  desde?: string;
}

/** A leitura completa: onde está, o que pesa, o que mudou desde a última tentativa. */
export function lerPreparo(v: Vida, oc: Ocupacao): LeituraPreparo {
  const p = perfilConcurso(oc.id);
  const nivel = nivelDoPreparo(v, oc);
  const c = v.caminhos.concurso;
  const foco = FOCO_DO_CARGO[oc.id];
  const fatores: string[] = [];
  if (foco && c.foco === foco && (c.mesesFoco ?? 0) >= 6) fatores.push(`O estudo está dirigido para ${NOME_FOCO[foco]}: rende mais aqui.`);
  else if (foco && c.foco && c.foco !== foco) fatores.push(`O estudo está dirigido para ${NOME_FOCO[c.foco]}; este edital cobra outra coisa — o preparo rende bem menos.`);
  else if (c.meses >= 6 && foco) fatores.push(`Estudo geral: serve, mas dirigir para ${NOME_FOCO[foco]} renderia mais.`);
  fatores.push(...trajetoriaParaConcurso(v, oc).motivos);
  const fraca = [...p.materias].sort((a, b) => habilidade(v, a) - habilidade(v, b))[0];
  if (fraca && habilidade(v, fraca) < 50) fatores.push(`A matéria mais fraca é ${NOME_DA_PROVA[fraca] ?? fraca}: é onde o estudo mais falta.`);
  const disputa = p.teto <= 0.1 ? ' Mesmo bem preparado, a maioria não passa: é um dos editais mais disputados.' : p.teto <= 0.16 ? ' A concorrência é grande: costuma levar mais de uma tentativa.' : '';
  const frase = nivel === 0 ? 'Sem preparo, é quase um bilhete de loteria.'
    : nivel === 1 ? 'O estudo começou, mas ainda falta bastante para a nota de corte.'
      : nivel === 2 ? 'Preparo em construção: perto do que esse concurso costuma pedir.'
        : nivel === 3 ? `Preparo competitivo para ${nomeOcupacao(v, oc)}.${disputa}`
          : `Preparo muito competitivo: está entre os mais preparados.${disputa}`;
  const antes = [...v.caminhos.devolutivas].reverse().find(d => d.tipo === 'concurso' && d.nivel !== undefined && (d.ocupacaoId === oc.id || (foco && FOCO_DO_CARGO[d.ocupacaoId ?? ''] === foco)));
  const desde = antes ? (antes.nivel! < nivel ? `Desde a última tentativa (${anoDe(antes.t)}), o preparo subiu de "${PALAVRA_PREPARO[antes.nivel!]}" para "${PALAVRA_PREPARO[nivel]}".` : antes.nivel! > nivel ? `Desde a última tentativa (${anoDe(antes.t)}), o preparo esfriou: era "${PALAVRA_PREPARO[antes.nivel!]}", agora "${PALAVRA_PREPARO[nivel]}".` : `Desde a última tentativa (${anoDe(antes.t)}), o preparo segue "${PALAVRA_PREPARO[nivel]}".`) : undefined;
  return { nivel, palavra: PALAVRA_PREPARO[nivel], frase, fatores, desde };
}

/** Palavras para o preparo (a frase curta de antes, agora com o que pesa). */
export function leituraDoPreparo(v: Vida, oc: Ocupacao): string {
  const l = lerPreparo(v, oc);
  return [l.frase, l.fatores[0]].filter(Boolean).join(' ');
}

/** Mudar a direção do estudo: o que já se estudou não some, mas passa a render menos para a área nova. */
export function dirigirEstudo(v: Vida, foco: FocoConcurso | undefined): void {
  const c = v.caminhos.concurso;
  if (c.foco === foco) return;
  c.foco = foco;
  c.mesesFoco = 0;
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
  if (!v.rotinas.some(x => x.id === 'estudar_concurso') && c.meses > 0) { c.meses = Math.max(0, Math.round(c.meses * 0.85 - 2)); if (c.mesesFoco) c.mesesFoco = Math.min(c.meses, Math.max(0, Math.round(c.mesesFoco * 0.85 - 2))); }

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
      registrarDevolutiva(v, { tipo: 'concurso', titulo: `Concurso para ${nomeOcupacao(v, oc)}`, passou: false, perto: true, falta: 'fisico', ocupacaoId: oc.id, nivel: nivelDoPreparo(v, oc), texto: 'A prova escrita passou; o teste físico, não. O estudo estava lá — falta o corpo: corrida e academia, com tempo, resolvem.' });
      marcar(v, 'reprovacao', `${flex(ge(v), 'Reprovado', 'Reprovada', 'Reprovade')} no teste físico: ${nomeOcupacao(v, oc)}.`, 1, { ocupacaoId: oc.id });
      continue;
    }
    const sorte = r.next();
    if (sorte < chance) {
      c.aprovacoes += 1;
      if (tentativas > 1) escrever(v, { texto: `${flex(ge(v), 'Aprovado', 'Aprovada', 'Aprovade')} no concurso para ${nomeOcupacao(v, oc)}, na ${tentativas}ª tentativa.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
      // Aprovado não é empossado: se houver o que largar (um emprego, a base, o negócio), a posse é escolha.
      propor(v, r, { tipo: 'emprego', ocupacaoId: oc.id, via: 'concurso' });
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
    const leitura = lerPreparo(v, oc);
    const trajetoria = trajetoriaParaConcurso(v, oc).motivos[0];
    registrarDevolutiva(v, {
      tipo: 'concurso', titulo: `Concurso para ${nomeOcupacao(v, oc)}`, passou: false, perto, falta, ocupacaoId: oc.id, nivel: leitura.nivel,
      texto: [
        falta === 'preparo' ? `Faltou preparo (${leitura.palavra})${nomeFraca ? `; a nota mais baixa foi em ${nomeFraca}` : ''}.${perto ? ' Ficou perto da nota de corte.' : ''}` : `O preparo era ${leitura.palavra}, mas a concorrência foi maior${perto ? ' — ficou a poucas questões' : ''}.`,
        leitura.desde,
        falta === 'preparo' && FOCO_DO_CARGO[oc.id] && v.caminhos.concurso.foco !== FOCO_DO_CARGO[oc.id] ? `Dirigir o estudo para ${NOME_FOCO[FOCO_DO_CARGO[oc.id]]} faria o preparo render mais.` : undefined,
        trajetoria
      ].filter(Boolean).join(' ')
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
      escrever(v, { texto: `Chamaram o cadastro reserva do concurso para ${nomeOcupacao(v, oc)}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
      propor(v, r, { tipo: 'emprego', ocupacaoId: oc.id, via: 'reserva' });
    }
  }
}
