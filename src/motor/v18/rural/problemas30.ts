/**
 * VIDA 30 · §6.4–6.5 — A PROPRIEDADE EM PROBLEMAS E ESCOLHAS. A VIDA 29 explicava cada indicador em quatro parágrafos;
 * aqui, a mesma simulação vira poucos cartões: o que está acontecendo, a urgência, o que acontece se não fizer nada e as
 * alternativas — cada uma com o custo e a consequência provável. Os fatores que derrubam a produção aparecem com o peso
 * de cada um (o mesmo cálculo de `resultadoDoTalhao`), não como indicadores soltos. Puro: só lê.
 */
import type { Vida } from '../../tipos';
import type { Acao } from '../../acoes';
import { dinheiro } from '../../texto';
import { CULTURAS18, REBANHOS18 } from '../../dados18/rural/catalogo18';
import {
  areaPasto, areaPlantada, areaUtil, capacidadeUA, competenciaDaGestao, custoLocal, custosFixos, fatorDoSolo30, maoDeObra29, quemAdministra, salarioRural29,
  tecnologia, uaOcupadas, resumoDaPropriedade, type PropriedadeRural18
} from './fazenda18';
import { custoDoSolo, type OqueRural18 } from './acoes18';

export type Urgencia30 = 'agora' | 'safra' | 'depois';
export interface Opcao30 {
  rotulo: string;
  /** O que custa (negativo = entra dinheiro). */
  custo?: number;
  /** "por ano" quando o custo se repete. */
  porAno?: boolean;
  /** A consequência provável, numa linha. */
  efeito: string;
  acao?: Acao;
}
export interface Problema30 {
  id: string;
  titulo: string;
  urgencia: Urgencia30;
  /** Os fatores que explicam (com o peso), quando há mais de um. */
  fatores?: { texto: string; peso: number }[];
  /** O que acontece se não fizer nada. */
  seNada: string;
  opcoes: Opcao30[];
}

const r18 = (oque: OqueRural18): Acao => ({ tipo: 'rural18', oque });
const fmt = (x: number) => dinheiro(Math.abs(x) >= 20000 ? Math.round(x / 1000) * 1000 : Math.round(x / 10) * 10);
const pct = (x: number) => `${Math.round(x * 100)}%`;
const ORDEM: Record<Urgencia30, number> = { agora: 0, safra: 1, depois: 2 };

/** Os fatores que tiram produção da lavoura hoje (o peso é a fração perdida contra a referência). */
export function fatoresDaProducao30(v: Vida, p: PropriedadeRural18): { texto: string; peso: number; id: string }[] {
  const plantada = areaPlantada(p);
  if (!plantada) return [];
  const out: { texto: string; peso: number; id: string }[] = [];
  const fs = fatorDoSolo30(p.solo);
  if (fs < 0.985) out.push({ id: 'solo', texto: `solo cansado (${Math.round(p.solo)} de 100)`, peso: 1 - fs });
  // A água: só pesa nos talhões sem irrigação, pela necessidade de cada cultura (ponderado pela área).
  let agua = 0;
  for (const t of p.talhoes) { if (t.irrigado) continue; const k = CULTURAS18[t.cultura]; const ok = Math.min(1, (p.agua + 30) / (k.agua * 100 + 30)); agua += (1 - (0.75 + 0.25 * ok)) * t.ha; }
  agua /= plantada;
  if (agua > 0.015) out.push({ id: 'agua', texto: 'pouca água para o que está plantado', peso: agua });
  const repetida = p.talhoes.filter(t => CULTURAS18[t.cultura].ciclo === 'anual' && (t.repete ?? 0) >= 3).reduce((s, t) => s + t.ha, 0);
  if (repetida > 0) out.push({ id: 'rotacao', texto: 'a mesma cultura há 3 anos ou mais (cansa e chama praga)', peso: 0.07 * repetida / plantada + 0.03 });
  const comp = competenciaDaGestao(v, p);
  if (comp < 40) out.push({ id: 'gestao', texto: 'quem toca ainda conhece pouco do ofício', peso: (45 - comp) / 900 + 0.02 });
  const mo = maoDeObra29(v, p);
  if (mo.modo === 'equipe' && mo.cobertura < 0.8) out.push({ id: 'gente', texto: 'gente de menos na colheita', peso: Math.min(0.35, (0.8 - mo.cobertura) * 0.5) });
  if (tecnologia(p) < 0.5 && plantada >= 5 && !p.talhoes.every(t => t.cultura === 'horta')) out.push({ id: 'maquina', texto: 'trabalho sem máquina', peso: 0.05 });
  return out.sort((a, b) => b.peso - a.peso);
}

