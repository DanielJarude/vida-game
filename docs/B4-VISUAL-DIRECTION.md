# VIDA — Direção Visual (B4)

Documento curto e operacional. Serve para decidir rápido se uma tela nova
"é VIDA" ou virou mais um dashboard.

---

## 1. A ideia central

O jogo não mostra um painel de controle de uma pessoa.
Ele mostra **uma vida sendo construída**.

Isso significa que a tela é sobre **tempo, memória, pessoas, escolhas e
consequências** — nessa ordem de importância. Números existem, mas são
consequência, nunca o assunto.

> Teste de uma linha: se a tela pudesse ser a dashboard de um SaaS trocando
> os rótulos, ela está errada.

---

## 2. O que a referência é e o que ela não é

`docs/references/b4-visual-reference.png` é **direção de atmosfera**:
densidade, calma, hierarquia, sensação de biografia.

Ela **não é**:

- pixel-perfect a ser reproduzido;
- fonte de dados (o personagem, a cidade, os valores e os percentuais
  daquela imagem são fictícios e **não existem** no jogo);
- definição de gameplay, de abas, de colunas ou de regras.

A fonte de verdade do comportamento é sempre o código em `src/systems/`.

---

## 3. Princípio de contenção (§41)

**Menos elementos, com mais significado.**

Antes de adicionar um container, uma borda ou um fundo, a pergunta é:
*isso ajuda a hierarquia?* Se a resposta não for um sim evidente, não entra.

### Quando algo pode virar "card"

Superfície (`.unit-card`, `.modal-surface`) é reservada a **unidades reais**:

| Pode ter superfície | Não pode |
| --- | --- |
| Um evento | Um agrupamento genérico de rótulos |
| Um resultado de escolha | Um par "título + número" |
| Uma pessoa | Uma lista de atributos |
| Uma transação / bem | Uma seção inteira da página |
| Um modal | Uma barra lateral |
| Um bloco interativo (ação clicável) | Um texto corrido |

O padrão para separar conteúdo é **espaço e régua** (`--rule`), não caixa.

---

## 4. Hierarquia

1. **Linha da Vida** — o coração. É a biografia acumulada.
2. **`+1 ANO`** — a única ação sempre disponível e sempre no mesmo lugar.
3. **Identidade** — nome, idade, cidade, fase. A IDADE tem peso tipográfico
   grande: é o eixo do jogo.
4. **Contexto** — atributos, traços, pessoas, dinheiro. Secundários,
   compactos, discretos.

---

## 5. Cor

| Token | Uso |
| --- | --- |
| `--accent` `#3ddc97` | **Escasso.** Só o CTA principal e o "agora" da timeline. |
| `--danger` `#e4675c` | Perda, morte, conflito. Semântico. |
| `--warning` `#d9a441` | Atenção. Semântico. |
| `--text-*` | Toda a hierarquia normal de leitura. |

Regras:

- **Um acento só.** Se tudo brilha, nada tem importância.
- **Cor nunca é o único portador de informação** (§21). Direção, ícone e,
  sobretudo, **texto** acompanham sempre. Um bloqueio diz *por que* está
  bloqueado, em palavras.
- Profundidade vem de **iluminação** (gradientes radiais suaves, vinheta),
  não de empilhar bordas.

### Proibido

Neon cyberpunk · glassmorphism pesado · glow em tudo · partículas ·
animação contínua · barras de progresso decorativas.

---

## 6. Tipografia

Sete papéis, definidos em `src/styles/tokens.css`. Não inventar tamanhos
avulsos: `--type-display`, `--type-heading`, `--type-subheading`,
`--type-body`, `--type-caption`, `--type-meta`, `--type-number`.

- `--font-display` (Outfit) → marca, idade, números grandes.
- `--font-sans` (Plus Jakarta Sans) → tudo o mais.
- A fonte remota é **reforço**: a pilha local mantém o produto bonito se o
  Google Fonts cair. Nada depende do download.

---

## 7. Retrato sem foto (§7)

Sem fotografia, sem rosto, sem geração por IA, sem imagem externa,
**sem imagem por evento**.

