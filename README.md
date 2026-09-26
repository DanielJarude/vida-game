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
    save.ts              save v13, validação, backup, migração dos saves antigos (v5→…→v13),
                         exportar/importar vida (arquivo JSON, sem execução de código)
    dados/               lugares, cursos, ocupações, bens, nomes por geração
    sistemas/            corpo, escola, trabalho, dinheiro, casa, pessoas,
                         romance, família e gestação, rotinas, processos;
                         vida social: vinculos (papel, fase, círculo, importância),
                         interacoes (ações contextuais), filhos (parentalidade,
                         trajetória dos descendentes, netos), luto;
                         estado pessoal: estado (causas de humor, cabeça e
                         saúde — fonte única), cuidados, abalo; processos:
                         entrevista e peneira em etapas, devolutivas;
                         relevancia (o que a tela mostra primeiro);
                         vida material: economia (fases, inflação, juro,
                         imóveis, bolsa), dinheiro (orçamento pessoal × casa
                         × casal, balanço, segurança), investimentos, mercado
                         (ofertas de imóveis, veículos, abrigo, loja de animais), veiculos,
                         imoveis, obrigacoes (atraso gradual), partilha
                         (casal, separação, herança), pets (por espécie, pela lei);
                         caminhos de vida: carreira (família de carreira: peso
                         contextual, sentido, custos, ondas de transformação),
                         militar (três Forças, formação, especialidade,
                         transferências, reserva), justica e ilicito (proposta,
                         risco, processo, prisão, saída), pausa (cuidado não
                         remunerado), rural (terra, safra, cooperativa, pesca);
                         vida profissional: profissao (modo de cada caminho,
                         ações contextuais, ritmo, clima com a chefia), ritmo
                         (pesos puros), negocio (caixa, porte, equipe,
                         estratégia, tombos, venda, fechamento), esporte
                         (contrato, espaço, foco, suspensão, clubes reais);
                         politica (portas, partidos registrados no TSE,
                         bandeira, campanha em etapas, mandato, reeleição);
                         compromissos (quando duas trajetórias não cabem
                         juntas, o jogo pergunta: planos com consequência),
                         gestao (ações de cada tipo de negócio), usos (o que
                         se faz com o carro e a casa), coerencia (varredura
                         de estados impossíveis, usada por testes e simulador)
    conteudo/            acontecimentos (o mundo narra) e decisões (você escolhe)
  ui/                    React fino: um estado (a vida), tudo passa pelo motor
    tokens.css, vida.css sistema visual: tinta e papel, tons por área, padrões além da cor
    jogo/                as oito áreas: Linha da Vida, Você (com o dinheiro), Pessoas,
                         Trabalho (em camadas: a situação agora, o que corre em
                         paralelo, outras possibilidades em catálogo), Estudos,
                         Casa (moradia e bens), Tempo livre, Cidade (imobiliária,
                         concessionária, banco, abrigo, loja de animais, mudança)
scripts/
  sim/                   simulador de vidas com estratégias de jogador
  playtest/              playtest no navegador (Playwright), retratos
  itch/                  empacotamento e smoke test
docs/
  VIDA-REBUILD-REPORT.md relatório da reconstrução (diagnóstico, decisões, métricas)
  ATT1-VIDA-SOCIAL-REPORT.md  ATT 1: pessoas, família, filhos, gerações, luto
  FIX-PLAYTEST-2-REPORT.md    FIX pós-playtest 2: Você, relações, processos, UX
  ATT3-VIDA-MATERIAL-REPORT.md  ATT 3: dinheiro, casa, bens, investimentos, pets
  AUDITORIA-CAMINHOS-DE-VIDA-REPORT.md  auditoria e expansão dos caminhos de vida
  REWORK-VISUAL-TRABALHO-REPORT.md      rework visual, aba Trabalho, negócio, atleta, vida política
  FIX-PLAYTEST-3-REPORT.md              FIX pós-playtest 3: conflitos de trajetória, negócio por tipo, pets, save v13
