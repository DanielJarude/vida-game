# Fontes e abstrações — América Latina hispânica

Perfis em `src/motor/mundo/paises/america-sul.ts` (AR, CL, UY, CO, PE) e
`src/motor/mundo/paises/america-central-caribe.ts` (CR, DO). Cada perfil tem a
lista completa em `fontes`, e os comentários acima dele trazem a lei e o artigo
de cada regra. Esta nota resume, país por país, de onde vêm os números e o que
foi simplificado. Os valores foram conferidos em outubro de 2026.

## Convenções comuns

- **Dinheiro**: moeda local por mês. O salário mínimo e as isenções são de 2026.
- **Contribuição**: tudo o que a lei desconta do empregado para a seguridade
  (aposentadoria, saúde e seguro-desemprego), porque é isso que separa o
  salário bruto do líquido. Por isso Chile (~18–19%) e Uruguai (18–23%) aparecem
  com alíquotas maiores que as do INSS.
- **Imposto de renda**: a isenção mensal é a bruta aproximada. A alíquota
  única é a média que reproduz o imposto de quem ganha entre 1,5 e 3 vezes o
  piso; não é a da primeira faixa nem a da última.
- **Classes ao nascer**: calibradas pela pobreza monetária oficial mais
  recente, pelo Gini e pelo tamanho da classe média de cada país.
- **Rescisão**: soma a indenização legal e os fundos que a substituem
  (cesantías na Colômbia, CTS no Peru), como o FGTS no perfil do Brasil.

## Argentina (AR)

- **Fontes principais**: INDEC (pobreza 28,2% no 2º semestre de 2025;
  informalidade 43%); Res. 4/2026 do Consejo del Salario (SMVM de ARS 383.800);
  ANSES (base imponível máxima); ARCA (piso de Ganancias); Código Civil e
  Comercial (Lei 26.994); Constituição Nacional e a da Província de Buenos Aires.
- **Abstrações**:
  - Inflação fixada em 30% ao ano, com volatilidade máxima.
  - A isenção de Ganancias (~ARS 3 milhões brutos) é a do 1º semestre de
    2026 e é reajustada a cada semestre.
  - As idades e os mandatos municipais e provinciais variam por província.
    Foi usada a Província de Buenos Aires: concejal e intendente com 25 anos,
    deputado provincial com 22.
  - A Câmara se renova pela metade a cada 2 anos. O jogo usa o ciclo
    presidencial de 4 anos.
  - Sucessão: a legítima é de 2/3 (o caso com filhos; com ascendentes ou só o
    cônjuge, a lei diz 1/2). A diferença entre bens próprios e ganhos foi
    reduzida a "o cônjuge concorre por cabeça mais a meação".
  - Não há imposto nacional sobre herança; só a Província de Buenos Aires
    cobra. As custas e os honorários entram como uma taxa média de 6%.
  - Concurso = false: ele existe, mas não é a porta de entrada típica.
- **Nomes**: RENAPER (2024–2025). Há um grupo do Noroeste (Jujuy, Salta,
  Tucumán, 8%) com sobrenomes quéchuas e aimarás misturados aos hispânicos.
  Os nomes próprios são os mesmos do resto do país.

## Chile (CL)

- **Fontes principais**: CASEN 2024 (pobreza 17,3%, nova metodologia); INE
  (informalidade 26,8%); IMM de CLP 553.553 (maio de 2026); teto de 90 UF; SII
  (isenção de 13,5 UTM); Código do Trabalho; Constituição; Código Civil; Lei
  21.091.
- **Abstrações**:
  - São 12 salários por ano: não há 13º obrigatório, e a gratificação legal
    costuma vir diluída no salário.
  - Aposentadoria com anos mínimos [0, 0]: a AFP paga o que foi acumulado, e
    a PGU exige residência, não contribuição.
  - Universidade pública cobra 0,8 da mensalidade privada (as estatais cobram
    perto das privadas). A Gratuidade, para os 60% de menor renda, entra como
    a bolsa.
  - O FES não virou lei até 2026, então o crédito continua sendo o CAE.
  - cotas = true, por causa do PACE e das vagas de equidade da Lei 21.091.
  - Sucessão: o jogo reserva 3/4 à família, porque metade é legítima e um
    quarto (as "mejoras") só pode ir a descendentes, cônjuge ou ascendentes.
    A regra real "cônjuge = o dobro de cada filho" virou "por cabeça".
  - Serviço militar 'seletivo': é obrigatório na lei, mas é preenchido por
    voluntários, com sorteio só para completar.
  - Concurso = false, porque a maioria entra "a contrata".
