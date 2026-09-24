/**
 * Comandos do jogador.
 *
 * Toda ação tem uma DISPONIBILIDADE graduada (ver `plausibilidade`) e uma
 * EXECUÇÃO que roda numa transação. A interface pergunta a disponibilidade
 * para mostrar o motivo de um bloqueio; o motor revalida na execução.
 */

import type { Rng } from './rng';
import type { EstiloDeVida, Retorno, Vida } from './tipos';
import { escrever, idade, parceiro, transacao, vinculosVivos } from './nucleo';
import { bloqueio, podeTentar, PERMITIDO, type Veredito } from './plausibilidade';
import { abrirDecisao, conteudoPorId, preparar, resolverDecisao } from './conteudo/motor';
import { modeloRotina, podeComecarRotina } from './sistemas/rotinas';
import { fazerEnem, largarEscola, opcoesDeCurso, podeFazerEnem, tentarIngresso, voltarAEstudar, type OpcaoCurso } from './sistemas/escola';
import { aposentar, elegibilidade, encerrarEmprego, nomeOcupacao, podeAposentar } from './sistemas/trabalho';
import { OCUPACOES, ocupacao } from './dados/ocupacoes';
import { alugar, opcoesDeAluguel, voltarParaCasaDosPais } from './sistemas/moradia';
import { custoDeMudanca, iniciarAdocao, iniciarCnh, mudarAgora } from './sistemas/processos';
import { modeloMoradia, modeloVeiculo, precoImovel } from './dados/bens';
import { economiaLocal, municipio, nomeLugar } from './dados/lugares';
import { curso } from './dados/cursos';
import { limiteDeCredito, saldoMensal } from './sistemas/dinheiro';
import { moraComFamiliaDeOrigem, rendaDomiciliar } from './sistemas/domicilio';
import { disponibilidadeInteracao, executarInteracao, LIMITE_INTERACOES } from './sistemas/interacoes';

/** Id de uma interação do catálogo (`sistemas/interacoes`). O que existe depende da pessoa e do momento. */
export type InteracaoPessoa = string;

export type Acao =
  | { tipo: 'decidir'; opcaoId: string }
  | { tipo: 'rotina'; id: string; ativa: boolean }
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
  | { tipo: 'horas_extras' }
  | { tipo: 'pedir_aumento' }
  | { tipo: 'aposentar' }
  | { tipo: 'pessoa'; pessoaId: string; interacao: InteracaoPessoa }
  | { tipo: 'adotar' }
  | { tipo: 'sair_de_casa'; modeloId: string }
  | { tipo: 'trocar_moradia'; modeloId: string }
  | { tipo: 'voltar_pais' }
  | { tipo: 'mudar_cidade'; municipioId: string }
  | { tipo: 'comprar_veiculo'; modeloId: string; financiar: boolean }
  | { tipo: 'comprar_imovel'; modeloId: string; financiar: boolean; morar: boolean }
  | { tipo: 'vender_bem'; bemId: string }
  | { tipo: 'investir'; destino: 'reserva' | 'acoes'; valor: number }
  | { tipo: 'resgatar'; origem: 'reserva' | 'acoes'; valor: number }
  | { tipo: 'estilo'; valor: EstiloDeVida }
  | { tipo: 'plano_saude'; ativo: boolean }
  | { tipo: 'renegociar' }
  | { tipo: 'cnh' }
  /** Por quem o personagem se interessa — identidade, não comportamento. */
  | { tipo: 'atracao'; valor?: Vida['eu']['atracao'] };

export { LIMITE_INTERACOES };
export const LIMITE_CANDIDATURAS = 3;

const jaFez = (v: Vida, chave: string) => v.anoAtual.acoes.includes(chave);

/* ============================================================ Disponibilidade */

