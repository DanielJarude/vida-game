/**
 * Comandos do jogador.
 *
 * Toda ação tem uma DISPONIBILIDADE graduada (ver `plausibilidade`) e uma
 * EXECUÇÃO que roda numa transação. A interface pergunta a disponibilidade
 * para mostrar o motivo de um bloqueio; o motor revalida na execução.
 */

import type { Rng } from './rng';
import { clamp } from './rng';
import type { EstiloDeVida, Retorno, Vida } from './tipos';
import { escrever, idade, idadePessoa, marcarFato, parceiro, transacao, vinculosVivos } from './nucleo';
import { bloqueio, podeTentar, PERMITIDO, type Veredito } from './plausibilidade';
import { abrirDecisao, conteudoPorId, preparar, resolverDecisao } from './conteudo/motor';
import { modeloRotina, podeComecarRotina } from './sistemas/rotinas';
import { fazerEnem, largarEscola, opcoesDeCurso, podeFazerEnem, tentarIngresso, voltarAEstudar, type OpcaoCurso } from './sistemas/escola';
import { aposentar, elegibilidade, encerrarEmprego, nomeOcupacao, podeAposentar } from './sistemas/trabalho';
import { OCUPACOES, ocupacao } from './dados/ocupacoes';
import { atraiGenero, interesseInicial, mudarEstagio, podeTerRomance, terminar } from './sistemas/romance';
import { compatibilidade } from './sistemas/social';
import { alugar, morarJuntos, opcoesDeAluguel, voltarParaCasaDosPais } from './sistemas/moradia';
import { custoDeMudanca, iniciarAdocao, iniciarCnh, mudarAgora } from './sistemas/processos';
import { modeloMoradia, modeloVeiculo, precoImovel } from './dados/bens';
import { economiaLocal, nomeLugar } from './dados/lugares';
import { limiteDeCredito, saldoMensal } from './sistemas/dinheiro';
import { moraComFamiliaDeOrigem, rendaDomiciliar } from './sistemas/domicilio';
import { gestacaoEmCurso } from './sistemas/familia';
import { flex, ge } from './texto';

export type InteracaoPessoa =
  | 'tempo' | 'conversar' | 'ajudar' | 'reaproximar'
  | 'convidar' | 'pedir_namoro' | 'morar_junto' | 'pedir_casamento' | 'terminar';

export type Acao =
  | { tipo: 'decidir'; opcaoId: string }
  | { tipo: 'rotina'; id: string; ativa: boolean }
  | { tipo: 'postura'; valor: Vida['educacao']['postura'] }
  | { tipo: 'enem' }
  | { tipo: 'matricular'; indice: number }
  | { tipo: 'trancar' }
  | { tipo: 'abandonar_curso' }
  | { tipo: 'largar_escola' }
  | { tipo: 'voltar_a_estudar' }
  | { tipo: 'candidatar'; ocupacaoId: string }
  | { tipo: 'pedir_demissao' }
  | { tipo: 'horas_extras' }
  | { tipo: 'pedir_aumento' }
  | { tipo: 'aposentar' }
  | { tipo: 'pessoa'; pessoaId: string; interacao: InteracaoPessoa }
  | { tipo: 'filhos'; plano: 'tentando' | 'evitando' }
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

export const LIMITE_INTERACOES = 5;
export const LIMITE_CANDIDATURAS = 3;

const interacoesNoAno = (v: Vida) => v.anoAtual.acoes.filter(a => a.startsWith('pessoa:')).length;
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
    case 'pessoa': return disponibilidadePessoa(v, a.pessoaId, a.interacao);
    case 'filhos': {
      const par = parceiro(v);
      if (!par) return bloqueio('requisito', 'Precisa de uma parceria.');
      if (!v.corpo.podeGestar && par.p.genero !== 'feminino') return bloqueio('impossivel', 'Vocês dois não podem gestar. A adoção é um caminho.');
      if (a.plano === 'tentando') {
        if (i < 18) return bloqueio('requisito', 'Planejar filho é coisa para depois dos 18.');
        if (gestacaoEmCurso(v)) return bloqueio('incompativel', 'Já há uma gestação em curso.');
        if (par.vin.romance?.planoFilhos === 'tentando') return bloqueio('incompativel', 'Vocês já estão tentando.');
      }
      return PERMITIDO;
    }
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

