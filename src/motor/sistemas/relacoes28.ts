/**
 * VIDA 28 — RELAÇÕES EM MAIS DIMENSÕES, A MEMÓRIA DO QUE SE VIVEU JUNTO E A FAMA QUE CHEGA ANTES.
 *
 * O que já existia (e continua sendo a fonte): afeto, confiança, atrito, intimidade, compromisso, mágoa, a história dos
 * dois (`historia`, com peso e limite: o trivial sai primeiro), as iniciativas (`iniciativas`), as conversas que lembram
 * marcos reais (`conversas`), as vidas próprias e os laços entre NPCs (`v19/npcs`). O que este módulo acrescenta:
 *
 *   1. DIMENSÕES que o afeto não diz (`Vinculo.respeito/admiracao/lealdade/rivalidade/dependencia`), cada uma com a sua
 *      dinâmica anual: a rivalidade esfria e, quando a disputa acaba (o concorrente foi para outro clube, a vaga se
 *      resolveu), parte dela vira RESPEITO — sem apagar o que houve; a admiração se apaga devagar sem novo motivo; a
 *      lealdade acompanha a confiança e o tempo; a dependência de quem foi apoiado na hora difícil pesa quando você some.
 *   2. O ESPORTE NA MEMÓRIA de quem é próximo (`ecoNasRelacoes`): o título, o primeiro contrato, a transferência, a
 *      dispensa, a aposentadoria entram na história com cada pessoa próxima (as conversas e as cenas lembram depois), e
 *      mexem no que ela sente: a conquista gera admiração (mais em quem é afável), a dispensa traz quem é próximo e afável
 *      para perto (o apoio espontâneo), o rival respeita o título.
 *   3. A FAMA QUE CHEGA ANTES (`primeiraImpressao`): quem conhece você agora já ouviu falar — pela notoriedade, pela
 *      polêmica recente — e começa com admiração ou com o pé atrás. Não é número escondido: muda as iniciativas.
 *   4. INICIATIVAS que nascem disso (`iniciativaDasDimensoes`): quem admira e anda longe manda mensagem; o rival
 *      orgulhoso não cumprimenta na semana em que você ganha a vaga; quem depende de você cobra o sumiço.
 *
 * Tudo opcional no save (ausente = a relação se lê como antes). Sorteios derivados (`rngDe`).
 */
import { clamp, rngDe } from '../rng';
import type { Pessoa, Vida, Vinculo } from '../tipos';
import { escrever, lembrarCom, vinculosVivos } from '../nucleo';

const D = ['respeito', 'admiracao', 'lealdade', 'rivalidade', 'dependencia'] as const;
export type Dimensao28 = typeof D[number];

/** Mexe numa dimensão (0..100); cria o campo na primeira vez. */
export function mexer28(vin: Vinculo, d: Dimensao28, delta: number): void {
  vin[d] = Math.round(clamp((vin[d] ?? 0) + delta));
}

/**
 * A dinâmica do ano (chamada uma vez por ano, depois das iniciativas). Sem sorteio: o tempo e o estado decidem.
 */
export function processarRelacoes28(v: Vida): void {
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie) continue;
    const juntos = vin.convivio.length > 0;
    const semContato = (v.t - vin.tUltimoContato) / 12;
    if (vin.rivalidade !== undefined && vin.rivalidade > 0) {
      // A disputa acabou (não convivem mais no mesmo lugar): a rivalidade cai depressa e uma parte vira respeito.
      const cai = juntos ? 0.1 : 0.35;
      const antes = vin.rivalidade;
      vin.rivalidade = Math.round(antes * (1 - cai));
      if (!juntos && antes >= 20 && vin.tensao < 50) mexer28(vin, 'respeito', (antes - vin.rivalidade) * 0.8);
      if (antes >= 30 && vin.rivalidade < 30 && !juntos) lembrarCom(v, p.id, 'A rivalidade de antes virou respeito: hoje, cada um torce pelo outro de longe.', 'reconciliacao', 2);
      if (vin.rivalidade <= 2) delete vin.rivalidade;
    }
    if (vin.admiracao !== undefined) vin.admiracao = Math.round(vin.admiracao * 0.93);
    // A lealdade acompanha a confiança construída com o tempo (sobe devagar; a traição a derruba por fora daqui).
    if (vin.lealdade !== undefined || (vin.confianca >= 70 && v.t - vin.tInicio >= 60)) {
      const alvo = clamp((vin.confianca - 40) * 1.2 + Math.min(20, (v.t - vin.tInicio) / 24));
      vin.lealdade = Math.round((vin.lealdade ?? alvo * 0.6) + (alvo - (vin.lealdade ?? alvo * 0.6)) * 0.15);
    }
    // A dependência: quem precisou de você e você sumiu sente — vira atrito; com presença, ela vai se desfazendo.
    if (vin.dependencia !== undefined) {
      if (semContato >= 1.5 && vin.dependencia >= 40) vin.tensao = clamp(vin.tensao + 4);
      vin.dependencia = Math.round(vin.dependencia * (semContato < 1 ? 0.85 : 0.95));
      if (vin.dependencia <= 2) delete vin.dependencia;
    }
  }
}

