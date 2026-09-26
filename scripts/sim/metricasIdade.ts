/**
 * Métricas por faixa de idade com o MESMO código na base e na branch (só usa
 * o que existe desde o FIX #3): para comparar, antes e depois, se há um vale
 * de conteúdo na meia-idade. Vidas com os perfis de jogador de `estrategias`
 * e, em metade delas, uma família montada aos 27 (parceria e dois filhos).
 *
 *   npx esbuild scripts/sim/metricasIdade.ts --bundle --platform=node --outfile=/tmp/m.cjs
 *   VIDAS=120 node /tmp/m.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { MUNICIPIOS } from '../../src/motor/dados/lugares';
import { estrategia, NOMES_ESTRATEGIAS } from './estrategias';
import { criarPessoa, vincular } from '../../src/motor/pessoas';

const VIDAS = Number(process.env.VIDAS ?? 120);
const FAIXAS = ['0-17', '18-29', '30-39', '40-49', '50-59', '60-69', '70+'];
const faixa = (i: number) => (i < 18 ? '0-17' : i < 30 ? '18-29' : i < 40 ? '30-39' : i < 50 ? '40-49' : i < 60 ? '50-59' : i < 70 ? '60-69' : '70+');
const soma: Record<string, Record<string, number>> = {};
const anos: Record<string, number> = {};
const add = (f: string, k: string, x = 1) => { (soma[f] ??= {})[k] = (soma[f][k] ?? 0) + x; };

function familia(v: Vida, s: number): Vida {
  return transacao(v, x => {
    const r = criarRng(s);
    const par = criarPessoa(x, r, { idade: 28, municipioId: x.moradia.municipioId, genero: x.eu.genero === 'feminino' ? 'masculino' : 'feminino' });
    const vin = vincular(x, par, { origem: 'romance', proximidade: 80, convivio: ['casa'] });
    vin.romance = { estagio: 'casamento', tEstagio: x.t, tInicio: x.t - 36, envolvimento: 78, planoFilhos: 'sem_planejar' };
    vin.historia.push({ t: x.t, texto: 'Casaram-se.', tipo: 'casamento', peso: 3 });
    if (x.moradia.tipo === 'pais' || x.moradia.tipo === 'parente') { x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1400, padrao: 3, tInicio: x.t }; for (const w of Object.values(x.vinculos)) if (w.pessoaId !== par.id) w.convivio = w.convivio.filter(c => c !== 'casa'); }
    for (const k of [0, 1]) { const f = criarPessoa(x, r, { idade: k * 2, municipioId: x.moradia.municipioId, sobrenome: x.eu.sobrenome }); f.genitores = ['eu', par.id]; const vf = vincular(x, f, { parentesco: 'filho', origem: 'familia', proximidade: 80, convivio: ['casa'] }); vf.tInicio = f.tNasc; }
  }).vida;
}

for (let s = 0; s < VIDAS; s++) {
  const semente = 5000 + s * 29;
  const r = criarRng(semente);
  const perfil = estrategia(NOMES_ESTRATEGIAS[s % NOMES_ESTRATEGIAS.length]);
  let v = criarVida({ nome: 'Med', sobrenome: 'Ida', genero: s % 2 ? 'masculino' : 'feminino', municipioId: MUNICIPIOS[(semente * 7) % MUNICIPIOS.length].id, semente });
  while (!v.morte && idade(v) < 85) {
    if (s % 2 === 0 && idade(v) === 27) v = familia(v, semente);
    for (const a of perfil.agir(v, r)) { if (v.momento || v.morte) break; if (podeTentar(disponibilidade(v, a))) v = executar(v, a).vida; for (let k = 0; k < 12 && v.momento; k++) { const id = perfil.decidir(v, v.momento, r); v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.some(o => o.id === id && !o.bloqueio) ? id : (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida; } }
    v = avancarAno(v).vida;
    for (let k = 0; k < 12 && v.momento && !v.morte; k++) { const id = perfil.decidir(v, v.momento, r); v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.some(o => o.id === id && !o.bloqueio) ? id : (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida; }
  }
  const porAno = new Map<number, number>();
  for (let i = 0; i <= idade(v); i++) anos[faixa(i)] = (anos[faixa(i)] ?? 0) + 1;
  for (const e of v.biografia) {
    const f = faixa(e.idade);
    const bio = e.relevancia === 'marco' || e.relevancia === 'biografia';
    if (e.escolha) add(f, 'decisoes');
    if (!bio) continue;
    add(f, 'bio'); porAno.set(e.idade, 1);
    if (e.tema === 'familia' || e.tema === 'filhos') add(f, 'familia');
    if (e.tema === 'trabalho') add(f, 'trabalho');
    if (e.tema === 'saude') add(f, 'saude');
    if (e.tema === 'dinheiro' || e.tema === 'casa') add(f, 'patrimonio');
    if (e.tema === 'perda') add(f, 'luto');
  }
  for (let i = 0; i <= idade(v); i++) if (!porAno.get(i)) add(faixa(i), 'anos_sem_bio');
}
const out: Record<string, Record<string, number>> = {};
for (const f of FAIXAS) out[f] = Object.fromEntries(['bio', 'decisoes', 'familia', 'trabalho', 'saude', 'patrimonio', 'luto', 'anos_sem_bio'].map(k => [k, Math.round((soma[f]?.[k] ?? 0) / Math.max(1, anos[f] ?? 0) * 100) / 100]));
console.log(JSON.stringify({ vidas: VIDAS, porFaixa: out }));
