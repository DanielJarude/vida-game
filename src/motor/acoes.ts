/**
 * Comandos do jogador.
 *
 * Toda ação tem uma DISPONIBILIDADE graduada (ver `plausibilidade`) e uma
 * EXECUÇÃO que roda numa transação. A interface pergunta a disponibilidade
 * para mostrar o motivo de um bloqueio; o motor revalida na execução.
 */

import type { Rng } from './rng';
import type { EstiloDeVida, Imovel, Pessoa, Produto, Retorno, Veiculo, Vida } from './tipos';
import { escrever, filhos, idade, idadePessoa, lembrarCom, marcarFato, parceiro, temFato, transacao, vinculosVivos } from './nucleo';
import { bloqueio, podeTentar, PERMITIDO, type Veredito } from './plausibilidade';
import { abrirDecisao, conteudoPorId, preparar, resolverDecisao } from './conteudo/motor';
import { modeloRotina, nivelModelo, podeComecarRotina } from './sistemas/rotinas';
import { fazerEnem, largarEscola, opcoesDeCurso, podeFazerEnem, tentarIngresso, voltarAEstudar, type OpcaoCurso } from './sistemas/escola';
import { eDasForcas, aposentar, contratar, elegibilidade, encerrarEmprego, nomeOcupacao, podeAposentar, porContaPropria, textoDeContratacao } from './sistemas/trabalho';
import { inscrever, leituraDoPreparo } from './sistemas/concurso';
import { aceitarOportunidade, recusarOportunidade } from './sistemas/oportunidades';
import { abrirNegocio, podeAbrirNegocio } from './sistemas/negocio';
import { marcar } from './sistemas/marcas';
import { aplicarPersonalidade } from './personalidade';
import { contexto } from './conteudo/base';
import { iniciarEntrevista } from './conteudo/desafios';
import { ge } from './texto';
import { OCUPACOES, ocupacao } from './dados/ocupacoes';
import { aluguelDe, alugar, amigoParaDividir, marcarSaidaDeCasa, opcoesDeAluguel, vereditoAluguel, voltarParaCasaDosPais } from './sistemas/moradia';
import { custoDeMudanca, iniciarAdocao, iniciarCnh, mudarAgora } from './sistemas/processos';
import { modeloMoradia, modeloVeiculo, VEICULO_ANTIGO } from './dados/bens';
import { economiaLocal, municipio, nomeLugar } from './dados/lugares';
import { curso } from './dados/cursos';
import { arranjoDaCasa, comprometimento, disponivel, limiteDeCredito, mesesRestantes, pagar as pagarComGuardado, parcelaPrice, rendaPropriaMensal, saldoMensal } from './sistemas/dinheiro';
import { animalDoAbrigo, nomeImovel, ofertaDeImovel, ofertaDeVeiculo, ofertaPorModelo, ofertaVeiculoPorModelo } from './sistemas/mercado';
import { disponibilidadeVeiculo, executarVeiculo, textoVeiculo, valorDeVenda, type AcaoVeiculo } from './sistemas/veiculos';
import { disponibilidadeImovel, executarImovel, valorDeVendaImovel, type AcaoImovel } from './sistemas/imoveis';
import { aplicacao, aplicar, resgatar } from './sistemas/investimentos';
import { PRODUTOS, produto } from './dados/investimentos';
import { podeRenegociarFinanciamento, renegociarFinanciamento } from './sistemas/obrigacoes';
import { adotarPet, disponibilidadeVeterinario, executarVeterinario, infoPet, podeTerPet, type OpcaoVeterinario } from './sistemas/pets';
import { juroDeFinanciamento } from './sistemas/economia';
import { dinheiro as fmt } from './texto';
import { moraComFamiliaDeOrigem } from './sistemas/domicilio';
import { disponibilidadeInteracao, executarInteracao, LIMITE_INTERACOES } from './sistemas/interacoes';
import { disponibilidadeCuidado, executarCuidado, type TipoCuidado } from './sistemas/cuidados';
import { encerrarPausa, iniciarPausa, podeReduzir } from './sistemas/pausa';
import { parar as pararIlicito } from './sistemas/ilicito';
import { irParaReserva, sairDasForcas } from './sistemas/militar';
import { formalizar } from './conteudo/trajetorias';
import { disponibilidadeProfissao, executarProfissao, type AcaoProfissaoCmd } from './sistemas/profissao';
import { NEGOCIOS } from './sistemas/negocio';
import { disponibilidadePolitica, executarPolitica, type AcaoPoliticaCmd } from './sistemas/politica';

/** Id de uma interação do catálogo (`sistemas/interacoes`). O que existe depende da pessoa e do momento. */
export type InteracaoPessoa = string;

export type Acao =
  | { tipo: 'decidir'; opcaoId: string }
  /** Começar, mudar a intensidade (nivel) ou parar uma atividade. */
  | { tipo: 'rotina'; id: string; ativa: boolean; nivel?: 1 | 2 | 3 }
  /** Aceitar ou deixar passar uma porta que a vida abriu. */
  | { tipo: 'oportunidade'; id: string; aceitar: boolean }
  | { tipo: 'abrir_negocio'; negocio: string }
  | { tipo: 'postura'; valor: Vida['educacao']['postura'] }
  | { tipo: 'enem' }
  | { tipo: 'matricular'; indice: number }
  | { tipo: 'trancar' }
  | { tipo: 'destrancar' }
  | { tipo: 'abandonar_curso' }
  | { tipo: 'largar_escola' }
  | { tipo: 'voltar_a_estudar' }
  | { tipo: 'candidatar'; ocupacaoId: string }
  | { tipo: 'pedir_demissao' }
  | { tipo: 'horas_extras'; parar?: boolean }
  /** Cuidar de si: descansar, ir ao médico, tentar largar um hábito. */
  | { tipo: 'cuidar'; cuidado: TipoCuidado }
  | { tipo: 'pedir_aumento' }
  | { tipo: 'aposentar' }
  | { tipo: 'pessoa'; pessoaId: string; interacao: InteracaoPessoa }
  | { tipo: 'adotar' }
  /** Alugar: uma oferta do mercado (ou, nos comandos antigos, só o tipo). Dá para dividir com um amigo. */
  | { tipo: 'sair_de_casa'; modeloId?: string; ofertaId?: string; dividirCom?: string }
  | { tipo: 'trocar_moradia'; modeloId?: string; ofertaId?: string; dividirCom?: string }
  | { tipo: 'voltar_pais' }
  | { tipo: 'mudar_cidade'; municipioId: string }
  /** Comprar um veículo de uma oferta (novo ou usado); `entrada` em reais, quando financia. */
  | { tipo: 'comprar_veiculo'; modeloId?: string; ofertaId?: string; financiar: boolean; entrada?: number }
  /** Comprar um imóvel: à vista ou financiado (entrada em reais, prazo em anos). */
  | { tipo: 'comprar_imovel'; modeloId?: string; ofertaId?: string; financiar: boolean; morar: boolean; entrada?: number; prazo?: number }
  | { tipo: 'vender_bem'; bemId: string }
  /** Oficina e cuidados de um veículo. */
  | { tipo: 'veiculo'; bemId: string; oque: AcaoVeiculo }
  /** Reparo, aluguel para terceiros, morar num imóvel próprio. */
  | { tipo: 'imovel'; bemId: string; oque: AcaoImovel }
  | { tipo: 'investir'; destino: Produto; valor: number }
  | { tipo: 'resgatar'; origem: Produto; valor: number }
  /** Pagar parte (ou tudo) de um financiamento ou empréstimo antes da hora. */
  | { tipo: 'amortizar'; dividaId: string; valor: number }
  | { tipo: 'emprestimo'; valor: number; meses: number }
  | { tipo: 'renegociar_financiamento'; dividaId: string }
  | { tipo: 'estilo'; valor: EstiloDeVida }
  | { tipo: 'plano_saude'; ativo: boolean }
  | { tipo: 'renegociar' }
  | { tipo: 'cnh' }
  /** Adotar um animal do abrigo da cidade. */
  | { tipo: 'adotar_pet'; animalId: string }
  | { tipo: 'veterinario'; petId: string; opcao: OpcaoVeterinario }
  /** Levar o bicho que ficou na casa dos pais para a sua casa. */
  | { tipo: 'levar_pet'; petId: string }
  /** Por quem o personagem se interessa — identidade, não comportamento. */
  | { tipo: 'atracao'; valor?: Vida['eu']['atracao'] }
  /** Formalizar o trabalho informal como MEI. */
  | { tipo: 'mei' }
  /** Pagar (ou parar de pagar) o INSS como facultativo durante uma pausa de cuidado. */
  | { tipo: 'facultativo'; ativo: boolean }
  /** Reduzir a jornada (ou parar) para cuidar da casa e da família. */
  | { tipo: 'cuidar_da_casa'; intensidade: 'parcial' | 'total' }
  /** Encerrar a pausa de cuidado: voltar à jornada inteira ou ao mercado. */
  | { tipo: 'voltar_mercado' }
  /** Largar o que se faz por fora. */
  | { tipo: 'parar_por_fora' }
  /** A vida profissional: ritmo, conversa de promoção, o negócio, o clube, a farda, a terra, a obra. */
  | AcaoProfissaoCmd
  /** A vida política: aproximar-se, filiar-se, a comunidade, a candidatura, a crise, a saída. */
  | AcaoPoliticaCmd;

