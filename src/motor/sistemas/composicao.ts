/**
 * Composição contextual das frases que mais se repetiam entre vidas (FIX pós-REWORK 4).
 *
 * O relatório do REWORK 4 deixou três grupos repetindo: a conclusão de curso
 * ("Concluiu o ensino médio."), a prova teórica de direção ("Reprovou na prova
 * teórica de direção (2 de 5).") e a recuperação econômica. Não se resolve
 * com sinônimos: a frase é MONTADA com o que é desta vida —
 *
 *   o acontecimento + o lugar (a escola, a universidade, a cidade)
 *   + a situação pessoal (as notas, a tentativa, o trabalho de agora)
 *   + quem estava junto (a mãe na formatura, a parceria, ninguém)
 *   + o que vem depois (o emprego, a próxima matrícula, a dúvida)
 *
 * Cada parte é opcional e escolhida por sorteio DERIVADO (`rngDe`): a frase
 * muda de vida para vida sem mexer no acaso do resto do jogo.
 */

import type { Pessoa, Vida } from '../tipos';
import { rngDe } from '../rng';
import { idade, vinculosVivos } from '../nucleo';
import { flex } from '../texto';
import { municipio } from '../dados/lugares';
import { ocupacaoOuNula } from '../dados/ocupacoes';


/** Quem da família estaria na plateia (vivos, por perto ou próximos): a mãe, o pai, a parceria, os filhos. */
function plateia(v: Vida): { mae?: Pessoa; pai?: Pessoa; par?: Pessoa; filho?: Pessoa } {
  const vivos = vinculosVivos(v).filter(x => !x.p.especie);
  const perto = (x: (typeof vivos)[number]) => x.vin.convivio.includes('casa') || x.p.municipioId === v.moradia.municipioId || x.vin.proximidade >= 60;
  const de = (f: (x: (typeof vivos)[number]) => boolean) => vivos.filter(x => f(x) && perto(x)).sort((a, b) => b.vin.proximidade - a.vin.proximidade)[0]?.p;
  return {
    mae: de(x => x.vin.parentesco === 'mae'), pai: de(x => x.vin.parentesco === 'pai'),
    par: de(x => !!x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio)),
    filho: de(x => x.vin.parentesco === 'filho')
  };
}

export interface Conclusao {
  /** O núcleo: "Concluiu o ensino médio", "Formou-se em Medicina", "Concluiu o Técnico em Informática". */
  nucleo: string;
  /** Onde ("a Escola Estadual Castro Alves", "a Universidade Federal"). */
  instituicao?: string;
  desempenho?: number;
  reprovacoes?: number;
  /** A chave do sorteio (o curso, a etapa): duas formaturas na mesma vida não saem iguais. */
  chave: string;
  /** Voltou a estudar depois dos 30. */
  voltou?: boolean;
}

