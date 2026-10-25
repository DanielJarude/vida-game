/**
 * REWORK 12.2 — os negócios vivos, por tipo e por estilo de gestão. N vidas abrem a empresa e seguem ANOS anos:
 *   passivo   gestor contratado, o dono não mexe (o gestor decide o dia a dia do ramo — delegado)
 *   cuida     gestor contratado; o dono põe dinheiro na crise e reforma a cada cinco anos (como no REWORK 12)
 *   proprio   o dono toca (gestão própria) e decide o ramo com uma política sensata (o "bom dono")
 *   descuida  o dono toca e não decide nada (o ramo se desgasta)
 * Mede falência, resultado anual, o que chegou à pessoa e o múltiplo (recebido + parte no fim) ÷ investido.
 * DIAG=1: as contas do primeiro ano de operação de cada tipo (receita, variável, cada custo fixo).
 *   npx esbuild scripts/sim/negocios122.ts --bundle --platform=node --format=esm --outfile=<scratch>/n.mjs && N=20 node <scratch>/n.mjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { TIPOS_DE_EMPRESA } from '../../src/motor/dados/empresas';
import { contasDoAno, custosFixos, valorDaParte } from '../../src/motor/sistemas/empresas';
import { decisoesDoSetor, efeitosDoSetor, notaDoRestaurante, bemEstarDoZoo } from '../../src/motor/sistemas/setores';
import { criarRng } from '../../src/motor/rng';
import type { Empresa, TipoEmpresa, Vida } from '../../src/motor/tipos';

await carregarMundo();
const N = Number(process.env.N ?? 20);
const ANOS = Number(process.env.ANOS ?? 12);
const CIDADE = process.env.CIDADE ?? 'sao-paulo-sp';
const TIPOS = (process.env.TIPOS?.split(',') ?? TIPOS_DE_EMPRESA.map(t => t.id)) as TipoEmpresa[];
const POLITICAS = (process.env.POLITICAS?.split(',') ?? ['passivo', 'cuida', 'proprio', 'descuida']) as ('passivo' | 'cuida' | 'proprio' | 'descuida')[];
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const k = (x: number) => `${(x / 1000).toFixed(0)}k`;

function responder(v: Vida): Vida {
  for (let i = 0; i < 12 && v.momento && !v.morte; i++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento!.opcoes.find(o => !o.bloqueio)?.id ?? v.momento!.opcoes[0].id }).vida;
  return v;
}
const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);

/** O "bom dono" de cada ramo: decisões coerentes, sem gastar além do que o caixa aguenta. */
function bomDono(v: Vida, e: Empresa, ano: number): Vida {
  const id = e.id;
  const d = (decisao: string, alvo?: string) => { v = tenta(v, { tipo: 'setor', empresaId: id, decisao, alvo }); };
  const s = e.setor!;
  if (e.estado === 'em_crise') v = tenta(v, { tipo: 'empresa', empresaId: id, decisao: 'aportar' });
  if (ano % 5 === 4) v = tenta(v, { tipo: 'empresa', empresaId: id, decisao: 'melhorar' });
  if (s.restaurante) {
    if (ano === 0) { d('chef'); d('fornecedor', 'local'); }
    if (ano === 1) { d('conceito', 'especializado'); d('ingredientes', '3'); }
    if (ano === 3 && notaDoRestaurante(e) >= 4) v = tenta(v, { tipo: 'empresa', empresaId: id, decisao: 'preco_alto' });
    if (ano === 2) d('prato');
    if (s.restaurante.ambiente < 45) d('salao');
    if (s.restaurante.atendimento < 45) d('atendimento');
  } else if (s.hotel) {
    if (ano === 0) { d('temporada', 'dinamica'); d('servico', 'piscina'); }
    if (s.hotel.quartos < 45) d('quartos');
  } else if (s.clinica) {
    if (ano === 1) d('especialidade', 'cardiologia');
    if (s.clinica.conformidade < 60) d('conformidade');
    if (s.clinica.equipamento < 45) d('equipamento');
  } else if (s.academia) {
    if (ano === 0) d('retencao', 'aplicativo');
    if (ano === 1) d('modalidade', 'funcional');
    if (s.academia.equipamentos < 45) d('equipamentos');
  } else if (s.estudio) {
    if (ano === 0) d('tecnico');
    if (s.estudio.proposta) d('proposta', 'sim');
    if (s.estudio.equipamento < 45) d('equipamento_estudio');
  } else if (s.loja) {
    if (s.loja.encalhe >= 40) d('liquidacao');
    if (ano === 1) d('online');
  } else if (s.museu) {
    if (ano === 0) d('curador');
    if (ano % 2 === 1) { const ex = decisoesDoSetor(v, v.financas.empresas!.find(x => x.id === id)!).find(x => x.id === 'exposicao'); if (ex) d('exposicao', ex.alvo); }
    if (ano % 3 === 2) d('patrocinio');
  } else if (s.zoo) {
    if (ano === 0) d('educacao');
    if (ano === 2) v = tenta(v, { tipo: 'empresa', empresaId: id, decisao: 'conservacao' });
    if (bemEstarDoZoo(v.financas.empresas!.find(x => x.id === id)!) < 62) d('reformar_recintos');
  }
  return v;
}