function disponibilidadePessoa(v: Vida, id: string, x: InteracaoPessoa): Veredito {
  const p = v.pessoas[id];
  const vin = v.vinculos[id];
  if (!p || !vin || !p.vivo) return bloqueio('impossivel', 'Essa pessoa não está mais na sua vida.');
  if (interacoesNoAno(v) >= LIMITE_INTERACOES) return bloqueio('incompativel', 'O ano não tem mais tempo para isso. Avance o ano.');
  if (jaFez(v, `pessoa:${x}:${id}`)) return bloqueio('incompativel', 'Você já fez isso neste ano.');
  const i = idade(v);
  const rom = vin.romance;
  if (p.especie && !['tempo'].includes(x)) return bloqueio('impossivel', 'É um bicho.');
  switch (x) {
    case 'tempo': return i < 3 ? bloqueio('impossivel', 'Ainda muito pequeno.') : PERMITIDO;
    case 'conversar': return i < 4 ? bloqueio('impossivel', 'Ainda não fala direito.') : idadePessoa(v, p) < 3 ? bloqueio('impossivel', 'Ainda não fala direito.') : PERMITIDO;
    case 'ajudar': return i < 14 ? bloqueio('impossivel', 'Criança não tem como ajudar com dinheiro.') : v.financas.conta >= 300 ? PERMITIDO : bloqueio('requisito', 'Sem dinheiro para ajudar.');
    case 'reaproximar': return vin.estagio === 'afastado' ? PERMITIDO : bloqueio('incompativel', 'Vocês não estão afastados.');
    case 'convidar':
      if (rom && rom.estagio !== 'interesse' && rom.estagio !== 'ex') return bloqueio('incompativel', 'Vocês já estão juntos.');
      if (!podeTerRomance(v, p, vin)) {
        if (vin.parentesco) return bloqueio('impossivel', 'É da família.');
        if (i < 14 || idadePessoa(v, p) < 14) return bloqueio('ilegal', 'Ninguém namora antes dos 14.');
        if ((i >= 18) !== (idadePessoa(v, p) >= 18)) return bloqueio('ilegal', 'Adulto e menor de idade: não.');
        if (!atraiGenero(p.atracao, v.eu.genero)) return bloqueio('impossivel', `${p.nome} não se interessa por ${flex(ge(v), 'homens', 'mulheres', 'pessoas como você')}.`);
        return bloqueio('impossivel', 'Não vai rolar.');
      }
      if (parceiro(v)) return { grau: 'irregular', motivo: 'Você está num relacionamento. Isso seria traição.' };
      return { grau: 'permitido', chance: chanceConvite(v, id) };
    case 'pedir_namoro': {
      if (rom?.estagio !== 'saindo') return bloqueio('incompativel', 'Primeiro, saiam juntos.');
      const atual = parceiro(v);
      if (atual && atual.p.id !== id) return bloqueio('incompativel', `Você está com ${atual.p.nome}. Para namorar ${p.nome}, seria preciso terminar antes.`);
      if (v.t - rom.tEstagio < 3) return bloqueio('requisito', 'Cedo demais.');
      return PERMITIDO;
    }
    case 'morar_junto':
      if (rom?.estagio !== 'namoro') return bloqueio('incompativel', 'Só para quem namora.');
      if (i < 18 || idadePessoa(v, p) < 18) return bloqueio('ilegal', 'Os dois precisam ser maiores de idade.');
      if (v.t - rom.tEstagio < 12) return bloqueio('requisito', 'Namoram há pouco tempo.');
      return PERMITIDO;
    case 'pedir_casamento':
      if (!rom || !['namoro', 'morando_junto'].includes(rom.estagio)) return bloqueio('incompativel', 'Só para quem está junto.');
      if (i < 18 || idadePessoa(v, p) < 18) return bloqueio('ilegal', 'Casamento exige maioridade (16 com autorização dos pais, na lei; no jogo, 18).');
      if (v.t - vin.tInicio < 18) return bloqueio('requisito', 'Estão juntos há pouco tempo.');
      if (v.fatos[`noivado_${id}`] !== undefined) return bloqueio('incompativel', 'Vocês já estão noivos.');
      return PERMITIDO;
    case 'terminar':
      return rom && ['saindo', 'namoro', 'morando_junto', 'casamento'].includes(rom.estagio) ? PERMITIDO : bloqueio('incompativel', 'Não há relacionamento.');
  }
}

