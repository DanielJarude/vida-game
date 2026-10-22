# Notas de atualização ("VIDA — Novidades da atualização")

Desde o REWORK 10.6 (UX-24), o jogo mostra as novidades de cada versão **uma vez**, na primeira abertura depois de o
navegador carregar a versão nova, e guarda o histórico no Menu ("Novidades da atualização").

## Onde mora

- `src/ui/novidades.ts` — os dados (`NOTAS`, a mais nova primeiro) e a regra de "já vi" (`deveMostrarNovidades`,
  `marcarNovidadesVistas`; chave `VIDA_NOVIDADES_VISTAS` no `localStorage`, separada do save).
- `src/ui/Novidades.tsx` — a janela (a folha comum: foco preso, Esc fecha, foco devolvido; sem animação própria).
- `src/ui/janelaDeNovidades.ts` — a janela sob demanda (a primeira tela não carrega o motor por causa dela).
- `src/ui/App.tsx` — abre sozinha só quando a vida está livre (nunca por cima de decisão, resultado ou criação).

## Por que a versão é a do pacote carregado

As notas estão **dentro** do código que o navegador roda. Quando o service worker baixa uma versão nova, ela espera o
jogador aceitar ("Há uma versão nova do VIDA"); até lá roda a antiga, com as notas antigas (já vistas). Depois do
recarregamento, o código novo (e as notas novas) passa a existir — só então a janela aparece. Offline, as notas estão no
precache como todo o resto. Quem chega pela primeira vez não recebe notas de uma versão que nunca conheceu.

## Como cadastrar uma versão nova (parte da entrega de cada pacote)

1. Acrescente um item **no alto** de `NOTAS` com `versao` nova (a mesma do relatório da entrega), `data` e `titulo`.
2. Escreva em `novidades`, `melhorias` e `correcoes` só o que foi **implementado e testado**, em frases curtas, para
   quem joga — sem spoilers (nada de prometer conquistas ou finais).
3. Rode `npx vitest run src/ui/__tests__/rework106.test.tsx` (as versões não se repetem; nenhuma nota fica vazia).
4. No relatório do pacote, cite a versão cadastrada.
