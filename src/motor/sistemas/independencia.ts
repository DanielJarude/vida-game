/**
 * Independência financeira: uma TRANSIÇÃO, não uma flag aos 18.
 *
 * Derivada do estado real — quem paga a casa onde a pessoa mora, se ela tem
 * renda, se põe dinheiro em casa, se recebe ajuda da família (e quanto), se
 * ajuda a família, se divide a vida com alguém. A mesma leitura serve a
 * Vida (Casa, Dinheiro), a Você e ao registro biográfico das passagens que
 * importam: a primeira vez que as contas foram todas suas; a volta para a
 * casa da família (já registrada por `moradia`).
 */

import type { Vida } from '../tipos';
import { escrever, idade, parceiro, temFato, marcarFato } from '../nucleo';
import { moraComFamiliaDeOrigem } from './domicilio';
import { ajudaMensalDaFamilia, contribuicaoEmCasa, contribuicaoEsperada, familiaPagaEstudo, responsaveis } from './origem';
import { rendaPropriaMensal } from './dinheiro';
import { marcar } from './marcas';

export type FaseDeIndependencia =
  | 'crianca'          // a família sustenta tudo (e decide)
  | 'sustentado'       // mora com a família, sem renda própria
  | 'parcial'          // tem o próprio dinheiro; a casa é da família
  | 'contribui'        // trabalha, mora com a família e põe dinheiro em casa
  | 'ajudado'          // mora por conta, mas a família ainda segura parte
  | 'independente'     // as contas são suas
  | 'com_parceria'     // a vida (e as contas) divididas com alguém
  | 'sustenta_familia' // e ainda ajuda quem ficou na casa de origem
  | 'voltou';          // voltou a morar com a família, depois de ter saído

export interface LeituraDaIndependencia {
  fase: FaseDeIndependencia;
  palavra: string;
  texto: string;
}

const PALAVRA: Record<FaseDeIndependencia, string> = {
  crianca: 'A família sustenta', sustentado: 'Sustentado pela família', parcial: 'Parte por conta própria', contribui: 'Contribui em casa',
  ajudado: 'Com ajuda da família', independente: 'Por conta própria', com_parceria: 'Dividindo a vida', sustenta_familia: 'Ajuda a família', voltou: 'De volta à casa da família'
};

/** Ajuda à família que sai todo mês (o Pix para a mãe) ou que saiu no último ano. */
function ajudaAFamilia(v: Vida): boolean {
  const ids = new Set(responsaveis(v).map(x => x.p.id));
  if (Object.keys(v.fatos).some(k => k.startsWith('ajuda_mensal_') && ids.has(k.slice('ajuda_mensal_'.length)))) return true;
  return (v.origem.apoios ?? []).some(a => a.sentido === 'deu' && v.t - a.t <= 12 && a.valor >= 800);
}

export function independencia(v: Vida): LeituraDaIndependencia {
  const i = idade(v);
  const renda = rendaPropriaMensal(v);
  let fase: FaseDeIndependencia;
  let texto: string;
  if (moraComFamiliaDeOrigem(v)) {
    const voltou = v.fatos['voltou_para_os_pais'] !== undefined && v.t - v.fatos['voltou_para_os_pais'] <= 36;
    if (i < 14) { fase = 'crianca'; texto = 'Quem sustenta a casa são os adultos dela — e são eles que decidem o que se gasta.'; }
    else if (voltou) { fase = 'voltou'; texto = renda > 0 ? 'Voltou para a casa da família; a renda é sua, o teto é de lá.' : 'Voltou para a casa da família, por um tempo.'; }
    else if (renda <= 0) { fase = 'sustentado'; texto = i >= 18 ? `Sem renda própria: a casa, a comida e a conta de luz são da família.` : 'A família sustenta a casa; o seu dinheiro é o que sobra de mesada e de bico.'; }
    else if (contribuicaoEmCasa(v) > 0.05) { fase = 'contribui'; texto = `Trabalha e mora com a família: uma parte do que ganha vai para as contas de casa${contribuicaoEmCasa(v) > contribuicaoEsperada(v) ? ' (mais do que pediram)' : ''}.`; }
    else { fase = 'parcial'; texto = contribuicaoEsperada(v) > 0.05 && i >= 18 ? 'Tem renda e mora com a família sem pôr dinheiro em casa — e a casa sente.' : 'Tem o próprio dinheiro; a casa é da família.'; }
  } else {
    const par = parceiro(v);
    const juntos = !!par && v.vinculos[par.p.id].convivio.includes('casa');
    const ajuda = ajudaMensalDaFamilia(v) + (v.educacao.matricula ? Math.min(v.educacao.matricula.mensalidade, familiaPagaEstudo(v)) : 0);
    const recebeu = (v.origem.apoios ?? []).filter(a => a.sentido === 'recebeu' && v.t - a.t <= 12).reduce((s, a) => s + a.valor, 0);
    if (ajudaAFamilia(v) && renda > 0) { fase = 'sustenta_familia'; texto = 'As contas são suas — e ainda sai dinheiro para ajudar quem ficou na casa de origem.'; }
    else if (ajuda > 0 && ajuda >= renda * 0.25 || recebeu >= Math.max(3000, renda * 3)) { fase = 'ajudado'; texto = ajuda > 0 ? 'Mora por conta própria, mas a família ainda segura parte da vida (o estudo, o aluguel do mês).' : 'Mora por conta própria; no último ano, precisou da família para fechar as contas.'; }
    else if (juntos) { fase = 'com_parceria'; texto = `Mora com ${par!.p.nome}: a casa e as contas são divididas.`; }
    else { fase = 'independente'; texto = renda > 0 ? `As contas são todas suas: aluguel, mercado, luz — e o que sobrar.` : `Mora por conta própria, sem renda: vivendo do que guardou.`; }
  }
  return { fase, palavra: PALAVRA[fase], texto };
}

/**
 * A passagem que merece biografia: a primeira vez que as contas foram todas
 * da pessoa (morando fora, sem a família segurando). Uma vez só.
 */
export function processarIndependencia(v: Vida): void {
  if (idade(v) < 16 || temFato(v, 'primeira_independencia')) return;
  const l = independencia(v);
  if (l.fase === 'independente' || l.fase === 'com_parceria' || l.fase === 'sustenta_familia') {
    if (rendaPropriaMensal(v) <= 0) return;
    marcarFato(v, 'primeira_independencia');
    const texto = `Aos ${idade(v)}, pela primeira vez, as contas foram todas suas — sem a família segurando nada.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'casa' });
    marcar(v, 'independencia', texto, 2);
  }
}
