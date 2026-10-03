# Fontes e abstrações — perfis da Ásia

Arquivo: `src/motor/mundo/paises/asia.ts` (JP, CN, IN, KR). Cada perfil cita as fontes em `fontes`. Abaixo está o que foi abstraído.

## Convenções comuns
- O dinheiro está em moeda local por mês.
- `impostoRenda`: onde há um limite legal claro, usa-se esse limite (China: ¥5.000; Índia: ₹12 lakh/ano no regime novo). No Japão e na Coreia, as deduções escalonadas tornam o limite legal enganoso. Lá, isenção e alíquota foram **ajustadas à carga efetiva** em dois salários típicos (ver por país).
- Bônus anuais (Japão, Coreia) são costume, não lei: `mesesPagos` fica em 12.
- Romanização: pinyin sem tons (China); Hepburn sem mácrons, como nos passaportes (Japão); Romanização Revista com hífen nos prenomes (Coreia). Os **sobrenomes** coreanos seguem a grafia consagrada (Kim, Lee, Park), e não a RR estrita (Gim, I, Bak).
- Pesos de sobrenome: o motor sorteia da lista de modo uniforme. Onde a concentração real é grande, os sobrenomes mais comuns aparecem repetidos (`rep`):
  - Coreia: Kim 21,5%, Lee 14,7%, Park 8,4% (Censo de 2015).
  - China: Wang, Li e Zhang somam ~20% (Ministério da Segurança Pública, 2020).
- Os sobrenomes de cada grupo **não se repetem entre grupos do mesmo país**. Isso existe porque `grupoPorSobrenome` usa o sobrenome para achar o grupo da família.
- **Atenção ao motor:** em `grupoDeNomes`, um grupo pesa 6× nas suas divisões e 0,35× fora delas. Os `peso` deste arquivo são as fatias nacionais reais (Censo). Na Índia, com 13 grupos, isso dá pouca predominância local: em Kerala, por exemplo, ~60% dos nascidos sairiam de grupos de fora. No Japão, só ~17% dos nascidos em Okinawa teriam sobrenome okinawano. Uma regra mais forte para países com muitos grupos regionais (por exemplo, 0,05× fora da divisão) resolveria isso sem distorcer os pesos.

## Japão
- Fontes:
  - MHLW: salário mínimo do ano fiscal 2025 (média ¥1.121/h × 173,3 h ≈ ¥194.300/mês) e salários por província (Basic Survey on Wage Structure 2024).
  - Pobreza relativa: 15,4%.
  - Código Civil, arts. 762, 887–890, 900, 958-2, 959 e 1042.
  - Lei de Eleições para Cargos Públicos, art. 10.
  - MEXT (mensalidades); JASSO; OIT 2018 (informalidade de 18,7%).
- Trabalho:
  - Contribuições: pensão de 9,15%, saúde de ~5% e seguro-emprego. O teto é a remuneração-padrão máxima da pensão (¥650.000).
  - Imposto: isenção de ¥140 mil e 16%. Isso reproduz ~7% de carga com ¥300 mil/mês e ~11% com ¥600 mil (imposto nacional + 10% de imposto de residente).
  - Rescisão: **0**. A lei só exige 30 dias de aviso. O *taishokukin* é costume de empresa. A proteção real é a dificuldade jurídica de demitir (Lei de Contratos de Trabalho, art. 16).
- Educação: `exame_nacional` pelo Exame Comum (Kyotsu Test), que é a 1ª fase das nacionais e públicas. As privadas, com ~75% dos alunos, também selecionam por candidatura.
- Política:
  - Todos os seis níveis existem e são eleitos diretamente. Os conselheiros da Câmara alta entram como `senador`.
  - O mês do jogo é abril, o das eleições locais unificadas (2027).
  - A última eleição da Câmara foi em 8/2/2026.
- Militar: Forças de Autodefesa (voluntárias). A Força Aérea deve passar a "Força Aérea e Espacial de Autodefesa" até o ano fiscal 2027; manteve-se o nome atual.
- Sucessão: iryubun de 1/2. O cônjuge leva 2/3 contra os ascendentes. Separação de bens.
- Nomes:
  - Grupo nacional (rankings Meiji Yasuda/Benesse).
  - Grupo de Okinawa: mesmos prenomes, sobrenomes ryukyuanos (Higa, Kinjo, Oshiro...).
  - Não modelados: os zainichi coreanos e os ainus (muitos usam nomes japoneses no registro).

