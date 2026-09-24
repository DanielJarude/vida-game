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

export type PerfilUrbano =
  | 'metropole'      // grande centro: tudo existe, tudo custa
  | 'metropolitana'  // cidade grande colada numa metrópole: acesso à metrópole, aluguel menor
  | 'capital'        // capital de estado de porte médio
  | 'polo'           // cidade média, polo regional
  | 'pequena';       // interior: pouca oferta, custo baixo

export interface Municipio {
  id: string;
  nome: string;
  uf: string;
  regiao: Regiao;
  perfil: PerfilUrbano;
  capital?: boolean;
  /** Para cidades metropolitanas: a metrópole cuja oferta é acessível. */
  metropole?: string;
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

export const MUNICIPIOS: readonly Municipio[] = LINHAS.map(([nome, uf, perfil, capital, metropole]) => ({
  id: `${slug(nome)}-${uf.toLowerCase()}`,
  nome,
  uf,
  regiao: REGIAO_UF[uf],
  perfil,
  capital: capital || undefined,
  metropole
}));

const POR_ID = new Map(MUNICIPIOS.map(m => [m.id, m]));

export function municipio(id: string): Municipio {
  const m = POR_ID.get(id);
  if (!m) throw new Error(`Município desconhecido: ${id}`);
  return m;
}

export function municipioPorNome(nome: string, uf: string): Municipio | undefined {
  return MUNICIPIOS.find(m => m.nome === nome && m.uf === uf);
}

export const nomeLugar = (id: string) => {
  const m = POR_ID.get(id);
  return m ? `${m.nome}, ${m.uf}` : id;
};

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

export function economiaLocal(id: string) {
  const m = municipio(id);
  const p = PERFIL[m.perfil];
  const r = REGIAO[m.regiao];
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

export function sortearMunicipio(rnd: () => number): Municipio {
  // Peso aproximado pela população: metrópoles concentram mais nascimentos.
  const pesos: Record<PerfilUrbano, number> = { metropole: 6, metropolitana: 3, capital: 3, polo: 2, pequena: 2.5 };
  const total = MUNICIPIOS.reduce((s, m) => s + pesos[m.perfil], 0);
  let alvo = rnd() * total;
  for (const m of MUNICIPIOS) {
    alvo -= pesos[m.perfil];
    if (alvo < 0) return m;
  }
  return MUNICIPIOS[0];
}

const LITORAL = new Set(['AP', 'PA', 'MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA', 'ES', 'RJ', 'SP', 'PR', 'SC', 'RS', 'AM']);

/** Há mar ou rio grande de pesca por perto? (Pesca artesanal, Marinha.) Plausibilidade, não geografia fina. */
export function pertoDaAgua(id: string): boolean {
  const m = municipio(id);
  if (m.uf === 'DF' || m.uf === 'GO' || ['sao-paulo-sp', 'campinas-sp', 'curitiba-pr', 'goiania-go'].includes(m.id)) return false;
  if (m.perfil === 'metropolitana' || (m.perfil === 'metropole' && !m.capital)) return false;
  return LITORAL.has(m.uf) || m.perfil === 'pequena' || m.perfil === 'polo';
}
