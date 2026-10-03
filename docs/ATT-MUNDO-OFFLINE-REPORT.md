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
| **Não rodado no checkpoint `99f2868`** | a suíte de interface, `build:itch` + smoke e o PWA offline com os pacotes do mundo — rodados no fechamento (seção 27) |

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

## 27. PLAYTEST HUMANO — FIX DE FECHAMENTO

Base: o checkpoint `99f2868` (save v20, 193 países no catálogo, 28 vivíveis, PWA, IndexedDB). Nada foi reiniciado nem revertido; o save continua **v20** (os campos novos são opcionais, validados e com padrão seguro — seção 27.10).

### 27.1 Validação final

| Verificação | Resultado |
| --- | --- |
| Typecheck (`tsc --noEmit`) | Limpo |
| Suíte completa, Node 22.23.2 (`vitest run`, motor + interface) | **1.090 testes em 63 arquivos, todos passando** — motor 940 (40 arquivos), interface 150 (23 arquivos) |
| Suíte de interface (jsdom) | Roda na cópia do disco Linux (no `/mnt/c` o worker do jsdom estoura o tempo — infraestrutura, não falha funcional). Baseline do checkpoint: 145/145 em 22; agora 150/150 em 23 |
| Build (`npm run build`) e `build:itch` | Sem aviso de tamanho; o limite de 800 kB **não foi aumentado** (27.9) |
| Smoke itch.io (`npm run smoke:itch`) | **21/21** |
| PWA offline com o mundo (`scripts/pwa/offline.mjs`) | **23/23** — os 7 pacotes regionais no precache; offline, nasce uma vida no Japão (o pacote da Ásia vem do cache), vive, salva, recarrega idêntica, sem R$ na tela; versão nova detectada e aplicada sem perder o save |
| Auditoria automática de vazamento Brasil → Mundo (`scripts/sim/vazamentos.ts`) | **0 achados** em 120 vidas inteiras (12 países × 10, idade final média 72) |
| Teste transversal (`transversal.test.ts`) | Passa (27.8) |
| Capturas (`scripts/playtest/fechamento.mjs`) | 36 (12 cenas × 1440/820/390): sem rolagem horizontal, erro de página, texto técnico, botão fora da tela ou instituição brasileira numa vida que mora nos EUA |

Durante o fechamento, três passadas da suíte pegaram falhas funcionais causadas pelos próprios fixes (5, depois 11, depois 2 arquivos) — todas corrigidas na causa, nenhum teste antigo afrouxado: (a) o evento novo de emigração da família consumia o sorteio principal no `quando` e deslocava o acaso de todas as vidas de teste (passou a usar sorteio derivado, sem papéis sorteados); (b) com 0,4%/ano, ~5% das vidas emigravam na infância (frequência irreal; agora 0,2%/ano e só quando o pai ou a mãe tem ofício qualificado); (c) um ciclo de import escola → rotinas.

### 27.2 SESC nos EUA — a causa e a classe

**Causa:** a descrição da natação no Tempo livre era uma string única ("Piscina do clube, do SESC ou da prefeitura") — conteúdo brasileiro tratado como universal porque não declarava escopo. A auditoria mostrou que era uma CLASSE: o catálogo de conteúdo (`conteudo/base.ts`) não tinha campo de lugar, e toda restrição de país era feita à mão dentro de `quando` — ou esquecida.

**Arquitetura de escopo geográfico** (`mundo/escopo.ts`, `mundo/locais.ts`, `mundo/regras.ts`):

```
universal → país ('BR') → divisão ('US-CA', 'BR-PE') → cidade (id)
```

- `Escopo` + `noEscopo`: onde um conteúdo vale. Está no catálogo de acontecimentos/decisões (filtrado centralmente em `conteudo/motor.preparar`) e nas atividades (`rotinas.escopo`, `rotinas.existeNoPais`). Ausência de escopo = universal de verdade. Exemplos: o São João e a seca do sertão têm escopo de **divisão** (os estados do Nordeste); "Inglês" não é atividade para quem mora em país de língua inglesa.
- `PorLugar` + `resolver`: uma coisa que muda com o lugar tem a forma **universal** (neutra e plausível) e variantes; a mais específica vence. `TEXTOS_LOCAIS` reúne as frases miúdas sem campo no perfil (natação: universal "piscina pública do bairro, do clube ou da academia", Brasil "do SESC ou da prefeitura", EUA "da YMCA"; o órgão ambiental; o imposto do veículo; o conselho de classe; o exame da ordem; a EJA; o "nome sujo"; o 13º; a justiça juvenil...).
- O que é instituição com campo no perfil (exame, rede de saúde, previdência, cartório) continua no perfil — sem `if (país)` nas telas.

