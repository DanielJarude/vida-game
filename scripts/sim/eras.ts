// ERAS HISTÓRICAS — os cenários de demonstração (A: 1984, B: 1995, C: 2010, D: contemporâneo), com avanço anual,
// salvar → fechar → reabrir (JSON + `interpretar`) a cada ano, e as conferências de cronologia, moeda e tecnologia.
// Uso: npx esbuild scripts/sim/eras.ts --bundle --platform=node --format=esm --outfile=X.mjs && node X.mjs [A|B|C|D] [anos]
import { nova, responderTudo } from '../../src/motor/__tests__/ajuda';
import { avancarAno } from '../../src/motor/ano';
import { interpretar } from '../../src/motor/save';
import { idade } from '../../src/motor/nucleo';
import { anoDe } from '../../src/motor/tempo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { formatarDinheiro } from '../../src/motor/mundo/moeda';
import { meioDeComunicacao, temAcesso } from '../../src/motor/eras/base/contexto';
import { padraoEm } from '../../src/motor/eras/base/moedas';
import { disponibilidadeNamoro15 } from '../../src/motor/v15/celular/celular15';
import { disponibilidadeRede } from '../../src/motor/sistemas/redes';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const CEN: Record<string, { ano?: number; cidade: string; semente: number }> = {
  A: { ano: 1984, cidade: 'sao-paulo-sp', semente: 19840 },
  B: { ano: 1995, cidade: 'recife-pe', semente: 19950 },
  C: { ano: 2010, cidade: 'porto-alegre-rs', semente: 20100 },
  D: { cidade: 'belo-horizonte-mg', semente: 20260 }
};
const qual = process.argv[2] ?? 'A';
const anos = Number(process.argv[3] ?? 50);
const c = CEN[qual];
let v: Vida = nova({ semente: c.semente, municipioId: c.cidade, ...(c.ano ? { ano: c.ano, era: true } : {}) });
const problemas: string[] = [];
const linha = (s: string) => console.log(s);
linha(`# Cenário ${qual}: ${v.eu.nome}, nasce em ${anoDe(v.eu.tNasc)} em ${c.cidade} (${v.era ? 'histórica' : 'contemporânea'})`);
let meioAntes = '';
for (let i = 0; i < anos; i++) {
  const contaAntes = v.financas.conta;
  v = responderTudo(avancarAno(v).vida);
  // salvar, fechar e reabrir
  const r = interpretar(JSON.stringify(v));
  if (r.tipo !== 'ok') { problemas.push(`${anoDe(v.t)}: save não reabriu (${r.tipo})`); break; }
  const de = JSON.stringify(r.vida.era ?? null), para = JSON.stringify(v.era ?? null);
  if (de !== para) problemas.push(`${anoDe(v.t)}: a época mudou ao reabrir`);
  v = r.vida;
  entrarNaVida(v);
  const ano = anoDe(v.t);
  const meio = meioDeComunicacao(v);
  const novos = v.biografia.filter(e => e.fato?.tipo === 'era' && v.t - e.t < 12 && e.t <= v.t).map(e => `[${(e.fato!.dados as Record<string, string>).categoria}] ${e.texto.slice(0, 90)}`);
  const moeda = v.era && ano <= 2025 ? padraoEm(v.t).simbolo : 'R$';
  linha(`${ano} · ${idade(v)} anos · ${meio}${meio !== meioAntes ? ' (MUDOU)' : ''} · conta ${formatarDinheiro(v.financas.conta)} [${moeda}] · fase ${v.economia.fase} infl ${(v.economia.inflacao * 100).toFixed(1)}%`);
  for (const n of novos) linha(`    ${n}`);
  meioAntes = meio;
  // Anacronismos que não podem acontecer numa vida histórica
  if (v.era) {
    const i2 = idade(v);
    if (ano < 2008 && temAcesso(v, 'smartphone')) problemas.push(`${ano}: smartphone antes de existir`);
    if (ano < 1990 && temAcesso(v, 'celular')) problemas.push(`${ano}: celular antes de 1990`);
    if (ano < 1995 && temAcesso(v, 'internet')) problemas.push(`${ano}: internet antes de 1995`);
    if (ano < 2013 && i2 >= 18 && v.eu.atracao && disponibilidadeNamoro15(v).grau === 'permitido') problemas.push(`${ano}: aplicativo de namoro antes de existir`);
    if (ano < 2010 && i2 >= 16 && disponibilidadeRede(v, { oque: 'criar', plataforma: 'instagram' } as never).grau === 'permitido') problemas.push(`${ano}: Instagram antes de 2010`);
    const tx = v.biografia.filter(e => v.t - e.t < 12).map(e => e.texto).join(' ');
    if (ano < 2020 && /\bPix\b/.test(tx)) problemas.push(`${ano}: Pix no texto`);
    if (ano < 2009 && /\bEnem\b/.test(tx)) problemas.push(`${ano}: Enem no texto`);
  }
  if (!Number.isFinite(v.financas.conta)) problemas.push(`${ano}: conta não finita (${contaAntes} → ${v.financas.conta})`);
  if (v.morte) { linha(`morreu em ${ano}`); break; }
}
const eventos = v.biografia.filter(e => e.fato?.tipo === 'era').length;
linha(`\nlembranças da época na biografia: ${eventos}; vistos: ${v.era?.vistos?.length ?? 0}`);
linha(problemas.length ? `PROBLEMAS (${problemas.length}):\n  ${problemas.join('\n  ')}` : 'Sem problemas de cronologia, moeda ou save.');
if (process.env.SAVE) { const { writeFileSync } = await import('node:fs'); writeFileSync(process.env.SAVE, JSON.stringify(v)); }
