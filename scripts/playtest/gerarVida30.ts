// VIDA 30 — saves de QA: o dono de clube, a fazenda com gado demais, a pessoa famosa (o meio, as redes, a Twitch), o
// atleta da base com proposta de outro clube e a comentarista do pós-carreira. OUT=<pasta>.
import { nova, viver } from '../../src/motor/__tests__/ajuda';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { executar, type Acao } from '../../src/motor/acoes';
import { ofertasRurais } from '../../src/motor/v18/rural/acoes18';
import { capacidadeUA, todasAsPropriedades } from '../../src/motor/v18/rural/fazenda18';
import { garantirRede30, anoDaRede30, conhecerFigura30 } from '../../src/motor/v30/fama/rede30';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { entrarNaBase } from '../../src/motor/sistemas/esporte';
import { mercadoDaBase30 } from '../../src/motor/sistemas/base30';
import { anoDoOficio30 } from '../../src/motor/v30/oficio/oficio30';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { mkdirSync, writeFileSync } from 'node:fs';
await carregarMundo();
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/v30/saves`; mkdirSync(OUT, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; delete v.fila; writeFileSync(`${OUT}/vida-v30-${nome}.json`, JSON.stringify(v)); console.log(nome, 'ok'); };
const ex = (v: Vida, a: Acao) => { const r = executar(v, a); r.vida.momento = null; return r.vida; };

// 1. O dono de clube.
{ let v = viver(nova({ semente: 3001, genero: 'masculino', municipioId: 'recife-pe' } as never), 42); v.financas.conta = 4e8; v.financas.negativado = false; v.momento = null;
  v = ex(v, { tipo: 'clube20', oque: { op: 'comprar', nome: 'Náutico', pais: 'BR' } } as Acao); salvar('clube', v); }
// 2. A fazenda com gado demais e solo cansado.
{ let v = viver(nova({ semente: 3002, genero: 'feminino', municipioId: 'uberlandia-mg' } as never), 40); v.financas.conta = 4e7; v.financas.negativado = false; v.momento = null;
  const o = ofertasRurais(v).find(x => x.p.tipo === 'pecuaria'); if (o) v = ex(v, { tipo: 'rural18', oque: { op: 'comprar', oferta: o.id } } as Acao);
  const p = todasAsPropriedades(v)[0]?.p; if (p) { if (p.uso !== 'producao') v = ex(v, { tipo: 'rural18', oque: { op: 'uso', id: p.id, uso: 'producao' } } as Acao); const q = todasAsPropriedades(v)[0].p; if (!q.rebanhos.length) q.rebanhos.push({ especie: 'corte', cabecas: 100, genetica: 45, sanidade: 48, alimentacao: 'pasto', estrategia: 'manter', sanitario: 'basico' }); q.rebanhos[0].cabecas = Math.round(capacidadeUA(q) * 1.6); q.rebanhos[0].sanidade = 45; q.solo = 34; }
  salvar('campo', v); }
// 3. A pessoa famosa: o nome, o meio (com uma figura conhecida), as redes (Twitch e Instagram).
{ let v = viver(nova({ semente: 3003, genero: 'feminino', municipioId: 'sao-paulo-sp' } as never), 27); v.financas.conta = 2e6; v.momento = null;
  v.notoriedade = { valor: 62, pico: 62, fonte: 'arte', t: v.t, origens: { arte: 62 } };
  const m = garantirRede30(v); for (let k = 0; k < 4; k++) { v.t += 12; anoDaRede30(v); } conhecerFigura30(v, criarRng(1), m.figuras[0], 'a noite de premiação do ano', 40);
  v.eu.atracao = 'ambos';
  for (const pl of ['twitch', 'instagram', 'youtube'] as const) { v = ex(v, { tipo: 'rede', op: { oque: 'criar', plataforma: pl } } as Acao); }
  for (const [pl, tema] of [['twitch', 'jogo'], ['instagram', 'pet'], ['youtube', 'receita'], ['instagram', 'humor']] as const) v = ex(v, { tipo: 'rede', op: { oque: 'publicar', plataforma: pl, tema } } as Acao);
  salvar('famosa', v); }
// 4. O atleta da base com a proposta de outro clube aberta.
{ let v = viver(nova({ semente: 3004, genero: 'masculino', municipioId: 'campinas-sp' } as never), 15); v.momento = null;
  entrarNaBase(v, 'futebol', 'campinas-sp', 'Guarani'); const e = v.caminhos.esporte!; e.tInicio = e.tFase = v.t - 24;
  e.formacao = [{ ano: Math.floor(v.t / 12) - 1, idade: 15, categoria: 'sub-15', clube: 'Guarani', competicao: 'campeonato estadual sub-15', jogos: 18, titular: 17, nota: 8.7, tecnica: 72, colocacao: 1, participantes: 16, titulo: true, avaliacao: 'O melhor da categoria.' }];
  for (let k = 0; k < 60 && !mercadoDaBase30(v, e); k++) v.t += 1;
  salvar('base', v); }
// 5. A comentarista (pós-carreira) com alguns anos de ofício.
{ let v = viver(nova({ semente: 3005, genero: 'feminino', municipioId: 'rio-de-janeiro-rj' } as never), 38); v.momento = null;
  contratar(v, criarRng(5), ocupacao('comentarista_esportivo')); const o = v.oficio30; void o;
  for (let k = 0; k < 4; k++) { v.t += 12; anoDoOficio30(v, false); }
  v.oficio30!.estilo = 'tecnico';
  salvar('oficio', v); }
