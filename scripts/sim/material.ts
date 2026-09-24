/**
 * Simulador da ATT 3 — vida material.
 *
 *   npx esbuild scripts/sim/material.ts --bundle --platform=node --outfile=/tmp/mat.cjs
 *   VIDAS=20 SAIDA=/tmp/vida-mat node /tmp/mat.cjs
 *
 * Cada perfil material usa uma estratégia de vida (estudo, trabalho, amor)
 * do simulador geral e troca as decisões de dinheiro, casa, bens e bichos
 * pelas do perfil. Não são jogadores ótimos: são jeitos de lidar com
 * dinheiro. Grava biografias legíveis e imprime distribuições.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { condicoesImovel, condicoesVeiculo, disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Momento, Produto, Vida } from '../../src/motor/tipos';
import { filhos, idade, parceiro, pets as petsDe } from '../../src/motor/nucleo';
import { balanco, obrigacoesAtrasadas, orcamento, seguranca } from '../../src/motor/sistemas/dinheiro';
import { moraComFamiliaDeOrigem } from '../../src/motor/sistemas/domicilio';
import { animaisParaVoce, imoveisParaVoce, veiculosParaVoce } from '../../src/motor/sistemas/relevancia';
import { negociosPossiveis } from '../../src/motor/sistemas/negocio';
import { casaApertada } from '../../src/motor/sistemas/imoveis';
import { anosDoVeiculo } from '../../src/motor/sistemas/veiculos';
import { podeTentar } from '../../src/motor/plausibilidade';
import { MUNICIPIOS, municipio } from '../../src/motor/dados/lugares';
import { estrategia } from './estrategias';
import { SALARIO_MINIMO } from '../../src/motor/sistemas/renda';

const VIDAS = Number(process.env.VIDAS ?? 12);
const SAIDA = process.env.SAIDA ?? '/tmp/vida-mat';
mkdirSync(SAIDA, { recursive: true });

interface PerfilMaterial {
  nome: string;
  base: string;
  estilo: Vida['financas']['estilo'];
  /** Fração do que sobra acima da reserva-alvo que vai para as aplicações. */
  aplica: number;
  /** Meses de despesa na reserva antes de aplicar em outra coisa. */
  reservaMeses: number;
  carteira: Partial<Record<Produto, number>>;
  casa: 'aluga' | 'compra' | 'pais';
  saiAos: number;
  carro: 'usado' | 'novo' | 'moto' | 'nenhum';
  oficina: 'conserta' | 'adia' | 'vende';
  pet: boolean;
  mudaCidade?: boolean;
  empreende?: boolean;
}

const P = (p: Partial<PerfilMaterial> & { nome: string; base: string }): PerfilMaterial => ({
  estilo: 'modesto', aplica: 0.6, reservaMeses: 6, carteira: { pos_fixado: 1 }, casa: 'aluga', saiAos: 23, carro: 'usado', oficina: 'conserta', pet: false, ...p
});

