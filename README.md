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
    save.ts              save v9, validação, backup, migração dos saves antigos (v5→…→v9)
    dados/               lugares, cursos, ocupações, bens, nomes por geração
    sistemas/            corpo, escola, trabalho, dinheiro, casa, pessoas,
                         romance, família e gestação, rotinas, processos;
                         vida social: vinculos (papel, fase, círculo, importância),
                         interacoes (ações contextuais), filhos (parentalidade,
                         trajetória dos descendentes, netos), luto;
                         estado pessoal: estado (causas de humor, cabeça e
                         saúde — fonte única), cuidados, abalo; processos:
                         entrevista e peneira em etapas, devolutivas;
                         relevancia (o que a tela mostra primeiro)
    conteudo/            acontecimentos (o mundo narra) e decisões (você escolhe)
  ui/                    React fino: um estado (a vida), tudo passa pelo motor
scripts/
  sim/                   simulador de vidas com estratégias de jogador
  playtest/              playtest no navegador (Playwright), retratos
  itch/                  empacotamento e smoke test
docs/
  VIDA-REBUILD-REPORT.md relatório da reconstrução (diagnóstico, decisões, métricas)
  ATT1-VIDA-SOCIAL-REPORT.md  ATT 1: pessoas, família, filhos, gerações, luto
  FIX-PLAYTEST-2-REPORT.md    FIX pós-playtest 2: Você, relações, processos, UX
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
- **Ações nascem da relação**: o que dá para fazer com alguém depende do papel,
  da fase de vida da pessoa, de morar junto ou longe e do que está acontecendo
  com ela. Vínculos são lidos em frases, nunca em números.
- **Causa → estado → ação**: humor, cabeça e saúde são somas de fatores com
  nome (`sistemas/estado.ts`); o equilíbrio anual e a tela "Você" usam a mesma
  conta. Nenhum cuidado é instantâneo.
- **Tentar é uma pequena experiência**: entrevista (2–3 perguntas contextuais,
  sem resposta certa universal) e peneira (duas etapas) terminam com devolutiva.
- **Autonomia não é opacidade**: filhos e netos seguem a própria vida, e o
  jogador fica sabendo.

## Simular

```bash
npx esbuild scripts/sim/simular.ts --bundle --platform=node --outfile=/tmp/sim.cjs
VIDAS=15 SAIDA=/tmp/vida-sim node /tmp/sim.cjs
```

Imprime ritmo por faixa etária, resultados por estratégia (familiar, ambicioso,
estudioso, impulsivo, social, antissocial, econômico, gastador, infiel,
desatento, passivo, ascensão), violações de coerência e repetição; grava
biografias legíveis.

Vida social (outliers de relações, filhos, netos, luto, repetição):

```bash
npx esbuild scripts/sim/social.ts --bundle --platform=node --outfile=/tmp/social.cjs
VIDAS=20 SAIDA=/tmp/social node /tmp/social.cjs
```

FIX pós-playtest 2 (iniciativas, estado pessoal, entrevistas, peneiras, listas):

```bash
npx esbuild scripts/sim/fix2.ts --bundle --platform=node --outfile=/tmp/fix2.cjs
VIDAS=20 SAIDA=/tmp/fix2 node /tmp/fix2.cjs
```

Playtest visual dos cenários do FIX (Chromium, 320/390/820/1440):

```bash
npx esbuild scripts/playtest/gerarFix2.ts --bundle --platform=node --outfile=/tmp/g2.cjs && SP=/tmp/vida-fix2 node /tmp/g2.cjs
npm run build && npx vite preview --port 4173 &
SP=/tmp/vida-fix2 node scripts/playtest/fix2.mjs
```
