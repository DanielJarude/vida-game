/** VIDA 14 · futsal: modalidade própria (atividade, posição, temporada coerente, goleiro-linha), sem contradições de calendário. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar } from '../acoes';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import { garantirFrente } from '../sistemas/frentes';
import { entrarNaBase, fecharTemporada, profissionalizar } from '../sistemas/esporte';
import { registrarTemporada } from '../sistemas/palmares';
import { modeloRotina } from '../sistemas/rotinas';
import { MODALIDADES, GANCHOS_DE_MODALIDADE } from '../sistemas/esporte';
import { interpretar } from '../save';
import '../v14/esportes/futsal14';

describe('VIDA 14 · futsal', () => {
  it('é modalidade, tem atividade da semana e gancho de temporada', () => {
    expect(MODALIDADES).toContain('futsal');
    expect(modeloRotina('futsal')?.pratica?.futsal).toBe(1);
    expect(GANCHOS_DE_MODALIDADE.futsal?.temporada).toBeDefined();
    for (const id of ['handebol', 'ciclismo', 'skate', 'surfe', 'tenis_mesa']) expect(modeloRotina(id), id).toBeDefined();
  });
  it('uma carreira de futsal joga temporadas com posição, gols, goleiro-linha e histórico coerente', () => {
    let v = transacao(structuredClone(adulto(20, { semente: 31, genero: 'masculino' })), x => {
      garantirFrente(x, 'futsal');
      Object.assign(x.caminhos.frentes.futsal!, { habilidade: 86, interesse: 90, meses: 140, auge: 86 });
      x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.educacao.matricula = undefined;
      entrarNaBase(x, 'futsal', x.moradia.municipioId, 'equipe da prefeitura');
      profissionalizar(x, criarRng(1), 3);
      x.momento = null; x.caminhos.pendente = undefined;
    }).vida;
    v = executar(v, { tipo: 'futsal14', oque: { funcao: 'pivo' } } as never).vida;
    expect(v.caminhos.esporte!.futsal?.funcao).toBe('pivo');
    v = executar(v, { tipo: 'futsal14', oque: { goleiroLinha: true } } as never).vida;
    v = transacao(v, x => { const e = x.caminhos.esporte!; for (let k = 0; k < 4; k++) { x.t += 12; const r = criarRng(70 + k); const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); } }).vida;
    const ts = v.caminhos.esporte!.temporadas ?? [];
    expect(ts.length).toBe(4);
    for (const t of ts) { expect(t.funcao).toBe('pivo'); expect(t.partidas).toBeLessThanOrEqual(30); expect(t.gols).toBeGreaterThanOrEqual(0); }
    expect(ts.some(t => (t.goleiroLinha ?? 0) > 0)).toBe(true);
    expect(ts.reduce((s2, t) => s2 + t.gols, 0)).toBeGreaterThan(5); // o pivô faz gol
    expect(new Set(ts.map(t => t.ano)).size).toBe(4);
    expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
  });
});
