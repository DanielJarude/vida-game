/**
 * VIDA 14 — APARÊNCIA: os detalhes do rosto que são ESCOLHA (nunca genética): os riscos na sobrancelha (quantos, de que
 * lado, onde e como), o desenho da sobrancelha (afinar, deixar cheia, reta, arqueada...), a pinta desenhada e os cílios.
 * A espessura e a forma herdadas (`visual.sobrancelha`, `visual.sobrancelhaForma`) continuam sendo a base: o desenho é
 * o que a pessoa faz com elas. Cada opção tem desenho próprio no retrato (`ui/v14/aparencia/sobrancelhas`). Puro.
 *
 * Os lados são os da PESSOA (como nas tatuagens): o lado esquerdo dela aparece à direita de quem olha o retrato.
 */

export type LadoDoRisco = 'esquerdo' | 'direito' | 'ambos';
export type PosicaoDoRisco = 'interno' | 'central' | 'externo';
export type EstiloDoRisco = 'reto' | 'diagonal' | 'duplo_fino' | 'largo' | 'escalonado';
export interface RiscosNaSobrancelha { quantidade: number; lado: LadoDoRisco; posicao: PosicaoDoRisco; estilo: EstiloDoRisco }

export const QUANTIDADES_DE_RISCO = [1, 2, 3] as const;
export const LADOS_DO_RISCO: { id: LadoDoRisco; nome: string }[] = [
  { id: 'esquerdo', nome: 'Sobrancelha esquerda' }, { id: 'direito', nome: 'Sobrancelha direita' }, { id: 'ambos', nome: 'As duas' }
];
export const POSICOES_DO_RISCO: { id: PosicaoDoRisco; nome: string }[] = [
  { id: 'interno', nome: 'Perto do nariz' }, { id: 'central', nome: 'No meio' }, { id: 'externo', nome: 'Na ponta' }
];
export const ESTILOS_DE_RISCO: { id: EstiloDoRisco; nome: string; nota: string }[] = [
  { id: 'reto', nome: 'Reto', nota: 'Corte em pé, atravessando a sobrancelha.' },
  { id: 'diagonal', nome: 'Diagonal', nota: 'Corte inclinado, acompanhando o rosto.' },
  { id: 'duplo_fino', nome: 'Duplo fino', nota: 'Cada risco são dois cortes finos, colados.' },
  { id: 'largo', nome: 'Largo', nota: 'Um vão mais aberto, que aparece de longe.' },
  { id: 'escalonado', nome: 'Escalonado', nota: 'Os riscos em degrau: cada um um pouco mais curto.' }
];

/** O desenho da sobrancelha (sobre a herdada). `natural`: como nasceu. */
export const DESENHOS_DE_SOBRANCELHA: { id: string; nome: string; nota: string }[] = [
  { id: 'natural', nome: 'Natural', nota: 'Como ela é.' },
  { id: 'afinada', nome: 'Afinada (pinça)', nota: 'Mais fina e com o arco limpo.' },
  { id: 'fio', nome: 'Fio (bem fina)', nota: 'Um traço só, arqueado.' },
  { id: 'cheia', nome: 'Cheia e escovada', nota: 'Os fios penteados para cima, sobrancelha volumosa.' },
  { id: 'reta', nome: 'Reta', nota: 'Sem arco: uma linha quase reta.' },
  { id: 'arqueada_alta', nome: 'Arqueada alta', nota: 'O arco sobe bem no meio.' },
  { id: 'angulosa', nome: 'Com quina', nota: 'O arco em ângulo, desenhado.' },
  { id: 'curta', nome: 'Curta (cauda aparada)', nota: 'A ponta de fora encurtada.' },
  { id: 'descolorida', nome: 'Descolorida', nota: 'Os fios clareados, quase da cor da pele.' }
];

/** A pinta desenhada (ou realçada): onde fica. Os lados, os da pessoa. */
export const PINTAS_14: { id: string; nome: string }[] = [
  { id: 'labio_esquerdo', nome: 'Acima do lábio, à esquerda' }, { id: 'labio_direito', nome: 'Acima do lábio, à direita' },
  { id: 'bochecha_esquerda', nome: 'Na bochecha esquerda' }, { id: 'bochecha_direita', nome: 'Na bochecha direita' },
  { id: 'olho_esquerdo', nome: 'Abaixo do olho esquerdo' }, { id: 'olho_direito', nome: 'Abaixo do olho direito' },
  { id: 'queixo', nome: 'No queixo' }
];

/** Os cílios: curvados (curvex, lifting) ou alongados (extensão fio a fio). Ausente: os naturais. */
export const CILIOS_14: { id: string; nome: string }[] = [
  { id: 'curvados', nome: 'Curvados (lifting)' }, { id: 'alongados', nome: 'Alongados (extensão)' }
];

/** Os campos do visual que esta frente cuida (opcionais; ausentes: sem / natural). */
export const CAMPOS_ROSTO_14 = ['sobrancelhaRiscos', 'sobrancelhaDesenho', 'pinta', 'cilios'] as const;
