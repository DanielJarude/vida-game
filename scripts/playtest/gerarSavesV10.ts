/**
 * Gera saves v10 REAIS com o motor da ATT 3 (b0dc7a9), para a migração dos
 * Caminhos de Vida (v11) ser testada com o que o jogo de fato produzia.
 * Roda num worktree do commit da ATT 3:
 *
 *   git worktree add /tmp/att3 b0dc7a9 && cp scripts/playtest/gerarSavesV10.ts /tmp/att3/scripts/playtest/
 *   cd /tmp/att3 && npx esbuild scripts/playtest/gerarSavesV10.ts --bundle --platform=node --outfile=/tmp/g10.cjs && node /tmp/g10.cjs
 */
import { writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, filhos } from '../../src/motor/nucleo';
import { estrategia } from '../sim/estrategias';

const DIR = process.env.DIR ?? 'src/motor/__tests__/fixtures';

function viver(semente: number, nome: string, municipioId: string, ate: number, ok: (v: Vida) => boolean, genero?: 'feminino' | 'masculino'): Vida | null {
  const est = estrategia(nome); const r = criarRng(semente);
  let v = criarVida({ nome: 'Helena', sobrenome: 'Prado', genero: genero ?? (semente % 2 ? 'feminino' : 'masculino'), municipioId, semente });
  while (!v.morte && idade(v) < ate) {
    for (const a of est.agir(v, r)) { v = executar(v, a).vida; if (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: est.decidir(v, v.momento, r) }).vida; }
    v = avancarAno(v).vida;
    if (v.momento && idade(v) < ate) v = executar(v, { tipo: 'decidir', opcaoId: est.decidir(v, v.momento, r) }).vida;
    if (!v.morte && ok(v)) return v;
  }
  return null;
}

const oc = (v: Vida) => v.trabalho.atual?.ocupacaoId ?? '';
const alvos: { arquivo: string; nome: string; cidade: string; ate: number; ok: (v: Vida) => boolean; genero?: 'masculino' | 'feminino' }[] = [
  { arquivo: 'save-v10-soldado.json', nome: 'social', cidade: 'porto-alegre-rs', ate: 22, genero: 'masculino', ok: v => ['soldado_ep', 'cabo_ep'].includes(oc(v)) && !v.momento },
  { arquivo: 'save-v10-militar-carreira.json', nome: 'ascensao', cidade: 'rio-de-janeiro-rj', ate: 40, ok: v => ['aluno_sargento', 'sargento', 'subtenente', 'cadete', 'tenente', 'capitao'].includes(oc(v)) && !v.momento },
  { arquivo: 'save-v10-rural.json', nome: 'familiar', cidade: 'sinop-mt', ate: 45, ok: v => ['produtor_rural', 'trabalhador_rural', 'operador_maquinas'].includes(oc(v)) && idade(v) >= 25 && !v.momento },
  { arquivo: 'save-v10-familia.json', nome: 'familiar', cidade: 'salvador-ba', ate: 40, ok: v => idade(v) >= 34 && filhos(v).length > 0 && !!v.trabalho.atual && !v.momento },
  { arquivo: 'save-v10-aposentado.json', nome: 'economico', cidade: 'belo-horizonte-mg', ate: 72, ok: v => !!v.trabalho.aposentadoria && !v.momento }
];

for (const a of alvos) {
  let achou: Vida | null = null;
  for (let s = 1; s < 500 && !achou; s++) achou = viver(s * 13 + 5, a.nome, a.cidade, a.ate, a.ok, a.genero);
  if (!achou) { console.log('não achei', a.arquivo); continue; }
  writeFileSync(`${DIR}/${a.arquivo}`, JSON.stringify(achou));
  console.log(a.arquivo, 'versão', achou.versao, 'idade', idade(achou), 'trabalho', oc(achou) || '—', 'moradia', achou.moradia.tipo);
}
