import type { Conteudo } from './base';
import { INFANCIA } from './infancia';
import { ADOLESCENCIA } from './adolescencia';
import { ADULTO } from './adulto';
import { MATURIDADE } from './maturidade';
import { SISTEMICOS } from './sistemicos';
import { DESAFIOS } from './desafios';
import { VINCULOS } from './vinculos';
import { ESCOLHAS } from './escolhas';
import { PRIMEIROS } from './primeiros';

export const CATALOGO: readonly Conteudo[] = [...SISTEMICOS, ...DESAFIOS, ...INFANCIA, ...PRIMEIROS, ...ADOLESCENCIA, ...ADULTO, ...MATURIDADE, ...VINCULOS, ...ESCOLHAS];
