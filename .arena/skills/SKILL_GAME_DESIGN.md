---
name: vida-game-design
description: Orientar regras, escolhas e consequências do VIDA, preservando identidade própria e escopo.
---

# Game design do VIDA

Leia o [índice](SKILLS_INDEX.md). Use esta skill ao alterar regras, atividades, progressão ou conexões entre sistemas.

## Identidade e ciclo central

MUST criar um simulador de trajetórias humanas no Brasil, com escolhas compreensíveis, circunstâncias e consequências que se acumulam. A inspiração é o gênero de simulação de vida; DO NOT copiar layout, textos, eventos, marca ou apresentação característica de BitLife.

O ciclo é: **entender a situação → escolher uma ação compatível → perceber a consequência → acompanhar a Linha da Vida → avançar no tempo**. MUST manter a opção de avançar o tempo fácil de encontrar, com confirmação apenas quando houver perda relevante ou decisão pendente que a exija.

MUST fazer da Linha da Vida o registro principal da trajetória. Decisões relevantes devem produzir registros ligados ao estado real, com idade e ordem consistentes. Ações recusadas não podem aparecer como realizadas.

## Sem Energia consumível

- MUST remover Energia como moeda, barra limitadora, custo de clique ou requisito de atividade.
- DO NOT renomeá-la para disposição, fôlego, pontos de ação ou outro medidor equivalente.
- DO NOT introduzir recarga, espera em tempo real, limite diário arbitrário ou pagamento para continuar jogando.
- SHOULD representar cansaço ou estresse somente quando o contexto justificar, por consequências narrativas ou sistemas já existentes. Não criar um novo recurso para substituir Energia.
- MUST impedir exploração de recompensas repetidas por regras da própria atividade: matrícula não se repete enquanto vigente; compra exige saldo; uma conquista não concede o mesmo prêmio indefinidamente.
- SHOULD distinguir uma ação pontual de um compromisso que produz resultado ao avançar o tempo. Não impor uma cota universal de cliques.

## Escolhas e consequências

MUST definir, para cada ação alterada: quem pode agir, pré-condições, efeitos imediatos, efeitos futuros quando pertinentes, registro na Linha da Vida e comportamento em caso de recusa.

SHOULD conectar sistemas existentes por causas compreensíveis. Exemplo: conciliar estudo e trabalho pode afetar desempenho escolar e renda; dificuldade financeira pode alterar possibilidades, sem determinar um destino inevitável. Não implementar esses sistemas se a tarefa não os inclui.

MUST permitir que escolhas anteriores influenciem acontecimentos posteriores quando essa relação existir no design. Evite efeitos futuros que dependam de texto livre: use identificadores e estado estruturado.

DO NOT apresentar toda escolha como um prêmio ou castigo imediato. DO NOT criar uma opção sempre superior sem custo contextual, nem punir o jogador com resultados aleatórios sem relação reconhecível com a situação.

SHOULD comunicar riscos relevantes antes de decisões irreversíveis, sem revelar toda a simulação. Sorte e contexto podem influenciar resultados; não prometer certeza quando houver probabilidade.

## Limite de escopo

Antes de expandir, identifique qual problema ou experiência a mudança resolve. MUST reutilizar sistemas adequados antes de criar outros. DO NOT adicionar inventários, profissões, mercados ou dezenas de atributos apenas para preencher menus.

O jogo precisa funcionar em diferentes trajetórias; DO NOT reduzir sucesso a dinheiro ou tratar um único modelo de família, carreira ou escolaridade como obrigatório.

## Exemplos

**Inadequado:** “Brincar — custa 10 de Energia; +5 Felicidade”, repetível até a barra zerar.

**Preferível:** uma brincadeira apropriada à idade gera uma situação curta e efeitos coerentes com o vínculo familiar existente. Repetições não fabricam ganhos ilimitados nem lotam a Linha da Vida.

**Inadequado:** adicionar uma bolsa de valores para tornar a tela inicial mais completa.

**Preferível:** corrigir ações adultas visíveis para bebês e melhorar a leitura da situação atual antes de ampliar sistemas.

## Critérios de aceite

- [ ] A mudança tem propósito claro no ciclo de vida e respeita o escopo pedido.
- [ ] Nenhuma regra depende de Energia consumível ou substituto equivalente.
- [ ] Consequências relevantes alteram o estado e aparecem no histórico de forma consistente.
- [ ] Repetições não geram dinheiro, atributos ou registros ilimitados sem regra contextual.
- [ ] Escolhas e resultados respeitam idade, contexto e sistemas existentes.
