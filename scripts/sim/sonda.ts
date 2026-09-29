import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, vinculosVivos } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { ROTINAS } from '../../src/motor/sistemas/rotinas';
const N = Number(process.env.VIDAS ?? 40);
const conv: Record<string, number> = {}; let vidasComConvite = 0; let totalConv = 0; let entrou = 0;
const idades = [15, 25, 35, 45, 60];
const rede: Record<number, Record<string, number>> = {}; for (const i of idades) rede[i] = {};
const cnt: Record<number, number> = {};
for (let s = 1; s <= N; s++) {
  const r = criarRng(s * 7919);
  let v: Vida = criarVida({ nome: 'Ana', sobrenome: 'Souza', genero: s % 2 ? 'feminino' : 'masculino', municipioId: ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'manaus-am'][s % 6], semente: s });
  let c = 0;
  const resp = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) { if (v.momento.situacaoId === 'pol_convite') { c++; const o = v.momento.texto.slice(0, 50); conv[o] = (conv[o] ?? 0) + 1; } const l = v.momento.opcoes.filter(o => !o.bloqueio); const o = v.momento.situacaoId === 'pol_convite' ? (l.find(x => x.id === 'nao') ?? l[0]) : r.pick(l.length ? l : v.momento.opcoes); v = executar(v, { tipo: 'decidir', opcaoId: o.id }).vida; } };
  while (!v.morte && idade(v) < 61) {
    if (r.chance(0.3)) { const a: Acao = { tipo: 'rotina', id: r.pick(ROTINAS).id, ativa: true, nivel: 1 }; if (podeTentar(disponibilidade(v, a))) { v = executar(v, a).vida; resp(); } }
    v = avancarAno(v).vida; resp();
    const i = idade(v);
    if (idades.includes(i)) { cnt[i] = (cnt[i] ?? 0) + 1; for (const { vin, p } of vinculosVivos(v)) { if (p.especie || vin.parentesco) continue; const k = `${vin.estagio}:${vin.origem}`; rede[i][k] = (rede[i][k] ?? 0) + 1; rede[i][vin.estagio ?? '-'] = (rede[i][vin.estagio ?? '-'] ?? 0) + 1; } }
  }
  if (c) vidasComConvite++; totalConv += c; if (v.caminhos.politica) entrou++;
}
console.log('vidas', N, 'com convite político', vidasComConvite, 'convites', totalConv, 'entraram', entrou);
console.log(conv);
for (const i of idades) { const o = Object.entries(rede[i]).filter(([k]) => !k.includes(':')).map(([k, x]) => `${k}=${(x / (cnt[i] || 1)).toFixed(1)}`); console.log(i, o.join(' ')); const o2 = Object.entries(rede[i]).filter(([k]) => k.startsWith('amigo')).map(([k, x]) => `${k}=${(x / (cnt[i] || 1)).toFixed(1)}`); console.log('   ', o2.join(' ')); }
