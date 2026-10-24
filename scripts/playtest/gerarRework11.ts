/**
 * Saves das cenas do QA visual do REWORK 11 (`rework11.mjs`), montados como os testes de cenário do motor:
 *   sem-clube     27 anos, goleiro do Cruzeiro sem clube (contrato vencido) + duas portas: indicação de manicure
 *                 (mudança de carreira) e de treinador de escolinha (por conta própria, sem entrevista)
 *   paises        Cruzeiro → Barcelona → Juventus, duas temporadas em cada; na Juventus com salário e luvas de milhões em euro
 *   momentos      futebolista vivido pelo motor por 21 temporadas (os "Momentos da carreira" agrupados)
 *   tecnico       ex-jogador no comando do Cruzeiro (técnico principal)
 *   auxiliar      ex-jogador auxiliar técnico (a comissão técnica e a agenda)
 *   ator / musico-pet / politico   ator profissional; músico com calopsita; prefeita em mandato
 *   noiva         noivado há 8 meses (o planejamento do casamento na ficha)
 *   ex            namoro terminado há dois anos (as ações com o ex)
 *   redes / redes-suspensa   Instagram com histórico de anos + X; a conta suspensa (3 advertências)
 *   crianca10     10 anos, 193 no cofrinho, com responsável: a loja de instrumentos e a de bicicletas
 *
 *   npx esbuild scripts/playtest/gerarRework11.ts --bundle --platform=node --outfile=<scratch>/g.cjs && OUT=<pasta>/saves node <scratch>/g.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { nova, viverAte } from '../../src/motor/__tests__/ajuda';
import { adulto, comParceiro, pessoaNova } from '../../src/motor/__tests__/cenarios';
import { idade, transacao } from '../../src/motor/nucleo';
import { criarRng } from '../../src/motor/rng';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { novaOportunidade } from '../../src/motor/sistemas/oportunidades';
import { dependeDosResponsaveis } from '../../src/motor/sistemas/pedidosDaCrianca';
import { executar } from '../../src/motor/acoes';
import { avancarAno } from '../../src/motor/ano';
import { criarVida } from '../../src/motor/criacao';
import { abrirDecisao, conteudoPorId } from '../../src/motor/conteudo/motor';
import { contexto } from '../../src/motor/conteudo/base';
import { encerrarCarreira, entrarNaBase, fecharTemporada, ficarSemClube, profissionalizar } from '../../src/motor/sistemas/esporte';
import { registrarTemporada } from '../../src/motor/sistemas/palmares';
import { processarTecnico } from '../../src/motor/sistemas/tecnico';
import { clubePorNome } from '../../src/motor/dados/clubes';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { adotarPet } from '../../src/motor/sistemas/pets';
import { entrarNaPolitica, processarPolitica } from '../../src/motor/sistemas/politica';
import { ficarNoivos, terminar } from '../../src/motor/sistemas/romance';
import { advertir } from '../../src/motor/sistemas/redes';
import { PLATAFORMAS } from '../../src/motor/dados/redes';
import type { CarreiraEsportiva, PropostaDeClube, Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { v.momento = null; v.caminhos.pendente = undefined; writeFileSync(`${OUT}/vida-r11-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const em = (v: Vida, f: (x: Vida, r: ReturnType<typeof criarRng>) => void) => transacao(v, (x, r) => { f(x, r); }).vida;
const exigir = (ok: boolean, o: string) => { if (!ok) throw new Error(`pré-condição: ${o}`); };

/** Atleta profissional no clube dito (o `atleta` de rework11Esportes.test.ts). */
function atleta(base: Vida, o: { clube: string; cidade: string; tecnica: number; posicao: CarreiraEsportiva['posicao'] }): Vida {
  return em(base, x => {
    x.educacao.matricula = undefined;
    x.caminhos.frentes.futebol = { habilidade: o.tecnica, interesse: 80, meses: 200, auge: o.tecnica, tInicio: x.t - 200 } as never;
    x.corpo.forma = 75;
    x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: o.clube, nivel: 4, tInicio: x.t - 72, tFase: x.t - 60, lesoes: 0, municipioId: o.cidade, reputacao: 55, espaco: 'titular', contratoAte: x.t + 36, posicao: o.posicao, temporadas: [] };
    x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: `o ${o.clube}`, contrato: 'clt', salario: 30000, tInicio: x.t - 60, desempenho: 70, municipioId: o.cidade, carga: 'integral' };
  });
}
const temporadaNoClube = (v: Vida): Vida => em(v, (x, r) => { const e = x.caminhos.esporte!; const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); x.t += 12; });
function aceitar(v: Vida, clube: string, pais: string, salario: number, luvas: number): Vida {
  const c = clubePorNome(clube, pais)!;
  v = em(v, x => { x.caminhos.esporte!.proposta = { id: `p${clube}`, clube, municipioId: c.cidade, nivel: 4, meses: 36, salario, salarioTitular: salario, espaco: 'titular', t: x.t, validaAte: x.t + 11, origem: 'mercado', taxa: 2_000_000, luvas } as PropostaDeClube; x.fatos['esp_proposta_hoje'] = x.t; });
  v = em(v, (x, r) => { const d = conteudoPorId('esp_proposta'); if (d?.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); });
  return executar(v, { tipo: 'decidir', opcaoId: 'aceitar' }).vida;
}

