import { Gender, SocialClass } from '../types';

export interface BrazilianCity {
  cidade: string;
  estado: string;
  regiao: 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte';
  custoVidaRelativo: number; // 0.8 a 1.4
}

export const CIDADES_BRASILEIRAS: BrazilianCity[] = [
  { cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.35 },
  { cidade: 'Campinas', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.15 },
  { cidade: 'Ribeirão Preto', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.05 },
  { cidade: 'Santos', estado: 'SP', regiao: 'Sudeste', custoVidaRelativo: 1.1 },
  { cidade: 'Rio de Janeiro', estado: 'RJ', regiao: 'Sudeste', custoVidaRelativo: 1.3 },
  { cidade: 'Niterói', estado: 'RJ', regiao: 'Sudeste', custoVidaRelativo: 1.2 },
  { cidade: 'Belo Horizonte', estado: 'MG', regiao: 'Sudeste', custoVidaRelativo: 1.05 },
  { cidade: 'Uberlândia', estado: 'MG', regiao: 'Sudeste', custoVidaRelativo: 0.95 },
  { cidade: 'Vitória', estado: 'ES', regiao: 'Sudeste', custoVidaRelativo: 1.05 },
  { cidade: 'Curitiba', estado: 'PR', regiao: 'Sul', custoVidaRelativo: 1.1 },
  { cidade: 'Londrina', estado: 'PR', regiao: 'Sul', custoVidaRelativo: 0.95 },
  { cidade: 'Porto Alegre', estado: 'RS', regiao: 'Sul', custoVidaRelativo: 1.1 },
  { cidade: 'Caxias do Sul', estado: 'RS', regiao: 'Sul', custoVidaRelativo: 1.0 },
  { cidade: 'Florianópolis', estado: 'SC', regiao: 'Sul', custoVidaRelativo: 1.25 },
  { cidade: 'Joinville', estado: 'SC', regiao: 'Sul', custoVidaRelativo: 1.0 },
  { cidade: 'Salvador', estado: 'BA', regiao: 'Nordeste', custoVidaRelativo: 0.95 },
  { cidade: 'Feira de Santana', estado: 'BA', regiao: 'Nordeste', custoVidaRelativo: 0.85 },
  { cidade: 'Recife', estado: 'PE', regiao: 'Nordeste', custoVidaRelativo: 1.0 },
  { cidade: 'Fortaleza', estado: 'CE', regiao: 'Nordeste', custoVidaRelativo: 0.95 },
  { cidade: 'Natal', estado: 'RN', regiao: 'Nordeste', custoVidaRelativo: 0.9 },
  { cidade: 'João Pessoa', estado: 'PB', regiao: 'Nordeste', custoVidaRelativo: 0.9 },
  { cidade: 'Maceió', estado: 'AL', regiao: 'Nordeste', custoVidaRelativo: 0.9 },
  { cidade: 'Brasília', estado: 'DF', regiao: 'Centro-Oeste', custoVidaRelativo: 1.3 },
  { cidade: 'Goiânia', estado: 'GO', regiao: 'Centro-Oeste', custoVidaRelativo: 0.95 },
  { cidade: 'Cuiabá', estado: 'MT', regiao: 'Centro-Oeste', custoVidaRelativo: 1.0 },
  { cidade: 'Campo Grande', estado: 'MS', regiao: 'Centro-Oeste', custoVidaRelativo: 0.95 },
  { cidade: 'Manaus', estado: 'AM', regiao: 'Norte', custoVidaRelativo: 0.95 },
  { cidade: 'Belém', estado: 'PA', regiao: 'Norte', custoVidaRelativo: 0.9 }
];

export const NOMES_MASCULINOS = [
  'Lucas', 'Gabriel', 'Mateus', 'Felipe', 'Rafael', 'Bernardo', 'Pedro', 'Arthur',
  'Gustavo', 'Guilherme', 'Leonardo', 'Thiago', 'Bruno', 'Rodrigo', 'Henrique',
  'Cauã', 'Diego', 'Danilo', 'Marcelo', 'Murilo', 'Eduardo', 'Caio', 'Vinícius',
  'Breno', 'Igor', 'Enzo', 'Lorenzo', 'Davi', 'Heitor', 'Samuel', 'Daniel', 'Renan',
  'Otávio', 'Luiz', 'André', 'Alexandre', 'Vitor', 'Fernando', 'Leandro', 'Fábio'
];

export const NOMES_FEMININOS = [
  'Julia', 'Larissa', 'Mariana', 'Beatriz', 'Camila', 'Fernanda', 'Leticia', 'Carolina',
  'Amanda', 'Isabela', 'Bruna', 'Gabriela', 'Luiza', 'Helena', 'Manuela', 'Laura',
  'Alice', 'Sophia', 'Valentina', 'Lívia', 'Giovanna', 'Yasmin', 'Clara', 'Bianca',
  'Renata', 'Juliana', 'Patrícia', 'Rafaela', 'Vanessa', 'Natália', 'Carla', 'Débora',
  'Aline', 'Monique', 'Thaís', 'Priscila', 'Lorena', 'Melissa', 'Rebeca', 'Cecília'
];

export const NOMES_NAO_BINARIOS = [
  'Alex', 'Sam', 'Cris', 'Robin', 'Dani', 'Ariel', 'Kim', 'Mika', 'Sasha', 'Jules',
  'Luz', 'Sol', 'Manu', 'Taylor', 'Duda', 'Noah', 'Gabi', 'Eli'
];

