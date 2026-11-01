/**
 * VIDA 12.6 — A CASA NO DIA A DIA. Antes, dentro de casa só dava para dar festa, juntar a família e reformar. Agora, o
 * que se faz numa casa de verdade: a faxina geral, organizar e desapegar, um fim de semana de descanso, maratonar uma
 * série, cuidar das plantas, consertar o que quebrou, receber alguém para um café, cozinhar a comida da semana.
 *
 * Cada coisa uma vez por ano (é o ano que conta, não a semana), com o que faz sentido para a idade e para a casa: quem
 * mora com os pais arruma o quarto e ajuda; a criança não conserta o chuveiro; o conserto sai do bolso de quem não sabe
 * fazer; a visita precisa de alguém por perto. O resultado lê quem mora junto (o par, os filhos, os pais) e o momento
 * (o trabalho puxado, a casa cheia de coisas). Sorteios derivados: nada aqui mexe na sequência das vidas.
 */
import type { Vida } from '../tipos';
import { escrever, idade, lembrarCom, parceiro, filhos, vinculosVivos } from '../nucleo';
import { clamp, rngDe, type Rng } from '../rng';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { pagar, vereditoDePagar } from './dinheiro';
import { economiaLocal } from '../dados/lugares';
import { moraComFamiliaDeOrigem } from './domicilio';
import { mesmaCidade } from './vinculos';
import { praticar } from './frentes';

export type FazerEmCasa = 'faxina' | 'organizar' | 'descansar' | 'serie' | 'plantas' | 'consertar' | 'visita' | 'cozinhar_semana';
export const FAZERES_EM_CASA: FazerEmCasa[] = ['faxina', 'organizar', 'cozinhar_semana', 'plantas', 'consertar', 'visita', 'serie', 'descansar'];

const IDADE_MIN: Record<FazerEmCasa, number> = { faxina: 10, organizar: 8, descansar: 6, serie: 8, plantas: 8, consertar: 14, visita: 12, cozinhar_semana: 14 };
const chave = (op: FazerEmCasa) => `casa126:${op}`;
const fezNoAno = (v: Vida, op: FazerEmCasa) => v.anoAtual.acoes.includes(chave(op));
const preco = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 10) * 10;
const comOsPais = (v: Vida) => moraComFamiliaDeOrigem(v);
const um = <T,>(r: Rng, xs: T[]): T => xs[Math.floor(r.next() * xs.length) % xs.length];
const hab = (v: Vida, d: 'manual' | 'cozinha' | 'campo') => v.caminhos.frentes[d]?.habilidade ?? 0;

/** Quem vem tomar um café (alguém próximo, na mesma cidade, que não mora com você). */
function visitaPossivel(v: Vida) {
  return vinculosVivos(v).filter(x => !x.p.especie && !x.vin.convivio.includes('casa') && mesmaCidade(v, x.p) && x.vin.proximidade >= 35 && x.vin.tensao < 50)
    .sort((a, b) => b.vin.proximidade - a.vin.proximidade)[0];
}

export function rotuloFazerEmCasa(v: Vida, op: FazerEmCasa): string {
  const pais = comOsPais(v);
  switch (op) {
    case 'faxina': return pais ? 'Ajudar na faxina da casa' : 'Fazer uma faxina geral';
    case 'organizar': return pais ? 'Arrumar o quarto e desapegar' : 'Organizar a casa e desapegar';
    case 'descansar': return 'Um fim de semana sem fazer nada';
    case 'serie': return 'Maratonar uma série';
    case 'plantas': return 'Cuidar das plantas';
    case 'consertar': return hab(v, 'manual') >= 45 ? 'Consertar o que quebrou' : `Chamar alguém para consertar o que quebrou (${preco(v, 180)})`;
    case 'visita': { const q = visitaPossivel(v); return q ? `Receber ${q.p.nome} para um café` : 'Receber alguém em casa'; }
    case 'cozinhar_semana': return 'Cozinhar a comida da semana';
  }
}

export function disponibilidadeFazerEmCasa(v: Vida, op: FazerEmCasa): Veredito {
  if (!FAZERES_EM_CASA.includes(op)) return bloqueio('impossivel', 'Isso não existe.');
  if (v.justica?.prisao) return bloqueio('incompativel', 'Não da prisão.');
  if (idade(v) < IDADE_MIN[op]) return bloqueio('impossivel', 'Ainda não é coisa para a sua idade.');
  if (fezNoAno(v, op)) return bloqueio('incompativel', 'Já fez isso este ano.');
  if (op === 'consertar' && comOsPais(v) && idade(v) < 18) return bloqueio('incompativel', 'Em casa dos pais, o conserto é com eles (pode ajudar quando pedirem).');
  if (op === 'consertar' && hab(v, 'manual') < 45) return vereditoDePagar(v, preco(v, 180), 'O conserto custa') ?? PERMITIDO;
  if (op === 'visita') { if (!visitaPossivel(v)) return bloqueio('incompativel', 'Ninguém próximo o bastante por perto para chamar agora.'); return vereditoDePagar(v, preco(v, 60), 'O café e o bolo custam') ?? PERMITIDO; }
  if (op === 'cozinhar_semana') return vereditoDePagar(v, preco(v, 120), 'As compras custam') ?? PERMITIDO;
  return PERMITIDO;
}