### 27.3 Outros vazamentos encontrados (e corrigidos)

Três auditorias de leitura (motor e interface) + a auditoria automática. ~120 ocorrências em ~40 arquivos, todas ou com escopo, ou com forma universal + variante:

| Domínio | Exemplos que vazavam | Agora |
| --- | --- | --- |
| Tempo livre | SESC, capoeira, cavaquinho, forró, "na orla", festa junina no grêmio, desfile de Sete de Setembro, brigadeiro/paçoca, Conselho Tutelar, terapia "pelo SUS" (e de graça nos EUA) | `TEXTOS_LOCAIS`; terapia gratuita só onde há rede pública |
| Saúde | "SUS" fixo em Você, Tempo, Jogo, corpo; UBS/CAPS/UPA como empregadores e especialidades | `redeDeSaude`; nomes neutros ("posto de saúde"), com o nome brasileiro no comentário |
| Trabalho e previdência | INSS (facultativo, pausa, carreira, tela), jovem aprendiz (regra e oportunidade em todo país), CRM/OAB/CREA, "carteira assinada", "com carteira", 13º | `previdenciaDaVida`, `regrasDaVida().trabalho`, `nomeDoRegistro`, `TEXTOS_LOCAIS` |
| Dinheiro | "nome sujo" em 7 vereditos, IPVA, consignado; **bug de unidade**: os campos "valor em reais" liam a moeda local como unidade do motor (100.000 ienes viravam 100.000 "reais") | `TEXTOS_LOCAIS`; os três campos de valor convertem pela moeda do país |
| Escola | ver 27.4–27.6 | |
| Esporte | "Seleção brasileira" e "Série A/B, estadual" no painel do técnico e no legado; torneios de tênis em Florianópolis/Campinas para quem mora em Tóquio; NBB/Superliga na linha da temporada fora do Brasil; títulos da elite de outras ligas não pesavam na notoriedade | o nome guardado da seleção; `divisaoDoNivel` do país do clube; cidades do país; `ehElite` único |
| Política | "outubro" fixo (o perfil tem o mês), filiação "aos 16 com título de eleitor", CF art. 142 citada em todo país; **estrangeiro residente podia se candidatar** | mês do país, idade da regra local, citação só no Brasil, candidatura exige a nacionalidade |
| Farda | alistamento obrigatório chamava estrangeiro residente, sempre aos 18 | alistamento só para quem tem a nacionalidade, na idade do perfil |
| Bichos | IBAMA, Lei 9.605, "música da novela"; nomes brasileiros (Paçoca, Nescau) para bichos de vidas no Japão | `TEXTOS_LOCAIS`; nomes universais fora do Brasil |
| Cotidiano | cartório, churrasco, réveillon na laje, uva-passa, farofa, "preço do dólar", "comunidade no morro" | `registroCivil`, `TEXTOS_LOCAIS`, `temFesta` |

### 27.4 ENEM na UI, SAT no motor — a causa

`Estudos.tsx` escrevia "Fazer o ENEM deste ano" (e mais 14 rótulos: SISU, ProUni, FIES, supletivo, "Melhor ENEM recente"...) à mão; o motor (`acoes.ts`) já falava pelo perfil (`educacaoDaVida(v).o`). **Duas fontes para a mesma regra.**

Agora a fonte é uma só: `educacaoDoPais(pais)` / `educacaoDaVida(v)` dá o nome do exame, o rótulo da ação (`acao`: "Fazer o SAT deste ano"), a frase do resultado (`fez`), as etapas com artigo, os rótulos das vias (vagas, bolsa, crédito com os nomes do país). A tela, a elegibilidade, a ação, o resultado, a biografia e a Linha da Vida leem dela. Onde o "exame" não é uma prova (o Canadá: o boletim do último ano), o perfil diz `prova: false` e nada "faz o boletim". Onde a universidade pública tem matrícula aberta (Argentina, Uruguai, Itália, Marrocos), não há cursinho nem "nota do exame" na tela.

As notas guardam **o país e o exame** (`educacao.enem[].pais/exame`): a nota do ENEM fica na história, mas não abre a universidade nos EUA (`notasDaqui`). As notas antigas sem país (saves anteriores) ganham o país de origem na primeira mudança.

