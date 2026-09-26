/** Maturidade (60+). */

import { disponivel as guardado } from '../sistemas/dinheiro';
import type { Conteudo } from './base';
import * as P from './papeis';
import { dinheiro, estresse, fato, feliz, prox, saude } from './efeitos';
import { idadePessoa, lembrarCom, temFato, amigos } from '../nucleo';
import type { Ctx } from './base';

/** Anos desde que o casal começou (a primeira saída), não desde que se conheceram. */
const anosJuntos = (c: Ctx) => { const vin = c.v.vinculos[c.p.pessoa.id]; return Math.floor((c.v.t - (vin.romance?.tInicio ?? vin.tInicio)) / 12); };
import { mudarAgora } from '../sistemas/processos';

export const MATURIDADE: Conteudo[] = [
  {
    id: 'mat_aniversario_redondo', tipo: 'acontecimento', idade: [60, 100], tema: 'familia', repetir: 10, prioritario: true,
    quando: c => c.idade % 10 === 0,
    narrar: c => {
      const filhos = P.filho(0)(c.v);
      const netos = Object.values(c.v.vinculos).filter(x => x.parentesco === 'neto' && c.v.pessoas[x.pessoaId]?.vivo).length;
      const gente = filhos.length > 0 ? `${filhos.length === 1 ? filhos[0].nome : 'os filhos'}${netos ? ` e ${netos === 1 ? 'o neto' : 'os netos'}` : ''}` : amigos(c.v).length > 0 ? 'os amigos de sempre' : 'poucas pessoas';
      return { texto: `Fez ${c.idade} anos. A festa juntou ${gente}${c.idade >= 80 ? ', e alguém fez um discurso que ninguém esperava' : ''}.`, relevancia: 'biografia', tom: 'bom', efeito: () => feliz(c, 4) };
    }
  },
  {
    id: 'mat_bodas', tipo: 'acontecimento', idade: [45, 100], tema: 'amor', repetir: 25,
    papeis: { pessoa: P.conjuge },
    // As bodas com decisão (conteúdo/biografia) têm precedência: aqui só a linha, quando a decisão não coube.
    quando: c => { const anos = anosJuntos(c); return (anos === 25 || anos === 50) && !temFato(c.v, `bodas_${c.p.pessoa.id}_${anos}`) && !c.v.ocorrencias.some(o => o.id === 'bio_bodas' && c.v.t - o.t < 36); },
    narrar: c => {
      const anos = anosJuntos(c);
      return { texto: anos === 50 ? `Bodas de ouro com ${c.p.pessoa.nome}: cinquenta anos juntos.` : `Vinte e cinco anos ao lado de ${c.p.pessoa.nome}. Bodas de prata.`, relevancia: 'biografia', tom: 'bom', efeito: () => lembrarCom(c.v, c.p.pessoa.id, anos === 50 ? 'Bodas de ouro.' : 'Bodas de prata.', 'casamento', 3) };
    }
  },
  {
    id: 'mat_memoria', tipo: 'acontecimento', idade: [72, 100], tema: 'saude', repetir: 6,
    quando: c => c.v.corpo.saude < 55,
    narrar: c => ({ texto: 'Os nomes começaram a sumir no meio da frase. O médico pediu exames e falou em "acompanhar".', relevancia: 'biografia', tom: 'ruim', efeito: () => { c.v.mente.cognicao = Math.max(10, c.v.mente.cognicao - 8); estresse(c, 5); } })
  },
  {
    id: 'mat_voltar_estudar', tipo: 'decisao', idade: [60, 85], tema: 'estudo',
    quando: c => !c.v.educacao.matricula && !!c.v.trabalho.aposentadoria,
    titulo: 'Tempo',
    texto: () => 'Aposentadoria trouxe uma coisa que faltou a vida inteira: tempo. A universidade aberta à terceira idade abriu inscrições.',
    opcoes: [
      { id: 'sim', texto: 'Se inscrever', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Às terças e quintas, sala de aula de novo — a mais velha da turma não é você.'.replace('a mais velha da turma não é você', `você não é ${c.g('o mais velho', 'a mais velha')} da turma`), memoria: 'Voltou a estudar na universidade aberta à terceira idade.', efeito: () => { c.v.mente.cognicao += 3; feliz(c, 5); fato(c, 'unati'); } }) },
      { id: 'nao', texto: 'Deixar para lá', resolver: () => ({ texto: 'O folheto ficou na geladeira.', memoria: null }) }
    ]
  },
  {
    id: 'mat_perto_dos_filhos', tipo: 'decisao', idade: [65, 95], tema: 'lugar', repetir: 10,
    papeis: { filho: P.filho(25) },
    quando: c => c.p.filho.municipioId !== c.v.moradia.municipioId && !P.conjuge(c.v).length,
    titulo: c => `Perto de ${c.p.filho.nome}`,
    texto: c => `${c.p.filho.nome} sugere que você se mude para ${c.v.pessoas[c.p.filho.id].municipioId.split('-').slice(0, -1).map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(' ')}, para ficar perto. Seria deixar a cidade onde você viveu tanto tempo.`,
    opcoes: [
      { id: 'mudar', texto: 'Mudar para perto', comportamento: { familia: 1 }, resolver: c => ({ texto: 'A mudança foi triste e aliviada ao mesmo tempo.', memoria: null, efeito: () => { mudarAgora(c.v, c.p.filho.municipioId, `para ficar perto de ${c.p.filho.nome}`); prox(c, 'filho', 10); } }) },
      { id: 'ficar', texto: 'Ficar onde está', comportamento: { independencia: 1 }, resolver: () => ({ texto: 'Você agradeceu e ficou. As visitas continuaram sendo nos feriados.', memoria: null }) }
    ]
  },
  {
    id: 'mat_testamento', tipo: 'decisao', idade: [68, 100], tema: 'familia',
    quando: c => c.v.financas.bens.length > 0 || guardado(c.v) > 50000,
    titulo: 'O que fica',
    texto: () => 'Um advogado amigo da família sugere organizar o testamento "enquanto está tudo bem".',
    opcoes: [
      { id: 'igual', texto: 'Dividir tudo por igual entre os herdeiros', comportamento: { familia: 1 }, resolver: () => ({ texto: 'Ficou tudo no papel, assinado e registrado.', memoria: 'Fez o testamento, dividindo tudo por igual.' }) },
      { id: 'doar', texto: 'Deixar parte para uma causa', comportamento: { generosidade: 2 }, resolver: () => ({ texto: 'Parte do que você tem vai para um projeto social quando você se for.', memoria: 'Deixou em testamento parte dos bens para um projeto social.' }) },
      { id: 'depois', texto: 'Deixar para depois', resolver: () => ({ texto: 'Ainda há tempo, você disse.', memoria: null }) }
    ]
  },
  {
    id: 'mat_netos_visita', tipo: 'acontecimento', idade: [55, 100], tema: 'familia', repetir: 3,
    papeis: { neto: (v) => Object.values(v.vinculos).filter(x => x.parentesco === 'neto' && v.pessoas[x.pessoaId]?.vivo).map(x => v.pessoas[x.pessoaId]) },
    narrar: c => ({ texto: `${c.p.neto.nome} passou as férias na sua casa. ${idadePessoa(c.v, c.p.neto) < 10 ? 'Fizeram bolo, bagunça e uma cabana de lençol na sala.' : 'Passou metade do tempo no celular e a outra metade ouvindo suas histórias.'}`, relevancia: 'cotidiano', tom: 'bom', efeito: () => { prox(c, 'neto', 10); feliz(c, 4); } })
  },
  {
    id: 'mat_queda', tipo: 'acontecimento', idade: [70, 100], tema: 'saude', repetir: 5,
    quando: c => c.v.corpo.forma < 40,
    narrar: c => ({ texto: 'Um tombo no banheiro terminou em fratura no quadril e cirurgia. A recuperação foi lenta.', relevancia: 'biografia', tom: 'ruim', efeito: () => { saude(c, -12); dinheiro(c, c.v.financas.planoDeSaude ? 0 : -3000); } })
  },
  {
    id: 'mat_solidao', tipo: 'decisao', idade: [65, 100], tema: 'amizade', repetir: 6,
    quando: c => amigos(c.v).length === 0 && !P.conjuge(c.v).length,
    titulo: 'A casa quieta',
    texto: () => 'A casa anda quieta demais. Tem dias em que a única conversa é com o moço da padaria.',
    opcoes: [
      { id: 'grupo', texto: 'Entrar num grupo de convivência do bairro', comportamento: { sociabilidade: 1 }, resolver: c => ({ texto: 'Dança de salão às quartas, bingo às sextas. Gente nova, de novo.', memoria: 'Entrou num grupo de convivência da terceira idade.', efeito: () => { if (!c.v.rotinas.some(r => r.id === 'igreja')) c.v.rotinas.push({ id: 'igreja', tInicio: c.v.t }); feliz(c, 6); } }) },
      { id: 'ligar', texto: 'Ligar para alguém da família', comportamento: { familia: 1 }, resolver: c => ({ texto: 'A ligação durou uma hora e meia.', memoria: null, efeito: () => { for (const p of [...P.filho(0)(c.v), ...P.irmao(c.v)].slice(0, 2)) { const vin = c.v.vinculos[p.id]; vin.proximidade += 6; vin.tUltimoContato = c.v.t; } feliz(c, 3); } }) },
      { id: 'nada', texto: 'Ficar com a televisão', resolver: c => ({ texto: 'A televisão ficou ligada o dia inteiro.', memoria: null, efeito: () => feliz(c, -4) }) }
    ]
  }
];

void temFato;
