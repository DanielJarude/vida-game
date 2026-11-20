# VIDA 29 — vida rural para gente comum, apostas com consequência, mercado e boatos que andam sozinhos, a casa da época, o tênis por superfície e a aparência consertada

Branch `claude/vida29-rural-apostas-correcoes` (a partir de `91f7369`, a VIDA 28 publicada). Um agente só, trabalho sequencial.
Este relatório segue os 17 itens pedidos no §14 do prompt.

## 1. Resumo da atualização

- **Campo:** a propriedade abre numa **Visão geral** em linguagem simples. Mostra a situação em uma frase, os números do ano, "o que fazer agora" com botão, e quadros sobre a terra, a água, o pasto (em animais, não em "UA"), a saúde dos animais, a plantação, a gente para o trabalho, as máquinas, quem administra, o clima e o seguro, o dinheiro e as dívidas.
  - Cada quadro diz o que o indicador significa, como afeta a propriedade, o que acontece se piorar e o que fazer, com custo e prazo.
  - As abas ganharam nomes do dia a dia: Visão geral, Plantação, Animais, Construções e equipamentos, Administração, Finanças.
  - Há um modo simples e um detalhado, que mostram os mesmos dados (o detalhado acrescenta os números técnicos), e uma dica curta na primeira visita a cada parte.
- **Administração com efeito real no motor:**
  - quem cuida: você, caseiro, gerente ou administradora;
  - equipe fixa registrada, ou diaristas na safra;
  - máquina por empreitada, que dá tecnologia sem comprar trator;
  - assistência técnica (Emater no pequeno);
  - forma de vender: na colheita, em contrato antecipado, guardada até a entressafra ou na feira;
  - leilão de animais.
- **Comunidade do campo:** três decisões que mudam o motor — o mutirão do vizinho, a cerca da divisa e a estrada cascalhada em comunidade.
- **Apostas:** consequências em degraus na família. Alguém em casa repara; o dinheiro das contas vira problema da casa; três anos pesados viram ultimato e os filhos adultos se afastam. Jogar pouco não vira assunto.
- **Mercado autônomo:**
  - e-sports: equipes fixas por divisão, elenco com nome (nick, nome, função, idade, nível) e uma janela por temporada com vendas, dispensas, aposentadorias e concorrência pela sua função;
  - automobilismo: mercado de pilotos — o companheiro sobe ou é trocado, o rival que sobe sai do seu grid e volta quando você o alcança, e o grid tem suas trocas;
  - uma proposta nunca vem da própria equipe.
- **Boatos:** as notícias da sua vida circulam entre as pessoas.
  - A velocidade depende do círculo, da relevância, da época e do jeito de quem conta, e às vezes a versão chega aumentada.
  - Quem não devia saber e soube por outros reage como enganado.
  - A ficha mostra o que cada pessoa sabe de você, e a conversa puxa o assunto e desfaz o exagero.
- **Ciúme:** o aviso no namoro só aparece com motivo registrado.
- **Casa da época:**
  - cozinha com fogão a lenha e pia antiga antes de 1960;
  - banheira de pés antes de 1950;
  - lampião a querosene;
  - piso e luz de origem pelo ano em que se chegou à casa;
  - acabamentos com anos de existência — o motor recusa o anacronismo.
- **Tênis:** cada torneio é jogado em quadra dura, saibro ou grama, com aptidão pelos atributos e vitórias e derrotas por superfície.
- **Aparência e joalheria:**
  - a lupa da orelha desenha o brinco certo, e por cima do cabelo;
  - Acessórios e joias voltou a ser categoria própria, com todas as partes do corpo;
  - a joalheria tem categorias e tipos.

## 2. Sistemas auditados

