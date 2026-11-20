/** VIDA 30 · a versão que o App lembra é a das notas mais novas (as duas moram em módulos separados). */
import { expect, it } from 'vitest';
import { NOTAS } from '../novidades';
import { VERSAO_ATUAL } from '../novidadesVersao';
it('VERSAO_ATUAL é a primeira das notas', () => { expect(VERSAO_ATUAL).toBe(NOTAS[0].versao); });
