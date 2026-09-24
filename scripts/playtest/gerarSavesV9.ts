/**
 * Gera saves v9 REAIS com o motor do FIX pós-playtest 2 (3649fd7), para a
 * migração da ATT 3 ser testada com o que o jogo de fato produzia.
 *
 *   npx esbuild scripts/playtest/gerarSavesV9.ts --bundle --platform=node --outfile=/tmp/g9.cjs && node /tmp/g9.cjs
 */
import { writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, pets, filhos } from '../../src/motor/nucleo';
import { estrategia } from '../sim/estrategias';

const DIR = 'src/motor/__tests__/fixtures';

function viver(semente: number, nome: string, municipioId: string, ate: number, ok: (v: Vida) => boolean): Vida | null {
  const est = estrategia(nome); const r = criarRng(semente);
  let v = criarVida({ nome: 'Helena', sobrenome: 'Prado', genero: semente % 2 ? 'feminino' : 'masculino', municipioId, semente });
  while (!v.morte && idade(v) < ate) {
    for (const a of est.agir(v, r)) { v = executar(v, a).vida; if (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: est.decidir(v, v.momento, r) }).vida; }
    v = avancarAno(v).vida;
    if (v.momento && idade(v) < ate) v = executar(v, { tipo: 'decidir', opcaoId: est.decidir(v, v.momento, r) }).vida;
  }
  return !v.morte && ok(v) ? v : null;
}

const alvos: { arquivo: string; nome: string; cidade: string; ate: number; ok: (v: Vida) => boolean }[] = [
  { arquivo: 'save-v9-adolescente-pet.json', nome: 'familiar', cidade: 'curitiba-pr', ate: 15, ok: v => pets(v).length > 0 },
  { arquivo: 'save-v9-jovem-carro.json', nome: 'ambicioso', cidade: 'sao-paulo-sp', ate: 27, ok: v => v.moradia.tipo !== 'pais' && v.financas.bens.some(b => b.tipo === 'veiculo') },
  { arquivo: 'save-v9-familia-financiada.json', nome: 'familiar', cidade: 'recife-pe', ate: 38, ok: v => v.financas.dividas.some(d => d.tipo === 'financiamento_imovel') && filhos(v).length > 0 },
  { arquivo: 'save-v9-endividado.json', nome: 'gastador', cidade: 'belo-horizonte-mg', ate: 33, ok: v => v.financas.negativado || v.financas.dividas.some(d => d.tipo === 'cartao') },
  { arquivo: 'save-v9-aposentada-acoes.json', nome: 'ambicioso', cidade: 'porto-alegre-rs', ate: 68, ok: v => !!v.trabalho.aposentadoria && v.financas.acoes > 0 }
];

for (const a of alvos) {
  let achou: Vida | null = null;
  for (let s = 1; s < 400 && !achou; s++) achou = viver(s * 13 + 5, a.nome, a.cidade, a.ate, a.ok);
  if (!achou) { console.log('não achei', a.arquivo); continue; }
  writeFileSync(`${DIR}/${a.arquivo}`, JSON.stringify(achou));
  const f = achou.financas;
  console.log(a.arquivo, idade(achou), achou.moradia.tipo, 'conta', Math.round(f.conta), 'res', f.reserva, 'acoes', f.acoes, 'bens', f.bens.map(b => b.modeloId).join(','), 'div', f.dividas.map(d => d.tipo).join(','), 'pets', pets(achou).length);
}
