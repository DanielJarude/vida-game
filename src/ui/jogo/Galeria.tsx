/**
 * REWORK 11.5 · TRO-01 — A GALERIA DE CONQUISTAS. Cada competição tem a sua FORMA de troféu (desenhos originais, sem
 * marca): a copa do mundo de seleções com o globo, a continental de seleções alta e de alças finas, a de clubes da
 * Europa de alças largas, a da América com a figura no alto, a copa nacional em urna com tampa, a liga em placa e
 * escudo, o acesso em taça pequena, as copas de quadra com a bola, o prêmio individual em medalha; na arte, a estatueta
 * e o disco. Tudo vem do que o motor registrou (`palmares`, `trofeuId`, `competicaoId`; os prêmios do currículo e das
 * obras; os títulos do técnico) — nada é concedido para preencher a galeria.
 */
import type { ConquistaEsportiva, Vida } from '../../motor/tipos';
import { anoDe } from '../../motor/tempo';
import { divisaoDoNivel, nivelDaCompeticao } from '../../motor/dados/clubes';
import { paisDaCidade } from '../../motor/dados/lugares';
import { nomeDaCompeticao, nomeDoEstadualDaCidade } from '../../motor/sistemas/competicoes';

/** VIDA 36 · as formas. Cada jogo de e-sports tem a sua (cristal, escudo, agulha, caixa, hexágono, carro, controle); cada
 * obra tem a sua (rolo de filme, televisão, máscaras, claquete). Nada disso é só cor: a silhueta muda. */
export type Forma = 'estadual' | 'mundo' | 'selecao' | 'orelhas' | 'figura' | 'urna' | 'liga' | 'acesso' | 'quadra' | 'medalha' | 'estatueta' | 'disco' | 'banco' | 'bola' | 'chuteira' | 'the_best' | 'golden_boy'
  | 'cristal' | 'escudo_tatico' | 'agulha' | 'caixa' | 'hexagono' | 'carro' | 'controle'
  | 'rolo' | 'televisao' | 'mascaras' | 'claquete'
  | 'cesta' | 'rede' | 'raquete' | 'tocha' | 'onda' | 'cinturao'
  | 'cruz' | 'livro' | 'atomo' | 'obelisco' | 'balanca' | 'seta' | 'pena' | 'paleta' | 'laurea';

/** VIDA 36 · a forma de um título de e-sports: a do jogo (a silhueta é do jogo, não só da cor). */
export function formaDoTituloEsports(jogo: string): Forma {
  switch (jogo) {
    case 'lol': return 'cristal';
    case 'cs': return 'escudo_tatico';
    case 'valorant': return 'agulha';
    case 'fortnite': return 'caixa';
    case 'r6': return 'hexagono';
    case 'rocket': return 'carro';
    default: return 'controle';
  }
}
/** VIDA 36 · a forma de um prêmio de obra (cinema, série, teatro, curta). */
export function formaDoPremioDeObra(tipo: string): Forma {
  if (tipo === 'filme' || tipo === 'cinema') return 'rolo';
  if (tipo === 'serie' || tipo === 'novela') return 'televisao';
  if (tipo === 'teatro') return 'mascaras';
  if (tipo === 'curta') return 'claquete';
  return 'estatueta';
}
/** VIDA 36 · a hierarquia: o alcance e o selo (comum, especial, histórico) que aparecem na ficha do troféu. */
export const SELO_DO_ALCANCE: Record<'local' | 'nacional' | 'internacional', string> = { local: 'comum', nacional: 'especial', internacional: 'histórico' };

/** VIDA 36 · as modalidades tradicionais: cada uma com a sua forma (o futebol segue com liga, copa e estaduais). */
const FORMA_DA_MODALIDADE: Record<string, Forma> = { basquete: 'cesta', volei: 'rede', tenis: 'raquete', atletismo: 'tocha', natacao: 'onda', lutas: 'cinturao' };
/** VIDA 36 · as honras de outras carreiras: a forma pela área (saúde, educação, jurídico...). */
export function formaDoPremioDeArea(area?: string): Forma {
  const m: Record<string, Forma> = { saude: 'cruz', educacao: 'livro', tecnologia: 'atomo', engenharia: 'obelisco', juridico: 'balanca', financas: 'seta', comunicacao: 'pena', criativo: 'paleta' };
  return (area && m[area]) || 'medalha';
}

