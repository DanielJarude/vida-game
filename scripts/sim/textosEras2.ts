// ERAS v2 — auditoria textual: vidas históricas jogadas por estratégias, e todo texto que a pessoa vê (Linha da Vida,
// cenas de decisão e as opções, recados/mensagens) passa pelo detector de anacronismos (`eras/base/anacronismos`).
// Uso: npx esbuild scripts/sim/textosEras2.ts --bundle --platform=node --format=esm --outfile=X.mjs && VIDAS=10 node X.mjs
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { anoDe } from '../../src/motor/tempo';
import { anacronismosNoTexto } from '../../src/motor/eras/base/anacronismos';
import { estrategia } from './estrategias';
import { writeFileSync } from 'node:fs';

await carregarMundo();
const N = Number(process.env.VIDAS ?? 10);
const PERFIS = ['familiar', 'ambicioso', 'estudioso', 'impulsivo', 'social', 'economico', 'gastador', 'ascensao', 'antissocial'];
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'campina-grande-pb', 'fortaleza-ce', 'curitiba-pr'];
const COORTES = (process.env.COORTES ?? '1980,1986,1992,1998,2004').split(',').map(Number);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const achados = new Map<string, { n: number; termos: Set<string>; exemplo: string; anos: Set<number> }>();
let textos = 0;
function conferir(fonte: string, texto: string | undefined, ano: number) {
  if (!texto || ano > 2025) return;
  textos++;
  const t = anacronismosNoTexto(texto, ano);
  if (!t.length) return;
  const k = fonte;
  const a = achados.get(k) ?? { n: 0, termos: new Set(), exemplo: '', anos: new Set() };
  a.n++; t.forEach(x => a.termos.add(x)); a.anos.add(ano);
  if (!a.exemplo) a.exemplo = `${ano}: ${texto.slice(0, 220)}`;
  achados.set(k, a);
}
for (const ano of COORTES) {
  for (let s = 1; s <= N; s++) {
    const r = criarRng(s * 31 + ano);
    const e = estrategia(PERFIS[s % PERFIS.length]);
    let v = criarVida({ nome: 'Ana', sobrenome: 'Teste', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 91000 + s + ano, ano, era: true } as never);
    const vistos = new Set<string>();
    const olharMomento = () => {
      const m = v.momento; if (!m) return;
      const a = anoDe(v.t);
      conferir(`cena:${m.situacaoId}`, m.titulo + ' · ' + m.texto, a);
      for (const o of m.opcoes) conferir(`cena:${m.situacaoId}:opção`, o.texto + ' ' + (o.detalhe ?? '') + ' ' + (o.bloqueio ?? ''), a);
    };
    try {
      while (!v.morte && anoDe(v.t) < 2025 && idade(v) < 60) {
        const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) { olharMomento(); v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento!, r) }).vida; } };
        for (const a of e.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
        v = avancarAno(v).vida; responder();
        entrarNaVida(v);
        for (const b of v.biografia) {
          if (vistos.has(b.id)) continue; vistos.add(b.id);
          const f = b.fato ? `${b.fato.tipo}${(b.fato.dados as Record<string, unknown>)?.categoria ? ':' + (b.fato.dados as Record<string, string>).categoria : ''}` : b.tema;
          conferir(`bio:${f}`, b.texto, anoDe(b.t));
        }
        for (const m of v.celular15?.msgs ?? []) {
          if (vistos.has('m' + m.id)) continue; vistos.add('m' + m.id);
          conferir(`msg:${m.tipo}`, m.texto + ' ' + (m.cartao ?? ''), anoDe(m.t));
        }
      }
    } catch (err) { console.log(`CRASH ${ano} #${s}: ${(err as Error).message}`); }
  }
}
const lista = [...achados.entries()].sort((a, b) => b[1].n - a[1].n);
const total = lista.reduce((s, [, a]) => s + a.n, 0);
console.log(`textos conferidos: ${textos} · com anacronismo: ${total} (${(total / Math.max(1, textos) * 100).toFixed(2)}%) · fontes: ${lista.length}`);
for (const [k, a] of lista.slice(0, Number(process.env.TOP ?? 60))) console.log(`${String(a.n).padStart(4)} ${k} [${[...a.termos].join(', ')}] anos ${Math.min(...a.anos)}–${Math.max(...a.anos)}\n       ${a.exemplo}`);
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify(lista.map(([k, a]) => ({ k, n: a.n, termos: [...a.termos], exemplo: a.exemplo })), null, 1));
