/**
 * Perseguir um caminho: as TENTATIVAS que o jogador pode pedir.
 *
 * "O VIDA não precisa oferecer tudo ao jogador; mas precisa deixar o
 * jogador perseguir uma intenção." Antes, algumas vidas só chegavam se o
 * mundo sorteasse a porta (a peneira aparecia para quem o treinador via; a
 * banda, para quem um amigo chamava; a bolsa de pós-doutorado, só para quem
 * estivesse sem trabalho). Aqui moram os pedidos que uma pessoa real faz:
 *
 *   pedir_teste     pedir um teste num clube (o da cidade, ou um grande)
 *   montar_grupo    chamar gente para uma banda, um grupo, uma companhia
 *   foco_concurso   dirigir o estudo para uma área de editais
 *   bolsa_pesquisa  candidatar-se a uma bolsa de pós-doutorado
 *
 * Pedir não é conseguir: o teste é a mesma peneira de duas etapas (com um
 * pouco menos de boa vontade de quem não foi indicado); o grupo começa sem
 * público; a bolsa é um edital disputado. E cada pedido tem ritmo (não dá
 * para pedir teste todo mês) e requisitos ditos antes.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, FocoConcurso, Vida } from '../tipos';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { escrever, idade } from '../nucleo';
import { habilidade } from './frentes';
import { MODALIDADES, NOME_MOD, nomeDeClube, ondeTreina } from './esporte';
import { capitalDoEstado } from './escola';
import { municipio } from '../dados/lugares';
import { doClube, noClube } from '../dados/clubes';
import { MODS, aceitarOportunidade, novaOportunidade } from './oportunidades';
import { criarProjeto } from './arte';
import { dirigirEstudo, NOME_FOCO } from './concurso';
import { semOcupacao } from './trabalho';
import { registrarDevolutiva } from './devolutivas';
import { marcar } from './marcas';
import { anoDe } from '../tempo';
import { propor } from './compromissos';
import { flex, ge } from '../texto';

export type OquePerseguir = 'pedir_teste' | 'montar_grupo' | 'mostrar_trabalho' | 'foco_concurso' | 'bolsa_pesquisa';
export type AcaoPerseguirCmd = { tipo: 'perseguir'; oque: OquePerseguir; valor?: string };

const FOCOS: FocoConcurso[] = ['policial', 'administrativo', 'fiscal', 'bancario', 'educacao', 'saude', 'academico'];
const LINGUAGENS: Dominio[] = ['musica', 'teatro', 'danca'];
/** A partir de que técnica alguém toca com outras pessoas (o mesmo limiar de quando o convite chega sozinho). */
const MINIMO_GRUPO: Partial<Record<Dominio, number>> = { musica: 40, teatro: 38, danca: 45 };

/* ------------------------------------------------------------ Esporte */

/** A janela de idade de uma base (a mesma em que a peneira chega sozinha, um ano mais larga para quem pede). */
export const janelaDaBase = (d: Dominio): [number, number] => (d === 'futebol' ? [11, 17] : [12, 19]);
/** Quantos testes numa modalidade (a vida inteira): quem pede também não vive de peneira. */
export const LIMITE_TESTES = 4;

/** A modalidade que se treina a sério (rotina em ritmo de treino). */
export function modalidadeSeria(v: Vida): Dominio | undefined {
  return v.rotinas.filter(r => MODALIDADES.includes(r.id as Dominio) && (r.nivel ?? 1) >= 2).sort((a, b) => (b.nivel ?? 1) - (a.nivel ?? 1) || habilidade(v, b.id as Dominio) - habilidade(v, a.id as Dominio))[0]?.id as Dominio | undefined;
}

