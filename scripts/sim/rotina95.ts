/**
 * REWORK 9.5 · a rotina numa população: N vidas até os 45 (decisões pela primeira opção livre). A cada ano:
 *   - a leitura da rotina (horários × exigência × cabeça) e as contradições que o playtest viu (cabeça tranquila com
 *     "sobrecarga forte"; "não cabe" com a agenda folgada);
 *   - quantas atividades a mais a pessoa conseguiria assumir, uma a uma, antes de ouvir um "não" — e de que tipo é o "não"
 *     (horário × descanso × outro motivo concreto): o motor nem aceita tudo, nem bloqueia o plausível;
 * e, aos 10 e aos 15, três irmãos de semente com as três posturas nos estudos por 3 anos (nota, matérias, cabeça, horas).
 *
 *   npx esbuild scripts/sim/rotina95.ts --bundle --platform=node --outfile=<scratch>/r95.cjs && N=40 node <scratch>/r95.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { idade, transacao } from '../../src/motor/nucleo';
import { agendaDaSemana } from '../../src/motor/sistemas/agenda';
import { avaliarRotina } from '../../src/motor/sistemas/avaliacaoDaRotina';
import { leituraDaSobrecarga } from '../../src/motor/sistemas/sobrecarga';
import { encaixe } from '../../src/motor/sistemas/semana';
import { MATERIAS } from '../../src/motor/dados/frentes';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 30);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs', 'belem-pa', 'uberaba-mg', 'salvador-ba'];
const CANDIDATAS = ['leitura', 'desenho', 'musica', 'natacao', 'futebol', 'xadrez', 'ingles', 'danca', 'academia', 'voluntariado', 'videogame', 'teatro'];

const faixaDe = (i: number) => (i < 12 ? '6–11' : i < 18 ? '12–17' : i < 30 ? '18–29' : '30–45');
type Conta = { anos: number; aceitas: number; tetoHorario: number; tetoDescanso: number; tetoOutro: number; semTeto: number; leveBloqueada: number; contradicao: number; peso: Record<string, number> };
const porFaixa: Record<string, Conta> = {};
const motivos: Record<string, number> = {};

const entradas: Record<string, { cheia: number[]; pesada: number[] }> = {};
function quantasCabem(v: Vida): { aceitas: number; teto: 'horario' | 'descanso' | 'outro' | 'nenhum' } {
  let w = v;
  let aceitas = 0;
  const e = (entradas[faixaDe(idade(v))] ??= { cheia: [], pesada: [] });
  let viuCheia = false, viuPesada = false;
  const marcar = () => {
    const f = encaixe(w, 0).faixa;
    if (!viuCheia && (f === 'cheia' || f === 'sobrecarregada' || f === 'alem')) { viuCheia = true; e.cheia.push(v.rotinas.length + aceitas); }
    if (!viuPesada && (f === 'sobrecarregada' || f === 'alem')) { viuPesada = true; e.pesada.push(v.rotinas.length + aceitas); }
  };
  marcar();
  for (const id of CANDIDATAS) {
    if (w.rotinas.some(r => r.id === id)) continue;
    const d = disponibilidade(w, { tipo: 'rotina', id, ativa: true, nivel: 1 });
    if (d.grau === 'impossivel' || d.grau === 'requisito') continue; // não existe aqui / a casa não paga / a idade não deixa
    if (d.grau !== 'permitido' && d.grau !== 'irregular') {
      const m = d.motivo ?? '';
      const chave = /Horário incompatível/.test(m) ? 'horario' : /Descanso insuficiente/.test(m) ? 'descanso' : 'outro';
      motivos[`${chave}: ${m.slice(0, 70)}`] = (motivos[`${chave}: ${m.slice(0, 70)}`] ?? 0) + 1;
      return { aceitas, teto: chave };
    }
    w = executar(w, { tipo: 'rotina', id, ativa: true, nivel: 1 }).vida;
    aceitas++;
    marcar();
  }
  return { aceitas, teto: 'nenhum' };
}

for (let k = 0; k < N; k++) {
  let v: Vida = criarVida({ nome: 'A', sobrenome: 'B', genero: k % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[k % CIDADES.length], semente: 9500 + k });
  for (let a = 0; a < 45 && !v.morte; a++) {
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento && !v.morte; j++) { const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida; }
    const i = idade(v);
    if (i < 6 || v.morte || v.momento) continue;
    const c = (porFaixa[faixaDe(i)] ??= { anos: 0, aceitas: 0, tetoHorario: 0, tetoDescanso: 0, tetoOutro: 0, semTeto: 0, leveBloqueada: 0, contradicao: 0, peso: {} });
    c.anos++;
    const av = avaliarRotina(v);
    c.peso[av.exigencia.peso] = (c.peso[av.exigencia.peso] ?? 0) + 1;
    // O playtest: cabeça tranquila (estresse baixo) dita junto de "sobrecarga forte" por causa só de atividades a mais.
    const sob = leituraDaSobrecarga(v);
    if (av.cabeca.nivel === 'baixo' && sob.nivel >= 2 && av.exigencia.peso !== 'pesada') c.contradicao++;
    // Uma atividade leve bloqueada com a rotina leve/movimentada e horário sobrando: bloqueio de algo plausível.
    const leve = disponibilidade(v, { tipo: 'rotina', id: 'leitura', ativa: true, nivel: 1 });
    if (!v.rotinas.some(r => r.id === 'leitura') && (leve.grau === 'incompativel') && av.exigencia.peso !== 'pesada' && av.horarios.diasComFolga >= 3) c.leveBloqueada++;
    const q = quantasCabem(v);
    c.aceitas += q.aceitas;
    if (q.teto === 'horario') c.tetoHorario++; else if (q.teto === 'descanso') c.tetoDescanso++; else if (q.teto === 'outro') c.tetoOutro++; else c.semTeto++;
  }
}

console.log(`${N} vidas — por idade (anos de vida observados):`);
for (const [f, c] of Object.entries(porFaixa)) {
  const p = (x: number) => `${Math.round((x / c.anos) * 100)}%`;
  console.log(`  ${f}: ${c.anos} anos · rotina ${Object.entries(c.peso).map(([k, x]) => `${k} ${p(x)}`).join(', ')} · cabem em média ${(c.aceitas / c.anos).toFixed(1)} atividades a mais · o "não" veio de: horário ${p(c.tetoHorario)}, descanso ${p(c.tetoDescanso)}, outro ${p(c.tetoOutro)}; nunca veio ${p(c.semTeto)} · leitura bloqueada com folga ${c.leveBloqueada} · contradições cabeça×sobrecarga ${c.contradicao}`);
}
const med = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : NaN);
console.log('com quantas atividades (as que já tinha + as novas, nível leve) a rotina vira "exigente" e "pesada" — mediana:');
for (const [f, x] of Object.entries(entradas)) console.log(`  ${f}: exigente com ${med(x.cheia)} (${x.cheia.length} casos) · pesada com ${med(x.pesada)} (${x.pesada.length} casos)`);
console.log('motivos mais comuns do "não":');
for (const [m, x] of Object.entries(motivos).sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${x}× ${m}`);

/* ------------------------------------------------------------ As três posturas, em irmãos de semente */

