# ATT Mundo + VIDA offline

- **Base:** `fa80d10`, na branch `claude/fix-pos-rework3-playtest`. Sem merge em `main`, sem force-push, sem deploy manual.
- **Save:** **v20**, com migração v19 → v20 (seção 24).
- **Regra do pacote:** "Se eu trocar a bandeira e a vida continuar igual, não implementamos o mundo." E a de sempre: não basta implementar, tem que conectar.

## Resumo

| Frente | Antes | Agora |
| --- | --- | --- |
| País | Não existia: "onde" era só o id de uma cidade brasileira | Um catálogo de **193 países** (os membros da ONU) e **28 países vivíveis**, em todas as regiões habitadas. País é dado estrutural da vida |
| Nascer · nacionalidade · morar | Uma coisa só | Três: o país da cidade natal, as nacionalidades (sangue, solo, naturalização) e o país da moradia |
| Dinheiro | `R$` fixo, reais em todo lugar | Uma unidade de poder de compra no motor; na tela e no texto, a moeda de cada país (ISO 4217); entre países, o câmbio de mercado |
| Economia | Brasil | Renda, moradia, mínimo, impostos, 13º/14º, rescisão, seguro-desemprego, aposentadoria, assistência e inflação por país |
| Escola | ENEM, SISU, ProUni, FIES, federal | O exame, o acesso (exame nacional, acesso aberto, candidatura), o custo da pública, a bolsa, o crédito, as cotas e os nomes das instituições de cada país |
| Política | Vereador → governador, TSE, partidos brasileiros | Os degraus que existem em cada país (com títulos, mandatos, idades, casas e calendário reais); fora do Brasil, partidos pelo espectro, sem nome real |
| Esporte | Clubes e Série A brasileiros; seleção brasileira para todos | Clubes reais de 28 ligas; divisões de cada país; transferências internacionais; a seleção é a da nacionalidade, nunca a da residência |
| Migração | Não existia | Ação jogável: motivo → país (com a porta) → cidade → o que muda → confirmar. Câmbio, língua, adaptação, naturalização, biografia |
| Herança | Regra do Brasil | Regra do país onde a pessoa morava; quinhões atravessam fronteiras pelo câmbio |
| Offline | Só online; fontes do Google | PWA instalável; joga sem rede; fontes locais |
| Saves | localStorage | IndexedDB (gravação atômica, slot anterior, fila), com o localStorage de reserva e migração segura |
| Bundle | `motor-conteudo` a 787 kB do limite de 800 | O mundo em 7 pacotes por região; `motor-conteudo` 122 kB, `motor-textos` 677 kB, `motor` 707 kB; **o limite não foi aumentado** |

### Validação (no momento do commit)

| Verificação | Resultado |
| --- | --- |
| Typecheck (`tsc --noEmit`) | Limpo |
| Suíte do motor, Node 22.23.2 (`vitest run src/motor`) | **912 testes em 38 arquivos, todos passando** (com `--testTimeout` maior: na máquina carregada do WSL, 5 testes longos estouravam os 20 s e passaram isolados) |
| Testes novos do mundo (`mundo.test.ts`) | 19/19: os 12 casos da Parte 36, "trocar a bandeira", transferências, clubes homônimos, filiação fora do Brasil |
| Build (`npm run build`) | Sem aviso de tamanho; **o limite de 800 kB não foi aumentado** |
| PWA offline (`scripts/pwa/offline.mjs`, 390 px) | 18/18 na entrega do PWA (antes dos pacotes do mundo) |
| Simulação mundial (`scripts/sim/mundo.ts`) | 168 vidas em 28 países: 0 erros, 0 saves que não reabrem, 8.399 extratos anuais, 0 sem fechar |
| Capturas (`scripts/playtest/mundo.mjs`) | 39 em 1440/820/390, sem rolagem horizontal, erro de página ou texto técnico vazando |
| **Não rodado nesta entrega** | a suíte de interface completa (jsdom), `build:itch` + smoke e o PWA offline com os pacotes do mundo — ver seção 26 |

## 1. Auditoria inicial

- HEAD conferido: `fa80d10de22d417ead90920e84fc181dc3fda205`.
- Relatório anterior lido (`docs/FIX-PRE-AMERICA-SUL-E-SUCESSAO-REPORT.md`) e as pendências dele viraram a Parte 1.
- **Achado central:** não havia conceito de país. "Onde" era `municipioId` (formato `cidade-uf`); região, UF, custo de vida e salário saíam de `dados/lugares.ts`. Os dois únicos pontos que antecipavam outro país eram stubs: `sucessao.paisDaVida` (sempre `'BR'`) e `selecao.nacionalidadeEsportiva` (sempre `'brasil'`).

