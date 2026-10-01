/**
 * Palmarés: a MEMÓRIA ESTRUTURADA da carreira esportiva (pacote pós-REWORK 3).
 *
 * Ser campeão vira conquista permanente — não uma linha a mais de uma
 * temporada. Aqui moram:
 *
 *   títulos      competição, clube, ano — e o papel (protagonista ou elenco)
 *   acessos e rebaixamentos do clube com você dentro
 *   prêmios      só quando conquistados: seleção do campeonato (pela
 *                posição), artilharia, melhor jogador, revelação
 *   marcos       estreia, primeira temporada como titular, estreia na elite
 *
 * O prêmio NÃO vem porque o clube ganhou: vem da avaliação da temporada
 * (`avaliarTemporada`), que mede cada posição pelo que ela produz — o volante
 * por titularidade, desarmes e o desempenho do time; o atacante por gol; o
 * goleiro por jogos sem sofrer gol. Campeão reserva ≠ campeão protagonista.
 *
 * Consequências: a reputação no mercado (proposta, contrato, salário), a
 * notoriedade (`notoriedade.alvoDaNotoriedade`) e o olhar da seleção
 * (`selecao`). A Linha da Vida recebe os marcos biográficos; o histórico
 * detalhado (por clube, por temporada) é lido daqui e das temporadas.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CarreiraEsportiva, ConquistaEsportiva, Dominio, Posicao, Temporada, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { flex, ge } from '../texto';
import { marcar } from './marcas';
import { abalar } from './abalo';
import { CLUBES, DIVISAO_DO_NIVEL, doClube, noClube, oClube } from '../dados/clubes';
import { ASSIST, carreirasEsportivas, DEFESA, divisaoDe, GOL, jogosDaTemporada, linhaDaTemporada, NOME_MOD, nomePosicao } from './esporte';
import { aCompeticao, avaliarPelaModalidade, daCompeticao, individualComEquipe, lideresDaTemporada, perfilDe } from './perfisEsportivos';
import { formatarMarca, naProva, podiosDe } from './provas';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const palmaresDe = (v: Vida): ConquistaEsportiva[] => v.caminhos.palmares ?? [];

/** Registra uma conquista (uma vez só: a mesma conquista não entra duas vezes). */
export function registrarConquista(v: Vida, c: Omit<ConquistaEsportiva, 't'>): ConquistaEsportiva {
  const lista = (v.caminhos.palmares ??= []);
  const ja = lista.find(x => x.tipo === c.tipo && x.competicao === c.competicao && x.ano === c.ano && x.clube === c.clube && x.texto === c.texto);
  if (ja) return ja;
  const x: ConquistaEsportiva = { ...c, t: v.t };
  lista.push(x);
  if (lista.length > 120) lista.splice(0, lista.length - 120);
  return x;
}

/* ------------------------------------------------------------ Avaliação */

/**
 * A temporada avaliada pela POSIÇÃO (0..100). Não inventa precisão: usa o
 * que a temporada guardou (nota, jogos, titularidades, gols, assistências,
 * desarmes ou jogos sem sofrer gol, colocação do time) e mede a produção
 * contra o que a posição costuma produzir por jogo.
 */