const PERFIS: PerfilMaterial[] = [
  P({ nome: 'poupador', base: 'economico', estilo: 'apertado', aplica: 0.9, carteira: { pos_fixado: 0.6, inflacao: 0.4 }, casa: 'compra', saiAos: 25 }),
  P({ nome: 'consumidor', base: 'gastador', estilo: 'folgado', aplica: 0.1, reservaMeses: 1, carro: 'novo', oficina: 'adia', saiAos: 20 }),
  P({ nome: 'conservador', base: 'familiar', aplica: 0.8, carteira: { pos_fixado: 0.7, inflacao: 0.3 }, casa: 'compra' }),
  P({ nome: 'arrojado', base: 'ambicioso', estilo: 'confortavel', aplica: 0.85, reservaMeses: 2, carteira: { acoes: 0.7, acao_unica: 0.15, imobiliario: 0.15 }, casa: 'aluga' }),
  P({ nome: 'inquilino', base: 'social', aplica: 0.5, carteira: { pos_fixado: 0.5, acoes: 0.5 }, casa: 'aluga', carro: 'nenhum' }),
  P({ nome: 'comprador', base: 'familiar', aplica: 0.4, casa: 'compra', saiAos: 22 }),
  P({ nome: 'sem_patrimonio', base: 'impulsivo', estilo: 'folgado', aplica: 0, reservaMeses: 0, casa: 'aluga', carro: 'moto', oficina: 'adia', saiAos: 19 }),
  P({ nome: 'familia', base: 'familiar', aplica: 0.5, carteira: { pos_fixado: 0.5, inflacao: 0.5 }, casa: 'compra', pet: true }),
  P({ nome: 'solteiro', base: 'antissocial', aplica: 0.6, carteira: { pos_fixado: 0.4, acoes: 0.6 }, casa: 'aluga', saiAos: 26 }),
  P({ nome: 'empreendedor', base: 'social', estilo: 'confortavel', aplica: 0.4, casa: 'aluga', empreende: true }),
  P({ nome: 'instavel', base: 'impulsivo', aplica: 0.3, reservaMeses: 3, carro: 'moto', casa: 'aluga', oficina: 'adia' }),
  P({ nome: 'tutor', base: 'desatento', aplica: 0.5, pet: true, casa: 'aluga' }),
  P({ nome: 'migrante', base: 'ambicioso', aplica: 0.5, mudaCidade: true, casa: 'aluga', saiAos: 21 }),
  P({ nome: 'na_casa_dos_pais', base: 'passivo', aplica: 0.5, casa: 'pais', carro: 'nenhum' })
];

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const MATERIAIS = new Set(['sair_de_casa', 'trocar_moradia', 'estilo', 'comprar_veiculo', 'comprar_imovel', 'investir', 'resgatar']);

