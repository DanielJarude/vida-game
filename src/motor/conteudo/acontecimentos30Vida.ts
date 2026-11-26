/**
 * VIDA 30 · §4–§5 — EXPERIÊNCIAS DE VIDA E AS PESSOAS QUE REAGEM.
 *
 * A auditoria do catálogo (scripts/sim/catalogo30.ts) mostrou a infância rala (49 conteúdos até os 5 anos, 83 até os 11),
 * a vida adulta dominada pelo trabalho e a velhice com quatro acontecimentos próprios — quase tudo o resto era trabalho,
 * dinheiro e perda. Aqui, cenas de cada fase, com gente de verdade da vida (os papéis), condições lidas do estado e
 * consequências (o vínculo, a memória, a personalidade pela escolha, o humor, o dinheiro):
 *
 *   infância      a cabana com o irmão, a festa de aniversário, a bicicleta, o passeio com os avós, a briga com o irmão
 *   adolescência  a primeira festa, a pressão da turma, a hora de voltar, o primeiro dinheiro, o talento descoberto
 *   juventude     sair de casa, a viagem com os amigos, o vizinho da cidade nova, o primeiro aperto de verdade
 *   vida adulta   o churrasco dos amigos, o Natal da família, a reunião da escola do filho, a briga e a reconciliação
 *   maturidade    os trinta anos da turma, a conquista do filho, a aposentadoria festejada
 *   velhice       o fim de semana com os netos, o álbum (a lembrança REAL da infância, lida da biografia), o amigo de
 *                 cinquenta anos
 *   relações      conhecer a família de quem você namora (os pais com jeito próprio: simpatia, desconfiança, curiosidade,
 *                 constrangimento), o que vem depois (o par comenta; a chance de melhorar), apresentar o par à sua
 *                 família (os pais perguntam, o irmão provoca, a opinião vem depois), a conquista que traz parabéns e
 *                 inveja, o amigo que percebe que você mudou, o amigo que reclama do sumiço
 *
 * Sorteio derivado próprio (`vidaDe30DoAno`): as vidas de antes continuam iguais até uma destas cenas acontecer. Decisão
 * só num ano sem nenhuma. A memória entra com o peso do que foi (o trivial não vira memória permanente).
 */
import type { Conteudo, Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import * as P from './papeis';
import { dinheiro, estresse, feliz, local, prox, tensao } from './efeitos';
import { idade, idadePessoa, lembrarCom, parceiro, vinculosVivos, filhos } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { anoDe } from '../tempo';

/** VIDA 37: a bicicleta sem rodinhas é uma vez só (três acontecimentos a contavam). Funções locais: sem módulo compartilhado (um ciclo de chunks quebraria o app em produção). */
const CAPITULO_DA_BICICLETA37 = 'aprendeu_bicicleta';
const jaAprendeuDeBicicleta37 = (v: { fatos: Record<string, number> }): boolean => v.fatos[CAPITULO_DA_BICICLETA37] !== undefined || v.fatos['bicicleta30'] !== undefined || v.fatos['inf15_bicicleta'] !== undefined;
const fechaCapituloDaBicicleta37 = (v: { fatos: Record<string, number>; t: number }, chave: string): void => {
  if (v.fatos[chave] === undefined) v.fatos[chave] = v.t;
  if (v.fatos[CAPITULO_DA_BICICLETA37] === undefined) v.fatos[CAPITULO_DA_BICICLETA37] = v.t;
};

const g = (p: Pessoa, m: string, f: string) => (p.genero === 'feminino' ? f : m);
const eu = (c: Ctx, m: string, f: string) => (c.v.eu.genero === 'feminino' ? f : m);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const temp = (p: Pessoa) => p.temperamento;
const meses = (c: Ctx, chave: string) => (c.v.fatos[chave] === undefined ? Infinity : c.v.t - c.v.fatos[chave]);

/* ================================================================ a família do par */

/** Os familiares de quem você namora (nascem na primeira vez que são vistos; ficam com o par). */
function familiaDoPar(v: Vida, r: Rng, par: Pessoa): Pessoa[] {
  const f = (par.familia30 ??= { ids: [] });
  const vivos = f.ids.map(id => v.pessoas[id]).filter((x): x is Pessoa => !!x?.vivo);
  if (vivos.length || f.ids.length) return vivos;
  const ip = idadePessoa(v, par);
  const out: Pessoa[] = [];
  const mae = criarPessoa(v, r, { idade: clamp(ip + r.int(22, 34), 38, 95), genero: 'feminino', municipioId: par.municipioId, sobrenome: par.sobrenome });
  out.push(mae);
  if (r.chance(0.65)) out.push(criarPessoa(v, r, { idade: clamp(ip + r.int(24, 37), 40, 95), genero: 'masculino', municipioId: par.municipioId, sobrenome: par.sobrenome }));
  if (r.chance(0.5)) out.push(criarPessoa(v, r, { idade: clamp(ip + r.int(-6, 6), 12, 90), genero: r.chance(0.5) ? 'feminino' : 'masculino', municipioId: par.municipioId, sobrenome: par.sobrenome }));
  for (const p of out) vincular(v, p, { origem: 'apresentado', proximidade: 22, estagio: 'conhecido', ...(idadePessoa(v, p) > ip + 15 ? { parentesco: 'sogro' as const } : {}) });
  f.ids = out.map(p => p.id);
  return out;
}

/** O que um familiar acha de você, nesse primeiro encontro (−30..+30): o jeito dele, o seu trabalho, a idade, a fama, a escolha. */
function impressao(v: Vida, r: Rng, quem: Pessoa, escolha: 'sincero' | 'impressionar' | 'timido'): number {
  const t = temp(quem);
  let x = t.afabilidade * 14 + r.normal() * 7;
  const trabalho = v.trabalho.atual;
  if (!trabalho && idade(v) >= 24 && !v.educacao.matricula) x -= 8 * (1 + Math.max(0, -t.abertura));
  if (trabalho && trabalho.salario >= 6000) x += 4;
  if ((v.justica?.antecedentes ?? []).some(a2 => a2.desfecho !== 'absolvicao' && !a2.reabilitado)) x -= 14;
  if (escolha === 'impressionar') x += t.abertura > 0 ? 3 : -6 + (t.estabilidade < 0 ? -3 : 0);
  if (escolha === 'sincero') x += t.afabilidade > -0.1 ? 6 : 1;
  if (escolha === 'timido') x += t.extroversao < 0 ? 4 : -3;
  return Math.round(clamp(x, -30, 30) * 10) / 10;
}
const reacao = (x: number, p: Pessoa) => (x >= 12 ? `${p.nome} gostou de você de cara — e disse isso na frente de todo mundo` : x >= 3 ? `${p.nome} foi simpátic${g(p, 'o', 'a')}, com curiosidade` : x > -6 ? `${p.nome} ficou observando, sem se decidir` : x > -15 ? `${p.nome} fez perguntas demais — e com um pé atrás` : `${p.nome} mal escondeu a desaprovação`);
const quemE = (v: Vida, p: Pessoa, par: Pessoa) => { const i = idadePessoa(v, p); const ip = idadePessoa(v, par); return i > ip + 15 ? (p.genero === 'feminino' ? 'a mãe' : 'o pai') : (p.genero === 'feminino' ? 'a irmã' : 'o irmão'); };

const papelParSemFamilia = Object.assign((v: Vida): Pessoa[] => vinculosVivos(v).filter(x => x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio) && v.t - x.vin.romance.tEstagio >= 6 && !x.p.familia30?.conheceu).map(x => x.p), { fixo: true });
const papelParConheceu = Object.assign((v: Vida): Pessoa[] => vinculosVivos(v).filter(x => x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio) && x.p.familia30?.conheceu !== undefined).map(x => x.p), { fixo: true });
const papelParSemApresentar = Object.assign((v: Vida): Pessoa[] => vinculosVivos(v).filter(x => x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio) && v.t - x.vin.romance.tEstagio >= 4 && x.p.familia30?.apresentado === undefined).map(x => x.p), { fixo: true });
const papelParApresentado = Object.assign((v: Vida): Pessoa[] => vinculosVivos(v).filter(x => x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio) && x.p.familia30?.apresentado !== undefined && x.p.familia30.opiniao === undefined).map(x => x.p), { fixo: true });

function pioresDaFamilia(v: Vida, par: Pessoa): { p: Pessoa; x: number }[] {
  const im = par.familia30?.impressao ?? {};
  return Object.entries(im).map(([id, x]) => ({ p: v.pessoas[id], x })).filter(y => y.p?.vivo).sort((a, b) => a.x - b.x);
}

