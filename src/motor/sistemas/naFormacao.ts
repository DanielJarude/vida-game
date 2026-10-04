/**
 * Dentro da escola e da faculdade (FIX pós-REWORK 4): estar matriculado não é
 * só "passar anos → notas mudam → formar".
 *
 * As atividades que ocupam a semana (o time, o grêmio, a monitoria, a
 * iniciação) já existem (`rotinas`, `formacao`), e o ano tem os seus momentos
 * (`vidaEstudantil`). Aqui entram os VERBOS do ano letivo — poucos, com
 * contexto e consequência, uma vez por ano cada um:
 *
 *   escola     estudar para as provas · pedir ajuda ao professor da matéria
 *              fraca · ir à festa da turma · matar aula com a turma · colar
 *              na prova (e talvez ser pego) · liderar o trabalho em grupo
 *   faculdade  estudar para as provas · ir à festa da faculdade · procurar um
 *              professor para um projeto (o caminho da pesquisa) · ir a um
 *              congresso ou feira da área · colar
 *
 * Tudo alimenta o que já existe: o desempenho (as notas), as matérias e
 * competências (`frentes`), os colegas e professores de verdade (os vínculos
 * da instituição), o estresse, a família (que pode descobrir), a história da
 * formação (`registrarNaFormacao`) e a Linha da Vida quando é biografia.
 * O sistema educacional é o de onde se mora (a instituição vem de
 * `formacao.instituicaoAtual`): nada aqui presume um país.
 */

import { nomeDaMateria } from '../mundo/materias';
import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Pessoa, Vida } from '../tipos';
import { PERMITIDO, bloqueio, type Veredito } from '../plausibilidade';
import { escrever, idade, lembrarCom, vinculosVivos } from '../nucleo';
import { flex } from '../texto';
import { economiaLocal } from '../dados/lugares';
import { curso } from '../dados/cursos';
import { instituicaoAtual, professorDe, registrarNaFormacao } from './formacao';
import { materiasExtremas, praticar } from './frentes';
import { pagar, vereditoDePagar } from './dinheiro';
import { marcar } from './marcas';

export type OqueFormacao = 'estudar' | 'professor' | 'festa' | 'matar' | 'colar' | 'grupo' | 'projeto' | 'congresso';
export interface VerboDaFormacao { oque: OqueFormacao; rotulo: string; porque: string; risco?: boolean }

/** O nome da matéria, da fonte única (`mundo/materias`). */
const MATERIA = (d: Dominio | undefined) => (d && ['exatas', 'linguagens', 'ciencias', 'humanas'].includes(d) ? nomeDaMateria(d, 'aula') : undefined);
const chave = (v: Vida, oque: OqueFormacao) => `formacao:${oque}:${Math.floor(v.t / 12)}`;
const feito = (v: Vida, oque: OqueFormacao) => v.fatos[chave(v, oque)] !== undefined;
const naFaculdade = (v: Vida) => { const m = v.educacao.matricula; return !!m && !m.trancado && ['superior', 'tecnico', 'pos', 'mestrado', 'doutorado'].includes(curso(m.cursoId).nivel); };
const naEscola = (v: Vida) => !!v.educacao.basica && !v.educacao.evadiu && !naFaculdade(v);
const preco = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 10) * 10;

/** Um colega de verdade da instituição de agora (quem convive ali e não é da família). */
function colega(v: Vida, r?: Rng): Pessoa | undefined {
  const lugar = naFaculdade(v) ? 'faculdade' : 'escola';
  const lista = vinculosVivos(v).filter(x => !x.p.especie && !x.vin.parentesco && !x.vin.romance && x.vin.convivio.includes(lugar) && !x.vin.formacao?.papel?.startsWith('prof')).sort((a, b) => b.vin.proximidade - a.vin.proximidade);
  if (!lista.length) return undefined;
  return r ? lista[Math.floor(r.next() * Math.min(3, lista.length))].p : lista[0].p;
}

function mexerNaNota(v: Vida, n: number): void {
  const m = v.educacao.matricula;
  if (m && !m.trancado && naFaculdade(v)) m.desempenho = clamp(m.desempenho + n);
  else if (v.educacao.basica) v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho + n);
}
const nota = (v: Vida) => (naFaculdade(v) ? v.educacao.matricula!.desempenho : v.educacao.basica?.desempenho ?? 55);

