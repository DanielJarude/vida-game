/**
 * As matérias da escola, pelo lugar onde se estuda (FIX pós-playtest humano).
 *
 * O playtest viu, numa vida no Japão: "A professora de português, Asuka…". Não era uma frase: eram SEIS tabelas de
 * matérias espalhadas pelo motor (o professor que repara, os verbos do ano letivo, os momentos da escola, o evento do
 * professor marcante, as frentes, a prova do concurso), cada uma com "português" fixo. Esta é a fonte única: a língua
 * da escola é a língua do país onde se ESTUDA (a residência — `paisCorrente`, o mesmo contexto da moeda), não a da
 * família nem a do país onde se nasceu. Português fora do Brasil só onde é a língua da escola (Portugal, Angola,
 * Moçambique…) — ou por motivo próprio (um curso de língua, que é atividade, não matéria).
 */
import { paisCorrente } from './moeda';
import { perfilDoPais, temPerfil } from './registro';

/** A língua em que a escola ensina (a primeira língua oficial do país onde se mora). */
export function linguaDaEscola(pais = paisCorrente()): string {
  return temPerfil(pais) ? perfilDoPais(pais).idiomas[0] : 'a língua da escola';
}

/** A língua estrangeira da escola: inglês — a não ser onde o inglês já é a língua da escola. */
export function linguaEstrangeiraDaEscola(pais = paisCorrente()): string {
  if (linguaDaEscola(pais) !== 'inglês') return 'inglês';
  return pais === 'US' ? 'espanhol' : pais === 'AU' || pais === 'NZ' ? 'japonês' : 'francês';
}

/**
 * O nome de uma matéria (por frente). `forma`: 'curta' (matemática, japonês), 'aula' (o nome da disciplina que o
 * aluno diria — "português e redação" no Brasil, onde a redação é matéria; noutros lugares, a língua).
 */
export function nomeDaMateria(frente: string, forma: 'curta' | 'aula' | 'escrita' = 'curta', pais = paisCorrente()): string {
  switch (frente) {
    case 'exatas': return 'matemática';
    case 'ciencias': return 'ciências';
    case 'humanas': return 'história';
    case 'idiomas': return linguaEstrangeiraDaEscola(pais);
    case 'linguagens': {
      const l = linguaDaEscola(pais);
      if (pais === 'BR') return forma === 'aula' ? 'português e redação' : forma === 'escrita' ? 'redação' : 'português';
      return forma === 'escrita' ? `${l} (as redações)` : l;
    }
    default: return frente;
  }
}

/** Matérias de que um professor marcante pode ser (para o evento do professor): as universais + a língua da escola. */
export function materiasDoProfessor(pais = paisCorrente()): { nome: string; frente: string }[] {
  return [
    { nome: 'História', frente: 'humanas' }, { nome: 'Matemática', frente: 'exatas' },
    { nome: cap(nomeDaMateria('linguagens', 'curta', pais)), frente: 'linguagens' },
    { nome: 'Biologia', frente: 'ciencias' }, { nome: 'Química', frente: 'ciencias' }, { nome: 'Artes', frente: 'desenho' }
  ];
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
