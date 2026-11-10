/**
 * VIDA 13 · FAMA — O MUNDO REAGE E O PASSADO VOLTA. Sorteados só pelo pass anual próprio (`reconhecimento13.mundoReage13`,
 * gerador derivado): `manual`, nunca no sorteio principal — as vidas que não os vivem seguem iguais.
 *
 * REAÇÕES AO NOME (`f13_*`), na medida do nome e pela ORIGEM dele (o atleta recebe a marca esportiva; a empresária, a
 * parceria; o político, a cobrança): a campanha paga (valor pelo nome, alcance, imagem e país), a participação especial,
 * o convite de fora, a parceria e a palestra, a pressão por posição, gente que quer conhecer você (vira gente da sua
 * vida), o fotógrafo na porta, o boato com alguém de verdade, a vaia de quem rejeita, a homenagem de quem admira, a
 * mobilização de uma causa. Anônimo não recebe nenhuma.
 *
 * O PASSADO QUE VOLTA (`h13_*`), sempre lido de um registro (palmarés, obras, mandatos, empregos, marcos guardados) e com
 * as pessoas que existem: os anos redondos do título, a controvérsia que a entrevista traz de volta, o negócio que
 * fechou virando história, a empresa que você deixou, o rival e o amigo de antes que aparecem quando o nome cresce, a
 * obra redescoberta, o mandato lembrado na feira. Sem registro, não acontece.
 */
