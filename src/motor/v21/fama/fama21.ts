/**
 * VIDA 21 · O RECONHECIMENTO QUE NÃO É FAMA — e as formas de ser reconhecido, lado a lado.
 *
 * O núcleo da fama (VIDA 13: `reconhecimento13`, `notoriedade`, `fama`) só dava nome a quem tem esporte, arte, política,
 * negócio grande ou rede: a médica que atende o bairro há vinte anos, o padeiro que a comunidade inteira conhece, a
 * professora que deu aula para metade da cidade eram "ninguém". Aqui:
 *
 *   ONDE SE VIVE   o reconhecimento local nasce do ofício que lida com gente (a medicina, a escola, o balcão, o salão,
 *                  o quartel dos bombeiros), dos anos NAQUELA cidade, do volume de trabalho (`v21/carreiras/oficio21`) e
 *                  do desempenho. Alcance: a rua, o bairro, a comunidade — a cidade inteira só numa cidade pequena. Não é
 *                  notoriedade (não aparece na imprensa, não vira fã): é a padaria que sabe o seu nome. Sair do ofício ou
 *                  da cidade apaga devagar (dez anos).
 *   AS FORMAS      fama (o público em geral), prestígio no ofício (os pares), reconhecimento local, influência (o público
 *                  nas redes) e a imagem (admiração × rejeição) — um atleta pode ser enorme no esporte e anônimo fora dele;
 *                  um empresário, respeitado no meio sem ser celebridade.
 *   O MUNDO REAGE  sem pedir: a rádio comunitária convida, a escola chama para falar da profissão, a câmara aprova uma
 *                  moção de aplauso (anos de serviço na cidade), o jornal da cidade conta o número redondo do ofício, o
 *                  autônomo ganha freguesia. Na medida do reconhecimento; nunca fama nacional por um feito de bairro.
 *
 * Sorteio derivado (`rngDe`): não mexe no acaso da vida. Nada novo no save além de fatos com data.
 */
import type { Vida } from '../../tipos';
import { clamp, rngDe } from '../../rng';
import { escrever, idade } from '../../nucleo';
import { municipio } from '../../dados/lugares';
import { ocupacaoOuNula } from '../../dados/ocupacoes';
import { numerosDoOficio } from '../carreiras/oficio21';
import { palavraDaNotoriedade } from '../../sistemas/notoriedade';
import { prestigioProfissional } from '../../sistemas/fama';
import { imagemDaFama13 } from '../../sistemas/reconhecimento13';
import { contasAtivas, publicoReal } from '../../sistemas/redesBase';

/** O quanto cada ofício lida com gente da cidade (o reconhecimento local vem daqui). Ausente: quase nada. */
const PUBLICO21: Record<string, number> = {
  medicina: 1, enfermagem: 0.8, odontologia: 0.9, veterinaria: 0.9, farmacia: 0.8, saude_publica: 0.9, fisioterapia: 0.7, nutricao: 0.6, psicologia: 0.5,
  educacao: 1, educacao_fisica: 0.7, academia: 0.6, docencia_superior: 0.5,
  comercio: 0.7, alimentacao: 0.7, confeitaria: 0.8, beleza: 0.9, mecanica: 0.6, reparos: 0.5, eletrica: 0.5, posto: 0.5, informal: 0.6, atendimento: 0.4,
  bombeiro: 0.9, pm: 0.6, transporte: 0.5, direito: 0.6, contabil: 0.4, comunicacao: 0.6, publico: 0.3, cuidado: 0.4, costura: 0.5, marcenaria: 0.4
};

export type AlcanceLocal21 = 'ninguém' | 'a rua' | 'o bairro' | 'a comunidade' | 'a cidade';
export interface Local21 { valor: number; alcance: AlcanceLocal21; por?: string }

const MESES_NA_CIDADE = (v: Vida) => Math.max(0, v.t - (v.moradia.tInicio ?? v.t));