/** Os verbos que fazem sentido agora (a idade, o lugar, o que já foi feito no ano). */
export function verbosDaFormacao(v: Vida): VerboDaFormacao[] {
  const inst = instituicaoAtual(v);
  if (!inst || inst.tipo === 'infantil' || inst.tipo === 'livre') return [];
  const i = idade(v);
  const out: VerboDaFormacao[] = [];
  const add = (x: VerboDaFormacao) => { if (!feito(v, x.oque)) out.push(x); };
  const fac = naFaculdade(v);
  if (!fac && !naEscola(v)) return [];
  if (i >= 10) add({ oque: 'estudar', rotulo: 'Estudar de verdade para as provas', porque: 'As notas sobem; o estresse também, um pouco.' });
  const fraca = materiasExtremas(v).fraca;
  if (!fac && fraca && i >= 9) add({ oque: 'professor', rotulo: `Pedir ajuda ao professor ${MATERIA(fraca) ? `de ${MATERIA(fraca)}` : 'da matéria mais difícil'}`, porque: 'Quem pede, aprende — e o professor passa a reparar em você.' });
  if (i >= 13) add({ oque: 'festa', rotulo: fac ? 'Ir à festa da faculdade' : 'Ir à festa da turma', porque: 'Gente nova, amizades — e a manhã seguinte.' });
  if (!fac && i >= 12 && colega(v)) add({ oque: 'grupo', rotulo: 'Puxar o trabalho em grupo', porque: 'Nota melhor, e quem trabalha junto se aproxima.' });
  if (!fac && i >= 13) add({ oque: 'matar', rotulo: 'Matar aula com a turma', porque: 'Uma tarde boa com os amigos. A escola avisa em casa, às vezes.', risco: true });
  if (fac) {
    add({ oque: 'projeto', rotulo: 'Procurar um professor para um projeto', porque: 'O caminho da pesquisa (e de uma carta de recomendação) começa assim.' });
    add({ oque: 'congresso', rotulo: 'Ir a um congresso ou feira da área', porque: `Uns ${preco(v, 400)}: contatos, ideias, a área de perto.` });
  }
  if (i >= 11) add({ oque: 'colar', rotulo: 'Colar na prova', porque: 'Pode dar certo. Se pegarem, a nota zera — e a história fica.', risco: true });
  return out;
}

export function disponibilidadeFormacao(v: Vida, oque: OqueFormacao): Veredito {
  if (!instituicaoAtual(v)) return bloqueio('impossivel', 'Você não está estudando agora.');
  if (feito(v, oque)) return bloqueio('incompativel', 'Isso já foi feito neste ano letivo.');
  if (!verbosDaFormacao(v).some(x => x.oque === oque)) return bloqueio('impossivel', 'Isso não faz sentido agora.');
  if (oque === 'congresso') return vereditoDePagar(v, preco(v, 400), 'A inscrição e a viagem custam uns');
  return PERMITIDO;
}

