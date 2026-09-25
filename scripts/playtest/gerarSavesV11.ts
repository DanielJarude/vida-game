/**
 * Gera saves v11 REAIS com o motor dos Caminhos de Vida (5148b4c, a versão
 * do PLAYTEST #3), para a migração da vida profissional (v12) ser testada
 * com o que o jogo de fato produzia. Roda num worktree daquele commit:
 *
 *   git worktree add --detach /tmp/v11 5148b4c && cp scripts/playtest/gerarSavesV11.ts /tmp/v11/scripts/playtest/
 *   cd /tmp/v11 && npx esbuild scripts/playtest/gerarSavesV11.ts --bundle --platform=node --outfile=/tmp/g11.cjs && DIR=<repo>/src/motor/__tests__/fixtures node /tmp/g11.cjs
 */
import { writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { abrirNegocio } from '../../src/motor/sistemas/negocio';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { garantirFrente } from '../../src/motor/sistemas/frentes';

const DIR = process.env.DIR ?? 'src/motor/__tests__/fixtures';

/** Vive respondendo sem mexer no rumo: prefere ficar, recusar, seguir (senão, a primeira opção). */
const QUIETAS = ['ficar', 'recusar', 'nao', 'seguir', 'aguentar', 'depois', 'manter', 'renovar', 'assinar'];
function viver(v: Vida, ate: number): Vida {
  while (!v.morte && idade(v) < ate) {
    v = avancarAno(v).vida;
    while (v.momento) { const livres = v.momento.opcoes.filter(o => !o.bloqueio); const o = livres.find(x => QUIETAS.includes(x.id)) ?? livres[0]; v = executar(v, { tipo: 'decidir', opcaoId: o.id }).vida; }
  }
  return v;
}
const nasce = (s: number, genero: 'masculino' | 'feminino', municipioId: string) => criarVida({ nome: genero === 'feminino' ? 'Joana' : 'Caio', sobrenome: 'Lima', genero, municipioId, semente: s });
const r = criarRng(11);
const limpo = (x: Vida) => { x.caminhos.processo = undefined; x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = []; x.justica = undefined; x.caminhos.envolvimento = undefined; x.trabalho.pausa = undefined; x.caminhos.militar = undefined; x.caminhos.negocio = undefined; x.corpo.saude = Math.max(75, x.corpo.saude); };
const gravar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${DIR}/${nome}`, JSON.stringify(v)); console.log(nome, 'versão', v.versao, 'idade', idade(v), v.trabalho.atual?.ocupacaoId ?? '—', v.caminhos.negocio?.nome ?? ''); };

// 1. Dona de lanchonete com o negócio rodando há alguns anos (motor antigo: sem caixa, sem equipe).
{
  let v = viver(nasce(311, 'feminino', 'fortaleza-ce'), 30);
  v = transacao(v, x => { limpo(x); x.trabalho.experiencia['alimentacao'] = 60; x.financas.conta = Math.max(x.financas.conta, 40000); abrirNegocio(x, r, 'lanchonete'); }).vida;
  v = viver(v, 34);
  gravar('save-v11-negocio.json', v);
}
// 2. Jogador profissional (motor antigo: sem contrato com prazo, sem espaço no time).
{
  let v = viver(nasce(412, 'masculino', 'belo-horizonte-mg'), 19);
  v = transacao(v, x => { limpo(x); garantirFrente(x, 'futebol'); const f = x.caminhos.frentes.futebol!; f.habilidade = 81; f.interesse = 90; f.meses = 120; f.auge = 81; entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Atlético Belo Horizonte'); profissionalizar(x, r, 2); }).vida;
  v = viver(v, 21);
  gravar('save-v11-atleta.json', v);
}
// 3. Professor concursado, com família.
{
  let v = viver(nasce(513, 'feminino', 'curitiba-pr'), 36);
  v = transacao(v, x => { limpo(x); x.educacao.escolaridade = 'superior'; x.educacao.concluidos.push({ cursoId: 'pedagogia', nome: 'Pedagogia', nivel: 'superior', area: 'educacao', tFim: x.t - 120, instituicao: 'a universidade federal' }); contratar(x, r, ocupacao('professor_concursado'), 'concurso'); }).vida;
  v = viver(v, 40);
  gravar('save-v11-professora.json', v);
}