function podePedirTeste(v: Vida, valor?: string): Veredito {
  const i = idade(v);
  const d = (valor && MODALIDADES.includes(valor as Dominio) ? valor : modalidadeSeria(v)) as Dominio | undefined;
  if (!d) return bloqueio('requisito', 'Um teste num clube pede treino a sério: a modalidade na semana, em ritmo de treino (Tempo livre).');
  const rot = v.rotinas.find(r => r.id === d);
  if (!rot || (rot.nivel ?? 1) < 2) return bloqueio('requisito', `Treinar ${NOME_MOD[d]} a sério (ritmo de treino) vem antes de pedir um teste.`);
  const es = v.caminhos.esporte;
  if (es && (es.fase === 'base' || es.fase === 'profissional')) return bloqueio('impossivel', 'Você já está num clube.');
  const [ini, fim] = janelaDaBase(d);
  if (i < ini) return bloqueio('requisito', `As bases de ${NOME_MOD[d]} testam a partir dos ${ini} anos.`);
  if (i > fim) return bloqueio('requisito', `A janela das bases de ${NOME_MOD[d]} vai até os ${fim} anos: depois disso, quase ninguém é chamado sem já ter carreira.`);
  if ((v.fatos[`peneiras_${d}`] ?? 0) >= LIMITE_TESTES) return bloqueio('incompativel', `Já foram ${LIMITE_TESTES} testes em ${NOME_MOD[d]}: os clubes da região já conhecem o seu jogo.`);
  // O próprio pedido tem o seu relógio (o atalho do "quase" vale para quem o clube chama, não para pedir de novo no mesmo mês).
  const pedido = v.fatos[`peneira_pedida_${d}`];
  if (pedido !== undefined && v.t - pedido < 12) return bloqueio('incompativel', `O último teste que você pediu foi em ${anoDe(pedido)}: os clubes pedem um ano entre uma tentativa e outra.`);
  const ultima = v.caminhos.ultimas[`peneira_${d}`];
  if (ultima !== undefined && v.t - ultima < 12) return bloqueio('incompativel', `O último teste foi em ${anoDe(ultima)}: os clubes pedem um ano entre uma tentativa e outra.`);
  if (v.trabalho.atual?.carga === 'integral') return bloqueio('incompativel', 'Com trabalho integral, não dá para treinar numa base.');
  if (habilidade(v, d) < 50) return bloqueio('requisito', `A técnica em ${NOME_MOD[d]} ainda está "começando": nenhum clube testa quem não joga nem no nível de escolinha. Treinar vem antes.`);
  if (v.caminhos.oportunidades.some(o => (o.tipo === 'peneira' || o.tipo === 'seletiva') && o.dominio === d)) return bloqueio('incompativel', 'Já há um teste marcado para você: está entre as portas abertas.');
  return PERMITIDO;
}

/** O lugar do teste pedido: o clube da cidade (ou o da região) ou um clube grande da capital, que exige mais. */
function lugarDoTeste(v: Vida, d: Dominio, grande: boolean): string {
  return grande ? capitalDoEstado(v.moradia.municipioId) : ondeTreina(v, d);
}

function pedirTeste(v: Vida, r: Rng, valor?: string): { texto?: string; decisao?: string } {
  const [modalidade, onde] = (valor ?? '').split(':');
  const d = (MODALIDADES.includes(modalidade as Dominio) ? modalidade : modalidadeSeria(v)) as Dominio;
  const grande = onde === 'grande';
  const lugar = lugarDoTeste(v, d, grande);
  const clube = nomeDeClube(lugar, `${v.id}:pedido:${idade(v)}:${grande ? 'g' : 'p'}`, d);
  v.fatos[`peneira_pedida_${d}`] = v.t;
  const op = novaOportunidade(v, {
    tipo: d === 'futebol' ? 'peneira' : 'seletiva', dominio: d, municipioId: lugar, meses: 12, chave: `peneira_${d}`,
    titulo: d === 'futebol' ? `Peneira ${noClube(clube)}` : `Seletiva ${noClube(clube)}`,
    texto: `Você pediu um teste ${doClube(clube)}${lugar !== v.moradia.municipioId ? `, em ${municipio(lugar).nome}` : ''}. Ninguém indicou: é o seu treino que vai falar.`,
    bonus: -0.03
  });
  if (!op) return { texto: 'Já há um teste marcado.' };
  void r;
  const res = aceitarOportunidade(v, r, op.id);
  const pr = v.caminhos.processo;
  if (pr?.tipo === 'peneira') { pr.via = 'pedido'; pr.bonus = -0.03; }
  return { decisao: res.decisao };
}

/* ------------------------------------------------------------ Arte */