import { palavrasDoEsporte } from '../sistemas/esportes129';
import type { Conteudo, Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { dinheiro as fmt, dinheiroCurto, flex } from '../texto';
import { estresse, feliz, local, prox, tensao } from './efeitos';
import { idadePessoa, lembrarCom, parceiro, vinculosVivos } from '../nucleo';
import { anoDe } from '../tempo';
import { municipio } from '../dados/lugares';
import { oClube } from '../dados/clubes';
import { faixaDaNotoriedade, origemDoNome, porOrigem, somarAoNome } from '../sistemas/notoriedade';
import { apresentarAlguem, descricaoOrigem } from '../sistemas/social';
import { desgastar } from '../sistemas/desgastePolitico';
import { naPolitica, nomeCargo, NOME_PRIORIDADE } from '../sistemas/politica';
import { causasPossiveis } from '../sistemas/visibilidade';
import { disponivel, pagar } from '../sistemas/dinheiro';
import { contasAtivas, publicoReal } from '../sistemas/redesBase';
import { prestigioProfissional } from '../sistemas/fama';
import {
  controversiaAntiga13, deuCertoDepois13, empregoDeixado13, fracassoAntigo13, imagemDaFama13, leituraDaFama13, mandatoLembrado13,
  marcosDaFama13, obraAntiga13, origemPrincipal13, receberDaFama13, superarControversia13, tituloDeAniversario13, valorDaCampanha13,
  type OrigemDaFama13
} from '../sistemas/reconhecimento13';
import * as P from './papeis';

const noto = (v: Vida) => v.notoriedade?.valor ?? 0;
const orig = (v: Vida): OrigemDaFama13 | undefined => origemPrincipal13(v);
const daArte = (o?: OrigemDaFama13) => o === 'artistica' || o === 'musical';
const rej = (v: Vida) => imagemDaFama13(v)?.rejeicao ?? 0;
const adm = (v: Vida) => imagemDaFama13(v)?.admiracao ?? 0;
const preso = (v: Vida) => !!v.justica?.prisao;
const seguidores = (v: Vida) => contasAtivas(v).filter(c => c.plataforma !== 'onlyfans').reduce((s, c) => s + publicoReal(c), 0);
/** O motivo do nome em que a fama soma (o que alimenta o nome; sem fonte, a origem). */
const fonte = (v: Vida) => v.notoriedade?.fonte ?? origemDoNome(v) ?? 'arte';
const o = (p: Pessoa) => flex(p.genero, 'o', 'a', 'e');
const semAno = (s: string) => s.replace(/ \(\d{4}\)$/, '');
const anoDoMarco = (s: string) => /\((\d{4})\)$/.exec(s)?.[1] ?? '';

/** A maior empresa ativa da pessoa (a que o mercado vê). */
const empresaDoMercado = (v: Vida) => (v.financas.empresas ?? []).filter(e => (e.estado === 'operando' || e.estado === 'em_crise') && e.papel !== 'investidor').sort((a, b) => (b.avaliacao ?? 0) - (a.avaliacao ?? 0))[0];

/** Quem pediu para conhecer você: um perfil pela origem do nome (determinístico pelo ano). */
const PERFIS_QUE_QUEREM: Record<OrigemDaFama13, [string, 'masculino' | 'feminino'][]> = {
  esportiva: [['ex-jogador que virou comentarista', 'masculino'], ['treinadora de base', 'feminino'], ['empresário do ramo esportivo', 'masculino']],
  artistica: [['diretora de teatro', 'feminino'], ['roteirista', 'masculino'], ['produtora de elenco', 'feminino']],
  musical: [['produtor musical', 'masculino'], ['cantora da nova geração', 'feminino'], ['técnico de som conhecido no meio', 'masculino']],
  empresarial: [['investidor', 'masculino'], ['fundadora de outra empresa', 'feminino'], ['executivo do setor', 'masculino']],
  politica: [['liderança comunitária', 'feminino'], ['jornalista político', 'masculino'], ['assessora experiente', 'feminino']],
  digital: [['criadora de conteúdo', 'feminino'], ['dono de agência', 'masculino'], ['fotógrafa', 'feminino']],
  feito: [['jornalista esportivo', 'masculino'], ['escritora de biografias', 'feminino']],
  controversia: [['advogado de imagem', 'masculino'], ['jornalista investigativa', 'feminino']]
};
const quemQuer = (v: Vida) => { const l = PERFIS_QUE_QUEREM[orig(v) ?? 'digital']; return l[Math.floor(rngDe(v.id, 'f13_quem', v.t).next() * l.length)]; };

/** O rival ou o ex-amigo de anos atrás, sem contato há três anos ou mais. */
const rivalAntigo = (v: Vida) => vinculosVivos(v).filter(x => !x.p.especie && !x.vin.parentesco && (x.vin.estagio === 'rival' || x.vin.estagio === 'ex_amigo') && v.t - x.vin.tUltimoContato >= 36 && v.t - x.vin.tInicio >= 96 && idadePessoa(v, x.p) >= 18).map(x => x.p);
/** O amigo de antes da fama (da escola, do bairro, da faculdade), sem contato há quatro anos ou mais. */
const amigoDeAntes = (v: Vida) => {
  const fama = v.fatos['noto_faixa_2'] ?? v.t;
  return vinculosVivos(v).filter(x => !x.p.especie && !x.vin.parentesco && !x.vin.romance && x.vin.tInicio < fama - 24 && v.t - x.vin.tUltimoContato >= 48
    && !['rival', 'ex_amigo'].includes(x.vin.estagio ?? '') && x.vin.historia.length > 0 && idadePessoa(v, x.p) >= 18).map(x => x.p);
};
/** O colega do emprego deixado (alguém que você conheceu no trabalho durante aquele período). */
const colegaDoEmprego = (v: Vida): Pessoa | undefined => {
  const e = empregoDeixado13(v);
  const h = e && v.trabalho.historico.find(x => x.empregador === e.empregador && anoDe(x.tFim) === e.ano);
  if (!h) return undefined;
  return vinculosVivos(v).find(x => !x.vin.parentesco && x.vin.origem === 'trabalho' && x.vin.tInicio >= h.tInicio && x.vin.tInicio <= h.tFim)?.p;
};
/** O marco bom recente (dois anos), que o rival viu. */
const marcoRecenteBom = (v: Vida) => [...marcosDaFama13(v)].reverse().find(m => m.peso > 0 && v.t - m.t <= 24 && m.tipo !== 'causa');

/** O cachê de uma palestra: pelo nome — com um piso de evento corporativo da cidade. */
const cachePalestra = (c: Ctx) => Math.max(local(c, 8000), valorDaCampanha13(c.v, 0.3));

const ondeViu = (v: Vida) => ({ esportiva: 'num jogo na TV', artistica: 'numa novela', musical: 'num show na TV', empresarial: 'numa reportagem sobre a sua empresa', politica: 'no noticiário', digital: 'nas redes', feito: 'no noticiário', controversia: 'no noticiário' })[orig(v) ?? 'digital'];

export const ACONTECIMENTOS_13_FAMA: Conteudo[] = [
  /* ============================================================ REAÇÕES AO NOME */
  {
    id: 'f13_patrocinio', manual: true, tipo: 'decisao', idade: [16, 80], tema: 'trabalho', repetir: 3, peso: 3,
    quando: c => noto(c.v) >= 30 && ['esportiva', 'artistica', 'musical', 'digital', 'feito'].includes(orig(c.v) ?? '') && !c.v.caminhos.politica?.mandato && rej(c.v) < 45 && !preso(c.v),
    titulo: 'Uma marca quer você',
    texto: c => {
      const quem = { esportiva: 'Uma marca de material esportivo quer o seu rosto na campanha da temporada: fotos, um comercial, a sua frase no outdoor.', artistica: 'Uma marca de cosméticos quer você como rosto da campanha do ano.', musical: 'Uma marca de bebidas quer uma música sua no comercial — e você nele.', digital: 'Uma marca de roupas quer uma série de publicações e um encontro com quem segue você.', feito: 'Um banco quer contar o seu feito num comercial de rede nacional.' }[orig(c.v) as 'esportiva'];
      return `${quem} Oferecem ${fmt(valorDaCampanha13(c.v))}.`;
    },
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { sociabilidade: 1 },
        consequencia: c => `${fmt(valorDaCampanha13(c.v))} na conta. O rosto fica mais conhecido — e a agenda, mais cheia.`,
        resolver: c => {
          const valor = valorDaCampanha13(c.v);
          return { texto: `Dois dias de estúdio, uma semana de entrevistas. ${dinheiroCurto(valor)} na conta.`, memoria: `Fez a campanha de uma marca (${dinheiroCurto(valor)}).`, relevancia: 'cotidiano', tom: 'bom',
            efeito: () => { receberDaFama13(c.v, valor, 'Campanhas e publicidade'); somarAoNome(c.v, fonte(c.v), 2); c.v.fatos['vis_publicidade'] = c.v.t; estresse(c, 2); } };
        } },
      { id: 'negociar', texto: 'Pedir mais', comportamento: { coragem: 1 },
        consequencia: c => `Pode subir para uns ${dinheiroCurto(Math.round(valorDaCampanha13(c.v) * 1.35))} — ou a marca procurar outro rosto.`,
        resolver: c => {
          const valor = Math.round(valorDaCampanha13(c.v) * 1.35);
          const chance = clamp(0.35 + adm(c.v) / 200 - rej(c.v) / 200 + (faixaDaNotoriedade(noto(c.v)) - 2) * 0.1, 0.1, 0.8);
          if (!rngDe(c.v.id, 'f13_negociar', c.v.t).chance(chance)) return { texto: 'A marca agradeceu e fechou com outra pessoa. O mercado conversa: da próxima vez, o primeiro número pode ser menor.', memoria: null, tom: 'ruim', efeito: () => estresse(c, 2) };
          return { texto: `Pediram um dia para pensar e voltaram com o "sim". ${dinheiroCurto(valor)} na conta.`, memoria: `Negociou a campanha de uma marca (${dinheiroCurto(valor)}).`, relevancia: 'cotidiano', tom: 'bom',
            efeito: () => { receberDaFama13(c.v, valor, 'Campanhas e publicidade'); somarAoNome(c.v, fonte(c.v), 2); c.v.fatos['vis_publicidade'] = c.v.t; estresse(c, 2); } };
        } },
      { id: 'recusar', texto: 'Recusar', comportamento: { independencia: 1 },
        resolver: () => ({ texto: 'Você disse que não. Nem todo dinheiro vale o rosto num produto que você não usa.', memoria: null }) }
    ]
  },
  {
    id: 'f13_participacao', manual: true, tipo: 'decisao', idade: [16, 85], tema: 'trabalho', repetir: 3, peso: 2.5,
    quando: c => noto(c.v) >= 30 && daArte(orig(c.v)) && !preso(c.v),
    titulo: 'Uma participação especial',
    texto: c => orig(c.v) === 'musical'
      ? `Um artista maior que você chamou você para cantar com ele num show de estádio. Cachê de ${fmt(valorDaCampanha13(c.v, 0.5))}.`
      : `Uma novela quer você numa participação especial: três capítulos, um papel pequeno que o público vai notar. Cachê de ${fmt(valorDaCampanha13(c.v, 0.5))}.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar',
        resolver: c => {
          const valor = valorDaCampanha13(c.v, 0.5);
          return { texto: orig(c.v) === 'musical' ? 'Quarenta mil pessoas cantaram o refrão com vocês. Você não esquece.' : 'Três capítulos, uma cena que circulou. O telefone tocou mais na semana seguinte.', memoria: orig(c.v) === 'musical' ? 'Cantou num show de estádio a convite de outro artista.' : 'Fez uma participação especial numa novela.', relevancia: 'biografia', tom: 'bom',
            efeito: () => { receberDaFama13(c.v, valor, 'Participações e cachês avulsos'); somarAoNome(c.v, 'arte', 3); const a = c.v.caminhos.arte; if (a?.ativo) a.publico = clamp(a.publico + 4); estresse(c, 3); feliz(c, 3); } };
        } },
      { id: 'recusar', texto: 'Recusar — o trabalho próprio vem antes', comportamento: { independencia: 1 },
        resolver: () => ({ texto: 'Você agradeceu. O convite fica; a agenda também.', memoria: null }) }
    ]
  },
  {
    id: 'f13_internacional', manual: true, tipo: 'decisao', idade: [18, 85], tema: 'trabalho', repetir: 4, peso: 2,
    quando: c => leituraDaFama13(c.v).alcance === 'fora do país' && !preso(c.v),
    titulo: 'Um convite de fora',
    texto: c => ({
      esportiva: 'A federação internacional quer você como embaixador do próximo torneio mundial: uma semana fora, câmeras do mundo inteiro.',
      artistica: 'Um festival no exterior convidou você para a abertura — tapete, coletiva, uma plateia que não fala a sua língua.',
      musical: 'Um festival no exterior quer você no palco principal.',
      empresarial: 'Um fórum econômico internacional chamou você para um painel com gente que só se vê no noticiário.',
      politica: 'Uma conferência internacional convidou você para falar sobre o seu país.',
      digital: 'Uma plataforma chamou você para um encontro global de criadores.',
      feito: 'Do exterior, um convite: contar o seu feito numa cerimônia transmitida para vários países.',
      controversia: 'Uma TV estrangeira quer uma entrevista longa — a sua versão da história.'
    })[orig(c.v) ?? 'feito'].replace('embaixador', flex(c.v.eu.tratamento ?? c.v.eu.genero, 'embaixador', 'embaixadora', 'embaixadore')),
    opcoes: [
      { id: 'ir', texto: 'Ir',
        consequencia: c => (orig(c.v) === 'politica' ? 'Uma semana fora. O nome atravessa a fronteira.' : `Uma semana fora, um cachê de uns ${dinheiroCurto(valorDaCampanha13(c.v, 0.4))}. O nome atravessa a fronteira.`),
        resolver: c => ({ texto: 'Fuso trocado, inglês no limite, uma foto sua no jornal de lá. Voltou com o nome maior.', memoria: 'Foi convidad' + flex(c.v.eu.tratamento ?? c.v.eu.genero, 'o', 'a', 'e') + ' para um evento internacional.', relevancia: 'biografia', tom: 'bom',
          efeito: () => { if (orig(c.v) !== 'politica') receberDaFama13(c.v, valorDaCampanha13(c.v, 0.4), 'Convites e eventos'); somarAoNome(c.v, fonte(c.v), 2); feliz(c, 4); estresse(c, 3); if (orig(c.v) === 'politica' && c.v.caminhos.politica) c.v.caminhos.politica.reputacao = clamp(c.v.caminhos.politica.reputacao + 3); } }) },
      { id: 'recusar', texto: 'Recusar', resolver: () => ({ texto: 'Você ficou. Haverá outros convites — ou não.', memoria: null }) }
    ]
  },
  {
    id: 'f13_mercado', manual: true, tipo: 'decisao', idade: [20, 85], tema: 'trabalho', repetir: 3, peso: 3,
    // O mercado olha o balanço antes do nome: a dona de uma empresa grande recebe a proposta mesmo pouco conhecida.
    quando: c => noto(c.v) >= 10 && !!empresaDoMercado(c.v) && (orig(c.v) === 'empresarial' || noto(c.v) >= 25) && (empresaDoMercado(c.v)!.avaliacao ?? 0) >= 1e6,
    titulo: 'O mercado bateu à porta',
    texto: c => `Um grupo grande do mesmo ramo quer uma parceria com ${empresaDoMercado(c.v)!.nome}: distribuição junto, as duas marcas na mesma frase. ${noto(c.v) >= 30 ? 'O seu nome pesou no convite.' : 'O balanço chamou atenção.'}`,
    opcoes: [
      { id: 'parceria', texto: 'Fechar a parceria',
        consequencia: () => 'Pode dar caixa e reputação — ou um ano de atrito com um sócio maior que você.',
        resolver: c => {
          const e = empresaDoMercado(c.v)!;
          const ok = rngDe(c.v.id, 'f13_mercado', c.v.t).chance(clamp(0.45 + (e.reputacao - 50) / 200 + adm(c.v) / 400 - rej(c.v) / 300, 0.15, 0.8));
          if (!ok) return { texto: `A parceria azedou em um ano: prazos, cobranças, o nome de ${e.nome} num atraso que não era seu.`, memoria: `Uma parceria de ${e.nome} com um grupo maior deu errado.`, relevancia: 'biografia', tom: 'ruim', efeito: () => { e.reputacao = clamp(e.reputacao - 3); estresse(c, 4); } };
          const entra = Math.round(Math.min(Math.max(0, e.avaliacao ?? 0) * 0.01, 5e7));
          return { texto: `A parceria saiu. ${e.nome} apareceu onde nunca tinha chegado${entra > 0 ? `, e entraram ${dinheiroCurto(entra)} no caixa da empresa` : ''}.`, memoria: `Fechou uma parceria de ${e.nome} com um grupo grande do ramo.`, relevancia: 'biografia', tom: 'bom', efeito: () => { e.reputacao = clamp(e.reputacao + 5); e.caixa += entra; } };
        } },
      { id: 'recusar', texto: 'Seguir sozinho', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `${empresaDoMercado(c.v)!.nome} segue do seu jeito. O grupo procurou a concorrência.`, memoria: null }) }
    ]
  },
  {
    id: 'f13_palestra', manual: true, tipo: 'decisao', idade: [25, 85], tema: 'trabalho', repetir: 4, peso: 2,
    quando: c => (noto(c.v) >= 35 || (noto(c.v) >= 20 && orig(c.v) === 'empresarial')) && !preso(c.v) && !c.v.caminhos.politica?.mandato && (orig(c.v) === 'empresarial' || orig(c.v) === 'politica' || orig(c.v) === 'feito' || (orig(c.v) === 'esportiva' && c.v.caminhos.esporte?.fase !== 'profissional')),
    titulo: 'Uma palestra',
    texto: c => `Um evento corporativo quer uma palestra sua: uma hora sobre ${({ empresarial: 'como você construiu o que construiu', politica: 'os anos de vida pública', feito: 'o seu feito', esportiva: 'o que o esporte ensinou' } as Record<string, string>)[orig(c.v)!]}. Pagam ${fmt(cachePalestra(c))}.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar',
        resolver: c => ({ texto: 'Uma hora de palco, uma fila de fotos depois. A plateia riu nas partes certas.', memoria: null, tom: 'bom', efeito: () => { receberDaFama13(c.v, cachePalestra(c), 'Palestras e conselhos'); estresse(c, 1); } }) },
      { id: 'recusar', texto: 'Recusar', resolver: () => ({ texto: 'Você recusou. Falar de si mesmo cansa.', memoria: null }) }
    ]
  },
  {
    id: 'f13_pressao', manual: true, tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 2, peso: 3,
    quando: c => noto(c.v) >= 30 && naPolitica(c.v) && (orig(c.v) === 'politica' || !!c.v.caminhos.politica?.mandato),
    titulo: 'Todo mundo quer saber o que você pensa',
    texto: c => `Um assunto tomou conta da cidade — ${c.v.caminhos.politica?.prioridade ? NOME_PRIORIDADE[c.v.caminhos.politica.prioridade] : 'o assunto do momento'} — e cobram a sua posição. Jornalistas na porta, mensagens do partido, gente que votou em você esperando.`,
    opcoes: [
      { id: 'posicionar', texto: 'Posicionar-se com clareza', comportamento: { coragem: 1 },
        consequencia: () => 'Quem concorda aplaude; quem discorda não esquece.',
        resolver: c => {
          const p = c.v.caminhos.politica!;
          const ok = rngDe(c.v.id, 'f13_pressao', c.v.t).chance(clamp(0.45 + p.reputacao / 300 + adm(c.v) / 300 - rej(c.v) / 300, 0.15, 0.85));
          if (ok) return { texto: 'A sua fala virou referência no debate. Uma parte da cidade passou a ver você de outro jeito.', memoria: null, tom: 'bom', efeito: () => { p.apoio = clamp(p.apoio + 4); c.v.fatos['vis_boa'] = c.v.t; } };
          return { texto: 'Uma frase sua foi recortada e virou munição dos adversários por semanas.', memoria: 'Uma posição pública sua virou munição dos adversários.', relevancia: 'biografia', tom: 'ruim', efeito: () => { desgastar(p, 5, 'exposicao'); c.v.fatos['vis_polemica'] = c.v.t; estresse(c, 4); } };
        } },
      { id: 'partido', texto: 'Esperar a posição do partido', resolver: c => ({ texto: 'A cobrança não esperou o partido. Chamaram de omissão.', memoria: null, efeito: () => desgastar(c.v.caminhos.politica!, 2, 'partido') }) },
      { id: 'silencio', texto: 'Não falar sobre isso', comportamento: { independencia: 1 }, resolver: c => ({ texto: 'O silêncio também foi lido — e não do jeito que você queria.', memoria: null, efeito: () => desgastar(c.v.caminhos.politica!, 3, 'exposicao') }) }
    ]
  },
  {
    id: 'f13_quer_conhecer', manual: true, tipo: 'decisao', idade: [18, 85], tema: 'amizade', repetir: 3, peso: 2.5,
    quando: c => noto(c.v) >= 30 && !preso(c.v),
    titulo: 'Alguém quer conhecer você',
    texto: c => { const [perfil, g] = quemQuer(c.v); return `${g === 'feminino' ? 'Uma' : 'Um'} ${perfil} pediu a um amigo em comum para apresentar vocês: acompanha você ${porOrigem(c.v) || 'há tempos'} e quer conversar.`; },
    opcoes: [
      { id: 'conhecer', texto: 'Topar o encontro', comportamento: { sociabilidade: 1 },
        resolver: c => {
          const [perfil, g] = quemQuer(c.v);
          const p = apresentarAlguem(c.v, rngDe(c.v.id, 'f13_conhecer', c.v.t), { idade: [28, 62], genero: g, origem: 'apresentado' });
          p.ocupacao = perfil;
          lembrarCom(c.v, p.id, `Apresentados por um amigo em comum: ${o(p) === 'a' ? 'ela' : o(p) === 'o' ? 'ele' : 'elu'} quis conhecer você.`, 'inicio', 1);
          return { texto: `Um café com ${p.nome} que durou a tarde. Gente do meio, com assunto de sobra.`, memoria: `Conheceu ${p.nome}, ${perfil}, que pediu para ser apresentad${o(p)}.`, relevancia: 'cotidiano', tom: 'bom', efeito: () => feliz(c, 2) };
        } },
      { id: 'recusar', texto: 'Agradecer e deixar para outra hora', resolver: () => ({ texto: 'Você agradeceu. Nem todo mundo que quer conhecer você precisa conhecer.', memoria: null }) }
    ]
  },
  {
    // O nome pequeno também é notado — na medida dele: a rádio da cidade, o jornal do bairro.
    id: 'f13_local', manual: true, tipo: 'decisao', idade: [16, 90], tema: 'trabalho', repetir: 4, peso: 3,
    quando: c => noto(c.v) >= 10 && noto(c.v) < 35 && !preso(c.v),
    titulo: 'A cidade quer ouvir você',
    texto: c => `${({ esportiva: 'O programa de esporte da rádio da cidade', artistica: 'O caderno de cultura do jornal da cidade', musical: 'A rádio da cidade', empresarial: 'O jornal da associação comercial', politica: 'Um podcast sobre a cidade', digital: 'Um portal de notícias da cidade', feito: 'A TV local', controversia: 'Um portal de notícias da cidade' } as Record<OrigemDaFama13, string>)[orig(c.v) ?? 'digital']} quer uma entrevista: meia hora sobre o que você faz e como começou.`,
    opcoes: [
      { id: 'aceitar', texto: 'Dar a entrevista', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: 'Meia hora que virou uma. No dia seguinte, a moça da padaria comentou.', memoria: null, tom: 'bom', efeito: () => { somarAoNome(c.v, fonte(c.v), 1.5); feliz(c, 2); } }) },
      { id: 'recusar', texto: 'Agradecer e recusar', resolver: () => ({ texto: 'Você agradeceu. Fica para quando tiver mais o que contar.', memoria: null }) }
    ]
  },
  {
    id: 'f13_paparazzi_par', manual: true, tipo: 'acontecimento', idade: [18, 90], tema: 'amor', repetir: 3,
    peso: (c: Ctx) => 1 + (noto(c.v) - 55) / 15,
    papeis: { par: P.parceiro },
    quando: c => noto(c.v) >= 55,
    narrar: c => {
      const recolhido = c.v.fatos['vis_privacidade'] !== undefined && c.v.t - c.v.fatos['vis_privacidade'] <= 12;
      return { texto: `Uma foto sua com ${c.p.par.nome}, num fim de tarde qualquer, saiu num site de fofoca com uma legenda inventada. ${c.p.par.nome} não pediu para virar notícia.${recolhido ? ' Nem no ano de recolhimento deu para escapar.' : ''}`, relevancia: 'cotidiano', tom: 'ruim',
        lembrar: ['par', 'A foto de vocês no site de fofoca.', 'conflito'], efeito: x => { tensao(x, 'par', 4); estresse(x, 3); } };
    }
  },
  {
    id: 'f13_paparazzi', manual: true, tipo: 'acontecimento', idade: [18, 90], tema: 'lazer', repetir: 3,
    peso: (c: Ctx) => 0.8 + (noto(c.v) - 55) / 20,
    quando: c => noto(c.v) >= 55 && !parceiro(c.v),
    narrar: c => ({ texto: noto(c.v) >= 78 ? 'Um fotógrafo esperou na porta do prédio por dois dias. A foto de você de chinelo, com o lixo na mão, rodou o país.' : 'Um fotógrafo seguiu você do restaurante até em casa. A foto saiu no dia seguinte, com a legenda errada.', relevancia: 'cotidiano', tom: 'ruim', efeito: x => estresse(x, 3) })
  },
  {
    id: 'f13_boato', manual: true, tipo: 'decisao', idade: [18, 85], tema: 'amizade', repetir: 5, peso: 2,
    papeis: { quem: P.comIdade(P.qualquer(P.amigo, P.colegaDe('trabalho')), 18) },
    quando: c => noto(c.v) >= 40 && !!c.p.quem && c.v.vinculos[c.p.quem.id]?.romance === undefined,
    titulo: 'Um boato com nome e sobrenome',
    texto: c => { const par = parceiro(c.v); return `Um perfil de fofoca publicou que você e ${c.p.quem.nome} estão juntos${par && par.p.id !== c.p.quem.id ? ` — e ${par.p.nome} leu antes de você` : ''}. Não é verdade, e ${c.p.quem.nome} está recebendo mensagens de desconhecidos.`; },
    opcoes: [
      { id: 'desmentir', texto: `Desmentir junto com a outra pessoa`, comportamento: { coragem: 1 },
        resolver: c => {
          const par = parceiro(c.v);
          const ok = rngDe(c.v.id, 'f13_boato', c.v.t).chance(clamp(0.55 + adm(c.v) / 300 - rej(c.v) / 250, 0.2, 0.85));
          return ok
            ? { texto: `A nota de vocês dois encerrou o assunto. ${c.p.quem.nome} riu do susto — depois.`, memoria: null, tom: 'bom', efeito: () => { prox(c, 'quem', 3); if (par && par.p.id !== c.p.quem.id) par.vin.tensao = clamp(par.vin.tensao + 1); } }
            : { texto: 'O desmentido virou mais combustível: agora eram duas histórias.', memoria: `Um boato sobre você e ${c.p.quem.nome} virou assunto por semanas.`, relevancia: 'biografia', tom: 'ruim', efeito: () => { c.v.fatos['vis_polemica'] = c.v.t; tensao(c, 'quem', 4); if (par && par.p.id !== c.p.quem.id) par.vin.tensao = clamp(par.vin.tensao + 5); estresse(c, 5); } };
        } },
      { id: 'ignorar', texto: 'Não responder', comportamento: { independencia: 1 },
        resolver: c => { const par = parceiro(c.v); return { texto: `O assunto morreu sozinho em três semanas. ${c.p.quem.nome} ficou com a parte chata: as mensagens.`, memoria: null, efeito: () => { tensao(c, 'quem', 3); if (par && par.p.id !== c.p.quem.id) par.vin.tensao = clamp(par.vin.tensao + 3); estresse(c, 2); } }; } },
      { id: 'processar', texto: 'Processar o perfil',
        disponivel: c => (disponivel(c.v) >= local(c, 12000) ? true : 'Não há dinheiro para o advogado agora.'),
        consequencia: c => `Advogado: uns ${fmt(local(c, 12000))}. Demora.`,
        resolver: c => ({ texto: 'A retratação saiu meses depois, menor que o estrago. Mas saiu — e o perfil apagou.', memoria: 'Processou um perfil de fofoca e ganhou a retratação.', relevancia: 'biografia', tom: 'neutro', efeito: () => { pagar(c.v, local(c, 12000)); prox(c, 'quem', 2); estresse(c, 3); } }) }
    ]
  },
  {
    id: 'f13_vaia', manual: true, tipo: 'acontecimento', idade: [18, 95], tema: 'trabalho', repetir: 3,
    peso: (c: Ctx) => rej(c.v) / 20,
    quando: c => noto(c.v) >= 30 && rej(c.v) >= 40,
    narrar: c => {
      const m = [...marcosDaFama13(c.v)].reverse().find(x => x.tipo === 'controversia');
      return { texto: `Num evento, parte do público vaiou quando o seu nome foi anunciado.${m ? ` ${semAno(m.texto)}${anoDoMarco(m.texto) ? `, em ${anoDoMarco(m.texto)},` : ''} ainda pesa.` : ''}`.replace(',,', ','), relevancia: 'biografia', tom: 'ruim',
        efeito: x => { estresse(x, 5); feliz(x, -3); const n = x.v.caminhos.negocio; if (n && n.estado !== 'fechado') n.reputacao = clamp((n.reputacao ?? 40) - 2); const p = x.v.caminhos.politica; if (p && naPolitica(x.v)) p.apoio = clamp(p.apoio - 2); } };
    }
  },
  {
    id: 'f13_homenagem', manual: true, tipo: 'acontecimento', idade: [20, 99], tema: 'lazer', repetir: 6, peso: 1.5,
    quando: c => noto(c.v) >= 40 && adm(c.v) >= 55,
    narrar: c => {
      const natal = municipio(c.v.eu.municipioNatal).nome;
      const t = ({
        esportiva: `Uma escolinha de ${natal} passou a ter o seu nome na quadra. Mandaram a foto da placa.`,
        feito: `Uma escolinha de ${natal} passou a ter o seu nome na quadra. Mandaram a foto da placa.`,
        artistica: `A escola de artes de ${natal} batizou uma sala com o seu nome.`,
        musical: `A escola de música de ${natal} batizou uma sala com o seu nome.`,
        empresarial: 'A associação comercial da cidade deu a você o prêmio de empreendedor do ano.',
        politica: `A câmara de ${natal} aprovou o título de cidadão honorário para você.`,
        digital: 'Um projeto social usou um vídeo seu para abrir as inscrições — e lotou em um dia.',
        controversia: `Em ${natal}, apesar de tudo, ainda falam de você com carinho.`
      } as Record<OrigemDaFama13, string>)[orig(c.v) ?? 'digital'];
      return { texto: t, relevancia: 'biografia', tom: 'bom', efeito: x => { feliz(x, 5); x.v.fatos['vis_boa'] = x.v.t; } };
    }
  },
  {
    id: 'f13_mobilizar', manual: true, tipo: 'decisao', idade: [18, 90], tema: 'escolha', repetir: 4, peso: 2,
    quando: c => (noto(c.v) >= 50 || seguidores(c.v) >= 500_000) && noto(c.v) >= 25 && rej(c.v) < 55 && !preso(c.v),
    titulo: 'Chame o seu público',
    texto: c => `Uma organização que trabalha com ${causasPossiveis(c.v)[0].nome} pede que você chame o seu público para uma campanha de arrecadação. Quem segue você ouve.`,
    opcoes: [
      { id: 'mobilizar', texto: 'Fazer o chamado', comportamento: { sociabilidade: 1 },
        consequencia: c => `Pode juntar uns ${dinheiroCurto(valorDaCampanha13(c.v, 0.8))} para a causa (não para você).`,
        resolver: c => {
          const total = valorDaCampanha13(c.v, 0.8);
          const causa = causasPossiveis(c.v)[0].nome;
          const torto = rej(c.v) >= 35 && rngDe(c.v.id, 'f13_mobilizar', c.v.t).chance(0.35);
          const p = c.v.caminhos.politica;
          if (torto) return { texto: `A arrecadação andou, mas parte do público chamou de autopromoção. Juntaram ${dinheiroCurto(Math.round(total * 0.5))}.`, memoria: `Chamou o público para ${causa} — e foi acusad${flex(c.v.eu.tratamento ?? c.v.eu.genero, 'o', 'a', 'e')} de autopromoção.`, relevancia: 'biografia', tom: 'neutro', efeito: () => { c.v.fatos['vis_polemica'] = c.v.t; } };
          return { texto: `Em uma semana, ${dinheiroCurto(total)} para ${causa}. A organização mandou a foto do que o dinheiro virou.`, memoria: `Mobilizou o público para ${causa}: ${dinheiroCurto(total)} arrecadados.`, relevancia: 'biografia', tom: 'bom',
            efeito: () => { c.v.fatos['vis_boa'] = c.v.t; somarAoNome(c.v, fonte(c.v), 1); feliz(c, 4); if (p && naPolitica(c.v)) p.apoio = clamp(p.apoio + 3); } };
        } },
      { id: 'recusar', texto: 'Não agora', resolver: () => ({ texto: 'Você explicou que não dava agora. Ficaram de chamar de novo.', memoria: null }) }
    ]
  },

  /* ============================================================ O PASSADO QUE VOLTA */
  {
    id: 'h13_titulo', manual: true, tipo: 'decisao', idade: [24, 99], tema: 'lazer', repetir: 5, peso: 4,
    quando: c => !!tituloDeAniversario13(c.v),
    titulo: c => `${tituloDeAniversario13(c.v)!.anos} anos daquele título`,
    texto: c => { const t = tituloDeAniversario13(c.v)!; return `Faz ${t.anos} anos: ${t.texto.charAt(0).toLowerCase()}${t.texto.slice(1)}${t.clube ? ` com ${oClube(t.clube)}` : ''}. ${t.doClube ? 'O clube' : 'A federação'} chamou quem estava lá para uma homenagem antes de um jogo.`; },
    opcoes: [
      { id: 'ir', texto: 'Ir à homenagem',
        resolver: c => { const t = tituloDeAniversario13(c.v)!; const lugar = { piscina: 'O parque aquático', quadra: 'O ginásio', tatame: 'O ginásio', pista: 'A arquibancada' }[palavrasDoEsporte(c.v.caminhos.esporte?.modalidade).onde] ?? 'O estádio'; return { texto: `${lugar} gritou o seu nome como se fosse aquele ano. Você não segurou.`, memoria: `Voltou ${lugar === 'O estádio' ? 'ao campo' : 'ao clube'} para os ${t.anos} anos do título.`, relevancia: 'biografia', tom: 'bom', efeito: () => { feliz(c, 6); if (noto(c.v) >= 10 || origemDoNome(c.v) === 'esporte') somarAoNome(c.v, 'esporte', 2); } }; } },
      { id: 'video', texto: 'Mandar um vídeo', resolver: () => ({ texto: 'Passaram o seu vídeo no telão. Do sofá, você ouviu o barulho pela TV.', memoria: null }) }
    ]
  },
  {
    id: 'h13_controversia', manual: true, tipo: 'decisao', idade: [22, 99], tema: 'trabalho', repetir: 6, peso: 3,
    quando: c => noto(c.v) >= 25 && !!controversiaAntiga13(c.v),
    titulo: 'A pergunta de sempre',
    texto: c => { const m = controversiaAntiga13(c.v)!; const anos = Math.max(1, Math.round((c.v.t - m.t) / 12)); return `Numa entrevista sobre outra coisa, voltaram ao que aconteceu em ${anoDoMarco(m.texto) || anoDe(m.t)}: "${semAno(m.texto).toLowerCase()}". ${anos} anos depois, a pergunta ainda vem.`; },
    opcoes: [
      { id: 'falar', texto: 'Falar abertamente', comportamento: { coragem: 1 },
        consequencia: () => 'Pode virar página — ou reabrir a ferida.',
        resolver: c => {
          const m = controversiaAntiga13(c.v)!;
          const ok = rngDe(c.v.id, 'h13_controversia', c.v.t).chance(clamp(0.55 + adm(c.v) / 300 - rej(c.v) / 300, 0.2, 0.85));
          if (ok) return { texto: 'Você contou o que tinha mudado desde então. O trecho circulou do jeito bom: "pelo menos não fugiu".', memoria: `Falou abertamente, anos depois, sobre o que aconteceu em ${anoDoMarco(m.texto) || anoDe(m.t)}.`, relevancia: 'biografia', tom: 'bom', efeito: () => { superarControversia13(c.v, m.ref, `Enfrentou de frente: ${semAno(m.texto).toLowerCase()}`); c.v.fatos['vis_boa'] = c.v.t; } };
          return { texto: 'A resposta reabriu o assunto. Por um mês, foi como se tivesse acontecido ontem.', memoria: null, tom: 'ruim', efeito: () => { c.v.fatos['vis_polemica'] = c.v.t; estresse(c, 4); } };
        } },
      { id: 'desviar', texto: 'Desviar do assunto', resolver: c => ({ texto: 'Você desviou. A entrevista seguiu; o assunto também, por fora.', memoria: null, efeito: () => estresse(c, 2) }) },
      { id: 'irritar', texto: 'Encerrar a entrevista', comportamento: { coragem: 1 }, resolver: c => ({ texto: 'Você levantou e saiu. O vídeo da saída teve mais audiência que a entrevista inteira.', memoria: 'Encerrou uma entrevista quando o passado voltou à pauta.', relevancia: 'biografia', tom: 'ruim', efeito: () => { c.v.fatos['vis_polemica'] = c.v.t; estresse(c, 3); } }) }
    ]
  },
  {
    id: 'h13_fracasso', manual: true, tipo: 'decisao', idade: [28, 95], tema: 'trabalho', repetir: 10, peso: 2.5,
    quando: c => !!fracassoAntigo13(c.v) && deuCertoDepois13(c.v),
    titulo: 'O que deu errado, contado no palco',
    texto: c => { const m = fracassoAntigo13(c.v)!; return `Um evento de empreendedores quer que você conte como foi quando ${semAno(m.texto).replace(/^./, x => x.toLowerCase())}, em ${anoDoMarco(m.texto) || anoDe(m.t)} — e o que veio depois.`; },
    opcoes: [
      { id: 'contar', texto: 'Contar a história inteira',
        resolver: c => ({ texto: 'Você falou das contas que não fechavam e da noite em que decidiu parar. No fim, uma fila de gente querendo contar a própria.', memoria: 'Contou num palco a história do negócio que tinha fechado.', relevancia: 'biografia', tom: 'bom', efeito: () => { feliz(c, 3); if (noto(c.v) >= 20) c.v.fatos['vis_boa'] = c.v.t; } }) },
      { id: 'recusar', texto: 'Recusar', resolver: () => ({ texto: 'Tem histórias que a gente prefere não repetir em público.', memoria: null }) }
    ]
  },
  {
    id: 'h13_emprego', manual: true, tipo: 'acontecimento', idade: [30, 95], tema: 'trabalho', repetir: 12, peso: 1.5,
    quando: c => !!empregoDeixado13(c.v) && (noto(c.v) >= 20 || prestigioProfissional(c.v).valor >= 45),
    narrar: c => {
      const e = empregoDeixado13(c.v)!;
      const colega = colegaDoEmprego(c.v);
      if (e.motivo === 'justa causa') return { texto: `${colega ? `${colega.nome}, dos tempos da ${e.empregador},` : `Um antigo colega da ${e.empregador}`} reconheceu você num evento — a ${e.empregador} de onde você saiu por justa causa em ${e.ano}. O cumprimento foi seco.`, relevancia: 'cotidiano', tom: 'neutro', ...(colega ? { lembrar: ['colega', 'O reencontro seco, anos depois da saída da empresa.', 'antigo'] as [string, string, 'antigo'] } : {}) };
      return { texto: `A ${e.empregador}, que você deixou em ${e.ano}, convidou você para falar aos novatos sobre o que fez depois.${colega ? ` Quem fez o convite foi ${colega.nome}, ainda lá.` : ''}`, relevancia: 'biografia', tom: 'bom', efeito: x => { feliz(x, 3); if (colega) { const vin = x.v.vinculos[colega.id]; if (vin) { vin.tUltimoContato = x.v.t; vin.proximidade = clamp(vin.proximidade + 4); } lembrarCom(x.v, colega.id, `Convidou você para falar na ${e.empregador}.`, 'antigo', 1); } } };
    }
  },
  {
    id: 'h13_rival', manual: true, tipo: 'decisao', idade: [22, 95], tema: 'amizade', repetir: 8, peso: 2,
    papeis: { quem: P.fixo(rivalAntigo) },
    quando: c => !!marcoRecenteBom(c.v),
    titulo: c => `Uma mensagem de ${c.p.quem.nome}`,
    texto: c => { const vin = c.v.vinculos[c.p.quem.id]; const anos = Math.max(1, Math.round((c.v.t - vin.tUltimoContato) / 12)); const m = marcoRecenteBom(c.v)!; return `${c.p.quem.nome} — ${vin.estagio === 'rival' ? 'a rivalidade de anos' : 'a amizade que acabou mal'}, ${anos} anos sem se falar — mandou mensagem: "Vi a notícia (${semAno(m.texto).toLowerCase()}). Parabéns. De verdade."`; },
    opcoes: [
      { id: 'responder', texto: 'Responder com calma', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: `Duas mensagens viraram dez. Ninguém pediu desculpas; ninguém precisou.`, memoria: `Voltou a falar com ${c.p.quem.nome} depois de anos.`, relevancia: 'biografia', tom: 'bom', lembrar: ['quem', 'A mensagem de parabéns, depois de anos.', 'reconciliacao'],
          efeito: () => { const vin = c.v.vinculos[c.p.quem.id]; tensao(c, 'quem', -12); prox(c, 'quem', 6); if (vin && vin.tensao < 40 && (vin.estagio === 'rival' || vin.estagio === 'ex_amigo')) vin.estagio = 'conhecido'; } }) },
      { id: 'ignorar', texto: 'Visualizar e não responder', resolver: () => ({ texto: 'Você leu duas vezes e guardou o celular.', memoria: null }) },
      { id: 'ironia', texto: 'Responder com ironia', resolver: c => ({ texto: '"Demorou, hein." A conversa morreu ali — e a rivalidade ganhou mais um capítulo.', memoria: null, efeito: () => tensao(c, 'quem', 6) }) }
    ]
  },
  {
    id: 'h13_amigo_antigo', manual: true, tipo: 'decisao', idade: [20, 95], tema: 'amizade', repetir: 6, peso: 2.5,
    papeis: { quem: P.fixo(amigoDeAntes) },
    quando: c => noto(c.v) >= 30,
    titulo: c => `${c.p.quem.nome}, de antes de tudo`,
    texto: c => `${c.p.quem.nome}, que você conheceu ${descricaoOrigem(c.v, c.v.vinculos[c.p.quem.id])}, viu você ${ondeViu(c.v)} e mandou mensagem: "Lembra de mim?"`,
    opcoes: [
      { id: 'encontrar', texto: 'Marcar um encontro', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: `${c.p.quem.nome} não pediu foto, não pediu nada. Riram das mesmas coisas de antes.`, memoria: `Reencontrou ${c.p.quem.nome}, amig${o(c.p.quem)} de antes da fama.`, relevancia: 'biografia', tom: 'bom', lembrar: ['quem', 'O reencontro depois que o seu nome ficou conhecido.', 'antigo'], efeito: () => { prox(c, 'quem', 10); feliz(c, 3); } }) },
      { id: 'responder', texto: 'Responder com carinho', resolver: c => ({ texto: 'Uma troca de mensagens boa. Ficou a vontade de marcar algo.', memoria: null, efeito: () => prox(c, 'quem', 3) }) },
      { id: 'nada', texto: 'Não responder', resolver: () => ({ texto: 'Muita gente aparece quando o nome cresce. Você não soube separar — e deixou passar.', memoria: null }) }
    ]
  },
  {
    id: 'h13_obra', manual: true, tipo: 'acontecimento', idade: [28, 99], tema: 'trabalho', repetir: 12, peso: 2,
    quando: c => !!obraAntiga13(c.v),
    narrar: c => {
      const ob = obraAntiga13(c.v)!;
      return { texto: `"${ob.titulo}", de ${ob.ano}, voltou a circular: uma geração que não era nascida descobriu — e foi atrás do resto.`, relevancia: 'biografia', tom: 'bom',
        efeito: x => { somarAoNome(x.v, 'arte', 4); receberDaFama13(x.v, Math.max(local(x, 3000), valorDaCampanha13(x.v, 0.15)), 'Direitos de uma obra antiga'); feliz(x, 3); } };
    }
  },
  {
    id: 'h13_mandato', manual: true, tipo: 'acontecimento', idade: [30, 99], tema: 'lugar', repetir: 10, peso: 2,
    quando: c => !!mandatoLembrado13(c.v) && !c.v.caminhos.politica?.mandato,
    narrar: c => {
      const m = mandatoLembrado13(c.v)!;
      return { texto: `Na feira, uma senhora parou você: lembrava do seu mandato de ${nomeCargo(c.v, m.cargo as never)} (até ${m.ano}) — e do que mudou na rua dela.`, relevancia: 'cotidiano', tom: 'bom',
        efeito: x => { feliz(x, 4); const p = x.v.caminhos.politica; if (p && p.fase !== 'encerrada') p.reputacao = clamp(p.reputacao + 2); } };
    }
  }
];
