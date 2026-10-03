# Fontes e abstrações — perfis da Europa Ocidental

Arquivo: `src/motor/mundo/paises/europa.ts` (PT, ES, FR, DE, IT, GB). Cada perfil cita as fontes em `fontes`; abaixo, o que foi abstraído.

## Convenções comuns
- Dinheiro em moeda local por mês. `impostoRenda` = rendimento bruto mensal isento para um solteiro sem filhos + alíquota marginal da faixa de um salário típico (nenhum dos seis tem imposto de alíquota única).
- `informalidade`: a série harmonizada da OIT/ILOSTAT dá 2–7% para estes países. Somamos uma margem pequena pelo trabalho não declarado (ISTAT: ~11% de trabalho irregular na Itália).
- `classes`: tiradas da taxa de risco de pobreza (EU-SILC/INE/INSEE/Destatis/ISTAT; DWP HBAI), do Gini e do peso do topo. Como a pobreza europeia é relativa (60% da mediana), a fatia `vulneravel` fica abaixo da taxa.
- `prefeito`: incluído onde a chefia municipal sai da eleição local (ver por país).
- Grupos de nomes com `divisoes` competem, nessas divisões, com o grupo nacional, na proporção do `peso`. O motor ainda não lê esse campo: é uma convenção proposta.

## Portugal
- Fontes: DL 139/2025 (salário mínimo de 920 €); Portaria 358/2024 (reforma aos 66 anos e 9 meses, arredondada para 67); Código do Trabalho, arts. 263.º, 264.º e 366.º; DL 220/2006; Código Civil, arts. 2133.º–2161.º e 1717.º; Código do Imposto do Selo, art. 6.º; Lei Orgânica 1/2001; DGES (Concurso Nacional de Acesso, contingente prioritário ASE de 2%, bolsa até 23×IAS per capita); INE ICOR 2024.
- Divisões: os 18 distritos e as 2 regiões autónomas, que são os códigos ISO 3166-2:PT.
- Política: o presidente da câmara é o primeiro da lista mais votada para a câmara. O nível `deputado_estadual` foi omitido, porque só os Açores e a Madeira têm assembleia regional. Não há senado nem governador.
- IRS: abstraído pelo mínimo de existência (≈ 1.073 €/mês) mais uma marginal de 26%.
- Migração: `ue` e `cplp`, pela autorização de residência CPLP (Lei 18/2022). As regras de 2024–25 ficaram mais exigentes.
- Sucessão: legítima de 2/3, o caso cônjuge + filhos. A quota mínima de 1/4 do cônjuge não é aplicada. O imposto do selo isenta a linha reta e o cônjuge.

## Espanha
- Fontes: RD 126/2026 (SMI de 1.221 € × 14); Orden de cotización 2026 (6,50% do trabalhador; base máxima 5.101,20 €); ET, arts. 31 e 56; LGSS; Lei 27/2011; Código Civil, arts. 806–809, 834–837, 943–956 e 1316; LOREG, art. 196; CE, art. 69; bolsas MEC 2025/26 (limiar 2 de 38.242 € para uma família de 4); INE ECV 2024; Idescat, Eustat, IGE.
- Política: o *alcalde* é eleito pelos vereadores e, sem maioria absoluta, é proclamado o cabeça da lista mais votada (LOREG 196). Por isso foi mapeado como cargo da eleição municipal. O senado entra, porque 208 de 266 senadores são eleitos diretamente. O presidente autonômico é investido pelo parlamento, então não há `governador`. O jogo usa o calendário autonômico comum (maio); cinco comunidades votam em datas próprias.
- Sucessão: direito comum. Os direitos forais (Catalunha, Aragão, Navarra, País Basco, Galiza, Baleares) não são modelados. O cônjuge herda em **usufruto**, o que não é modelado: com descendentes ou ascendentes ele fica só com a meação de *gananciales*. O imposto de sucessões é autonômico e, em geral, bonificado para a família próxima, por isso entra uma taxa média de 3%.
- Nomes: grupo nacional mais os grupos catalão (CT/IB/VC), basco (PV/NC) e galego (GA). Nas gerações antigas desses grupos há formas castelhanas, porque o registro civil franquista as impunha.

## França
- Fontes: SMIC 1/1/2026 (1.823,03 € brutos, 35 h); LFSS 2026 (suspensão da reforma de 2023: idade legal de 62 anos e 9 meses para a geração 1964, arredondada para 63); Code du travail, R1234-2; Code électoral, L262 e L338; CGCT, L2122-7; Constituição, art. 24; Code civil, arts. 751–768, 913, 914-1 e 1400; CGI, art. 777; CROUS 2025/26; Lei ORE/Parcoursup.
- Política: o *maire* é eleito pelo conselho municipal, que a lista vencedora domina por causa do bônus majoritário. Foi mapeado como cargo da eleição local, com essa ressalva. Os conselheiros regionais são eleitos diretamente (`deputado_estadual`). O Senado é indireto e o presidente regional é eleito pelo conselho, por isso ambos foram omitidos.
- Previdência: não há tempo mínimo para receber uma pensão reduzida. O jogo usa 1 ano como piso. A taxa cheia exige 170 trimestres.
- Educação: `candidatura` (bac + Parcoursup). `cotas: true` pela taxa mínima legal de bolsistas por formação (Lei ORE). A bolsa CROUS foi abstraída em ~0,45 SMIC por pessoa.
- Contribuições: ~21–23% incluindo CSG/CRDS. O perfil não tem teto, porque a CSG não tem.
- Sucessão: reserva de 2/3 (caso de dois filhos). A opção do cônjuge entre usufruto total e 1/4 em propriedade foi aproximada pela partilha por cabeça. Os ascendentes não são reservatários desde 2006.
- Nomes: grupo nacional (INSEE, *Fichier des prénoms*) mais um grupo de famílias de origem magrebina, com peso de 10% (INSEE; INED/INSEE, TeO2).

