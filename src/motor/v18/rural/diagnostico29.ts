/**
 * VIDA 29 · A PROPRIEDADE EM LINGUAGEM DE GENTE — a leitura da mesma simulação da VIDA 18 (solo, água, pasto, gente,
 * máquinas, quem administra, dinheiro, clima, lavoura, animais, dívidas) para quem nunca tocou uma fazenda. Cada indicador
 * diz o que significa, como pesa na propriedade, o que acontece se piorar e o que fazer — com as ações que já existem,
 * o custo e o tempo. Puro: só lê. Nada aqui é contabilidade paralela: os números saem de `simularAno`, `custosFixos`,
 * `capacidadeUA`, `maoDeObra29`; o dinheiro é o da conta de sempre.
 */
import type { Vida } from '../../tipos';
import type { Acao } from '../../acoes';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { CULTURAS18, ESTRUTURAS18, REBANHOS18 } from '../../dados18/rural/catalogo18';
import {
  areaLivre, areaPasto, areaPlantada, capacidadeUA, climaDoAno, competenciaDaGestao, custoLocal, custosFixos, fmtHa, maoDeObra29, NOME_DA_GESTAO,
  quemAdministra, resumoDaPropriedade, salarioRural29, tecnologia, tecnologiaPropria, temEstrutura, tetoDaEstrutura, uaOcupadas, COLHEITA_MANUAL,
  type PropriedadeRural18
} from './fazenda18';
import { culturasPossiveis, custoDoSolo, mesNome, precoDaEstrutura, type OqueRural18 } from './acoes18';

export type Estado29 = 'bom' | 'atencao' | 'ruim';
export interface Passo29 { texto: string; acao?: Acao; custo?: number; tempo?: string }
export type IdIndicador29 = 'dinheiro' | 'solo' | 'agua' | 'pasto' | 'animais' | 'lavoura' | 'gente' | 'maquinas' | 'gestao' | 'clima' | 'dividas';
export interface Indicador29 {
  id: IdIndicador29;
  titulo: string;
  estado: Estado29;
  /** 0–100, para a barrinha (quando cabe). */
  valor?: number;
  /** Uma frase simples: como está. */
  resumo: string;
  significa: string;
  efeito: string;
  sePiorar: string;
  fazer: Passo29[];
  /** A linha técnica, para o modo detalhado. */
  tecnico?: string;
}

const r18 = (oque: OqueRural18): Acao => ({ tipo: 'rural18', oque });
const pct = (x: number) => `${Math.round(x * 100)}%`;
const n0 = (x: number) => Math.round(x).toLocaleString('pt-BR');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pior = (a: Estado29, b: Estado29): Estado29 => (a === 'ruim' || b === 'ruim' ? 'ruim' : a === 'atencao' || b === 'atencao' ? 'atencao' : 'bom');

/** O quanto o solo de hoje rende perto de um solo médio (60), pela mesma conta da produtividade. */
const rendimentoDoSolo = (solo: number) => (0.6 + solo / 150) / (0.6 + 60 / 150);

