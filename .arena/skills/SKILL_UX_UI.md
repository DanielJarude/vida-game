---
name: vida-ux-ui
description: Orientar hierarquia visual e interface contextual do VIDA, centrada na Linha da Vida.
---

# UX e interface

Leia o [índice](SKILLS_INDEX.md) e aplique a [política de idade](SKILL_AGE_PROGRESSION.md) em qualquer menu ou ação.

## Hierarquia obrigatória

MUST permitir que o jogador responda, na primeira tela: “Quem sou?”, “Quantos anos tenho?”, “Qual é minha situação?” e “O que aconteceu?”.

1. Identidade compacta: nome, idade explícita (“0 anos”), local e situação atual coerente com a fase.
2. Linha da Vida: principal área de leitura, com acontecimentos em ordem consistente e indicação clara de novidades.
3. Ações pertinentes à fase e botão de avançar o tempo fácil de encontrar.
4. Indicadores essenciais e detalhes secundários, acessíveis sem competir com a narrativa.

MUST manter idade facilmente acessível durante a navegação principal. DO NOT escondê-la apenas em perfil, tooltip ou tela secundária. Se um dado estiver ausente, use estado neutro coerente; não invente ocupação ou renda.

## Interface que acompanha a vida

MUST construir navegação a partir de ações elegíveis. Um bebê recebe uma experiência de infância, não um painel financeiro com cadeados. Não mostrar categorias vazias após filtrar ações.

SHOULD manter padrões de navegação familiares ao longo da vida, introduzindo conteúdo gradualmente. A mudança de fase pode alterar ações e contexto sem trocar arbitrariamente todos os controles de lugar.

## Direção visual

- SHOULD priorizar tipografia, espaçamento, alinhamento e hierarquia em vez de caixas decorativas.
- DO NOT transformar cada informação em um card com borda, sombra e ícone.
- DO NOT usar emojis como linguagem visual padrão de botões, atributos e navegação.
- SHOULD adotar ícones consistentes apenas quando ajudam a reconhecer uma ação, com rótulos quando necessários.
- DO NOT usar gradientes, badges, estatísticas e mensagens motivacionais apenas para preencher a tela.
- MUST eliminar explicações que repetem o título, rótulos redundantes e chamadas genéricas como “Explore infinitas possibilidades”.
- SHOULD preservar componentes existentes que já servem bem ao jogo. Redesenho total não é requisito.

Cards, bordas e cor são ferramentas legítimas quando agrupam informação ou mostram estado. O objetivo é intenção visual e leitura, não proibição estética absoluta.

## Linha da Vida e feedback

MUST distinguir acontecimento, escolha pendente e resultado. Registre marcos relevantes com idade; use detalhes expansíveis quando necessário. DO NOT despejar logs técnicos ou cada clique no histórico.

MUST manter efeitos claros: uma escolha deve mostrar o que ocorreu e refletir a alteração nos indicadores pertinentes. Não use apenas um aviso temporário para uma consequência importante.

SHOULD preservar posição de leitura durante atualizações e oferecer acesso claro às novidades sem saltos inesperados.

## Usabilidade e acessibilidade

MUST verificar celular e desktop, incluindo tela de aproximadamente 360 px de largura. Não permitir rolagem horizontal acidental, texto cortado ou controles sobrepostos.

MUST oferecer foco visível, controles semânticos, navegação por teclado e rótulos acessíveis. Não comunicar bloqueio ou alteração apenas por cor. Motivos de indisponibilidade precisam funcionar também por toque, sem depender de hover.

## Exemplo

**Evitar:** seis cards de atributos, uma barra de Energia e atalhos para Carreira, Imóveis e Universidade acima do histórico de um recém-nascido.

**Buscar:** “Joana · 0 anos · Recife”, contexto familiar curto, primeiros acontecimentos da vida e poucas ações infantis já disponíveis no jogo. A descrição não autoriza inventar conteúdo novo na tarefa de correção.

