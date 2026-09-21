/**
 * F3 — guarda de ARQUITETURA do Calendário da Vida.
 *
 * O calendário é consultado antes do ritmo e conhece a vida inteira; é
 * exatamente o tipo de módulo que, sem vigilância, vira um God System que
 * importa educação, carreira, família e economia "só para checar uma
 * coisinha" — e aí nada mais pode ser testado isoladamente.
 *
 * A regra é a mesma que quebrou o ciclo de imports da Fase 1 (o caso em que
 * `availabilitySystem` importado de `plausibility/` resolvia constantes como
 * `NaN`): `systems/calendario/` importa `types` e `systems/tempo/`, e nada
 * mais de `systems/`. Quando o calendário precisa saber se uma condição de
 * vida é verdadeira, ela é INJETADA como predicado — é assim que
 * `marcosDevidos` recebe `condicaoSatisfeita` em vez de importar
 * `events/eligibility`.
 *
 * Este teste lê os próprios arquivos porque uma dependência proibida
 * compila perfeitamente: só um teste estrutural a detecta antes de ela
 * apodrecer o desenho.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(__dirname, '..');

/** Só o que o calendário pode alcançar dentro de `systems/`. */
const SUBPASTAS_PERMITIDAS = ['tempo'];

function arquivosDoModulo(): string[] {
  return readdirSync(DIR)
    .filter(f => f.endsWith('.ts'))
    .map(f => join(DIR, f));
}

function importsDe(caminho: string): string[] {
  const fonte = readFileSync(caminho, 'utf-8');
  const especificadores: string[] = [];
  const regex = /from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(fonte)) !== null) especificadores.push(m[1]);
  return especificadores;
}

describe('F3 — o Calendário da Vida não conhece os sistemas de domínio', () => {
  it('nenhum arquivo do calendário importa outro sistema além de tempo/', () => {
    const violacoes: string[] = [];

    for (const arquivo of arquivosDoModulo()) {
      for (const spec of importsDe(arquivo)) {
        if (!spec.startsWith('.')) continue; // pacote externo: irrelevante aqui

        // Import dentro do próprio módulo.
        if (!spec.startsWith('../')) continue;

        // `../../types` e `../../types/...` são permitidos.
        if (/^\.\.\/\.\.\/types(\/|$)/.test(spec)) continue;

        // `../tempo/...` é permitido; qualquer outro `../algo` não é.
        const irmao = spec.match(/^\.\.\/([^/]+)/);
        if (irmao && SUBPASTAS_PERMITIDAS.includes(irmao[1])) continue;

        violacoes.push(`${arquivo.split('/').pop()} importa "${spec}"`);
      }
    }

    expect(violacoes).toEqual([]);
  });

  it('o calendário não importa dados do jogo (o catálogo depende dele, não o contrário)', () => {
    // `data/calendario/marcosDeVida` importa os TIPOS do calendário. Se o
    // calendário importasse os DADOS de volta, o motor deixaria de ser
    // genérico e passaria a conhecer marcos específicos pelo nome — que é
    // precisamente a "exceção por nome" proibida no projeto.
    const violacoes: string[] = [];
    for (const arquivo of arquivosDoModulo()) {
      for (const spec of importsDe(arquivo)) {
        if (spec.includes('/data/') || spec.includes('../../data')) {
          violacoes.push(`${arquivo.split('/').pop()} importa "${spec}"`);
        }
      }
    }
    expect(violacoes).toEqual([]);
  });

  it('nenhum arquivo do calendário usa aleatoriedade', () => {
    // A frase inteira da fase: marco garantido não negocia com o dado.
    const violacoes: string[] = [];
    for (const arquivo of arquivosDoModulo()) {
      const fonte = readFileSync(arquivo, 'utf-8');
      // Ignora comentários ao procurar uso real (o cabeçalho FALA de dado).
      const codigo = fonte
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      if (/Math\.random|valorAleatorio|rollChance|sortear/.test(codigo)) {
        violacoes.push(arquivo.split('/').pop()!);
      }
    }
    expect(violacoes).toEqual([]);
  });
});
