/** VIDA 16 · sim: carreiras religiosas e ofícios com escolhas aleatórias (crashes, invariantes, distribuição das etapas). */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { avancarAno } from '../../src/motor/ano';
import { podeTentar } from '../../src/motor/plausibilidade';
import { crencaDe } from '../../src/motor/v14/crencas/crencas';
import { TRADICOES16, type Tradicao16 } from '../../src/motor/dados16/religiao/tradicoes16';
import { pastaDe16, decisoesDe16 } from '../../src/motor/v16/oficios/oficios16';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 24);
const finais: Record<string, number> = {};
let erros = 0;
const tentar = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const T: [Tradicao16, string, 'masculino' | 'feminino'][] = [['catolica', 'catolica', 'masculino'], ['catolica_consagrada', 'catolica', 'feminino'], ['evangelica', 'evangelica', 'feminino'], ['candomble', 'candomble', 'feminino'], ['umbanda', 'umbanda', 'masculino'], ['espirita', 'espirita', 'feminino'], ['judaismo', 'judaismo', 'masculino'], ['islamismo', 'islamismo', 'masculino'], ['budismo', 'budismo', 'feminino']];
for (let s = 1; s <= N; s++) {
  const [t, c, g] = T[s % T.length];
  const rr = criarRng(s * 31);
  try {
    let v = structuredClone(adulto(19, { semente: s, genero: g }));
    v.crenca14 = { ...crencaDe(v), atual: c as never, pratica: 'regular' };
    v.financas.conta = 80000;
    v = tentar(v, { tipo: 'religiao16', oque: { op: 'entrar', tradicao: t } });
    for (let a = 0; a < 40 && !v.morte; a++) {
      for (const gg of ['formar', 'servir', 'acolher'] as const) if (rr.chance(0.75)) v = tentar(v, { tipo: 'religiao16', oque: { op: 'gesto', g: gg } });
      v = tentar(v, { tipo: 'religiao16', oque: { op: 'avancar' } });
      v = tentar(v, { tipo: 'religiao16', oque: { op: 'abrir_casa' } });
      const r = v.religiao16;
      if (r?.questao && rr.chance(0.8)) v = tentar(v, { tipo: 'religiao16', oque: { op: 'questao', escolha: rr.pick(r.questao.opcoes).id } });
      if (r && TRADICOES16[r.tradicao].projetos.length) v = tentar(v, { tipo: 'religiao16', oque: { op: 'projeto', id: rr.pick(TRADICOES16[r.tradicao].projetos).id } });
      const x = avancarAno(v).vida; x.momento = null; (x as Vida & { fila?: unknown }).fila = undefined; v = x;
      const q = v.religiao16;
      if (q && (q.etapa < 0 || q.etapa >= TRADICOES16[q.tradicao].etapas.length || [q.formacao, q.prestigio, q.coesao, q.influencia].some(n => n < 0 || n > 100 || Number.isNaN(n)))) { erros++; console.log('INVARIANTE', s, JSON.stringify(q).slice(0, 200)); }
    }
    const r = v.religiao16;
    const k = `${t}:${r ? TRADICOES16[r.tradicao].etapas[r.etapa].id : '-'}${r?.saiu ? '(saiu:' + r.saiu.motivo + ')' : ''}`;
    finais[k] = (finais[k] ?? 0) + 1;
  } catch (e) { erros++; console.log('ERRO', s, (e as Error).stack?.slice(0, 400)); }
}
// Ofícios: 3 ramos × N/3 vidas, decisões aleatórias, 6 anos.
const ofi: Record<string, number> = {};
for (let s = 1; s <= N; s++) {
  const ocup = ['advogado', 'professor_fund', 'dev_pleno'][s % 3];
  const rr = criarRng(s * 7);
  try {
    let v = structuredClone(adulto(30, { semente: s }));
    v.trabalho.atual = { ocupacaoId: ocup, empregador: 'x', contrato: ocup === 'advogado' ? 'autonomo' : 'clt', salario: 6000, tInicio: v.t - 36, desempenho: 60, municipioId: v.moradia.municipioId, carga: 'integral' };
    for (let a = 0; a < 6 && !v.morte; a++) {
      const p = pastaDe16(v);
      if (!p) break;
      v = tentar(v, { tipo: 'oficio16', oque: { op: 'abordagem', escolha: rr.pick(['tradicional', 'projetos', 'reforco', 'conversa'] as const) } });
      v = tentar(v, { tipo: 'oficio16', oque: { op: 'ritmo', escolha: rr.pick(['prazo', 'equilibrio', 'qualidade'] as const) } });
      for (const it of pastaDe16(v)!.itens) {
        v = tentar(v, { tipo: 'oficio16', oque: { op: rr.chance(0.7) ? 'aceitar' : 'recusar', id: it.id } });
        v = tentar(v, { tipo: 'oficio16', oque: { op: 'estrategia', id: it.id, escolha: rr.chance(0.5) ? 'acordo' : 'julgamento' } });
        const d = decisoesDe16(it); if (d.length) v = tentar(v, { tipo: 'oficio16', oque: { op: 'decidir', id: it.id, escolha: rr.pick(d).escolha } });
      }
      const x = avancarAno(v).vida; x.momento = null; (x as Vida & { fila?: unknown }).fila = undefined; v = x;
    }
    const p = v.oficio16;
    ofi[`${p?.ramo}`] = (ofi[`${p?.ramo}`] ?? 0) + 1;
    if (p && (p.rep < 0 || p.rep > 100)) erros++;
  } catch (e) { erros++; console.log('ERRO OFICIO', s, (e as Error).stack?.slice(0, 400)); }
}
console.log(JSON.stringify({ erros, finais, ofi }, null, 1));
