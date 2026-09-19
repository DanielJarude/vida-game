# VIDA — instruções persistentes de desenvolvimento

Este conjunto orienta o Arena no projeto `vida-game`: simulador de vida brasileiro, inteiramente em português, inspirado no gênero de BitLife e com identidade própria. São arquivos de instruções portáveis; sua simples presença não garante leitura automática pela ferramenta.

## Como aplicar no Arena

1. Adicione os sete arquivos ao contexto persistente do projeto, se esse recurso estiver disponível, ou mantenha-os no repositório em `docs/skills/` e anexe-os às tarefas relevantes.
2. Nas instruções principais do projeto, inclua o texto abaixo, ajustando o caminho se necessário.
3. Ao iniciar uma tarefa, leia este índice e as skills aplicáveis. Em uma tarefa de fundação, leia todas.
4. Ao concluir, informe quais regras foram aplicadas, o que foi verificado e qualquer limitação real. Não declare testes executados sem execução.

### Texto para as instruções principais

> Antes de desenvolver o VIDA, leia `docs/skills/SKILLS_INDEX.md` e os arquivos indicados para a tarefa. Preserve a identidade brasileira, a interface pt-BR, a progressão contextual por idade e a Linha da Vida como centro da experiência. Não use Energia como recurso consumível. Valide as regras tanto na interface quanto no motor do jogo. Corrija e teste a fundação antes de expandir. Não interprete exemplos ou sistemas mencionados nas skills como autorização para implementar novas funcionalidades.

## Convenções e prioridades

- **MUST**: requisito obrigatório do projeto.
- **SHOULD**: padrão recomendado; uma alternativa precisa de justificativa ligada ao jogo.
- **DO NOT**: comportamento proibido dentro do escopo destas instruções.
- Exemplos narrativos são ilustrativos; limiares de idade marcados como padrão são decisões de design iniciais, não afirmações sobre legislação brasileira.

Uma instrução explícita mais recente do responsável pelo projeto prevalece sobre estes documentos. Registre mudanças de direção para não perpetuar regras antigas. Sem nova orientação, resolva conflitos nesta ordem:

1. Integridade do estado, compatibilidade com partidas existentes e coerência por idade.
2. Remoção de Energia consumível e clareza das informações básicas.
3. Linha da Vida, usabilidade e identidade visual/narrativa.
4. Conteúdo e novas funcionalidades.

DO NOT sacrificar regras do motor para atender a uma solução visual. DO NOT introduzir novos sistemas para resolver problemas de apresentação.

## Mapa das skills

| Arquivo | Quando aplicar | Responsabilidade |
| --- | --- | --- |
| [SKILL_GAME_DESIGN.md](SKILL_GAME_DESIGN.md) | Regras, escolhas, consequências e escopo | Identidade, ciclo de jogo e conexões entre sistemas |
| [SKILL_AGE_PROGRESSION.md](SKILL_AGE_PROGRESSION.md) | Ações, eventos, menus e avanço de idade | Fonte de verdade para elegibilidade e fases da vida |
| [SKILL_UX_UI.md](SKILL_UX_UI.md) | Layout, navegação e componentes | Hierarquia visual e interface contextual |
| [SKILL_NARRATIVE_PTBR.md](SKILL_NARRATIVE_PTBR.md) | Textos, eventos e localização | Voz, contexto brasileiro e consistência narrativa |
| [SKILL_ENGINEERING.md](SKILL_ENGINEERING.md) | Qualquer alteração de código ou dados | Modularidade, persistência e implementação das regras |
| [SKILL_PLAYTEST_QA.md](SKILL_PLAYTEST_QA.md) | Correções, entregas e expansão | Evidências e critérios para liberar a próxima etapa |

## Primeira tarefa: corrigir a fundação

MUST tratar o primeiro ciclo como correção do existente, sem adicionar sistemas ou conteúdo:

1. Inspecionar o projeto e reproduzir os problemas: personagem com 0 anos, ações adultas disponíveis, informações básicas difíceis de encontrar e Energia consumível.
2. Identificar a política de ações atual, a persistência e os componentes afetados.
3. Remover Energia de custos, bloqueios, recompensas, regeneração, interface e decisões do motor; compatibilizar saves antigos.
4. Aplicar elegibilidade por idade e contexto no motor e na interface.
5. Tornar nome, idade, local e situação atual legíveis; reorganizar a experiência ao redor da Linha da Vida.
6. Executar os cenários de QA e corrigir regressões antes de propor expansão.

Não fazer uma reescrita geral como atalho. Preservar sistemas existentes que funcionam; corrigir suas integrações quando violarem as regras.

## Critérios de aceite do conjunto aplicado

- Um bebê não vê nem executa compras de imóveis/carros, emprego, universidade ou namoro.
- Idade e identidade são reconhecíveis na primeira tela, inclusive no celular.
- Não há Energia consumível ou substituto com a mesma função.
- A interface muda conforme a fase da vida, sem exibir antecipadamente um painel adulto completo.
- A Linha da Vida registra acontecimentos e resultados relevantes sem repetir cliques sem significado.
- Mudanças de estado, carregamento de partidas e fluxos existentes têm validação proporcional ao risco.
- Novos sistemas só começam depois de corrigidos os bloqueadores conhecidos da fundação.
