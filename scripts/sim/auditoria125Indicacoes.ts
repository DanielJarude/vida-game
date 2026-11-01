/**
 * AUDITORIA 12.5 · CAR-11.8 — indicações profissionais contextualizadas.
 *
 * Vidas adultas montadas com profissões variadas (médico, advogado, engenheiro, professor, vendedor, pedreiro, ator,
 * futebolista, enfermeiro, desenvolvedor, contador, cozinheiro, eletricista, motorista, manicure, designer), três
 * variantes por profissão (júnior / sênior / meio de carreira), 25 anos cada. Demissões forçadas nos anos 4, 12 e 20
 * (a indicação só nasce para quem está sem trabalho ou num trabalho fraco). Em paralelo, uma SONDA nos anos 0, 8, 16, 24:
 * um clone da vida, sem emprego e sem carência, roda o gerador até sair uma indicação — o que a rede indicaria agora.
 *
 *   npx esbuild scripts/sim/auditoria125Indicacoes.ts --bundle --platform=node --format=esm --outfile=$HOME/vida-trabalho/a125/ind.mjs && node $HOME/vida-trabalho/a125/ind.mjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade, idadePessoa } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import type { CarreiraEsportiva, Oportunidade, Vida } from '../../src/motor/tipos';
import { ocupacao, ocupacaoOuNula } from '../../src/motor/dados/ocupacoes';
import { cursoOuNulo } from '../../src/motor/dados/cursos';
import { familiaDaTrilha } from '../../src/motor/dados/carreiras';
import { contratar, encerrarEmprego, experienciaNaTrilha, elegibilidade } from '../../src/motor/sistemas/trabalho';
import { processarOportunidades } from '../../src/motor/sistemas/oportunidades';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { agente } from './agentes';

await carregarMundo();
const ANOS = Number(process.env.ANOS ?? 25);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

interface Prof { nome: string; jr: string; sr: string; curso?: string; dom?: string; futebol?: boolean }
const PROFS: Prof[] = [
  { nome: 'médico', jr: 'medico', sr: 'medico_hospital', curso: 'medicina' },
  { nome: 'advogado', jr: 'advogado_jr', sr: 'advogado_pleno', curso: 'direito' },
  { nome: 'engenheiro', jr: 'eng_jr', sr: 'eng_pleno', curso: 'eng_civil' },
  { nome: 'professor', jr: 'professor_fund', sr: 'professor_fund', curso: 'pedagogia' },
  { nome: 'vendedor', jr: 'vendedor', sr: 'gerente_loja' },
  { nome: 'pedreiro', jr: 'pedreiro', sr: 'mestre_obras', dom: 'manual' },
  { nome: 'ator', jr: 'ator', sr: 'ator_reconhecido', curso: 'artes_cenicas', dom: 'teatro' },
  { nome: 'futebolista', jr: 'jogador_futebol', sr: 'jogador_futebol', dom: 'futebol', futebol: true },
  { nome: 'enfermeiro', jr: 'enfermeiro', sr: 'enfermeiro_chefe', curso: 'enfermagem' },
  { nome: 'desenvolvedor', jr: 'dev_jr', sr: 'dev_senior', curso: 'computacao', dom: 'programacao' },
  { nome: 'contador', jr: 'contador', sr: 'contador_socio', curso: 'contabeis' },
  { nome: 'cozinheiro', jr: 'cozinheiro', sr: 'chef', dom: 'cozinha' },
  { nome: 'eletricista', jr: 'eletricista', sr: 'supervisor_manutencao', dom: 'manual' },
  { nome: 'motorista', jr: 'motorista_app', sr: 'motorista_caminhao' },
  { nome: 'manicure', jr: 'manicure', sr: 'manicure', dom: 'beleza' },
  { nome: 'designer', jr: 'designer_jr', sr: 'designer', curso: 'design', dom: 'desenho' }
];
const VARIANTES = [{ rotulo: 'jr', idade: 27, exp: 18 }, { rotulo: 'sr', idade: 40, exp: 170 }, { rotulo: 'meio', idade: 33, exp: 90 }];
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs'];

function montar(p: Prof, k: number, var_: typeof VARIANTES[number]): Vida {
  const v = adulto(var_.idade, { semente: 1250 + k * 13, genero: k % 2 ? 'masculino' : 'feminino', municipioId: CIDADES[k % 3] });
  v.trabalho.atual = undefined;
  const ocId = var_.rotulo === 'jr' ? p.jr : p.sr;
  const oc = ocupacao(ocId);
  if (p.curso) {
    const c = cursoOuNulo(p.curso)!;
    v.educacao.concluidos.push({ cursoId: c.id, nome: c.nome, nivel: c.nivel, area: c.area, tFim: v.t - var_.exp - 6, instituicao: 'Universidade Federal', rede: 'publica', desempenho: 70 } as never);
  }
  for (const o of [ocupacao(p.jr), oc]) if (o.licenca && !v.trabalho.licencas.includes(o.licenca)) v.trabalho.licencas.push(o.licenca);
  v.trabalho.experiencia[oc.trilha] = (v.trabalho.experiencia[oc.trilha] ?? 0) + var_.exp;
  if (p.dom) v.caminhos.frentes[p.dom as never] = { interesse: 80, meses: 200, habilidade: 78, tInicio: v.t - 200, tUltimo: v.t, retomadas: 0, auge: 80 } as never;
  contratar(v, criarRng(k + 1), oc);
  if (p.futebol) {
    v.trabalho.atual!.empregador = 'o Sport';
    v.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Sport', nivel: 3, tInicio: v.t - 120, tFase: v.t - 96, lesoes: 0, municipioId: v.moradia.municipioId, reputacao: 55, posicao: 'atacante', espaco: 'titular', contratoAte: v.t + 24 } as CarreiraEsportiva;
  }
  return v;
}

interface Reg {
  vida: string; prof: string; fonte: 'natural' | 'sonda'; idade: number; recebeOc?: string; recebeNivel: number; recebeTrilha?: string; formacao: string[];
  oc: string; ocNivel: number; ocTrilha: string; natureza?: string; quemOc?: string; quemTrilha?: string; quemOrigem?: string; prox?: number; parentesco?: string;
  turma: boolean; texto: string; titulo: string; grau: string; semFormacao: boolean; rebaixa: number; rendaRatio: number; expNaTrilha: number; quemForaDaArea: boolean; nomeNaoBate: boolean;
}
const regs: Reg[] = [];
const outrosTipos: Record<string, number> = {};
const outrosTextos: Record<string, Set<string>> = {};
const ocorr: Record<string, number> = {};
let anosVividos = 0, anosSemOuFraco = 0;

function referencia(v: Vida) {
  const e = v.trabalho.atual ?? v.trabalho.historico[v.trabalho.historico.length - 1];
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  return { oc, salario: e?.salario ?? 0 };
}

function registrar(v: Vida, o: Oportunidade, fonte: Reg['fonte'], vida: string, prof: string, ref: ReturnType<typeof referencia>) {
  const oc = ocupacaoOuNula(o.ocupacaoId!);
  if (!oc) return;
  const quem = o.pessoaId ? v.pessoas[o.pessoaId] : undefined;
  const qoc = quem?.ocupacaoId ? ocupacaoOuNula(quem.ocupacaoId) : undefined;
  const vin = o.pessoaId ? v.vinculos[o.pessoaId] : undefined;
  const areas = v.educacao.concluidos.filter(c => c.nivel !== 'livre').map(c => c.area);
  regs.push({
    vida, prof, fonte, idade: idade(v), recebeOc: ref.oc?.id, recebeNivel: ref.oc?.nivel ?? 0, recebeTrilha: ref.oc?.trilha, formacao: areas,
    oc: oc.id, ocNivel: oc.nivel, ocTrilha: oc.trilha, natureza: o.natureza, quemOc: quem?.ocupacaoId, quemTrilha: qoc?.trilha, quemOrigem: vin?.origem, prox: vin?.proximidade, parentesco: vin?.parentesco,
    turma: o.titulo.includes('da sua turma'), texto: o.texto, titulo: o.titulo, grau: elegibilidade(v, oc).grau,
    semFormacao: !!oc.area && !areas.some(a => oc.area!.includes(a as never)), rebaixa: (ref.oc?.nivel ?? 0) - oc.nivel,
    rendaRatio: ref.salario > 0 ? oc.salario / ref.salario : 1, expNaTrilha: experienciaNaTrilha(v, oc.trilha),
    quemForaDaArea: !!qoc && qoc.trilha !== oc.trilha && familiaDaTrilha(qoc.trilha).id !== familiaDaTrilha(oc.trilha).id,
    nomeNaoBate: !!qoc && !!quem?.ocupacao && !qoc.nome.includes(quem.ocupacao)
  });
}

function sonda(v0: Vida, vida: string, prof: string) {
  const ref = referencia(v0);
  for (let tent = 0; tent < 12; tent++) {
    const v = structuredClone(v0) as Vida;
    if (v.trabalho.atual) encerrarEmprego(v, 'demissão (sonda)');
    v.trabalho.aposentadoria = undefined;
    delete v.caminhos.ultimas['indicacao']; delete v.caminhos.ultimas['indicacao_formacao'];
    v.caminhos.oportunidades = [];
    processarOportunidades(v, criarRng(9000 + tent * 31 + v.t));
    const novas = v.caminhos.oportunidades.filter(o => o.tipo === 'indicacao');
    if (novas.length) { for (const o of novas) registrar(v, o, 'sonda', vida, prof, ref); return; }
  }
}

let k = 0, crashes = 0;
const MODO = process.env.MODO ?? 'montadas';
if (MODO === 'nascimento') {
  const NN = Number(process.env.N ?? 24);
  const AG = ['estudioso', 'trabalhador', 'prudente', 'equilibrado'];
  for (let q = 0; q < NN; q++) {
    const id = `nasc/${AG[q % 4]}#${q}`;
    try {
      let v = criarVida({ nome: 'Sim', sobrenome: 'Rede', genero: q % 2 ? 'masculino' : 'feminino', municipioId: CIDADES[q % 3], semente: 77000 + q * 17, classe: (['baixa', 'media', 'alta'] as const)[q % 3] });
      const ag = agente(AG[q % 4]); const r = criarRng(88000 + q);
      const vistas = new Set<string>();
      while (!v.morte && idade(v) < 58) {
        for (const a of ag.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida; }
        const ref = referencia(v);
        if (idade(v) >= 18) { anosVividos++; if (!v.trabalho.atual || ['informal', 'temporario'].includes(v.trabalho.atual.contrato) || (ocupacaoOuNula(v.trabalho.atual.ocupacaoId)?.nivel ?? 0) <= 1) anosSemOuFraco++; }
        v = avancarAno(v).vida;
        for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida;
        for (const o of v.caminhos.oportunidades) { if (vistas.has(o.id)) continue; vistas.add(o.id); if (o.tipo === 'indicacao') registrar(v, o, 'natural', id, ref.oc?.trilha ?? 'sem', ref); else { outrosTipos[o.tipo] = (outrosTipos[o.tipo] ?? 0) + 1; (outrosTextos[o.tipo] ??= new Set()).add(o.texto); } }
        if (idade(v) >= 30 && idade(v) % 10 === 0) sonda(v, id, ref.oc?.trilha ?? 'sem');
      }
    } catch (e) { crashes++; console.error(id, (e as Error).stack?.split('\n').slice(0, 4).join(' | ')); }
    k++;
  }
} else
for (const p of PROFS) for (const var_ of VARIANTES) {
  const id = `${p.nome}/${var_.rotulo}#${k}`;
  try {
    let v = montar(p, k, var_);
    const ag = agente(k % 2 ? 'trabalhador' : 'primeira_trabalha');
    const r = criarRng(125000 + k * 7);
    const vistas = new Set<string>();
    const ocVistas = new Set(v.ocorrencias.map(o => `${o.id}@${o.t}`));
    for (let ano = 0; ano < ANOS && !v.morte; ano++) {
      if (ano % 8 === 0) sonda(v, id, p.nome);
      for (const a of ag.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida; }
      if ([4, 12, 20].includes(ano) && v.trabalho.atual) encerrarEmprego(v, 'demissão');
      const ref = referencia(v);
      const semOuFraco = !v.trabalho.atual || ['informal', 'temporario'].includes(v.trabalho.atual.contrato) || (ocupacaoOuNula(v.trabalho.atual.ocupacaoId)?.nivel ?? 0) <= 1;
      if (semOuFraco) anosSemOuFraco++;
      v = avancarAno(v).vida; anosVividos++;
      for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida;
      for (const o of v.caminhos.oportunidades) {
        if (vistas.has(o.id)) continue; vistas.add(o.id);
        if (o.tipo === 'indicacao') registrar(v, o, 'natural', id, p.nome, ref);
        else { outrosTipos[o.tipo] = (outrosTipos[o.tipo] ?? 0) + 1; (outrosTextos[o.tipo] ??= new Set()).add(o.texto); }
      }
      for (const o of v.ocorrencias) { const c = `${o.id}@${o.t}`; if (ocVistas.has(c)) continue; ocVistas.add(c); if (/sociedade|comprar_parte|investi|negocio|neg_/.test(o.id)) ocorr[o.id] = (ocorr[o.id] ?? 0) + 1; }
    }
  } catch (e) { crashes++; console.error(id, (e as Error).stack?.split('\n').slice(0, 4).join(' | ')); }
  k++;
}

/* ------------------------------------------------------------------ Relatório */
const pct = (a: number, b: number) => b ? `${(100 * a / b).toFixed(1)}%` : '—';
function resumo(lista: Reg[], nome: string) {
  const n = lista.length;
  const textos = new Set(lista.map(x => x.texto));
  const modelos = new Set(lista.map(x => x.texto.replace(/^[^,]+,/, 'X,').replace(/faz \d+ anos?/, 'faz N anos')));
  const pares = new Map<string, number>(); for (const x of lista) { const c = `${x.vida}|${x.oc}`; pares.set(c, (pares.get(c) ?? 0) + 1); }
  const repetidas = [...pares.values()].filter(c => c > 1).reduce((s, c) => s + c - 1, 0);
  const ocs = new Map<string, number>(); for (const x of lista) ocs.set(x.oc, (ocs.get(x.oc) ?? 0) + 1);
  const nat = new Map<string, number>(); for (const x of lista) nat.set(x.natureza ?? '?', (nat.get(x.natureza ?? '?') ?? 0) + 1);
  const mesmaTrilha = lista.filter(x => x.recebeTrilha === x.ocTrilha).length;
  const mesmaFamilia = lista.filter(x => x.recebeTrilha && x.recebeTrilha !== x.ocTrilha && familiaDaTrilha(x.recebeTrilha).id === familiaDaTrilha(x.ocTrilha).id).length;
  const quemMesmaTrilhaRecebe = lista.filter(x => x.quemTrilha === x.recebeTrilha).length;
  console.log(`\n## ${nome}: ${n} indicações`);
  console.log(`- textos distintos: ${textos.size}/${n} (${pct(textos.size, n)}); modelos (nome trocado por X): ${modelos.size}`);
  console.log(`- mesma vaga repetida para a mesma vida: ${repetidas} repetições; ocupações distintas oferecidas: ${ocs.size}`);
  console.log(`- natureza: ${[...nat].map(([a, b]) => `${a} ${b}`).join(', ')}`);
  console.log(`- vaga na MESMA trilha do recebedor: ${mesmaTrilha} (${pct(mesmaTrilha, n)}); mesma família: ${mesmaFamilia} (${pct(mesmaFamilia, n)}); outra área: ${n - mesmaTrilha - mesmaFamilia} (${pct(n - mesmaTrilha - mesmaFamilia, n)})`);
  console.log(`- quem indica é da mesma trilha do recebedor: ${quemMesmaTrilhaRecebe} (${pct(quemMesmaTrilhaRecebe, n)})`);
  console.log(`- via turma de formação: ${lista.filter(x => x.turma).length}`);
  console.log(`- ABSURDOS: sem a formação exigida ${lista.filter(x => x.semFormacao).length}; elegibilidade 'improvavel' ${lista.filter(x => x.grau === 'improvavel').length}, outro grau ${lista.filter(x => x.grau !== 'permitido' && x.grau !== 'improvavel').length}; rebaixa ≥2 níveis ${lista.filter(x => x.rebaixa >= 2).length} (${pct(lista.filter(x => x.rebaixa >= 2).length, n)}); renda < 50% da referência ${lista.filter(x => x.rendaRatio < 0.5).length} (${pct(lista.filter(x => x.rendaRatio < 0.5).length, n)}); quem indica é de outra família de ofício que a vaga ${lista.filter(x => x.quemForaDaArea).length}; ocupação dita de quem indica ≠ ocupacaoId ${lista.filter(x => x.nomeNaoBate).length}`);
  console.log(`- top ocupações: ${[...ocs].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([a, b]) => `${a} ${b}`).join(', ')}`);
  const porProf = new Map<string, Reg[]>(); for (const x of lista) (porProf.get(x.prof) ?? porProf.set(x.prof, []).get(x.prof)!).push(x);
  console.log(`- por profissão (n · mesma trilha · ocupações oferecidas):`);
  for (const p of PROFS) { const l = porProf.get(p.nome) ?? []; const ms = l.filter(x => x.recebeTrilha === x.ocTrilha).length; console.log(`  - ${p.nome}: ${l.length} · ${ms} · ${[...new Set(l.map(x => x.oc))].join(', ')}`); }
  const proxMedia = lista.reduce((s, x) => s + (x.prox ?? 0), 0) / (n || 1);
  const origens = new Map<string, number>(); for (const x of lista) { const o = x.parentesco ?? x.quemOrigem ?? '?'; origens.set(o, (origens.get(o) ?? 0) + 1); }
  console.log(`- proximidade média de quem indica: ${proxMedia.toFixed(0)}; laço: ${[...origens].sort((a, b) => b[1] - a[1]).map(([a, b]) => `${a} ${b}`).join(', ')}`);
}
console.log(`# CAR-11.8 — ${k} vidas, ${anosVividos} anos (${anosSemOuFraco} anos sem trabalho ou com trabalho fraco), crashes ${crashes}`);
resumo(regs.filter(x => x.fonte === 'natural'), 'Natural (vidas simuladas)');
resumo(regs.filter(x => x.fonte === 'sonda'), 'Sonda (clone sem emprego)');
const sondasFeitas = k * Math.ceil(ANOS / 8);
console.log(`\nSondas com indicação: ${regs.filter(x => x.fonte === 'sonda').length}/${sondasFeitas}`);
console.log(`\n## Outras portas (não-indicação) geradas: ${JSON.stringify(outrosTipos)}`);
for (const [t, s] of Object.entries(outrosTextos)) console.log(`- ${t}: ${s.size} textos distintos`);
console.log(`## Ocorrências de sociedade/negócio: ${JSON.stringify(ocorr)}`);
const absurdos = regs.filter(x => x.semFormacao || x.rebaixa >= 2 || x.rendaRatio < 0.5 || x.quemForaDaArea || x.grau !== 'permitido');
console.log(`\n## Exemplos de casos suspeitos (${absurdos.length})`);
for (const x of absurdos.slice(0, 40)) console.log(`- [${x.fonte}] ${x.vida} ${x.idade}a (era ${x.recebeOc}, n${x.recebeNivel}; formação ${x.formacao.join('/') || '—'}) ← ${x.oc} n${x.ocNivel} [${x.natureza}] grau=${x.grau}${x.semFormacao ? ' SEM-FORMAÇÃO' : ''}${x.rebaixa >= 2 ? ` REBAIXA${x.rebaixa}` : ''}${x.rendaRatio < 0.5 ? ` RENDA${x.rendaRatio.toFixed(2)}` : ''}${x.quemForaDaArea ? ' QUEM-FORA' : ''} | quem: ${x.quemOc} (${x.parentesco ?? x.quemOrigem}, prox ${x.prox}) | "${x.texto}"`);
console.log('\n## Amostra de textos (natural + sonda)');
const amostra = [...regs].sort((a, b) => (a.vida + a.idade).localeCompare(b.vida + b.idade)).filter((_, i, l) => i % Math.max(1, Math.floor(l.length / 24)) === 0).slice(0, 24);
for (const x of amostra) console.log(`- [${x.fonte}] ${x.vida} ${x.idade}a, era ${x.recebeOc} → ${x.titulo}: "${x.texto}"`);