export const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
  'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade',
  'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos',
  'Gonçalves', 'Santana', 'Teixeira', 'Pinto', 'Castro', 'Moura', 'Cavalcanti', 'Dantas'
];

export const PROFISSOES_PAIS = [
  { cargo: 'Eletricista', renda: 3200, classe: 'trabalhadora' as SocialClass },
  { cargo: 'Auxiliar Administrativa', renda: 2600, classe: 'trabalhadora' as SocialClass },
  { cargo: 'Professora do Ensino Básico', renda: 4200, classe: 'classe_media_baixa' as SocialClass },
  { cargo: 'Mecânico Automotivo', renda: 3500, classe: 'trabalhadora' as SocialClass },
  { cargo: 'Enfermeira', renda: 4800, classe: 'classe_media_baixa' as SocialClass },
  { cargo: 'Vendedor Comercial', renda: 3000, classe: 'trabalhadora' as SocialClass },
  { cargo: 'Motorista de Aplicativo', renda: 2800, classe: 'vulneravel' as SocialClass },
  { cargo: 'Dona de Casa', renda: 0, classe: 'trabalhadora' as SocialClass },
  { cargo: 'Comerciante Local', renda: 5500, classe: 'classe_media' as SocialClass },
  { cargo: 'Contador', renda: 6800, classe: 'classe_media' as SocialClass },
  { cargo: 'Engenheiro Civil', renda: 9500, classe: 'classe_media' as SocialClass },
  { cargo: 'Advogada', renda: 8500, classe: 'classe_media' as SocialClass },
  { cargo: 'Médico Clínico', renda: 18000, classe: 'classe_alta' as SocialClass },
  { cargo: 'Bancário', renda: 6000, classe: 'classe_media' as SocialClass },
  { cargo: 'Servidora Pública Municipal', renda: 4500, classe: 'classe_media_baixa' as SocialClass },
  { cargo: 'Pedreiro Autônomo', renda: 3100, classe: 'vulneravel' as SocialClass },
  { cargo: 'Cabeleireira', renda: 2700, classe: 'trabalhadora' as SocialClass },
  { cargo: 'Analista de Sistemas', renda: 8000, classe: 'classe_media' as SocialClass },
  { cargo: 'Empresária de Médio Porte', renda: 25000, classe: 'classe_alta' as SocialClass },
  { cargo: 'Farmacêutico', renda: 5200, classe: 'classe_media_baixa' as SocialClass }
];

export const PERSONALIDADES = [
  'calmo e carinhoso',
  'disciplinado e rígido',
  'extrovertido e alegre',
  'trabalhador e protetor',
  'tranquilo e bem-humorado',
  'preocupado e zeloso',
  'ambicioso e focado',
  'espiritualizado e paciente',
  'criativo e sonhador'
];

import { randomChoice } from '../utils/random';

export function sortearNome(genero: Gender): string {
  if (genero === 'masculino') {
    return randomChoice(NOMES_MASCULINOS);
  } else if (genero === 'feminino') {
    return randomChoice(NOMES_FEMININOS);
  }
  return randomChoice(NOMES_NAO_BINARIOS);
}

export function sortearSobrenome(): string {
  return randomChoice(SOBRENOMES);
}

export function sortearCidade(): BrazilianCity {
  return randomChoice(CIDADES_BRASILEIRAS);
}

// ---------------------------------------------------------------------------
// Consultas de localização (data-driven)
//
// A seleção de onde nascer é derivada de CIDADES_BRASILEIRAS, nunca
// duplicada em componente. Acrescentar uma cidade à lista acima basta para
// que ela apareça na criação de personagem.
//
// LIMITAÇÃO CONHECIDA: o jogo suporta 28 cidades, escolhidas para cobrir as
// cinco regiões. Não é a lista completa dos municípios brasileiros, e o
// `custoVidaRelativo` é um parâmetro de balanceamento do jogo — não um dado
// socioeconômico de fonte externa. Cidades novas só devem ser adicionadas
// com um custo coerente com as já existentes.
// ---------------------------------------------------------------------------

export interface EstadoBrasileiro {
  sigla: string;
  regiao: BrazilianCity['regiao'];
  quantidadeCidades: number;
}

/** Estados que possuem ao menos uma cidade suportada, em ordem alfabética. */
export function listarEstadosDisponiveis(): EstadoBrasileiro[] {
  const mapa = new Map<string, EstadoBrasileiro>();

  for (const cidade of CIDADES_BRASILEIRAS) {
    const atual = mapa.get(cidade.estado);
    if (atual) {
      atual.quantidadeCidades += 1;
    } else {
      mapa.set(cidade.estado, {
        sigla: cidade.estado,
        regiao: cidade.regiao,
        quantidadeCidades: 1
      });
    }
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.sigla.localeCompare(b.sigla, 'pt-BR')
  );
}

/** Cidades suportadas de um estado, em ordem alfabética. */
export function listarCidadesPorEstado(sigla: string): BrazilianCity[] {
  return CIDADES_BRASILEIRAS.filter(c => c.estado === sigla).sort((a, b) =>
    a.cidade.localeCompare(b.cidade, 'pt-BR')
  );
}

/** Busca exata de uma cidade suportada. */
export function encontrarCidade(
  nomeCidade: string,
  sigla: string
): BrazilianCity | undefined {
  return CIDADES_BRASILEIRAS.find(
    c => c.cidade === nomeCidade && c.estado === sigla
  );
}