A presença da pessoa é construída com: gradiente derivado do próprio
personagem, iniciais em tipografia forte, textura sutil em CSS e a fase da
vida escrita por extenso.

---

## 8. A interface envelhece junto (§13)

Não são seis sites. É **o mesmo site que amadurece**.

| Fase | O que muda |
| --- | --- |
| 0–2 | Só timeline e família. Nada de dinheiro, carreira, personalidade. |
| 3–5 | Aparecem atividades. |
| 6–11 | Escola entra. |
| 12–14 | Traços percebidos começam a aparecer. |
| 15–17 | Dinheiro passa a fazer sentido (bicos). |
| 18+ | Vida adulta completa. |

**A UI nunca decide isso sozinha.** As abas vêm de
`getAbasDisponiveis`, as ações de `getActionAvailability` e os blocos
laterais de `obterPerfilDeFase`. Não existe lista paralela de permissões
na camada visual (§12).

---

## 9. O evento é uma cena, não um formulário

Fluxo único, dentro de **um só modal** (§4):

```
SITUAÇÃO → ESCOLHA → RESULTADO → CONTINUAR
```

- As escolhas são linhas interativas com hover, foco, selecionado e
  indisponível **com motivo em texto**.
- Depois de decidir, as opções não escolhidas somem e **a escolha feita
  permanece visível** ao lado do resultado. A pessoa vê o que decidiu.
- O resultado **não abre um segundo modal** e **não repete a Linha da
  Vida**.

O resultado separa três coisas que não podem se misturar (§5):

1. **Narrativa** — o que aconteceu, em texto.
2. **Efeito público** — dinheiro, felicidade, saúde, relação, emprego.
3. **Efeito oculto** — empatia, disciplina, reputação, scores internos.
   **Nunca aparece.** Nem número, nem nome, nem seta.

---

## 10. Pessoas e personalidade

- Relacionamento é **qualitativo**: "muito próxima", "distante",
  "conflituosa". Nunca `83%`, nunca barra de progresso (§10).
- Traços percebidos seguem a filosofia do B2: enquanto não há evidência,
  a resposta honesta é **"Personalidade ainda em formação"**. Sem números,
  sem medidor, jamais (§9).

---

## 11. Acessibilidade não é etapa final

- Foco sempre visível; navegação completa por teclado.
- Modal: `role="dialog"`, `aria-modal`, rotulado pelo próprio título, foco
  movido para dentro ao abrir e devolvido ao fechar.
- O evento em aberto **não** fecha com `Esc`: a decisão é obrigatória.
  O resumo anual fecha.
- Alvos de toque confortáveis; zoom do navegador **não** é bloqueado.
- `prefers-reduced-motion` desliga transições sem remover informação.

---

## 12. Mobile é o padrão, não a adaptação

Testado em 360 / 390 / 768 / 1366 / 1920.

Nunca usar `transform: scale()` para "caber". Nunca esconder algo
essencial no mobile. O `+1 ANO` fica ancorado
(`.year-advance--docked`) respeitando `env(safe-area-inset-bottom)`.

---

## 13. Camada poética (§18)

Existe, é discreta e é **rara**. Uma frase curta em momentos que merecem —
nascimento, morte, um ano silencioso. Sem clichê de rede social, sem drama
inventado, sem frase motivacional. Quando o ano não teve nada relevante, o
jogo tem coragem de dizer:

> "Um ano sem grandes acontecimentos."

---

## 14. Checklist antes de aprovar uma tela

- [ ] A Linha da Vida continua sendo o centro?
- [ ] Existe algum card que poderia ser só espaço em branco?
- [ ] O acento aparece em mais de um ou dois lugares?
- [ ] Algum número interno vazou para a tela?
- [ ] Há informação transmitida **só** por cor?
- [ ] Um bloqueio explica o motivo em palavras?
- [ ] A permissão veio do `availabilitySystem` ou foi hardcodeada?
- [ ] Funciona em 360px sem esconder nada essencial?
- [ ] Faz sentido para um bebê de 0 ano e para alguém de 65?