| Frente | Situação antes (classificação) |
|---|---|
| Rural (VIDA 18/19) | **Parcial**. O motor é rico: 8 tipos, 16 culturas, 10 rebanhos, 20 estruturas, 8 máquinas, clima, crédito do Plano Safra, CAR e seguro com PSR. Mas a tela era técnica ("Solo cansado — pede correção", "Pasto comporta N UA", "Tecnologia x de 3") e não havia trabalhadores, delegação, empreitada nem formas de venda. |
| Apostas e loterias (VIDA 18/19) | **Implementado, com consequências rasas**. Já existiam as seis loterias da Caixa com probabilidades reais, a Mega da Virada, bolões, esportivas, turfe, bingo, cassino proibido no Brasil, autoexclusão, limite e dependência pelos "anos pesados". O único efeito na família era a tensão +8 na parceria depois de dois anos pesados. |
| Mercado de e-sports | **Ausente**. Os nomes de equipe eram sorteados a cada proposta (a mesma "equipe" podia aparecer em degraus diferentes, e a proposta podia ser da própria equipe). Não havia elenco. |
| Mercado do automobilismo | **Parcial**. As equipes eram fixas, mas o companheiro e o rival eram permanentes, e a proposta "melhor" na mesma categoria podia ser da própria equipe. |
| Boatos / circulação de informação | **Ausente**. Só existiam o boato que o jogador espalha (convívio) e o "sabe" do protagonista sobre os NPCs. |
| Aviso de ciúme | **Defeituoso**. Disparava pela tensão ≥ 35, muitas vezes herdada de antes do namoro, e o `par_ciume` não tinha condição. |
| Casa e cotidiano da época | **Parcial**. A rua e a fachada já eram da época (VIDA 28). O interior era o de hoje: fogão a gás, box, lâmpada e acabamentos modernos em 1915. |
| Tênis | **Sem superfície**. O laço de torneios permitia acrescentá-la sem reconstruir o circuito. |
| Brincos | **Defeituoso**. A lupa da orelha usava só dois desenhadores, e 77 dos 85 modelos saíam como o aro genérico; o cabelo era desenhado por cima. |
| Acessórios na Aparência | **Regressão**. A VIDA 24 tinha dividido os acessórios entre Roupas e Piercings, e as partes sem item sumiam. |
| Joalheria | **Parcial**. Tinha busca e filtros, mas não tinha categorias. |

## 3. Funcionalidades existentes preservadas

- Toda a simulação rural da VIDA 18/19 continua igual para saves antigos. Sem `admin29`, `equipe29` etc., a competência continua 45, nenhuma linha de custo nova aparece e o resultado é o mesmo.
- Continuam valendo: os cálculos de safra e rebanho, o clima, o Plano Safra, o CAR, o PSR, a "hora de vender", o haras, a herança da terra, o arrendamento e as festas.
- As loterias, a Mega da Virada, as esportivas, o turfe, o bingo, a autoexclusão, o limite, a dependência e a conversa dos dois anos pesados foram mantidos. Os degraus novos se somam.
- Mantidos também:
  - o elenco e o mercado do futebol e quadra (VIDA 28);
  - as relações 28;
  - o convívio;
  - o "sabe" dos NPCs;
  - os sistemas sociais e políticos das Eras;
  - a rua da época;
  - o circuito de tênis (pontos, ranking, porte dos torneios).
- O save continua na v20: só há campos opcionais novos e nenhuma migração.

## 4. Funcionalidades novas implementadas

Cada item abaixo tem teste.

1. `src/motor/v18/rural/diagnostico29.ts`: diagnóstico com 11 indicadores, decisões recomendadas e a frase de situação.
2. `fazenda18.ts`: quem administra (`quemAdministra`, `competenciaDaGestao`), mão de obra (`trabalhoNecessario`, `maoDeObra29`, salário rural), empreitada (tecnologia 1,2), assistência (+8 de condução), venda (`efeitoDaVenda29`) e a comunidade (`comunidadeRural29`, `vizinhosAjudam29`/`vizinhosFrios29`).
3. `acoes18.ts`: as ações `admin29`, `equipe29` (contratação e rescisões pagas), `empreitada29`, `assistencia29`, `venda29` e `leilao29`.
4. `Campo18.tsx`: Visão geral, quadros explicados, modo simples ou detalhado, dicas com "Entendi", Administração, empreitada em Construções, leilão em Animais.
5. Apostas: `consequenciasNaFamilia29` e os acontecimentos `apo_notou29`, `apo_contas29` e `apo_ultimato29`.
6. E-sports: `equipesDoCenario29`, `garantirElencoEsports29` e `mercadoEsports29`, com a tela "O elenco e o mercado". Automobilismo: `mercadoDePilotos29` com `rivalCat29` e a tela "O mercado de pilotos".
7. `sistemas/boatos29.ts`: notícias, circulação, reação, "O que sabe de você" na ficha e a cena `soube29` na conversa.
8. `motivoDeCiume` (relacoes28), usado no celular (`mensagens17`) e em `par_ciume`.
9. Casa da época:
   - `acabamentoNoAno` e `desde`/`ate` nos acabamentos;
   - pisos `vermelhao` e `tabuado`, luz `lampiao`;
   - `acabamentoDeOrigem(…, ano)`;
   - os fixos `_bancada_antiga`, `_fogao_lenha` e `_tina`;
   - a cena com `ano`.
