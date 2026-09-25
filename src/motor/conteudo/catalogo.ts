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
import { MUNDO } from './mundo';
import { SOCIAL } from './social';
import { CAMINHOS } from './caminhos';
import { MATERIAL } from './material';
import { TRAJETORIAS } from './trajetorias';
import { PROFISSAO } from './profissao';

export const CATALOGO: readonly Conteudo[] = [...SISTEMICOS, ...SOCIAL, ...CAMINHOS, ...TRAJETORIAS, ...PROFISSAO, ...MATERIAL, ...DESAFIOS, ...INFANCIA, ...PRIMEIROS, ...ADOLESCENCIA, ...ADULTO, ...MATURIDADE, ...VINCULOS, ...ESCOLHAS, ...MUNDO];
