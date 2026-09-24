/**
 * O trabalho na vida da pessoa, pela FAMÍLIA de carreira (`dados/carreiras`).
 *
 *   PESO NA CABEÇA — não é uma tabela "profissão X = −10". Parte do quanto a
 *   função exige, e muda com a trajetória: os anos de estrada acostumam, o
 *   trabalho indo mal pesa mais, plantão cobra à noite (e menos de quem se
 *   acostumou), viver de freguesia magra é incerteza, jornada reduzida alivia.
 *   SENTIDO — quem gosta do que o trabalho pede (a música para o músico, a
 *   gente para quem cuida, a bola para quem treina crianças) tem um ânimo
 *   que o salário não explica; quem passou quinze anos num trabalho que não
 *   escolheria, sente também.
 *   CUSTO — trabalhar por conta tem custo (ferramenta, material, conselho,
 *   combustível); o MEI tem o DAS; o INSS facultativo, na pausa, a guia.
 *   ONDAS — a cada tanto, uma família de trabalho muda por dentro (carros
 *   elétricos na oficina, sistemas novos no escritório, máquinas na linha,
 *   diagnóstico assistido na clínica). Quem se atualiza, segue; quem não,
 *   vai ficando para trás. As ondas são do mundo (as mesmas para a mesma
 *   semente), e falam em categorias plausíveis, não em profissões de ficção.
 */

import type { Vida } from '../tipos';
import { clamp } from '../rng';
import { idade, temFato } from '../nucleo';
import { ocupacaoOuNula, type Ocupacao } from '../dados/ocupacoes';
import { familiaDaTrilha, FAMILIAS, pesoDaAutomacao, pesoDaExpansao, type FamiliaCarreira } from '../dados/carreiras';
import { economiaLocal } from '../dados/lugares';
import { habilidade } from './frentes';
import { anoDe } from '../tempo';
import { CUSTO_FACULTATIVO, SALARIO_MINIMO } from './renda';
import { arrendamentoMensal } from './rural';

export const familiaDe = (oc: Ocupacao): FamiliaCarreira => familiaDaTrilha(oc.trilha);

export function familiaAtual(v: Vida): FamiliaCarreira | undefined {
  const e = v.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  return oc ? familiaDe(oc) : undefined;
}

/* -------------------------------------------------------------- Cabeça */

export function pesoDoTrabalhoNaCabeca(v: Vida): { texto: string; efeito: number } | undefined {
  const e = v.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  if (!e || !oc) return undefined;
  const f = familiaDe(oc);
  const anos = (v.trabalho.experiencia[oc.trilha] ?? 0) / 12;
  let peso = (oc.estresse - 2) * 4;
  const partes: string[] = [];
  if (peso > 0) peso *= 1 - Math.min(0.3, anos * 0.025);             // os anos acostumam
  if (e.desempenho < 40) { peso += 5; partes.push('o trabalho indo mal'); }
  else if (e.desempenho >= 78) peso -= 2;
  if (oc.jornada === 'plantao') { const p = anos >= 6 ? 2 : 4; peso += p; partes.push('as noites de plantão'); }
  if (e.clientela !== undefined && e.clientela < 25 && oc.promocao === 'clientela') { peso += 4; partes.push('a incerteza de quem vive de freguesia'); }
  if (e.contrato === 'informal' || oc.id === 'motorista_app' || oc.id === 'entregador_app') { peso += 2; if (!partes.length) partes.push('não saber quanto entra no mês'); }
  if ((f.desgaste.cabeca ?? 0) >= 0.55) peso += 2;
  if (e.reduzida) peso *= 0.6;
  if (e.posAposentadoria) peso *= 0.5;
  if (Math.abs(peso) < 1) return undefined;
  const texto = peso > 0 ? (partes.length ? partes[0] : f.progressao === 'seguranca' ? 'o que o trabalho mostra de perto' : f.progressao === 'saude' ? 'a responsabilidade com a vida dos outros' : 'um trabalho que exige muito') : 'um trabalho sem grandes sustos';
  return { texto, efeito: Math.round(peso) };
}

/* ------------------------------------------------------------- Sentido */