10. Tênis: `superficieDoTorneio29`, `aptidaoNaSuperficie29`, `superficies29` na temporada e a melhor superfície na linha do ano.
11. Aparência e joalheria:
    - lupa com `BrincoDoRetrato`;
    - categoria "Acessórios e joias" com todas as partes;
    - `categoriasDeJoia29` (Brincos, Colares e correntes, Pulseiras, Anéis, Relógios, Piercings, Tornozeleiras) e os tipos;
    - busca "em <categoria>";
    - memória da categoria ao voltar.

## 5. Problemas encontrados

- Os brincos saíam iguais na lupa da orelha, e o cabelo os cobria.
- Os acessórios sumiram da Aparência.
- A joalheria não tinha categorias.
- O ciúme aparecia logo no começo do namoro.
- Uma proposta podia vir da própria equipe, e o nome da equipe mudava entre degraus.
- O interior da casa era anacrônico.
- A tela do campo era técnica demais.
- O motor rural não tinha trabalhadores nem delegação.
- **Achado durante os testes:** o extrato podia gravar −0, e o save reaberto voltava 0. Ninguém via o problema, mas o teste de reabertura (rework1205) quebrou quando a simulação mudou de caminho.
- **Testes frágeis**, que dependiam do caminho exato da vida sorteada:
  - rework1241 — um filho de 33 anos em casa;
  - rework75 — a NPC mudava de cidade;
  - sucessão (motor e tela) — um neto apontava para um filho removido;
  - vida17 — fios de mensagem antigos;
  - mundo — um empréstimo grande distorcia a tolerância do câmbio;
  - vida129Presidencia — as 12 tentativas tinham o mesmo estado do gerador.

## 6. Causas-raiz

- **Brincos:** `OrelhaDePerto` desenhava só `BrincoNovo` e o desenho legado. Os 77 modelos do catálogo `joias20` caíam no aro "simples", e o lóbulo era desenhado antes do cabelo.
- **Acessórios:** a divisão de categorias da VIDA 24 filtrava as partes sem item.
- **Ciúme:** o gatilho era a tensão ≥ 35, que podia ser herdada de antes do namoro, e o `par_ciume` não tinha condição nenhuma.
- **Propostas:** `criarProposta` sorteava `nomeDeEquipe25` com um índice livre de 0 a 1000. A lista de equipes não era estável e não excluía a equipe atual. No automobilismo, `propor(cat, true)` sorteava entre as três primeiras da categoria, incluindo a sua.
- **Casa:** `acabamentoDeOrigem` e os fixos da disposição não recebiam o ano.
- **Extrato:** `r2 = Math.round(x*100)/100` devolve −0 para um resto negativo minúsculo.
- **Teste da convenção:** `structuredClone(BASE)` copiava o mesmo `v.rng` nas 12 tentativas. Mudar só o `v.id` não muda o sorteio.

## 7. Correções realizadas

Todas na causa:

- A lupa usa o desenhador do retrato e desenha o lóbulo depois do cabelo. Os 85 modelos agora dão 85 desenhos; antes eram 8. Isso foi confirmado em folha de contato e em teste.
- A Aparência ganhou a categoria "Acessórios e joias" com todas as partes.
- A joalheria tem categorias e tipos lidos do próprio item: nenhum produto fica sem categoria, e nenhuma categoria aparece vazia. "Conjuntos" não existe como produto no catálogo e por isso não aparece.
- `motivoDeCiume` é a única regra para o aviso, usada nos dois lugares que o disparam.
- Propostas:
  - as equipes do cenário são fixas por jogo e degrau, sem repetir entre degraus;
  - a proposta sorteia na lista e exclui a equipe atual, gastando o mesmo número aleatório de antes;
  - no automobilismo, a proposta na mesma categoria exclui a própria equipe.
