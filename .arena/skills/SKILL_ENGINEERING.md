---
name: vida-engineering
description: Implementar e manter o VIDA em React, TypeScript e Vite com regras consistentes e saves compatíveis.
---

# Engenharia

Leia o [índice](SKILLS_INDEX.md), a skill da área alterada e a de [QA](SKILL_PLAYTEST_QA.md).

## Inspeção antes da mudança

MUST inspecionar scripts disponíveis, modelo de estado, fluxo de avanço do tempo, catálogo de ações e persistência. Identifique onde estão as regras atuais antes de criar uma segunda implementação.

MUST preservar React, TypeScript e Vite e as convenções úteis existentes. DO NOT trocar stack, gerenciador de estado ou estrutura inteira para uma correção localizada. Novas dependências precisam resolver uma necessidade concreta que o projeto não atende.

## Separação de responsabilidades

SHOULD separar conceitos, adaptando caminhos ao repositório:

- **Domínio:** tipos, elegibilidade, transições e efeitos; sem dependência de React.
- **Conteúdo:** eventos e textos com identificadores estáveis e condições estruturadas.
- **Estado e persistência:** execução de comandos, carregamento, migrações e gravação.
- **Interface:** apresentação do estado e despacho de intenções do jogador.

DO NOT colocar simulação, persistência e renderização em um único componente crescente. Não criar abstrações para sistemas hipotéticos.

## Política única de ações

MUST usar uma mesma política de elegibilidade na UI e na execução. Um contrato ilustrativo, ajustável aos tipos existentes:

```ts
type Availability =
  | { kind: 'hidden'; reasonCode: string }
  | { kind: 'locked'; reasonCode: string; message: string }
  | { kind: 'available' };

// Consulta pura; não altera estado nem sorteia resultados.
getActionAvailability(state, actionId): Availability;
// Revalida e devolve sucesso ou recusa sem efeitos parciais.
executeAction(state, command): ActionResult;
```

MUST validar antes de debitar dinheiro, alterar atributos ou registrar acontecimentos. Uma ação recusada conserva o estado. Proteja contra clique duplo e tela desatualizada quando puderem duplicar efeitos.

MUST derivar disponibilidade do estado atual. DO NOT manter cópias divergentes da idade ou de permissões em vários componentes.

## Estado, tempo e consequências

MUST manter transições coerentes: custos, efeitos e registro correspondente são aplicados juntos. Use identificadores estáveis para relacionar eventos, vínculos e consequências futuras.

MUST tornar explícita a ordem do avanço anual, incluindo atualização da idade, avaliação de eventos e efeitos pendentes, sem alterar silenciosamente uma convenção existente que funciona.

SHOULD permitir aleatoriedade controlada nos testes para reproduzir falhas. DO NOT sortear resultados de jogo durante renderização ou recalcular uma escolha já resolvida ao abrir a tela.

## Remoção de Energia e saves

MUST localizar Energia no modelo, seletores, comandos, eventos, componentes, persistência e testes. Remover custos, recompensas e bloqueios associados sem apagar os demais efeitos de uma atividade.

MUST garantir que saves antigos com esse campo sejam carregados: descartar o campo obsoleto em uma migração ou normalização compatível. Uma referência legada pode permanecer exclusivamente para leitura/migração, nunca como regra ativa.

MUST preservar idade, histórico, patrimônio, vínculos e outros dados válidos. DO NOT limpar armazenamento, reiniciar partidas ou mudar chaves silenciosamente como forma de “corrigir” compatibilidade.

Se o schema mudar, use a estratégia de versionamento existente ou introduza uma migração mínima. Se não for possível ler uma partida, ofereça erro recuperável e preserve o dado original; não sobrescreva com estado vazio automaticamente.

## Expansão sem regressão

MUST integrar recursos novos aos contratos existentes de ações, estado e histórico. Não duplicar regras em páginas separadas. Mantenha mudanças focadas e diferencie refatoração necessária de limpeza opcional.