## 2. Mapa de acoplamentos (hardcodes brasileiros encontrados)

| Domínio | Onde estava acoplado | Quantos | Como ficou |
| --- | --- | --- | --- |
| Moeda | `texto.dinheiro` com `R$` fixo; ~17 `toLocaleString('pt-BR')` soltos; 47 linhas com `R$` literal; "reais" em 31 arquivos | ~110 | `mundo/moeda` (formato por país); os literais passaram por `dinheiro()`/`dinheiroCurto()` |
| Lugares | `MUNICIPIOS` (130 cidades brasileiras), `REGIAO_UF`, `NOMES_UF`, `Regiao`; ~10 ids de cidade fixos fora de `lugares` (`'sao-paulo-sp'`, `'brasilia-df'`, `'rio-de-janeiro-rj'`) | 148 usos de `municipio()` | Cidades de 27 países no mesmo índice; `paisDaCidade`, `cidadesDoPais`, `grandesCentros`, `capitalDoPais`, `codigoDoMunicipio` |
| Nomes | `dados/nomes` com listas brasileiras | 6 chamadores | Perfis de nomes por país, com grupos regionais e regra de sobrenome (um, dois, luso) |
| Escola | ENEM, SISU, cotas (Lei 12.711), ProUni, FIES, "federal", "estadual", "municipal", "Sistema S", patronos | ~70 linhas | `PerfilEducacional` + `educacaoDaVida(v)` |
| Trabalho | `SALARIO_MINIMO`, INSS, IRPF, 13º, FGTS + multa, seguro-desemprego, aposentadoria 62/65, BPC, MEI, "carteira assinada" | ~40 linhas | `PerfilTrabalhista` + `mundo/economia` |
| Futebol | `CLUBES` (só Brasil), `DIVISAO_DO_NIVEL` (Série A/B, estadual), "Seleção Brasileira", sede no Rio | ~90 linhas | Clubes e divisões por país; seleção pela nacionalidade |
| Política | `CARGOS` brasileiros, calendário 2028/2030 em outubro, posse em janeiro, TSE, partidos reais, Ficha Limpa, "em Brasília" | ~90 linhas | `PerfilPolitico` (degraus, títulos, mandatos, idades, casas, calendário) |
| Farda | Exército/Marinha/Aeronáutica, AMAN/EsSA/AFA/EEAR, guarnições brasileiras, alistamento aos 18 | ~100 linhas | `PerfilMilitar` (serviço obrigatório/seletivo/voluntário, nomes das forças, a polícia) — ver seção 13 |
| Herança | Tabela só `BR`, ITCMD | 3 | `sucessao` em cada perfil |
| Saúde | SUS, plano pela classe | ~20 linhas | `PerfilDeSaude` (universal/misto/seguro, nome da rede pública, custo do plano) |
| Viagens | "Uma viagem pelo Brasil"; passagem calculada "a partir do Brasil" | 2 tabelas | Viagem pelo país da residência; o exterior a partir de onde se mora |
| Calendário e costumes | São João, Carnaval, Copa, Ano-Novo de branco, Pix, Polícia Federal, Detran | ~40 linhas | Ver seção 2.1 |

### 2.1 Conteúdo brasileiro em vidas de fora

Detalhe em `docs/notas/CONTEUDO-POR-PAIS.md`. Os costumes e instituições brasileiros (Pix, Polícia Federal, UPA, novela, Detran, IPTU, cartório, várzea, "nome sujo", festa junina, carnaval, Ano-Novo de branco, Copa) viraram o campo `cotidiano` do perfil — preenchido para o Brasil, genérico fora. A rede pública de saúde, a previdência, o MEI, o alistamento, as forças e as guarnições leem o perfil. Cenas de escritório só aparecem para quem trabalha em escritório. O Brasil continua idêntico (textos, sorteio, resultados), salvo os quatro pontos listados na nota.

## 3. Pendências anteriores (Parte 1)

### 3.1 NPCs e doenças