export function avaliarTemporada(e: CarreiraEsportiva, t: Temporada): { indice: number; participacao: number; producao: number } {
  const max = jogosDaTemporada(e.modalidade, t.nivel) || 1;
  // Fora do futebol, a modalidade sabe o que medir (a função no basquete, as fases no tênis, os pódios nas individuais).
  if (e.modalidade !== 'futebol') return avaliarPelaModalidade(e, t, max);
  const participacao = clamp(t.titular / max, 0, 1);
  // Jogos equivalentes: entrar no fim vale menos que começar jogando (a mesma conta que a temporada usa).
  const je = t.titular + (t.partidas - t.titular) * 0.35;
  let producao = 0;
  if (e.modalidade === 'futebol' && t.posicao && je >= 1) {
    const p: Posicao = t.posicao;
    const r = (x: number, taxa: number) => (taxa > 0 ? x / (je * taxa) : 0);
    const def = r(t.defesa ?? 0, DEFESA[p]), gol = r(t.gols, GOL[p]), ast = r(t.assistencias, ASSIST[p]);
    producao = p === 'goleiro' ? def
      : p === 'zagueiro' ? def * 0.8 + gol * 0.1 + ast * 0.1
        : p === 'volante' ? def * 0.7 + ast * 0.2 + gol * 0.1
          : p === 'lateral' ? def * 0.5 + ast * 0.35 + gol * 0.15
            : p === 'meia' ? ast * 0.55 + gol * 0.45
              : p === 'ponta' ? gol * 0.55 + ast * 0.45
                : gol * 0.8 + ast * 0.2;
  } else producao = clamp(t.nota / 6.5, 0, 2);
  const coletivo = t.colocacao === 1 ? 6 : t.colocacao <= 4 ? 3 : t.colocacao >= 17 ? -3 : 0;
  const indice = clamp(participacao * 30 + (t.nota - 4) * 10 + (producao - 1) * 25 + coletivo, 0, 100);
  return { indice: Math.round(indice), participacao, producao: Math.round(producao * 100) / 100 };
}

/** O nome da competição de uma temporada (no universo do jogo). */
export const competicaoDe = (d: Dominio, nivel: number) => (d === 'futebol' ? DIVISAO_DO_NIVEL[nivel] : divisaoDe(d, nivel).replace(/ —.*$/, '').replace(/ \(acesso\)$/, ''));
export { daCompeticao };

/** O teto de divisão de um clube na simulação (o mesmo de `esporte`). */
const tetoDoClube = (nome: string) => { const c = CLUBES.find(x => x.nome === nome); return !c ? 2 : c.porte === 'grande' ? 4 : c.porte === 'tradicional' ? 3 : 2; };
/** O piso: um clube grande cai, mas não some para as divisões de acesso (a simulação não leva um gigante ao estadual). */
export const pisoDoClube = (nome: string) => { const c = CLUBES.find(x => x.nome === nome); return !c ? 1 : c.porte === 'grande' ? 3 : c.porte === 'tradicional' ? 2 : 1; };

/* ------------------------------------------------------------ A temporada no palmarés */

/**
 * Depois de fechada a temporada: título (com o papel), acesso ou
 * rebaixamento do clube, prêmios individuais, marcos — no palmarés, na
 * reputação e (o que é biografia) na Linha da Vida.
 */
