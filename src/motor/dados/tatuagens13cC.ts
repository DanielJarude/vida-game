/**
 * VIDA 13 (correção final) — PERSONAGENS DE OBRAS EM DOMÍNIO PÚBLICO, lote C: a literatura e o folclore brasileiros.
 * Arte em `ui/avatar/tatuagens13cC`. Puro (só tipos e dados): pacote `motor-casa`.
 * - Sítio do Picapau Amarelo: pelos livros de Monteiro Lobato (†1948) e as ilustrações antigas — nunca o visual da TV.
 * - Folclore brasileiro: as lendas de tradição oral. Macunaíma (Mário de Andrade, †1945), Machado de Assis (†1908),
 *   José de Alencar (†1877).
 */
import type { TamanhoDeTatuagem } from './tatuagens';
import type { DesenhoDoLote, LoteDeClassicos } from './tatuagens13cTipos';

const T = (...xs: TamanhoDeTatuagem[]) => xs;
const de = (referencia: string, xs: Omit<DesenhoDoLote, 'estilo' | 'referencia' | 'colorida'>[]): DesenhoDoLote[] =>
  xs.map(x => ({ ...x, estilo: 'cultura_pop', referencia, colorida: true }));

const SITIO = 'Sítio do Picapau Amarelo', FOLCLORE = 'Folclore brasileiro';

export const CLASSICOS_C: LoteDeClassicos = {
  midias: { [SITIO]: 'livros', [FOLCLORE]: 'lendas', 'Macunaíma': 'livros', 'Memórias Póstumas de Brás Cubas': 'livros', 'Dom Casmurro': 'livros', 'Iracema': 'livros' },
  lista: [
    ...de(SITIO, [
      { id: 'emilia_de_pano', nome: 'Emília, a boneca de pano', tamanhos: T(2, 3), proporcao: 0.75, descricao: 'A Emília de mãos na cintura: boneca de pano costurada, olhos de retrós, cabelo de linha e o vestido remendado.' },
      { id: 'visconde_de_sabugosa', nome: 'Visconde de Sabugosa', tamanhos: T(2, 3), proporcao: 0.62, descricao: 'O Visconde, sabugo de milho sábio de cartola e óculos, com um livro grosso debaixo do braço.' },
      { id: 'narizinho_arrebitado', nome: 'Narizinho arrebitado', tamanhos: T(1, 2, 3), proporcao: 0.9, descricao: 'Narizinho de perfil, o nariz arrebitado e o laço no cabelo, com o Príncipe Escamado de coroa diante dela.' },
      { id: 'pedrinho_do_bodoque', nome: 'Pedrinho e o bodoque', tamanhos: T(2, 3), proporcao: 0.8, descricao: 'Pedrinho de chapéu de palha esticando o bodoque, de olho no alvo.' },
      { id: 'marques_de_rabico', nome: 'Marquês de Rabicó', tamanhos: T(1, 2, 3), proporcao: 1.15, descricao: 'O porco Rabicó, marquês de coroinha torta, rabo enrolado e uma espiga roubada na boca.' },
      { id: 'quindim_rinoceronte', nome: 'Quindim, o rinoceronte', tamanhos: T(2, 3), proporcao: 1.35, descricao: 'O Quindim, rinoceronte manso e erudito, com o livro de gramática aberto no chão.' },
      { id: 'cuca_cara_de_jacare', nome: 'Cuca de cara de jacaré', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'A Cuca de Lobato: velha bruxa de cara de jacaré, cabeleira desgrenhada, xale e garras.' },
      { id: 'saci_de_lobato', nome: 'Saci do Sítio', tamanhos: T(2, 3), proporcao: 0.72, descricao: 'O Saci de uma perna só, carapuça vermelha e cachimbo aceso, pulando no meio do redemoinho.' }
    ]),
    ...de(FOLCLORE, [
      { id: 'curupira_pes_virados', nome: 'Curupira', tamanhos: T(2, 3), proporcao: 0.75, descricao: 'O Curupira de cabelo de fogo, os pés virados para trás e as pegadas apontando o caminho errado.' },
      { id: 'iara_do_rio', nome: 'Iara, a mãe-d’água', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'A Iara sentada na pedra do rio, os cabelos longos, a cauda de peixe e as vitórias-régias.' },
      { id: 'boitata_cobra_de_fogo', nome: 'Boitatá', tamanhos: T(1, 2, 3), proporcao: 1.3, descricao: 'O Boitatá, a cobra de fogo de olhos enormes, serpenteando em labaredas pelo campo.' },
      { id: 'mula_sem_cabeca', nome: 'Mula sem cabeça', tamanhos: T(2, 3), proporcao: 1.3, descricao: 'A Mula sem cabeça a galope, fogo saindo do pescoço e as ferraduras faiscando.' },
      { id: 'boto_de_chapeu', nome: 'Boto-cor-de-rosa', tamanhos: T(1, 2, 3), proporcao: 1.1, descricao: 'O Boto-cor-de-rosa saltando do rio com o chapéu branco que esconde o furo da cabeça.' },
      { id: 'lobisomem_lua_cheia', nome: 'Lobisomem', tamanhos: T(1, 2, 3), proporcao: 0.9, descricao: 'O Lobisomem uivando na sexta-feira de lua cheia, a camisa rasgada nos ombros.' },
      { id: 'caipora_no_caititu', nome: 'Caipora', tamanhos: T(2, 3), proporcao: 1.15, descricao: 'A Caipora, guardiã dos bichos do mato, montada no seu porco-do-mato com o cachimbo aceso.' },
      { id: 'mapinguari', nome: 'Mapinguari', tamanhos: T(2, 3), proporcao: 0.8, descricao: 'O Mapinguari da floresta: gigante peludo de um olho só e a boca enorme na barriga.' }
    ]),
    ...de('Macunaíma', [
      { id: 'macunaima_preguica', nome: 'Macunaíma: ai, que preguiça!', tamanhos: T(2, 3), proporcao: 1.5, descricao: 'Macunaíma, o herói sem nenhum caráter, espreguiçando na rede: “Ai, que preguiça!”.' }
    ]),
    ...de('Memórias Póstumas de Brás Cubas', [
      { id: 'bras_cubas_defunto_autor', nome: 'O defunto autor', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'Brás Cubas, o defunto autor, caveira de gravata escrevendo de pena, e o verme a quem dedicou o livro.' }
    ]),
    ...de('Dom Casmurro', [
      { id: 'capitu_olhos_de_ressaca', nome: 'Capitu e os olhos de ressaca', tamanhos: T(1, 2, 3), proporcao: 0.85, descricao: 'Capitu de tranças, os olhos de ressaca puxando as ondas do mar para dentro.' }
    ]),
    ...de('Iracema', [
      { id: 'iracema_e_a_ara', nome: 'Iracema e a ará', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'Iracema, a virgem dos lábios de mel, os cabelos mais negros que a asa da graúna e a ará pousada na mão.' }
    ])
  ]
};