function chanceConvite(v: Vida, id: string): number {
  const p = v.pessoas[id];
  const vin = v.vinculos[id];
  const base = vin.romance?.envolvimento ?? interesseInicial(v, p);
  return clamp((base + vin.proximidade * 0.3 - 30) / 60, 0.05, 0.9);
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
      escrever(v, { texto: 'Trancou a matrícula da faculdade.', relevancia: 'biografia', tema: 'estudo', escolha: true });
      return ok('Matrícula trancada. Dá para voltar depois.');
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
    case 'pessoa': return interagir(v, r, a.pessoaId, a.interacao);
    case 'filhos': {
      const par = parceiro(v)!;
      const rom = par.vin.romance!;
      if (a.plano === 'evitando') {
        rom.planoFilhos = 'evitando';
        return ok('Vocês combinaram evitar filhos por agora.');
      }
      const quer = par.p.querFilhos ?? 'talvez';
      if (quer === 'nao' || (quer === 'talvez' && rom.envolvimento < 65)) {
        par.vin.tensao = clamp(par.vin.tensao + 15);
        return { resultado: `${par.p.nome} não quer ter filhos${quer === 'talvez' ? ' agora' : ''}. A conversa terminou tensa.` };
      }
      rom.planoFilhos = 'tentando';
      escrever(v, { texto: `Decidiu com ${par.p.nome} tentar ter um filho.`, relevancia: 'biografia', tema: 'filhos', escolha: true, pessoas: [par.p.id] });
      return { resultado: `${par.p.nome} topou. Vocês começaram a tentar.` };
    }
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
      escrever(v, { texto: `Comprou ${m.nome.startsWith('bicicleta') || m.nome.startsWith('moto') ? 'uma' : 'um'} ${m.nome}${a.financiar ? ', financiad' + (m.nome.startsWith('bicicleta') || m.nome.startsWith('moto') ? 'a' : 'o') + ' em 48 vezes' : ''}.`, relevancia: m.preco > 30000 ? 'biografia' : 'cotidiano', tema: 'dinheiro', escolha: true });
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
      escrever(v, { texto: acordos === 1 ? 'Fechou um acordo para renegociar as dívidas e limpar o nome.' : 'Mais um acordo com o banco, mais uma tentativa de limpar o nome.', relevancia: acordos === 1 ? 'biografia' : 'cotidiano', tema: 'dinheiro', escolha: true });
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
  return ({ medicina: 'Medicina' } as Record<string, string>)[id] ?? id.replace(/_/g, ' ');
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

/* ------------------------------------------------------------ Interações */

function interagir(v: Vida, r: Rng, id: string, x: InteracaoPessoa): Saida {
  const p = v.pessoas[id];
  const vin = v.vinculos[id];
  v.anoAtual.acoes.push(`pessoa:${x}:${id}`);
  vin.tUltimoContato = v.t;
  const c = compatibilidade(v, p);
  const nome = p.nome;
  switch (x) {
    case 'tempo': {
      vin.proximidade = clamp(vin.proximidade + Math.round(6 + c * 6));
      if (vin.romance) vin.romance.envolvimento = clamp(vin.romance.envolvimento + 5);
      const frases = p.especie
        ? [`Longo passeio com ${nome}.`, `Uma tarde inteira brincando com ${nome}.`]
        : idadePessoa(v, p) < 12
          ? [`Uma tarde de parque com ${nome}.`, `Montaram um quebra-cabeça de mil peças, você e ${nome}.`]
          : [`Um dia inteiro com ${nome}, sem pressa.`, `Saíram para comer e perderam a hora conversando.`, `Um fim de semana com ${nome} que ficou na memória.`];
      return { resultado: r.pick(frases) };
    }
    case 'conversar': {
      vin.tensao = clamp(vin.tensao - 18);
      vin.proximidade = clamp(vin.proximidade + Math.round(3 + c * 4));
      return { resultado: c > 0 ? `A conversa com ${nome} foi longe e fez bem aos dois.` : `Vocês conversaram. Nem tudo ficou resolvido, mas o clima melhorou.` };
    }
    case 'ajudar': {
      const valor = Math.min(v.financas.conta, 500);
      v.financas.conta -= valor;
      vin.proximidade = clamp(vin.proximidade + 8);
      return { resultado: `Você ajudou ${nome} com R$ ${valor.toLocaleString('pt-BR')} num aperto. ${p.genero === 'feminino' ? 'Ela' : 'Ele'} não esqueceu.` };
    }
    case 'reaproximar': {
      vin.proximidade = clamp(vin.proximidade + 14);
      if (vin.proximidade >= 40) vin.estagio = 'amigo';
      escrever(v, { texto: `Procurou ${nome} depois de muito tempo sem se falar.`, relevancia: 'cotidiano', tema: 'amizade', escolha: true, pessoas: [id] });
      return { resultado: vin.proximidade >= 40 ? `${nome} respondeu na hora. Parecia estar esperando isso.` : `${nome} respondeu com educação. Vai levar tempo.` };
    }
    case 'convidar': {
      const traicao = !!parceiro(v);
      if (!v.eu.atracao) v.eu.atracao = p.genero === 'masculino' ? 'homens' : p.genero === 'feminino' ? 'mulheres' : 'ambos';
      if (!r.chance(chanceConvite(v, id))) {
        vin.romance = undefined;
        return { resultado: `${nome} agradeceu o convite e disse que prefere deixar as coisas como estão.` };
      }
      if (traicao) {
        const atual = parceiro(v)!;
        if (r.chance(0.4)) atual.vin.tensao = 95;
        v.personalidade.tracos.impulsividade = clamp(v.personalidade.tracos.impulsividade + 6, -100, 100);
      }
      mudarEstagio(v, vin, 'saindo');
      vin.romance!.envolvimento = Math.max(vin.romance!.envolvimento, 50);
      escrever(v, { texto: `Começou a sair com ${nome}.`, relevancia: 'biografia', tema: 'amor', tom: 'bom', escolha: true, pessoas: [id] });
      return { resultado: `${nome} topou. O primeiro encontro terminou mais tarde do que o combinado.` };
    }
    case 'pedir_namoro': {
      const rom = vin.romance!;
      if (r.chance(clamp((rom.envolvimento - 30) / 45, 0.05, 0.95))) {
        mudarEstagio(v, vin, 'namoro');
        escrever(v, { texto: `Começou a namorar ${nome}.`, relevancia: 'marco', tema: 'amor', tom: 'bom', escolha: true, pessoas: [id] });
        vin.historia.push({ t: v.t, texto: 'Começaram a namorar.' });
        return { resultado: `${nome} disse sim antes de você terminar a frase.` };
      }
      rom.envolvimento = clamp(rom.envolvimento - 8);
      return { resultado: `${nome} disse que ainda não está pront${p.genero === 'feminino' ? 'a' : 'o'} para isso.` };
    }
    case 'morar_junto': {
      const rom = vin.romance!;
      if (r.chance(clamp((rom.envolvimento - 35) / 40, 0.05, 0.95))) {
        mudarEstagio(v, vin, 'morando_junto');
        morarJuntos(v, p);
        escrever(v, { texto: `Foi morar com ${nome}.`, relevancia: 'marco', tema: 'amor', tom: 'bom', escolha: true, pessoas: [id] });
        vin.historia.push({ t: v.t, texto: 'Foram morar juntos.' });
        return { resultado: `${nome} topou. A primeira compra da casa nova foi um jogo de panelas.` };
      }
      rom.envolvimento = clamp(rom.envolvimento - 6);
      return { resultado: `${nome} achou cedo demais.` };
    }
    case 'pedir_casamento': {
      const rom = vin.romance!;
      if (r.chance(clamp((rom.envolvimento - 40) / 35, 0.05, 0.95))) {
        marcarFato(v, `noivado_${id}`);
        escrever(v, { texto: `Pediu ${nome} em casamento. A resposta foi sim.`, relevancia: 'marco', tema: 'amor', tom: 'bom', escolha: true, pessoas: [id] });
        return { resultado: `Sim. ${nome} chorou, você chorou, o garçom bateu palmas.` };
      }
      rom.envolvimento = clamp(rom.envolvimento - 15);
      vin.tensao = clamp(vin.tensao + 25);
      escrever(v, { texto: `Pediu ${nome} em casamento e ouviu um não.`, relevancia: 'biografia', tema: 'amor', tom: 'ruim', escolha: true, pessoas: [id] });
      return { resultado: `${nome} ficou em silêncio por muito tempo. Depois disse que não.` };
    }
    case 'terminar':
      terminar(v, p, vin, 'jogador');
      return { resultado: `Acabou com ${nome}.` };
  }
}

export { opcoesDeCurso, opcoesDeAluguel, limiteDeCredito };