### 27.5 Educação acompanha onde a pessoa mora

- **Histórico ≠ sistema atual:** `educacao.historicoEscolar` guarda, a cada troca de país, onde se estudou e até que etapa (nos nomes daquele sistema); a escola de agora é sempre a do país da moradia. Formação mostra "Estudou no Brasil, até o 3º ano do fundamental".
- **Transição** (`trocarDeSistemaEscolar`, chamada por toda migração): a série é reconciliada (o jogo conta a escola em 9 + 3 em todo país — a série de chegada é a equivalente, nunca recomeço); a rede é a da casa; chegar noutra língua pesa nas notas do primeiro ano; o técnico integrado de um instituto federal não continua noutro país; o cursinho e o estudo para concurso acabam onde não fazem sentido. Voltar ao Brasil faz a mesma conta.
- **Criança que muda de país:** antes impossível (menor não migrava). Agora a FAMÍLIA muda (`migrarComAFamilia`): a casa inteira vai, a criança continua morando com os seus, o dinheiro atravessa pelo câmbio, a nacionalidade não muda, a língua e a adaptação começam. Um acontecimento raro (0,2%/ano, de 3 a 15 anos, só com pai ou mãe de ofício qualificado e uma porta aberta para eles) leva famílias para fora — o destino pesa língua, região, livre circulação e renda.
- **Consumidores auditados:** etapas e séries, escola pública/particular (nomes de escola particular sem santo brasileiro fora do Brasil; a creche pública do país), exame, vias, bolsa, crédito (rótulo do FIES na mensalidade), cotas, EJA/supletivo, cursinho, técnico integrado, olimpíada, abandono (a idade da escola obrigatória do lugar), retorno, decisões de fim do médio (sem "prova em novembro"), registros profissionais e o exame da ordem.

### 27.6 Habilitação e idades legais — regras nacionais e regionais

`mundo/regras.ts`: `REGRAS_UNIVERSAIS` → `PerfilDePais.regras` → `REGRAS_DAS_DIVISOES`. Uma fonte para a ação, a tela, o processo e a biografia.

- **Carteira de motorista:** etapas `aprendiz` (dirigir acompanhado), `provisoria` (sozinho, com restrição) e `plena`, o nome do documento e se a autoescola é obrigatória. Brasil: CNH, Permissão para Dirigir aos 18, autoescola obrigatória. EUA: **por estado** (13 estados do perfil, IIHS GDL: Montana aprendiz aos 15; Califórnia e Nova York 16 → provisória 16/17; Kentucky plena aos 17...). Canadá e Austrália: por província/estado. Reino Unido 17, Alemanha BF17 + 18, França conduite accompagnée 15 + permis 17, Argentina 17, África do Sul learner 17. Meio ano (15½) arredonda para o ano seguinte — nunca antes da lei. O processo espera a idade de dirigir sozinho para a prova prática ("com a permissão de aprendiz, já dá para dirigir acompanhada; a prática fica para os 16"). Não é simulador de DMV.
- **Outras idades** auditadas e resolvidas pela mesma hierarquia: maioridade (18; 19 na Coreia do Sul), trabalho (16 universal; Brasil 16 com aprendiz aos 14; EUA 14), escola obrigatória (16 universal; 17 Brasil; 18 EUA/Portugal/Inglaterra/França/Canadá), vida noturna (18; 21 EUA; 20 Japão; 19 Coreia), filiação partidária (18; 16 Brasil). Ficaram como **abstração universal documentada**: casamento (18), maioridade penal (18), transferência de atleta (18, FIFA), cursos livres (15), aposentadoria (já por país), candidatura (já por país).

### 27.7 Residência × origem

Seguem a **moradia**: escola, exame, saúde, lazer, trabalho, idades legais, carteira, impostos, nomes de bicho e de bebê sugeridos, torneios, divisões, mês da eleição. Seguem a **nacionalidade**: seleção (já seguia), naturalização (já), **candidatura** (corrigido), **alistamento** (corrigido). Pendência documentada: a carteira e os registros profissionais atravessam a fronteira sem revalidação (abstração).

### 27.8 Teste transversal

