// VIDA 26 — saves de QA: o ex-atleta aposentado (Depois de competir, hobbies que abrem porta) e o jovem que joga
// videogame há anos e treina futebol (hobby → caminho). OUT=<pasta>/saves.
import { nova, viver } from '../../src/motor/__tests__/ajuda';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { entrarNaBase } from '../../src/motor/sistemas/esporte';
import type { Vida } from '../../src/motor/tipos';
import { mkdirSync, writeFileSync } from 'node:fs';
await carregarMundo();
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/v26/saves`; mkdirSync(OUT, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-${nome}.json`, JSON.stringify(v)); console.log(nome, v.t); };
// 1. O ex-jogador de vôlei, 34 anos, aposentado no ano passado (dez temporadas na elite).
{
  let v = nova({ semente: 2611, genero: 'feminino', municipioId: 'recife-pe' } as never);
  v = viver(v, 33);
  v.trabalho.atual = undefined;
  garantirFrente(v, 'volei').habilidade = 84;
  v.caminhos.esporte = { modalidade: 'volei', fase: 'encerrada', clube: 'equipe de vôlei de Recife', nivel: 4, tInicio: v.t - 16 * 12, tFase: v.t - 14 * 12, tFim: v.t - 6, lesoes: 1, municipioId: 'recife-pe', reputacao: 58, motivoFim: 'escolha',
    temporadas: Array.from({ length: 12 }, (_, k) => ({ ano: 2014 + k, clube: 'equipe de vôlei de Recife', nivel: k < 2 ? 3 : 4, partidas: 24, titular: 20, gols: 0, assistencias: 0, nota: 7, colocacao: k === 6 ? 1 : 4, mesesFora: 0 })) as never };
  v.rotinas = v.rotinas.filter(r => r.id !== 'volei');
  v.rotinas.push({ id: 'musica', tInicio: v.t - 60, nivel: 1 });
  salvar('v26-aposentada', v);
}
// 2. O jovem de 15: futebol a sério e videogame há anos.
{
  let v = nova({ semente: 2612, genero: 'masculino', municipioId: 'sao-paulo-sp' } as never);
  v = viver(v, 15);
  v.rotinas = v.rotinas.filter(r => r.id !== 'futebol' && r.id !== 'videogame');
  v.rotinas.push({ id: 'futebol', tInicio: v.t - 60, nivel: 2 }, { id: 'videogame', tInicio: v.t - 72, nivel: 1 });
  garantirFrente(v, 'futebol').habilidade = 64;
  salvar('v26-jovem', v);
}
// 3. O menino de 13 na base com técnica alta (a leitura da comissão).
{
  let v = nova({ semente: 2613, genero: 'masculino', municipioId: 'recife-pe' } as never);
  v = viver(v, 12);
  garantirFrente(v, 'futebol').habilidade = 80;
  entrarNaBase(v, 'futebol', v.moradia.municipioId, 'Sport');
  v = viver(v, 1);
  salvar('v26-base13', v);
}
