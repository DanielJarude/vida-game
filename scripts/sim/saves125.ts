import { readFileSync, readdirSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { interpretar } from '../../src/motor/save';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { conciliar } from '../../src/motor/sistemas/extrato';
import { estadoNoSubmundo } from '../../src/motor/sistemas/carreiraCriminal';
await carregarMundo();
const pastas = (process.env.PASTAS ?? '').split(',');
let ok = 0, falhas = 0;
for (const p of pastas) for (const f of readdirSync(p).filter(x => x.endsWith('.json'))) {
  try {
    const bruto = readFileSync(`${p}/${f}`, 'utf8');
    const r = interpretar(bruto);
    if (r.tipo !== 'ok') { console.log('NÃO ABRIU', f, r.tipo); falhas++; continue; }
    const uma = JSON.stringify(r.vida); const r2 = interpretar(uma);
    const idem = r2.tipo === 'ok' && JSON.stringify(r2.vida) === uma;
    let v = r.vida; let conc = true;
    for (let a = 0; a < 3 && !v.morte; a++) { v = avancarAno(v).vida; for (let k = 0; k < 12 && v.momento; k++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; if (v.financas.extrato && !conciliar(v.financas.extrato).ok) conc = false; }
    const fin = Number.isFinite(v.financas.conta);
    console.log(idem && conc && fin ? 'ok ' : 'ERRO', f, 'idempotente', idem, 'concilia', conc, 'estado', estadoNoSubmundo(v).titulo, 'orgs', Object.keys(v.mundoCriminal?.orgs ?? {}).length);
    if (idem && conc && fin) ok++; else falhas++;
  } catch (e) { console.log('EXCEÇÃO', f, (e as Error).message); falhas++; }
}
console.log({ ok, falhas });
