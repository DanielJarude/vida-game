/**
 * Saves das cenas do REWORK 10.5 (`rework105.mjs`), vividos pelo motor:
 *   universitario   20 anos, 3º ano de Direito: o histórico acadêmico (disciplinas, notas, créditos)
 *   formado         24 anos, formado: o histórico escolar e acadêmico que ficou (Estudos · Histórico)
 *   sintoma8        8 anos, com um sinal no corpo: o atendimento médico pelos responsáveis
 *   magoada         30 anos, amiga com quem brigou feio (a ficha com os estados e a mágoa)
 *   casado          32 anos, casado, colega de trabalho: Romance com o flerte e o acordo
 *   atriz           52 anos, atriz conhecida premiada, com propostas na mesa (o painel da atuação e a ficha do papel)
 *   militante       40 anos, filiada, desgaste por exposição e campanha (as causas e as respostas)
 *   famosa          35 anos, atriz famosa com 1,4 milhão no Instagram (o balanço do ano e o nome em partes)
 *   envolvido       26 anos, envolvido por fora há dois anos (o Submundo com a trajetória)
 *   crianca9        9 anos, cofrinho com dinheiro (o dinheiro da criança e as compras da idade)
 *   conquista       30 anos, uma conquista no ano (o alto do ano que passou)
 *
 *   npx esbuild scripts/playtest/gerarRework105.ts --bundle --platform=node --outfile=<scratch>/g.cjs && OUT=<pasta>/saves node <scratch>/g.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { nova, viver, viverAte } from '../../src/motor/__tests__/ajuda';
import { adulto, comParceiro, pessoaNova } from '../../src/motor/__tests__/cenarios';
import { executar } from '../../src/motor/acoes';
import { idade, transacao } from '../../src/motor/nucleo';
import { criarRng } from '../../src/motor/rng';
import { vincular } from '../../src/motor/pessoas';
import { efetivarMatricula } from '../../src/motor/sistemas/escola';
import { sincronizarMagoa } from '../../src/motor/sistemas/magoas';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { novaProposta } from '../../src/motor/sistemas/audiovisual';
import { desgastar } from '../../src/motor/sistemas/desgastePolitico';
import { contaAtiva } from '../../src/motor/sistemas/redesBase';
import { conteudosPossiveis, processarRedes } from '../../src/motor/sistemas/redes';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { marcar } from '../../src/motor/sistemas/marcas';
import type { Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-r105-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const em = (v: Vida, f: (x: Vida) => void) => transacao(v, x => { f(x); }).vida;

async function principal() {
  await carregarMundo();
  const fac = (semente: number) => em(adulto(18, { semente, municipioId: 'recife-pe' }), x => { x.educacao.matricula = undefined; x.trabalho.atual = undefined; efetivarMatricula(x, { tipo: 'curso', cursoId: 'direito', via: 'sisu', modalidade: 'presencial', rede: 'publica', mensalidade: 0, municipioId: x.moradia.municipioId, instituicao: 'Universidade Federal de Pernambuco' }); });
  salvar('universitario', viver(fac(1051), 2));
  salvar('formado', viverAte(nova({ semente: 1052, municipioId: 'recife-pe' }), 24));
  salvar('sintoma8', em(viverAte(nova({ semente: 1053, municipioId: 'sao-paulo-sp' }), 8), x => { x.corpo.condicoes.push({ id: 'diabetes', nome: 'diabetes', tInicio: x.t - 10, cronica: true, gravidade: 2, tratando: false, diagnosticada: false }); }));
  salvar('magoada', em(adulto(30, { semente: 1054 }), x => {
    const p = pessoaNova(x, 31, 'feminino');
    const vin = vincular(x, p, { origem: 'escola', proximidade: 64, estagio: 'amigo_proximo' });
    vin.conflito = { t: x.t - 30, assunto: 'o dinheiro emprestado', gravidade: 3, quem: 'eu' };
    vin.tensao = 30;
    sincronizarMagoa(vin);
    vin.magoa!.tentativas = [{ t: x.t - 12, quem: 'eu', resultado: 'recusada' }];
  }));
  salvar('casado', em(adulto(32, { semente: 1055, genero: 'masculino' }), x => {
    x.eu.atracao = 'mulheres';
    comParceiro(x, { genero: 'feminino' });
    vincular(x, pessoaNova(x, 30, 'feminino', { atracao: 'homens' }), { origem: 'trabalho', proximidade: 45, estagio: 'colega', convivio: ['trabalho'] });
  }));
  salvar('atriz', em(adulto(52, { semente: 1056, genero: 'feminino' }), x => {
    x.educacao.matricula = undefined; x.trabalho.atual = undefined;
    contratar(x, criarRng(3), ocupacao('ator_reconhecido'), 'convite');
    x.trabalho.atual!.tInicio = x.t - 25 * 12;
    x.caminhos.frentes.teatro = { interesse: 90, meses: 400, habilidade: 86, tInicio: x.t - 400, tUltimo: x.t, retomadas: 0, auge: 88 };
    x.notoriedade = { valor: 70, pico: 75, t: x.t, fonte: 'arte', origens: { arte: 75 } };
    x.caminhos.curriculo = Array.from({ length: 12 }, (_, k) => ({ t: x.t - (12 - k) * 18, tipo: (['novela', 'filme', 'serie', 'teatro'] as const)[k % 4], titulo: ['A Casa do Sul', 'Ponte de Vidro', 'Noite Calada', 'A Margem', 'Rota Norte', 'O Quarto de Cima', 'A Ilha Vazia', 'Sombra de Sal', 'Vento Norte', 'A Fábrica', 'Janela Partida', 'A Herança'][k], papel: k % 3 ? 'coadjuvante' : 'protagonista', repercussao: (k % 4 === 0 ? 3 : 2) as 2 | 3, porte: 2 as const, ...(k % 5 === 0 ? { premio: { nome: 'o Troféu Antena (televisão e streaming)', venceu: true, categoria: 'Melhor atriz de novela', edicao: 2010 + k, obra: 'A Casa do Sul', alcance: 'nacional' as const } } : {}) }));
    novaProposta(x, { tipo: 'filme', porte: 3, papel: 'protagonista', casa: 'uma produtora de cinema', titulo: 'A Ilha Calada', convite: true });
    novaProposta(x, { tipo: 'serie', porte: 2, papel: 'participação especial', casa: 'uma plataforma de streaming', titulo: 'Rota Norte — 2ª temporada', continuacaoDe: 'Rota Norte' });
  }));
  salvar('militante', em(adulto(40, { semente: 1057 }), x => {
    x.caminhos.politica = { fase: 'filiado', tInicio: x.t - 60, origem: 'convite', reputacao: 45, apoio: 32, desgaste: 0, historico: [], partidos: [{ sigla: 'PX', tInicio: x.t - 48 }], partido: 'PX' } as never;
    desgastar(x.caminhos.politica!, 26, 'exposicao'); desgastar(x.caminhos.politica!, 14, 'campanha');
  }));
  let f = em(adulto(35, { semente: 1058, genero: 'feminino' }), x => { x.financas.conta = 1e7; x.notoriedade = { valor: 88, pico: 90, t: x.t, fonte: 'arte', origens: { arte: 90 } }; });
  f = executar(f, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } } as Parameters<typeof executar>[1]).vida;
  f = em(f, x => { const c = contaAtiva(x, 'instagram')!; c.seguidores = 1_400_000; c.balanco = undefined; c.anos = []; });
  for (let k = 0; k < 3; k++) f = executar(f, { tipo: 'rede', op: { oque: 'publicar', plataforma: 'instagram', tema: conteudosPossiveis(f, 'instagram')[k].tema } } as Parameters<typeof executar>[1]).vida;
  f = em(f, x => { x.t += 12; processarRedes(x); x.anoAtual = { acoes: [] }; });
  salvar('famosa', f);
  salvar('envolvido', em(adulto(26, { semente: 1059 }), x => { entrar(x, 'patrimonial', undefined, criarRng(4)); x.caminhos.envolvimento!.tInicio = x.t - 24; x.caminhos.envolvimento!.reputacao = 35; }));
  salvar('crianca9', em(viverAte(nova({ semente: 1060, municipioId: 'recife-pe' }), 9), x => { x.financas.conta = 900; }));
  salvar('conquista', em(adulto(30, { semente: 1061 }), x => { marcar(x, 'conquista', 'Um conto seu venceu o concurso literário de Recife. Saiu numa antologia com o nome inteiro na capa.', 3, { dominio: 'escrita' }); marcar(x, 'promocao', 'Promovida a coordenadora de equipe.', 2); }));
}
void principal();
