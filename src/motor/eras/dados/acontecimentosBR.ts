/**
 * ERAS HISTÓRICAS · ACONTECIMENTOS DO BRASIL, 1980–2025 (dados puros).
 *
 * Cada acontecimento separa três coisas:
 *   - `fato`: o que aconteceu, com data, nomes e cargos — só o documentado (fontes em `fonte`; lista completa em
 *     docs/eras/FONTES.md). Sem adjetivo de julgamento e sem atribuir a um governante o que a economia inteira fez;
 *   - `efeito`: a consequência SIMULADA pelo jogo (e só quando o motor a aplica de verdade — ver `eras/ano`);
 *   - `quem`: para quem o acontecimento vira lembrança pessoal (idade, lugar, situação). Os demais o veem nas notícias.
 *
 * `data`: [ano, mês 1–12, dia?]. `ufs`: abrangência regional (ausente = nacional). Nenhum acontecimento é inventado
 * para cidade ou estado: os regionais são fatos de alcance estadual documentados.
 */

import type { EfeitosMundo14 } from '../../dados14/mundo/tipos';

export type CategoriaHistorica = 'politica' | 'economia' | 'sociedade' | 'direitos' | 'esporte' | 'cultura' | 'desastre' | 'saude' | 'tecnologia';

export interface AcontecimentoBR {
  id: string;
  data: [number, number, number?];
  categoria: CategoriaHistorica;
  titulo: string;
  fato: string;
  fonte: string;
  /** Estados onde o acontecimento é local (ausente: nacional). */
  ufs?: string[];
  /** A partir de que idade vira lembrança pessoal (padrão 7). */
  idadeMin?: number;
  /** Peso na Linha da Vida: 'biografia' marca a vida; 'cotidiano' fica em "e também, naquele ano". */
  peso?: 'biografia' | 'cotidiano';
  /** Efeitos no mercado de trabalho e nas vendas (reuso de `v14/mundo`), com `dura` anos depois do primeiro. */
  mods?: EfeitosMundo14;
  dura?: number;
  /** Uma consequência especial aplicada pelo motor da época (`eras/ano`). */
  especial?: 'collor' | 'auxilio' | 'covid_br' | 'apagao';
  /** O que o jogo simula (dito ao jogador só quando aplicado). */
  efeito?: string;
}

