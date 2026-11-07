/**
 * Sim VIDA 13 · Empresas — duas partes:
 *   A) A BASE: em cada ramo grande, uma empresa fundada com o primeiro item e a gestão delegada, 15 anos, duas sementes.
 *      Roda igual na árvore da 12.9.1 (copiada com `git archive`) e na da 13: compara faturamento, lucro, valor e falências.
 *   B) AS ESCOLHAS (só na 13): a mesma indústria e a mesma montadora, com escolhas diferentes de produto e de linha, 8 anos.
 * Uso: npx esbuild scripts/sim/empresas13.ts --bundle --platform=node --format=esm --outfile=X.mjs && node X.mjs [A|B]
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { transacao } from '../../src/motor/nucleo';
import { processarEmpresas } from '../../src/motor/sistemas/empresas';
import * as E129 from '../../src/motor/sistemas/empresas129';
import { SETORES_GRANDES } from '../../src/motor/dados/empresas129';
import type { Empresa, TipoEmpresa, Vida } from '../../src/motor/tipos';

await carregarMundo();
const parte = process.argv[2] ?? 'AB';
const M = (x: number) => `${(x / 1e6).toFixed(1)}M`;
const base = adulto(40, { municipioId: 'sao-paulo-sp', semente: 41 });
function pessoa(conta: number, id: string): Vida {
  const v = structuredClone(base);
  v.id = id;
  v.financas.conta = conta; v.financas.dividas = []; v.financas.negativado = false; v.financas.bens = []; v.financas.colecao = []; v.financas.empresas = []; v.financas.investimentos = [];
  v.anoAtual = { acoes: [] };
  return v;
}
const anos = (v: Vida, n: number) => { for (let k = 0; k < n; k++) { v.t += 12; v.anoAtual = { acoes: [] }; v = transacao(v, (x, r) => processarEmpresas(x, r)).vida; } return v; };
const corp = (v: Vida) => (v.financas.empresas ?? []).find(e => !!e.corp)!;

if (parte.includes('A')) {
  console.log('== A · base: fundar com o 1º item, gestão delegada, 15 anos (semente 41 e 77)');
  const tot = { receita: 0, lucro: 0, valor: 0, faliu: 0, n: 0 };
  for (const s of SETORES_GRANDES) {
    for (const sem of ['41', '77']) {
      let v = pessoa(60e9, `sim13-${sem}`);
      E129.fundarEmpresa(v, s.id, s.itens[0].id, false);
      v = anos(v, 15);
      const e = (v.financas.empresas ?? [])[0] as Empresa;
      const rec = e.ultimo?.receita ?? 0;
      const luc = e.ultimo?.resultado ?? 0;
      tot.receita += rec; tot.lucro += luc; tot.valor += e.avaliacao ?? 0; tot.faliu += e.estado === 'encerrada' ? 1 : 0; tot.n++;
      console.log(`${s.id.padEnd(15)} ${sem} ${e.estado.padEnd(10)} rec=${M(rec).padStart(10)} luc=${M(luc).padStart(10)} val=${M(e.avaliacao ?? 0).padStart(11)} cx=${M(e.caixa).padStart(10)} div=${M(e.corp?.divida ?? 0).padStart(9)} linhas=${(e.corp?.projetos ?? []).filter(p => p.estado === 'ativo').length} cap=${e.corp?.capacidade}`);
    }
  }
  console.log(`TOTAL n=${tot.n} receita=${M(tot.receita)} lucro=${M(tot.lucro)} valor=${M(tot.valor)} faliram=${tot.faliu}`);
}

if (parte.includes('B')) {
  type Passo = (v: Vida, e: Empresa, pid: string) => void;
  const decidir = (oque: string, alvo?: string): Passo => (v, e) => { const d = E129.disponibilidadeEmpresa129(v, e, oque as never, alvo); if (!d.ok) throw new Error(`${oque} ${alvo}: ${d.motivo}`); E129.decidirEmpresa129(v, e, oque as never, alvo); };
  const naLinha = (oque: string, sufixo = ''): Passo => (v, e, pid) => decidir(oque, `${pid}${sufixo}`)(v, e, pid);
  const cenarios: [string, TipoEmpresa, string, Passo[]][] = [
    ['indústria · nada', 'industria', 'biscoitos', []],
    ['indústria · + salgadinhos', 'industria', 'biscoitos', [decidir('projeto', 'salgadinhos')]],
    ['indústria · + massas', 'industria', 'biscoitos', [decidir('projeto', 'massas')]],
    ['indústria · + saudável', 'industria', 'biscoitos', [decidir('projeto', 'saudaveis')]],
    ['indústria · nova linha chocolates', 'industria', 'biscoitos', [decidir('linha', 'chocolates')]],
    ['indústria · biscoito +10% preço', 'industria', 'biscoitos', [naLinha('preco', ':+')]],
    ['indústria · biscoito −10% preço', 'industria', 'biscoitos', [naLinha('preco', ':-')]],
    ['indústria · biscoito intermediário', 'industria', 'biscoitos', [naLinha('reposicionar', ':intermediario')]],
    ['indústria · biscoito qualidade +1', 'industria', 'biscoitos', [naLinha('qualidade')]],
    ['indústria · descontinuar biscoito', 'industria', 'biscoitos', [naLinha('descontinuar')]],
    ['montadora · nada (hatch)', 'montadora', 'hatch', []],
    ['montadora · + SUV compacto', 'montadora', 'hatch', [decidir('projeto', 'suv_compacto')]],
    ['montadora · + moto urbana', 'montadora', 'hatch', [decidir('projeto', 'moto_urbana')]],
    ['montadora · + superesportivo', 'montadora', 'hatch', [decidir('projeto', 'superesportivo')]],
    ['tecnologia · nada (ERP)', 'tecnologia', 'erp', []],
    ['tecnologia · + rede social', 'tecnologia', 'erp', [decidir('linha', 'rede_social')]],
    ['tecnologia · + segurança digital', 'tecnologia', 'erp', [decidir('linha', 'seguranca')]]
  ];
  console.log('\n== B · escolhas (8 anos depois da decisão; semente igual; gestão do dono)');
  for (const sem of ['41', '77']) {
    for (const [rotulo, setor, item, passos] of cenarios) {
      let v = pessoa(60e9, `sim13b-${sem}`);
      E129.fundarEmpresa(v, setor, item, false);
      corp(v).estrategia!.delegar = false;
      v = anos(v, setor === 'montadora' ? 4 : 2);
      const e = corp(v);
      e.caixa = Math.max(e.caixa, setor === 'montadora' ? 6e9 : 300e6);
      e.corp!.capacidade += 1;
      const pid = e.corp!.projetos.find(p => p.estado === 'ativo')!.id;
      for (const p of passos) p(v, e, pid);
      v = anos(v, 8);
      const x = corp(v);
      const linhas = x.corp!.projetos.filter(p => p.estado === 'ativo').map(p => `${p.produto ?? p.item}:${M(p.receitaAno ?? 0)}${p.linha?.fatia ? `/${(p.linha.fatia * 100).toFixed(2)}%` : ''}`).join(' ');
      const soma = x.anos!.slice(-8).reduce((t, a) => t + a.lucro, 0);
      console.log(`${sem} ${rotulo.padEnd(36)} rec=${M(x.ultimo!.receita).padStart(9)} luc=${M(x.ultimo!.resultado).padStart(9)} luc8a=${M(soma).padStart(9)} val=${M(x.avaliacao ?? 0).padStart(10)} rep=${x.reputacao} fat=${((x.corp!.participacao ?? 0) * 100).toFixed(3)}% | ${linhas}`);
    }
  }
}