export function executarFormacao(v: Vida, r: Rng, oque: OqueFormacao): string {
  v.fatos[chave(v, oque)] = v.t;
  const inst = instituicaoAtual(v)!;
  const fac = naFaculdade(v);
  const i = idade(v);
  const g = v.eu.tratamento ?? v.eu.genero;
  const registrar = (tipo: string, texto: string) => registrarNaFormacao(v, { t: v.t, idade: i, instituicao: inst.nome, tipo, texto });
  const estresse = (n: number) => { v.mente.estresse = clamp(v.mente.estresse + n); };
  switch (oque) {
    case 'estudar': {
      mexerNaNota(v, 5); estresse(3);
      const ex = materiasExtremas(v);
      const d = ex.fraca ?? ex.forte ?? 'linguagens';
      praticar(v, r, d, 0.25, 1.1);
      return r.pick(['Um mês de resumos, exercícios e café. A prova veio — e você sabia.', 'Grupo de estudo na biblioteca, toda tarde. As notas responderam.', 'Você trocou o fim de semana pelo caderno. Valeu.']);
    }
    case 'professor': {
      const ex = materiasExtremas(v);
      const d = ex.fraca ?? 'exatas';
      mexerNaNota(v, 4);
      praticar(v, r, d, 0.35, 1.2);
      const prof = professorDe(v, inst);
      if (prof && v.vinculos[prof.id]) { v.vinculos[prof.id].confianca = clamp(v.vinculos[prof.id].confianca + 5); v.vinculos[prof.id].proximidade = clamp(v.vinculos[prof.id].proximidade + 4); lembrarCom(v, prof.id, `Você pediu ajuda em ${MATERIA(d) ?? 'uma matéria'} — e voltou na semana seguinte.`, 'escola', 1); }
      const texto = `Pediu ajuda em ${MATERIA(d) ?? 'a matéria mais difícil'} depois da aula. ${prof ? `${prof.nome} explicou do zero.` : 'O professor explicou do zero.'}`;
      registrar('professor', texto);
      return `${prof ? prof.nome : 'O professor'} ficou meia hora a mais explicando. Na prova seguinte, a matéria entrou.`;
    }
    case 'festa': {
      v.mente.felicidade = clamp(v.mente.felicidade + 3); estresse(-3);
      const c = colega(v, r);
      mexerNaNota(v, -1);
      if (c) { const vin = v.vinculos[c.id]; vin.proximidade = clamp(vin.proximidade + 6); vin.aproximacao = v.t; vin.tUltimoContato = v.t; lembrarCom(v, c.id, fac ? 'A festa da faculdade em que vocês viraram amigos.' : 'A festa da turma.', 'escola', 1); }
      const texto = c ? `Na festa ${fac ? 'da faculdade' : 'da turma'}, ${c.nome} e você conversaram a noite inteira.` : `Foi à festa ${fac ? 'da faculdade' : 'da turma'} e voltou de madrugada.`;
      registrar('colega', texto);
      return c ? `${texto} Na segunda, já eram outra coisa um do outro.` : `${texto} A segunda-feira foi longa.`;
    }
    case 'grupo': {
      const c = colega(v, r)!;
      const vin = v.vinculos[c.id];
      vin.proximidade = clamp(vin.proximidade + 5); vin.aproximacao = v.t;
      mexerNaNota(v, 2); praticar(v, r, 'linguagens', 0.1, 1); estresse(2);
      const texto = `Puxou o trabalho em grupo; ${c.nome} fez a parte que faltava.`;
      registrar('colega', texto);
      return `${texto} A nota foi a maior da sala — e o grupo continuou junto no bimestre seguinte.`;
    }
    case 'matar': {
      const c = colega(v, r);
      if (c) { const vin = v.vinculos[c.id]; vin.proximidade = clamp(vin.proximidade + 5); vin.aproximacao = v.t; }
      v.mente.felicidade = clamp(v.mente.felicidade + 2);
      mexerNaNota(v, -3);
      if (r.chance(0.3)) {
        // A escola avisa em casa: a família reage.
        for (const x of vinculosVivos(v).filter(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai') && x.vin.convivio.includes('casa'))) x.vin.tensao = clamp(x.vin.tensao + 8);
        registrar('disciplina', 'Matou aula, e a escola ligou para casa.');
        return 'A tarde foi ótima. A ligação da escola para casa, nem tanto: a conversa no jantar foi longa.';
      }
      return c ? `Uma tarde inteira com ${c.nome} e a turma, longe da sala. Ninguém descobriu.` : 'Uma tarde longe da sala. Ninguém descobriu.';
    }
    case 'colar': {
      const pego = r.chance(0.35);
      if (!pego) { mexerNaNota(v, 3); return 'A cola passou de mão em mão — e a nota veio. Ficou o gosto estranho.'; }
      mexerNaNota(v, -6); estresse(4);
      const prof = professorDe(v, inst);
      if (prof && v.vinculos[prof.id]) { v.vinculos[prof.id].confianca = clamp(v.vinculos[prof.id].confianca - 15); v.vinculos[prof.id].tensao = clamp(v.vinculos[prof.id].tensao + 10); }
      if (!fac) for (const x of vinculosVivos(v).filter(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai') && x.vin.convivio.includes('casa'))) x.vin.tensao = clamp(x.vin.tensao + 6);
      const texto = `Foi ${flex(g, 'pego', 'pega', 'pegue')} colando numa prova${fac ? '' : ' — e a escola chamou a família'}.`;
      registrar('disciplina', texto);
      escrever(v, { texto, relevancia: 'cotidiano', tema: fac ? 'estudo' : 'escola', tom: 'ruim', escolha: true });
      return `${prof ? prof.nome : 'O professor'} viu. A prova foi recolhida na hora, com a sala inteira olhando.`;
    }
    case 'projeto': {
      const prof = professorDe(v, inst);
      const aceita = nota(v) >= 60 ? r.chance(0.7) : r.chance(0.35);
      if (!aceita) return `${prof ? prof.nome : 'O professor'} ouviu, elogiou a vontade e disse que não tinha vaga no grupo este ano. Vale tentar de novo.`;
      if (prof && v.vinculos[prof.id]) { v.vinculos[prof.id].confianca = clamp(v.vinculos[prof.id].confianca + 8); lembrarCom(v, prof.id, 'Você entrou no grupo de pesquisa.', 'escola', 2); }
      const area = v.educacao.matricula ? curso(v.educacao.matricula.cursoId).nome : 'o curso';
      v.fatos['formacao:projeto_aceito'] = v.t;
      mexerNaNota(v, 2); estresse(3);
      const texto = `Entrou num projeto de pesquisa em ${area}${prof ? `, com ${prof.nome}` : ''}.`;
      registrar('pesquisa', texto);
      marcar(v, 'conquista', texto, 2);
      escrever(v, { texto, relevancia: 'biografia', tema: 'estudo', tom: 'bom', escolha: true });
      return `${texto} Um laboratório, uma mesa num canto, um problema que ninguém ainda resolveu.`;
    }
    case 'congresso': {
      pagar(v, preco(v, 400));
      const m = v.educacao.matricula;
      const area = m ? curso(m.cursoId).nome : 'a área';
      mexerNaNota(v, 1); v.mente.felicidade = clamp(v.mente.felicidade + 2);
      v.fatos['formacao:contatos'] = (v.fatos['formacao:contatos'] ?? 0) + 1;
      const texto = `Foi a um congresso de ${area} — e voltou com uns contatos e muitas ideias.`;
      registrar('atividade', texto);
      return `${texto} Um cartão de visita de alguém que trabalha onde você quer trabalhar.`;
    }
  }
}