/** A forma pelo id estável (a apresentação muda; o id não). */
export function formaDoTrofeu(c: Pick<ConquistaEsportiva, 'tipo' | 'competicaoId' | 'competicao'> & { modalidade?: string }): Forma {
  // HOTFIX 11.5.1: os prêmios do futebol do mundo, cada um com a sua forma (a bola dourada, a chuteira, o globo e a
  // figura do The Best, a figura jovem do Golden Boy); os outros prêmios, a medalha.
  if (c.competicaoId === 'premio:bola_de_ouro') return 'bola';
  if (c.competicaoId === 'premio:chuteira_de_ouro') return 'chuteira';
  if (c.competicaoId === 'premio:the_best') return 'the_best';
  if (c.competicaoId === 'premio:golden_boy') return 'golden_boy';
  if (c.tipo === 'premio') return 'medalha';
  if (c.tipo === 'acesso') return 'acesso';
  if (c.modalidade && FORMA_DA_MODALIDADE[c.modalidade]) return FORMA_DA_MODALIDADE[c.modalidade];
  const id = c.competicaoId ?? '';
  if (id.endsWith(':basquete') || id.endsWith(':volei')) return 'quadra';
  // VIDA 32: os estaduais (Paulista, Carioca, Mineiro…) têm troféu próprio.
  if (id.startsWith('est:')) return 'estadual';
  if (id === 'sel:mundial') return 'mundo';
  if (id.startsWith('sel:')) return 'selecao';
  if (id === 'cont:UEFA') return 'orelhas';
  if (id.startsWith('cont:')) return 'figura';
  if (id.startsWith('copa:')) return 'urna';
  if (id.startsWith('liga:')) return Number(id.split(':')[2]) >= 4 ? 'liga' : 'acesso';
  if (/mundial|copa do mundo/i.test(c.competicao)) return 'mundo';
  return 'liga';
}

/**
 * VIDA 31 · OS TROFÉUS DO TÉCNICO: cada título com a forma da competição (antes, todos eram o mesmo desenho genérico e o
 * nome vinha com a preposição sobrando: "do estadual", "da Copa do Brasil"), o acesso como troféu e a final perdida como
 * prata — como na galeria do jogador. Tudo lido do que a carreira registrou (os títulos, o acesso, a fase de cada copa).
 */
const LIMPA = (x: string) => x.replace(/^Campe(ão|ã) /, '').replace(/^(do|da|dos|das|o|a|os|as) /, '');
export function nomeDoTituloDoTecnico(x: string): string {
  const c = LIMPA(x);
  return c === 'estadual' ? 'Campeonato estadual' : c.charAt(0).toUpperCase() + c.slice(1);
}
export function formaDoTituloDoTecnico(x: string): Forma {
  const c = LIMPA(x);
  if (/Mundial de Clubes|Copa Intercontinental|Copa do Mundo/i.test(c)) return 'mundo';
  if (/Copa América|Eurocopa|Copa Ouro|Copa Africana|Copa da Ásia|seleções/i.test(c)) return 'selecao';
  if (/Champions/i.test(c)) return 'orelhas';
  if (/Libertadores|continental/i.test(c)) return 'figura';
  if (/^Campeonato [A-ZÁÉÍÓÚÂÊÔÃÕ]|estadual/.test(c)) return 'estadual';
  if (/regional/i.test(c)) return 'acesso';
  const n = nivelDaCompeticao(c);
  if (n !== undefined) return n >= 4 ? 'liga' : 'acesso';
  if (/^(Copa|Coppa|FA Cup|DFB|Coupe|Taça|U\.S\.)|copa nacional/i.test(c)) return 'urna';
  return 'liga';
}
const FORMA_DA_FASE = (id: string): Forma => (id.startsWith('mundial:') ? 'mundo' : id === 'cont:UEFA' ? 'orelhas' : id.startsWith('cont:') ? 'figura' : 'urna');
export function trofeusDoTecnico(v: Vida): ItemDaGaleria[] {
  const out: ItemDaGaleria[] = [];
  for (const p of v.caminhos.tecnico?.passagens ?? []) {
    const pais = paisDaCidade(p.municipioId);
    for (const t of p.temporadas) {
      const base = { ano: t.ano, onde: p.clube, papel: 'no banco', tipo: 'tecnico' as const };
      for (const x of t.titulos ?? []) out.push({ ...base, id: `tec:${p.clube}:${t.ano}:${x}`, forma: formaDoTituloDoTecnico(x), metal: 'ouro', nome: nomeDoTituloDoTecnico(x) });
      if (t.acesso) out.push({ ...base, id: `tec:${p.clube}:${t.ano}:acesso`, forma: 'acesso', metal: 'ouro', nome: `Acesso ${divisaoDoNivel(Math.min(4, t.nivel + 1), pais) ? `à ${divisaoDoNivel(Math.min(4, t.nivel + 1), pais)}` : 'à divisão de cima'}` });
      const finais: [string, Forma][] = [];
      if (t.estadual === 'vice') finais.push([pais === 'BR' ? nomeDoEstadualDaCidade(p.municipioId) : 'Campeonato estadual', 'estadual']);
      for (const c of [t.copa, t.continental, t.mundial]) if (c?.fase === 'vice') finais.push([nomeDaCompeticao(c.id), FORMA_DA_FASE(c.id)]);
      for (const [nome, forma] of finais) out.push({ ...base, id: `tec:${p.clube}:${t.ano}:final:${nome}`, forma, metal: 'prata', nome: `Final: ${nome}` });
    }
  }
  return out;
}