/** A formatura, montada com o que é desta vida. O núcleo vem sempre primeiro (as telas o reconhecem por ele). */
export function fraseDeConclusao(v: Vida, c: Conclusao): string {
  const r = rngDe(v.id, 'conclusao', c.chave, v.t);
  const partes: string[] = [];
  // Onde, às vezes (o nome da escola é da vida, não do catálogo).
  const onde = c.instituicao && r.chance(0.55) ? emInstituicao(c.instituicao) : '';
  // Como terminou.
  const d = c.desempenho ?? 60;
  const como = (c.reprovacoes ?? 0) > 0 ? `com ${c.reprovacoes === 1 ? 'uma repetência' : `${c.reprovacoes} repetências`} no caminho`
    : d >= 85 ? r.pick(['entre os melhores da turma', 'com as melhores notas da sala', 'com menção na formatura'])
      : d < 45 ? r.pick(['no limite, com a última prova decidindo', 'raspando, depois de um último semestre difícil', 'por pouco'])
        : c.voltou ? `aos ${idade(v)}` : '';
  // Quem estava (ou o que vem depois) — uma das duas, para a frase não virar lista.
  const p = plateia(v);
  const e = v.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  const g = (x: Pessoa) => flex(x.genero, 'o', 'a', 'e');
  const quem = p.mae && r.chance(0.5) ? r.pick([`${p.mae.nome} chorou na formatura`, `${p.mae.nome} chegou uma hora antes para pegar lugar`, `${p.mae.nome} guardou o convite numa pasta`])
    : p.pai && r.chance(0.4) ? r.pick([`${p.pai.nome} filmou a formatura inteira, tremendo`, `${p.pai.nome} não disse muito — e não precisou`])
      : p.par && r.chance(0.6) ? r.pick([`com ${p.par.nome} na plateia`, `${p.par.nome} levou flores`])
        : p.filho && idade(v) >= 28 ? `com ${p.filho.nome} na plateia, ${g(p.filho) === 'a' ? 'orgulhosa' : 'orgulhoso'}` : '';
  const depois = e && oc && r.chance(0.5) ? `já trabalhando como ${oc.nome[v.eu.genero === 'feminino' ? 1 : 0]}`
    : v.educacao.matricula && r.chance(0.6) ? 'e a próxima matrícula já estava feita'
      : !e && idade(v) >= 17 && r.chance(0.35) ? 'sem saber direito o que vinha depois' : '';
  if (onde) partes.push(onde);
  if (como) partes.push(como);
  const fecho = quem || depois;
  // A formatura: núcleo — onde, como; e o fecho (quem estava, ou o que vem depois).
  const meio = partes.length ? ` ${partes.join(', ')}` : '';
  const junta = fecho.startsWith('e ') ? ',' : ' —';
  return `${c.nucleo}${meio}${fecho ? `${junta} ${fecho}` : ''}.`;
}

/** "na Escola Estadual X", "no Colégio Y", "na universidade federal", "no Instituto Federal". */
function emInstituicao(nome: string): string {
  if (/^(a|o|as|os) /.test(nome)) return nome.replace(/^(a|o|as|os) /, (_, a: string) => `n${a} `);
  if (/^(Universidade|Faculdade|Escola|Universidad|Escuela|École|Fundação|Academia)/.test(nome)) return `na ${nome}`;
  if (/^(Colégio|Instituto|Centro|Liceu|Ginásio|Colegio)/.test(nome)) return `no ${nome}`;
  return `em ${nome}`;
}

/**
 * A reprovação na teórica, montada: a tentativa, quão perto ficou, como chegou (estudou? nervoso?), e quem estava
 * esperando do lado de fora.
 */
export function fraseDaReprovacaoTeorica(v: Vida, o: { total: number; minimo: number; deTotal: number; tentativa: number; preparo: number; nomeDaProva: string; chave: string }): string {
  const r = rngDe(v.id, 'teorica', o.chave, o.tentativa);
  const falta = o.minimo - o.total;
  const perto = falta <= 1 ? r.pick(['por um ponto', 'por uma questão']) : falta <= 3 ? `por ${falta} questões` : r.pick(['longe da nota', `com ${o.total} de ${o.deTotal}`]);
  const qual = o.tentativa <= 1 ? '' : o.tentativa === 2 ? r.pick([' de novo', ', na segunda tentativa']) : ', pela terceira vez';
  const como = v.mente.estresse >= 60 ? r.pick(['o nervoso apagou o que sabia', 'as mãos suaram antes da primeira pergunta'])
    : o.preparo >= 2 ? r.pick(['mesmo depois de semanas de apostila', 'mesmo com os simulados em dia'])
      : o.preparo <= 0 ? r.pick(['sem ter aberto a apostila', 'confiando demais no que lembrava']) : '';
  const p = plateia(v);
  const quem = p.mae && idade(v) < 22 && r.chance(0.5) ? `${p.mae.nome} esperava do lado de fora`
    : p.par && r.chance(0.5) ? `${p.par.nome} mandou mensagem antes do resultado` : '';
  const cidade = r.chance(0.3) ? ` em ${municipio(v.moradia.municipioId).nome}` : '';
  const extra = [como, quem].filter(Boolean)[r.int(0, 1)] ?? como;
  return `Reprovou ${perto} na prova teórica ${o.nomeDaProva}${cidade}${qual}${extra ? ` — ${extra}` : ''}.`;
}

