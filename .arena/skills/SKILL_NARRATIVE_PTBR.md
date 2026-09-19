---
name: vida-narrative-ptbr
description: Escrever e revisar textos e eventos do VIDA em português brasileiro natural e contextual.
---

# Narrativa e português brasileiro

Leia o [índice](SKILLS_INDEX.md). Use em interface, eventos, resultados, mensagens de erro e localização.

## Língua e voz

MUST escrever todo texto visível ao jogador em pt-BR, inclusive validações, estados vazios, descrições de acessibilidade e mensagens de falha. Identificadores internos podem seguir as convenções técnicas do repositório.

SHOULD usar frases curtas, verbos concretos e a segunda pessoa (“você”), preservando uma voz consistente. Humor pode surgir das situações; não precisa aparecer em toda linha.

DO NOT usar português de Portugal por acidente, traduções literais, tom publicitário, excesso de exclamações ou bordões repetidos. Evite “uma jornada incrível”, “desbloqueie seu potencial” e outras frases que não descrevem o acontecimento.

MUST formatar valores segundo pt-BR: “R$ 1.250,00”, “1 ano”, “2 anos”. Use formatação centralizada para números, dinheiro e datas exibidas. Trate concordância, nomes e pronomes sem presumir gênero ou configuração familiar não registrada.

## Brasil com variedade

SHOULD usar contextos brasileiros concretos quando pertinentes: escola, bairro, transporte, relações familiares, formação e trabalho. DO NOT reduzir identidade brasileira a carnaval, futebol, violência ou gírias.

MUST respeitar diversidade regional, racial, familiar e econômica sem transformar grupos em caricaturas. Gíria deve ser contextual e legível; não forçar sotaques pela grafia.

Não apresentar uma regra de jogo como lei brasileira. Quando uma tarefa realmente exigir fidelidade legal ou factual, verificar fonte atual e separar simplificação de simulação de afirmação factual.

## Coerência de eventos

Cada evento alterado MUST ter condições compatíveis com idade e estado, personagens existentes ou criados por uma regra explícita, escolhas realizáveis e resultados correspondentes ao que aconteceu.

DO NOT atribuir decisões financeiras ou profissionais adultas ao bebê. A narrativa infantil pode descrever o ambiente e ações de cuidadores sem fingir autonomia que o personagem não tem.

SHOULD escrever consequências específicas que dialoguem com o histórico. DO NOT afirmar que alguém morreu, perdeu emprego ou se mudou se o estado não sofreu essa alteração.

MUST separar texto de regras: uma condição não pode depender de procurar palavras na descrição. Textos variáveis devem tolerar campos opcionais sem exibir `undefined`, `null` ou fragmentos incompletos.

## Exemplos

| Evitar | Preferir |
| --- | --- |
| “Você embarcou em uma incrível jornada educacional!” | “Hoje foi seu primeiro dia de aula.” |
| “Ação indisponível.” | “Você precisa concluir o ensino médio.”, quando essa for a condição real |
| “Parabéns!!! Você evoluiu sua relação familiar!” | “Vocês passaram a tarde juntos e ficaram mais próximos.”, se o vínculo realmente mudou |
| “Aos 0 anos, você decidiu investir em imóveis.” | Um acontecimento familiar compatível com a infância; ocultar a ação de compra |

Não copiar estes exemplos repetidamente. Use-os como referência de precisão e tom.

## Critérios de aceite

- [ ] Todo texto visível está em pt-BR natural, sem resíduos em inglês.
- [ ] Eventos e resultados correspondem à idade, aos vínculos e ao estado real.
- [ ] Números, valores e plurais são consistentes, incluindo 0, 1 e múltiplos.
- [ ] Texto dinâmico funciona com nomes longos e dados opcionais ausentes.
- [ ] Humor e contexto brasileiro não dependem de estereótipos.
- [ ] Textos foram lidos dentro da interface, não apenas no arquivo de conteúdo.
