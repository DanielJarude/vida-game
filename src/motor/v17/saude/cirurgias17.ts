/**
 * VIDA 17 · AS CIRURGIAS DO CORPO (e mais rosto, e os procedimentos funcionais) — no MESMO catálogo da clínica
 * (`sistemas/estetica`: a clínica, o preço da cidade, o risco, o resultado que não é garantido, a revisão, a genética
 * que não muda). Cada uma tem consequência na simulação, não só um botão:
 *
 *   bariátrica       para a obesidade grave; o corpo NÃO muda de uma vez: seis meses ainda iguais, depois a figura
 *                    passa a mediana; a forma física sobe por dois anos; os suplementos são para a vida inteira (sem
 *                    eles, a saúde cai devagar); a pele que sobra pede abdominoplastia; e o peso pode voltar, anos
 *                    depois, para quem para de se mexer ou bebe muito;
 *   lipoaspiração    tira gordura localizada (não trata obesidade): a cintura afina na figura; volta com o sedentarismo;
 *   abdominoplastia  tira a pele que sobra (depois de grande perda de peso, da gestação, da idade);
 *   mamoplastia      redutora: alivia o peso nas costas (a saúde agradece); prótese: aumenta — e pede troca com os anos;
 *   rosto            bichectomia (as bochechas afinam), mentoplastia (o queixo marcado), harmonização (o queixo e a boca
 *                    por dois anos), botox (as rugas aliviam por um ano);
 *   funcionais       septoplastia (respirar e dormir melhor), cirurgia refrativa (a miopia vai embora; a vista cansada
 *                    depois dos 42 vem igual).
 * Toda cirurgia tem recuperação (sem esforço físico nesse tempo) e pode complicar. Nada aqui é orientação médica.
 */
import { clamp } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever, idade } from '../../nucleo';
import { tipoDeCorpo } from '../../sistemas/silhueta';
import { geneticaDe } from '../../sistemas/identidade';
import { precisaDeOculos } from '../../sistemas/estilo';
import { lancar } from '../../sistemas/extrato';
import { pagar } from '../../sistemas/dinheiro';
import { economiaLocal } from '../../dados/lugares';
import { registrarProcedimentos, type Procedimento } from '../../sistemas/estetica';

const vis = (v: Vida) => v.eu.visual;
const masc = (v: Vida) => v.eu.genero === 'masculino';
const fez = (v: Vida, id: string) => (v.eu.procedimentos ?? []).some(x => x.id === id && x.resultado !== 'complicacao');