MUST executar os comandos de verificação disponíveis e relevantes: tipos, build, lint e testes conforme o projeto. Não presumir que todos os scripts existem. Compilação bem-sucedida não comprova comportamento correto.

## Critérios de aceite

- [ ] Motor e UI compartilham elegibilidade; ação inválida não produz efeitos parciais.
- [ ] Não há Energia ativa; saves antigos continuam legíveis e preservam dados.
- [ ] Avançar tempo e executar ação não duplicam resultados ou registros.
- [ ] Recarregar a aplicação restaura estado coerente e menus corretos.
- [ ] Verificações relevantes passam; falhas preexistentes são separadas das introduzidas.
- [ ] Entrega informa arquivos/áreas alterados, comportamento, validação real e limitações.

## Modularidade: o arquivo que vira depósito

Regra permanente, válida para qualquer tarefa neste repositório.

O modo de falha mais comum em código gerado por IA não é o bug: é a
**concentração**. Um arquivo que já existe e já funciona é o destino de
menor atrito para qualquer adição, e em poucas iterações ele acumula
responsabilidades que não são dele. O resultado é um arquivo que ninguém
consegue ler inteiro, testar em partes ou alterar com segurança.

MUST respeitar o papel declarado de cada camada. Antes de escrever, decida
a que camada o código pertence e escreva **lá**, mesmo que dê mais
trabalho:

| Camada | Responsabilidade | Não pertence aqui |
| --- | --- | --- |
| Entrypoint / `index.*` | Inicialização e reexportação | Regra, estado, layout |
| Componente raiz (`App`) | Composição e roteamento de telas | Regra de negócio, cálculo, estado de domínio |
| Hook de orquestração | Ligar estado a chamadas de sistema | Tabela de balanceamento, fórmula, narrativa |
| `systems/` | Regras, cálculo, validação, balanceamento | JSX, acesso ao DOM, `localStorage` direto |
| `presentation/` | Traduzir estado do motor em algo exibível | Decidir o que é permitido; alterar estado |
| Componentes | Renderizar e capturar intenção | Recalcular regra já existente |
| Estilos | Aparência | Valores mágicos duplicados fora dos tokens |

MUST tratar estes sinais como gatilho de extração imediata, não como
dívida a revisitar:

- um `switch` ou cadeia de `if` de balanceamento dentro de um componente
  ou hook;
- uma tabela de textos, preços, pesos ou efeitos declarada no meio de
  lógica de estado;
- um arquivo que precisa ser lido por inteiro para entender uma alteração
  de uma linha;
- o mesmo cálculo repetido em dois lugares "porque era mais rápido".

Prefira **dados a ramificação**: uma tabela declarativa (`Record<id,
receita>`) aceita um item novo em uma linha; um `switch` exige um ramo
novo e tende a divergir da validação correspondente.

MUST evitar o extremo oposto. Fragmentar em arquivos de poucas linhas que
só repassam props, ou criar uma pasta por componente trivial, troca um
problema de leitura por outro. O critério não é tamanho: é **coesão**.
Um arquivo longo e coeso é aceitável; um arquivo médio que mistura três
assuntos não é.

DO NOT refatorar arquivos fora do escopo da tarefa apenas para melhorar
uma métrica ou uma tabela de relatório. Extração se justifica quando a
tarefa atual toca aquele código ou quando a concentração impede a
mudança pedida.

MUST, ao concluir, medir o que foi entregue: liste os arquivos maiores
tocados, o que cada um faz e se a responsabilidade é única. Se um arquivo
cresceu sem que sua responsabilidade tenha crescido junto, ele regrediu.

### Critérios de aceite (modularidade)

- [ ] Nenhuma regra nova foi adicionada ao componente raiz ou a um hook.
- [ ] Balanceamento e texto narrativo vivem em módulo próprio e testável.
- [ ] A camada de apresentação não decide permissão nem altera estado.
- [ ] Não há lista paralela de permissões fora do sistema responsável.
- [ ] Não foram criados arquivos que apenas repassam props.
- [ ] Arquivos órfãos após a mudança foram removidos, não deixados para trás.