export const ACONTECIMENTOS_BR: readonly AcontecimentoBR[] = [
  // ------------------------------------------------------------------ anos 1980
  { id: 'diretas_ja', data: [1984, 4, 25], categoria: 'politica', titulo: 'Diretas Já', fato: 'Depois de meses de comícios pelas eleições diretas para presidente, a emenda Dante de Oliveira foi votada na Câmara em 25 de abril de 1984 e não alcançou os dois terços necessários. A escolha do próximo presidente ficou com o Colégio Eleitoral.', fonte: 'Câmara dos Deputados (PEC 5/1983, votação de 25/04/1984); Arquivo Nacional.', peso: 'biografia', idadeMin: 9 },
  { id: 'tancredo_eleito', data: [1985, 1, 15], categoria: 'politica', titulo: 'O Colégio Eleitoral escolhe um civil', fato: 'Em 15 de janeiro de 1985, o Colégio Eleitoral elegeu Tancredo Neves presidente, com José Sarney de vice: o primeiro civil eleito para o cargo desde 1964, ainda pela via indireta.', fonte: 'TSE; Agência Senado; Arquivo Nacional.', idadeMin: 9 },
  { id: 'morte_tancredo', data: [1985, 4, 21], categoria: 'politica', titulo: 'Morre Tancredo Neves', fato: 'Internado na véspera da posse, Tancredo Neves morreu em 21 de abril de 1985 sem assumir. José Sarney, que tomara posse interinamente em 15 de março, ficou na Presidência.', fonte: 'Biblioteca da Presidência da República; Agência Senado.', peso: 'biografia', idadeMin: 7 },
  { id: 'plano_cruzado', data: [1986, 2, 28], categoria: 'economia', titulo: 'Plano Cruzado', fato: 'Em 28 de fevereiro de 1986, o Plano Cruzado trocou o cruzeiro pelo cruzado, cortando três zeros, congelou preços e salários e acabou com a correção monetária de quase tudo. As tabelas de preços passaram a ser conferidas nos supermercados.', fonte: 'Decreto-Lei 2.283/1986; Banco Central do Brasil.', peso: 'biografia', idadeMin: 8, mods: { ramos: { loja: 1.08, restaurante: 1.05 } }, efeito: 'Com os preços congelados, o comércio vendeu mais naquele ano.' },
  { id: 'moratoria_1987', data: [1987, 2, 20], categoria: 'economia', titulo: 'Moratória da dívida externa', fato: 'Em 20 de fevereiro de 1987, o governo suspendeu o pagamento dos juros da dívida externa com os bancos privados estrangeiros.', fonte: 'Banco Central do Brasil; Biblioteca da Presidência da República.', idadeMin: 14, peso: 'cotidiano' },
  { id: 'plano_bresser', data: [1987, 6, 12], categoria: 'economia', titulo: 'Plano Bresser', fato: 'Em junho de 1987, um novo plano congelou preços e salários por noventa dias. A inflação voltou a subir no fim do ano.', fonte: 'Decreto-Lei 2.335/1987.', idadeMin: 14, peso: 'cotidiano' },
  { id: 'cesio_goiania', data: [1987, 9, 13], categoria: 'desastre', titulo: 'O césio-137 em Goiânia', fato: 'Em setembro de 1987, uma cápsula de césio-137 retirada de um aparelho de radioterapia abandonado foi aberta num ferro-velho de Goiânia. Foi o maior acidente radiológico do país: houve mortes, centenas de pessoas monitoradas e casas demolidas.', fonte: 'Comissão Nacional de Energia Nuclear (CNEN); Governo de Goiás.', ufs: ['GO'], peso: 'biografia', idadeMin: 6 },
  { id: 'constituicao_1988', data: [1988, 10, 5], categoria: 'direitos', titulo: 'A nova Constituição', fato: 'Em 5 de outubro de 1988 foi promulgada a Constituição. Ela criou o Sistema Único de Saúde, ampliou direitos trabalhistas e sociais e deu o direito de votar, de forma facultativa, a quem tem 16 e 17 anos.', fonte: 'Constituição da República Federativa do Brasil de 1988 (Planalto).', peso: 'biografia', idadeMin: 9 },
  { id: 'eleicao_1989', data: [1989, 12, 17], categoria: 'politica', titulo: 'A primeira eleição direta para presidente em 29 anos', fato: 'Em 15 de novembro de 1989, o país votou para presidente pela primeira vez desde 1960. No segundo turno, em 17 de dezembro, Fernando Collor de Mello venceu Luiz Inácio Lula da Silva.', fonte: 'TSE (resultados das eleições de 1989).', peso: 'biografia', idadeMin: 8 },
  // ------------------------------------------------------------------ anos 1990
  { id: 'plano_collor', data: [1990, 3, 16], categoria: 'economia', titulo: 'Plano Collor', fato: 'No dia seguinte à posse de Fernando Collor, em 16 de março de 1990, o plano econômico trouxe o cruzeiro de volta e reteve no Banco Central, por dezoito meses, o que passasse de NCz$ 50 mil em contas correntes e cadernetas de poupança. A devolução seria em doze parcelas mensais, com correção e juros.', fonte: 'MP 168/1990, convertida na Lei 8.024/1990; Resolução BACEN 1.689/1990.', peso: 'biografia', idadeMin: 8, especial: 'collor', mods: { demissao: 1.25, contratacao: -0.05, clientela: -6 }, efeito: 'O dinheiro sumiu de circulação: o comércio parou e as demissões aumentaram.' },
  { id: 'eca', data: [1990, 7, 13], categoria: 'direitos', titulo: 'O Estatuto da Criança e do Adolescente', fato: 'Em 13 de julho de 1990 foi sancionado o Estatuto da Criança e do Adolescente, que organizou os direitos e a proteção de quem tem até 18 anos.', fonte: 'Lei 8.069/1990 (Planalto).', peso: 'cotidiano', idadeMin: 12 },
  { id: 'cdc', data: [1990, 9, 11], categoria: 'direitos', titulo: 'O Código de Defesa do Consumidor', fato: 'Em 11 de setembro de 1990 foi sancionado o Código de Defesa do Consumidor, que entrou em vigor em março de 1991: troca de produto com defeito, garantia, informação clara no rótulo.', fonte: 'Lei 8.078/1990 (Planalto).', peso: 'cotidiano', idadeMin: 16 },
  { id: 'mercosul', data: [1991, 3, 26], categoria: 'economia', titulo: 'Nasce o Mercosul', fato: 'Em 26 de março de 1991, Brasil, Argentina, Paraguai e Uruguai assinaram o Tratado de Assunção, que criou o Mercosul.', fonte: 'Tratado de Assunção (Ministério das Relações Exteriores).', peso: 'cotidiano', idadeMin: 14 },
  { id: 'rio92', data: [1992, 6, 3], categoria: 'sociedade', titulo: 'A Rio-92', fato: 'De 3 a 14 de junho de 1992, o Rio de Janeiro recebeu a Conferência das Nações Unidas sobre Meio Ambiente e Desenvolvimento, com chefes de Estado de mais de cem países.', fonte: 'Organização das Nações Unidas; Ministério do Meio Ambiente.', peso: 'cotidiano', idadeMin: 10 },
  { id: 'impeachment_collor', data: [1992, 12, 29], categoria: 'politica', titulo: 'Collor deixa a Presidência', fato: 'Depois das denúncias de corrupção e de uma CPI, a Câmara autorizou o processo de impeachment em 29 de setembro de 1992 e Fernando Collor foi afastado; Itamar Franco assumiu. Em 29 de dezembro, Collor renunciou, e o Senado concluiu o julgamento, tornando-o inelegível por oito anos.', fonte: 'Câmara dos Deputados; Senado Federal (Resolução 101/1992).', peso: 'biografia', idadeMin: 8 },
  { id: 'plebiscito_1993', data: [1993, 4, 21], categoria: 'politica', titulo: 'O plebiscito da forma de governo', fato: 'Em 21 de abril de 1993, o eleitorado escolheu entre república e monarquia, presidencialismo e parlamentarismo. Venceram a república e o presidencialismo.', fonte: 'TSE (plebiscito de 1993); ADCT, art. 2º.', peso: 'cotidiano', idadeMin: 12 },
  { id: 'urv', data: [1994, 3, 1], categoria: 'economia', titulo: 'A URV', fato: 'Em 1º de março de 1994 começou a valer a Unidade Real de Valor: salários e preços passaram a ser cotados também em URV, convertida todo dia em cruzeiros reais, preparando a moeda nova.', fonte: 'MP 434/1994, convertida na Lei 8.880/1994; Banco Central do Brasil.', peso: 'cotidiano', idadeMin: 12 },
  { id: 'senna', data: [1994, 5, 1], categoria: 'esporte', titulo: 'A morte de Ayrton Senna', fato: 'Em 1º de maio de 1994, o tricampeão mundial de Fórmula 1 Ayrton Senna morreu num acidente no Grande Prêmio de San Marino, em Ímola. O país acompanhou o velório em São Paulo.', fonte: 'Federação Internacional do Automóvel; Biblioteca Nacional (hemeroteca).', peso: 'biografia', idadeMin: 5 },
  { id: 'tetra', data: [1994, 7, 17], categoria: 'esporte', titulo: 'O tetra', fato: 'Em 17 de julho de 1994, nos Estados Unidos, a seleção brasileira venceu a Itália nos pênaltis e ganhou a quarta Copa do Mundo.', fonte: 'FIFA; Confederação Brasileira de Futebol.', peso: 'biografia', idadeMin: 4, mods: { ramos: { restaurante: 1.03 } } },
  { id: 'fhc_eleito', data: [1994, 10, 3], categoria: 'politica', titulo: 'Eleição de 1994', fato: 'Em 3 de outubro de 1994, Fernando Henrique Cardoso foi eleito presidente no primeiro turno.', fonte: 'TSE (resultados das eleições de 1994).', peso: 'cotidiano', idadeMin: 10 },
  { id: 'reeleicao', data: [1997, 6, 4], categoria: 'politica', titulo: 'A emenda da reeleição', fato: 'Em 4 de junho de 1997 foi promulgada a emenda constitucional que permitiu a reeleição de presidente, governadores e prefeitos para um mandato seguido.', fonte: 'Emenda Constitucional 16/1997 (Planalto).', peso: 'cotidiano', idadeMin: 14 },
  { id: 'telebras', data: [1998, 7, 29], categoria: 'tecnologia', titulo: 'A privatização da telefonia', fato: 'Em 29 de julho de 1998, o Sistema Telebrás foi leiloado na Bolsa do Rio. Nos anos seguintes, a oferta de linhas fixas e celulares se multiplicou e a fila por uma linha acabou.', fonte: 'Lei Geral de Telecomunicações (Lei 9.472/1997); Anatel; BNDES.', peso: 'cotidiano', idadeMin: 12 },
  { id: 'fhc_reeleito', data: [1998, 10, 4], categoria: 'politica', titulo: 'Eleição de 1998', fato: 'Em 4 de outubro de 1998, Fernando Henrique Cardoso foi reeleito presidente no primeiro turno.', fonte: 'TSE (resultados das eleições de 1998).', peso: 'cotidiano', idadeMin: 12 },
  { id: 'cambio_1999', data: [1999, 1, 15], categoria: 'economia', titulo: 'O real flutua', fato: 'Em janeiro de 1999, depois de semanas de saída de dólares, o Banco Central deixou o câmbio flutuar. O dólar subiu muito em poucas semanas, e em seguida o país adotou o regime de metas de inflação.', fonte: 'Banco Central do Brasil (Comunicado 6.565/1999; Decreto 3.088/1999, metas para a inflação).', peso: 'cotidiano', idadeMin: 14, mods: { ramos: { aerea: 0.92 } } },
  // ------------------------------------------------------------------ anos 2000
  { id: 'apagao', data: [2001, 6, 1], categoria: 'economia', titulo: 'O racionamento de energia', fato: 'De junho de 2001 a fevereiro de 2002, com os reservatórios das hidrelétricas baixos, as casas e empresas do Sudeste, do Centro-Oeste e do Nordeste tiveram de cortar o consumo de energia elétrica, com sobretaxa e meta de economia em torno de 20%.', fonte: 'Câmara de Gestão da Crise de Energia Elétrica (MP 2.147/2001); Agência Nacional de Energia Elétrica.', ufs: ['SP', 'RJ', 'MG', 'ES', 'GO', 'DF', 'MT', 'MS', 'BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA', 'TO'], peso: 'biografia', idadeMin: 7, especial: 'apagao', mods: { setores: { industria: 0.96 } }, efeito: 'Lâmpadas trocadas, chuveiro mais curto e a conta de luz conferida mês a mês.' },
  { id: 'penta', data: [2002, 6, 30], categoria: 'esporte', titulo: 'O penta', fato: 'Em 30 de junho de 2002, em Yokohama, a seleção brasileira venceu a Alemanha por 2 a 0 e conquistou a quinta Copa do Mundo. Os jogos, no Japão e na Coreia do Sul, passavam de madrugada no Brasil.', fonte: 'FIFA; Confederação Brasileira de Futebol.', peso: 'biografia', idadeMin: 4, mods: { ramos: { restaurante: 1.03 } } },
  { id: 'lula_eleito', data: [2002, 10, 27], categoria: 'politica', titulo: 'Eleição de 2002', fato: 'Em 27 de outubro de 2002, Luiz Inácio Lula da Silva foi eleito presidente no segundo turno, contra José Serra.', fonte: 'TSE (resultados das eleições de 2002).', peso: 'cotidiano', idadeMin: 10 },
  { id: 'bolsa_familia', data: [2003, 10, 20], categoria: 'sociedade', titulo: 'O Bolsa Família', fato: 'Em outubro de 2003, os programas federais de transferência de renda foram unificados no Bolsa Família, pago às famílias pobres com filhos, com exigência de frequência escolar e vacinação.', fonte: 'MP 132/2003, convertida na Lei 10.836/2004.', peso: 'cotidiano', idadeMin: 12 },
  { id: 'prouni', data: [2004, 9, 10], categoria: 'sociedade', titulo: 'O ProUni', fato: 'Em setembro de 2004 foi criado o Programa Universidade para Todos, com bolsas em faculdades particulares para estudantes de baixa renda vindos da escola pública.', fonte: 'MP 213/2004, convertida na Lei 11.096/2005.', peso: 'cotidiano', idadeMin: 14 },
  { id: 'maria_da_penha', data: [2006, 8, 7], categoria: 'direitos', titulo: 'A Lei Maria da Penha', fato: 'Em 7 de agosto de 2006 foi sancionada a lei que criou mecanismos para coibir a violência doméstica e familiar contra a mulher.', fonte: 'Lei 11.340/2006 (Planalto).', peso: 'cotidiano', idadeMin: 12 },
  { id: 'lula_reeleito', data: [2006, 10, 29], categoria: 'politica', titulo: 'Eleição de 2006', fato: 'Em 29 de outubro de 2006, Luiz Inácio Lula da Silva foi reeleito presidente no segundo turno.', fonte: 'TSE (resultados das eleições de 2006).', peso: 'cotidiano', idadeMin: 12 },
  { id: 'tv_digital', data: [2007, 12, 2], categoria: 'tecnologia', titulo: 'A TV digital', fato: 'Em 2 de dezembro de 2007 começaram, em São Paulo, as transmissões da televisão digital aberta. O sinal analógico foi desligado aos poucos, cidade por cidade, a partir de 2016.', fonte: 'Decreto 5.820/2006; Anatel.', peso: 'cotidiano', idadeMin: 10 },
  { id: 'dilma_eleita', data: [2010, 10, 31], categoria: 'politica', titulo: 'Eleição de 2010', fato: 'Em 31 de outubro de 2010, Dilma Rousseff foi eleita no segundo turno, a primeira mulher a ocupar a Presidência da República.', fonte: 'TSE (resultados das eleições de 2010).', peso: 'cotidiano', idadeMin: 10 },
  // ------------------------------------------------------------------ anos 2010
  { id: 'lei_cotas', data: [2012, 8, 29], categoria: 'direitos', titulo: 'A Lei de Cotas', fato: 'Em 29 de agosto de 2012 foi sancionada a lei que reservou metade das vagas das universidades e institutos federais para estudantes de escola pública, com subcotas por renda e para pretos, pardos e indígenas.', fonte: 'Lei 12.711/2012 (Planalto).', peso: 'cotidiano', idadeMin: 14 },
  { id: 'junho_2013', data: [2013, 6, 17], categoria: 'sociedade', titulo: 'Junho de 2013', fato: 'Em junho de 2013, protestos que começaram contra o aumento das passagens de ônibus em São Paulo se espalharam por centenas de cidades, com pautas diversas. Várias cidades recuaram no reajuste.', fonte: 'Biblioteca Nacional (hemeroteca); Câmara dos Deputados.', peso: 'biografia', idadeMin: 12 },
  { id: 'lava_jato', data: [2014, 3, 17], categoria: 'politica', titulo: 'A Operação Lava Jato', fato: 'Em 17 de março de 2014, a Polícia Federal deflagrou a Operação Lava Jato, que investigou desvios em contratos da Petrobras e se desdobrou em dezenas de fases nos anos seguintes.', fonte: 'Polícia Federal; Ministério Público Federal.', peso: 'cotidiano', idadeMin: 14 },
  { id: 'copa_2014', data: [2014, 7, 8], categoria: 'esporte', titulo: 'A Copa no Brasil', fato: 'O Brasil sediou a Copa do Mundo de junho a julho de 2014. Na semifinal, em 8 de julho, no Mineirão, a seleção perdeu para a Alemanha por 7 a 1.', fonte: 'FIFA; Ministério do Esporte.', peso: 'biografia', idadeMin: 5, mods: { ramos: { restaurante: 1.04, hotel: 1.05 } } },
  { id: 'dilma_reeleita', data: [2014, 10, 26], categoria: 'politica', titulo: 'Eleição de 2014', fato: 'Em 26 de outubro de 2014, Dilma Rousseff foi reeleita no segundo turno, contra Aécio Neves.', fonte: 'TSE (resultados das eleições de 2014).', peso: 'cotidiano', idadeMin: 12 },
  { id: 'mariana', data: [2015, 11, 5], categoria: 'desastre', titulo: 'O rompimento da barragem em Mariana', fato: 'Em 5 de novembro de 2015, a barragem de rejeitos de Fundão, em Mariana, se rompeu. A lama destruiu o distrito de Bento Rodrigues, matou dezenove pessoas e chegou ao mar pelo rio Doce, no Espírito Santo.', fonte: 'Governo de Minas Gerais; IBAMA; Ministério Público Federal.', ufs: ['MG', 'ES'], peso: 'biografia', idadeMin: 7 },
  { id: 'impeachment_dilma', data: [2016, 8, 31], categoria: 'politica', titulo: 'O impeachment de Dilma Rousseff', fato: 'Afastada em maio de 2016, Dilma Rousseff teve o impeachment aprovado pelo Senado em 31 de agosto de 2016, por crime de responsabilidade (operações de crédito com bancos públicos e decretos de crédito suplementar sem autorização do Congresso). Michel Temer, vice-presidente, assumiu a Presidência.', fonte: 'Senado Federal (Resolução 35/2016).', peso: 'biografia', idadeMin: 9 },
  { id: 'olimpiada_rio', data: [2016, 8, 5], categoria: 'esporte', titulo: 'Os Jogos no Rio', fato: 'De 5 a 21 de agosto de 2016, o Rio de Janeiro sediou os Jogos Olímpicos, os primeiros na América do Sul. Os Paralímpicos vieram em setembro.', fonte: 'Comitê Olímpico do Brasil; Autoridade Pública Olímpica.', peso: 'cotidiano', idadeMin: 5 },
  { id: 'reforma_trabalhista', data: [2017, 11, 11], categoria: 'economia', titulo: 'A reforma trabalhista', fato: 'Em 11 de novembro de 2017 entrou em vigor a reforma da CLT: acordos coletivos com mais peso, trabalho intermitente, fim da contribuição sindical obrigatória.', fonte: 'Lei 13.467/2017 (Planalto).', peso: 'cotidiano', idadeMin: 16 },
  { id: 'bolsonaro_eleito', data: [2018, 10, 28], categoria: 'politica', titulo: 'Eleição de 2018', fato: 'Em 28 de outubro de 2018, Jair Bolsonaro foi eleito presidente no segundo turno, contra Fernando Haddad.', fonte: 'TSE (resultados das eleições de 2018).', peso: 'cotidiano', idadeMin: 10 },
  { id: 'brumadinho', data: [2019, 1, 25], categoria: 'desastre', titulo: 'Brumadinho', fato: 'Em 25 de janeiro de 2019, a barragem de rejeitos da mina Córrego do Feijão, em Brumadinho, se rompeu e matou 270 pessoas.', fonte: 'Governo de Minas Gerais; Polícia Civil de Minas Gerais.', ufs: ['MG'], peso: 'biografia', idadeMin: 7 },
  { id: 'reforma_previdencia', data: [2019, 11, 12], categoria: 'economia', titulo: 'A reforma da Previdência', fato: 'Em 12 de novembro de 2019 foi promulgada a reforma da Previdência, com idade mínima para a aposentadoria (65 anos para homens e 62 para mulheres, com transição).', fonte: 'Emenda Constitucional 103/2019 (Planalto).', peso: 'cotidiano', idadeMin: 18 },
  // ------------------------------------------------------------------ anos 2020
  { id: 'covid_br', data: [2020, 3, 20], categoria: 'saude', titulo: 'A pandemia chega ao Brasil', fato: 'O primeiro caso de covid-19 no Brasil foi confirmado em São Paulo, em 26 de fevereiro de 2020; em 20 de março, o Congresso reconheceu o estado de calamidade pública. Escolas e comércios fecharam em quase todo o país.', fonte: 'Ministério da Saúde; Decreto Legislativo 6/2020.', peso: 'biografia', idadeMin: 4, especial: 'covid_br' },
  { id: 'auxilio_emergencial', data: [2020, 4, 2], categoria: 'economia', titulo: 'O auxílio emergencial', fato: 'Em abril de 2020 começou o pagamento do auxílio emergencial: R$ 600 por mês a trabalhadores informais, autônomos e desempregados de baixa renda (R$ 1.200 para mães chefes de família), reduzido a R$ 300 de setembro a dezembro.', fonte: 'Lei 13.982/2020; MP 1.000/2020; Ministério da Cidadania.', peso: 'cotidiano', idadeMin: 16, especial: 'auxilio' },
  { id: 'vacina_br', data: [2021, 1, 17], categoria: 'saude', titulo: 'A primeira vacina', fato: 'Em 17 de janeiro de 2021, logo depois da autorização emergencial da Anvisa, a enfermeira Mônica Calazans recebeu em São Paulo a primeira dose de vacina contra a covid-19 aplicada no Brasil.', fonte: 'Anvisa; Governo do Estado de São Paulo.', peso: 'cotidiano', idadeMin: 6 },
  { id: 'lula_2022', data: [2022, 10, 30], categoria: 'politica', titulo: 'Eleição de 2022', fato: 'Em 30 de outubro de 2022, Luiz Inácio Lula da Silva foi eleito presidente no segundo turno, contra Jair Bolsonaro, pela menor diferença desde a redemocratização.', fonte: 'TSE (resultados das eleições de 2022).', peso: 'cotidiano', idadeMin: 10 },
  { id: 'oito_janeiro', data: [2023, 1, 8], categoria: 'politica', titulo: '8 de janeiro', fato: 'Em 8 de janeiro de 2023, uma semana depois da posse, as sedes dos Três Poderes, em Brasília, foram invadidas e depredadas. Centenas de pessoas foram presas e processadas.', fonte: 'Supremo Tribunal Federal; Senado Federal; Câmara dos Deputados.', peso: 'cotidiano', idadeMin: 10 },
  { id: 'reforma_tributaria', data: [2023, 12, 20], categoria: 'economia', titulo: 'A reforma tributária', fato: 'Em 20 de dezembro de 2023 foi promulgada a reforma tributária sobre o consumo, que substitui aos poucos cinco tributos por um imposto sobre valor agregado dual, com transição até 2033.', fonte: 'Emenda Constitucional 132/2023 (Planalto).', peso: 'cotidiano', idadeMin: 18 },
  { id: 'enchentes_rs', data: [2024, 5, 3], categoria: 'desastre', titulo: 'As enchentes no Rio Grande do Sul', fato: 'Entre o fim de abril e maio de 2024, chuvas extremas inundaram centenas de municípios do Rio Grande do Sul, inclusive Porto Alegre. Foi a maior catástrofe climática da história do estado.', fonte: 'Defesa Civil do Rio Grande do Sul; Governo do Estado do Rio Grande do Sul.', ufs: ['RS'], peso: 'biografia', idadeMin: 5, mods: { clientela: -8 }, dura: 0 },
  { id: 'cop30', data: [2025, 11, 10], categoria: 'sociedade', titulo: 'A COP30 em Belém', fato: 'Em novembro de 2025, Belém sediou a 30ª Conferência das Nações Unidas sobre Mudança do Clima.', fonte: 'Organização das Nações Unidas (UNFCCC); Governo Federal.', peso: 'cotidiano', idadeMin: 10, ufs: ['PA'] }
];

