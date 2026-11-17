# VIDA 25 — Esportes, e-sports, formação de atletas e correções

Data: 2026-11-17 · branch `claude/vida25-esportes-esports` (base `e4a7fb1`, main) · um único agente, sem subagentes.

## 1. Escopo e interpretação

Pedido: carreira de e-sports (≤ 7 jogos, com CS, R6 e Fortnite), aprofundar as outras modalidades, reformular a
apresentação dos atributos, reequilibrar o futebol, apresentar a formação (base), dar visibilidade à CNH, reorganizar o
corpo e corrigir quatro bugs obrigatórios; publicar em produção. Fora do escopo (respeitado): agentes, empresários,
patrocinadores.

Interpretação adotada: completar sistemas existentes (perfil de atributos, base, mercado, prêmios, CNH, painel do corpo)
em vez de criar paralelos; e-sports como módulo próprio (`motor/v25/esports`) no mesmo padrão do automobilismo (VIDA 20).

## 2. Auditoria inicial (o que foi inspecionado)

- Esportes: `sistemas/esporte.ts` (base, profissional, temporada, mercado, propostas), `modalidades`, `provas`,
  `perfisEsportivos`, `atributosEsportivos`, `premiosDoFutebol`, `competicoes`, `ligas`, `situacoes(+Memoria)`,
  `conteudo/profissao.ts`; telas `Trabalho.tsx` (PainelAtleta, PainelBase, CarreiraNoEsporte), `DivisoesCaminhos.tsx`.
- Automobilismo (modelo de arquitetura), `v20/automobilismo`.
- Militar (`conteudo/caminhos.ts` mil_alistamento, `mundo/paises/*`), veículos (`sistemas/veiculos.ts`, `estado.ts`,
  `cuidados.ts`, `conteudo/material.ts`, `transporte.ts`), política (`sistemas/politica.ts`, `eras/base/leis.ts`),
  autoescola (`sistemas/autoescola.ts`, telas de Compras), corpo (`ui/v24/Corpo24.tsx`, `FichaDeAtributos`).
- Manual Mestre de Diretrizes (lido integralmente antes de começar).

## 3. Estado anterior (classificação)

| Item | Estado |
|---|---|
| Carreira de futebol (base → profissional, mercado, copas, seleção, prêmios) | implementada e validada; **com defeito de balanceamento** (elite e prêmios fáceis demais) |
| Basquete, vôlei, tênis, natação, atletismo, luta, futsal | implementadas (estrutura própria: circuito, provas, funções, copas de quadra); **atributos só no futebol e basquete** |
| Apresentação de atributos esportivos | parcial: uma linha de texto ("passe 78 · visão 80"), sem grupos, sem histórico, sem explicação |
| Base / formação | parcial: só a categoria e "há quanto tempo"; **nenhum ano registrado** (jogos, títulos, avaliações) |
| E-sports | ausente |
| CNH | implementada e validada; **pouco visível** (só em Compras · Veículos) |
| Painel do corpo (VIDA 24) | implementado; misturava condição, causas, evolução e altura |
| Bug alistamento feminino | **com defeito** |
| Bug clube anterior após transferência | **com defeito** |
| Bug carro quebrado sem carro | **com defeito** |
| Bug candidatura histórica | **com defeito (bloqueante)** |

## 4. Problemas encontrados (gravidade)

1. **Alta — candidatura impossível nas Eras**: `tiposDeEleicao` contava o ciclo só do ano de referência para frente
   (BR: municipais 2028, gerais 2030). Antes de 2028 não existia eleição alguma, em nenhum país.
2. **Alta — prêmios mundiais**: a nota da vida (medida contra a própria divisão) disputava com a das estrelas (medida
   contra o mundo): 10 Bolas de Ouro em 24 carreiras simuladas.
3. **Média — elite fácil**: 96% dos profissionais simulados chegavam à elite; o "testar o mercado" podia saltar da
   divisão de acesso direto para a elite; 38% chegavam a um grande clube europeu.
4. **Média — alistamento**: `mil_alistamento` não olhava gênero nem ano; toda mulher de 18 recebia a decisão, inclusive
   em 1988, com o texto "Desde 2025…".
5. **Média — clube anterior**: a cena de carreira guarda o clube no contexto; adiada por uma decisão de peso (a proposta
   aceita), voltava no ano seguinte no clube novo ("O Náutico perde por 1 a 0" jogando no Hellas Verona). Na sim: 3 casos
   em 24 carreiras.
