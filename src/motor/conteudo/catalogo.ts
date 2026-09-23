import type { Conteudo } from './base';
import { INFANCIA } from './infancia';
import { ADOLESCENCIA } from './adolescencia';
import { ADULTO } from './adulto';
import { MATURIDADE } from './maturidade';
import { SISTEMICOS } from './sistemicos';
import { DESAFIOS } from './desafios';

export const CATALOGO: readonly Conteudo[] = [...SISTEMICOS, ...DESAFIOS, ...INFANCIA, ...ADOLESCENCIA, ...ADULTO, ...MATURIDADE];