export function fazerEmCasa(v: Vida, op: FazerEmCasa): string {
  v.anoAtual.acoes.push(chave(op));
  const r = rngDe(v.id, 'casa126', op, v.t);
  const par = parceiro(v);
  const juntos = par && par.vin.convivio.includes('casa') ? par : undefined;
  const criancas = filhos(v).filter(f => f.vivo && Math.floor((v.t - f.tNasc) / 12) <= 14 && v.vinculos[f.id]?.convivio.includes('casa'));
  const pais = comOsPais(v);
  let texto = '';
  switch (op) {
    case 'faxina': {
      v.mente.estresse = clamp(v.mente.estresse - 3);
      if (juntos) juntos.vin.tensao = clamp(juntos.vin.tensao - 3);
      texto = pais ? um(r, ['Ajudou na faxina de sábado. A sua mãe conferiu os cantos — e aprovou, com ressalvas.', 'Faxina em família, música alta, e no fim a casa cheirando a limpeza.'])
        : criancas.length ? `Faxina geral com ${criancas.length > 1 ? 'as crianças' : 'a criança'} "ajudando": levou o dobro do tempo e foi o dobro de divertido.`
        : juntos ? `Faxina geral a dois: ${juntos.p.nome} na cozinha, você no banheiro. Ninguém brigou pela louça.`
        : um(r, ['Faxina geral, de cima a baixo. No fim do dia, a casa parecia outra — e você também.', 'Tirou o pó de onde nem lembrava que existia. Cansativo, e estranhamente bom.']);
      break;
    }
    case 'organizar': {
      v.mente.felicidade = clamp(v.mente.felicidade + 2);
      const muitas = (v.eu.estilo?.itens?.length ?? 0) + v.financas.bens.length > 25;
      texto = muitas ? 'Organizou armário por armário e separou três sacos para doar. Respirou melhor.' : pais ? 'Arrumou o quarto inteiro e achou coisas de quando era criança. Guardou uma, doou o resto.' : 'Organizou a casa: cada coisa num lugar. A semana começou mais leve.';
      break;
    }
    case 'descansar': {
      const puxado = v.trabalho.atual?.ritmo === 'puxado';
      const tocou = puxado && r.next() < 0.5;
      v.mente.estresse = clamp(v.mente.estresse - (tocou ? 2 : v.mente.estresse > 40 ? 6 : 3));
      texto = tocou ? 'Era para ser um fim de semana sem fazer nada. O celular do trabalho tocou no sábado de manhã.' : juntos ? `Um fim de semana de pijama, com ${juntos.p.nome}, sem plano nenhum. Fazia falta.` : 'Dormiu até tarde, cozinhou devagar, não saiu de casa. Fazia falta.';
      break;
    }
    case 'serie': {
      v.mente.estresse = clamp(v.mente.estresse - 2);
      if (juntos) { juntos.vin.proximidade = clamp(juntos.vin.proximidade + 2); texto = `Maratonaram uma série inteira, você e ${juntos.p.nome} — e agora brigam sobre o final.`; }
      else texto = um(r, ['Uma série inteira num fim de semana. O último episódio deixou um vazio.', 'Maratonou uma série que todo mundo comentava. Agora você comenta também.']);
      break;
    }
    case 'plantas': {
      praticar(v, r, 'campo', 0.15);
      v.mente.estresse = clamp(v.mente.estresse - 2);
      const jardim = v.rotinas.some(x => x.id === 'jardinagem');
      texto = jardim ? 'Trocou a terra dos vasos, fez mudas novas e deu algumas de presente.' : um(r, ['Regou, podou, trocou um vaso de lugar. A samambaia agradeceu.', 'Salvou uma planta que parecia perdida. Ela brotou duas semanas depois.']);
      break;
    }
    case 'consertar': {
      const coisa = um(r, ['o chuveiro', 'a torneira da cozinha', 'a porta do armário', 'a tomada da sala', 'a descarga']);
      if (hab(v, 'manual') >= 45) { praticar(v, r, 'manual', 0.2); texto = `Consertou ${coisa} com as próprias mãos e um vídeo de tutorial. Sentiu-se capaz.`; }
      else { pagar(v, preco(v, 180)); texto = `Chamou alguém para consertar ${coisa}. Resolveu em meia hora — e cobrou pela visita inteira.`; }
      break;
    }
    case 'visita': {
      const q = visitaPossivel(v)!;
      pagar(v, preco(v, 60));
      q.vin.proximidade = clamp(q.vin.proximidade + 4);
      q.vin.tUltimoContato = v.t;
      lembrarCom(v, q.p.id, 'Um café na sua casa.', 'ritual', 1);
      texto = `${q.p.nome} veio tomar um café. Era para ser uma hora; ${q.p.genero === 'feminino' ? 'ela' : 'ele'} foi embora à noite.`;
      break;
    }
    case 'cozinhar_semana': {
      pagar(v, preco(v, 120));
      praticar(v, r, 'cozinha', 0.2);
      v.mente.estresse = clamp(v.mente.estresse - 1);
      texto = hab(v, 'cozinha') >= 55 ? 'Domingo de panelas: a comida da semana inteira em potes na geladeira, etiquetada.' : 'Tentou cozinhar a comida da semana. Metade ficou boa; a outra metade, comestível.';
      break;
    }
  }
  escrever(v, { texto, relevancia: 'cotidiano', tema: 'casa', tom: 'bom' });
  return texto;
}
