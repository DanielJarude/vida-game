/**
 * REWORK 4 — "a vida acontece; às vezes você decide": as poucas decisões da
 * formação. A maior parte do que acontece na escola e na faculdade é sozinha
 * (`sistemas/vidaEstudantil`); aqui, os momentos em que dá para intervir:
 *   - a prova que decide o ano (estudar, colar, aceitar a recuperação);
 *   - na faculdade, estágio ou pesquisa (cada um abre uma porta diferente:
 *     a carreira ou a academia);
 *   - o boato na escola (confrontar, contar a um adulto, deixar passar).
 *
 * Elegibilidade por sorteio DERIVADO (`rngDe`) e sem papéis sorteados — o
 * acaso do resto da vida não muda quando estas decisões não acontecem.
 */

import { nomeDaMateria } from '../mundo/materias';
import type { Conteudo, Ctx } from './base';
import { clamp, rngDe } from '../rng';
import { lembrarCom, vinculosVivos } from '../nucleo';
import { curso } from '../dados/cursos';
import { ocupacao } from '../dados/ocupacoes';
import { materiasExtremas, praticar } from '../sistemas/frentes';
import { instituicaoAtual, ofereceAqui } from '../sistemas/formacao';
import { novaOportunidade } from '../sistemas/oportunidades';
import { registrarNaFormacao } from '../sistemas/vidaEstudantil';
import { estresse, feliz } from './efeitos';
import { memoriaContavel, narrarMemoria } from './narracao';

/** O nome da matéria: fonte única (`mundo/materias`, a língua de onde se estuda). */
const MATERIA = new Proxy({} as Record<string, string>, { get: (_o, k: string) => (['exatas', 'linguagens', 'ciencias', 'humanas'].includes(k) ? nomeDaMateria(k) : undefined) });
const ano = (c: Ctx) => Math.floor(c.v.t / 12);
const materiaFraca = (c: Ctx) => materiasExtremas(c.v).fraca;
const anoDoCurso = (c: Ctx) => { const m = c.v.educacao.matricula; return m ? Math.floor((c.v.t - m.tInicio) / 12) + 1 : 0; };
const nomeInst = (c: Ctx) => instituicaoAtual(c.v)?.nome ?? 'a escola';
const lembrar = (c: Ctx, tipo: string, texto: string) => registrarNaFormacao(c.v, { t: c.v.t, idade: c.idade, instituicao: nomeInst(c), tipo, texto });

/** O colega do boato: alguém da escola que não é da família (escolhido sem gastar o acaso da vida). */
function colegaDoBoato(c: Ctx) {
  const xs = vinculosVivos(c.v).filter(x => !x.p.especie && !x.vin.parentesco && !x.vin.romance && x.vin.convivio.includes('escola'));
  if (!xs.length) return undefined;
  return xs[Math.floor(rngDe(c.v.id, 'boato', ano(c)).next() * xs.length)];
}

const ESTAGIO_DA_AREA: Record<string, string> = { computacao: 'estagio_ti', exatas: 'estagio_ti', direito: 'estagio_direito', engenharia_civil: 'estagio_eng', engenharia: 'estagio_eng', administracao: 'estagio_adm', contabilidade: 'estagio_adm', economia: 'estagio_adm' };

