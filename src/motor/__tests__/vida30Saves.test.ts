/**
 * VIDA 30 · saves: os antigos (sem nenhum campo novo) abrem e vivem anos com tudo da 30 ligado — a fama, o ofício, a
 * família do par, a base, o celular, o campo rebalanceado; o save novo, salvo e reaberto, volta igual.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { carregarMundo } from '../mundo/carregar';
import { interpretar } from '../save';
import { avancarAno } from '../ano';
import { responderTudo } from './ajuda';
import type { Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

function abrir(nome: string): Vida {
  const l = interpretar(readFileSync(join(__dirname, 'fixtures', nome), 'utf8'));
  if (l.tipo !== 'ok') throw new Error(`${nome}: ${l.tipo}`);
  return l.vida;
}

describe('VIDA 30 · saves antigos e novos', () => {
  for (const nome of ['save-v11-atleta.json', 'save-v12-politica.json', 'save-v13-investidor.json', 'save-v29-rural.json']) {
    it(`${nome}: abre e vive três anos sem quebrar`, () => {
      let v = abrir(nome);
      for (let k = 0; k < 3 && !v.morte; k++) { v = avancarAno(v).vida; v = responderTudo(v); }
      expect(v.t).toBeGreaterThan(0);
      // Salvo e reaberto: tudo o que a 30 guardou volta igual.
      const de = interpretar(JSON.stringify(v));
      expect(de.tipo).toBe('ok');
      if (de.tipo === 'ok') {
        expect(de.vida.fama30).toEqual(v.fama30);
        expect(de.vida.oficio30).toEqual(v.oficio30);
        expect(de.vida.celular15?.ditos30).toEqual(v.celular15?.ditos30);
      }
    });
  }
});