/** O tipo de acontecimento da carreira que ecoa nas relações. */
export type EcoDoEsporte = 'titulo' | 'contrato' | 'transferencia' | 'dispensa' | 'aposentadoria' | 'premio';

/**
 * O ACONTECIMENTO na memória de quem é próximo: entra na história de cada um (as conversas lembram) e mexe no que a
 * pessoa sente — conforme o jeito dela. Devolve quem foi tocado (para a cena de apoio).
 */
export function ecoNasRelacoes(v: Vida, tipo: EcoDoEsporte, texto: string, peso: 1 | 2 | 3 = 2): Pessoa[] {
  const tocados: Pessoa[] = [];
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie || vin.proximidade < 45 || vin.ruptura) continue;
    const afavel = p.temperamento.afabilidade;
    lembrarCom(v, p.id, texto, tipo === 'dispensa' || tipo === 'aposentadoria' ? 'apoio' : 'trabalho', peso);
    if (tipo === 'titulo' || tipo === 'premio' || tipo === 'contrato') mexer28(vin, 'admiracao', 6 + Math.max(0, afavel) * 6);
    if (tipo === 'dispensa') { vin.proximidade = clamp(vin.proximidade + (afavel > 0 ? 2 : 0)); if (afavel > 0.2) mexer28(vin, 'lealdade', 3); }
    tocados.push(p);
  }
  // O rival: o título dele é o seu fracasso — mas a vitória limpa é reconhecida.
  if (tipo === 'titulo' || tipo === 'premio') for (const { vin } of vinculosVivos(v)) if ((vin.rivalidade ?? 0) >= 20) { mexer28(vin, 'rivalidade', -5); mexer28(vin, 'respeito', 6); }
  // Na dispensa, quem é muito próximo e afável aparece sem ser chamado (uma vez, e só se não houver outro chamado).
  if (tipo === 'dispensa') {
    const r = rngDe(v.id, 'eco28', tipo, v.t);
    const quem = vinculosVivos(v).filter(x => !x.p.especie && !x.vin.chamado && x.vin.proximidade >= 60 && x.p.temperamento.afabilidade > 0.1).sort((a, b) => b.vin.proximidade - a.vin.proximidade)[0];
    if (quem && r.chance(0.6)) {
      quem.vin.chamado = { tipo: 'apoio', t: v.t, texto: `${quem.p.nome} apareceu no dia seguinte à dispensa: "e agora, o que você quer fazer?"`, assunto: 'a dispensa' };
      mexer28(quem.vin, 'dependencia', -5);
    }
  }
  return tocados;
}

/**
 * A FAMA QUE CHEGA ANTES: a primeira impressão de quem acaba de entrar na vida (chamada ao criar o vínculo). A
 * notoriedade dá admiração (mais a quem é aberto); a polêmica recente deixa o pé atrás (menos respeito, um pouco de
 * atrito). Família não: família conhece por dentro.
 */
export function primeiraImpressao(v: Vida, vin: Vinculo): void {
  if (vin.parentesco) return;
  const noto = v.notoriedade?.valor ?? 0;
  const polemica = v.fatos['vis_polemica'] !== undefined && v.t - v.fatos['vis_polemica'] <= 24;
  if (noto >= 25) vin.admiracao = Math.round(clamp((noto - 20) * 0.6));
  if (polemica && noto >= 15) { vin.respeito = Math.max(0, (vin.respeito ?? 20) - 15); vin.tensao = clamp(vin.tensao + 5); }
}

