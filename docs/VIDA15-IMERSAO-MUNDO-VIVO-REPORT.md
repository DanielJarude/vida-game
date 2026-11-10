# VIDA 15 — Imersão, mundo vivo e interfaces (relatório)

Branch `claude/vida15-imersao` (base: VIDA 14 publicada, `27c869a`). Feito por um único agente, sem subagentes. Notas de versão: `'15'`.
Publicada a pedido do usuário **antes da última rodada completa de testes**; o que ficou para depois está listado em "Pendências".

## Implementado
1. **Celular** (`src/motor/v15/celular`, `src/ui/v15/celular`): botão no topo da tela com contador; tela inicial com hora, mês, cidade, notificações e grade de apps.
   - **Mensagens**: as mensagens do ano e os chamados das pessoas (o sistema que já existia), em conversas por pessoa, com respostas que mudam a relação.
   - **Namoro**: 8 perfis por ano (foto, idade, profissão, distância, bio, interesses, o que procura), curtir/passar, o match só se for recíproco, até 3 conversas abertas. Depois do match, conversa e encontro usam as interações que já existiam (`app_conversar`, `app_encontro`). Com parceria exclusiva é traição (a parceria pode perceber). Em Pessoas, o antigo "Tentar um aplicativo" virou atalho para o app.
   - **Rede**: o que as pessoas da vida postaram (lido da trajetória delas), com "curtir" e "deixar um abraço" no luto; "Minhas contas" abre as redes que já existiam.
   - **Notícias**: o jornal do ano, a partir de dados reais: eventos mundiais, economia, eleições, campeões, conhecidos que ficaram famosos e — com fama — você.
   - **Agenda** (combinados e aniversários), **Mapas** (onde está a sua gente), **Banco** (saldo, aplicado, dívidas, extrato), **E-mail** (oportunidades e propostas), **Fama** (resumo e atalho para o painel).
2. **Mundo vivo**:
   - **Mensagens**: na virada do ano chegam 0 a 3 (convites para programas, saudade, novidades da família, a parceria sugerindo programa, colegas antigos, o ex, propostas de trabalho). Chegam mais durante o ano, depois da 3ª e da 7ª ação.
   - **Encontros por acaso**: ao viajar, sair, comprar ou ir a um programa, até 3 por ano.
   - **NPCs que ficam famosos**: o fato fica na trajetória e na pessoa (`celebridade15`).
   - **Sorteio isolado**: os sorteios são derivados (`rngDe`), sem mexer no acaso das vidas.
3. **Fama com consequências**:
   - fãs pedem foto (por mensagem e nos encontros);
   - convites para estreia, premiação, festa fechada, desfile, baile e barco;
   - pessoas famosas entram na vida como pessoas comuns do jogo, podendo virar amizade ou romance pelo sistema que já existia;
   - a imprensa pergunta sobre o relacionamento, e a resposta sai no jornal;
   - o casal com celebridade aumenta a notoriedade.
4. **Interfaces**:
   - **Você**: faixa de perfil (amigos, família, seguidores, estado civil, fama, objetivos) com atalhos.
   - **Pessoas**: "última conversa" e ★ para pessoas famosas.
   - **Crachá da carreira** em Caminhos · Trabalho: o atleta (clube, posição, temporada, carreira, títulos), o médico (especialidade), o empresário, o político (partido, mandato, urnas), o artista ou o emprego.
   - **Submundo**: navegação agrupada em quatro grupos, cada parte com uma linha de descrição.
   - **Minha Semana**: a aba "Celular" passou a se chamar "Redes sociais".
5. **Aborto pela lei do lugar** (`dados15/saude/aborto.ts`, com fontes): 28 países, e os EUA por estado.
   - As opções entram na decisão de gravidez que já existia ("Fora dos planos"): legal aqui; viajar para onde é legal; fora da lei (risco à saúde e um segredo que pode vazar).
   - Os permissivos só valem quando o caso se enquadra (no Brasil: menor de 14 anos ou risco à vida).
   - Quando quem gesta é a outra pessoa, a decisão é dela.