function agirMaterial(v: Vida, p: PerfilMaterial, r: Rng): Acao[] {
  const out: Acao[] = [];
  const i = idade(v);
  if (i < 18) return out;
  const f = v.financas;
  if (!moraComFamiliaDeOrigem(v) && f.estilo !== p.estilo) out.push({ tipo: 'estilo', valor: p.estilo });
  if (moraComFamiliaDeOrigem(v) && p.estilo !== f.estilo && i >= 18) out.push({ tipo: 'estilo', valor: p.estilo });
  // Sair de casa
  if (p.casa !== 'pais' && moraComFamiliaDeOrigem(v) && i >= p.saiAos) {
    const o = imoveisParaVoce(v, 'aluguel').para[0]?.item;
    if (o && tenta(v, { tipo: 'sair_de_casa', ofertaId: o.id })) out.push({ tipo: 'sair_de_casa', ofertaId: o.id });
  }
  // Casa maior quando a família cresce
  if (v.moradia.tipo === 'aluguel' && orcamento(v).sobra > 0 && casaApertada(v)) {
    const o = imoveisParaVoce(v, 'aluguel').para.find(x => /família|filho/.test(x.motivo))?.item;
    if (o && tenta(v, { tipo: 'trocar_moradia', ofertaId: o.id })) out.push({ tipo: 'trocar_moradia', ofertaId: o.id });
  }
  // Comprar a casa
  if (p.casa === 'compra' && i >= 27 && v.moradia.tipo !== 'propria' && !f.bens.some(b => b.tipo === 'imovel' && !b.herdado)) {
    const o = imoveisParaVoce(v, 'venda').para[0]?.item;
    if (o) {
      const aVista = condicoesImovel(v, o.preco, false);
      const a: Acao = podeTentar(aVista.veredito) ? { tipo: 'comprar_imovel', ofertaId: o.id, financiar: false, morar: true } : { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 30 };
      if (tenta(v, a)) out.push(a);
    }
  }
  // Carteira de motorista e veículo
  if (p.carro !== 'nenhum' && !v.trabalho.licencas.includes('cnh') && i >= 19) out.push({ tipo: 'cnh' });
  const temVeiculo = f.bens.some(b => b.tipo === 'veiculo');
  if (p.carro !== 'nenhum' && !temVeiculo && orcamento(v).sobra > 0) {
    const lugar = p.carro === 'novo' ? 'concessionaria' : p.carro === 'moto' ? 'motos' : 'usados';
    const o = veiculosParaVoce(v, lugar).para[0]?.item;
    if (o) {
      const vista = podeTentar(condicoesVeiculo(v, o.preco, false).veredito);
      const a: Acao = { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: !vista };
      if (tenta(v, a)) out.push(a);
    }
  }
  // Oficina e reparos
  for (const b of f.bens) {
    // Carro velho que quebrou de vez: troca.
    if (b.tipo === 'veiculo' && b.problema?.gravidade === 3 && anosDoVeiculo(v, b) >= 14) { out.push({ tipo: 'vender_bem', bemId: b.id }); continue; }
    if (b.tipo === 'veiculo' && b.problema) {
      const conserta: Acao = { tipo: 'veiculo', bemId: b.id, oque: 'consertar' };
      if (p.oficina === 'conserta' && tenta(v, conserta)) out.push(conserta);
      else if (p.oficina === 'vende' || b.problema.gravidade >= 3 && !tenta(v, conserta)) out.push({ tipo: 'vender_bem', bemId: b.id });
      else if (tenta(v, { tipo: 'veiculo', bemId: b.id, oque: 'adiar' })) out.push({ tipo: 'veiculo', bemId: b.id, oque: 'adiar' });
      else if (tenta(v, conserta)) out.push(conserta);
    }
    if (b.tipo === 'imovel' && b.problema && tenta(v, { tipo: 'imovel', bemId: b.id, oque: 'reparar' })) out.push({ tipo: 'imovel', bemId: b.id, oque: 'reparar' });
    if (b.tipo === 'imovel' && !b.alugadoPor && v.moradia.imovelId !== b.id && tenta(v, { tipo: 'imovel', bemId: b.id, oque: 'alugar' })) out.push({ tipo: 'imovel', bemId: b.id, oque: 'alugar' });
  }
  // Pet
  if (p.pet && i >= 24 && i <= 60 && petsDe(v).filter(x => x.pet?.tutor === 'eu').length === 0) {
    const a = animaisParaVoce(v).para[0]?.item;
    if (a && tenta(v, { tipo: 'adotar_pet', animalId: a.id })) out.push({ tipo: 'adotar_pet', animalId: a.id });
  }
  for (const pet of petsDe(v)) {
    if (pet.pet?.doenca) {
      for (const opcao of ['tratar', 'basico', 'paliativo'] as const) if (tenta(v, { tipo: 'veterinario', petId: pet.id, opcao })) { out.push({ tipo: 'veterinario', petId: pet.id, opcao }); break; }
    }
  }
  // Mudar de cidade (uma vez, para uma cidade maior)
  if (p.mudaCidade && i >= 28 && i <= 35 && !v.fatos['mudou_de_cidade']) {
    const destino = MUNICIPIOS.filter(m => m.perfil === 'metropole' && m.id !== v.moradia.municipioId)[r.int(0, 5)];
    if (destino && tenta(v, { tipo: 'mudar_cidade', municipioId: destino.id })) out.push({ tipo: 'mudar_cidade', municipioId: destino.id });
  }
  // Negócio
  if (p.empreende && i >= 28 && !v.caminhos.negocio) {
    const n = negociosPossiveis(v).find(x => podeTentar(x.veredito));
    if (n) out.push({ tipo: 'abrir_negocio', negocio: n.t.id });
  }
  // Aplicar o que sobra (depois da reserva-alvo)
  const o = orcamento(v);
  const despesa = Math.max(1, o.despesa);
  const conta = f.conta;
  const reserva = f.investimentos.find(a => a.produto === 'reserva')?.valor ?? 0;
  const alvoReserva = despesa * p.reservaMeses;
  const livre = conta - despesa; // um mês fica na conta
  if (livre > 500) {
    const paraReserva = Math.max(0, Math.min(livre, alvoReserva - reserva));
    if (paraReserva > 100) out.push({ tipo: 'investir', destino: 'reserva', valor: Math.round(paraReserva) });
    const resto = (livre - paraReserva) * p.aplica;
    for (const [prod, frac] of Object.entries(p.carteira) as [Produto, number][]) {
      const valor = Math.round(resto * frac);
      if (valor >= 100) out.push({ tipo: 'investir', destino: prod, valor });
    }
  }
  if (tenta(v, { tipo: 'renegociar' }) && p.estilo !== 'folgado') out.push({ tipo: 'renegociar' });
  return out;
}

