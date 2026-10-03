# Fontes e abstrações — perfis da África

Arquivo: `src/motor/mundo/paises/africa.ts` (África do Sul, Nigéria, Angola, Quênia, Marrocos).
Cada perfil tem um cabeçalho de sucessão e um de nomes com as fontes e as
simplificações; aqui fica o resumo. Valores monetários em moeda local por mês.

## Regras gerais

- **Nomes.** Nenhum dos cinco países publica estatística oficial completa de nomes por geração. Os pesos dos grupos vêm de censos (língua do domicílio ou etnia declarada) ou, onde o censo não pergunta (Nigéria), da estimativa étnica mais citada. As listas foram montadas com nomes de uso corrente (registros, imprensa, esporte). A única lista baseada em ranking oficial é a geração nova da África do Sul (Home Affairs/Stats SA). O motor multiplica por 6 o peso do grupo da divisão de nascimento e por 0,35 o dos outros. Por isso as cidades muito misturadas (Gauteng, Abuja, Luanda, Nairóbi, Nakuru) ficam sem grupo próprio e recebem a mistura nacional.
- **Cargos.** Só entram níveis eleitos diretamente. Ficam de fora: o NCOP e os premiês provinciais da África do Sul, os presidentes de comuna e de região e a Câmara dos Conselheiros do Marrocos, e os governadores nomeados de Angola.
- **Imposto de renda.** A isenção é real. A alíquota única representa a faixa típica do assalariado formal e não a primeira faixa.

## África do Sul (ZA)

- **Fontes:** Stats SA (Censo 2022: línguas; nomes de bebê 2022–2024); NMW Act 9/2018 (R 30,23/h desde 1/3/2026); SARS Budget 2026 (isenção de R 99.000/ano); UIF (1%, teto R 17.712); BCEA s. 41; Social Assistance Act; Constituição de 1996; IEC (eleições locais em 4/11/2026, gerais em 2029); Intestate Succession Act 81/1987; Wills Act 1953; NSFAS (R 350 mil/ano); clubes da Betway Premiership 2025/26.
- **Abstrações:**
  - O salário mínimo mensal foi calculado com 45 h semanais.
  - O UIF virou 8 meses a 45% (a lei prevê até 365 dias, com taxa de 38% a 60%).
  - Não há previdência pública contributiva. A "aposentadoria" é a pensão de velhice do SASSA, não contributiva e com teste de renda, aos 60 anos.
  - Sucessão: liberdade de testar. O cônjuge herda tudo sem descendentes. O mínimo legal do cônjuge virou a partilha por cabeça. A comunhão de bens virou meação. O estate duty e o executor viraram 5%.
  - Mês eleitoral = maio (eleições gerais). As locais são em novembro.

## Nigéria (NG)

- **Fontes:** Constituição de 1999 (+ Not Too Young To Run, 2018); INEC (eleições gerais em 16/1/2027); Minimum Wage Act 2024 (₦ 70.000); Nigeria Tax Act 2025 (₦ 800 mil/ano isentos; 15%…); Pension Reform Act 2014 (8%); Labour Act; UBE Act 2004; JAMB/UTME; Students Loans Act 2024 (NELFUND); NBS (NLFS, pobreza); CIA Factbook (etnias); clubes da NPFL 2025/26.
- **Abstrações:**
  - Pesos dos nomes: hauçá-fulani-kanuri 36, iorubá 16, igbo 15, sul-sul 15, cinturão médio 14.
  - O kanuri foi incluído no grupo do Norte, com nomes kanuri próprios (Modu, Bukar, Kyari, Falmata, Kaltume).
  - Sucessão: três sistemas convivem (legislado, costumeiro e islâmico). O jogo usa o legislado: liberdade de testar e Administration of Estates Law. A primogenitura igbo, o idi-igi iorubá e as quotas islâmicas do Norte estão descritos no comentário, mas não são modelados.
  - Eleições locais: o calendário varia por estado. A referência usada é Lagos (2025, a cada 4 anos).
  - As cotas de admissão por estado de origem (catchment e ELDS) não são cotas por renda ou escola, por isso `cotas: false`.

## Angola (AO)

