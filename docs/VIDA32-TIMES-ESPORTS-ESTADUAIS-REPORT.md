# VIDA 32 — fundar times, e-sports, técnico com mais ações, estaduais

## O que mudou
- **Competições:** o terceiro nível do Brasil passa a se chamar **Série C** (antes "divisões de acesso"). A distribuição já era realista (20 times na A, 20 na B, 20 na C e o resto só no estadual); o problema era o nome.
- **Estaduais:** os 27 campeonatos têm nome (Paulista, Carioca, Mineiro…) e troféu próprio (escudo com taça e estrela) para o jogador, o técnico e o dono. A campanha tem 3 jogos de grupo, depois quartas, semifinal e final, com sorteio estável por ano e clube.
- **Técnico:** 17 ações novas em cinco grupos: Treino, Elenco, Imprensa, Diretoria e Carreira. Cada uma tem limite e efeito na temporada seguinte. Também foi corrigido um bug antigo: o `ajuste` das decisões do técnico nunca chegava aos jogos.
- **Patrimônio · Empresas** agora tem três abas: Minhas empresas, Esporte e Abrir ou comprar. O aviso da mesa do clube, no Hoje, abre direto na aba Esporte.
- **Clubes à venda:** vitrine de cartões com escudo, faixa nas cores do clube, divisão, porte, preço, receita e dívida. Filtros por país, divisão, porte e "cabe no meu bolso"; ordem e busca; 12 clubes por página.
- **Fundar um time:**
  - Futebol: entra na liga do país no nível 1 (o estadual) e sobe pela mesma simulação da liga. Elenco de várzea; joga o estadual da UF.
  - Basquete, vôlei e futsal (`v32/equipes`): 3 níveis, 12 times por divisão, sobem 2 e caem 2. Dá para reforçar o elenco, contratar técnico, ampliar o ginásio, fechar patrocínio, aportar dinheiro e vender.
  - Vender logo depois de fundar devolve menos do que custou.
- **E-sports** (`v31/esports/org31`): comprar uma organização (as reais, nos anos em que existiram, e 8 fictícias) ou fundar a sua. Tem elenco com arquétipos, técnico, patrocínio, bootcamp, conteúdo, academia, liga com acesso e queda, mundial e a mesa do dono.

## Testes
- Novos: `vida32Fundar`, `vida32Esports`, `vida32Tecnico` (motor e UI). Também os testes de estaduais e Série C em `vida31Copas`.
- Suíte completa, build (todos os chunks ≤ 800 kB) e smoke: ver a seção Publicação.