function decidirMaterial(v: Vida, m: Momento, p: PerfilMaterial, base: (v: Vida, m: Momento, r: Rng) => string, r: Rng): string {
  const livre = (id: string) => m.opcoes.find(o => o.id === id && !o.bloqueio)?.id;
  if (m.situacaoId === 'mat_atraso') return livre('renegociar') ?? livre('vender') ?? 'apertar';
  if (m.situacaoId === 'mat_carro_parou') return (p.oficina === 'conserta' && livre('consertar')) || (p.oficina === 'vende' ? 'vender' : livre('consertar') ?? 'vender');
  if (m.situacaoId === 'mat_pet_doente') return livre('tratar') ?? 'conforto';
  if (m.situacaoId === 'mat_pet_oferta') return p.pet ? 'ficar' : 'nao';
  return base(v, m, r);
}

interface Registro {
  perfil: string; semente: number; cidade: string; classe: string; morreu: number;
  porIdade: Record<number, { liquido: number; renda: number; despesa: number; moradia: string; divida: number; reservaMeses: number; veiculo: boolean }>;
  anosAtraso: number; anosNegativado: number; anosAdultos: number; anosPobre: number;
  despejos: number; retomadas: number; apreensoes: number; vendasNaBaixa: number;
  petsAdotados: number; petsMorreram: number; negocios: number; negociosFechados: number;
  maxLiquido: number; minLiquido: number; heranca: number;
  composicaoFinal: Record<string, number>;
  bio: string[];
}

function simular(p: PerfilMaterial, semente: number): Registro {
  const est = estrategia(p.base);
  const r = criarRng(semente * 31 + 7);
  const mun = MUNICIPIOS[(semente * 7) % MUNICIPIOS.length];
  let v = criarVida({ nome: 'Sim', sobrenome: 'Material', genero: semente % 2 ? 'feminino' : 'masculino', municipioId: mun.id, semente });
  const reg: Registro = { perfil: p.nome, semente, cidade: mun.nome, classe: v.origem.classe, morreu: 0, porIdade: {}, anosAtraso: 0, anosNegativado: 0, anosAdultos: 0, anosPobre: 0, despejos: 0, retomadas: 0, apreensoes: 0, vendasNaBaixa: 0, petsAdotados: 0, petsMorreram: 0, negocios: 0, negociosFechados: 0, maxLiquido: 0, minLiquido: 0, heranca: 0, composicaoFinal: {}, bio: [] };
  const decidir = (x: Vida) => executar(x, { tipo: 'decidir', opcaoId: decidirMaterial(x, x.momento!, p, est.decidir, r) }).vida;
  let guarda = 0;
  while (!v.morte && guarda++ < 120) {
    const acoes = [...est.agir(v, r).filter(a => !MATERIAIS.has(a.tipo)), ...agirMaterial(v, p, r)];
    for (const a of acoes) {
      v = executar(v, a).vida;
      if (v.momento) v = decidir(v);
    }
    v = avancarAno(v).vida;
    if (v.momento) v = decidir(v);
    const i = idade(v);
    const b = balanco(v);
    const o = orcamento(v);
    reg.maxLiquido = Math.max(reg.maxLiquido, b.liquido);
    reg.minLiquido = Math.min(reg.minLiquido, b.liquido);
    if (i >= 18) {
      reg.anosAdultos++;
      if (obrigacoesAtrasadas(v) > 0) reg.anosAtraso++;
      if (v.financas.negativado) reg.anosNegativado++;
      if (b.liquido < 5000 && o.renda < SALARIO_MINIMO && !moraComFamiliaDeOrigem(v)) reg.anosPobre++;
    }
    if (i % 5 === 0) reg.porIdade[i] = { liquido: b.liquido, renda: Math.round(o.renda), despesa: Math.round(o.despesa), moradia: v.moradia.tipo, divida: b.obrigacoes, reservaMeses: seguranca(v).meses, veiculo: v.financas.bens.some(x => x.tipo === 'veiculo') };
  }
  const textos = v.biografia.map(e => e.texto);
  reg.despejos = textos.filter(t => /despejo/i.test(t)).length;
  reg.retomadas = textos.filter(t => /banco retomou/.test(t)).length;
  reg.apreensoes = textos.filter(t => /banco foi buscar/.test(t)).length;
  reg.vendasNaBaixa = textos.filter(t => /num momento ruim/.test(t)).length;
  reg.petsAdotados = textos.filter(t => /chegou: (um|uma) (gato|gata|cachorro|cachorra)/.test(t)).length;
  reg.petsMorreram = Object.values(v.pessoas).filter(x => x.especie && !x.vivo && x.pet?.tutor === 'eu').length;
  reg.negocios = v.caminhos.marcas.filter(m => m.tipo === 'negocio_aberto').length;
  reg.negociosFechados = v.caminhos.marcas.filter(m => m.tipo === 'negocio_fechado').length;
  reg.morreu = idade(v);
  reg.heranca = v.morte?.heranca?.liquido ?? 0;
  const b = balanco(v);
  reg.composicaoFinal = { conta: b.conta, aplicacoes: b.aplicacoes, imoveis: b.imoveis, veiculos: b.veiculos, obrigacoes: b.obrigacoes };
  for (const a of v.financas.investimentos) reg.composicaoFinal[`apl:${a.produto}`] = a.valor;
  reg.bio = v.biografia.filter(e => e.relevancia !== 'tecnico' && (e.tema === 'dinheiro' || e.tema === 'casa' || e.tema === 'trabalho' || /chegou|morreu|Mudou|carro|moto|casa|aluguel|parcela/.test(e.texto))).map(e => `${e.idade}: ${e.texto}`);
  return reg;
}

