/**
 * A vida profissional em processos: contexto → decisão → resposta →
 * consequência. Nada aqui é "clicar e sortear": o jogador escolhe uma
 * abordagem, o mundo responde conforme o que ele construiu (desempenho,
 * clima, ofício, dinheiro, família) e a consequência fica na vida.
 *
 * Regras de agência: o mundo PROPÕE (a chefia pede hora extra, a empresa
 * oferece transferência, um preparador oferece "uma ajuda"); a reação é
 * sempre do jogador. Personalidade só se move por comportamento — recusar
 * pela família, arriscar um empréstimo, blefar, persistir, tomar atalho.
 *
 * Doping: sempre abstrato. O jogo diz "uma substância proibida", "uma
 * ajuda que não aparece no exame"; nunca o quê, quanto, como ou como
 * escapar do controle.
 */

import type { Conteudo, Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import { clamp } from '../rng';
import { escrever, filhos, idade, idadePessoa, lembrarCom, marcarFato, parceiro } from '../nucleo';
import { estresse } from './efeitos';
import { ocupacao, ocupacaoOuNula } from '../dados/ocupacoes';
import { economiaLocal, municipio, MUNICIPIOS } from '../dados/lugares';
import { degrausAcima, elegibilidade, encerrarEmprego, horizonte, nomeOcupacao, podeAposentar, aposentar, tetoSalarial } from '../sistemas/trabalho';
import { ambienteDoNegocio, comprarParteDoSocio, contratarFuncionario, demitirFuncionario, donoIntegral, estrategiaDe, fecharNegocio, modosDeAbrir, mudarEstrategia, negocioAtivo, NEGOCIOS, parteDoSocio, precoDaParteDoSocio, presencaDe, salarioDaFuncao, tipoDoNegocio, valorDoNegocio, venderNegocio, custoLocal, tamanhoDaEquipe } from '../sistemas/negocio';
import { rotuloEstrategia } from '../dados/negocios';
import { analisarEntrada, propor } from '../sistemas/compromissos';
import type { EstrategiaNegocio } from '../tipos';
import { chefiaAtual, climaDe, mexerNoClima, rotulosDoRitmo } from '../sistemas/profissao';
import { fatorRitmoClientela, fatorRitmoSalario, ritmoDe } from '../sistemas/ritmo';
import { novaOportunidade } from '../sistemas/oportunidades';
import { mudarAgora } from '../sistemas/processos';
import { marcar } from '../sistemas/marcas';
import { abalar } from '../sistemas/abalo';
import { encerrarCarreira, mudarDeClube } from '../sistemas/esporte';
import { CLUBES, clubeDoNivel, noClube, oClube } from '../dados/clubes';
import { habilidade } from '../sistemas/frentes';
import { arrendamentoMensal } from '../sistemas/rural';
import { MUNIC_POR_INDICE } from '../sistemas/militar';
import { anoDe } from '../tempo';
import { dinheiro as fmt, listaNatural } from '../texto';
import { disponivel } from '../sistemas/dinheiro';
import { criarPessoa, vincular } from '../pessoas';
import { experienciaNaTrilha } from '../sistemas/trabalho';

const deHoje = (c: Ctx, chave: string) => c.v.fatos[chave] !== undefined && c.v.fatos[chave] === c.v.t;
const emprego = (c: Ctx) => c.v.trabalho.atual!;
const quemChefia = (c: Ctx) => chefiaAtual(c.v)?.nome ?? 'A chefia';
const comFamilia = (v: Vida) => !!parceiro(v)?.vin.convivio.includes('casa') || filhos(v).some(f => v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(v, f) < 18);
const pequenosEmCasa = (v: Vida) => filhos(v).filter(f => v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(v, f) < 12);

/** Um destino plausível (determinístico no ano) para transferência, proposta ou remoção. */
function destinoDoAno(v: Vida, semente: string, filtro: (id: string) => boolean): string | undefined {
  const aqui = municipio(v.moradia.municipioId);
  const opcoes = MUNICIPIOS.filter(m => m.id !== aqui.id && filtro(m.id)).sort((a, b) => (b.regiao === aqui.regiao ? 2 : 0) + (b.perfil === 'metropole' ? 2 : 0) - ((a.regiao === aqui.regiao ? 2 : 0) + (a.perfil === 'metropole' ? 2 : 0))).slice(0, 6);
  if (!opcoes.length) return undefined;
  let h = anoDe(v.t) * 31;
  for (const ch of v.id + semente) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return opcoes[h % opcoes.length].id;
}

/**
 * Mudar de cidade SEM perder o trabalho (transferência, remoção, clube novo):
 * o emprego vai junto; a parceria recomeça a carreira lá; os filhos trocam de escola.
 */
function mudarComOTrabalho(c: Ctx, destino: string, juntos: boolean, motivo: string): void {
  const v = c.v;
  const e = v.trabalho.atual!;
  const par = parceiro(v);
  if (!juntos) {
    for (const x of Object.values(v.vinculos)) if (x.convivio.includes('casa') && v.pessoas[x.pessoaId] && !v.pessoas[x.pessoaId].especie) x.convivio = x.convivio.filter(k => k !== 'casa');
    if (par) { par.vin.tensao = clamp(par.vin.tensao + 14); lembrarCom(v, par.p.id, `Foi trabalhar em ${municipio(destino).nome}; a família ficou.`, 'distancia', 2); }
  }
  e.municipioId = destino;
  mudarAgora(v, destino, motivo);
  if (juntos && par && par.p.renda > 0) {
    par.p.renda = Math.round(par.p.renda * 0.5);
    v.fatos[`recomecando_${par.p.id}`] = v.t;
    par.vin.tensao = clamp(par.vin.tensao + 8);
    lembrarCom(v, par.p.id, `Mudaram juntos para ${municipio(destino).nome}.`, 'casa', 2);
  }
  if (juntos) for (const f of filhos(v)) if (v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(v, f) >= 8 && idadePessoa(v, f) < 18) v.vinculos[f.id].tensao = clamp(v.vinculos[f.id].tensao + 8);
  marcar(v, 'mudanca_cidade', `Mudou-se para ${municipio(destino).nome} ${motivo}${!juntos && par ? `, sem ${par.p.nome}` : ''}.`, 3);
}

const EMPRESAS_GRANDES = /rede|banco|supermercado|departamento|distribui|montadora|transportadora|atacadista|varejista|consultoria|software|startup|hospital particular|indústria/;

export const PROFISSAO: Conteudo[] = [
  /* ================================================== Quem tem chefia */
  {
    id: 'trab_promocao', tipo: 'decisao', idade: [16, 75], tema: 'trabalho', manual: true, repetir: 0,
    titulo: 'A conversa sobre promoção',
    texto: c => {
      const e = emprego(c);
      const prox = degrausAcima(ocupacao(e.ocupacaoId))[0];
      return `Você pediu meia hora com ${chefiaAtual(c.v)?.nome ?? 'a chefia'} para falar do próximo passo${prox ? ` — ${nomeOcupacao(c.v, prox)}` : ''}. ${horizonte(c.v) ?? ''}`;
    },
    opcoes: [
      { id: 'vaga', texto: c => { const p = degrausAcima(ocupacao(emprego(c).ocupacaoId))[0]; return p ? `Dizer que quer a vaga de ${nomeOcupacao(c.v, p)} quando abrir` : 'Dizer que quer crescer ali'; },
        resolver: c => {
          const e = emprego(c);
          const prox = degrausAcima(ocupacao(e.ocupacaoId))[0];
          const d = prox ? elegibilidade(c.v, prox, 'promocao') : undefined;
          if (d && d.grau !== 'permitido' && d.grau !== 'improvavel') return { texto: `A resposta foi honesta: ${(d.motivo ?? 'ainda não').replace(/^Exige /, 'o cargo exige ').replace(/\.$/, '')}. Sem isso, não tem como.`, memoria: null, efeito: () => mexerNoClima(c.v, 1) };
          if (e.desempenho < 60) return { texto: 'Ouviu, com todas as letras, que o trabalho precisa melhorar antes de qualquer conversa sobre cargo.', memoria: null, tom: 'ruim', efeito: () => mexerNoClima(c.v, -2) };
          if (climaDe(e) < 42) return { texto: 'A conversa foi educada e fria. Ninguém prometeu nada — e você percebeu por quê.', memoria: null, tom: 'ruim' };
          return { texto: 'Anotaram o seu nome. "Quando abrir, você é o primeiro da lista." Promessa de chefia vale o que vale — mas foi dita.', memoria: 'Pediu, com todas as letras, a próxima vaga de cargo.', relevancia: 'cotidiano', tom: 'bom', efeito: () => { c.v.fatos['promocao_pedida'] = c.v.t; mexerNoClima(c.v, 3); } };
        } },
      { id: 'responsabilidade', texto: 'Pedir mais responsabilidade agora, antes do cargo', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Passaram para você um pedaço do trabalho de quem está acima. Mais cobrança, mais visibilidade.', memoria: 'Pediu mais responsabilidade no trabalho.', relevancia: 'cotidiano', efeito: () => { const e = emprego(c); e.desempenho = clamp(e.desempenho + 6); mexerNoClima(c.v, 5); estresse(c, 5); c.v.fatos['promocao_pedida'] = c.v.t; } }) },
      { id: 'falta', texto: 'Perguntar, com franqueza, o que falta',
        resolver: c => {
          const e = emprego(c);
          const hz = horizonte(c.v) ?? '';
          const falta = /formação/.test(hz) ? 'estudar' : /estrada|tempo/.test(hz) ? 'tempo de casa' : e.desempenho < 62 ? 'entregar mais' : /cidade/.test(hz) ? 'uma cidade maior' : 'uma vaga abrir';
          return { texto: `A resposta foi direta: falta ${falta}. ${falta === 'uma vaga abrir' ? 'O resto, você já tem.' : 'Pelo menos agora você sabe.'}`, memoria: null, efeito: () => mexerNoClima(c.v, 2) };
        } },
      { id: 'depois', texto: 'Desconversar e deixar para outro dia', resolver: () => ({ texto: 'Você falou do tempo, do trânsito, e voltou para a mesa.', memoria: null }) }
    ]
  },
  {
    id: 'trab_hora_extra', tipo: 'decisao', idade: [18, 64], tema: 'trabalho', repetir: 3, peso: 2,
    quando: c => { const e = c.v.trabalho.atual; return !!e && e.contrato === 'clt' && !c.v.trabalho.horasExtras && !c.v.anoAtual.acoes.includes('horas_extras_parou') && !e.reduzida && ocupacao(e.ocupacaoId).trilha !== 'atleta'; },
    titulo: 'Fim de ano puxado',
    texto: c => `${quemChefia(c)} pediu que você ficasse até mais tarde nos próximos dois meses: o setor está atrasado e sábado paga em dobro. ${comFamilia(c.v) ? 'Em casa, o fim de ano já tem planos.' : ''}`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar',
        resolver: c => ({ texto: 'Dois meses chegando em casa com a janta fria. O dinheiro veio.', memoria: null, efeito: () => { const e = emprego(c); c.v.financas.conta += Math.round(e.salario * 0.45); estresse(c, 8); mexerNoClima(c.v, 4); } }) },
      { id: 'sabados', texto: 'Topar só os sábados',
        resolver: c => ({ texto: 'Os sábados foram do trabalho; as noites, suas.', memoria: null, efeito: () => { const e = emprego(c); c.v.financas.conta += Math.round(e.salario * 0.22); estresse(c, 4); mexerNoClima(c.v, 1); } }) },
      { id: 'familia', texto: 'Recusar: a família vem antes', comportamento: { familia: 1 }, disponivel: c => (comFamilia(c.v) ? true : false),
        resolver: c => ({ texto: `${quemChefia(c)} disse que entendia, do jeito que se diz que entende.`, memoria: 'Recusou horas extras de fim de ano para ficar com a família.', relevancia: 'cotidiano', efeito: () => { mexerNoClima(c.v, -4); const par = parceiro(c.v); if (par) par.vin.proximidade = clamp(par.vin.proximidade + 2); } }) },
      { id: 'recusar', texto: 'Recusar com jeito',
        resolver: c => ({ texto: 'Você explicou que não dava. Ficou por isso — por enquanto.', memoria: null, efeito: () => mexerNoClima(c.v, -2) }) }
    ]
  },
  {
    id: 'trab_conflito', tipo: 'decisao', idade: [18, 70], tema: 'trabalho', repetir: 4,
    peso: c => (climaDe(c.v.trabalho.atual) < 45 ? 4 : 1),
    quando: c => { const e = c.v.trabalho.atual; return !!e && ['clt', 'servidor'].includes(e.contrato) && e.clientela === undefined && ocupacao(e.ocupacaoId).trilha !== 'atleta'; },
    titulo: 'A discussão',
    texto: c => c.r.pick([
      `${quemChefia(c)} cobrou na frente de todo mundo um erro que não foi seu.`,
      'Uma colega passou a apresentar sozinha, nas reuniões, o trabalho que vocês fizeram juntas.'.replace('juntas', c.g('juntos', 'juntas')),
      `${quemChefia(c)} mudou o seu horário sem avisar, pela terceira vez no mês.`
    ]),
    opcoes: [
      { id: 'conversar', texto: 'Pedir uma conversa a sós, depois', comportamento: { sociabilidade: 1 },
        resolver: c => { const deu = c.r.chance(0.55 + c.v.personalidade.tracos.sociabilidade / 300); return { texto: deu ? 'A conversa foi difícil e boa. Saiu dali um combinado — e um pouco de respeito.' : 'Você falou; do outro lado, ouviram com os braços cruzados.', memoria: null, tom: deu ? 'bom' : 'ruim', efeito: () => { mexerNoClima(c.v, deu ? 7 : -2); estresse(c, 2); } }; } },
      { id: 'engolir', texto: 'Engolir e seguir',
        resolver: c => ({ texto: 'Você engoliu. Em casa, à noite, a conversa foi com o travesseiro.', memoria: null, efeito: () => estresse(c, 6) }) },
      { id: 'enfrentar', texto: 'Responder na hora, na frente de todos', comportamento: { coragem: 1, impulsividade: 1 },
        resolver: c => { const respeito = c.r.chance(0.4); return { texto: respeito ? 'Fez-se silêncio. Depois, dois colegas vieram dizer que você tinha razão.' : 'O clima azedou de vez. Na semana seguinte, você foi tirado de um projeto.'.replace('tirado', c.g('tirado', 'tirada', 'tirade')), memoria: null, tom: respeito ? 'bom' : 'ruim', efeito: () => { mexerNoClima(c.v, respeito ? 3 : -12); estresse(c, respeito ? 1 : 6); } }; } },
      { id: 'sair', texto: 'Começar a procurar outro emprego', comportamento: { independencia: 1 },
        resolver: c => {
          const oc = ocupacao(emprego(c).ocupacaoId);
          const achou = c.r.chance(0.5);
          if (achou) novaOportunidade(c.v, { tipo: 'vaga', ocupacaoId: oc.id, meses: 12, chave: 'fuga_conflito', bonus: 0.15, titulo: 'Uma saída', texto: `Uma empresa respondeu ao currículo: ${nomeOcupacao(c.v, oc)}, um ambiente novo.` });
          return { texto: achou ? 'O currículo saiu no mesmo dia. Uma resposta veio — está entre as portas abertas.' : 'O currículo saiu no mesmo dia. Resposta, ainda nenhuma.', memoria: null, efeito: () => mexerNoClima(c.v, -2) };
        } }
    ]
  },
  {
    id: 'trab_responsabilidade', tipo: 'decisao', idade: [20, 62], tema: 'trabalho', repetir: 5, peso: 2,
    quando: c => { const e = c.v.trabalho.atual; return !!e && ['clt', 'servidor'].includes(e.contrato) && e.clientela === undefined && e.desempenho >= 65 && ocupacao(e.ocupacaoId).nivel <= 3 && !e.formacaoAte && ocupacao(e.ocupacaoId).trilha !== 'atleta'; },
    titulo: 'Uma responsabilidade a mais',
    texto: c => `${quemChefia(c)} precisa de alguém para ${c.r.pick(['cobrir as férias da coordenação', 'tocar um projeto que atrasou', 'treinar a turma que acabou de entrar', 'abrir uma frente nova por uns meses'])}. Pensou em você. Não muda o cargo — ainda.${pequenosEmCasa(c.v).length ? ' Em casa, as crianças estão pequenas.' : ''}`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Mais reunião, mais telefone, mais noite em claro — e o seu nome circulando.', memoria: 'Assumiu uma responsabilidade a mais no trabalho.', relevancia: 'cotidiano', efeito: () => { const e = emprego(c); e.desempenho = clamp(e.desempenho + 8); mexerNoClima(c.v, 6); estresse(c, 7); c.v.fatos['promocao_pedida'] = c.v.t; const par = parceiro(c.v); if (par && pequenosEmCasa(c.v).length) par.vin.tensao = clamp(par.vin.tensao + 3); } }) },
      { id: 'condicao', texto: 'Aceitar, se vier com aumento', comportamento: { coragem: 1 },
        resolver: c => {
          const e = emprego(c);
          const deu = e.desempenho >= 72 && c.r.chance(0.55);
          if (deu) return { texto: 'Pensaram dois dias e toparam: mais trabalho, mais salário.', memoria: null, tom: 'bom', efeito: () => { e.salario = Math.round(Math.min(tetoSalarial(e), e.salario * 1.06) / 10) * 10; c.v.fatos['ultimo_aumento'] = c.v.t; e.desempenho = clamp(e.desempenho + 6); mexerNoClima(c.v, 3); estresse(c, 6); c.v.fatos['promocao_pedida'] = c.v.t; } };
          return { texto: 'Disseram que não era momento — e passaram a tarefa para outra pessoa.', memoria: null, tom: 'ruim', efeito: () => mexerNoClima(c.v, -4) };
        } },
      { id: 'recusar', texto: 'Agradecer e recusar',
        resolver: c => ({ texto: 'Você agradeceu. A tarefa foi para outra mesa.', memoria: null, efeito: () => mexerNoClima(c.v, -3) }) }
    ]
  },
  {
    id: 'trab_transferencia', tipo: 'decisao', idade: [22, 55], tema: 'lugar', repetir: 10, peso: 1,
    quando: c => { const e = c.v.trabalho.atual; if (!e || e.contrato !== 'clt' || e.reduzida) return false; const oc = ocupacao(e.ocupacaoId); return oc.nivel >= 2 && oc.nivel <= 4 && oc.trilha !== 'atleta' && EMPRESAS_GRANDES.test(e.empregador) && e.desempenho >= 55 && !!destinoDoAno(c.v, 'transf', () => true); },
    titulo: 'Uma transferência',
    texto: c => {
      const d = municipio(destinoDoAno(c.v, 'transf', () => true)!);
      const par = parceiro(c.v);
      const casa = pequenosEmCasa(c.v);
      return `${cap(emprego(c).empregador)} vai reforçar a unidade de ${d.nome}, ${d.uf}, e quer você lá: mesmo cargo, salário uns 15% maior, ajuda de custo para a mudança. ${par ? `${par.p.nome} ${par.p.renda > 0 ? 'teria de recomeçar o trabalho lá' : 'teria de recomeçar a vida lá'}.` : ''} ${casa.length ? `${casa.length === 1 ? casa[0].nome : 'As crianças'} trocaria${casa.length === 1 ? '' : 'm'} de escola.` : ''}`;
    },
    opcoes: [
      { id: 'ir', texto: c => (comFamilia(c.v) ? 'Aceitar e ir todos juntos' : 'Aceitar e se mudar'),
        resolver: c => ({ texto: 'Caixas, fita adesiva, a última volta pela casa vazia.', memoria: null, efeito: () => { const d = destinoDoAno(c.v, 'transf', () => true)!; const e = emprego(c); e.salario = Math.round(e.salario * 1.15 / 10) * 10; mexerNoClima(c.v, 5); mudarComOTrabalho(c, d, true, `transferid${c.g('o', 'a', 'e')} pela empresa`); } }) },
      { id: 'sozinho', texto: 'Ir na frente, sem a família por enquanto', disponivel: c => (comFamilia(c.v) ? true : false),
        resolver: c => ({ texto: 'Um quarto alugado perto do trabalho e a rodoviária toda sexta-feira.', memoria: null, efeito: () => { const d = destinoDoAno(c.v, 'transf', () => true)!; const e = emprego(c); e.salario = Math.round(e.salario * 1.15 / 10) * 10; mudarComOTrabalho(c, d, false, `transferid${c.g('o', 'a', 'e')} pela empresa`); } }) },
      { id: 'negociar', texto: 'Topar só com um aumento maior', comportamento: { coragem: 1 },
        resolver: c => { const deu = c.r.chance(0.45); return { texto: deu ? 'Toparam 25%. A mudança ficou para o mês seguinte.' : 'A empresa mandou outra pessoa. Na sua mesa, ficou um silêncio estranho.', memoria: null, tom: deu ? 'bom' : 'ruim', efeito: () => { if (deu) { const d = destinoDoAno(c.v, 'transf', () => true)!; const e = emprego(c); e.salario = Math.round(e.salario * 1.25 / 10) * 10; mudarComOTrabalho(c, d, true, `transferid${c.g('o', 'a', 'e')} pela empresa`); } else mexerNoClima(c.v, -5); } }; } },
      { id: 'ficar', texto: 'Ficar onde está', comportamento: { familia: 1 }, disponivel: c => (comFamilia(c.v) ? true : false),
        resolver: c => ({ texto: 'Você agradeceu e ficou. A família continuou onde tem raiz.', memoria: 'Recusou uma transferência para outra cidade para não tirar a família do lugar.', relevancia: 'biografia', efeito: () => mexerNoClima(c.v, -3) }) },
      { id: 'recusar', texto: 'Recusar', disponivel: c => (comFamilia(c.v) ? false : true),
        resolver: c => ({ texto: 'Você agradeceu e disse que preferia ficar.', memoria: null, efeito: () => mexerNoClima(c.v, -3) }) }
    ]
  },
  {
    id: 'trab_limite', tipo: 'decisao', idade: [18, 80], tema: 'saude', prioritario: true, prioridade: 4, repetir: 3,
    quando: c => deHoje(c, 'trab_limite') && !!c.v.trabalho.atual,
    titulo: 'O corpo deu sinal',
    texto: c => `Uma tontura no meio do expediente, um exame que veio alterado, o médico falando devagar. ${c.v.trabalho.atual?.anosPuxado ?? 3} anos nesse ritmo. ${parceiro(c.v) ? `${parceiro(c.v)!.p.nome} ficou na sala de espera.` : ''}`,
    opcoes: [
      { id: 'normal', texto: c => rotulosDoRitmo(c.v).normal,
        resolver: c => ({ texto: 'Você voltou ao ritmo de antes. Os primeiros meses pareceram férias.', memoria: 'Diminuiu o ritmo do trabalho depois de um alerta do corpo.', relevancia: 'biografia', efeito: () => { const e = emprego(c); aliviarRitmo(c.v, 'normal'); estresse(c, -6); e.anosPuxado = 0; } }) },
      { id: 'leve', texto: c => rotulosDoRitmo(c.v).leve, disponivel: c => (!donoIntegral(c.v) || tamanhoDaEquipe(donoIntegral(c.v)!) > 0 ? true : 'Sem ninguém para dividir o trabalho.'),
        resolver: c => ({ texto: 'Menos dinheiro, mais sono. O exame seguinte veio melhor.', memoria: 'Aliviou de vez o ritmo do trabalho depois de um alerta do corpo.', relevancia: 'biografia', efeito: () => { aliviarRitmo(c.v, 'leve'); estresse(c, -10); } }) },
      { id: 'seguir', texto: 'Seguir no ritmo', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'Você tomou o remédio, guardou o exame na gaveta e voltou para o trabalho.', memoria: 'Ignorou um alerta do corpo e seguiu no mesmo ritmo de trabalho.', relevancia: 'biografia', tom: 'ruim', efeito: () => { c.v.corpo.saude = clamp(c.v.corpo.saude - 6); estresse(c, 3); } }) }
    ]
  },

  /* ================================================== O próprio negócio */
  {
    id: 'neg_abrir', tipo: 'decisao', idade: [18, 80], tema: 'trabalho', manual: true, repetir: 0,
    titulo: c => { const t = NEGOCIOS[c.v.fatos['abrir_tipo'] ?? 0]; return `Abrir ${t.nome}`; },
    texto: c => {
      const t = NEGOCIOS[c.v.fatos['abrir_tipo'] ?? 0];
      const custo = custoLocal(c.v, t);
      const estrada = Math.max(...t.trilhas.map(tr => experienciaNaTrilha(c.v, tr)));
      const conhece = estrada >= t.meses || (t.dominio ? habilidade(c.v, t.dominio) >= (t.habilidade ?? 101) : false);
      const par = parceiro(c.v);
      const e = c.v.trabalho.atual;
      const lado = e ? ` Abrir não é pedir demissão: dá para tocar nas horas vagas${t.presenca === 'rua' ? ' (com alguém no balcão)' : ''} ou largar o trabalho de ${nomeOcupacao(c.v, ocupacao(e.ocupacaoId))} e se dedicar — isso vem depois.` : '';
      return `A ideia já não cabe só na cabeça. ${conhece ? 'Os anos no ramo contam: você sabe onde o dinheiro entra e por onde ele foge.' : 'Você nunca trabalhou no ramo — quem trabalhou diria que o primeiro ano é o que derruba.'} Para começar direito: uns ${fmt(custo)}${t.emCasa ? `; pequeno, em casa, uns ${fmt(Math.round(custo * 0.4 / 100) * 100)}` : ''}.${lado} ${par ? `${par.p.nome} quer saber de onde vem o dinheiro.` : ''}`;
    },
    opcoes: [
      { id: 'guardado', texto: 'Com o dinheiro guardado',
        disponivel: c => motivoModo(c, 'guardado'),
        resolver: c => abrirCom(c, 'guardado') },
      { id: 'pequeno', texto: 'Começar pequeno, em casa',
        disponivel: c => (NEGOCIOS[c.v.fatos['abrir_tipo'] ?? 0].emCasa ? motivoModo(c, 'pequeno') : false),
        resolver: c => abrirCom(c, 'pequeno') },
      { id: 'emprestimo', texto: 'Com um empréstimo do banco', comportamento: { coragem: 1 },
        disponivel: c => motivoModo(c, 'emprestimo'),
        resolver: c => abrirCom(c, 'emprestimo') },
      { id: 'socio', texto: c => (c.p.amigo ? `Chamar ${c.p.amigo.nome} para sócio` : 'Chamar alguém para sócio'), comportamento: { sociabilidade: 1 },
        disponivel: c => { if (!c.p.amigo) return false; const t = NEGOCIOS[c.v.fatos['abrir_tipo'] ?? 0]; if (t.licenca) return false; return disponivel(c.v) >= custoLocal(c.v, t) * 0.5 ? true : 'Nem a sua metade você tem.'; },
        resolver: c => {
          const topa = c.r.chance(0.55 + (c.v.vinculos[c.p.amigo.id]?.confianca ?? 40) / 250);
          if (!topa) return { texto: `${c.p.amigo.nome} ouviu tudo, pediu uma semana e disse que não: não é momento.`, memoria: null };
          return { texto: `${c.p.amigo.nome} topou. Um aperto de mão, um contador, um contrato social.`, memoria: null, efeito: () => { const t = NEGOCIOS[c.v.fatos['abrir_tipo'] ?? 0]; c.v.financas.conta += Math.round(custoLocal(c.v, t) * 0.5); lembrarCom(c.v, c.p.amigo.id, `Combinaram abrir ${t.nome} juntos.`, 'trabalho', 3); propor(c.v, c.r, { tipo: 'negocio', negocioId: t.id, modo: 'socio', socioId: c.p.amigo.id }); } };
        } },
      { id: 'desistir', texto: 'Deixar a ideia para depois', resolver: () => ({ texto: 'A planilha ficou salva numa pasta do computador.', memoria: null }) }
    ]
  },
  {
    id: 'neg_contratar', tipo: 'decisao', idade: [18, 85], tema: 'trabalho', manual: true, repetir: 0,
    titulo: 'Contratar alguém',
    texto: c => { const n = negocioAtivo(c.v)!; const sal = salarioDaFuncao(c.v, tipoDoNegocio(n)!); return `${n.nome} precisa de mais mãos. Um salário de uns ${fmt(sal)} por mês, mais os encargos — que saem do caixa antes de sair para você. ${n.estado === 'apertado' ? 'E o movimento anda fraco.' : ''}`; },
    opcoes: [
      { id: 'indicacao', texto: 'Alguém indicado por um conhecido',
        resolver: c => { const f = contratarFuncionario(c.v, c.r, 'indicacao', c.p.amigo?.id); const p = f && c.v.pessoas[f.pessoaId]; return { texto: p ? `${p.nome} chegou com a recomendação de quem você confia. Na primeira semana, já sabia onde ficava tudo.` : 'Ninguém apareceu.', memoria: null }; } },
      { id: 'experiente', texto: 'Alguém com experiência no ramo (mais caro)',
        resolver: c => { const f = contratarFuncionario(c.v, c.r, 'experiente'); const p = f && c.v.pessoas[f.pessoaId]; return { texto: p ? `${p.nome} veio de um concorrente, com clientes que conheciam o trabalho ${p.genero === 'feminino' ? 'dela' : 'dele'}.` : 'Ninguém apareceu.', memoria: null, efeito: () => { const n = negocioAtivo(c.v); if (n) { n.clientela = clamp(n.clientela + 3); if (c.v.trabalho.atual) c.v.trabalho.atual.clientela = n.clientela; } } }; } },
      { id: 'jovem', texto: 'Um jovem no primeiro emprego',
        resolver: c => { const f = contratarFuncionario(c.v, c.r, 'jovem'); const p = f && c.v.pessoas[f.pessoaId]; return { texto: p ? `${p.nome} tinha dezoito ou dezenove anos e as mãos inquietas. Vai precisar aprender quase tudo.` : 'Ninguém apareceu.', memoria: null }; } },
      { id: 'nao', texto: 'Ainda não', resolver: () => ({ texto: 'O anúncio ficou na gaveta.', memoria: null }) }
    ]
  },
  {
    id: 'neg_demitir', tipo: 'decisao', idade: [18, 85], tema: 'trabalho', manual: true, repetir: 0,
    titulo: c => `Demitir ${c.p.funcionario?.nome ?? 'alguém'}?`,
    texto: c => {
      const n = negocioAtivo(c.v)!;
      const f = n.equipe?.find(x => x.pessoaId === c.p.funcionario?.id);
      const anos = f ? Math.max(0, Math.floor((c.v.t - f.tInicio) / 12)) : 0;
      return `${c.p.funcionario?.nome ?? 'Alguém'} trabalha ${anos >= 1 ? `há ${anos} ${anos === 1 ? 'ano' : 'anos'}` : 'há pouco tempo'} em ${n.nome}${f ? `, como ${f.funcao}` : ''}. ${n.estado === 'apertado' ? 'O movimento não está pagando a folha.' : 'O negócio vai bem; a pergunta é outra.'} O acerto sai do caixa.`;
    },
    opcoes: [
      { id: 'demitir', texto: 'Demitir, com o acerto certinho',
        resolver: c => ({ texto: 'A conversa durou dez minutos e pareceu uma hora.', memoria: null, tom: 'ruim', efeito: () => { if (c.p.funcionario) demitirFuncionario(c.v, c.p.funcionario.id); } }) },
      { id: 'cortar', texto: 'Cortar o próprio salário para manter', comportamento: { generosidade: 1, empatia: 1 },
        resolver: c => ({ texto: 'No ano que vem, você tira menos do negócio. A equipe fica inteira.', memoria: `Cortou a própria retirada para não demitir ${c.p.funcionario?.nome ?? 'ninguém'}.`, relevancia: 'biografia', efeito: () => { c.v.fatos['corte_proprio'] = c.v.t; if (c.p.funcionario) { const vin = c.v.vinculos[c.p.funcionario.id]; if (vin) { vin.confianca = clamp(vin.confianca + 10); vin.proximidade = clamp(vin.proximidade + 5); } } } }) },
      { id: 'manter', texto: 'Manter, por enquanto', resolver: () => ({ texto: 'Você deixou para o mês que vem.', memoria: null }) }
    ]
  },
  {
    id: 'neg_estrategia', tipo: 'decisao', idade: [18, 85], tema: 'trabalho', manual: true, repetir: 0,
    titulo: 'O jeito de vender',
    texto: c => { const n = negocioAtivo(c.v)!; const hoje = rotuloEstrategia(presencaDe(n), estrategiaDe(n), n.tipo)?.hoje ?? 'segue do jeito de sempre'; return `Hoje, ${n.nome} ${hoje}. Mudar leva tempo para aparecer — e custa diferente.`; },
    // Só os jeitos que existem para ESTE negócio: loja on-line não tem freguesia de bairro; consultório não vende em plataforma.
    opcoes: (['bairro', 'qualidade', 'preco', 'online', 'escala', 'marca'] as EstrategiaNegocio[]).map(id => ({
      id,
      texto: (c: Ctx) => { const n = negocioAtivo(c.v)!; return rotuloEstrategia(presencaDe(n), id, n.tipo)?.opcao ?? id; },
      disponivel: (c: Ctx) => { const n = negocioAtivo(c.v); const t = n && tipoDoNegocio(n); return !!n && !!t && t.estrategias.includes(id) && estrategiaDe(n) !== id && !!rotuloEstrategia(t.presenca, id, t.id); },
      resolver: (c: Ctx) => ({ texto: textoDaEstrategia(c, id), memoria: null, efeito: () => mudarEstrategia(c.v, id) })
    }))
  },
  {
    id: 'neg_socio', tipo: 'decisao', idade: [18, 85], tema: 'trabalho', manual: true, repetir: 0,
    titulo: 'Um sócio',
    texto: c => { const n = negocioAtivo(c.v)!; const aporte = aporteDoSocio(c); return `${c.p.socio ? c.p.socio.nome : 'Um comerciante da região, conhecido de conhecidos,'} topa entrar com ${fmt(aporte)} em ${n.nome}, em troca de metade do que o negócio der daqui para a frente — e de voz nas decisões.`; },
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar o sócio',
        resolver: c => ({ texto: 'Dinheiro novo no caixa, outra cabeça nas decisões. Metade do lucro, metade do risco.', memoria: null, efeito: () => {
          const n = negocioAtivo(c.v)!;
          let socio = c.p.socio;
          if (!socio) { socio = criarPessoa(c.v, c.r, { idade: c.r.int(38, 62), municipioId: c.v.moradia.municipioId, ocupacao: 'comerciante', renda: 8000 }); vincular(c.v, socio, { origem: 'trabalho', proximidade: 15, estagio: 'conhecido', convivio: ['trabalho'] }).ambiente = ambienteDoNegocio(n); }
          else if (c.v.vinculos[socio.id]) c.v.vinculos[socio.id].ambiente = ambienteDoNegocio(n);
          n.socioId = socio.id;
          n.parteSocio = 0.5;
          n.caixa = (n.caixa ?? 0) + aporteDoSocio(c);
          lembrarCom(c.v, socio.id, `Virou sócio de ${n.nome}.`, 'trabalho', 2);
          escrever(c.v, { texto: `${socio.nome} entrou de sócio em ${n.nome}, com ${fmt(aporteDoSocio(c))}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true, pessoas: [socio.id] });
        } }) },
      { id: 'recusar', texto: 'Seguir sem sócio', comportamento: { independencia: 1 }, resolver: () => ({ texto: 'O negócio continua só seu — o risco também.', memoria: null }) }
    ]
  },
  {
    id: 'neg_vender', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', manual: true, repetir: 0,
    titulo: c => `Vender ${negocioAtivo(c.v)?.nome ?? 'o negócio'}`,
    texto: c => textoDaVenda(c),
    opcoes: [
      { id: 'vender', texto: 'Vender', resolver: c => ({ texto: presencaDe(negocioAtivo(c.v)!) === 'online' ? 'Você passou as senhas, o estoque e a lista de clientes para o novo dono.' : 'Você entregou as chaves e ficou um tempo parado na calçada.', memoria: null, efeito: () => venderNegocio(c.v, valorDoNegocio(c.v, negocioAtivo(c.v)!)) }) },
      { id: 'pechinchar', texto: 'Pedir mais', comportamento: { coragem: 1 },
        resolver: c => { const deu = c.r.chance(0.45); return { texto: deu ? 'O comprador reclamou, fez conta no celular e subiu a oferta.' : 'O comprador agradeceu e foi olhar outro ponto.', memoria: null, tom: deu ? 'bom' : 'ruim', efeito: () => { if (deu) venderNegocio(c.v, Math.round(valorDoNegocio(c.v, negocioAtivo(c.v)!) * 1.15 / 1000) * 1000); else c.v.fatos['neg_venda_recusada'] = c.v.t; } }; } },
      { id: 'nao', texto: 'Não vender', resolver: c => ({ texto: 'Não está à venda — por enquanto.', memoria: null, efeito: () => { c.v.fatos['neg_venda_recusada'] = c.v.t; } }) }
    ]
  },
  {
    id: 'neg_comprador', tipo: 'decisao', idade: [25, 90], tema: 'trabalho', repetir: 5, peso: 1,
    quando: c => { const n = negocioAtivo(c.v); return !!n && n.estado === 'firme' && (c.v.t - n.tInicio) / 12 >= 4 && (c.v.fatos['neg_venda_recusada'] === undefined || c.v.t - c.v.fatos['neg_venda_recusada'] >= 36); },
    titulo: 'Alguém quer comprar',
    texto: c => { const n = negocioAtivo(c.v)!; const p = presencaDe(n); const quem = p === 'online' ? `Chegou um e-mail de uma empresa maior perguntando se ${n.nome} está à venda.` : p === 'obra' ? `Uma construtora da região quer comprar ${n.nome}, com equipe e carteira de clientes.` : p === 'atendimento' ? `Um grupo de ${n.tipo === 'escritorio_contabil' || n.tipo === 'consultoria_ti' ? 'escritórios' : 'clínicas'} quer comprar ${n.nome}, com a carteira de ${tipoDoNegocio(n)?.cliente === 'paciente' ? 'pacientes' : 'clientes'}.` : `Um homem de terno entrou, pediu um café e perguntou se ${n.nome} estava à venda.`; return `${quem} ${textoDaVenda(c)}`; },
    opcoes: [
      { id: 'vender', texto: 'Vender', resolver: c => ({ texto: 'Um aperto de mão, uma assinatura, um negócio que já não é seu.', memoria: null, efeito: () => venderNegocio(c.v, valorDoNegocio(c.v, negocioAtivo(c.v)!)) }) },
      { id: 'nao', texto: 'Não está à venda', resolver: c => ({ texto: 'Ele deixou um cartão. Você guardou numa gaveta.', memoria: null, efeito: () => { c.v.fatos['neg_venda_recusada'] = c.v.t; } }) }
    ]
  },
  {
    id: 'neg_fechar', tipo: 'decisao', idade: [18, 95], tema: 'trabalho', manual: true, repetir: 0,
    titulo: c => `Fechar ${negocioAtivo(c.v)?.nome ?? 'o negócio'}?`,
    texto: c => {
      const n = negocioAtivo(c.v)!;
      const anos = Math.max(1, Math.round((c.v.t - n.tInicio) / 12));
      const eq = tamanhoDaEquipe(n);
      const divida = n.dividaId && c.v.financas.dividas.find(d => d.id === n.dividaId && d.saldo > 0);
      return `${anos} ${anos === 1 ? 'ano' : 'anos'} de portas abertas. ${eq ? `${eq === 1 ? 'Uma pessoa trabalha' : `${eq} pessoas trabalham`} lá.` : ''} ${divida ? `O empréstimo da abertura continua: faltam ${fmt(divida.saldo)}.` : ''}`;
    },
    opcoes: [
      { id: 'fechar', texto: c => (presencaDe(negocioAtivo(c.v)!) === 'online' ? 'Tirar a loja do ar' : 'Fechar as portas'), resolver: c => ({ texto: presencaDe(negocioAtivo(c.v)!) === 'online' ? 'Um clique tirou a loja do ar. O último pedido ficou na tela.' : 'A última volta da chave foi a mais pesada.', memoria: null, efeito: () => { const dono = !!donoIntegral(c.v); fecharNegocio(c.v, 'você decidiu fechar'); if (dono) encerrarEmprego(c.v, 'fechou o negócio'); } }) },
      { id: 'nao', texto: 'Ainda não', resolver: () => ({ texto: 'Amanhã a porta abre de novo.', memoria: null }) }
    ]
  },

  /* ================================================== Atleta */
  {
    id: 'esp_renovacao', tipo: 'decisao', idade: [17, 42], tema: 'trabalho', prioritario: true, prioridade: 4, repetir: 1,
    quando: c => deHoje(c, 'esp_renovacao') && c.v.caminhos.esporte?.fase === 'profissional' && ['jogador_futebol', 'atleta'].includes(c.v.trabalho.atual?.ocupacaoId ?? ''),
    titulo: 'O contrato vence',
    texto: c => {
      const es = c.v.caminhos.esporte!;
      return clubeQuer(c) ? `${cap(c.v.trabalho.atual!.empregador)} quer renovar${es.espaco === 'titular' ? ', e com aumento' : ', nas mesmas condições'}. O empresário diz que dá para testar o mercado — e que mercado é mercado.` : `${cap(c.v.trabalho.atual!.empregador)} avisou que não vai renovar. ${idade(c.v) >= 31 ? 'A idade pesou na conversa.' : 'Querem outro perfil no elenco.'}`;
    },
    opcoes: [
      { id: 'renovar', texto: 'Renovar', disponivel: c => (clubeQuer(c) ? true : false),
        resolver: c => ({ texto: 'Mais uma assinatura, mais uma foto com a camisa.', memoria: null, efeito: () => { const es = c.v.caminhos.esporte!; es.contratoAte = c.v.t + (es.espaco === 'titular' ? 36 : 24); const e = c.v.trabalho.atual; if (es.espaco === 'titular' && e) e.salario = Math.round(e.salario * 1.1 / 10) * 10; } }) },
      { id: 'mercado', texto: c => (clubeQuer(c) ? 'Testar o mercado' : 'Procurar outro clube'), comportamento: { coragem: 1 },
        resolver: c => {
          const es = c.v.caminhos.esporte!;
          const h = habilidade(c.v, es.modalidade);
          const chance = clamp((h - 62) / 30, 0.08, 0.75) * (idade(c.v) <= 29 ? 1 : 0.65);
          if (c.r.chance(chance)) {
            const nivel = Math.max(1, Math.min(4, h >= 72 + es.nivel * 2 + 3 ? es.nivel + 1 : es.nivel)) as 1 | 2 | 3 | 4;
            return { texto: nivel > es.nivel ? 'Uma proposta de um clube maior chegou antes do fim do mês.' : 'Um clube do mesmo tamanho ofereceu mais tempo de contrato.', memoria: null, tom: 'bom', efeito: () => { trocarDeClube(c, nivel); } };
          }
          if (clubeQuer(c)) return { texto: 'O mercado não respondeu. O clube renovou — por menos.', memoria: null, tom: 'ruim', efeito: () => { es.contratoAte = c.v.t + 24; const e = c.v.trabalho.atual; if (e) e.salario = Math.round(e.salario * 0.9 / 10) * 10; } };
          return { texto: 'Nenhum clube ligou. O telefone do empresário parou de tocar.', memoria: null, tom: 'ruim', efeito: () => encerrarCarreira(c.v, es, 'sem_contrato') };
        } },
      { id: 'encerrar', texto: 'Encerrar a carreira', resolver: c => ({ texto: 'Você disse ao empresário que era hora.', memoria: null, efeito: () => encerrarCarreira(c.v, c.v.caminhos.esporte!, 'escolha') }) }
    ]
  },
  {
    id: 'esp_treinador', tipo: 'decisao', idade: [16, 42], tema: 'trabalho', manual: true, repetir: 0,
    titulo: 'A conversa com o treinador',
    texto: () => 'Mais uma rodada no banco. Você bateu na porta da sala da comissão técnica.',
    opcoes: [
      { id: 'perguntar', texto: 'Perguntar o que falta para jogar',
        resolver: c => { const es = c.v.caminhos.esporte!; const h = habilidade(c.v, es.modalidade); return { texto: h < 70 + es.nivel * 2 - 4 ? 'A resposta foi dura: ritmo de jogo, força, leitura. Coisa de meses de treino, não de conversa.' : 'Ele disse que você está perto. Que é detalhe. Que é para continuar.', memoria: null, efeito: () => { c.v.fatos['esp_treinador_ok'] = c.v.t; } }; } },
      { id: 'reclamar', texto: 'Reclamar da falta de chances', comportamento: { coragem: 1, impulsividade: 1 },
        resolver: c => { const deu = c.r.chance(0.4); return { texto: deu ? 'No jogo seguinte, seu nome estava entre os titulares.' : 'O treinador não gostou do tom. Nos treinos seguintes, você ficou no time reserva.', memoria: null, tom: deu ? 'bom' : 'ruim', efeito: () => { if (deu) c.v.fatos['esp_treinador_ok'] = c.v.t; else c.v.fatos['esp_treinador_ok'] = c.v.t - 24; } }; } },
      { id: 'treinar', texto: 'Dizer que vai treinar dobrado', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Primeiro a chegar, último a sair. Os preparadores notaram.', memoria: null, efeito: () => { c.v.fatos['esp_treinador_ok'] = c.v.t; c.v.caminhos.esporte!.foco = 'forcar'; } }) }
    ]
  },
  {
    id: 'esp_mercado', tipo: 'decisao', idade: [16, 40], tema: 'trabalho', manual: true, repetir: 0,
    titulo: 'Pedir para sair',
    texto: c => `Você pediu ao empresário para procurar outro clube. ${c.v.caminhos.esporte?.espaco === 'reserva' ? 'Aqui, você é reserva.' : 'Aqui, você é titular — mas quer mais.'}`,
    opcoes: [
      { id: 'menor', texto: 'Ir para um clube menor, para jogar', disponivel: c => ((c.v.caminhos.esporte?.nivel ?? 1) >= 2 ? true : 'Abaixo daqui, só o futebol amador.'),
        resolver: c => ({ texto: 'Estádio menor, gramado pior — e o seu nome na escalação toda semana.', memoria: null, efeito: () => { const es = c.v.caminhos.esporte!; trocarDeClube(c, (es.nivel - 1) as 1 | 2 | 3 | 4); es.espaco = 'titular'; } }) },
      { id: 'maior', texto: 'Esperar uma proposta de um clube maior', comportamento: { coragem: 1 },
        resolver: c => { const es = c.v.caminhos.esporte!; const h = habilidade(c.v, es.modalidade); const deu = es.nivel < 4 && h >= 72 + es.nivel * 2 + 3 && c.r.chance(0.55); return { texto: deu ? 'A proposta veio: um clube maior, contrato de três anos.' : 'Nenhuma proposta melhor chegou. O empresário pediu paciência.', memoria: null, tom: deu ? 'bom' : 'neutro', efeito: () => { if (deu) trocarDeClube(c, (es.nivel + 1) as 1 | 2 | 3 | 4); } }; } },
      { id: 'ficar', texto: 'Desistir e ficar', resolver: () => ({ texto: 'Você ficou. Treino amanhã às oito.', memoria: null }) }
    ]
  },
  {
    id: 'esp_pendurar', tipo: 'decisao', idade: [16, 45], tema: 'trabalho', manual: true, repetir: 0,
    titulo: c => (c.v.caminhos.esporte?.modalidade === 'futebol' ? 'Pendurar as chuteiras' : 'Encerrar a carreira'),
    texto: c => { const es = c.v.caminhos.esporte!; const anos = Math.max(1, Math.round((c.v.t - es.tFase) / 12)); return `${anos} ${anos === 1 ? 'ano' : 'anos'} de profissional, ${es.lesoes} ${es.lesoes === 1 ? 'lesão' : 'lesões'}. ${idade(c.v) < 30 ? 'Há quem jogue muitos anos a mais.' : 'O corpo já avisou.'}`; },
    opcoes: [
      { id: 'encerrar', texto: 'Encerrar agora', resolver: c => ({ texto: 'O último treino foi como os outros. A saída do vestiário, não.', memoria: null, efeito: () => encerrarCarreira(c.v, c.v.caminhos.esporte!, 'escolha') }) },
      { id: 'nao', texto: 'Ainda não', resolver: () => ({ texto: 'Mais uma temporada.', memoria: null }) }
    ]
  },
  {
    id: 'esp_pos', tipo: 'decisao', idade: [22, 45], tema: 'trabalho', manual: true, repetir: 0,
    titulo: 'Depois do esporte',
    texto: () => 'No vestiário, os mais velhos falam de escolinha, de investimento, de voltar a estudar. Os mais novos riem. Você já não ri.',
    opcoes: [
      { id: 'estudar', texto: 'Começar uma faculdade a distância', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Aula gravada no ônibus do time, prova no hotel da concentração.', memoria: 'Começou a se preparar para a vida depois do esporte: voltar a estudar.', relevancia: 'biografia', efeito: () => { marcarFato(c.v, 'pos_carreira'); c.v.fatos['plano_estudar'] = c.v.t; } }) },
      { id: 'treinador', texto: 'Tirar os cursos de treinador', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Licença de treinador, módulo por módulo, nas folgas.', memoria: 'Tirou os cursos de treinador ainda jogando.', relevancia: 'biografia', efeito: () => { marcarFato(c.v, 'pos_carreira'); marcarFato(c.v, 'pos_treinador'); } }) },
      { id: 'guardar', texto: 'Guardar dinheiro para quando parar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Menos carro novo, mais aplicação. O empresário estranhou.', memoria: null, efeito: () => { marcarFato(c.v, 'pos_carreira'); if (c.v.financas.estilo === 'folgado' || c.v.financas.estilo === 'confortavel') c.v.financas.estilo = 'modesto'; } }) },
      { id: 'depois', texto: 'Pensar nisso depois', resolver: () => ({ texto: 'Ainda há tempo. Você acha.', memoria: null }) }
    ]
  },
  {
    id: 'esp_doping', tipo: 'decisao', idade: [20, 36], tema: 'trabalho', repetir: 6,
    peso: c => (c.v.caminhos.esporte?.espaco === 'reserva' || (c.v.caminhos.esporte?.lesoes ?? 0) >= 2 ? 1.2 : 0.5),
    quando: c => c.v.caminhos.esporte?.fase === 'profissional' && !c.v.caminhos.esporte.doping && !c.v.caminhos.esporte.suspensoAte && ['jogador_futebol', 'atleta'].includes(c.v.trabalho.atual?.ocupacaoId ?? ''),
    titulo: 'Uma ajuda',
    texto: () => 'Um preparador de fora do clube chama você num canto: uma "ajuda" para voltar ao ritmo, que — garante — não aparece no exame. Outros já usam, diz. O controle antidoping, diz também, é questão de sorte.',
    opcoes: [
      { id: 'recusar', texto: 'Recusar', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Você disse que não e foi para o treino.', memoria: null }) },
      { id: 'contar', texto: 'Recusar e contar ao médico do clube', comportamento: { coragem: 1 }, resolver: () => ({ texto: 'O médico agradeceu e pediu discrição. O preparador sumiu do centro de treinamento.', memoria: 'Recusou uma substância proibida e contou ao médico do clube.', relevancia: 'biografia' }) },
      { id: 'aceitar', texto: 'Aceitar', comportamento: { impulsividade: 2 },
        resolver: c => ({ texto: 'Nas semanas seguintes, o corpo respondeu como não respondia havia anos. O medo de cada sorteio do exame também.', memoria: 'Aceitou usar uma substância proibida.', relevancia: 'marco', tom: 'ruim', efeito: () => { c.v.caminhos.esporte!.doping = c.v.t; } }) }
    ]
  },
  {
    id: 'esp_proposta', tipo: 'decisao', idade: [18, 34], tema: 'trabalho', repetir: 3, peso: 2,
    quando: c => { const es = c.v.caminhos.esporte; if (!es || es.fase !== 'profissional' || es.espaco !== 'titular' || es.nivel >= 4) return false; return habilidade(c.v, es.modalidade) >= 72 + es.nivel * 2 + 3 && ['jogador_futebol', 'atleta'].includes(c.v.trabalho.atual?.ocupacaoId ?? ''); },
    titulo: 'Uma proposta',
    texto: c => { const es = c.v.caminhos.esporte!; const alvo = clubeProposto(c); const d = municipio(alvo.cidade); return `${es.modalidade === 'futebol' ? `${oClube(alvo.nome).charAt(0).toUpperCase() + oClube(alvo.nome).slice(1)}, de ${d.nome},` : 'Uma equipe maior'} quer você: divisão acima, contrato de três anos, salário maior.${d.id !== c.v.moradia.municipioId ? ` A mudança seria para ${d.nome}.` : ''} ${comFamilia(c.v) ? 'A família iria junto — ou não.' : ''}`; },
    opcoes: [
      { id: 'aceitar', texto: c => (comFamilia(c.v) ? 'Aceitar e ir com a família' : 'Aceitar'), consequencia: c => (clubeProposto(c).cidade !== c.v.moradia.municipioId ? `Mudança para ${municipio(clubeProposto(c).cidade).nome}: quem mora com você vai junto.` : undefined),
        resolver: c => ({ texto: 'Apresentação no estádio novo, camisa nova, cidade nova.', memoria: null, tom: 'bom', efeito: () => { const es = c.v.caminhos.esporte!; trocarDeClube(c, (es.nivel + 1) as 1 | 2 | 3 | 4); } }) },
      { id: 'ficar', texto: 'Ficar onde está', comportamento: { familia: 1 }, disponivel: c => (comFamilia(c.v) ? true : false),
        resolver: () => ({ texto: 'Você ficou. A família também.', memoria: 'Recusou uma proposta de um clube maior para não tirar a família do lugar.', relevancia: 'biografia' }) },
      { id: 'recusar', texto: 'Recusar', disponivel: c => (comFamilia(c.v) ? false : true), resolver: () => ({ texto: 'Você ficou no clube que conhece o seu jogo.', memoria: null }) }
    ]
  },

  /* ================================================== Farda, serviço público */
  {
    id: 'mil_movimentacao', tipo: 'decisao', idade: [18, 62], tema: 'lugar', manual: true, repetir: 0,
    titulo: 'Pedir movimentação',
    texto: c => { const d = MUNIC_POR_INDICE(c.v.fatos['mil_pedido_alvo'] ?? -1); return `O pedido vai para o setor de pessoal, com o motivo por escrito. ${d ? `A unidade mais perto de quem importa fica em ${municipio(d).nome}.` : ''} Pedido não é ordem: pode sair, pode não sair.`; },
    opcoes: [
      { id: 'pedir', texto: c => { const d = MUNIC_POR_INDICE(c.v.fatos['mil_pedido_alvo'] ?? -1); return d ? `Pedir ${municipio(d).nome}` : 'Pedir'; }, comportamento: { familia: 1 },
        resolver: c => ({ texto: 'O pedido foi protocolado. Agora, é esperar o boletim.', memoria: null, efeito: () => { c.v.fatos['mil_pedido_destino'] = c.v.fatos['mil_pedido_alvo']; } }) },
      { id: 'nao', texto: 'Deixar como está', resolver: () => ({ texto: 'Você guardou o formulário.', memoria: null }) }
    ]
  },
  {
    id: 'pub_remocao', tipo: 'decisao', idade: [20, 70], tema: 'lugar', manual: true, repetir: 0,
    titulo: 'Pedir remoção',
    texto: c => { const d = destinoDaRemocao(c.v); return `Abriu o edital de remoção. Dá para pedir ${d ? municipio(d).nome : 'outra cidade'}${d && familiaEm(c.v, d) ? `, onde mora ${familiaEm(c.v, d)}` : ''}. Quem tem mais tempo de casa passa na frente.`; },
    opcoes: [
      { id: 'pedir', texto: c => { const d = destinoDaRemocao(c.v); return d ? `Pedir remoção para ${municipio(d).nome}` : 'Pedir remoção'; },
        disponivel: c => (destinoDaRemocao(c.v) ? true : 'Não há vaga para onde ir.'),
        resolver: c => {
          const e = emprego(c);
          const anos = (c.v.t - e.tInicio) / 12;
          const deu = c.r.chance(clamp(0.3 + anos * 0.04, 0.3, 0.8));
          if (!deu) return { texto: 'Saiu a lista: o seu nome não estava. No próximo edital, com mais tempo de casa, sobe.', memoria: null, tom: 'ruim', efeito: () => { c.v.fatos['remocao_negada'] = c.v.t; } };
          return { texto: 'Saiu a lista, e o seu nome estava lá.', memoria: null, tom: 'bom', efeito: () => { const d = destinoDaRemocao(c.v)!; mudarComOTrabalho(c, d, true, `removid${c.g('o', 'a', 'e')} a pedido`); } };
        } },
      { id: 'nao', texto: 'Ficar onde está', resolver: () => ({ texto: 'Você fechou o edital.', memoria: null }) }
    ]
  },

  /* ================================================== Campo e arte */
  {
    id: 'rural_sucessao', tipo: 'decisao', idade: [50, 95], tema: 'familia', manual: true, repetir: 0,
    titulo: 'A terra adiante',
    texto: c => { const ru = c.v.caminhos.rural!; const anos = Math.max(1, Math.round((c.v.t - ru.tInicio) / 12)); return `${anos} anos de terra. ${c.p.filho ? `${c.p.filho.nome} diz que toparia continuar — do jeito ${c.p.filho.genero === 'feminino' ? 'dela' : 'dele'}.` : 'Nenhum filho quer a lida.'}`; },
    opcoes: [
      { id: 'filho', texto: c => (c.p.filho ? `Passar a lida para ${c.p.filho.nome}` : 'Passar a lida'), comportamento: { familia: 1 }, disponivel: c => (c.p.filho ? true : false),
        resolver: c => ({ texto: 'Você mostrou onde a água desce quando chove forte. O resto, a terra ensina.', memoria: `Passou a lida da terra para ${c.p.filho.nome}.`, relevancia: 'marco', efeito: () => { const f = c.p.filho; f.ocupacao = f.genero === 'feminino' ? 'produtora rural' : 'produtor rural'; f.renda = Math.max(f.renda, 2800); lembrarCom(c.v, f.id, 'Recebeu a lida da terra.', 'trabalho', 3); pararDeProduzir(c); } }) },
      { id: 'arrendar', texto: 'Arrendar a terra e parar', disponivel: c => (c.v.financas.bens.some(b => b.tipo === 'imovel' && b.modeloId === 'sitio' && !b.alugadoPor) ? true : 'A terra não é sua para arrendar.'),
        resolver: c => ({ texto: 'Um vizinho arrendou. O cheque vem todo ano, depois da colheita dele.', memoria: 'Arrendou a própria terra e parou de produzir.', relevancia: 'marco', efeito: () => { const s = c.v.financas.bens.find(b => b.tipo === 'imovel' && b.modeloId === 'sitio'); if (s && s.tipo === 'imovel') s.alugadoPor = Math.round(arrendamentoMensal(c.v) * 1.2); pararDeProduzir(c); } }) },
      { id: 'seguir', texto: 'Seguir mais um tempo', resolver: () => ({ texto: 'Amanhã é dia de acordar antes do sol.', memoria: null }) }
    ]
  },
  {
    id: 'arte_estrada', tipo: 'decisao', idade: [16, 75], tema: 'trabalho', manual: true, repetir: 0,
    titulo: 'A estrada',
    texto: c => `Um produtor montou uma turnê: vinte cidades em dois meses, van, hotel barato, cachê que depende da bilheteria. ${comFamilia(c.v) ? 'Em casa, dois meses é muito tempo.' : ''}`,
    opcoes: [
      { id: 'ir', texto: 'Ir',
        resolver: c => { const deu = c.r.chance(0.55 + publicoDe(c.v) / 250); return { texto: deu ? 'Casas cheias em metade das cidades. Voltou com dinheiro e gente nova seguindo o trabalho.' : 'Metade das datas com meia casa. Voltou devendo a gasolina — e com um público pequeno, mas fiel.', memoria: null, tom: deu ? 'bom' : 'ruim', efeito: () => estrada(c, deu, 1) }; } },
      { id: 'fins', texto: 'Só os fins de semana',
        resolver: c => ({ texto: 'Sextas na estrada, domingos em casa. Metade da turnê, metade do cansaço.', memoria: null, efeito: () => estrada(c, c.r.chance(0.6), 0.5) }) },
      { id: 'ficar', texto: 'Ficar', resolver: () => ({ texto: 'A van saiu sem você.', memoria: null }) }
    ]
  }
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function motivoModo(c: Ctx, modo: 'guardado' | 'pequeno' | 'emprestimo'): true | string {
  const t = NEGOCIOS[c.v.fatos['abrir_tipo'] ?? 0];
  const m = modosDeAbrir(c.v, t.id).find(x => x.modo === modo);
  if (!m) return 'Não se aplica.';
  return m.motivo ?? true;
}

function abrirCom(c: Ctx, modo: 'guardado' | 'pequeno' | 'emprestimo'): { texto: string; memoria: null; efeito: () => void } {
  const t = NEGOCIOS[c.v.fatos['abrir_tipo'] ?? 0];
  const novo = { tipo: 'negocio' as const, negocioId: t.id, modo };
  // Quando o negócio não cabe no resto da vida (um emprego, a faculdade do dia inteiro), a próxima pergunta é essa.
  const conflito = analisarEntrada(c.v, novo).length > 0;
  const texto = conflito ? 'O dinheiro está resolvido. Falta resolver o resto da vida.'
    : modo === 'pequeno' ? (t.presenca === 'online' ? 'Um canto da casa virou estoque; o celular, a vitrine.' : 'Um canto da casa virou ponto. A placa foi feita à mão.')
      : modo === 'emprestimo' ? 'O gerente do banco carimbou tudo. A dívida começou antes do primeiro cliente.'
        : t.presenca === 'online' ? 'Você comprou o primeiro estoque e publicou a loja numa sexta-feira.' : t.presenca === 'obra' ? 'Ferramenta nova, cartão impresso, CNPJ na mão.' : t.presenca === 'atendimento' ? 'Sala alugada, placa na porta, agenda aberta.' : 'Você assinou o aluguel do ponto numa sexta-feira.';
  return { texto, memoria: null, efeito: () => { propor(c.v, c.r, novo); } };
}

function aporteDoSocio(c: Ctx): number {
  const n = negocioAtivo(c.v)!;
  return Math.round(n.capital * 0.6 / 1000) * 1000;
}

function textoDaVenda(c: Ctx): string {
  const n = negocioAtivo(c.v)!;
  const valor = valorDoNegocio(c.v, n);
  const socio = n.socioId && c.v.pessoas[n.socioId] ? ` A outra parte (${Math.round(parteDoSocio(n) * 100)}%) é de ${c.v.pessoas[n.socioId].nome}, que vende junto.` : '';
  return `A oferta pela sua parte de ${n.nome}: ${fmt(valor)}${(n.caixa ?? 0) > 0 ? `, e o que há no caixa fica com você` : ''}. ${tamanhoDaEquipe(n) ? 'A equipe fica com o novo dono.' : ''}${socio}`;
}

/** O clube quer renovar? Depende do que se joga, da idade e do espaço no time. */
function clubeQuer(c: Ctx): boolean {
  const es = c.v.caminhos.esporte!;
  const h = habilidade(c.v, es.modalidade);
  const i = idade(c.v);
  const voltouDeSuspensao = c.v.fatos['suspenso_doping'] !== undefined && c.v.t - c.v.fatos['suspenso_doping'] < 60;
  return h >= (voltouDeSuspensao ? 74 : 68) + (es.nivel - 1) * 2 && i <= (es.modalidade === 'futebol' ? 33 : 31);
}

const SALARIO_FUTEBOL = [0, 1800, 4800, 16000, 55000];
const SALARIO_OUTROS = [0, 1500, 3500, 8500, 22000];

/** Troca de clube (real, na simulação); se o clube novo é de outra cidade, a vida vai junto. */
function trocarDeClube(c: Ctx, nivel: 1 | 2 | 3 | 4, juntos = true): void {
  const es = c.v.caminhos.esporte!;
  const e = c.v.trabalho.atual;
  if (!e) return;
  const tabela = es.modalidade === 'futebol' ? SALARIO_FUTEBOL : SALARIO_OUTROS;
  const subiu = nivel > es.nivel;
  const novo = mudarDeClube(c.v, es, nivel);
  e.salario = tabela[nivel];
  es.contratoAte = c.v.t + (subiu ? 36 : 24);
  es.espaco = subiu ? 'reserva' : es.espaco;
  const cidade = CLUBES.find(x => x.nome === novo)?.cidade;
  const texto = subiu ? `Transferiu-se para ${oClube(novo)}.` : `Mudou de clube: ${oClube(novo)}.`;
  escrever(c.v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: subiu ? 'bom' : undefined, escolha: true });
  marcar(c.v, subiu ? 'promocao' : 'mudanca_carreira', texto, subiu && nivel >= 3 ? 3 : 2, { dominio: es.modalidade });
  if (cidade && cidade !== c.v.moradia.municipioId) mudarComOTrabalho(c, cidade, juntos, `para jogar ${noClube(novo)}`);
}

/** Para onde um servidor pode pedir remoção: perto da família, e só se o órgão tem onde pôr. */
export function destinoDaRemocao(v: Vida): string | undefined {
  const e = v.trabalho.atual;
  if (!e || e.contrato !== 'servidor') return undefined;
  if (e.empregador === 'a prefeitura' || /municipal/.test(e.empregador)) return undefined;
  const federal = /Receita|federal|Rodoviária Federal|Tribunal|banco público/.test(e.empregador);
  const uf = municipio(v.moradia.municipioId).uf;
  const aqui = v.moradia.municipioId;
  const pode = (id: string) => id !== aqui && (federal || municipio(id).uf === uf) && (!!municipio(id).capital || municipio(id).perfil !== 'pequena');
  const perto = [parceiro(v)?.p, ...filhos(v), ...Object.values(v.pessoas).filter(p => ['mae', 'pai'].includes(v.vinculos[p.id]?.parentesco ?? ''))].filter((p): p is Pessoa => !!p && p.vivo && pode(p.municipioId));
  if (perto.length) return perto[0].municipioId;
  const capital = MUNICIPIOS.find(m => m.uf === uf && m.capital)?.id;
  if (capital && pode(capital)) return capital;
  // Já na capital: a outra cidade grande do estado (ou, no federal, a capital vizinha).
  return MUNICIPIOS.find(m => pode(m.id) && m.uf === uf)?.id ?? (federal ? MUNICIPIOS.find(m => pode(m.id) && m.regiao === municipio(aqui).regiao && m.capital)?.id : undefined);
}

/** O clube que faz a proposta (estável entre abrir e resolver a decisão). */
function clubeProposto(c: Ctx) {
  const es = c.v.caminhos.esporte!;
  return clubeDoNivel(Math.min(4, es.nivel + 1), ((anoDe(c.v.t) * 37 + c.v.id.length * 11) % 997) / 997, es.clube);
}

function familiaEm(v: Vida, id: string): string | undefined {
  const nomes = Object.values(v.pessoas).filter(p => p.vivo && p.municipioId === id && v.vinculos[p.id]?.parentesco && !p.especie).map(p => p.nome);
  return nomes.length ? listaNatural(nomes.slice(0, 2)) : undefined;
}

function pararDeProduzir(c: Ctx): void {
  if (podeAposentar(c.v).grau === 'permitido') aposentar(c.v);
  else encerrarEmprego(c.v, 'passou a terra adiante');
  if (c.v.caminhos.rural) c.v.fatos['rural_fim'] = c.v.t;
}

const publicoDe = (v: Vida) => v.caminhos.arte?.ativo ? v.caminhos.arte.publico : (v.trabalho.atual?.clientela ?? 20);

function estrada(c: Ctx, deu: boolean, peso: number): void {
  const v = c.v;
  const custo = economiaLocal(v.moradia.municipioId).custo;
  const valor = Math.round((deu ? 6000 + publicoDe(v) * 120 : -2500) * peso * custo / 100) * 100;
  v.financas.conta += valor;
  if (v.caminhos.arte?.ativo) v.caminhos.arte.publico = clamp(v.caminhos.arte.publico + (deu ? 12 : 5) * peso);
  const e = v.trabalho.atual;
  if (e?.clientela !== undefined) e.clientela = clamp(e.clientela + (deu ? 8 : 3) * peso);
  v.mente.estresse = clamp(v.mente.estresse + 6 * peso);
  const par = parceiro(v);
  if (par && par.vin.convivio.includes('casa')) par.vin.tensao = clamp(par.vin.tensao + 6 * peso);
  for (const f of pequenosEmCasa(v)) { const vin = v.vinculos[f.id]; vin.presenca = clamp((vin.presenca ?? 50) - 4 * peso); }
  const texto = deu ? `Caiu na estrada numa turnê${peso < 1 ? ' de fins de semana' : ''}: casas cheias, ${fmt(valor)} no bolso.` : `Caiu na estrada numa turnê${peso < 1 ? ' de fins de semana' : ''} que não pagou as contas.`;
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: deu ? 'bom' : 'ruim', escolha: true });
  if (deu) marcar(v, 'conquista', texto, 2);
  abalar(v, deu ? 'a turnê que deu certo' : 'a turnê que não pagou', deu ? 4 : -3, 3);
}

/** Aliviar o ritmo por força do corpo (fora do limite de uma mudança por ano). */
function aliviarRitmo(v: Vida, alvo: 'normal' | 'leve'): void {
  const e = v.trabalho.atual;
  if (!e) return;
  const antes = ritmoDe(e);
  if (e.clientela === undefined) e.salario = Math.round(e.salario / fatorRitmoSalario(antes) * fatorRitmoSalario(alvo) / 10) * 10;
  else if (!donoIntegral(v)) e.salario = Math.round(e.salario / fatorRitmoClientela(antes) * fatorRitmoClientela(alvo) / 10) * 10;
  e.ritmo = alvo === 'normal' ? undefined : alvo;
  e.anosPuxado = 0;
}

/** O que muda ao trocar o jeito de vender, dito na hora, no idioma do negócio. */
function textoDaEstrategia(c: Ctx, id: EstrategiaNegocio): string {
  const n = negocioAtivo(c.v)!;
  const p = presencaDe(n);
  const t: Record<string, string> = {
    'rua:bairro': 'Você voltou ao que o bairro conhece.',
    'rua:qualidade': 'Material melhor, atendimento mais caprichado, preço acima. A fama vem devagar.',
    'rua:preco': 'A placa de promoção foi para a porta. Entra mais gente; cada venda deixa menos.',
    'rua:online': n.tipo === 'lanchonete' ? 'Fotos, aplicativo de entrega, mensagem respondida de madrugada.' : 'Fotos, catálogo nas redes, entrega combinada por mensagem.',
    'rua:escala': 'Contrato com empresas: volume certo, preço apertado, prazo cobrado.',
    'online:escala': 'Loja aberta nas grandes plataformas: pedido não falta; a taxa come a margem.',
    'online:marca': 'Site próprio, redes cuidadas, cliente que chega pelo nome. Devagar — e a margem é sua.',
    'online:qualidade': 'Catálogo enxuto, produto escolhido a dedo, foto bem feita. Menos venda, mais cliente fiel.',
    'online:preco': 'O menor preço da categoria: sai muito, sobra pouco em cada pedido.',
    'atendimento:bairro': 'De volta à indicação: quem foi bem atendido traz o próximo.',
    'atendimento:qualidade': 'Menos gente na agenda, mais tempo com cada um — e um valor que acompanha.',
    'atendimento:preco': 'Preço popular: a agenda enche, cada horário rende menos.',
    'atendimento:escala': p === 'atendimento' && ['consultorio_psicologia', 'clinica_fisio', 'clinica_vet'].includes(n.tipo) ? 'Credenciado nos convênios: agenda cheia, valor menor, pagamento que atrasa.' : 'Uma carteira de empresas: contrato, volume, margem apertada.',
    'atendimento:online': 'Atendimento também on-line: gente de outras cidades na agenda.',
    'obra:bairro': 'De volta à indicação: obra bem feita traz a próxima.',
    'obra:qualidade': 'Acabamento de primeira: obra mais cara, mais demorada, cliente que indica.',
    'obra:preco': 'O orçamento mais baixo da praça: mais obra, menos folga.',
    'obra:escala': 'Empreitadas para construtoras: volume garantido, preço apertado, prazo de ferro.'
  };
  return t[`${p}:${id}`] ?? 'Você mudou o jeito de vender. O resultado leva tempo.';
}

void ocupacaoOuNula; void analisarEntrada; void precoDaParteDoSocio; void comprarParteDoSocio;