## China
- Fontes:
  - Constituição de 1982 (arts. 1–3, 97–98); Lei Eleitoral dos Congressos Populares (art. 2).
  - Código Civil de 2020 (arts. 1062, 1127–1130, 1141, 1153, 1160).
  - Lei do Contrato de Trabalho (art. 47); decisão da APN de 13/9/2024 sobre a idade de aposentadoria; Lei do Serviço Militar (2021).
  - NBS (salários provinciais de 2023); OIT 2018 (informalidade de ~54%).
  - Ministério da Segurança Pública (nomes); CSL 2026.
- Divisões: nível provincial, incluindo as municipalidades e regiões autônomas, com os códigos ISO 3166-2:CN. Hong Kong, Macau e Taiwan ficam fora do perfil.
- Salário mínimo: **omitido**, porque não há um nacional; é provincial (de ~¥1.700 a ¥2.740).
- Contribuição: 10,5% de seguros sociais + 5–12% do fundo de habitação, que é uma poupança compulsória e foi incluído porque sai do salário. O teto (300% da média local) varia por cidade e foi omitido.
- Previdência:
  - Idade de [63, 55]. As mulheres têm duas idades legais (operárias 50→55, colarinho-branco 55→58); usa-se 55.
  - 20 anos mínimos (a partir de 2039).
  - O regime rural/de residentes, que paga muito menos, não é modelado.
- Política (descrição neutra):
  - Só os deputados aos congressos populares de condado/distrito e de município rural são eleitos diretamente. Eles são o único nível no jogo (`vereador`, 5 anos, 18 anos de idade).
  - Os congressos provinciais e o Congresso Nacional são eleitos indiretamente.
  - Prefeitos e governadores são escolhidos pelos congressos.
  - Não há senado.
  - `geral` aponta o ciclo (indireto) do Congresso Nacional, 2028, só para preencher o tipo.
- Militar: a lei prevê alistamento obrigatório masculino aos 18 e um sistema "de voluntários e conscritos". Na prática, as vagas são preenchidas por voluntários. Por isso o serviço é `seletivo` (registro obrigatório, ingresso seletivo).
- Educação:
  - Gaokao (`exame_nacional`).
  - `cotas: true` pelos planos especiais de vagas para condados rurais pobres e pelos bônus para minorias.
  - Bolsa nacional de auxílio sem teto único: aproximada em 0,5 do mínimo provincial por pessoa.
- Sucessão: sem legítima geral (art. 1141 só protege o herdeiro incapaz e sem renda). Os pais concorrem também na 1ª ordem, o que não é modelado. Há comunhão de bens adquiridos e não há imposto sobre herança.
- Nomes:
  - Grupo han, com prenomes por geração (ex.: Jianguo/Xiuying antes; Haoyu/Ruoxi agora).
  - Grupo uigur em Xinjiang (prenome do pai como sobrenome, grafia latina corrente). As listas uigures não distinguem gerações, porque não achei estatística pública por coorte.
  - Outras minorias com nomes próprios (tibetanos, mongóis, cazaques) não são modeladas. As maiores minorias (zhuang, hui, manchus) usam majoritariamente nomes han.

## Índia
- Fontes:
  - Constituição (arts. 84, 173, 243V; reservas); RTE Act 2009.
  - Hindu Succession Act 1956; Shariat Application Act 1937; Indian Succession Act 1925.
  - Os quatro Labour Codes (em vigor desde 21/11/2025); EPFO/ESIC; Orçamento 2025-26.
  - Censo de 2011 (línguas e religiões); MoSPI (NSDP); Banco Mundial 2025; ILOSTAT (~88% informal).
  - NTA/CUET; ISL 2025-26.
- Salário mínimo: **omitido**. O piso nacional do Code on Wages ainda não foi fixado; o antigo, de ₹176/dia, era só indicativo; cada estado fixa os seus. O teto da bolsa (`0,6`) foi calculado sobre um piso estadual típico de ~₹12 mil/mês.
- Trabalho:
  - Rescisão: ~1 mês por ano (15 dias de indenização + gratuity de 15/26 de mês por ano, esta só após 5 anos). Vale só para o emprego formal.
  - Sem seguro-desemprego geral.
  - EPS aos 58, com reposição baixa (teto de ₹15.000).
  - O bônus estatutário (8,33%) não foi modelado, porque é restrito a salários baixos em empresas com 20+ empregados.
- Educação:
  - `exame_nacional` = CUET (universidades centrais). JEE (engenharia), NEET (medicina) e notas do 12º ano em parte das estaduais ficam no comentário.
  - Reservas SC/ST/OBC/EWS (`cotas: true`).