const regs: Registro[] = [];
const t0 = Date.now();
for (const p of PERFIS) for (let k = 0; k < VIDAS; k++) regs.push(simular(p, 1000 + k * 17 + p.nome.length));
const ms = Date.now() - t0;

const med = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const q = (a: number[], f: number) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * f))]; };
const pct = (n: number, d: number) => `${d ? Math.round((100 * n) / d) : 0}%`;
const k = (x: number) => (Math.abs(x) >= 1e6 ? `${(x / 1e6).toFixed(1)}mi` : Math.abs(x) >= 1e3 ? `${Math.round(x / 1e3)}k` : String(Math.round(x)));

console.log(`\n${regs.length} vidas em ${(ms / 1000).toFixed(1)}s (${(ms / regs.length).toFixed(0)} ms/vida)\n`);
console.log('PERFIL              liq35   liq45   liq65   final(p10/med/p90)          dono45 aluga45 pais30 veic45  atraso neg   pobre  despejo retom  pets  neg.ab/fe');
for (const p of PERFIS) {
  const xs = regs.filter(x => x.perfil === p.nome);
  const liq = (i: number) => med(xs.map(x => x.porIdade[i]?.liquido ?? 0));
  const fin = xs.map(x => x.heranca || x.composicaoFinal.aplicacoes + x.composicaoFinal.imoveis + x.composicaoFinal.conta - x.composicaoFinal.obrigacoes);
  const at = (i: number, f: (y: Registro['porIdade'][number]) => boolean) => pct(xs.filter(x => x.porIdade[i] && f(x.porIdade[i])).length, xs.filter(x => x.porIdade[i]).length);
  const adultos = xs.reduce((s, x) => s + x.anosAdultos, 0);
  console.log(`${p.nome.padEnd(18)} ${k(liq(35)).padStart(6)} ${k(liq(45)).padStart(7)} ${k(liq(65)).padStart(7)}   ${k(q(fin, 0.1)).padStart(6)}/${k(med(fin)).padStart(6)}/${k(q(fin, 0.9)).padStart(6)}   ${at(45, y => y.moradia === 'propria').padStart(6)} ${at(45, y => y.moradia === 'aluguel' || y.moradia === 'republica').padStart(6)} ${at(30, y => y.moradia === 'pais').padStart(6)} ${at(45, y => y.veiculo).padStart(6)}  ${pct(xs.reduce((s, x) => s + x.anosAtraso, 0), adultos).padStart(5)} ${pct(xs.reduce((s, x) => s + x.anosNegativado, 0), adultos).padStart(5)} ${pct(xs.reduce((s, x) => s + x.anosPobre, 0), adultos).padStart(5)}  ${String(xs.reduce((s, x) => s + x.despejos, 0)).padStart(5)} ${String(xs.reduce((s, x) => s + x.retomadas, 0)).padStart(5)}  ${String(xs.reduce((s, x) => s + x.petsAdotados, 0)).padStart(4)}  ${xs.reduce((s, x) => s + x.negocios, 0)}/${xs.reduce((s, x) => s + x.negociosFechados, 0)}`);
}