export function disponibilidade(v: Vida, a: Acao): Veredito {
  if (v.morte) return bloqueio('impossivel', 'Esta vida terminou.');
  if (v.momento && a.tipo !== 'decidir') return bloqueio('incompativel', 'Há uma decisão esperando por você.');
  const i = idade(v);
  switch (a.tipo) {
    case 'decidir': return v.momento ? PERMITIDO : bloqueio('incompativel', 'Não há decisão aberta.');
    case 'rotina': return a.ativa ? podeComecarRotina(v, a.id) : v.rotinas.some(r => r.id === a.id) ? PERMITIDO : bloqueio('incompativel', 'Não faz parte da rotina.');
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
      if (v.anoAtual.acoes.filter(x => x.startsWith('candidatura:')).length >= LIMITE_CANDIDATURAS) return bloqueio('incompativel', 'Já foram três processos seletivos neste ano.');
      if (jaFez(v, `candidatura:${oc.id}`)) return bloqueio('incompativel', 'Você já tentou esta vaga neste ano.');
      return elegibilidade(v, oc);
    }
    case 'pedir_demissao': return v.trabalho.atual ? PERMITIDO : bloqueio('incompativel', 'Você não tem emprego.');
    case 'horas_extras':
      if (!v.trabalho.atual || !['clt', 'servidor'].includes(v.trabalho.atual.contrato)) return bloqueio('incompativel', 'Só para quem tem emprego formal.');
      return jaFez(v, 'horas_extras') ? bloqueio('incompativel', 'Já combinado para este ano.') : PERMITIDO;
    case 'pedir_aumento':
      if (!v.trabalho.atual || v.trabalho.atual.contrato === 'informal' || v.trabalho.atual.contrato === 'autonomo') return bloqueio('incompativel', 'Não há a quem pedir.');
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
    case 'sair_de_casa': {
      if (!moraComFamiliaDeOrigem(v)) return bloqueio('incompativel', 'Você já não mora com a família.');
      const o = opcoesDeAluguel(v).find(x => x.m.id === a.modeloId);
      return o ? o.veredito : bloqueio('impossivel', 'Moradia desconhecida.');
    }
    case 'trocar_moradia': {
      if (moraComFamiliaDeOrigem(v)) return bloqueio('incompativel', 'Primeiro é preciso sair de casa.');
      const o = opcoesDeAluguel(v).find(x => x.m.id === a.modeloId);
      return o ? o.veredito : bloqueio('impossivel', 'Moradia desconhecida.');
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
      if (v.financas.conta + v.financas.reserva < custo) return bloqueio('requisito', `A mudança custa cerca de R$ ${custo.toLocaleString('pt-BR')}.`);
      return PERMITIDO;
    }
    case 'comprar_veiculo': {
      const m = modeloVeiculo(a.modeloId);
      if (!m) return bloqueio('impossivel', 'Modelo desconhecido.');
      if (i < m.idadeMin) return bloqueio(m.cnh ? 'ilegal' : 'impossivel', `A partir dos ${m.idadeMin}.`);
      if (m.cnh && !v.trabalho.licencas.includes('cnh')) return bloqueio('requisito', 'Precisa de carteira de motorista.');
      return podeFinanciar(v, m.preco, a.financiar, 48, 0.019, 0.2);
    }
    case 'comprar_imovel': {
      if (i < 18) return bloqueio('ilegal', 'Compra de imóvel exige maioridade.');
      const m = modeloMoradia(a.modeloId);
      if (!m || !m.preco) return bloqueio('impossivel', 'Não está à venda.');
      const preco = precoImovel(m, economiaLocal(v.moradia.municipioId).custo);
      const prazo = Math.min(360, (80 - i) * 12);
      if (a.financiar && prazo < 60) return bloqueio('requisito', 'Nenhum banco financia com esse prazo na sua idade.');
      const mcmv = rendaDomiciliar(v) <= 8600 && !v.financas.bens.some(b => b.tipo === 'imovel');
      return podeFinanciar(v, preco, a.financiar, prazo, mcmv ? 0.0042 : 0.006, mcmv ? 0.1 : 0.2);
    }
    case 'vender_bem': return v.financas.bens.some(b => b.id === a.bemId) ? (i < 18 ? bloqueio('ilegal', 'Exige maioridade.') : PERMITIDO) : bloqueio('impossivel', 'Bem não encontrado.');
    case 'investir':
      if (i < 18) return bloqueio('ilegal', 'Investir exige maioridade (ou um responsável).');
      return a.valor > 0 && a.valor <= v.financas.conta ? PERMITIDO : bloqueio('requisito', 'Saldo insuficiente.');
    case 'resgatar': return a.valor > 0 && a.valor <= v.financas[a.origem] ? PERMITIDO : bloqueio('requisito', 'Saldo insuficiente.');
    case 'estilo': return moraComFamiliaDeOrigem(v) && i < 18 ? bloqueio('impossivel', 'Quem decide os gastos da casa são os adultos.') : PERMITIDO;
    case 'plano_saude': return i < 18 ? bloqueio('impossivel', 'O plano das crianças é decisão dos pais.') : PERMITIDO;
    case 'renegociar': {
      const cartao = v.financas.dividas.find(d => d.tipo === 'cartao');
      if (!cartao && !v.financas.negativado) return bloqueio('incompativel', 'Não há dívida cara para renegociar.');
      if (v.fatos['ultimo_acordo'] !== undefined && v.t - v.fatos['ultimo_acordo'] < 24) return bloqueio('incompativel', 'O banco não aceita outro acordo tão cedo.');
      const parcela = cartao ? parcelaPrice(cartao.saldo, 0.022, 48) : 0;
      const renda = saldoMensal(v).renda;
      if (parcela > renda * 0.35) return bloqueio('requisito', `A parcela do acordo (R$ ${Math.round(parcela).toLocaleString('pt-BR')}) não cabe na sua renda. O banco não fecha acordo que vai quebrar.`);
      return PERMITIDO;
    }
    case 'atracao': return i >= 13 ? PERMITIDO : bloqueio('impossivel', 'Ainda é cedo para isso.');
    case 'cnh':
      if (i < 18) return bloqueio('ilegal', 'A CNH é a partir dos 18.');
      if (v.trabalho.licencas.includes('cnh')) return bloqueio('incompativel', 'Você já tem carteira.');
      if (v.processos.some(p => p.tipo === 'cnh')) return bloqueio('incompativel', 'Já está na autoescola.');
      return v.financas.conta >= custoCnh(v) ? PERMITIDO : bloqueio('requisito', `A autoescola custa cerca de R$ ${custoCnh(v).toLocaleString('pt-BR')}.`);
  }
}

