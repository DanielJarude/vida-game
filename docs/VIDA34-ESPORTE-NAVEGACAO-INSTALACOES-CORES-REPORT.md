# VIDA 34 · Esporte organizado, instalações à vista e cores reais

Data: 2026-11-21 · branch `claude/vida34-navegacao-esporte` · notas de versão '34'.

## Pedido
1. Melhorar a navegação de Patrimônio › Empresas › Esporte e dentro de cada organização (clube, time de quadra, org de e-sports).
2. Conferir as cores dos times reais (futebol e e-sports) e corrigir.
3. (No meio da tarefa) Mostrar o estádio, o CT, a base, a quadra/ginásio e a gaming house, com personalização.

## 1. Navegação
- `ui/v34/esporte/CentralEsporte34.tsx` substitui a aba que empilhava o clube, os times de quadra, a org e a fundação.
  Abre numa central: **Seus times** (um cartão por time, com escudo, modalidade, divisão, caixa e um aviso — mesa,
  conflito, caixa negativo, sem técnico) e **Começar outro** (comprar clube, fundar time, organização de e-sports).
  Cada coisa abre sozinha, com a trilha "← Todos os times" e atalhos para os outros times. Depois de comprar ou fundar,
  a central abre o time novo. A última tela fica lembrada na sessão.
- `ui/v34/esporte/NavTime34.tsx`: barra de abas em grupos com nome (sublinhada, rolável no celular), usada no clube
  (Visão geral · Time · Competição · Gestão), no time de quadra e na org (Visão geral · As lines · Negócio). As abas
  de uma line usam a variante `sub` (pílulas leves), para não se confundirem com as de cima.
- Clube e org: os números completos ficam só no Painel; nas outras abas, uma faixa curta. No clube, os cartões
  Elenco e Técnico e os avisos do painel levam à aba certa.

## 2. Cores
- Levantamento: 343 dos 469 clubes de futebol do jogo (todos fora do Brasil, alguns só por nome diferente — "FC Porto")
  não tinham escudo e caíam em cores sorteadas; as 235 organizações reais de e-sports usavam cores sorteadas.
- `ui/v30/escudos/escudosMundo34.ts`: cores e padrão da camisa dos 343 clubes + `CORRECOES34` (auditoria da tabela
  antiga: Fluminense, Botafogo, Santos, São Paulo, Bahia, Fortaleza, Coritiba, Ponte Preta, Juventude, Cuiabá,
  Rio Branco-AC, Atlético Acreano, São Raimundo, Porto Velho, Capital, Comercial-MS, Maringá, Amazonas, Fluminense de
  Feira, Bayern, PSG, Ajax, Roma).
- `ui/v31/esports/coresOrgs34.ts`: cores de marca das 235 orgs (`coresDaOrg34`); o distintivo escolhe letra escura em
  fundo claro (Natus Vincere, LOUD, Vitality). O escudo de futebol também passou a escolher contraste por luminância.
- Pendências conhecidas: há dois "Everton" (Inglaterra e Chile) com o mesmo nome — o escudo usa o inglês; alguns clubes
  pequenos (Rep. Dominicana, Costa Rica, Peru, ligas nacionais da África/Ásia/Oceania) têm cor pela melhor referência
  disponível, sem conferência individual.

## 3. Instalações
- Motor: `motor/v33/dono/instalacoes34.ts` (folha; `Instalacoes34` + `normalizarInstalacoes34`), op `dono` →
  `{ op: 'instalacoes', instalacoes }` em `dono33.ts` (vale para clube, time de quadra e org). Estético e gratuito:
  não muda força nem dinheiro. Campos opcionais `instalacoes34` em Clube20, Equipe32 e OrgEsports31 (saves antigos ok).
- UI: `ui/v34/instalacoes/Desenhos34.tsx` (Estadio34, CT34, Base34, Ginasio34, GamingHouse34 — o nível do time decide
  o tamanho) e `Instalacoes34.tsx` (o desenho e o ateliê: nomes, cadeiras, cobertura, gramado, sigla, telão; piso e
  arquibancada; estilo, luz e mural da gaming house). Abas novas: "Estádio, CT e base" (clube), "Ginásio" (quadra),
  "Gaming house" (org).

## QA
- `src/ui/__tests__/vida34Esporte.test.tsx` (central, fundar → time aberto, instalações salvas e normalizadas, cores).
- Screenshots 1440 e 390 (`~/vida-trabalho/v34/nav.mjs`), sem erros de página.
- Suíte completa (8 lotes): 3381 testes passando; 5 estouros de tempo já conhecidos nesta máquina (fechamentoMundo, fixPosPlaytestHumano, motor linguagem, profissao clima, rework115Esportes basquete e vôlei).
- Tamanhos: motor 796,96 kB e motor-textos 794,1 kB (iguais); central 101 kB em chunk próprio.
