/**
 * Usar a própria visibilidade (pacote pós-playtest, Fama 2.0): quem o
 * público conhece pode DECIDIR o que fazer com isso — dar entrevista, apoiar
 * uma causa, ir a um evento, aceitar publicidade, preservar a privacidade,
 * promover o próprio projeto, levar o nome para a política.
 *
 * Nada aqui é botão mágico. O resultado depende da notoriedade, da ORIGEM do
 * nome (`notoriedade.origemDoNome`), da imagem pública (`imagemPublica`), da
 * compatibilidade entre o que se faz e o que se é, do histórico — e do dia.
 * Fama não vira apoio político sozinha: vira, às vezes, presença; às vezes,
 * estranhamento ("jogador querendo ser político").
 *
 * Consequências reais: a imagem (`fatos.vis_boa` / `vis_polemica`, lidos por
 * `imagemPublica`), a presença e a base políticas, a reputação do negócio,
 * o público da obra, o dinheiro do cachê, a cabeça (a exposição pesa; a
 * privacidade alivia — `pesoDaExposicao`).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Prioridade, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { dinheiro as fmt, flex, ge } from '../texto';
import { imagemPublica, origemDoNome, porOrigem } from './notoriedade';
import { basePartidaria, NOME_PRIORIDADE, naPolitica } from './politica';
import { negocioAtivo } from './negocio';

export type UsoDaVisibilidade = 'entrevista' | 'causa' | 'evento' | 'publicidade' | 'privacidade' | 'projeto' | 'politica';

export const USOS: { id: UsoDaVisibilidade; rotulo: string; descricao: string }[] = [
  { id: 'entrevista', rotulo: 'Conceder uma entrevista', descricao: 'Falar da própria história. Pode aproximar o público — ou render uma frase que pega mal.' },
  { id: 'causa', rotulo: 'Apoiar uma causa', descricao: 'Emprestar o nome a uma causa (você escolhe qual). Quem acredita em você presta atenção.' },
  { id: 'evento', rotulo: 'Ir a um evento público', descricao: 'Um evento beneficente, uma inauguração: gente nova, fotos, cansaço.' },
  { id: 'publicidade', rotulo: 'Aceitar uma publicidade', descricao: 'Um cachê por uma campanha. Dinheiro e exposição — a marca escolhe quem tem imagem boa.' },
  { id: 'privacidade', rotulo: 'Preservar a privacidade este ano', descricao: 'Recusar convites, sumir das redes. O nome esfria um pouco; a cabeça agradece.' },
  { id: 'projeto', rotulo: 'Usar o nome para promover o seu projeto', descricao: 'O negócio, a obra: a visibilidade pode trazer gente — ou parecer propaganda.' },
  { id: 'politica', rotulo: 'Levar o nome para a política', descricao: 'Tentar transformar visibilidade em presença política. O público pode abraçar — ou estranhar.' }
];

const feito = (v: Vida, id: UsoDaVisibilidade) => v.anoAtual.acoes.includes(`vis_${id}`);
const nome = (v: Vida) => v.notoriedade?.valor ?? 0;

export function disponibilidadeVisibilidade(v: Vida, id: UsoDaVisibilidade): Veredito {
  if (idade(v) < 16) return bloqueio('impossivel', 'Ainda não.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  const minimo = id === 'politica' ? 15 : 25;
  if (nome(v) < minimo) return bloqueio('requisito', 'Para isso, o público precisaria conhecer você — e ainda não conhece o bastante.');
  if (feito(v, id)) return bloqueio('incompativel', 'Já foi feito este ano.');
  const im = imagemPublica(v);
  if (id === 'publicidade') {
    const o = origemDoNome(v);
    if (o !== 'esporte' && o !== 'arte') return bloqueio('requisito', 'Marca paga pela imagem de quem é conhecido pelo esporte ou pela obra.');
    if (v.caminhos.politica?.mandato) return bloqueio('incompativel', 'No mandato, publicidade paga não cabe.');
    if (im?.palavra === 'polêmica') return bloqueio('incompativel', 'Com a imagem ligada a uma polêmica, as marcas se afastaram.');
  }
  if (id === 'projeto' && !projetoProprio(v)) return bloqueio('impossivel', 'Não há um negócio nem uma obra sua para promover agora.');
  if (id === 'politica' && !naPolitica(v)) return bloqueio('requisito', 'Primeiro é preciso estar na vida política (filiação, uma porta que se abriu).');
  return PERMITIDO;
}

/** O que há de seu para promover (o negócio aberto; a obra, o grupo, a carreira artística). */
function projetoProprio(v: Vida): 'negocio' | 'arte' | undefined {
  if (negocioAtivo(v)) return 'negocio';
  if (v.caminhos.arte?.ativo) return 'arte';
  return undefined;
}

/** Uma escolha incerta: a soma dos fatores vira chance (o resultado nunca é garantido). */
function chance(x: number, piso = 0.08, teto = 0.85): number { return clamp(0.5 + x, piso, teto); }