/** Conhecer a família: cada familiar reage do seu jeito; o par sente; tudo fica lembrado com peso. */
function conhecerFamilia(c: Ctx, escolha: 'sincero' | 'impressionar' | 'timido'): { texto: string; tom: 'bom' | 'ruim' | 'neutro'; memoria: string } {
  const par = c.p.par;
  const fam = familiaDoPar(c.v, c.r, par);
  const f = par.familia30!;
  f.conheceu = c.v.t;
  f.impressao = {};
  const frases: string[] = [];
  let soma = 0;
  for (const p of fam) {
    const x = impressao(c.v, c.r, p, escolha);
    f.impressao[p.id] = x;
    soma += x;
    const vin = c.v.vinculos[p.id];
    if (vin) { vin.proximidade = clamp(vin.proximidade + Math.round(x / 3)); vin.confianca = clamp(vin.confianca + Math.round(x / 4)); vin.tensao = clamp(vin.tensao + Math.max(0, Math.round(-x / 3))); }
    lembrarCom(c.v, p.id, x >= 3 ? 'O primeiro almoço juntos: boa impressão.' : x <= -6 ? 'O primeiro almoço juntos: ficou um pé atrás.' : 'O primeiro almoço juntos.', x <= -6 ? 'conflito' : 'inicio', Math.abs(x) >= 12 ? 2 : 1);
    frases.push(`${cap(quemE(c.v, p, par))} — ${reacao(x, p)}.`);
  }
  const media = soma / Math.max(1, fam.length);
  prox(c, 'par', media >= 3 ? 5 : media <= -6 ? -2 : 2);
  lembrarCom(c.v, par.id, `Levou você para conhecer a família.`, 'ritual', 2);
  const perguntas = c.v.trabalho.atual ? `"E você trabalha com o quê?" veio antes da sobremesa` : c.v.educacao.matricula ? `"E a faculdade, termina quando?" veio antes da sobremesa` : `"E você faz o quê da vida?" veio antes da sobremesa`;
  return {
    texto: `${perguntas}. ${frases.join(' ')} ${media >= 3 ? `Na volta, ${par.nome} não parava de sorrir.` : media <= -6 ? `Na volta, ${par.nome} ficou quiet${g(par, 'o', 'a')} no carro.` : `Na volta, ${par.nome} disse: "foi bem, eu acho".`}`,
    tom: media >= 3 ? 'bom' : media <= -6 ? 'ruim' : 'neutro',
    memoria: `Conheceu a família de ${par.nome}.`
  };
}

/* ================================================================ apresentar o par à sua família */

function apresentar(c: Ctx, jeito: 'preparar' | 'natural' | 'avisar'): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const par = c.p.par;
  const f = (par.familia30 ??= { ids: [] });
  f.apresentado = c.v.t;
  f.aprovacao = {};
  const pais = vinculosVivos(c.v).filter(x => x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai').map(x => x.p);
  const irmao = vinculosVivos(c.v).find(x => x.vin.parentesco === 'irmao' && idadePessoa(c.v, x.p) >= 8)?.p;
  const ip = idadePessoa(c.v, par);
  const dif = Math.abs(ip - idade(c.v));
  const partes: string[] = [];
  let soma = 0;
  for (const p of pais) {
    const t = temp(p);
    let x = t.afabilidade * 12 + c.r.normal() * 7 + (jeito === 'preparar' ? 4 : jeito === 'avisar' ? 2 : 0) - (dif >= 12 ? 8 + Math.max(0, -t.abertura) * 8 : 0) + (par.renda > 0 || idadePessoa(c.v, par) < 22 ? 2 : -4);
    x = Math.round(clamp(x, -30, 30));
    f.aprovacao[p.id] = x;
    soma += x;
    partes.push(x >= 10 ? `${p.nome} adorou ${par.nome} — já perguntou da próxima visita` : x >= 0 ? `${p.nome} fez as perguntas de sempre (o trabalho, a família, os planos) e pareceu satisfeit${g(p, 'o', 'a')}` : x >= -12 ? `${p.nome} foi educad${g(p, 'o', 'a')}, mas com uma ruga de preocupação${dif >= 12 ? ' (a diferença de idade não passou batida)' : ''}` : `${p.nome} foi frio${g(p, '', 'a')} do começo ao fim`);
    lembrarCom(c.v, p.id, `Conheceu ${par.nome}.`, 'inicio', 1);
  }
  if (irmao) partes.push(`${irmao.nome} não perdeu a chance: contou aquela história constrangedora sua, na frente de todo mundo`);
  const media = pais.length ? soma / pais.length : 5;
  const acolhido = media >= 0 || c.r.chance(0.3);
  const vinPar = c.v.vinculos[par.id];
  if (vinPar) { vinPar.proximidade = clamp(vinPar.proximidade + (acolhido ? 4 : -1)); if (!acolhido) vinPar.tensao = clamp(vinPar.tensao + 3); }
  lembrarCom(c.v, par.id, acolhido ? 'Foi bem recebid' + g(par, 'o', 'a') + ' pela sua família.' : 'Não se sentiu bem-vind' + g(par, 'o', 'a') + ' na sua família.', acolhido ? 'ritual' : 'conflito', 2);
  return { texto: `${partes.length ? cap(partes.join('. ')) + '.' : 'O almoço foi tranquilo.'} ${acolhido ? `${par.nome} saiu dizendo que se sentiu em casa.` : `Na saída, ${par.nome} disse que se sentiu numa entrevista de emprego.`}`, tom: media >= 5 ? 'bom' : media < -8 ? 'ruim' : 'neutro' };
}

/* ================================================================ lembranças reais */

/** Uma lembrança da infância (biografia, antes dos 12), escrita como aconteceu. */
function lembrancaDaInfancia(v: Vida): string | undefined {
  const fim = v.eu.tNasc + 12 * 12;
  const xs = v.biografia.filter(e => e.t <= fim && (e.relevancia === 'marco' || e.relevancia === 'biografia') && e.tom !== 'ruim' && e.texto.length < 140 && !/nasceu|nascimento/i.test(e.texto));
  if (!xs.length) return undefined;
  const e = xs[Math.floor(rngDe(v.id, 'lembr30', v.t).next() * xs.length)];
  return `${e.texto.replace(/\.$/, '')} (${anoDe(e.t)})`;
}
/** A conquista recente (marco bom do último ano). */
function conquistaRecente(v: Vida): { id: string; texto: string } | undefined {
  for (let i = v.biografia.length - 1; i >= 0; i--) {
    const e = v.biografia[i];
    if (v.t - e.t > 12) break;
    if (e.relevancia === 'marco' && e.tom === 'bom' && !/morr|perd|demit|separ/i.test(e.texto) && v.fatos[`conq30_${e.id}`] === undefined) return { id: e.id, texto: e.texto.replace(/\.$/, '') };
  }
  return undefined;
}

/* ================================================================ papéis próprios */