Detalhe em `docs/notas/SAUDE-NPC-E-DIVIDAS.md`. `Pessoa.condicoes` guarda o estado das condições crônicas do NPC (do mesmo catálogo do protagonista); o ano de saúde do NPC roda num gerador derivado; o histórico familiar pesa nos dois sentidos; uma função de risco de morte serve protagonista e NPC (expectativa de vida 77,6 → 77,5 anos). Na sucessão, condições, diagnóstico, tratamento, hábitos e a saúde em número passam 1:1. Saves antigos reconstroem a história de saúde na primeira leitura.

### 3.2 Dívidas nas vidas automáticas (os 42%)

Detalhe em `docs/notas/SAUDE-NPC-E-DIVIDAS.md`. 250 vidas, 5 políticas × 5 classes. **Diagnóstico:** os 42% são sobretudo deficiência do agente "primeira opção" (75–79% dos anos adultos sem renda; 74% da dívida é aluguel e parcela atrasados); o resto é emergente plausível (aposentado de renda baixa que passa a pagar aluguel; o gastador). Um agente prudente fica em 3–10%. **Distorção confirmada e corrigida:** o rotativo do cartão crescia sem teto (~70% ao ano); agora para em 2× o principal (Lei 14.690/2023, art. 28). Isso reduz o tamanho da dívida, não a proporção — e não foi calibrado para um alvo. Descartados: aposentadoria baixa para quem contribuiu, bens não usados, erro contábil.

### 3.3 Carreira de técnico

Detalhe em `docs/notas/TECNICO-AERONAVES.md`. **Vazamento de modalidade:** a raiz era a escada de promoção (trilha + nível, sem esporte). `Ocupacao.modalidade` passou a ser estrutural; cada esporte de quadra/piscina/pista/tatame tem a sua comissão (auxiliar → técnico). Antes, 22 de 30 ex-atletas de outros esportes viravam técnico de futebol; agora, 0. **Contratação no meio da temporada:** clube em crise demite; o técnico sem clube recebe a proposta com a tabela do dia; só os jogos comandados contam (J = V + E + D mantido); 15 de 167 passagens na simulação. Fora do Brasil, o estadual vira a copa nacional.

### 3.4 Aeronaves

Bimotores (Piper Seneca V, Beechcraft Baron G58) e jatos (Embraer Phenom 100EV, Cessna Citation M2 Gen2) à venda, com preço, habilitação (piloto + multimotor, ou piloto contratado; jato sempre com tripulação), patrimônio mínimo para o jato, custo mensal, seguro e hangar, depreciação, venda e persistência pelos caminhos dos veículos. O desenho certo para cada um.

## 4. Bugs encontrados e corrigidos (auditoria geral)

| Bug | Causa | Correção |
| --- | --- | --- |
| Filiar-se a um partido fora do Brasil travava o jogo | O laço andava de 7 em 7 numa lista de 7 partidos | Passo primo com o tamanho da lista. Teste |
| Parentes de quem nasce fora eram tratados como brasileiros | A nacionalidade padrão caía em BR sem cidade natal | Padrão = país onde nasceu, senão onde mora; a mudança grava a de quem vai junto. Teste |
| Nenhuma transferência internacional acontecia | A proposta de fora exigia elite e uma origem que só existe fora da elite | Origem própria (`exterior`) para quem brilha na elite. Teste e simulação |
| Clubes homônimos se confundiam (o Liverpool inglês e o uruguaio; os Nacional) | Índice por nome guardava só o primeiro | Índice com todos, resolvido pelo país. Teste |
| Peneira de uma criança estrangeira era no Rio Branco (Acre) | A cidade era guardada como posição na lista brasileira | Código estável por país (`codigoDoMunicipio`) |
| Amigos e filhos de vidas estrangeiras se mudavam para Belém ou Brasília | Listas de cidades brasileiras | Cidades do país de residência |
| Mudar "para perto do filho" no exterior teleportava | A mudança de cidade não sabia de país | Toda mudança para outro país passa pela migração (porta, câmbio) |
| Saves v6–v16 deixavam de abrir | A validação intermediária usava as regras da v20 | Validação da cadeia antiga na v16; a v20 no fim |
| Juros do rotativo sem teto | ver 3.2 | Teto de 2× o principal |
| "Carteira assinada" e "serviço militar obrigatório" fora do Brasil | Rótulos fixos | Do perfil do país |
| "Vestibular da federal", "universidade federal", escolas com patrono brasileiro no Japão | Textos fixos | Nomes de instituição do perfil; fora, pelo que são |
| A mesma frase da política na Linha da Vida até 10 vezes | Escrita a cada ano | Uma vez por eleição |
| Salários de países ricos altos demais (simulação) | Razão do PIB per capita direto no salário | Nível salarial = renda^0,75 (documentado) |
| Bebês de casais japoneses com nomes brasileiros | Sorteio sem país | Nome do país, da divisão e da família |

