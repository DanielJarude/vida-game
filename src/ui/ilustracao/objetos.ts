/**
 * REWORK 8 (Fase B) — as coisas da vida: cada uma com a SUA forma (reconhecível antes de ler o nome) e no MATERIAL
 * que tem nesta vida (`CoisaTida.cor`: a madeira do violão, o estofado do sofá, o inox da máquina). Nenhuma coisa
 * divide desenho com outra: a máquina de lavar tem a porta redonda; a lava-louças, a porta lisa com o puxador; o
 * aspirador robô é um disco; o ar-condicionado, a unidade de parede com as aletas. Os celulares aparecem de COSTAS,
 * porque é a câmera que separa o simples (uma lente) do intermediário (duas) e do topo de linha (três).
 *
 * Quadro de 120 × 120, chão em y = 110 (o que fica no chão tem sombra de contato; o que fica na parede, não).
 */
import { cantos, circulo, clarear, elipse, escurecer, lembrar, luminancia, membro, num as f, ret, suave, type Amostra, type Peca } from './nucleo';

const CHAO = 110;
const TELA = '#26303a', PRETO = '#2b2826', METAL = '#b8b4ad', BRANCO = '#ece9e4', MADEIRA = '#b9773f';
/** Um aro (a raquete): a elipse de fora menos a de dentro (sentidos opostos furam a massa). */
const anel = (cx: number, cy: number, rx: number, ry: number, e: number) => `${elipse(cx, cy, rx, ry)}M${f(cx - rx + e)} ${f(cy)}a${f(rx - e)} ${f(ry - e)} 0 1 1 ${f(2 * (rx - e))} 0a${f(rx - e)} ${f(ry - e)} 0 1 1 ${f(-2 * (rx - e))} 0z`;
const noChao = (pecas: Peca[], meia = 44, cx = 60): Amostra => ({ vb: [120, 120], chao: CHAO, sombra: [cx, meia], pecas });
const naParede = (pecas: Peca[]): Amostra => ({ vb: [120, 120], pecas });

/* ---------------------------------------------------------- Eletrônicos */

function celular(cor: string, lentes: 1 | 2 | 3, grande: number): Amostra {
  const w = 34 + grande * 4, h = 66 + grande * 6, x = 60 - w / 2, y = 56 - h / 2;
  const modulo = lentes === 1 ? ret(x + 6, y + 6, 12, 12, 4) : lentes === 2 ? ret(x + 6, y + 6, 14, 24, 5) : ret(x + 5, y + 5, 22, 22, 6);
  const pos: [number, number][] = lentes === 1 ? [[x + 12, y + 12]] : lentes === 2 ? [[x + 13, y + 12], [x + 13, y + 23]] : [[x + 11, y + 11], [x + 21, y + 11], [x + 11, y + 21]];
  return naParede([
    { tipo: 'massa', d: ret(x, y, w, h, 7 + grande), cor, marca: 'corpo' },
    { tipo: 'massa', d: modulo, cor: escurecer(cor, 0.18), marca: 'modulo-camera' },
    ...pos.map(([cx, cy]) => ({ tipo: 'vidro' as const, d: circulo(cx, cy, lentes === 3 ? 3.6 : 3.3), marca: 'lente' })),
    { tipo: 'luz', d: circulo(x + (lentes === 3 ? 21 : 22), y + (lentes === 3 ? 21 : 12), 1.6), cor: '#f2ead2', fino: true },
    { tipo: 'linha', d: `M${x + w} ${y + 18}v10M${x + w} ${y + 32}v6`, larg: 1.6, fino: true }
  ]);
}

function notebook(cor: string): Amostra {
  return noChao([
    // A tela aberta (a tampa) e a base em perspectiva com o teclado e o touchpad — não uma TV.
    { tipo: 'massa', d: ret(26, 22, 68, 48, 3), cor, marca: 'tampa' },
    { tipo: 'vidro', d: ret(30, 26, 60, 40, 1.5), marca: 'tela' },
    { tipo: 'massa', d: cantos([[24, 72, 2], [96, 72, 2], [110, 96, 3], [10, 96, 3]]), cor: clarear(cor, 0.08), marca: 'base' },
    { tipo: 'linha', d: Array.from({ length: 4 }, (_, k) => `M${22 - k * 2.2} ${76 + k * 4.4}H${98 + k * 2.2}`).join(''), larg: 0.7, fino: true },
    { tipo: 'massa', d: cantos([[50, 88, 1], [70, 88, 1], [72, 94, 1], [48, 94, 1]]), cor: escurecer(cor, 0.12), semVolume: true, marca: 'touchpad' }
  ], 50);
}

function computador(cor: string): Amostra {
  return noChao([
    // O monitor no pé, o gabinete ao lado (com a luz da placa de vídeo), o teclado.
    { tipo: 'massa', d: ret(8, 18, 70, 48, 3), cor: PRETO, marca: 'monitor' },
    { tipo: 'vidro', d: ret(12, 22, 62, 40, 1), marca: 'tela' },
    { tipo: 'massa', d: cantos([[36, 66, 1], [50, 66, 1], [54, 84, 1], [32, 84, 1]]), cor: PRETO },
    { tipo: 'massa', d: ret(26, 84, 34, 4, 2), cor: PRETO },
    { tipo: 'massa', d: ret(84, 34, 28, 74, 3), cor, marca: 'gabinete' },
    { tipo: 'vidro', d: ret(88, 40, 20, 40, 2), marca: 'vidro-lateral' },
    { tipo: 'luz', d: circulo(98, 52, 6), cor: '#7cc0d6', fino: true },
    { tipo: 'luz', d: circulo(98, 68, 6), cor: '#c07cd6', fino: true },
    { tipo: 'massa', d: cantos([[6, 98, 2], [72, 98, 2], [76, 106, 2], [2, 106, 2]]), cor: PRETO, marca: 'teclado' }
  ], 54);
}

