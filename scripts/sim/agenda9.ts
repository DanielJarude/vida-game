/**
 * REWORK 9 · a agenda numa população: N vidas até os 45 (decisões pela primeira opção livre), olhando a agenda a cada
 * ano: quantas vidas tiveram conflito, em que idade, que tipo (sobreposição × sem horário), a presença média das
 * atividades e da escola — e quanto as frentes andaram por ano, por fonte (o registro do PROG-01).
 *
 *   npx esbuild scripts/sim/agenda9.ts --bundle --platform=node --outfile=<scratch>/a9.cjs && N=40 node <scratch>/a9.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { agendaDaSemana } from '../../src/motor/sistemas/agenda';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 30);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs', 'belem-pa', 'uberaba-mg', 'salvador-ba'];
let anos = 0, anosComConflito = 0, vidasComConflito = 0, sobre = 0, semHorario = 0, presAtiv = 0, nAtiv = 0, presEscola = 0, nEscola = 0;
const porFaixa: Record<string, [number, number]> = {};
const fontes: Record<string, number> = {};
for (let k = 0; k < N; k++) {
  let v: Vida = criarVida({ nome: 'A', sobrenome: 'B', genero: k % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[k % CIDADES.length], semente: 5300 + k });
  let teve = false;
  for (let a = 0; a < 45 && !v.morte; a++) {
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento && !v.morte; j++) { const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida; }
    const i = idade(v);
    const ag = agendaDaSemana(v);
    anos++;
    const faixa = i < 12 ? '6–11' : i < 18 ? '12–17' : i < 30 ? '18–29' : '30–45';
    const f = (porFaixa[faixa] ??= [0, 0]); f[0]++;
    if (ag.conflitos.length) { anosComConflito++; teve = true; f[1]++; }
    for (const c of ag.conflitos) { if (c.tipo === 'sobreposicao') sobre++; else semHorario++; }
    for (const r of v.rotinas) { presAtiv += ag.presenca[r.id] ?? 1; nAtiv++; }
    if (v.educacao.basica && !v.educacao.evadiu) { presEscola += ag.presenca.escola ?? 1; nEscola++; }
    const foto = v.evolucao?.[v.evolucao.length - 1];
    for (const lista of Object.values(foto?.causas ?? {})) for (const [fonte, x] of lista ?? []) { const chave = fonte.startsWith('rotina:') ? 'rotina:*' : fonte.startsWith('acao:') ? 'acao:*' : fonte; fontes[chave] = (fontes[chave] ?? 0) + x; }
  }
  if (teve) vidasComConflito++;
}
console.log(`${N} vidas, ${anos} anos: vidas com algum conflito ${vidasComConflito} (${Math.round(vidasComConflito / N * 100)}%) · anos com conflito ${Math.round(anosComConflito / anos * 100)}% · sobreposições ${sobre}, sem horário ${semHorario}`);
console.log(`por idade (anos com conflito / anos): ${Object.entries(porFaixa).map(([f, [n, c]]) => `${f}: ${c}/${n}`).join(' · ')}`);
console.log(`presença média: atividades ${(presAtiv / Math.max(1, nAtiv)).toFixed(3)} (${nAtiv} atividade-anos) · escola ${(presEscola / Math.max(1, nEscola)).toFixed(3)} (${nEscola} anos de escola)`);
console.log(`o que fez as frentes andarem (soma de pontos de habilidade, todas as vidas): ${Object.entries(fontes).sort((a, b) => b[1] - a[1]).map(([f, x]) => `${f} ${x.toFixed(0)}`).join(' · ')}`);
