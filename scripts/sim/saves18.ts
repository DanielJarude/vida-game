// VIDA 18 — saves antigos: abrir, normalizar (idempotente), avançar um ano, salvar e reabrir. ARQS=<lista de .json separada por vírgula>
import { readFileSync } from 'node:fs';
import { interpretar } from '../../src/motor/save';
import { avancarAno } from '../../src/motor/ano';
import { normalizarRural18 } from '../../src/motor/v18/rural/fazenda18';
import { normalizarApostas18 } from '../../src/motor/v18/apostas/estado18';
import { carregarMundo } from '../../src/motor/mundo/carregar';
await carregarMundo();
let falhas = 0;
for (const arq of (process.env.ARQS ?? '').split(',').filter(Boolean)) {
  const bruto = readFileSync(arq, 'utf8');
  const l = interpretar(bruto);
  if (l.tipo !== 'ok') { console.log('FALHA abrir', arq, l.tipo); falhas++; continue; }
  const v = l.vida;
  const bens0 = JSON.parse(bruto).financas?.bens?.length ?? 0;
  const a = JSON.stringify(v); normalizarRural18(v); normalizarApostas18(v); const b = JSON.stringify(v);
  const idem = a === b;
  const conta0 = v.financas.conta;
  let x = v; x.momento = null; (x as { fila?: unknown }).fila = undefined;
  try { x = avancarAno(x).vida; } catch (e) { console.log('FALHA ano', arq, String(e).slice(0, 200)); falhas++; continue; }
  const l2 = interpretar(JSON.stringify(x));
  const reaberto = l2.tipo === 'ok' && JSON.stringify(l2.vida.financas.bens.map(y => y.id)) === JSON.stringify(x.financas.bens.map(y => y.id));
  const ok = idem && reaberto && Number.isFinite(x.financas.conta) && v.financas.bens.length >= bens0 - 0;
  if (!ok) falhas++;
  console.log(ok ? 'OK  ' : 'FALHA', arq.split('/').slice(-1)[0], `idem=${idem} reaberto=${reaberto} bens ${bens0}→${v.financas.bens.length}→${x.financas.bens.length} conta ${Math.round(conta0)}→${Math.round(x.financas.conta)} rurais=${x.financas.bens.filter(y => y.tipo === 'imovel' && y.rural).length}`);
}
console.log('falhas', falhas);