```

### Regras que o código garante

- **Acontecimento não decide por você.** Um acontecimento é uma função que narra
  o que aconteceu *com* a pessoa; não tem opções para sortear. Se a reação importa,
  é uma decisão.
- **Personalidade só por escolha comportamental** (ou rotina mantida por anos).
  Escolhas biográficas — a primeira palavra, o nome de um filho — não movem nada.
- **Pessoas persistem.** Quem entra na história tem origem (a turma, o trabalho,
  a igreja), convivência e passado compartilhado.
- **Dinheiro tem origem e destino**: o dinheiro da pessoa não é o da casa; o
  orçamento é derivado de quem mora junto (família de origem, sozinho,
  dividindo, morando junto, casados), da casa, dos bens, dos filhos, da cidade.
  Valores em **reais de hoje**: a inflação existe e pesa (corrói o dinheiro
  parado, muda o rendimento real), mas não infla os números da tela.
- **Obrigação não é uma coisa só**: financiamento (preso a um bem), empréstimo,
  acordo, cartão rotativo. O que vira problema é o atraso — com consequências
  graduais, nunca dívida infinita silenciosa.
- **Todo estado material solucionável tem ação**: carro na oficina (consertar,
  adiar, parar, vender), casa pedindo reparo, bicho doente (veterinário).
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

Vida material (14 perfis: poupador, consumidor, conservador, arrojado, inquilino,
comprador, sem patrimônio, família, solteiro, empreendedor, renda instável, tutor
de bicho, migrante, na casa dos pais):

```bash
npx esbuild scripts/sim/material.ts --bundle --platform=node --outfile=/tmp/mat.cjs
VIDAS=20 SAIDA=/tmp/vida-mat node /tmp/mat.cjs
```

Caminhos de vida (20 estratégias: acadêmico, técnico, ofício, informal, servidor,
militar, segurança, artista, atleta, empreendedor, autônomo, rural, cuidador,
crime, crime com saída, convencional, mudança tardia, volta aos estudos, tentado,
pouco engajado) e a inspeção de diversidade funcional:

```bash
npx esbuild scripts/sim/trajetorias.ts --bundle --platform=node --outfile=/tmp/traj.cjs
VIDAS=20 SAIDA=/tmp/traj node /tmp/traj.cjs
npx esbuild scripts/sim/diversidade.ts --bundle --platform=node --outfile=/tmp/div.cjs && node /tmp/div.cjs
```

Vida profissional e política (11 estratégias: convencional, puxado, preserva,
negociador, empreendedor, empreendedor cedo, autônomo, atleta forçando, atleta
preservando, político de carreira, político tardio):

```bash
npx esbuild scripts/sim/profissao.ts --bundle --platform=node --outfile=/tmp/prof.cjs
VIDAS=30 SAIDA=/tmp/prof node /tmp/prof.cjs
```

Simulador do FIX #3 (oito trajetórias: negócio paralelo, dono, atleta que
estuda, militar, bichos, política, bens, livre), com a varredura de coerência
a cada ano e as biografias em texto para leitura:

```bash
npx esbuild scripts/sim/fix3.ts --bundle --platform=node --outfile=/tmp/fix3.cjs
VIDAS=25 SAIDA=/tmp/fix3 node /tmp/fix3.cjs
```

Playtest visual do rework (Chromium, 320/390/820/1440, 20 cenários — inclusive a
pergunta de conflito aberta, negócio paralelo com sócio, soldado, bichos e loja
on-line —, cinza e
daltonismo simulado) e contraste dos tokens:

```bash
npx esbuild scripts/playtest/gerarRework.ts --bundle --platform=node --outfile=/tmp/gr.cjs && SP=/tmp/vida-rework node /tmp/gr.cjs
npm run build && npx vite preview --port 4173 &
SP=/tmp/vida-rework node scripts/playtest/rework.mjs
node scripts/playtest/contraste.mjs
```

Playtest visual dos caminhos (Chromium, 320/390/820/1440, 14 cenários):

```bash
npx esbuild scripts/playtest/gerarTrajetorias.ts --bundle --platform=node --outfile=/tmp/gt.cjs && SP=/tmp/vida-traj node /tmp/gt.cjs
npm run build && npx vite preview --port 4173 &
SP=/tmp/vida-traj node scripts/playtest/trajetorias.mjs
```

Playtest visual da vida material (Chromium, 320/390/820/1440, 14 cenários):

```bash
npx esbuild scripts/playtest/gerarMaterial.ts --bundle --platform=node --outfile=/tmp/gm.cjs && SP=/tmp/vida-mat node /tmp/gm.cjs
npm run build && npx vite preview --port 4173 &
SP=/tmp/vida-mat node scripts/playtest/material.mjs
```

Playtest visual dos cenários do FIX (Chromium, 320/390/820/1440):

```bash
npx esbuild scripts/playtest/gerarFix2.ts --bundle --platform=node --outfile=/tmp/g2.cjs && SP=/tmp/vida-fix2 node /tmp/g2.cjs
npm run build && npx vite preview --port 4173 &
SP=/tmp/vida-fix2 node scripts/playtest/fix2.mjs
```