async function principal() {
  await carregarMundo();
  const bh = adulto(27, { municipioId: 'belo-horizonte-mg', genero: 'masculino', semente: 23 });

  // 1 + 4 · o goleiro sem clube, com as duas portas
  const semClube = em(atleta(bh, { clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 84, posicao: 'goleiro' }), (x, r) => {
    x.caminhos.esporte!.reputacao = 40;
    x.caminhos.esporte!.contratoAte = x.t - 1;
    ficarSemClube(x, x.caminhos.esporte!);
    const adele = criarPessoa(x, criarRng(5), { idade: 34, genero: 'feminino', municipioId: x.moradia.municipioId }); adele.nome = 'Adele';
    vincular(x, adele, { origem: 'amizade', proximidade: 80, convivio: [] } as never);
    const tito = criarPessoa(x, criarRng(6), { idade: 50, genero: 'masculino', municipioId: x.moradia.municipioId }); tito.nome = 'Tito';
    vincular(x, tito, { origem: 'amizade', proximidade: 75, convivio: [] } as never);
    const a = novaOportunidade(x, { tipo: 'indicacao', ocupacaoId: 'manicure', meses: 12, chave: 'qa11a', titulo: 'Indicação de Adele', texto: 'Adele pode passar serviço para você no salão do bairro.', pessoaId: adele.id, natureza: 'mudanca_carreira' });
    const b = novaOportunidade(x, { tipo: 'indicacao', ocupacaoId: 'treinador_escolinha', meses: 12, chave: 'qa11b', titulo: 'Indicação de Tito', texto: 'Tito tem uma escolinha de futebol e quer você nos treinos dos pequenos: por conta própria, sem entrevista.', pessoaId: tito.id, natureza: 'por_conta' });
    exigir(!!a && !!b, 'as duas portas criadas');
    void r;
  });
  exigir(semClube.caminhos.esporte!.ultimoClube?.clube === 'Cruzeiro', 'último clube Cruzeiro');
  salvar('sem-clube', semClube);

  // 2 + 10 · Brasil → Espanha → Itália, com milhões em euro
  let v = atleta(bh, { clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 92, posicao: 'meia' });
  v = temporadaNoClube(v); v = temporadaNoClube(v);
  v = aceitar(v, 'Barcelona', 'ES', 380_000, 1_200_000); v = temporadaNoClube(v); v = temporadaNoClube(v);
  v = aceitar(v, 'Juventus', 'IT', 1_250_000, 3_750_000); v = temporadaNoClube(v); v = temporadaNoClube(v);
  v = em(v, x => { x.financas.conta = 48_765_432; x.caminhos.esporte!.reputacao = 88; x.trabalho.atual!.salario *= 12; if (x.caminhos.esporte!.salarioContrato) x.caminhos.esporte!.salarioContrato *= 12; });
  exigir(v.caminhos.esporte!.clube === 'Juventus' && v.caminhos.esporte!.temporadas!.length === 6, 'seis temporadas, termina na Juventus');
  salvar('paises', v);

  // 2b · momentos vividos (a carreira de 21 anos do teste CAR-11.9)
  let m = criarVida({ nome: 'Teste', sobrenome: 'Silva', genero: 'feminino', municipioId: 'recife-pe', semente: 31 });
  const PREFS = ['aceitar', 'renovar', 'assinar', 'continuar', 'seguir', 'ficar'];
  const responder = () => { for (let j = 0; j < 12 && m.momento && !m.morte; j++) { const q = m.momento; const ls = q.opcoes.filter(o => !o.bloqueio); const p = q.situacaoId !== 'car_situacao' ? PREFS.map(id => ls.find(o => o.id === id)).find(Boolean) : undefined; m = executar(m, { tipo: 'decidir', opcaoId: (p ?? ls[0] ?? q.opcoes[0]).id }).vida; } };
  for (let k = 0; k < 18 && !m.morte; k++) { m = avancarAno(m).vida; responder(); }
  m = em(m, (x, r) => {
    garantirFrente(x, 'futebol');
    Object.assign(x.caminhos.frentes.futebol!, { habilidade: 90, interesse: 95, meses: 160, auge: 92 });
    x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = [];
    x.financas.conta += 100000;
    entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport');
    profissionalizar(x, r, 3);
    x.momento = null;
  });
  for (let k = 0; k < 14 && !m.morte; k++) { m = avancarAno(m).vida; responder(); }
  exigir(!m.morte && (m.caminhos.situacoes ?? []).length > 3, `momentos registrados: ${(m.caminhos.situacoes ?? []).length}`);
  salvar('momentos', m);

  // 3 + 8 · a comissão técnica
  const ex = em(atleta(adulto(36, { municipioId: 'belo-horizonte-mg', genero: 'masculino', semente: 21 }), { clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 86, posicao: 'meia' }), (x, r) => {
    const e = x.caminhos.esporte!; e.reputacao = 70; for (let k = 0; k < 3; k++) fecharTemporada(x, r, e); e.reputacao = 70; encerrarCarreira(x, e, 'escolha'); x.trabalho.experiencia['treino'] = 36;
  });
  salvar('tecnico', em(ex, (x, r) => { contratar(x, r, ocupacao('tecnico_futebol')); processarTecnico(x, r); x.financas.conta = 250000; }));
  const aux = em(ex, (x, r) => { contratar(x, r, ocupacao('auxiliar_tecnico')); });
  exigir(aux.trabalho.atual?.clube === 'Cruzeiro', 'auxiliar no Cruzeiro');
  salvar('auxiliar', aux);

  // 5 · artistas e política
  const base22 = adulto(24, { semente: 7000 });
  const artista = (id: string, d: 'teatro' | 'musica') => em(base22, (x, r) => {
    const f = garantirFrente(x, d); f.habilidade = 66; f.interesse = 80; f.meses = 60;
    x.rotinas = x.rotinas.filter(rt => rt.id !== d); x.rotinas.push({ id: d, tInicio: x.t, nivel: 2 });
    x.financas.conta = Math.max(x.financas.conta, 8000);
    contratar(x, r, ocupacao(id), 'teste');
  });
  salvar('ator', artista('ator', 'teatro'));
  const musico = em(artista('musico_profissional', 'musica'), (x, r) => { adotarPet(x, r, { especie: 'calopsita', nome: 'Sunny', genero: 'feminino', idade: 2, porte: 'pequeno', jeito: 'calma', historia: '' }, 'abrigo'); });
  salvar('musico-pet', musico);
  salvar('politico', em(adulto(40, { semente: 5100 }), (x, r) => {
    x.trabalho.atual = undefined; x.caminhos.envolvimento = undefined; x.justica = undefined; x.momento = null;
    const p = entrarNaPolitica(x, 'comunidade');
    p.partido = 'Partido Ipê'; p.tFiliacao = x.t - 48; p.fase = 'eleito'; p.apoio = 50; p.reputacao = 45; p.prioridade = 'saude';
    p.posse = { cargo: 'prefeito', t: x.t };
    x.anoAtual = { acoes: [] };
    processarPolitica(x, r);
  }));

  // 6 · noivado e ex
  const base30 = adulto(29, { semente: 1101 });
  salvar('noiva', em(base30, x => {
    x.eu.atracao = 'homens'; x.financas.conta = 200000;
    const p = criarPessoa(x, criarRng(9), { idade: 29, genero: 'masculino', municipioId: x.moradia.municipioId }); p.nome = 'Otávio'; p.atracao = 'mulheres';
    const vin = vincular(x, p, { origem: 'romance', proximidade: 80, convivio: ['casa'] });
    vin.romance = { estagio: 'morando_junto', tEstagio: x.t - 36, tInicio: x.t - 48, envolvimento: 85, planoFilhos: 'evitando' };
    ficarNoivos(x, vin);
    vin.romance.noivado!.t = x.t - 8; x.fatos[`noivado_${p.id}`] = x.t - 8;
  }));
  salvar('ex', em(adulto(30, { semente: 1101, genero: 'masculino' }), x => {
    x.eu.atracao = 'mulheres';
    const c = comParceiro(x, { genero: 'feminino', estagio: 'namoro', idade: 29 });
    c.p.atracao = 'homens'; c.p.nome = 'Iasmin';
    terminar(x, c.p, c.vin, 'jogador');
    x.t += 24; c.vin.tensao = 25; c.vin.proximidade = 60; c.vin.confianca = 50;
  }));

  // 7 · redes
  const rede = (op: object) => ({ tipo: 'rede', op } as Parameters<typeof executar>[1]);
  let r0 = em(adulto(26, { semente: 1201 }), x => { x.financas.conta = 1e6; });
  r0 = executar(r0, rede({ oque: 'criar', plataforma: 'instagram' })).vida;
  r0 = executar(r0, rede({ oque: 'criar', plataforma: 'x' })).vida;
  const redes = em(r0, x => {
    const c = x.redes!.contas.instagram;
    c.anos = [
      { desde: x.t - 36, ate: x.t - 24, inicio: 1200, organico: 0, publicacoes: 98800, exposicao: 0, comprados: 0, perdas: 0, fim: 100000 },
      { desde: x.t - 24, ate: x.t - 12, inicio: 100000, organico: 0, publicacoes: 200000, exposicao: 0, comprados: 0, perdas: 0, fim: 300000 },
      { desde: x.t - 12, ate: x.t, inicio: 300000, organico: 0, publicacoes: 180000, exposicao: 0, comprados: 0, perdas: 0, fim: 480000 }
    ] as never;
    c.balanco = { desde: x.t, inicio: 480000, organico: 0, publicacoes: 189000, exposicao: 0, comprados: 0, perdas: 0 } as never;
    c.seguidores = 669000;
    advertir(x, PLATAFORMAS.instagram, c, 'publicação que virou briga, denunciada');
  });
  salvar('redes', redes);
  salvar('redes-suspensa', em(redes, x => { const c = x.redes!.contas.instagram; for (let k = 0; k < 2; k++) advertir(x, PLATAFORMAS.instagram, c, 'provocação nos comentários'); }));

  // 9 · a criança na loja (as lojas de objetos abrem aos 10)
  let s = 1065;
  let k9 = viverAte(nova({ semente: s, municipioId: 'recife-pe' }), 10);
  while (k9.morte || !dependeDosResponsaveis(k9)) k9 = viverAte(nova({ semente: ++s, municipioId: 'recife-pe' }), 10);
  salvar('crianca10', em(k9, x => { x.financas.conta = 193; x.financas.bens = x.financas.bens.filter(b => b.tipo !== 'veiculo'); }));
  void pessoaNova;
}

void principal();