const media = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);
for (const inicio of [10, 15]) {
  const res: Record<string, { nota: number[]; materias: number[]; estresse: number[]; livres: number[]; estudo: number[] }> = {};
  for (let k = 0; k < N; k++) {
    let v: Vida = criarVida({ nome: 'A', sobrenome: 'B', genero: k % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[k % CIDADES.length], semente: 9700 + k });
    while (idade(v) < inicio && !v.morte) {
      v = avancarAno(v).vida;
      for (let j = 0; j < 12 && v.momento && !v.morte; j++) { const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida; }
    }
    if (v.morte || !v.educacao.basica) continue;
    // a rotina "de verdade" de quem já faz algo: duas atividades, quando cabem
    for (const id of ['futebol', 'musica']) { const d = disponibilidade(v, { tipo: 'rotina', id, ativa: true, nivel: 2 }); if (d.grau === 'permitido') v = executar(v, { tipo: 'rotina', id, ativa: true, nivel: 2 }).vida; }
    for (const p of ['dedicada', 'normal', 'relaxada'] as const) {
      let w = transacao(v, x => { x.educacao.postura = p; }).vida;
      const antes = media(MATERIAS.map(d => w.caminhos.frentes[d]?.habilidade ?? 0));
      const r = (res[p] ??= { nota: [], materias: [], estresse: [], livres: [], estudo: [] });
      r.livres.push(avaliarRotina(w, agendaDaSemana(w)).horarios.livres);
      for (let a = 0; a < 3 && !w.morte; a++) {
        w = avancarAno(w).vida;
        for (let j = 0; j < 12 && w.momento && !w.morte; j++) { const op = w.momento.opcoes.find(o => !o.bloqueio) ?? w.momento.opcoes[0]; w = executar(w, { tipo: 'decidir', opcaoId: op.id }).vida; }
        if (w.educacao.postura !== p && w.educacao.basica) w = transacao(w, x => { x.educacao.postura = p; }).vida;
      }
      if (w.educacao.basica?.desempenho !== undefined) r.nota.push(w.educacao.basica.desempenho);
      r.materias.push(media(MATERIAS.map(d => w.caminhos.frentes[d]?.habilidade ?? 0)) - antes);
      r.estresse.push(w.mente.estresse);
      const f = w.evolucao?.[w.evolucao.length - 1]?.rotina;
      if (f?.estudo !== undefined) r.estudo.push(f.estudo);
    }
  }
  console.log(`posturas a partir dos ${inicio} (3 anos, ${res.normal?.nota.length ?? 0} vidas):`);
  for (const [p, r] of Object.entries(res)) console.log(`  ${p}: nota ${media(r.nota).toFixed(1)} · matérias +${media(r.materias).toFixed(1)} · estresse ${media(r.estresse).toFixed(0)} · horas livres na semana ${media(r.livres).toFixed(0)}${r.estudo.length ? ` · estudo em casa aconteceu ${Math.round(media(r.estudo) * 100)}%` : ''}`);
}
