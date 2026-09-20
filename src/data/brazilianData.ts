import { Gender, SocialClass } from '../types';

/**
 * Nomes, sobrenomes e profissões brasileiras.
 *
 * LOCALIZAÇÃO: estados e cidades vivem em `src/data/locations/`, que é a
 * fonte de verdade. Os reexports abaixo existem só para não quebrar
 * importações antigas — código novo deve importar de `../data/locations`.
 */
export {
  CIDADES_BRASILEIRAS,
  UNIDADES_FEDERATIVAS,
  listarEstados,
  listarCidadesPorEstado,
  encontrarCidade,
  encontrarEstado,
  nomeDoEstado,
  sortearCidade,
  sortearEstado
} from './locations';
export type { BrazilianCity, UnidadeFederativa, Regiao } from './locations';

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


