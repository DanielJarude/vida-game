# VIDA

> Você não escolhe tudo o que acontece na sua vida.
> Escolhe o que fazer com a vida que aconteceu com você.

Um simulador de vida brasileiro. Você nasce numa família, numa cidade e numa
classe social; cresce, estuda (ou não), trabalha, ama, perde, envelhece. O mundo
acontece sem pedir licença — pais se separam, a economia entra em recessão,
amigos mudam de cidade — e de vez em quando a decisão é sua.

A Linha da Vida é o centro: uma biografia, não um log.

## Rodar

Node 22 (há `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # vitest (motor + interface)
npm run typecheck
npm run build        # dist/, caminhos relativos (serve no itch.io)
npm run build:itch   # empacota para o itch.io
npm run smoke:itch   # verifica o pacote
```

## Arquitetura

```
src/
  motor/                 regras puras, sem React, determinísticas por semente
    tipos.ts             o modelo: uma Vida, JSON puro
    ano.ts               um ano de vida: sistemas → morte → conteúdo
    acoes.ts             comandos do jogador, com disponibilidade graduada
    criacao.ts           nascer (família de origem coerente com classe e lugar)
    save.ts              save v6, validação, backup, migração dos saves antigos
    dados/               lugares, cursos, ocupações, bens, nomes por geração
    sistemas/            corpo, escola, trabalho, dinheiro, casa, pessoas,
                         romance, família e gestação, rotinas, processos
    conteudo/            acontecimentos (o mundo narra) e decisões (você escolhe)
  ui/                    React fino: um estado (a vida), tudo passa pelo motor
scripts/
  sim/                   simulador de vidas com estratégias de jogador
  playtest/              playtest no navegador (Playwright), retratos
  itch/                  empacotamento e smoke test
docs/
  VIDA-REBUILD-REPORT.md relatório da reconstrução (diagnóstico, decisões, métricas)
```

### Regras que o código garante

- **Acontecimento não decide por você.** Um acontecimento é uma função que narra
  o que aconteceu *com* a pessoa; não tem opções para sortear. Se a reação importa,
  é uma decisão.
- **Personalidade só por escolha comportamental** (ou rotina mantida por anos).
  Escolhas biográficas — a primeira palavra, o nome de um filho — não movem nada.
- **Pessoas persistem.** Quem entra na história tem origem (a turma, o trabalho,
  a igreja), convivência e passado compartilhado.
- **Dinheiro tem origem e destino**: orçamento do domicílio, derivado de quem mora
  junto, casa, carro, filhos, cidade. Reais constantes, sem inflação.
- **Plausibilidade graduada**: impossível, incompatível, ilegal, requisito,
  irregular, improvável, permitido — e o jogo explica o bloqueio.
- **Mesma semente + mesmos comandos = mesma vida** (testado).

## Simular

```bash
npx esbuild scripts/sim/simular.ts --bundle --platform=node --outfile=/tmp/sim.cjs
VIDAS=15 SAIDA=/tmp/vida-sim node /tmp/sim.cjs
```

Imprime ritmo por faixa etária, resultados por estratégia (familiar, ambicioso,
estudioso, impulsivo, social, antissocial, econômico, gastador, passivo,
ascensão), violações de coerência e repetição; grava biografias legíveis.