function podeMontarGrupo(v: Vida, valor?: string): Veredito {
  const i = idade(v);
  if (i < 13) return bloqueio('requisito', 'Um grupo de verdade começa a partir dos 13.');
  const lista = valor ? [valor as Dominio] : LINGUAGENS;
  const d = lista.find(x => v.rotinas.some(r => r.id === x));
  if (!d || !LINGUAGENS.includes(d)) return bloqueio('requisito', 'Montar um grupo pede praticar música, teatro ou dança na semana (Tempo livre).');
  if (v.caminhos.arte?.ativo) return bloqueio('impossivel', `Você já tem ${v.caminhos.arte.nome}.`);
  if (habilidade(v, d) < (MINIMO_GRUPO[d] ?? 40)) return bloqueio('requisito', d === 'musica' ? 'Ainda falta tocar o bastante para segurar um ensaio com outras pessoas: mais prática primeiro.' : 'Ainda falta prática para segurar um ensaio com outras pessoas.');
  const ultima = v.caminhos.ultimas[`projeto_${d}`];
  if (ultima !== undefined && v.t - ultima < 12) return bloqueio('incompativel', 'Faz pouco tempo desde o último grupo: gente para chamar leva um tempo para reaparecer.');
  return PERMITIDO;
}

function montarGrupo(v: Vida, r: Rng, valor?: string): { texto: string } {
  const d = (valor && LINGUAGENS.includes(valor as Dominio) ? valor : LINGUAGENS.find(x => v.rotinas.some(y => y.id === x))) as Dominio;
  v.caminhos.ultimas[`projeto_${d}`] = v.t;
  const p = criarProjeto(v, r, d);
  return { texto: `${d === 'musica' ? 'Você chamou gente e montou uma banda' : 'Você juntou gente e montou um grupo'}: ${p.nome}. Ensaio no fim de semana; o público, por enquanto, é quem vai por amizade.` };
}

/**
 * Mostrar o trabalho a quem contrata (um produtor, um festival, uma audição
 * aberta): a "peneira" da arte. Não é o convite: é pedir para ser visto. O
 * que pesa é o público do grupo e a técnica de palco — e o parecer diz qual
 * faltou, e se melhorou desde a última vez.
 */
const PRO_ARTE: Partial<Record<Dominio, string>> = { musica: 'musico_profissional', teatro: 'ator', danca: 'bailarino' };
const MINIMO_PRO: Partial<Record<Dominio, number>> = { musica: 70, teatro: 60, danca: 70 };
export const PALAVRA_PUBLICO = ['quase ninguém conhece', 'já tem quem vá ver', 'público fiel na cidade', 'gente de fora já conhece'] as const;
export const nivelDePublico = (p: number) => (p < 15 ? 0 : p < 40 ? 1 : p < 65 ? 2 : 3);

function podeMostrar(v: Vida): Veredito {
  const p = v.caminhos.arte;
  if (!p?.ativo) return bloqueio('requisito', 'Mostrar o trabalho a um produtor pede um grupo em atividade (uma banda, um grupo de teatro ou de dança).');
  const oc = PRO_ARTE[p.linguagem];
  if (!oc) return bloqueio('impossivel', 'Não se aplica.');
  if (v.trabalho.atual?.ocupacaoId === oc) return bloqueio('impossivel', 'Você já vive disso.');
  if (p.linguagem === 'danca' && idade(v) > 27) return bloqueio('requisito', 'As companhias profissionais de dança fazem audição até uns 27 anos.');
  if (p.publico < 15) return bloqueio('requisito', `${p.nome} ainda não tem público: quem contrata quer ver gente na plateia. Ensaio firme e os primeiros shows vêm antes.`);
  const ultima = v.fatos['arte_mostrou'];
  if (ultima !== undefined && v.t - ultima < 12) return bloqueio('incompativel', `O material foi mandado em ${anoDe(ultima)}: festival e produtor respondem uma vez por temporada.`);
  if (v.caminhos.oportunidades.some(o => o.tipo === 'convite' && o.ocupacaoId === oc)) return bloqueio('incompativel', 'Já há um convite esperando resposta.');
  return PERMITIDO;
}