- Os acabamentos e os fixos recebem o ano; o motor recusa a reforma anacrônica.
- `r2` normaliza −0 para 0.
- Os testes frágeis agora isolam o cenário daquilo que não testam:
  - a descendência inteira sai;
  - os fios antigos saem;
  - o teste do câmbio começa sem dívidas;
  - a pessoa fica na cidade;
  - cada tentativa da convenção tem o seu acaso.

  Nenhuma expectativa foi relaxada: as asserções continuam as mesmas.

## 8. Integrações entre sistemas

- **O campo e a conta:** a equipe, a empreitada, a assistência, a feira e a administradora entram como linhas do ano em `custosFixos` e na mesma conta de sempre. Contratação, rescisão e leilão saem e entram pelo extrato.
- **O campo e o Plano Safra:** o contrato antecipado tira a safra da "hora de vender".
- **O campo e a comunidade:** o mutirão muda a falta de diarista no motor; a estrada acrescenta a estrutura "estradas", que reduz a perda na enchente.
- **Os boatos e a vida:** saem da própria História (as entradas de marco e biografia), mudam proximidade, confiança e tensão, e ficam na história da relação. Alimentam a ficha e a conversa. A fama põe a notícia grande no jornal ou nas redes, conforme a época.
- **As apostas e a família:** os degraus usam a conta, as dívidas em atraso, quem mora junto, a parceria e os filhos. Abrem a autoexclusão e a terapia, que já existiam.
- **O mercado e a carreira:** no e-sports, a concorrência pela sua função muda a titularidade do ano seguinte, e o emprego, o contrato e a História usam o mesmo nome de equipe. No automobilismo, o rival entra ou sai do grid conforme a categoria em que corre.
- **A casa e a época:** a cena, a reforma e o conforto (o nível de origem pela época) leem o ano.
- **A loja e a aparência:** comprar põe o item em uso, a Aparência mostra e troca, e o save e o recarregamento mantêm tudo. Verificado no app de verdade (§12).

## 9. Testes executados e resultados

**Testes novos (VIDA 29), todos passando:**

| Arquivo | Testes |
|---|---|
| vida29Rural | 13 |
| vida29Trajetoria | 1 (a trajetória inteira do sítio pela virada de ano) |
| vida29Apostas | 4 |
| vida29Mercado | 4 |
| vida29Boatos | 4 |
| vida29Tenis | 3 |
| vida29Ciume | 3 |
| vida29Aparencia (tela) | 3 |
| vida29Campo (tela) | 3 |
| vida29Joalheria (tela) | 3 |
| vida29Epoca (tela) | 4 |

**Suíte completa:** em 10 lotes, ver os números finais abaixo.

- Typecheck: `tsc --noEmit` passou (rc=0).
- Build: passou. Maior pacote: Jogo com 798,6 kB, abaixo do limite de 800 kB.

Os números finais da suíte estão em "Fechamento".

## 10. Testes que não puderam ser concluídos e motivos

Cinco testes estouram o tempo-limite na suíte em lotes. Nenhum é regressão:

- **Já estouravam na base (VIDA 28):**
  - `fechamentoMundo` "4. a mesma discussão" (60 s);
  - `fixPosPlaytestHumano` C (cirurgia);
  - `motor.test` "nenhum acontecimento usa linguagem de escolha" (60 s; a mesma família do "regra de agência");
  - `profissao` "com clima péssimo, cortes acontecem mais" — estourou também na base, medido nesta máquina.
- **No limite também na base:** `rework115Esportes` "copas" leva 19,8 s na base e passa sozinho nesta branch.

Uma lentidão real foi introduzida e corrigida: a circulação de boatos tinha custo quadrático, e rework1235, rework122, pacotePlaytest e profissao "treinar dobrado" passaram a estourar o tempo. A rede do ano agora é calculada uma vez e cada círculo usa a melhor boca (mesma regra, mesmo resultado). Os quatro voltaram a passar.

## 11. Compatibilidade com saves antigos

- Os campos novos são todos opcionais: `admin29`, `equipe29`, `empreitada29`, `assistencia29`, `venda29`, `rivalCat29`, `mercado29`, `boatos29` e `superficies29`.
- Sem eles, o resultado do motor é o de antes. Há teste da competência 45 e da ausência de linhas novas.
- O save fica na versão 20.
- Os testes de reabertura passam: vida29Trajetoria, rework1205 (o −0 corrigido), sucessão e mundo.

