/** Seletores de papel: quem, da vida real do jogador, pode estar numa cena. */

import type { Papel } from './base';
import type { Convivio, Parentesco, Pessoa, Vida } from '../tipos';
import { idadePessoa, vinculosVivos } from '../nucleo';

const deParentesco = (...tipos: Parentesco[]): Papel => v =>
  vinculosVivos(v).filter(x => x.vin.parentesco && tipos.includes(x.vin.parentesco)).map(x => x.p);

export const mae = deParentesco('mae');
export const pai = deParentesco('pai');
export const genitor = deParentesco('mae', 'pai');
export const avo = deParentesco('avo');
export const irmao = deParentesco('irmao', 'meio_irmao');
export const tioOuPrimo = deParentesco('tio', 'primo');
export const pet = deParentesco('pet');

/** Genitor que mora junto. */
export const genitorEmCasa: Papel = v =>
  vinculosVivos(v).filter(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai' || x.vin.parentesco === 'avo') && x.vin.convivio.includes('casa')).map(x => x.p);

export const irmaoEmCasa: Papel = v =>
  vinculosVivos(v).filter(x => (x.vin.parentesco === 'irmao' || x.vin.parentesco === 'meio_irmao') && x.vin.convivio.includes('casa')).map(x => x.p);

export const avoPerto: Papel = v =>
  vinculosVivos(v).filter(x => x.vin.parentesco === 'avo' && x.vin.convivio.length > 0).map(x => x.p);

export const amigo: Papel = v =>
  vinculosVivos(v).filter(x => !x.vin.parentesco && (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo') && (!x.vin.romance || x.vin.romance.estagio === 'ex' || x.vin.romance.estagio === 'interesse')).map(x => x.p);

export const amigoProximo: Papel = v =>
  vinculosVivos(v).filter(x => !x.vin.parentesco && x.vin.estagio === 'amigo_proximo' && !x.vin.romance).map(x => x.p);

/** Alguém de um convívio atual (colega), ainda não amigo. */
export const colegaDe = (tipo: Convivio): Papel => v =>
  vinculosVivos(v).filter(x => !x.vin.parentesco && x.vin.convivio.includes(tipo) && (x.vin.estagio === 'colega' || x.vin.estagio === 'conhecido') && !x.vin.romance).map(x => x.p);

/** Qualquer pessoa (amiga ou não) de um convívio atual. */
export const genteDe = (tipo: Convivio): Papel => v =>
  vinculosVivos(v).filter(x => !x.vin.parentesco && x.vin.convivio.includes(tipo) && !x.vin.romance).map(x => x.p);

export const parceiro: Papel = v =>
  vinculosVivos(v).filter(x => x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio) && !x.vin.romance.secreto).map(x => x.p);

export const conjuge: Papel = v =>
  vinculosVivos(v).filter(x => x.vin.romance && ['morando_junto', 'casamento'].includes(x.vin.romance.estagio) && !x.vin.romance.secreto).map(x => x.p);

export const namorado: Papel = v =>
  vinculosVivos(v).filter(x => x.vin.romance?.estagio === 'namoro' && !x.vin.romance.secreto).map(x => x.p);

export const saindoCom: Papel = v =>
  vinculosVivos(v).filter(x => x.vin.romance?.estagio === 'saindo' && !x.vin.romance.secreto).map(x => x.p);

/** O caso escondido (quando há). */
export const caso: Papel = v =>
  vinculosVivos(v).filter(x => x.vin.romance?.secreto && x.vin.romance.estagio !== 'ex').map(x => x.p);

/** Netos (e bisnetos) vivos, de qualquer idade. */
export const neto = (min = 0, max = 200): Papel => v =>
  vinculosVivos(v).filter(x => (x.vin.parentesco === 'neto' || x.vin.parentesco === 'bisneto') && x.p.nome && idadePessoa(v, x.p) >= min && idadePessoa(v, x.p) <= max).map(x => x.p);

export const interesse: Papel = v =>
  vinculosVivos(v).filter(x => x.vin.romance?.estagio === 'interesse').map(x => x.p);

export const filho = (min = 0, max = 200): Papel => v =>
  vinculosVivos(v).filter(x => (x.vin.parentesco === 'filho' || x.vin.parentesco === 'enteado') && x.p.nome && idadePessoa(v, x.p) >= min && idadePessoa(v, x.p) <= max).map(x => x.p);

export const filhoEmCasa = (min = 0, max = 200): Papel => v =>
  filho(min, max)(v).filter(p => v.vinculos[p.id].convivio.includes('casa'));

export const bebeSemNome: Papel = v =>
  vinculosVivos(v).filter(x => x.vin.parentesco === 'filho' && !x.p.nome).map(x => x.p);

export const qualquer = (...papeis: Papel[]): Papel => v => {
  const vistos = new Set<string>();
  const out: Pessoa[] = [];
  for (const p of papeis) for (const x of p(v)) if (!vistos.has(x.id)) { vistos.add(x.id); out.push(x); }
  return out;
};

export const comIdade = (papel: Papel, min: number, max = 200): Papel => (v: Vida) =>
  papel(v).filter(p => idadePessoa(v, p) >= min && idadePessoa(v, p) <= max);
