/**
 * REWORK 12.4 — O QUE SE FAZ NUM VEÍCULO, por categoria. Um barco não troca de roda, um avião não ganha escapamento:
 * cada categoria tem as suas peças.
 *
 *   ESTÉTICO   muda a cara (pintura, rodas, interior, acessório). Gosto de dono: quem compra usado paga pouco por ele
 *              (`valor` < 1 quando o gosto é muito pessoal; a peça boa de série segura um pouco do que custou).
 *   FUNCIONAL  muda o comportamento (pneu, freio, suspensão, motor, eletrônica de bordo): o quanto dá problema
 *              (`fragilidade`), o quanto gasta para rodar (`uso`) e o quanto vale na revenda. A preparação de motor anda
 *              mais e quebra mais; o pneu bom e a revisão do casco cuidam.
 *
 * Preço: `frac` do preço de um igual zero (com piso em reais), para que a mesma pintura custe mais num carro de luxo do
 * que num popular — e um piso para a bicicleta não pintar por dez reais. Nada aqui dá dinheiro: nenhuma opção faz o
 * veículo valer mais do que custou a peça.
 */

import type { CategoriaVeiculo } from './bens';

export interface OpcaoDePeca {
  id: string;
  nome: string;
  /** Fração do preço de um igual zero (com o piso em reais). Zero: voltar ao original. */
  frac: number;
  piso: number;
  /** Multiplica o valor de mercado (gosto pessoal < 1; a peça boa segura um pouco > 1, sempre menos do que custou). */
  valor?: number;
  fragilidade?: number;
  uso?: number;
  /** A cor que a peça dá ao veículo (pintura, envelopamento). */
  cor?: string;
}

export interface PecaDeVeiculo {
  id: string;
  nome: string;
  tipo: 'estetica' | 'funcional';
  opcoes: OpcaoDePeca[];
}

const ORIGINAL = (nome = 'original de fábrica'): OpcaoDePeca => ({ id: 'original', nome, frac: 0, piso: 0 });

const PINTURA: PecaDeVeiculo = {
  id: 'pintura', nome: 'Pintura', tipo: 'estetica', opcoes: [
    ORIGINAL('a cor de fábrica'),
    { id: 'vermelho', nome: 'vermelho', frac: 0.05, piso: 3500, valor: 0.97, cor: '#b8302a' },
    { id: 'azul_petroleo', nome: 'azul-petróleo', frac: 0.05, piso: 3500, valor: 0.97, cor: '#24576a' },
    { id: 'verde_ingles', nome: 'verde-inglês', frac: 0.05, piso: 3500, valor: 0.97, cor: '#2f4a3a' },
    { id: 'preto_fosco', nome: 'preto fosco', frac: 0.06, piso: 4000, valor: 0.96, cor: '#2a2a2c' },
    { id: 'amarelo', nome: 'amarelo', frac: 0.05, piso: 3500, valor: 0.95, cor: '#e0b12d' },
    { id: 'envelopado', nome: 'envelopamento (sai sem estragar)', frac: 0.03, piso: 2500, valor: 1, cor: '#5d6b45' }
  ]
};