/* VIDA 36 · a identidade de cada competição: a cor da base e a sigla gravada. Vem do que a competição É (o jogo, a
 * modalidade, a obra, a área), nunca de um sorteio: o mesmo título sempre sai com a mesma marca. */
const COR_DO_JOGO: Record<string, string> = { lol: '#b8862b', cs: '#2f5a86', valorant: '#b8413f', fortnite: '#6a4fb0', r6: '#3d6b58', rocket: '#2c7fb8' };
const COR_DA_MODALIDADE: Record<string, string> = { basquete: '#c4612c', volei: '#c9a227', tenis: '#5f8f4e', atletismo: '#a83232', natacao: '#2a7f8f', lutas: '#3a3a3a' };
const COR_DA_OBRA: Record<string, string> = { filme: '#7a1f2b', cinema: '#7a1f2b', serie: '#2f5d8a', novela: '#8a4f2f', teatro: '#5e3c7d', curta: '#7d6a3a', musica: '#3f6e5a' };
const COR_DA_AREA: Record<string, string> = { saude: '#2f7d6b', educacao: '#7a5a2f', tecnologia: '#3b5bb0', engenharia: '#6b6b6b', juridico: '#5a3f7a', financas: '#2f6b3f', comunicacao: '#a0527a', criativo: '#c0703a' };
const COR_PADRAO = '#8a7a4a';
const PALAVRAS_DE_LIGACAO = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'o', 'a', 'os', 'as', 'of', 'the', 'du', 'del']);
/** A sigla gravada: as iniciais das palavras que importam (até quatro letras). "Mundial de LoL" → "ML". */
export function siglaDe(nome: string): string {
  const xs = nome.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(x => x && !PALAVRAS_DE_LIGACAO.has(x.toLowerCase()));
  const s = xs.map(x => x.charAt(0).toUpperCase()).join('').slice(0, 4);
  return s || nome.slice(0, 3).toUpperCase();
}