- **Fontes:** Constituição de 2010; Código Civil de 1966 na versão angolana (arts. 2131.º–2161.º) e Código da Família (Lei 1/88); Bartolomeu, *Revista Angolana de Ciências*, 2019 (o cônjuge está na 4.ª classe de sucessíveis); LGT, Lei 12/23 (art. 238.º: 50% de férias + 50% de Natal; art. 308.º: compensação); Decreto Presidencial 152/24 (Kz 100.000 desde setembro de 2025); OGE 2026 (IRT isento até Kz 150.000); Lei 7/04 e regulamento da velhice (60 anos/180 meses); Lei 17/16 e Lei 32/20; Lei 14/24; INE (Censo 2014, IDREA, emprego); Girabola 2025/26.
- **Abstrações:**
  - Sucessão: Angola não fez a reforma portuguesa de 1977. Por isso o cônjuge não é herdeiro legitimário e vem depois dos irmãos. Fica protegido pela meação (comunhão de adquiridos).
  - A legítima é de 2/3, o caso de dois ou mais filhos. Com um só filho é metade.
  - O motor coloca o cônjuge antes dos irmãos no último degrau da sucessão. É uma aproximação.
  - Não houve eleições autárquicas, então só entra o cargo de deputado. A referência de eleição local repete a geral.
  - A "classe" angolana aparece como "série".
  - A divisão de 2024 (21 províncias) ainda não tem códigos ISO. Foram usadas as 18 com código.
  - O Leste (lunda-cokwe) não tem grupo de nomes próprio, por falta de fonte confiável de apelidos. O grupo "comum", lusófono, cobre essa região.
  - O teto da bolsa INAGBE em salários mínimos é uma abstração.

## Quênia (KE)

- **Fontes:** Censo 2019 (KNBS, vol. IV, etnias); KCHS 2021 (pobreza); Regulation of Wages Order 2026 (LN 108/2026: KSh 18.047,40 nas cidades); NSSF ano 4 (6%, teto KSh 108.000); PAYE (KRA); Employment Act s. 40; Constituição de 2010 (arts. 97, 98, 101, 177, 180); Law of Succession Act, Cap. 160 (ss. 2(3), 35–41); SHA (2023); EAC; FKF Premier League 2025/26.
- **Abstrações:**
  - Não existe salário mínimo nacional único. Foi usado o do trabalhador geral nas cidades.
  - Sucessão: o usufruto vitalício do cônjuge (ss. 35–36) virou partilha por cabeça com os filhos e metade com os pais. A regra islâmica (s. 2(3)) não é modelada.
  - A transição curricular CBC/8-4-4 termina em 2027. O exame continua sendo chamado de KCSE.
  - Os tetos do Universities Fund e do HELB são abstrações.
  - Pesos dos grupos de nomes: monte Quênia 22,5; luhya 14,4; kalenjin 13,4; luo 10,7; kamba 9,8; costa 6,2; pastores (maasai, turkana, samburu, borana) 6; kisii 5,7; somali 5,6.

## Marrocos (MA)

- **Fontes:** HCP (RGPH 2024, línguas; pobreza 2022; informalidade); Moudawana, Lei 70-03 (Livros V e VI); Decreto 2.25.983 (SMIG 2026: 17,92 DH/h × 191 h); Lei de Finanças 2025 (IR); CNSS (4,29% até 6.000 DH; Decreto 2.25.265, 1.320 dias); Código do Trabalho (arts. 52–53); Lei 03-14 (IPE); Constituição de 2011; Leis Orgânicas 27-11, 59-11 e 113-14; legislativas de 23/9/2026; comunais em 2027; Lei 44-18 (serviço militar); Lei-quadro 51-17; Lei 37-99 e circular de 2010 (nomes amazigues); Botola Pro 2025/26.
- **Abstrações:**
  - Sucessão islâmica. As quotas fixas (cônjuge 1/8 ou 1/4, filho com o dobro da filha, resíduo agnático) não cabem nos parâmetros do motor. O jogo usa:
    - legítima de 2/3 (o testamento só alcança um terço);
    - necessários: descendentes, ascendentes e cônjuge;
    - cônjuge por cabeça com os filhos (mais generoso que a lei quando há poucos filhos);
    - cônjuge com 1/4 diante dos pais (o caso da viúva; o viúvo teria 1/2);
    - representação pelo legado obrigatório (arts. 369–372);
    - sem meação.
  - A diferença de quota por sexo NÃO é modelada.
  - A revisão da Moudawana anunciada em 2024 não entra.
  - Pesos dos grupos de nomes: árabe 75, amazigue do Sous 14,2, do Atlas 7,4, do Rife 3,2. Os grupos amazigues usam majoritariamente os mesmos nomes árabe-islâmicos. Os nomes amazigues aparecem sobretudo na geração nova (eram restringidos pelo registro civil até 2010).
  - Cidades e divisões das regiões do Saara Ocidental (11, 12) não foram listadas.

## Dúvidas registradas

- **Marrocos:** a idade mínima de elegibilidade para os conselhos comunais e regionais ficou em 18 anos, pelo princípio da Constituição (art. 30) e da maioridade eleitoral. Não foi possível confirmar o artigo da Lei Orgânica 59-11.
- **África do Sul:** o porte de "Cape Town City" (regional) reflete o rebaixamento recente.
- **Angola:** a fração de reposição do INSS (0,5) é aproximada.
