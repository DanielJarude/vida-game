/**
 * VIDA 26 — as capacidades físicas DESTA vida (a leitura do estado: constituição, composição, condicionamento, saúde,
 * idade e estatura). A conta mora em `v26/corpo/capacidades26` (folha); aqui só se juntam as entradas.
 */
import type { Vida } from '../tipos';
import { idade } from '../nucleo';
import { lerCorpo23 } from '../v23/corpo/corpo23';
import { capacidades26, type Capacidade26 } from '../v26/corpo/capacidades26';
import { estatura, estaturaAdulta } from './modalidades';
import { composicaoInicial24 } from '../v24/corpo/corpo24';
import { ge } from '../texto';

/** A média e o desvio da estatura adulta por gênero (os mesmos de `modalidades.estaturaDaSemente`). */
const MEDIA_ALTURA = { f: [163, 7], m: [176, 8] } as const;

export function entradaCapacidades(v: Vida) {
  const c = lerCorpo23(v.eu.visual?.corpo23);
  // A composição gravada (VIDA 24); num save que ainda não a tem (até o primeiro ano depois da atualização), a âncora
  // pela forma. Não lê `silhueta` (que mora num pacote ACIMA dos sistemas — importá-lo daqui criava ciclo de pacotes).
  const comp = v.corpo.composicao24 ?? composicaoInicial24(v.corpo.forma >= 72 ? 'atletico' : 'mediano', c, v.t);
  const [media, dp] = MEDIA_ALTURA[ge(v) === 'feminino' ? 'f' : 'm'];
  return {
    idade: idade(v), c, g: comp.g, m: comp.m, forma: v.corpo.forma, saude: v.corpo.saude,
    zAgora: (estatura(v) - media) / dp, zAdulta: (estaturaAdulta(v) - media) / dp
  };
}

export const capacidadesDe = (v: Vida): Record<Capacidade26, number> => capacidades26(entradaCapacidades(v));