/** O desenho de cada forma (traço simples, a mesma paleta: ouro para o título, prata para a final, bronze para o prêmio). */
export function Trofeu({ forma, metal = 'ouro', rotulo, marca }: { forma: Forma; metal?: 'ouro' | 'prata' | 'bronze'; rotulo: string; marca?: { cor: string; sigla: string } }) {
  const corpo = (() => {
    switch (forma) {
      // VIDA 32: o troféu do estadual — o escudo do estado com a taça em cima.
      case 'estadual': return <><path d="M13 4 L27 4 L26 14 Q20 19 14 14 Z" /><path d="M10 20 L30 20 L30 28 Q30 35 20 39 Q10 35 10 28 Z" /><path d="M20 24 L21.5 27 L25 27.3 L22.3 29.5 L23.2 33 L20 31 L16.8 33 L17.7 29.5 L15 27.3 L18.5 27 Z" fill="none" strokeWidth="1.1" /><rect x="18.5" y="15" width="3" height="5" /><rect x="12" y="40" width="16" height="4" rx="1" /></>;
      case 'mundo': return <><circle cx="20" cy="12" r="8" /><path d="M14 19 Q20 30 16 38 L24 38 Q20 30 26 19 Z" /><rect x="12" y="38" width="16" height="6" rx="1" /></>;
      case 'selecao': return <><path d="M12 6 L28 6 L26 22 Q20 28 14 22 Z" /><path d="M12 8 Q6 10 10 18 M28 8 Q34 10 30 18" fill="none" strokeWidth="1.6" /><rect x="18" y="26" width="4" height="10" /><rect x="11" y="36" width="18" height="7" rx="1" /></>;
      case 'orelhas': return <><path d="M13 6 L27 6 L26 24 Q20 29 14 24 Z" /><path d="M13 9 Q2 12 12 24 M27 9 Q38 12 28 24" fill="none" strokeWidth="3" /><rect x="17" y="28" width="6" height="8" /><rect x="12" y="36" width="16" height="7" rx="1" /></>;
      case 'figura': return <><circle cx="20" cy="5" r="3" /><path d="M17 8 L23 8 L22 14 L18 14 Z" /><path d="M12 14 L28 14 L26 26 Q20 30 14 26 Z" /><rect x="18" y="29" width="4" height="7" /><rect x="11" y="36" width="18" height="7" rx="1" /></>;
      case 'urna': return <><path d="M15 4 L25 4 L24 8 L16 8 Z" /><path d="M12 9 L28 9 Q30 22 22 27 L18 27 Q10 22 12 9 Z" /><path d="M12 11 Q5 14 12 20 M28 11 Q35 14 28 20" fill="none" strokeWidth="1.8" /><rect x="17" y="27" width="6" height="9" /><rect x="12" y="36" width="16" height="7" rx="1" /></>;
      case 'liga': return <><path d="M8 6 L32 6 L30 26 Q20 34 10 26 Z" /><path d="M14 12 L26 12 M14 18 L26 18" fill="none" strokeWidth="1.6" /><rect x="10" y="36" width="20" height="7" rx="1" /></>;
      case 'acesso': return <><path d="M14 14 L26 14 L25 24 Q20 28 15 24 Z" /><rect x="18" y="27" width="4" height="8" /><rect x="13" y="35" width="14" height="7" rx="1" /></>;
      case 'quadra': return <><circle cx="20" cy="9" r="6" /><path d="M14 9 L26 9 M20 3 L20 15" fill="none" strokeWidth="1.2" /><path d="M14 17 L26 17 L24 27 Q20 30 16 27 Z" /><rect x="18" y="29" width="4" height="6" /><rect x="12" y="35" width="16" height="7" rx="1" /></>;
      case 'medalha': return <><path d="M14 2 L20 14 L26 2" fill="none" strokeWidth="3" /><circle cx="20" cy="24" r="11" /><circle cx="20" cy="24" r="6" fill="none" strokeWidth="1.4" /></>;
      case 'estatueta': return <><circle cx="20" cy="6" r="4" /><path d="M16 11 L24 11 L23 30 L17 30 Z" /><rect x="13" y="30" width="14" height="4" /><rect x="11" y="34" width="18" height="8" rx="1" /></>;
      case 'disco': return <><circle cx="20" cy="20" r="15" /><circle cx="20" cy="20" r="5" fill="none" strokeWidth="1.6" /><circle cx="20" cy="20" r="1.5" /><rect x="8" y="38" width="24" height="5" rx="1" /></>;
      case 'bola': return <><circle cx="20" cy="17" r="12" /><path d="M20 9 L25 13 L23 19 L17 19 L15 13 Z M20 5 L20 9 M25 13 L31 11 M23 19 L27 25 M17 19 L13 25 M15 13 L9 11" fill="none" strokeWidth="1.1" /><path d="M14 30 L26 30 L28 36 L12 36 Z" /><rect x="10" y="36" width="20" height="7" rx="1" /></>;
      case 'chuteira': return <><path d="M7 14 L19 14 L21 20 Q30 20 34 24 Q36 28 32 29 L7 29 Q5 22 7 14 Z" /><path d="M10 29 L10 31 M15 29 L15 31 M22 29 L22 31 M28 29 L28 31" fill="none" strokeWidth="1.6" /><path d="M12 18 L18 18 M12 22 L20 22" fill="none" strokeWidth="1" /><rect x="9" y="34" width="22" height="9" rx="1" /></>;
      case 'the_best': return <><circle cx="20" cy="9" r="6" /><path d="M14 9 Q20 13 26 9 M20 3 Q23 9 20 15" fill="none" strokeWidth="1" /><path d="M15 16 Q20 18 25 16 L23 30 L17 30 Z" /><path d="M16 22 Q11 18 12 13 M24 22 Q29 18 28 13" fill="none" strokeWidth="2" /><rect x="12" y="31" width="16" height="4" /><rect x="10" y="35" width="20" height="8" rx="1" /></>;
      case 'golden_boy': return <><circle cx="20" cy="6" r="3.6" /><path d="M16 10 L24 10 L23 22 L21 22 L21 32 L19 32 L19 22 L17 22 Z" /><path d="M16 12 L10 6 M24 12 L30 6" fill="none" strokeWidth="2.2" strokeLinecap="round" /><circle cx="26" cy="31" r="3" /><rect x="11" y="34" width="18" height="9" rx="1" /></>;
      case 'cristal': return <><path d="M20 2 L30 14 L26 33 L14 33 L10 14 Z" /><path d="M10 14 L30 14 M20 2 L14 33 M20 2 L26 33" fill="none" strokeWidth="1" /><rect x="12" y="35" width="16" height="4" rx="1" /><rect x="9" y="39" width="22" height="5" rx="1" /></>;
      case 'escudo_tatico': return <><path d="M8 6 L32 6 L32 22 Q32 34 20 40 Q8 34 8 22 Z" /><circle cx="20" cy="22" r="6" fill="none" strokeWidth="1.4" /><path d="M20 13 L20 31 M11 22 L29 22" fill="none" strokeWidth="1.1" /><rect x="14" y="40" width="12" height="4" rx="1" /></>;
      case 'agulha': return <><path d="M20 1 L27 30 L13 30 Z" /><path d="M20 8 L20 26" fill="none" strokeWidth="1.2" /><rect x="10" y="30" width="20" height="4" rx="1" /><rect x="8" y="34" width="24" height="9" rx="1" /></>;
      case 'caixa': return <><path d="M8 18 Q8 9 20 9 Q32 9 32 18 Z" /><rect x="8" y="18" width="24" height="14" rx="1" /><rect x="17" y="20" width="6" height="6" fill="none" strokeWidth="1.4" /><rect x="8" y="36" width="24" height="7" rx="1" /></>;
      case 'hexagono': return <><polygon points="20,3 34,11 34,27 20,35 6,27 6,11" /><polygon points="20,10 27,14 27,24 20,28 13,24 13,14" fill="none" strokeWidth="1.2" /><rect x="12" y="36" width="16" height="7" rx="1" /></>;
      case 'carro': return <><circle cx="20" cy="7" r="4" /><path d="M5 29 L10 19 L28 19 L35 29 Z" /><circle cx="11" cy="33" r="4" /><circle cx="29" cy="33" r="4" /><rect x="10" y="38" width="20" height="4" rx="1" /></>;
      case 'controle': return <><path d="M9 14 L31 14 Q38 14 36 26 Q34 34 28 30 L24 26 L16 26 L12 30 Q6 34 4 26 Q2 14 9 14 Z" /><circle cx="13" cy="21" r="2" fill="none" strokeWidth="1.4" /><circle cx="27" cy="19" r="1.6" /><rect x="12" y="38" width="16" height="5" rx="1" /></>;
      case 'rolo': return <><circle cx="20" cy="14" r="11" /><circle cx="20" cy="14" r="4" fill="none" strokeWidth="1.4" /><rect x="12" y="27" width="16" height="10" rx="1" fill="none" strokeWidth="1.6" /><rect x="11" y="37" width="18" height="6" rx="1" /></>;
      case 'televisao': return <><path d="M14 4 L20 12 L26 4" fill="none" strokeWidth="1.6" /><rect x="6" y="12" width="28" height="20" rx="2" /><rect x="10" y="16" width="20" height="12" fill="none" strokeWidth="1.2" /><rect x="14" y="34" width="12" height="3" /><rect x="10" y="38" width="20" height="4" rx="1" /></>;
      case 'mascaras': return <><ellipse cx="14" cy="16" rx="9" ry="11" /><ellipse cx="26" cy="20" rx="9" ry="11" fill="none" strokeWidth="1.8" /><path d="M10 15 Q14 19 18 15 M22 19 Q26 23 30 19" fill="none" strokeWidth="1.3" /><rect x="11" y="34" width="18" height="8" rx="1" /></>;
      case 'claquete': return <><path d="M6 12 L34 8 L35 14 L7 18 Z" /><path d="M10 12 L13 10 M18 11 L21 9 M26 10 L29 8" fill="none" strokeWidth="1.6" /><rect x="6" y="19" width="28" height="18" rx="1" /><rect x="10" y="23" width="20" height="3" fill="none" strokeWidth="1" /><rect x="11" y="38" width="18" height="4" rx="1" /></>;
      case 'cesta': return <><rect x="6" y="4" width="28" height="18" rx="2" /><ellipse cx="20" cy="26" rx="8" ry="2.5" fill="none" strokeWidth="2" /><path d="M13 27 L15 36 M20 28.5 L20 36 M27 27 L25 36" fill="none" strokeWidth="1" /><rect x="17" y="36" width="6" height="7" /></>;
      case 'rede': return <><circle cx="20" cy="9" r="6" /><path d="M4 20 H36 M10 16 V28 M20 16 V28 M30 16 V28" fill="none" strokeWidth="1" /><path d="M4 16 H36 M4 24 H36" fill="none" strokeWidth="1.6" /><rect x="12" y="32" width="16" height="5" rx="1" /><rect x="10" y="37" width="20" height="6" rx="1" /></>;
      case 'raquete': return <><ellipse cx="20" cy="14" rx="9" ry="11" /><path d="M13 8 L27 20 M27 8 L13 20" fill="none" strokeWidth="0.8" /><path d="M20 25 L20 35" fill="none" strokeWidth="2.5" /><rect x="14" y="35" width="12" height="4" rx="1" /><rect x="11" y="39" width="18" height="5" rx="1" /></>;
      case 'tocha': return <><path d="M20 2 Q27 12 22 18 Q30 16 26 26 L14 26 Q10 16 18 12 Q16 8 20 2 Z" /><rect x="15" y="26" width="10" height="13" rx="1" /><rect x="11" y="39" width="18" height="4" rx="1" /></>;
      case 'onda': return <><path d="M6 8 Q11 4 16 8 T26 8 T36 8 L34 20 Q20 30 6 20 Z" /><path d="M6 14 Q11 10 16 14 T26 14 T36 14" fill="none" strokeWidth="1" /><rect x="16" y="30" width="8" height="8" /><rect x="11" y="38" width="18" height="5" rx="1" /></>;
      case 'cinturao': return <><path d="M4 16 L36 16 L36 26 L4 26 Z" /><rect x="15" y="13" width="10" height="16" rx="1" fill="none" strokeWidth="1.6" /><path d="M10 6 L20 12 L30 6" fill="none" strokeWidth="2" /><rect x="12" y="34" width="16" height="7" rx="1" /></>;
      case 'cruz': return <><path d="M16 4 L24 4 L24 14 L34 14 L34 22 L24 22 L24 32 L16 32 L16 22 L6 22 L6 14 L16 14 Z" /><rect x="11" y="34" width="18" height="4" rx="1" /><rect x="9" y="38" width="22" height="5" rx="1" /></>;
      case 'livro': return <><path d="M4 12 Q12 8 20 12 Q28 8 36 12 L36 32 Q28 28 20 32 Q12 28 4 32 Z" /><path d="M20 12 L20 32" fill="none" strokeWidth="1" /><path d="M26 30 L26 40 L28 37 L30 40 L30 30" /><rect x="10" y="38" width="20" height="5" rx="1" /></>;
      case 'atomo': return <><circle cx="20" cy="18" r="3.5" /><ellipse cx="20" cy="18" rx="14" ry="5" fill="none" strokeWidth="1.6" /><ellipse cx="20" cy="18" rx="14" ry="5" fill="none" strokeWidth="1.6" transform="rotate(60 20 18)" /><ellipse cx="20" cy="18" rx="14" ry="5" fill="none" strokeWidth="1.6" transform="rotate(-60 20 18)" /><rect x="12" y="36" width="16" height="6" rx="1" /></>;
      case 'obelisco': return <><path d="M16 4 L24 4 L26 34 L14 34 Z" /><rect x="11" y="34" width="18" height="4" rx="1" /><rect x="8" y="38" width="24" height="5" rx="1" /></>;
      case 'balanca': return <><path d="M20 4 L20 30" fill="none" strokeWidth="2" /><path d="M6 12 L34 12" fill="none" strokeWidth="2" /><path d="M6 12 L2 24 Q6 28 10 24 Z" /><path d="M34 12 L30 24 Q34 28 38 24 Z" /><rect x="14" y="30" width="12" height="4" rx="1" /><rect x="11" y="36" width="18" height="7" rx="1" /></>;
      case 'seta': return <><path d="M4 34 L14 22 L21 28 L34 12" fill="none" strokeWidth="3.2" /><path d="M26 10 L36 10 L36 20 Z" /><rect x="10" y="36" width="20" height="7" rx="1" /></>;
      case 'pena': return <><path d="M30 4 Q18 10 14 28 L12 36 L16 30 Q24 22 32 8 Z" /><path d="M12 36 L8 42" fill="none" strokeWidth="1.4" /><rect x="11" y="38" width="18" height="5" rx="1" /></>;
      case 'paleta': return <><path d="M20 6 Q36 6 36 20 Q36 30 26 28 Q22 27 22 32 Q22 38 14 38 Q4 38 4 26 Q4 6 20 6 Z" /><circle cx="12" cy="18" r="2.5" fill="none" strokeWidth="1" /><circle cx="20" cy="13" r="2.5" fill="none" strokeWidth="1" /><circle cx="28" cy="16" r="2.5" fill="none" strokeWidth="1" /></>;
      case 'laurea': return <><path d="M8 10 Q2 22 10 32 M32 10 Q38 22 30 32" fill="none" strokeWidth="2.4" /><rect x="12" y="8" width="16" height="10" rx="1" /><path d="M14 13 L26 13 M14 15.5 L24 15.5" fill="none" strokeWidth="0.9" /><rect x="11" y="36" width="18" height="6" rx="1" /></>;
      case 'banco': return <><path d="M10 6 L30 6 L28 22 Q20 28 12 22 Z" /><path d="M14 12 L26 12" fill="none" strokeWidth="1.4" /><rect x="17" y="26" width="6" height="9" /><rect x="11" y="35" width="18" height="8" rx="1" /></>;
    }
  })();
  // VIDA 36: a faixa da base é a cor da competição, e a sigla fica gravada nela (a marca que separa um título do outro).
  const faixa = marca ? <><rect x="9" y="41" width="22" height="4" rx="1" fill={marca.cor} stroke="none" /><text x="20" y="44.2" fontSize="3.2" textAnchor="middle" fill="#fff" stroke="none" fontFamily="sans-serif" fontWeight="700">{marca.sigla}</text></> : null;
  return <svg className={`trofeu trofeu--${metal}`} data-forma={forma} data-cor={marca?.cor} viewBox="0 0 40 46" role="img" aria-label={rotulo}>{corpo}{faixa}</svg>;
}