export { LIMITE_INTERACOES };

const TITULO_CUIDADO: Record<TipoCuidado, string> = { descansar: 'Uns dias de descanso', consulta: 'No médico', parar_fumar: 'Parar de fumar', beber_menos: 'Beber menos' };
export const LIMITE_CANDIDATURAS = 3;

const jaFez = (v: Vida, chave: string) => v.anoAtual.acoes.includes(chave);

/* ============================================================ Disponibilidade */

export function disponibilidade(v: Vida, a: Acao): Veredito {
  if (v.morte) return bloqueio('impossivel', 'Esta vida terminou.');
  if (v.momento && a.tipo !== 'decidir') return bloqueio('incompativel', 'Há uma decisão esperando por você.');
  const i = idade(v);
  switch (a.tipo) {
    case 'decidir': return v.momento ? PERMITIDO : bloqueio('incompativel', 'Não há decisão aberta.');
    case 'rotina': return a.ativa ? podeComecarRotina(v, a.id, a.nivel ?? (v.rotinas.find(r => r.id === a.id)?.nivel ?? 1)) : v.rotinas.some(r => r.id === a.id) ? PERMITIDO : bloqueio('incompativel', 'Não faz parte da rotina.');
    case 'oportunidade': {
      const o = v.caminhos.oportunidades.find(x => x.id === a.id);
      if (!o) return bloqueio('incompativel', 'Essa porta já fechou.');
      if (!a.aceitar) return PERMITIDO;
      if (o.ocupacaoId && ['aprendiz', 'estagio', 'indicacao', 'vaga', 'proposta', 'reinsercao'].includes(o.tipo)) {
        const d = elegibilidade(v, ocupacao(o.ocupacaoId), 'curriculo', o.bonus ?? 0);
        if (!podeTentar(d)) return d;
      }
      if (o.tipo === 'convite' && o.ocupacaoId && !['jogador_futebol', 'atleta'].includes(o.ocupacaoId)) {
        const d = elegibilidade(v, ocupacao(o.ocupacaoId), 'oportunidade');
        if (!podeTentar(d)) return d;
      }
      if ((o.tipo === 'peneira' || o.tipo === 'seletiva') && i >= 14 && v.trabalho.atual?.carga === 'integral') return bloqueio('incompativel', 'Com trabalho integral, não dá para treinar numa base.');
      return PERMITIDO;
    }
    case 'abrir_negocio': return podeAbrirNegocio(v, a.negocio);
    case 'profissao': return disponibilidadeProfissao(v, a);
    case 'politica': return disponibilidadePolitica(v, a);
    case 'postura': return v.educacao.basica || v.educacao.matricula ? PERMITIDO : bloqueio('impossivel', 'Você não está estudando.');
    case 'enem': return podeFazerEnem(v);
    case 'matricular': {
      const o = opcoesDeCurso(v)[a.indice];
      if (!o) return bloqueio('impossivel', 'Opção inválida.');
      if (v.fatos[`tentou_${o.curso.id}_${Math.floor(v.t / 12)}`] !== undefined) return bloqueio('incompativel', 'Você já tentou este curso neste ano.');
      return o.veredito;
    }
    case 'trancar': return v.educacao.matricula && !v.educacao.matricula.trancado ? PERMITIDO : bloqueio('incompativel', 'Não há curso para trancar.');
    case 'destrancar': {
      const m = v.educacao.matricula;
      if (!m?.trancado) return bloqueio('incompativel', 'Não há curso trancado.');
      if (m.modalidade === 'presencial' && m.municipioId !== v.moradia.municipioId) return bloqueio('incompativel', `O curso é presencial em ${municipio(m.municipioId).nome}; você mora em outra cidade.`);
      return PERMITIDO;
    }
    case 'abandonar_curso': return v.educacao.matricula ? PERMITIDO : bloqueio('incompativel', 'Não há curso.');
    case 'largar_escola':
      if (!v.educacao.basica) return bloqueio('incompativel', 'Você não está na escola.');
      if (i < 15) return bloqueio('ilegal', 'Criança não decide largar a escola.');
      return { grau: 'irregular', motivo: 'Escola é obrigatória até os 17. Dá para largar — e tem consequência.' };
    case 'voltar_a_estudar':
      return v.educacao.evadiu && !v.educacao.basica ? (i >= 15 ? PERMITIDO : bloqueio('impossivel', 'A partir dos 15.')) : bloqueio('incompativel', 'Não se aplica.');
    case 'candidatar': {
      const oc = OCUPACOES.find(o => o.id === a.ocupacaoId);
      if (!oc) return bloqueio('impossivel', 'Vaga desconhecida.');
      if (!porContaPropria(oc) && v.anoAtual.acoes.filter(x => x.startsWith('candidatura:')).length >= LIMITE_CANDIDATURAS) return bloqueio('incompativel', 'Já foram três processos seletivos neste ano.');
      if (jaFez(v, `candidatura:${oc.id}`)) return bloqueio('incompativel', 'Você já tentou esta vaga neste ano.');
      return elegibilidade(v, oc);
    }
    case 'pedir_demissao': return !v.trabalho.atual ? bloqueio('incompativel', 'Você não tem emprego.') : v.trabalho.atual.contrato === 'eletivo' ? bloqueio('impossivel', 'Mandato não se larga com carta de demissão: é renúncia, na vida política.') : PERMITIDO;
    case 'horas_extras':
      if (a.parar) return v.trabalho.horasExtras ? PERMITIDO : bloqueio('incompativel', 'Não há horas extras combinadas.');
      if (!v.trabalho.atual || !['clt', 'servidor'].includes(v.trabalho.atual.contrato)) return bloqueio('incompativel', 'Só para quem tem emprego formal.');
      if (jaFez(v, 'horas_extras_parou')) return bloqueio('incompativel', 'Você desistiu das horas extras este ano.');
      return jaFez(v, 'horas_extras') ? bloqueio('incompativel', 'Já combinado para este ano.') : PERMITIDO;
    case 'cuidar': return disponibilidadeCuidado(v, a.cuidado);
    case 'pedir_aumento':
      if (!v.trabalho.atual || v.trabalho.atual.contrato === 'informal' || v.trabalho.atual.contrato === 'autonomo') return bloqueio('incompativel', 'Não há a quem pedir.');
      if (['servidor', 'militar'].includes(v.trabalho.atual.contrato)) return bloqueio('incompativel', 'No serviço público, o salário é o da carreira: sobe com a progressão, não com conversa.');
      if (['aprendiz', 'estagio'].includes(v.trabalho.atual.contrato)) return bloqueio('incompativel', 'Bolsa de estágio e salário de aprendiz são fixos no contrato.');
      if (v.t - v.trabalho.atual.tInicio < 12) return bloqueio('requisito', 'Espere completar um ano no cargo.');
      return jaFez(v, 'aumento') ? bloqueio('incompativel', 'Você já pediu neste ano.') : PERMITIDO;
    case 'aposentar': return podeAposentar(v);
    case 'pessoa': return disponibilidadeInteracao(v, a.pessoaId, a.interacao);
    case 'adotar':
      if (i < 18) return bloqueio('ilegal', 'Adoção exige maioridade.');
      if (v.processos.some(p => p.tipo === 'adocao')) return bloqueio('incompativel', 'Já há um processo de adoção em andamento.');
      if (moraComFamiliaDeOrigem(v)) return bloqueio('requisito', 'A Vara da Infância exige casa própria (alugada ou não).');
      if (saldoMensal(v).renda < 1600) return bloqueio('requisito', 'É preciso comprovar renda.');
      return PERMITIDO;
    case 'sair_de_casa': case 'trocar_moradia': {
      if (a.tipo === 'sair_de_casa' && !moraComFamiliaDeOrigem(v)) return bloqueio('incompativel', 'Você já não mora com a família.');
      if (a.tipo === 'trocar_moradia' && moraComFamiliaDeOrigem(v)) return bloqueio('incompativel', 'Primeiro é preciso sair de casa.');
      const o = a.ofertaId ? ofertaDeImovel(v, a.ofertaId) : a.modeloId ? ofertaPorModelo(v, 'aluguel', a.modeloId) : undefined;
      if (!o || o.modo !== 'aluguel') return bloqueio('impossivel', 'Essa oferta já saiu do mercado.');
      const amigo = a.dividirCom ? v.pessoas[a.dividirCom] : undefined;
      if (a.dividirCom && (!amigo || amigoParaDividir(v)?.id !== amigo.id)) return bloqueio('incompativel', 'Não há com quem dividir.');
      if (amigo && (o.modeloId === 'republica' || o.quartos < 2)) return bloqueio('incompativel', 'Para dividir, precisa de dois quartos.');
      if (parceiro(v) && v.vinculos[parceiro(v)!.p.id].convivio.includes('casa') && o.modeloId === 'republica') return bloqueio('incompativel', 'Numa república não cabe um casal.');
      return vereditoAluguel(v, o, amigo ? 1 : 0);
    }
    case 'voltar_pais': {
      if (moraComFamiliaDeOrigem(v)) return bloqueio('incompativel', 'Você já mora com a família.');
      const temCasa = vinculosVivos(v).some(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai') && x.p.municipioId === v.moradia.municipioId);
      return temCasa ? PERMITIDO : bloqueio('requisito', 'Seus pais não moram nesta cidade.');
    }
    case 'mudar_cidade': {
      if (i < 18) return bloqueio('ilegal', 'Menor de idade não muda de cidade sozinho.');
      if (a.municipioId === v.moradia.municipioId) return bloqueio('incompativel', 'Você já mora aqui.');
      const custo = custoDeMudanca(v.moradia.municipioId, a.municipioId);
      if (disponivel(v) < custo) return bloqueio('requisito', `A mudança custa cerca de R$ ${custo.toLocaleString('pt-BR')}.`);
      return PERMITIDO;
    }
    case 'comprar_veiculo': {
      const o = a.ofertaId ? ofertaDeVeiculo(v, a.ofertaId) : a.modeloId ? ofertaVeiculoPorModelo(v, a.modeloId, VEICULO_ANTIGO[a.modeloId]?.usado) : undefined;
      if (!o) return bloqueio('impossivel', 'Esse veículo já foi vendido.');
      const m = modeloVeiculo(o.modeloId);
      if (i < m.idadeMin) return bloqueio(m.cnh ? 'ilegal' : 'impossivel', `A partir dos ${m.idadeMin}.`);
      if (m.cnh && !v.trabalho.licencas.includes('cnh')) return bloqueio('requisito', 'Precisa de carteira de motorista.');
      if (i < 18 && moraComFamiliaDeOrigem(v) && o.preco > v.financas.conta) return bloqueio('requisito', `Custa ${fmt(o.preco)}; você tem ${fmt(Math.max(0, v.financas.conta))}.`);
      return condicoesVeiculo(v, o.preco, a.financiar, a.entrada).veredito;
    }
    case 'comprar_imovel': {
      if (i < 18) return bloqueio('ilegal', 'Compra de imóvel exige maioridade.');
      const o = a.ofertaId ? ofertaDeImovel(v, a.ofertaId) : a.modeloId ? ofertaPorModelo(v, 'venda', a.modeloId) : undefined;
      if (!o || o.modo !== 'venda') return bloqueio('impossivel', 'Esse imóvel já foi vendido.');
      return condicoesImovel(v, o.preco, a.financiar, a.entrada, a.prazo).veredito;
    }
    case 'vender_bem': {
      const b = v.financas.bens.find(x => x.id === a.bemId);
      if (!b) return bloqueio('impossivel', 'Bem não encontrado.');
      if (i < 18) return bloqueio('ilegal', 'Exige maioridade.');
      const d = v.financas.dividas.find(x => x.bemId === b.id);
      const vale = b.tipo === 'veiculo' ? valorDeVenda(b) : valorDeVendaImovel(b);
      if (d && d.saldo > vale + disponivel(v)) return bloqueio('requisito', `A venda (${fmt(vale)}) não cobre o que falta do financiamento (${fmt(d.saldo)}).`);
      return PERMITIDO;
    }
    case 'veiculo': {
      const b = v.financas.bens.find(x => x.id === a.bemId);
      const d = disponibilidadeVeiculo(v, b?.tipo === 'veiculo' ? b : undefined, a.oque);
      return d.ok ? PERMITIDO : bloqueio('requisito', d.motivo!);
    }
    case 'imovel': {
      const b = v.financas.bens.find(x => x.id === a.bemId);
      const d = disponibilidadeImovel(v, b?.tipo === 'imovel' ? b : undefined, a.oque);
      return d.ok ? PERMITIDO : bloqueio('requisito', d.motivo!);
    }
    case 'investir': {
      if (i < 18) return bloqueio('ilegal', 'Investir exige maioridade (ou um responsável).');
      const pr = PRODUTOS.find(x => x.id === (a.destino as string));
      if (!pr) return bloqueio('impossivel', 'Produto desconhecido.');
      if (a.valor < pr.minimo) return bloqueio('requisito', `O mínimo é ${fmt(pr.minimo)}.`);
      return a.valor > 0 && a.valor <= v.financas.conta ? PERMITIDO : bloqueio('requisito', 'Não há esse dinheiro na conta.');
    }
    case 'resgatar': {
      const ap = aplicacao(v, a.origem);
      return ap && a.valor > 0 && a.valor <= ap.valor + 0.5 ? PERMITIDO : bloqueio('requisito', 'Não há esse valor aplicado.');
    }
    case 'amortizar': {
      const d = v.financas.dividas.find(x => x.id === a.dividaId);
      if (!d) return bloqueio('impossivel', 'Dívida não encontrada.');
      if (d.tipo === 'cartao') return bloqueio('incompativel', 'O cartão se paga sozinho com o que sobra no ano.');
      return a.valor > 0 && a.valor <= v.financas.conta ? PERMITIDO : bloqueio('requisito', 'Não há esse dinheiro na conta.');
    }
    case 'emprestimo': return condicoesEmprestimo(v, a.valor, a.meses).veredito;
    case 'renegociar_financiamento': {
      const d = podeRenegociarFinanciamento(v, v.financas.dividas.find(x => x.id === a.dividaId));
      return d.ok ? PERMITIDO : bloqueio('requisito', d.motivo!);
    }
    case 'estilo': return moraComFamiliaDeOrigem(v) && i < 18 ? bloqueio('impossivel', 'Quem decide os gastos da casa são os adultos.') : PERMITIDO;
    case 'plano_saude': return i < 18 ? bloqueio('impossivel', 'O plano das crianças é decisão dos pais.') : PERMITIDO;
    case 'renegociar': {
      const caras = v.financas.dividas.filter(d => d.tipo === 'cartao' && d.saldo > 0);
      const atrasadas = v.financas.dividas.some(d => (d.atraso ?? 0) > 0);
      if (!caras.length && !v.financas.negativado) return bloqueio('incompativel', atrasadas ? 'Financiamento atrasado se renegocia no banco do financiamento.' : 'Não há dívida cara para renegociar.');
      if (v.fatos['ultimo_acordo'] !== undefined && v.t - v.fatos['ultimo_acordo'] < 24) return bloqueio('incompativel', 'O banco não aceita outro acordo tão cedo.');
      const parcela = parcelaPrice(caras.reduce((x, d) => x + d.saldo, 0), 0.022, 48);
      const renda = rendaPropriaMensal(v);
      if (renda <= 0 && caras.length) return bloqueio('requisito', 'Sem renda, o banco não fecha acordo.');
      if (parcela > renda * 0.35) return bloqueio('requisito', `A parcela do acordo (R$ ${Math.round(parcela).toLocaleString('pt-BR')}) não cabe na sua renda. O banco não fecha acordo que vai quebrar.`);
      return PERMITIDO;
    }
    case 'atracao': return i >= 13 ? PERMITIDO : bloqueio('impossivel', 'Ainda é cedo para isso.');
    case 'mei': {
      const e = v.trabalho.atual;
      if (!e || (e.contrato !== 'informal' && e.contrato !== 'autonomo')) return bloqueio('impossivel', 'Só para quem trabalha por conta.');
      if (e.mei) return bloqueio('impossivel', 'Já é MEI.');
      if (e.contrato === 'autonomo' && e.clientela === undefined) return bloqueio('impossivel', 'Não se aplica.');
      if (e.ocupacaoId === 'produtor_rural' || e.ocupacaoId === 'pescador') return bloqueio('impossivel', 'Produtor rural e pescador têm registro próprio, não MEI.');
      if (e.salario > 6750) return bloqueio('requisito', 'O faturamento passa do limite do MEI (cerca de R$ 81 mil por ano).');
      return PERMITIDO;
    }
    case 'facultativo': {
      const pa = v.trabalho.pausa;
      if (!pa || pa.intensidade !== 'total') return bloqueio('incompativel', 'Só durante uma pausa no trabalho.');
      return (!!pa.facultativo) === a.ativo ? bloqueio('incompativel', 'Já está assim.') : PERMITIDO;
    }
    case 'cuidar_da_casa': {
      if (v.trabalho.pausa) return bloqueio('incompativel', 'Você já está cuidando.');
      if (i < 18) return bloqueio('impossivel', 'Não se aplica.');
      if (a.intensidade === 'parcial') { const r = podeReduzir(v); return r === true ? PERMITIDO : bloqueio('incompativel', r); }
      if (!v.trabalho.atual) return bloqueio('incompativel', 'Você não está trabalhando.');
      if (v.trabalho.atual.contrato === 'militar') return bloqueio('incompativel', 'A carreira militar não tem pausa assim.');
      const par = parceiro(v);
      const casa = filhos(v).some(f => v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(v, f) < 14);
      if (!(par && par.vin.convivio.includes('casa') && par.p.renda > 0) && !casa) return bloqueio('requisito', 'Sem outra renda em casa, parar de trabalhar não se sustenta.');
      return { grau: 'permitido', motivo: 'Sem renda própria, o INSS para — a não ser que pague como facultativo.' };
    }
    case 'voltar_mercado': return v.trabalho.pausa ? PERMITIDO : bloqueio('incompativel', 'Não há pausa para encerrar.');
    case 'parar_por_fora': return v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined ? PERMITIDO : bloqueio('incompativel', 'Não se aplica.');
    case 'adotar_pet': {
      const an = animalDoAbrigo(v, a.animalId);
      if (!an) return bloqueio('impossivel', 'Esse bicho já foi adotado.');
      if (jaFez(v, 'adotou_pet')) return bloqueio('incompativel', 'Um bicho novo por ano já é bastante.');
      const d = podeTerPet(v, an.especie, an.porte);
      return d.grau === 'permitido' ? PERMITIDO : d.grau === 'improvavel' ? { grau: 'improvavel', motivo: d.motivo, chance: 0.5 } : bloqueio(d.grau, d.motivo!);
    }
    case 'veterinario': {
      const d = disponibilidadeVeterinario(v, v.pessoas[a.petId], a.opcao);
      return d.ok ? PERMITIDO : bloqueio('requisito', d.motivo!);
    }
    case 'levar_pet': {
      const p = v.pessoas[a.petId];
      if (!p?.especie || !p.vivo) return bloqueio('impossivel', 'Não há esse animal.');
      if (moraComFamiliaDeOrigem(v)) return bloqueio('incompativel', 'Vocês já moram na mesma casa.');
      if (p.pet?.tutor === 'eu' && v.vinculos[p.id].convivio.includes('casa')) return bloqueio('incompativel', 'Já mora com você.');
      if (p.municipioId !== v.moradia.municipioId) return bloqueio('requisito', 'Mora em outra cidade.');
      if (v.moradia.aceitaPet === false) return bloqueio('requisito', 'O contrato do aluguel não aceita animais.');
      if (v.moradia.tipo === 'cedida') return bloqueio('requisito', 'Morando de favor, não dá para levar um bicho.');
      return v.vinculos[p.id].proximidade >= 30 ? PERMITIDO : bloqueio('incompativel', 'Vocês não são tão próximos.');
    }
    case 'cnh':
      if (i < 18) return bloqueio('ilegal', 'A CNH é a partir dos 18.');
      if (v.trabalho.licencas.includes('cnh')) return bloqueio('incompativel', 'Você já tem carteira.');
      if (v.processos.some(p => p.tipo === 'cnh')) return bloqueio('incompativel', 'Já está na autoescola.');
      return v.financas.conta >= custoCnh(v) ? PERMITIDO : bloqueio('requisito', `A autoescola custa cerca de R$ ${custoCnh(v).toLocaleString('pt-BR')}.`);
  }
}

const custoCnh = (v: Vida) => Math.round(3200 * economiaLocal(v.moradia.municipioId).custo / 10) * 10;

/* ------------------------------------------------------------ Condições de compra */

export interface Condicoes {
  veredito: Veredito;
  preco: number;
  entrada: number;
  entradaMinima: number;
  financiado: number;
  parcela: number;
  meses: number;
  jurosMes: number;
  /** Custos da compra (escritura, impostos) — só imóveis. */
  custos: number;
  /** Quanto a parcela pesa na renda considerada. */
  peso: number;
  /** Total pago ao fim (entrada + parcelas). */
  total: number;
  social: boolean;
  prazoMaximo: number;
}

/** Renda que o banco considera: a sua e, morando junto, a da parceria (composição de renda). */
function rendaParaCredito(v: Vida): number {
  const par = parceiro(v);
  const junto = par && v.vinculos[par.p.id].convivio.includes('casa');
  return rendaPropriaMensal(v) + (junto ? par!.p.renda : 0);
}

/** Condições para comprar um imóvel: entrada, prazo, parcela, peso no orçamento. */
export function condicoesImovel(v: Vida, preco: number, financiar: boolean, entrada?: number, prazoAnos?: number): Condicoes {
  const i = idade(v);
  const custos = Math.round(preco * 0.04 / 100) * 100;
  const tem = disponivel(v);
  const renda = rendaParaCredito(v);
  const social = renda <= 8600 && !v.financas.bens.some(b => b.tipo === 'imovel') && preco <= 350000 * Math.pow(economiaLocal(v.moradia.municipioId).custo, 1.2);
  const prazoMaximo = Math.max(0, Math.min(35, 80 - i));
  const entradaMinima = Math.round(preco * (social ? 0.1 : 0.2));
  const base: Omit<Condicoes, 'veredito'> = { preco, entrada: preco, entradaMinima, financiado: 0, parcela: 0, meses: 0, jurosMes: 0, custos, peso: 0, total: preco + custos, social, prazoMaximo };
  if (!financiar) {
    return { ...base, veredito: tem >= preco + custos ? PERMITIDO : bloqueio('requisito', `À vista: ${fmt(preco)} mais ${fmt(custos)} de escritura e impostos. Você tem ${fmt(tem)}.`) };
  }
  const meses = Math.round(Math.min(prazoAnos ?? 30, prazoMaximo) * 12);
  const ent = Math.round(Math.max(entradaMinima, Math.min(preco, entrada ?? entradaMinima)));
  const jurosMes = juroDeFinanciamento(v, social ? 'imovel_social' : 'imovel');
  const financiado = preco - ent;
  const parcela = meses > 0 ? Math.round(parcelaPrice(financiado, jurosMes, meses)) : 0;
  const peso = parcela / Math.max(1, renda);
  const out = { ...base, entrada: ent, financiado, parcela, meses, jurosMes, peso, total: ent + custos + parcela * meses };
  if (v.financas.negativado) return { ...out, veredito: bloqueio('requisito', 'Com o nome sujo, nenhum banco financia.') };
  if (prazoMaximo < 5) return { ...out, veredito: bloqueio('requisito', 'Nenhum banco financia com esse prazo na sua idade.') };
  if (renda <= 0) return { ...out, veredito: bloqueio('requisito', 'Sem renda comprovada, não há financiamento.') };
  if (tem < ent + custos) return { ...out, veredito: bloqueio('requisito', `A entrada é de ${fmt(ent)}, mais ${fmt(custos)} de escritura. Você tem ${fmt(tem)}.`) };
  if (peso > 0.3) return { ...out, veredito: bloqueio('requisito', `A parcela (${fmt(parcela)}) passaria de 30% da renda${renda !== rendaPropriaMensal(v) ? ' de vocês' : ''}.`) };
  if (comprometimento(v, parcela) > 0.45) return { ...out, veredito: bloqueio('requisito', 'Somada às parcelas que você já tem, não cabe na renda.') };
  return { ...out, veredito: PERMITIDO };
}

/** Condições para comprar um veículo. */
export function condicoesVeiculo(v: Vida, preco: number, financiar: boolean, entrada?: number): Condicoes {
  const tem = disponivel(v);
  const base: Omit<Condicoes, 'veredito'> = { preco, entrada: preco, entradaMinima: Math.round(preco * 0.2), financiado: 0, parcela: 0, meses: 0, jurosMes: 0, custos: 0, peso: 0, total: preco, social: false, prazoMaximo: 5 };
  if (!financiar || preco < 8000) return { ...base, veredito: tem >= preco ? PERMITIDO : bloqueio('requisito', `Custa ${fmt(preco)}; você tem ${fmt(tem)}.`) };
  const meses = 48;
  const ent = Math.round(Math.max(base.entradaMinima, Math.min(preco, entrada ?? base.entradaMinima)));
  const jurosMes = juroDeFinanciamento(v, 'veiculo');
  const financiado = preco - ent;
  const parcela = Math.round(parcelaPrice(financiado, jurosMes, meses));
  const renda = rendaPropriaMensal(v);
  const out = { ...base, entrada: ent, financiado, parcela, meses, jurosMes, peso: parcela / Math.max(1, renda), total: ent + parcela * meses };
  if (v.financas.negativado) return { ...out, veredito: bloqueio('requisito', 'Com o nome sujo, nenhum banco financia.') };
  if (renda <= 0) return { ...out, veredito: bloqueio('requisito', 'Sem renda, não há financiamento.') };
  if (tem < ent) return { ...out, veredito: bloqueio('requisito', `A entrada é de ${fmt(ent)}.`) };
  if (out.peso > 0.3) return { ...out, veredito: bloqueio('requisito', `A parcela (${fmt(parcela)}) passaria de 30% da sua renda.`) };
  if (comprometimento(v, parcela) > 0.45) return { ...out, veredito: bloqueio('requisito', 'Somada às parcelas que você já tem, não cabe na renda.') };
  return { ...out, veredito: PERMITIDO };
}

/** Empréstimo pessoal (ou consignado, para quem tem salário garantido ou aposentadoria). */
export function condicoesEmprestimo(v: Vida, valor: number, meses: number): Condicoes & { consignado: boolean; maximo: number } {
  const e = v.trabalho.atual;
  const consignado = !!v.trabalho.aposentadoria || e?.contrato === 'servidor' || e?.contrato === 'militar' || e?.contrato === 'clt';
  const renda = rendaPropriaMensal(v);
  const maximo = Math.round(renda * (consignado ? 18 : 6) / 100) * 100;
  const jurosMes = juroDeFinanciamento(v, consignado ? 'consignado' : 'emprestimo');
  const prazo = Math.max(6, Math.min(consignado ? 84 : 48, meses));
  const parcela = Math.round(parcelaPrice(valor, jurosMes, prazo));
  const base = { preco: valor, entrada: 0, entradaMinima: 0, financiado: valor, parcela, meses: prazo, jurosMes, custos: 0, peso: parcela / Math.max(1, renda), total: parcela * prazo, social: false, prazoMaximo: consignado ? 7 : 4, consignado, maximo };
  if (idade(v) < 18) return { ...base, veredito: bloqueio('ilegal', 'Empréstimo exige maioridade.') };
  if (v.financas.negativado) return { ...base, veredito: bloqueio('requisito', 'Com o nome sujo, nenhum banco empresta.') };
  if (renda <= 0) return { ...base, veredito: bloqueio('requisito', 'Sem renda, ninguém empresta.') };
  if (valor < 500) return { ...base, veredito: bloqueio('requisito', 'O mínimo é R$ 500.') };
  if (valor > maximo) return { ...base, veredito: bloqueio('requisito', `Pela sua renda, o banco empresta até ${fmt(maximo)}.`) };
  if (comprometimento(v, parcela) > (consignado ? 0.35 : 0.4)) return { ...base, veredito: bloqueio('requisito', 'A parcela não cabe junto com as que você já tem.') };
  return { ...base, veredito: PERMITIDO };
}

/* ================================================================= Execução */

export function executar(vida: Vida, a: Acao): Retorno {
  const disp = disponibilidade(vida, a);
  if (!podeTentar(disp)) return { vida, aviso: { texto: disp.motivo ?? 'Não é possível agora.', tom: 'ruim' } };
  let resultado: string | undefined;
  let aviso: Retorno['aviso'];
  let titulo: string | undefined;
  let pessoaId: string | undefined;
  const { vida: nova } = transacao(vida, (v, r) => {
    const out = executarNaTransacao(v, r, a);
    resultado = out.resultado;
    aviso = out.aviso;
    titulo = out.titulo;
    pessoaId = out.pessoaId;
  });
  return { vida: nova, resultado, aviso, titulo, pessoaId: pessoaId ?? (a.tipo === 'pessoa' && titulo ? a.pessoaId : undefined) };
}

interface Saida { resultado?: string; aviso?: Retorno['aviso']; titulo?: string; pessoaId?: string }
const ok = (texto: string, tom: 'bom' | 'ruim' | 'neutro' = 'neutro'): Saida => ({ aviso: { texto, tom } });

function executarNaTransacao(v: Vida, r: Rng, a: Acao): Saida {
  const i = idade(v);
  switch (a.tipo) {
    case 'decidir': {
      const res = resolverDecisao(v, r, a.opcaoId);
      return 'erro' in res ? ok(res.erro, 'ruim') : { resultado: res.texto };
    }
    case 'rotina': {
      const m = modeloRotina(a.id)!;
      const atual = v.rotinas.find(x => x.id === a.id);
      if (a.ativa) {
        const nivel = a.nivel ?? atual?.nivel ?? 1;
        if (atual) {
          const antes = atual.nivel ?? 1;
          atual.nivel = nivel;
          return ok(nivel > antes ? `${m.nome}: agora ${nivelModelo(m, nivel).rotulo.toLowerCase()}.` : `${m.nome}: mais leve, ${nivelModelo(m, nivel).rotulo.toLowerCase()}.`);
        }
        const f = v.caminhos.frentes[a.id as keyof typeof v.caminhos.frentes];
        const retomada = f && f.meses >= 12 && v.t - f.tUltimo >= 24;
        v.rotinas.push({ id: a.id, tInicio: v.t, nivel });
        if (retomada) {
          const anos = Math.floor((v.t - f!.tUltimo) / 12);
          escrever(v, { texto: `Voltou a ${m.nome.toLowerCase()} depois de ${anos} anos parad${ge(v) === 'feminino' ? 'a' : ge(v) === 'masculino' ? 'o' : 'e'}.`, relevancia: 'cotidiano', tema: 'lazer', escolha: true });
          marcar(v, 'retomada', `Retomou: ${m.nome.toLowerCase()}.`, 1, { dominio: a.id as never });
        } else if (m.pratica && i < 18) {
          marcar(v, 'comecou', `Começou: ${m.nome.toLowerCase()}, aos ${i}.`, 1, { dominio: Object.keys(m.pratica)[0] as never });
        }
        return ok(`${m.nome} entrou na sua semana (${nivelModelo(m, nivel).rotulo.toLowerCase()}).`);
      }
      v.rotinas = v.rotinas.filter(x => x.id !== a.id);
      if (atual && m.pratica && v.t - atual.tInicio >= 24) {
        const anos = Math.floor((v.t - atual.tInicio) / 12);
        escrever(v, { texto: `Parou de ${m.nome.toLowerCase().replace(/^jogar bola$/, 'jogar bola')} depois de ${anos} anos.`.replace('Parou de tocar um instrumento', 'Parou de tocar'), relevancia: anos >= 5 ? 'biografia' : 'cotidiano', tema: 'lazer', escolha: true });
        marcar(v, 'abandono', `Parou: ${m.nome.toLowerCase()}, depois de ${anos} anos.`, anos >= 5 ? 2 : 1, { dominio: Object.keys(m.pratica)[0] as never });
      }
      return ok(`${m.nome} saiu da sua semana.`);
    }
    case 'oportunidade': {
      if (!a.aceitar) { recusarOportunidade(v, a.id); return ok('Você deixou essa passar.'); }
      const o = v.caminhos.oportunidades.find(x => x.id === a.id)!;
      const pessoaId = o.pessoaId;
      const res = aceitarOportunidade(v, r, a.id);
      if (res.entrevista) return abrirEntrevista(v, r, res.entrevista.ocupacaoId, res.entrevista.bonus, res.entrevista.via);
      if (res.decisao) {
        const d = conteudoPorId(res.decisao);
        if (d && d.tipo === 'decisao') {
          const p: Record<string, Pessoa> = {};
          if (pessoaId && v.pessoas[pessoaId]?.vivo) p.amigo = v.pessoas[pessoaId];
          const ctx = contexto(v, r, p);
          abrirDecisao(v, d, ctx);
        }
        return {};
      }
      return ok(res.texto, res.tom ?? 'neutro');
    }
    case 'abrir_negocio': {
      // Abrir é um processo: com o guardado, pequeno, emprestado, com sócio (`conteudo/profissao`).
      v.fatos['abrir_tipo'] = Math.max(0, NEGOCIOS.findIndex(n => n.id === a.negocio));
      const d = conteudoPorId('neg_abrir');
      if (d && d.tipo === 'decisao') {
        const socio = vinculosVivos(v).filter(x => !x.p.especie && x.p.renda >= 2500 && idadePessoa(v, x.p) >= 21 && !x.vin.romance && (x.vin.estagio === 'amigo_proximo' || x.vin.estagio === 'amigo' || x.vin.parentesco === 'irmao')).sort((p, q) => q.vin.confianca - p.vin.confianca)[0];
        abrirDecisao(v, d, contexto(v, r, socio ? { amigo: socio.p } : {}));
        return {};
      }
      const n = abrirNegocio(v, r, a.negocio);
      return ok(`${n.nome} abriu as portas.`, 'bom');
    }
    case 'politica': case 'profissao': {
      const res = a.tipo === 'politica' ? executarPolitica(v, r, a) : executarProfissao(v, r, a);
      if (res.decisao) {
        const d = conteudoPorId(res.decisao);
        if (d && d.tipo === 'decisao') {
          const p: Record<string, Pessoa> = {};
          for (const [papel, id] of Object.entries(res.papeis ?? {})) if (v.pessoas[id]?.vivo) p[papel] = v.pessoas[id];
          abrirDecisao(v, d, contexto(v, r, p));
          return {};
        }
      }
      return ok(res.texto ?? 'Feito.', res.tom ?? 'neutro');
    }
    case 'postura':
      v.educacao.postura = a.valor;
      return ok(a.valor === 'dedicada' ? 'Este ano, estudo em primeiro lugar.' : a.valor === 'relaxada' ? 'Este ano, a escola vem depois.' : 'Estudar no ritmo normal.');
    case 'enem': {
      const nota = fazerEnem(v, r);
      return { resultado: `Você fez o ENEM e tirou ${nota}.` };
    }
    case 'matricular': {
      const o: OpcaoCurso = opcoesDeCurso(v)[a.indice];
      const res = tentarIngresso(v, r, o);
      if (res.entrou && o.municipioId !== v.moradia.municipioId) mudarAgora(v, o.municipioId, `para estudar ${o.curso.nome}`);
      if (!res.entrou) v.fatos[`tentou_${o.curso.id}_${Math.floor(v.t / 12)}`] = v.t;
      return { resultado: res.texto };
    }
    case 'trancar':
      v.educacao.matricula!.trancado = true;
      v.educacao.matricula!.tTrancou = v.t;
      escrever(v, { texto: 'Trancou a matrícula da faculdade.', relevancia: 'biografia', tema: 'estudo', escolha: true });
      return ok('Matrícula trancada. Dá para voltar depois.');
    case 'destrancar': {
      const m = v.educacao.matricula!;
      m.trancado = false;
      m.tTrancou = undefined;
      escrever(v, { texto: `Destrancou a matrícula e voltou para ${conteudoCurso(m.cursoId)}.`, relevancia: 'biografia', tema: 'estudo', escolha: true });
      return ok('De volta ao curso.', 'bom');
    }
    case 'abandonar_curso': {
      const m = v.educacao.matricula!;
      v.educacao.matricula = undefined;
      escrever(v, { texto: `Abandonou o curso de ${conteudoCurso(m.cursoId)}.`, relevancia: 'marco', tema: 'estudo', tom: 'ruim', escolha: true });
      return ok('Curso abandonado.');
    }
    case 'largar_escola': largarEscola(v); return ok('Você deixou a escola.', 'ruim');
    case 'voltar_a_estudar': voltarAEstudar(v); return ok('Matrícula feita no supletivo.', 'bom');
    case 'candidatar': {
      const oc = ocupacao(a.ocupacaoId);
      v.anoAtual.acoes.push(`candidatura:${oc.id}`);
      if (oc.concurso) {
        const reprovou = v.caminhos.concurso.tentativas > v.caminhos.concurso.aprovacoes;
        inscrever(v, oc);
        // Tentar de novo depois de reprovar é comportamento do jogador: persistência.
        if (reprovou) aplicarPersonalidade(v, 'acao:persistir', { disciplina: 1 });
        return { resultado: `Inscrição feita. A prova é daqui a alguns meses — o resultado sai no próximo ano. ${leituraDoPreparo(v, oc)}` };
      }
      if (porContaPropria(oc)) {
        const e = contratar(v, r, oc, 'por_conta');
        escrever(v, { texto: textoDeContratacao(v, oc, e), relevancia: 'marco', tema: 'trabalho', escolha: true });
        return { resultado: `Você começou a pegar trabalho como ${nomeOcupacao(v, oc)}. No começo, a freguesia é pouca.` };
      }
      return abrirEntrevista(v, r, oc.id, 0, 'curriculo');
    }
    case 'pedir_demissao': {
      if (eDasForcas(ocupacao(v.trabalho.atual!.ocupacaoId))) { const ind = sairDasForcas(v); if (ind) pagarComGuardado(v, Math.min(ind, disponivel(v))); return ok(ind ? 'Você saiu da Força — e indenizou a formação.' : 'Você saiu da Força.'); }
      const atual = v.trabalho.atual!;
      const nome = nomeOcupacao(v, ocupacao(atual.ocupacaoId));
      // Largar a estabilidade (concurso, anos de casa) é comportamento; trocar de emprego comum, não.
      if (atual.contrato === 'servidor' || (atual.contrato === 'clt' && v.t - atual.tInicio >= 120)) aplicarPersonalidade(v, 'acao:largar_estabilidade', { independencia: 1, coragem: 1 });
      encerrarEmprego(v, 'pediu demissão');
      escrever(v, { texto: `Pediu demissão do trabalho de ${nome}.`, relevancia: 'marco', tema: 'trabalho', escolha: true });
      return ok('Você está sem emprego agora.');
    }
    case 'horas_extras':
      if (a.parar) {
        v.trabalho.horasExtras = false;
        v.anoAtual.acoes = v.anoAtual.acoes.filter(x => x !== 'horas_extras');
        v.anoAtual.acoes.push('horas_extras_parou');
        return ok('Sem horas extras este ano: menos dinheiro, mais noite livre.');
      }
      v.anoAtual.acoes.push('horas_extras');
      v.trabalho.horasExtras = true;
      return ok('Horas extras combinadas para este ano: mais dinheiro, mais cansaço.');
    case 'cuidar': {
      const res = executarCuidado(v, r, a.cuidado);
      if (res.decisao) {
        const d = conteudoPorId(res.decisao);
        if (d && d.tipo === 'decisao') abrirDecisao(v, d, preparar(d, v, r) ?? contexto(v, r));
        return {};
      }
      return { resultado: res.resultado, titulo: TITULO_CUIDADO[a.cuidado] };
    }
    case 'pedir_aumento': {
      v.anoAtual.acoes.push('aumento');
      // Negociar é um desafio: a abordagem escolhida pesa no resultado.
      const d = conteudoPorId('trab_negociacao')!;
      const ctx = preparar(d, v, r);
      if (ctx && d.tipo === 'decisao') abrirDecisao(v, d, ctx);
      return {};
    }
    case 'aposentar':
      if (v.trabalho.atual && eDasForcas(ocupacao(v.trabalho.atual.ocupacaoId))) { irParaReserva(v, 'pedido'); return ok('Transferência para a reserva concedida.', 'bom'); }
      aposentar(v); return ok('Aposentadoria concedida.', 'bom');
    case 'mei': formalizar(v); escrever(v, { texto: 'Formalizou o trabalho como MEI: CNPJ, nota fiscal e a guia do mês.', relevancia: 'biografia', tema: 'trabalho', escolha: true }); return ok('Agora é MEI: uma guia por mês, tempo de INSS contando.', 'bom');
    case 'facultativo':
      v.trabalho.pausa!.facultativo = a.ativo;
      return ok(a.ativo ? 'O INSS volta a contar, pago como facultativo.' : 'Sem pagar o INSS, o tempo de contribuição para.');
    case 'cuidar_da_casa': iniciarPausa(v, 'casa', a.intensidade); return ok(a.intensidade === 'parcial' ? 'Jornada reduzida.' : 'Você parou de trabalhar para cuidar da casa e da família.');
    case 'voltar_mercado': encerrarPausa(v, 'procurar'); return ok('Hora de voltar.');
    case 'parar_por_fora': pararIlicito(v, ''); return ok('Você saiu. O que ficou para trás ainda pode aparecer.');
    case 'pessoa': return executarInteracao(v, r, a.pessoaId, a.interacao);
    case 'adotar': iniciarAdocao(v, parceiro(v)?.p.id); return ok('Processo de adoção iniciado.');
    case 'sair_de_casa': case 'trocar_moradia': {
      const o = a.ofertaId ? ofertaDeImovel(v, a.ofertaId)! : ofertaPorModelo(v, 'aluguel', a.modeloId!)!;
      const amigo = a.dividirCom ? v.pessoas[a.dividirCom] : undefined;
      alugar(v, o, undefined, false, amigo);
      return ok(`Casa nova: ${nomeImovel(o)}${amigo ? `, dividindo com ${amigo.nome}` : ''}.`, a.tipo === 'sair_de_casa' ? 'bom' : 'neutro');
    }
    case 'voltar_pais': voltarParaCasaDosPais(v); return ok('De volta à casa da família.');
    case 'mudar_cidade': {
      const custo = custoDeMudanca(v.moradia.municipioId, a.municipioId);
      pagarTudo(v, custo);
      mudarAgora(v, a.municipioId, '');
      return ok(`Mudança para ${nomeLugar(a.municipioId)} feita.`);
    }
    case 'comprar_veiculo': {
      const o = a.ofertaId ? ofertaDeVeiculo(v, a.ofertaId)! : ofertaVeiculoPorModelo(v, a.modeloId!, VEICULO_ANTIGO[a.modeloId!]?.usado)!;
      const m = modeloVeiculo(o.modeloId);
      const cond = condicoesVeiculo(v, o.preco, a.financiar, a.entrada);
      const id = `v${v.seq++}`;
      const financiou = a.financiar && cond.financiado > 0;
      pagarTudo(v, financiou ? cond.entrada : o.preco);
      if (financiou) v.financas.dividas.push({ id: `d${v.seq++}`, tipo: 'financiamento_veiculo', saldo: cond.financiado, jurosMes: cond.jurosMes, parcela: cond.parcela, bemId: id, descricao: `Financiamento: ${m.nome}`, tInicio: v.t, prazo: cond.meses });
      const casal = arranjoDaCasa(v) === 'casados';
      const anterior = v.financas.bens.filter(b => b.tipo === 'veiculo');
      v.financas.bens.push({ id, tipo: 'veiculo', modeloId: m.id, nome: m.nome, valor: o.preco, precoPago: o.preco, tCompra: v.t, estado: o.estado, anoFabricacao: o.anoFabricacao, usado: o.usado, dono: casal ? 'casal' : 'eu', historia: [{ t: v.t, texto: o.usado ? `Comprado usado, ano ${o.anoFabricacao}${o.historico ? ` (${o.historico})` : ''}, por ${fmt(o.preco)}.` : `Comprado zero, por ${fmt(o.preco)}.` }] });
      const nVeiculos = (v.fatos['veiculos_comprados'] ?? 0) + 1;
      v.fatos['veiculos_comprados'] = nVeiculos;
      const fem = m.categoria !== 'carro';
      const primeiro = nVeiculos === 1 || !v.biografia.some(e => e.texto.includes(m.categoria === 'carro' ? 'carro' : m.nome));
      const verbo = anterior.length ? `Comprou também ${fem ? 'uma' : 'um'}` : nVeiculos === 1 || primeiro && m.categoria === 'carro' ? `Comprou ${fem ? 'a primeira' : 'o primeiro'}` : `Comprou ${fem ? 'uma' : 'um'}`;
      escrever(v, { texto: `${verbo} ${m.nome}${o.usado ? `, usad${fem ? 'a' : 'o'}, de ${o.anoFabricacao}` : ' zero'}${financiou ? `, financiad${fem ? 'a' : 'o'} em ${cond.meses} vezes` : ''}.`, relevancia: m.categoria === 'carro' && (primeiro || o.preco > 60000) ? 'biografia' : 'cotidiano', tema: 'dinheiro', escolha: true });
      return ok(`${m.nome.charAt(0).toUpperCase() + m.nome.slice(1)} ${o.usado ? `de ${o.anoFabricacao}` : 'zero'} na garagem.`, 'bom');
    }
    case 'comprar_imovel': {
      const o = a.ofertaId ? ofertaDeImovel(v, a.ofertaId)! : ofertaPorModelo(v, 'venda', a.modeloId!)!;
      const m = modeloMoradia(o.modeloId);
      const cond = condicoesImovel(v, o.preco, a.financiar, a.entrada, a.prazo);
      const id = `i${v.seq++}`;
      const financiou = a.financiar && cond.financiado > 0;
      pagarTudo(v, (financiou ? cond.entrada : o.preco) + cond.custos);
      if (financiou) v.financas.dividas.push({ id: `d${v.seq++}`, tipo: 'financiamento_imovel', saldo: cond.financiado, jurosMes: cond.jurosMes, parcela: cond.parcela, bemId: id, descricao: `Financiamento ${m.casa ? 'da casa' : 'do apartamento'}${cond.social ? ' (programa habitacional)' : ''}`, tInicio: v.t, prazo: cond.meses });
      const casal = arranjoDaCasa(v) === 'casados';
      const alugadoPor = a.morar ? undefined : Math.round(o.aluguel * 0.9 / 10) * 10;
      v.financas.bens.push({ id, tipo: 'imovel', modeloId: m.id, nome: m.nome, valor: o.preco, precoPago: o.preco, tCompra: v.t, municipioId: v.moradia.municipioId, estado: o.estado === 'novo' ? 100 : o.estado === 'bom' ? 82 : 55, bairro: o.bairro, alugadoPor, dono: casal ? 'casal' : 'eu', tManutencao: v.t, historia: [{ t: v.t, texto: `Comprado ${financiou ? `com ${fmt(cond.entrada)} de entrada, financiado em ${Math.round(cond.meses / 12)} anos` : 'à vista'}, por ${fmt(o.preco)}.` }] });
      if (o.estado === 'reforma') v.financas.bens[v.financas.bens.length - 1].problema = { id: `pb${v.seq++}`, texto: 'a reforma que já vinha com ele', custo: Math.round(o.preco * 0.08 / 100) * 100, desde: v.t, gravidade: 2, adiado: 0 };
      const primeira = !v.financas.bens.some(b => b.tipo === 'imovel' && b.id !== id && !b.herdado) && !temFato(v, 'comprou_imovel');
      marcarFato(v, 'comprou_imovel');
      if (a.morar) morarNoImovel(v, id);
      const artigoM = m.nome.startsWith('casa') || m.nome.startsWith('kitnet') ? 'a' : 'o';
      escrever(v, { texto: `${primeira ? `Comprou ${m.nome.startsWith('casa') ? 'a primeira casa' : 'o primeiro imóvel'}: ` : 'Comprou '}${artigoM === 'a' ? 'uma' : 'um'} ${m.nome} ${o.bairro}${financiou ? `, financiad${artigoM} em ${Math.round(cond.meses / 12)} anos${cond.social ? ' por um programa habitacional' : ''}` : ' à vista'}${a.morar ? '' : ', para alugar'}.`, relevancia: primeira || a.morar ? 'marco' : 'biografia', tema: 'casa', tom: 'bom', escolha: true });
      return ok(a.morar ? 'A chave é sua.' : `Imóvel comprado. Alugado, deve render ${fmt(alugadoPor ?? 0)} por mês.`, 'bom');
    }
    case 'vender_bem': {
      const b = v.financas.bens.find(x => x.id === a.bemId)!;
      const divida = v.financas.dividas.find(d => d.bemId === b.id);
      const bruto = b.tipo === 'veiculo' ? valorDeVenda(b) : valorDeVendaImovel(b);
      const liquido = bruto - (divida?.saldo ?? 0);
      v.financas.conta += liquido;
      if (v.financas.conta < 0) pagarTudo(v, 0);
      v.financas.bens = v.financas.bens.filter(x => x.id !== b.id);
      v.financas.dividas = v.financas.dividas.filter(d => d.bemId !== b.id);
      const anos = Math.max(0, Math.round((v.t - b.tCompra) / 12));
      if (v.moradia.imovelId === b.id) {
        const m = modeloMoradia(b.modeloId);
        v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: b.modeloId, aluguel: aluguelDe(v, m, v.moradia.municipioId), padrao: v.moradia.padrao, tInicio: v.t, aceitaPet: true, bairro: b.tipo === 'imovel' ? b.bairro : undefined };
      }
      const oque = b.tipo === 'imovel' ? (b.herdado ? 'a casa da família' : v.moradia.imovelId === b.id ? 'a casa' : 'o imóvel') : textoVeiculo(b);
      escrever(v, { texto: `Vendeu ${oque}${anos >= 2 ? `, depois de ${anos} anos` : ''}${divida ? ', e o banco ficou com a parte do financiamento' : ''}.`, relevancia: b.tipo === 'imovel' ? 'marco' : anos >= 5 ? 'biografia' : 'cotidiano', tema: 'dinheiro', escolha: true });
      return ok(`Venda feita: ${fmt(Math.max(0, liquido))} livres${divida ? ' depois de quitar o financiamento' : ''}.`);
    }
    case 'veiculo': {
      const b = v.financas.bens.find(x => x.id === a.bemId) as Veiculo;
      return { resultado: executarVeiculo(v, b, a.oque), titulo: a.oque === 'consertar' || a.oque === 'revisao' ? 'Na oficina' : undefined };
    }
    case 'imovel': {
      const b = v.financas.bens.find(x => x.id === a.bemId) as Imovel;
      if (a.oque === 'morar') { morarNoImovel(v, b.id); escrever(v, { texto: `Foi morar ${b.herdado ? 'na casa da família' : `n${b.nome.startsWith('casa') ? 'a' : 'o'} ${b.nome} que era seu`}.`, relevancia: 'biografia', tema: 'casa', escolha: true }); return ok('Mudança feita.'); }
      return ok(executarImovel(v, b, a.oque));
    }
    case 'investir': {
      aplicar(v, a.destino, a.valor);
      marcarFato(v, `investiu_${a.destino}`);
      if (!temFato(v, 'primeiro_investimento') && a.destino !== 'reserva') { marcarFato(v, 'primeiro_investimento'); }
      return ok(`${fmt(a.valor)} em ${produto(a.destino).nome.toLowerCase()}.`);
    }
    case 'resgatar': {
      const ap = aplicacao(v, a.origem)!;
      const perda = ap.valor < ap.aportado;
      const tirado = resgatar(v, ap.id, a.valor);
      return ok(`${fmt(tirado)} de volta na conta${perda && produto(a.origem).risco >= 3 ? ' — vendendo abaixo do que você pôs' : ''}.`);
    }
    case 'amortizar': {
      const d = v.financas.dividas.find(x => x.id === a.dividaId)!;
      const valor = Math.min(a.valor, d.saldo);
      v.financas.conta -= valor;
      const restantes = mesesRestantes(v, d);
      d.saldo -= valor;
      if (d.saldo <= 0) {
        v.financas.dividas = v.financas.dividas.filter(x => x.id !== d.id);
        if (d.tipo === 'financiamento_imovel') escrever(v, { texto: 'Quitou o financiamento antes do prazo. A casa agora é toda sua.', relevancia: 'marco', tema: 'casa', tom: 'bom', escolha: true });
        return ok('Quitado.', 'bom');
      }
      d.parcela = Math.round(parcelaPrice(d.saldo, d.jurosMes, restantes));
      d.prazo = restantes;
      d.tInicio = v.t;
      return ok(`Amortizou ${fmt(valor)}: a parcela caiu para ${fmt(d.parcela)}.`, 'bom');
    }
    case 'emprestimo': {
      const c = condicoesEmprestimo(v, a.valor, a.meses);
      v.financas.conta += a.valor;
      v.financas.dividas.push({ id: `d${v.seq++}`, tipo: 'emprestimo', saldo: a.valor, jurosMes: c.jurosMes, parcela: c.parcela, descricao: c.consignado ? 'Empréstimo consignado' : 'Empréstimo pessoal', tInicio: v.t, prazo: c.meses });
      if (!temFato(v, 'pegou_emprestimo')) { marcarFato(v, 'pegou_emprestimo'); escrever(v, { texto: `Pegou um empréstimo de ${fmt(a.valor)}${c.consignado ? ', descontado no pagamento' : ''}.`, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true }); }
      return ok(`${fmt(a.valor)} na conta. ${c.meses} parcelas de ${fmt(c.parcela)}.`);
    }
    case 'renegociar_financiamento': {
      const d = v.financas.dividas.find(x => x.id === a.dividaId)!;
      return { resultado: renegociarFinanciamento(v, d), titulo: 'No banco' };
    }
    case 'estilo':
      v.financas.estilo = a.valor;
      return ok('Padrão de vida ajustado.');
    case 'plano_saude':
      v.financas.planoDeSaude = a.ativo;
      if (a.ativo) for (const c of v.corpo.condicoes) if (c.cronica) c.tratando = true;
      return ok(a.ativo ? 'Plano de saúde contratado.' : 'Plano de saúde cancelado.');
    case 'renegociar': {
      // Tudo o que está no rotativo ou em cobrança vira um acordo só, com parcela fixa.
      const caras = v.financas.dividas.filter(d => d.tipo === 'cartao' && d.saldo > 0);
      const total = caras.reduce((x, d) => x + d.saldo, 0);
      v.financas.dividas = v.financas.dividas.filter(d => !caras.includes(d));
      if (total > 0) v.financas.dividas.push({ id: `d${v.seq++}`, tipo: 'acordo', saldo: Math.round(total), jurosMes: 0.022, parcela: Math.round(parcelaPrice(total, 0.022, 48)), descricao: 'Acordo de renegociação', tInicio: v.t, prazo: 48, atraso: 0 });
      if (v.financas.negativado) v.financas.negativado = false;
      const acordos = (v.fatos['acordos'] ?? 0) + 1;
      v.fatos['acordos'] = acordos;
      v.fatos['ultimo_acordo'] = v.t;
      escrever(v, { texto: acordos === 1 ? 'Fechou um acordo para renegociar as dívidas e limpar o nome.' : [`Mais um acordo com o banco — o ${acordos}º —, mais uma tentativa de limpar o nome.`, 'Sentou de novo com o gerente e trocou uma dívida por outra, com parcela menor.', 'Outro feirão de renegociação, outra assinatura, a mesma esperança de sair do vermelho.'][acordos % 3], relevancia: acordos === 1 ? 'biografia' : 'cotidiano', tema: 'dinheiro', escolha: true });
      return ok('Acordo fechado: parcelas fixas, juros menores, nome limpo.', 'bom');
    }
    case 'atracao':
      v.eu.atracao = a.valor;
      return ok('Anotado.');
    case 'adotar_pet': {
      const an = animalDoAbrigo(v, a.animalId)!;
      v.anoAtual.acoes.push('adotou_pet');
      const pet = adotarPet(v, r, an, 'abrigo');
      return { resultado: `${pet.nome} chegou em casa. ${an.jeito.charAt(0).toUpperCase() + an.jeito.slice(1)}.`, titulo: 'Um bicho em casa', pessoaId: pet.id };
    }
    case 'veterinario': {
      const p = v.pessoas[a.petId];
      return { resultado: executarVeterinario(v, r, p, a.opcao), titulo: 'No veterinário', pessoaId: p.id };
    }
    case 'levar_pet': {
      const p = v.pessoas[a.petId];
      infoPet(v, p).tutor = 'eu';
      p.municipioId = v.moradia.municipioId;
      const vin = v.vinculos[p.id];
      if (!vin.convivio.includes('casa')) vin.convivio.push('casa');
      lembrarCom(v, p.id, 'Veio morar com você.', 'casa', 2);
      return ok(`${p.nome} veio morar com você.`, 'bom');
    }
    case 'cnh':
      pagarTudo(v, custoCnh(v));
      iniciarCnh(v);
      return ok('Matrícula na autoescola feita. A prova é em alguns meses.');
  }
}

