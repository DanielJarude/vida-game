/**
 * AUDITORIA 12.3.1 — a narrativa do crime numa vida longa: tudo o que entra na biografia e no diário do caminho, de um
 * integrante que joga 30 anos. Mede repetição por "molde" (nomes, números e anos trocados por marcadores) e conta quantas
 * entradas só anunciam números (confiança, lealdade, exposição) sem acontecimento.
 *
 *   npx esbuild scripts/sim/narrativa1231.ts --bundle --platform=node --format=esm --outfile=<scratch>/n.mjs && N=8 ANOS=30 node <scratch>/n.mjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { criarContato, contatosAtivos } from '../../src/motor/sistemas/submundo';
import { abertas } from '../../src/motor/sistemas/encomendas';
import { garantirCidade, orgsDaCidade, relacaoCom } from '../../src/motor/sistemas/faccoes';
import { transacao } from '../../src/motor/nucleo';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const N = Number(process.env.N ?? 8), ANOS = Number(process.env.ANOS ?? 30);
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const molde = (s: string, nomes: string[]) => { let x = s; for (const n of nomes) if (n.length > 2) x = x.split(n).join('@'); return x.replace(/R\$\s?[\d.,]+\s?(mil|mi)?/g, '$').replace(/\b(19|20)\d\d\b/g, '#ano').replace(/\d+/g, '#').slice(0, 90); };
const moldes = new Map<string, number>(), porVida: number[] = [], distintos: number[] = [];
let total = 0, resultadosAcao = 0, consequenciasSoNumero = 0, anosComEventoCriminal = 0, anosTotal = 0;
const exemplos = new Map<string, string>();
for (let s = 0; s < N; s++) {
  let v = adulto(26, { semente: 4100 + s * 37, municipioId: s % 2 ? 'rio-de-janeiro-rj' : 'sao-paulo-sp' });
  v.financas.conta = 40000; v.justica = undefined; v.caminhos.envolvimento = undefined; v.momento = null;
  v = transacao(v, (x, r) => { entrar(x, 'grupo', undefined, r); criarContato(x, 'organizado', 'chefe'); criarContato(x, 'organizado', 'parceiro'); garantirCidade(x); const o = orgsDaCidade(x).find(z => z.ramo === 'organizado')!; const rel = relacaoCom(x, o); rel.relacao = 'aliada'; rel.lealdade = 50; }).vida;
  const t0 = v.t;
  const vistos = new Set<string>();
  let n = 0;
  for (let a = 0; a < ANOS && !v.morte; a++) {
    for (const x of abertas(v)) { const r = executar(v, { tipo: 'crime', acao: { area: 'encomenda', oque: 'aceitar', id: x.id } } as Acao); if (podeTentar(disponibilidade(v, { tipo: 'crime', acao: { area: 'encomenda', oque: 'aceitar', id: x.id } } as Acao))) { v = r.vida; resultadosAcao++; } }
    for (const c of contatosAtivos(v).slice(0, 2)) v = tenta(v, { tipo: 'crime', acao: { area: 'contato', oque: 'conversar', pessoaId: c.id } } as Acao);
    for (const o of orgsDaCidade(v).filter(z => v.caminhos.envolvimento?.organizacoes?.some(r => r.id === z.id && (r.relacao === 'membro' || r.relacao === 'aliada')))) { v = tenta(v, { tipo: 'crime', acao: { area: 'org', oque: 'filiar', orgId: o.id } } as Acao); v = tenta(v, { tipo: 'crime', acao: { area: 'org', oque: 'tarefa', orgId: o.id } } as Acao); v = tenta(v, { tipo: 'crime', acao: { area: 'org', oque: 'promocao', orgId: o.id } } as Acao); break; }
    const antes = v.biografia.length;
    v = avancarAno(v).vida;
    for (let i = 0; i < 16 && v.momento; i++) { const mo = v.momento; const op = (mo.situacaoId === 'ilic_rumo' ? mo.opcoes.find(o => o.id === 'seguir_esquema' && !o.bloqueio) : undefined) ?? mo.opcoes.find(o => !o.bloqueio && !/parar|largar|sair|recusar|denunciar|cortar|entregar|mudar|sumir|cooperar/.test(o.id)) ?? mo.opcoes.find(o => !o.bloqueio) ?? mo.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida; }
    anosTotal++;
    const novas = v.biografia.slice(antes).filter(b => b.tema === 'trabalho' || /organiza|facção|Justiça|por fora|investiga|process/.test(b.texto));
    if (novas.length) anosComEventoCriminal++;
  }
  const nomes = Object.values(v.pessoas).map(p => p.nome.split(' ')[0]).concat(Object.values(v.mundoCriminal?.orgs ?? {}).flatMap(o => [o.nome, ...o.quadro.map(q => q.nome)]));
  const textos = [...v.biografia.filter(b => b.t >= t0).map(b => b.texto), ...(v.caminhos.envolvimento?.diario ?? []).map(d => d.texto)];
  for (const t of textos) {
    if (!/organiza|grupo|por fora|Por fora|investiga|process|caminho|encomenda|Justiça|no meio|facção|a rede|turma do|sindicato|família [A-Z]|os [A-Z][a-z]+\b|pres[oa]|Entrou para|Subiu|confiança|lealdade|exposi/.test(t)) continue;
    const m = molde(t, nomes);
    moldes.set(m, (moldes.get(m) ?? 0) + 1);
    if (!exemplos.has(m)) exemplos.set(m, t);
    if (/^(Confiança|Lealdade|Exposição|O quanto)/.test(t)) consequenciasSoNumero++;
    vistos.add(m); n++; total++;
  }
  porVida.push(n); distintos.push(vistos.size);
}
const rep = [...moldes.entries()].sort((a, b) => b[1] - a[1]);
console.log(`vidas ${N} × ${ANOS} anos · textos do crime ${total} · moldes distintos ${moldes.size} (${Math.round(moldes.size / total * 100)}%) · por vida p50 ${porVida.sort((a, b) => a - b)[N >> 1]} textos, ${distintos.sort((a, b) => a - b)[N >> 1]} moldes`);
console.log(`anos com algum acontecimento do crime na biografia: ${anosComEventoCriminal}/${anosTotal} · resultados de ação ${resultadosAcao} · entradas só de número ${consequenciasSoNumero}`);
console.log('moldes mais repetidos (vezes · exemplo):');
for (const [m, k] of rep.slice(0, 25)) console.log(`  ${k} · ${exemplos.get(m)!.slice(0, 170)}`);
