/**
 * REWORK 7 — os EMBLEMAS das atividades: um desenho de traço (não emoji, não ícone genérico) para cada coisa que se
 * pratica — a bola, a rede, a raquete, a nota, o livro, o peão, a panela. Servem para reconhecer de relance o que é o
 * quê numa semana cheia; o nome continua sempre escrito ao lado (nada depende só do desenho).
 *
 * Um traço só (24×24, `currentColor`), na mesma espessura dos ícones das áreas: a cor vem do tom da categoria.
 */

import type { CategoriaAtividade } from '../../motor/sistemas/rotinas';

const P: Record<string, string> = {
  bola: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4zM12 3v4.5M20.6 10l-4.8.3M17.3 19.3l-3-4.6M6.7 19.3l3-4.6M3.4 10l4.8.3',
  rede: 'M3 9h18M3 9v3M21 9v3M5 12h14M7 9v3M11 9v3M15 9v3M19 9v3M12 21a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM9 15.5c2 .8 4 .8 6 0',
  cesta: 'M4 5h10M6 5l1.5 6h3L12 5M8 8h4M9 5v6M18 21a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM14 17h8M18 13v8',
  raquete: 'M14.5 3.5a5.5 5.5 0 0 1 0 11 5.5 5.5 0 0 1 0-11zM10.6 12.4L4 19l1 1 6.6-6.6M12 6.5l5 5M11 9.5l4.5-4.5M19 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  onda: 'M2 16c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M14 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 13l4-5 4 2 3-1',
  pista: 'M13.5 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 21l4-6-2.5-3 3.5-4 3 3h3.5M10 15l3.5 1.5 1 4.5M2 21h20',
  luta: 'M7 3h6a3 3 0 0 1 3 3v5H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM16 7h2a2 2 0 0 1 0 4h-2M7 11v4h9v-4M5 21l2-6M18 21l-2-6M9 7h4',
  haltere: 'M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12M3.5 12H2M20.5 12H22',
  corrida: 'M15 4.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 20l3-5 3 1 1-5-3-2-3 3M13 11l3 3h4M12 16l-1 5',
  nota: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 9l11-2',
  mascaras: 'M3 4h8v6a4 4 0 0 1-8 0zM13 8h8v6a4 4 0 0 1-8 0zM5.5 7.5h1M8 7.5h1M15.5 11.5h1M18 11.5h1M5.5 11c1 .8 2 .8 3 0M15.5 16c1-.8 2-.8 3 0',
  danca: 'M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 7v6l-4 8M12 13l4 8M6 9l6-2 6 3M18 10l2-3',
  lapis: 'M4 20l1-5L16 4l4 4L9 19zM14 6l4 4M4 20l5-1',
  pena: 'M20 4c-8 0-14 6-14 14v2M20 4c0 7-5 11-11 11M6 18l-2 2M12 10l-4 4',
  camera: 'M3 8h4l2-3h6l2 3h4v11H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3M8 9.5v5l4-2.5z',
  livro: 'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v14',
  idioma: 'M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8M11 5c0 4-3 7-6 8M13 21l4-9 4 9M14.5 18h5',
  peao: 'M12 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM9.5 8.5h5L13.5 15h-3zM8 15h8l1 3H7zM6 18h12v3H6z',
  codigo: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  atomo: 'M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 21c2.5 0 4.5-4 4.5-9S14.5 3 12 3 7.5 7 7.5 12s2 9 4.5 9zM4.2 16.5c1.2 2.2 5.7 1.4 10-1.1s7.3-6.1 6-8.3-5.7-1.4-10 1.1-7.3 6.1-6 8.3z',
  estudo: 'M3 7l9-4 9 4-9 4zM7 9v5c0 1.7 2.2 3 5 3s5-1.3 5-3V9M21 7v6',
  maos: 'M7 11V5.5a1.5 1.5 0 0 1 3 0V10M10 9V4.5a1.5 1.5 0 0 1 3 0V10M13 9.5V6a1.5 1.5 0 0 1 3 0v6.5c0 4-2.5 8.5-7 8.5-3 0-4.5-2-6-5l-1.5-3a1.5 1.5 0 0 1 2.6-1.5L7 14',
  igreja: 'M12 2v4M10 4h4M12 6l6 5v10H6V11zM10 21v-5h4v5M3 21h18',
  noite: 'M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5zM16 3l.6 1.6 1.6.6-1.6.6L16 7.4l-.6-1.6-1.6-.6 1.6-.6z',
  controle: 'M7 8h10a4 4 0 0 1 4 4v3a3 3 0 0 1-5.5 1.7L14 15h-4l-1.5 1.7A3 3 0 0 1 3 15v-3a4 4 0 0 1 4-4zM7 11v3M5.5 12.5h3M15.5 12h.01M17.5 13.5h.01',
  conversa: 'M4 5h16v10H9l-5 4zM8 9h8M8 12h5',
  familia: 'M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM16 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3.5 20a4.5 4.5 0 0 1 9 0M12.5 20a3.5 3.5 0 0 1 7 0M3 11l9-1 9 1',
  panela: 'M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM2 10h2M20 10h2M9 6c0-1 1-1.5 1-2.5M13 6c0-1 1-1.5 1-2.5M8 10V8h8v2',
  chave: 'M14.5 9.5a4.5 4.5 0 1 1 6-4.2l-3 1.2-1-2.5 2.4-1.2M14.5 9.5L4 20l-1.5-1.5L13 8',
  tesoura: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.4 7.6L20 18M8.4 16.4L20 6',
  moeda: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15 9c-.5-1.2-1.7-2-3-2-1.7 0-3 1-3 2.3 0 3.2 6 1.7 6 4.9 0 1.3-1.3 2.3-3 2.3-1.4 0-2.6-.8-3.1-2M12 5.5V7M12 17v1.5',
  moto: 'M5.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5.5 15h6l3-5h3l1 5M10 10h4M15 7h3',
  microfone: 'M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM6 11a6 6 0 0 0 12 0M12 17v4M8 21h8',
  coracao: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  folha: 'M5 19C5 10 10 5 20 4c-1 10-6 15-15 15zM5 19l8-8',
  tambor: 'M4 8c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8M8 10.5v8M16 10.5v8M3 3l5 4M21 3l-5 4',
  bandeira: 'M5 21V4M5 4h12l-2 4 2 4H5',
  semana: 'M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M8 13h2M12 13h2M8 16h2',
  pasta: 'M3.5 8h17v11.5h-17zM9 8V5.5h6V8M3.5 13.5h17M11 13.5v2h2v-2',
  estetoscopio: 'M6 3v6a4 4 0 0 0 8 0V3M6 3H4.5M14 3h1.5M10 13v3a4 4 0 0 0 8 0v-2M18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  balanca: 'M12 3v18M7 21h10M4 7h16M7 7l-3 7h6zM17 7l-3 7h6zM12 3l-1.5 1.5h3z',
  capacete: 'M3 17h18M5 17v-3a7 7 0 0 1 14 0v3M10 7.5V5h4v2.5M12 7v6M3 17v2h18v-2',
  engrenagem: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
  carrinho: 'M3 4h2.5l2.2 11h10.6l2-8H6.4M9 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  caminhao: 'M2 6h12v10H2zM14 9h4l3 3.5V16h-7M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  escudo: 'M12 3l8 3v5.5c0 4.7-3.3 8.3-8 9.5-4.7-1.2-8-4.8-8-9.5V6zM9 12l2 2 4-4',
  estrela: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  predio: 'M5 21V5l7-2 7 2v16M3 21h18M9 8h1.5M13.5 8H15M9 12h1.5M13.5 12H15M9 16h1.5M13.5 16H15M11 21v-3h2v3',
  quadro: 'M3 4h18v12H3zM8 20l2-4M16 20l-2-4M6.5 8.5h6M6.5 11.5h4M15 9.5l2 2',
  pincel: 'M18 3l3 3-9.5 9.5-3-3zM8.5 12.5C6 12.5 4 14.5 4 17c0 1.5-1 2.5-2 3 3.5 1 8 .5 8.5-4.5',
  apito: 'M3 11a5 5 0 1 0 10 0h8V8H8a5 5 0 0 0-5 3zM8 13.5a2.5 2.5 0 1 0 0-5M17 8V5',
  grade: 'M4 3h16v18H4zM8 3v18M12 3v18M16 3v18M4 12h16',
  lupa: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L21 21',
  poltrona: 'M5 11V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v5H3zM5 17v3M19 17v3',
  berco: 'M4 8v12M20 8v12M4 13h16M4 18h16M8 13v5M12 13v5M16 13v5M8 8a4 4 0 0 1 8 0'
};