`transversal.test.ts`: nasce no Recife → escola no Brasil → muda com a família para Chicago aos 8 (série mantida, histórico brasileiro guardado, SAT) → em Illinois, aprendiz aos 15 e sozinha aos 16 → depois da mudança, nada na biografia fala do Brasil como o lugar → amizade no trabalho e uma discussão com consequência → filho nascido nos EUA (americano pelo solo, brasileiro pelo sangue) → patrimônio → morte → herança → continua como o filho (nasceu nos EUA, duas nacionalidades, mora nos EUA, dólar) → a linhagem lembra a mãe do Recife → salvar e reabrir: JSON idêntico. A metade offline (desligar a rede, salvar, fechar, abrir) é o PWA (27.1).

### 27.9 Bundle

| Pacote | Checkpoint | Fechamento |
| --- | --- | --- |
| `motor` | 713 kB | **733 kB** |
| `motor-textos` | 679 kB | 680 kB |
| `motor-dados` | 350 kB | 359 kB |
| `motor-carreira` | 273 kB | 276 kB |
| `motor-conteudo` | 123 kB | 124 kB |
| `Jogo` (telas) | — | 308 kB |
| `mundo-*` | 16–72 kB | 16–72 kB (sem mudança) |
| Precache do PWA | 35 entradas, 3,7 MB | 35 entradas, 3,8 MB |

Limite de 800 kB **inalterado**; nenhum pacote passou dele. O `motor` ficou com 67 kB de folga — o próximo pacote grande deve modularizar (pendência).

### 27.10 Relações 2.0

**Tipo ≠ proximidade ≠ estado.** O motor já tinha proximidade, confiança, tensão, fases e história; o problema era a síntese ("muito próximo" como identidade) e três bugs.

- **Tipo** (`EstagioSocial` + parentesco + romance): conhecido, colega, amigo, amigo íntimo, **melhor amigo** (no máximo um, por história, confiança e tempo), amigo de outros tempos (afastado sem briga), **ex-amigo** (ruptura), **rival**; interesse romântico, saindo, namoro, casamento, ex; família continua família com proximidade 8 — e rompida, continua irmã.
- **Estado** (`lacos.estadoDaRelacao`, derivado, sem máquina rígida): se aproximando, estável, esfriando (pela proximidade do começo do ano), em tensão, em conflito (o conflito aberto: assunto, gravidade, quem começou), afastados, rompidos (a ruptura: quando, por quê, de quem foi o passo), reconciliação.
- **A tela** (lista e ficha): o tipo no rótulo e o estado à direita ("melhor amiga · há 7 anos", "amiga na escola · em conflito", "ex-amiga · não se falam", "rival na escola · em tensão", "irmã · romperam"); a ficha diz por quê ("A amizade acabou numa briga por causa de um segredo que vazou."; "Vocês têm muita história juntos, mas estão brigados — por causa de...").
- **Como uma amizade nasce:** a ficha de um colega/conhecido explica o caminho (conviver abre a chance; um gesto correspondido — chamar para algo — faz acontecer; afinidade, tempo e temperamento decidem). Não é XP: nos testes, 3 anos de tentativas entre colegas viram amizade em parte das vidas, não em todas.
- **Bugs corrigidos:** (1) quem só estava **saindo** tinha a proximidade puxada para o envolvimento (~70) e virava "próximo"; agora sobe devagar e para no meio; (2) o **término** fazia do ex um "amigo" se a proximidade passasse de 45; agora o ex é ex (amigo de antes do romance volta a ser amigo de outros tempos); (3) o interesse romântico aparecia como "conhecida por aí" em "Gente que passou"; agora é "interesse romântico, na escola", no dia a dia; a origem romântica (app, noite, viagem) é dita como foi.
- **Gramática contextual** (`conflitos.ts`): discordar, cobrar (só com motivo), pedir desculpas (aceitas, em parte ou recusadas — pelo temperamento, gravidade, confiança e quantas vezes já foi preciso), fazer as pazes (só com ruptura; recusa espera 24 meses), encerrar amizade (só com amigo), provocar (só o rival). Depois de uma ruptura, os gestos de sempre somem — fica fazer as pazes, responder, o prático (filhos em comum, o médico), tomar distância. Uma discussão por ano com a mesma pessoa: não é farm.
- **Conflito com consequência** (`lacos.discutir`): resolve (tensão cai, confiança sobe — "falaram francamente"), desconforto (dito, sem fim), briga (conflito aberto), ruptura (entre amigos, quando já havia pouco a perder). Nos testes, o mesmo assunto com alguém de bom gênio resolve muito mais do que com alguém de pavio curto.
- **As pessoas agem:** além dos chamados que já existiam (pedir ajuda, convidar, cobrar a distância, interesse...), quem começou a briga e tem bom gênio pede desculpas; quem foi ferido volta ao assunto (cobrança); o ex-amigo reaparece 5+ anos depois ("lembrei de você hoje"). Só a partir dos estados novos: os fluxos antigos não mudam de comportamento. Ao longo do ano, o conflito que não era grave esfria; o que segue fervendo entre amigos endurece em ruptura; a implicância com briga de verdade vira rivalidade.
- **História:** marcos de começo, amizade, apoio, conflito, ruptura, reconciliação e reaparição; a ruptura não apaga o passado.
- **Save:** `estagio` aceita `ex_amigo`/`rival`; `conflito`, `ruptura`, `reconciliacao`, `proxAno` são opcionais e validados; saves antigos abrem sem nada disso (estado "estável"). Por isso **v20 continua v20**.
- **Testes** (`fechamentoMundo.test.ts`, os 12 casos da Parte 27 + o teste fundamental): a mesma proximidade 80 é irmã, melhor amiga, namorado e ex, quatro rótulos diferentes e nenhum "próximo"; colega → amizade possível; romance não vira amigo íntimo; interesse não correspondido; discussão depende do temperamento; amizade encerrada guarda a história; desculpas com três desfechos; ações contextuais; sem farm; ex-amigo reaparece; save/reload; sucessão (a herdeira mantém a parceria, os irmãos e a mãe que morreu — com a briga que ficou); migração (amizades ficam, longe, e esfriam); família continua família.