export function diagnosticoDaPropriedade(v: Vida, p: PropriedadeRural18): Indicador29[] {
  const ano = anoDe(v.t);
  const c = custoLocal(p.municipioId);
  const r = resumoDaPropriedade(v, p);
  const producao = p.uso === 'producao';
  const plantada = areaPlantada(p);
  const out: Indicador29[] = [];

  /* ---------------------------------------------------------------- Dinheiro */
  const normal = r.previsao.receita - r.previsao.custo;
  const custosGrandes = [...r.previsao.linhas].filter(l => l.custo > 0).sort((a, b) => b.custo - a.custo).slice(0, 3);
  {
    const estado: Estado29 = normal >= 0 ? 'bom' : producao ? 'ruim' : 'atencao';
    out.push({
      id: 'dinheiro', titulo: 'Dinheiro', estado,
      resumo: p.uso === 'arrendada' ? `Arrendada: entra ${fmt(p.arrendamento?.valorAno ?? 0)} por ano, sem trabalho seu.`
        : !producao ? `Parada (${p.uso === 'residencia' ? 'casa e lazer' : 'investimento'}): custa ${fmt(Math.abs(normal))} por ano e não produz.`
        : normal >= 0 ? `Num ano normal, sobram uns ${fmt(normal)}.` : `Num ano normal, a propriedade fecha no vermelho: uns ${fmt(-normal)}.`,
      significa: 'O que entra (a venda da safra e dos animais) menos o que sai (insumo, gente, manutenção, imposto). É o mesmo dinheiro da sua conta: o resultado do ano entra (ou sai) na virada, e aparece no extrato.',
      efeito: custosGrandes.length ? `Os maiores gastos: ${custosGrandes.map(l => `${l.oque.toLowerCase()} (${fmt(l.custo)})`).join(', ')}.` : 'Quase nenhum gasto fixo.',
      sePiorar: 'O prejuízo sai da sua conta na virada do ano. Sem saldo, vira dívida — e a dívida rural mal paga leva ao nome sujo e, no fim, à perda da terra.',
      fazer: [
        ...(!producao && p.uso !== 'arrendada' ? [{ texto: 'Pôr a terra para produzir (Administração → Uso), ou arrendá-la a quem produza.', acao: r18({ op: 'uso', id: p.id, uso: 'producao' }) }] : []),
        ...(producao && normal < 0 ? [{ texto: 'Olhar linha a linha em Finanças: a lavoura que não se paga sai; o custo fixo grande (gerente, máquina parada) se corta.', tempo: 'vale na próxima safra' }] : []),
        ...(producao && normal >= 0 && p.venda29 === undefined && p.talhoes.length ? [{ texto: 'Escolher como vender (Administração): contrato trava o preço, armazém espera a alta, feira vende direto.' }] : [])
      ],
      tecnico: `Previsão (ano normal, preço médio): receita ${fmt(r.previsao.receita)} · custo ${fmt(r.previsao.custo)}.${r.ultimo ? ` Último ano (${r.ultimo.ano}): ${r.ultimo.resultado >= 0 ? '+' : '−'}${fmt(Math.abs(r.ultimo.resultado))}.` : ''}`
    });
  }

  if (p.uso === 'arrendada') return out;

  /* ---------------------------------------------------------------- Solo */
  {
    const cansando = p.talhoes.filter(t => CULTURAS18[t.cultura].ciclo === 'anual' && (t.repete ?? 0) >= 3);
    const lot = uaOcupadas(p) / Math.max(1, capacidadeUA(p));
    const estado: Estado29 = p.solo < 50 ? 'ruim' : p.solo < 65 || cansando.length || lot > 1.1 ? 'atencao' : 'bom';
    const rend = rendimentoDoSolo(p.solo);
    const recente = p.tRecuperacao !== undefined && ano - p.tRecuperacao < 3;
    out.push({
      id: 'solo', titulo: 'A terra (fertilidade)', estado, valor: p.solo,
      resumo: p.solo >= 70 ? 'A terra está fértil.' : p.solo >= 50 ? 'A terra está razoável: produz, mas sem sobra.' : 'A terra está perdendo qualidade e vai produzir menos.',
      significa: 'Fertilidade é o quanto a terra tem de nutriente e de estrutura para a planta crescer e o capim rebrotar.',
      efeito: `Hoje a terra rende cerca de ${pct(rend)} do que rende um solo médio da região — na lavoura e no pasto.${cansando.length ? ` ${cap(CULTURAS18[cansando[0].cultura].nome)} no mesmo lugar há anos (monocultura): o chão cansa e a praga volta mais forte.` : ''}${lot > 1.1 ? ' O pasto lotado também gasta o solo.' : ''}`,
      sePiorar: 'Abaixo de 50, cada safra rende menos e o pasto sustenta menos animais; a queda é lenta, e a volta também.',
      fazer: [
        ...(p.solo < 90 ? [{ texto: recente ? `A correção feita em ${p.tRecuperacao} ainda está agindo: dá para repetir a partir de ${p.tRecuperacao! + 3}.` : 'Corrigir o solo: calcário, gesso e adubação verde (a fertilidade sobe 16 pontos).', acao: recente ? undefined : r18({ op: 'solo', id: p.id }), custo: recente ? undefined : custoDoSolo(p), tempo: 'o efeito aparece na safra seguinte' }] : []),
        ...(cansando.length ? [{ texto: 'Alternar as culturas: depois de milho, soja ou feijão (leguminosas devolvem nitrogênio ao solo). Na soja, o milho safrinha já conta como rotação.', tempo: 'a cada safra' }] : []),
        ...(p.manejo !== 'organico' && p.solo < 65 ? [{ texto: 'O manejo orgânico melhora o solo um pouco todo ano (mas rende menos na transição).' }] : [])
      ],
      tecnico: `Solo ${p.solo}/100 · fator de produtividade ${(0.6 + p.solo / 150).toFixed(2)} (média 1,00)${p.tRecuperacao !== undefined ? ` · última correção ${p.tRecuperacao}` : ''}.`
    });
  }

  /* ---------------------------------------------------------------- Água */
  {
    const sofrem = p.talhoes.filter(t => !t.irrigado && CULTURAS18[t.cultura].agua * 100 > p.agua + 15);
    const guardada = temEstrutura(p, 'represa') ? 'represa' : temEstrutura(p, 'poco') ? 'poço' : '';
    const estado: Estado29 = p.agua < 40 || sofrem.some(t => CULTURAS18[t.cultura].agua * 100 > p.agua + 35) ? 'ruim' : p.agua < 65 || sofrem.length ? 'atencao' : 'bom';
    const perda = (t: typeof p.talhoes[number]) => Math.round((1 - (0.75 + 0.25 * Math.min(1, (p.agua + 30) / (CULTURAS18[t.cultura].agua * 100 + 30)))) * 100);
    out.push({
      id: 'agua', titulo: 'Água', estado, valor: p.agua,
      resumo: p.agua >= 65 ? 'Há água de sobra: rio, nascente ou chuva boa.' : p.agua >= 40 ? 'A água dá para o normal, mas aperta na estiagem.' : 'A água é pouca: a lavoura sofre e o gado emagrece na seca.',
      significa: 'Quanto de água a propriedade tem — chuva, rio, nascente, poço — para a planta e para os animais.',
      efeito: sofrem.length ? `${sofrem.map(t => `${CULTURAS18[t.cultura].nome} rende até ${perda(t)}% menos`).join('; ')} por falta de água, sem irrigação.` : `Nenhuma lavoura passa sede hoje.${r.irrigaveis > 0 ? ` A irrigação dá conta de ${fmtHa(r.irrigaveis)}.` : ''}`,
      sePiorar: `Num ano de seca, quem não guarda água perde boa parte da colheita${guardada ? ` (a ${guardada} segura uma parte)` : ''}; o pasto queima e a represa baixa.`,
      fazer: [
        ...(!temEstrutura(p, 'poco') ? [{ texto: 'Furar um poço artesiano: água dos animais garantida o ano todo.', acao: r18({ op: 'construir', id: p.id, estrutura: 'poco' }), custo: precoDaEstrutura(p, 'poco'), tempo: 'pronto em semanas' }] : []),
        ...(!temEstrutura(p, 'represa') && p.ha >= 20 ? [{ texto: 'Fazer uma represa: guarda a chuva para a estiagem e permite irrigar de verdade.', acao: r18({ op: 'construir', id: p.id, estrutura: 'represa' }), custo: precoDaEstrutura(p, 'represa'), tempo: 'uma estação de obra' }] : []),
        ...(sofrem.length && plantada > 0 ? [{ texto: 'Irrigar a cultura que mais sofre (gotejamento no pequeno, pivô no grande) — em Construções e equipamentos.' }] : []),
        ...(plantada > 0 && !p.seguro ? [{ texto: 'Contratar o seguro rural: paga parte da perda num ano muito ruim.', acao: r18({ op: 'seguro', id: p.id }) }] : [])
      ],
      tecnico: `Água ${p.agua}/100 · irrigáveis ${fmtHa(r.irrigaveis)}${guardada ? ` · ${guardada}` : ''}.`
    });
  }

  /* ---------------------------------------------------------------- Pasto */
  const comPasto = p.rebanhos.some(rb => REBANHOS18[rb.especie].ua > 0) || (producao && areaPasto(p) > 2 && (p.tipo === 'pecuaria' || p.tipo === 'sitio' || p.tipo === 'haras'));
  if (comPasto) {
    const capUA = capacidadeUA(p);
    const ocup = uaOcupadas(p);
    const lot = ocup / Math.max(1, capUA);
    const principal = [...p.rebanhos].filter(rb => REBANHOS18[rb.especie].ua > 0).sort((a, b) => b.cabecas * REBANHOS18[b.especie].ua - a.cabecas * REBANHOS18[a.especie].ua)[0];
    const porte = principal ? REBANHOS18[principal.especie] : REBANHOS18.corte;
    const cabem = Math.floor(capUA / porte.ua);
    const hoje = principal ? Math.round(ocup / porte.ua) : 0;
    const estado: Estado29 = lot > 1.1 ? 'ruim' : lot > 0.9 ? 'atencao' : 'bom';
    const ex = principal && lot > 1 ? Math.ceil((ocup - capUA) / porte.ua) : 0;
    out.push({
      id: 'pasto', titulo: 'Pasto (quantos animais cabem)', estado, valor: Math.min(100, lot * 100),
      resumo: `O pasto sustenta cerca de ${n0(cabem)} ${porte.unidade} de ${porte.nome}${principal ? `; hoje há o equivalente a ${n0(hoje)}` : ''}.`,
      significa: `Quantos animais o capim alimenta sem se acabar. A conta é em animais adultos do porte de ${porte.nome} (os técnicos dizem "UA", unidade animal: um boi de uns 450 kg). Animal no cocho (suplementado ou confinado) pesa menos no pasto.`,
      efeito: lot > 1.1 ? `Há uns ${n0(ex)} animais a mais do que o pasto aguenta: o capim não rebrota, o solo perde fertilidade todo ano e os animais adoecem mais.`
        : lot > 0.9 ? 'O pasto está no limite: num ano de seca, falta comida.'
        : principal ? `Sobra pasto: cabem mais uns ${n0(cabem - hoje)}.` : 'O pasto está vazio: dá para criar ou arrendar a área para quem cria.',
      sePiorar: 'Pasto lotado vira pasto degradado: o solo cai, o rebanho emagrece, a sanidade despenca e a receita cai junto.',
      fazer: lot > 0.9 && principal ? [
        { texto: `Vender parte do rebanho (um quarto: ${n0(principal.cabecas * 0.25)} ${porte.unidade}).`, acao: r18({ op: 'vender_animais', id: p.id, especie: principal.especie, fracao: 0.25 }), tempo: 'na hora' },
        ...(principal.alimentacao === 'pasto' ? [{ texto: 'Dar suplemento no cocho: cada animal passa a pesar menos no pasto (custa ração).', acao: r18({ op: 'manejo', id: p.id, especie: principal.especie, alimentacao: 'suplementado' }) }] : []),
        ...(p.solo < 70 ? [{ texto: 'Corrigir o solo: o capim volta mais forte e o pasto comporta mais.', acao: r18({ op: 'solo', id: p.id }), custo: custoDoSolo(p) }] : [])
      ] : principal && lot < 0.6 ? [{ texto: 'Comprar mais um lote (Animais).', acao: r18({ op: 'animais', id: p.id, especie: principal.especie, lotes: 1 }) }] : [],
      tecnico: `${n0(capUA)} UA de capacidade em ${fmtHa(areaPasto(p))} de pasto · ${n0(ocup)} UA ocupadas (lotação ${lot.toFixed(2)}).`
    });
  }

  /* ---------------------------------------------------------------- Animais */
  if (p.rebanhos.length) {
    const problemas = p.rebanhos.map(rb => {
      const d = REBANHOS18[rb.especie];
      const teto = tetoDaEstrutura(p, rb.especie);
      return { rb, d, teto, acima: Number.isFinite(teto) && rb.cabecas > teto };
    });
    const doente = problemas.filter(x => x.rb.sanidade < 45);
    const atencao = problemas.filter(x => x.rb.sanidade < 70);
    const acima = problemas.filter(x => x.acima);
    const estado: Estado29 = doente.length || acima.length ? 'ruim' : atencao.length ? 'atencao' : 'bom';
    const minSan = Math.min(...p.rebanhos.map(rb => rb.sanidade));
    out.push({
      id: 'animais', titulo: 'Saúde dos animais', estado, valor: minSan,
      resumo: doente.length ? `${cap(doente[0].d.nome)}: a saúde do rebanho está em risco (${doente[0].d.doenca}).` : acima.length ? `${cap(acima[0].d.nome)}: mais animais do que a estrutura comporta.` : atencao.length ? `${cap(atencao[0].d.nome)}: a vacinação e o trato pedem atenção.` : 'Os animais estão saudáveis.',
      significa: 'Sanidade é vacina em dia, verme controlado, água limpa, lugar para todos. Cada criação tem a sua estrutura (curral, aviário, aprisco...).',
      efeito: 'Animal doente produz menos, pare menos e morre mais; num surto, perde-se uma parte do rebanho de uma vez.',
      sePiorar: `Abaixo de 45, o risco de surto (${p.rebanhos.map(rb => REBANHOS18[rb.especie].doenca).filter((x, k, a) => a.indexOf(x) === k).slice(0, 2).join(', ')}) fica alto.`,
      fazer: [
        ...atencao.filter(x => x.rb.sanitario !== 'completo').slice(0, 2).map(x => ({ texto: `Manejo sanitário completo para ${x.d.nome}: vacina, vermífugo, veterinário.`, acao: r18({ op: 'manejo', id: p.id, especie: x.rb.especie, sanitario: 'completo' }), tempo: 'melhora ao longo do ano' })),
        ...acima.slice(0, 1).filter(x => x.d.estrutura).map(x => ({ texto: `Construir ${ESTRUTURAS18[x.d.estrutura!].nome} (hoje cabem ${n0(x.teto)}).`, acao: r18({ op: 'construir', id: p.id, estrutura: x.d.estrutura! }), custo: precoDaEstrutura(p, x.d.estrutura!) }))
      ],
      tecnico: p.rebanhos.map(rb => `${REBANHOS18[rb.especie].nome}: ${n0(rb.cabecas)} · sanidade ${rb.sanidade} · genética ${rb.genetica}`).join(' · ')
    });
  }

  /* ---------------------------------------------------------------- Lavoura */
  if (producao && (p.talhoes.length || areaLivre(p) > 1)) {
    const formando = p.talhoes.filter(t => { const k = CULTURAS18[t.cultura]; return (k.ciclo === 'perene' || k.ciclo === 'semiperene') && ano - t.ano < (k.formacao ?? 0); });
    const livre = areaLivre(p);
    const melhor = culturasPossiveis(p)[0];
    const parada = livre > Math.max(2, r.util * 0.3) && !p.rebanhos.some(rb => REBANHOS18[rb.especie].ua > 0);
    const estado: Estado29 = !p.talhoes.length && parada ? 'atencao' : parada ? 'atencao' : 'bom';
    out.push({
      id: 'lavoura', titulo: 'Plantação', estado,
      resumo: p.talhoes.length ? `${p.talhoes.map(t => `${CULTURAS18[t.cultura].nome} em ${fmtHa(t.ha)}`).join(', ')}.` : 'Nada plantado.',
      significa: 'Cada talhão é um pedaço de terra com uma cultura. A anual (soja, milho) se planta e colhe no ano; a perene (café, pomar) leva anos para começar a dar; a floresta, anos até o corte.',
      efeito: [
        ...p.talhoes.filter(t => CULTURAS18[t.cultura].ciclo === 'anual').slice(0, 3).map(t => `${cap(CULTURAS18[t.cultura].nome)} colhe de ${mesNome(CULTURAS18[t.cultura].colheita[0])} a ${mesNome(CULTURAS18[t.cultura].colheita[1])}`),
        ...formando.slice(0, 2).map(t => `${cap(CULTURAS18[t.cultura].nome)} em formação: começa a dar em ${t.ano + (CULTURAS18[t.cultura].formacao ?? 0)}`)
      ].join('. ') + (p.talhoes.length ? '.' : '') + (livre > 1 ? ` Há ${fmtHa(livre)} livres${parada ? ', sem uso' : ''}.` : ''),
      sePiorar: 'Terra parada não rende e paga mais imposto (o ITR da terra mal usada é cinco vezes o da bem usada).',
      fazer: parada && melhor ? [{ texto: `Plantar ${CULTURAS18[melhor.c].nome}${melhor.aptidao >= 1.05 ? ' (a região favorece)' : ''} em Plantação: custa uns ${fmt(CULTURAS18[melhor.c].custoHa * c)} por hectare.`, tempo: CULTURAS18[melhor.c].ciclo === 'anual' ? 'colhe no ano' : `começa a dar em ${CULTURAS18[melhor.c].formacao ?? CULTURAS18[melhor.c].vidaUtil} anos` }] : [],
      tecnico: `Útil ${fmtHa(r.util)} · plantada ${fmtHa(plantada)} · livre ${fmtHa(livre)} · reserva legal ${pct(r.reserva)}.`
    });
  }

  if (!producao) return out;

  /* ---------------------------------------------------------------- Gente (mão de obra) */
  const mo = maoDeObra29(v, p);
  if (mo.precisa >= 0.5 || p.equipe29) {
    const manual = p.talhoes.some(t => COLHEITA_MANUAL.has(t.cultura));
    const faltam = Math.max(0, Math.ceil(mo.precisa - mo.familia - mo.equipe));
    const estado: Estado29 = mo.modo === 'equipe' && mo.cobertura < 0.8 ? 'ruim' : mo.modo === 'diaristas' && mo.precisa >= 4 && manual && mo.cobertura < 1 ? 'atencao' : 'bom';
    const sugestao = Math.max(1, Math.ceil(mo.precisa - mo.familia));
    out.push({
      id: 'gente', titulo: 'Gente para o trabalho', estado, valor: Math.min(100, mo.cobertura * 100),
      resumo: `O serviço pede umas ${n0(Math.max(1, mo.precisa))} ${mo.precisa < 1.5 ? 'pessoa' : 'pessoas'} o ano inteiro; ${mo.modo === 'equipe' ? `há ${mo.equipe} na equipe fixa${mo.familia ? ' mais o seu braço' : ''}` : 'hoje são diaristas contratados na safra'}.`,
      significa: 'Mão de obra: quem planta, trata, ordenha, colhe. Pode ser diarista (paga por dia, na safra) ou equipe fixa (carteira assinada, o ano inteiro). Máquina tira gente da lavoura; ordenhadeira tira do leite.',
      efeito: mo.modo === 'equipe'
        ? (mo.cobertura >= 1 ? 'A equipe cobre o serviço: a lavoura dispensa parte das diárias (fica mais barata) e quem conhece a terra trabalha melhor.' : `Faltam ${faltam} na equipe: parte da colheita fica no pé e o trato dos animais atrasa.`)
        : manual && mo.precisa >= 4 ? 'Com diaristas, a colheita manual depende de achar gente na hora: em ano de aperto, falta, e uma parte se perde.' : 'Os diaristas dão conta: o custo já está no gasto por hectare.',
      sePiorar: 'Gente de menos é colheita perdida e animal mal tratado; gente demais é salário sem serviço.',
      fazer: [
        ...(mo.modo === 'diaristas' || faltam > 0 ? [{ texto: `Registrar uma equipe de ${sugestao} (${fmt(salarioRural29(p))} por pessoa por ano, com encargos).`, acao: r18({ op: 'equipe29', id: p.id, n: sugestao }), custo: sugestao * salarioRural29(p), tempo: 'contrata no mês' }] : []),
        ...(mo.modo === 'equipe' && mo.cobertura > 1.6 ? [{ texto: `Reduzir a equipe (rescisão: dois meses de salário por pessoa).`, acao: r18({ op: 'equipe29', id: p.id, n: Math.max(0, Math.ceil(mo.precisa - mo.familia)) }) }] : []),
        ...(tecnologia(p) < 1 && plantada > 0 ? [{ texto: 'Mecanizar (ou contratar máquina por empreitada) tira gente da lavoura.' }] : [])
      ],
      tecnico: `Precisa ${mo.precisa} · equipe ${mo.equipe} · você ${mo.familia} · cobertura ${pct(mo.cobertura)}.`
    });
  }

  /* ---------------------------------------------------------------- Máquinas */
  if (plantada > 0) {
    const tec = tecnologia(p);
    const propria = tecnologiaPropria(p);
    const estado: Estado29 = tec < 0.5 && plantada > 100 ? 'ruim' : tec < 0.5 && plantada > 5 ? 'atencao' : 'bom';
    const custoEmp = Math.round(plantada * 280 * c);
    out.push({
      id: 'maquinas', titulo: 'Máquinas e tecnologia', estado, valor: tec / 3 * 100,
      resumo: propria >= 1 ? `A casa tem máquinas próprias (nível ${propria.toLocaleString('pt-BR')} de 3).` : p.empreitada29 ? 'O serviço de máquina é contratado por empreitada.' : 'Quase tudo é feito na mão ou com máquina emprestada.',
      significa: 'Tecnologia é fazer cada etapa na hora certa: plantar no ponto, aplicar na janela, colher sem esperar. Não precisa comprar: no pequeno, contrata-se a máquina do vizinho ou de uma prestadora por hectare (empreitada).',
      efeito: `Cada nível de tecnologia rende uns 5% a mais de colheita e diminui o estrago da praga. Hoje: nível ${tec.toLocaleString('pt-BR')} de 3.`,
      sePiorar: 'Máquina velha ou sem máquina: a lavoura perde a janela, a praga pega mais, a colheita atrasa.',
      fazer: [
        ...(propria < 1.2 ? [{ texto: p.empreitada29 ? 'Parar a empreitada (só as máquinas da casa).' : `Contratar máquina por empreitada: uns ${fmt(custoEmp)} por ano para ${fmtHa(plantada)} — sem comprar trator.`, acao: r18({ op: 'empreitada29', id: p.id }), custo: p.empreitada29 ? undefined : custoEmp, tempo: 'vale na safra' }] : []),
        ...(plantada >= 30 && propria < 1 ? [{ texto: 'Na área grande, comprar o trator compensa (Construções e equipamentos).' }] : [])
      ],
      tecnico: `Tecnologia ${tec} (própria ${propria}${p.empreitada29 ? ', empreitada 1,2' : ''}).`
    });
  }

  /* ---------------------------------------------------------------- Quem administra */
  {
    const quem = quemAdministra(v, p);
    const comp = competenciaDaGestao(v, p);
    const estado: Estado29 = comp >= 45 ? 'bom' : comp >= 36 ? 'atencao' : 'ruim';
    out.push({
      id: 'gestao', titulo: 'Quem administra', estado, valor: comp,
      resumo: `Quem cuida: ${NOME_DA_GESTAO[quem]}. A condução vale ${comp} de 100.`,
      significa: 'Administrar é decidir a hora de plantar, de vacinar, de comprar insumo, de vender. Quem sabe mais erra menos. Dá para fazer você mesmo ou delegar a um caseiro, a um gerente ou a uma administradora rural.',
      efeito: `A condução pesa na colheita (até uns 10%), na praga e na saúde dos animais.${p.assistencia29 ? ' A assistência técnica já ajuda.' : ''}`,
      sePiorar: 'Quem não conhece o ofício perde a janela do plantio, aduba errado, vende na hora pior.',
      fazer: [
        ...(!p.assistencia29 ? [{ texto: p.ha <= 50 ? 'Pedir a assistência técnica da Emater (quase de graça no pequeno).' : 'Contratar um agrônomo que visite todo mês.', acao: r18({ op: 'assistencia29', id: p.id }), custo: Math.round((p.ha <= 50 ? 800 : 7000 + p.ha * 12) * c), tempo: 'por ano' }] : []),
        ...(quem !== 'empresa' && quem !== 'produtor' && p.ha >= 100 ? [{ texto: 'Entregar a uma administradora rural: método e técnico, custo por hectare.', acao: r18({ op: 'admin29', id: p.id, admin: 'empresa' }), custo: Math.round((36000 + p.ha * 110) * c), tempo: 'por ano' }] : []),
        ...(quem === 'caseiro' && p.ha >= 40 ? [{ texto: 'Trocar o caseiro por um gerente (a área já pede).', acao: r18({ op: 'admin29', id: p.id, admin: 'gerente' }) }] : []),
        ...(quem !== 'produtor' ? [{ texto: 'Um curso técnico agrícola ou agronomia aumenta o que você sabe do campo (Formação).' }] : [])
      ],
      tecnico: `Competência ${comp} · ${quem}${p.admin29 ? ' (escolhido)' : ' (automático)'}.`
    });
  }

  /* ---------------------------------------------------------------- Clima e seguro */
  if (plantada > 0) {
    const passado = climaDoAno(v, p.municipioId, ano - 1);
    const seguroCusto = custosFixos(v, p, ano).find(l => l.oque.startsWith('Seguro'))?.custo ?? Math.round(p.talhoes.reduce((s, t) => s + CULTURAS18[t.cultura].custoHa * t.ha, 0) * 0.04 * c * (p.car19 !== undefined ? 0.7 : 1));
    const estado: Estado29 = !p.seguro && plantada > 20 ? 'atencao' : 'bom';
    out.push({
      id: 'clima', titulo: 'Clima e seguro', estado,
      resumo: `${passado.tipo === 'bom' ? 'O ano passado foi bom na região' : passado.tipo === 'normal' ? 'O ano passado foi normal' : `O ano passado teve ${passado.tipo}`}. ${p.seguro ? 'A lavoura está no seguro.' : 'A lavoura não tem seguro.'}`,
      significa: 'O clima muda a safra de um ano para o outro: seca, geada, chuva demais, granizo. O seguro rural paga parte da perda quando a quebra passa de 30%.',
      efeito: p.seguro ? `O seguro custa uns ${fmt(seguroCusto)} por ano e cobre 70% da perda acima de 30%.${p.car19 !== undefined ? ' Com o CAR em dia, o governo paga parte do prêmio.' : ''}` : 'Sem seguro, um ano ruim cai inteiro na sua conta.',
      sePiorar: 'Dois anos ruins seguidos sem seguro e sem reserva quebram uma lavoura financiada.',
      fazer: [
        ...(!p.seguro ? [{ texto: 'Contratar o seguro rural.', acao: r18({ op: 'seguro', id: p.id }), custo: seguroCusto, tempo: 'por ano' }] : []),
        ...(p.car19 === undefined ? [{ texto: 'Fazer o CAR (Finanças → Papelada): barateia o seguro e abre o crédito rural.' }] : [])
      ],
      tecnico: `Clima ${ano - 1}: ${passado.tipo} (severidade ${passado.severidade}).`
    });
  }

  /* ---------------------------------------------------------------- Dívidas */
  {
    const fin = v.financas.dividas.filter(d => d.bemId && todasDoImovel(v, p).includes(d.bemId));
    const s19 = p.safra19;
    if (fin.length || s19) {
      const vence = s19 && s19.vence <= ano;
      const estado: Estado29 = vence ? 'atencao' : 'bom';
      out.push({
        id: 'dividas', titulo: 'Dívidas da propriedade', estado,
        resumo: [s19 ? `Custeio do Plano Safra: ${fmt(s19.valor)} a ${pct(s19.taxa)} ao ano, vence em ${s19.vence}` : '', fin.length ? `financiamento da terra: ${fmt(fin.reduce((x, d) => x + d.saldo, 0))} de saldo, ${fmt(fin.reduce((x, d) => x + d.parcela, 0))} por mês` : ''].filter(Boolean).join('; ') + '.',
        significa: 'O custeio é o dinheiro do banco para plantar, pago na colheita; o financiamento é a compra da terra em parcelas. Os dois estão nas suas Finanças, com o resto.',
        efeito: 'As parcelas saem da conta todo mês; o custeio, de uma vez no vencimento.',
        sePiorar: 'Custeio não pago vira dívida cara e o nome no cadastro de devedores; financiamento atrasado pode levar a terra.',
        fazer: vence ? [{ texto: 'Quitar ou prorrogar o custeio (Finanças → Papelada).' }] : [],
        tecnico: s19 ? `Linha ${s19.linha}${s19.prorrogado ? ' (prorrogado)' : ''}.` : undefined
      });
    }
  }
  return out;
}

