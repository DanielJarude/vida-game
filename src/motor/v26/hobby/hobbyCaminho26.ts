/**
 * VIDA 26 — HOBBY, OUTROS CAMINHOS E PROFISSÃO. A mesma atividade da semana pode ser só gosto a vida inteira — ou o
 * começo de uma trajetória. Este módulo diz, para cada atividade, o que ela É (a natureza) e, quando há, para onde ela
 * PODE levar — com o próximo passo real e o que pesa, lidos do estado (idade, janela da peneira, tempo de prática,
 * frequência, técnica, o caminho em que já se está). Nada aqui obriga: é possibilidade, não sequência.
 *
 *   hobby      por gosto, curiosidade, bem-estar (a música, o desenho, o videogame, o futebol com os amigos);
 *   caminho    a atividade que já é parte de uma trajetória (o treino dos e-sports, a base);
 *   formacao   atividade da escola ou da faculdade (o grêmio, a monitoria, o cursinho);
 *   renda      dinheiro por fora — trabalho por conta, não hobby (os bicos, os freelas, as entregas);
 *   cuidado / social  a terapia, a família; a igreja, o voluntariado.
 *
 * E a ponte real do videogame aos e-sports: quem joga há anos pode ser chamado por um time amador (`processarHobbies26`)
 * — e começa direto no competitivo amador (`esports25.conviteAmador26`).
 */
import type { Dominio, Vida } from '../../tipos';
import { escrever, idade } from '../../nucleo';
import { rngDe } from '../../rng';
import { anoDe } from '../../tempo';
import { OCUPACOES } from '../../dados/ocupacoes';
import { etapaNaBase, IDADE_AMADOR, MODALIDADES, MODALIDADES_AMADORAS, NOME_MOD } from '../../sistemas/esporte';
import { janelaDaBase } from '../../sistemas/perseguir';
import { habilidade } from '../../sistemas/frentes';
import { nomeOcupacao } from '../../sistemas/trabalho';
import { conviteAmador26, podeComecar25 } from '../../v25/esports/esports25';
import { ESTILOS26 } from '../esporte/estilos26';

export type Natureza26 = 'hobby' | 'caminho' | 'formacao' | 'renda' | 'cuidado' | 'social';
export const NOME_NATUREZA26: Record<Natureza26, string> = { hobby: 'hobby', caminho: 'parte de um caminho', formacao: 'atividade de estudo', renda: 'dinheiro por fora', cuidado: 'cuidado', social: 'convívio' };

const DA_FORMACAO = new Set(['cursinho', 'estudar_concurso', 'reforco', 'olimpiada', 'projeto_escola', 'projeto_tecnico', 'iniciacao', 'monitoria', 'grupo_estudos', 'empresa_junior', 'time_escola', 'atletica', 'fanfarra', 'gremio', 'extensao', 'centro_academico']);

/** O que a atividade é (pela categoria do catálogo e pelo que ela faz no motor). */
export function naturezaDaAtividade26(id: string, categoria: string): Natureza26 {
  if (categoria === 'renda') return 'renda';
  if (id === 'esports') return 'caminho';
  if (DA_FORMACAO.has(id)) return 'formacao';
  if (categoria === 'cuidado' || id === 'terapia') return 'cuidado';
  if (categoria === 'social') return 'social';
  return 'hobby';
}

export interface Porta26 {
  /** A sequência possível (não obrigatória): o hobby → … → o depois. */
  sequencia: string[];
  /** O próximo passo real, agora. */
  passo: string;
  /** O que pesa, com os números desta vida. */
  pesa: string[];
  /** Já está nesse caminho. */
  dentro?: boolean;
}

