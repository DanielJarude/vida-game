// ERAS — sonda: uma vida de 1984 no motor atual (antes da camada histórica).
import { nova } from '../../src/motor/__tests__/ajuda';
import { avancarAno } from '../../src/motor/ano';
import { responderTudo } from '../../src/motor/__tests__/ajuda';
import { idade } from '../../src/motor/nucleo';
import { anoDe } from '../../src/motor/tempo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
await carregarMundo();
const ANO = Number(process.env.ANO ?? 1984);
let v = nova({ semente: Number(process.env.SEM ?? 1984), municipioId: process.env.CID ?? 'sao-paulo-sp', ano: ANO, era: process.env.ERA !== '0' });
for (let i = 0; i < Number(process.env.N ?? 45); i++) {
  try { v = responderTudo(avancarAno(v).vida); } catch (e) { console.log('ERRO', anoDe(v.t), (e as Error).stack?.split('\n').slice(0, 4).join(' | ')); break; }
  const ano = anoDe(v.t);
  const novos = v.biografia.filter((h: any) => anoDe(h.t) === ano - 1 || anoDe(h.t) === ano).map((h: any) => (h.texto ?? "").slice(0, 60));
  console.log(ano, idade(v), 'R$', Math.round(v.financas.conta), '|', novos.slice(0, 6).join(' ; '));
}
const s = JSON.stringify(v);
for (const k of ['smartphone', 'celular', 'WhatsApp', 'Instagram', 'TikTok', 'Pix', 'aplicativo', 'internet']) console.log(k, (s.match(new RegExp(k, 'gi')) ?? []).length);