- **Nomes**: Registro Civil (2023–2025). Há um grupo do Sul (Araucanía, Los
  Lagos e Biobío, 10%; Censo 2017) com sobrenomes mapuche e hispânicos.

## Uruguai (UY)

- **Fontes principais**: INE (pobreza 16,6% em 2025; informalidade 22,8%);
  Decreto 319/025 (SMN de UYU 25.383); DGI/BPS (7 BPC, contribuições);
  Constituição; Lei 19.272; Código Civil e Lei 16.081.
- **Abstrações**:
  - mesesPagos = 13,5: o aguinaldo mais o salário vacacional, que é o líquido
    dos dias de férias.
  - O teto previdenciário (~UYU 260 mil) é aproximado.
  - Níveis políticos: o departamento é o 1º nível (intendente = governador;
    edil da Junta Departamental = deputado_estadual). Alcalde e concejal são
    do município (Lei 19.272). A idade de 23 anos para o nível municipal vem
    da equiparação legal aos ediles.
  - Sucessão: a legítima dos filhos é escalonada (1/2, 2/3, 3/4) e o jogo usa
    2/3. O cônjuge não concorre com os filhos: tem só a porção conjugal (se
    não tiver meios) e o direito de habitação. Com os ascendentes, fica com
    metade.
  - Na pirâmide do futebol, a OFI (interior) é paralela à AUF. Ela foi usada
    como a base.
- **Nomes**: grupo da fronteira com o Brasil (Rivera, Artigas e Cerro Largo,
  7%) com sobrenomes de origem portuguesa.

## Colômbia (CO)

- **Fontes principais**: DANE (pobreza 28%, extrema 9,6%; informalidade
  ~55%); Decreto 1469/2025 (SMMLV de COP 1.750.905); DIAN (UVT 2026); Código
  Substantivo do Trabalho; Lei 2381/2024 e a sentença C-264/2026; Código Civil
  com a Lei 1934/2018; Constituição.
- **Abstrações**:
  - A isenção do IR (~COP 7,2 milhões brutos) foi reconstruída a partir dos
    95 UVT da base depurada (descontados os aportes e 25% de renda isenta).
  - Não há seguro-desemprego com reposição de renda (o Mecanismo de Proteção
    ao Cesante paga saúde e pensão), então ele foi omitido. As cesantías
    entram na rescisão (1,67 salário por ano).
  - Aposentadoria: 62/57 anos e 1.300 semanas. A reforma da Lei 2381 vale a
    partir de abril de 2027 e muda as semanas das mulheres.
  - A bolsa (Política de Gratuidade) é definida por estrato e SISBÉN, não por
    renda. O teto de 1,5 salário mínimo é uma aproximação.
  - O campo `mes` usa março (Congresso); as eleições locais são em outubro.
  - A pirâmide do futebol tem só duas divisões profissionais (DIMAYOR). As
    duas de baixo são o futebol amador (DIFÚTBOL).
  - Sucessão: o cônjuge não é legitimário. Com filhos, recebe só a porção
    conjugal (não modelada); com ascendentes, metade.
- **Nomes**: Registraduría (2025: David, Sofía…). Há um grupo do Pacífico
  (Chocó, Valle e Nariño, 10%; Censo 2018) com sobrenomes afro-colombianos
  frequentes. Os nomes próprios são os mesmos do país.

## Peru (PE)

- **Fontes principais**: INEI (pobreza 25,7%; informalidade 70,7%); DS
  015-2026-TR (RMV de PEN 1.230 desde 1/10/2026); DS 301-2025-EF (UIT de
  PEN 5.500); Lei 27735, DS 001-97-TR, DS 003-97-TR; Lei 31988
  (bicameralidade); Código Civil de 1984.
