# Harness de auditoria (diagnóstico)

Ferramenta **de diagnóstico**, não parte do jogo e não parte da suíte de qualidade.
Nada aqui é importado por `src/`. Existe para produzir as evidências de
`docs/AUDITORIA-COERENCIA-HUMANA.md` e para poder refazê-las depois de qualquer
correção.

Todos os scripts dirigem o **pipeline real** (`agingSystem`, `educationSystem`,
`careerSystem`, `economySystem`, `familySystem`, `relationshipSystem`,
`eventSystem`, `pacing/lifeRhythm`) com a fonte de aleatoriedade injetada
(`definirFonteAleatoria`), portanto são determinísticos por seed.

| Script | O que mede |
| --- | --- |
| `simulador.ts` | Simula uma vida inteira (0→morte) com um perfil comportamental; grava cronologia ano a ano, razão financeiro linha a linha e violações de coerência |
| `rodar.ts` | 7 perfis × N vidas; agrega violações, ritmo por década, agência por faixa etária, economia, educação, carreira, longevidade |
| `marcos.ts` | Marcos de desenvolvimento perdidos, buracos na Linha da Vida, idade de cada transição de vida, ordem causal namoro→casamento→filho |
| `reproducoes.ts` | Reproduções mínimas e isoladas de cada caso suspeito (duração de curso, emprego sem diploma, vestibular ilimitado, economia do menor…) |
| `exploits.ts` | Adulteração do save em `localStorage` simulado (memória, nunca o dado real) |

## Como rodar

O harness usa uma **config isolada** (`scripts/audit/vitest.audit.config.ts`) justamente para
não ser coletado por `npm test`. A suíte do jogo continua em 44 arquivos / 716 testes.

```bash
# tudo (105 vidas + marcos + reproduções + exploits), ~2,5 s
npx vitest run --config scripts/audit/vitest.audit.config.ts

# só as 105 vidas completas, com artefatos em /tmp/vida-auditoria
VIDAS=15 npx vitest run --config scripts/audit/vitest.audit.config.ts rodar
```

Artefatos (fora do repositório, em `/tmp/vida-auditoria/`):
`resumo.md`, `bruto.json` e uma biografia `vida-<perfil>-<seed>.md` por vida
amostrada — cronologia ano a ano, razão financeiro e lista de violações.

Os scripts terminam em `.ts` e são executados por wrappers `.auditoria.ts` apenas
para reaproveitar o transpilador do Vitest. Eles não fazem asserção nenhuma:
**não são testes** e não devem virar critério de aceite.