export interface ItemDaGaleria { id: string; forma: Forma; metal: 'ouro' | 'prata' | 'bronze'; nome: string; ano: number; onde?: string; papel?: string; tipo: 'coletivo' | 'individual' | 'tecnico' | 'arte' | 'esports' | 'carreira'; alcance?: 'local' | 'nacional' | 'internacional'; marca?: { cor: string; sigla: string } }

/** O que a galeria mostra (só o que foi registrado de verdade). */
export function itensDaGaleria(v: Vida): ItemDaGaleria[] {
  const out: ItemDaGaleria[] = [];
  for (const c of v.caminhos.palmares ?? []) {
    // HOTFIX 11.5.1: os títulos pela seleção (Copa do Mundo, Copa América, Eurocopa...) também são troféus — antes, a
    // galeria só lia títulos de clube, e o campeão do mundo não via a taça.
    if (c.tipo === 'selecao' && c.competicaoId && /^Campe(ão|ã)/.test(c.texto)) {
      out.push({ id: c.trofeuId ?? `sel:${c.competicaoId}:${c.ano}`, forma: formaDoTrofeu({ ...c, tipo: 'titulo' }), metal: 'ouro', marca: { cor: COR_PADRAO, sigla: siglaDe(c.competicao) }, nome: c.competicao.replace(/^(o|a|os|as) /, '').replace(/^./, x => x.toUpperCase()), ano: c.ano, onde: 'pela seleção', papel: c.papel === 'protagonista' ? 'titular' : c.papel === 'elenco' ? 'no grupo' : undefined, tipo: 'coletivo' });
      continue;
    }
    if (c.tipo !== 'titulo' && c.tipo !== 'premio' && c.tipo !== 'acesso' && c.tipo !== 'final') continue;
    out.push({ id: c.trofeuId ?? `${c.tipo}:${c.competicao}:${c.ano}:${c.texto}`, forma: formaDoTrofeu(c), marca: { cor: (c.modalidade && COR_DA_MODALIDADE[c.modalidade]) || COR_PADRAO, sigla: siglaDe(c.competicao) }, metal: c.tipo === 'final' ? 'prata' : c.tipo === 'premio' ? (c.competicaoId?.startsWith('premio:') ? 'ouro' : 'bronze') : 'ouro', nome: c.tipo === 'premio' ? c.texto : c.tipo === 'final' ? `Final: ${c.competicao}` : c.tipo === 'acesso' ? c.texto : c.competicao, ano: c.ano, onde: c.clube, papel: c.papel === 'protagonista' ? 'protagonista' : c.papel === 'elenco' ? 'no elenco' : undefined, tipo: c.tipo === 'premio' ? 'individual' : 'coletivo' });
  }
  out.push(...trofeusDoTecnico(v));
  // VIDA 36: as honras de outras carreiras (saúde, educação, jurídico, finanças, engenharia...) e os prêmios da pesquisa.
  for (const x of v.conquistas14?.reconhecimentos ?? []) if (x.tipo === 'premio') out.push({ id: `rec:${x.t}:${x.texto}`, forma: formaDoPremioDeArea(x.area), metal: x.peso === 2 ? 'ouro' : 'prata', nome: x.texto, ano: anoDe(x.t), tipo: 'carreira', marca: { cor: COR_DA_AREA[x.area ?? ''] ?? COR_PADRAO, sigla: siglaDe(x.texto) } });
  for (const x of v.caminhos.academia?.producao ?? []) if (x.tipo === 'premio') out.push({ id: `acad:${x.t}:${x.titulo}`, forma: 'laurea', metal: 'ouro', nome: x.titulo, ano: anoDe(x.t), onde: x.detalhe, tipo: 'carreira', marca: { cor: '#5a4a8a', sigla: siglaDe(x.titulo) } });
  // VIDA 36: os e-sports (cada jogo, a sua forma; a hierarquia pelo tipo da competição: torneio comum, liga especial, mundial histórico).
  for (const t of v.esports25?.temporadas ?? []) for (const c of t.competicoes) if (c.titulo) {
    const alcance = c.tipo === 'mundial' ? 'internacional' : c.tipo === 'liga' ? 'nacional' : 'local';
    out.push({ id: `esp:${t.jogo}:${t.ano}:${c.nome}`, forma: formaDoTituloEsports(t.jogo), metal: 'ouro', nome: c.nome, ano: t.ano, onde: t.equipe, papel: t.papel === 'titular' ? 'titular' : undefined, tipo: 'esports', alcance, marca: { cor: COR_DO_JOGO[t.jogo] ?? COR_PADRAO, sigla: siglaDe(c.nome) } });
  }
  for (const x of v.caminhos.curriculo ?? []) if (x.premio?.venceu) out.push({ id: `cv:${x.t}:${x.titulo}`, forma: formaDoPremioDeObra(x.tipo), metal: 'ouro', alcance: x.premio.alcance, nome: `${x.premio.nome}${x.premio.categoria ? ` · ${x.premio.categoria}` : ''}`, ano: x.premio.edicao ?? anoDe(x.t), onde: `"${x.titulo}"`, papel: x.papel, tipo: 'arte', marca: { cor: COR_DA_OBRA[x.tipo] ?? COR_PADRAO, sigla: siglaDe(x.premio.nome) } });
  for (const o of v.caminhos.obras ?? []) if (o.premio?.venceu) out.push({ id: `obra:${o.t}:${o.titulo}`, forma: o.linguagem === 'musica' ? 'disco' : formaDoPremioDeObra(o.linguagem), metal: 'ouro', alcance: o.premio.alcance, nome: o.premio.nome, ano: anoDe(o.t), onde: `"${o.titulo}"`, tipo: 'arte', marca: { cor: COR_DA_OBRA[o.linguagem] ?? COR_PADRAO, sigla: siglaDe(o.premio.nome) } });
  return out.sort((a, b) => b.ano - a.ano);
}

