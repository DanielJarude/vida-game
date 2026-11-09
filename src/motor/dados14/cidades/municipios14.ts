/**
 * VIDA 14 · Cidades — mais municípios brasileiros no mapa (Igarassu entre eles), cada um com o que o faz ser ELE: o custo
 * de vida e os salários relativos (um ajuste fino sobre o perfil × região de `lugares.economiaLocal`), o litoral (pesca,
 * prancha) e as VOCAÇÕES econômicas — o que a cidade faz e onde aparecem vagas (`v14/cidades.oportunidadeLocal14`).
 * Catálogo puro (só tipos; pacote `dados14-cidades`).
 *
 * Como os da 12.9.1, entram no mapa DEPOIS das listas de sempre (os códigos das cidades antigas não mudam) e FORA dos
 * sorteios do mundo (`cidadesDoPais` continua a lista de sempre: as sementes de antes dão as mesmas vidas). Existem para
 * nascer (escolhendo), morar, estudar, trabalhar e mudar de cidade.
 *
 * Perfil pelo critério de `municipios1291`: colada numa metrópole → 'metropolitana' (a metrópole da mesma UF); polo
 * regional acima de ~130 mil habitantes → 'polo'; o resto → 'pequena'. População: Censo 2022 (IBGE), mil habitantes,
 * arredondada — documenta, o motor não modela população. `custo`/`salario` multiplicam o perfil × região (1 = igual a
 * qualquer cidade do mesmo porte na mesma região): a cidade turística cara, o polo do agro ou da mineração que paga mais.
 * São parâmetros de plausibilidade, não estatística oficial. NENHUMA característica fecha porta: elas dão contexto,
 * preço e oportunidades.
 */
import type { PerfilUrbano } from '../../mundo/tipos';
import type { LinhaMunicipio1291 } from '../../dados/municipios1291';

export type Vocacao14 =
  | 'turismo' | 'patrimonio' | 'industria' | 'automotiva' | 'pesca' | 'porto' | 'agro' | 'mineracao' | 'petroleo'
  | 'comercio' | 'servicos' | 'educacao' | 'logistica' | 'textil' | 'construcao' | 'tecnologia';

export interface Municipio14 {
  nome: string; uf: string; perfil: PerfilUrbano; metropole?: string;
  /** Censo 2022, mil habitantes. */
  pop: number;
  /** Ajuste do custo de vida (e do aluguel) sobre o perfil × região. */
  custo: number;
  /** Ajuste dos salários sobre o perfil × região. */
  salario: number;
  /** Mar, mangue ou rio grande de pesca (vale mesmo para cidade metropolitana). */
  litoral?: boolean;
  vocacoes: Vocacao14[];
  /** Uma frase: o que é a cidade. */
  nota: string;
}

const c = (nome: string, uf: string, perfil: PerfilUrbano, metropole: string | undefined, pop: number, custo: number, salario: number, litoral: boolean, vocacoes: Vocacao14[], nota: string): Municipio14 =>
  ({ nome, uf, perfil, metropole, pop, custo, salario, litoral: litoral || undefined, vocacoes, nota });