/** Usar a visibilidade. Apoiar uma causa é uma porta: abre a escolha de QUAL causa (`vis_causa`). */
export function usarVisibilidade(v: Vida, r: Rng, id: UsoDaVisibilidade): { texto: string; tom?: 'bom' | 'ruim' | 'neutro'; decisao?: string } {
  v.anoAtual.acoes.push(`vis_${id}`);
  const x = nome(v);
  const n = v.notoriedade!;
  const im = imagemPublica(v);
  const social = v.personalidade.tracos.sociabilidade / 200;
  const g = ge(v);
  const imagem = im?.palavra === 'querida' ? 0.12 : im?.palavra === 'polêmica' ? -0.2 : im?.palavra === 'desgastada' ? -0.1 : 0;
  switch (id) {
    case 'entrevista': {
      const deu = r.chance(chance((x - 40) / 200 + social + imagem + (v.mente.cognicao - 50) / 300 - (v.mente.estresse - 50) / 300));
      v.mente.estresse = clamp(v.mente.estresse + 2);
      if (deu) {
        n.valor = clamp(n.valor + 2); n.pico = Math.max(n.pico, n.valor);
        v.fatos['vis_boa'] = v.t;
        escrever(v, { texto: `Deu uma entrevista longa ${porOrigem(v) ? `(conhecid${flex(g, 'o', 'a', 'e')} ${porOrigem(v)})` : ''} — e o público gostou do que ouviu.`.replace(' ()', ''), relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' });
        return { texto: 'A conversa fluiu. Uma resposta sua circulou nas redes, do jeito bom.', tom: 'bom' };
      }
      v.fatos['vis_polemica'] = v.t;
      escrever(v, { texto: 'Uma frase dita numa entrevista pegou mal e virou assunto por semanas.', relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      return { texto: 'Uma frase saiu do contexto — e o contexto não voltou. Por semanas, foi só disso que se falou.', tom: 'ruim' };
    }
    case 'causa':
      return { texto: '', decisao: 'vis_causa' };
    case 'evento': {
      v.mente.felicidade = clamp(v.mente.felicidade + 3);
      v.mente.estresse = clamp(v.mente.estresse + 2);
      n.valor = clamp(n.valor + 1);
      const deu = r.chance(chance(social + imagem));
      if (deu) v.fatos['vis_boa'] = v.t;
      escrever(v, { texto: deu ? 'Foi a um evento beneficente; as fotos e a conversa com quem organizava ficaram.' : 'Foi a um evento público: fotos, apertos de mão, cansaço.', relevancia: 'cotidiano', tema: 'lazer' });
      return { texto: deu ? 'Gente nova, conversa boa — e uma foto que rodou do jeito certo.' : 'Muita foto, pouca conversa. Voltou cansad' + flex(g, 'o', 'a', 'e') + '.', tom: deu ? 'bom' : 'neutro' };
    }
    case 'publicidade': {
      const valor = Math.round(((x - 20) ** 2) * 9 * (im?.fator ?? 1) / 100) * 100;
      v.financas.conta += valor;
      v.mente.estresse = clamp(v.mente.estresse + 3);
      n.valor = clamp(n.valor + 1);
      v.fatos['vis_publicidade'] = v.t;
      escrever(v, { texto: `Fez uma campanha publicitária (${fmt(valor)}).`, relevancia: 'cotidiano', tema: 'dinheiro', tom: 'bom' });
      return { texto: `Um dia de estúdio, uma frase sua num outdoor e ${fmt(valor)} na conta. O rosto ficou um pouco mais conhecido.`, tom: 'bom' };
    }
    case 'privacidade': {
      n.valor = clamp(n.valor - 3);
      v.mente.estresse = clamp(v.mente.estresse - 6);
      v.fatos['vis_privacidade'] = v.t;
      escrever(v, { texto: 'Passou um ano longe dos holofotes, de propósito.', relevancia: 'cotidiano', tema: 'lazer' });
      return { texto: 'Recusou convites, apagou o aplicativo por uns meses. O nome esfriou um pouco; a cabeça, também — no bom sentido.', tom: 'bom' };
    }
    case 'projeto': {
      const qual = projetoProprio(v)!;
      const deu = r.chance(chance((x - 40) / 150 + imagem + social / 2 - (v.fatos['vis_projeto_ult'] !== undefined && v.t - v.fatos['vis_projeto_ult'] <= 24 ? 0.15 : 0)));
      v.fatos['vis_projeto_ult'] = v.t;
      if (qual === 'negocio') {
        const neg = negocioAtivo(v)!;
        neg.reputacao = clamp((neg.reputacao ?? 30) + (deu ? Math.round(x / 10) : 1));
        neg.clientela = clamp(neg.clientela + (deu ? Math.round(x / 12) : 0));
        return deu ? { texto: `O nome trouxe gente: ${neg.nome} ficou mais conhecido, e a freguesia sentiu.`, tom: 'bom' } : { texto: 'Pareceu propaganda — e o público percebe. Pouca gente nova apareceu.', tom: 'neutro' };
      }
      const a = v.caminhos.arte!;
      a.publico = clamp(a.publico + (deu ? Math.round(x / 10) : 1));
      return deu ? { texto: `Falou do trabalho onde o público estava: ${a.nome} ganhou gente nova.`, tom: 'bom' } : { texto: 'A divulgação passou meio despercebida.', tom: 'neutro' };
    }
    case 'politica': {
      const p = v.caminhos.politica!;
      const origem = origemDoNome(v);
      // O que ajuda: o tamanho do nome, a imagem, um lugar no partido, uma trajetória política que já existe.
      const fator = (x - 40) / 160 + imagem + basePartidaria(v) / 250 + p.reputacao / 300 + (origem === 'politica' ? 0.1 : 0) - (v.t - p.tInicio < 12 ? 0.12 : 0);
      const sorte = r.next();
      const ok = sorte < chance(fator - 0.1, 0.05, 0.7);
      const meio = !ok && sorte < chance(fator + 0.15, 0.15, 0.85);
      if (ok) {
        p.reputacao = clamp(p.reputacao + Math.round(x * 0.12));
        p.apoio = clamp(p.apoio + Math.round(x * 0.04));
        escrever(v, { texto: `Levou o nome ${porOrigem(v)} para a política — e o público ouviu.`.replace('  ', ' '), relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
        return { texto: 'Nas ruas, gente parando para tirar foto — e perguntar o que você pretende fazer. Uma parte começou a prestar atenção de verdade.', tom: 'bom' };
      }
      if (meio) {
        p.reputacao = clamp(p.reputacao + 3);
        return { texto: 'Muita gente sabia quem você era; pouca entendeu o que você propõe. Ficou um começo de conversa.', tom: 'neutro' };
      }
      p.desgaste = clamp(p.desgaste + 5);
      escrever(v, { texto: `Tentou usar a visibilidade ${porOrigem(v)} na política e o público estranhou.`.replace('  ', ' '), relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      return { texto: origem === 'esporte' ? '"Jogador querendo ser político": a frase pegou. Conhecer você não fez ninguém confiar nas suas propostas.' : origem === 'arte' ? 'Disseram que era palco, não proposta. O nome atraiu curiosos, não apoio.' : 'O público ouviu e não se convenceu.', tom: 'ruim' };
    }
  }
}

/** As causas que fazem sentido para esta vida (a origem do nome e a bandeira política pesam na escolha, não a decidem). */
export function causasPossiveis(v: Vida): { id: Prioridade | 'esporte_base' | 'cidade_natal'; nome: string }[] {
  const out: { id: Prioridade | 'esporte_base' | 'cidade_natal'; nome: string }[] = [];
  if (origemDoNome(v) === 'esporte') out.push({ id: 'esporte_base', nome: 'o esporte de base nos bairros' });
  out.push({ id: 'educacao', nome: NOME_PRIORIDADE.educacao }, { id: 'saude', nome: NOME_PRIORIDADE.saude }, { id: 'ambiente', nome: NOME_PRIORIDADE.ambiente });
  if (origemDoNome(v) === 'arte') out.push({ id: 'cultura', nome: NOME_PRIORIDADE.cultura });
  if (v.eu.municipioNatal !== v.moradia.municipioId) out.push({ id: 'cidade_natal', nome: 'a cidade onde você nasceu' });
  return out.slice(0, 4);
}

/** Apoiar a causa escolhida: o que muda depende de quem você é para essa causa. */
export function apoiarCausa(v: Vida, r: Rng, id: string): { texto: string; tom: 'bom' | 'ruim' | 'neutro'; memoria: string } {
  const x = nome(v);
  const causa = causasPossiveis(v).find(c => c.id === id);
  const p = v.caminhos.politica;
  const origem = origemDoNome(v);
  // Compatível: a causa conversa com a origem do nome ou com a bandeira de quem está na política.
  const compativel = (id === 'esporte_base' && origem === 'esporte') || (id === 'cultura' && origem === 'arte') || (!!p && p.prioridade === id);
  const oportunismo = !!p && naPolitica(v) && v.t - p.tInicio < 12 && !compativel;
  v.mente.felicidade = clamp(v.mente.felicidade + 4);
  if (oportunismo && r.chance(0.45)) {
    p!.desgaste = clamp(p!.desgaste + 4);
    return { texto: 'Chamaram de oportunismo: candidato novo abraçando qualquer causa. Doeu — e ensinou.', tom: 'ruim', memoria: `Apoiou publicamente ${causa?.nome ?? 'uma causa'} — e foi acusado de oportunismo.` };
  }
  v.fatos['vis_boa'] = v.t;
  if (p && naPolitica(v)) {
    p.apoio = clamp(p.apoio + Math.round((compativel ? 5 : 2) * Math.min(1.5, x / 40)));
    p.reputacao = clamp(p.reputacao + (compativel ? 3 : 1));
  }
  return { texto: compativel ? 'Quem trabalha com isso há anos reconheceu: não era foto, era compromisso.' : 'O nome trouxe atenção para a causa por umas semanas.', tom: 'bom', memoria: `Emprestou o nome a uma causa: ${causa?.nome ?? 'uma causa'}.` };
}