## 5. Arquitetura mundial

```
MUNDO  mundo/catalogo.ts      193 países (ONU), região M49, moeda ISO 4217, economia relativa (Banco Mundial)
  ↓    mundo/registro.ts      o catálogo + os perfis registrados; textos ("no Brasil", "à Argentina")
PAÍS   mundo/paises/*.ts      PerfilDePais: divisões, cidades, economia, trabalho, escola, política, farda,
  ↓                           esporte, saúde, migração, herança, nomes, fontes
DIVISÃO / CIDADE  dados/lugares.ts   o mesmo índice para as cidades brasileiras (ids antigos) e as de fora (`ar:cordoba`)
  ↓
INSTITUIÇÕES / ECONOMIA / REGRAS     mundo/economia.ts, mundo/moeda.ts, mundo/cidadania.ts, perfis lidos pelos sistemas
  ↓
PESSOA  mundo/vida.ts          onde nasceu, de onde é, onde mora; a moeda corrente; a língua; a adaptação
  ↓
OPORTUNIDADES E CONSEQUÊNCIAS  sistemas/migracao.ts, renda, trabalho, escola, politica, esporte, selecao, sucessao...
```

- **Três camadas de profundidade** (Parte 6): o universal é o motor de sempre; o perfil do país é dado (`PerfilDePais`); a exceção real é um valor de campo que outro país também pode ter (o FGTS é `rescisao: { nome: 'FGTS, multa', mesesPorAno: 1,344 }`; o acesso aberto argentino é `ingresso: 'acesso_aberto'`; o MEI é `microempreendedor`). Não há `switch (país)` espalhado: as poucas comparações com `'BR'` que ficaram guardam compatibilidade de ids e textos de saves antigos (as cidades brasileiras, o Rio como sede da CBF, as escolas com patrono) e estão comentadas.
- **Um país novo** é um arquivo de perfil (ou uma entrada num arquivo de região) e, se for de uma região nova, uma linha em `mundo/carregar.ts`. Nenhum sistema muda.
- **O contexto de moeda:** o motor processa uma vida de cada vez; quem entra no motor (`transacao`, `avancarAno`, `executar`) e as telas que mostram uma vida chamam `entrarNaVida(v)`, que define o país corrente; `dinheiro()` lê dele.

## 6. Países suportados e profundidade

**28 países vivíveis**, todos com o perfil completo no modelo do jogo (cidades e divisões reais, economia, trabalho, escola, política, farda, esporte com clubes reais, saúde, migração, herança, nomes). O Brasil tem camadas extras que vêm de antes (117 cidades, 94 clubes, partidos reais, o `cotidiano`). **Os outros 165 países do catálogo existem no mundo** (nome, região, moeda, economia: viagens, origem de alguém, a lista) **e ainda não podem ser vividos** — o jogo diz isso na busca, sem botões mortos.