/** A atividade → o desenho (o que não tem desenho próprio usa o da categoria). */
const DA_ATIVIDADE: Record<string, keyof typeof P> = {
  futebol: 'bola', time_escola: 'bola', atletica: 'bola', volei: 'rede', basquete: 'cesta', tenis: 'raquete', natacao: 'onda', atletismo: 'pista', lutas: 'luta',
  academia: 'haltere', corrida: 'corrida',
  musica: 'nota', fanfarra: 'tambor', tocar_na_noite: 'microfone', danca: 'danca', teatro: 'mascaras', desenho: 'lapis', escrever: 'pena', fotografia: 'camera', criar_conteudo: 'video',
  leitura: 'livro', ingles: 'idioma', xadrez: 'peao', programacao: 'codigo', clube_ciencias: 'atomo', olimpiada: 'estudo', reforco: 'estudo', projeto_escola: 'folha', projeto_tecnico: 'atomo',
  iniciacao: 'atomo', monitoria: 'estudo', grupo_estudos: 'estudo', empresa_junior: 'moeda', cursinho: 'estudo', estudar_concurso: 'estudo',
  gremio: 'bandeira', centro_academico: 'bandeira', extensao: 'maos', igreja: 'igreja', voluntariado: 'maos', sair_noite: 'noite', videogame: 'controle',
  terapia: 'conversa', tempo_familia: 'familia', ajudar_familia: 'familia', cozinhar: 'panela', consertar: 'chave', cortar_cabelo: 'tesoura',
  bico: 'moeda', corridas_app: 'moto', encomendas: 'panela', consertos: 'chave', cortes_por_fora: 'tesoura', freelas: 'codigo', aulas_particulares: 'estudo', vender_doces: 'moeda'
};