6. **Baixa — veículo**: o fator de estresse dizia sempre "o carro parado na oficina" (também para quem só tinha moto) e
   o veículo guardado em outra cidade continuava quebrando.

## 5. Implementações

- **E-sports** (`motor/v25/esports/{jogos25,tipos25,esports25}.ts`, `ui/v25/esports`): 6 jogos — Counter-Strike
  (1.6/CS:GO/CS2 por ano), VALORANT, League of Legends, Rainbow Six Siege, Fortnite, Rocket League. Cinco degraus por jogo
  com nomes reais da época (ex.: LoL: Circuito Desafiante 2017–2024, LTA Sul 2025, CBLOL 2026; VALORANT: Challengers
  Brazil, VCT Americas, Masters/Champions; Fortnite: divisões do FNCS e formato duplas/trios por ano). Atributos por jogo
  (6–7 de 11 possíveis) com pesos por função (AWPer, IGL, caçador, sentinela...). Treino como atividade real da semana
  (rotina `esports`, horas e custo); evolução por treino, foco do ano, experiência, idade (mão com auge e declínio;
  leitura que cresce). Peneiras (1/ano, com vaga por função), propostas (subida, mercado, descida, organização),
  contratos com salário a partir do degrau 3 (ocupação `jogador_esports`, fora do mercado de vagas), gaming house em
  outra cidade (mudança real), banco/titularidade, acesso e queda da equipe, mundial por classificação, prêmios (a parte
  do jogador), reputação, fama (`registrarMotivoDoNome`), estresse, condicionamento, escola, aposentadoria. Equipes 100%
  fictícias. Idade mínima por liga (LoL 17, VALORANT 16 confirmados; os outros, aproximação documentada).
  Free Fire e Apex ficaram fora (justificativa no catálogo).
- **Atributos de todas as modalidades** (`atributosEsportivos.ts`): vôlei, futsal, tênis, natação, atletismo e luta
  ganharam atributos com peso na nota da temporada, treino extra, envelhecimento; fotografia anual (`serieAtributos`).
- **Ficha do atleta** (`ui/v25/ficha`): grupos (técnicos/físicos/táticos; nos e-sports mecânicos/táticos/equipe/mentais),
  régua com a marca do ano anterior, variação, explicação, evolução, pontos fortes/limitações; só compara quando há
  fotografia (saves antigos: diz isso).
- **Formação** (`esporte.registrarAnoDeFormacao`, `ui/v25/formacao`): cada ano de base registra categoria, competição,
  jogos/titular, gols/assistências/pontos/pódios, nota, técnica, colocação, título (vai ao palmarés), avaliação; promoção
  de categoria na biografia; tela com o caminho até o profissional (também no histórico do profissional).
- **Futebol**: prêmios na escala do mundo; mercado sem saltos de divisão; elite pede regularidade; grande clube pede nome
  firmado e duas temporadas boas; Europa (top-5) pede reputação 68+ e regularidade; mercados alternativos (MX, EUA, PT,
  JP...) abertos a carreiras médias; vaga por posição; teto de técnica ligeiramente menor no futebol.
- **CNH**: `autoescola.lembrarDaCnh` (motivos: veículo sem carteira, chegou à idade, adulto sem carteira) e cartão no
  painel "Agora" com o botão real e "agora não" que cala aquele motivo.
- **Corpo**: quatro partes — Condição atual (cada medida explicada), Evolução (comparação + causas + gráfico), Objetivo,
  Constituição (altura adulta e resposta ao treino como herança/tendência).

## 6. Correções (causa-raiz → solução)

- **BUG-01**: `PerfilMilitar.femininoDesde` (BR = 2025, Decreto 12.154/2024) e `militar.chamadoAoAlistamento` na
  condição do evento. Sem a janela, mulheres não são chamadas (a farda segue pelo concurso).
- **BUG-02**: `situacoes.cenaDeOutroClube`: a cena aberta ou adiada cujo `dados.clube` não é o clube atual não abre nem
  volta. O histórico e as cenas de memória (reencontro, homenagem) ficam.
- **BUG-03**: `veiculos.veiculoNaOficina` (fonte única: só veículo seu, com você, quebrado e não parado); texto com o nome
  real do veículo; veículo guardado em outra cidade não gasta nem quebra como se rodasse.
- **BUG-04**: ciclo eleitoral com módulo para trás (1986, 1988, 1990... = calendário real brasileiro). As regras da época
  já existentes (reeleição antes da EC 16/1997, presidencial a partir de 1994 no jogo) continuam valendo.

