# VIDA 38 · relatório do lote (versão 38)

Entregue em `main` e no branch de produção. Notas: `src/ui/novidades.ts` (versão 38).

## O que entrou
- **Jardim que se vê** (bloco 2): estado do jardim pelo cuidado (florido, cuidado, comum, descuidado); mudas de flores na loja; desenho por estado.
- **Tutorial de primeira entrada** com pular (só nos dois primeiros anos; uma vez por navegador).
- **Glossário** no menu; **acessibilidade** (texto maior, alto contraste, sem animações), por navegador.
- **Cozinhar e comer fora** (cômodo cozinha; cozinhar dá saúde).
- **Ajudar a cidade**: doação (custa, alivia, uma vez por ano) e voluntariado (não custa, cansa); total na vida e no legado.
- **Dia a dia**: passeios (praia, parque, pesca, caminhada), cartas e presentes, torcida organizada, bico para vizinhos.
- **Memória de escolhas** na biografia; **legado da ajuda** na tela de fim.
- **Terapia com progressão** (marcos em 12, 26 e 52 sessões).
- **Dependências** (álcool e cigarro): uso sobe o nível; nível alto pesa na saúde; parar diminui.
- **Fé e valores com peso**: deixar a fé da família afasta pais, mães e avós (mais forte para quem tinha fé forte); a prática regular segura parte do estresse e aproxima quem tem a mesma fé; valores derivados (fé, família, solidariedade).
- **Motor de temporadas por rodada** para vôlei, basquete e e-sports (`sistemas/temporadas38.ts`): turno e returno, tabela, séries melhor de três. **Ainda sem tela** — não aparece nas notas.

## Engenharia
- Sistemas do dia a dia em pacote próprio (`motor-extras`), por ponto de extensão (`sistemas/extras38.ts`), carregado com o motor.
- Textos fixos em `dados/textos38.ts` (leaf de dados).
- Chunk do motor: 797.835 bytes (limite 800 kB).

## Testes
- Suíte completa em 13 lotes. Falhas: apenas timeouts de 60 s sob carga (agência, fechamento #4); ambos passam com limite maior.
- Typecheck limpo. Os nove avisos de chunk circular já existiam antes desta versão.

## Pendências
- Tela das temporadas de vôlei, basquete e e-sports.
- Deficiência e acessibilidade de conteúdo (precisa de desenho próprio).
- Variedade narrativa por era e país; auditoria de redundância de textos.
- Consequências antes de decidir (além dos botões novos).
