/**
 * Config isolada do harness de auditoria (diagnóstico).
 * Existe para que os scripts de `scripts/audit/` NÃO sejam coletados pela
 * suíte do jogo (`npm test`): eles não fazem asserção e não são critério de
 * aceite. Ver `scripts/audit/README.md`.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    css: false,
    include: ['scripts/audit/**/*.auditoria.ts'],
    testTimeout: 600000
  }
});