/** O reconhecimento onde você vive (0..100), o alcance e por quê. */
export function reconhecimentoLocal21(v: Vida): Local21 {
  if (idade(v) < 18) return { valor: 0, alcance: 'ninguém' };
  const e = v.trabalho.atual;
  const o = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  let melhor = { valor: 0, por: undefined as string | undefined };
  const daTrilha = (trilha: string, desempenho: number, anos: number, fade: number) => {
    const peso = PUBLICO21[trilha] ?? 0;
    if (!peso) return;
    const n = numerosDoOficio(v).filter(x => x.trilha === trilha).sort((a, b) => b.valor - a.valor)[0];
    const volume = n ? Math.log10(n.valor + 1) * 7 : 0;
    const x = clamp(peso * (Math.min(30, anos) * 2 + volume) * (0.6 + desempenho / 200) * fade);
    if (x > melhor.valor) melhor = { valor: x, por: n ? `${n.valor.toLocaleString('pt-BR')} ${n.indicador.rotulo}` : undefined };
  };
  const naCidade = MESES_NA_CIDADE(v) / 12;
  if (e && o) daTrilha(o.trilha, e.desempenho, Math.min(naCidade, (v.t - e.tInicio) / 12), 1);
  // O ofício que se deixou (ou a cidade que se deixou) apaga devagar: dez anos.
  for (const h of v.trabalho.historico.slice(-3)) {
    const oh = ocupacaoOuNula(h.ocupacaoId);
    if (!oh || h.tFim < (v.moradia.tInicio ?? 0)) continue;
    daTrilha(oh.trilha, h.desempenho, (h.tFim - Math.max(h.tInicio, v.moradia.tInicio ?? h.tInicio)) / 12, Math.max(0, 1 - (v.t - h.tFim) / 120));
  }
  // O negócio do bairro também é conhecido (a loja, o restaurante).
  const neg = v.caminhos.negocio;
  if (neg && neg.estado !== 'fechado') { const x = clamp((neg.reputacao ?? 30) * 0.6 + Math.min(20, naCidade)); if (x > melhor.valor) melhor = { valor: x, por: 'o seu negócio' }; }
  const pequena = municipio(v.moradia.municipioId).perfil === 'pequena';
  const valor = Math.round(Math.min(pequena ? 90 : 75, melhor.valor));
  const alcance: AlcanceLocal21 = valor >= 70 && pequena ? 'a cidade' : valor >= 45 ? 'a comunidade' : valor >= 25 ? 'o bairro' : valor >= 10 ? 'a rua' : 'ninguém';
  return { valor, alcance, por: melhor.por };
}

export interface Forma21 { id: 'fama' | 'prestigio' | 'local' | 'influencia' | 'imagem'; rotulo: string; valor: number; frase: string }

/** As formas de reconhecimento, cada uma com a sua leitura (o que é, até onde vai). */
export function formasDeReconhecimento21(v: Vida): Forma21[] {
  const out: Forma21[] = [];
  const noto = Math.round(v.notoriedade?.valor ?? 0);
  out.push({ id: 'fama', rotulo: 'Fama (o público em geral)', valor: noto, frase: noto >= 5 ? palavraDaNotoriedade(v) : 'o público em geral não sabe quem você é' });
  const pr = prestigioProfissional(v);
  out.push({ id: 'prestigio', rotulo: 'Prestígio no ofício', valor: pr.valor, frase: pr.valor >= 50 ? `muito respeitado${pr.por ? ` ${pr.por}` : ''}` : pr.valor >= 25 ? `respeitado${pr.por ? ` ${pr.por}` : ''}` : pr.valor >= 10 ? 'começando a ser notado pelos pares' : 'sem nome entre os pares ainda' });
  const lo = reconhecimentoLocal21(v);
  out.push({ id: 'local', rotulo: 'Reconhecimento onde você vive', valor: lo.valor, frase: lo.alcance === 'ninguém' ? 'ninguém em especial' : `conhecido por ${lo.alcance}${lo.por ? ` (${lo.por})` : ''}` });
  const pub = contasAtivas(v).reduce((s, c) => s + publicoReal(c), 0);
  const inf = Math.round(clamp(pub > 0 ? Math.log10(pub + 1) * 14 : 0));
  out.push({ id: 'influencia', rotulo: 'Influência nas redes', valor: inf, frase: pub >= 1000 ? `${pub.toLocaleString('pt-BR')} pessoas acompanham` : 'pouca gente acompanha' });
  const im = imagemDaFama13(v);
  if (im) out.push({ id: 'imagem', rotulo: 'Imagem pública', valor: Math.round(clamp(50 + (im.admiracao - im.rejeicao) / 2)), frase: im.admiracao >= im.rejeicao + 15 ? 'mais admirado que rejeitado' : im.rejeicao >= im.admiracao + 15 ? 'mais rejeitado que admirado' : 'dividido: tem quem admire e quem rejeite' });
  return out;
}

