/**
 * Comandos do jogador.
 *
 * Toda ação tem uma DISPONIBILIDADE graduada (ver `plausibilidade`) e uma
 * EXECUÇÃO que roda numa transação. A interface pergunta a disponibilidade
 * para mostrar o motivo de um bloqueio; o motor revalida na execução.
 */

import type { Rng } from './rng';
import type { EstiloDeVida, Pessoa, Retorno, Vida } from './tipos';
import { escrever, idade, parceiro, transacao, vinculosVivos } from './nucleo';
import { bloqueio, podeTentar, PERMITIDO, type Veredito } from './plausibilidade';
import { abrirDecisao, conteudoPorId, preparar, resolverDecisao } from './conteudo/motor';
import { modeloRotina, nivelModelo, podeComecarRotina } from './sistemas/rotinas';
import { fazerEnem, largarEscola, opcoesDeCurso, podeFazerEnem, tentarIngresso, voltarAEstudar, type OpcaoCurso } from './sistemas/escola';
import { aposentar, contratar, elegibilidade, encerrarEmprego, nomeOcupacao, podeAposentar, porContaPropria, textoDeContratacao } from './sistemas/trabalho';
import { inscrever, leituraDoPreparo } from './sistemas/concurso';
import { aceitarOportunidade, recusarOportunidade } from './sistemas/oportunidades';
import { abrirNegocio, podeAbrirNegocio } from './sistemas/negocio';
import { marcar } from './sistemas/marcas';
import { aplicarPersonalidade } from './personalidade';
import { contexto } from './conteudo/base';
import { VIAS } from './conteudo/desafios';
import { ge } from './texto';
import { OCUPACOES, ocupacao } from './dados/ocupacoes';
import { alugar, marcarSaidaDeCasa, opcoesDeAluguel, voltarParaCasaDosPais } from './sistemas/moradia';
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
    case 'rotina': return a.ativa ? podeComecarRotina(v, a.id, a.nivel ?? (v.rotinas.find(r => r.id === a.id)?.nivel ?? 1)) : v.rotinas.some(r => r.id === a.id) ? PERMITIDO : bloqueio('incompativel', 'Não faz parte da rotina.');
    case 'oportunidade': {
      const o = v.caminhos.oportunidades.find(x => x.id === a.id);
      if (!o) return bloqueio('incompativel', 'Essa porta já fechou.');
      if (!a.aceitar) return PERMITIDO;
      if (o.ocupacaoId && ['aprendiz', 'estagio', 'indicacao', 'vaga', 'proposta'].includes(o.tipo)) {
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
      const n = abrirNegocio(v, r, a.negocio);
      return ok(`${n.nome} abriu as portas.`, 'bom');
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
        if (saiuDosPais) marcarSaidaDeCasa(v);
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

function abrirEntrevista(v: Vida, r: Rng, ocupacaoId: string, bonus: number, via: string): Saida {
  v.fatos['entrevista_oc'] = OCUPACOES.findIndex(x => x.id === ocupacaoId);
  v.fatos['entrevista_bonus'] = Math.round(bonus * 100);
  v.fatos['entrevista_via'] = Math.max(0, VIAS.indexOf(via));
  const d = conteudoPorId('trab_entrevista')!;
  const ctx = preparar(d, v, r);
  if (ctx && d.tipo === 'decisao') abrirDecisao(v, d, ctx);
  return {};
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
