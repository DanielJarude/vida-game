/**
 * REWORK 12 · Fase F/G — o ano das empresas, por tipo: N vidas abrem a empresa (gestor contratado, preço médio,
 * distribuindo) e seguem 15 anos sem mexer. Mede: falência, resultado médio por ano, o que foi distribuído à pessoa,
 * o retorno sobre o capital (o recebido + o valor da parte no fim ÷ o investido) e a dispersão (não pode haver lucro
 * garantido nem falência certa).
 *   npx esbuild scripts/sim/empresas12.ts --bundle --platform=node --format=esm --outfile=<scratch>/e.mjs && N=40 node <scratch>/e.mjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { TIPOS_DE_EMPRESA } from '../../src/motor/dados/empresas';
import { valorDaParte } from '../../src/motor/sistemas/empresas';
import type { TipoEmpresa, Vida } from '../../src/motor/tipos';

await carregarMundo();
const N = Number(process.env.N ?? 30);
const ANOS = Number(process.env.ANOS ?? 15);
const CIDADE = process.env.CIDADE ?? 'sao-paulo-sp';
const CUIDA = process.env.POLITICA === 'cuida';
const TIPOS = (process.env.TIPOS?.split(',') ?? TIPOS_DE_EMPRESA.map(t => t.id)) as TipoEmpresa[];
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const k = (x: number) => `${(x / 1000).toFixed(0)}k`;

function responder(v: Vida): Vida {
  for (let i = 0; i < 12 && v.momento && !v.morte; i++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento!.opcoes.find(o => !o.bloqueio)?.id ?? v.momento!.opcoes[0].id }).vida;
  return v;
}

for (const tipo of TIPOS) {
  const falidas: number[] = []; const roi: number[] = []; const medias: number[] = []; const recebido: number[] = []; let abriu = 0;
  for (let s = 0; s < N; s++) {
    let v = adulto(35, { semente: 1000 + s * 7, municipioId: CIDADE });
    v.financas.conta += 40_000_000;
    const a = { tipo: 'empresa_abrir', empresa: tipo, comSocio: false } as const;
    if (!podeTentar(disponibilidade(v, a))) continue;
    v = executar(v, a).vida;
    abriu++;
    const id = v.financas.empresas![0].id;
    const investido0 = v.financas.empresas![0].investido;
    let rec = 0;
    for (let y = 0; y < ANOS && !v.morte; y++) {
      const antes = v.financas.conta;
      v = responder(avancarAno(v).vida);
      const e = v.financas.empresas?.find(x => x.id === id);
      if (!e) break;
      // O dono que cuida: põe dinheiro quando a empresa entra em crise e reforma a cada cinco anos.
      if (CUIDA && e.estado !== 'encerrada') {
        for (const d of [e.estado === 'em_crise' ? 'aportar' : '', y % 5 === 4 ? 'melhorar' : ''].filter(Boolean)) {
          const a2 = { tipo: 'empresa', empresaId: id, decisao: d } as const;
          if (podeTentar(disponibilidade(v, a2 as never))) v = executar(v, a2 as never).vida;
        }
      }
      rec += (e.ultimo?.distribuido ?? 0) * e.parte;
      void antes;
    }
    const e = v.financas.empresas?.find(x => x.id === id);
    const faliu = !e || e.estado === 'encerrada';
    falidas.push(faliu ? 1 : 0);
    const h = e?.historico ?? [];
    medias.push(h.length ? h.reduce((x, y) => x + y, 0) / h.length : 0);
    recebido.push(rec);
    roi.push((rec + (e ? valorDaParte(e) : 0)) / Math.max(1, e?.investido ?? investido0));
  }
  const t = TIPOS_DE_EMPRESA.find(x => x.id === tipo)!;
  console.log(`${tipo.padEnd(11)} abriu ${abriu}/${N} | faliu ${(falidas.reduce((a, b) => a + b, 0) / Math.max(1, falidas.length) * 100).toFixed(0)}% | resultado/ano p10 ${k(pct(medias, 0.1))} p50 ${k(pct(medias, 0.5))} p90 ${k(pct(medias, 0.9))} | recebido ${ANOS}a p50 ${k(pct(recebido, 0.5))} | múltiplo (recebido+parte)/investido p10 ${pct(roi, 0.1).toFixed(2)} p50 ${pct(roi, 0.5).toFixed(2)} p90 ${pct(roi, 0.9).toFixed(2)} | capital ${k(t.capital)}`);
}