export const PROCEDIMENTOS17: Procedimento[] = [
  {
    id: 'bariatrica', nome: 'Cirurgia bariátrica', area: 'corpo', oque: 'reduz o estômago: o peso vai saindo ao longo de um ano e meio, com acompanhamento e suplementos para a vida toda',
    preco: 42000, recuperacao: 2, restricao: 6, idadeMin: 18, risco: 0.06,
    complicacoes: ['uma fístula na sutura que levou de volta ao hospital por semanas', 'a síndrome de dumping — enjoo e tontura a cada refeição doce, por meses', 'uma estenose que pediu dilatação por endoscopia'],
    cabe: v => (v.eu.cirurgia17?.bariatrica && !v.eu.cirurgia17.bariatrica.reganho ? 'Já fez a bariátrica.' : tipoDeCorpo(v) !== 'acima_do_peso' || v.corpo.forma >= 35 ? 'A bariátrica é para obesidade grave (com o corpo acima do peso e pouca forma física): não é o seu caso.' : null),
    aplicar: (v, _a, parcial) => { (v.eu.cirurgia17 ??= {}).bariatrica = { t: v.t, suplementos: true, ...(parcial ? { fraca: true } : {}) }; },
    depois: (v, _r, res) => {
      v.corpo.saude = clamp(v.corpo.saude + (res === 'complicacao' ? 0 : 3));
      return res === 'complicacao' ? undefined : 'O corpo não muda de uma vez: nos primeiros meses, a dieta líquida e a balança devagar; o espelho vai mudando ao longo do ano e meio. Os suplementos são para sempre.';
    }
  },
  {
    id: 'lipo', nome: 'Lipoaspiração', area: 'corpo', oque: 'tira a gordura localizada da cintura e do abdômen (não é tratamento de obesidade)',
    preco: 16000, recuperacao: 2, restricao: 2, idadeMin: 18, risco: 0.03,
    complicacoes: ['um seroma que precisou ser drenado no consultório', 'ondulações na pele onde a cânula passou', 'uma trombose na perna, tratada a tempo'],
    cabe: v => (tipoDeCorpo(v) === 'acima_do_peso' ? 'A lipo retira gordura localizada — não trata obesidade. Nesse peso, um cirurgião sério indica outro caminho.' : vis(v).contorno17 ? 'A cintura já foi feita.' : null),
    aplicar: (v, _a, parcial) => { if (!parcial) { vis(v).contorno17 = true; (v.eu.cirurgia17 ??= {}).lipo = v.t; } }
  },
  {
    id: 'abdominoplastia', nome: 'Abdominoplastia', area: 'corpo', oque: 'tira a pele que sobra no abdômen e firma a parede da barriga',
    preco: 21000, recuperacao: 3, restricao: 3, idadeMin: 18, risco: 0.045,
    complicacoes: ['uma deiscência na cicatriz que demorou a fechar', 'uma necrose pequena da pele, tratada com curativos por dois meses'],
    cabe: v => {
      const b = v.eu.cirurgia17?.bariatrica;
      if (vis(v).abdomen17) return 'Já fez.';
      return (b && v.t - b.t >= 12) || idade(v) >= 40 || (v.eu.genero !== 'masculino' && v.fatos.gestacao !== undefined) || Object.values(v.vinculos).some(x => x.parentesco === 'filho' && (v.pessoas[x.pessoaId]?.genitores ?? []).includes('eu') && v.eu.genero === 'feminino')
        ? null : 'Sem pele sobrando: a abdominoplastia é para depois de uma grande perda de peso, de uma gestação ou da idade.';
    },
    aplicar: (v, _a, parcial) => { if (!parcial) vis(v).abdomen17 = true; const b = v.eu.cirurgia17?.bariatrica; if (b) b.pele = false; }
  },
  {
    id: 'mamoplastia', nome: 'Mamoplastia redutora', area: 'corpo', oque: 'diminui as mamas — e o peso que puxava as costas e os ombros',
    preco: 18000, recuperacao: 2, restricao: 2, idadeMin: 18, risco: 0.03,
    cabe: v => (masc(v) ? 'A redutora aqui é para mamas grandes.' : vis(v).busto17 === 'menor' ? 'Já fez.' : null),
    aplicar: (v, _a, parcial) => { if (!parcial) vis(v).busto17 = 'menor'; else if (vis(v).busto17 === 'maior') delete vis(v).busto17; },
    depois: (v, _r, res) => { if (res === 'complicacao') return undefined; v.corpo.saude = clamp(v.corpo.saude + 3); v.mente.estresse = clamp(v.mente.estresse - 2); return 'A dor nas costas que vinha de anos foi diminuindo.'; }
  },
  {
    id: 'protese_mama', nome: 'Prótese de mama', area: 'corpo', oque: 'aumenta as mamas com implantes (que pedem troca com os anos)',
    preco: 15000, recuperacao: 1, restricao: 2, idadeMin: 18, risco: 0.03,
    complicacoes: ['uma contratura capsular: o implante endureceu e precisou ser trocado', 'uma infecção que obrigou a tirar a prótese por uns meses'],
    cabe: v => (masc(v) ? 'Esse procedimento aqui é para quem tem mamas.' : vis(v).busto17 === 'maior' ? 'Já tem prótese.' : null),
    aplicar: (v, _a, parcial) => { vis(v).busto17 = parcial && vis(v).busto17 === 'menor' ? undefined : 'maior'; if (vis(v).busto17 === 'maior') (v.eu.cirurgia17 ??= {}).protese = v.t; }
  },
  {
    id: 'bichectomia', nome: 'Bichectomia', area: 'rosto', oque: 'retira as bolas de gordura das bochechas: o rosto afina (e afina mais com a idade)',
    preco: 4500, recuperacao: 1, idadeMin: 18, risco: 0.02,
    cabe: v => (vis(v).bochecha17 ? 'Já fez.' : idade(v) >= 45 ? 'Depois dos 45, tirar volume do rosto costuma envelhecer — o cirurgião desaconselha.' : null),
    aplicar: (v, _a, parcial) => { if (!parcial) vis(v).bochecha17 = 'fina'; }
  },
  {
    id: 'mentoplastia', nome: 'Mentoplastia', area: 'rosto', oque: 'projeta o queixo (com prótese): o maxilar fica mais marcado',
    preco: 9500, recuperacao: 1, idadeMin: 18, risco: 0.025,
    cabe: v => (vis(v).queixo === 'marcado' ? 'O seu queixo já é marcado.' : null),
    aplicar: (v, _a, parcial) => { vis(v).queixo = parcial ? 'medio' : 'marcado'; }
  },
  {
    id: 'harmonizacao', nome: 'Harmonização facial', area: 'rosto', oque: 'preenchimento no queixo, na mandíbula e nos lábios (dura uns dois anos)',
    preco: 6500, recuperacao: 0, idadeMin: 18, risco: 0.02,
    complicacoes: ['um nódulo do preenchedor que precisou ser dissolvido', 'uma assimetria que levou meses para assentar'],
    cabe: v => (v.fatos.harmonizacao17 !== undefined && v.t - v.fatos.harmonizacao17 < 24 ? 'O preenchimento de antes ainda está aí.' : null),
    aplicar: (v, _a, parcial) => { if (!parcial) { vis(v).queixo = 'marcado'; if (vis(v).boca === 'fina') vis(v).boca = 'media'; } v.fatos.harmonizacao17 = v.t; }
  },
  {
    id: 'botox', nome: 'Toxina botulínica (botox)', area: 'rosto', oque: 'alivia as rugas da testa e dos olhos por cerca de um ano',
    preco: 1600, recuperacao: 0, idadeMin: 25, risco: 0.01,
    complicacoes: ['uma pálpebra caída por umas semanas', 'a testa paralisada demais — a cara de espanto passou em dois meses'],
    cabe: v => (idade(v) < 30 ? 'Antes dos 30, quase não há o que suavizar.' : vis(v).botox17 === idade(v) ? 'Já aplicou neste ano.' : null),
    aplicar: (v, _a, parcial) => { if (!parcial) vis(v).botox17 = idade(v); }
  },
  {
    id: 'septoplastia', nome: 'Septoplastia', area: 'funcional', oque: 'corrige o desvio do septo: respirar pelo nariz (e dormir) melhor',
    preco: 8000, recuperacao: 1, restricao: 1, idadeMin: 16, risco: 0.02,
    cabe: v => (v.fatos.septoplastia17 !== undefined ? 'Já fez.' : null),
    aplicar: v => { v.fatos.septoplastia17 = v.t; },
    depois: (v, _r, res) => { if (res === 'complicacao') return undefined; v.corpo.saude = clamp(v.corpo.saude + 3); v.mente.estresse = clamp(v.mente.estresse - 3); return 'Na primeira noite depois de tirar o tampão, você dormiu como não dormia havia anos.'; }
  },
  {
    id: 'refrativa', nome: 'Cirurgia refrativa (a laser)', area: 'funcional', oque: 'corrige a miopia: dá para largar os óculos de grau',
    preco: 7500, recuperacao: 0, idadeMin: 21, risco: 0.015,
    complicacoes: ['olho seco por meses, com colírio o dia todo', 'um halo nas luzes à noite que demorou a passar'],
    cabe: v => (v.fatos.refrativa17 !== undefined ? 'Já fez.' : idade(v) >= 42 ? 'Depois dos 42, o que pede óculos é a vista cansada — o laser não resolve.' : !precisaDeOculos(v) ? 'A sua vista não pede correção.' : null),
    aplicar: (v, _a, parcial) => {
      if (parcial) return;
      v.fatos.refrativa17 = v.t;
      if (vis(v).oculos === 'grau') { delete vis(v).oculos; delete vis(v).modeloOculos; }
      for (const it of v.eu.estilo?.itens ?? []) if (it.usando && /oculos_grau/.test(it.itemId)) it.usando = false;
    }
  }
];