- **Abstrações**:
  - 14 salários (gratificações de julho e dezembro).
  - A isenção mensal é 7 UIT ÷ 14 = PEN 2.750.
  - Rescisão de 2,5 salários por ano: 1,5 de indenização mais ~1 de CTS.
  - Não há seguro-desemprego.
  - Previdência: "ONP ou AFP", com 20 anos (os da ONP).
  - Ingresso na universidade por 'candidatura': cada universidade pública tem
    o seu exame de admissão.
  - `mes` = abril (eleição geral). As regionais e municipais são em outubro.
- **Nomes**: há um grupo do sul andino (Puno, Cusco, Apurímac, Arequipa e
  Junín, 30%) com sobrenomes quéchuas e aimarás. Quispe também aparece no
  grupo geral, porque é o sobrenome mais comum do país (RENIEC). Não havia um
  ranking oficial de 2025 acessível; os nomes novos vêm de rankings recentes
  publicados a partir de dados do RENIEC.

## Costa Rica (CR)

- **Fontes principais**: INEC (ENAHO 2025: 15,2% dos domicílios pobres;
  informalidade 37,8%); Decreto 45303-MTSS (CRC 373.092,30); Decreto 45333-H
  (isenção de CRC 918.000); CCSS (10,83%); Código de Trabalho; Constituição;
  Código Civil, arts. 572 e 595.
- **Abstrações**:
  - O salário mínimo é o do trabalhador não qualificado genérico (há uma
    tabela por ocupação).
  - A pobreza oficial é medida em domicílios; as pessoas pobres são um pouco
    mais.
  - Não há deputado_estadual, governador nem senador: as províncias não têm
    governo eleito e a Assembleia é unicameral.
  - Não há exército (art. 12). Os três braços são a Força Pública, o Serviço
    Nacional de Guarda-Costas e o Serviço de Vigilância Aérea.
  - O voto é "obrigatório" no texto, mas não há sanção: false.
  - Sucessão: liberdade de testar (legítima 0); a obrigação de alimentos não é
    modelada. Sem testamento, a lei põe filhos, pais e cônjuge na mesma ordem.
    O motor não faz os pais concorrerem com os filhos.
  - A vacância vai para as Juntas de Educação.
- **Nomes**: TSE (2025: Luciana, Julián). Há um grupo de Limón (4%) com
  sobrenomes afro-caribenhos de origem jamaicana, misturados aos hispânicos.

## República Dominicana (DO)

- **Fontes principais**: Ministério da Fazenda e Economia (pobreza 17,3% em
  2025); BCRD/ENCFT (informalidade 54,1%); Resolução CNS-01-2025; TSS (topes);
  DGII (ISR e imposto sucessório de 3%); Código de Trabalho (Lei 16-92); Lei
  87-01; Constituição de 2015; TC/0267/23.
- **Abstrações**:
  - Salário mínimo: o das empresas grandes (DOP 29.988). As micro, pequenas e
    médias têm pisos menores.
  - Teto: o da pensão (20 salários mínimos cotizáveis); o da saúde é de 10.
  - A escala do ISR está congelada desde 2018, e a Lei 30-26 a muda em 2027.
  - Não há deputado_estadual nem governador: os governadores provinciais são
    nomeados pelo presidente.
  - Sucessão: o cônjuge está num vazio legal desde a TC/0267/23 (o art. 767
    foi anulado e a nova ordem não foi legislada). A escolha conservadora é
    que o cônjuge não concorre (0); a proteção dele é a meação.
  - A reserva dos filhos é escalonada (1/2, 2/3, 3/4) e o jogo usa 2/3.
  - Esporte: o beisebol está fora dos domínios do jogo.
  - Na pirâmide do futebol, só a LDF é profissional. O nível 2 ("torneio de
    ascenso / Segunda División") é pouco documentado e foi tratado como
    abstração.
  - Concurso = false: a Lei 41-08 o prevê, mas a livre nomeação predomina.
- **Nomes**: JCE (2025: Adhara, Adriel). Para as gerações anteriores, foram
  usados nomes correntes no país, sem fonte estatística oficial por coorte.

## Migração

AR, CL, UY, CO e PE estão no bloco `mercosul` (membros ou associados que
aplicam o Acordo de Residência). CR e DO não pertencem a nenhum bloco da
lista. Para quem vem de fora de um bloco, todos são `seletiva`: há residência
por categorias (trabalho, estudo, renda), e nenhum é uma porta aberta nem
fechada.
