/**
 * VIDA 27 — os acontecimentos novos (manuais: abertos por uma ação, nunca sorteados).
 *
 *   rel27_separacao   Pedir o divórcio / separar de quem mora junto: ANTES de assinar, o resumo da partilha (o que fica
 *                     com cada um, o que se passa, as dívidas, o saldo depois) — `sistemas/partilha.resumoDaPartilha`, o
 *                     mesmo plano que a separação aplica. Dá para seguir ou desistir.
 *   enc27_acaso       O encontro por acaso num lugar (o shopping, a fila do cinema, a praia): PRESENCIAL, aberto pela ação
 *   enc27_fa          que levou ao lugar (antes, chegava como notificação do celular). Conversar deixa um fio: a conversa
 *                     pode voltar por mensagem ("e aquele café?").
 *   mental27_percebe  Quem está perto repara que você anda diferente e pergunta (§15).
 *   mental27_crise    A crise, com os caminhos de ajuda: a linha de apoio, alguém próximo, o atendimento (psicólogo e
 *                     psiquiatra; urgência na fase grave). Nada de método, nada de cena, nenhuma opção de desistir da vida.
 */
import type { Conteudo, Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import { terminar } from '../sistemas/romance';
import { resumoDaPartilha } from '../sistemas/partilha';
import { divorcioNaEpoca } from '../eras/base/leis';
import { resolverEncontro27, rotuloDoLugar15, textoDoEncontro27 } from '../v15/celular/celular15';
import { aceitarApoio27, linhaDeApoio27, nomeDaFase27 } from '../v27/mente/mente27';
import { redeDeSaude } from '../sistemas/saude';
import { idade, escrever } from '../nucleo';

const papelDaSeparacao = Object.assign((v: Vida): Pessoa[] => Object.values(v.vinculos).filter(x => x.romance && ['morando_junto', 'casamento'].includes(x.romance.estagio) && v.pessoas[x.pessoaId]?.vivo).map(x => v.pessoas[x.pessoaId]), { fixo: true });
const quem = (c: Ctx) => c.p.pessoa;
const encontro = (c: Ctx) => c.v.celular15?.encontro27;
const crise = (c: Ctx) => c.v.mente.crise27;
const papelDoPercebe = Object.assign((v: Vida): Pessoa[] => { const id = v.mente.crise27?.perceberam?.slice(-1)[0]; const p = id ? v.pessoas[id] : undefined; return p?.vivo ? [p] : []; }, { fixo: true });
const papelDoProximo = Object.assign((v: Vida): Pessoa[] => {
  const ids = [...(v.mente.crise27?.perceberam ?? [])].reverse();
  const ps = ids.map(id => v.pessoas[id]).filter(p => p?.vivo);
  return ps.length ? [ps[0]] : [];
}, { fixo: true });
/** Começa o acompanhamento: o psicólogo (a rotina de terapia) e, na crise, o psiquiatra — pela rede de onde se vive. */
function comecarAtendimento(c: Ctx): string {
  const v = c.v;
  const x = v.mente.crise27;
  if (!v.rotinas.some(r => r.id === 'terapia')) v.rotinas.push({ id: 'terapia', tInicio: v.t, nivel: 1 });
  if (x && x.nivel >= 2 && x.psiquiatra === undefined) x.psiquiatra = v.t;
  const dep = v.corpo.condicoes.find(k => (k.id === 'depressao' || k.id === 'ansiedade') && k.diagnosticada === false);
  if (dep) { dep.diagnosticada = true; dep.tDiagnostico = v.t; dep.tratando = true; }
  for (const k of v.corpo.condicoes) if (k.id === 'depressao' || k.id === 'ansiedade') k.tratando = true;
  aceitarApoio27(v, 'atendimento');
  const rede = redeDeSaude(v);
  return idade(v) < 18 ? `Com a família junto, veio o acompanhamento ${rede.pelo}: psicólogo toda semana${x?.psiquiatra !== undefined ? ' e consulta com psiquiatra' : ''}.`
    : `Começou o acompanhamento ${rede.pelo}: psicólogo toda semana${x?.psiquiatra !== undefined ? ' e consulta com psiquiatra, que ajustou o tratamento' : ''}. Não resolve num dia — mas é o caminho.`;
}
const papelDoEncontro = Object.assign((v: Vida): Pessoa[] => { const e = v.celular15?.encontro27; const p = e?.pid ? v.pessoas[e.pid] : undefined; return p?.vivo ? [p] : []; }, { fixo: true });
const lugarCap = (c: Ctx) => { const l = rotuloDoLugar15(encontro(c)!.lugar); return l.charAt(0).toUpperCase() + l.slice(1); };
const estagio = (c: Ctx) => c.v.vinculos[quem(c).id]?.romance?.estagio ?? 'morando_junto';

export const ACONTECIMENTOS_27: Conteudo[] = [
  {
    id: 'rel27_separacao', tipo: 'decisao', idade: [16, 120], tema: 'amor', manual: true, repetir: 0,
    papeis: { pessoa: papelDaSeparacao },
    quando: c => c.v.fatos['separacao_cena'] === c.v.t && !!quem(c),
    titulo: c => (estagio(c) === 'casamento' ? `O divórcio de ${quem(c).nome}` : `A separação de ${quem(c).nome}`),
    texto: c => `Antes de assinar, a conta do que fica com cada um. ${resumoDaPartilha(c.v, quem(c), estagio(c)).linhas.join(' ')}`,
    opcoes: [
      { id: 'seguir', texto: c => (estagio(c) === 'casamento' ? 'Seguir com o divórcio' : 'Seguir com a separação'),
        resolver: c => {
          const p = quem(c);
          const lei = estagio(c) === 'casamento' ? divorcioNaEpoca(c.v) : '';
          return { texto: `Acabou com ${p.nome}.${lei}`, memoria: null, efeito: () => { delete c.v.fatos['separacao_cena']; terminar(c.v, p, c.v.vinculos[p.id], 'jogador'); } };
        } },
      { id: 'desistir', texto: 'Ainda não', resolver: () => ({ texto: 'Você guardou a conversa para outro dia. Nada foi assinado.', memoria: null, efeito: () => {} }) }
    ]
  },
  {
    id: 'enc27_acaso', tipo: 'decisao', idade: [8, 120], tema: 'amizade', manual: true, repetir: 0,
    papeis: { pessoa: papelDoEncontro },
    quando: c => encontro(c)?.t === c.v.t && !encontro(c)?.fa && !!quem(c),
    titulo: c => lugarCap(c),
    texto: c => textoDoEncontro27(c.v) ?? '',
    opcoes: [
      { id: 'conversar', texto: 'Parar para conversar', resolver: c => { const t = resolverEncontro27(c.v, c.r, 'conversar'); return { texto: t, memoria: null }; } },
      { id: 'cumprimentar', texto: 'Cumprimentar e seguir', resolver: c => { const t = resolverEncontro27(c.v, c.r, 'cumprimentar'); return { texto: t, memoria: null }; } },
      { id: 'desviar', texto: 'Fingir que não viu', resolver: c => { const t = resolverEncontro27(c.v, c.r, 'desviar'); return { texto: t, memoria: null }; } }
    ]
  },
  {
    id: 'enc27_fa', tipo: 'decisao', idade: [14, 120], tema: 'escolha', manual: true, repetir: 0,
    quando: c => encontro(c)?.t === c.v.t && !!encontro(c)?.fa,
    titulo: c => lugarCap(c),
    texto: c => textoDoEncontro27(c.v) ?? '',
    opcoes: [
      { id: 'conversar', texto: 'Tirar a foto, com um sorriso', resolver: c => ({ texto: resolverEncontro27(c.v, c.r, 'conversar'), memoria: null }) },
      { id: 'recusar', texto: 'Recusar com educação', resolver: c => ({ texto: resolverEncontro27(c.v, c.r, 'recusar'), memoria: null }) }
    ]
  },
  {
    id: 'mental27_percebe', tipo: 'decisao', idade: [12, 120], tema: 'saude', prioritario: true, prioridade: 4, repetir: 1,
    papeis: { pessoa: papelDoPercebe },
    quando: c => c.v.fatos['mente27_percebe'] === c.v.t && !!crise(c) && crise(c)!.nivel > 0 && !!quem(c),
    titulo: c => `${quem(c).nome} reparou`,
    texto: c => `${quem(c).nome} reparou que você anda diferente — mais quiet${c.v.eu.genero === 'feminino' ? 'a' : 'o'}, mais longe — e perguntou, com cuidado, se está tudo bem. Você está passando por ${nomeDaFase27(crise(c)!.nivel)}.`,
    opcoes: [
      { id: 'abrir', texto: 'Contar o que está acontecendo', resolver: c => ({ texto: `Falar em voz alta deixou tudo um pouco menor. ${quem(c).nome} ouviu sem julgar e disse que está por perto.`, memoria: `Abriu-se com ${quem(c).nome} numa fase difícil.`, efeito: () => aceitarApoio27(c.v, 'pessoa', quem(c).id) }) },
      { id: 'buscar', texto: 'Pedir ajuda para procurar atendimento', resolver: c => ({ texto: `${quem(c).nome} ajudou a marcar — e foi junto na primeira vez. ${comecarAtendimento(c)}`, memoria: `${quem(c).nome} ajudou a procurar atendimento.`, efeito: () => aceitarApoio27(c.v, 'pessoa', quem(c).id) }) },
      { id: 'disfarcar', texto: 'Dizer que está tudo bem', resolver: c => ({ texto: `${quem(c).nome} não insistiu. Mas ficou de olho — e disse que a porta está aberta.`, memoria: null, efeito: () => { const vin = c.v.vinculos[quem(c).id]; if (vin) vin.proximidade = Math.min(100, vin.proximidade + 1); } }) }
    ]
  },
  {
    id: 'mental27_crise', tipo: 'decisao', idade: [12, 120], tema: 'saude', prioritario: true, prioridade: 5, repetir: 3,
    papeis: { pessoa: papelDoProximo },
    quando: c => c.v.fatos['mente27_crise'] === c.v.t && !!crise(c) && crise(c)!.nivel >= 2,
    titulo: c => (crise(c)!.nivel === 3 ? 'Uma crise grave' : 'Uma crise'),
    texto: c => `${crise(c)!.nivel === 3 ? 'Há dias em que parece que não vale a pena continuar.' : 'Os dias andam pesados demais.'} Isso tem nome, tem tratamento — e ninguém precisa atravessar sozinho. (Fora do jogo, no Brasil: CVV, 188, 24 horas, de graça; em perigo imediato, SAMU 192.)`,
    opcoes: [
      { id: 'linha', texto: c => `Ligar para ${linhaDeApoio27(c.v)}`, resolver: c => ({ texto: 'Do outro lado, alguém ouviu sem pressa e sem julgamento. Não resolveu a vida — mas a noite passou, e veio a ideia de procurar atendimento.', memoria: 'Numa noite difícil, ligou para uma linha de apoio emocional.', efeito: () => aceitarApoio27(c.v, 'linha') }) },
      { id: 'alguem', texto: c => (c.p.pessoa ? `Contar para ${c.p.pessoa.nome}` : 'Contar para alguém de confiança'), resolver: c => ({ texto: c.p.pessoa ? `${c.p.pessoa.nome} veio na hora. Ficou, ouviu, e no dia seguinte ajudou a procurar ajuda.` : 'Contou para alguém de confiança — e não precisou carregar sozinh' + (c.v.eu.genero === 'feminino' ? 'a' : 'o') + ' naquela noite.', memoria: 'Contou para alguém próximo o que estava passando.', efeito: () => aceitarApoio27(c.v, 'pessoa', c.p.pessoa?.id) }) },
      { id: 'atendimento', texto: c => (crise(c)!.nivel === 3 ? 'Procurar atendimento de urgência' : 'Procurar atendimento (psicólogo e psiquiatra)'), resolver: c => ({ texto: `${crise(c)!.nivel === 3 ? `No atendimento de urgência ${redeDeSaude(c.v).pelo}, foi acolhid${c.v.eu.genero === 'feminino' ? 'a' : 'o'} e encaminhad${c.v.eu.genero === 'feminino' ? 'a' : 'o'}. ` : ''}${comecarAtendimento(c)}`, memoria: 'Procurou atendimento numa crise.', efeito: () => {} }) },
      { id: 'sozinho', texto: 'Não falar com ninguém por enquanto', resolver: c => ({ texto: 'Você guardou para si. O peso continuou ali — e quem está perto pode perceber. A ajuda segue disponível.', memoria: null, efeito: () => { escrever(c.v, { texto: 'Atravessou dias difíceis sem contar para ninguém.', relevancia: 'cotidiano', tema: 'saude' }); } }) }
    ]
  }
];
