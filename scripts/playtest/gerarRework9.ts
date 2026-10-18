/**
 * Saves das cenas do REWORK 9 (`rework9.mjs`), vividas pelo motor (ações de verdade, anos por `avancarAno`), junto com
 * as do REWORK 6/7/7.5 na mesma pasta:
 *   conflito    16 anos, ensino médio de manhã, futebol marcado às 16h e o meio período da tarde (o conflito na agenda)
 *   faculdade   24 anos, emprego integral e a faculdade à noite (Caminhos com os dois lados; a agenda cheia)
 *   rede        26 anos, Instagram de um ano fechado, o nome crescendo (o balanço com a causa)
 *   promovido   23 anos, atacante campeão da Série B (a temporada seguinte na Série A)
 *   npx esbuild scripts/playtest/gerarRework9.ts --bundle --platform=node --outfile=<scratch>/g9.cjs && OUT=<pasta> node <scratch>/g9.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { executar, type Acao } from '../../src/motor/acoes';
import { responderTudo } from '../../src/motor/__tests__/ajuda';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { idade, transacao } from '../../src/motor/nucleo';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { registrarTemporada } from '../../src/motor/sistemas/palmares';
import { temporadaCorrente } from '../../src/motor/sistemas/ligas';
import type { Temporada, Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-r9-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const tentar = (v: Vida, a: Acao): Vida => responderTudo(executar(v, a).vida);
const ano = (v: Vida) => { const n = responderTudo(avancarAno(v).vida); n.momento = null; return n; };

async function principal() {
  await carregarMundo();

  let c = transacao(adulto(16, { semente: 41 }), x => {
    x.trabalho.atual = undefined;
    x.educacao.basica = { etapa: 'medio', serie: 1, rede: 'publica', desempenho: 62, reprovacoes: 0 };
    x.educacao.evadiu = false; x.educacao.matricula = undefined;
    x.rotinas = [{ id: 'futebol', tInicio: x.t - 24, nivel: 2 }, { id: 'musica', tInicio: x.t - 12, nivel: 1 }];
    x.agenda = { turnos: { escola: 'manha' }, lugares: { futebol: { dias: [0, 2, 4], inicio: 16 * 60 } } };
  }).vida;
  c = transacao(c, (x, r) => { contratar(x, r, ocupacao('jovem_aprendiz')); x.agenda!.turnos!.trabalho = 'tarde'; }).vida;
  salvar('conflito', c);

  let f = transacao(adulto(24, { semente: 8 }), (x, r) => {
    x.trabalho.atual = undefined; contratar(x, r, ocupacao('assistente_adm'));
    x.educacao.matricula = { cursoId: 'administracao', instituicao: 'Faculdade da Cidade', rede: 'privada', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 40, mensalidade: 800, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId };
    x.rotinas = [{ id: 'academia', tInicio: x.t - 24, nivel: 2 }];
  }).vida;
  f = ano(f);
  salvar('faculdade', f);

  let s = transacao(adulto(26, { semente: 61 }), x => { x.financas.conta = 500000; }).vida;
  s = tentar(s, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } });
  for (let k = 0; k < 3; k++) s = tentar(s, { tipo: 'rede', op: { oque: 'publicar', plataforma: 'instagram', tema: 'cotidiano' } });
  s = ano(s);
  s = transacao(s, x => { x.notoriedade = { valor: 58, pico: 58, t: x.t, fonte: 'arte', origens: { arte: 58 } }; }).vida;
  s = ano(s);
  salvar('rede', s);

  let a = transacao(adulto(23, { municipioId: 'belem-pa', semente: 12 }), x => {
    x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Paysandu', nivel: 3, tInicio: x.t - 48, tFase: x.t - 36, lesoes: 0, municipioId: 'belem-pa', reputacao: 52, espaco: 'titular', contratoAte: x.t + 60, posicao: 'atacante', temporadas: [] };
    x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Paysandu', contrato: 'clt', salario: 25000, tInicio: x.t - 36, desempenho: 70, municipioId: 'belem-pa', carga: 'integral' };
  }).vida;
  a = transacao(a, (x, r) => {
    const e = x.caminhos.esporte!;
    const t: Temporada = { ano: temporadaCorrente(x), clube: e.clube, nivel: 3, posicao: 'atacante', partidas: 36, titular: 34, gols: 19, assistencias: 5, nota: 7.6, colocacao: 1, mesesFora: 0, minutos: 2900 };
    (e.temporadas ??= []).push(t);
    registrarTemporada(x, r, e, t);
  }).vida;
  a = ano(a);
  salvar('promovido', a);
}
void principal();