export function registrarTemporada(v: Vida, r: Rng, e: CarreiraEsportiva, t: Temporada): void {
  // O tênis não tem temporada de clube: o palmarés dele é o do circuito, torneio a torneio (`esporte.registrarCircuito`).
  if (e.modalidade === 'tenis') return;
  const g = ge(v);
  const futebol = e.modalidade === 'futebol';
  const comp = competicaoDe(e.modalidade, t.nivel);
  const ava = avaliarTemporada(e, t);
  const linha = linhaDaTemporada(v, t).split(' · ').slice(2).join(', ');
  const anteriores = (e.temporadas ?? []).slice(0, -1);

  // Marcos: a primeira temporada, a primeira como titular de verdade, a estreia na elite.
  if (!anteriores.length) {
    const texto = futebol ? `A primeira temporada como profissional, ${noClube(e.clube)}: ${t.partidas} jogos${t.gols ? `, ${t.gols} ${t.gols === 1 ? 'gol' : 'gols'}` : ''}.` : t.prova ? `A primeira temporada como profissional: ${t.partidas} ${t.partidas === 1 ? 'competição' : 'competições'} ${naProva(t.prova.nome)}, a melhor marca em ${formatarMarca(t.prova.unidade, t.prova.marca)}.` : t.luta ? `A primeira temporada como profissional, na categoria ${t.luta.categoria}: ${t.luta.vitorias} ${t.luta.vitorias === 1 ? 'vitória' : 'vitórias'} e ${t.luta.derrotas} ${t.luta.derrotas === 1 ? 'derrota' : 'derrotas'}.` : `A primeira temporada como profissional: ${t.partidas} ${t.partidas === 1 ? 'competição' : 'competições'}.`;
    escrever(v, { texto, relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' });
    registrarConquista(v, { tipo: 'marco', modalidade: e.modalidade, ano: t.ano, competicao: comp, clube: t.clube, texto: 'Primeira temporada como profissional' });
  }
  if (ava.participacao >= 0.6 && !anteriores.some(x => x.titular / (jogosDaTemporada(e.modalidade, x.nivel) || 1) >= 0.6)) {
    // Nas individuais, "titular" é estar nas provas principais da equipe — não há jogo começando jogando.
    registrarConquista(v, { tipo: 'marco', modalidade: e.modalidade, ano: t.ano, competicao: comp, clube: t.clube, texto: individualComEquipe(e.modalidade) ? `Primeira temporada nas competições principais da equipe (${t.partidas} ${t.partidas === 1 ? 'competição' : 'competições'})` : `Primeira temporada como ${flex(g, 'titular', 'titular')} (${t.titular} jogos começando jogando)` });
  }
  if (t.nivel === 4 && !anteriores.some(x => x.nivel === 4)) {
    registrarConquista(v, { tipo: 'marco', modalidade: e.modalidade, ano: t.ano, competicao: comp, clube: t.clube, texto: `Estreia na elite: ${comp}` });
    escrever(v, { texto: futebol ? `A primeira temporada na Série A, com ${oClube(e.clube)}: ${t.partidas} jogos.` : `A primeira temporada na elite da modalidade: ${t.partidas} ${t.partidas === 1 ? 'jogo' : 'jogos'}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  }

  // O título: o do clube — e o seu papel nele.
  if (t.colocacao === 1 && t.partidas > 0 && individualComEquipe(e.modalidade)) {
    // Natação, atletismo, luta: o título é do atleta, na prova que importa (a equipe é o vínculo, não o campeão).
    // O título diz onde: a prova (com a marca) ou a categoria de peso.
    const onde = t.prova ? ` ${naProva(t.prova.nome)}` : t.luta ? `, na categoria ${t.luta.categoria}` : '';
    const texto = `${flex(g, 'Campeão', 'Campeã', 'Campeão')} ${daCompeticao(comp)} de ${NOME_MOD[e.modalidade] ?? e.modalidade}${onde}`;
    registrarConquista(v, { tipo: 'titulo', modalidade: e.modalidade, ano: t.ano, competicao: comp, clube: t.clube, papel: 'protagonista', texto });
    const doAno = t.prova ? `a melhor marca do ano, ${formatarMarca(t.prova.unidade, t.prova.marca)}${t.prova.recorde ? ' (recorde pessoal)' : ''}` : t.luta ? `${t.luta.vitorias} ${t.luta.vitorias === 1 ? 'vitória' : 'vitórias'} e ${t.luta.derrotas} ${t.luta.derrotas === 1 ? 'derrota' : 'derrotas'} no ano` : `${podiosDe(t)} ${podiosDe(t) === 1 ? 'pódio' : 'pódios'} na temporada`;
    escrever(v, { texto: `${texto} (${t.ano}): ${doAno}.`, relevancia: t.nivel >= 3 ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, t.nivel >= 3 ? 3 : 2, { dominio: e.modalidade });
    e.reputacao = clamp((e.reputacao ?? 30) + 1 + Math.floor(t.nivel / 2));
  } else if (t.colocacao === 1 && t.partidas > 0) {
    const protagonista = ava.participacao >= 0.5;
    registrarConquista(v, { tipo: 'titulo', modalidade: e.modalidade, ano: t.ano, competicao: comp, clube: t.clube, papel: protagonista ? 'protagonista' : 'elenco', texto: `${flex(g, 'Campeão', 'Campeã', 'Campeão')} ${daCompeticao(comp)}${futebol ? ` com ${oClube(t.clube)}` : ''}` });
    const campeao = flex(g, 'Campeão', 'Campeã', 'Campeão');
    const texto = protagonista
      ? `${campeao} ${daCompeticao(comp)}${futebol ? ` com ${oClube(e.clube)}` : ' com a equipe'}: ${linha}.`
      : `${campeao} ${daCompeticao(comp)}${futebol ? ` com ${oClube(e.clube)}` : ' com a equipe'}, como parte do elenco: ${t.partidas} ${t.partidas === 1 ? 'jogo' : 'jogos'}, ${t.titular} como ${flex(g, 'titular', 'titular')}.`;
    escrever(v, { texto, relevancia: protagonista && t.nivel >= 3 ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom' });
    if (protagonista) marcar(v, 'conquista', texto, t.nivel >= 3 ? 3 : 2, { dominio: e.modalidade });
    e.reputacao = clamp((e.reputacao ?? 30) + (protagonista ? 1 + Math.floor(t.nivel / 2) : 0));
  } else if (t.nota >= 8.2) {
    escrever(v, { texto: `Temporada de destaque ${futebol ? noClube(e.clube) : 'na equipe'}: ${linha}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  }

  // Acesso e rebaixamento: o clube sobe ou cai — e você junto (o contrato continua; a próxima conversa já é em outra divisão).
  if (perfilDe(e.modalidade).estrutura === 'clube') {
    const sobe = t.nivel < 4 && t.colocacao <= (t.nivel === 1 ? 2 : 4) && (!futebol || tetoDoClube(e.clube) > t.nivel);
    const cai = t.nivel >= 2 && t.colocacao >= 17 && (!futebol || t.nivel - 1 >= pisoDoClube(e.clube));
    if (sobe && e.nivel === t.nivel) {
      e.nivel = (t.nivel + 1) as 1 | 2 | 3 | 4;
      const para = competicaoDe(e.modalidade, e.nivel);
      const texto = `Acesso: ${futebol ? oClube(e.clube) : 'a equipe'} subiu para ${aCompeticao(para)}${ava.participacao >= 0.5 ? ', com você entre os titulares' : ''}.`;
      registrarConquista(v, { tipo: 'acesso', modalidade: e.modalidade, ano: t.ano, competicao: para, clube: t.clube, papel: ava.participacao >= 0.5 ? 'protagonista' : 'elenco', texto: `Acesso para ${aCompeticao(para)}${futebol ? ` com ${oClube(t.clube)}` : ''}` });
      escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
      e.reputacao = clamp((e.reputacao ?? 30) + 1);
    } else if (cai && e.nivel === t.nivel) {
      e.nivel = (t.nivel - 1) as 1 | 2 | 3 | 4;
      const para = competicaoDe(e.modalidade, e.nivel);
      registrarConquista(v, { tipo: 'rebaixamento', modalidade: e.modalidade, ano: t.ano, competicao: comp, clube: t.clube, texto: `Rebaixamento ${daCompeticao(comp)}${futebol ? ` com ${oClube(t.clube)}` : ''}` });
      escrever(v, { texto: `${futebol ? cap(oClube(e.clube)) : 'A equipe'} caiu: a próxima temporada é ${para === 'campeonato estadual' ? 'só no estadual' : daCompeticao(para).replace(/^do /, 'no ').replace(/^da /, 'na ').replace(/^das /, 'nas ')}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      abalar(v, 'o rebaixamento do clube', -5, 3);
    }
  }

  premiosDaTemporada(v, r, e, t, ava);
}

/**
 * Os prêmios individuais da temporada. Só existem quando conquistados — e
 * só a partir das divisões nacionais (no estadual, o prêmio é o título).
 * Pela posição: o volante entra na seleção do campeonato pelo que marcou,
 * distribuiu e jogou; o atacante pela produção de gols.
 */
export function premiosDaTemporada(v: Vida, r: Rng, e: CarreiraEsportiva, t: Temporada, ava = avaliarTemporada(e, t)): string[] {
  if (t.nivel < 2 || e.modalidade === 'tenis' || t.partidas === 0) return [];
  const g = ge(v);
  const coletivo = perfilDe(e.modalidade).coletivo;
  const comp = competicaoDe(e.modalidade, t.nivel);
  const ganhos: { texto: string; peso: 1 | 2 | 3; rep: number }[] = [];
  // As vagas são poucas e a concorrência é a liga inteira: estar entre os elegíveis não é ganhar.
  const vaga = (p: number) => r.chance(p);
  const ruido = r.normal() * 3;
  const futebol = e.modalidade === 'futebol';
  const pos = futebol && t.posicao ? nomePosicao(v, t.posicao) : undefined;
  // A seleção do campeonato: os melhores de cada posição (participação de titular é condição).
  const funcao = e.modalidade === 'basquete' && t.funcao ? ({ armador: 'armador', ala: 'ala', pivo: 'pivô' } as Record<string, string>)[t.funcao] : undefined;
  if (coletivo && ava.participacao >= 0.6 && ava.indice + ruido >= 84 && vaga(0.4)) ganhos.push({ texto: `Seleção ${daCompeticao(comp)}${pos ? `, como ${pos}` : funcao ? `, como ${funcao}` : ''}`, peso: t.nivel >= 3 ? 3 : 2, rep: 2 });
  // O melhor do campeonato: raríssimo, e só para quem jogou o ano inteiro num time de cima (nas individuais, o atleta do ano).
  if (ava.participacao >= 0.7 && t.colocacao <= 4 && ava.indice + ruido >= 90 && t.nota >= 8.4 && vaga(0.25)) ganhos.push({ texto: coletivo ? `${flex(g, 'Melhor jogador', 'Melhor jogadora', 'Melhor jogador')} ${daCompeticao(comp)}` : `${flex(g, 'Atleta', 'Atleta', 'Atleta')} do ano ${daCompeticao(comp)} (${NOME_MOD[e.modalidade] ?? e.modalidade})`, peso: 3, rep: 3 });
  // Os fatos do placar de cada modalidade (o cestinha, o líder em rebotes ou em assistências).
  ganhos.push(...lideresDaTemporada(v, e, t, comp, ruido, r));
  // A artilharia é um fato do placar: só quem fez muitos gols (o número que a divisão costuma pedir).
  if (futebol && t.gols >= [0, 0, 16, 18, 21][t.nivel] + Math.round(ruido / 2)) ganhos.push({ texto: `${flex(g, 'Artilheiro', 'Artilheira', 'Artilheiro')} ${daCompeticao(comp)}, com ${t.gols} gols`, peso: t.nivel >= 3 ? 3 : 2, rep: 2 });
  // A revelação: a temporada boa de quem ainda é muito novo.
  if (idade(v) <= 21 && ava.participacao >= 0.6 && ava.indice + ruido >= 76 && vaga(0.5)) ganhos.push({ texto: `${flex(g, 'Revelação', 'Revelação', 'Revelação')} ${daCompeticao(comp)}`, peso: 2, rep: 1 });
  for (const x of ganhos) {
    registrarConquista(v, { tipo: 'premio', modalidade: e.modalidade, ano: t.ano, competicao: comp, clube: t.clube, texto: x.texto });
    escrever(v, { texto: `${x.texto} (${t.ano}).`, relevancia: x.peso >= 3 ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', `${x.texto} (${t.ano}).`, x.peso, { dominio: e.modalidade });
    e.reputacao = clamp((e.reputacao ?? 30) + x.rep);
  }
  return ganhos.map(x => x.texto);
}

/* ------------------------------------------------------------ Leitura */

/** O histórico por clube (derivado das temporadas: a mesma fonte da tela e da biografia). */
export function historicoPorClube(e: CarreiraEsportiva): { clube: string; de: number; ate: number; jogos: number; titular: number; gols: number; assistencias: number; defesa: number; temporadas: number }[] {
  const out: ReturnType<typeof historicoPorClube> = [];
  for (const t of e.temporadas ?? []) {
    const ult = out[out.length - 1];
    const x = ult && ult.clube === t.clube ? ult : (out.push({ clube: t.clube, de: t.ano, ate: t.ano, jogos: 0, titular: 0, gols: 0, assistencias: 0, defesa: 0, temporadas: 0 }), out[out.length - 1]);
    x.ate = t.ano; x.jogos += t.partidas; x.titular += t.titular; x.gols += t.gols; x.assistencias += t.pontos !== undefined ? 0 : t.assistencias; x.defesa += t.defesa ?? 0; x.temporadas += 1;
  }
  return out;
}

/** O palmarés em leitura (a tela de carreira): títulos, prêmios, marcos, por grupo e em ordem. */
/** A representação nacional de uma carreira, em uma linha, no idioma da modalidade. */
export function leituraDaSelecao(v: Vida, e: CarreiraEsportiva, comModalidade = false): string {
  const s = e.selecao!;
  const individual = !perfilDe(e.modalidade).coletivo;
  const conv = individual ? `${s.convocacoes} ${s.convocacoes === 1 ? 'convocação' : 'convocações'} pelo país` : `${s.convocacoes} ${s.convocacoes === 1 ? 'convocação' : 'convocações'}`;
  const jogos = e.modalidade === 'tenis' ? `${s.jogos} ${s.jogos === 1 ? 'partida' : 'partidas'}` : individual ? `${s.jogos} ${s.jogos === 1 ? 'prova' : 'provas'}` : `${s.jogos} ${s.jogos === 1 ? 'jogo' : 'jogos'}`;
  const medalhas = s.medalhas ? `, ${s.medalhas} ${s.medalhas === 1 ? 'medalha' : 'medalhas'}` : '';
  const gols = e.modalidade === 'futebol' && s.gols ? `, ${s.gols} ${s.gols === 1 ? 'gol' : 'gols'}` : '';
  return `${comModalidade && NOME_MOD[e.modalidade] ? `${(NOME_MOD[e.modalidade] ?? '').charAt(0).toUpperCase()}${(NOME_MOD[e.modalidade] ?? '').slice(1)}: ` : ''}${conv}, ${jogos}${gols}${medalhas}${s.capitao ? ` · já foi ${flex(ge(v), 'capitão', 'capitã', 'capitão')}` : ''}`;
}

export function leituraDoPalmares(v: Vida): { titulos: string[]; premios: string[]; marcos: string[]; selecao?: string; finais: string[] } {
  const p = palmaresDe(v);
  const titulos = p.filter(x => x.tipo === 'titulo' || x.tipo === 'acesso' || (x.tipo === 'selecao' && /^Campe(ão|ã)/.test(x.texto))).map(x => `${x.ano} · ${x.texto}${x.tipo === 'titulo' ? (x.papel === 'elenco' ? ' (no elenco)' : ' (titular)') : ''}`);
  const premios = p.filter(x => x.tipo === 'premio').map(x => `${x.ano} · ${x.texto}`);
  const marcos = p.filter(x => x.tipo === 'marco' || x.tipo === 'rebaixamento' || (x.tipo === 'selecao' && !/^Campe(ão|ã)/.test(x.texto))).map(x => `${x.ano} · ${x.texto}`);
  // A representação nacional de TODAS as carreiras da pessoa (uma carreira nova não apaga a seleção da anterior).
  const sels = carreirasEsportivas(v).filter(x => x.selecao && x.selecao.convocacoes > 0);
  const selecao = sels.length ? sels.map(x => leituraDaSelecao(v, x, sels.length > 1)).join(' · ') : undefined;
  const finais = p.filter(x => x.tipo === 'final').map(x => `${x.ano} · ${x.texto}`);
  return { titulos, premios, marcos, selecao, finais };
}

/** Os títulos recentes de peso (para o nome: notoriedade e seleção). */
export const conquistasRecentes = (v: Vida, anos = 3) => palmaresDe(v).filter(x => v.t - x.t <= anos * 12 && (x.tipo === 'premio' || (x.tipo === 'titulo' && x.papel === 'protagonista') || x.tipo === 'selecao'));

export { doClube };
