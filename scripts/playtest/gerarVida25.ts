// VIDA 25 — saves para a QA visual: um jogador de e-sports com equipe e temporadas, um atleta da base do futebol com anos
// de formação, um profissional de vôlei com ficha comparável, uma pessoa de 18 anos (o lembrete da CNH).
// OUT=<pasta> npx esbuild scripts/playtest/gerarVida25.ts --bundle --platform=node --format=esm --outfile=X.mjs && node X.mjs
import { nova, viver } from '../../src/motor/__tests__/ajuda';
import { executar, type Acao } from '../../src/motor/acoes';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import type { Vida } from '../../src/motor/tipos';
import { mkdirSync, writeFileSync } from 'node:fs';
await carregarMundo();
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/v25/saves`;
mkdirSync(OUT, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-${nome}.json`, JSON.stringify(v)); console.log(nome, v.t, v.esports25?.fase ?? v.caminhos.esporte?.fase ?? ''); };
const aos = (idade: number, s: number, o: Record<string, unknown> = {}) => { const v = nova({ semente: s, genero: s % 2 ? 'feminino' : 'masculino', municipioId: 'recife-pe', ...o } as never); v.t = v.eu.tNasc + idade * 12; v.momento = null; return v; };

// 1. e-sports: começa aos 14 no VALORANT, treina pesado, peneira todo ano, aceita propostas.
{
  let v = aos(14, 2511);
  v = executar(v, { tipo: 'esports25', oque: { op: 'comecar', jogo: 'valorant' } } as Acao).vida;
  for (let k = 0; k < 8; k++) {
    const e = v.esports25!;
    const r = v.rotinas.find(x => x.id === 'esports'); if (r) r.nivel = 3;
    for (const a of [{ op: 'treinar', foco: 'mecanica' }, ...(e.proposta ? [{ op: 'aceitar' }] : []), ...(!e.equipe ? [{ op: 'peneira' }] : [])]) v = executar(v, { tipo: 'esports25', oque: a } as Acao).vida;
    v = viver(v, 1);
  }
  if (!v.esports25!.equipe) v = transacao(v, x => { x.esports25!.proposta = { equipe: 'Carcará Esports', nivel: 3, forca: 60, salario: 5200, meses: 24, validaAte: x.t + 11, origem: 'mercado', titular: true, municipioId: 'sao-paulo-sp' }; }).vida;
  salvar('v25-esports', v);
}
// 2. base do futebol: 3 anos de formação.
{
  let v = aos(14, 2512);
  v = transacao(v, x => { garantirFrente(x, 'futebol').habilidade = 74; entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport'); }).vida;
  v = viver(v, 3);
  salvar('v25-base', v);
}
// 3. profissional de vôlei com dois anos de ficha.
{
  let v = aos(18, 2513);
  v = transacao(v, (x, r) => { garantirFrente(x, 'volei').habilidade = 84; entrarNaBase(x, 'volei', x.moradia.municipioId, 'equipe de vôlei de Recife'); x.caminhos.esporte!.tInicio -= 48; profissionalizar(x, r ?? criarRng(1), 2); }).vida;
  v = viver(v, 3);
  salvar('v25-volei', v);
}
// 4. 18 anos, sem carteira.
salvar('v25-cnh', aos(18, 2514));
