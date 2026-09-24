/** Vida adulta (18–59). */

import type { Conteudo, Ctx } from './base';
import * as P from './papeis';
import { dinheiro, envolvimento, estresse, fato, feliz, gp, prox, saude, tensao } from './efeitos';
import { idadePessoa, temFato, marcarFato, lembrarCom } from '../nucleo';
import { economiaLocal, municipio, MUNICIPIOS } from '../dados/lugares';
import { nomeOcupacaoId, contratar, encerrarEmprego } from '../sistemas/trabalho';
import { ocupacao, OCUPACOES } from '../dados/ocupacoes';
import { mudarAgora } from '../sistemas/processos';
import { criarPessoa, vincular } from '../pessoas';
import { anoDe } from '../tempo';

const temCarro = (c: Ctx) => c.v.financas.bens.some(b => b.tipo === 'veiculo' && b.modeloId.startsWith('carro'));
const temImovel = (c: Ctx) => c.v.financas.bens.some(b => b.tipo === 'imovel');
const empregado = (c: Ctx) => !!c.v.trabalho.atual && c.v.trabalho.atual.contrato !== 'informal';
const mora = (c: Ctx) => municipio(c.v.moradia.municipioId);

export const ADULTO: Conteudo[] = [
  /* ============================================================ TRABALHO */
  {
    id: 'adu_chefe_novo', tipo: 'acontecimento', idade: [19, 64], tema: 'trabalho', repetir: 6,
    quando: empregado,
    narrar: c => {
      const bom = c.r.chance(0.5);
      const e = c.v.trabalho.atual!;
      const chefe = criarPessoa(c.v, c.r, { idade: c.r.int(Math.max(28, c.idade - 5), Math.min(62, c.idade + 18)), municipioId: c.v.moradia.municipioId });
      chefe.ocupacao = chefe.genero === 'feminino' ? 'gestora' : 'gestor';
      chefe.renda = Math.round(e.salario * 1.8);
      const vin = vincular(c.v, chefe, { origem: 'trabalho', proximidade: bom ? 30 : 12, convivio: ['trabalho'], estagio: 'colega' });
      vin.ambiente = `trabalho:${e.empregador}:${e.tInicio}`;
      if (!bom) vin.tensao = 25;
      const jeito = bom
        ? c.r.pick(['passou a elogiar em público e cobrar em particular', 'chegou ouvindo todo mundo antes de mudar qualquer coisa', 'brigou pela equipe na primeira reunião com a diretoria'])
        : c.r.pick(['chegou mudando tudo e desconfiando de todo mundo', 'começou a mandar mensagem às dez da noite', 'passou a controlar o horário de almoço no relógio']);
      return {
        texto: `${chefe.nome} assumiu a chefia do setor e ${jeito}.`,
        relevancia: 'cotidiano', efeito: () => { e.desempenho += bom ? 5 : -5; estresse(c, bom ? -2 : 6); }
      };
    }
  },
  {
    id: 'adu_colega_demitido', tipo: 'decisao', idade: [19, 64], tema: 'trabalho', repetir: 6,
    papeis: { colega: P.genteDe('trabalho') },
    titulo: 'Corte',
    texto: c => `${c.p.colega.nome} foi demitid${gp(c, 'colega', 'o', 'a')} no corte de fim de ano. ${gp(c, 'colega', 'Ele', 'Ela')} tem dois filhos e mandou mensagem perguntando se você sabe de alguma vaga.`,
    opcoes: [
      { id: 'indicar', texto: 'Mandar o currículo para conhecidos', comportamento: { generosidade: 1, empatia: 1 },
        resolver: c => ({ texto: c.r.chance(0.4) ? `Um conhecido chamou ${c.p.colega.nome} para uma entrevista. Deu certo.` : 'Você mandou para todo mundo que conhecia. Ninguém respondeu, mas a mensagem foi agradecida.', memoria: `Ajudou ${c.p.colega.nome} a procurar emprego depois de uma demissão.`, efeito: () => prox(c, 'colega', 15), lembrar: ['colega', 'Você ajudou a procurar emprego depois da demissão.'] }) },
      { id: 'consolar', texto: 'Mandar uma mensagem de força', resolver: c => ({ texto: `${c.p.colega.nome} agradeceu com um emoji.`, memoria: null, efeito: () => prox(c, 'colega', 3) }) },
      { id: 'nada', texto: 'Não responder', resolver: c => ({ texto: 'A mensagem ficou sem resposta.', memoria: null, efeito: () => prox(c, 'colega', -8) }) }
    ]
  },
  {
    id: 'adu_proposta_outra_cidade', tipo: 'decisao', idade: [22, 55], tema: 'trabalho', repetir: 8,
    quando: c => empregado(c) && c.v.trabalho.atual!.contrato !== 'servidor' && ocupacao(c.v.trabalho.atual!.ocupacaoId).nivel >= 2,
    titulo: 'A proposta',
    texto: c => {
      const destino = destinoDaProposta(c);
      return `Uma empresa de ${destino.nome} ofereceu um cargo melhor, com salário uns 30% maior. Seria preciso mudar de cidade em poucos meses${P.conjuge(c.v)[0] ? ` — e convencer ${P.conjuge(c.v)[0].nome}` : ''}.`;
    },
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar e se mudar', comportamento: { coragem: 1, independencia: 1 },
        disponivel: c => (P.conjuge(c.v)[0] && c.v.vinculos[P.conjuge(c.v)[0].id].romance!.envolvimento < 50 ? 'Seu relacionamento não sobreviveria a essa mudança agora.' : true),
        resolver: c => {
          const destino = destinoDaProposta(c);
          return {
            texto: `Caixas, despedidas, um caminhão de mudança. Recomeço em ${destino.nome}.`,
            memoria: null,
            efeito: () => {
              const e = c.v.trabalho.atual!;
              const oc = ocupacao(e.ocupacaoId);
              const prox = OCUPACOES.find(x => x.trilha === oc.trilha && x.nivel === oc.nivel + 1) ?? oc;
              const salario = Math.round(e.salario * 1.3 * economiaLocal(destino.id).salario / economiaLocal(c.v.moradia.municipioId).salario / 10) * 10;
              marcarFato(c.v, 'mudou_por_trabalho');
              encerrarEmprego(c.v, 'mudança de cidade');
              mudarAgora(c.v, destino.id, 'por causa de uma proposta de trabalho');
              const novo = contratar(c.v, c.r, prox);
              novo.salario = Math.max(salario, novo.salario);
              for (const par of P.conjuge(c.v)) { const vin = c.v.vinculos[par.id]; vin.tensao += 10; }
            }
          };
        } },
      { id: 'recusar', texto: 'Ficar onde está', comportamento: { familia: 1 }, resolver: () => ({ texto: 'Você agradeceu e recusou. A vida seguiu no mesmo endereço.', memoria: null }) },
      { id: 'negociar', texto: 'Usar a proposta para pedir aumento', comportamento: { coragem: 1 },
        resolver: c => c.r.chance(0.45)
          ? { texto: 'A empresa cobriu parte da oferta para você ficar.', memoria: 'Usou uma proposta de fora para conseguir um aumento.', efeito: () => { c.v.trabalho.atual!.salario = Math.round(c.v.trabalho.atual!.salario * 1.12 / 10) * 10; } }
          : { texto: 'Disseram que não iam cobrir. O clima azedou.', memoria: null, efeito: () => { c.v.trabalho.atual!.desempenho -= 8; } } }
    ]
  },
  {
    id: 'adu_burnout', tipo: 'decisao', idade: [22, 64], tema: 'trabalho', repetir: 5,
    quando: c => empregado(c) && c.v.mente.estresse >= 70,
    titulo: 'Domingo à noite',
    texto: c => `Faz meses que o domingo à noite dá aperto no peito. Você esquece coisas simples e acorda ${c.g('cansado', 'cansada')}.`,
    opcoes: [
      { id: 'medico', texto: 'Procurar um médico e pedir afastamento', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'O médico deu quinze dias de atestado e encaminhou para terapia.', memoria: 'Foi afastad' + c.g('o', 'a', 'e') + ' do trabalho por esgotamento.', efeito: () => { estresse(c, -30); if (c.v.trabalho.atual) c.v.trabalho.atual.desempenho -= 5; } }) },
      { id: 'aguentar', texto: 'Aguentar firme', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você aguentou. O corpo começou a cobrar.', memoria: null, efeito: () => { saude(c, -6); estresse(c, 5); } }) },
      { id: 'pedir_conta', texto: 'Pedir demissão', comportamento: { impulsividade: 1, independencia: 1 },
        resolver: c => ({ texto: 'Você entregou a carta na segunda de manhã. O alívio veio antes do medo.', memoria: 'Pediu demissão, no limite do esgotamento.', relevancia: 'marco', efeito: () => { encerrarEmprego(c.v, 'pediu demissão'); estresse(c, -35); } }) }
    ]
  },
  {
    id: 'adu_empresa_fecha', tipo: 'acontecimento', idade: [18, 64], tema: 'trabalho', repetir: 15,
    quando: c => !!c.v.trabalho.atual && ['clt'].includes(c.v.trabalho.atual.contrato) && c.r.chance(0.3),
    narrar: c => ({
      texto: `${c.v.trabalho.atual!.empregador.charAt(0).toUpperCase()}${c.v.trabalho.atual!.empregador.slice(1)} fechou as portas. A notícia veio por e-mail numa sexta-feira.`,
      relevancia: 'marco', tom: 'ruim',
      efeito: () => { const s = c.v.trabalho.atual!.salario; encerrarEmprego(c.v, 'empresa fechou'); dinheiro(c, s * 3); estresse(c, 12); }
    })
  },
  {
    id: 'adu_festa_firma', tipo: 'decisao', idade: [20, 64], tema: 'trabalho', repetir: 4,
    papeis: { colega: P.genteDe('trabalho') },
    quando: empregado,
    titulo: 'Confraternização',
    texto: c => `Festa de fim de ano da firma, open bar. ${c.p.colega.nome} já bebeu demais e está falando mal da diretoria em voz alta, perto do diretor.`,
    opcoes: [
      { id: 'tirar', texto: c => `Tirar ${c.p.colega.nome} dali com uma desculpa`, comportamento: { empatia: 1 },
        resolver: c => ({ texto: `Você levou ${c.p.colega.nome} para fora "para tomar um ar". Na segunda, ${gp(c, 'colega', 'ele', 'ela')} agradeceu, morto de vergonha.`.replace('morto', gp(c, 'colega', 'morto', 'morta')), memoria: null, efeito: () => prox(c, 'colega', 12) }) },
      { id: 'rir', texto: 'Rir junto', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: 'O diretor olhou para os dois. Ninguém comentou nada depois — o que foi pior.', memoria: null, efeito: () => { if (c.v.trabalho.atual) c.v.trabalho.atual.desempenho -= 4; prox(c, 'colega', 5); } }) },
      { id: 'sair', texto: 'Ir para o outro lado do salão', resolver: () => ({ texto: 'Você foi buscar mais um salgadinho.', memoria: null }) }
    ]
  },
  {
    id: 'adu_concurso_aberto', tipo: 'acontecimento', idade: [18, 50], tema: 'trabalho', repetir: 4,
    quando: c => !temFato(c.v, 'aviso_concurso') || c.r.chance(0.3),
    narrar: c => ({ texto: `Saiu o edital de um concurso ${c.r.pick(['da prefeitura', 'do Tribunal Regional', 'de um banco público', 'da rede estadual de ensino'])}. Os grupos de estudo lotaram.`, relevancia: 'cotidiano', efeito: () => fato(c, 'aviso_concurso') })
  },

  /* ============================================================= DINHEIRO */
  {
    id: 'adu_golpe_pix', tipo: 'decisao', idade: [18, 90], tema: 'dinheiro', repetir: 6,
    quando: c => c.v.financas.conta > 800,
    titulo: 'Mensagem do banco',
    texto: () => 'Chega um SMS "do seu banco": compra suspeita de R$ 2.890 aprovada. Um número para ligar e cancelar. Do outro lado, uma voz educada pede um código que chegou no seu celular.',
    opcoes: [
      { id: 'passar', texto: 'Passar o código para cancelar logo', comportamento: { impulsividade: 1 },
        resolver: c => { const perda = Math.min(c.v.financas.conta, c.r.int(1500, 6000)); return { texto: `Em dez minutos, ${perda.toLocaleString('pt-BR')} reais saíram por Pix para uma conta desconhecida. O banco disse que não podia fazer nada.`, memoria: `Caiu no golpe do falso atendente e perdeu R$ ${perda.toLocaleString('pt-BR')}.`, tom: 'ruim', efeito: () => { dinheiro(c, -perda); estresse(c, 10); } }; } },
      { id: 'desligar', texto: 'Desligar e ligar para o número do cartão', comportamento: { disciplina: 1 },
        resolver: () => ({ texto: 'No número oficial, confirmaram: não havia compra nenhuma. Era golpe.', memoria: null }) }
    ]
  },
  {
    id: 'adu_amigo_emprestimo', tipo: 'decisao', idade: [18, 80], tema: 'amizade', repetir: 6,
    papeis: { amigo: P.amigo },
    quando: c => c.v.financas.conta > 3000,
    titulo: c => `${c.p.amigo.nome} precisa de dinheiro`,
    texto: c => `${c.p.amigo.nome} liga constrangid${gp(c, 'amigo', 'o', 'a')}: o aluguel atrasou e o dono ameaçou despejo. Precisa de R$ 3.000 e jura que devolve em três meses.`,
    opcoes: [
      { id: 'emprestar', texto: 'Emprestar', comportamento: { generosidade: 2 },
        resolver: c => {
          const devolve = c.r.chance(0.55);
          return { texto: devolve ? `${c.p.amigo.nome} devolveu tudo, com atraso de dois meses e uma garrafa de vinho.` : `Os três meses viraram um ano. O assunto ficou pesado entre vocês.`, memoria: `Emprestou três mil reais para ${c.p.amigo.nome}${devolve ? '' : ', que nunca devolveu'}.`, efeito: () => { if (!devolve) { dinheiro(c, -3000); tensao(c, 'amigo', 30); } else prox(c, 'amigo', 10); } };
        } },
      { id: 'parte', texto: 'Dar uma parte, sem cobrar', comportamento: { generosidade: 1 },
        resolver: c => ({ texto: `Você mandou mil reais e disse que não precisava devolver.`, memoria: null, efeito: () => { dinheiro(c, -1000); prox(c, 'amigo', 8); } }) },
      { id: 'negar', texto: 'Dizer que não pode', resolver: c => ({ texto: `${c.p.amigo.nome} disse que entendia.`, memoria: null, efeito: () => prox(c, 'amigo', -6) }) }
    ]
  },
  {
    id: 'adu_carro_quebra', tipo: 'acontecimento', idade: [18, 85], tema: 'dinheiro', repetir: 4,
    quando: c => temCarro(c) && c.v.financas.bens.some(b => b.tipo === 'veiculo' && b.modeloId.startsWith('carro') && b.estado < 70),
    narrar: c => {
      const carro = c.v.financas.bens.find(b => b.tipo === 'veiculo' && b.modeloId.startsWith('carro'))!;
      const grave = carro.estado < 40;
      const custo = grave ? c.r.int(2500, 6000) : c.r.int(800, 2200);
      const peca = c.r.pick(['a embreagem', 'a suspensão', 'o radiador', 'a bomba de combustível', 'os freios']);
      const texto = c.vezes === 0
        ? grave ? `O ${carro.nome} deixou você na mão no meio da avenida. O mecânico falou em motor: R$ ${custo.toLocaleString('pt-BR')}.` : `O ${carro.nome} foi para a oficina trocar ${peca}: R$ ${custo.toLocaleString('pt-BR')}.`
        : grave
          ? c.r.pick([`De novo na oficina, e desta vez era o motor. O ${carro.nome} já não era o mesmo.`, `O ${carro.nome} ferveu na estrada e voltou de guincho.`, `O mecânico já chamava você pelo nome. Mais R$ ${custo.toLocaleString('pt-BR')} no ${carro.nome}.`])
          : `Mais uma ida à oficina: ${peca}, R$ ${custo.toLocaleString('pt-BR')}.`;
      return { texto, relevancia: 'cotidiano', tom: 'ruim', efeito: () => { dinheiro(c, -custo); carro.estado = Math.min(100, carro.estado + 30); } };
    }
  },
  {
    id: 'adu_acidente_transito', tipo: 'acontecimento', idade: [18, 85], tema: 'saude', repetir: 12,
    quando: c => c.v.financas.bens.some(b => b.tipo === 'veiculo' && !b.modeloId.startsWith('bike')),
    peso: c => (c.v.financas.bens.some(b => b.tipo === 'veiculo' && b.modeloId.startsWith('moto')) ? 3 : 1),
    narrar: c => {
      const moto = c.v.financas.bens.some(b => b.tipo === 'veiculo' && b.modeloId.startsWith('moto'));
      return {
        texto: moto
          ? c.vezes === 0 ? 'Um carro fechou a moto num cruzamento. Foram dois meses de gesso na perna e fisioterapia pelo SUS.' : 'Outro tombo de moto, outra vez no asfalto. Desta vez foi o braço.'
          : c.vezes === 0 ? 'Um motorista avançou o sinal e bateu na lateral do carro. Ninguém se machucou; o conserto levou três semanas.' : 'Levou uma batida na traseira parado no semáforo. Mais três semanas sem carro.',
        relevancia: c.vezes === 0 || moto ? 'biografia' : 'cotidiano', tom: 'ruim',
        efeito: () => { if (moto) { saude(c, -8); estresse(c, 8); } else dinheiro(c, -1800); }
      };
    }
  },
  {
    id: 'adu_infiltracao', tipo: 'acontecimento', idade: [20, 90], tema: 'casa', repetir: 7,
    quando: c => c.v.moradia.tipo === 'propria' && temImovel(c),
    narrar: c => {
      const custo = c.r.int(3000, 12000);
      const problema = c.r.pick([
        ['Uma infiltração apareceu na parede do quarto', 'trocar o encanamento'],
        ['O telhado começou a pingar nas chuvas', 'refazer o telhado'],
        ['O piso da cozinha estufou', 'trocar o piso'],
        ['A fiação velha derrubou a energia da casa', 'refazer a parte elétrica']
      ]);
      return { texto: `${problema[0]}. ${problema[1][0].toUpperCase() + problema[1].slice(1)} custou R$ ${custo.toLocaleString('pt-BR')} e um mês de pó.`, relevancia: 'cotidiano', tom: 'ruim', efeito: () => dinheiro(c, -custo) };
    }
  },
  {
    id: 'adu_aluguel_reajuste', tipo: 'acontecimento', idade: [18, 90], tema: 'casa', repetir: 5,
    quando: c => c.v.moradia.tipo === 'aluguel',
    narrar: c => {
      const alto = c.r.chance(0.4);
      return {
        texto: alto ? `O dono do imóvel pediu um reajuste de ${c.r.int(12, 20)}% no aluguel. Não teve conversa.` : 'Veio o reajuste do aluguel, um pouco acima da inflação.',
        relevancia: alto ? 'cotidiano' : 'tecnico',
        efeito: () => { c.v.moradia.aluguel = Math.round(c.v.moradia.aluguel * (alto ? 1.14 : 1.05) / 10) * 10; }
      };
    }
  },
  {
    id: 'adu_vizinho', tipo: 'decisao', idade: [18, 90], tema: 'casa', repetir: 6,
    quando: c => c.v.moradia.tipo !== 'pais',
    titulo: 'O vizinho de cima',
    texto: () => 'O vizinho de cima faz festa toda sexta até as três da manhã. Já é o quarto fim de semana seguido.',
    opcoes: [
      { id: 'conversar', texto: 'Subir e conversar', comportamento: { coragem: 1 }, resolver: c => ({ texto: c.r.chance(0.6) ? 'Ele pediu desculpas e o som baixou — por um tempo.' : 'Ele disse que em casa dele faz o que quer.', memoria: null }) },
      { id: 'sindico', texto: 'Reclamar com o síndico', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Veio uma advertência por escrito. O vizinho passou a não cumprimentar ninguém.', memoria: null }) },
      { id: 'aguentar', texto: 'Comprar protetor de ouvido', resolver: c => ({ texto: 'Você passou a dormir de protetor.', memoria: null, efeito: () => estresse(c, 3) }) }
    ]
  },

  /* ======================================================= AMIGOS E GENTE */
  {
    id: 'adu_amigo_casa', tipo: 'decisao', idade: [20, 60], tema: 'amizade',
    papeis: { amigo: P.amigo },
    quando: c => idadePessoa(c.v, c.p.amigo) >= 22 && !c.p.amigo.parceiroId,
    titulo: c => `O casamento de ${c.p.amigo.nome}`,
    texto: c => `${c.p.amigo.nome} vai casar e chamou você para ser ${c.g('padrinho', 'madrinha', 'padrinhe')}. Traje, presente e despedida de solteiro inclusos.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: 'Você chorou no altar mais do que os noivos.', memoria: `Foi ${c.g('padrinho', 'madrinha', 'padrinhe')} no casamento de ${c.p.amigo.nome}.`, efeito: () => { dinheiro(c, -1200); prox(c, 'amigo', 12); c.p.amigo.parceiroId = 'fora'; }, lembrar: ['amigo', `Você foi ${c.g('padrinho', 'madrinha', 'padrinhe')} do casamento.`] }) },
      { id: 'recusar', texto: 'Agradecer e dizer que não pode', resolver: c => ({ texto: `${c.p.amigo.nome} escolheu outra pessoa. Você foi como convidad${c.g('o', 'a', 'e')}.`, memoria: null, efeito: () => { prox(c, 'amigo', -6); c.p.amigo.parceiroId = 'fora'; } }) }
    ]
  },
  {
    id: 'adu_amigo_filho', tipo: 'acontecimento', idade: [22, 60], tema: 'amizade',
    papeis: { amigo: P.amigo },
    quando: c => idadePessoa(c.v, c.p.amigo) >= 23 && idadePessoa(c.v, c.p.amigo) <= 42,
    narrar: c => ({ texto: `${c.p.amigo.nome} teve ${c.r.chance(0.5) ? 'um filho' : 'uma filha'}. As mensagens no grupo passaram a ser fotos de bebê.`, relevancia: 'cotidiano', efeito: () => { c.v.vinculos[c.p.amigo.id].tensao = 0; } })
  },
  {
    id: 'adu_reencontro', tipo: 'acontecimento', idade: [25, 90], tema: 'amizade', repetir: 6,
    papeis: { antigo: (v) => Object.values(v.vinculos).filter(x => x.estagio === 'afastado' && v.pessoas[x.pessoaId]?.vivo && x.historia.length > 0 && !x.historia.some(h => h.tipo === 'reconciliacao' && v.t - h.t < 180)).map(x => v.pessoas[x.pessoaId]) },
    narrar: c => ({
      texto: `Esbarrou em ${c.p.antigo.nome} ${c.r.pick(['numa fila de banco', 'num velório de um conhecido', 'numa festa de aniversário', 'no mercado'])}. Anos sem se ver; conversaram como se tivesse sido ontem, e trocaram telefone.`,
      relevancia: 'biografia', tom: 'bom',
      efeito: () => { const vin = c.v.vinculos[c.p.antigo.id]; vin.proximidade = Math.max(vin.proximidade, 40); vin.tUltimoContato = c.v.t; vin.estagio = 'amigo'; },
      lembrar: ['antigo', 'Reencontraram-se por acaso depois de anos.', 'reconciliacao']
    })
  },
  {
    id: 'adu_ex_reaparece', tipo: 'decisao', idade: [20, 70], tema: 'amor', repetir: 8,
    papeis: { ex: (v) => Object.values(v.vinculos).filter(x => x.romance?.estagio === 'ex' && x.romance.fim !== 'morte' && v.pessoas[x.pessoaId]?.vivo && x.proximidade >= 25 && !v.pessoas[x.pessoaId].parceiroId).map(x => v.pessoas[x.pessoaId]) },
    quando: c => !P.parceiro(c.v).length && !P.saindoCom(c.v).length,
    titulo: c => `${c.p.ex.nome}`,
    texto: c => `Mensagem de ${c.p.ex.nome}, depois de muito tempo: "Tava pensando em você. Café?"`,
    opcoes: [
      { id: 'cafe', texto: 'Aceitar o café', resolver: c => {
        const vin = c.v.vinculos[c.p.ex.id];
        const volta = c.r.chance(0.4);
        return { texto: volta ? 'O café virou jantar. O jantar virou outra coisa.' : 'Foi bom, e foi só isso. Cada um seguiu.', memoria: volta ? `Reatou com ${c.p.ex.nome}.` : null, efeito: () => { if (volta) { vin.romance = { ...vin.romance!, estagio: 'saindo', tEstagio: c.v.t, envolvimento: 58, fim: undefined }; lembrarCom(c.v, c.p.ex.id, 'Voltaram, anos depois.', 'reconciliacao', 2); } else prox(c, 'ex', 5); } };
      } },
      { id: 'ignorar', texto: 'Visualizar e não responder', comportamento: { independencia: 1 }, resolver: () => ({ texto: 'O "visto" ficou lá.', memoria: null }) }
    ]
  },

  /* =============================================================== FILHOS */
  {
    id: 'adu_filho_passos', tipo: 'acontecimento', idade: [16, 70], tema: 'filhos',
    papeis: { filho: P.filho(1, 1) },
    repetir: 0,
    quando: c => !temFato(c.v, `passos_${c.p.filho.id}`),
    narrar: c => ({ texto: `${c.p.filho.nome} deu os primeiros passos na sala, na sua direção.`, relevancia: 'biografia', tom: 'bom', efeito: () => { fato(c, `passos_${c.p.filho.id}`); prox(c, 'filho', 6); feliz(c, 5); }, lembrar: ['filho', 'Deu os primeiros passos na sua direção.'] })
  },
  {
    id: 'adu_filho_escola', tipo: 'acontecimento', idade: [18, 75], tema: 'filhos', repetir: 0,
    papeis: { filho: P.filhoEmCasa(6, 6) },
    quando: c => !temFato(c.v, `escola_${c.p.filho.id}`),
    narrar: c => ({ texto: `Primeiro dia de aula de ${c.p.filho.nome}. ${gp(c, 'filho', 'Ele', 'Ela')} entrou sem olhar para trás; quem ficou no portão foi você.`, relevancia: 'biografia', efeito: () => fato(c, `escola_${c.p.filho.id}`), lembrar: ['filho', 'O primeiro dia de aula: você ficou no portão.'] })
  },
  {
    id: 'adu_filho_doente', tipo: 'acontecimento', idade: [18, 75], tema: 'filhos', repetir: 4,
    papeis: { filho: P.filhoEmCasa(0, 10) },
    narrar: c => ({ texto: c.v.financas.planoDeSaude ? `${c.p.filho.nome} teve pneumonia e passou três dias internad${gp(c, 'filho', 'o', 'a')}. O plano cobriu o hospital.` : `${c.p.filho.nome} teve pneumonia. Foram duas noites no corredor do hospital público até sair o leito.`, relevancia: 'biografia', tom: 'ruim', efeito: () => estresse(c, 10) })
  },
  {
    id: 'adu_filho_briga_escola', tipo: 'decisao', idade: [25, 70], tema: 'filhos', repetir: 4,
    papeis: { filho: P.filhoEmCasa(7, 14) },
    titulo: 'Bilhete da escola',
    texto: c => `A coordenação chamou você: ${c.p.filho.nome} brigou no recreio e deixou outra criança com o nariz sangrando.`,
    opcoes: [
      { id: 'ouvir', texto: c => `Ouvir a versão de ${c.p.filho.nome} antes de tudo`, comportamento: { empatia: 1 },
        resolver: c => ({ texto: `${c.p.filho.nome} contou que a outra criança vinha zoando ${gp(c, 'filho', 'ele', 'ela')} havia meses. Vocês foram juntos conversar com a escola.`, memoria: null, efeito: () => prox(c, 'filho', 6) }) },
      { id: 'castigo', texto: 'Castigo exemplar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: `${c.p.filho.nome} ficou um mês sem videogame, sem entender direito o porquê.`, memoria: null, efeito: () => { prox(c, 'filho', -4); tensao(c, 'filho', 10); } }) },
      { id: 'defender', texto: 'Defender seu filho na frente da coordenação', comportamento: { familia: 1, impulsividade: 1 },
        resolver: c => ({ texto: 'A reunião acabou com a coordenadora pedindo calma a você.', memoria: null, efeito: () => prox(c, 'filho', 3) }) }
    ]
  },

  /* ============================================================== FAMÍLIA */
  {
    id: 'adu_pais_ajuda', tipo: 'decisao', idade: [22, 70], tema: 'familia', repetir: 6,
    papeis: { pai: P.genitor },
    quando: c => c.p.pai.renda < 2500 && idadePessoa(c.v, c.p.pai) >= 55 && c.v.moradia.tipo !== 'pais' && c.v.financas.conta > 1500
      && !c.v.vinculos[c.p.pai.id].convivio.includes('casa') && c.v.fatos[`ajuda_mensal_${c.p.pai.id}`] === undefined,
    titulo: c => `${c.p.pai.nome}`,
    texto: c => `${c.p.pai.nome} ligou com a voz baixa: a aposentadoria não está fechando o mês e os remédios subiram.`,
    opcoes: [
      { id: 'mensal', texto: 'Mandar um valor todo mês', comportamento: { familia: 2, generosidade: 1 },
        resolver: c => ({ texto: `Todo começo de mês, um Pix para ${c.p.pai.nome}.`, memoria: `Passou a ajudar ${c.p.pai.nome} com dinheiro todo mês.`, efeito: () => { prox(c, 'pai', 10); fato(c, `ajuda_mensal_${c.p.pai.id}`); } }) },
      { id: 'uma_vez', texto: 'Ajudar desta vez', comportamento: { familia: 1 }, resolver: c => ({ texto: 'Você mandou o suficiente para aquele mês.', memoria: null, efeito: () => { dinheiro(c, -1200); prox(c, 'pai', 4); } }) },
      { id: 'nao', texto: 'Explicar que não dá', resolver: c => ({ texto: `${c.p.pai.nome} disse que se virava.`, memoria: null, efeito: () => prox(c, 'pai', -5) }) }
    ]
  },
  {
    id: 'adu_natal_familia', tipo: 'acontecimento', idade: [18, 80], tema: 'familia', repetir: 5,
    papeis: { quem: P.qualquer(P.genitor, P.irmao) },
    narrar: c => {
      const criancas = P.filho(0, 10)(c.v);
      const cenas = [
        `O Natal foi na casa de ${c.p.quem.nome}: amigo-secreto, uva-passa no arroz e uma discussão sobre política que ninguém venceu.`,
        `Passou o Ano-Novo com a família de ${c.p.quem.nome}, na praia, todo mundo de branco num apartamento alugado para doze.`,
        `O almoço de Páscoa juntou a família toda pela primeira vez em anos, na casa de ${c.p.quem.nome}.`,
        criancas.length ? `No Natal, ${criancas[0].nome} descobriu quem era o Papai Noel: ${c.p.quem.nome}, com a barba de algodão torta.` : `O Natal na casa de ${c.p.quem.nome} foi pequeno este ano: pouca gente, muita comida, conversa até tarde.`,
        `A ceia de Natal acabou em briga por causa de uma herança antiga. ${c.p.quem.nome} foi a primeira pessoa a pedir desculpas.`,
        `O aniversário de ${c.p.quem.nome} virou festa-surpresa organizada no grupo da família, com bolo de padaria e parente que ninguém via fazia anos.`,
        `Passaram o réveillon na laje de ${c.p.quem.nome}, vendo os fogos da cidade inteira.`
      ];
      return { texto: cenas[(c.vezes * 3 + c.r.int(0, 2)) % cenas.length], relevancia: 'cotidiano', efeito: () => prox(c, 'quem', 5) };
    }
  },
  {
    id: 'adu_heranca_briga', tipo: 'decisao', idade: [30, 90], tema: 'familia',
    papeis: { irmao: P.irmao },
    quando: c => P.genitor(c.v).length === 0 && ['media_baixa', 'media', 'alta'].includes(c.v.origem.classe) && !temFato(c.v, 'partilha_feita'),
    titulo: 'A casa dos pais',
    texto: c => `Com os pais já falecidos, sobrou a casa da família. ${c.p.irmao.nome} quer vender logo; você cresceu naquela casa.`,
    opcoes: [
      { id: 'vender', texto: 'Aceitar vender e dividir', resolver: c => ({ texto: 'A casa foi vendida para uma família com crianças pequenas.', memoria: 'A casa da família foi vendida e o dinheiro, dividido entre os irmãos.', efeito: () => { fato(c, 'partilha_feita'); dinheiro(c, Math.round(({ media_baixa: 60000, media: 180000, alta: 600000 } as Record<string, number>)[c.v.origem.classe] / (1 + P.irmao(c.v).length))); } }) },
      { id: 'comprar', texto: c => `Comprar a parte de ${c.p.irmao.nome}`, disponivel: c => (c.v.financas.conta + c.v.financas.reserva > 80000 ? true : 'Não há dinheiro para comprar a parte.'), comportamento: { familia: 1 },
        resolver: c => ({ texto: 'A casa continuou na família — agora sua.', memoria: 'Comprou dos irmãos a casa onde cresceu.', efeito: () => { fato(c, 'partilha_feita'); dinheiro(c, -80000); c.v.financas.bens.push({ id: `imovel${c.v.seq++}`, tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa da família', valor: 200000, tCompra: c.v.t, municipioId: c.v.eu.municipioNatal, estado: 55 }); } }) },
      { id: 'brigar', texto: 'Não aceitar vender', comportamento: { familia: -1, impulsividade: 1 },
        resolver: c => ({ texto: 'Virou inventário na Justiça. Vocês passaram a se falar por advogado.', memoria: `Brigou na Justiça com ${c.p.irmao.nome} pela casa dos pais.`, efeito: () => { fato(c, 'partilha_feita'); tensao(c, 'irmao', 60); prox(c, 'irmao', -30); } }) }
    ]
  },

  /* =================================================== LAZER E O MUNDO */
  {
    id: 'adu_ferias', tipo: 'decisao', idade: [18, 80], tema: 'lazer', repetir: 3,
    quando: c => c.v.financas.conta > 2500 && c.v.moradia.tipo !== 'pais' || (c.v.moradia.tipo === 'pais' && c.v.financas.conta > 4000),
    titulo: 'Férias',
    texto: c => `Pela primeira vez em muito tempo, sobraram uns dias de folga${P.parceiro(c.v)[0] ? ` junto com ${P.parceiro(c.v)[0].nome}` : ''} e algum dinheiro na conta.`,
    opcoes: [
      { id: 'praia', texto: c => (mora(c).regiao === 'Nordeste' ? 'Uma semana numa praia do interior do estado' : 'Uma semana no Nordeste'), resolver: c => ({ texto: 'Sol, água de coco e nenhum e-mail.', memoria: mora(c).regiao === 'Nordeste' ? 'Tirou uma semana de férias numa praia tranquila.' : 'Tirou férias no Nordeste.', efeito: () => { dinheiro(c, -3500); feliz(c, 8); estresse(c, -15); for (const par of P.parceiro(c.v)) { const rom = c.v.vinculos[par.id].romance; if (rom) rom.envolvimento += 6; } } }) },
      { id: 'familia', texto: 'Visitar a família', resolver: c => ({ texto: 'Dias de comida caseira e conversa na varanda.', memoria: null, efeito: () => { dinheiro(c, -800); estresse(c, -8); for (const p of P.genitor(c.v)) { const vin = c.v.vinculos[p.id]; vin.proximidade += 6; vin.tUltimoContato = c.v.t; } } }) },
      { id: 'guardar', texto: 'Ficar em casa e guardar o dinheiro', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Você maratonou séries e dormiu até tarde.', memoria: null, efeito: () => estresse(c, -4) }) }
    ]
  },
  {
    id: 'adu_copa', tipo: 'acontecimento', idade: [5, 95], tema: 'lazer', repetir: 4,
    quando: c => [2030, 2034, 2038, 2042, 2046, 2050, 2054, 2058, 2062, 2066, 2070, 2074, 2078, 2082, 2086, 2090, 2094, 2098, 2102, 2106].includes(anoDe(c.v.t)),
    narrar: c => ({ texto: c.r.chance(0.2) ? `Em ${anoDe(c.v.t)} o Brasil ganhou a Copa. A rua virou festa até de manhã.` : `A Copa de ${anoDe(c.v.t)} acabou para o Brasil nas ${c.r.pick(['oitavas', 'quartas', 'semifinais'])}. O bairro inteiro tinha bandeirinha na janela.`, relevancia: 'cotidiano' })
  },
  {
    id: 'adu_sus_fila', tipo: 'acontecimento', idade: [20, 90], tema: 'saude', repetir: 5,
    quando: c => !c.v.financas.planoDeSaude && c.v.corpo.saude < 60,
    narrar: c => ({ texto: 'Uma dor no joelho virou pedido de ressonância pelo SUS. A marcação saiu para dali a oito meses.', relevancia: 'cotidiano', efeito: () => estresse(c, 3) })
  },
  {
    id: 'adu_negocio_proprio', tipo: 'decisao', idade: [23, 60], tema: 'trabalho', repetir: 10,
    papeis: { socio: P.qualquer(P.amigo, P.irmao) },
    quando: c => c.v.financas.conta + c.v.financas.reserva > 15000,
    titulo: 'O negócio',
    texto: c => `${c.p.socio.nome} quer abrir ${c.r.pick(['uma hamburgueria', 'uma loja de açaí', 'uma oficina', 'um salão', 'uma loja de roupas online'])} e chama você para sócio${c.g('', 'a', 'e')}: entrar com R$ 15.000 e trabalhar nos fins de semana.`,
    opcoes: [
      { id: 'entrar', texto: 'Entrar no negócio', comportamento: { coragem: 2 },
        resolver: c => {
          const deu = c.r.chance(0.35);
          return {
            texto: deu ? 'Os primeiros meses foram de prejuízo. No segundo ano, começou a sobrar dinheiro.' : 'Em um ano e meio, as portas fecharam. Sobraram dívidas com fornecedor e um estoque encalhado.',
            memoria: deu ? `Abriu um negócio com ${c.p.socio.nome}, que deu certo.` : `Abriu um negócio com ${c.p.socio.nome}, que fechou em um ano e meio.`,
            relevancia: 'marco', tom: deu ? 'bom' : 'ruim',
            efeito: () => { dinheiro(c, -15000); if (deu) { fato(c, 'negocio_proprio'); c.v.financas.conta += 30000; prox(c, 'socio', 10); } else { tensao(c, 'socio', 30); estresse(c, 10); } }
          };
        } },
      { id: 'recusar', texto: 'Recusar', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Você desejou boa sorte e não entrou.', memoria: null }) }
    ]
  }
];

function destinoDaProposta(c: Ctx) {
  const aqui = municipio(c.v.moradia.municipioId);
  // Propostas vêm de centros maiores, de preferência na mesma região.
  const pontuar = (m: typeof aqui) => (m.regiao === aqui.regiao ? 3 : 0) + (m.perfil === 'metropole' ? 3 : m.perfil === 'capital' ? 1 : 0) + (m.uf === aqui.uf ? 1 : 0) + (m.id === 'sao-paulo-sp' ? 1 : 0);
  const opcoes = MUNICIPIOS.filter(m => m.id !== aqui.id && (m.perfil === 'metropole' || m.perfil === 'capital'))
    .sort((a, b) => pontuar(b) - pontuar(a)).slice(0, 6);
  // Estável entre abrir e resolver a decisão: depende só da vida e do ano.
  let h = anoDe(c.v.t) * 31;
  for (const ch of c.v.id) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return opcoes[h % opcoes.length];
}

void nomeOcupacaoId; void envolvimento;