### 27.11 Cães e gatos — segundo passe

`ui/avatar/caesEGatos.tsx` foi reescrito por **famílias morfológicas**: retriever, pastor, terrier, galgo, spitz, braquicefálico, molosso, "salsicha" e o vira-lata (o mais comum, que herda cada traço de uma de duas famílias possíveis para o porte). A família amarra porte, crânio (larga, cunha, redonda, quadrada, fina), focinho, orelha (em pé, dobrada, caída, longa, rosa), dorso (reto, inclinado do pastor, arqueado do galgo), peito e cintura, pernas com coxa e jarrete, cauda (enrolada do spitz, bandeira do retriever, espanador do pastor, fina do galgo) e pelagem (curta, longa, dura com barba, densa com juba) — e as cores da família. Gatos: tipos (doméstico, oriental, persa, peludo grande, britânico) e três posturas de corpo inteiro (sentado, deitado em "pão", em pé). Teste de cor fixa: com nome, raça, descrição e cor removidos, os 24 cães e 24 gatos continuam indivíduos diferentes; e o teste novo exige ≥6 famílias em 60 cães e as quatro posturas nos gatos.

### 27.12 Níveis de suporte (honesto)

- **193 países no catálogo** — existem no mundo: nome, região, moeda, economia; são origem de alguém, destino de viagem, a lista.
- **28 países vivíveis** — perfil completo no modelo do jogo (cidades e divisões, economia, trabalho, escola, política, farda, esporte com clubes reais, saúde, migração, herança, nomes, regras legais onde mudam).
- **Brasil** — camadas extras (117 cidades, 94 clubes, partidos reais, o `cotidiano`, os textos locais).
- **Regras por divisão** — só a carteira de motorista (EUA, Canadá, Austrália) e o São João/seca (Nordeste). O resto das regras estaduais (idade escolar nos EUA, regras do México) é nacional, por abstração declarada.
- **Textos locais** — fora do Brasil, a forma universal é a regra; variantes só onde há uma instituição real e conhecida (YMCA, bar exam, SQE...).

### 27.13 Pendências reais

1. Carteira de motorista e registros profissionais atravessam a fronteira sem revalidação.
2. Regras de carreira militar brasileiras (reserva aos 35 anos de serviço, temporário de 8 anos) valem como abstração em todo país.
3. A justiça penal (regimes fechado/semiaberto) é o modelo brasileiro com textos neutros.
4. Rede própria de NPCs (os amigos do herdeiro) não é modelada: a sucessão preserva família, parceria e o vínculo com quem morreu.
5. O `motor` está a 67 kB do limite: o próximo pacote grande deve modularizar.
6. Calibração das frequências novas (emigração de famílias, rivalidade, reaparição de ex-amigos) fica para a simulação de 1.000 vidas.
