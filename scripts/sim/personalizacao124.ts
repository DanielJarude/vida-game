/**
 * REWORK 12.4 — vidas personalizadas em vidas longas. Seis perfis (baixa renda, classe média, rico, colecionador,
 * músico, artista) jogam com as ações da tela (comprar móveis e instrumentos, mexer na casa, construir, personalizar o
 * veículo, guardar e emprestar objetos, ir a programas culturais, produzir obras) e medem:
 *
 *   economia     quanto foi para a personalização (extrato), conforto (p10/p50/p90), patrimônio líquido no fim
 *   invariantes  nenhum objeto em dobro, nenhum lugar inválido, nenhum emprestado a quem morreu, nenhuma peça repetida
 *   herança      peças de família e objetos com história que passam a quem continua
 *   gosto        o gênero preferido por classe de origem (não pode depender dela)
 *   exploits     comprar–personalizar–vender (veículo, obra na casa) nunca dá lucro
 *   custo        ms por ano de vida e tamanho do save (com e sem personalização)
 *
 *   npx esbuild scripts/sim/personalizacao124.ts --bundle --platform=node --format=esm --outfile=<scratch>/p.mjs && N=12 ANOS=25 node <scratch>/p.mjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto, comFilho } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { balanco } from '../../src/motor/sistemas/dinheiro';
import { confortoDaCasa, comodosDaCasa } from '../../src/motor/sistemas/lar';
import { valorDeMercadoDoVeiculo } from '../../src/motor/sistemas/veiculos';
import { gostosDe, generosPreferidos } from '../../src/motor/sistemas/gostos';
import { continuarComo } from '../../src/motor/sistemas/sucessao';
import { calcularHeranca } from '../../src/motor/sistemas/partilha';
import { interpretar } from '../../src/motor/save';
import { nova } from '../../src/motor/__tests__/ajuda';
import type { Imovel, Veiculo, Vida } from '../../src/motor/tipos';

await carregarMundo();
const N = Number(process.env.N ?? 12);
const ANOS = Number(process.env.ANOS ?? 25);
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const k = (x: number) => (!Number.isFinite(x) ? '—' : Math.abs(x) >= 1e6 ? `${(x / 1e6).toFixed(1)}mi` : `${Math.round(x / 1000)}k`);
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const P = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });
const decidirTudo = (v: Vida) => { for (let i = 0; i < 12 && v.momento && !v.morte; i++) { const o = v.momento.opcoes.find(x => !x.bloqueio) ?? v.momento.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: o.id }).vida; } return v; };

type Perfil = 'nada' | 'baixa' | 'media' | 'rico' | 'colecionador' | 'musico' | 'artista';
const PERFIS = (process.env.PERFIS?.split(',') as Perfil[]) ?? ['nada', 'baixa', 'media', 'rico', 'colecionador', 'musico', 'artista'];
const CASA: Record<Perfil, string> = { nada: 'apto_2q', baixa: 'kitnet', media: 'casa_2q', rico: 'mansao', colecionador: 'casa_grande', musico: 'casa_3q', artista: 'apto_2q' };
const CONTA: Record<Perfil, number> = { nada: 60_000, baixa: 4_000, media: 60_000, rico: 8_000_000, colecionador: 2_000_000, musico: 80_000, artista: 30_000 };

function comecar(p: Perfil, s: number): Vida {
  const v = adulto(28, { semente: 12400 + s * 31, municipioId: s % 2 ? 'recife-pe' : 'sao-paulo-sp' });
  v.financas.dividas = []; v.financas.negativado = false; v.momento = null; delete v.fila;
  v.financas.conta = CONTA[p];
  if (p !== 'baixa') {
    const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId: CASA[p], nome: 'casa', valor: 500000, tCompra: v.t, municipioId: v.moradia.municipioId, estado: 85 };
    v.financas.bens = [casa];
    v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: CASA[p], aluguel: 0, padrao: p === 'rico' ? 5 : 3, tInicio: v.t };
  } else v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'kitnet', aluguel: 900, padrao: 2, tInicio: v.t };
  if (p === 'rico' || p === 'colecionador') v.financas.bens.push({ id: 'vc', tipo: 'veiculo', modeloId: 'carro_luxo', nome: 'carro', valor: 420000, tCompra: v.t, estado: 100 } as Veiculo);
  return v;
}

/** O que cada perfil faz num ano (o que cabe: as ações bloqueadas não acontecem). */
function jogar(v: Vida, p: Perfil, ano: number): Vida {
  if (p === 'nada') return v;
  const compras: Record<Perfil, string[]> = { nada: [], baixa: ['colchao', 'roupa_de_cama', 'pandeiro'], media: ['colchao', 'sofa', 'mesa_jantar', 'tv', 'violao'], rico: ['colchao', 'sofa', 'mesa_jantar', 'projetor', 'mesa_sinuca', 'piano', 'estacao_musculacao', 'som_hifi'], colecionador: ['sofa', 'som_hifi', 'discos', 'poltrona', 'livros'], musico: ['violao', 'cavaquinho', 'home_studio', 'sanfona', 'som_hifi', 'discos'], artista: ['material_arte', 'cavalete', 'camera', 'torno_ceramica'] };
  for (const id of compras[p]) v = tenta(v, { tipo: 'comprar_coisa', coisaId: id });
  const comodos = comodosDaCasa(v);
  if (ano % 3 === 0) for (const c of comodos.slice(0, 3)) v = tenta(v, P({ o: 'acabamento', comodo: c.id, aspecto: 'parede', opcao: ano % 2 ? 'verde_oliva' : 'areia' }));
  if (p === 'rico' && ano === 2) { v = tenta(v, P({ o: 'construir', tipo: 'cinema' })); v = tenta(v, P({ o: 'acabamento', comodo: 'sala', aspecto: 'piso', opcao: 'marmore' })); }
  if (p === 'musico' && ano === 1) v = tenta(v, P({ o: 'converter', comodo: 'quarto2', tipo: 'estudio' }));
  if (p === 'artista' && ano === 1) v = tenta(v, P({ o: 'converter', comodo: 'quarto2', tipo: 'atelie' }));
  if (p === 'colecionador' && ano === 1) v = tenta(v, P({ o: 'converter', comodo: 'quarto2', tipo: 'biblioteca' }));
  const vc = v.financas.bens.find((b): b is Veiculo => b.tipo === 'veiculo');
  if (vc && ano === 1) { v = tenta(v, P({ o: 'veiculo_peca', bem: vc.id, peca: 'pneus', opcao: 'bons' })); v = tenta(v, P({ o: 'veiculo_peca', bem: vc.id, peca: 'interior', opcao: 'couro' })); }
  if (p === 'colecionador' && ano === 4 && vc) v = tenta(v, P({ o: 'veiculo_colecao', bem: vc.id, sim: true }));
  v = tenta(v, P({ o: 'cultural', oque: 'ouvir' }));
  v = tenta(v, P({ o: 'cultural', oque: ['roda_samba', 'baile', 'forro', 'concerto', 'show', 'exposicao'][ano % 6] }));
  if (p === 'artista' || p === 'musico') for (const l of ['pintura', 'desenho', 'fotografia', 'escultura']) v = tenta(v, P({ o: 'obra', linguagem: l }));
  // Organizar: o que é grande e sobra vai para o depósito por um tempo; o violão vai emprestado a alguém e volta.
  if (ano === 5 && v.financas.coisas?.length) { const t = v.financas.coisas.find(x => x.coisaId === 'sofa'); if (t) v = tenta(v, P({ o: 'mover', ref: { tipo: 'coisa', id: t.id }, para: `dep:${v.moradia.municipioId}` })); }
  if (ano === 7) { const t = v.financas.coisas?.find(x => x.coisaId === 'sofa' && x.local); if (t) v = tenta(v, P({ o: 'mover', ref: { tipo: 'coisa', id: t.id }, para: null })); }
  const obra = v.financas.colecao?.find(c => c.procedencia === 'propria' && !c.exposta);
  if (obra) v = tenta(v, P({ o: 'expor', colecao: obra.id, comodo: comodos.find(c => c.tipo === 'sala')?.id ?? comodos[0]?.id ?? 'quarto' }));
  if (p === 'colecionador' && ano === 3) for (const c of v.financas.colecao ?? []) v = tenta(v, P({ o: 'de_familia', colecao: c.id, sim: true }));
  return v;
}