function mostrarTrabalho(v: Vida, r: Rng): { texto: string; tom: 'bom' | 'ruim' } {
  const p = v.caminhos.arte!;
  const d = p.linguagem;
  const oc = PRO_ARTE[d]!;
  const h = habilidade(v, d);
  const minimo = MINIMO_PRO[d] ?? 70;
  v.fatos['arte_mostrou'] = v.t;
  const chance = clamp((p.publico - 35) / 140 + (h - minimo) / 180 + (v.fatos['arte_mostras'] ?? 0) * 0.02, 0.03, 0.4);
  v.fatos['arte_mostras'] = (v.fatos['arte_mostras'] ?? 0) + 1;
  const nivel = nivelDePublico(p.publico);
  const antes = [...v.caminhos.devolutivas].reverse().find(x => x.tipo === 'arte' && x.nivel !== undefined && x.dominio === d);
  const desde = antes ? (antes.nivel! < nivel ? ` Desde a última vez (${anoDe(antes.t)}), o público cresceu: de "${PALAVRA_PUBLICO[antes.nivel!]}" para "${PALAVRA_PUBLICO[nivel]}".` : antes.nivel! > nivel ? ` Desde a última vez (${anoDe(antes.t)}), o público caiu: era "${PALAVRA_PUBLICO[antes.nivel!]}", agora "${PALAVRA_PUBLICO[nivel]}".` : ` Desde a última vez (${anoDe(antes.t)}), o público segue "${PALAVRA_PUBLICO[nivel]}".`) : '';
  if (r.chance(chance)) {
    novaOportunidade(v, { tipo: 'convite', ocupacaoId: oc, dominio: d, meses: 12, chave: 'convite_arte',
      titulo: d === 'musica' ? 'Um convite para viver de música' : d === 'teatro' ? 'Um papel' : 'Uma audição que deu certo',
      texto: d === 'musica' ? `Um produtor ouviu o material de ${p.nome} e propôs agenda de shows: dá para viver disso — com o risco de sempre.` : d === 'teatro' ? 'Uma companhia profissional viu a cena que você mandou e chamou para a próxima montagem, com cachê.' : 'A companhia gostou da audição: há uma vaga no corpo de baile.' });
    marcar(v, 'oportunidade', `${p.nome} chamou a atenção de quem contrata.`, 2, { dominio: d });
    return { texto: 'Responderam. Há um convite nas portas abertas.', tom: 'bom' };
  }
  const falta = p.publico < 40 ? 'publico' : h < minimo ? 'tecnica' : 'concorrencia';
  const motivo = falta === 'publico' ? `gostaram, mas o público de ${p.nome} ainda é pequeno para uma agenda profissional ("${PALAVRA_PUBLICO[nivel]}")` : falta === 'tecnica' ? 'o parecer elogiou a proposta, mas a técnica ainda não está no nível de palco profissional' : 'o material estava pronto; foram muitos inscritos e poucas vagas';
  registrarDevolutiva(v, { tipo: 'arte', titulo: d === 'musica' ? 'O material mandado a produtores' : 'A audição', texto: `Não deu desta vez: ${motivo}.${desde}`, passou: false, perto: chance >= 0.2, falta, dominio: d, nivel });
  escrever(v, { texto: `Mandou o trabalho de ${p.nome} para ${d === 'musica' ? 'produtores e festivais' : 'companhias'}. Não deu desta vez.`, relevancia: 'cotidiano', tema: 'lazer', tom: 'ruim' });
  return { texto: `Não deu desta vez: ${motivo}.${desde}`, tom: 'ruim' };
}

/* ------------------------------------------------------------ Concurso */

function podeFocar(v: Vida, valor?: string): Veredito {
  if (!v.rotinas.some(r => r.id === 'estudar_concurso') && v.caminhos.concurso.meses < 6) return bloqueio('requisito', 'Primeiro, estudar para concurso (Tempo livre); depois, escolher para que área.');
  if (valor && !FOCOS.includes(valor as FocoConcurso) && valor !== 'geral') return bloqueio('impossivel', 'Essa área de editais não existe no jogo.');
  if ((valor === 'geral' ? undefined : valor) === v.caminhos.concurso.foco) return bloqueio('impossivel', 'O estudo já está nessa direção.');
  return PERMITIDO;
}

/* ------------------------------------------------------------ Pesquisa */

const temDoutorado = (v: Vida) => v.educacao.concluidos.some(c => c.nivel === 'doutorado');

function podeBolsa(v: Vida): Veredito {
  if (!temDoutorado(v)) return bloqueio('requisito', 'Bolsa de pós-doutorado pede o doutorado concluído.');
  const e = v.trabalho.atual;
  if (e && ['pesquisador', 'professor_univ', 'pesquisador_instituto'].includes(e.ocupacaoId)) return bloqueio('impossivel', 'Você já está na pesquisa.');
  const ultima = v.fatos['bolsa_pedida'];
  if (ultima !== undefined && v.t - ultima < 12) return bloqueio('incompativel', `Os editais de pós-doutorado saem uma vez por ano: o último pedido foi em ${anoDe(ultima)}.`);
  if (idade(v) > 55) return bloqueio('requisito', 'As bolsas de pós-doutorado são para quem está no começo da carreira de pesquisa.');
  return PERMITIDO;
}

