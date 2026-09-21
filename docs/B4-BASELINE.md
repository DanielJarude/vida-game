# B4 — Baseline registrado antes do rework

Commit de partida: `1055e21` (Add B4 visual reference).

## Verificações executadas

| Comando | Resultado |
| --- | --- |
| `npm install` | 91 pacotes, 0 vulnerabilidades |
| `npm test` | **7 arquivos / 114 testes — todos passando** |
| `npm run build` | OK — `tsc && vite build`, 1941 módulos, CSS 11.85 kB, JS 469.22 kB |

### Testes existentes no checkout (fonte de verdade)

| Arquivo | Testes |
| --- | --- |
| `src/systems/__tests__/personalidade.test.ts` | 30 |
| `src/systems/__tests__/availabilitySystem.test.ts` | 31 |
| `src/systems/__tests__/motorGuards.test.ts` | 23 |
| `src/systems/__tests__/repeticaoEAno.test.ts` | 13 |
| `src/systems/__tests__/saveMigration.test.ts` | 9 |
| `src/systems/__tests__/eventos.test.ts` | 6 |
| `src/systems/__tests__/cicloVida.test.ts` | 2 |
| **Total** | **114** |

## Discrepâncias encontradas no briefing

1. **`docs/PR-B3-REPORT.md` não existe.** O diretório `docs/` contém apenas
   `docs/references/`. Não foi possível ler o relatório do B3.
2. **"31 testes" não corresponde ao checkout.** O baseline real é de **114 testes**.
   O número 31 coincide exatamente com a contagem de `availabilitySystem.test.ts`,
   o que sugere que o relatório do B3 mediu um único arquivo. Todos os 114 testes
   são preservados.
3. **`ActionOutcome` / `OutcomePanel` não existem no código.** Busca por
   `ActionOutcome`, `OutcomePanel`, `AnnualSummary`, `resumoAnual` retorna zero
   ocorrências. O fluxo atual de evento é `situação → escolha → fecha o modal`,
   sem etapa de resultado.
4. **Resumo anual não existe.** Nenhuma estrutura de resumo de ano foi encontrada.

Consequência: o B4 **implementa** a etapa de resultado e o resumo anual como
camada de apresentação derivada do motor existente, em vez de "preservar" algo
que não estava presente. Nenhuma regra de gameplay foi alterada para isso.

## Arquitetura no baseline

| Arquivo | Linhas | Observação |
| --- | --- | --- |
| `src/hooks/useGame.ts` | 959 | maior arquivo; orquestração + feedback |
| `src/styles/index.css` | 808 | CSS monolítico, arquivo único |
| `src/components/tabs/CareerTab.tsx` | 408 | maior componente |
| `src/App.tsx` | 278 | monta telas + navegação + markup de abas |
| `src/components/layout/StatsSidebar.tsx` | 162 | ficha + traços + atributos + internos |

### Problemas visuais catalogados

- `card` aparece 14× e `card-title` 12× nos componentes de aba: quase todo grupo
  de informação é uma caixa com borda — estética de dashboard.
- `StatsSidebar` empilha três cards (Ficha / Traços / Atributos) e expõe um botão
  "Ver Atributos Internos" que mostra **sete números internos** (disciplina,
  sociabilidade, empatia, ambição, estresse, reputação, condicionamento) —
  contradiz a filosofia B2 de personalidade qualitativa.
- Identidade do personagem vive apenas numa linha do header, com nome, idade,
  cidade, situação e saldo todos com peso tipográfico semelhante.
- Timeline é uma lista de parágrafos agrupados por ano, sem eixo, sem marcador,
  sem diferenciação de tipo de acontecimento.
- `EventModal` não tem etapa de resultado; a escolha fecha o modal e o efeito
  aparece apenas como mais uma linha de log na timeline.
- Estilos inline espalhados (`style={{...}}`) em Header, StatsSidebar e TimelineTab.
- Emoji `🌱` usado como marca, contrariando `SKILL_UX_UI`.