export function problemasDaPropriedade30(v: Vida, p: PropriedadeRural18): Problema30[] {
  if (p.uso !== 'producao') return [];
  const c = custoLocal(p.municipioId);
  const out: Problema30[] = [];
  const r = resumoDaPropriedade(v, p);
  const normal = r.previsao.receita - r.previsao.custo;

  /* ---- Pasto: mais animal do que o pasto sustenta */
  const cap = capacidadeUA(p);
  const ocup = uaOcupadas(p);
  const noPasto = p.rebanhos.filter(rb => REBANHOS18[rb.especie].ua > 0 && rb.alimentacao !== 'confinado').sort((a, b) => b.cabecas * REBANHOS18[b.especie].ua - a.cabecas * REBANHOS18[a.especie].ua);
  if (noPasto.length && ocup > cap * 1.05) {
    const rb = noPasto[0];
    const d = REBANHOS18[rb.especie];
    const excessoUA = ocup - cap;
    const vender = Math.min(rb.cabecas, Math.ceil(excessoUA / d.ua));
    const fracao = Math.min(1, Math.round(vender / Math.max(1, rb.cabecas) * 100) / 100);
    const valorVenda = Math.round(vender * d.valor * (0.6 + rb.genetica / 125) * c * 0.95);
    const extraSuplemento = Math.round(rb.cabecas * d.custoAno * 0.3 * c);
    const lotacao = ocup / Math.max(1, cap);
    // Quantos hectares a mais (comprados do vizinho, com a reserva legal) sustentam o excesso, na lotação de hoje.
    const uaPorHa = Math.max(0.2, cap / Math.max(1, areaPasto(p)));
    const haFaltam = Math.ceil(excessoUA / uaPorHa / Math.max(0.5, areaUtil(p) / Math.max(1, p.ha)));
    out.push({
      id: 'pasto', titulo: `Há mais animais do que o pasto alimenta (${pct(lotacao)} do que ele sustenta)`, urgencia: lotacao > 1.25 ? 'agora' : 'safra',
      seNada: lotacao > 1.25 ? `Quem cuida vende o excesso no fim do ano, a preço de animal magro; o pasto perde força (o solo cai até 2,5 pontos por ano).` : `Os animais rendem menos (uns ${pct(1 - 1 / lotacao)} a menos de leite ou carne) e o pasto se gasta aos poucos.`,
      opcoes: [
        { rotulo: `Vender ${vender.toLocaleString('pt-BR')} ${d.unidade}`, custo: -valorVenda, efeito: 'O pasto volta a sustentar o rebanho já no próximo ano.', acao: r18({ op: 'vender_animais', id: p.id, especie: rb.especie, fracao }) },
        { rotulo: 'Comprar alimento (suplementar no cocho)', custo: extraSuplemento, porAno: true, efeito: 'Cada animal pesa 20% menos no pasto e rende 10% mais; o custo do trato sobe.', acao: r18({ op: 'manejo', id: p.id, especie: rb.especie, alimentacao: 'suplementado' }) },
        ...(haFaltam > 0 ? [{ rotulo: `Ampliar a pastagem (+${haFaltam.toLocaleString('pt-BR')} ha)`, custo: Math.round(haFaltam * p.valorHa * 1.05), efeito: 'Mais terra para o mesmo rebanho; a terra também valoriza.', acao: r18({ op: 'expandir', id: p.id, ha: haFaltam }) }] : [])
      ]
    });
  }

  /* ---- Produção abaixo do esperado: os fatores que pesam de verdade */
  const fat = fatoresDaProducao30(v, p);
  const perdaTotal = 1 - fat.reduce((s, f) => s * (1 - f.peso), 1);
  if (fat.length && perdaTotal >= 0.06) {
    const opcoes: Opcao30[] = [];
    const ids = new Set(fat.slice(0, 3).map(f => f.id));
    if (ids.has('solo') && p.solo < 90) { const ganho = fatorDoSolo30(Math.min(95, p.solo + 16)) / fatorDoSolo30(p.solo) - 1; opcoes.push({ rotulo: 'Corrigir o solo (calcário e adubação)', custo: custoDoSolo(p), efeito: `+${pct(ganho)} de produção, a partir da safra seguinte.`, acao: r18({ op: 'solo', id: p.id }) }); }
    if (ids.has('rotacao')) opcoes.push({ rotulo: 'Trocar a cultura no talhão cansado (rotação)', efeito: 'Leguminosa depois de gramínea rende +5% e recupera o chão (veja em Plantação).' });
    if (ids.has('gestao') && !p.assistencia29) opcoes.push({ rotulo: p.ha <= 50 ? 'Pedir assistência técnica (Emater)' : 'Contratar um agrônomo', custo: Math.round((p.ha <= 50 ? 800 : 7000 + p.ha * 12) * c), porAno: true, efeito: 'Quem toca passa a conduzir melhor (+8 de competência).', acao: r18({ op: 'assistencia29', id: p.id }) });
    if (ids.has('gente')) { const mo = maoDeObra29(v, p); const n = Math.max(1, Math.ceil(mo.precisa - mo.equipe - mo.familia)); opcoes.push({ rotulo: `Contratar ${n} ${n === 1 ? 'trabalhador' : 'trabalhadores'}`, custo: n * salarioRural29(p), porAno: true, efeito: 'A colheita deixa de ficar no pé.', acao: r18({ op: 'equipe29', id: p.id, n: (p.equipe29 ?? 0) + n }) }); }
    if (ids.has('maquina') && !p.empreitada29) opcoes.push({ rotulo: 'Contratar máquina por empreitada', custo: Math.round(areaPlantada(p) * 280 * c), porAno: true, efeito: '+6% de produção e menos gente na lavoura, sem comprar trator.', acao: r18({ op: 'empreitada29', id: p.id }) });
    if (ids.has('agua')) opcoes.push({ rotulo: 'Irrigar (em Construções: poço, represa, gotejo)', efeito: 'A lavoura irrigada não depende da chuva — e perde pouco na seca.' });
    out.push({
      id: 'producao', titulo: `A lavoura produz uns ${pct(perdaTotal)} abaixo do que podia`, urgencia: perdaTotal >= 0.15 ? 'safra' : 'depois',
      fatores: fat.slice(0, 3).map(f => ({ texto: f.texto, peso: f.peso })),
      seNada: `A produção segue ${pct(perdaTotal)} abaixo${fat.some(f => f.id === 'rotacao') ? ', e a praga aparece mais nos talhões repetidos' : ''}.`,
      opcoes
    });
  }

  /* ---- Saúde dos animais */
  const doente = p.rebanhos.find(rb => rb.sanidade < 55 && rb.sanitario !== 'completo' && rb.cabecas > 0 && rb.especie !== 'tilapia' && rb.especie !== 'tambaqui');
  if (doente) {
    const d = REBANHOS18[doente.especie];
    out.push({
      id: 'sanidade', titulo: `${d.nome.charAt(0).toUpperCase() + d.nome.slice(1)}: saúde fraca (${doente.sanidade} de 100)`, urgencia: doente.sanidade < 40 ? 'agora' : 'safra',
      seNada: `Morrem mais animais (uns ${pct(Math.min(0.5, d.mortalidade * (1.6 - doente.sanidade / 100)))} por ano) e ${d.doenca} pega com mais facilidade.`,
      opcoes: [{ rotulo: 'Vacinação e trato completos', custo: Math.round(doente.cabecas * d.custoAno * 0.08 * c), porAno: true, efeito: 'A saúde sobe para perto de 82 em dois ou três anos.', acao: r18({ op: 'manejo', id: p.id, especie: doente.especie, sanitario: 'completo' }) }]
    });
  }

  /* ---- O dinheiro: o ano normal fecha no vermelho */
  if (normal < 0) {
    const cortaveis = custosFixos(v, p, 0).filter(l => /Gerente|Caseiro|Administradora|Equipe fixa|empreitada|Assistência|agrônomo/.test(l.oque)).sort((a, b) => b.custo - a.custo);
    const opcoes: Opcao30[] = [];
    for (const l of cortaveis.slice(0, 2)) {
      if (/Gerente|Caseiro|Administradora/.test(l.oque) && quemAdministra(v, p) !== 'voce') opcoes.push({ rotulo: 'Cuidar você mesmo (sem gerente)', custo: -l.custo, porAno: true, efeito: 'Economiza o salário; o resultado passa a depender do que você sabe (de longe, rende menos).', acao: r18({ op: 'admin29', id: p.id, admin: 'voce' }) });
      else if (/Equipe fixa/.test(l.oque)) opcoes.push({ rotulo: 'Reduzir a equipe fixa', custo: -Math.round(l.custo / Math.max(1, p.equipe29 ?? 1)), porAno: true, efeito: 'Um salário a menos; na colheita, diaristas.', acao: r18({ op: 'equipe29', id: p.id, n: Math.max(0, (p.equipe29 ?? 1) - 1) }) });
      else if (/empreitada/.test(l.oque)) opcoes.push({ rotulo: 'Parar a empreitada', custo: -l.custo, porAno: true, efeito: 'Sem o custo por hectare; a produção cai uns 6%.', acao: r18({ op: 'empreitada29', id: p.id }) });
    }
    if (!opcoes.length) opcoes.push({ rotulo: 'Arrendar a terra a quem produz', efeito: 'Entra um valor fixo por ano, sem risco nem trabalho (em Administração).' });
    out.push({
      id: 'dinheiro', titulo: `Num ano normal, a propriedade fecha no vermelho (uns ${fmt(-normal)})`, urgencia: 'agora',
      seNada: 'O prejuízo sai da sua conta na virada; sem saldo, vira crédito de custeio (juros de crédito rural, 24 parcelas).',
      opcoes
    });
  }

  /* ---- Seguro: lavoura grande sem cobertura */
  const plantada = areaPlantada(p);
  if (plantada >= 20 && !p.seguro) {
    const premio = Math.round(p.talhoes.reduce((s, t) => s + CULTURAS18[t.cultura].custoHa * t.ha, 0) * 0.04 * c * (p.car19 !== undefined ? 0.7 : 1));
    out.push({
      id: 'seguro', titulo: `${plantada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ha plantados sem seguro`, urgencia: 'depois',
      seNada: 'Num ano de seca, geada ou granizo forte, a perda inteira sai da sua conta.',
      opcoes: [{ rotulo: 'Fazer o seguro rural', custo: premio, porAno: true, efeito: 'Cobre boa parte da perda acima de 30% da safra.', acao: r18({ op: 'seguro', id: p.id }) }]
    });
  }

  return out.sort((a, b) => ORDEM[a.urgencia] - ORDEM[b.urgencia]);
}