| País | Região | Moeda | Cidades | Clubes | Grupos de nomes | Nomes (prenomes) | Degraus políticos | Ingresso na universidade | Serviço militar | Saúde | Legítima | Solo | Fontes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| África do Sul | África | rand sul-africano | 14 | 14 | 6 | 732 | 3 | candidatura (matric (National Senior Certificate)) | voluntario | misto | 0% | condicional | 12 |
| Angola | África | kwanza angolano | 14 | 12 | 3 | 171 | 1 | candidatura (exame de acesso) | obrigatorio | universal | 67% | nao | 9 |
| Marrocos | África | dirham marroquino | 14 | 15 | 4 | 193 | 3 | acesso aberto (bac) | seletivo | misto | 67% | nao | 11 |
| Nigéria | África | naira nigeriana | 14 | 12 | 5 | 591 | 6 | exame nacional (UTME (JAMB)) | voluntario | misto | 0% | nao | 11 |
| Quênia | África | xelim queniano | 14 | 12 | 9 | 440 | 4 | exame nacional (KCSE) | voluntario | misto | 0% | nao | 10 |
| Costa Rica | América Central e Caribe | colón costarriquenho | 13 | 11 | 2 | 164 | 3 | candidatura (Prova de Aptidão Acadêmica) | voluntario | universal | 0% | sim | 12 |
| República Dominicana | América Central e Caribe | peso dominicano | 14 | 10 | 1 | 162 | 4 | candidatura (POMA) | voluntario | misto | 67% | condicional | 11 |
| Canadá | América do Norte | dólar canadense | 13 | 11 | 2 | 324 | 4 | candidatura (boletim do último ano) | voluntario | universal | 0% | sim | 10 |
| Estados Unidos | América do Norte | dólar americano | 14 | 14 | 2 | 345 | 6 | candidatura (SAT) | seletivo | seguro | 33% | sim | 14 |
| México | América do Norte | peso mexicano | 13 | 15 | 2 | 184 | 6 | candidatura (EXANI-II) | seletivo | misto | 0% | sim | 11 |
| Argentina | América do Sul | peso argentino | 14 | 16 | 2 | 165 | 6 | acesso aberto (curso de ingresso) | voluntario | misto | 67% | sim | 13 |
| Brasil | América do Sul | real brasileiro | 117 | 94 | 1 | 256 | 6 | exame nacional (ENEM) | obrigatorio | misto | 50% | sim | 5 |
| Chile | América do Sul | peso chileno | 14 | 16 | 2 | 169 | 6 | exame nacional (PAES) | seletivo | misto | 75% | sim | 12 |
| Colômbia | América do Sul | peso colombiano | 14 | 14 | 2 | 161 | 6 | candidatura (Saber 11) | obrigatorio | misto | 50% | condicional | 10 |
| Peru | América do Sul | novo sol peruano | 14 | 16 | 2 | 162 | 6 | candidatura (exame de admissão) | voluntario | misto | 67% | sim | 12 |
| Uruguai | América do Sul | peso uruguaio | 13 | 16 | 2 | 157 | 6 | acesso aberto (inscrição na Udelar) | voluntario | universal | 67% | sim | 12 |
| China | Ásia | yuan chinês | 14 | 13 | 2 | 333 | 1 | exame nacional (gaokao) | seletivo | misto | 0% | nao | 9 |
| Coreia do Sul | Ásia | won sul-coreano | 14 | 15 | 1 | 236 | 5 | exame nacional (Suneung) | obrigatorio | universal | 50% | nao | 10 |
| Índia | Ásia | rupia indiana | 14 | 12 | 13 | 1825 | 3 | exame nacional (CUET) | voluntario | misto | 0% | nao | 10 |
| Japão | Ásia | iene japonês | 14 | 15 | 2 | 259 | 6 | exame nacional (Exame Comum de Ingresso Universitário) | voluntario | universal | 50% | nao | 10 |
| Alemanha | Europa | euro | 14 | 15 | 2 | 315 | 4 | candidatura (Abitur) | seletivo | universal | 50% | condicional | 8 |
| Espanha | Europa | euro | 14 | 16 | 4 | 387 | 5 | exame nacional (PAU) | voluntario | universal | 67% | nao | 8 |
| França | Europa | euro | 14 | 14 | 2 | 321 | 4 | candidatura (bac) | voluntario | universal | 67% | nao | 7 |
| Itália | Europa | euro | 14 | 16 | 2 | 183 | 6 | acesso aberto (maturità) | voluntario | universal | 67% | nao | 7 |
| Portugal | Europa | euro | 14 | 14 | 1 | 160 | 3 | exame nacional (Concurso Nacional de Acesso) | voluntario | universal | 67% | condicional | 9 |
| Reino Unido | Europa | libra esterlina | 14 | 16 | 5 | 523 | 3 | candidatura (A-level) | voluntario | universal | 0% | condicional | 8 |
| Austrália | Oceania | dólar australiano | 14 | 13 | 1 | 203 | 5 | exame nacional (ATAR) | voluntario | universal | 0% | condicional | 10 |
| Nova Zelândia | Oceania | dólar neozelandês | 12 | 12 | 2 | 245 | 3 | candidatura (NCEA) | voluntario | universal | 0% | condicional | 10 |


## 7. Fontes e proveniência

