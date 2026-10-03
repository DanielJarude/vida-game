/**
 * Lugares.
 *
 * Não modelamos 5.570 municípios. Modelamos PERFIS urbanos × REGIÃO, e cada
 * município da lista herda custo de vida, salários, aluguel e oferta de
 * cursos do seu perfil. É o suficiente para que morar em Tarauacá, em
 * Ribeirão Preto ou em São Paulo produza vidas diferentes.
 *
 * Os números são parâmetros de balanceamento calibrados para parecer
 * plausíveis em reais de hoje — não são estatística oficial.
 */

import type { Regiao } from '../tipos';
import type { PerfilDePais, PerfilUrbano } from '../mundo/tipos';
import { aoRegistrar, idDaCidade, indiceNoCatalogo, PAIS_PADRAO, paisDoCatalogo, paisDoId, paisPeloIndice, perfilDoPais, temPerfil } from '../mundo/registro';

/*
 * O MUNDO: as cidades brasileiras moram aqui desde o começo (os ids delas,
 * `sao-paulo-sp`, estão nos saves). As de outros países vêm dos perfis
 * (`mundo/paises/*`), com id `<país>:<cidade>` (`ar:cordoba`), e entram no
 * mesmo índice quando o pacote da região chega. Quem pergunta por uma cidade
 * (`municipio`) não precisa saber de que país ela é — e quem precisa sabe
 * (`paisDaCidade`).
 *
 *   - `perfil` (o porte) vale em qualquer país;
 *   - `uf` é o código da divisão de primeiro nível (a UF no Brasil; a
 *     província, o estado, a região, a prefeitura alhures);
 *   - `regiao` (Norte, Nordeste...) só existe no Brasil: é uma desigualdade
 *     regional REAL do Brasil, que o perfil de outro país expressa nas
 *     próprias divisões (`Divisao.custo`/`salario`).
 */

export type { PerfilUrbano };
//   'metropole'      grande centro: tudo existe, tudo custa
//   'metropolitana'  cidade grande colada numa metrópole: acesso à metrópole, aluguel menor
//   'capital'        capital de estado (sede de divisão) de porte médio
//   'polo'           cidade média, polo regional
//   'pequena'        interior: pouca oferta, custo baixo

export interface Municipio {
  id: string;
  nome: string;
  /** O país (ISO 3166-1). */
  pais: string;
  /** A divisão de primeiro nível (código). */
  uf: string;
  /** A região brasileira (só no Brasil). */
  regiao?: Regiao;
  perfil: PerfilUrbano;
  /** Sede da divisão (capital do estado, da província...). */
  capital?: boolean;
  /** Capital do país. */
  capitalNacional?: boolean;
  /** Para cidades metropolitanas: a metrópole cuja oferta é acessível. */
  metropole?: string;
  /** No litoral (ou num rio/lago grande de pesca). Fora do Brasil, dado do perfil. */
  litoral?: boolean;
}

const REGIAO_UF: Record<string, Regiao> = {
  AC: 'Norte', AP: 'Norte', AM: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul'
};

export const NOMES_UF: Record<string, string> = {
  AC: 'Acre', AP: 'Amapá', AM: 'Amazonas', PA: 'Pará', RO: 'Rondônia', RR: 'Roraima', TO: 'Tocantins',
  AL: 'Alagoas', BA: 'Bahia', CE: 'Ceará', MA: 'Maranhão', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí', RN: 'Rio Grande do Norte', SE: 'Sergipe',
  DF: 'Distrito Federal', GO: 'Goiás', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  ES: 'Espírito Santo', MG: 'Minas Gerais', RJ: 'Rio de Janeiro', SP: 'São Paulo',
  PR: 'Paraná', RS: 'Rio Grande do Sul', SC: 'Santa Catarina'
};

// [nome, uf, perfil, capital?, metrópole?]
type Linha = [string, string, PerfilUrbano, boolean?, string?];

