/**
 * REWORK 12.3 · D11 — auditoria da narrativa do crime em vidas longas: cada perfil aceita as propostas que chegam, conversa
 * com os contatos e responde às perguntas do caminho. Coleta cada texto de resultado (com o estado antes e depois) e mede:
 *   - textos distintos / total; a mesma frase exata em menos de 3 anos (repetição)
 *   - coerência: texto de sucesso com dinheiro que não entrou; texto de fracasso com dinheiro que entrou
 *   - nomes: o texto do trabalho de um contato cita o nome dele
 *   - amostras reais (as primeiras de cada perfil) para o relatório
 *
 *   npx esbuild scripts/sim/narrativa123.ts --bundle --platform=node --format=esm --outfile=<scratch>/n.mjs && N=6 ANOS=20 node <scratch>/n.mjs
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
import type { CategoriaIlicita, Vida } from '../../src/motor/tipos';
import * as fs from 'node:fs';

await carregarMundo();
const N = Number(process.env.N ?? 6);
const ANOS = Number(process.env.ANOS ?? 20);
const OUT = process.env.OUT;
const PERFIS: { nome: string; cat: CategoriaIlicita; org?: boolean; lider?: boolean }[] = [
  { nome: 'furtos', cat: 'patrimonial' }, { nome: 'contrabando', cat: 'mercado' }, { nome: 'fraudes', cat: 'fraude' },
  { nome: 'integrante', cat: 'grupo', org: true }, { nome: 'líder', cat: 'grupo', org: true, lider: true }
];
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
// Quem segue no caminho: prefere seguir/aceitar/manter; evita parar, largar, sair, denunciar.
const PREF = ['seguir', 'aceitar', 'continuar', 'manter', 'particular', 'recorrer', 'ficar', 'apoiar', 'fundo', 'a'];
const EVITA = /parar|largar|sair|denunciar|recusar|entregar|assumir|cooperar|desistir|moita/;
const escolha = (v: Vida) => { const ls = v.momento!.opcoes.filter(o => !o.bloqueio); return (PREF.map(p => ls.find(o => o.id === p)).find(Boolean) ?? ls.find(o => !EVITA.test(o.id)) ?? ls[0] ?? v.momento!.opcoes[0]).id; };
interface Registro { perfil: string; t: number; texto: string; delta: number; estado?: string; mudancas: string[] }
const regs: Registro[] = [];
const bio: string[] = [];
const bloqueios = new Map<string, number>();
let propostas = 0;

for (const p of PERFIS) for (let k = 0; k < N; k++) {
  let v = adulto(28, { semente: 12300 + k * 17 + p.nome.length, municipioId: k % 2 ? 'sao-paulo-sp' : 'rio-de-janeiro-rj' });
  v.financas.conta = 60_000; v.momento = null; delete v.fila;
  v = transacao(v, (x, r) => {
    entrar(x, p.cat, undefined, r); garantirCidade(x);
    criarContato(x, p.cat === 'mercado' ? 'contrabando' : p.cat === 'fraude' ? 'fraudes' : p.cat === 'grupo' ? 'organizado' : 'furtos', 'parceiro', 55);
    if (p.org) { const o = orgsDaCidade(x).find(z => z.ramo === 'organizado') ?? orgsDaCidade(x)[0]; const rel = relacaoCom(x, o); rel.relacao = 'membro'; rel.nivel = p.lider ? 4 : 1; rel.lealdade = 62; }
  }).vida;
  const nBio0 = v.biografia.length;
  for (let ano = 0; ano < ANOS && !v.morte; ano++) {
    propostas += abertas(v).length;
    for (const enc of abertas(v)) {
      const a: Acao = { tipo: 'crime', acao: { area: 'encomenda', oque: 'aceitar', id: enc.id } };
      if (!tenta(v, a)) { const m = disponibilidade(v, a).motivo ?? '?'; bloqueios.set(m, (bloqueios.get(m) ?? 0) + 1); continue; }
      const antes = v.financas.conta;
      const r = executar(v, a);
      const x = r.vida.caminhos.envolvimento?.encomendas?.find(y => y.id === enc.id);
      regs.push({ perfil: p.nome, t: v.t, texto: r.resultado ?? '', delta: r.vida.financas.conta - antes, estado: x?.estado, mudancas: r.mudancas ?? [] });
      v = r.vida;
      for (let j = 0; j < 8 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: escolha(v) }).vida;
    }
    for (const c of contatosAtivos(v).slice(0, 2)) {
      const a: Acao = { tipo: 'crime', acao: { area: 'contato', oque: 'conversar', pessoaId: c.id } };
      if (tenta(v, a)) { const r = executar(v, a); regs.push({ perfil: p.nome, t: v.t, texto: r.resultado ?? '', delta: 0, mudancas: r.mudancas ?? [] }); v = r.vida; }
    }
    v = avancarAno(v).vida;
    for (let j = 0; j < 10 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: escolha(v) }).vida;
  }
  for (const e of v.biografia.slice(nBio0)) if (e.tema === 'trabalho' || /por fora|investiga|organiza|process/i.test(e.texto)) bio.push(`${p.nome}|${e.t}|${e.texto}`);
}

const trabalhos = regs.filter(r => r.estado);
const distintos = new Set(regs.map(r => r.texto)).size;
let repet = 0;
const ult = new Map<string, number>();
for (const r of regs) { const u = ult.get(`${r.perfil}|${r.texto}`); if (u !== undefined && r.t - u < 36) repet++; ult.set(`${r.perfil}|${r.texto}`, r.t); }
const sucessoSemDinheiro = trabalhos.filter(r => r.estado === 'concluida' && r.delta <= 0).length;
const fracassoComTextoDeSucesso = trabalhos.filter(r => r.estado === 'falhou' && /Saiu como combinado|no seu bolso|A sua parte:/.test(r.texto)).length;
const bioDistintos = new Set(bio.map(b => b.split('|')[2])).size;
console.log(`# Narrativa do crime — ${PERFIS.length} perfis × ${N} vidas × ${ANOS} anos`);
console.log(`- textos de ação: ${regs.length} (${distintos} distintos, ${(distintos / Math.max(1, regs.length) * 100).toFixed(0)}%); a mesma frase em < 3 anos na mesma vida-perfil: ${repet}`);
console.log(`- propostas vistas: ${propostas}; bloqueios: ${JSON.stringify([...bloqueios])}`);
console.log(`- trabalhos: ${trabalhos.length} (${trabalhos.filter(r => r.estado === 'concluida').length} deram certo)`);
console.log(`- incoerências: sucesso sem dinheiro = ${sucessoSemDinheiro}; fracasso com frase de sucesso = ${fracassoComTextoDeSucesso}`);
console.log(`- linhas da biografia do caminho: ${bio.length} (${bioDistintos} distintas)`);
console.log('\n## Amostras (texto · consequências)');
for (const p of PERFIS) for (const r of trabalhos.filter(x => x.perfil === p.nome).slice(0, 3)) console.log(`- [${p.nome}] ${r.texto}${r.mudancas.length ? ` ⟶ ${r.mudancas.slice(0, 3).join(' | ')}` : ''}`);
console.log('\n## Biografia (amostra)');
for (const b of bio.filter((_, i) => i % Math.max(1, Math.floor(bio.length / 12)) === 0).slice(0, 12)) console.log(`- ${b.split('|')[0]}: ${b.split('|')[2]}`);
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ regs, bio }, null, 1));