- Política:
  - Vereador (corporação municipal), MLA (Vidhan Sabha) e MP (Lok Sabha).
  - Omitidos: o prefeito (eleito diretamente só em alguns estados, como UP e MP, e indiretamente nas grandes metrópoles), a Rajya Sabha (indireta) e o governador (nomeado). O ministro-chefe é parlamentar.
  - Eleições estaduais e locais são escalonadas; usou-se um ciclo de 5 anos.
- Militar: voluntário. O Agnipath recruta a partir de 17,5 anos (arredondado para 18). A polícia é estadual.
- Sucessão (abstração pesada):
  - Há uma lei pessoal por religião. O perfil aplica a todos a regra hindu (~80% da população): Classe I por cabeça, liberdade de testar, vacância ao governo, sem comunhão.
  - A lei muçulmana (quotas fixas, testamento limitado a 1/3) e a cristã/parsi (cônjuge 1/3) ficam só documentadas no cabeçalho.
  - A mãe concorre com a viúva e o pai não, por isso `conjugeComAscendentes` = [1/2, 1/2].
- Nomes: 13 grupos.
  - Hindi (UP/BR/DL/JH); muçulmano do norte/Decão (nomes urdus); bengali; muçulmano bengali; marati; guzerate; tâmil; télugo; canarim; malaiala (hindus e cristãos); mappila (muçulmanos de Kerala); punjabi (sikhs e hindus); Goa (católicos com nomes portugueses e hindus concanis).
  - Os pesos seguem o Censo de 2011.
  - **Tâmeis:** muitos não têm sobrenome de família; usam a inicial do pai ("R. Karthik"). O jogo abstrai num nome fixo pela linha paterna, tirado dos prenomes masculinos que funcionam como patronímico (e de poucos títulos ainda usados, como Iyer e Nadar).
  - Sikhs: Singh/Kaur são títulos por gênero e o sobrenome do jogo é herdado e sem gênero. Por isso usam-se os nomes de clã (Gill, Sandhu, Dhillon...).
  - Não há estatística oficial nacional de prenomes. As listas vêm de uso corrente documentado.
  - Grupos sem cidade no perfil não foram modelados: odia, assamês, os povos do Nordeste e cristãos fora de Kerala e Goa.
  - Sobrenomes de casta aparecem misturados com os de outras comunidades (incluindo OBC e dalits: Paswan, Jatav, Kamble...), sem estereótipo.

## Coreia do Sul
- Fontes:
  - Código Civil (arts. 830–831, 1000–1003, 1009, 1058, 1112); Tribunal Constitucional, 25/4/2024.
  - Salário mínimo de 2026 (₩10.320/h; ₩2.156.880 em 209 h).
  - NPS 9,5% e teto de ₩6.590.000 (jul/2026); NHIS de 3,595%.
  - Lei de Garantia dos Benefícios de Aposentadoria (toejikgeum, 30 dias por ano); Lei do Serviço Militar; NEC (eleições locais de 3/6/2026).
  - KOSTAT (pobreza, Censo de 2015); ILOSTAT (26,6% informal); K League 1 2026.
- Divisões: ISO 3166-2:KR. Gangwon (42) e Jeonbuk (45) viraram "províncias especiais autônomas", mas os códigos foram mantidos.
- Imposto: isenção de ₩2,5 milhões e 18%. Isso reproduz ~4% de carga com ₩3,5 milhões e ~12% com ₩7 milhões (6–45% + 10% local, depois das deduções).
- Educação:
  - Suneung (`exame_nacional`). A maioria das vagas vem da via *susi* (histórico escolar), o que fica no comentário.
  - `cotas: true` pela "seleção de equilíbrio de oportunidades".
  - Bolsa Nacional até o 9º decil (~1,4 salário mínimo por pessoa).
- Política:
  - Unicameral: sem `senador`.
  - Candidatura aos 18 anos desde 2022.
  - O mês do jogo é junho (eleições locais). As legislativas são em abril (2028).
- Militar: `obrigatorio`, aos 18 anos; 18 meses no Exército (20 na Marinha, 21 na Força Aérea). O Gimcheon Sangmu (clube do Exército) entra entre os clubes.
- Sucessão: o cônjuge leva 1,5 vez a parte de um filho. Isso foi abstraído como concorrência por cabeça; com os pais, o cônjuge fica com 3/7 ou 3/5. Reserva de 1/2. Separação de bens.
- Nomes: um grupo nacional (país homogêneo). Prenomes por geração (Yeong-su/Yeong-ja → Ji-hun/Ji-eun → Min-jun/Seo-yeon).
