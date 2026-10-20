/**
 * Saves das cenas do REWORK 9.7 (`rework97.mjs`), vividos pelo motor — os casos da auditoria:
 *   aluno16      16 anos, dedicada, no médio: o boletim com a nota do ano (0–10) e o conhecimento, e o histórico
 *   lisboa15     15 anos em Portugal: o boletim na escala de 0 a 20
 *   jogador23    23 anos, joga bola a sério no amador, técnica de estadual: a porta do time adulto em Caminhos
 *   crianca4     9 anos com futebol a sério, arte marcial, dança e natação: a semana "sobrecarregada" da criança
 *   famoso       27 anos, conta de 40 mil, um acontecimento público (a convocação) e o salto com a causa na vida
 *   npx esbuild scripts/playtest/gerarRework97.ts --bundle --platform=node --outfile=<scratch>/g97.cjs && OUT=<pasta> node <scratch>/g97.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { nova, viverAte } from '../../src/motor/__tests__/ajuda';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade, transacao } from '../../src/motor/nucleo';
import { contaAtiva, fecharBalanco } from '../../src/motor/sistemas/redesBase';
import type { Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-r97-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), v.moradia.municipioId, JSON.stringify(v).length); };
const resolver = (v: Vida) => { for (let k = 0; k < 12 && v.momento; k++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida; return v; };

async function principal() {
  await carregarMundo();
  let a = nova({ semente: 971, municipioId: 'recife-pe' });
  while (idade(a) < 16) { a = resolver(avancarAno(a).vida); if (idade(a) >= 7) a = transacao(a, x => { x.educacao.postura = 'dedicada'; }).vida; }
  salvar('aluno16', a);

  const lisboa = cidadesDoPais('PT')[0].id;
  salvar('lisboa15', viverAte(nova({ semente: 972, municipioId: lisboa }), 15));

  const j = transacao(adulto(23, { semente: 973, genero: 'masculino', municipioId: 'belem-pa' }), x => {
    x.trabalho.atual = undefined;
    x.rotinas = x.rotinas.filter(r => r.id !== 'futebol');
    x.rotinas.push({ id: 'futebol', tInicio: x.t - 120, nivel: 2 });
    x.caminhos.frentes.futebol = { interesse: 90, meses: 200, habilidade: 77, tInicio: x.t - 200, tUltimo: x.t, retomadas: 0, auge: 77 };
    x.corpo.forma = 74;
  }).vida;
  salvar('jogador23', j);

  const c = transacao(viverAte(nova({ semente: 974, municipioId: 'sao-paulo-sp' }), 9), x => {
    x.rotinas = [{ id: 'futebol', tInicio: x.t - 12, nivel: 2 }, { id: 'lutas', tInicio: x.t - 12, nivel: 1 }, { id: 'danca', tInicio: x.t - 12, nivel: 1 }, { id: 'natacao', tInicio: x.t, nivel: 1 }];
    x.agenda = undefined;
  }).vida;
  salvar('crianca4', c);

  let f = transacao(adulto(27, { semente: 975 }), x => { x.financas.conta = 1e6; x.notoriedade = { valor: 55, pico: 55, t: x.t, fonte: 'esporte', origens: { esporte: 55 } }; }).vida;
  f = executar(f, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } } as Parameters<typeof executar>[1]).vida;
  f = transacao(f, x => {
    const cc = contaAtiva(x, 'instagram')!;
    fecharBalanco(cc, x.t, 55);
    cc.seguidores = 40000;
    cc.balanco = { desde: x.t, inicio: 40000, organico: 0, publicacoes: 0, exposicao: 0, comprados: 0, perdas: 0, famaInicio: 55 };
    x.notoriedade = { valor: 82, pico: 82, t: x.t, fonte: 'esporte', origens: { esporte: 82 } };
    x.biografia.push({ id: `e${x.seq++}`, t: x.t - 2, idade: idade(x), texto: 'Foi convocado para a seleção pela primeira vez.', relevancia: 'marco', tema: 'trabalho', tom: 'bom' } as never);
  }).vida;
  f = resolver(avancarAno(f).vida);
  salvar('famoso', f);
}
void principal();