/** O edital de pós-doutorado: disputado; pesa o doutorado recente, a estrada na área e ter publicado (o tempo na pesquisa). */
function pedirBolsa(v: Vida, r: Rng): { texto: string } {
  v.fatos['bolsa_pedida'] = v.t;
  const dout = [...v.educacao.concluidos].filter(c => c.nivel === 'doutorado').sort((a, b) => b.tFim - a.tFim)[0]!;
  const anos = (v.t - dout.tFim) / 12;
  const pesquisa = ((v.trabalho.experiencia['academia'] ?? 0) + (v.trabalho.experiencia['pesquisa'] ?? 0) + (v.trabalho.experiencia['docencia_superior'] ?? 0)) / 12;
  const chance = clamp(0.32 + (v.mente.cognicao - 50) / 200 - Math.max(0, anos - 5) * 0.03 + Math.min(0.1, pesquisa * 0.03) + (v.fatos['bolsas_tentadas'] ?? 0) * 0.03, 0.06, 0.6);
  v.fatos['bolsas_tentadas'] = (v.fatos['bolsas_tentadas'] ?? 0) + 1;
  if (r.chance(chance)) {
    const feito = propor(v, r, { tipo: 'emprego', ocupacaoId: 'pesquisador', via: 'oportunidade' }) === 'feito';
    marcar(v, 'aprovacao', `${flex(ge(v), 'Aprovado', 'Aprovada', 'Aprovade')} num edital de pós-doutorado (${dout.nome}).`, 3, { ocupacaoId: 'pesquisador' });
    return { texto: feito ? `O projeto foi aprovado: dois anos de pós-doutorado, na área do ${dout.nome.replace(/^Doutorado/, 'doutorado')}.` : 'O projeto foi aprovado. Agora, é caber a bolsa na vida que você tem.' };
  }
  const perto = chance >= 0.3;
  const motivo = anos > 5 ? 'o doutorado já tem alguns anos, e o parecer pediu produção recente' : pesquisa < 1 ? 'o parecer elogiou o projeto, mas pediu mais experiência de pesquisa depois do doutorado' : 'o projeto era bom, e a concorrência também';
  registrarDevolutiva(v, { tipo: 'concurso', titulo: 'Edital de pós-doutorado', passou: false, perto, falta: pesquisa < 1 ? 'experiencia' : 'concorrencia', texto: `Não passou: ${motivo}. Editais abrem todo ano; dar aula numa faculdade ou pesquisar em algum projeto conta para o próximo.` });
  escrever(v, { texto: 'Mandou um projeto para um edital de pós-doutorado. Não passou desta vez.', relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
  return { texto: `Não passou: ${motivo}.` };
}

/* ------------------------------------------------------------ Entrada única */

export function disponibilidadePerseguir(v: Vida, a: AcaoPerseguirCmd): Veredito {
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  switch (a.oque) {
    case 'pedir_teste': return podePedirTeste(v, a.valor?.split(':')[0] || undefined);
    case 'montar_grupo': return podeMontarGrupo(v, a.valor);
    case 'mostrar_trabalho': return podeMostrar(v);
    case 'foco_concurso': return podeFocar(v, a.valor);
    case 'bolsa_pesquisa': return podeBolsa(v);
  }
  return bloqueio('impossivel', 'Não se aplica.');
}

export function executarPerseguir(v: Vida, r: Rng, a: AcaoPerseguirCmd): { texto?: string; decisao?: string; tom?: 'bom' | 'ruim' | 'neutro' } {
  switch (a.oque) {
    case 'pedir_teste': return pedirTeste(v, r, a.valor);
    case 'montar_grupo': return { ...montarGrupo(v, r, a.valor), tom: 'bom' };
    case 'mostrar_trabalho': return mostrarTrabalho(v, r);
    case 'foco_concurso': {
      const foco = a.valor === 'geral' || !a.valor ? undefined : (a.valor as FocoConcurso);
      dirigirEstudo(v, foco);
      return { texto: foco ? `Estudo dirigido para ${NOME_FOCO[foco]}: o que você já estudou continua valendo, mas daqui para a frente o edital dessa área é que manda na apostila.` : 'Estudo geral: um pouco de tudo, sem apostar numa área.' };
    }
    case 'bolsa_pesquisa': return pedirBolsa(v, r);
  }
  return {};
}

export { FOCOS, LINGUAGENS, MODS, semOcupacao };
