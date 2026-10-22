/**
 * REWORK 10.5 · ECO-04 — O DINHEIRO DA CRIANÇA.
 *
 * Havia coisas úteis à infância nas lojas (o violino, a chuteira, o tabuleiro), mas a criança não tinha como comprá-las:
 * a mesada ia quase toda em lanche, as lojas abriam aos 10 e o motor só deixava comprar aos 12, e o único "trabalho"
 * infantil era vender doces na rua (proibido). Agora, sempre pela família e dentro do que é próprio da idade:
 *
 *   PEDIR AOS RESPONSÁVEIS   uma vez por ano: a resposta é deles — pela folga da casa, pela relação, pela idade
 *   PRESENTE EM DINHEIRO     o aniversário com os avós por perto (às vezes)
 *   GUARDAR                  a mesada deixa de sumir inteira em miudezas (a criança guarda parte)
 *   PEQUENAS ATIVIDADES      vender brigadeiros com a família ajudando; tarefas de casa que a família paga — uma vez
 *                            por ano cada, sem escola perdida, sem rua, sem nada perigoso ou ilegal
 *
 * Valores no custo de vida de onde se mora (`economiaLocal`), nunca reais fixos.
 */

import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { Vida } from '../tipos';
import { escrever, idade, idadePessoa, vinculosVivos } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { dinheiro as fmt } from '../texto';
import { recursosDaFamilia, responsaveis } from './origem';
import { moraComFamiliaDeOrigem } from './domicilio';

const local = (v: Vida, x: number) => Math.max(5, Math.round(x * economiaLocal(v.moradia.municipioId).custo / 5) * 5);
const feito = (v: Vida, k: string) => v.anoAtual.acoes.includes(`crianca:${k}`);

export type OqueCrianca = 'pedir' | 'brigadeiro' | 'tarefas';

export function disponibilidadeCrianca(v: Vida, oque: OqueCrianca): Veredito {
  const i = idade(v);
  if (i < 6 || i >= 16) return bloqueio('impossivel', i < 6 ? 'Ainda é cedo para lidar com dinheiro.' : 'Isso é coisa de criança: a partir daqui, o caminho é o trabalho de jovem (aprendiz, bicos) e o pedido de ajuda de adulto.');
  if (!moraComFamiliaDeOrigem(v) || !responsaveis(v).length) return bloqueio('impossivel', 'Sem os adultos da casa por perto, não há a quem pedir — nem quem ajude.');
  if (feito(v, oque)) return bloqueio('incompativel', 'Já foi feito este ano.');
  if (oque === 'brigadeiro' && i < 8) return bloqueio('impossivel', 'A partir dos 8, com um adulto ajudando na cozinha.');
  if (oque === 'tarefas' && i < 7) return bloqueio('impossivel', 'A partir dos 7.');
  return PERMITIDO;
}

/** Quanto a família consegue dar de uma vez (a folga da casa decide; a casa no limite quase não dá). */
const DA_FAMILIA = [0, 20, 50, 120, 300];

export function executarCrianca(v: Vida, r: Rng, oque: OqueCrianca): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  v.anoAtual.acoes.push(`crianca:${oque}`);
  const rec = recursosDaFamilia(v);
  const quem = responsaveis(v)[0];
  const nome = quem ? quem.p.nome : 'A família';
  switch (oque) {
    case 'pedir': {
      const rel = quem ? clamp((quem.vin.proximidade - 30) / 50, 0, 1) * clamp(1 - quem.vin.tensao / 120, 0.2, 1) : 0.5;
      const base = DA_FAMILIA[rec.folga] ?? 0;
      if (!base || !r.chance(0.35 + rel * 0.5)) {
        escrever(v, { texto: base ? `Pediu dinheiro a ${nome}. A resposta foi "agora não".` : `Pediu dinheiro a ${nome}, que explicou que o mês não deixava.`, relevancia: 'cotidiano', tema: 'familia', escolha: true });
        return { texto: base ? `${nome} disse que agora não dá — quem sabe no aniversário.` : `${nome} explicou, com calma, que o dinheiro da casa está contado este mês.`, tom: 'neutro' };
      }
      const valor = local(v, base * (0.6 + r.next() * 0.8));
      v.financas.conta += valor;
      escrever(v, { texto: `Pediu dinheiro a ${nome} e ganhou ${fmt(valor)} — com a recomendação de guardar.`, relevancia: 'cotidiano', tema: 'familia', escolha: true });
      return { texto: `${nome} deu ${fmt(valor)} — e pediu para guardar uma parte.`, tom: 'bom' };
    }
    case 'brigadeiro': {
      const custo = local(v, 25);
      const vendeu = Math.round(r.int(18, 40) * (rec.folga >= 3 ? 1 : 0.8));
      const valor = local(v, vendeu * 2) - custo;
      v.financas.conta += Math.max(0, valor);
      escrever(v, { texto: `Fez brigadeiros com ${nome} ajudando na panela e vendeu ${vendeu} para vizinhos e parentes. Lucro: ${fmt(Math.max(0, valor))}.`, relevancia: 'cotidiano', tema: 'familia', tom: 'bom', escolha: true });
      return { texto: `Vendeu ${vendeu} brigadeiros, com ${nome} ajudando: sobrou ${fmt(Math.max(0, valor))} depois do chocolate e do leite condensado.`, tom: 'bom' };
    }
    case 'tarefas': {
      const valor = local(v, [15, 30, 60, 100, 160][rec.folga] ?? 30);
      v.financas.conta += valor;
      v.personalidade.tracos.disciplina = clamp(v.personalidade.tracos.disciplina + 1, -100, 100);
      escrever(v, { texto: `Combinou com ${nome} tarefas de casa a mais (lavar o quintal, organizar a garagem) por ${fmt(valor)}.`, relevancia: 'cotidiano', tema: 'familia', escolha: true });
      return { texto: `Um mês de tarefas a mais em casa: ${fmt(valor)} na mão — e o quintal limpo.`, tom: 'bom' };
    }
  }
}

/** O aniversário: os avós (e os padrinhos) às vezes dão dinheiro — sorteio próprio, a sequência da vida não muda. */
export function presenteDeAniversario(v: Vida): void {
  const i = idade(v);
  if (i < 4 || i >= 18 || !moraComFamiliaDeOrigem(v)) return;
  const avos = vinculosVivos(v).filter(x => x.vin.parentesco === 'avo' && idadePessoa(v, x.p) < 95);
  if (!avos.length) return;
  const r = rngDe(v.id, 'aniversario_dinheiro', v.t);
  if (!r.chance(0.35)) return;
  const quem = avos[0].p;
  const valor = local(v, [20, 35, 60, 100, 160][recursosDaFamilia(v).folga] ?? 30);
  v.financas.conta += valor;
  escrever(v, { texto: `No aniversário, ${quem.nome} deu ${fmt(valor)} num envelope — "para você comprar o que quiser".`, relevancia: 'cotidiano', tema: 'familia', tom: 'bom', pessoas: [quem.id] });
}