/** As invariantes: nada em dobro, nenhum lugar que não existe, nenhum empréstimo a quem morreu. */
function violacoes(v: Vida): string[] {
  const out: string[] = [];
  const ids = [...(v.financas.coisas ?? []).map(x => x.id), ...(v.financas.colecao ?? []).map(x => x.id), ...(v.eu.estilo?.itens ?? []).map(x => x.id)];
  if (new Set(ids).size !== ids.length) out.push('objeto em dobro');
  const meus = new Set(v.financas.bens.filter(b => b.tipo === 'imovel').map(b => b.id));
  for (const o of [...(v.financas.coisas ?? []), ...(v.financas.colecao ?? []), ...(v.eu.estilo?.itens ?? [])]) {
    const l = (o as { local?: string }).local;
    if (l?.startsWith('im:') && !meus.has(l.slice(3))) out.push('lugar inválido');
    const e = (o as { emprestadaA?: string }).emprestadaA;
    if (e && (o as { coisaId?: string }).coisaId && !v.pessoas[e]?.vivo) out.push('emprestado a quem morreu');
  }
  return out;
}

const gastoPersonalizacao = (v: Vida) => [...(v.financas.extrato?.linhas ?? [])].filter(l => /casa e os objetos|Música, arte/.test(l.rotulo)).reduce((s, l) => s - Math.min(0, l.conta), 0);