/** As posses presidenciais (para o painel da época: quem governa o país no mês). Fonte: Biblioteca da Presidência da República. */
export const PRESIDENTES_BR: readonly { nome: string; desde: [number, number]; nota?: string }[] = [
  { nome: 'João Figueiredo', desde: [1979, 3] },
  { nome: 'José Sarney', desde: [1985, 3], nota: 'vice de Tancredo Neves, que morreu antes da posse' },
  { nome: 'Fernando Collor de Mello', desde: [1990, 3] },
  { nome: 'Itamar Franco', desde: [1992, 10], nota: 'assumiu com o afastamento de Collor' },
  { nome: 'Fernando Henrique Cardoso', desde: [1995, 1] },
  { nome: 'Luiz Inácio Lula da Silva', desde: [2003, 1] },
  { nome: 'Dilma Rousseff', desde: [2011, 1] },
  { nome: 'Michel Temer', desde: [2016, 5], nota: 'interino de maio a agosto de 2016' },
  { nome: 'Jair Bolsonaro', desde: [2019, 1] },
  { nome: 'Luiz Inácio Lula da Silva', desde: [2023, 1] }
];

/** PIB real, variação anual (%), Ipeadata SCN10_PIBG10 (fonte primária: IBGE, Contas Nacionais). 2025: preliminar. */
export const PIB_BR: Readonly<Record<number, number>> = {
  1980: 9.2, 1981: -4.25, 1982: 0.83, 1983: -2.93, 1984: 5.4, 1985: 7.85, 1986: 7.49, 1987: 3.53, 1988: -0.06, 1989: 3.16,
  1990: -4.35, 1991: 1.03, 1992: -0.54, 1993: 4.92, 1994: 5.85, 1995: 4.22, 1996: 2.21, 1997: 3.39, 1998: 0.34, 1999: 0.47,
  2000: 4.39, 2001: 1.39, 2002: 3.05, 2003: 1.14, 2004: 5.76, 2005: 3.2, 2006: 3.96, 2007: 6.07, 2008: 5.09, 2009: -0.13,
  2010: 7.53, 2011: 3.97, 2012: 1.92, 2013: 3.0, 2014: 0.5, 2015: -3.55, 2016: -3.28, 2017: 1.32, 2018: 1.78, 2019: 1.22,
  2020: -3.28, 2021: 4.76, 2022: 3.02, 2023: 3.24, 2024: 3.42, 2025: 2.29
};

