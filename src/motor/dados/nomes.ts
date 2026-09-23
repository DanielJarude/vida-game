/**
 * Nomes por geração. Uma avó nascida em 1955 não se chama Valentina, e um
 * bebê de 2030 raramente se chama Francisca.
 */

import type { Genero } from '../tipos';
import type { Rng } from '../rng';

const MASC: Record<'antiga' | 'meio' | 'nova', string[]> = {
  antiga: ['José', 'João', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Sebastião', 'Luiz', 'Raimundo', 'Manoel', 'Geraldo', 'Jorge', 'Roberto', 'Osvaldo', 'Benedito', 'Valdir', 'Edson', 'Nelson', 'Aparecido', 'Waldemar'],
  meio: ['Marcelo', 'Rodrigo', 'Fábio', 'Anderson', 'Leandro', 'Alexandre', 'Rafael', 'Fernando', 'Márcio', 'Daniel', 'Diego', 'Bruno', 'Thiago', 'Eduardo', 'Renato', 'Leonardo', 'Gustavo', 'André', 'Vinícius', 'Wellington', 'Juliano', 'Cristiano', 'Everton', 'Cleber'],
  nova: ['Miguel', 'Arthur', 'Gael', 'Heitor', 'Theo', 'Davi', 'Bernardo', 'Gabriel', 'Ravi', 'Samuel', 'Noah', 'Pedro', 'Lorenzo', 'Benício', 'Matheus', 'Lucas', 'Isaac', 'Joaquim', 'Enzo', 'Murilo', 'Bento', 'Caio', 'Vicente', 'Anthony']
};

const FEM: Record<'antiga' | 'meio' | 'nova', string[]> = {
  antiga: ['Maria', 'Francisca', 'Antônia', 'Ana', 'Rosa', 'Terezinha', 'Aparecida', 'Sebastiana', 'Luzia', 'Raimunda', 'Marlene', 'Neusa', 'Conceição', 'Zilda', 'Iracema', 'Dalva', 'Cleusa', 'Benedita', 'Irene', 'Lourdes'],
  meio: ['Juliana', 'Patrícia', 'Fernanda', 'Aline', 'Renata', 'Vanessa', 'Camila', 'Priscila', 'Adriana', 'Daniela', 'Cristiane', 'Luciana', 'Tatiane', 'Simone', 'Carla', 'Débora', 'Kelly', 'Viviane', 'Michele', 'Letícia', 'Andreia', 'Sabrina'],
  nova: ['Helena', 'Alice', 'Laura', 'Maria Clara', 'Cecília', 'Valentina', 'Heloísa', 'Manuela', 'Sophia', 'Liz', 'Aurora', 'Isabella', 'Lívia', 'Maitê', 'Antonella', 'Beatriz', 'Lorena', 'Mariana', 'Eloá', 'Júlia', 'Ayla', 'Luna', 'Clara', 'Esther']
};

const NEUTROS = ['Alex', 'Sam', 'Cris', 'Dani', 'Ariel', 'Kim', 'Mika', 'Sasha', 'Jules', 'Luz', 'Sol', 'Manu', 'Duda', 'Noah', 'Gabi', 'Eli', 'Rudá', 'Ávila'];

export const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
  'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
  'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas',
  'Cardoso', 'Ramos', 'Gonçalves', 'Santana', 'Teixeira', 'Pinto', 'Castro', 'Moura', 'Cavalcanti', 'Dantas',
  'Araújo', 'Monteiro', 'Batista', 'Correia', 'Farias', 'Miranda', 'Tavares', 'Brito', 'Sales', 'Xavier'
];

function geracao(anoNasc: number): 'antiga' | 'meio' | 'nova' {
  if (anoNasc < 1972) return 'antiga';
  if (anoNasc < 2004) return 'meio';
  return 'nova';
}

export function sortearNome(r: Rng, genero: Genero, anoNasc: number): string {
  if (genero === 'nao_binario') return r.pick(NEUTROS);
  // Um pouco de mistura entre gerações vizinhas — nome não é regra.
  let g = geracao(anoNasc);
  if (r.chance(0.08)) {
    if (g === 'antiga' || g === 'nova') g = 'meio';
    else g = anoNasc < 1995 ? 'antiga' : 'nova';
  }
  return r.pick(genero === 'masculino' ? MASC[g] : FEM[g]);
}

export const sortearSobrenome = (r: Rng) => r.pick(SOBRENOMES);

export const NOMES_PET_CACHORRO = ['Pipoca', 'Thor', 'Mel', 'Bidu', 'Luna', 'Paçoca', 'Bob', 'Pretinha', 'Nina', 'Scooby', 'Belinha', 'Fred'];
export const NOMES_PET_GATO = ['Frajola', 'Mingau', 'Salem', 'Mia', 'Tom', 'Nala', 'Garfield', 'Amora', 'Chico', 'Jade'];