export const PECAS_POR_CATEGORIA: Record<CategoriaVeiculo, PecaDeVeiculo[]> = {
  carro: [
    PINTURA,
    { id: 'rodas', nome: 'Rodas', tipo: 'estetica', opcoes: [ORIGINAL('as rodas de série'), { id: 'liga', nome: 'liga leve, aro maior', frac: 0.035, piso: 3200, valor: 1.005 }, { id: 'esportivas', nome: 'esportivas, aro grande', frac: 0.06, piso: 6000, valor: 0.99, uso: 1.03 }] },
    { id: 'interior', nome: 'Interior e estofamento', tipo: 'estetica', opcoes: [ORIGINAL('o tecido de série'), { id: 'couro', nome: 'bancos de couro', frac: 0.04, piso: 4500, valor: 1.01 }, { id: 'artesanal', nome: 'couro costurado à mão, cor escolhida', frac: 0.08, piso: 12000, valor: 1 }] },
    { id: 'acessorios', nome: 'Acessórios', tipo: 'estetica', opcoes: [ORIGINAL('sem nada a mais'), { id: 'multimidia', nome: 'central multimídia e câmera de ré', frac: 0.025, piso: 2400, valor: 1.005 }, { id: 'som', nome: 'som potente no porta-malas', frac: 0.035, piso: 4000, valor: 0.97 }, { id: 'pelicula', nome: 'película e engate', frac: 0.012, piso: 900, valor: 1 }] },
    { id: 'pneus', nome: 'Pneus', tipo: 'funcional', opcoes: [ORIGINAL('pneus comuns'), { id: 'bons', nome: 'pneus de marca boa', frac: 0.018, piso: 1800, fragilidade: 0.93 }] },
    { id: 'freios', nome: 'Freios', tipo: 'funcional', opcoes: [ORIGINAL('freios de série'), { id: 'reforcados', nome: 'discos e pastilhas de alto desempenho', frac: 0.02, piso: 2500, fragilidade: 0.96, valor: 1.005 }] },
    { id: 'suspensao', nome: 'Suspensão', tipo: 'funcional', opcoes: [ORIGINAL('suspensão de série'), { id: 'rebaixada', nome: 'rebaixada (mais firme, raspa na lombada)', frac: 0.03, piso: 3000, fragilidade: 1.08, valor: 0.95 }, { id: 'reforcada', nome: 'reforçada para estrada de terra', frac: 0.03, piso: 3200, fragilidade: 0.95 }] },
    { id: 'motor', nome: 'Motor', tipo: 'funcional', opcoes: [ORIGINAL('o motor de fábrica'), { id: 'remap', nome: 'preparação (remap e escape)', frac: 0.04, piso: 4500, fragilidade: 1.18, uso: 1.08, valor: 0.94 }] }
  ],
  moto: [
    PINTURA,
    { id: 'banco', nome: 'Banco', tipo: 'estetica', opcoes: [ORIGINAL('o banco de série'), { id: 'conforto', nome: 'banco de viagem, com gel', frac: 0.03, piso: 900, valor: 1 }] },
    { id: 'bagageiro', nome: 'Baú e alforjes', tipo: 'estetica', opcoes: [ORIGINAL('sem bagageiro'), { id: 'bau', nome: 'baú traseiro', frac: 0.02, piso: 600, valor: 1 }, { id: 'alforjes', nome: 'alforjes de couro', frac: 0.04, piso: 1500, valor: 1 }] },
    { id: 'pneus', nome: 'Pneus', tipo: 'funcional', opcoes: [ORIGINAL('pneus comuns'), { id: 'bons', nome: 'pneus de marca boa', frac: 0.03, piso: 700, fragilidade: 0.92 }] },
    { id: 'escape', nome: 'Escapamento', tipo: 'funcional', opcoes: [ORIGINAL('escape de série'), { id: 'esportivo', nome: 'escape esportivo (barulhento)', frac: 0.04, piso: 1200, fragilidade: 1.05, valor: 0.96 }] },
    { id: 'motor', nome: 'Motor', tipo: 'funcional', opcoes: [ORIGINAL('o motor de fábrica'), { id: 'remap', nome: 'preparação do motor', frac: 0.05, piso: 1800, fragilidade: 1.2, uso: 1.1, valor: 0.93 }] }
  ],
  bicicleta: [
    { id: 'pintura', nome: 'Pintura', tipo: 'estetica', opcoes: [ORIGINAL('a cor de fábrica'), { id: 'personalizada', nome: 'quadro repintado, cor escolhida', frac: 0.15, piso: 350, valor: 0.95, cor: '#2fa3a8' }] },
    { id: 'selim', nome: 'Selim e guidão', tipo: 'estetica', opcoes: [ORIGINAL('o de série'), { id: 'couro', nome: 'selim de couro e manoplas boas', frac: 0.08, piso: 250, valor: 1 }] },
    { id: 'transmissao', nome: 'Transmissão', tipo: 'funcional', opcoes: [ORIGINAL('a de série'), { id: 'boa', nome: 'câmbio e corrente de qualidade', frac: 0.2, piso: 600, fragilidade: 0.85 }] }
  ],
  embarcacao: [
    { id: 'casco', nome: 'Casco', tipo: 'funcional', opcoes: [ORIGINAL('a pintura de fundo antiga'), { id: 'antiincrustante', nome: 'fundo antiincrustante novo e anodos', frac: 0.02, piso: 6000, fragilidade: 0.85 }] },
    { id: 'eletronica', nome: 'Eletrônica de bordo', tipo: 'funcional', opcoes: [ORIGINAL('o básico de série'), { id: 'navegacao', nome: 'GPS, sonar e rádio novos', frac: 0.03, piso: 9000, fragilidade: 0.94, valor: 1.01 }] },
    { id: 'estofados', nome: 'Estofados e capota', tipo: 'estetica', opcoes: [ORIGINAL('os de série'), { id: 'nauticos', nome: 'estofado náutico novo e capota sob medida', frac: 0.03, piso: 8000, valor: 1.005 }] },
    { id: 'faixa', nome: 'Faixa e nome no casco', tipo: 'estetica', opcoes: [ORIGINAL('sem nome pintado'), { id: 'nome', nome: 'faixa nova e o nome pintado na popa', frac: 0.008, piso: 2500, valor: 0.995, cor: '#24576a' }] },
    { id: 'motor', nome: 'Motor', tipo: 'funcional', opcoes: [ORIGINAL('o motor de série'), { id: 'repotenciado', nome: 'motor mais forte (anda mais, bebe mais)', frac: 0.08, piso: 25000, fragilidade: 1.1, uso: 1.15, valor: 1.01 }] }
  ],
  aeronave: [
    { id: 'pintura', nome: 'Esquema de pintura', tipo: 'estetica', opcoes: [ORIGINAL('a pintura de fábrica'), { id: 'esquema', nome: 'esquema próprio (faixas, matrícula em destaque)', frac: 0.015, piso: 30000, valor: 0.99, cor: '#24576a' }] },
    { id: 'interior', nome: 'Interior', tipo: 'estetica', opcoes: [ORIGINAL('o interior de série'), { id: 'executivo', nome: 'interior executivo em couro', frac: 0.03, piso: 60000, valor: 1.01 }] },
    { id: 'avionica', nome: 'Aviônica', tipo: 'funcional', opcoes: [ORIGINAL('os instrumentos de série'), { id: 'digital', nome: 'painel digital (glass cockpit) e piloto automático', frac: 0.05, piso: 90000, fragilidade: 0.9, valor: 1.02 }] }
  ]
};

export const pecasDaCategoria = (c: CategoriaVeiculo): PecaDeVeiculo[] => PECAS_POR_CATEGORIA[c] ?? [];

export function opcaoDaPeca(c: CategoriaVeiculo, peca: string, opcao: string | undefined): OpcaoDePeca | undefined {
  return pecasDaCategoria(c).find(p => p.id === peca)?.opcoes.find(o => o.id === (opcao ?? 'original'));
}

/** O efeito somado do que foi feito num veículo (fragilidade, uso, valor). Sem `mods`: tudo 1. */
export function efeitoDasMods(c: CategoriaVeiculo, mods: Record<string, string> | undefined): { fragilidade: number; uso: number; valor: number } {
  let fragilidade = 1, uso = 1, valor = 1;
  for (const [peca, op] of Object.entries(mods ?? {})) {
    const o = opcaoDaPeca(c, peca, op);
    if (!o) continue;
    fragilidade *= o.fragilidade ?? 1;
    uso *= o.uso ?? 1;
    valor *= o.valor ?? 1;
  }
  return { fragilidade, uso, valor };
}
