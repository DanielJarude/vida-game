/**
 * HOTFIX 11.5.1 — a auditoria do futebol: as tabelas, os campeões e os prêmios individuais.
 *
 *   1. O MUNDO (sem o clube da vida), 40 temporadas × 6 vidas por país: os invariantes de cada tabela (J = V+E+D, a
 *      soma de vitórias = derrotas, gols marcados = sofridos, a ordem pelos critérios), a tabela concorda com o campeão
 *      e com quem caiu/subiu, os pontos do campeão e do lanterna, gols por jogo, a colocação média dos grandes.
 *   2. AS CARREIRAS: N atletas de futebol de habilidades diferentes, dos 18 aos 36: a linha do clube na tabela bate com
 *      a colocação, os gols do atleta cabem nos gols do clube, os campeões das copas são coerentes, e os prêmios —
 *      quem ganha, com que temporada, quantas vezes seguidas, se a vida ganha só com temporada para isso.
 *
 *   npx esbuild scripts/sim/futebol1151.ts --bundle --platform=node --format=esm --outfile=<scratch>/f.mjs && node <scratch>/f.mjs
 */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { clubesDoPais } from '../../src/motor/dados/clubes';
import { ligaDe, tabelaDaUltimaTemporada } from '../../src/motor/sistemas/ligas';
import { carregarRegiao } from '../../src/motor/mundo/carregar';
import { transacao } from '../../src/motor/nucleo';
import { invariantesDaTabela, pontosDaLinha, SEM_CATALOGO } from '../../src/motor/sistemas/tabelaDaLiga';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { campeoesDoPais } from '../../src/motor/sistemas/competicoes';
import { pontuacao } from '../../src/motor/sistemas/premiosDoFutebol';
import type { Vida } from '../../src/motor/tipos';

await carregarRegiao('europa');
await carregarRegiao('america_sul');
const erros: string[] = [];
const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const f1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : '—');

/* ------------------------------------------------------------ 1. o mundo */
const ANOS = Number(process.env.ANOS ?? 40);
for (const pais of (process.env.PAISES ?? 'BR,ES,GB,IT').split(',')) {
  const portes = new Map(clubesDoPais(pais).map(c => [c.nome, c.porte]));
  const ptsCampeao: number[] = [], ptsLanterna: number[] = [], golsJogo: number[] = [], posGrande: number[] = [], posTrad: number[] = [];
  let tabelas = 0, concordaCampeao = 0, concordaQueda = 0, quedas = 0;
  for (let s = 0; s < 6; s++) {
    let v = adulto(20, { semente: 1151 + s });
    ligaDe(v, pais);
    for (let k = 0; k < ANOS; k++) {
      v = transacao(v, x => { x.t += 12; }).vida;
      const liga = ligaDe(v, pais);
      const u = liga.ultima!;
      for (const n of [2, 3, 4] as const) {
        const t = u.tabelas?.[n];
        if (!t) continue;
        tabelas++;
        for (const e of invariantesDaTabela(t)) erros.push(`${pais} ${u.ano} div ${n}: ${e}`);
        if (n === 4) {
          ptsCampeao.push(pontosDaLinha(t[0])); ptsLanterna.push(pontosDaLinha(t[t.length - 1]));
          golsJogo.push(t.reduce((a, l) => a + l[5], 0) / (t.length * (t.length - 1)));
          if (u.campeoes[4] ? u.campeoes[4] === t[0][0] : t[0][0].startsWith(SEM_CATALOGO)) concordaCampeao++;
          else erros.push(`${pais} ${u.ano}: campeão ${u.campeoes[4]} ≠ 1º da tabela ${t[0][0]}`);
          t.forEach((l, i) => { const p = portes.get(l[0]); if (p === 'grande') posGrande.push(i + 1); if (p === 'tradicional') posTrad.push(i + 1); });
          // Quem caiu está nas últimas posições da tabela.
          for (const c of u.cairam.filter(c => t.some(l => l[0] === c))) { quedas++; const i = t.findIndex(l => l[0] === c); if (i >= t.length - 4) concordaQueda++; else erros.push(`${pais} ${u.ano}: ${c} caiu em ${i + 1}º`); }
        }
      }
      if ((liga.historico ?? []).length > 30) erros.push(`${pais}: histórico com mais de 30 temporadas`);
    }
  }
  console.log(`${pais}: ${tabelas} tabelas · campeão = 1º da tabela ${concordaCampeao}/${ptsCampeao.length} · queda nas últimas ${concordaQueda}/${quedas} · pts do campeão ${f1(media(ptsCampeao))} (min ${Math.min(...ptsCampeao)}, máx ${Math.max(...ptsCampeao)}) · lanterna ${f1(media(ptsLanterna))} · gols/jogo ${media(golsJogo).toFixed(2)} · grande ${f1(media(posGrande))}º, tradicional ${f1(media(posTrad))}º na elite`);
}

