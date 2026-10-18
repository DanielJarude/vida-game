/**
 * REWORK 9 · SOC-01 — de onde vêm os seguidores. Perfis: pessoa comum ativa, perfil inativo, celebridade (nome
 * pela arte, sem publicar), atleta da elite (o nome vem do campo; a conta parada), influenciador (publica muito).
 * Cada perfil vive 50 anos (`avancarAno` de verdade); mede o público em 1, 10, 30 e 50 anos e o maior salto num ano
 * SEM publicação nenhuma. Roda igual antes e depois (só APIs que já existiam).
 *
 *   npx esbuild scripts/sim/seguidores9.ts --bundle --platform=node --outfile=<scratch>/s9.cjs && node <scratch>/s9.cjs
 */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { avancarAno } from '../../src/motor/ano';
import { podeTentar } from '../../src/motor/plausibilidade';
import { transacao } from '../../src/motor/nucleo';
import { conteudosPossiveis } from '../../src/motor/sistemas/redes';
import { contaAtiva } from '../../src/motor/sistemas/redesBase';
import type { Vida } from '../../src/motor/tipos';

const rede = (oque: string, extra: Record<string, unknown> = {}) => ({ tipo: 'rede', op: { oque, ...extra } }) as Parameters<typeof executar>[1];
type Perfil = 'comum' | 'inativo' | 'celebridade' | 'atleta' | 'influenciador';
const POSTS: Record<Perfil, number> = { comum: 2, inativo: 0, celebridade: 0, atleta: 0, influenciador: 8 };

function responder(v: Vida): Vida {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
    const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}

function viver(perfil: Perfil, k: number) {
  let v: Vida = adulto(20, { semente: 900 + k });
  v.id = `${v.id}-s9${perfil}${k}`;
  v = transacao(v, x => {
    x.financas.conta = 1e7;
    if (perfil === 'celebridade') x.notoriedade = { valor: 80, pico: 80, t: x.t, fonte: 'arte', origens: { arte: 80 } };
    if (perfil === 'atleta') {
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Flamengo', nivel: 4, tInicio: x.t - 36, tFase: x.t - 36, lesoes: 0, municipioId: 'rio-de-janeiro-rj', reputacao: 85, espaco: 'titular', contratoAte: x.t + 60, posicao: 'atacante', temporadas: [] };
      x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Flamengo', contrato: 'clt', salario: 300000, tInicio: x.t - 36, desempenho: 80, municipioId: 'rio-de-janeiro-rj', carga: 'integral' };
      x.notoriedade = { valor: 40, pico: 40, t: x.t, fonte: 'esporte', origens: { esporte: 40 } };
    }
  }).vida;
  v = executar(v, rede('criar', { plataforma: 'instagram' })).vida;
  v = transacao(v, x => { const c = contaAtiva(x, 'instagram')!; if (perfil !== 'comum' && perfil !== 'inativo') c.seguidores = Math.max(c.seguidores, 40000); }).vida;
  const marcos: Record<number, number> = {};
  let maiorSaltoParado = 0, anoDoSalto = '';
  for (let ano = 1; ano <= 50 && !v.morte; ano++) {
    for (let i = 0; i < POSTS[perfil]; i++) {
      const temas = conteudosPossiveis(v, 'instagram');
      if (!temas.length) break;
      const a = rede('publicar', { plataforma: 'instagram', tema: temas[i % temas.length].tema });
      if (!podeTentar(disponibilidade(v, a))) break;
      v = responder(executar(v, a).vida);
    }
    const antes = contaAtiva(v, 'instagram')?.seguidores ?? 0;
    v = responder(avancarAno(v).vida);
    const depois = contaAtiva(v, 'instagram')?.seguidores ?? 0;
    if (!POSTS[perfil] && depois - antes > maiorSaltoParado) { maiorSaltoParado = depois - antes; anoDoSalto = `${antes}→${depois} (fama ${v.notoriedade?.valor ?? 0})`; }
    if ([1, 10, 30, 50].includes(ano)) marcos[ano] = depois;
  }
  return { marcos, maiorSaltoParado, anoDoSalto, fama: v.notoriedade?.valor ?? 0 };
}

const N = Number(process.env.N ?? 4);
for (const perfil of ['comum', 'inativo', 'celebridade', 'atleta', 'influenciador'] as Perfil[]) {
  const rs = Array.from({ length: N }, (_, k) => viver(perfil, k));
  const med = (a: number) => { const xs = rs.map(r => r.marcos[a] ?? 0).sort((x, y) => x - y); return xs[Math.floor(xs.length / 2)]; };
  console.log(`${perfil.padEnd(14)} 1a ${med(1)}  10a ${med(10)}  30a ${med(30)}  50a ${med(50)}  | maior salto sem publicar: ${Math.max(...rs.map(r => r.maiorSaltoParado))} ${rs.sort((a, b) => b.maiorSaltoParado - a.maiorSaltoParado)[0].anoDoSalto}`);
}