const LINHAS: Linha[] = [
  // Norte
  ['Rio Branco', 'AC', 'capital', true], ['Cruzeiro do Sul', 'AC', 'polo'], ['Tarauacá', 'AC', 'pequena'],
  ['Macapá', 'AP', 'capital', true], ['Santana', 'AP', 'pequena'], ['Oiapoque', 'AP', 'pequena'],
  ['Manaus', 'AM', 'metropole', true], ['Parintins', 'AM', 'polo'], ['Itacoatiara', 'AM', 'pequena'], ['Tefé', 'AM', 'pequena'],
  ['Belém', 'PA', 'metropole', true], ['Ananindeua', 'PA', 'metropolitana', false, 'Belém'], ['Santarém', 'PA', 'polo'], ['Marabá', 'PA', 'polo'], ['Altamira', 'PA', 'pequena'],
  ['Porto Velho', 'RO', 'capital', true], ['Ji-Paraná', 'RO', 'polo'], ['Ariquemes', 'RO', 'pequena'],
  ['Boa Vista', 'RR', 'capital', true], ['Rorainópolis', 'RR', 'pequena'],
  ['Palmas', 'TO', 'capital', true], ['Araguaína', 'TO', 'polo'], ['Gurupi', 'TO', 'pequena'],
  // Nordeste
  ['Maceió', 'AL', 'capital', true], ['Arapiraca', 'AL', 'polo'], ['Penedo', 'AL', 'pequena'],
  ['Salvador', 'BA', 'metropole', true], ['Feira de Santana', 'BA', 'polo'], ['Vitória da Conquista', 'BA', 'polo'], ['Ilhéus', 'BA', 'polo'], ['Juazeiro', 'BA', 'polo'], ['Irecê', 'BA', 'pequena'],
  ['Fortaleza', 'CE', 'metropole', true], ['Juazeiro do Norte', 'CE', 'polo'], ['Sobral', 'CE', 'polo'], ['Quixadá', 'CE', 'pequena'],
  ['São Luís', 'MA', 'capital', true], ['Imperatriz', 'MA', 'polo'], ['Bacabal', 'MA', 'pequena'],
  ['João Pessoa', 'PB', 'capital', true], ['Campina Grande', 'PB', 'polo'], ['Patos', 'PB', 'pequena'],
  ['Recife', 'PE', 'metropole', true], ['Jaboatão dos Guararapes', 'PE', 'metropolitana', false, 'Recife'], ['Caruaru', 'PE', 'polo'], ['Petrolina', 'PE', 'polo'], ['Serra Talhada', 'PE', 'pequena'],
  ['Teresina', 'PI', 'capital', true], ['Parnaíba', 'PI', 'polo'], ['Picos', 'PI', 'pequena'],
  ['Natal', 'RN', 'capital', true], ['Mossoró', 'RN', 'polo'], ['Caicó', 'RN', 'pequena'],
  ['Aracaju', 'SE', 'capital', true], ['Lagarto', 'SE', 'pequena'],
  // Centro-Oeste
  ['Brasília', 'DF', 'metropole', true],
  ['Goiânia', 'GO', 'metropole', true], ['Aparecida de Goiânia', 'GO', 'metropolitana', false, 'Goiânia'], ['Anápolis', 'GO', 'polo'], ['Formosa', 'GO', 'pequena'],
  ['Cuiabá', 'MT', 'capital', true], ['Várzea Grande', 'MT', 'metropolitana', false, 'Cuiabá'], ['Rondonópolis', 'MT', 'polo'], ['Sinop', 'MT', 'polo'],
  ['Campo Grande', 'MS', 'capital', true], ['Dourados', 'MS', 'polo'], ['Corumbá', 'MS', 'pequena'],
  // Sudeste
  ['Vitória', 'ES', 'capital', true], ['Vila Velha', 'ES', 'metropolitana', false, 'Vitória'], ['Cariacica', 'ES', 'metropolitana', false, 'Vitória'], ['Linhares', 'ES', 'pequena'],
  ['Belo Horizonte', 'MG', 'metropole', true], ['Contagem', 'MG', 'metropolitana', false, 'Belo Horizonte'], ['Uberlândia', 'MG', 'polo'], ['Juiz de Fora', 'MG', 'polo'], ['Uberaba', 'MG', 'polo'], ['Montes Claros', 'MG', 'polo'], ['Diamantina', 'MG', 'pequena'],
  ['Rio de Janeiro', 'RJ', 'metropole', true], ['Niterói', 'RJ', 'metropolitana', false, 'Rio de Janeiro'], ['Duque de Caxias', 'RJ', 'metropolitana', false, 'Rio de Janeiro'], ['Nova Iguaçu', 'RJ', 'metropolitana', false, 'Rio de Janeiro'], ['Volta Redonda', 'RJ', 'polo'], ['Petrópolis', 'RJ', 'polo'], ['Itaperuna', 'RJ', 'pequena'],
  ['São Paulo', 'SP', 'metropole', true], ['Guarulhos', 'SP', 'metropolitana', false, 'São Paulo'], ['Santo André', 'SP', 'metropolitana', false, 'São Paulo'], ['São Bernardo do Campo', 'SP', 'metropolitana', false, 'São Paulo'],
  ['Campinas', 'SP', 'metropole'], ['Santos', 'SP', 'polo'], ['Ribeirão Preto', 'SP', 'polo'], ['Sorocaba', 'SP', 'polo'], ['São José dos Campos', 'SP', 'polo'], ['Bauru', 'SP', 'polo'], ['Marília', 'SP', 'polo'], ['Piracicaba', 'SP', 'polo'], ['Presidente Prudente', 'SP', 'polo'], ['Registro', 'SP', 'pequena'],
  // Sul
  ['Curitiba', 'PR', 'metropole', true], ['Londrina', 'PR', 'polo'], ['Maringá', 'PR', 'polo'], ['Foz do Iguaçu', 'PR', 'polo'], ['Ponta Grossa', 'PR', 'polo'], ['Guarapuava', 'PR', 'pequena'],
  ['Porto Alegre', 'RS', 'metropole', true], ['Canoas', 'RS', 'metropolitana', false, 'Porto Alegre'], ['Caxias do Sul', 'RS', 'polo'], ['Pelotas', 'RS', 'polo'], ['Santa Maria', 'RS', 'polo'], ['Santo Ângelo', 'RS', 'pequena'],
  ['Florianópolis', 'SC', 'capital', true], ['Joinville', 'SC', 'polo'], ['Blumenau', 'SC', 'polo'], ['Chapecó', 'SC', 'polo'], ['Criciúma', 'SC', 'polo'], ['São Miguel do Oeste', 'SC', 'pequena']
];

