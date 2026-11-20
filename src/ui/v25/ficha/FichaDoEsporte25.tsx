/**
 * VIDA 25 · a ficha do atleta nas modalidades tradicionais: os atributos que a posição (futebol), a função (basquete) ou
 * a modalidade (vôlei, futsal, tênis, natação, atletismo, luta) usam, lidos do motor (`perfilDeAtributos`), comparados
 * com a fotografia do fim do ano anterior (`CarreiraEsportiva.serieAtributos`) e agrupados em técnicos, físicos e táticos.
 */
import { Perfil28 } from '../../v28/Perfil28';
import type { CarreiraEsportiva, Vida } from '../../../motor/tipos';
import { CORPO_DO_ATRIBUTO, deficienciasGraves, GRUPO_DO_ATRIBUTO, MENTE_DO_ATRIBUTO, NOME_ATRIBUTO, nivelNaPosicao, perfilDeAtributos, SOBRE_ATRIBUTO } from '../../../motor/sistemas/atributosEsportivos';
import { NOME_CAPACIDADE26 } from '../../../motor/v26/corpo/capacidades26';
import { habilidade } from '../../../motor/sistemas/frentes';
import { funcaoBasquete } from '../../../motor/sistemas/modalidades';
import { posicaoDe, posicaoSugerida } from '../../../motor/sistemas/esporte';
import { FichaDeAtleta25, type LinhaFicha25 } from './FichaDeAtleta25';

const GRUPOS = [{ id: 'tecnico', nome: 'Técnicos' }, { id: 'tatico', nome: 'Táticos' }, { id: 'fisico', nome: 'Físicos' }, { id: 'mental', nome: 'Mentais e comportamentais' }];
const TRACO: Record<string, string> = { disciplina: 'disciplina', impulsividade: 'impulsividade', coragem: 'coragem', sociabilidade: 'sociabilidade', independencia: 'independência', empatia: 'empatia', generosidade: 'generosidade' };
/** VIDA 26: de onde vem cada valor (o motor: técnica + corpo, técnica + jeito de ser, técnica − a pouca idade). */
function fonteDe(id: keyof typeof GRUPO_DO_ATRIBUTO): string | undefined {
  const corpo = CORPO_DO_ATRIBUTO[id];
  if (corpo) return `Vem da técnica e do corpo: ${corpo.map(([c]) => NOME_CAPACIDADE26[c].toLowerCase()).join(', ')} (constituição, músculo, gordura, condicionamento e idade).`;
  const mente = MENTE_DO_ATRIBUTO[id];
  if (mente) return `Vem da técnica e do jeito de ser (${mente.map(([t]) => TRACO[t] ?? t).join(', ')}), da cabeça no momento e da maturidade — idade e anos competindo.`;
  if (GRUPO_DO_ATRIBUTO[id] === 'tatico') return 'Leitura de jogo: vem da técnica e da experiência; os muito novos ainda não a têm inteira.';
  return undefined;
}

export function linhasDoEsporte25(vida: Vida, e: CarreiraEsportiva): { linhas: LinhaFicha25[]; tecnica: number; nivel: number; serieTecnica: number[]; fortes: string[]; fracos: string[] } {
  const h = habilidade(vida, e.modalidade);
  const pos = e.modalidade === 'futebol' ? (e.fase === 'base' ? (e.posicao ?? posicaoSugerida(vida)) : posicaoDe(vida, e)) : undefined;
  const perfil = perfilDeAtributos(vida, e, h, pos, e.modalidade === 'basquete' ? funcaoBasquete(vida) : undefined);
  const serie = e.serieAtributos ?? [];
  // A última fotografia é a do ano que acabou de fechar (o "agora" saiu dela); o "antes" é a do ano anterior a ele.
  const anterior = serie.length >= 2 ? serie[serie.length - 2] : undefined;
  const graves = new Set(deficienciasGraves(perfil).map(x => x.id));
  const linhas: LinhaFicha25[] = perfil.map(p => ({
    id: p.id, nome: NOME_ATRIBUTO[p.id], grupo: GRUPO_DO_ATRIBUTO[p.id], valor: p.valor, peso: p.peso, sobre: SOBRE_ATRIBUTO[p.id],
    antes: anterior?.a[p.id], serie: serie.map(x => x.a[p.id]).filter((x): x is number => typeof x === 'number'), fonte: fonteDe(p.id), grave: graves.has(p.id)
  }));
  // Fortes e limitações em relação ao NÍVEL NA POSIÇÃO (o que a função pesa), não à técnica sozinha.
  const nivel = nivelNaPosicao(perfil);
  const ordenados = perfil.map(p => ({ id: p.id, d: (p.valor - nivel) * (0.4 + p.peso * 4) }));
  return {
    linhas, tecnica: h, nivel,
    // A série do nível: só as fotografias que têm todos os atributos de agora (as de antes da VIDA 26 não têm — não se inventa).
    serieTecnica: serie.filter(f => perfil.every(p => typeof f.a[p.id] === 'number')).map(f => nivelNaPosicao(perfil.map(p => ({ valor: f.a[p.id]!, peso: p.peso })))),
    fortes: ordenados.filter(x => x.d >= 3).sort((a, b) => b.d - a.d).slice(0, 3).map(x => x.id),
    fracos: [...new Set([...graves, ...ordenados.filter(x => x.d <= -3).sort((a, b) => a.d - b.d).map(x => x.id)])].slice(0, 3)
  };
}

export function FichaDoEsporte25({ vida, e }: { vida: Vida; e: CarreiraEsportiva }) {
  const l = linhasDoEsporte25(vida, e);
  if (!l.linhas.length) return null;
  return (
    <>
    <FichaDeAtleta25 titulo={e.fase === 'base' ? 'Atributos na formação' : 'Atributos do atleta'} nivel={l.nivel} nivelRotulo={e.modalidade === 'futebol' ? 'nível na posição' : 'nível na função'} nivelSerie={l.serieTecnica}
      explica={`O nível é a média dos atributos, pesada pelo que a ${e.modalidade === 'futebol' ? 'posição' : 'função'} exige. A técnica (${Math.round(l.tecnica)}) é a base dos técnicos e táticos; os físicos somam o corpo de agora, os mentais o jeito de ser e a maturidade. Uma limitação séria num atributo que pesa cobra a mais na nota — a média alta não a esconde.`}
      grupos={GRUPOS} linhas={l.linhas} fortes={l.fortes} fracos={l.fracos}
      rodape={e.modalidade === 'futebol' ? 'Os atributos são os da posição: pesam na nota da temporada e no que ela produz (gols, assistências, desarmes, defesas). O treino extra (técnico, tático, físico) sobe os três do grupo que mais pesam; depois do auge, o corpo perde e a leitura de jogo ganha.' : 'Os atributos pesam na nota da temporada (o peso de cada um aparece ao lado do nome). O treino extra sobe os do grupo treinado; depois do auge, os do corpo caem e os da leitura sobem.'} />
      {e.fase === 'profissional' && <Perfil28 perfil={e.perfil28} genero={vida.eu.genero} modalidade={e.modalidade} />}
    </>
  );
}