const anosDe = (v: Vida, id: string) => { const r = v.rotinas.find(x => x.id === id); return r ? Math.max(0, (v.t - r.tInicio) / 12) : 0; };
const palavraAnos = (n: number) => (n < 1 ? 'menos de um ano' : `${Math.floor(n)} ${Math.floor(n) === 1 ? 'ano' : 'anos'}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function portaDoEsporte(v: Vida, d: Dominio): Porta26 {
  const i = idade(v);
  // VIDA 26.2: a luta pelo estilo escolhido ("Muay Thai por gosto").
  const nome = d === 'lutas' && v.lutas26?.estilo ? ESTILOS26[v.lutas26.estilo].nome : NOME_MOD[d] ?? d;
  const [ini, fim] = janelaDaBase(d);
  const r = v.rotinas.find(x => x.id === d);
  const es = v.caminhos.esporte;
  const dentro = es?.modalidade === d && es.fase !== 'encerrada';
  const etapa = dentro ? etapaNaBase(v) : 'fora';
  const pesa = [`prática: ${palavraAnos(anosDe(v, d))}${r && (r.nivel ?? 1) > 1 ? ', mais vezes por semana' : ', uma vez por semana'}`, `técnica ${Math.round(habilidade(v, d))}`];
  const passo = dentro ? (etapa === 'profissional' ? 'Você já é profissional: a carreira está em Caminhos · Trabalho.' : 'Você já está na formação (Caminhos · Outros caminhos).')
    : i < ini ? `A peneira abre por volta dos ${ini} anos. Até lá, o que conta é treinar mais vezes e com gosto — quem se destaca é chamado.`
      : i <= fim ? 'Pedir um teste num clube (Caminhos · Outros caminhos) — ou esperar a peneira, que chega para quem treina e se destaca.'
        : MODALIDADES_AMADORAS.includes(d) && i <= IDADE_AMADOR[1] ? `A idade das bases passou (até uns ${fim}); a porta que sobra é o amador: um teste num time adulto.`
          : 'A idade de competir passou: o esporte segue como hobby — e quem jogou a sério pode ensinar (escolinha, aulas).';
  return { sequencia: [`${cap(nome)} por gosto`, d === 'tenis' ? 'Circuito juvenil' : 'Formação esportiva', `${cap(nome)} profissional`, 'Depois de competir'], passo, pesa, dentro };
}

function portaDoVideogame(v: Vida): Porta26 {
  const e = v.esports25;
  const dentro = !!e && e.fase !== 'encerrada';
  const pode = podeComecar25(v);
  const anos = anosDe(v, 'videogame');
  const passo = dentro ? 'Você já está nos e-sports (Caminhos · Outros caminhos).'
    : pode.grau === 'permitido' ? `Levar a sério: Caminhos · Outros caminhos · E-sports.${conviteAmador26(v) ? ' Um time amador já chamou — você começaria no competitivo amador.' : ' Os anos de jogo contam no começo.'}`
      : pode.motivo ?? 'Agora não.';
  return { sequencia: ['Videogame por diversão', 'Competitivo amador', 'E-sports profissional', 'Depois de competir'], passo, pesa: [`jogando há ${palavraAnos(anos)}`, 'a cabeça (cognição) e a coragem contam no começo'], dentro };
}

const ARTE: Partial<Record<string, string>> = { musica: 'Banda', danca: 'Grupo de dança', teatro: 'Grupo de teatro' };
const NOME_ARTE26: Record<string, string> = { musica: 'Música', danca: 'Dança', teatro: 'Teatro' };

/** Para onde a atividade pode levar (ou nada: um hobby que é só hobby também é um bom destino). */
export function portaDoHobby26(v: Vida, id: string, pratica?: Partial<Record<Dominio, number>>): Porta26 | undefined {
  if (MODALIDADES.includes(id as Dominio)) return portaDoEsporte(v, id as Dominio);
  if (id === 'videogame') return portaDoVideogame(v);
  if (ARTE[id]) {
    const dentro = !!v.caminhos.arte?.ativo;
    return { sequencia: [`${NOME_ARTE26[id] ?? cap(id)} por gosto`, ARTE[id]!, 'Público e editais', 'Viver de arte'], passo: dentro ? `Você já está em ${v.caminhos.arte!.nome}.` : `Montar ${ARTE[id] === 'Banda' ? 'uma banda' : 'um grupo'} (Caminhos · Outros caminhos) quando a prática estiver firme.`, pesa: [`prática: ${palavraAnos(anosDe(v, id))}`, `técnica ${Math.round(habilidade(v, id as Dominio))}`], dentro };
  }
  // O hobby que é um ofício: as profissões que pedem a técnica que ele treina (o mesmo número que a vaga cobra).
  const d = pratica ? (Object.entries(pratica).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as Dominio | undefined) : undefined;
  if (!d) return undefined;
  const ocs = OCUPACOES.filter(o => o.habilidade?.dominio === d && !o.entrada && !o.concurso).sort((a, b) => (a.habilidade!.minimo - b.habilidade!.minimo)).slice(0, 2);
  if (!ocs.length) return undefined;
  const h = Math.round(habilidade(v, d));
  return {
    sequencia: [`${cap(NOME_MOD[d] ?? d)} por gosto`, 'Pegar o jeito', cap(nomeOcupacao(v, ocs[0]))],
    passo: ocs.map(o => `${cap(nomeOcupacao(v, o))} pede técnica ${o.habilidade!.minimo}${o.habilidade!.ouFormacao ? ' (ou o curso)' : ''}`).join('; ') + `; a sua: ${h}. As vagas estão em Caminhos · Trabalho.`,
    pesa: [`prática: ${palavraAnos(anosDe(v, id))}`, `técnica ${h}`]
  };
}

/**
 * O ano: o hobby que abre porta sozinho. Quem joga videogame há anos (12–24 anos de idade) pode ser chamado por um time
 * amador para um campeonato aberto — o fato dura dois anos e muda o começo nos e-sports. Sorteio derivado.
 */
export function processarHobbies26(v: Vida): void {
  const i = idade(v);
  if (v.morte || i < 12 || i > 24 || (v.esports25 && v.esports25.fase !== 'encerrada') || v.fatos['esports_convite26'] !== undefined) return;
  const anos = anosDe(v, 'videogame');
  if (anos < 2 || podeComecar25(v).grau !== 'permitido') return;
  const r = rngDe(v.id, 'hobby26_esports', anoDe(v.t));
  if (!r.chance(Math.min(0.25, 0.05 + anos * 0.025 + (v.mente.cognicao - 55) / 600))) return;
  v.fatos['esports_convite26'] = v.t;
  escrever(v, { texto: 'De tanto jogar online, um time amador chamou para um campeonato aberto: "joga com a gente?". Ainda é diversão — mas é a primeira vez que alguém de fora repara.', relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
}
