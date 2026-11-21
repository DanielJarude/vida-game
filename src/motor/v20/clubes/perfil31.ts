/**
 * VIDA 31 · O PERFIL DOS JOGADORES DO CLUBE (o seu elenco e o mercado): os MESMOS arquétipos do atleta da vida
 * (`sistemas/arquetipos`: o Matador, o Garçom, o Muralha, o Cerebral, o Incansável, o Capitão, o Marrento, o Talento
 * precoce, o Decisivo, o Veterano…), lidos pela MESMA conta — a posição, os desvios dos atributos da posição em relação
 * ao nível dele, a personalidade, a idade, a braçadeira, o tempo de casa.
 *
 * Os jogadores do clube não têm ficha completa no motor: a posição fina, os atributos e o temperamento saem de um
 * sorteio ESTÁVEL por jogador (o id e o nome — o mesmo jogador tem sempre o mesmo jeito, no mercado e depois de
 * contratado, em qualquer ano). O que muda com o tempo é o que muda de verdade: a idade (o Talento precoce vira
 * Veterano), a força, a braçadeira, os anos de clube.
 *
 * E não é rótulo: a QUÍMICA do elenco (o vestiário que os perfis fazem — o Capitão aproxima, o Marrento desgasta) entra
 * na força do time na temporada (`quimicaDoElenco`, de −2 a +2 na média).
 */
import { clamp, rngDe } from '../../rng';
import { anoDe } from '../../tempo';
import { efeitosDoPerfil, lerPerfil, type LeituraDoPerfil, type PerfilEmergente } from '../../sistemas/arquetipos';
import type { Clube20, Jogador20, Setor20 } from '../../dados20/tipos20';

export type Papel31 = 'goleiro' | 'zagueiro' | 'lateral' | 'volante' | 'meia' | 'ponta' | 'atacante';
export const NOME_DO_PAPEL: Record<Papel31, string> = { goleiro: 'Goleiro', zagueiro: 'Zagueiro', lateral: 'Lateral', volante: 'Volante', meia: 'Meia', ponta: 'Ponta', atacante: 'Atacante' };

const PAPEIS: Record<Setor20, [Papel31, number][]> = {
  GOL: [['goleiro', 1]],
  DEF: [['zagueiro', 0.55], ['lateral', 0.45]],
  MEI: [['volante', 0.35], ['meia', 0.45], ['ponta', 0.2]],
  ATA: [['atacante', 0.65], ['ponta', 0.35]]
};

/** Os atributos que cada posição puxa (os mesmos ids da ficha do atleta) e o peso com que o jogador tende a eles. */
const PUXA: Record<Papel31, string[]> = {
  goleiro: ['reflexos', 'posicionamento', 'saidas'],
  zagueiro: ['marcacao', 'duelos', 'aereo', 'antecipacao', 'posicionamento'],
  lateral: ['resistencia', 'cruzamento', 'cobertura', 'determinacao'],
  volante: ['marcacao', 'cobertura', 'passe', 'decisao', 'resistencia'],
  meia: ['criacao', 'passe', 'visao', 'decisao', 'passe_longo'],
  ponta: ['movimentacao', 'cruzamento', 'criacao', 'finalizacao'],
  atacante: ['finalizacao', 'movimentacao', 'compostura']
};
const TODOS = ['finalizacao', 'compostura', 'movimentacao', 'criacao', 'passe', 'visao', 'cruzamento', 'reflexos', 'posicionamento', 'saidas', 'marcacao', 'duelos', 'aereo', 'antecipacao', 'decisao', 'passe_longo', 'resistencia', 'determinacao', 'cobertura', 'bola_parada', 'lideranca', 'concentracao'];

/** A posição fina do jogador (estável). */
export function papelDoJogador20(j: Jogador20): Papel31 {
  const r = rngDe('jogador20-papel', j.id, j.nome);
  const ops = PAPEIS[j.pos];
  let u = r.next();
  for (const [p, w] of ops) { u -= w; if (u <= 0) return p; }
  return ops[ops.length - 1][0];
}