export const MUNICIPIOS_14: readonly Municipio14[] = [
  // Pernambuco
  c('Igarassu', 'PE', 'metropolitana', 'Recife', 115, 0.95, 0.95, true, ['patrimonio', 'industria', 'pesca', 'comercio'],
    'Litoral norte da Região Metropolitana do Recife: a igreja de São Cosme e Damião (1535), uma das mais antigas do Brasil, o centro histórico, o canal de Santa Cruz com pesca e mariscagem, e as fábricas do eixo norte, a caminho do polo automotivo de Goiana.'),
  c('Olinda', 'PE', 'metropolitana', 'Recife', 350, 1.0, 0.97, true, ['patrimonio', 'turismo', 'servicos'],
    'Patrimônio da Humanidade colado no Recife: ladeiras, igrejas, ateliês, o carnaval de rua dos bonecos gigantes.'),
  c('Paulista', 'PE', 'metropolitana', 'Recife', 342, 0.97, 0.95, true, ['comercio', 'servicos', 'textil'],
    'Cidade-dormitório grande ao norte do Recife, com praias, comércio de bairro e as antigas tecelagens.'),
  c('Cabo de Santo Agostinho', 'PE', 'metropolitana', 'Recife', 204, 0.98, 1.05, true, ['porto', 'industria', 'petroleo', 'turismo'],
    'O Complexo de Suape: porto, refinaria, estaleiro e indústria — e as praias de Gaibu e Calhetas.'),
  c('Ipojuca', 'PE', 'metropolitana', 'Recife', 98, 1.04, 1.04, true, ['turismo', 'porto', 'industria'],
    'Porto de Galinhas de um lado, o porto de Suape do outro: hotelaria e indústria pesada no mesmo município.'),
  c('Goiana', 'PE', 'pequena', undefined, 81, 0.97, 1.1, true, ['automotiva', 'industria', 'agro', 'pesca'],
    'O polo automotivo da Mata Norte: a fábrica de carros e os fornecedores ao lado dos canaviais e das praias de pescadores.'),
  c('Garanhuns', 'PE', 'polo', undefined, 142, 0.97, 0.95, false, ['servicos', 'educacao', 'turismo'],
    'A cidade das flores do Agreste: clima frio para o Nordeste, o Festival de Inverno, laticínios e universidades.'),
  // Bahia
  c('Lauro de Freitas', 'BA', 'metropolitana', 'Salvador', 204, 1.08, 1.02, true, ['servicos', 'comercio', 'turismo'],
    'Colada em Salvador pela orla: condomínios, aeroporto ao lado, comércio e serviços.'),
  c('Porto Seguro', 'BA', 'polo', undefined, 168, 1.05, 0.95, true, ['turismo', 'patrimonio', 'comercio'],
    'Onde a história oficial do Brasil começa: centro histórico, Arraial d\'Ajuda, Trancoso e uma economia que vive do turismo.'),
  // Ceará
  c('Caucaia', 'CE', 'metropolitana', 'Fortaleza', 355, 0.96, 0.95, true, ['porto', 'industria', 'turismo'],
    'Vizinha de Fortaleza: o porto do Pecém, a zona industrial e as praias de Cumbuco.'),
  c('Maracanaú', 'CE', 'metropolitana', 'Fortaleza', 234, 0.95, 0.97, false, ['industria', 'textil', 'logistica'],
    'O distrito industrial de Fortaleza: confecção, metalurgia, alimentos.'),
  c('Crato', 'CE', 'polo', undefined, 131, 0.94, 0.93, false, ['educacao', 'comercio', 'agro'],
    'Pé da Chapada do Araripe, no Cariri: universidade, feira, cultura popular.'),
  // Rio Grande do Norte, Paraíba, Alagoas, Sergipe, Piauí, Maranhão
  c('Parnamirim', 'RN', 'polo', undefined, 252, 1.0, 0.98, true, ['servicos', 'comercio', 'construcao'],
    'Encostada em Natal: base aérea, condomínios, praias de Pirangi e o maior cajueiro do mundo.'),
  c('Sousa', 'PB', 'pequena', undefined, 67, 0.95, 0.95, false, ['agro', 'comercio'],
    'Sertão paraibano: o Vale dos Dinossauros, a irrigação de coco e o comércio da região.'),
  c('Maragogi', 'AL', 'pequena', undefined, 33, 1.0, 0.95, true, ['turismo', 'pesca'],
    'As piscinas naturais da Costa dos Corais: resorts, jangadas e pesca.'),
  c('Itabaiana', 'SE', 'pequena', undefined, 103, 0.95, 0.97, false, ['comercio', 'logistica', 'agro'],
    'Agreste sergipano: a feira, os caminhoneiros, as hortas que abastecem o estado.'),
  c('Floriano', 'PI', 'pequena', undefined, 60, 0.95, 0.95, true, ['comercio', 'educacao', 'pesca'],
    'À beira do Parnaíba: comércio regional e campus universitário.'),
  c('Timon', 'MA', 'polo', undefined, 174, 0.95, 0.95, true, ['comercio', 'servicos'],
    'Do outro lado da ponte de Teresina: quem mora aqui trabalha muito do lado de lá.'),
  c('Caxias', 'MA', 'polo', undefined, 156, 0.94, 0.93, true, ['comercio', 'agro', 'educacao'],
    'A terra de Gonçalves Dias, no leste maranhense: comércio, agro e universidade.'),
  c('Barreirinhas', 'MA', 'pequena', undefined, 65, 0.97, 0.9, true, ['turismo', 'pesca'],
    'A porta dos Lençóis Maranhenses: pousadas, toyoteiros, pesca no Preguiças.'),
  // Norte
  c('Sena Madureira', 'AC', 'pequena', undefined, 41, 0.98, 0.95, true, ['agro', 'comercio'],
    'Às margens do Iaco: castanha, roça e comércio ribeirinho.'),
  c('Laranjal do Jari', 'AP', 'pequena', undefined, 35, 1.0, 0.95, true, ['agro', 'comercio'],
    'Sul do Amapá, à beira do Jari: castanha, açaí e o comércio de quem desce o rio.'),
  c('Manacapuru', 'AM', 'pequena', undefined, 101, 0.97, 0.93, true, ['pesca', 'agro', 'comercio'],
    'A princesinha do Solimões: pesca, juta, a ciranda e a estrada até Manaus.'),
  c('Castanhal', 'PA', 'polo', undefined, 192, 0.96, 0.95, true, ['comercio', 'industria', 'agro'],
    'Entroncamento do nordeste paraense: frigoríficos, comércio e a BR que vai a Belém.'),
  c('Parauapebas', 'PA', 'polo', undefined, 267, 1.05, 1.18, false, ['mineracao', 'construcao', 'comercio'],
    'Ao pé de Carajás: a maior mina de ferro do mundo paga bem — e a cidade cresceu mais rápido que os serviços.'),
  c('Vilhena', 'RO', 'pequena', undefined, 95, 1.0, 1.02, false, ['agro', 'comercio', 'logistica'],
    'A porta de Rondônia na BR-364: soja, comércio e caminhões.'),
  c('Porto Nacional', 'TO', 'pequena', undefined, 64, 0.97, 0.97, true, ['agro', 'patrimonio', 'educacao'],
    'À beira do lago do Tocantins: centro histórico, campus e porto de grãos.'),
  c('Caracaraí', 'RR', 'pequena', undefined, 22, 0.98, 0.93, true, ['pesca', 'agro'],
    'Às margens do rio Branco: pesca esportiva, roça e a estrada para Manaus.'),
  // Centro-Oeste
  c('Rio Verde', 'GO', 'polo', undefined, 226, 1.0, 1.1, false, ['agro', 'industria', 'logistica'],
    'Capital do agronegócio goiano: grãos, frigoríficos, máquinas — salário de campo acima da média.'),
  c('Caldas Novas', 'GO', 'pequena', undefined, 98, 1.08, 0.95, false, ['turismo', 'servicos', 'construcao'],
    'Águas termais e parques aquáticos: hotelaria o ano inteiro.'),
  c('Sorriso', 'MT', 'pequena', undefined, 110, 1.05, 1.12, false, ['agro', 'logistica'],
    'A maior produtora de soja do país: máquinas, armazéns e salários puxados pelo campo.'),
  c('Lucas do Rio Verde', 'MT', 'pequena', undefined, 83, 1.05, 1.1, false, ['agro', 'industria'],
    'Agroindústria planejada no meio da soja: frigoríficos, etanol de milho, armazéns.'),
  c('Três Lagoas', 'MS', 'polo', undefined, 132, 1.0, 1.08, true, ['industria', 'agro', 'logistica'],
    'A capital da celulose: fábricas gigantes, eucalipto até o horizonte, o rio Paraná.'),
  c('Bonito', 'MS', 'pequena', undefined, 23, 1.12, 0.97, false, ['turismo'],
    'Rios de água transparente e ecoturismo controlado: guias, pousadas e restaurantes.'),
  // Minas Gerais
  c('Ouro Preto', 'MG', 'pequena', undefined, 74, 1.0, 0.97, false, ['patrimonio', 'turismo', 'educacao', 'mineracao'],
    'Barroco, ladeiras e repúblicas de estudantes: a universidade, o turismo e a mineração em volta.'),
  c('Ipatinga', 'MG', 'polo', undefined, 227, 0.98, 1.06, false, ['industria', 'servicos'],
    'Vale do Aço: a siderúrgica no centro da cidade e da economia.'),
  c('Governador Valadares', 'MG', 'polo', undefined, 257, 0.95, 0.95, true, ['comercio', 'servicos', 'agro'],
    'O Pico da Ibituruna, o rio Doce e as famílias com alguém nos Estados Unidos.'),
  c('Divinópolis', 'MG', 'polo', undefined, 231, 0.97, 0.98, false, ['textil', 'industria', 'comercio'],
    'Centro-oeste mineiro: confecção, siderurgia e comércio regional.'),
  c('Ribeirão das Neves', 'MG', 'metropolitana', 'Belo Horizonte', 329, 0.92, 0.92, false, ['comercio', 'servicos'],
    'Na Grande BH, onde muita gente dorme e trabalha na capital.'),
  // Rio de Janeiro
  c('São Gonçalo', 'RJ', 'metropolitana', 'Rio de Janeiro', 896, 0.94, 0.95, true, ['comercio', 'servicos', 'pesca'],
    'Do outro lado da baía: comércio popular, gente que atravessa a ponte todo dia, pesca na baía de Guanabara.'),
  c('Campos dos Goytacazes', 'RJ', 'polo', undefined, 483, 0.97, 1.0, true, ['petroleo', 'agro', 'educacao'],
    'Maior município do estado: os royalties da bacia de Campos, a cana e as universidades.'),
  c('Cabo Frio', 'RJ', 'polo', undefined, 222, 1.06, 0.97, true, ['turismo', 'pesca', 'construcao'],
    'Praias de areia branca, veraneio lotado e a pesca da Região dos Lagos.'),
  c('Angra dos Reis', 'RJ', 'polo', undefined, 167, 1.06, 1.03, true, ['turismo', 'porto', 'petroleo'],
    'Trezentas e tantas ilhas, o estaleiro, o terminal de petróleo e as usinas nucleares.'),
  c('Paraty', 'RJ', 'pequena', undefined, 45, 1.12, 0.97, true, ['patrimonio', 'turismo', 'pesca'],
    'Centro colonial de pedra, a Flip, cachaça e barcos de pesca.'),
  // São Paulo
  c('Osasco', 'SP', 'metropolitana', 'São Paulo', 728, 1.02, 1.0, false, ['servicos', 'comercio', 'logistica'],
    'Grudada na capital: bancos, comércio e centros de distribuição.'),
  c('Mogi das Cruzes', 'SP', 'metropolitana', 'São Paulo', 451, 0.98, 0.98, false, ['agro', 'industria', 'educacao'],
    'Cinturão verde de São Paulo: hortaliças, cogumelos, indústria e universidades.'),
  c('Jundiaí', 'SP', 'polo', undefined, 443, 1.06, 1.06, false, ['logistica', 'industria', 'agro'],
    'Entre São Paulo e Campinas: indústria, galpões logísticos e a uva da Serra do Japi.'),
  c('São José do Rio Preto', 'SP', 'polo', undefined, 480, 1.0, 1.0, false, ['servicos', 'comercio', 'educacao'],
    'Polo de saúde e serviços do noroeste paulista.'),
  c('Taubaté', 'SP', 'polo', undefined, 310, 0.98, 1.04, false, ['automotiva', 'industria', 'educacao'],
    'Vale do Paraíba: montadoras, autopeças e a universidade municipal.'),
  c('Guarujá', 'SP', 'polo', undefined, 287, 1.05, 0.98, true, ['turismo', 'porto', 'pesca'],
    'Praias da Baixada Santista e a margem esquerda do porto de Santos.'),
  c('Ubatuba', 'SP', 'pequena', undefined, 92, 1.08, 0.95, true, ['turismo', 'pesca'],
    'Litoral norte: oitenta e tantas praias, surfe, caiçaras e pesca.'),
  c('Campos do Jordão', 'SP', 'pequena', undefined, 46, 1.15, 0.97, false, ['turismo', 'servicos'],
    'Serra da Mantiqueira: o inverno de festival, chocolate e hotelaria.'),
  // Espírito Santo
  c('Serra', 'ES', 'metropolitana', 'Vitória', 520, 0.98, 1.02, true, ['industria', 'porto', 'logistica'],
    'A cidade industrial da Grande Vitória: siderurgia, porto de Tubarão ao lado, praias de Jacaraípe.'),
  c('Guarapari', 'ES', 'pequena', undefined, 124, 1.03, 0.95, true, ['turismo', 'pesca'],
    'A cidade saúde das areias monazíticas: veraneio mineiro e pesca.'),
  c('Cachoeiro de Itapemirim', 'ES', 'polo', undefined, 185, 0.96, 0.98, false, ['mineracao', 'industria', 'comercio'],
    'Mármore e granito: pedreiras, serrarias e a terra de Roberto Carlos.'),
  // Paraná
  c('São José dos Pinhais', 'PR', 'metropolitana', 'Curitiba', 329, 0.98, 1.06, false, ['automotiva', 'industria', 'logistica'],
    'O aeroporto de Curitiba e as montadoras: indústria e logística.'),
  c('Cascavel', 'PR', 'polo', undefined, 348, 1.0, 1.03, false, ['agro', 'comercio', 'servicos'],
    'Oeste paranaense: cooperativas, o Show Rural e o comércio da região.'),
  c('Paranaguá', 'PR', 'polo', undefined, 145, 0.98, 1.03, true, ['porto', 'logistica', 'pesca'],
    'O porto dos grãos do Sul e a porta da Ilha do Mel.'),
  // Santa Catarina
  c('São José', 'SC', 'metropolitana', 'Florianópolis', 270, 1.0, 1.0, true, ['comercio', 'servicos', 'tecnologia'],
    'Continente da Grande Florianópolis: comércio, serviços e empresas de tecnologia.'),
  c('Balneário Camboriú', 'SC', 'polo', undefined, 139, 1.3, 1.02, true, ['turismo', 'construcao', 'servicos'],
    'Os prédios mais altos do país na beira da praia: construção, turismo e o metro quadrado mais caro do Brasil.'),
  c('Itajaí', 'SC', 'polo', undefined, 264, 1.04, 1.06, true, ['porto', 'pesca', 'logistica'],
    'Porto de contêineres, a maior frota pesqueira do país e a Marejada.'),
  c('Jaraguá do Sul', 'SC', 'polo', undefined, 182, 1.0, 1.08, false, ['industria', 'textil', 'tecnologia'],
    'Motores elétricos, malharias e indústria de ponta no norte catarinense.'),
  // Rio Grande do Sul
  c('Novo Hamburgo', 'RS', 'metropolitana', 'Porto Alegre', 227, 0.98, 0.98, false, ['industria', 'comercio'],
    'A capital nacional do calçado, no Vale dos Sinos.'),
  c('Passo Fundo', 'RS', 'polo', undefined, 206, 0.98, 1.0, false, ['agro', 'servicos', 'educacao'],
    'Planalto gaúcho: polo de saúde, universidade e a Jornada de Literatura.'),
  c('Gramado', 'RS', 'pequena', undefined, 40, 1.2, 1.0, false, ['turismo', 'servicos'],
    'Serra Gaúcha: o Festival de Cinema, o Natal Luz, chocolate e hotelaria o ano inteiro.'),
  c('Bento Gonçalves', 'RS', 'pequena', undefined, 123, 1.04, 1.04, false, ['agro', 'industria', 'turismo'],
    'O Vale dos Vinhedos: vinícolas, enoturismo e o polo moveleiro.'),
  c('Rio Grande', 'RS', 'polo', undefined, 191, 0.96, 1.02, true, ['porto', 'pesca', 'industria'],
    'O porto do extremo sul, os estaleiros e a pesca da Lagoa dos Patos.')
];