/**
 * As Copas do Mundo e os Jogos Olímpicos de verão (FIFA; Comitê Olímpico Internacional): numa vida histórica, até 2025,
 * substituem o "torneio mundial" e os "jogos multiesportivos" genéricos do mundo (`v14/mundo`). O tetra, o penta, a
 * Copa de 2014 e os Jogos do Rio têm acontecimento próprio acima.
 */
const COPAS: [number, number, string, string][] = [
  [1982, 7, 'na Espanha', 'A seleção encantou e caiu na segunda fase, diante da Itália.'],
  [1986, 6, 'no México', 'O Brasil caiu nas quartas de final, nos pênaltis, diante da França.'],
  [1990, 6, 'na Itália', 'O Brasil caiu nas oitavas de final, diante da Argentina.'],
  [1998, 7, 'na França', 'O Brasil chegou à final e perdeu para a França por 3 a 0.'],
  [2006, 7, 'na Alemanha', 'O Brasil caiu nas quartas de final, diante da França.'],
  [2010, 7, 'na África do Sul', 'O Brasil caiu nas quartas de final, diante da Holanda.'],
  [2018, 7, 'na Rússia', 'O Brasil caiu nas quartas de final, diante da Bélgica.'],
  [2022, 12, 'no Catar, em novembro e dezembro', 'O Brasil caiu nas quartas de final, nos pênaltis, diante da Croácia.']
];
const OLIMPIADAS: [number, number, string][] = [
  [1984, 8, 'Los Angeles'], [1988, 9, 'Seul'], [1992, 7, 'Barcelona'], [1996, 7, 'Atlanta'], [2000, 9, 'Sydney'],
  [2004, 8, 'Atenas'], [2008, 8, 'Pequim'], [2012, 8, 'Londres'], [2021, 7, 'Tóquio (adiados de 2020 pela pandemia)'], [2024, 8, 'Paris']
];
export const ESPORTE_MUNDIAL_BR: readonly AcontecimentoBR[] = [
  ...COPAS.map(([ano, mes, onde, como]): AcontecimentoBR => ({ id: `copa_${ano}`, data: [ano, mes], categoria: 'esporte', titulo: `A Copa de ${ano}`, fato: `A Copa do Mundo de ${ano} foi ${onde}. ${como}`, fonte: 'FIFA.', peso: 'cotidiano', idadeMin: 5, mods: { ramos: { restaurante: 1.03 } } })),
  ...OLIMPIADAS.map(([ano, mes, onde]): AcontecimentoBR => ({ id: `jogos_${ano}`, data: [ano, mes], categoria: 'esporte', titulo: `Os Jogos de ${onde.split(' (')[0]}`, fato: `Os Jogos Olímpicos de ${ano} foram em ${onde}. As provas passavam na TV a qualquer hora do dia, e o quadro de medalhas virou assunto.`, fonte: 'Comitê Olímpico Internacional; Comitê Olímpico do Brasil.', peso: 'cotidiano', idadeMin: 6 }))
];
