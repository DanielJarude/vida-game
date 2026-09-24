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
import { disponivel, pagar } from './dinheiro';
import { dinheiro as fmt } from '../texto';

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
  /** Registro profissional exigido (consultório, escritório de profissão regulamentada). */
  licenca?: string;
}

export const NEGOCIOS: readonly TipoNegocio[] = [
  { id: 'salao', nome: 'um salão', ocupacaoId: 'dono_salao', capital: 12000, trilhas: ['beleza'], meses: 24, dominio: 'beleza', habilidade: 55 },
  { id: 'oficina', nome: 'uma oficina', ocupacaoId: 'dono_oficina', capital: 25000, trilhas: ['mecanica', 'manutencao'], meses: 36, dominio: 'manual', habilidade: 62 },
  { id: 'lanchonete', nome: 'uma lanchonete', ocupacaoId: 'dono_lanchonete', capital: 20000, trilhas: ['alimentacao', 'confeitaria'], meses: 12, dominio: 'cozinha', habilidade: 52 },
  { id: 'comercio', nome: 'um comércio', ocupacaoId: 'dono_comercio', capital: 30000, trilhas: ['comercio', 'vendas'], meses: 24, dominio: 'vendas', habilidade: 52 },
  { id: 'loja_online', nome: 'uma loja on-line', ocupacaoId: 'dono_loja_online', capital: 9000, trilhas: ['comercio', 'vendas', 'informal', 'conteudo'], meses: 12, dominio: 'vendas', habilidade: 48 },
  { id: 'empreiteira', nome: 'uma empreiteira', ocupacaoId: 'empreiteiro', capital: 22000, trilhas: ['construcao'], meses: 72 },
  { id: 'marcenaria', nome: 'uma marcenaria', ocupacaoId: 'dono_marcenaria', capital: 28000, trilhas: ['marcenaria'], meses: 48, dominio: 'manual', habilidade: 66 },
  { id: 'estudio', nome: 'um estúdio de foto e vídeo', ocupacaoId: 'dono_estudio', capital: 26000, trilhas: ['imagem', 'conteudo'], meses: 36, dominio: 'fotografia', habilidade: 66 },
  { id: 'consultoria_ti', nome: 'uma consultoria de tecnologia', ocupacaoId: 'consultor_ti', capital: 12000, trilhas: ['ti', 'dados'], meses: 60 },
  { id: 'escritorio_contabil', nome: 'um escritório de contabilidade', ocupacaoId: 'contador_socio', capital: 15000, trilhas: ['contabil'], meses: 60, licenca: 'crc' },
  { id: 'consultorio_psicologia', nome: 'um consultório de psicologia', ocupacaoId: 'psicologo_clinico', capital: 14000, trilhas: ['psicologia'], meses: 36, licenca: 'crp' },
  { id: 'clinica_fisio', nome: 'uma clínica de fisioterapia', ocupacaoId: 'fisio_clinica', capital: 45000, trilhas: ['fisioterapia'], meses: 48, licenca: 'crefito' },
  { id: 'clinica_vet', nome: 'uma clínica veterinária', ocupacaoId: 'veterinario_clinica', capital: 60000, trilhas: ['veterinaria'], meses: 48, licenca: 'crmv' }
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
  if (estrada < t.meses && oficio < (t.habilidade ?? 101)) return bloqueio('requisito', `Falta conhecer o ramo: pede uns ${Math.round(t.meses / 12)} anos na área${t.habilidade ? ' ou saber fazer o trabalho muito bem' : ''}.`);
  if (t.licenca && !v.trabalho.licencas.includes(t.licenca)) return bloqueio('requisito', `Exige registro profissional (${t.licenca.toUpperCase()}).`);
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  const custo = custoLocal(v, t);
  if (disponivel(v) < custo) return bloqueio('requisito', `Para começar, uns R$ ${custo.toLocaleString('pt-BR')} (ponto, equipamento, primeiro estoque).`);
  if (v.financas.negativado) return { grau: 'improvavel', chance: 0.4, motivo: 'Com o nome sujo, fornecedor não vende a prazo.' };
  return { grau: 'permitido', chance: 0.6 };
}