const custoCnh = (v: Vida) => Math.round(3200 * economiaLocal(v.moradia.municipioId).custo / 10) * 10;

function podeFinanciar(v: Vida, preco: number, financiar: boolean, meses: number, juros: number, entradaPct: number): Veredito {
  const disponivel = v.financas.conta + v.financas.reserva;
  if (!financiar) return disponivel >= preco ? PERMITIDO : bloqueio('requisito', `Custa R$ ${preco.toLocaleString('pt-BR')}; você tem R$ ${Math.round(disponivel).toLocaleString('pt-BR')}.`);
  if (v.financas.negativado) return bloqueio('requisito', 'Com o nome sujo, nenhum banco financia.');
  const entrada = preco * entradaPct;
  if (disponivel < entrada) return bloqueio('requisito', `A entrada é de R$ ${Math.round(entrada).toLocaleString('pt-BR')}.`);
  const parcela = parcelaPrice(preco - entrada, juros, meses);
  const renda = rendaDomiciliar(v);
  if (parcela > renda * 0.3) return bloqueio('requisito', `A parcela (R$ ${Math.round(parcela).toLocaleString('pt-BR')}) passaria de 30% da renda da casa.`);
  return PERMITIDO;
}

export function parcelaPrice(valor: number, juros: number, meses: number): number {
  if (juros === 0) return valor / meses;
  return (valor * juros) / (1 - Math.pow(1 + juros, -meses));
}

/* ================================================================= Execução */

export function executar(vida: Vida, a: Acao): Retorno {
  const disp = disponibilidade(vida, a);
  if (!podeTentar(disp)) return { vida, aviso: { texto: disp.motivo ?? 'Não é possível agora.', tom: 'ruim' } };
  let resultado: string | undefined;
  let aviso: Retorno['aviso'];
  const { vida: nova } = transacao(vida, (v, r) => {
    const out = executarNaTransacao(v, r, a);
    resultado = out.resultado;
    aviso = out.aviso;
  });
  return { vida: nova, resultado, aviso };
}