## Alemanha
- Fontes: Mindestlohn de 13,90 €/h (× 40 h ≈ 2.409 €/mês); tetos de contribuição de 2026 (aposentadoria 8.450 €, saúde 5.812,50 €); EStG § 32a; KSchG § 1a; SGB III; SGB VI; BGB §§ 1371, 1924–1936 e 2303; ErbStG; GG, arts. 38–39 e 51; WDModG (em vigor em 1/1/2026); Destatis; GfdS.
- Política: o Bürgermeister é eleito diretamente em todos os Länder. Mandato (5–8 anos) e idade (18–25) variam; o jogo usa 6 anos e 21. Entram Landtag e Bundestag. Bundesrat e Ministerpräsident foram omitidos, porque não são eleitos diretamente. A eleição municipal de referência é a da Renânia do Norte-Vestfália (2025, 5 anos).
- Militar: `seletivo`. Desde 2026 o questionário é obrigatório para os homens de 18 anos e o exame de aptidão passa a ser obrigatório a partir de 7/2027. O serviço continua voluntário.
- Trabalho: não há indenização legal geral. Usa-se o meio salário por ano do § 1a KSchG. O seguro-desemprego paga 60% do líquido, o que dá ~40% do bruto. O serviço público não usa concurso de provas no sentido brasileiro (`concurso: false`).
- Saúde: universal por seguro obrigatório (GKV/PKV), por isso marcada como `universal`.
- Sucessão: Pflichtteil de 1/2. Não há meação: o regime de *Zugewinngemeinschaft* compensa os aquestos com +1/4 para o cônjuge (§ 1371). Com descendentes a partilha é por cabeça (exata com um filho). Com os pais o cônjuge fica com 3/4.
- Nomes: grupo nacional mais um grupo turco-alemão com peso de 5%.

## Itália
- Fontes: Codice civile, arts. 159, 467, 536–586 e 2120 (TFR); D.Lgs. 346/1990; Constituição, arts. 48, 56–58, 97 e 122; Lei constitucional 1/1999; Lei 81/1993; INPS; D.Lgs. 22/2015 (NASpI); Lei 214/2011; TUIR; ISTAT; MUR.
- Não há salário mínimo legal: os pisos vêm dos CCNL e `salarioMinimo` foi omitido. A bolsa DSU (por ISEE) ficou como teto de ~1 piso por pessoa, uma abstração.
- Política: o sindaco é eleito diretamente. O presidente da região é eleito diretamente (exceto no Vale de Aosta e no Trentino-Alto Ádige), por isso `governador` entra. O Senado é eleito diretamente, com idade mínima de 40 anos; a Câmara, de 25.
- Trabalho: 13,3 salários (a 13.ª é universal nos CCNL; a 14.ª, parcial). O TFR (≈ 0,89 mês/ano) é pago em qualquer saída do emprego.
- Educação: `acesso_aberto` (a maioria dos cursos é livre; há *numero chiuso* nacional em medicina etc.).
- Nomes: grupo nacional mais o grupo `it_sul` (Campânia, Apúlia, Basilicata, Calábria, Sicília), baseado nas distribuições regionais do ISTAT. Os dois convivem nessas regiões.

## Reino Unido
- Fontes: National Living Wage de 12,71 £/h (abr/2026; × 37,5 h ≈ 2.065 £/mês); HMRC (personal allowance de 12.570 £; NICs de 8%/2%; IHT); Employment Rights Act 1996, s. 162; Pensions Act 2014; AEA 1925 / ITPA 2014; I(PFD) Act 1975; Dissolution and Calling of Parliament Act 2022; ONS, NRS, NISRA (nomes); DWP HBAI.
- Divisões: as 4 nações. O prêmio de Londres (~30%) não cabe no nível de nação e foi diluído na Inglaterra.
- Política: `vereador` (councillor) e `deputado_federal` (MP). O `prefeito` entra com ressalva, porque só existe em Londres, nas combined authorities e em ~13 conselhos. Os parlamentos devolvidos existem só na Escócia, no País de Gales e na Irlanda do Norte, por isso `deputado_estadual` foi omitido. Os Lordes não são eleitos, por isso `senador` foi omitido.
- Sucessão: regra da Inglaterra e do País de Gales. Há liberdade de testar (legítima 0); o pedido judicial do Act de 1975 não é modelado. Sem testamento, o cônjuge leva tudo se não houver descendentes (`[1, 1]`). O legado fixo de 322.000 £ foi aproximado pela partilha por cabeça. Escócia e Irlanda do Norte têm regras próprias, não modeladas.
- Futebol: pirâmide inglesa (inclui os galeses Cardiff e Wrexham). Os clubes escoceses ficaram de fora porque jogam a SPFL, uma liga separada.
- Militar: ingresso a partir dos 16 anos, com consentimento dos pais.
- Nomes: grupos inglês, escocês (SCT), galês (WLS), norte-irlandês (NIR) e sul-asiático (peso de 8%, ENG/WLS/SCT; ONS, Censo 2021).