const DA_CATEGORIA: Record<CategoriaAtividade, keyof typeof P> = {
  esporte: 'bola', arte: 'nota', estudo: 'livro', social: 'maos', oficio: 'chave', corpo: 'haltere', lazer: 'noite', renda: 'moeda', cuidado: 'coracao'
};

/** A família de carreira (`dados/carreiras`) — ou a situação de trabalho — → o emblema do ofício. */
const DO_OFICIO: Record<string, keyof typeof P> = {
  politica: 'bandeira', varejo: 'carrinho', escritorio: 'pasta', transporte: 'caminhao', cozinha: 'panela', beleza: 'tesoura', oficio: 'capacete',
  industria: 'engrenagem', tecnologia: 'codigo', saude: 'estetoscopio', cuidado: 'coracao', predial: 'predio', docencia: 'quadro', academia: 'atomo',
  direito: 'balanca', engenharia: 'capacete', publico: 'predio', seguranca: 'escudo', militar: 'estrela', rural: 'folha', criacao: 'pincel', palco: 'microfone',
  esporte: 'apito', informal: 'moeda',
  negocio: 'moeda', preso: 'grade', procurando: 'lupa', sem_procurar: 'semana', aposentado: 'poltrona', pausa: 'berco', crianca: 'estudo', estudante: 'estudo', atleta: 'bola', base: 'bola', artista: 'nota', plataforma: 'moto', pesca: 'onda'
};
export const desenhoDoOficio = (chave: string): string => P[DO_OFICIO[chave] ?? 'pasta'];

export const desenhoDaAtividade = (id: string, categoria?: CategoriaAtividade): string => P[DA_ATIVIDADE[id] ?? (categoria ? DA_CATEGORIA[categoria] : 'semana')];

/** O emblema de uma atividade: o desenho dentro de uma marca redonda no tom da categoria (`--tom-cat`). */
export function Emblema({ id, categoria, tamanho = 40 }: { id: string; categoria?: CategoriaAtividade; tamanho?: number }) {
  return (
    <span className={`emblema emblema--${categoria ?? 'livre'}`} style={{ width: tamanho, height: tamanho }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={Math.round(tamanho * 0.56)} height={Math.round(tamanho * 0.56)} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d={desenhoDaAtividade(id, categoria)} /></svg>
    </span>
  );
}

/** O emblema de um ofício: o desenho no tom da família de carreira. */
export function EmblemaDoOficio({ chave, tamanho = 52 }: { chave: string; tamanho?: number }) {
  return (
    <span className="emblema emblema--oficio" style={{ width: tamanho, height: tamanho }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={Math.round(tamanho * 0.52)} height={Math.round(tamanho * 0.52)} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d={desenhoDoOficio(chave)} /></svg>
    </span>
  );
}

export { P as DESENHOS };