function tablet(cor: string): Amostra {
  return noChao([
    { tipo: 'massa', d: cantos([[22, 16, 7], [92, 22, 7], [86, 104, 7], [16, 98, 7]]), cor, marca: 'corpo' },
    { tipo: 'vidro', d: cantos([[27, 22, 3], [86, 27, 3], [81, 98, 3], [21, 93, 3]]), marca: 'tela' },
    { tipo: 'linha', d: 'M34 70c10-14 20-20 30-6s14 4 18-8', larg: 1.6, cor: '#e7d58a', fino: true },
    // A caneta, apoiada: é o que diz "tablet de desenhar".
    { tipo: 'massa', d: membro([[94, 30], [108, 98]], [5, 5]), cor: BRANCO, marca: 'caneta' },
    { tipo: 'massa', d: `M105.6 97l3.6 1-1.4 7z`, cor: PRETO, semVolume: true }
  ], 44);
}

function videogame(cor: string): Amostra {
  return noChao([
    // O console em pé (a caixa alta com o vinco) e o controle na frente.
    { tipo: 'massa', d: suave([[22, 18], [52, 14], [56, 104], [26, 106]], true, 0.12), cor, marca: 'console' },
    { tipo: 'linha', d: 'M38 18L40 104', larg: 1.2 },
    { tipo: 'luz', d: ret(30, 92, 6, 2, 1), cor: '#7cc0d6', fino: true },
    { tipo: 'massa', d: suave([[56, 80], [70, 72], [100, 72], [114, 80], [116, 98], [106, 104], [96, 94], [74, 94], [64, 104], [54, 98]], true, 0.4), cor: luminancia(cor) > 0.5 ? escurecer(cor, 0.06) : clarear(cor, 0.12), marca: 'controle' },
    { tipo: 'massa', d: ret(69, 80.6, 10, 3, 0.8) + ret(72.5, 77, 3, 10, 0.8), cor: PRETO, semVolume: true, marca: 'direcional' },
    { tipo: 'massa', d: circulo(100, 80, 2.4) + circulo(106, 85, 2.4), cor: '#c8372d', semVolume: true }
  ], 50);
}

function tv(cor: string): Amostra {
  return noChao([
    // A tela larga e fina sobre o rack baixo (com a barra de som): a sala inteira, não um monitor.
    { tipo: 'massa', d: ret(4, 18, 112, 66, 2), cor, marca: 'moldura' },
    { tipo: 'vidro', d: ret(7, 21, 106, 60, 1), marca: 'tela' },
    { tipo: 'massa', d: ret(52, 84, 16, 6, 1), cor },
    { tipo: 'massa', d: ret(10, 90, 100, 14, 2), cor: MADEIRA, marca: 'rack' },
    { tipo: 'linha', d: 'M60 90v14', larg: 1 },
    { tipo: 'massa', d: ret(36, 86, 48, 4, 2), cor: PRETO, marca: 'barra-de-som' }
  ], 54);
}

function camera(cor: string): Amostra {
  return naParede([
    // O corpo com o punho e a corcova do flash, a lente grande — fotográfica, não celular.
    { tipo: 'massa', d: cantos([[10, 40, 6], [34, 40, 4], [40, 28, 3], [66, 28, 3], [72, 40, 4], [108, 40, 6], [108, 92, 6], [10, 92, 6]]), cor, marca: 'corpo' },
    { tipo: 'massa', d: ret(10, 40, 18, 52, 6), cor: PRETO, marca: 'punho' },
    { tipo: 'massa', d: circulo(64, 66, 24), cor: PRETO, marca: 'lente' },
    { tipo: 'metal', d: circulo(64, 66, 17), cor: '#5d5a56' },
    { tipo: 'vidro', d: circulo(64, 66, 11), marca: 'vidro-lente' },
    { tipo: 'massa', d: ret(88, 32, 12, 8, 2), cor: '#c8372d', semVolume: true, marca: 'disparador' }
  ]);
}

function som(cor: string): Amostra {
  return noChao([
    // A caixa de som cilíndrica (a grade de tecido) e o fone de arco ao lado.
    { tipo: 'massa', d: ret(14, 30, 44, 76, 18), cor, marca: 'caixa' },
    { tipo: 'linha', d: Array.from({ length: 9 }, (_, k) => `M18 ${42 + k * 6.6}h36`).join(''), larg: 0.6, fino: true },
    { tipo: 'massa', d: circulo(36, 102, 3), cor: PRETO, semVolume: true },
    { tipo: 'massa', d: membro([[70, 80], [74, 62], [90, 55], [106, 62], [110, 80]], [4, 4, 4, 4, 4]), cor: PRETO, marca: 'arco' },
    { tipo: 'massa', d: ret(64, 76, 13, 26, 6), cor, marca: 'fone' },
    { tipo: 'massa', d: ret(103, 76, 13, 26, 6), cor }
  ], 48);
}

/* ---------------------------------------------------------- Casa */