/* ------------------------------------------------------------ 2. as carreiras */
function responder(v: Vida): Vida {
  let n = v;
  for (let k = 0; k < 12 && n.momento && !n.morte; k++) { const op = n.momento.opcoes.find(o => !o.bloqueio) ?? n.momento.opcoes[0]; n = executar(n, { tipo: 'decidir', opcaoId: op.id }).vida; }
  n.momento = null;
  return n;
}
const N = Number(process.env.N ?? 24);
const vencedores = new Map<string, number>();
let seguidasMax = 0, premiosVida = 0, premiosTotal = 0, linhasOk = 0, linhasTotal = 0, golsCabem = 0, golsTotal = 0, campeoesProprios = 0;
const notasVencedorVida: number[] = [], notasVencedorMundo: number[] = [];
const porPremio = new Map<string, number>();
for (let k = 0; k < N; k++) {
  const cidade = ['sao-paulo-sp', 'rio-de-janeiro-rj', 'belo-horizonte-mg', 'porto-alegre-rs'][k % 4];
  let v = transacao(adulto(18, { semente: 7700 + k * 31, genero: k % 5 === 4 ? 'feminino' : 'masculino', municipioId: cidade }), x => {
    garantirFrente(x, 'futebol');
    Object.assign(x.caminhos.frentes.futebol!, { habilidade: 70 + (k % 6) * 6, interesse: 95, meses: 140, auge: 95 });
    x.trabalho.atual = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined;
    entrarNaBase(x, 'futebol', x.moradia.municipioId, clubesDoPais('BR').find(c => c.cidade === x.moradia.municipioId)?.nome ?? 'Flamengo');
    profissionalizar(x, criarRng(k + 1), 2 + (k % 3));
    x.momento = null; x.caminhos.pendente = undefined;
  }).vida;
  for (let a = 0; a < 18 && !v.morte; a++) {
    v = responder(avancarAno(v).vida);
    const e = v.caminhos.esporte;
    const t = e?.temporadas?.[e.temporadas.length - 1];
    if (!e || !t || e.modalidade !== 'futebol' || t.nivel < 2) continue;
    const tab = tabelaDaUltimaTemporada(v, t.pais ?? 'BR', t.nivel);
    if (tab?.ano === t.ano) {
      linhasTotal++;
      const i = tab.linhas.findIndex(l => l[0] === t.clube);
      if (i + 1 === t.colocacao && t.campanha && t.campanha[0] === tab.linhas[i][1]) linhasOk++;
      else erros.push(`vida ${k} ${t.ano}: ${t.clube} ${t.colocacao}º, na tabela ${i + 1}º`);
      if (t.campanha) { golsTotal++; if (t.campanha[4] >= Math.round(t.gols * 0.7)) golsCabem++; }
    }
    for (const c of t.copas ?? []) if (c.fase === 'campeão') {
      const h = campeoesDoPais(v, t.pais ?? 'BR').find(x => x.ano === t.ano);
      const campeao = c.id.startsWith('cont:') ? h?.cont : h?.copa;
      if (campeao === t.clube) campeoesProprios++; else erros.push(`vida ${k} ${t.ano}: ganhou ${c.id} mas o histórico diz ${campeao}`);
    }
  }
  const ps = v.caminhos.futebolMundo?.premios ?? [];
  const seq = new Map<string, { ultimo: number; n: number }>();
  for (const p of ps) {
    premiosTotal++;
    porPremio.set(p.premio, (porPremio.get(p.premio) ?? 0) + 1);
    const chave = `${p.premio}:${p.vencedor.nome}`;
    vencedores.set(chave, (vencedores.get(chave) ?? 0) + 1);
    const s = seq.get(chave);
    const n = s && s.ultimo === p.ano - 1 ? s.n + 1 : 1;
    seq.set(chave, { ultimo: p.ano, n });
    if (p.premio === 'bola_de_ouro') seguidasMax = Math.max(seguidasMax, n);
    if (p.vencedor.voce) {
      premiosVida++;
      const t = v.caminhos.esporte?.temporadas?.find(x => x.ano === p.ano);
      if (t && p.premio === 'bola_de_ouro') notasVencedorVida.push(t.nota);
      if (!v.caminhos.palmares?.some(c => c.competicaoId === `premio:${p.premio}` && c.ano === p.ano && c.tipo === 'premio')) erros.push(`vida ${k}: ${p.premio} ${p.ano} sem conquista no palmarés`);
    }
  }
}
void notasVencedorMundo; void pontuacao;
const top = [...vencedores].filter(([k]) => k.startsWith('bola_de_ouro')).sort((a, b) => b[1] - a[1]).slice(0, 3);
console.log(`carreiras: linha do clube = colocação ${linhasOk}/${linhasTotal} · gols do atleta cabem nos do clube ${golsCabem}/${golsTotal} · títulos de copa no histórico ${campeoesProprios}`);
console.log(`prêmios: ${premiosTotal} entregues (${[...porPremio].map(([p, n]) => `${p} ${n}`).join(', ')}) · a vida ganhou ${premiosVida} · Bola de Ouro: mais vezes ${top.map(([k, n]) => `${k.split(':')[1]} ${n}`).join(', ')} · seguidas no máximo ${seguidasMax} · nota média da vida quando ganhou ${f1(media(notasVencedorVida))}`);
console.log(erros.length ? `${erros.length} ERROS:\n${erros.slice(0, 25).join('\n')}` : 'sem erros');
