/**
 * VIDA 25 · a ficha do atleta nas modalidades tradicionais: os atributos que a posição (futebol), a função (basquete) ou
 * a modalidade (vôlei, futsal, tênis, natação, atletismo, luta) usam, lidos do motor (`perfilDeAtributos`), comparados
 * com a fotografia do fim do ano anterior (`CarreiraEsportiva.serieAtributos`) e agrupados em técnicos, físicos e táticos.
 */
import type { CarreiraEsportiva, Vida } from '../../../motor/tipos';
import { GRUPO_DO_ATRIBUTO, NOME_ATRIBUTO, perfilDeAtributos, SOBRE_ATRIBUTO, type AtributoId } from '../../../motor/sistemas/atributosEsportivos';
import { habilidade } from '../../../motor/sistemas/frentes';
import { funcaoBasquete } from '../../../motor/sistemas/modalidades';
import { posicaoDe, posicaoSugerida } from '../../../motor/sistemas/esporte';
import { FichaDeAtleta25, type LinhaFicha25 } from './FichaDeAtleta25';

const GRUPOS = [{ id: 'tecnico', nome: 'Técnicos' }, { id: 'fisico', nome: 'Físicos' }, { id: 'tatico', nome: 'Táticos' }];

export function linhasDoEsporte25(vida: Vida, e: CarreiraEsportiva): { linhas: LinhaFicha25[]; tecnica: number; serieTecnica: number[]; fortes: string[]; fracos: string[] } {
  const h = habilidade(vida, e.modalidade);
  const pos = e.modalidade === 'futebol' ? (e.fase === 'base' ? (e.posicao ?? posicaoSugerida(vida)) : posicaoDe(vida, e)) : undefined;
  const perfil = perfilDeAtributos(vida, e, h, pos, e.modalidade === 'basquete' ? funcaoBasquete(vida) : undefined);
  const serie = e.serieAtributos ?? [];
  // A última fotografia é a do ano que acabou de fechar (o "agora" saiu dela); o "antes" é a do ano anterior a ele.
  const anterior = serie.length >= 2 ? serie[serie.length - 2] : undefined;
  const linhas: LinhaFicha25[] = perfil.map(p => ({
    id: p.id, nome: NOME_ATRIBUTO[p.id], grupo: GRUPO_DO_ATRIBUTO[p.id], valor: p.valor, peso: p.peso, sobre: SOBRE_ATRIBUTO[p.id],
    antes: anterior?.a[p.id], serie: serie.map(x => x.a[p.id]).filter((x): x is number => typeof x === 'number')
  }));
  const ordenados = [...perfil].map(p => ({ id: p.id as AtributoId, d: (p.valor - h) * p.peso }));
  return {
    linhas, tecnica: h, serieTecnica: serie.map(x => x.tecnica),
    fortes: ordenados.filter(x => x.d >= 0.4).sort((a, b) => b.d - a.d).slice(0, 2).map(x => x.id),
    fracos: ordenados.filter(x => x.d <= -0.4).sort((a, b) => a.d - b.d).slice(0, 2).map(x => x.id)
  };
}

export function FichaDoEsporte25({ vida, e }: { vida: Vida; e: CarreiraEsportiva }) {
  const l = linhasDoEsporte25(vida, e);
  if (!l.linhas.length) return null;
  return (
    <FichaDeAtleta25 titulo={e.fase === 'base' ? 'Atributos na formação' : 'Atributos do atleta'} nivel={l.tecnica} nivelRotulo="técnica" nivelSerie={l.serieTecnica}
      grupos={GRUPOS} linhas={l.linhas} fortes={l.fortes} fracos={l.fracos}
      rodape={e.modalidade === 'futebol' ? 'Os atributos são os da posição: pesam na nota da temporada e no que ela produz (gols, assistências, desarmes, defesas). O treino extra da função sobe os dela; depois do auge, o corpo perde e a leitura de jogo ganha.' : 'Os atributos pesam na nota da temporada (o peso de cada um aparece ao lado do nome). O treino extra sobe os da modalidade; depois do auge, os do corpo caem e os da leitura sobem.'} />
  );
}
