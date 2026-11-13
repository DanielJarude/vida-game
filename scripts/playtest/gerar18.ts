// VIDA 18 — saves para olhar o Campo, as Apostas, o personagem de costas e a garagem. OUT=<dir> (saves/ dentro).
import { mkdirSync, writeFileSync } from 'node:fs';
import { nova, viver } from '../../src/motor/__tests__/ajuda';
import { executar } from '../../src/motor/acoes';
import { avancarAno } from '../../src/motor/ano';
import { idade } from '../../src/motor/nucleo';
import { ofertasRurais } from '../../src/motor/v18/rural/acoes18';
import { areaLivre, todasAsPropriedades } from '../../src/motor/v18/rural/fazenda18';
import { proximoConcurso, sorteioDoConcurso } from '../../src/motor/v18/apostas/loterias18';
import type { Vida } from '../../src/motor/tipos';
import { carregarMundo } from '../../src/motor/mundo/carregar';
await carregarMundo();
const SP = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/qa18`;
mkdirSync(`${SP}/saves`, { recursive: true });
const limpar = (v: Vida) => { v.momento = null; delete v.fila; v.caminhos.pendente = undefined; v.desfecho13 = undefined; return v; };
const salvar = (nome: string, v: Vida) => { limpar(v); writeFileSync(`${SP}/saves/vida-v18-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), v.moradia.municipioId, (v.financas.bens.filter(b => b.tipo === 'imovel' && b.rural)).length, 'propriedades'); };
const ex = (v: Vida, a: Parameters<typeof executar>[1]) => { const r = executar(v, a); return r.vida; };
const ano = (v: Vida) => limpar(avancarAno(v).vida);

// Fazendeira: fazenda agrícola, haras, sítio onde mora; um ano vivido para ter as contas.
let f = viver(nova({ semente: 1801, municipioId: 'campo-grande-ms' }), 38);
f.financas.conta = 40_000_000;
for (const tipo of ['agricola', 'haras', 'sitio', 'pecuaria']) { const o = ofertasRurais(f).find(x => x.p.tipo === tipo)!; f = ex(f, { tipo: 'rural18', oque: { op: 'comprar', oferta: o.id } }); }
let ps = todasAsPropriedades(f);
const agr = ps.find(x => x.p.tipo === 'agricola')!.p;
f = ex(f, { tipo: 'rural18', oque: { op: 'plantar', id: agr.id, cultura: 'soja', ha: Math.round(areaLivre(agr) * 0.5) } });
f = ex(f, { tipo: 'rural18', oque: { op: 'plantar', id: agr.id, cultura: 'milho', ha: Math.round(areaLivre(agr) * 0.4) } });
f = ex(f, { tipo: 'rural18', oque: { op: 'construir', id: agr.id, estrutura: 'silo' } });
f = ex(f, { tipo: 'rural18', oque: { op: 'maquina', id: agr.id, maquina: 'trator' } });
const har = ps.find(x => x.p.tipo === 'haras')!.p;
f = ex(f, { tipo: 'rural18', oque: { op: 'animais', id: har.id, especie: 'cavalos', lotes: 2 } });
f = ex(f, { tipo: 'rural18', oque: { op: 'construir', id: har.id, estrutura: 'pista' } });
const sit = ps.find(x => x.p.tipo === 'sitio')!.p;
f = ex(f, { tipo: 'rural18', oque: { op: 'plantar', id: sit.id, cultura: 'horta', ha: 1 } });
f = ex(f, { tipo: 'rural18', oque: { op: 'animais', id: sit.id, especie: 'galinhas', lotes: 1 } });
f = ex(f, { tipo: 'rural18', oque: { op: 'construir', id: sit.id, estrutura: 'aviario' } });
f = ano(f); f = ano(f);
ps = todasAsPropriedades(f);
salvar('fazendeira', f);

// Sem terra (estado vazio), adulto comum em São Paulo, com dinheiro para apostas.
let a = viver(nova({ semente: 1802, municipioId: 'sao-paulo-sp' }), 30);
a.financas.conta = Math.max(a.financas.conta, 60_000);
salvar('vazio', a);
// O apostador: bilhetes conferidos e pendentes, apostas esportivas, turfe, bingo.
let b = structuredClone(a);
b.financas.conta = 200_000;
const n = proximoConcurso(b, 'mega');
const s = sorteioDoConcurso(b, 'mega', n).a;
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'comprar', loteria: 'mega', jogos: [[...s.slice(0, 4), 59, 60].sort((x, y) => x - y)] } });
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'bolao', loteria: 'mega', cotas: 2 } });
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'sorteio', loteria: 'mega' } });
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'comprar', loteria: 'mega', surpresinhas: 3 } });
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'comprar', loteria: 'lotofacil', surpresinhas: 2, dezenas: 16 } });
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'sorteio', loteria: 'lotofacil' } });
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'esportiva', oque: 'jogo', jogoK: 0, mercado: '1x2', palpite: '1', valor: 100 } });
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'esportiva', oque: 'jogo', jogoK: 2, mercado: 'placar', palpite: '2-1', valor: 50 } });
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'esportiva', oque: 'rodada' } });
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'esportiva', oque: 'abrir_mercado' } });
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'turfe', oque: 'correr', hipodromo: 'cidade_jardim' } });
b = ex(b, { tipo: 'aposta18', oque: { jogo: 'bingo', oque: 'jogar', cartelas: 2 } });
salvar('apostador', b);