/** O jeito do jogador (estável): os desvios dos atributos e o temperamento. */
function jeito(j: Jogador20, papel: Papel31): { desvio: Record<string, number>; tracos: Record<string, number> } {
  const r = rngDe('jogador20-jeito', j.id, j.nome);
  const desvio: Record<string, number> = {};
  const fortes = new Set(PUXA[papel]);
  // Um ou dois pontos fortes marcantes entre os da posição; o resto oscila em volta do nível.
  const ordem = [...PUXA[papel]];
  for (let k = ordem.length - 1; k > 0; k--) { const x = Math.floor(r.next() * (k + 1)); [ordem[k], ordem[x]] = [ordem[x], ordem[k]]; }
  const destaques = ordem.slice(0, r.chance(0.5) ? 2 : 1);
  for (const id of TODOS) desvio[id] = Math.round((r.normal() * (fortes.has(id) ? 3 : 2) + (destaques.includes(id) ? 6 + r.next() * 5 : 0)) * 10) / 10;
  if (r.chance(0.12)) desvio.bola_parada = 6 + r.next() * 6;
  const tracos: Record<string, number> = {};
  for (const t of ['disciplina', 'impulsividade', 'coragem', 'sociabilidade', 'empatia']) tracos[t] = Math.round(clamp(r.normal() * 22, -50, 50));
  return { desvio, tracos };
}

export interface Perfil31 { papel: Papel31; perfil: PerfilEmergente; atributos: { id: string; valor: number }[] }

/**
 * O perfil do jogador agora: a leitura de arquétipos do atleta da vida, com o que se sabe dele. `c`: o clube onde está
 * (o seu — para a braçadeira, o tempo de casa e a régua do elenco); sem clube (o mercado), a régua é a média do seu elenco.
 */
export function perfilDoJogador20(j: Jogador20, ano: number, ctx: { capitaoId?: string; mediaDoTime: number; reserva?: boolean; anosNoClube?: number }): Perfil31 {
  const papel = papelDoJogador20(j);
  const { desvio, tracos } = jeito(j, papel);
  const idade = ano - anoDe(j.tNasc);
  const nota = clamp(5.6 + (j.forca - ctx.mediaDoTime) / 8, 4.5, 8.5);
  const leitura: LeituraDoPerfil = {
    modalidade: 'futebol', papel, desvio, tracos, idade,
    acimaDaDivisao: j.forca - ctx.mediaDoTime,
    anosNoClube: ctx.anosNoClube ?? (j.daBase ? Math.max(0, idade - 17) : 1),
    capitao: ctx.capitaoId === j.id,
    reserva: !!ctx.reserva,
    nota,
    golsPorJogo: papel === 'atacante' ? clamp(0.25 + (j.forca - 60) / 80, 0.05, 0.8) : papel === 'ponta' ? clamp(0.15 + (j.forca - 60) / 120, 0.02, 0.5) : 0.03,
    assistPorJogo: papel === 'meia' || papel === 'ponta' ? clamp(0.12 + (j.forca - 60) / 140, 0.02, 0.4) : papel === 'lateral' ? 0.08 : 0.03,
    titulos: 0
  };
  const perfil = lerPerfil(leitura);
  const atributos = PUXA[papel].map(id => ({ id, valor: clamp(Math.round(j.forca + (desvio[id] ?? 0)), 20, 99) }));
  return { papel, perfil, atributos };
}

/** Os perfis do seu elenco (a régua é a média do próprio time; os 18 melhores jogam, o resto é reserva). */
export function perfisDoElenco(c: Clube20, ano: number, media: number): Map<string, Perfil31> {
  const ordem = [...c.elenco].sort((a, b) => b.forca - a.forca);
  const titulares = new Set(ordem.slice(0, 18).map(j => j.id));
  const m = new Map<string, Perfil31>();
  for (const j of c.elenco) m.set(j.id, perfilDoJogador20(j, ano, { capitaoId: c.capitao31, mediaDoTime: media, reserva: !titulares.has(j.id), anosNoClube: c.chegada31?.[j.id] !== undefined ? Math.max(0, ano - c.chegada31[j.id]) : undefined }));
  return m;
}

/**
 * A química do elenco: o vestiário que os perfis dos 18 que jogam fazem (o efeito `vestiario` de cada arquétipo — o
 * mesmo que aproxima ou desgasta o atleta da vida dos companheiros). Sem capitão escolhido, o grupo perde um pouco de
 * rumo. De −2 a +2 na média do elenco.
 */
export function quimicaDoElenco(c: Clube20, ano: number, media: number): number {
  const perfis = perfisDoElenco(c, ano, media);
  const ordem = [...c.elenco].sort((a, b) => b.forca - a.forca).slice(0, 18);
  const soma = ordem.reduce((s, j) => s + efeitosDoPerfil(perfis.get(j.id)?.perfil).vestiario, 0);
  const semCapitao = !c.capitao31 || !c.elenco.some(j => j.id === c.capitao31) ? -0.5 : 0;
  return Math.round(clamp(soma * 0.3 + semCapitao, -2, 2) * 10) / 10;
}