function maquinaLavar(cor: string): Amostra {
  return noChao([
    // A porta REDONDA da frente com o vidro e a roupa girando, o painel com o botão e o visor — lavar roupa.
    { tipo: 'massa', d: ret(18, 10, 84, 98, 5), cor, marca: 'corpo' },
    { tipo: 'linha', d: 'M18 30H102', larg: 1 },
    { tipo: 'massa', d: circulo(88, 20, 5), cor: METAL, marca: 'botao' },
    { tipo: 'massa', d: ret(28, 16, 26, 8, 2), cor: TELA, semVolume: true, marca: 'visor' },
    { tipo: 'metal', d: circulo(60, 68, 30), cor: '#cfcbc4', marca: 'porta-redonda' },
    { tipo: 'vidro', d: circulo(60, 68, 22), marca: 'vidro' },
    { tipo: 'massa', d: suave([[46, 76], [56, 62], [72, 64], [74, 78], [60, 86]], true, 0.45), cor: '#8aa0bf', opacidade: 0.75, semVolume: true, fino: true }
  ]);
}

function lavaLoucas(cor: string): Amostra {
  return noChao([
    // A porta lisa que baixa (o puxador comprido), a faixa de controles em cima — a cozinha, não a lavanderia.
    { tipo: 'massa', d: ret(16, 14, 88, 94, 4), cor, marca: 'corpo' },
    { tipo: 'massa', d: ret(16, 14, 88, 14, 4), cor: escurecer(cor, 0.12), semVolume: true, marca: 'controles' },
    ...[0, 1, 2, 3].map(k => ({ tipo: 'luz' as const, d: circulo(30 + k * 10, 21, 2), cor: '#7cc0d6', fino: true })),
    { tipo: 'metal', d: ret(28, 36, 64, 5, 2.5), cor: METAL, marca: 'puxador' },
    { tipo: 'linha', d: 'M16 30H104', larg: 1 },
    { tipo: 'massa', d: ret(22, 100, 76, 6, 1), cor: escurecer(cor, 0.25), semVolume: true }
  ]);
}

function aspirador(cor: string): Amostra {
  return noChao([
    // O disco baixo visto de lado e de cima (a elipse), o para-choque, o sensor no topo, a escova.
    { tipo: 'massa', d: `M10 82a50 18 0 0 0 100 0v10a50 18 0 0 1-100 0z`, cor: escurecer(cor, 0.15), marca: 'lateral' },
    { tipo: 'massa', d: elipse(60, 82, 50, 18), cor, marca: 'disco' },
    { tipo: 'massa', d: elipse(60, 74, 12, 5), cor: escurecer(cor, 0.25), semVolume: true, marca: 'sensor' },
    { tipo: 'luz', d: circulo(60, 88, 1.8), cor: '#7cc06a', fino: true },
    { tipo: 'linha', d: 'M18 92c8 6 18 9 30 10', larg: 1.2, fino: true }
  ], 52);
}

function arCondicionado(cor: string): Amostra {
  return naParede([
    // A unidade de parede (a split): comprida, as aletas embaixo, o visor — e o vento.
    { tipo: 'massa', d: cantos([[6, 30, 8], [114, 30, 8], [112, 66, 6], [8, 66, 6]]), cor, marca: 'unidade' },
    { tipo: 'massa', d: cantos([[12, 60, 2], [108, 60, 2], [106, 68, 3], [14, 68, 3]]), cor: escurecer(cor, 0.12), semVolume: true, marca: 'aletas' },
    { tipo: 'linha', d: 'M16 63h88', larg: 0.7 },
    { tipo: 'massa', d: ret(84, 38, 18, 8, 2), cor: TELA, semVolume: true },
    { tipo: 'linha', d: 'M30 78c6 6 6 12 0 18M54 78c6 6 6 12 0 18M78 78c6 6 6 12 0 18', larg: 1.4, cor: '#8fb8cc', marca: 'vento', fino: true }
  ]);
}

function colchao(cor: string): Amostra {
  return noChao([
    // A cama inteira de lado: a cabeceira, o colchão grosso, o travesseiro, a coberta dobrada, os pés.
    { tipo: 'massa', d: ret(6, 30, 12, 76, 3), cor: MADEIRA, marca: 'cabeceira' },
    { tipo: 'massa', d: ret(16, 66, 98, 24, 6), cor, marca: 'colchao' },
    { tipo: 'massa', d: ret(20, 56, 28, 14, 7), cor: BRANCO, marca: 'travesseiro' },
    { tipo: 'massa', d: cantos([[52, 62, 4], [114, 64, 4], [114, 80, 4], [52, 80, 4]]), cor: '#8aa0bf', marca: 'coberta' },
    { tipo: 'massa', d: ret(16, 90, 98, 6, 2), cor: MADEIRA },
    { tipo: 'massa', d: ret(20, 96, 5, 12, 1) + ret(106, 96, 5, 12, 1), cor: MADEIRA, semVolume: true }
  ], 54);
}

function sofa(cor: string): Amostra {
  return noChao([
    // O encosto, os três assentos, os braços, os pezinhos — o estofado na cor dele.
    { tipo: 'massa', d: ret(12, 34, 96, 36, 10), cor, marca: 'encosto' },
    { tipo: 'massa', d: ret(4, 52, 20, 46, 8), cor, marca: 'braco' },
    { tipo: 'massa', d: ret(96, 52, 20, 46, 8), cor },
    ...[0, 1, 2].map(k => ({ tipo: 'massa' as const, d: ret(22 + k * 25.4, 66, 25, 22, 5), cor: clarear(cor, 0.08), marca: 'assento' })),
    { tipo: 'massa', d: ret(20, 86, 80, 10, 3), cor: escurecer(cor, 0.12) },
    { tipo: 'massa', d: ret(12, 98, 4, 10, 1) + ret(104, 98, 4, 10, 1), cor: '#5a3a24', semVolume: true }
  ], 56);
}

