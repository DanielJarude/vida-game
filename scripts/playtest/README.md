# Playtest visual automatizado

Duas ferramentas que rodam o VIDA num navegador real (Chromium via
Playwright) e olham o que nenhum teste unitário enxerga.

Elas não substituem o playtest humano — substituem o "achismo" sobre
layout. Foi com elas que o rework visual encontrou, entre outros: opções de
evento mostrando o desfecho antes da escolha, 4px de rolagem horizontal em
320px e um alvo de toque abaixo do mínimo na marca.

## Pré-requisitos

```bash
npx playwright install chromium   # uma vez
npm run build
npx vite preview --port 4173      # em outro terminal
```

## `capturas.mjs` — folha de contato das telas

```bash
SP=/tmp/vida-shots mkdir -p $SP && SP=$SP node scripts/playtest/capturas.mjs
```

Cria uma vida, avança os anos respondendo aos eventos e captura: início,
criação, bebê, adolescente, adulto, Linha da Vida longa (página inteira) e
duas capturas de celular. Para inspeção visual humana.

## `auditoria.mjs` — responsividade e acessibilidade estrutural

```bash
node scripts/playtest/auditoria.mjs
```

Percorre sete larguras (320 → 1920) e reporta, em JSON:

| Verificação | Por quê |
| --- | --- |
| rolagem horizontal da página | overflow lateral é o defeito de layout mais comum e o mais invisível em captura |
| elementos estourando a borda direita | detecta clipping que não chega a gerar rolagem |
| alvos de toque abaixo de 40×32 | toque confortável não é opinião |
| controles sem nome acessível | botão só de ícone sem `aria-label` |
| `+1 ANO` visível | a ação mais importante do jogo não pode sumir em nenhuma largura |

Saída esperada: `overflow=None` e `alvosPequenos=0` em todas as larguras.