interface Saida { resultado?: string; aviso?: Retorno['aviso'] }
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
      if (a.ativa) {
        v.rotinas.push({ id: a.id, tInicio: v.t });
        return ok(`${m.nome} entrou na sua rotina.`);
      }
      v.rotinas = v.rotinas.filter(x => x.id !== a.id);
      return ok(`${m.nome} saiu da sua rotina.`);
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
        const chance = elegibilidade(v, oc).chance ?? 0.1;
        v.trabalho.candidaturas.push({ id: `c${v.seq++}`, ocupacaoId: oc.id, tInicio: v.t, tResultado: v.t + 6, chance, concurso: true });
        escrever(v, { texto: `Inscreveu-se no concurso para ${nomeOcupacao(v, oc)}.`, relevancia: 'tecnico', tema: 'trabalho', escolha: true });
        return { resultado: 'Inscrição feita. A prova é daqui a alguns meses — o resultado sai no próximo ano.' };
      }
      v.fatos['entrevista_oc'] = OCUPACOES.indexOf(oc);
      const d = conteudoPorId('trab_entrevista')!;
      const ctx = preparar(d, v, r);
      if (ctx && d.tipo === 'decisao') abrirDecisao(v, d, ctx);
      return {};
    }
    case 'pedir_demissao': {
      const nome = nomeOcupacao(v, ocupacao(v.trabalho.atual!.ocupacaoId));
      encerrarEmprego(v, 'pediu demissão');
      escrever(v, { texto: `Pediu demissão do trabalho de ${nome}.`, relevancia: 'marco', tema: 'trabalho', escolha: true });
      return ok('Você está sem emprego agora.');
    }
    case 'horas_extras':
      v.anoAtual.acoes.push('horas_extras');
      v.trabalho.horasExtras = true;
      return ok('Horas extras combinadas para este ano: mais dinheiro, mais cansaço.');
    case 'pedir_aumento': {
      v.anoAtual.acoes.push('aumento');
      // Negociar é um desafio: a abordagem escolhida pesa no resultado.
      const d = conteudoPorId('trab_negociacao')!;
      const ctx = preparar(d, v, r);
      if (ctx && d.tipo === 'decisao') abrirDecisao(v, d, ctx);
      return {};
    }
    case 'aposentar': aposentar(v); return ok('Aposentadoria concedida.', 'bom');
    case 'pessoa': return executarInteracao(v, r, a.pessoaId, a.interacao);
    case 'adotar': iniciarAdocao(v, parceiro(v)?.p.id); return ok('Processo de adoção iniciado.');
    case 'sair_de_casa': alugar(v, a.modeloId); return ok(`Casa nova: ${modeloMoradia(a.modeloId).nome}.`, 'bom');
    case 'trocar_moradia': alugar(v, a.modeloId); return ok(`Casa nova: ${modeloMoradia(a.modeloId).nome}.`);
    case 'voltar_pais': voltarParaCasaDosPais(v); return ok('De volta à casa da família.');
    case 'mudar_cidade': {
      const custo = custoDeMudanca(v.moradia.municipioId, a.municipioId);
      pagar(v, custo);
      mudarAgora(v, a.municipioId, '');
      return ok(`Mudança para ${nomeLugar(a.municipioId)} feita.`);
    }
    case 'comprar_veiculo': {
      const m = modeloVeiculo(a.modeloId);
      const id = `v${v.seq++}`;
      financiarOuPagar(v, m.preco, a.financiar, 48, 0.019, 0.2, 'financiamento_veiculo', `Financiamento: ${m.nome}`, id);
      v.financas.bens.push({ id, tipo: 'veiculo', modeloId: m.id, nome: m.nome, valor: m.preco, tCompra: v.t, estado: m.id.includes('usad') ? 60 : 100 });
      const nVeiculos = (v.fatos['veiculos_comprados'] ?? 0) + 1;
      v.fatos['veiculos_comprados'] = nVeiculos;
      const fem = m.nome.startsWith('bicicleta') || m.nome.startsWith('moto');
      const aindaTem = v.financas.bens.filter(b => b.tipo === 'veiculo' && b.id !== id).length > 0;
      const verbo = nVeiculos === 1 ? `Comprou ${fem ? 'a primeira' : 'o primeiro'}` : aindaTem ? `Comprou também ${fem ? 'uma' : 'um'}` : `Trocou de veículo: agora ${fem ? 'uma' : 'um'}`;
      escrever(v, { texto: `${verbo} ${m.nome}${a.financiar ? ', financiad' + (m.nome.startsWith('bicicleta') || m.nome.startsWith('moto') ? 'a' : 'o') + ' em 48 vezes' : ''}.`, relevancia: m.preco > 30000 ? 'biografia' : 'cotidiano', tema: 'dinheiro', escolha: true });
      return ok(`Você comprou: ${m.nome}.`, 'bom');
    }
    case 'comprar_imovel': {
      const m = modeloMoradia(a.modeloId);
      const preco = precoImovel(m, economiaLocal(v.moradia.municipioId).custo);
      const prazo = Math.min(360, (80 - i) * 12);
      const mcmv = rendaDomiciliar(v) <= 8600 && !v.financas.bens.some(b => b.tipo === 'imovel');
      const id = `i${v.seq++}`;
      financiarOuPagar(v, preco, a.financiar, prazo, mcmv ? 0.0042 : 0.006, mcmv ? 0.1 : 0.2, 'financiamento_imovel', `Financiamento da casa${mcmv ? ' (Minha Casa Minha Vida)' : ''}`, id);
      v.financas.bens.push({ id, tipo: 'imovel', modeloId: m.id, nome: m.nome, valor: preco, tCompra: v.t, municipioId: v.moradia.municipioId, estado: 85, alugadoPor: a.morar ? undefined : Math.round(economiaLocal(v.moradia.municipioId).aluguel * m.fatorAluguel * 0.85) });
      if (a.morar) {
        const saiuDosPais = moraComFamiliaDeOrigem(v);
        if (saiuDosPais) for (const { vin } of vinculosVivos(v)) if (vin.parentesco && ['mae', 'pai', 'irmao', 'meio_irmao', 'avo', 'pet'].includes(vin.parentesco)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
        v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: id, modeloId: m.id, aluguel: 0, padrao: m.padrao, tInicio: v.t };
      }
      escrever(v, { texto: `Comprou ${m.nome.startsWith('casa') ? 'uma' : 'um'} ${m.nome}${a.financiar ? `, financiad${m.nome.startsWith('casa') ? 'a' : 'o'} em ${Math.round(prazo / 12)} anos${mcmv ? ' pelo Minha Casa Minha Vida' : ''}` : ' à vista'}${a.morar ? '' : ', para alugar'}.`, relevancia: 'marco', tema: 'casa', tom: 'bom', escolha: true });
      return ok('Imóvel comprado.', 'bom');
    }
    case 'vender_bem': {
      const b = v.financas.bens.find(x => x.id === a.bemId)!;
      const divida = v.financas.dividas.find(d => d.bemId === b.id);
      const liquido = Math.round(b.valor * 0.95) - (divida?.saldo ?? 0);
      v.financas.conta += liquido;
      v.financas.bens = v.financas.bens.filter(x => x.id !== b.id);
      v.financas.dividas = v.financas.dividas.filter(d => d.bemId !== b.id);
      if (v.moradia.imovelId === b.id) {
        v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: b.modeloId, aluguel: Math.round(economiaLocal(v.moradia.municipioId).aluguel * modeloMoradia(b.modeloId).fatorAluguel), padrao: v.moradia.padrao, tInicio: v.t };
      }
      escrever(v, { texto: `Vendeu ${b.tipo === 'imovel' ? 'o imóvel' : `o ${b.nome}`}.`, relevancia: b.tipo === 'imovel' ? 'marco' : 'cotidiano', tema: 'dinheiro', escolha: true });
      return ok(`Venda feita: R$ ${liquido.toLocaleString('pt-BR')} livres.`);
    }
    case 'investir':
      v.financas.conta -= a.valor;
      v.financas[a.destino] += a.valor;
      return ok(`R$ ${a.valor.toLocaleString('pt-BR')} aplicados.`);
    case 'resgatar':
      v.financas[a.origem] -= a.valor;
      v.financas.conta += a.valor;
      return ok(`R$ ${a.valor.toLocaleString('pt-BR')} resgatados.`);
    case 'estilo':
      v.financas.estilo = a.valor;
      return ok('Padrão de vida ajustado.');
    case 'plano_saude':
      v.financas.planoDeSaude = a.ativo;
      if (a.ativo) for (const c of v.corpo.condicoes) if (c.cronica) c.tratando = true;
      return ok(a.ativo ? 'Plano de saúde contratado.' : 'Plano de saúde cancelado.');
    case 'renegociar': {
      const cartao = v.financas.dividas.find(d => d.tipo === 'cartao');
      if (cartao) {
        cartao.tipo = 'emprestimo';
        cartao.jurosMes = 0.022;
        cartao.parcela = Math.round(parcelaPrice(cartao.saldo, 0.022, 48));
        cartao.descricao = 'Acordo de renegociação';
      }
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
    case 'cnh':
      pagar(v, custoCnh(v));
      iniciarCnh(v);
      return ok('Matrícula na autoescola feita. A prova é em alguns meses.');
  }
}

function conteudoCurso(id: string): string {
  return curso(id).nome;
}

function pagar(v: Vida, valor: number): void {
  const f = v.financas;
  const daConta = Math.min(f.conta, valor);
  f.conta -= daConta;
  f.reserva -= valor - daConta;
}

function financiarOuPagar(v: Vida, preco: number, financiar: boolean, meses: number, juros: number, entradaPct: number, tipo: 'financiamento_imovel' | 'financiamento_veiculo', descricao: string, bemId: string): void {
  if (!financiar) { pagar(v, preco); return; }
  const entrada = Math.round(preco * entradaPct);
  pagar(v, entrada);
  const valor = preco - entrada;
  v.financas.dividas.push({ id: `d${v.seq++}`, tipo, saldo: valor, jurosMes: juros, parcela: Math.round(parcelaPrice(valor, juros, meses)), bemId, descricao });
}

export { opcoesDeCurso, opcoesDeAluguel, limiteDeCredito };