const GRUPO: Record<ItemDaGaleria['tipo'], string> = { coletivo: 'Títulos e campanhas', individual: 'Prêmios individuais', tecnico: 'Como técnico', arte: 'Prêmios artísticos', esports: 'E-sports', carreira: 'Honras da carreira' };

export function GaleriaDeConquistas({ vida }: { vida: Vida }) {
  const itens = itensDaGaleria(vida);
  if (!itens.length) return null;
  const grupos = (['esports', 'coletivo', 'individual', 'tecnico', 'arte', 'carreira'] as const).map(g => ({ g, xs: itens.filter(i => i.tipo === g) })).filter(x => x.xs.length);
  return (
    <section className="galeria" aria-labelledby="titulo-galeria">
      <h2 id="titulo-galeria" className="secao-fio">A galeria</h2>
      {grupos.map(({ g, xs }) => (
        <div key={g} className="galeria__grupo">
          <h3 className="galeria__titulo">{GRUPO[g]} <span className="galeria__conta">{xs.length}</span></h3>
          <ul className="galeria__estante">
            {xs.map(i => (
              <li key={i.id} className="galeria__item">
                <Trofeu forma={i.forma} metal={i.metal} rotulo={`${i.nome} (${i.ano})`} marca={i.marca} />
                <p className="galeria__nome">{i.nome}</p>
                <p className="galeria__meta">{i.ano}{i.onde ? ` · ${i.onde}` : ''}{i.papel ? ` · ${i.papel}` : ''}{i.alcance ? ` · ${i.alcance} (${SELO_DO_ALCANCE[i.alcance]})` : ''}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