export function sentidoDoTrabalho(v: Vida): { texto: string; efeito: number } | undefined {
  const e = v.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  if (!e || !oc) return undefined;
  const f = familiaDe(oc);
  const gosto = (f.sentido ?? []).map(d => ({ d, fr: v.caminhos.frentes[d] })).filter(x => x.fr && x.fr.interesse >= 55 && habilidade(v, x.d) >= 40).sort((a, b) => b.fr!.interesse - a.fr!.interesse)[0];
  const cuida = (f.progressao === 'saude' || f.progressao === 'cuidado' || f.progressao === 'docente' || f.progressao === 'seguranca') && v.personalidade.tracos.empatia > 20;
  if (gosto) return { texto: 'fazer, no trabalho, o que gosta de fazer', efeito: 5 };
  if (cuida) return { texto: 'um trabalho que cuida de gente', efeito: 3 };
  const anos = (v.t - e.tInicio) / 12;
  if (anos >= 15 && e.desempenho < 50 && f.progressao === 'empresa') return { texto: 'anos num trabalho que não escolheria de novo', efeito: -3 };
  return undefined;
}

/* --------------------------------------------------------------- Custos */

export function custosDoTrabalho(v: Vida): { rotulo: string; valor: number }[] {
  const out: { rotulo: string; valor: number }[] = [];
  const e = v.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  const c = economiaLocal(v.moradia.municipioId).custo;
  if (e && oc) {
    const f = familiaDe(oc);
    const porConta = e.contrato === 'autonomo' || e.contrato === 'informal';
    if (porConta && f.custoAutonomo && !(v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado' && v.caminhos.negocio.ocupacaoId === oc.id)) {
      const escala = e.clientela !== undefined ? 0.5 + e.clientela / 100 : 1;
      out.push({ rotulo: f.custoAutonomo.rotulo, valor: Math.round(f.custoAutonomo.valor * escala * c * (e.reduzida ? 0.6 : 1)) });
    }
    if (f.anuidade && oc.licenca && oc.licenca !== 'cnh') out.push({ rotulo: `Anuidade do conselho (${oc.licenca.toUpperCase()})`, valor: f.anuidade });
    if (e.mei) out.push({ rotulo: 'DAS do MEI (INSS e impostos)', valor: Math.round(SALARIO_MINIMO * 0.05 + 6) });
    if (oc.id === 'produtor_rural' && v.caminhos.rural?.terra === 'arrendada') out.push({ rotulo: 'Arrendamento da terra', valor: arrendamentoMensal(v) });
  }
  if (v.trabalho.pausa?.facultativo) out.push({ rotulo: 'INSS como contribuinte facultativo', valor: CUSTO_FACULTATIVO });
  return out;
}

/* ------------------------------------------------------------- Mercado */

/** Quanto a época ajuda ou atrapalha conseguir trabalho numa família (multiplicador da chance). */
export function fatorDaEpoca(oc: Ocupacao, ano: number): number {
  const f = familiaDe(oc);
  return (1 - pesoDaAutomacao(f, ano) * 0.6) * (1 + pesoDaExpansao(f, ano));
}

/** Risco extra de corte com carteira numa família que automatiza. */
export const riscoDaEpoca = (oc: Ocupacao, ano: number) => pesoDaAutomacao(familiaDe(oc), ano) * 0.06;

/* --------------------------------------------------------------- Ondas */

const INTERVALO: Record<string, number> = { tecnologia: 7, industria: 10, oficio: 12, transporte: 14, saude: 11, escritorio: 10, criacao: 9, rural: 12, docencia: 13, varejo: 12, seguranca: 15, publico: 14, engenharia: 12, direito: 14, cozinha: 18, beleza: 16 };

export const TEXTO_ONDA: Record<string, string[]> = {
  tecnologia: ['As ferramentas mudaram de novo: metade do que se fazia à mão agora se pede a um sistema, e o que se cobra de quem programa é outra coisa.', 'Uma geração nova de sistemas chegou às empresas. Quem não aprendeu a trabalhar com ela ficou com os projetos velhos.'],
  industria: ['A fábrica automatizou mais uma linha. Sobrou trabalho para quem sabe cuidar das máquinas, e menos para quem operava.', 'Chegaram equipamentos que se ajustam sozinhos. A linha precisa de menos gente — e de gente diferente.'],
  oficio: ['O serviço mudou: os carros, os aparelhos e as instalações de agora são outros, e pedem conhecimento que a prática antiga não dá.', 'Equipamento novo, norma nova, cliente que chega sabendo mais. O ofício pediu atualização.'],
  transporte: ['Os sistemas de rota e de direção assistida mudaram o trabalho de quem vive do volante.', 'As entregas passaram a ser distribuídas por um sistema novo: quem se adaptou manteve as rotas boas.'],
  saude: ['Exames e diagnósticos passaram a ser feitos com apoio de sistemas. O atendimento mudou, a responsabilidade não.', 'Protocolos novos, equipamento novo: a área inteira passou por uma atualização.'],
  escritorio: ['Um sistema novo passou a fazer sozinho boa parte do trabalho de escritório. Sobrou para quem entende o que ele faz.', 'O escritório foi digitalizado de ponta a ponta. Os processos mudaram de lugar.'],
  criacao: ['Ferramentas automáticas de imagem e texto chegaram ao mercado. O trabalho barato sumiu; o bom passou a valer mais.', 'Os clientes começaram a chegar com metade do trabalho pronto por máquina. Mudou o que se vende.'],
  rural: ['Máquinas de precisão, sensores e drones chegaram às propriedades da região.', 'O manejo mudou: sementes, sistemas e crédito novos, para quem se atualizar.'],
  docencia: ['A escola mudou a forma de ensinar: plataformas, turmas mistas, avaliação nova.', 'Uma reforma do ensino chegou à sala de aula com material e método novos.'],
  varejo: ['Autoatendimento, compra por aplicativo e estoque automático mudaram a loja.', 'O comércio da cidade migrou em parte para a internet. Ficou quem aprendeu a vender dos dois jeitos.'],
  seguranca: ['Tecnologias novas de monitoramento mudaram o trabalho de rua e de plantão.'],
  publico: ['O serviço público digitalizou os atendimentos. As funções foram redistribuídas.'],
  engenharia: ['Projeto e obra passaram a ser feitos com modelos digitais completos. Quem não aprendeu ficou para trás nas concorrências.'],
  direito: ['Sistemas de pesquisa e redação jurídica mudaram a rotina dos escritórios.'],
  cozinha: ['Cozinhas industriais e delivery por aplicativo mudaram a rotina da cozinha.'],
  beleza: ['Técnicas e produtos novos viraram moda — e o cliente pede.']
};

/** Os anos em que a família muda por dentro (estáveis por semente da economia). */
export function ondasDaFamilia(v: Vida, f: FamiliaCarreira): number[] {
  const passo = INTERVALO[f.id];
  if (!passo) return [];
  const semente = v.economia?.semente ?? 1;
  const inicio = 2028 + Math.floor(frac(semente * 7.13 + f.id.length * 3.7) * passo);
  const out: number[] = [];
  for (let a = inicio; a <= 2140; a += passo + Math.floor(frac(semente + a * 0.37) * 3)) out.push(a);
  return out;
}

const frac = (x: number) => x - Math.floor(x);

/** A onda que está acontecendo agora (neste ano) para o trabalho da pessoa. */
export function ondaAgora(v: Vida): { familia: FamiliaCarreira; ano: number } | undefined {
  const f = familiaAtual(v);
  if (!f) return undefined;
  const ano = anoDe(v.t);
  return ondasDaFamilia(v, f).includes(ano) ? { familia: f, ano } : undefined;
}

/** A última onda da família em que a pessoa trabalha, e se ela se atualizou depois. */
export function defasagem(v: Vida): number {
  const e = v.trabalho.atual;
  const f = familiaAtual(v);
  if (!e || !f || e.posAposentadoria) return 0;
  const ano = anoDe(v.t);
  const ultima = [...ondasDaFamilia(v, f)].filter(a => a <= ano).pop();
  if (!ultima || ano - ultima > 8) return 0;
  const atualizado = e.tAtualizacao !== undefined && anoDe(e.tAtualizacao) >= ultima;
  const recente = anoDe(e.tInicio) > ultima; // quem entrou depois já entrou no jeito novo
  const formadoDepois = v.educacao.concluidos.some(c => anoDe(c.tFim) >= ultima && c.nivel !== 'livre');
  if (atualizado || recente || formadoDepois) return 0;
  return clamp(ano - ultima, 0, 5);
}

/** O ano de trabalho sente a defasagem: o desempenho cai, a freguesia míngua. */
export function processarTransformacao(v: Vida): void {
  const e = v.trabalho.atual;
  if (!e) return;
  const onda = ondaAgora(v);
  if (onda && !temFato(v, `onda_${onda.familia.id}_${onda.ano}`) && idade(v) < 66) v.fatos[`onda_${onda.familia.id}_${onda.ano}`] = v.t;
  const d = defasagem(v);
  if (d >= 1) {
    e.desempenho = clamp(e.desempenho - 3 - d);
    if (e.clientela !== undefined) e.clientela = clamp(e.clientela - 2 - d);
  }
}

export { FAMILIAS };
