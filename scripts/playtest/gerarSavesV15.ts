/**
 * Saves v15 REAIS, gerados com o motor da base do REWORK 2 (f7b84a9), para a
 * migração v15 → v16 ser testada com o que o jogo de fato produzia:
 *
 *   - a vestibulanda no cursinho (o campo antigo `educacao.cursinho` ligado);
 *   - o adulto com condições crônicas (diagnosticadas na hora, no motor antigo),
 *     academia e uma amizade antiga;
 *   - a idosa com leitura de décadas, viúva, com família.
 *
 *   (na worktree da base)
 *   npx esbuild scripts/playtest/gerarSavesV15.ts --bundle --platform=node --outfile=/tmp/gs15.cjs && DIR=<fixtures> node /tmp/gs15.cjs
 */
import { writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, type Acao } from '../../src/motor/acoes';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';

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
const gravar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${DIR}/${nome}`, JSON.stringify(v)); console.log(nome, 'versão', v.versao, 'idade', idade(v), 'morte', !!v.morte, 'cursinho', v.educacao.cursinho, 'condições', v.corpo.condicoes.map(c => c.id).join(',')); };
const vivo = (f: (s: number) => Vida, s0: number) => { let s = s0; let v = f(s); while (v.morte) v = f(++s); return v; };

// 1. Vestibulanda no cursinho.
gravar('save-v15-vestibulanda-cursinho.json', vivo(s => viver(nasce(s, 'feminino', 'recife-pe'), 17, v => (idade(v) === 16 ? [{ tipo: 'rotina', id: 'cursinho', ativa: true, nivel: 1 }, { tipo: 'rotina', id: 'leitura', ativa: true, nivel: 1 }] : [])), 1501));
// 2. Adulto com condições crônicas e academia.
gravar('save-v15-adulto-condicoes.json', vivo(s => {
  let v = viver(nasce(s, 'masculino', 'sao-paulo-sp'), 48, x => (idade(x) === 30 ? [{ tipo: 'rotina', id: 'academia', ativa: true, nivel: 1 }] : []));
  if (!v.morte && !v.corpo.condicoes.some(c => c.cronica)) v.corpo.condicoes.push({ id: 'hipertensao', nome: 'pressão alta', tInicio: v.t - 36, cronica: true, gravidade: 1, tratando: false });
  return v;
}, 1502));
// 3. Idosa leitora.
gravar('save-v15-idosa-leitora.json', vivo(s => viver(nasce(s, 'feminino', 'porto-alegre-rs'), 72, x => (idade(x) === 20 ? [{ tipo: 'rotina', id: 'leitura', ativa: true, nivel: 1 }] : [])), 1503));