console.log(`REWORK 12.4 · ${N} vidas por perfil, ${ANOS} anos (dos 28 aos ${28 + ANOS})\n`);
const linhas: string[] = [];
for (const p of PERFIS) {
  const conforto: number[] = [], liquido: number[] = [], gasto: number[] = [], objetos: number[] = [], obras: number[] = [], tam: number[] = [];
  let erros = 0, crashes = 0, ms = 0, anos = 0;
  for (let s = 0; s < N; s++) {
    let v = comecar(p, s);
    let g = 0;
    try {
      for (let a = 1; a <= ANOS && !v.morte; a++) {
        v = jogar(v, p, a);
        const t0 = performance.now();
        v = decidirTudo(avancarAno(v).vida);
        ms += performance.now() - t0; anos++;
        g += gastoPersonalizacao(v);
        erros += violacoes(v).length;
      }
    } catch (e) { crashes++; console.error(p, s, (e as Error).message); continue; }
    conforto.push(confortoDaCasa(v).valor); liquido.push(balanco(v).liquido); gasto.push(g);
    objetos.push((v.financas.coisas ?? []).length + (v.financas.colecao ?? []).length);
    obras.push((v.financas.colecao ?? []).filter(c => c.procedencia === 'propria').length);
    tam.push(JSON.stringify(v).length);
    const r = interpretar(JSON.stringify(v));
    if (r.tipo !== 'ok' || JSON.stringify(r.vida.financas.coisas) !== JSON.stringify(v.financas.coisas)) erros++;
  }
  linhas.push(`${p.padEnd(13)} conforto ${pct(conforto, 0.1)}/${pct(conforto, 0.5)}/${pct(conforto, 0.9)} · gasto em personalização p50 ${k(pct(gasto, 0.5))} · líquido p50 ${k(pct(liquido, 0.5))} · objetos p50 ${pct(objetos, 0.5)} · obras p50 ${pct(obras, 0.5)} · save p50 ${Math.round(pct(tam, 0.5) / 1024)} kB · ${(ms / Math.max(1, anos)).toFixed(1)} ms/ano · violações ${erros} · crashes ${crashes}`);
}
console.log(linhas.join('\n'));