function slug(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * As cidades BRASILEIRAS, na ordem de sempre (há saves que guardam a posição
 * de uma cidade nesta lista). As de outros países estão em `cidadesDoPais`.
 */
export const MUNICIPIOS: readonly Municipio[] = LINHAS.map(([nome, uf, perfil, capital, metropole]) => ({
  id: `${slug(nome)}-${uf.toLowerCase()}`,
  nome,
  pais: PAIS_PADRAO,
  uf,
  regiao: REGIAO_UF[uf],
  perfil,
  capital: capital || undefined,
  capitalNacional: uf === 'DF' || undefined,
  metropole: metropole ? `${slug(metropole)}-${uf.toLowerCase()}` : undefined
}));

const POR_ID = new Map(MUNICIPIOS.map(m => [m.id, m]));
const POR_PAIS = new Map<string, Municipio[]>([[PAIS_PADRAO, [...MUNICIPIOS]]]);

/** As cidades de um perfil viram municípios do mesmo índice. */
function indexarPais(p: PerfilDePais): void {
  if (POR_PAIS.has(p.id)) return;
  const lista: Municipio[] = p.cidades.map(l => {
    const [nome, divisao, perfil, marcas = ''] = l;
    const m = marcas.split('|');
    const metro = m.find(x => x.startsWith('metro:'))?.slice(6);
    return {
      id: idDaCidade(p.id, l), nome, pais: p.id, uf: divisao, perfil,
      capital: m.includes('sede') || m.includes('capital') || undefined,
      capitalNacional: m.includes('capital') || undefined,
      metropole: metro ? idDaCidade(p.id, metro) : undefined,
      litoral: m.includes('litoral') || undefined
    };
  });
  for (const c of lista) POR_ID.set(c.id, c);
  POR_PAIS.set(p.id, lista);
}
aoRegistrar(indexarPais);

/** A região de uma UF (a mesma tabela dos municípios). */
export const regiaoDaUf = (uf: string): Regiao => REGIAO_UF[uf];

export function municipio(id: string): Municipio {
  const m = POR_ID.get(id);
  if (!m) throw new Error(`Município desconhecido: ${id}`);
  return m;
}
export const existeMunicipio = (id: string) => POR_ID.has(id);

export function municipioPorNome(nome: string, uf: string): Municipio | undefined {
  return MUNICIPIOS.find(m => m.nome === nome && m.uf === uf);
}

/**
 * Um número estável para uma cidade (há fatos da vida que guardam um lugar
 * como número): as brasileiras pela posição de sempre; as de fora, 10.000 +
 * a posição do país no catálogo × 100 + a posição da cidade no perfil.
 */
export function codigoDoMunicipio(id: string): number {
  const m = POR_ID.get(id);
  if (!m) return -1;
  if (m.pais === PAIS_PADRAO) return MUNICIPIOS.findIndex(x => x.id === id);
  return 10000 + indiceNoCatalogo(m.pais) * 100 + (POR_PAIS.get(m.pais) ?? []).findIndex(x => x.id === id);
}
export function municipioDoCodigo(n: number): string | undefined {
  if (n < 0) return undefined;
  if (n < 10000) return MUNICIPIOS[n]?.id;
  const pais = paisPeloIndice(Math.floor((n - 10000) / 100));
  return pais ? POR_PAIS.get(pais)?.[(n - 10000) % 100]?.id : undefined;
}

/** O país de uma cidade. */
export const paisDaCidade = (id: string): string => POR_ID.get(id)?.pais ?? paisDoId(id);
/** As cidades de um país (vazio se o pacote dele não chegou). */
export const cidadesDoPais = (pais: string): readonly Municipio[] => POR_PAIS.get(pais) ?? [];
/** A capital do país. */
export const capitalDoPais = (pais: string): Municipio | undefined => cidadesDoPais(pais).find(m => m.capitalNacional) ?? cidadesDoPais(pais)[0];

/** Os dois grandes centros do país (para onde a família de alguém se espalha): no Brasil, São Paulo e Brasília. */
export function grandesCentros(pais: string): [string, string] {
  if (pais === PAIS_PADRAO) return ['sao-paulo-sp', 'brasilia-df'];
  const lista = cidadesDoPais(pais);
  const capital = capitalDoPais(pais)!;
  const maior = lista.find(m => m.perfil === 'metropole' && m.id !== capital.id) ?? capital;
  return [maior.id, capital.id];
}

/** O nome da divisão (estado, província...) de uma cidade. */
export function nomeDaDivisao(m: Municipio): string {
  if (m.pais === PAIS_PADRAO) return NOMES_UF[m.uf] ?? m.uf;
  return (temPerfil(m.pais) ? perfilDoPais(m.pais).divisao.lista.find(d => d.codigo === m.uf)?.nome : undefined) ?? m.uf;
}

/** "Recife, PE" no Brasil; "Córdoba, Argentina" fora. */
export const nomeLugar = (id: string) => {
  const m = POR_ID.get(id);
  if (!m) return id;
  return m.pais === PAIS_PADRAO ? `${m.nome}, ${m.uf}` : `${m.nome}, ${paisDoCatalogo(m.pais).nome}`;
};

/** A divisão da cidade, curta: "PE" no Brasil, "Córdoba" (a província) fora. */
export const siglaDaDivisao = (m: Municipio) => (m.pais === PAIS_PADRAO ? m.uf : nomeDaDivisao(m));

/* ------------------------------------------------------------- Economia local */

const PERFIL: Record<PerfilUrbano, { custo: number; salario: number; aluguel: number; transporte: 'bom' | 'medio' | 'ruim'; rotulo: string }> = {
  metropole:     { custo: 1.22, salario: 1.2,  aluguel: 2100, transporte: 'bom',   rotulo: 'metrópole' },
  metropolitana: { custo: 1.02, salario: 1.05, aluguel: 1250, transporte: 'medio', rotulo: 'região metropolitana' },
  capital:       { custo: 1.05, salario: 1.03, aluguel: 1350, transporte: 'medio', rotulo: 'capital' },
  polo:          { custo: 0.95, salario: 0.95, aluguel: 1100, transporte: 'ruim',  rotulo: 'cidade média' },
  pequena:       { custo: 0.8,  salario: 0.78, aluguel: 650,  transporte: 'ruim',  rotulo: 'cidade pequena' }
};

const REGIAO: Record<Regiao, { custo: number; salario: number }> = {
  Sudeste: { custo: 1.08, salario: 1.08 },
  Sul: { custo: 1.04, salario: 1.05 },
  'Centro-Oeste': { custo: 1.02, salario: 1.05 },
  Nordeste: { custo: 0.9, salario: 0.84 },
  Norte: { custo: 0.94, salario: 0.9 }
};

/**
 * A economia de uma cidade, na unidade do motor (`mundo/moeda`): o porte da
 * cidade × a região dentro do país × o país.
 *
 *   - custo: o custo de vida em relação ao brasileiro médio. Pela paridade de
 *     poder de compra, o resto dos preços já é "o mesmo esforço" em qualquer
 *     país; o que muda é a MORADIA, que o perfil do país diz quanto pesa;
 *   - salario: o nível salarial do país (PIB per capita em PPC ÷ o do
 *     Brasil, amortecido: ^0,75) × a região × o porte — um enfermeiro em
 *     Lyon ganha, em poder de compra, mais do que um em Recife; um em
 *     Nairóbi, menos;
 *   - aluguel: o aluguel de referência (padrão 3, dois quartos).
 */
export function economiaLocal(id: string) {
  const m = municipio(id);
  const p = PERFIL[m.perfil];
  if (m.pais === PAIS_PADRAO) {
    const r = REGIAO[m.regiao!];
    const brasilia = m.id === 'brasilia-df' ? 1.12 : 1;
    return {
      custo: p.custo * r.custo * brasilia,
      salario: p.salario * r.salario * brasilia,
      /** Aluguel de referência (padrão 3, dois quartos). */
      aluguel: Math.round(p.aluguel * r.custo * brasilia),
      transporte: p.transporte,
      rotulo: p.rotulo
    };
  }
  const perfil = perfilDoPais(m.pais);
  const d = perfil.divisao.lista.find(x => x.codigo === m.uf);
  // O nível de salário do país (a renda relativa amortecida: `mundo/economia.nivelSalarial`, mesma conta).
  const renda = Math.pow(paisDoCatalogo(m.pais).economia?.renda ?? 1, 0.75);
  const moradia = perfil.economia.moradia * (d?.custo ?? 1);
  // A moradia é ~30% do custo de vida de referência; o resto segue o porte e a região.
  const custo = p.custo * (0.7 * (d?.custo ?? 1) + 0.3 * moradia);
  return {
    custo,
    salario: p.salario * renda * (d?.salario ?? 1),
    aluguel: Math.round(p.aluguel * moradia),
    transporte: p.transporte,
    rotulo: p.rotulo
  };
}

export const rotuloPerfil = (p: PerfilUrbano) => PERFIL[p].rotulo;

/**
 * Nível de oferta de ensino superior acessível a partir deste município.
 * Cidade metropolitana usa a oferta da metrópole (ônibus, trem, metrô).
 */
export function nivelDeOferta(id: string): 3 | 2 | 1 | 0 {
  const m = municipio(id);
  switch (m.perfil) {
    case 'metropole': return 3;
    case 'metropolitana': return 3;
    case 'capital': return 2;
    case 'polo': return 1;
    case 'pequena': return 0;
  }
}

export function sortearMunicipio(rnd: () => number, pais = PAIS_PADRAO): Municipio {
  // Peso aproximado pela população: metrópoles concentram mais nascimentos.
  const pesos: Record<PerfilUrbano, number> = { metropole: 6, metropolitana: 3, capital: 3, polo: 2, pequena: 2.5 };
  const lista = cidadesDoPais(pais);
  const total = lista.reduce((s, m) => s + pesos[m.perfil], 0);
  let alvo = rnd() * total;
  for (const m of lista) {
    alvo -= pesos[m.perfil];
    if (alvo < 0) return m;
  }
  return lista[0];
}

const LITORAL = new Set(['AP', 'PA', 'MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA', 'ES', 'RJ', 'SP', 'PR', 'SC', 'RS', 'AM']);

/** Há mar ou rio grande de pesca por perto? (Pesca artesanal, Marinha.) Plausibilidade, não geografia fina. */
export function pertoDaAgua(id: string): boolean {
  const m = municipio(id);
  if (m.pais !== PAIS_PADRAO) return !!m.litoral;
  if (m.uf === 'DF' || m.uf === 'GO' || ['sao-paulo-sp', 'campinas-sp', 'curitiba-pr', 'goiania-go'].includes(m.id)) return false;
  if (m.perfil === 'metropolitana' || (m.perfil === 'metropole' && !m.capital)) return false;
  return LITORAL.has(m.uf) || m.perfil === 'pequena' || m.perfil === 'polo';
}