function abrirEntrevista(v: Vida, r: Rng, ocupacaoId: string, bonus: number, via: string): Saida {
  iniciarEntrevista(v, r, ocupacao(ocupacaoId), bonus, via);
  const d = conteudoPorId('trab_entrevista')!;
  if (d.tipo === 'decisao') abrirDecisao(v, d, contexto(v, r));
  return {};
}

function conteudoCurso(id: string): string {
  return curso(id).nome;
}

/** Paga com a conta e, se faltar, com as aplicações. */
const pagarTudo = (v: Vida, valor: number) => pagarComGuardado(v, valor);

/** Passa a morar num imóvel próprio (saindo da casa dos pais ou de um aluguel). */
function morarNoImovel(v: Vida, id: string): void {
  const b = v.financas.bens.find(x => x.id === id) as Imovel;
  const m = modeloMoradia(b.modeloId);
  const saiuDosPais = moraComFamiliaDeOrigem(v);
  if (saiuDosPais) {
    marcarSaidaDeCasa(v);
    for (const { p, vin } of vinculosVivos(v)) if (vin.parentesco && (['mae', 'pai', 'irmao', 'meio_irmao', 'avo'].includes(vin.parentesco) || (vin.parentesco === 'pet' && p.pet?.tutor !== 'eu'))) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  }
  b.alugadoPor = undefined;
  v.moradia = { tipo: 'propria', municipioId: b.municipioId, imovelId: id, modeloId: m.id, aluguel: 0, padrao: m.padrao, tInicio: v.t, bairro: b.bairro, aceitaPet: true };
}

export { opcoesDeCurso, opcoesDeAluguel, limiteDeCredito };