// Gosto × classe de origem: o gênero preferido não pode depender da classe.
const classes = new Map<string, Map<string, number>>();
for (let s = 0; s < 600; s++) {
  const v = nova({ semente: 50000 + s, genero: s % 2 ? 'feminino' : 'masculino', municipioId: s % 3 ? 'sao-paulo-sp' : 'salvador-ba' });
  const fav = generosPreferidos(v, 1)[0].id;
  const m = classes.get(v.origem.classe) ?? new Map<string, number>();
  m.set(fav, (m.get(fav) ?? 0) + 1); classes.set(v.origem.classe, m);
  void gostosDe;
}
console.log('\nGênero preferido por classe de origem (600 nascimentos; % de cada classe):');
const generos = ['funk', 'samba', 'sertanejo', 'rock', 'mpb', 'classica', 'jazz', 'rap'];
console.log('classe'.padEnd(14) + generos.map(g => g.padStart(9)).join(''));
for (const [c, m] of classes) { const tot = [...m.values()].reduce((a, b) => a + b, 0); console.log(`${c.padEnd(14)}${generos.map(g => `${Math.round(100 * (m.get(g) ?? 0) / tot)}%`.padStart(9)).join('')}  (n=${tot})`); }

// Exploits: personalizar e vender nunca dá lucro.
{
  let v = comecar('rico', 99);
  const conta0 = v.financas.conta + valorDeMercadoDoVeiculo(v, v.financas.bens.find(b => b.id === 'vc') as Veiculo);
  for (const [peca, op] of [['pintura', 'vermelho'], ['rodas', 'liga'], ['interior', 'artesanal'], ['freios', 'reforcados'], ['acessorios', 'multimidia']]) v = tenta(v, P({ o: 'veiculo_peca', bem: 'vc', peca, opcao: op }));
  v = tenta(v, { tipo: 'vender_bem', bemId: 'vc' });
  console.log(`\nExploit veículo: personalizar tudo e vender → saldo ${k(v.financas.conta - conta0)} (precisa ser negativo)`);
  let w = comecar('rico', 98);
  const antes = balanco(w).liquido;
  w = tenta(w, P({ o: 'construir', tipo: 'piscina' })); w = tenta(w, P({ o: 'construir', tipo: 'cinema' }));
  console.log(`Exploit obra: construir piscina e cinema → patrimônio líquido ${k(balanco(w).liquido - antes)} (precisa ser negativo)`);
}

// Herança: a peça de família e o objeto com história passam a quem continua.
{
  let v = comecar('colecionador', 7);
  for (let a = 1; a <= 6; a++) v = decidirTudo(avancarAno(jogar(v, 'colecionador', a)).vida);
  v.financas.colecao = [...(v.financas.colecao ?? []), { id: 'cr', pecaId: 'x', nome: 'Relógio do avô', categoria: 'relogio', raridade: 'rara', procedencia: 'herdada', certificado: true, estado: 80, valor: 40000, precoPago: 0, tCompra: v.t - 300, deFamilia: true }];
  const { p: f } = comFilho(v, 30, { casa: false }); f.municipioId = v.moradia.municipioId; f.renda = 6000;
  v.morte = { t: v.t, causa: 'infarto', heranca: calcularHeranca(v) };
  const r = continuarComo(v, f.id);
  const n = r.vida;
  console.log(`\nHerança: ${r.erro ?? 'ok'} · peças herdadas ${(n.financas.colecao ?? []).filter(c => c.memoria?.origem === 'heranca').length} · objetos com memória de herança ${(n.financas.coisas ?? []).filter(c => c.memoria?.origem === 'heranca').length} · violações ${violacoes(n).length}`);
}