## 12. Revisão visual

Feita no build de produção local (preview), com Playwright.

- **Campo** (`campo.mjs`, a 1440 px e a 390 px):
  - seis abas, sem rolagem horizontal e sem erros de página;
  - a dica some com "Entendi";
  - o modo detalhado mostra "Nos números" e as UA;
  - escolher a administradora atualiza a placa.
- Correções feitas a partir das fotos:
  - o botão "Fazer" ocupava meia linha;
  - os valores apareciam sem arredondar ("R$ 116.268");
  - aparecia "umas 1 pessoa".
- **Fluxo do brinco** (`loja.mjs`): joalheria, categoria Brincos (18 produtos na primeira página), experimentar no provador, comprar ("Comprado — já está no seu patrimônio", e o cartão passa a "Guardar"). Na Aparência, em Acessórios e joias, a figura mostra `simples`; trocar pela argola grossa leva a figura a `argola_grossa`; depois de recarregar a página, continua `argola_grossa`.
- Lupa: folha de contato com 85 desenhos distintos.

## 13. Situação do build

- `tsc --noEmit`: rc=0.
- `vite build`: rc=0. Os maiores pacotes: Jogo 798,6 kB, motor-textos 794,0 kB, motor 775,9 kB, motor-carreira 771,0 kB — todos abaixo do limite de 800 kB.
- O campo continua num pacote carregado sob demanda.

## 14. Commit final · 15. Publicação · 16. URL de produção

- **Commit do código validado:** `661b2a9`, na branch `claude/vida29-rural-apostas-correcoes`. `main` e `claude/fix-pos-rework3-playtest` (a branch de produção do Cloudflare Pages) foram avançados até ele sem merge (fast-forward). Este relatório entra num commit só de docs, que não muda o build.
- **Publicação conferida:** https://vida-game.pages.dev/ serve o mesmo build validado — `/` e todos os JS e CSS, 186 de 186 arquivos com sha256 idêntico (index `index-C8miFNFE.js`).
- **Fluxos reais no site de produção:**
  - fumaça sem nenhum erro de página, a 1440 px e a 390 px, com os saves novos (campo e aparência) e um save antigo da VIDA 28 (1965);
  - campo: seis abas, diagnóstico com os quadros, troca para a administradora;
  - brinco: comprar, usar, trocar e recarregar, e a figura continua com o modelo escolhido.

## 17. Pendências reais

- **"Conjuntos" na joalheria:** o catálogo não tem produto-conjunto. A categoria não aparece, para não mostrar prateleira vazia. Depende de criar produtos-conjunto (brinco com colar etc.) no catálogo.
- **Loterias Timemania, Dia de Sorte, Super Sete e +Milionária:** não foram feitas. Cada uma pede uma escolha extra (o time do coração, o mês da sorte, as colunas, os trevos) no motor de conferência e na tela. As seis da Caixa que existem continuam completas e com probabilidades reais.
- **Aluguel de máquina sem operador:** não foi feito. A empreitada (máquina com operador, paga por hectare) cobre o caso do pequeno produtor. O aluguel puro dependeria de a equipe operar a máquina.
- **Logística e frete:** continuam embutidos no custo por hectare e no preço local. O armazém de terceiros cobra aluguel e frete, e a feira, banca e transporte. Não há rota nem distância.
- **Boatos:** circulam as notícias da vida do protagonista. A vida dos NPCs entre si continua resumida (`vidas19`): um NPC não espalha notícia de outro NPC.
- **Personalidade dos NPCs:** a VIDA 29 usa os traços que já existem (sociável, reservado, leal, rancoroso, generoso, carinhoso) na circulação e na reação aos boatos. Não foram criados medos nem objetivos novos.

## Fechamento — a suíte

Rodada final no código publicado (`661b2a9`), em 10 lotes:

- **3.242 de 3.247** testes passam.
- Os 5 que não passam são os estouros de tempo descritos no item 10: pré-existentes ou no limite na base, e nenhum é falha de asserção.
- As 13 falhas de asserção da primeira rodada (mais a do rework 12.4.1, vista antes) foram todas explicadas e corrigidas (itens 5–7) e conferidas contra a base `91f7369`.