O catálogo sai de `scripts/mundo/fontes/paises.json` (ONU, M49, ISO 4217 de 2026-09-17, Banco Mundial: PIB per capita PPC, câmbio, fator PPC, população) por `scripts/mundo/gerar-catalogo.mjs`. Cada perfil traz `fontes` (leis, institutos de estatística, ministérios, ligas) e um comentário com as abstrações declaradas; o resumo por região está em `docs/notas/FONTES-PAISES-*.md`. A cidadania cita a lei de nacionalidade de cada país (`mundo/cidadania.ts`). Política de dados: países = membros da ONU; nada de opinião política; onde a lei é complexa demais (herança islâmica, impostos por estado), abstração documentada.

## 8. Cidades e regiões

Brasil: as 117 cidades de sempre (ids nos saves). Outros: 12–14 cidades reais por país, com divisão de primeiro nível (código ISO 3166-2), porte (metrópole, região metropolitana, capital, polo, pequena) e marcas (capital, sede, litoral). Diferenças regionais reais (custo e salário por divisão) onde documentadas.

## 9. Moedas e economia

O motor conta em reais de poder de compra brasileiro; a tela e o texto mostram a moeda do país pelo fator PPC. Diferenças por país: nível salarial (renda^0,75), moradia em relação ao resto dos preços, salário mínimo, informalidade (pesa na vaga com contrato), inflação e volatilidade, impostos e contribuições, meses pagos, rescisão, seguro-desemprego, previdência e assistência ao idoso, custo do plano de saúde e do tratamento particular. A migração converte pelo nível de preços relativo (câmbio de mercado), menos 1,5% de remessa; o extrato do ano é re-expresso na moeda nova e continua fechando. Simulação: desvio máximo de 1,5% (a remessa).

## 10. Educação

`PerfilEducacional`: nomes das etapas, escolas públicas, exame (ENEM, PAU, gaokao, Suneung, SAT, A-level...), ingresso (exame nacional, acesso aberto, candidatura), quanto a pública cobra, bolsa e crédito públicos com teto de renda em salários mínimos do país, cotas, nomes das instituições. Na Argentina, Uruguai, Itália e Marrocos, a pública é de acesso aberto (sem prova); nos EUA e no Reino Unido, a pública cobra.

## 11. Trabalho

As carreiras universais valem em todo país, com salário, impostos e contrato do lugar. Onde não há concurso público (Argentina, Chile, República Dominicana...), os cargos públicos entram por seleção; a Polícia Militar e a PRF só existem no Brasil (`Ocupacao.paises`). Quem chega de fora tem menos chance numa vaga até a língua e a rede chegarem (`penaDeChegada`). O regime simplificado (MEI) só onde o perfil tem um.

## 12. Esportes

Clubes reais de 28 ligas, divisões com os nomes de cada país, salários pelo mercado de cada liga (as cinco grandes europeias pagam várias vezes mais; tabela `MERCADOS`, calibração). Transferências internacionais: quem brilha na elite recebe propostas de fora (a proposta mostra a moeda de lá, a língua, o visto; aceitar é migrar pela porta do esporte). Simulação: Brasil→Inglaterra/França/Portugal, Argentina→EUA/Itália, Colômbia→México, Portugal→Espanha. Seleção: a da nacionalidade (fica a escolhida na primeira convocação), com a concorrência do país. Basquete e vôlei fora do Brasil usam ligas genéricas (sem nome inventado). Técnico: clubes e divisões do país; seleção do país de nascença.

## 13. Política e farda

`PerfilPolitico`: os degraus que existem (o senado só onde é eleito; o governador só onde é eleito), títulos, mandatos, idades, casas e calendário reais. Fora do Brasil, partidos pelo espectro, sem nome real. Farda: serviço obrigatório, seletivo ou voluntário; nomes das forças e da polícia do país; guarnições nas cidades do país; as regras de carreira militar brasileiras valem como abstração (pendência).

## 14. Migração

Ação `migrar` (motivo → país → cidade → resumo → confirmar). Portas: cidadania, livre circulação (MERCOSUL, UE, CPLP, ECOWAS, EAC, Trans-Tasman), família, trabalho (ofício que se leva; formação e experiência onde a porta é seletiva ou restrita), estudo (médio + um ano de custo de vida), residência (aposentadoria ou patrimônio). Sem porta, não há mudança. Custos: passagens, documentos, instalação, bichos. Consequências: veículos vendidos, casa própria fica, emprego acaba (ou vira contrato lá, pela porta do trabalho), curso trancado, quem mora junto vai junto, língua e adaptação, naturalização depois de N anos (com aviso onde a dupla não é aceita). Viagem nunca muda a residência. Filhos adultos também emigram (10% das mudanças deles), o que cria famílias transnacionais sem o jogador forçar.

