/**
 * Saves v16 REAIS, gerados com o motor da base do FIX pós-REWORK 2 (e01ac33),
 * para a migração v16 → v17 ser testada com o que o jogo de fato produzia:
 *
 *   - o jogador de futebol profissional com a rotina "treino de base" ainda no
 *     tempo livre (o bug do playtest) e o salário da tabela antiga;
 *   - a adulta com amigos de trabalho e de atividade, e um ex;
 *   - o adulto com uma gravidez em curso na parceria.
 *
 *   (na worktree da base)
 *   npx esbuild scripts/playtest/gerarSavesV16.ts --bundle --platform=node --outfile=/tmp/gs16.cjs && DIR=<fixtures> node /tmp/gs16.cjs
 */
import { writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, type Acao } from '../../src/motor/acoes';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { criarRng } from '../../src/motor/rng';

const DIR = process.env.DIR ?? 'src/motor/__tests__/fixtures';
const QUIETAS = ['ficar', 'recusar', 'nao', 'seguir', 'aguentar', 'depois', 'manter', 'renovar', 'assinar'];
function viver(v: Vida, ate: number, acoes: (v: Vida) => Acao[] = () => []): Vida {
  while (!v.morte && idade(v) < ate) {
    for (const a of acoes(v)) { v = executar(v, a).vida; }
    v = avancarAno(v).vida;
    while (v.momento) { const livres = v.momento.opcoes.filter(o => !o.bloqueio); const o = livres.find(x => QUIETAS.includes(x.id)) ?? livres[0]; v = executar(v, { tipo: 'decidir', opcaoId: o.id }).vida; }
  }
  return v;
}
const nasce = (s: number, genero: 'masculino' | 'feminino', municipioId: string) => criarVida({ nome: genero === 'feminino' ? 'Helena' : 'Caio', sobrenome: 'Prado', genero, municipioId, semente: s });
const gravar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${DIR}/${nome}`, JSON.stringify(v)); console.log(nome, 'versão', v.versao, 'idade', idade(v), 'morte', !!v.morte, 'rotinas', v.rotinas.map(r => `${r.id}:${r.nivel}`).join(','), 'esporte', v.caminhos.esporte?.fase, v.trabalho.atual?.ocupacaoId, v.trabalho.atual?.salario); };
const vivo = (f: (s: number) => Vida, s0: number) => { let s = s0; let v = f(s); while (v.morte) v = f(++s); return v; };

// 1. Jogador profissional (a base o levou ao contrato; a rotina de base ficou no tempo livre).
gravar('save-v16-jogador-profissional.json', vivo(s => {
  let v = viver(nasce(s, 'masculino', 'belo-horizonte-mg'), 17, x => (idade(x) >= 8 ? [{ tipo: 'rotina', id: 'futebol', ativa: true, nivel: idade(x) >= 12 ? 3 : 2 }] : []));
  if (v.morte) return v;
  v = transacao(v, x => { garantirFrente(x, 'futebol'); const f = x.caminhos.frentes.futebol!; f.habilidade = Math.max(f.habilidade, 82); f.auge = f.habilidade; x.caminhos.pendente = undefined; x.trabalho.atual = undefined; x.educacao.matricula = undefined; if (!x.caminhos.esporte) entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Clube Atlético Mineiro'); profissionalizar(x, criarRng(s), 3); }).vida;
  return viver(v, 24);
}, 1601));
// 2. Adulta com amigos de trabalho e de atividade.
gravar('save-v16-adulta-amigos.json', vivo(s => viver(nasce(s, 'feminino', 'recife-pe'), 36, x => (idade(x) === 20 ? [{ tipo: 'rotina', id: 'danca', ativa: true, nivel: 1 }, { tipo: 'rotina', id: 'voluntariado', ativa: true, nivel: 1 }] : [])), 1602));
// 3. Adulto de meia-idade com família.
gravar('save-v16-adulto-familia.json', vivo(s => viver(nasce(s, 'masculino', 'salvador-ba'), 44), 1603));