/**
 * As INICIATIVAS que as dimensões pedem (uma no máximo por ano, se não houver outro chamado com a pessoa): quem admira e
 * anda longe procura; o rival orgulhoso fecha a cara; quem dependia e foi esquecido cobra. Devolve o texto escrito.
 */
export function iniciativaDasDimensoes(v: Vida): string | undefined {
  const r = rngDe(v.id, 'iniciativa28', v.t);
  const lista: { p: Pessoa; vin: Vinculo; peso: number; fazer: () => string }[] = [];
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie || vin.chamado || !p.nome) continue;
    const ultimo = v.fatos[`chamado_${p.id}`];
    if (ultimo !== undefined && v.t - ultimo < 24) continue;
    const t = p.temperamento;
    const semContato = (v.t - vin.tUltimoContato) / 12;
    if ((vin.admiracao ?? 0) >= 45 && vin.proximidade < 50 && semContato >= 1 && t.extroversao > -0.2)
      lista.push({ p, vin, peso: (vin.admiracao ?? 0) / 40, fazer: () => { vin.chamado = { tipo: 'aproximacao', t: v.t, texto: `${p.nome} mandou mensagem: acompanha o que você anda fazendo e queria marcar um café.`, assunto: 'um café' }; return `${p.nome} procurou você: anda acompanhando a sua carreira de longe.`; } });
    if ((vin.rivalidade ?? 0) >= 45 && vin.convivio.length > 0 && t.afabilidade < 0)
      lista.push({ p, vin, peso: (vin.rivalidade ?? 0) / 40, fazer: () => { vin.tensao = clamp(vin.tensao + 8); lembrarCom(v, p.id, 'Deixou de cumprimentar você no treino: a disputa ficou pessoal.', 'conflito', 1); return `${p.nome} passou a semana sem falar com você: a disputa pela mesma vaga ficou pessoal.`; } });
    if ((vin.dependencia ?? 0) >= 45 && semContato >= 1.5)
      lista.push({ p, vin, peso: (vin.dependencia ?? 0) / 35, fazer: () => { vin.chamado = { tipo: 'reclamacao', t: v.t, texto: `${p.nome} escreveu: "você me segurou quando eu mais precisei, e depois sumiu."` }; return `${p.nome} cobrou o seu sumiço: depois de ter contado tanto com você, sentiu a falta.`; } });
  }
  if (!lista.length || !r.chance(Math.min(0.5, 0.15 + lista.length * 0.1))) return undefined;
  const x = r.weighted(lista, c => c.peso);
  if (!x) return undefined;
  const texto = x.fazer();
  v.fatos[`chamado_${x.p.id}`] = v.t;
  escrever(v, { texto, relevancia: 'cotidiano', tema: 'amizade', pessoas: [x.p.id] });
  return texto;
}

/** As dimensões em palavras (a ficha da pessoa): só as que existem e importam. */
export function dimensoes28EmPalavras(vin: Vinculo): { id: string; rotulo: string; palavra: string; tom: 'bom' | 'neutro' | 'ruim' }[] {
  const out: { id: string; rotulo: string; palavra: string; tom: 'bom' | 'neutro' | 'ruim' }[] = [];
  const x = (d: Dimensao28) => vin[d] ?? 0;
  if (x('respeito') >= 25) out.push({ id: 'respeito', rotulo: 'Respeito', palavra: x('respeito') >= 60 ? 'muito respeito por você' : 'respeita você', tom: 'bom' });
  if (x('admiracao') >= 25) out.push({ id: 'admiracao', rotulo: 'Admiração', palavra: x('admiracao') >= 60 ? 'admira muito você' : 'admira você', tom: 'bom' });
  if (x('lealdade') >= 40) out.push({ id: 'lealdade', rotulo: 'Lealdade', palavra: x('lealdade') >= 70 ? 'fica do seu lado, custe o que custar' : 'costuma ficar do seu lado', tom: 'bom' });
  if (x('rivalidade') >= 20) out.push({ id: 'rivalidade', rotulo: 'Rivalidade', palavra: x('rivalidade') >= 55 ? 'rivais de verdade' : 'disputam o mesmo espaço', tom: 'ruim' });
  if (x('dependencia') >= 35) out.push({ id: 'dependencia', rotulo: 'Dependência', palavra: x('dependencia') >= 65 ? 'conta muito com você' : 'conta com você', tom: 'neutro' });
  return out;
}

export const DIMENSOES28 = D;
