/**
 * VIDA 26 — DEPOIS DE COMPETIR. Toda carreira esportiva e de e-sports tem para onde ir quando a competição acaba — e o
 * que se alcança depende da trajetória real: os anos, o nível a que se chegou, os títulos, o nome (a reputação), a
 * posição (o goleiro treina goleiros), a formação (preparador físico pede Educação Física) e a idade de cada cargo.
 * Uma carreira sem títulos não fecha tudo: a escolinha, a aula e a análise ficam ao alcance de quem jogou de verdade.
 *
 * As profissões são as do catálogo único (`dados/ocupacoes`, `v26/dados/ocupacoes26`): salário, rotina, escada de
 * promoção, estresse e histórico de qualquer emprego. Duas portas:
 *   1. no ano seguinte ao fim da carreira, o mundo LIGA (até dois convites, pelo nome e pelo acaso de cada porta);
 *   2. a qualquer momento depois, a pessoa PROCURA (ação `pos26`): uma tentativa por porta por ano, com a chance que a
 *      trajetória dá — a tela mostra a porta, o que pesa e o motivo quando está fechada.
 * A carreira encerrada fica como estava (histórico, palmarés, legado): nada aqui reabre ou reescreve a competição.
 */
import type { CarreiraEsportiva, Dominio, Vida } from '../../tipos';
import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import { escrever, idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { ocupacao, ocupacaoOuNula } from '../../dados/ocupacoes';
import { contratar, elegibilidade, nomeOcupacao } from '../../sistemas/trabalho';
import { novaOportunidade } from '../../sistemas/oportunidades';
import { marcar } from '../../sistemas/marcas';
import { carreirasEsportivas, NOME_MOD } from '../../sistemas/esporte';
import { podeTentar, bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';

export type OrigemPos26 = Dominio | 'esports' | 'automobilismo';

/** As portas de cada modalidade e dos e-sports (a ordem é a da tela). Não são as mesmas para todos: cada esporte tem as suas. */
export const POS_CARREIRA26: Partial<Record<OrigemPos26, string[]>> = {
  futebol: ['treinador_escolinha', 'auxiliar_tecnico', 'treinador_goleiros', 'analista_desempenho', 'comentarista_esportivo', 'gerente_esportivo', 'preparador_fisico'],
  futsal: ['treinador_escolinha', 'auxiliar_tecnico_futsal', 'analista_desempenho', 'comentarista_esportivo', 'gerente_esportivo', 'preparador_fisico'],
  basquete: ['auxiliar_tecnico_basquete', 'analista_desempenho', 'comentarista_esportivo', 'gerente_esportivo', 'preparador_fisico'],
  volei: ['auxiliar_tecnico_volei', 'analista_desempenho', 'comentarista_esportivo', 'gerente_esportivo', 'preparador_fisico'],
  tenis: ['professor_tenis', 'treinador_tenistas', 'comentarista_esportivo', 'preparador_fisico'],
  natacao: ['professor_natacao', 'auxiliar_tecnico_natacao', 'comentarista_esportivo', 'preparador_fisico', 'coordenador_academia'],
  atletismo: ['professor_atletismo', 'auxiliar_tecnico_atletismo', 'comentarista_esportivo', 'preparador_fisico'],
  lutas: ['instrutor_lutas', 'auxiliar_tecnico_lutas', 'comentarista_esportivo', 'preparador_fisico', 'coordenador_academia'],
  esports: ['analista_esports', 'caster_esports', 'criador_conteudo', 'tecnico_esports', 'gestor_esports'],
  automobilismo: ['instrutor_pilotagem', 'treinador_pilotos', 'comentarista_esportivo']
};

/** A trajetória que pesa (lida do que a carreira registrou). */
export interface Trajetoria26 {
  origem: OrigemPos26;
  /** O nome em palavras ("futebol", "Counter-Strike"). */
  nome: string;
  profissional: boolean;
  anos: number;
  /** O maior nível alcançado (esporte: 1–4; e-sports: 1–5). */
  nivelMax: number;
  titulos: number;
  reputacao: number;
  goleiro: boolean;
  capitao: boolean;
  fim: number;
}

function daCarreira(e: CarreiraEsportiva): Trajetoria26 {
  const ts = e.temporadas ?? [];
  const pro = ts.length > 0;
  return {
    origem: e.modalidade, nome: NOME_MOD[e.modalidade] ?? e.modalidade, profissional: pro,
    anos: Math.max(0, ((e.tFim ?? e.tInicio) - e.tInicio) / 12), nivelMax: pro ? Math.max(...ts.map(t => t.nivel)) : 0,
    titulos: ts.reduce((s, t) => s + (t.titulos ?? (t.colocacao === 1 ? 1 : 0)), 0), reputacao: e.reputacao ?? 0,
    goleiro: e.modalidade === 'futebol' && e.posicao === 'goleiro', capitao: !!e.capitao || ts.some(t => t.capitao), fim: e.tFim ?? e.tInicio
  };
}

/** As trajetórias encerradas desta vida (a mais recente de cada esporte; os e-sports). */
export function trajetoriasEncerradas26(v: Vida): Trajetoria26[] {
  const out = new Map<OrigemPos26, Trajetoria26>();
  for (const e of carreirasEsportivas(v)) if (e.fase === 'encerrada') {
    const t = daCarreira(e);
    const ant = out.get(t.origem);
    if (!ant || t.profissional || !ant.profissional) out.set(t.origem, t);
  }
  const x = v.esports25;
  if (x && x.fase === 'encerrada') {
    out.set('esports', {
      origem: 'esports', nome: 'e-sports', profissional: x.temporadas.some(t => t.nivel >= 3), anos: x.temporadas.length,
      nivelMax: x.temporadas.length ? Math.max(...x.temporadas.map(t => t.nivel)) : 0, titulos: x.totais.titulos, reputacao: x.reputacao,
      goleiro: false, capitao: x.funcao === 'igl', fim: x.fim ?? v.t
    });
  }
  const a = v.automobilismo20;
  if (a && a.fase === 'encerrada' && a.temporadas?.length) {
    // O degrau mais alto (1 kart … 5 Fórmula 1), na mesma escala dos e-sports.
    const DEGRAU: Record<string, number> = { kart: 1, entrada: 2, f4: 2, regional: 3, f3: 3, f2: 4, f1: 5 };
    out.set('automobilismo', {
      origem: 'automobilismo', nome: 'automobilismo', profissional: a.temporadas.some(t => DEGRAU[t.categoria] >= 3), anos: a.temporadas.length,
      nivelMax: Math.max(...a.temporadas.map(t => DEGRAU[t.categoria] ?? 1)), titulos: a.titulos ?? 0, reputacao: Math.min(100, (a.vitorias ?? 0) * 3 + (a.titulos ?? 0) * 10 + (a.podios ?? 0)),
      goleiro: false, capitao: false, fim: a.fim ?? v.t
    });
  }
  return [...out.values()].filter(t => POS_CARREIRA26[t.origem]);
}

/** A chance de uma porta (0–1) e o motivo quando está fechada — pela trajetória, não por uma barra só. */
export function chanceDaPorta26(v: Vida, t: Trajetoria26, id: string): { chance: number; motivo?: string } {
  const oc = ocupacaoOuNula(id);
  if (!oc) return { chance: 0, motivo: 'Não existe.' };
  const el = elegibilidade(v, oc, 'oportunidade');
  if (!podeTentar(el)) return { chance: 0, motivo: el.motivo ?? 'Fora do alcance agora.' };
  const rep = t.reputacao / 100;
  const sup = ['superior', 'pos', 'mestrado', 'doutorado'].includes(v.educacao.escolaridade);
  const pro = t.profissional;
  const so = (cond: boolean, motivo: string, chance: number) => (cond ? { chance: clamp(chance, 0.03, 0.9) } : { chance: 0, motivo });
  switch (id) {
    case 'treinador_escolinha': case 'professor_tenis': case 'professor_natacao': case 'professor_atletismo': case 'instrutor_lutas':
      // A aula e a escolinha: quem jogou de verdade (mesmo sem chegar ao profissional) ensina.
      return so(t.anos >= 2 || pro, 'Pede alguns anos de prática séria (a base, o amador ou o profissional).', (pro ? 0.65 : 0.4) + t.anos * 0.01);
    case 'treinador_goleiros':
      return so(t.goleiro && pro, 'É a porta de quem foi goleiro profissional.', 0.35 + t.nivelMax * 0.06 + rep * 0.3);
    case 'analista_desempenho':
      return so(pro || sup, 'Pede carreira profissional ou faculdade (a análise é vídeo e dados).', 0.2 + (sup ? 0.25 : 0) + t.anos * 0.01 + (pro ? 0.1 : 0));
    case 'comentarista_esportivo':
      return so(pro && (t.nivelMax >= 3 || t.reputacao >= 35), 'A mídia chama quem o público conhece: carreira na primeira ou segunda divisão, ou nome.', 0.06 + rep * 0.5 + (t.nivelMax >= 4 ? 0.12 : 0) + t.titulos * 0.02);
    case 'gerente_esportivo':
      return so(pro && t.anos >= 8 && t.reputacao >= 40, 'Pede uma carreira longa (8 anos ou mais) e nome no meio.', 0.08 + rep * 0.35 + (t.capitao ? 0.08 : 0) + (sup ? 0.08 : 0));
    case 'treinador_tenistas':
      return so(pro && t.nivelMax >= 2, 'Pede ter jogado o circuito internacional.', 0.25 + t.nivelMax * 0.08 + rep * 0.3);
    case 'analista_esports':
      return so(t.nivelMax >= 2, 'Pede ter competido de verdade (do cenário aberto para cima).', 0.3 + t.nivelMax * 0.07);
    case 'caster_esports':
      return so(t.nivelMax >= 2, 'Pede um nome no cenário (ter competido).', 0.12 + rep * 0.5 + t.nivelMax * 0.04);
    case 'criador_conteudo':
      return so(t.anos >= 1, 'Pede uma trajetória para contar.', 0.2 + rep * 0.5);
    case 'tecnico_esports':
      return so(t.nivelMax >= 3, 'Pede ter jogado numa equipe de segunda divisão ou acima.', 0.12 + t.nivelMax * 0.06 + rep * 0.25 + (t.capitao ? 0.12 : 0));
    case 'gestor_esports':
      return so(t.nivelMax >= 4 && t.anos >= 4, 'Pede carreira na elite (4 anos ou mais).', 0.08 + rep * 0.3);
    case 'instrutor_pilotagem':
      return so(t.anos >= 2, 'Pede algumas temporadas de corrida.', 0.45 + t.nivelMax * 0.06);
    case 'treinador_pilotos':
      return so(t.nivelMax >= 3, 'Pede ter corrido nas categorias de fórmula (F3 ou acima).', 0.2 + t.nivelMax * 0.08 + rep * 0.3);
    case 'preparador_fisico': case 'coordenador_academia':
      // A formação manda (Educação Física): a elegibilidade já cobrou; o passado de atleta abre a porta mais fácil.
      return { chance: clamp(0.35 + (pro ? 0.15 : 0), 0.03, 0.9) };
    default:
      // A comissão técnica do próprio esporte (auxiliar).
      if (oc.trilha === 'treino' && oc.nivel === 4) return so(pro, 'A comissão técnica chama quem foi atleta profissional (ou fez carreira de auxiliar).', 0.12 + t.nivelMax * 0.07 + rep * 0.3 + t.anos * 0.01 + (t.capitao ? 0.06 : 0));
      return { chance: 0.2 };
  }
}

export interface Porta26 { id: string; nome: string; chance: number; motivo?: string; tentou: boolean }
const chaveDaTentativa = (id: string) => `pos26_${id}`;
const tentouEsteAno = (v: Vida, id: string) => v.fatos[chaveDaTentativa(id)] !== undefined && anoDe(v.fatos[chaveDaTentativa(id)]) === anoDe(v.t);

/** As portas de cada trajetória encerrada, para a tela e para a ação. */
export function portasDoPosCarreira26(v: Vida): { trajetoria: Trajetoria26; portas: Porta26[] }[] {
  return trajetoriasEncerradas26(v).map(t => ({
    trajetoria: t,
    portas: (POS_CARREIRA26[t.origem] ?? []).filter(id => ocupacaoOuNula(id)).filter(id => id !== 'treinador_goleiros' || t.goleiro)
      .map(id => ({ id, nome: nomeOcupacao(v, ocupacao(id)), ...chanceDaPorta26(v, t, id), tentou: tentouEsteAno(v, id) }))
  }));
}

export const chanceEmPalavras26 = (c: number) => (c >= 0.6 ? 'boa chance' : c >= 0.35 ? 'chance razoável' : c >= 0.15 ? 'chance pequena' : 'chance remota');

/** A tentativa (a ação `pos26`): pode? */
export function disponibilidadePos26(v: Vida, ocupacaoId: string): Veredito {
  const achou = portasDoPosCarreira26(v).flatMap(x => x.portas.map(p => ({ ...p, t: x.trajetoria }))).find(p => p.id === ocupacaoId);
  if (!achou) return bloqueio('impossivel', 'Essa porta não é da sua trajetória.');
  if (v.trabalho.atual?.ocupacaoId === ocupacaoId) return bloqueio('impossivel', 'Você já está nisso.');
  if (achou.chance <= 0) return bloqueio('impossivel', achou.motivo ?? 'Fora do alcance agora.');
  if (achou.tentou) return bloqueio('impossivel', 'Você já procurou essa porta este ano.');
  return PERMITIDO;
}

/** Onde se trabalha (o texto do empregador). */
function empregadorDe(id: string, t: Trajetoria26): string {
  if (/comentarista/.test(id)) return id === 'comentarista_tv' ? 'uma emissora nacional' : 'uma rádio e um canal esportivo';
  if (/esports/.test(id)) return id === 'caster_esports' ? 'por conta própria (as transmissões)' : 'uma organização de e-sports';
  if (id === 'criador_conteudo') return 'por conta própria (as redes)';
  if (/professor|instrutor|escolinha|treinador_tenistas/.test(id)) return 'por conta própria (os alunos)';
  return t.origem === 'futebol' ? 'um clube' : 'uma equipe';
}

export function executarPos26(v: Vida, r: Rng, ocupacaoId: string): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const d = disponibilidadePos26(v, ocupacaoId);
  if (d.grau !== 'permitido') return { texto: d.motivo ?? 'Agora não.', tom: 'neutro' };
  const x = portasDoPosCarreira26(v).flatMap(y => y.portas.map(p => ({ ...p, t: y.trajetoria }))).find(p => p.id === ocupacaoId)!;
  v.fatos[chaveDaTentativa(ocupacaoId)] = v.t;
  if (!r.chance(x.chance)) return { texto: `Você mandou mensagem, ligou, foi conversar. ${x.chance >= 0.35 ? 'Desta vez não abriu — o retorno foi "mais para a frente".' : 'O retorno foi educado e curto: agora, não.'}`, tom: 'ruim' };
  contratarNaPorta(v, r, ocupacaoId, x.t, 'procurou');
  return { texto: `Deu certo: ${nomeOcupacao(v, ocupacao(ocupacaoId))}, ${empregadorDe(ocupacaoId, x.t)}.`, tom: 'bom' };
}

function contratarNaPorta(v: Vida, r: Rng, id: string, t: Trajetoria26, como: 'procurou' | 'convite'): void {
  const oc = ocupacao(id);
  const emp = contratar(v, r, oc, 'oportunidade');
  emp.empregador = empregadorDe(id, t);
  const texto = `Depois de competir no ${t.nome}, virou ${nomeOcupacao(v, oc)}${como === 'convite' ? ' (o convite veio pelo nome)' : ''}, aos ${idade(v)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  marcar(v, 'ingresso', texto, 2, { ocupacaoId: oc.id });
}

/**
 * O ano: no ano seguinte ao fim de uma carreira, o mundo liga — até dois convites, pelo acaso de cada porta (os
 * convites são oportunidades comuns: aceitar contrata, recusar deixa passar). Sorteio derivado: não mexe na vida.
 */
export function processarPosCarreira26(v: Vida): void {
  if (v.morte) return;
  for (const { trajetoria: t, portas } of portasDoPosCarreira26(v)) {
    if (v.t - t.fim > 12 || v.fatos[`pos26_convites_${t.origem}`] !== undefined) continue;
    v.fatos[`pos26_convites_${t.origem}`] = v.t;
    const r = rngDe(v.id, 'pos26', t.origem, anoDe(v.t));
    let n = 0;
    for (const p of [...portas].sort((a, b) => b.chance - a.chance)) {
      if (n >= 2 || p.chance <= 0 || !r.chance(p.chance * 0.6)) continue;
      const oc = ocupacao(p.id);
      const ok = novaOportunidade(v, { tipo: 'convite', ocupacaoId: oc.id, meses: 12, chave: `pos26_${p.id}`, titulo: `${p.nome.charAt(0).toUpperCase()}${p.nome.slice(1)}`, texto: textoDoConvite(p.id, t) });
      if (ok) n++;
    }
  }
}

function textoDoConvite(id: string, t: Trajetoria26): string {
  if (id === 'comentarista_esportivo') return `Uma rádio e um canal esportivo querem alguém que viveu o ${t.nome} por dentro para comentar os jogos.`;
  if (id === 'analista_desempenho') return 'Uma comissão técnica procura quem saiba ler o jogo no vídeo: o adversário, o próprio time, os números.';
  if (id === 'gerente_esportivo') return 'A diretoria de um clube quer um nome do meio para tocar o departamento: contratações, renovações, o vestiário.';
  if (id === 'analista_esports') return 'Uma organização quer alguém que conheça o cenário para estudar os adversários e montar os treinos.';
  if (id === 'tecnico_esports') return 'Uma equipe precisa de técnico: quem já jogou naquele nível e sabe conduzir um grupo.';
  if (id === 'caster_esports') return 'Os organizadores de um campeonato querem uma voz que conheça o jogo para as transmissões.';
  if (id === 'gestor_esports') return 'Uma organização quer montar uma equipe e procura quem conhece o cenário da elite.';
  if (id === 'criador_conteudo') return 'Uma plataforma de transmissão oferece contrato para quem tem público: a sua história no cenário vira conteúdo.';
  if (id === 'treinador_tenistas') return 'Um tenista jovem do circuito procura técnico com passado de circuito.';
  if (/professor|instrutor|escolinha/.test(id)) return 'Um clube do bairro quer abrir turmas com quem competiu de verdade.';
  return `Uma comissão técnica de ${t.nome} lembrou de você.`;
}