const PERIODO = 60;

/** O mundo de perto reage, sem pedir (uma vez por ano, no máximo; cada tipo, de cinco em cinco anos). */
export function processarFama21(v: Vida): void {
  if (idade(v) < 18 || v.justica?.prisao) return;
  const lo = reconhecimentoLocal21(v);
  const r = rngDe(v.id, 'fama21', v.t);
  const recente = (k: string) => v.fatos[`fama21_${k}`] !== undefined && v.t - v.fatos[`fama21_${k}`] < PERIODO;
  const marcar = (k: string) => { v.fatos[`fama21_${k}`] = v.t; };
  const o = ocupacaoOuNula(v.trabalho.atual?.ocupacaoId ?? '');
  const oficio = o ? (v.eu.genero === 'feminino' ? o.nome[1] : o.nome[0]) : 'a sua profissão';
  // O número redondo do ofício, no jornal da cidade (o marco grande do ano, de quem já é conhecido ali).
  const marco = o ? v.fatos[`of21_marco_${o.trilha}`] : undefined;
  if (marco === v.t && lo.valor >= 25 && !recente('jornal')) {
    marcar('jornal');
    escrever(v, { texto: `O jornal da cidade publicou uma matéria sobre você: ${lo.por ?? 'os anos de trabalho'} como ${oficio}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    v.mente.felicidade = clamp(v.mente.felicidade + 4);
    return;
  }
  if (lo.valor < 25 || !r.chance(0.12 + lo.valor / 400)) return;
  // Os anos no ofício de agora (a moção fala do trabalho, não da casa).
  const anos = v.trabalho.atual ? Math.floor((v.t - v.trabalho.atual.tInicio) / 12) : 0;
  const opcoes = [
    ...(!recente('radio') ? ['radio'] : []),
    ...(!recente('escola') && o ? ['escola'] : []),
    ...(!recente('mocao') && lo.valor >= 55 && anos >= 15 ? ['mocao'] : []),
    ...(!recente('freguesia') && v.trabalho.atual && o?.contrato === 'autonomo' ? ['freguesia'] : [])
  ];
  if (!opcoes.length) return;
  const k = r.pick(opcoes);
  marcar(k);
  if (k === 'radio') { escrever(v, { texto: `A rádio comunitária convidou você para falar sobre o trabalho de ${oficio} no programa da manhã.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' }); v.mente.felicidade = clamp(v.mente.felicidade + 2); }
  if (k === 'escola') { escrever(v, { texto: `A escola do bairro chamou você para contar aos alunos como é ser ${oficio}.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' }); v.mente.felicidade = clamp(v.mente.felicidade + 2); }
  if (k === 'mocao') { escrever(v, { texto: `A câmara municipal aprovou uma moção de aplauso pelos seus ${anos} anos como ${oficio}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' }); v.mente.felicidade = clamp(v.mente.felicidade + 5); }
  if (k === 'freguesia') {
    const e = v.trabalho.atual!;
    e.clientela = clamp((e.clientela ?? 30) + 6);
    escrever(v, { texto: 'O boca a boca do bairro trouxe clientes novos: gente que chegou dizendo "me falaram de você".', relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' });
  }
}