function todasDoImovel(v: Vida, p: PropriedadeRural18): string[] {
  return v.financas.bens.filter(b => b.tipo === 'imovel' && b.rural === p).map(b => b.id);
}

/** As decisões que mais pesam agora: o primeiro passo de cada indicador ruim, depois os de atenção (até `max`). */
export function decisoesRecomendadas(ind: Indicador29[], max = 4): (Passo29 & { porque: string; estado: Estado29; de: IdIndicador29 })[] {
  const ordem = [...ind.filter(i => i.estado === 'ruim'), ...ind.filter(i => i.estado === 'atencao')];
  const out: (Passo29 & { porque: string; estado: Estado29; de: IdIndicador29 })[] = [];
  for (const i of ordem) {
    const passo = i.fazer.find(f => f.acao) ?? i.fazer[0];
    if (passo) out.push({ ...passo, porque: i.resumo, estado: i.estado, de: i.id });
    if (out.length >= max) break;
  }
  return out;
}

/** A frase do topo: a situação geral, em uma linha. */
export function situacaoDaPropriedade(ind: Indicador29[]): { estado: Estado29; frase: string } {
  const ruins = ind.filter(i => i.estado === 'ruim');
  const atencao = ind.filter(i => i.estado === 'atencao');
  const estado = ind.reduce<Estado29>((s, i) => pior(s, i.estado), 'bom');
  const nomes = (xs: Indicador29[]) => xs.map(i => i.titulo.toLowerCase().replace(/ \(.*\)$/, '')).join(', ');
  const din = ind.find(i => i.id === 'dinheiro');
  if (ruins.length) return { estado, frase: `Precisa de você: ${nomes(ruins)}${atencao.length ? `; de olho em ${nomes(atencao)}` : ''}.` };
  if (atencao.length) return { estado, frase: `Anda, mas pede atenção: ${nomes(atencao)}. ${din?.resumo ?? ''}`.trim() };
  return { estado, frase: `Em ordem. ${din?.resumo ?? ''}`.trim() };
}