function escrivaninha(cor: string): Amostra {
  return noChao([
    // A mesa com a gaveta e a cadeira de escritório com rodinhas na frente: estudar e trabalhar.
    { tipo: 'massa', d: ret(6, 42, 92, 7, 2), cor, marca: 'tampo' },
    { tipo: 'massa', d: ret(64, 49, 30, 26, 2), cor: escurecer(cor, 0.08), marca: 'gaveteiro' },
    { tipo: 'linha', d: 'M64 62h30M76 55h6M76 68h6', larg: 1 },
    { tipo: 'massa', d: ret(10, 49, 5, 59, 1) + ret(90, 75, 4, 33, 1), cor: escurecer(cor, 0.15), semVolume: true },
    { tipo: 'massa', d: ret(26, 22, 24, 32, 6), cor: PRETO, marca: 'cadeira' },
    { tipo: 'massa', d: ret(20, 56, 38, 9, 4), cor: PRETO },
    { tipo: 'metal', d: ret(37, 65, 4, 26, 1.5), cor: METAL },
    { tipo: 'massa', d: membro([[22, 98], [39, 92], [56, 98]], [3, 3, 3]), cor: '#5d5a56' },
    { tipo: 'massa', d: circulo(22, 100, 3.5) + circulo(56, 100, 3.5), cor: PRETO, semVolume: true }
  ], 52);
}

function cozinha(cor: string): Amostra {
  return noChao([
    // A panela com a tampa e as alças, a frigideira ao lado (o cabo comprido).
    { tipo: 'massa', d: cantos([[14, 48, 3], [74, 48, 3], [70, 104, 8], [18, 104, 8]]), cor, marca: 'panela' },
    { tipo: 'massa', d: suave([[10, 46], [44, 34], [78, 46], [74, 50], [14, 50]], true, 0.4), cor: escurecer(cor, 0.12), marca: 'tampa' },
    { tipo: 'metal', d: ret(38, 28, 12, 7, 3), cor: PRETO },
    { tipo: 'massa', d: ret(2, 60, 14, 6, 3) + ret(72, 60, 14, 6, 3), cor: PRETO, semVolume: true },
    { tipo: 'massa', d: `M78 88a20 7 0 0 0 36 0v6a20 7 0 0 1-36 0z`, cor: PRETO, marca: 'frigideira' },
    { tipo: 'massa', d: elipse(96, 88, 18, 6), cor: '#4a4643' }
  ], 54);
}

/* ---------------------------------------------------------- Instrumentos */

