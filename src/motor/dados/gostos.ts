/**
 * REWORK 12.4 — MÚSICA E ARTE: os gêneros, as linguagens e o que se faz com eles.
 *
 * Gosto não é classe, não é bairro, não é renda: o funk, o samba, o jazz e a música clássica estão abertos a todo mundo,
 * e os sorteios do gosto (`sistemas/gostos`) nunca leem a origem, a cidade ou o dinheiro. O gosto nasce da casa (o que
 * tocava em casa, de quem cuidava), muda com as pessoas (o par, os amigos), com a idade (a adolescência que descobre) e
 * com o que se faz (o instrumento que se aprende puxa a música dele).
 */

export interface GeneroMusical { id: string; nome: string; /** Vizinhos (a descoberta caminha por eles). */ perto: string[]; /** Instrumentos que puxam o gênero. */ instrumentos?: string[] }

export const GENEROS: GeneroMusical[] = [
  { id: 'funk', nome: 'funk', perto: ['rap', 'trap', 'pop', 'eletronica'], instrumentos: ['controladora_dj'] },
  { id: 'rap', nome: 'rap', perto: ['hip_hop', 'trap', 'funk', 'reggae'], instrumentos: ['controladora_dj', 'home_studio'] },
  { id: 'hip_hop', nome: 'hip-hop', perto: ['rap', 'trap', 'jazz'], instrumentos: ['controladora_dj'] },
  { id: 'trap', nome: 'trap', perto: ['rap', 'funk', 'eletronica'], instrumentos: ['home_studio', 'controladora_dj'] },
  { id: 'samba', nome: 'samba', perto: ['pagode', 'mpb', 'bossa_nova'], instrumentos: ['cavaquinho', 'pandeiro', 'violao'] },
  { id: 'pagode', nome: 'pagode', perto: ['samba', 'sertanejo', 'pop'], instrumentos: ['cavaquinho', 'pandeiro'] },
  { id: 'sertanejo', nome: 'sertanejo', perto: ['forro', 'pagode', 'pop'], instrumentos: ['violao', 'sanfona'] },
  { id: 'forro', nome: 'forró', perto: ['piseiro', 'sertanejo', 'mpb'], instrumentos: ['sanfona'] },
  { id: 'piseiro', nome: 'piseiro', perto: ['forro', 'funk', 'sertanejo'], instrumentos: ['sanfona', 'teclado'] },
  { id: 'axe', nome: 'axé', perto: ['pagode', 'reggae', 'pop'], instrumentos: ['pandeiro'] },
  { id: 'mpb', nome: 'MPB', perto: ['bossa_nova', 'samba', 'rock'], instrumentos: ['violao', 'piano'] },
  { id: 'bossa_nova', nome: 'bossa nova', perto: ['mpb', 'jazz', 'samba'], instrumentos: ['violao', 'piano'] },
  { id: 'rock', nome: 'rock', perto: ['metal', 'punk', 'mpb', 'pop'], instrumentos: ['guitarra', 'bateria'] },
  { id: 'metal', nome: 'metal', perto: ['rock', 'punk'], instrumentos: ['guitarra', 'bateria'] },
  { id: 'punk', nome: 'punk', perto: ['rock', 'metal', 'reggae'], instrumentos: ['guitarra', 'bateria'] },
  { id: 'pop', nome: 'pop', perto: ['eletronica', 'funk', 'rock', 'sertanejo'], instrumentos: ['teclado'] },
  { id: 'eletronica', nome: 'música eletrônica', perto: ['pop', 'funk', 'trap'], instrumentos: ['controladora_dj', 'home_studio'] },
  { id: 'reggae', nome: 'reggae', perto: ['rap', 'axe', 'mpb'], instrumentos: ['violao', 'guitarra'] },
  { id: 'jazz', nome: 'jazz', perto: ['bossa_nova', 'classica', 'hip_hop'], instrumentos: ['saxofone', 'piano'] },
  { id: 'classica', nome: 'música clássica', perto: ['jazz', 'mpb'], instrumentos: ['piano', 'violino'] },
  { id: 'gospel', nome: 'gospel', perto: ['pop', 'sertanejo', 'pagode'], instrumentos: ['teclado', 'violao'] }
];
export const generoMusical = (id: string) => GENEROS.find(g => g.id === id);