/** O rótulo de cada vocação e o que ela abre (ocupações do catálogo; o motor confere se existem). */
export const VOCACOES_14: Record<Vocacao14, { rotulo: string; ocupacoes: string[]; vaga: string }> = {
  turismo: { rotulo: 'turismo', ocupacoes: ['garcom', 'cozinheiro', 'recepcionista', 'atendente'], vaga: 'a alta temporada abriu vagas em hotéis, pousadas e restaurantes' },
  patrimonio: { rotulo: 'turismo histórico', ocupacoes: ['artesao', 'garcom', 'recepcionista', 'atendente'], vaga: 'o centro histórico recebe excursões e precisa de gente nos restaurantes, lojas e ateliês' },
  industria: { rotulo: 'indústria', ocupacoes: ['operador_producao', 'soldador', 'tecnico_industrial', 'eletricista_manutencao', 'eng_industrial_jr'], vaga: 'uma fábrica da região ampliou o turno e está contratando' },
  automotiva: { rotulo: 'polo automotivo', ocupacoes: ['operador_producao', 'tecnico_automacao', 'soldador', 'eng_industrial_jr'], vaga: 'a montadora e os fornecedores abriram seleção para a linha de produção' },
  pesca: { rotulo: 'pesca', ocupacoes: ['pescador'], vaga: 'a colônia de pescadores procura gente para os barcos da safra' },
  porto: { rotulo: 'porto', ocupacoes: ['estoquista', 'operador_empilhadeira', 'analista_logistica', 'motorista_caminhao'], vaga: 'o porto bateu recorde de movimento e os terminais contratam' },
  agro: { rotulo: 'agronegócio', ocupacoes: ['trabalhador_rural', 'operador_maquinas', 'tecnico_agricola', 'agronomo'], vaga: 'a safra pede gente: fazendas e cooperativas contratam' },
  mineracao: { rotulo: 'mineração', ocupacoes: ['operador_producao', 'motorista_caminhao', 'tecnico_industrial', 'soldador'], vaga: 'a mineradora abriu vagas para a operação e a manutenção' },
  petroleo: { rotulo: 'petróleo e energia', ocupacoes: ['tecnico_industrial', 'soldador', 'eletricista_manutencao'], vaga: 'as prestadoras do setor de petróleo estão contratando técnicos' },
  comercio: { rotulo: 'comércio', ocupacoes: ['vendedor', 'atendente', 'caixa', 'representante'], vaga: 'o comércio do centro está contratando' },
  servicos: { rotulo: 'serviços', ocupacoes: ['recepcionista', 'atendente', 'tec_enfermagem'], vaga: 'clínicas, escritórios e lojas de serviço abriram vagas' },
  educacao: { rotulo: 'educação', ocupacoes: ['professor_fund', 'professor_infantil', 'professor_idiomas'], vaga: 'escolas e cursos da cidade procuram professores' },
  logistica: { rotulo: 'logística', ocupacoes: ['estoquista', 'operador_empilhadeira', 'motorista_caminhao', 'analista_logistica'], vaga: 'um centro de distribuição novo abriu na rodovia' },
  textil: { rotulo: 'confecção', ocupacoes: ['operador_confeccao', 'costureiro', 'costureiro_piloto'], vaga: 'as confecções da cidade estão com encomenda e contratam' },
  construcao: { rotulo: 'construção', ocupacoes: ['pedreiro', 'tecnico_edificacoes', 'eletricista'], vaga: 'as obras da cidade não param e as construtoras contratam' },
  tecnologia: { rotulo: 'tecnologia', ocupacoes: ['suporte_ti', 'dev_jr'], vaga: 'as empresas de tecnologia da região abriram vagas' }
};

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
/** O id que `lugares` dá a uma cidade brasileira (`igarassu-pe`). */
export const idDoMunicipio14 = (m: Pick<Municipio14, 'nome' | 'uf'>) => `${slug(m.nome)}-${m.uf.toLowerCase()}`;

/** As linhas no formato de `municipios1291` (nome, UF, perfil, metrópole, população) — o mapa as lê dali. */
export const LINHAS_MUNICIPIOS_14: readonly LinhaMunicipio1291[] = MUNICIPIOS_14.map(m => [m.nome, m.uf, m.perfil, m.metropole, m.pop]);

/** id → [ajuste do custo, ajuste do salário, litoral 1|0] (o gancho de `lugares.economiaLocal` e `pertoDaAgua`). */
export const AJUSTE_LOCAL_14: Readonly<Record<string, readonly [number, number, number]>> = Object.fromEntries(
  MUNICIPIOS_14.map(m => [idDoMunicipio14(m), [m.custo, m.salario, m.litoral ? 1 : 0] as const])
);

const POR_ID = new Map(MUNICIPIOS_14.map(m => [idDoMunicipio14(m), m]));
/** A ficha de uma cidade da VIDA 14 (undefined para as outras). */
export const municipio14 = (id: string): Municipio14 | undefined => POR_ID.get(id);