function violao(cor: string): Amostra {
  const tampo = luzDaMadeira(cor), braco = escurecer(cor, 0.45);
  return naParede([
    { tipo: 'massa', d: suave([[60, 56], [71, 57], [76, 64], [73, 74], [72, 79], [80, 88], [79, 103], [70, 111], [60, 113], [50, 111], [41, 103], [40, 88], [48, 79], [47, 74], [44, 64], [49, 57]], true, 0.5), cor: escurecer(cor, 0.25), marca: 'corpo' },
    { tipo: 'massa', d: suave([[60, 58.5], [70, 59.5], [74, 65], [71, 74], [70, 79.5], [77.5, 88.5], [76.5, 102], [68.5, 109], [60, 110.5], [51.5, 109], [43.5, 102], [42.5, 88.5], [50, 79.5], [49, 74], [46, 65], [50, 59.5]], true, 0.5), cor: tampo, marca: 'tampo' },
    { tipo: 'massa', d: circulo(60, 81, 7), cor: '#2e1d12', semVolume: true, marca: 'boca' },
    { tipo: 'linha', d: circulo(60, 81, 9), larg: 1, fino: true },
    { tipo: 'massa', d: ret(52, 97, 16, 3, 1), cor: braco, semVolume: true },
    { tipo: 'massa', d: ret(57, 12, 6, 47, 1), cor: braco, marca: 'braco' },
    { tipo: 'linha', d: 'M57 20h6M57 27h6M57 33h6M57 39h6M57 44h6', larg: 0.7, cor: '#cfc6b4', fino: true },
    { tipo: 'massa', d: cantos([[54, 2, 2], [66, 2, 2], [65, 13, 1], [55, 13, 1]]), cor: braco, marca: 'mao' },
    { tipo: 'linha', d: 'M54 4h-3M54 8h-3M54 12h-3M66 4h3M66 8h3M66 12h3', larg: 1.8, cor: METAL, so3: true },
    { tipo: 'linha', d: 'M58.6 13V98M60 13V98M61.4 13V98', larg: 0.35, cor: '#e9e4da', fino: true }
  ]);
}
/** O tampo de uma madeira: o abeto claro sobre as laterais da cor do instrumento (preto fosco e vermelho têm tampo pintado). */
const luzDaMadeira = (cor: string) => (/^#(2b2523|9b3a2a)$/i.test(cor) ? clarear(cor, 0.1) : clarear(cor, 0.35));

function violino(cor: string): Amostra {
  return naParede([
    // O corpo pequeno de cintura funda, os efes, o espelho escuro, a voluta — e o ARCO cruzando.
    { tipo: 'grupo', t: 'rotate(-16 60 60)', pecas: [
      { tipo: 'massa', d: suave([[60, 36], [70, 38], [73, 48], [68, 56], [74, 66], [72, 80], [60, 86], [48, 80], [46, 66], [52, 56], [47, 48], [50, 38]], true, 0.5), cor, marca: 'corpo' },
      { tipo: 'linha', d: 'M54 58c-2 4 2 6 0 10M66 58c2 4-2 6 0 10', larg: 1.1 },
      { tipo: 'massa', d: ret(58, 10, 4, 58, 1.5), cor: PRETO, marca: 'espelho' },
      { tipo: 'massa', d: circulo(60, 8, 4), cor, marca: 'voluta' },
      { tipo: 'massa', d: ret(55, 74, 10, 3, 1), cor: PRETO, semVolume: true }
    ] },
    { tipo: 'metal', d: membro([[24, 98], [100, 36]], [2.6, 2.6]), cor: '#5a3a24', marca: 'arco' },
    { tipo: 'linha', d: 'M26 100L101 39', larg: 0.6, cor: '#e9e4da', fino: true }
  ]);
}

function guitarra(cor: string): Amostra {
  return noChao([
    // O amplificador atrás (a caixa com a grade), a guitarra de corpo maciço com os dois chifres, os captadores.
    { tipo: 'massa', d: ret(64, 54, 48, 54, 4), cor: PRETO, marca: 'amplificador' },
    { tipo: 'massa', d: ret(68, 66, 40, 36, 3), cor: '#4a4643', semVolume: true },
    { tipo: 'linha', d: Array.from({ length: 6 }, (_, k) => `M70 ${70 + k * 5.6}h36`).join(''), larg: 0.6, cor: '#6a6560', fino: true },
    { tipo: 'metal', d: ret(70, 57, 36, 5, 1.5), cor: '#c9a23a' },
    { tipo: 'massa', d: suave([[30, 64], [36, 56], [44, 62], [50, 58], [56, 66], [52, 80], [58, 96], [46, 108], [26, 106], [18, 94], [24, 80], [20, 70]], true, 0.48), cor, marca: 'corpo' },
    { tipo: 'massa', d: ret(36, 14, 6, 50, 1), cor: '#d9a86a', marca: 'braco' },
    { tipo: 'massa', d: cantos([[34, 2, 2], [44, 4, 2], [43, 15, 1], [35, 15, 1]]), cor: '#d9a86a' },
    { tipo: 'massa', d: ret(32, 74, 14, 4, 1) + ret(32, 84, 14, 4, 1), cor: '#ece9e4', semVolume: true, marca: 'captador' },
    { tipo: 'massa', d: circulo(48, 96, 2.4) + circulo(42, 100, 2.4), cor: METAL, semVolume: true },
    { tipo: 'linha', d: 'M30 92c10 -2 22 6 34 10', larg: 1.6, cor: PRETO, fino: true }
  ], 50);
}

function teclado(cor: string): Amostra {
  return noChao([
    // O teclado sobre o suporte em X: as teclas brancas e pretas de frente.
    { tipo: 'massa', d: ret(4, 40, 112, 24, 3), cor, marca: 'corpo' },
    { tipo: 'massa', d: ret(8, 50, 104, 12, 1), cor: '#f4f1ea', semVolume: true, marca: 'teclas' },
    { tipo: 'linha', d: Array.from({ length: 14 }, (_, k) => `M${f(8 + (k + 1) * 104 / 15)} 50v12`).join(''), larg: 0.5, fino: true },
    { tipo: 'massa', d: [0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map(k => ret(12.4 + k * 104 / 15, 50, 3.4, 7, 0.4)).join(''), cor: PRETO, semVolume: true },
    { tipo: 'luz', d: ret(46, 43, 28, 4, 1), cor: '#7cc0d6', fino: true },
    { tipo: 'massa', d: membro([[30, 64], [70, 108]], [3.4, 3.4]) + membro([[90, 64], [50, 108]], [3.4, 3.4]), cor: '#5d5a56', marca: 'suporte' }
  ], 46);
}

function piano(cor: string): Amostra {
  return noChao([
    // O piano de armário: o móvel alto, o tampo, o teclado que avança, as pernas e os pedais.
    { tipo: 'massa', d: ret(8, 16, 104, 58, 3), cor, marca: 'movel' },
    { tipo: 'massa', d: ret(6, 12, 108, 6, 2), cor: escurecer(cor, 0.12), semVolume: true },
    { tipo: 'massa', d: ret(4, 70, 112, 10, 2), cor, marca: 'base-teclado' },
    { tipo: 'massa', d: ret(8, 72, 104, 6, 0.5), cor: '#f4f1ea', semVolume: true, marca: 'teclas' },
    { tipo: 'massa', d: Array.from({ length: 16 }, (_, k) => (k % 7 === 2 || k % 7 === 6 ? '' : ret(10 + k * 6.4, 72, 2.6, 3.6, 0.3))).join(''), cor: PRETO, semVolume: true },
    { tipo: 'massa', d: ret(10, 80, 8, 26, 1) + ret(102, 80, 8, 26, 1), cor, semVolume: true },
    { tipo: 'massa', d: ret(18, 80, 84, 24, 1), cor: escurecer(cor, 0.1) },
    { tipo: 'metal', d: ret(50, 104, 5, 4, 1) + ret(58, 104, 5, 4, 1) + ret(66, 104, 5, 4, 1), cor: '#c9a23a', marca: 'pedais' },
    { tipo: 'metal', d: ret(44, 30, 32, 16, 1), cor: '#f4f1ea', so3: true }
  ], 56);
}

function bateria(cor: string): Amostra {
  return noChao([
    // O bumbo de frente (o círculo grande), os dois tons, a caixa, os pratos dourados nos pedestais.
    { tipo: 'metal', d: ret(16.8, 30, 2.4, 76, 1) + ret(100.8, 24, 2.4, 82, 1) + ret(11, 105, 15, 3, 1) + ret(95, 105, 15, 3, 1), cor: '#8d8a85' },
    { tipo: 'massa', d: elipse(18, 30, 15, 3.6), cor: '#d6ad45', marca: 'prato' },
    { tipo: 'massa', d: elipse(102, 24, 15, 3.6), cor: '#d6ad45', marca: 'prato' },
    { tipo: 'massa', d: circulo(60, 80, 26), cor, marca: 'bumbo' },
    { tipo: 'massa', d: circulo(60, 80, 19), cor: '#f2ede2', semVolume: true },
    { tipo: 'massa', d: ret(40, 40, 18, 14, 5) + ret(62, 40, 18, 14, 5), cor, marca: 'tom' },
    { tipo: 'massa', d: elipse(49, 40, 9, 2.4) + elipse(71, 40, 9, 2.4), cor: '#f2ede2', semVolume: true },
    { tipo: 'massa', d: ret(86, 62, 22, 12, 3), cor, marca: 'caixa' },
    { tipo: 'linha', d: 'M90 62v12M95 62v12M100 62v12M105 62v12', larg: 0.6, cor: METAL, fino: true }
  ], 52);
}

/* ---------------------------------------------------------- Esporte e lazer */

function academia(cor: string): Amostra {
  return noChao([
    // Os halteres (o par) e o kettlebell: peso, não "esporte".
    { tipo: 'metal', d: ret(18, 88, 48, 6, 2), cor: METAL },
    { tipo: 'massa', d: ret(8, 76, 14, 30, 4) + ret(62, 76, 14, 30, 4), cor, marca: 'anilha' },
    { tipo: 'massa', d: ret(22, 82, 6, 18, 2) + ret(56, 82, 6, 18, 2), cor: escurecer(cor, 0.2), semVolume: true },
    { tipo: 'massa', d: `M84 106c-12 0-14-24 0-32 2-12 22-12 24 0 14 8 12 32 0 32z`, cor: PRETO, marca: 'kettlebell' },
    { tipo: 'massa', d: membro([[88, 74], [89, 64], [96, 60], [103, 64], [104, 74]], [4.4, 4.4, 4.4, 4.4, 4.4]), cor: PRETO }
  ], 54);
}

function esteira(cor: string): Amostra {
  return noChao([
    // A esteira de lado: a lona baixa e comprida, os corrimãos e o painel no alto.
    { tipo: 'massa', d: cantos([[4, 96, 4], [96, 88, 4], [104, 104, 3], [6, 108, 3]]), cor, marca: 'base' },
    { tipo: 'massa', d: cantos([[10, 94, 2], [92, 87, 2], [94, 92, 2], [12, 99, 2]]), cor: PRETO, semVolume: true, marca: 'lona' },
    { tipo: 'metal', d: membro([[94, 90], [100, 30]], [5, 5]), cor: METAL, marca: 'coluna' },
    { tipo: 'metal', d: membro([[100, 46], [72, 50]], [4, 4]), cor: METAL },
    { tipo: 'massa', d: cantos([[86, 22, 3], [114, 18, 3], [114, 34, 3], [88, 38, 3]]), cor, marca: 'painel' },
    { tipo: 'luz', d: ret(92, 24, 16, 6, 1), cor: '#7cc0d6', fino: true }
  ], 52);
}

function chuteira(cor: string): Amostra {
  return noChao([
    // A bola (os gomos de pentágono) e a chuteira com as travas.
    { tipo: 'massa', d: circulo(36, 82, 26), cor: '#f4f1ea', marca: 'bola' },
    { tipo: 'massa', d: 'M36 70l9 6-3 11h-12l-3-11z', cor: PRETO, semVolume: true },
    { tipo: 'linha', d: 'M36 70V56M45 76l12-4M42 87l7 11M30 87l-7 11M27 76l-12-4', larg: 1 },
    { tipo: 'massa', d: suave([[66, 92], [74, 74], [88, 72], [96, 84], [116, 90], [116, 100], [66, 100]], true, 0.35), cor, marca: 'chuteira' },
    { tipo: 'massa', d: ret(66, 100, 50, 4, 1), cor: PRETO, semVolume: true },
    { tipo: 'massa', d: ret(72, 104, 4, 4, 1) + ret(86, 104, 4, 4, 1) + ret(102, 104, 4, 4, 1), cor: PRETO, semVolume: true, marca: 'travas' },
    { tipo: 'linha', d: 'M78 80l8 4M80 76l8 4', larg: 1.2, cor: BRANCO, fino: true }
  ], 52);
}

function raquete(cor: string): Amostra {
  return noChao([
    // A raquete de tênis: a cabeça oval com a corda em grade, a garganta aberta, o cabo — e a bolinha amarela.
    { tipo: 'grupo', t: 'rotate(-28 50 60)', pecas: [
      { tipo: 'linha', d: Array.from({ length: 7 }, (_, k) => { const x = 36.2 + k * 4.6, y = 19 + k * 7.7, v = 26 * Math.sqrt(1 - ((x - 50) / 18) ** 2), h = 18 * Math.sqrt(1 - ((y - 42) / 26) ** 2); return `M${f(x)} ${f(42 - v)}V${f(42 + v)}M${f(50 - h)} ${f(y)}H${f(50 + h)}`; }).join(''), larg: 0.6, cor: '#e9e4da', marca: 'cordas' },
      { tipo: 'massa', d: anel(50, 42, 22, 30, 4.4), cor, marca: 'aro' },
      { tipo: 'massa', d: membro([[42, 69], [50, 86]], [4, 4]) + membro([[58, 69], [50, 86]], [4, 4]), cor },
      { tipo: 'massa', d: ret(46, 84, 8, 30, 3), cor: PRETO, marca: 'cabo' }
    ] },
    { tipo: 'massa', d: circulo(96, 96, 10), cor: '#d7e04a', marca: 'bolinha' },
    { tipo: 'linha', d: 'M87 92c6 2 10 8 9 13M105 100c-6-2-10-8-9-13', larg: 1, cor: BRANCO, fino: true }
  ], 50);
}

function prancha(cor: string): Amostra {
  return noChao([
    // A prancha em pé (o bico fino, a rabeta, a quilha, a faixa) e a cordinha.
    { tipo: 'massa', d: suave([[60, 4], [72, 30], [74, 70], [68, 104], [52, 104], [46, 70], [48, 30]], true, 0.45), cor: BRANCO, marca: 'prancha' },
    { tipo: 'massa', d: suave([[60, 20], [66, 40], [68, 80], [64, 98], [56, 98], [52, 80], [54, 40]], true, 0.45), cor, semVolume: true, marca: 'faixa' },
    { tipo: 'linha', d: 'M60 6V102', larg: 0.8 },
        { tipo: 'linha', d: 'M54 104c-6 4-14 2-20 6', larg: 1.4, cor: PRETO, fino: true }
  ], 24);
}

function camping(cor: string): Amostra {
  return noChao([
    // A barraca iglu (as varetas em arco), a porta aberta e o lampião ao lado.
    { tipo: 'massa', d: 'M6 108C10 52 86 52 92 108z', cor, marca: 'barraca' },
    { tipo: 'massa', d: 'M38 108c2-22 20-22 22 0z', cor: escurecer(cor, 0.4), semVolume: true, marca: 'porta' },
    { tipo: 'linha', d: 'M8 108C20 62 72 56 92 106M18 108C26 70 60 60 86 104', larg: 1, cor: escurecer(cor, 0.35) },
    { tipo: 'massa', d: ret(100, 84, 14, 22, 3), cor: '#4a4643', marca: 'lampiao' },
    { tipo: 'luz', d: ret(102, 88, 10, 12, 2), cor: '#f2d67a' },
    { tipo: 'massa', d: membro([[103, 84], [107, 77], [111, 84]], [2, 2, 2]), cor: '#4a4643' }
  ], 54);
}

function xadrez(cor: string): Amostra {
  return noChao([
    // O tabuleiro em perspectiva (as casas), o rei e o peão, o relógio de dois botões.
    { tipo: 'massa', d: cantos([[14, 74, 2], [90, 74, 2], [102, 104, 2], [2, 104, 2]]), cor, marca: 'tabuleiro' },
    { tipo: 'massa', d: [0, 1, 2, 3].flatMap(lin => [0, 1, 2, 3].filter(col => (lin + col) % 2 === 0).map(col => { const y0 = 74 + lin * 7.5, y1 = y0 + 7.5; const xa = (y: number, c: number) => 14 - (y - 74) * 0.4 + c * (76 + (y - 74) * 0.8) / 4; return `M${f(xa(y0, col))} ${f(y0)}L${f(xa(y0, col + 1))} ${f(y0)}L${f(xa(y1, col + 1))} ${f(y1)}L${f(xa(y1, col))} ${f(y1)}Z`; })).join(''), cor: escurecer(cor, 0.45), semVolume: true, marca: 'casas' },
    { tipo: 'massa', d: suave([[34, 76], [32, 64], [36, 56], [32, 44], [40, 42], [48, 44], [44, 56], [48, 64], [46, 76]], true, 0.3), cor: '#f4f1ea', marca: 'rei' },
    { tipo: 'massa', d: ret(39, 34, 2.4, 9, 0.6) + ret(35.8, 37.4, 8.4, 2.4, 0.6), cor: '#f4f1ea' },
    { tipo: 'massa', d: suave([[62, 80], [62, 70], [66, 66], [70, 70], [70, 80]], true, 0.4) + circulo(66, 62, 4.4), cor: '#2b2826', marca: 'peao' },
    { tipo: 'massa', d: ret(84, 52, 32, 20, 3), cor: '#6e3f22', marca: 'relogio' },
    { tipo: 'metal', d: circulo(93, 62, 5.5) + circulo(107, 62, 5.5), cor: '#f4f1ea' },
    { tipo: 'metal', d: ret(88, 48, 6, 4, 1) + ret(104, 48, 6, 4, 1), cor: PRETO }
  ], 54);
}

function estante(cor: string): Amostra {
  return noChao([
    // A estante de madeira com as prateleiras cheias de lombadas (a cor das capas desta estante).
    { tipo: 'massa', d: ret(14, 8, 92, 100, 2), cor: MADEIRA, marca: 'estante' },
    ...[0, 1, 2].map(k => ({ tipo: 'massa' as const, d: ret(18, 12 + k * 32, 84, 28, 1), cor: escurecer(MADEIRA, 0.35), semVolume: true })),
    ...[0, 1, 2].flatMap(k => Array.from({ length: 9 }, (_, j) => { const h = 20 + ((j * 7 + k * 3) % 6); const cores = [cor, clarear(cor, 0.3), escurecer(cor, 0.25), '#e0d2b4']; return { tipo: 'massa' as const, d: ret(20 + j * 9, 12 + k * 32 + 28 - h, 8, h, 0.6), cor: cores[(j + k) % 4], semVolume: true, marca: 'lombada' }; }))
  ], 50);
}

function livrosEstudo(cor: string): Amostra {
  return noChao([
    // A pilha de livros grossos, a apostila de espiral e o lápis em cima.
    { tipo: 'massa', d: ret(10, 86, 70, 20, 2), cor, marca: 'livro' },
    { tipo: 'massa', d: ret(14, 70, 62, 16, 2), cor: escurecer(cor, 0.2), marca: 'livro' },
    { tipo: 'massa', d: ret(8, 56, 66, 14, 2), cor: clarear(cor, 0.25), marca: 'livro' },
    { tipo: 'linha', d: 'M12 92h66M16 76h58M10 62h62', larg: 0.8, cor: '#f2ede2', fino: true },
    { tipo: 'massa', d: cantos([[78, 44, 2], [114, 48, 2], [110, 108, 2], [74, 104, 2]]), cor: '#f2ede2', marca: 'apostila' },
    { tipo: 'linha', d: Array.from({ length: 8 }, (_, k) => `M${f(79 - k * 0.5)} ${48 + k * 7}h-4`).join(''), larg: 1.4, cor: METAL, marca: 'espiral' },
    { tipo: 'metal', d: membro([[14, 54], [62, 50]], [3.4, 3.4]), cor: '#e2b72d', marca: 'lapis' }
  ], 54);
}

function arte(cor: string): Amostra {
  return noChao([
    // O cavalete com a tela pintada e a caixa (de madeira ou o estojo) aberta com as tintas e os pincéis.
    { tipo: 'massa', d: membro([[30, 108], [48, 14]], [4, 4]) + membro([[66, 108], [48, 14]], [4, 4]) + membro([[48, 14], [52, 108]], [3, 3]), cor: '#8a5a32', marca: 'cavalete' },
    { tipo: 'massa', d: ret(22, 22, 52, 42, 1), cor: '#f4f1ea', marca: 'tela' },
    { tipo: 'massa', d: suave([[28, 54], [40, 36], [52, 46], [66, 30], [70, 58]], true, 0.4), cor: '#5f8a4c', opacidade: 0.85, semVolume: true },
    { tipo: 'massa', d: circulo(36, 32, 5), cor: '#e2b72d', semVolume: true },
    { tipo: 'massa', d: ret(74, 86, 42, 20, 2), cor, marca: 'caixa' },
    ...['#c8372d', '#2f6db3', '#e2b72d', '#3f9a52'].map((c, k) => ({ tipo: 'massa' as const, d: ret(78 + k * 9, 90, 7, 7, 1.5), cor: c, semVolume: true, marca: 'tinta' })),
    { tipo: 'massa', d: membro([[80, 86], [94, 68]], [2.4, 2.4]) + membro([[90, 86], [104, 70]], [2.4, 2.4]), cor: '#8a5a32', marca: 'pincel' }
  ], 54);
}

function jogos(cor: string): Amostra {
  return noChao([
    // As caixas de jogo empilhadas (a tampa com a borda), o dado e o peão.
    { tipo: 'massa', d: ret(8, 86, 72, 20, 2), cor, marca: 'caixa' },
    { tipo: 'massa', d: ret(14, 66, 64, 20, 2), cor: '#e2b72d', marca: 'caixa' },
    { tipo: 'linha', d: 'M8 92h72M14 72h64', larg: 1, cor: '#f2ede2', fino: true },
    { tipo: 'massa', d: ret(86, 84, 22, 22, 4), cor: '#f4f1ea', marca: 'dado' },
    { tipo: 'massa', d: circulo(92, 90, 2) + circulo(102, 100, 2) + circulo(97, 95, 2), cor: PRETO, semVolume: true },
    { tipo: 'massa', d: suave([[90, 80], [92, 66], [96, 60], [100, 66], [102, 80]], true, 0.35) + circulo(96, 56, 5), cor: '#c8372d', marca: 'peao' }
  ], 52);
}

/** A forma de cada coisa do catálogo (uma por coisa: nenhuma divide desenho com outra). */
export const OBJETOS: Record<string, (cor: string) => Amostra> = {
  celular_simples: c => celular(c, 1, 0), celular_bom: c => celular(c, 2, 1), celular_topo: c => celular(c, 3, 2),
  notebook, computador, tablet, videogame, tv, camera, caixa_som: som,
  maquina_lavar: maquinaLavar, lava_loucas: lavaLoucas, aspirador_robo: aspirador, ar_condicionado: arCondicionado,
  colchao, sofa, escrivaninha, cozinha_equipada: cozinha,
  violao, violino, guitarra, teclado, piano, bateria,
  kit_academia: academia, esteira, chuteira_bola: chuteira, raquete, prancha, camping, tabuleiro: xadrez,
  livros: estante, livros_estudo: livrosEstudo, material_arte: arte, jogos_tabuleiro: jogos
};

/** O desenho de uma coisa (quem não está no catálogo cai numa caixa genérica, com o nome no rótulo). */
const DESENHADOS = lembrar<Amostra>();
export function amostraDoObjeto(coisaId: string, cor: string): Amostra {
  return DESENHADOS(`${coisaId}|${cor}`, () => desenharObjeto(coisaId, cor));
}
function desenharObjeto(coisaId: string, cor: string): Amostra {
  const f = OBJETOS[coisaId];
  return f ? f(cor) : noChao([{ tipo: 'massa', d: ret(24, 40, 72, 66, 4), cor, marca: 'caixa' }, { tipo: 'linha', d: 'M24 56H96', larg: 1 }], 40);
}