6. **Eventos por fase e pela história** (`v15/eventos`, com sorteio próprio por ano):
   - 20 cenas na infância, adolescência e velhice, e cenas que leem o histórico: a carta escrita aos 11 e aberta aos 30, a foto de um marco real, o colega de escola famoso, a volta à cidade natal.
   - Simulação de 30 vidas: decisões por ano entre os 3 e os 12 anos subiram de 0,07–0,6 para 0,4–0,8.
7. **Esportes**: "chuteira", "bola", "rondo/finalização", "estádio/campo" e "posição" não aparecem mais em natação, atletismo, lutas, tênis etc. (decisões da base, dispensa, teste no amador, técnico novo, aniversário do título).
8. **Veículos**: rodas com flanco, aro com profundidade, disco e pinça (vermelha nos esportivos de perfil baixo) e calota; faróis com reflexo de lente — vale para todo o catálogo.

## Preservado e verificado (sem mudança)
- **Tatuagens**: região, tamanho, posição, escala, rotação, cor, desbotamento, retoque, laser, cobertura, significado, composições, lupa em 4 níveis, frente e costas. Os personagens de obras em domínio público continuam como estavam.
- **Piercings**: no painel de Aparência, 9 metais, zonas e furos.
- **Vidas dos NPCs**: emprego, promoção, filhos, mudança, negócio, amor.

## Pendências (para a próxima sessão)
- **Última suíte completa não rodada** depois das últimas correções de teste (usuário pediu para publicar).
  - 2ª rodada: 2642 ok / 7 falhas. Duas são as preexistentes por tempo (fechamentoMundo #4, motor.test "regra de agência"). Duas passam isoladas (profissao "cortes", cirurgia: carga da máquina). Três eram deriva da vida-base e foram corrigidas depois, verificadas por arquivo (fix4 prazo, rework11Rotina premissa, vida125 casamento).
  - Na base, a regra de agência estoura o tempo; aqui chegou a terminar e apontou um texto antigo ("resolveu o que dava"), que foi corrigido.
- **Inspeção visual incompleta**: o celular foi conferido em claro/escuro, 1440/390 (início, mensagens, conversa, namoro, notícias, banco, agenda, rede, sem rolagem lateral nem vazamento). Faltam capturas do perfil em Você, do crachá, do Submundo agrupado, de Pessoas e do app Fama com save famoso.
- **Móveis com profundidade verdadeira** (§6.1): não feito. A cama e outros objetos ainda são desenhados de frente sobre o cômodo em perspectiva; exige redesenhar ~100 objetos.
- **§4.6 outras áreas** (lojas, guarda-roupa, provador, garagem, casa, viagens, estudos, esportes): só avaliadas; nenhuma mudança além das rodas.
- **Tatuagens com personagens com direitos autorais**: não foram copiados (continua a regra de conteúdo do jogo público).
- **Aviso de build "Circular chunk motor14-conquistas ↔ motor-textos"**: preexistente na VIDA 14 publicada; o smoke de produção passa.

## Testes
- Novos: `vida15Celular` (motor 8, UI 3), `vida15Aborto` (5).
- Testes antigos ajustados à intenção, com comentário "VIDA 15": a vida-base mudou com as cenas novas da infância. Arquivos: rework10, fixPosRework2, navegacao, fixPosPlaytestHumano, rework125, fixPosRework3 (o Retrato passa a espécie), fix4, rework11Rotina, vida125.
- Uma penalidade automática foi removida (o convite sem resposta tirava proximidade), porque desviava as vidas de teste.
- Custo por ano igual ao da 14 (11,0 × 11,2 ms, 8 vidas).
- **Build**: pacotes < 800 kB (maior: motor-dados 799,6). Pacotes novos: motor15-celular 43,9; motor15-eventos 24,4; Celular 31,4.
- **Smoke** de produção (`scripts/itch/smoke.mjs`): 25/25.

## Saves
- Save continua v20, com campos opcionais (`Vida.celular15`, `Pessoa.celebridade15`) e normalização idempotente.
- Saves antigos abrem sem migração.

## Publicação
- `main` e a branch de produção (`claude/fix-pos-rework3-playtest`) atualizadas para o commit deste relatório; deploy pelo Cloudflare Pages.
- Hashes conferidos depois do deploy (ver a mensagem final da sessão).
