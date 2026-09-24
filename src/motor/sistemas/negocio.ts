/**
 * Autonomia e pequeno negócio (primeira infraestrutura; a economia profunda
 * — capital de giro, empréstimo, funcionários, impostos — é da ATT 3).
 *
 *   TRABALHO POR CONTA — quem tem ofício (cabelo, conserto, cozinha, música,
 *   desenho, clínica) pode começar a atender por conta. A renda vem da
 *   freguesia, que cresce com a habilidade, a estrada, a cidade e o jeito com
 *   gente; e míngua na crise.
 *
 *   NEGÓCIO — com estrada no ramo (ou um ofício forte) e algum dinheiro
 *   guardado, dá para abrir um salão, uma oficina, uma lanchonete, um
 *   comércio. O dinheiro posto no começo sai da conta. Nos primeiros anos o
 *   movimento é fraco; depois firma — ou aperta, e aí é decisão do jogador
 *   insistir, mudar ou fechar.
 */

import type { Rng } from '../rng';
import type { Dominio, Negocio, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { ocupacao, type Ocupacao } from '../dados/ocupacoes';
import { economiaLocal, municipio } from '../dados/lugares';
import { habilidade } from './frentes';
import { marcar } from './marcas';
import { contratar, experienciaNaTrilha, nomeOcupacao } from './trabalho';
import { bloqueio, type Veredito } from '../plausibilidade';

export interface TipoNegocio {
  id: string;
  nome: string;
  ocupacaoId: string;
  capital: number;
  /** Estrada que conta (meses) na trilha — ou o ofício equivalente. */
  trilhas: string[];
  meses: number;
  dominio?: Dominio;
  habilidade?: number;
}

export const NEGOCIOS: readonly TipoNegocio[] = [
  { id: 'salao', nome: 'um salão', ocupacaoId: 'dono_salao', capital: 12000, trilhas: ['beleza'], meses: 24, dominio: 'beleza', habilidade: 55 },
  { id: 'oficina', nome: 'uma oficina', ocupacaoId: 'dono_oficina', capital: 25000, trilhas: ['mecanica', 'manutencao'], meses: 36, dominio: 'manual', habilidade: 62 },
  { id: 'lanchonete', nome: 'uma lanchonete', ocupacaoId: 'dono_lanchonete', capital: 20000, trilhas: ['alimentacao', 'confeitaria'], meses: 12, dominio: 'cozinha', habilidade: 52 },
  { id: 'comercio', nome: 'um comércio', ocupacaoId: 'dono_comercio', capital: 30000, trilhas: ['comercio', 'vendas'], meses: 24, dominio: 'vendas', habilidade: 52 }
];

export const tipoNegocio = (id: string) => NEGOCIOS.find(n => n.id === id);

const custoLocal = (v: Vida, t: TipoNegocio) => Math.round(t.capital * economiaLocal(v.moradia.municipioId).custo / 100) * 100;

export function podeAbrirNegocio(v: Vida, id: string): Veredito {
  const t = tipoNegocio(id);
  if (!t) return bloqueio('impossivel', 'Negócio desconhecido.');
  if (idade(v) < 18) return bloqueio('ilegal', 'Abrir empresa exige maioridade.');
  if (v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado') return bloqueio('incompativel', 'Você já tem um negócio aberto.');
  if (v.trabalho.atual?.ocupacaoId === t.ocupacaoId) return bloqueio('incompativel', 'É o que você já faz.');
  const estrada = Math.max(...t.trilhas.map(tr => experienciaNaTrilha(v, tr)));
  const oficio = t.dominio ? habilidade(v, t.dominio) : 0;
  if (estrada < t.meses && oficio < (t.habilidade ?? 101)) return bloqueio('requisito', `Falta conhecer o ramo: pede uns ${Math.round(t.meses / 12)} anos na área ou saber fazer o trabalho muito bem.`);
  const custo = custoLocal(v, t);
  if (v.financas.conta + v.financas.reserva < custo) return bloqueio('requisito', `Para começar, uns R$ ${custo.toLocaleString('pt-BR')} (ponto, equipamento, primeiro estoque).`);
  if (v.financas.negativado) return { grau: 'improvavel', chance: 0.4, motivo: 'Com o nome sujo, fornecedor não vende a prazo.' };
  return { grau: 'permitido', chance: 0.6 };
}

export function abrirNegocio(v: Vida, r: Rng, id: string, socioId?: string): Negocio {
  const t = tipoNegocio(id)!;
  const custo = custoLocal(v, t);
  const daConta = Math.min(v.financas.conta, custo);
  v.financas.conta -= daConta;
  v.financas.reserva -= custo - daConta;
  const oc = ocupacao(t.ocupacaoId);
  const e = contratar(v, r, oc, 'negocio');
  const estrada = Math.max(...t.trilhas.map(tr => experienciaNaTrilha(v, tr)));
  e.clientela = Math.round(Math.min(40, 10 + estrada / 10 + (t.dominio ? habilidade(v, t.dominio) / 6 : 0)));
  const n: Negocio = { tipo: t.id, nome: nomeDoNegocio(v, t), ocupacaoId: oc.id, tInicio: v.t, capital: custo, clientela: e.clientela, estado: 'comecando', anosNoVermelho: 0, socioId };
  v.caminhos.negocio = n;
  e.empregador = n.nome;
  const texto = `Abriu ${t.nome}${socioId && v.pessoas[socioId] ? ` com ${v.pessoas[socioId].nome}` : ''}: ${n.nome}, em ${municipio(v.moradia.municipioId).nome}. Pôs R$ ${custo.toLocaleString('pt-BR')} do próprio bolso.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true, pessoas: socioId ? [socioId] : undefined });
  marcar(v, 'negocio_aberto', texto, 3, { ocupacaoId: oc.id, pessoaId: socioId });
  return n;
}

function nomeDoNegocio(v: Vida, t: TipoNegocio): string {
  const nome = v.eu.nome;
  return ({ salao: `Salão ${nome}`, oficina: `Auto Mecânica ${nome}`, lanchonete: `Lanchonete da ${v.eu.genero === 'feminino' ? nome : 'Esquina'}`, comercio: `Empório ${nome}` } as Record<string, string>)[t.id] ?? `${t.nome} de ${nome}`;
}

/** Depois do ano de trabalho: o negócio acompanha a freguesia. Devolve true se abriu a hora de decidir. */
export function processarNegocio(v: Vida): boolean {
  const n = v.caminhos.negocio;
  if (!n || n.estado === 'fechado') return false;
  const e = v.trabalho.atual;
  if (!e || e.ocupacaoId !== n.ocupacaoId) {
    fecharNegocio(v, 'o movimento não pagou as contas');
    return false;
  }
  n.clientela = e.clientela ?? n.clientela;
  if (n.clientela < 20) { n.anosNoVermelho += 1; n.estado = 'apertado'; }
  else { n.anosNoVermelho = 0; n.estado = n.clientela >= 45 ? 'firme' : 'comecando'; }
  if (n.estado === 'firme' && !v.caminhos.marcas.some(m => m.tipo === 'conquista' && m.ocupacaoId === n.ocupacaoId)) {
    const texto = `${n.nome} firmou: freguesia certa, contas em dia.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, 2, { ocupacaoId: n.ocupacaoId });
  }
  return n.anosNoVermelho >= 2;
}

export function fecharNegocio(v: Vida, motivo: string): void {
  const n = v.caminhos.negocio;
  if (!n || n.estado === 'fechado') return;
  n.estado = 'fechado';
  n.tFim = v.t;
  const anos = Math.max(1, Math.round((v.t - n.tInicio) / 12));
  const texto = `${n.nome} fechou as portas depois de ${anos} ${anos === 1 ? 'ano' : 'anos'}: ${motivo}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  marcar(v, 'negocio_fechado', texto, 3, { ocupacaoId: n.ocupacaoId });
}

/** Tipos de negócio ao alcance agora (para a interface e as estratégias). */
export function negociosPossiveis(v: Vida): { t: TipoNegocio; veredito: Veredito; custo: number }[] {
  return NEGOCIOS.map(t => ({ t, veredito: podeAbrirNegocio(v, t.id), custo: custoLocal(v, t) }));
}

export { nomeOcupacao, type Ocupacao };