export const VIVIDA: Conteudo[] = [
  {
    // A memória que volta: o FATO da infância (não a frase) contado de novo por quem estava lá — continuidade, não cópia.
    id: 'mem_historia_da_familia', tipo: 'acontecimento', idade: [22, 60], tema: 'familia', prioritario: true,
    quando: c => !!memoriaContavel(c.v) && rngDe(c.v.id, 'memoria', ano(c)).chance(0.07),
    narrar: c => { const m = memoriaContavel(c.v)!; return { texto: narrarMemoria(c.v, rngDe(c.v.id, 'memoria_texto', ano(c)), m), relevancia: 'cotidiano', efeito: () => { const vin = c.v.vinculos[m.quem.id]; if (vin) vin.proximidade = clamp(vin.proximidade + 2); } }; }
  },
  {
    id: 'vest_prova_decisiva', tipo: 'decisao', idade: [13, 17], tema: 'escola', prioritario: true,
    quando: c => !!c.v.educacao.basica && !!materiaFraca(c) && (c.v.educacao.basica.desempenho < 65) && rngDe(c.v.id, 'prova_decisiva', ano(c)).chance(0.2),
    titulo: 'A prova que decide',
    texto: c => `A prova final de ${MATERIA[materiaFraca(c)!] ?? 'matemática'} vai decidir se você passa de ano sem recuperação. Faltam três semanas — e a matéria nunca entrou direito.`,
    opcoes: [
      { id: 'estudar', texto: 'Estudar todo dia, até a prova', comportamento: { disciplina: 2 }, consequencia: () => 'Três semanas sem descanso. A nota depende de quanto entra até lá.',
        resolver: c => {
          const d = materiaFraca(c)!;
          const deu = c.r.chance(0.45 + (c.v.mente.cognicao - 50) / 120);
          return { texto: deu ? 'Na véspera, a matéria finalmente fez sentido. Você passou — por pouco, mas passou.' : 'Você estudou como nunca. A nota veio abaixo do que precisava; a recuperação ficou mais leve.', memoria: deu ? `Estudou três semanas para a prova de ${MATERIA[d]} — e passou.` : null, relevancia: 'cotidiano', tom: deu ? 'bom' : 'neutro',
            efeito: () => { praticar(c.v, rngDe(c.v.id, 'prova_estudo', ano(c)), d, 0.6, 1.2); estresse(c, 6); const b = c.v.educacao.basica!; b.desempenho = clamp(b.desempenho + (deu ? 7 : 3)); lembrar(c, 'prova', deu ? `A prova de ${MATERIA[d]} que decidia o ano: três semanas de estudo, e passou.` : `A prova de ${MATERIA[d]}: estudou muito, e mesmo assim foi para a recuperação.`); } };
        } },
      { id: 'colar', texto: 'Preparar uma cola', comportamento: { impulsividade: 2 }, consequencia: () => 'Se der certo, ninguém fica sabendo. Se não der...',
        resolver: c => {
          const pego = c.r.chance(0.32);
          return { texto: pego ? 'A professora viu a cola na manga. Zero na prova, bilhete para casa, três dias de suspensão.' : 'Ninguém viu. A nota veio — e a matéria continuou sem entrar.', memoria: pego ? 'Foi pego colando numa prova e levou suspensão.' : null, relevancia: pego ? 'biografia' : 'cotidiano', tom: pego ? 'ruim' : 'neutro',
            efeito: () => { const b = c.v.educacao.basica!; if (pego) { b.desempenho = clamp(b.desempenho - 6); estresse(c, 8); c.v.fatos['suspenso'] = c.v.t; lembrar(c, 'disciplina', 'Pego colando: zero e suspensão.'); } else b.desempenho = clamp(b.desempenho + 1); } };
        } },
      { id: 'aceitar', texto: 'Fazer o que der e encarar a recuperação', consequencia: () => 'Sem desespero — e sem a nota.',
        resolver: c => ({ texto: 'Você fez a prova com calma e foi para a recuperação. Não acabou o mundo.', memoria: null, efeito: () => { const b = c.v.educacao.basica!; b.desempenho = clamp(b.desempenho - 3); estresse(c, -2); } }) }
    ]
  },
  {
    id: 'vest_estagio_ou_pesquisa', tipo: 'decisao', idade: [18, 40], tema: 'estudo', prioritario: true,
    quando: c => { const m = c.v.educacao.matricula; if (!m || m.trancado || curso(m.cursoId).nivel !== 'superior') return false; const a = anoDoCurso(c); return a >= 2 && a <= 4 && !c.v.trabalho.atual && ofereceAqui(c.v, 'iniciacao') && !!ESTAGIO_DA_AREA[curso(m.cursoId).area] && rngDe(c.v.id, 'estagio_pesquisa', ano(c)).chance(0.3); },
    titulo: 'Estágio ou pesquisa',
    texto: c => `No meio de ${curso(c.v.educacao.matricula!.cursoId).nome}, apareceram duas portas ao mesmo tempo: um estágio numa empresa da cidade e uma vaga de iniciação científica com um professor do curso. As duas pedem a mesma semana.`,
    opcoes: [
      { id: 'estagio', texto: 'Ir para o estágio', comportamento: { independencia: 1 }, consequencia: () => 'Dinheiro, crachá e a primeira linha no currículo. A pesquisa fica para outra vez.',
        resolver: c => { const oc = ESTAGIO_DA_AREA[curso(c.v.educacao.matricula!.cursoId).area]; return { texto: 'Você disse sim para o estágio. A vaga é sua se a entrevista confirmar.', memoria: null, efeito: () => { novaOportunidade(c.v, { tipo: 'estagio', ocupacaoId: oc, meses: 6, chave: 'estagio_escolhido', bonus: 0.4, titulo: `Estágio: ${ocupacao(oc).nome[c.v.eu.genero === 'feminino' ? 1 : 0]}`, texto: 'O estágio que você escolheu no lugar da pesquisa: falta a entrevista.' }); lembrar(c, 'estagio', 'Escolheu o estágio no lugar da iniciação científica.'); } }; } },
      { id: 'pesquisa', texto: 'Ficar com a pesquisa', comportamento: { disciplina: 1 }, consequencia: () => 'Bolsa pequena, laboratório, um orientador — e a porta da academia.',
        resolver: c => ({ texto: 'Você escolheu a pesquisa. O professor mandou três artigos para ler até sexta.', memoria: null, efeito: () => { novaOportunidade(c.v, { tipo: 'iniciacao', meses: 6, chave: 'pesquisa_escolhida', atividade: 'iniciacao', titulo: 'Iniciação científica', texto: 'A vaga no grupo de pesquisa que você escolheu: é só começar.' }); lembrar(c, 'pesquisa', 'Escolheu a iniciação científica no lugar do estágio.'); } }) },
      { id: 'notas', texto: 'Nenhuma: focar nas disciplinas', consequencia: () => 'As notas sobem; a experiência fica para depois.',
        resolver: c => ({ texto: 'Você agradeceu as duas portas e voltou para as listas de exercício.', memoria: null, efeito: () => { const m = c.v.educacao.matricula!; m.desempenho = clamp(m.desempenho + 5); } }) }
    ]
  },
  {
    id: 'vest_boato', tipo: 'decisao', idade: [11, 16], tema: 'escola', prioritario: true,
    quando: c => !!c.v.educacao.basica && !!colegaDoBoato(c) && rngDe(c.v.id, 'boato_q', ano(c)).chance(0.12),
    titulo: 'O que se espalhou',
    texto: c => `${colegaDoBoato(c)!.p.nome} contou para a sala inteira uma coisa que você tinha dito em segredo. Agora todo mundo sabe — e alguns riem quando você passa.`,
    opcoes: [
      { id: 'confrontar', texto: c => `Ir tirar satisfação com ${colegaDoBoato(c)!.p.nome}`, comportamento: { coragem: 2 },
        resolver: c => { const x = colegaDoBoato(c)!; const pede = x.p.temperamento.afabilidade > 0.1; return { texto: pede ? `${x.p.nome} ficou vermelh${x.p.genero === 'feminino' ? 'a' : 'o'} e pediu desculpas na frente de todo mundo.` : `${x.p.nome} riu na sua cara. A briga quase saiu do corredor.`, memoria: null, tom: pede ? 'bom' : 'ruim',
          efeito: () => { const vin = c.v.vinculos[x.p.id]; if (pede) { vin.tensao = clamp(vin.tensao + 5); vin.confianca = clamp(vin.confianca - 5); lembrarCom(c.v, x.p.id, 'Espalhou um segredo seu — e pediu desculpas quando você cobrou.', 'conflito', 1); } else { vin.tensao = clamp(vin.tensao + 30); vin.proximidade = clamp(vin.proximidade - 10); vin.conflito = { t: c.v.t, assunto: 'o segredo espalhado', gravidade: 2, quem: 'outro' }; lembrarCom(c.v, x.p.id, 'Espalhou um segredo seu, e riu quando você cobrou.', 'conflito', 2); } lembrar(c, 'conflito', `${x.p.nome} espalhou um segredo seu; você foi tirar satisfação.`); } }; } },
      { id: 'adulto', texto: 'Contar para a coordenação', comportamento: { disciplina: 1 },
        resolver: c => { const x = colegaDoBoato(c)!; return { texto: `A coordenação chamou ${x.p.nome} e os pais. Parou — mas a turma passou a chamar você de dedo-duro por um tempo.`, memoria: null, efeito: () => { c.v.vinculos[x.p.id].tensao = clamp(c.v.vinculos[x.p.id].tensao + 15); estresse(c, 2); lembrar(c, 'conflito', 'Um segredo espalhado na escola; a coordenação resolveu.'); } }; } },
      { id: 'ignorar', texto: 'Fingir que não ligou', comportamento: { impulsividade: -1 },
        resolver: c => ({ texto: 'Você fingiu que não era com você. Em duas semanas, a sala tinha outro assunto — mas você não esqueceu.', memoria: null, efeito: () => { estresse(c, 4); feliz(c, -3); } }) }
    ]
  }
];