/** O ano: o corpo da bariátrica muda aos poucos; os suplementos; o reganho; a prótese que pede troca; a harmonização que passa. */
export function processarCirurgias17(v: Vida): void {
  const c = v.eu.cirurgia17;
  const b = c?.bariatrica;
  if (b && !b.reganho) {
    const m = v.t - b.t;
    // A forma física sobe nos dois primeiros anos (o peso sai; mexer-se fica mais fácil).
    if (m > 0 && m <= 24) v.corpo.forma = clamp(v.corpo.forma + (b.fraca ? 4 : 7));
    if (m >= 12 && b.pele === undefined) { b.pele = true; escrever(v, { texto: 'A balança desceu muito depois da bariátrica — e sobrou pele no abdômen e nos braços.', relevancia: 'cotidiano', tema: 'saude' }); }
    // Os suplementos: para a vida inteira (custam todo ano; sem eles, a saúde cai devagar).
    if (b.suplementos) { const custo = Math.round(1800 * economiaLocal(v.moradia.municipioId).custo / 10) * 10; pagar(v, Math.min(custo, Math.max(0, v.financas.conta))); lancar(v, 'Suplementos pós-bariátrica', 'despesa', -custo); }
    else v.corpo.saude = clamp(v.corpo.saude - 3);
    // Sem dinheiro, os suplementos param (e voltam quando a conta permite).
    if (b.suplementos && v.financas.conta < 0) b.suplementos = false;
    else if (!b.suplementos && v.financas.conta > 8000) b.suplementos = true;
    // O reganho: depois de três anos, quem para de se mexer (ou bebe muito) pode recuperar o peso.
    const parado = v.corpo.habitos.sedentario || v.corpo.habitos.bebe === 'muito';
    if (m >= 36 && parado && hashAno(v, 'reganho') < (b.fraca ? 0.25 : 0.14)) {
      b.reganho = v.t;
      v.corpo.forma = clamp(v.corpo.forma - 15);
      escrever(v, { texto: 'O peso voltou, anos depois da bariátrica: o estômago se adaptou e a rotina parada cobrou.', relevancia: 'biografia', tema: 'saude', tom: 'ruim' });
    }
  }
  // A lipo não segura o sedentarismo: a cintura volta.
  if (c?.lipo !== undefined && v.t - c.lipo >= 36 && v.corpo.habitos.sedentario && v.eu.visual.contorno17 && hashAno(v, 'lipo') < 0.2) {
    delete v.eu.visual.contorno17;
    escrever(v, { texto: 'A gordura que a lipo tirou voltou a aparecer — em outros lugares.', relevancia: 'cotidiano', tema: 'saude', tom: 'ruim' });
  }
  // A prótese: com uns 12 anos, a troca é recomendada (fica dito; a cirurgia é escolha).
  if (c?.protese !== undefined && v.t - c.protese >= 144 && v.fatos.protese_troca17 === undefined) {
    v.fatos.protese_troca17 = v.t;
    escrever(v, { texto: 'O médico recomendou trocar a prótese de mama: o implante já tem mais de dez anos.', relevancia: 'cotidiano', tema: 'saude' });
  }
  // A harmonização passa (o queixo e a boca voltam aos de nascença, se não houve cirurgia definitiva).
  const h = v.fatos.harmonizacao17;
  if (h !== undefined && v.t - h >= 24) {
    delete v.fatos.harmonizacao17;
    const g = geneticaDe(v.eu);
    if (!fez(v, 'mentoplastia') && g?.queixo) v.eu.visual.queixo = g.queixo;
    if (!(v.fatos.preenchimento_labial !== undefined) && g?.boca) v.eu.visual.boca = g.boca;
  }
}

function hashAno(v: Vida, k: string): number {
  let h = 2166136261;
  const s = `${v.id}_${k}_${Math.floor(v.t / 12)}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

/** Em repouso depois de uma cirurgia (sem esforço físico)? O motivo, quando sim. */
export function emRepouso17(v: Vida): string | undefined {
  const ate = v.eu.restricao17;
  return ate !== undefined && v.t < ate ? 'O corpo ainda pede repouso depois da cirurgia: nada de academia, esporte ou aventura por enquanto.' : undefined;
}

registrarProcedimentos(PROCEDIMENTOS17, processarCirurgias17);