## 15. Família, famílias transnacionais, herança e sucessão

Bebês: nacionalidade pelo lugar (solo, quando a lei dá) e pelos pais (sangue); sobrenome pelo costume do lugar (dois sobrenomes no mundo hispânico). Herança: a lei do país onde a pessoa morava; o quinhão de quem mora em outro país atravessa pelo câmbio; a ajuda da família de origem também. A sucessão preserva o país de nascimento, as nacionalidades e a residência de quem continua; a linhagem guarda as dos que vieram antes. Teste: pai brasileiro de Uberaba, filha em Buenos Aires — a herança chega em pesos pelo mesmo valor de mercado, ela continua brasileira, a biografia do pai fica intacta.

## 16. Biografia

"Deixou Curitiba e mudou-se para Lisboa, em Portugal, para trabalhar." "Depois de seis anos na Argentina, voltou ao Brasil, para São Paulo." "Transferiu-se para o Everton, no Reino Unido." "Depois de 4 anos na Alemanha, o alemão deixou de ser esforço." "Saiu a naturalização: agora é argentina." Nada de ids técnicos (as capturas conferem).

## 17. Interface do mundo

Sem aba "Mundo". Nascer: país (busca ou região → país, com o rodapé dizendo quantos podem ser vividos), estado/província, cidade, e uma nota sobre o lugar. Você: "No mundo" (nasceu em, nacionalidade, mora em, fala, as mudanças de país, pedir a nacionalidade). Vida · Cidade: o custo de viver aqui na moeda daqui, mudar de cidade (dentro do país) e mudar de país (em passos). O mapa de intenções do menu ganhou "Mudar de país, estudar ou trabalhar fora", "Quanto custa viver aqui" e "Onde nasci, minha nacionalidade". Funciona em 390 px.

## 18. PWA, service worker e cache

Detalhe em `docs/notas/PWA-OFFLINE.md`. vite-plugin-pwa (generateSW), manifesto (VIDA, standalone, `#121010`, caminhos relativos), ícones gerados, precache de tudo (inclusive os 7 pacotes do mundo: 35 entradas, 3,7 MB), sem cache em tempo de execução. Atualização com aviso discreto (sem popup), que espera as gravações antes de trocar a versão. No itch.io o service worker fica desligado. Fontes locais (Newsreader e Inter, latin e latin-ext).

## 19. Armazenamento e migração de saves

IndexedDB (`VIDA`/`gavetas`: principal, anterior, backup, estatísticas), gravação numa transação só, fila (a última vence), recuperação pelo slot anterior, `navigator.storage.persist()`, reserva no localStorage. Migração do localStorage v19 validada antes de copiar, sem apagar a cópia antiga. Exportar/importar já existia e foi auditado (JSON puro, versão, tamanho, vida encerrada, prévia antes de trocar).

## 20. Offline

Teste com o build real em 390 px: abre online, instala o SW, nasce e vive; desliga a rede, recarrega, continua, decide, salva; recarrega offline com o JSON idêntico; volta online, publica versão nova, aceita a atualização, o save sobrevive idêntico. 18/18 na entrega do PWA. O mundo é carregado junto com o motor e precacheado: uma vida em qualquer país joga sem rede. Uma região que não carregue (sem rede e sem cache) não impede o jogo; um save daquele país diz que o pacote não está no aparelho.

## 21. Bundle e pacotes

| Pacote | Antes | Depois |
| --- | --- | --- |
| `motor` | 684 kB | 713 kB |
| `motor-conteudo` | 787 kB | **123 kB** (o ano, as ações, a fachada, o save, o nascimento) |
| `motor-textos` (novo) | — | 679 kB (o catálogo de acontecimentos e os sistemas que só ele usa) |
| `motor-carreira` | 263 kB | 273 kB |
| `motor-dados` | 307 kB | 350 kB (inclui o catálogo de 193 países e o Brasil) |
| `mundo-*` (7 pacotes, sob demanda) | — | 16 (Caribe) a 72 kB (África); 310 kB no total |
| Precache do PWA | — | 35 entradas, 3,7 MB |

Sem ciclo entre pacotes (conferido nos imports do build). Um país novo engorda só o pacote da região dele.

## 22. Testes