// Renda e patrimônio por idade (todas as vidas)
console.log('\nIDADE  renda med   despesa med   liq p10     liq med     liq p90     reserva(meses) med');
for (const i of [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]) {
  const xs = regs.map(x => x.porIdade[i]).filter(Boolean);
  if (!xs.length) continue;
  console.log(`${String(i).padStart(4)}   ${k(med(xs.map(x => x.renda))).padStart(8)}   ${k(med(xs.map(x => x.despesa))).padStart(10)}   ${k(q(xs.map(x => x.liquido), 0.1)).padStart(8)}   ${k(med(xs.map(x => x.liquido))).padStart(8)}   ${k(q(xs.map(x => x.liquido), 0.9)).padStart(8)}   ${med(xs.map(x => x.reservaMeses)).toFixed(1)}`);
}

// Extremos
const ricos = regs.filter(x => x.maxLiquido > 10e6);
const devendo = regs.filter(x => x.minLiquido < -300000);
console.log(`\nExtremos: ${ricos.length} vidas passaram de R$ 10 mi; ${devendo.length} chegaram a dever mais de R$ 300 mil (líquido).`);
for (const x of [...regs].sort((a, b) => b.maxLiquido - a.maxLiquido).slice(0, 5)) console.log(`  topo ${x.perfil} (${x.cidade}, ${x.classe}) máx ${k(x.maxLiquido)}; final: ${JSON.stringify(Object.fromEntries(Object.entries(x.composicaoFinal).map(([a, b]) => [a, k(b)])))}`);
for (const x of [...regs].sort((a, b) => a.minLiquido - b.minLiquido).slice(0, 3)) console.log(`  fundo ${x.perfil} (${x.cidade}, ${x.classe}) mín ${k(x.minLiquido)}`);

// Conservador vs arrojado: nenhum domina
const cons = regs.filter(x => x.perfil === 'conservador').map(x => x.porIdade[65]?.liquido ?? 0);
const arr = regs.filter(x => x.perfil === 'arrojado').map(x => x.porIdade[65]?.liquido ?? 0);
console.log(`\nAos 65 — conservador p10/med/p90: ${k(q(cons, 0.1))}/${k(med(cons))}/${k(q(cons, 0.9))} · arrojado: ${k(q(arr, 0.1))}/${k(med(arr))}/${k(q(arr, 0.9))}`);
console.log(`Vendas na baixa (precisou vender aplicação arriscada com perda): ${regs.reduce((s, x) => s + x.vendasNaBaixa, 0)} · buscas e apreensões: ${regs.reduce((s, x) => s + x.apreensoes, 0)}`);
const petsMortos = regs.reduce((s, x) => s + x.petsMorreram, 0);
console.log(`Pets: ${regs.reduce((s, x) => s + x.petsAdotados, 0)} adotados, ${petsMortos} morreram ao longo das vidas.`);

// Mobilidade social: origem vs patrimônio aos 50
console.log('\nMOBILIDADE (patrimônio líquido aos 50 por classe de origem)');
for (const c of ['vulneravel', 'trabalhadora', 'media_baixa', 'media', 'alta']) {
  const xs = regs.filter(x => x.classe === c).map(x => x.porIdade[50]?.liquido).filter((x): x is number => x !== undefined);
  if (xs.length) console.log(`  ${c.padEnd(13)} n=${String(xs.length).padStart(3)}  p10 ${k(q(xs, 0.1)).padStart(6)}  med ${k(med(xs)).padStart(6)}  p90 ${k(q(xs, 0.9)).padStart(6)}`);
}

for (const x of regs) writeFileSync(`${SAIDA}/${x.perfil}-${x.semente}.txt`, `${x.perfil} · ${x.cidade} · origem ${x.classe} · viveu ${x.morreu}\n\n${x.bio.join('\n')}\n`);
console.log(`\nBiografias materiais em ${SAIDA}`);
void parceiro; void municipio;
