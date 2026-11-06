/**
 * VIDA 12.9 · Esportes — consistência dos resultados (simulação de regressão).
 *
 * Vidas do esportista (futebol desde os 6, estratégia `esportista`) até os 40, e profissionais das outras modalidades
 * (tênis, vôlei, basquete, atletismo, natação, luta) por 14 temporadas, respondendo os momentos ao acaso. Conta as
 * contradições entre memórias/conquistas e o palmarés (`esportes129.contradicoesEsportivas`), os títulos, as finais
 * nacionais jogadas e as cenas que antes inventavam resultado.
 *
 *   npx esbuild scripts/sim/esportes129.ts --bundle --platform=node --outfile=/tmp/x.cjs && VIDAS=20 node /tmp/x.cjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { CarreiraEsportiva, Dominio, Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { estrategia } from './estrategias';
import { contradicoesEsportivas } from '../../src/motor/sistemas/esportes129';
import { verificarCoerencia } from '../../src/motor/sistemas/coerencia';

const VIDAS = Number(process.env.VIDAS ?? 16);
const conta: Record<string, number> = {};
const mais = (k: string, n = 1) => { conta[k] = (conta[k] ?? 0) + n; };
const erros = new Map<string, string>();

function responder(v: Vida, r: Rng, decidir?: ReturnType<typeof estrategia>['decidir']): Vida {
  for (let k = 0; k < 14 && v.momento && !v.morte; k++) {
    const m = v.momento;
    if (m.situacaoId) mais(`momento:${m.situacaoId}`);
    const livres = m.opcoes.filter(o => !o.bloqueio);
    let id = decidir ? decidir(v, m, r) : r.pick(livres.length ? livres : m.opcoes).id;
    if (m.situacaoId === 'esp_doping') id = 'recusar';
    if (!m.opcoes.some(o => o.id === id && !o.bloqueio)) id = (livres[0] ?? m.opcoes[0]).id;
    v = executar(v, { tipo: 'decidir', opcaoId: id }).vida;
  }
  return v;
}

function checar(v: Vida, rotulo: string): void {
  for (const x of contradicoesEsportivas(v)) if (!erros.has(x)) erros.set(x, rotulo);
  for (const x of verificarCoerencia(v)) if (/palmarés/.test(x) && !erros.has(x)) erros.set(x, rotulo);
}

function contarVida(v: Vida): void {
  for (const c of v.caminhos.palmares ?? []) {
    if (c.tipo === 'titulo') mais(`titulos:${c.modalidade}`);
    if (c.tipo === 'selecao' && /^Campe/.test(c.texto)) mais(`selecao_campea:${c.modalidade}`);
    if (c.tipo === 'selecao' && /fase de grupos/.test(c.texto)) mais(`selecao_grupos:${c.modalidade}`);
  }
  for (const s of v.caminhos.situacoes ?? []) mais(`situacao:${s.id}`);
  mais('memorias_campeao_sem_registro_antigo', v.biografia.filter(b => /final com dor e foi campe/.test(b.texto)).length);
}

async function main() {
  await carregarMundo();
  const t0 = Date.now();
  const esportista = estrategia('esportista');
  const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
  // 1. O esportista de futebol (da base ao fim da carreira).
  for (let s = 0; s < VIDAS; s++) {
    const r = criarRng(7000 + s * 31);
    let v = criarVida({ nome: 'Sim', sobrenome: 'Esporte', genero: s % 2 ? 'masculino' : 'feminino', municipioId: s % 3 ? 'sao-paulo-sp' : 'recife-pe', semente: 7000 + s });
    while (!v.morte && idade(v) < 40) {
      for (const a of esportista.agir(v, r)) { if (v.morte || v.momento) break; if (tenta(v, a)) { v = executar(v, a).vida; v = responder(v, r, esportista.decidir); } }
      v = avancarAno(v).vida;
      v = responder(v, r, esportista.decidir);
      checar(v, `futebol s${s} ${idade(v)}a`);
      if (v.caminhos.esporte?.fase === 'profissional') mais('anos_pro:futebol');
    }
    mais('vidas:futebol');
    contarVida(v);
  }
  // 2. Os profissionais das outras modalidades (uma base adulta e o contrato).
  const mods: Dominio[] = ['tenis', 'volei', 'basquete', 'atletismo', 'natacao', 'lutas'];
  const OC: Record<string, string> = { tenis: 'tenista', basquete: 'jogador_basquete' };
  let base = criarVida({ nome: 'Sim', sobrenome: 'Atleta', genero: 'masculino', municipioId: 'sao-paulo-sp', semente: 77 });
  const rb = criarRng(5);
  while (idade(base) < 22) { base = avancarAno(base).vida; base = responder(base, rb); }
  for (let s = 0; s < VIDAS * 2; s++) {
    const mod = mods[s % mods.length];
    let v = transacao(base, x => {
      x.id = `esp129:${mod}:${s}`;
      x.momento = null;
      x.caminhos.frentes[mod] = { habilidade: 82 + (s % 4) * 4, interesse: 80, meses: 200, auge: 92, tInicio: x.t - 200 } as never;
      const nivel = (1 + (s % 4)) as 1 | 2 | 3 | 4;
      x.caminhos.esporte = { modalidade: mod, fase: 'profissional', clube: mod === 'tenis' ? 'circuito' : `equipe de ${mod}`, nivel, tInicio: x.t - 24, tFase: x.t - 12, lesoes: 0, municipioId: x.moradia.municipioId, reputacao: 50, espaco: 'titular', contratoAte: x.t + 48, temporadas: [] } as CarreiraEsportiva;
      x.trabalho.atual = { ocupacaoId: OC[mod] ?? 'atleta', empregador: 'a equipe', contrato: 'clt', salario: 8000, tInicio: x.t - 12, desempenho: 70, municipioId: x.moradia.municipioId, carga: 'integral' };
    }).vida;
    v.rng = 101 + s * 977;
    const r = criarRng(900 + s);
    for (let a = 0; a < 14 && !v.morte; a++) {
      v = avancarAno(v).vida;
      v = responder(v, r);
      checar(v, `${mod} s${s} ${idade(v)}a`);
      if (v.caminhos.esporte?.fase === 'profissional') mais(`anos_pro:${mod}`);
    }
    mais(`vidas:${mod}`);
    contarVida(v);
  }
  const ordenado = Object.fromEntries(Object.entries(conta).sort());
  console.log(JSON.stringify({ segundos: Math.round((Date.now() - t0) / 1000), contradicoes: erros.size, exemplos: [...erros.entries()].slice(0, 12), contagem: ordenado }, null, 1));
}

main();