## 7. Integrações verificadas

E-sports ↔ semana (rotina), trabalho (contrato/ocupação), dinheiro (salário, prêmios no extrato), moradia (mudança),
escola, corpo, estresse, fama, biografia, save. Formação ↔ palmarés, biografia, ficha, histórico profissional. Atributos
↔ nota da temporada (todas as modalidades), treino extra (`noOficio`), envelhecimento. CNH ↔ processo da autoescola.

## 8. Preservação

Save continua v20; campos novos opcionais (`esports25`, `serieAtributos`, `formacao`, `femininoDesde`), normalizador
`normalizarVida25Esports`. Nada removido; a linha de atributos antiga do PainelAtleta foi substituída pela ficha.

## 9. Testes

- Novos: `motor/__tests__/vida25Bugs.test.ts` (14), `vida25Esportes.test.ts` (16), `ui/__tests__/vida25.test.tsx` (6).
- Ajustado: `ui/__tests__/vida24.test.tsx` (o rótulo "De nascença" virou "Constituição"; as causas moram em "Evolução").
- Suíte completa (`npx vitest run --maxWorkers=3`): **2984 passaram, 6 falharam, 1 pulado (2991)**. As 6 são timeouts sob
  carga, sem asserção falhando: `att3 veículos`, `profissao clima`, `rework115Esportes basquete e vôlei`,
  `fixPosPlaytestHumano resultado não é garantido` → rodados sozinhos: **4 arquivos, 153 testes, todos passam**;
  `fechamentoMundo #4` e `motor regra de agência` têm timeout fixo de 60 s e falham também na base (pré-existente).
- `tsc --noEmit` limpo; build ok (maior pacote: motor-textos 799.958 B < 800 kB); smoke de produção `scripts/itch/smoke.mjs`
  32/32.
- Simulações (`~/vida-trabalho/v25/sim`): bugs (48 vidas, eras 1970–2010): 0 alistamentos femininos antes de 2025,
  0 cenas de clube anterior, 0 mensagens de veículo sem veículo. Futebol (80 vidas dedicadas, antes → depois):
  elite 96% → 88%; grande na elite 83% → 62%; liga top-5 42% → 23%; grande top-5 38% → 19%; Bola de Ouro 10 → 1;
  The Best 11 → 1; prêmios por profissional 2,0 → 1,5. E-sports (24 vidas por jogo, totalmente dedicadas): degrau 3+
  em 37–58%, elite (4) em 0–38%, mundial raro; 0 crashes; save íntegro.

## 10. Validação visual

`scripts/playtest/vida25.mjs` no build de produção: 8 cenas (e-sports em Outros caminhos e Trabalho, porta do e-sports,
formação, ficha na base e no vôlei, CNH, corpo) × 1440/390 × claro/escuro = 32 capturas: sem rolagem lateral, sem
elemento passando da tela, sem erro de console, sem NaN/undefined; persistência da dispensa da CNH após recarregar ok.
Corrigido na QA: emoji de troféu (não renderiza em algumas fontes) → selo "campeão"; lista de competições no celular.

## 11. Pendências e limites

- Elite doméstica ainda alta (88%) para o atleta *totalmente dedicado* da simulação: a técnica dele chega a 85–100.
  Recalibrar a curva de técnica de todas as modalidades fica para uma rodada própria (afeta muitos testes e vidas).
- Base: a posição sugerida pode mudar de um ano para o outro na formação (vem do motor, não da tela).
- E-sports: sem carreira pós-jogador (técnico, analista, narrador) — sugestão futura; adversários individuais não têm nome.
- Outros países: só o Brasil tem `femininoDesde`; o calendário eleitoral para trás nos outros países é abstração
  (só vidas contemporâneas existem fora do Brasil).
- Dispensa do lembrete da CNH é por navegador (localStorage), não vai no save.

## 12. Publicação

Ver a seção acrescentada após o deploy.

Fontes (e-sports e alistamento, consultadas em nov/2026): lolesports.com (CBLOL/LCS 2026), ubisoft.com (R6 Esports Circuit
2026), valorantesports.com (VCT 2026; Challengers Brazil 2026), rocketleague.com (RLCS 2026), fortnite.com (FNCS 2026
Official Rules), cobertura de imprensa sobre o VRS da Valve; Decreto 12.154/2024 (alistamento feminino voluntário).
