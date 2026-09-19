---
name: vida-age-progression
description: Definir elegibilidade contextual de ações, eventos e menus por idade no VIDA.
---

# Progressão por idade

Leia o [índice](SKILLS_INDEX.md). Esta é a fonte de verdade de design para elegibilidade; a skill de engenharia orienta sua implementação.

## Invariantes

MUST usar idade e contexto para controlar tanto a apresentação quanto a execução. Ocultar um botão não protege a regra: chamadas diretas, telas já abertas e dados carregados também precisam de validação.

MUST centralizar a política. DO NOT espalhar comparações de idade independentes pelos componentes. A elegibilidade depende da ação específica e pode considerar escolaridade, vínculo, saldo, posse, estado vital e pré-requisitos já implementados.

MUST distinguir **possuir** de **poder agir**. Um menor pode ter um bem recebido por evento previsto pelo jogo sem poder comprar, dirigir ou negociar esse bem. Não apagar patrimônio legítimo apenas por idade.

## Estados de disponibilidade

| Estado | Quando usar | Apresentação e execução |
| --- | --- | --- |
| Oculto | A ação não faz sentido nesta fase | Não aparece em menus, busca, atalhos ou sugestões; motor recusa |
| Bloqueado | Faz sentido conhecer a ação, mas falta um requisito | Aparece desabilitada com motivo específico; motor recusa |
| Disponível | Idade e todos os requisitos são atendidos | Pode ser executada; motor revalida antes de aplicar efeitos |

DO NOT usar “bloqueado” como desculpa para mostrar todos os sistemas adultos na infância. Proximidade de desbloqueio pode justificar uma prévia, não exige mostrá-la.

## Matriz inicial de design

Estes intervalos organizam a experiência e são padrões ajustáveis de design, não reprodução da legislação. Se o projeto já tem regras mais específicas aprovadas, preserve-as quando compatíveis com os invariantes. Não crie sistemas ausentes para preencher a tabela.

| Fase | Foco da experiência | Exposição de ações |
| --- | --- | --- |
| 0–2: bebê | Cuidados, família e acontecimentos do ambiente | Ações adequadas ao bebê; ocultar imóveis, carros, emprego, universidade, namoro e investimentos |
| 3–5: primeira infância | Brincadeiras, convivência e descobertas | Atividades infantis existentes; manter ações adultas ocultas |
| 6–11: infância | Escola, amizades, interesses e família | Mostrar escola conforme matrícula/contexto; manter ações adultas e namoro ocultos |
| 12–15: adolescência inicial | Escola, autonomia gradual e relações entre pares | Relações afetivas leves e adequadas à idade, somente se já implementadas; universidade e compras adultas continuam ocultas |
| 16–17: adolescência final | Formação e transição para a vida adulta | Permitir prévias úteis com motivo; trabalho apenas por modalidades juvenis explicitamente modeladas, nunca liberar emprego adulto por padrão |
| 18+: vida adulta | Possibilidades abertas pela trajetória | Idade permite avaliar ações adultas; saldo, formação, vínculos e outros requisitos continuam obrigatórios |
| Envelhecimento | Continuidade da trajetória e novas circunstâncias | Adaptar eventos ao contexto; não proibir atividades nem impor incapacidade só por um corte etário genérico |

Padrão inicial: comprar imóvel/carro e acessar emprego adulto exigem 18 anos; universidade exige 18 anos e conclusão escolar necessária. Ajustes posteriores devem ser explícitos e testados. Namoro, se existente, começa no mínimo aos 12 neste modelo, limitado a personagens de faixa etária compatível e conteúdo não sexual; nunca permitir relações entre adulto e criança/adolescente.

## Transições e temporalidade

MUST recalcular elegibilidade após avanço de idade, carregamento de save ou alteração de pré-requisito. Se uma tela aberta deixar de ser válida, remova a ação ou feche o contexto com explicação curta, sem executá-la.

MUST definir em que momento do avanço anual a idade muda e os eventos são avaliados, preservando a convenção coerente já existente. Registros e condições devem usar a mesma idade de referência. DO NOT aplicar a transição duas vezes.

SHOULD introduzir novos recursos gradualmente, quando relevantes. Um aniversário não precisa abrir vários tutoriais ou menus simultaneamente.

## Exemplos e critérios de aceite

- [ ] Aos 0 anos, nenhuma entrada de imóveis, carros, emprego, universidade ou namoro aparece; execução direta é recusada sem mudar estado.
- [ ] Aos 17, uma prévia de veículos pode dizer “Disponível aos 18 anos”, se houver motivo para mostrá-la.
- [ ] Aos 18 sem saldo suficiente, a compra não é permitida; idade sozinha não basta.
- [ ] Universidade continua indisponível sem a escolaridade exigida.
- [ ] Uma ação liberada em uma idade é testada imediatamente antes, no limite e depois dele.
- [ ] Alterar idade ou carregar uma partida atualiza menus e ações sem exigir reiniciar o aplicativo.
- [ ] Eventos infantis não pressupõem carreira, cônjuge ou autonomia financeira do bebê.
