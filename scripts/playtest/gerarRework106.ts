/**
 * Saves das cenas do REWORK 10.6 (`rework106.mjs`), vividos pelo motor (a pré-condição de cada cena é dita e conferida):
 *   formada-medio   18 anos, médio concluído, sem curso nem trabalho: Caminhos · Estudos e a entrada da faculdade
 *   aprovada        19 anos, aprovada em Direito (a matrícula esperando confirmação)
 *   empregada       30 anos, assistente administrativa: as ações principais do trabalho
 *   goleiro         22 anos, goleiro profissional: "Em andamento" e o treino da posição
 *   convite         15 anos, um professor chamou para um projeto (o convite com prazo no painel)
 *   crianca10       10 anos, 193 no cofrinho, a chuteira custa mais: o pedido aos responsáveis na loja
 *   crianca7        7 anos: "Pedir aos adultos" nas compras da criança
 *   tratando        50 anos, hipertensão em tratamento (parar, com o risco dito antes)
 *   conflito        16 anos, aprendiz da manhã com a escola da manhã (o save antigo que a agenda acusa)
 *
 *   npx esbuild scripts/playtest/gerarRework106.ts --bundle --platform=node --outfile=<scratch>/g.cjs && OUT=<pasta>/saves node <scratch>/g.cjs
 *   (e gerarRework105.ts no mesmo OUT: formado, atriz, militante)
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { nova, viverAte } from '../../src/motor/__tests__/ajuda';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { idade, transacao } from '../../src/motor/nucleo';
import { criarRng } from '../../src/motor/rng';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { novaOportunidade } from '../../src/motor/sistemas/oportunidades';
import { responsaveis } from '../../src/motor/sistemas/origem';
import { agendaDaSemana } from '../../src/motor/sistemas/agenda';
import type { Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { v.momento = null; v.caminhos.pendente = undefined; writeFileSync(`${OUT}/vida-r106-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const em = (v: Vida, f: (x: Vida) => void) => transacao(v, x => { f(x); }).vida;
const exigir = (ok: boolean, o: string) => { if (!ok) throw new Error(`pré-condição: ${o}`); };

async function principal() {
  await carregarMundo();
  const medio = em(viverAte(nova({ semente: 1061, municipioId: 'recife-pe' }), 18), x => { x.educacao.basica = undefined; x.educacao.matricula = undefined; x.educacao.escolaridade = 'medio'; x.trabalho.atual = undefined; x.financas.conta = 8000; });
  salvar('formada-medio', medio);
  salvar('aprovada', em(medio, x => { x.t += 12; x.educacao.aprovacao = { novo: { tipo: 'curso', cursoId: 'direito', via: 'privada', modalidade: 'presencial', rede: 'privada', mensalidade: 900, municipioId: x.moradia.municipioId, instituicao: 'Faculdade do Recife' }, nome: 'Direito, Faculdade do Recife', t: x.t, tAte: x.t + 12 }; }));
  salvar('empregada', em(adulto(30, { semente: 1062 }), x => { contratar(x, criarRng(1), ocupacao('assistente_adm')); }));
  salvar('goleiro', em(adulto(22, { semente: 1063, genero: 'masculino' }), x => {
    contratar(x, criarRng(1), ocupacao('jogador_futebol'));
    x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Sport', nivel: 3, tInicio: x.t - 60, tFase: x.t - 24, lesoes: 0, municipioId: x.moradia.municipioId, reputacao: 45, posicao: 'goleiro', espaco: 'titular' };
  }));
  salvar('convite', em(viverAte(nova({ semente: 1064, municipioId: 'recife-pe' }), 15), x => {
    const p = criarPessoa(x, criarRng(7), { idade: 45, genero: 'masculino', municipioId: x.moradia.municipioId });
    p.nome = 'Francisco';
    vincular(x, p, { origem: 'escola', proximidade: 60 });
    const o = novaOportunidade(x, { tipo: 'iniciacao', meses: 12, chave: 'cena106', titulo: 'Francisco chamou para um projeto', texto: 'O professor de ciências quer você no projeto da feira: duas tardes por semana, depois da aula.', pessoaId: p.id, atividade: 'projeto_escola' });
    exigir(!!o, 'convite criado');
  }));
  const crianca = (anos: number, semente: number) => {
    let s = semente;
    let v = viverAte(nova({ semente: s, municipioId: 'recife-pe' }), anos);
    while (v.morte || !responsaveis(v).length) v = viverAte(nova({ semente: ++s, municipioId: 'recife-pe' }), anos);
    return em(v, x => { x.financas.conta = 193; });
  };
  salvar('crianca10', crianca(10, 1065));
  salvar('crianca7', crianca(7, 1066));
  salvar('tratando', em(adulto(50, { semente: 1067 }), x => { x.corpo.condicoes = [{ id: 'hipertensao', nome: 'hipertensão', tInicio: x.t - 60, cronica: true, gravidade: 2, tratando: true, diagnosticada: true, tDiagnostico: x.t - 60, tTratamento: x.t - 36 }]; }));
  let c = 1068;
  let jovem = viverAte(nova({ semente: c, municipioId: 'recife-pe' }), 16);
  while (jovem.morte || jovem.educacao.basica?.etapa !== 'medio') jovem = viverAte(nova({ semente: ++c, municipioId: 'recife-pe' }), 16);
  const conflito = em(jovem, x => { x.trabalho.atual = undefined; contratar(x, criarRng(2), ocupacao('jovem_aprendiz')); x.agenda = { turnos: { escola: 'manha', trabalho: 'manha' } }; });
  exigir(agendaDaSemana(conflito).conflitos.some(k => k.perde === 'escola'), 'escola e trabalho no mesmo horário');
  salvar('conflito', conflito);
}

void principal();