if (process.env.DIAG) {
  for (const tipo of TIPOS) {
    let v = adulto(35, { semente: 7, municipioId: CIDADE });
    v.financas.conta += 40_000_000;
    v = executar(v, { tipo: 'empresa_abrir', empresa: tipo, comSocio: false }).vida;
    const e = v.financas.empresas![0];
    e.estado = 'operando';
    const c = contasDoAno(v, e, criarRng(3));
    const ef = efeitosDoSetor(v, e);
    console.log(`\n${tipo}: público ${c.publico} receita ${k(c.receita)} custos ${k(c.custos)} apoio ${k(c.apoio)} imposto ${k(c.imposto)} resultado ${k(c.resultado)} | ef procura ${ef.procura.toFixed(2)} ticket ${ef.ticket.toFixed(2)} variável ${ef.variavel.toFixed(2)} cap ${ef.capacidade.toFixed(2)}${e.setor?.restaurante ? ` nota ${notaDoRestaurante(e)}` : ''}${e.setor?.zoo ? ` bem ${bemEstarDoZoo(e)}` : ''}`);
    for (const x of custosFixos(v, e)) console.log(`   ${x.rotulo.padEnd(48)} ${k(x.valor)}`);
  }
  process.exit(0);
}

for (const pol of POLITICAS) {
  console.log(`\n== ${pol} (${N} vidas, ${ANOS} anos, ${CIDADE})`);
  for (const tipo of TIPOS) {
    const falidas: number[] = []; const roi: number[] = []; const medias: number[] = []; const recebido: number[] = [];
    for (let s = 0; s < N; s++) {
      let v = adulto(35, { semente: 1000 + s * 7, municipioId: CIDADE });
      v.financas.conta += 60_000_000;
      v = tenta(v, { tipo: 'empresa_abrir', empresa: tipo, comSocio: false });
      const e0 = v.financas.empresas?.[0];
      if (!e0) continue;
      const id = e0.id;
      const inv0 = e0.investido;
      if (pol === 'proprio' || pol === 'descuida') v = tenta(v, { tipo: 'empresa', empresaId: id, decisao: 'assumir' });
      if (pol === 'proprio' || pol === 'descuida') v = tenta(v, { tipo: 'empresa_delegar', empresaId: id, delegar: false });
      let rec = 0;
      for (let y = 0; y < ANOS && !v.morte; y++) {
        v = responder(avancarAno(v).vida);
        const e = v.financas.empresas?.find(x => x.id === id);
        if (!e || e.estado === 'encerrada') break;
        rec += (e.ultimo?.distribuido ?? 0) * e.parte;
        if (pol === 'proprio') v = bomDono(v, e, y);
        if (pol === 'cuida') for (const d of [e.estado === 'em_crise' ? 'aportar' : '', y % 5 === 4 ? 'melhorar' : ''].filter(Boolean)) v = tenta(v, { tipo: 'empresa', empresaId: id, decisao: d as never });
      }
      const e = v.financas.empresas?.find(x => x.id === id);
      falidas.push(!e || e.estado === 'encerrada' ? 1 : 0);
      const h = e?.historico ?? [];
      medias.push(h.length ? h.reduce((x, y) => x + y, 0) / h.length : 0);
      recebido.push(rec);
      roi.push((rec + (e ? valorDaParte(e) : 0)) / Math.max(1, e?.investido ?? inv0));
    }
    console.log(`${tipo.padEnd(11)} faliu ${(falidas.reduce((a, b) => a + b, 0) / Math.max(1, falidas.length) * 100).toFixed(0).padStart(3)}% | resultado/ano p10 ${k(pct(medias, 0.1)).padStart(6)} p50 ${k(pct(medias, 0.5)).padStart(6)} p90 ${k(pct(medias, 0.9)).padStart(6)} | recebido p50 ${k(pct(recebido, 0.5)).padStart(6)} | múltiplo p10 ${pct(roi, 0.1).toFixed(2)} p50 ${pct(roi, 0.5).toFixed(2)} p90 ${pct(roi, 0.9).toFixed(2)}`);
  }
}