export function abrirNegocio(v: Vida, r: Rng, id: string, socioId?: string): Negocio {
  const t = tipoNegocio(id)!;
  const custo = custoLocal(v, t);
  pagar(v, custo);
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
  const sob = v.eu.sobrenome;
  return ({ salao: `Salão ${nome}`, oficina: `Auto Mecânica ${nome}`, lanchonete: `Lanchonete da ${v.eu.genero === 'feminino' ? nome : 'Esquina'}`, comercio: `Empório ${nome}`, loja_online: `Loja ${nome} (on-line)`, empreiteira: `${sob} Construções`, marcenaria: `Marcenaria ${nome}`, estudio: `Estúdio ${nome}`, consultoria_ti: `${sob} Tecnologia`, escritorio_contabil: `${sob} Contabilidade`, consultorio_psicologia: `Consultório de ${nome} ${sob}`, clinica_fisio: `Clínica ${sob} de Fisioterapia`, clinica_vet: `Clínica Veterinária ${nome}` } as Record<string, string>)[t.id] ?? `${t.nome} de ${nome}`;
}

/** Depois do ano de trabalho: o negócio acompanha a freguesia. Devolve true se abriu a hora de decidir. */
export function processarNegocio(v: Vida): boolean {
  const n = v.caminhos.negocio;
  if (!n || n.estado === 'fechado') return false;
  const e = v.trabalho.atual;
  if (!e || e.ocupacaoId !== n.ocupacaoId) {
    const ultimo = v.trabalho.historico[v.trabalho.historico.length - 1];
    const motivo = ultimo?.ocupacaoId === n.ocupacaoId && ultimo.motivo === 'falta de clientela' ? 'o movimento não pagou as contas'
      : ultimo?.ocupacaoId === n.ocupacaoId && ultimo.motivo === 'mudança de cidade' ? 'a mudança de cidade levou você para longe do ponto'
        : 'você foi seguir outro caminho';
    fecharNegocio(v, motivo);
    return false;
  }
  n.clientela = e.clientela ?? n.clientela;
  if (n.clientela < 20) { n.anosNoVermelho += 1; n.estado = 'apertado'; }
  else { n.anosNoVermelho = 0; n.estado = n.clientela >= 45 ? 'firme' : 'comecando'; }
  // O resultado além da retirada: movimento fraco não paga o aluguel do ponto (sai do bolso);
  // movimento forte sobra (lucro distribuído). Nunca uma máquina de dinheiro: o lucro tem teto no porte do negócio.
  const socio = n.socioId ? 0.5 : 1;
  let resultado = 0;
  if (n.clientela < 20) resultado = -Math.round(n.capital * 0.3 * (20 - n.clientela) / 20 * socio / 100) * 100;
  else if (n.clientela >= 60) resultado = Math.round(n.capital * 0.7 * (n.clientela - 60) / 40 * socio / 100) * 100;
  n.resultadoAno = resultado;
  n.acumulado = (n.acumulado ?? 0) + resultado;
  if (resultado !== 0) {
    v.financas.conta += resultado;
    if (resultado < 0 && !v.fatos[`negocio_bolso_${n.tInicio}`]) {
      v.fatos[`negocio_bolso_${n.tInicio}`] = v.t;
      escrever(v, { texto: `O movimento de ${n.nome} não pagou o aluguel do ponto: saíram ${fmt(-resultado)} do seu bolso para fechar o ano.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
    }
  }
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
  // O que se recupera: equipamento e estoque vendidos a preço de ocasião.
  const recupera = Math.round(n.capital * 0.25 * (n.socioId ? 0.5 : 1) / 100) * 100;
  v.financas.conta += recupera;
  const texto = `${n.nome} fechou as portas depois de ${anos} ${anos === 1 ? 'ano' : 'anos'}: ${motivo}.${recupera > 0 ? ` A venda dos equipamentos rendeu ${fmt(recupera)}.` : ''}`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  marcar(v, 'negocio_fechado', texto, 3, { ocupacaoId: n.ocupacaoId });
}

/** Tipos de negócio ao alcance agora (para a interface e as estratégias). */
export function negociosPossiveis(v: Vida): { t: TipoNegocio; veredito: Veredito; custo: number }[] {
  return NEGOCIOS.map(t => ({ t, veredito: podeAbrirNegocio(v, t.id), custo: custoLocal(v, t) }));
}

export { nomeOcupacao, type Ocupacao };
