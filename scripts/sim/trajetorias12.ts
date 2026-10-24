/**
 * REWORK 12 · Fase J — trajetórias econômicas longas (25 anos, dos 30 aos 55), N vidas por perfil, sempre pelo que
 * o jogador pode fazer (`disponibilidade` → `executar`) e pelo ano do motor. Perfis: baixa renda, renda média
 * (financia a casa), alta renda (casa, carro, aplicações), investidor imobiliário (compra para alugar), empreendedor
 * (abre e toca uma empresa), negócio paralelo (profissional com empresa de gestor contratado), endividado (financia
 * tudo e pega empréstimo) e muito rico (exóticos, coleção, museu). Mede: patrimônio líquido e liquidez no fim
 * (p10/p50/p90), crescimento anual real, falências, anos "no vermelho", veículos perdidos em mudanças, e invariantes
 * (NaN, patrimônio que explode sem causa, despesa positiva).
 *   npx esbuild scripts/sim/trajetorias12.ts --bundle --platform=node --format=esm --outfile=<scratch>/t.mjs && N=20 node <scratch>/t.mjs
 * RECUPERA=1: os cenários de recuperação (perda de emprego, empresa no vermelho, financiamento pesado, venda na baixa,
 * despesa familiar inesperada) — a fração que volta ao patrimônio de antes em 10 anos.
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { balanco, orcamento, seguranca } from '../../src/motor/sistemas/dinheiro';
import { liquidezImediata } from '../../src/motor/sistemas/investimentos';
import { ofertasDeImoveis, ofertasDeVeiculos } from '../../src/motor/sistemas/mercado';
import { ofertasDeColecao } from '../../src/motor/sistemas/colecao';
import { empresasAtivas } from '../../src/motor/sistemas/empresas';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const N = Number(process.env.N ?? 16);
const ANOS = Number(process.env.ANOS ?? 25);
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const k = (x: number) => (Math.abs(x) >= 1e6 ? `${(x / 1e6).toFixed(1)}mi` : `${Math.round(x / 1000)}k`);
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);

function responder(v: Vida): Vida {
  for (let i = 0; i < 12 && v.momento && !v.morte; i++) {
    const m = v.momento!;
    const pref = ['negociar', 'aportar', 'manter', 'recusar', 'esperar'];
    const op = pref.map(p => m.opcoes.find(o => o.id === p && !o.bloqueio)).find(Boolean) ?? m.opcoes.find(o => !o.bloqueio) ?? m.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}

type Perfil = 'baixa' | 'media' | 'alta' | 'imobiliario' | 'empreendedor' | 'paralelo' | 'endividado' | 'muito_rico';
const PERFIS: Perfil[] = (process.env.PERFIS?.split(',') as Perfil[]) ?? ['baixa', 'media', 'alta', 'imobiliario', 'empreendedor', 'paralelo', 'endividado', 'muito_rico'];

function comecar(p: Perfil, s: number): Vida {
  const cidade = p === 'baixa' ? 'recife-pe' : 'sao-paulo-sp';
  const v = adulto(30, { semente: 500 + s * 13, municipioId: cidade });
  v.trabalho.atual = undefined;
  const oc = { baixa: 'aux_limpeza', media: 'assistente_adm', alta: 'engenheiro_infra', imobiliario: 'engenheiro_infra', empreendedor: 'assistente_adm', paralelo: 'medico', endividado: 'assistente_adm', muito_rico: 'engenheiro_infra' }[p];
  try { contratar(v, criarRng(s), ocupacao(oc)); } catch { contratar(v, criarRng(s), ocupacao('assistente_adm')); }
  v.trabalho.licencas.push('cnh');
  v.financas.dividas = []; v.financas.negativado = false;
  v.financas.conta = { baixa: 3000, media: 30000, alta: 150000, imobiliario: 400000, empreendedor: 600000, paralelo: 2_500_000, endividado: 20000, muito_rico: 60_000_000 }[p];
  return v;
}

function politica(p: Perfil, v: Vida, ano: number): Vida {
  const imoveis = v.financas.bens.filter(b => b.tipo === 'imovel');
  const carro = v.financas.bens.some(b => b.tipo === 'veiculo');
  const vendas = ofertasDeImoveis(v, 'venda').sort((a, b) => a.preco - b.preco);
  if (p === 'media' && !imoveis.length) for (const o of vendas) { const w = tenta(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 30 }); if (w !== v) { v = w; break; } }
  if (p === 'alta') {
    if (!imoveis.length) for (const o of vendas.filter(x => x.modeloId === 'apto_3q' || x.modeloId === 'casa_3q')) { const w = tenta(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 20 }); if (w !== v) { v = w; break; } }
    if (!carro) { const o = ofertasDeVeiculos(v, 'concessionaria').find(x => x.preco < 200000); if (o) v = tenta(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false }); }
    if (v.financas.conta > 60000) v = tenta(v, { tipo: 'investir', destino: 'pos_fixado', valor: Math.round(v.financas.conta - 40000) });
  }
  if (p === 'imobiliario') for (const o of vendas.filter(x => ['kitnet', 'apto_1q', 'apto_2q'].includes(x.modeloId))) { const w = tenta(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: v.financas.conta < o.preco * 1.1, morar: false, prazo: 20 }); if (w !== v) { v = w; break; } }
  if (p === 'empreendedor') {
    if (!empresasAtivas(v).length && ano === 0) v = tenta(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false });
    const e = empresasAtivas(v)[0];
    if (e) {
      if (ano === 0) v = tenta(v, { tipo: 'empresa', empresaId: e.id, decisao: 'assumir' });
      if (e.estado === 'em_crise') v = tenta(v, { tipo: 'empresa', empresaId: e.id, decisao: 'aportar' });
      if (ano % 5 === 4) v = tenta(v, { tipo: 'empresa', empresaId: e.id, decisao: 'melhorar' });
    }
  }
  if (p === 'paralelo') {
    if (!empresasAtivas(v).length && ano === 0) v = tenta(v, { tipo: 'empresa_abrir', empresa: 'clinica', comSocio: true });
    const e = empresasAtivas(v)[0];
    if (e?.estado === 'em_crise') v = tenta(v, { tipo: 'empresa', empresaId: e.id, decisao: 'aportar' });
  }
  if (p === 'endividado') {
    if (!imoveis.length) for (const o of [...vendas].reverse()) { const w = tenta(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 35 }); if (w !== v) { v = w; break; } }
    if (!carro) { const o = ofertasDeVeiculos(v, 'concessionaria').sort((a, b) => b.preco - a.preco).find(x => podeTentar(disponibilidade(v, { tipo: 'comprar_veiculo', ofertaId: x.id, financiar: true }))); if (o) v = tenta(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: true }); }
    if (ano % 3 === 0) v = tenta(v, { tipo: 'emprestimo', valor: 5000, meses: 24 });
  }
  if (p === 'muito_rico') {
    if (ano === 0) {
      const ex = ofertasDeVeiculos(v, 'colecionador');
      for (const o of ex.slice(0, 3)) v = tenta(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false });
      for (const l of ['relojoaria', 'galeria', 'leilao'] as const) for (const o of ofertasDeColecao(v, l).slice(0, 2)) v = tenta(v, { tipo: 'colecao_comprar', ofertaId: o.id });
      v = tenta(v, { tipo: 'empresa_abrir', empresa: 'museu', comSocio: false });
      const cob = vendas.filter(x => x.modeloId === 'cobertura' || x.modeloId === 'mansao').pop();
      if (cob) v = tenta(v, { tipo: 'comprar_imovel', ofertaId: cob.id, financiar: false, morar: true });
    }
    const museu = empresasAtivas(v).find(e => e.tipo === 'museu');
    if (museu?.estado === 'em_crise') v = tenta(v, { tipo: 'empresa', empresaId: museu.id, decisao: 'aportar' });
    if (v.financas.conta > 2_000_000) v = tenta(v, { tipo: 'investir', destino: 'pos_fixado', valor: Math.round(v.financas.conta - 1_000_000) });
  }
  return v;
}

const linhas: string[] = [];
for (const p of PERFIS) {
  const liq: number[] = []; const liquidez: number[] = []; const cresc: number[] = []; const vermelho: number[] = []; let falencias = 0; let empresas = 0; let anomalias = 0; let mortes = 0;
  for (let s = 0; s < N; s++) {
    let v = comecar(p, s);
    const inicio = balanco(v).liquido;
    let anosVermelho = 0;
    for (let a = 0; a < ANOS && !v.morte; a++) {
      v = politica(p, v, a);
      v = responder(avancarAno(v).vida);
      const b = balanco(v);
      if (!Number.isFinite(b.liquido) || b.liquido > 1e12) anomalias++;
      if (orcamento(v).saidas.some(l => l.valor > 0.5)) anomalias++;
      if (seguranca(v).nivel === 'no_vermelho') anosVermelho++;
    }
    if (v.morte) { mortes++; continue; }
    const b = balanco(v);
    liq.push(b.liquido); liquidez.push(liquidezImediata(v)); vermelho.push(anosVermelho);
    const anos = ANOS;
    cresc.push(inicio > 0 && b.liquido > 0 ? Math.pow(b.liquido / inicio, 1 / anos) - 1 : NaN);
    for (const e of v.financas.empresas ?? []) { empresas++; if (e.estado === 'encerrada' && (e.historia ?? []).some(h => h.texto === 'Faliu.')) falencias++; }
  }
  const c = cresc.filter(Number.isFinite);
  linhas.push(`${p.padEnd(13)} vidas ${liq.length}/${N}${mortes ? ` (${mortes} morreram)` : ''} | líquido p10 ${k(pct(liq, 0.1))} p50 ${k(pct(liq, 0.5))} p90 ${k(pct(liq, 0.9))} | liquidez p50 ${k(pct(liquidez, 0.5))} | crescimento real/ano p50 ${c.length ? (pct(c, 0.5) * 100).toFixed(1) : '—'}% | anos no vermelho p50 ${pct(vermelho, 0.5)} p90 ${pct(vermelho, 0.9)} | empresas ${empresas}, falidas ${falencias} | anomalias ${anomalias}`);
  console.log(linhas[linhas.length - 1]);
}

if (process.env.RECUPERA === '1') {
  console.log('\nRecuperação (10 anos depois do choque; "voltou" = patrimônio líquido ≥ 80% do de antes do choque):');
  const choques: [string, (v: Vida) => Vida][] = [
    ['perda de emprego', v => { v.trabalho.atual = undefined; return v; }],
    ['empresa no vermelho', v => { const w = tenta(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false }); const e = empresasAtivas(w)[0]; if (e) e.caixa = -400000; return w; }],
    ['financiamento pesado', v => { for (const o of ofertasDeImoveis(v, 'venda').sort((a, b) => b.preco - a.preco)) { const w = tenta(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 35 }); if (w !== v) return w; } return v; }],
    ['venda na baixa', v => { const o = ofertasDeColecao(v, 'galeria')[0]; let w = o ? tenta(v, { tipo: 'colecao_comprar', ofertaId: o.id }) : v; const c = w.financas.colecao?.[0]; if (c) w = tenta(w, { tipo: 'colecao_vender', pecaId: c.id, modo: 'rapido' }); return w; }],
    ['despesa familiar inesperada', v => { v.financas.conta -= 120000; return v; }]
  ];
  for (const [nome, choque] of choques) {
    let voltou = 0; let total = 0; const quedas: number[] = [];
    for (let s = 0; s < N; s++) {
      let v = comecar('alta', s + 300);
      for (let a = 0; a < 3; a++) { v = politica('alta', v, a); v = responder(avancarAno(v).vida); }
      const antes = balanco(v).liquido;
      v = choque(v);
      quedas.push(balanco(v).liquido / Math.max(1, antes));
      for (let a = 0; a < 10 && !v.morte; a++) {
        if (!v.trabalho.atual && a >= 1) { try { contratar(v, criarRng(s + a), ocupacao('assistente_adm')); } catch { /* sem vaga */ } }
        const e = empresasAtivas(v)[0];
        if (e?.estado === 'em_crise' && a >= 1) v = tenta(v, { tipo: 'empresa', empresaId: e.id, decisao: 'encerrar' });
        v = responder(avancarAno(v).vida);
      }
      if (v.morte) continue;
      total++;
      if (balanco(v).liquido >= antes * 0.8) voltou++;
    }
    console.log(`  ${nome.padEnd(28)} voltou ${voltou}/${total} | patrimônio logo depois do choque, p50 ${(pct(quedas, 0.5) * 100).toFixed(0)}% do de antes`);
  }
}