Novos: `mundo.test.ts` (19), `mundoConteudo.test.ts` (conteúdo por país e viagens), `saudeNpc.test.ts` (12), `dividas.test.ts` (6), `comissaoModalidade.test.ts` (5), `aeronaves.test.ts` (4), novos casos em `tecnico.test.ts`, testes da persistência (16, fake-indexeddb) e `ui/__tests__/pwa.test.tsx` (8). Ajustados por mudança intencional: a versão do save (19 → 20) e a cadeia de idempotência de migração, e o mapa de intenções da navegação. Suíte do motor: **912/912 em 38 arquivos**.

## 23. Simulações

- **Mundo** (`scripts/sim/mundo.ts`, 6 vidas por país, estratégias familiar/ambicioso/estudioso/econômico): 0 erros, 0 saves que não reabrem, 8.399 extratos, 0 sem fechar. Os países produzem trajetórias diferentes (renda aos 35, em poder de compra, de ~1.350 em Angola a dezenas de milhares nos EUA; insolvência na morte só nos mais pobres — Índia, Nigéria, Angola, Quênia, China). Não se buscou igualdade.
- **Migrações** (10 casos, adultos de 30 anos): portas abertas pelo MERCOSUL/CPLP/trabalho/estudo e fechadas onde deviam (Japão sem trabalho, processo na Justiça); conservação do valor de mercado com desvio ≤ 1,5%; cinco anos depois, adaptação e língua aprendida.
- **Transferências** (`scripts/sim/transferencias.ts`, 400 carreiras): propostas de fora acontecem e levam a residência, a liga, a moeda e o registro migratório certos; a seleção continua a da nacionalidade.
- **Unicidade** (`scripts/sim/unicidade.ts`): três vidas na mesma carreira compartilham 2–11% das frases e 16–50% dos pop-ups; a repetição dentro de uma vida (academia, atuação, política, técnico) foi reduzida com 4 modelos novos de momento de carreira e frases que não se repetem.
- **Dívida** (`scripts/sim/dividas.ts`): ver 3.2.

## 24. Save v20

v19 → v20 (`migrarV19`): escreve `eu.nacionalidades = ['BR']` (toda vida anterior nasceu e mora no Brasil). Campos novos opcionais: `Vida.mundo`, `Pessoa.nacionalidades`, `Pessoa.condicoes`, `Divida.principal`, `TrajetoriaNaSelecao.pais`, `Geracao.nacionalidades/migracoes`. A validação v20 exige nacionalidades de países do catálogo e lugares conhecidos (com mensagem clara se o pacote de uma região não chegou). Os saves reais v5–v19 das fixtures continuam migrando e vivendo.

## 25. Capturas

39 capturas (`scripts/playtest/gerarMundo.ts` + `mundo.mjs`), em 1440, 820 e 390: nascer (busca de país), nascida em Córdoba (No mundo, Cidade, viagens), migrante Curitiba → Lisboa (Linha da Vida, No mundo, Mudar de país em passos), jogador argentino no Real Madrid, japonês (Formação, Pessoas), legado com herdeira em Buenos Aires. Sem rolagem horizontal, erro de página ou texto técnico. Achado nas capturas e corrigido: "carteira assinada" na Espanha.

## 26. Limitações e pendências reais

1. **Não rodados nesta entrega:** a suíte de interface completa (jsdom; no WSL o worker não sobe — a cópia no disco Linux ficou pronta, mas não chegou a rodar), `build:itch` + smoke e o teste offline do PWA com os pacotes do mundo. O relatório do playtest humano por subagente ainda não tinha chegado.
2. Profundidade: 28 países vivíveis; 165 só no catálogo. O Brasil tem camadas extras (cidades, clubes, partidos reais, cotidiano).
3. Basquete e vôlei fora do Brasil: ligas genéricas e sem transferência internacional; técnico não recebe proposta de fora.
4. Regras de carreira militar brasileiras valem como abstração em todo país; o Reino Unido aparece como uma seleção só.
5. Idioma: as línguas da pessoa e a adaptação existem; não há fluência graduada nem estudo de língua como ação.
6. Calibrações declaradas (nível salarial ^0,75, mercados do futebol, custo de passagens, chance de proposta de fora) pedem a simulação de 1.000 vidas.
7. Herança: um país por herança (o do domicílio), sem conflito de leis entre bens em lugares diferentes.
8. PWA: conferir instalação e ícone maskable em aparelho real; a cópia antiga do localStorage fica por uma versão; sem botão de instalar.