## Critérios de aceite

- [ ] Nome e idade são legíveis na primeira tela em celular e desktop.
- [ ] Linha da Vida tem prioridade visual; ações principais são encontradas sem procurar em vários menus.
- [ ] Nenhuma categoria adulta incompatível aparece na infância.
- [ ] Não há barra, custo ou texto de Energia.
- [ ] Textos e decoração redundantes foram reduzidos com uma justificativa de uso.
- [ ] Teclado, toque e estados desabilitados funcionam e têm feedback compreensível.

## Identidade: isto é uma vida, não um painel

Princípios permanentes, estabelecidos no B4.

O produto mostra **uma vida sendo construída** — tempo, memória, pessoas,
escolhas e consequências. Um painel de métricas com os mesmos dados está
errado mesmo quando está bonito.

MUST aplicar contenção antes de adicionar: **menos elementos, com mais
significado**. Para cada container, borda ou fundo, pergunte se ele ajuda
a hierarquia. Se não houver resposta evidente, ele não entra — separe com
espaço e régua.

MUST reservar superfície (card) a **unidades reais**: um evento, um
resultado, uma pessoa, uma transação, um modal, um bloco interativo.
DO NOT transformar seções, agrupamentos de rótulos ou pares
"título + número" em cards. Se a maioria dos elementos da tela tem caixa,
a hierarquia deixou de existir.

MUST manter um acento único e escasso. Cor semântica (perda, atenção) é
exceção justificada. DO NOT usar glow generalizado, glassmorphism pesado,
partículas ou animação contínua.

MUST fazer a interface **amadurecer com a fase da vida**, com pequenas
mudanças no mesmo produto — não versões distintas por faixa etária. As
permissões visuais MUST derivar do sistema de disponibilidade existente.
DO NOT manter uma lista paralela de idades na camada visual.

MUST separar, em qualquer resultado de ação: narrativa (o que aconteceu),
efeito público (dinheiro, atributos visíveis, vínculos, emprego) e efeito
interno. DO NOT exibir estado interno — nem valor, nem nome, nem
indicador. Traço de personalidade é **qualitativo**; enquanto não houver
evidência, a resposta honesta é declarar que ainda está em formação.

MUST descrever vínculos entre pessoas de forma qualitativa. DO NOT usar
percentual ou barra de progresso para afeto.

MUST manter o fluxo de uma decisão em um único contexto:
situação → escolha → resultado → continuar. O resultado não abre um
segundo modal e não repete o histórico. A escolha feita permanece visível
junto ao resultado.

MUST explicar indisponibilidade **em texto**, junto do próprio controle,
funcionando por toque e por leitor de tela.

MUST tratar `prefers-reduced-motion` reduzindo movimento sem remover
informação, e DO NOT bloquear o zoom do navegador.

### Sobre imagens de referência

Uma referência visual fornecida em uma tarefa indica **atmosfera,
densidade e hierarquia**. Ela NOT é pixel-perfect, NOT contém dados reais
e NOT define gameplay.

DO NOT copiar dela: nomes, personagens, cidade, idade, ano, valores,
saldos, percentuais, textos, eventos, opções, quantidade de abas ou de
colunas, nem qualquer regra. Esses elementos são fictícios. A fonte de
verdade do comportamento é sempre o código.

DO NOT assumir recursos que a referência sugere mas o produto não tem —
em particular, imagem dedicada por evento ou retrato fotográfico. Presença
visual de uma pessoa deve ser construída com composição, tipografia,
textura e cor.

### Critérios de aceite (identidade)

- [ ] A tela não poderia ser confundida com a dashboard de um SaaS.
- [ ] O histórico de vida tem prioridade visual sobre indicadores.
- [ ] Não há card sem unidade real por trás.
- [ ] Nenhum estado interno vazou para a interface.
- [ ] Afeto e personalidade são descritos sem número e sem barra.
- [ ] Nenhum dado veio de uma imagem de referência.
