/**
 * Saves das cenas do REWORK 9.5 (`rework95.mjs`), vividas pelo motor, junto com as do REWORK 6/7/7.5/8/9 na mesma pasta:
 *   playtest   9 anos, a criança do playtest: escola, futebol duas vezes, leitura, xadrez (a rotina, o boletim)
 *   dedicada   a mesma criança, um ano depois, estudando com dedicação (o estudo em casa na agenda, o resultado no boletim)
 *   tecnico    17 anos, técnico concluído, procurando o primeiro emprego (a hierarquia de Caminhos)
 *   npx esbuild scripts/playtest/gerarRework95.ts --bundle --platform=node --outfile=<scratch>/g95.cjs && OUT=<pasta> node <scratch>/g95.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { executar } from '../../src/motor/acoes';
import { nova, responderTudo, viverAte } from '../../src/motor/__tests__/ajuda';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { idade, transacao } from '../../src/motor/nucleo';
import { curso } from '../../src/motor/dados/cursos';
import type { Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-r95-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const ano = (v: Vida) => { const n = responderTudo(avancarAno(v).vida); n.momento = null; return n; };

async function principal() {
  await carregarMundo();

  let c = viverAte(nova({ semente: 77, genero: 'masculino' }), 8);
  c = transacao(c, x => {
    x.momento = null;
    x.rotinas = [{ id: 'futebol', tInicio: x.t, nivel: 2 }, { id: 'leitura', tInicio: x.t, nivel: 1 }, { id: 'xadrez', tInicio: x.t, nivel: 2 }];
  }).vida;
  c = ano(c);
  salvar('playtest', c);

  let d = executar(c, { tipo: 'postura', valor: 'dedicada' }).vida;
  d = ano(d);
  salvar('dedicada', d);

  const t = transacao(adulto(17, { semente: 29 }), x => {
    const tc = curso('tec_informatica');
    x.trabalho.atual = undefined;
    x.educacao.basica = undefined; x.educacao.matricula = undefined; x.educacao.evadiu = false;
    x.educacao.escolaridade = 'tecnico';
    x.educacao.concluidos.push({ cursoId: tc.id, nome: tc.nome, nivel: tc.nivel, area: tc.area, tFim: x.t - 6, instituicao: 'a escola técnica' });
    x.rotinas = [{ id: 'videogame', tInicio: x.t - 24, nivel: 1 }];
  }).vida;
  salvar('tecnico', t);
}
void principal();
