/**
 * FIX pós-playtest humano — CALIBRAÇÃO DA ROTINA (seção 12 do pedido): perfis de vida observados por ANOS, não por um
 * clique. Para cada perfil, várias vidas (sementes) vivem 4 anos com a mesma semana; mede-se a faixa da semana
 * (`semana.encaixe`), o estresse, o desempenho (escola / trabalho), a saúde, as atividades largadas e a proximidade
 * de quem mora junto. O objetivo é uma resposta humana — nem "tudo cabe", nem "nada cabe".
 *
 *   npx esbuild scripts/sim/rotinaCalibracao.ts --bundle --platform=node --outfile=<scratch>/rc.cjs && VIDAS=8 node <scratch>/rc.cjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { nova, viverAte, responderTudo } from '../../src/motor/__tests__/ajuda';
import { adulto, comFilho } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { transacao, vinculosVivos } from '../../src/motor/nucleo';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { encaixe, folegoDaSemana } from '../../src/motor/sistemas/semana';
import { podeComecarRotina } from '../../src/motor/sistemas/rotinas';
import { podeTentar } from '../../src/motor/plausibilidade';
import type { Rotina, Vida } from '../../src/motor/tipos';

const VIDAS = Number(process.env.VIDAS ?? 8);
const rot = (v: Vida, id: string, nivel: 1 | 2 | 3 = 1): Rotina => ({ id, tInicio: v.t, nivel });
const matricula = (v: Vida, cursoId: string) => { v.educacao.matricula = { cursoId, instituicao: 'teste', rede: 'publica', modalidade: 'presencial', tInicio: v.t, mesesRestantes: 60, mensalidade: 0, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId }; };
const empregar = (v: Vida, id: string) => transacao(v, (x, r) => { contratar(x, r, ocupacao(id)); }).vida;

const PERFIS: { nome: string; montar: (s: number) => Vida }[] = [
  { nome: 'escola apenas (13)', montar: s => viverAte(nova({ semente: s }), 13) },
  { nome: 'escola + hobby (13)', montar: s => { const v = viverAte(nova({ semente: s }), 13); v.rotinas = [rot(v, 'musica', 2)]; return v; } },
  { nome: 'escola + esporte + hobby (14)', montar: s => { const v = viverAte(nova({ semente: s }), 14); v.rotinas = [rot(v, 'futebol', 2), rot(v, 'desenho', 1)]; return v; } },
  { nome: 'técnico integral + esporte (15)', montar: s => { const v = viverAte(nova({ semente: s }), 15); v.educacao.basica = { ...v.educacao.basica!, integrado: 'tec_mecanica' }; v.rotinas = [rot(v, 'futebol', 3)]; return v; } },
  { nome: 'técnico + esporte + hobby (15)', montar: s => { const v = viverAte(nova({ semente: s }), 15); v.educacao.basica = { ...v.educacao.basica!, integrado: 'tec_informatica' }; v.rotinas = [rot(v, 'futebol', 2), rot(v, 'musica', 1)]; return v; } },
  { nome: 'faculdade + estágio (20)', montar: s => { let v = adulto(20, { semente: s }); matricula(v, 'administracao'); v = empregar(v, 'estagio_adm'); return v; } },
  { nome: 'trabalho + faculdade (24)', montar: s => { let v = adulto(24, { semente: s }); v.educacao.escolaridade = 'medio'; v = empregar(v, 'assistente_adm'); matricula(v, 'administracao'); return v; } },
  { nome: 'trabalho + filhos (32)', montar: s => { let v = adulto(32, { semente: s }); v = empregar(v, 'assistente_adm'); comFilho(v, 2, { casa: true }); comFilho(v, 5, { casa: true }); return v; } },
  { nome: 'trabalho + filhos + hobby (32)', montar: s => { let v = adulto(32, { semente: s }); v = empregar(v, 'assistente_adm'); comFilho(v, 2, { casa: true }); comFilho(v, 5, { casa: true }); v.rotinas = [rot(v, 'musica', 1)]; return v; } },
  { nome: 'rotina pesada + corrida (28)', montar: s => { let v = adulto(28, { semente: s }); v.educacao.escolaridade = 'medio'; v = empregar(v, 'assistente_adm'); matricula(v, 'administracao'); v.rotinas = [rot(v, 'corrida', 1)]; return v; } },
  { nome: 'várias atividades leves (16)', montar: s => { const v = viverAte(nova({ semente: s }), 16); v.rotinas = ['leitura', 'desenho', 'xadrez', 'fotografia', 'videogame'].map(id => rot(v, id, 1)); return v; } },
  { nome: 'muitos compromissos pesados (27)', montar: s => { let v = adulto(27, { semente: s }); v.educacao.escolaridade = 'medio'; v = empregar(v, 'assistente_adm'); matricula(v, 'administracao'); comFilho(v, 1, { casa: true }); v.rotinas = [rot(v, 'academia', 2), rot(v, 'musica', 2)]; return v; } }
];

const media = (x: number[]) => (x.length ? x.reduce((s, y) => s + y, 0) / x.length : 0);
const desempenho = (v: Vida) => v.trabalho.atual?.desempenho ?? v.educacao.matricula?.desempenho ?? v.educacao.basica?.desempenho ?? 0;
const casa = (v: Vida) => media(vinculosVivos(v).filter(x => x.vin.convivio.includes('casa') && !x.p.especie).map(x => x.vin.proximidade));

async function principal() {
  await carregarMundo();
  console.log('| Perfil | Faixa no início | Leve ainda entra? | Estresse (início → 4 anos) | Desempenho (início → 2 anos) | Saúde (4 anos) | Atividades largadas | Casa (proximidade) |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const pf of PERFIS) {
    const linhas: { faixa: string; leve: boolean; e0: number; e4: number; d0: number; d4: number; s4: number; largou: number; c0: number; c4: number }[] = [];
    for (let k = 0; k < VIDAS; k++) {
      let v = pf.montar(31 + k * 7);
      v.momento = null;
      const faixa = encaixe(v, 0).faixa;
      const leve = podeTentar(podeComecarRotina(v, 'leitura', 1)) || podeTentar(podeComecarRotina(v, 'desenho', 1)) || v.rotinas.some(r => r.id === 'leitura');
      const e0 = v.mente.estresse, d0 = desempenho(v), c0 = casa(v);
      const rotinas0 = v.rotinas.map(r => r.id);
      let d2 = d0;
      for (let a = 0; a < 4 && !v.morte; a++) { v = avancarAno(v).vida; v = responderTudo(v); if (a === 1) d2 = desempenho(v); }
      linhas.push({ faixa, leve, e0, e4: v.mente.estresse, d0, d4: d2, s4: v.corpo.saude, largou: rotinas0.filter(id => !v.rotinas.some(r => r.id === id)).length, c0, c4: casa(v) });
      void folegoDaSemana;
    }
    const faixas = [...new Set(linhas.map(l => l.faixa))].join('/');
    console.log(`| ${pf.nome} | ${faixas} | ${Math.round(media(linhas.map(l => (l.leve ? 1 : 0))) * 100)}% | ${media(linhas.map(l => l.e0)).toFixed(0)} → ${media(linhas.map(l => l.e4)).toFixed(0)} | ${media(linhas.map(l => l.d0)).toFixed(0)} → ${media(linhas.map(l => l.d4)).toFixed(0)} | ${media(linhas.map(l => l.s4)).toFixed(0)} | ${media(linhas.map(l => l.largou)).toFixed(1)} | ${media(linhas.map(l => l.c0)).toFixed(0)} → ${media(linhas.map(l => l.c4)).toFixed(0)} |`);
  }
}
void principal();