/** As linguagens da arte que se pratica (a prática é a frente que já existe: o desenho, a fotografia, a escrita). */
export interface LinguagemArte {
  id: string; nome: string; artigo: 'o' | 'a';
  /** A frente que se pratica (`frentes`). */
  frente: 'desenho' | 'fotografia' | 'escrita';
  /** Pede algum destes objetos (sem eles, não há como produzir a obra). Vazio: papel e lápis bastam. */
  pede: string[];
  /** O que se gasta de material por obra (reais, cidade de custo 1,0). */
  material: number;
  /** O nome da obra ("uma tela a óleo", "uma série de fotos"). */
  obra: string;
  /** A ocupação a que o hobby pode levar (já existente em `dados/ocupacoes`). */
  oficio?: string;
}

export const LINGUAGENS: LinguagemArte[] = [
  { id: 'pintura', nome: 'pintura', artigo: 'a', frente: 'desenho', pede: ['cavalete', 'material_arte'], material: 220, obra: 'uma tela', oficio: 'ilustrador' },
  { id: 'desenho', nome: 'desenho', artigo: 'o', frente: 'desenho', pede: [], material: 40, obra: 'um desenho', oficio: 'ilustrador' },
  { id: 'fotografia', nome: 'fotografia', artigo: 'a', frente: 'fotografia', pede: ['camera', 'celular_topo'], material: 150, obra: 'uma série de fotos impressas', oficio: 'fotografo' },
  { id: 'grafite', nome: 'grafite', artigo: 'o', frente: 'desenho', pede: ['material_arte'], material: 260, obra: 'um painel grafitado', oficio: 'ilustrador' },
  { id: 'escultura', nome: 'escultura', artigo: 'a', frente: 'desenho', pede: ['torno_ceramica', 'material_arte'], material: 300, obra: 'uma peça modelada', oficio: 'artesao' },
  { id: 'artesanato', nome: 'artesanato', artigo: 'o', frente: 'desenho', pede: [], material: 120, obra: 'uma peça feita à mão', oficio: 'artesao' },
  { id: 'escrita', nome: 'escrita', artigo: 'a', frente: 'escrita', pede: [], material: 30, obra: 'um conto', oficio: 'escritor' },
  { id: 'design', nome: 'design', artigo: 'o', frente: 'desenho', pede: ['computador', 'notebook', 'tablet'], material: 60, obra: 'um cartaz', oficio: 'designer' }
];
export const linguagemArte = (id: string) => LINGUAGENS.find(l => l.id === id);

/** A música como ofício (para a ponte hobby → profissão). */
export const OFICIOS_DA_MUSICA = ['musico_noite', 'produtor_musical'];

/**
 * Os programas culturais: o show, a roda de samba, o baile, o forró, o concerto, o sarau, a exposição, a batalha de
 * rima. Cada um diz de que gêneros (ou linguagens) é, quanto custa (cidade de custo 1,0) e se pede cidade com oferta.
 */
export interface ProgramaCultural { id: string; nome: string; generos: string[]; artes?: string[]; preco: number; /** Só em cidade com oferta cultural (`nivelDeOferta` ≥ 1). */ cidade?: boolean }

export const PROGRAMAS: ProgramaCultural[] = [
  { id: 'show', nome: 'um show grande', generos: [], preco: 380, cidade: true },
  { id: 'roda_samba', nome: 'uma roda de samba', generos: ['samba', 'pagode'], preco: 40 },
  { id: 'baile', nome: 'um baile funk', generos: ['funk', 'trap'], preco: 30 },
  { id: 'forro', nome: 'um forró pé de serra', generos: ['forro', 'piseiro'], preco: 35 },
  { id: 'batalha', nome: 'uma batalha de rima', generos: ['rap', 'hip_hop'], preco: 0 },
  { id: 'festival', nome: 'um festival de música', generos: ['rock', 'eletronica', 'pop', 'metal', 'reggae'], preco: 520, cidade: true },
  { id: 'concerto', nome: 'um concerto', generos: ['classica', 'jazz'], preco: 120, cidade: true },
  { id: 'sarau', nome: 'um sarau', generos: ['mpb', 'bossa_nova'], artes: ['escrita'], preco: 20 },
  { id: 'exposicao', nome: 'uma exposição de arte', generos: [], artes: ['pintura', 'fotografia', 'escultura', 'grafite', 'design'], preco: 30 }
];
export const programaCultural = (id: string) => PROGRAMAS.find(p => p.id === id);
