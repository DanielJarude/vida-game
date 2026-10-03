# Fontes e abstrações — América do Norte e Oceania

Perfis em `src/motor/mundo/paises/america-norte.ts` (EUA, Canadá, México) e
`src/motor/mundo/paises/oceania.ts` (Austrália, Nova Zelândia). Valores
monetários em moeda local por mês; referência 2025/2026.

## Estados Unidos (US)

- **Fontes principais:** DOL (FLSA, salário mínimo federal US$ 7,25/h; seguro-desemprego estadual); SSA (teto de 2026 US$ 184.500, idade plena 67, 40 créditos, nomes de bebês); IRS (dedução-padrão 2026, estate tax de US$ 15 mi); Constituição art. I e 17ª Emenda; Uniform Probate Code; Census Bureau (pobreza 2023, Census 2020, sobrenomes 2010); BEA (Regional Price Parities); College Board (Trends in College Pricing 2025); SFFA v. Harvard (2023); Selective Service; US Soccer; KFF (2025).
- **Abstrações:** quase tudo é estadual. Salário mínimo = o federal (≈ US$ 1.257/mês), embora ~30 estados tenham um maior. Imposto = dedução-padrão federal + 12% federal + ~5% estadual médio. Rescisão = 0 ("employment at will"). Cargos com mandatos/idades típicos (deputado estadual 2 anos, idade 21) — variam por estado. Eleição local em ano ímpar (padrão de várias cidades). Serviço militar "seletivo" pelo registro obrigatório no Selective Service, sem convocação.
- **Sucessão:** sem legítima dos filhos; a "elective share" do cônjuge (um terço na maioria dos estados) virou a legítima, só para o cônjuge. Meação falsa (os 9 estados de community property ficam de fora). Custo ~3% = probate; o estate tax quase nunca incide.
- **Universidade pública:** 0,4 da privada (0,27 contra a privada sem fins lucrativos; ~0,4 contra a média das privadas).
- **Nomes:** dois grupos — geral (SSA/Census, com sobrenomes de origem asiática e europeia) e hispânico (19%, CA/TX/FL/IL/NY/NJ).

## Canadá (CA)

- **Fontes principais:** ESDC (mínimo federal CA$ 18,15/h desde 1º/4/2026); CRA (CPP 5,95% até YMPE CA$ 74.600, CPP2, EI 1,63%, faixas de 2026); ESA 2000 de Ontário; Service Canada (CPP/OAS); Constitution Act 1867; Canada Elections Act s. 56.1; SLRA e FLA de Ontário; Code civil du Québec; Statistics Canada (MBM, anuidades); Canada Health Act; Retraite Québec e registros provinciais (nomes); Canada Soccer.
- **Abstrações:** sem salário mínimo nacional → campo omitido (o federal só vale para setores federais; os provinciais vão de CA$ 15 a 18/h). Rescisão = piso legal de Ontário (~0,3 salário/ano), sem o "reasonable notice" do direito comum. Sem exame nacional: o "exame" é o boletim do último ano. Senado nomeado e premiês indiretos → sem senador e governador. Informalidade sem série da OIT: 0,12 conservador.
- **Sucessão:** segue Ontário (cônjuge herda tudo sem filhos; parte preferencial com filhos). Meação verdadeira por causa da equalização do FLA (Ontário) e do patrimônio familiar (Quebec). Custo ~4% = ganho de capital na morte + probate.
- **Futebol:** a CPL é a 1ª divisão nacional; os clubes da MLS (binacional) são a elite de fato.
- **Nomes:** anglófono (78%, fora do QC) e francófono (22%, QC).

## México (MX)