const filhoAdultoComConquista = Object.assign((v: Vida): Pessoa[] => filhos(v).filter(f => f.vivo && idadePessoa(v, f) >= 18 && (f.vida?.trajetoria ?? []).some(x => v.t - x.t <= 12 && (x.tipo === 'promocao' || x.tipo === 'estudo'))), { fixo: true });
const netoPequeno = P.neto(4, 14);
const amigoAntigo = Object.assign((v: Vida): Pessoa[] => vinculosVivos(v).filter(x => !x.vin.parentesco && (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo') && v.t - (x.vin.tInicio ?? v.t) >= 12 * 30).map(x => x.p), { fixo: true });
const amigoSumido = Object.assign((v: Vida): Pessoa[] => vinculosVivos(v).filter(x => !x.vin.parentesco && x.vin.estagio === 'amigo_proximo' && v.t - x.vin.tUltimoContato >= 20 && x.p.municipioId === v.moradia.municipioId).map(x => x.p), { fixo: true });
const amigoInvejoso = Object.assign((v: Vida): Pessoa[] => vinculosVivos(v).filter(x => !x.vin.parentesco && (x.vin.estagio === 'amigo' || x.vin.estagio === 'colega' || x.vin.estagio === 'amigo_proximo') && ((x.vin.rivalidade ?? 0) >= 20 || x.p.temperamento.afabilidade < -0.25)).map(x => x.p), { fixo: true });
const turmaDaEscola = Object.assign((v: Vida): Pessoa[] => vinculosVivos(v).filter(x => (x.vin.origem === 'escola' || x.vin.origem === 'faculdade' || !!x.vin.formacao) && !x.vin.parentesco).map(x => x.p), { fixo: true });

const mudou = (v: Vida) => v.mente.estresse >= 70 || (v.fatos['vis_polemica'] !== undefined && v.t - v.fatos['vis_polemica'] <= 12) || (v.notoriedade?.valor ?? 0) >= 40 || (v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined);

export const ACONTECIMENTOS_30_VIDA: Conteudo[] = [
  /* ================================================================ infância */
  {
    id: 'inf30_cabana', manual: true, tipo: 'decisao', idade: [5, 10], tema: 'infancia', peso: 3,
    papeis: { irmao: P.comIdade(P.irmaoEmCasa, 4, 14) },
    titulo: 'A cabana',
    texto: c => `Num sábado de chuva, ${c.p.irmao.nome} teve a ideia: uma cabana na sala, com os lençóis de todo mundo e as cadeiras da cozinha. Falta decidir quem manda nela.`,
    opcoes: [
      { id: 'junto', texto: 'Construir junto, dividindo tudo', comportamento: { sociabilidade: 1, empatia: 1 },
        resolver: c => ({ texto: 'A cabana caiu duas vezes e ficou de pé até o domingo à noite. Vocês dormiram lá dentro.', memoria: `A cabana de lençóis na sala com ${c.p.irmao.nome}.`, relevancia: 'biografia', tom: 'bom', lembrar: ['irmao', 'A cabana de lençóis na sala, num sábado de chuva.', 'antigo'], efeito: () => { prox(c, 'irmao', 6); feliz(c, 4); } }) },
      { id: 'mandar', texto: 'Ser o dono da cabana', comportamento: { independencia: 1, empatia: -1 },
        resolver: c => ({ texto: `Você decidiu as regras. ${c.p.irmao.nome} brincou um pouco e foi chorar no quarto. A cabana ficou grande — e vazia.`, memoria: null, tom: 'neutro', efeito: () => { prox(c, 'irmao', -3); tensao(c, 'irmao', 4); } }) }
    ]
  },
  {
    id: 'inf30_aniversario', manual: true, tipo: 'decisao', idade: [6, 11], tema: 'infancia', peso: 3,
    papeis: { adulto: P.genitorEmCasa },
    titulo: 'A festa de aniversário',
    texto: c => `O aniversário está chegando, e ${c.p.adulto.nome} perguntou como você quer a festa. ${['vulneravel', 'baixa'].includes(c.v.origem.classe) ? 'Dinheiro curto: dá um bolo e um refrigerante.' : 'Dá para fazer alguma coisa.'}`,
    opcoes: [
      { id: 'turma', texto: 'Convidar a turma toda da escola', comportamento: { sociabilidade: 1 },
        resolver: c => { const cheia = c.r.chance(0.7); return { texto: cheia ? 'A casa encheu. Teve bexiga estourada, choro, brigadeiro no chão e o melhor dia do ano.' : 'Metade da turma não apareceu. Os que vieram fizeram a festa valer — mas você contou quem faltou.', memoria: cheia ? 'Teve uma festa de aniversário com a turma toda.' : null, relevancia: 'biografia', tom: cheia ? 'bom' : 'neutro', efeito: () => { feliz(c, cheia ? 6 : -2); prox(c, 'adulto', 3); } }; } },
      { id: 'pequena', texto: 'Só os melhores amigos e a família', comportamento: { familia: 1 },
        resolver: c => ({ texto: 'Pouca gente, bolo caseiro, a vela soprada na segunda tentativa. Do jeito que você queria.', memoria: null, tom: 'bom', lembrar: ['adulto', 'Fez o seu bolo de aniversário em casa.', 'ritual'], efeito: () => { feliz(c, 3); prox(c, 'adulto', 4); } }) },
      { id: 'passeio', texto: 'Trocar a festa por um passeio', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `${c.p.adulto.nome} levou você ao lugar que você escolheu. Foi o primeiro aniversário de que você se lembra inteiro.`, memoria: 'Trocou a festa de aniversário por um passeio.', relevancia: 'biografia', tom: 'bom', efeito: () => { feliz(c, 4); prox(c, 'adulto', 5); } }) }
    ]
  },
  {
    id: 'inf30_bicicleta', manual: true, tipo: 'decisao', idade: [5, 9], tema: 'infancia', peso: 2,
    papeis: { adulto: P.genitorEmCasa },
    quando: c => !jaAprendeuDeBicicleta37(c.v),
    titulo: 'Sem rodinhas',
    texto: c => `${c.p.adulto.nome} tirou as rodinhas da bicicleta e segurou no banco: "eu não solto, prometo".`,
    opcoes: [
      { id: 'tentar', texto: 'Pedalar, mesmo com medo', comportamento: { coragem: 1 },
        resolver: c => ({ texto: `Na terceira volta, você olhou para trás e ${c.p.adulto.nome} estava longe, batendo palma. Tinha soltado havia tempo.`, memoria: `Aprendeu a andar de bicicleta com ${c.p.adulto.nome}.`, relevancia: 'biografia', tom: 'bom', lembrar: ['adulto', 'Soltou o banco da bicicleta sem você perceber.', 'apoio'], efeito: () => { fechaCapituloDaBicicleta37(c.v, 'bicicleta30'); feliz(c, 5); prox(c, 'adulto', 5); } }) },
      { id: 'depois', texto: 'Pedir para pôr as rodinhas de volta', comportamento: { coragem: -1 },
        resolver: c => ({ texto: 'As rodinhas voltaram. Você aprendeu um ano depois, sozinh' + eu(c, 'o', 'a') + ', escondid' + eu(c, 'o', 'a') + ' na rua de trás.', memoria: null, efeito: () => { fechaCapituloDaBicicleta37(c.v, 'bicicleta30'); } }) }
    ]
  },
  {
    id: 'inf30_avos', manual: true, tipo: 'decisao', idade: [4, 11], tema: 'familia', peso: 3,
    papeis: { avo: P.avo },
    quando: c => (c.p.avo ? idadePessoa(c.v, c.p.avo) < 88 : true),
    titulo: c => `As férias com ${c.p.avo.nome}`,
    texto: c => `Nas férias, ${c.p.avo.nome} chamou você para passar uns dias na casa ${g(c.p.avo, 'dele', 'dela')}: o quintal, as histórias de antigamente, a comida de domingo todo dia.`,
    opcoes: [
      { id: 'ir', texto: 'Ir e ficar a semana inteira', comportamento: { familia: 1 },
        resolver: c => ({ texto: `${c.p.avo.nome} ensinou um jogo de cartas antigo, contou como conheceu ${g(c.p.avo, 'a sua avó', 'o seu avô')} e deixou você ficar acordad${eu(c, 'o', 'a')} até tarde.`, memoria: `Passou as férias na casa de ${c.p.avo.nome}.`, relevancia: 'biografia', tom: 'bom', lembrar: ['avo', 'As férias na casa dela, o jogo de cartas, as histórias.'.replace('dela', g(c.p.avo, 'dele', 'dela')), 'ritual'], efeito: () => { prox(c, 'avo', 8); feliz(c, 4); } }) },
      { id: 'pouco', texto: 'Ir só no fim de semana (os amigos estão aqui)', resolver: c => ({ texto: `Foi bom — e curto. ${c.p.avo.nome} disse "da próxima vez, mais tempo".`, memoria: null, efeito: () => { prox(c, 'avo', 2); } }) }
    ]
  },
  {
    id: 'inf30_briga_irmao', manual: true, tipo: 'decisao', idade: [6, 12], tema: 'familia', peso: 2,
    papeis: { irmao: P.comIdade(P.irmaoEmCasa, 4, 16) },
    titulo: c => `A briga com ${c.p.irmao.nome}`,
    texto: c => `${c.p.irmao.nome} quebrou o seu brinquedo preferido — sem querer, segundo ${g(c.p.irmao, 'ele', 'ela')}. Em casa, só vocês dois.`,
    opcoes: [
      { id: 'perdoar', texto: c => `Ficar brav${eu(c, 'o', 'a')} e depois perdoar`, comportamento: { empatia: 1 }, resolver: c => ({ texto: `Uma hora de silêncio e depois a paz, com um pacote de biscoito dividido. ${c.p.irmao.nome} prometeu consertar (não consertou).`, memoria: null, tom: 'neutro', efeito: () => { prox(c, 'irmao', 2); } }) },
      { id: 'vingar', texto: 'Quebrar uma coisa dele de volta', comportamento: { impulsividade: 1, empatia: -1 }, resolver: c => ({ texto: 'A guerra durou o fim de semana e acabou com os dois de castigo. Até hoje cada um conta a história de um jeito.', memoria: `Uma guerra de irmãos com ${c.p.irmao.nome} que acabou em castigo.`, relevancia: 'biografia', tom: 'ruim', lembrar: ['irmao', 'A guerra dos brinquedos, de castigo os dois.', 'conflito'], efeito: () => { tensao(c, 'irmao', 8); } }) },
      { id: 'contar', texto: 'Contar para os adultos', comportamento: { disciplina: 1 }, resolver: c => ({ texto: `${c.p.irmao.nome} ficou de castigo e passou dias chamando você de dedo-duro.`, memoria: null, efeito: () => { tensao(c, 'irmao', 4); } }) }
    ]
  },

  /* ================================================================ adolescência */
  {
    id: 'ado30_primeira_festa', manual: true, tipo: 'decisao', idade: [13, 16], tema: 'amizade', peso: 3,
    papeis: { amigo: P.amigo, adulto: P.genitorEmCasa },
    quando: c => c.v.fatos['festa30'] === undefined,
    titulo: 'A primeira festa',
    texto: c => `${c.p.amigo.nome} chamou para a festa de quinze anos de uma colega, sábado, até meia-noite. ${c.p.adulto.nome} disse que pode — "mas meia-noite é meia-noite".`,
    opcoes: [
      { id: 'ir', texto: 'Ir e voltar na hora', comportamento: { disciplina: 1, sociabilidade: 1 }, resolver: c => ({ texto: 'Você dançou mal, riu muito e estava na porta de casa às 23h58. Ganhou crédito para a próxima.', memoria: 'A primeira festa da adolescência.', relevancia: 'biografia', tom: 'bom', lembrar: ['amigo', 'A primeira festa, juntos.', 'amizade'], efeito: () => { c.v.fatos['festa30'] = c.v.t; prox(c, 'amigo', 5); prox(c, 'adulto', 2); feliz(c, 5); } }) },
      { id: 'tarde', texto: 'Ficar até o fim (e inventar uma desculpa)', comportamento: { impulsividade: 1 }, resolver: c => { const pego = c.r.chance(0.6); return { texto: pego ? `${c.p.adulto.nome} estava acordad${g(c.p.adulto, 'o', 'a')} na sala. A desculpa não colou: um mês sem sair.` : 'Ninguém percebeu. A festa foi a melhor do ano — e o susto de entrar pela janela também.', memoria: pego ? 'Voltou tarde da primeira festa e ficou de castigo.' : null, relevancia: 'biografia', tom: pego ? 'ruim' : 'bom', efeito: () => { c.v.fatos['festa30'] = c.v.t; prox(c, 'amigo', 6); if (pego) { tensao(c, 'adulto', 8); feliz(c, -2); } else feliz(c, 5); } }; } },
      { id: 'nao', texto: 'Não ir: festa não é a sua', resolver: c => ({ texto: `Na segunda, todo mundo falava da festa. ${c.p.amigo.nome} contou tudo — com detalhes que você nem pediu.`, memoria: null, efeito: () => { c.v.fatos['festa30'] = c.v.t; prox(c, 'amigo', -1); } }) }
    ]
  },
  {
    id: 'ado30_pressao', manual: true, tipo: 'decisao', idade: [13, 17], tema: 'escolha', peso: 2,
    papeis: { amigo: P.amigo },
    titulo: 'A turma decidiu',
    texto: c => `A turma combinou de matar a última aula para ir ao shopping. ${c.p.amigo.nome} olhou para você: "vai ficar aí sozinh${eu(c, 'o', 'a')}?"`,
    opcoes: [
      { id: 'ir', texto: 'Ir junto', comportamento: { impulsividade: 1, sociabilidade: 1 }, resolver: c => { const pego = c.r.chance(0.35); return { texto: pego ? 'A escola ligou para casa. A tarde no shopping custou uma semana de explicação.' : 'Ninguém soube. A tarde foi boa, e a aula perdida caiu na prova.', memoria: null, tom: pego ? 'ruim' : 'neutro', efeito: () => { prox(c, 'amigo', 4); const b = c.v.educacao.basica; if (b) b.desempenho = clamp(b.desempenho - 2); if (pego) estresse(c, 5); } }; } },
      { id: 'ficar', texto: 'Ficar na aula', comportamento: { disciplina: 1, independencia: 1 }, resolver: c => ({ texto: `Você ficou. ${c.p.amigo.nome} zoou por dois dias e depois pediu a matéria emprestada.`, memoria: null, efeito: () => { const b = c.v.educacao.basica; if (b) b.desempenho = clamp(b.desempenho + 1); } }) }
    ]
  },
  {
    id: 'ado30_primeiro_dinheiro', manual: true, tipo: 'decisao', idade: [14, 17], tema: 'dinheiro', peso: 2,
    papeis: { vizinho: P.qualquer(P.tioOuPrimo, P.avo) },
    quando: c => !c.v.trabalho.atual && c.v.fatos['dinheiro30'] === undefined,
    titulo: 'O primeiro dinheiro',
    texto: c => `${c.p.vizinho.nome} ofereceu um dinheiro para você ajudar nas férias (${local(c, 400)}) — arrumar o depósito, entregar encomendas, cuidar da loja de manhã.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar e guardar tudo', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Três semanas de trabalho e o primeiro dinheiro seu, contado nota por nota.', memoria: 'Ganhou o primeiro dinheiro trabalhando nas férias.', relevancia: 'biografia', tom: 'bom', lembrar: ['vizinho', 'Deu o primeiro trabalho de férias.', 'apoio'], efeito: () => { c.v.fatos['dinheiro30'] = c.v.t; dinheiro(c, local(c, 400)); feliz(c, 4); } }) },
      { id: 'gastar', texto: 'Aceitar e gastar no que sempre quis', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: 'O dinheiro durou uma tarde — e o tênis, três anos.', memoria: 'Comprou com o primeiro dinheiro uma coisa que queria muito.', relevancia: 'biografia', tom: 'bom', efeito: () => { c.v.fatos['dinheiro30'] = c.v.t; feliz(c, 6); } }) },
      { id: 'nao', texto: 'Recusar: as férias são para descansar', resolver: c => ({ texto: `${c.p.vizinho.nome} chamou um primo. Você ficou com o tempo — e sem o dinheiro.`, memoria: null, efeito: () => { c.v.fatos['dinheiro30'] = c.v.t; } }) }
    ]
  },
  {
    id: 'ado30_hora', manual: true, tipo: 'decisao', idade: [15, 17], tema: 'familia', peso: 2,
    papeis: { adulto: P.genitorEmCasa },
    titulo: 'A hora de voltar',
    texto: c => `${c.p.adulto.nome} quer você em casa às dez. Todo mundo da turma volta à meia-noite. A conversa começou na cozinha e ficou alta.`,
    opcoes: [
      { id: 'negociar', texto: 'Negociar: onze, com mensagem na saída', comportamento: { empatia: 1 }, resolver: c => { const ok = temp(c.p.adulto).afabilidade > -0.2 || c.r.chance(0.4); return { texto: ok ? `${c.p.adulto.nome} pensou e topou — "uma vez atrasou, volta para as dez".` : `${c.p.adulto.nome} não cedeu. Mas lembrou da conversa, e meses depois a hora mudou.`, memoria: null, tom: ok ? 'bom' : 'neutro', efeito: () => { prox(c, 'adulto', ok ? 3 : 1); tensao(c, 'adulto', -2); } }; } },
      { id: 'brigar', texto: 'Bater a porta', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: 'Dois dias sem se falar. A regra ficou a mesma — e o clima, pior.', memoria: null, tom: 'ruim', efeito: () => { tensao(c, 'adulto', 8); } }) },
      { id: 'aceitar', texto: 'Aceitar as dez', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Você voltou às dez, resmungando. Ganhou confiança — e perdeu algumas histórias.', memoria: null, efeito: () => { prox(c, 'adulto', 2); } }) }
    ]
  },

  /* ================================================================ juventude */
  {
    id: 'jov30_sair_de_casa', manual: true, tipo: 'decisao', idade: [21, 30], tema: 'casa', peso: 3,
    papeis: { adulto: P.genitorEmCasa },
    quando: c => !!c.v.trabalho.atual && c.v.financas.conta >= local(c, 4000) && ['pais', 'parente'].includes(c.v.moradia.tipo),
    titulo: 'Sair de casa?',
    texto: c => `No jantar, ${c.p.adulto.nome} perguntou, meio sem jeito: "e você, pensa em ter o seu canto?". Não era pressão — ou era um pouco.`,
    opcoes: [
      { id: 'planejar', texto: 'Dizer que já está procurando', comportamento: { independencia: 1 }, resolver: c => ({ texto: `${c.p.adulto.nome} sorriu com os olhos tristes: "vai ser estranho a casa sem você". (Os aluguéis estão em Casa.)`, memoria: null, tom: 'neutro', efeito: () => { c.v.fatos['quer_sair30'] = c.v.t; prox(c, 'adulto', 2); } }) },
      { id: 'ficar', texto: 'Explicar que ainda é cedo (guardar dinheiro primeiro)', comportamento: { familia: 1 }, resolver: c => ({ texto: `${c.p.adulto.nome} entendeu — e passou a pedir ajuda nas contas da casa.`, memoria: null, efeito: () => { dinheiro(c, -local(c, 300)); prox(c, 'adulto', 1); } }) }
    ]
  },
  {
    id: 'jov30_viagem', manual: true, tipo: 'decisao', idade: [18, 32], tema: 'amizade', peso: 3,
    papeis: { amigo: P.amigoProximo },
    titulo: c => `A viagem com ${c.p.amigo.nome}`,
    texto: c => `${c.p.amigo.nome} propôs: uma semana de estrada, carro emprestado, sem roteiro. Fica em uns ${local(c, 1500)} para cada.`,
    opcoes: [
      { id: 'ir', texto: 'Ir', disponivel: c => (c.v.financas.conta >= local(c, 1500) ? true : 'Não há esse dinheiro agora.'), comportamento: { coragem: 1, sociabilidade: 1 },
        resolver: c => { const perrengue = c.r.chance(0.35); return { texto: perrengue ? 'O carro quebrou no segundo dia, numa cidade de mil habitantes. Foi a melhor parte da viagem — mas só depois.' : 'Estrada, mar, uma cidade que nenhum dos dois conhecia. Voltaram queimados e com histórias para dez anos.', memoria: `Uma viagem de estrada com ${c.p.amigo.nome}.`, relevancia: 'biografia', tom: 'bom', lembrar: ['amigo', perrengue ? 'A viagem em que o carro quebrou.' : 'A viagem de estrada, sem roteiro.', 'ritual'], efeito: () => { dinheiro(c, -local(c, 1500)); prox(c, 'amigo', 8); feliz(c, 7); estresse(c, -6); } }; } },
      { id: 'nao', texto: 'Ficar (as contas, o trabalho)', resolver: c => ({ texto: `${c.p.amigo.nome} foi com outra pessoa. As fotos ficaram bonitas.`, memoria: null, efeito: () => { prox(c, 'amigo', -2); } }) }
    ]
  },
  {
    id: 'jov30_vizinho', manual: true, tipo: 'decisao', idade: [18, 45], tema: 'lugar', peso: 2,
    quando: c => c.v.moradia.tInicio !== undefined && c.v.t - c.v.moradia.tInicio <= 12 && c.v.moradia.tipo !== 'pais',
    titulo: 'A casa nova, o vizinho',
    texto: c => `Primeira semana no endereço novo. ${c.r.chance(0.5) ? 'A vizinha do lado' : 'O vizinho da frente'} bateu com um bolo e uma pergunta: "chegou agora? Quer saber onde fica tudo?".`,
    opcoes: [
      { id: 'conversar', texto: 'Convidar para um café', comportamento: { sociabilidade: 1 }, resolver: c => { const p = criarPessoa(c.v, c.r, { idade: clamp(idade(c.v) + c.r.int(-10, 25), 18, 85), municipioId: c.v.moradia.municipioId }); vincular(c.v, p, { origem: 'vizinhanca', proximidade: 35, estagio: 'conhecido', convivio: ['vizinhanca'] }); lembrarCom(c.v, p.id, 'Recebeu você no prédio novo com um bolo.', 'inicio', 1); return { texto: `${p.nome} contou quem é quem na rua, onde comprar pão e qual vizinho evitar. A casa nova ficou menos estranha.`, memoria: `Conheceu ${p.nome}, vizinh${g(p, 'o', 'a')}, na primeira semana da casa nova.`, relevancia: 'cotidiano', tom: 'bom', efeito: () => feliz(c, 3) }; } },
      { id: 'agradecer', texto: 'Agradecer e fechar a porta', resolver: () => ({ texto: 'O bolo estava ótimo. Vocês se cumprimentam no elevador desde então.', memoria: null }) }
    ]
  },
  {
    id: 'jov30_aperto', manual: true, tipo: 'decisao', idade: [19, 35], tema: 'dinheiro', peso: 2,
    papeis: { adulto: P.genitor },
    quando: c => c.v.financas.conta < local(c, 300) && c.v.moradia.tipo !== 'pais' && c.v.fatos['aperto30'] === undefined,
    titulo: 'O primeiro aperto de verdade',
    texto: c => `O mês acabou antes do dinheiro. A geladeira tem ovo e mostarda. ${c.p.adulto.nome} ligou por acaso, perguntando se está tudo bem.`,
    opcoes: [
      { id: 'pedir', texto: 'Contar e pedir ajuda', comportamento: { familia: 1 }, resolver: c => ({ texto: `${c.p.adulto.nome} mandou o que pôde e um "isso passa". Passou — e ficou a lição.`, memoria: `Pediu ajuda a ${c.p.adulto.nome} num aperto de dinheiro.`, relevancia: 'biografia', tom: 'neutro', lembrar: ['adulto', 'Ajudou num mês em que faltou tudo.', 'apoio'], efeito: () => { c.v.fatos['aperto30'] = c.v.t; dinheiro(c, local(c, 600)); prox(c, 'adulto', 4); } }) },
      { id: 'segurar', texto: 'Dizer que está tudo bem e se virar', comportamento: { independencia: 1 }, resolver: c => ({ texto: 'Arroz, ovo e orgulho por três semanas. Você aprendeu a fazer planilha.', memoria: 'Atravessou sozinh' + eu(c, 'o', 'a') + ' o primeiro aperto de dinheiro.', relevancia: 'biografia', tom: 'neutro', efeito: () => { c.v.fatos['aperto30'] = c.v.t; estresse(c, 6); } }) }
    ]
  },

  /* ================================================================ vida adulta */
  {
    id: 'adu30_churrasco', manual: true, tipo: 'decisao', idade: [25, 60], tema: 'amizade', peso: 3,
    papeis: { amigo: P.amigo },
    titulo: 'O churrasco',
    texto: c => `${c.p.amigo.nome} sugeriu um churrasco no sábado, na sua casa — "você tem o lugar, eu levo a carne". Viriam uns dez.`,
    opcoes: [
      { id: 'sim', texto: 'Fazer o churrasco', comportamento: { sociabilidade: 1, generosidade: 1 }, resolver: c => ({ texto: 'Fumaça, música alta, a discussão de sempre sobre o ponto da carne. Os últimos foram embora às duas da manhã.', memoria: null, tom: 'bom', lembrar: ['amigo', 'O churrasco que foi até de madrugada.', 'ritual'], efeito: () => { dinheiro(c, -local(c, 250)); prox(c, 'amigo', 6); feliz(c, 5); estresse(c, -5); for (const x of vinculosVivos(c.v).filter(y => y.vin.estagio === 'amigo' || y.vin.estagio === 'amigo_proximo').slice(0, 5)) x.vin.proximidade = clamp(x.vin.proximidade + 2); } }) },
      { id: 'fora', texto: 'Propor num lugar alugado, dividindo', resolver: c => ({ texto: 'Saiu mais caro e mais cedo — e ninguém precisou lavar louça.', memoria: null, efeito: () => { dinheiro(c, -local(c, 120)); prox(c, 'amigo', 3); feliz(c, 2); } }) },
      { id: 'nao', texto: 'Desta vez não', resolver: c => ({ texto: `${c.p.amigo.nome} fez na casa de outro. Você viu os vídeos.`, memoria: null, efeito: () => prox(c, 'amigo', -2) }) }
    ]
  },
  {
    id: 'adu30_natal', manual: true, tipo: 'decisao', idade: [22, 75], tema: 'familia', peso: 3,
    papeis: { adulto: P.genitor },
    quando: c => !!parceiro(c.v),
    titulo: 'O Natal de quem?',
    texto: c => `Dezembro chegou com a pergunta de todo ano: o Natal com a sua família ou com a de ${parceiro(c.v)!.p.nome}? ${c.p.adulto.nome} já contou com você.`,
    opcoes: [
      { id: 'meus', texto: 'Com a sua família', resolver: c => { const par = parceiro(c.v)!; par.vin.tensao = clamp(par.vin.tensao + 3); return { texto: `Mesa cheia, a sua família inteira. ${par.p.nome} foi, de boa vontade — e pediu o Réveillon em troca.`, memoria: null, tom: 'neutro', efeito: () => { prox(c, 'adulto', 4); feliz(c, 2); } }; } },
      { id: 'deles', texto: c => `Com a família de ${parceiro(c.v)!.p.nome}`, resolver: c => { const par = parceiro(c.v)!; par.vin.proximidade = clamp(par.vin.proximidade + 3); for (const id of par.p.familia30?.ids ?? []) { const vn = c.v.vinculos[id]; if (vn) vn.proximidade = clamp(vn.proximidade + 3); } return { texto: `${c.p.adulto.nome} disse que entendia. No telefone, à meia-noite, a voz denunciou que nem tanto.`, memoria: null, tom: 'neutro', efeito: () => { tensao(c, 'adulto', 3); } }; } },
      { id: 'juntar', texto: 'Juntar as duas famílias numa mesa só', comportamento: { sociabilidade: 1, familia: 1 }, resolver: c => { const deu = c.r.chance(0.6); return { texto: deu ? 'Gente demais, cadeira de menos, e uma noite que todo mundo lembra. As duas famílias se misturaram.' : 'O tio de um lado discutiu política com a tia do outro. A sobremesa salvou a noite — quase.', memoria: deu ? 'Juntou as duas famílias num Natal.' : 'Um Natal com as duas famílias que terminou em discussão.', relevancia: 'biografia', tom: deu ? 'bom' : 'ruim', efeito: () => { dinheiro(c, -local(c, 400)); prox(c, 'adulto', deu ? 4 : 1); estresse(c, deu ? -2 : 5); } }; } }
    ]
  },
  {
    id: 'adu30_reuniao_escola', manual: true, tipo: 'decisao', idade: [24, 60], tema: 'filhos', peso: 3,
    papeis: { filho: P.filhoEmCasa(6, 16) },
    titulo: c => `A reunião da escola de ${c.p.filho.nome}`,
    texto: c => `A professora de ${c.p.filho.nome} chamou para conversar: ${c.r.chance(0.5) ? `"anda distraíd${g(c.p.filho, 'o', 'a')}, conversa muito"` : `"tem um talento para desenho que pouca gente da turma tem"`}. A reunião é numa terça, às três da tarde.`,
    opcoes: [
      { id: 'ir', texto: 'Ir, mesmo saindo mais cedo do trabalho', comportamento: { familia: 1 }, resolver: c => ({ texto: `Você foi. No caminho de volta, ${c.p.filho.nome} contou da escola mais do que tinha contado no ano inteiro.`, memoria: null, tom: 'bom', lembrar: ['filho', 'Foi à reunião da escola no meio da semana.', 'apoio'], efeito: () => { prox(c, 'filho', 6); estresse(c, 2); } }) },
      { id: 'ligar', texto: 'Pedir para conversar por telefone', resolver: c => ({ texto: 'A conversa foi rápida e prática. Resolveu — mas a professora anotou que você não foi.', memoria: null, efeito: () => prox(c, 'filho', 1) }) }
    ]
  },
  {
    id: 'adu30_reconciliar', manual: true, tipo: 'decisao', idade: [22, 85], tema: 'amor', peso: 3,
    papeis: { par: P.conjuge },
    quando: c => { const vin = c.v.vinculos[c.p.par.id]; return !!vin && vin.tensao >= 40; },
    titulo: c => `A conversa com ${c.p.par.nome}`,
    texto: c => `Faz semanas que vocês se falam só do necessário. Hoje, ${c.p.par.nome} sentou na beira da cama: "a gente precisa conversar — de verdade".`,
    opcoes: [
      { id: 'ouvir', texto: 'Ouvir primeiro, sem se defender', comportamento: { empatia: 1 }, resolver: c => ({ texto: `Saiu tudo: o cansaço, o que ficou sem dizer. Não resolveu numa noite — mas vocês dormiram abraçados pela primeira vez em semanas.`, memoria: `Uma conversa difícil e necessária com ${c.p.par.nome}.`, relevancia: 'biografia', tom: 'bom', lembrar: ['par', 'A noite em que conversaram de verdade.', 'reconciliacao'], efeito: () => { tensao(c, 'par', -18); prox(c, 'par', 4); } }) },
      { id: 'terapia', texto: 'Propor terapia de casal', disponivel: c => (c.v.financas.conta >= local(c, 600) ? true : 'Não há dinheiro para isso agora.'), resolver: c => ({ texto: 'As primeiras sessões foram constrangedoras. A quinta mudou alguma coisa.', memoria: `Fez terapia de casal com ${c.p.par.nome}.`, relevancia: 'biografia', tom: 'bom', efeito: () => { dinheiro(c, -local(c, 600)); tensao(c, 'par', -12); estresse(c, -3); } }) },
      { id: 'fugir', texto: c => `Dizer que está cansad${eu(c, 'o', 'a')} demais hoje`, resolver: c => ({ texto: `${c.p.par.nome} virou para o lado. A conversa ficou para um dia que não chegou.`, memoria: null, tom: 'ruim', efeito: () => { tensao(c, 'par', 6); } }) }
    ]
  },

  /* ================================================================ maturidade */
  {
    id: 'mat30_turma', manual: true, tipo: 'decisao', idade: [40, 70], tema: 'amizade', peso: 3,
    papeis: { colega: turmaDaEscola },
    quando: c => c.v.fatos['turma30'] === undefined || c.v.t - c.v.fatos['turma30'] >= 120,
    titulo: 'O encontro da turma',
    texto: c => `${c.p.colega.nome} organizou o encontro de ${Math.floor((idade(c.v) - 15) / 5) * 5} anos da turma. O grupo de mensagens explodiu de fotos antigas — inclusive uma sua, de franja.`,
    opcoes: [
      { id: 'ir', texto: 'Ir ao encontro', comportamento: { sociabilidade: 1 }, resolver: c => ({ texto: `Uns irreconhecíveis, outros iguais. ${c.p.colega.nome} lembrou de coisas que você tinha esquecido — e você, de coisas que ${g(c.p.colega, 'ele', 'ela')} preferia esquecer.`, memoria: 'Foi ao encontro da turma de escola, décadas depois.', relevancia: 'biografia', tom: 'bom', lembrar: ['colega', 'O encontro da turma, décadas depois.', 'antigo'], efeito: () => { c.v.fatos['turma30'] = c.v.t; prox(c, 'colega', 10); feliz(c, 5); } }) },
      { id: 'grupo', texto: 'Só acompanhar pelo grupo', resolver: c => ({ texto: 'Você riu das fotos, mandou um "que saudade" e não foi.', memoria: null, efeito: () => { c.v.fatos['turma30'] = c.v.t; } }) }
    ]
  },
  {
    id: 'mat30_orgulho', manual: true, tipo: 'decisao', idade: [40, 95], tema: 'filhos', peso: 3,
    papeis: { filho: filhoAdultoComConquista },
    titulo: c => `A conquista de ${c.p.filho.nome}`,
    texto: c => { const x = (c.p.filho.vida?.trajetoria ?? []).filter(y => c.v.t - y.t <= 12 && (y.tipo === 'promocao' || y.tipo === 'estudo')).slice(-1)[0]; return `${c.p.filho.nome} ligou para contar: ${(x?.texto ?? 'uma conquista grande').replace(/\.$/, '').toLowerCase()}. A voz tremia um pouco.`; },
    opcoes: [
      { id: 'dizer', texto: 'Dizer, com todas as letras, o orgulho que sente', comportamento: { empatia: 1 }, resolver: c => ({ texto: `Do outro lado, silêncio — e depois: "eu precisava ouvir isso de você".`, memoria: `Disse a ${c.p.filho.nome} o orgulho que sentia.`, relevancia: 'biografia', tom: 'bom', lembrar: ['filho', 'Disse o orgulho que sentia, com todas as letras.', 'apoio'], efeito: () => { prox(c, 'filho', 8); feliz(c, 6); } }) },
      { id: 'jantar', texto: 'Marcar um jantar de comemoração', resolver: c => ({ texto: 'A família inteira à mesa, brinde e discurso desajeitado. Você pagou a conta, feliz.', memoria: null, tom: 'bom', efeito: () => { dinheiro(c, -local(c, 300)); prox(c, 'filho', 5); feliz(c, 4); } }) },
      { id: 'conselho', texto: 'Parabenizar e já dar conselhos sobre o próximo passo', resolver: c => ({ texto: `${c.p.filho.nome} ouviu, educad${g(c.p.filho, 'o', 'a')}. Depois comentou com o irmão que você nunca consegue só comemorar.`, memoria: null, efeito: () => { prox(c, 'filho', 1); tensao(c, 'filho', 2); } }) }
    ]
  },
  {
    id: 'mat30_aposentadoria', manual: true, tipo: 'decisao', idade: [52, 80], tema: 'trabalho', peso: 4,
    quando: c => !!c.v.trabalho.aposentadoria && c.v.t - c.v.trabalho.aposentadoria.t <= 12 && c.v.fatos['festa_apos30'] === undefined,
    titulo: 'A festa de despedida',
    texto: () => 'Os colegas querem fazer uma despedida da aposentadoria: um bolo no fim do expediente, discurso, presente de vaquinha.',
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar (e fazer um discurso)', comportamento: { sociabilidade: 1 }, resolver: c => ({ texto: 'Você falou dois minutos e chorou em um. Levou para casa um relógio que nunca vai usar e um cartão assinado por gente que você nem sabia que gostava de você.', memoria: 'Teve festa de despedida na aposentadoria.', relevancia: 'marco', tom: 'bom', efeito: () => { c.v.fatos['festa_apos30'] = c.v.t; feliz(c, 7); for (const x of vinculosVivos(c.v).filter(y => y.vin.origem === 'trabalho').slice(0, 6)) x.vin.proximidade = clamp(x.vin.proximidade + 3); } }) },
      { id: 'discreto', texto: 'Pedir algo discreto', resolver: c => ({ texto: 'Um café com os mais próximos. Do jeito que você queria.', memoria: null, efeito: () => { c.v.fatos['festa_apos30'] = c.v.t; feliz(c, 3); } }) }
    ]
  },

  /* ================================================================ velhice */
  {
    id: 'vel30_netos', manual: true, tipo: 'decisao', idade: [55, 100], tema: 'familia', peso: 4,
    papeis: { neto: netoPequeno },
    titulo: c => `O fim de semana com ${c.p.neto.nome}`,
    texto: c => `${c.p.neto.nome} veio passar o fim de semana. Os pais deixaram uma lista de regras na geladeira.`,
    opcoes: [
      { id: 'mimar', texto: 'Ignorar a lista: sorvete no café da manhã', comportamento: { generosidade: 1 }, resolver: c => ({ texto: `${c.p.neto.nome} voltou para casa elétric${g(c.p.neto, 'o', 'a')} e contando tudo. Os pais reclamaram rindo.`, memoria: null, tom: 'bom', lembrar: ['neto', 'O fim de semana do sorvete no café da manhã.', 'ritual'], efeito: () => { prox(c, 'neto', 8); feliz(c, 6); } }) },
      { id: 'ensinar', texto: 'Ensinar uma coisa sua (a receita, o jogo, o ofício)', comportamento: { familia: 1 }, resolver: c => ({ texto: `Você ensinou o que aprendeu com quem veio antes. ${c.p.neto.nome} errou, tentou de novo e prometeu fazer igual quando crescer.`, memoria: `Ensinou uma coisa sua a ${c.p.neto.nome}.`, relevancia: 'biografia', tom: 'bom', lembrar: ['neto', 'Aprendeu com você uma coisa que vem de família.', 'apoio'], efeito: () => { prox(c, 'neto', 7); feliz(c, 5); } }) },
      { id: 'cansaco', texto: 'Deixar a TV fazer companhia', resolver: c => ({ texto: 'O fim de semana passou tranquilo. Faltou alguma coisa que você não sabe dizer o quê.', memoria: null, efeito: () => prox(c, 'neto', 1) }) }
    ]
  },
  {
    id: 'vel30_album', manual: true, tipo: 'decisao', idade: [60, 110], tema: 'familia', peso: 3,
    papeis: { quem: P.qualquer(P.neto(8, 40), P.filho(18)) },
    quando: c => !!lembrancaDaInfancia(c.v),
    titulo: 'O álbum antigo',
    texto: c => `${c.p.quem.nome} achou um álbum de fotos e apontou uma: "isso é você?". Era. E veio a lembrança inteira: ${lembrancaDaInfancia(c.v)!.charAt(0).toLowerCase()}${lembrancaDaInfancia(c.v)!.slice(1)}.`,
    opcoes: [
      { id: 'contar', texto: 'Contar a história inteira', comportamento: { familia: 1 }, resolver: c => ({ texto: `${c.p.quem.nome} ouviu sem mexer no celular. No fim, pediu outra história.`, memoria: `Contou a ${c.p.quem.nome} uma história da própria infância.`, relevancia: 'biografia', tom: 'bom', lembrar: ['quem', 'As histórias do álbum antigo.', 'antigo'], efeito: () => { prox(c, 'quem', 6); feliz(c, 6); } }) },
      { id: 'guardar', texto: 'Sorrir e guardar o álbum', resolver: c => ({ texto: 'Tem lembrança que é melhor guardar só para si.', memoria: null, efeito: () => feliz(c, 2) }) }
    ]
  },
  {
    id: 'vel30_amigo_antigo', manual: true, tipo: 'decisao', idade: [55, 110], tema: 'amizade', peso: 3,
    papeis: { amigo: amigoAntigo },
    titulo: c => `${c.p.amigo.nome}, depois de tanto tempo`,
    texto: c => `${c.p.amigo.nome} e você se conhecem há mais de ${Math.floor((c.v.t - (c.v.vinculos[c.p.amigo.id]?.tInicio ?? c.v.t)) / 120) * 10} anos. ${c.p.amigo.nome} ligou com uma ideia: voltar ao lugar onde vocês se conheceram.`,
    opcoes: [
      { id: 'ir', texto: 'Ir juntos', comportamento: { sociabilidade: 1 }, resolver: c => ({ texto: 'O lugar mudou quase todo. Vocês dois, quase nada. Riram das mesmas coisas de sempre.', memoria: `Voltou com ${c.p.amigo.nome} ao lugar onde se conheceram.`, relevancia: 'biografia', tom: 'bom', lembrar: ['amigo', 'Voltaram juntos ao lugar onde tudo começou.', 'antigo'], efeito: () => { prox(c, 'amigo', 10); feliz(c, 7); estresse(c, -4); } }) },
      { id: 'ligacao', texto: 'Uma ligação longa, de saudade', resolver: c => ({ texto: 'Duas horas no telefone. Ninguém desligou primeiro.', memoria: null, efeito: () => { prox(c, 'amigo', 4); feliz(c, 3); } }) }
    ]
  },

  /* ================================================================ relações: a família do par */
  {
    id: 'rel30_familia_par', manual: true, tipo: 'decisao', idade: [15, 90], tema: 'amor', peso: 8,
    papeis: { par: papelParSemFamilia },
    titulo: c => `A família de ${c.p.par.nome}`,
    texto: c => { const fam = familiaDoPar(c.v, rngDe(c.v.id, 'fam30', c.p.par.id), c.p.par); const desc = fam.map(p => `${quemE(c.v, p, c.p.par)} (${p.nome}, ${temp(p).afabilidade > 0.2 ? 'de riso fácil' : temp(p).afabilidade < -0.2 ? 'de poucas palavras' : temp(p).abertura > 0.2 ? 'curios' + g(p, 'o', 'a') : 'observador' + g(p, '', 'a')})`).join(', '); return `${c.p.par.nome} chamou para um almoço de domingo na casa da família: ${desc || 'a família toda'}. ${c.p.par.nome} avisou: "fica tranquil${eu(c, 'o', 'a')}. Ou não."`; },
    opcoes: [
      { id: 'sincero', texto: c => `Ser você mesm${eu(c, 'o', 'a')}, com sinceridade`, comportamento: { empatia: 1 }, resolver: c => { const x = conhecerFamilia(c, 'sincero'); return { texto: x.texto, memoria: x.memoria, relevancia: 'biografia', tom: x.tom }; } },
      { id: 'impressionar', texto: 'Caprichar para impressionar (presente, assunto preparado)', disponivel: c => (c.v.financas.conta >= local(c, 150) ? true : 'Não há dinheiro para o presente.'), resolver: c => { dinheiro(c, -local(c, 150)); const x = conhecerFamilia(c, 'impressionar'); return { texto: x.texto, memoria: x.memoria, relevancia: 'biografia', tom: x.tom }; } },
      { id: 'timido', texto: c => `Ficar na sua, educad${eu(c, 'o', 'a')} e calad${eu(c, 'o', 'a')}`, resolver: c => { const x = conhecerFamilia(c, 'timido'); return { texto: x.texto, memoria: x.memoria, relevancia: 'biografia', tom: x.tom }; } }
    ]
  },
  {
    id: 'rel30_depois_familia', manual: true, tipo: 'decisao', idade: [15, 90], tema: 'amor', peso: 7,
    papeis: { par: papelParConheceu },
    quando: c => { const f = c.p.par.familia30; const pior = pioresDaFamilia(c.v, c.p.par)[0]; return !!f?.conheceu && c.v.t - f.conheceu >= 6 && c.v.t - f.conheceu <= 48 && !!pior && pior.x <= -6 && meses(c, `depfam30_${c.p.par.id}`) > 36; },
    titulo: c => `O que ${pioresDaFamilia(c.v, c.p.par)[0].p.nome} anda dizendo`,
    texto: c => { const pior = pioresDaFamilia(c.v, c.p.par)[0]; return `${c.p.par.nome} contou, meio sem jeito: ${quemE(c.v, pior.p, c.p.par)} ainda fala daquele almoço — e não do jeito bom. Agora vem o aniversário d${g(pior.p, 'ele', 'ela')}.`; },
    opcoes: [
      { id: 'reaproximar', texto: 'Ir ao aniversário e tentar de novo', comportamento: { empatia: 1 }, resolver: c => { const pior = pioresDaFamilia(c.v, c.p.par)[0]; const deu = temp(pior.p).afabilidade > -0.3 || c.r.chance(0.45); return { texto: deu ? `Você levou um presente pensado, ouviu as histórias d${g(pior.p, 'ele', 'ela')} e riu das piadas. No fim, ${pior.p.nome} disse: "você não é tão ruim assim". Vindo d${g(pior.p, 'ele', 'ela')}, era muito.` : `Você tentou. ${pior.p.nome} continuou com o pé atrás — mas ${c.p.par.nome} viu o esforço.`, memoria: deu ? `Conquistou ${pior.p.nome}, da família de ${c.p.par.nome}, num segundo encontro.` : null, relevancia: 'biografia', tom: deu ? 'bom' : 'neutro', efeito: () => { c.v.fatos[`depfam30_${c.p.par.id}`] = c.v.t; const im = c.p.par.familia30!.impressao!; im[pior.p.id] = deu ? 8 : pior.x + 4; const vn = c.v.vinculos[pior.p.id]; if (vn) { vn.tensao = clamp(vn.tensao - (deu ? 15 : 4)); vn.proximidade = clamp(vn.proximidade + (deu ? 10 : 2)); } prox(c, 'par', 5); if (deu) lembrarCom(c.v, pior.p.id, 'Mudou de opinião sobre você no aniversário.', 'reconciliacao', 2); } }; } },
      { id: 'ignorar', texto: 'Não forçar: com o tempo passa', resolver: c => ({ texto: `${c.p.par.nome} concordou. Os almoços de família seguem educados e frios.`, memoria: null, efeito: () => { c.v.fatos[`depfam30_${c.p.par.id}`] = c.v.t; } }) },
      { id: 'reclamar', texto: '"A sua família é complicada"', resolver: c => ({ texto: `${c.p.par.nome} se calou. Falar mal da família dos outros nunca termina bem.`, memoria: null, tom: 'ruim', efeito: () => { c.v.fatos[`depfam30_${c.p.par.id}`] = c.v.t; tensao(c, 'par', 10); lembrarCom(c.v, c.p.par.id, 'Falou mal da família dele(a).'.replace('dele(a)', g(c.p.par, 'dele', 'dela')), 'conflito', 2); } }) }
    ]
  },
  {
    id: 'rel30_apresentar', manual: true, tipo: 'decisao', idade: [15, 90], tema: 'amor', peso: 7,
    papeis: { par: papelParSemApresentar },
    quando: c => vinculosVivos(c.v).some(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai') && idadePessoa(c.v, x.p) < 100),
    titulo: c => `Apresentar ${c.p.par.nome} à família`,
    texto: c => { const pais = vinculosVivos(c.v).filter(x => x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai').map(x => x.p.nome); return `Chegou a hora: ${c.p.par.nome} vai conhecer ${pais.join(' e ')}. ${c.p.par.nome} perguntou o que levar e como chamar cada um.`; },
    opcoes: [
      { id: 'preparar', texto: 'Preparar tudo: avisar antes, combinar o almoço', comportamento: { familia: 1 }, resolver: c => { const x = apresentar(c, 'preparar'); return { texto: x.texto, memoria: `Apresentou ${c.p.par.nome} à família.`, relevancia: 'biografia', tom: x.tom }; } },
      { id: 'natural', texto: 'Levar num almoço normal de domingo', resolver: c => { const x = apresentar(c, 'natural'); return { texto: x.texto, memoria: `Apresentou ${c.p.par.nome} à família.`, relevancia: 'biografia', tom: x.tom }; } },
      { id: 'avisar', texto: 'Avisar a família dos assuntos a evitar', resolver: c => { const x = apresentar(c, 'avisar'); return { texto: x.texto, memoria: `Apresentou ${c.p.par.nome} à família.`, relevancia: 'biografia', tom: x.tom }; } }
    ]
  },
  {
    id: 'rel30_opiniao', manual: true, tipo: 'decisao', idade: [15, 90], tema: 'familia', peso: 6,
    papeis: { par: papelParApresentado },
    quando: c => { const f = c.p.par.familia30; return !!f?.apresentado && c.v.t - f.apresentado >= 2 && c.v.t - f.apresentado <= 36 && Object.keys(f.aprovacao ?? {}).some(id => c.v.pessoas[id]?.vivo); },
    titulo: c => { const ap = c.p.par.familia30!.aprovacao!; const id = Object.keys(ap).sort((a, b) => Math.abs(ap[b]) - Math.abs(ap[a]))[0]; return `O que ${c.v.pessoas[id].nome} achou`; },
    texto: c => { const ap = c.p.par.familia30!.aprovacao!; const id = Object.keys(ap).sort((a, b) => Math.abs(ap[b]) - Math.abs(ap[a]))[0]; const p = c.v.pessoas[id]; const x = ap[id]; return x >= 8 ? `${p.nome} puxou você num canto: "gostei muito de ${c.p.par.nome}. Cuida bem."` : x >= -4 ? `${p.nome} comentou, ao telefone: "parece boa pessoa. Ainda estou conhecendo."` : `${p.nome} foi direto: "não sei, não. Tenho minhas dúvidas sobre ${c.p.par.nome}." E esperou a sua resposta.`; },
    opcoes: [
      { id: 'agradecer', texto: 'Ouvir e agradecer a sinceridade', comportamento: { empatia: 1 }, resolver: c => { const f = c.p.par.familia30!; f.opiniao = c.v.t; return { texto: 'A conversa terminou num abraço — mesmo quando não concordaram.', memoria: null, tom: 'bom', efeito: () => {} }; } },
      { id: 'defender', texto: c => `Defender ${c.p.par.nome}`, resolver: c => { const f = c.p.par.familia30!; f.opiniao = c.v.t; const ap = f.aprovacao!; const id = Object.keys(ap).sort((a, b) => ap[a] - ap[b])[0]; const pv = c.v.vinculos[id]; const firme = (ap[id] ?? 0) < -4; if (pv && firme) { pv.tensao = clamp(pv.tensao + 6); ap[id] = (ap[id] ?? 0) + 6; } lembrarCom(c.v, c.p.par.id, 'Defendeu você diante da família.', 'apoio', 2); return { texto: firme ? `Você defendeu ${c.p.par.nome} com firmeza. ${c.v.pessoas[id].nome} não gostou do tom — mas passou a olhar com outros olhos.` : `Não precisava defender — mas ${c.p.par.nome} soube, e gostou de saber.`, memoria: firme ? `Defendeu ${c.p.par.nome} diante da família.` : null, relevancia: 'biografia', tom: 'neutro', efeito: () => prox(c, 'par', 4) }; } },
      { id: 'duvidar', texto: 'Deixar a dúvida entrar', resolver: c => { const f = c.p.par.familia30!; f.opiniao = c.v.t; return { texto: `Você ficou pensando no que ouviu. Com ${c.p.par.nome}, algo esfriou — e ${c.p.par.nome} percebeu.`, memoria: null, tom: 'ruim', efeito: () => { tensao(c, 'par', 6); const r = c.v.vinculos[c.p.par.id]?.romance; if (r) r.envolvimento = clamp(r.envolvimento - 6); } }; } }
    ]
  },

  /* ================================================================ relações: reações */
  {
    id: 'rel30_conquista', manual: true, tipo: 'decisao', idade: [14, 100], tema: 'amizade', peso: 5,
    papeis: { amigo: P.amigoProximo, invejoso: amigoInvejoso },
    quando: c => !!conquistaRecente(c.v) && c.p.amigo.id !== c.p.invejoso.id,
    titulo: 'Parabéns — e nem todos',
    texto: c => { const q = conquistaRecente(c.v)!; return `${q.texto}. ${c.p.amigo.nome} foi a primeira pessoa a ligar, aos gritos. ${c.p.invejoso.nome} mandou um "parabéns" seco — e, segundo ouviram, comentou com outros que "foi sorte".`; },
    opcoes: [
      { id: 'comemorar', texto: c => `Comemorar com ${c.p.amigo.nome}`, comportamento: { sociabilidade: 1 }, resolver: c => { const q = conquistaRecente(c.v)!; c.v.fatos[`conq30_${q.id}`] = c.v.t; return { texto: `A comemoração foi do jeito de vocês. ${c.p.amigo.nome} fez um brinde que você vai lembrar.`, memoria: null, tom: 'bom', lembrar: ['amigo', `Comemorou com você: ${q.texto.charAt(0).toLowerCase()}${q.texto.slice(1)}.`, 'apoio'], efeito: () => { prox(c, 'amigo', 6); feliz(c, 4); } }; } },
      { id: 'confrontar', texto: c => `Perguntar a ${c.p.invejoso.nome} o que foi aquilo`, resolver: c => { const q = conquistaRecente(c.v)!; c.v.fatos[`conq30_${q.id}`] = c.v.t; const admite = temp(c.p.invejoso).afabilidade > -0.4 && c.r.chance(0.5); return { texto: admite ? `${c.p.invejoso.nome} ficou vermelh${g(c.p.invejoso, 'o', 'a')} e admitiu: "fiquei com inveja. Desculpa." Foi honesto — e aproximou.` : `${c.p.invejoso.nome} negou tudo e ficou ofendid${g(c.p.invejoso, 'o', 'a')}. A amizade esfriou.`, memoria: null, tom: admite ? 'bom' : 'ruim', efeito: () => { if (admite) { prox(c, 'invejoso', 4); tensao(c, 'invejoso', -6); } else { tensao(c, 'invejoso', 10); prox(c, 'invejoso', -5); } } }; } },
      { id: 'deixar', texto: 'Deixar para lá', resolver: c => { const q = conquistaRecente(c.v)!; c.v.fatos[`conq30_${q.id}`] = c.v.t; return { texto: 'Você guardou a observação. Inveja diz mais de quem sente.', memoria: null, efeito: () => { prox(c, 'invejoso', -2); } }; } }
    ]
  },
  {
    id: 'rel30_mudou', manual: true, tipo: 'decisao', idade: [16, 100], tema: 'amizade', peso: 4,
    papeis: { amigo: P.amigoProximo },
    quando: c => !!mudou(c.v) && meses(c, 'mudou30') > 36,
    titulo: c => `${c.p.amigo.nome} reparou`,
    texto: c => `${c.p.amigo.nome} chamou para um café e foi direto: "você anda diferente. ${c.v.mente.estresse >= 70 ? 'Sempre cansad' + eu(c, 'o', 'a') + ', sempre com pressa.' : (c.v.notoriedade?.valor ?? 0) >= 40 ? 'Desde que ficou conhecid' + eu(c, 'o', 'a') + ', parece que não sobra tempo para os de sempre.' : 'Não sei explicar — mas não é você.'} Tá tudo bem?"`,
    opcoes: [
      { id: 'abrir', texto: 'Admitir e conversar', comportamento: { empatia: 1 }, resolver: c => ({ texto: `A conversa foi longa e boa. ${c.p.amigo.nome} saiu dizendo: "tô aqui, viu?".`, memoria: `${c.p.amigo.nome} percebeu que você andava diferente e perguntou.`, relevancia: 'biografia', tom: 'bom', lembrar: ['amigo', 'Percebeu que você não estava bem e perguntou.', 'apoio'], efeito: () => { c.v.fatos['mudou30'] = c.v.t; prox(c, 'amigo', 6); estresse(c, -5); } }) },
      { id: 'negar', texto: '"Impressão sua"', resolver: c => ({ texto: `${c.p.amigo.nome} não insistiu. Mas a frase ficou na sua cabeça.`, memoria: null, efeito: () => { c.v.fatos['mudou30'] = c.v.t; prox(c, 'amigo', -2); } }) },
      { id: 'irritar', texto: 'Irritar-se com a cobrança', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: `"Só perguntei", disse ${c.p.amigo.nome}, magoad${g(c.p.amigo, 'o', 'a')}. Demorou a ligar de novo.`, memoria: null, tom: 'ruim', efeito: () => { c.v.fatos['mudou30'] = c.v.t; tensao(c, 'amigo', 10); prox(c, 'amigo', -5); } }) }
    ]
  },
  {
    id: 'rel30_sumico', manual: true, tipo: 'decisao', idade: [16, 100], tema: 'amizade', peso: 3,
    papeis: { amigo: amigoSumido },
    titulo: c => `${c.p.amigo.nome} cobrou`,
    texto: c => `Vocês se esbarraram na rua, depois de quase dois anos sem se ver morando na mesma cidade. ${c.p.amigo.nome} sorriu — e depois soltou: "você sumiu, hein. Nem no meu aniversário apareceu."`,
    opcoes: [
      { id: 'desculpas', texto: 'Pedir desculpas e marcar algo de verdade', comportamento: { empatia: 1 }, resolver: c => ({ texto: `Marcaram para sábado — e foram. Em meia hora, era como se não tivesse passado tempo nenhum.`, memoria: null, tom: 'bom', lembrar: ['amigo', 'Reencontraram-se depois de um tempo sumido.', 'reconciliacao'], efeito: () => { prox(c, 'amigo', 8); tensao(c, 'amigo', -6); const vn = c.v.vinculos[c.p.amigo.id]; if (vn) vn.tUltimoContato = c.v.t; } }) },
      { id: 'desculpa_vida', texto: '"A vida tá corrida"', resolver: c => ({ texto: `"A de todo mundo", respondeu ${c.p.amigo.nome}. Combinaram de se ver. Ninguém marcou.`, memoria: null, efeito: () => { prox(c, 'amigo', -3); tensao(c, 'amigo', 3); } }) }
    ]
  }
];

/**
 * O fluxo próprio das cenas da VIDA 30 (sorteio derivado; decisão só num ano sem nenhuma). As cenas de relação (a
 * família do par, a opinião, a conquista) pesam mais quando cabem — elas leem o que já está acontecendo.
 */
const DA_VIDA30 = /^(inf|ado|jov|adu|mat|vel|rel)30_/;
export function vidaDe30DoAno(v: Vida, catalogo: readonly Conteudo[], preparar: (c: Conteudo, v: Vida, r: Rng) => Ctx | null, abrir: (c: Conteudo, ctx: Ctx) => void, semDecisao: boolean): void {
  if (v.morte || !semDecisao) return;
  const i = idade(v);
  const r = rngDe(v.id, 'vida30', v.t);
  if (!r.chance(i < 13 ? 0.32 : i < 18 ? 0.3 : i < 30 ? 0.3 : i < 60 ? 0.26 : 0.32)) return;
  const lista: { c: Conteudo; ctx: Ctx }[] = [];
  for (const c of catalogo) { if (!c.manual || !DA_VIDA30.test(c.id)) continue; const ctx = preparar(c, v, r); if (ctx) lista.push({ c, ctx }); }
  const x = r.weighted(lista, y => (typeof y.c.peso === 'function' ? y.c.peso(y.ctx) : y.c.peso ?? 1));
  if (x) abrir(x.c, x.ctx);
}

