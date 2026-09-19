---
name: vida-playtest-qa
description: Validar regras, experiência e regressões do VIDA antes de liberar novas funcionalidades.
---

# Playtest e QA

Leia o [índice](SKILLS_INDEX.md). Use os critérios das skills alteradas como parte do aceite, sem exigir testes desconectados da mudança.

## Regra de entrega

MUST corrigir bloqueadores conhecidos de idade, Energia, visibilidade das informações básicas e integridade de estado antes de expandir funcionalidades. DO NOT declarar uma entrega pronta apenas porque a aplicação compilou.

MUST reproduzir o problema, verificar a correção e testar os fluxos existentes afetados. Prefira testes de comportamento e invariantes a testes que apenas conferem nomes de funções ou copiam sua lógica.

## Cenários mínimos da fundação

| Cenário | Ação | Resultado esperado |
| --- | --- | --- |
| Nova vida, 0 anos | Abrir primeira tela e navegação | Nome, idade, local e situação claros; Linha da Vida central; nenhuma ação adulta incompatível |
| Bebê e comando direto | Tentar compra de imóvel/carro, emprego, universidade e namoro pelo motor | Recusa; saldo, atributos, vínculos e histórico inalterados |
| Bebê e entrada alternativa | Inspecionar busca, atalhos, sugestões e rotas existentes | Ações incompatíveis não reaparecem por outro caminho |
| Fronteira de idade | Testar idade mínima menos 1, idade mínima e idade mínima mais 1 | Resultado conforme política única; sem antecipação ou atraso acidental |
| Pré-requisitos | Usar adulto sem saldo ou sem escolaridade necessária | Recusa correta e motivo pertinente; ser adulto não basta |
| Avanço de tempo | Atravessar uma transição de fase | Idade atualiza uma vez; menus e eventos acompanham a fase |
| Sem Energia | Usar atividades afetadas e avançar tempo | Nenhum custo, bloqueio ou recarga de Energia; demais efeitos preservados |
| Repetição | Repetir atividades suscetíveis a exploração | Sem prêmios duplicados ou ganhos ilimitados indevidos; sem quota universal substituindo Energia |
| Save legado | Carregar partida antiga que contenha Energia | Campo obsoleto ignorado/migrado; demais dados preservados |
| Persistência | Agir, salvar e recarregar | Mesmo estado relevante; histórico sem duplicação; elegibilidade correta |
| Consequência futura existente | Executar escolha e avançar até a condição prevista | Efeito acontece no contexto correto, sem duplicar ao recarregar |
| Usabilidade | Testar celular, desktop, toque e teclado | Idade legível; controles acessíveis; nenhum corte ou sobreposição |

Adapte cenários a sistemas existentes. Marque “não aplicável” com justificativa quando o recurso não existir; não o implemente só para preencher o teste. A ausência de uma regra obrigatória da fundação é falha, não “não aplicável”.

## Preparação e execução

1. Use partidas de teste ou fixtures isoladas; não sobrescreva a partida real do usuário.
2. Registre idade, estado relevante, ação e resultado esperado. Controle aleatoriedade quando necessário.
3. Automatize regras críticas de elegibilidade, transições e migração quando houver infraestrutura adequada; crie cobertura mínima útil se faltar proteção para essas regras.
4. Verifique visualmente a tela inicial e as fases afetadas. Testes do motor não detectam menus poluídos ou idade ilegível.
5. Rode build e verificações disponíveis após as correções. Reexecute cenários afetados por mudanças posteriores.

DO NOT forjar evidências. Se não puder abrir a interface ou executar um comando, declare exatamente o que ficou sem verificação e por quê.

## Classificação prática de problemas

- **Bloqueador:** perda/corrupção de partida, ação adulta executável por bebê, falha no avanço do tempo ou travamento de fluxo central.
- **Alta prioridade:** ação adulta visível para bebê, Energia ainda limitando atividades, idade difícil de localizar ou estado/histórico divergentes.
- **Ajuste:** texto, espaçamento ou detalhe visual sem impacto equivalente, tratado conforme o escopo.

A fundação só está pronta para expansão quando os dois primeiros grupos estão resolvidos nos fluxos afetados. Não adiar um erro obrigatório para incluir uma funcionalidade mais atraente.

## Roteiro curto de playtest humano

Sem explicar previamente onde ficam os controles, verifique se a pessoa consegue identificar sua idade e situação, localizar o último acontecimento, escolher uma ação apropriada e avançar no tempo. Observe hesitação e interpretações erradas; não deduza boa UX apenas da ausência de erros técnicos.

## Formato de evidência na entrega

Informe de forma breve:

- **Mudança:** problema corrigido e comportamento resultante.
- **Verificado:** cenários e comandos realmente executados, com resultado.
- **Regressões:** fluxos anteriores conferidos e eventuais falhas preexistentes.
- **Pendente:** verificações não realizadas e problemas restantes, sem chamar de concluído o que não foi validado.

## Critérios de aceite

- [ ] Cenários aplicáveis da fundação passaram e possuem evidência suficiente para reprodução.
- [ ] Regras críticas foram verificadas no motor e na interface.
- [ ] Save legado e recarregamento preservam a partida.
- [ ] Não há bloqueadores ou problemas de alta prioridade conhecidos no escopo entregue.
- [ ] Limitações estão explícitas; novas funcionalidades não foram usadas para adiar correções.