- **Fontes principais:** CONASAMI (MX$ 315,04/dia em 2026; ZLFN MX$ 440,87); INEGI (UMA 2026, ENOE, Censo 2020); LFT (arts. 50, 76, 80, 87, 162); Lei do Seguro Social 1997 e reforma de 2020; Constituição (arts. 36, 51–58, 115, 116, 123); Código Civil Federal (arts. 1295, 1368, 1602–1636); CONEVAL 2024; Lei do Serviço Profissional de Carreira; Lei do Serviço Militar; FMF; SEP/CENEVAL.
- **Abstrações:** salário mínimo = zona geral × 30,4 dias (a ZLFN não é modelada). mesesPagos 12,6 = aguinaldo de 15 dias + prima vacacional. Rescisão: três meses + prima de antigüedad viram ~0,9 salário/ano. Sem seguro-desemprego federal → omitido. Aposentadoria: semanas mínimas em transição (875 em 2026 ≈ 17 anos). ISR: o subsídio ao emprego abstraído como isenção de ~MX$ 10 mil. Voto "obrigatório" sem sanção → falso. Serviço militar "seletivo" (sorteio da cartilla). Ingresso: cada universidade com seu exame (EXANI-II como referência).
- **Sucessão:** liberdade de testar com dever de alimentos (não modelado como legítima); cônjuge com a parte de um filho; metade com ascendentes; Beneficência Pública na vacância; meação pela sociedad conyugal.
- **Nomes:** grupo nacional (dois sobrenomes) e um pequeno grupo de Yucatán com os mesmos prenomes e sobrenomes maias ao lado dos hispânicos.

## Austrália (AU)

- **Fontes principais:** Fair Work Commission (Annual Wage Review 2025–26: A$ 1.004,90/semana desde 1º/7/2026); Fair Work Act s. 119; ATO (faixas 2025–26, Medicare levy, superannuation 12%); Services Australia (Age Pension 67, JobSeeker, Youth Allowance, HECS-HELP); Constituição e Commonwealth Electoral Act s. 245; Succession Act 2006 (NSW); ABS/ACOSS; Football Australia (A-League, Australian Championship 2025, NPL); registros de nascimento de NSW e Vitória.
- **Abstrações:** contribuição do empregado zero (a superannuation é paga pelo empregador; a Medicare levy está no IR). IR: tax-free threshold + ~25% típico. JobSeeker (valor fixo) abstraído como 25% do salário por 12 meses. Prefeito incluído porque é eleito diretamente em vários estados (QLD, SA, TAS e parte de NSW/VIC). Premiês indiretos → sem governador; Senado eleito → senador. ATAR tratado como "exame nacional" (classificação nacional sobre exames estaduais). Informalidade 0,10 conservadora.
- **Sucessão:** NSW como referência; sem legítima (family provision fora do jogo); cônjuge herda tudo sem filhos; sem meação; custo ~2%.

## Nova Zelândia (NZ)

- **Fontes principais:** MBIE/Employment NZ (NZ$ 23,95/h desde 1º/4/2026); IRD (faixas, KiwiSaver 3,5% desde 1º/4/2026); ACC (earners' levy); Employment Relations Act 2000; Work and Income (Jobseeker, NZ Super e regra de residência 2024–2042); StudyLink, TEC, NZQA; Constitution Act 1986; Electoral Commission (eleição geral de 7/11/2026); Administration Act 1969 s. 77; Property (Relationships) Act 1976; Family Protection Act 1955; Stats NZ (Censo 2023); DIA (nomes de bebês); NZ Football.
- **Abstrações:** unitária e unicameral → só vereador, prefeito e deputado (conselhos regionais são governo local, não legislativo). Sem faixa isenta no IR: isenção 0 e ~19% médio. Sem indenização legal por redundância → 0. Contribuição = ACC + KiwiSaver (opt-out). NZ Super: usa a regra final de 20 anos de residência. Região como divisão; cidade-sede = sede do conselho regional (Tauranga não é: o da Bay of Plenty fica em Whakatāne).
- **Sucessão:** cônjuge com legado + 1/3 do resto com filhos, ~3/4 com pais; meação verdadeira pela divisão igual dos bens da relação (PRA, opção A); vacância para a Coroa; custo ~2%.
- **Nomes:** grupo geral (DIA; inclui sobrenomes asiáticos e do Pacífico) e grupo maori (17%) que mistura prenomes em inglês e em te reo, e sobrenomes maori e britânicos — como nos registros, sem caricatura.

## Dúvidas abertas

- `publicaCobra` dos EUA: depende de como o motor define a mensalidade privada de referência (0,27 vs 0,4).
- Informalidade de CA/AU/NZ: não há série comparável da OIT; valores conservadores.
- Clubes regionais (USL, League1, NPL, NZ National League) mudam de divisão e de nome com frequência; conferir a cada temporada.
