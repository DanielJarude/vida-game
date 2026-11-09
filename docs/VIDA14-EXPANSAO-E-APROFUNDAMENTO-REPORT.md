# VIDA 14 — Expansão e aprofundamento (relatório)

Código: `02be0d7` (branch `claude/vida14-expansao`, integrado à `main` e à branch de produção). Save continua v20 (campos opcionais).

## Frentes concluídas
1. Política — medidas (lei, reforma, investimento, imposto, programa, ato) com custo, carência e efeito por anos; contas públicas, dívida, contas rejeitadas; legado; permanência mínima de 2 anos e justa causa na troca de partido; Presidência de Portugal (eleição em janeiro, candidatura de cidadãos, Belém: promulgar, vetar, TC, Conselho de Estado, nomear PM, dissolver a AR).
2. Empresas — valor justo único (lucro normal × múltiplo, descontos por histórico, risco e minoritária; piso pelo lucro líquido); painel de indicadores agrupados.
3. Cidades — 67 municípios (Igarassu-PE), custo/salário, vocações que facilitam a vaga (nunca barreira).
4. Objetivos pessoais em Você → Objetivos.
5. Viagens — negócios, culturais, eventos (Copa no ano dela), lugares conhecidos, luxo; países conhecidos.
6. Reconhecimento profissional — convites do meio; prestígio soma ao profissional.
7. Eventos mundiais — efeitos em trabalho, empresas (por ramo) e fronteiras; painel em Você → No mundo.
8. Justiça cível — trabalhista, contrato, consumidor, indenização, danos morais, improbidade, multa; advogado, acordo, sentença, recurso.
9. Gastronomia e eventos — três níveis, do simples ao exclusivo.
10. Crenças — ter ou não, mudar, praticar, datas.
11. Dependências — a partir dos hábitos existentes; limites, ajuda, tratamento, recuperação, recaída.
12. Futsal — modalidade com posições e goleiro-linha; handebol, pedal, skate, surfe, tênis de mesa como prática.
13. Aparência — riscos na sobrancelha, desenhos, pintas, cílios.
14. Piercings no painel de Aparência.
15. Fachadas em 2.5D (lote, volumes, sombra, garagem integrada, estilos distintos).
16. Loja de móveis por tipo, área ocupada, encaixe com prévia, depósito, conjuntos.
17. Imóveis vazios/semi/mobiliados/luxo (aluguel: do proprietário; compra: opcional, sua).

## Testes
- Testes novos `vida14*` (13 arquivos) verdes.
- Suíte completa (2ª rodada): 2627 passaram, 6 falharam. 1 já falhava na VIDA 13 (`motor.test` regra de agência). As outras 5 (fechamentoMundo #4 por tempo, rework10 ECO-03, rework115Esportes copas de quadra, rework122 negócio por fora, rework6 UI rolagem) não foram investigadas: a publicação foi pedida sem mais testes.
- Build: todos os pacotes < 800 kB (maior: motor-dados 799,6 kB).

## Publicação
Push de `main` e da branch de produção; deploy pelo Cloudflare Pages.
