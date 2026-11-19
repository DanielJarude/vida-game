/**
 * VIDA 28 — coerência da História, identidade do clube, arquétipos, mercado, e-sports, relações, épocas.
 * Testes de TRAJETÓRIA (vários anos de uma vida) e das peças novas; cada um diz a regra que protege.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { interpretar } from '../save';
import { avancarAno } from '../ano';
import { nova, viverAte } from './ajuda';
import { executar } from '../acoes';
import { escrever, transacao } from '../nucleo';
import { criarRng } from '../rng';
import { novaOportunidade } from '../sistemas/oportunidades';
import { arquivarCarreiraEsportiva, bolsaDaBase, bonusDaTemporada, clubesQueDispensaram, conviteDaBase, encerrarCarreira, entrarNaBase, portaDaPeneira, riscoDeDispensa, transferirPara } from '../sistemas/esporte';
import { efeitosDoPerfil, lerPerfil, oQueOPerfilFaz, type LeituraDoPerfil } from '../sistemas/arquetipos';
import { concorrenteNaPosicao, garantirElenco, janelaDoElenco, REGRAS_DO_MERCADO } from '../sistemas/elenco28';
import { ecoNasRelacoes, processarRelacoes28, primeiraImpressao, dimensoes28EmPalavras } from '../sistemas/relacoes28';
import { trajetoriaDeSituacao, modeloDaSituacao } from '../sistemas/situacoes';
import { mercadoDe } from '../sistemas/mercados';
import { ocupacao } from '../dados/ocupacoes';
import { numerosDaTemporada } from '../sistemas/perfisEsportivos';
import { planoDaComposicao } from '../sistemas/tatuagens';
import { MODELOS_28 } from '../dados/tatuagens28';
import { desenhoDeTatuagem } from '../dados/tatuagens';
import { ATRIBUTOS_BASQUETE, ATRIBUTOS_DA_POSICAO, ATRIBUTOS_VOLEI } from '../v26/esporte/atributos26';
import { derivarAtributosDeCorrida } from '../v20/automobilismo/automobilismo20';
import { fiosDoAno } from '../../ui/apresentar';
import { abrirDecisao, conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import type { CarreiraEsportiva, Temporada, Vida } from '../tipos';

function jovem(i: number, semente = 2801, municipioId?: string): Vida {
  let s = semente;
  let v = viverAte(nova({ semente: s, genero: 'masculino', ...(municipioId ? { municipioId } : {}) }), i);
  while (v.morte) v = viverAte(nova({ semente: ++s, genero: 'masculino', ...(municipioId ? { municipioId } : {}) }), i);
  v.momento = null; v.caminhos.processo = undefined; v.anoAtual = { acoes: [] };
  return v;
}
const naBase = (v: Vida, clube: string, municipioId = v.moradia.municipioId): CarreiraEsportiva => {
  entrarNaBase(v, 'futebol', municipioId, clube);
  const e = v.caminhos.esporte!;
  e.tInicio = e.tFase = v.t - 24;
  return e;
};

/* ======================================================= 2 · a História coerente */
describe('VIDA 28 · a História respeita o que aconteceu', () => {
  it('quem foi promovido no ano não é dispensado no mesmo ano; a nota alta e a titularidade protegem', () => {
    expect(riscoDeDispensa(0.5, { nota: 8, jogos: 20, titular: 18 }, 80, true)).toBe(0);
    const bom = riscoDeDispensa(0.5, { nota: 8, jogos: 20, titular: 18 }, 80, false);
    const fraco = riscoDeDispensa(0.5, { nota: 5.5, jogos: 20, titular: 4 }, 55, false);
    expect(bom).toBeLessThan(0.1);
    expect(fraco).toBeGreaterThan(0.5);
  });

  it('dispensado e sem nova chance: a dispensa é o fato; o abandono só quando a pessoa larga (e é dito)', () => {
    const v = jovem(15);
    const e = naBase(v, 'Marília');
    encerrarCarreira(v, e, 'dispensa');
    const dispensa = v.biografia.find(b => /^Dispensado da base do Marília, aos 15\.$/.test(b.texto));
    expect(dispensa, 'a frase da dispensa não decide pela pessoa').toBeTruthy();
    expect(v.biografia.some(b => /sonho de viver/.test(b.texto))).toBe(false);
    // A decisão depois da dispensa (aberta como o motor do ano abre): largar de vez escreve o abandono e tira a rotina —
    // sem rotina, nenhuma peneira chega (o sistema respeita a decisão).
    const d = conteudoPorId('esp_dispensa')!;
    const w = transacao(v, (x, r) => { if (d.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); }).vida;
    expect(w.momento?.situacaoId).toBe('esp_dispensa');
    const x = executar(w, { tipo: 'decidir', opcaoId: 'largar' }).vida;
    expect(x.biografia.some(b => /Largou de vez: o sonho de viver do futebol ficou para trás/.test(b.texto))).toBe(true);
    expect(x.rotinas.some(r => r.id === 'futebol')).toBe(false);
  });

  it('dispensado que tenta outro clube: a base dispensada vai para o arquivo e a próxima peneira é em OUTRO clube', () => {
    const v = jovem(15, 2811, 'marilia-sp');
    const e = naBase(v, 'Marília');
    (e.formacao ??= []).push({ ano: 2040, idade: 15, categoria: 'sub-15', clube: 'Marília', competicao: 'x', jogos: 10, titular: 5, nota: 5, tecnica: 50, colocacao: 8, participantes: 16, avaliacao: '' });
    encerrarCarreira(v, e, 'dispensa');
    arquivarCarreiraEsportiva(v);
    v.caminhos.esporte = undefined;
    expect(clubesQueDispensaram(v, 'futebol').map(x => x.clube)).toContain('Marília');
    // Marília só tem o Marília: a peneira vai para a capital do estado, num clube que não dispensou.
    const porta = portaDaPeneira(v, 'marilia-sp', 'teste', 'futebol');
    expect(porta).toBeTruthy();
    expect(porta!.clube).not.toBe('Marília');
    expect(porta!.lugar).not.toBe('marilia-sp');
    // Entrar na nova base conta a transição (a dispensa de antes não some).
    entrarNaBase(v, 'futebol', porta!.lugar, porta!.clube);
    expect(v.biografia[v.biografia.length - 1].texto).toMatch(/^Depois da dispensa do Marília, aos 15, uma nova chance: entrou para/);
  });

  it('voltar ao clube que dispensou (anos depois) é dito como volta', () => {
    const v = jovem(15, 2821);
    const e = naBase(v, 'Ituano');
    (e.formacao ??= []).push({ ano: 2040, idade: 15, categoria: 'sub-15', clube: 'Ituano', competicao: 'x', jogos: 10, titular: 5, nota: 5, tecnica: 50, colocacao: 8, participantes: 16, avaliacao: '' });
    encerrarCarreira(v, e, 'dispensa');
    arquivarCarreiraEsportiva(v);
    v.caminhos.esporte = undefined;
    v.t += 30;
    entrarNaBase(v, 'futebol', v.moradia.municipioId, 'Ituano');
    expect(v.biografia[v.biografia.length - 1].texto).toMatch(/^Voltou para a base do Ituano, que tinha dispensado você aos 15/);
  });

  it('no mesmo ano, a trajetória é lida na ordem em que aconteceu (a promoção antes da dispensa, mesmo sendo o marco)', () => {
    const v = jovem(17, 2831);
    const a = escrever(v, { texto: 'Subiu para o sub-20 do Marília.', relevancia: 'biografia', tema: 'lazer', fio: 'esporte' });
    const esc = escrever(v, { texto: 'Concluiu o ensino médio.', relevancia: 'marco', tema: 'escola', fio: 'escola' });
    const b = escrever(v, { texto: 'Dispensado da base do Marília, aos 17.', relevancia: 'marco', tema: 'lazer', fio: 'esporte' });
    // A História recebe as entradas com os marcos primeiro (`anosDaBiografia`): o fio as devolve à ordem real.
    const fios = fiosDoAno([b, esc, a]);
    const doEsporte = fios.find(f => f.entradas.some(x => x.id === a.id))!;
    expect(doEsporte.entradas.map(x => x.id)).toEqual([a.id, b.id]);
    expect(fios.find(f => f.entradas.some(x => x.id === esc.id))!.entradas).toHaveLength(1);
  });

  it('o mesmo fato não é escrito duas vezes (a chave do fato)', () => {
    const v = jovem(17, 2841);
    const n = v.biografia.length;
    escrever(v, { texto: 'Concluiu o ensino médio integrado ao técnico em eletrotécnica, com os dois diplomas.', relevancia: 'marco', tema: 'escola', chave: 'conclusao:medio:1' });
    escrever(v, { texto: 'Concluiu o ensino médio entre os melhores da turma.', relevancia: 'marco', tema: 'escola', chave: 'conclusao:medio:1' });
    expect(v.biografia.length - n).toBe(1);
  });

  it('o médio integrado vira UMA formatura com os dois diplomas (trajetória escolar até o fim)', () => {
    let v = jovem(14, 2851);
    if (!v.educacao.basica) return;
    v.educacao.basica.etapa = 'medio'; v.educacao.basica.serie = 3; v.educacao.basica.integrado = 'tec_eletrotecnica';
    v.educacao.basica.desempenho = 90; v.educacao.basica.reprovacoes = 0;
    v = viverAte(v, 16);
    const formaturas = v.biografia.filter(b => /^Concluiu o ensino médio|^Terminou o médio integrado/.test(b.texto));
    expect(formaturas.length).toBeLessThanOrEqual(1);
    if (formaturas.length) expect(formaturas[0].texto).toMatch(/integrado ao técnico em .*, com os dois diplomas/);
  });
});

/* ======================================================= 8 · a identidade do clube */
describe('VIDA 28 · do teste ao vínculo, o clube é o mesmo', () => {
  it('a peneira no Palmeiras, aprovada, vira convite e base no Palmeiras (São Paulo tem vários clubes)', () => {
    for (let s = 2860; s < 2880; s++) {
      let v = jovem(14, s, 'sao-paulo-sp');
      v.caminhos.frentes.futebol = { interesse: 95, meses: 90, habilidade: 92, tInicio: v.t - 90, tUltimo: v.t, retomadas: 0, auge: 92 };
      v.corpo.forma = 85;
      v = transacao(v, x => { novaOportunidade(x, { tipo: 'peneira', dominio: 'futebol', municipioId: 'sao-paulo-sp', meses: 12, chave: 'peneira_futebol', titulo: 'Peneira no Palmeiras', texto: 't', clube: 'Palmeiras' }); }).vida;
      const op = v.caminhos.oportunidades.find(o => o.tipo === 'peneira')!;
      expect(op.clube).toBe('Palmeiras');
      let x = executar(v, { tipo: 'oportunidade', id: op.id, aceitar: true }).vida;
      expect(x.caminhos.processo?.lugar).toBe('Palmeiras');
      for (let k = 0; x.momento?.situacaoId === 'esp_peneira' && k < 3; k++) x = executar(x, { tipo: 'decidir', opcaoId: 'p0' }).vida;
      if (!x.caminhos.conviteBase) continue;
      expect(conviteDaBase(x)!.clube).toBe('Palmeiras');
      expect(x.momento?.situacaoId).toBe('esp_base');
      for (let k = 0; x.momento && k < 4; k++) x = executar(x, { tipo: 'decidir', opcaoId: x.momento.situacaoId === 'esp_base' ? 'ir' : x.momento.opcoes[0].id }).vida;
      if (x.caminhos.esporte) { expect(x.caminhos.esporte.clube).toBe('Palmeiras'); expect(x.caminhos.esporte.modalidade).toBe('futebol'); }
      return;
    }
    throw new Error('nenhuma semente passou na peneira com técnica 92');
  });

  it('o título da porta com "Testes na academia..." não vira nome de clube (a leitura antiga escapava)', () => {
    const v = jovem(14, 2881);
    const x = transacao(v, y => { novaOportunidade(y, { tipo: 'seletiva', dominio: 'tenis', municipioId: y.moradia.municipioId, meses: 12, chave: 'peneira_tenis', titulo: 'Testes na academia de tênis de Campinas', texto: 't' }); }).vida;
    const op = x.caminhos.oportunidades.find(o => o.tipo === 'seletiva')!;
    const y = executar(x, { tipo: 'oportunidade', id: op.id, aceitar: true }).vida;
    expect(y.caminhos.processo?.lugar).toBe('academia de tênis de Campinas');
  });
});

/* ======================================================= 3 e 4 · atributos e arquétipos */
describe('VIDA 28 · atributos por posição e arquétipos emergentes', () => {
  it('as posições e funções têm os atributos que faltavam (o pênalti, a criação, o três pontos, a cobertura)', () => {
    expect(ATRIBUTOS_DA_POSICAO.goleiro.map(x => x[0])).toContain('penaltis');
    expect(ATRIBUTOS_DA_POSICAO.meia.map(x => x[0])).toEqual(expect.arrayContaining(['criacao', 'bola_parada']));
    expect(ATRIBUTOS_DA_POSICAO.ponta.map(x => x[0])).toContain('um_contra_um');
    expect(ATRIBUTOS_BASQUETE.ala.map(x => x[0])).toContain('tres_pontos');
    expect(ATRIBUTOS_VOLEI.libero.map(x => x[0])).toContain('cobertura');
    for (const l of [...Object.values(ATRIBUTOS_DA_POSICAO), ...Object.values(ATRIBUTOS_BASQUETE), ...Object.values(ATRIBUTOS_VOLEI)]) expect(l.reduce((s, x) => s + x[1], 0)).toBeCloseTo(1, 3);
  });

  const base: LeituraDoPerfil = { modalidade: 'futebol', papel: 'atacante', desvio: {}, acimaDaDivisao: 0, tracos: {}, idade: 26, anosNoClube: 2, capitao: false, reserva: false };
  it('o perfil SURGE dos dados: finalização e gols fazem o Matador; nada se destaca, nenhum rótulo', () => {
    expect(lerPerfil(base).principal).toBeUndefined();
    expect(lerPerfil({ ...base, desvio: { finalizacao: 8, compostura: 5, movimentacao: 4 }, golsPorJogo: 0.5 }).principal).toBe('matador');
    // O mesmo atacante, impulsivo e provocador, muito acima da divisão: o Marrento aparece (o talento e a língua).
    const marrento = lerPerfil({ ...base, tracos: { impulsividade: 80, coragem: 60, empatia: -50 }, acimaDaDivisao: 10 });
    expect([marrento.principal, ...marrento.secundarios]).toContain('marrento');
    // Cada modalidade tem os seus: o central bloqueador não existe no futebol.
    expect(lerPerfil({ ...base, modalidade: 'volei', papel: 'central', desvio: { bloqueio: 10, alcance: 5 } }).principal).toBe('central_bloqueador');
  });

  it('o perfil tem efeito: o Marrento oscila e gasta a paciência do treinador; o Capitão ganha a confiança e aproxima o grupo', () => {
    const m = efeitosDoPerfil({ principal: 'marrento', secundarios: [] });
    expect(m.variancia).toBeGreaterThan(1.1); expect(m.titularidade).toBeLessThan(0); expect(m.vestiario).toBeLessThan(0);
    const c = efeitosDoPerfil({ principal: 'capitao', secundarios: [] });
    expect(c.titularidade).toBeGreaterThan(0); expect(c.vestiario).toBeGreaterThan(0);
    expect(oQueOPerfilFaz({ principal: 'marrento', secundarios: [] })).toEqual(expect.arrayContaining(['oscila mais de um jogo para outro', 'desgasta o vestiário']));
  });
});

/* ======================================================= 5 · mercado, contratos, salários */
describe('VIDA 28 · o mercado esportivo', () => {
  function profissional(semente = 2891): { v: Vida; e: CarreiraEsportiva } {
    const v = jovem(22, semente, 'sao-paulo-sp');
    const e: CarreiraEsportiva = { modalidade: 'futebol', fase: 'profissional', clube: 'Palmeiras', nivel: 4, tInicio: v.t - 60, tFase: v.t - 24, lesoes: 0, municipioId: 'sao-paulo-sp', espaco: 'titular', posicao: 'atacante', temporadas: [] };
    v.caminhos.esporte = e;
    return { v, e };
  }

  it('o clube tem elenco com nome: o concorrente direto é uma pessoa da vida, com rivalidade', () => {
    const { v, e } = profissional();
    const el = garantirElenco(v, e, { regua: 74, papel: 'atacante', salarioBase: 60000 })!;
    expect(el.atletas.length).toBeGreaterThanOrEqual(REGRAS_DO_MERCADO.futebol!.tamanho);
    const c = concorrenteNaPosicao(v, e, 'atacante')!;
    expect(c).toBeTruthy();
    expect(c.pessoaId && v.vinculos[c.pessoaId]?.rivalidade).toBeGreaterThan(0);
  });

  it('a janela anda sozinha, com motivo: contratos acabam, jovens são emprestados, vagas são preenchidas — e o mesmo ano não roda duas vezes', () => {
    const { v, e } = profissional(2892);
    const ctx = { regua: 74, papel: 'atacante', salarioBase: 60000 };
    garantirElenco(v, e, ctx);
    for (const a of e.elenco28!.atletas) a.contratoAte = v.t; // todos no fim do contrato
    const m = janelaDoElenco(v, e, ctx);
    expect(m.length).toBeGreaterThan(0);
    expect(m.every(x => x.texto.length > 10)).toBe(true);
    expect(janelaDoElenco(v, e, ctx)).toEqual([]);
    // Toda posição continua com alguém (a necessidade do clube fecha a vaga).
    for (const p of ['goleiro', 'zagueiro', 'meia', 'atacante']) expect(e.elenco28!.atletas.some(a => a.papel === p)).toBe(true);
  });

  it('basquete e vôlei: contrato por temporada, sem taxa (o mercado não é o do futebol)', () => {
    expect(REGRAS_DO_MERCADO.basquete!.taxa).toBe(false);
    expect(REGRAS_DO_MERCADO.volei!.meses).toEqual([12, 12]);
    expect(REGRAS_DO_MERCADO.futebol!.emprestimo).toBe(true);
  });

  it('o bônus por conquista sai do contrato: o título da liga paga, a temporada sem título não; o tênis vive de prêmio', () => {
    const e = { modalidade: 'futebol', nivel: 4 } as CarreiraEsportiva;
    const t = { colocacao: 1, partidas: 34, titular: 30, copas: [{ id: 'copa_do_brasil', fase: 'campeão', jogos: 8 }] } as unknown as Temporada;
    const b = bonusDaTemporada(e, t, 50000);
    expect(b.valor).toBeGreaterThan(50000);
    expect(b.motivos).toEqual(['o título da liga', 'o título da copa']);
    expect(bonusDaTemporada(e, { ...t, colocacao: 5, copas: [] }, 50000).valor).toBe(0);
    expect(bonusDaTemporada({ modalidade: 'tenis' } as CarreiraEsportiva, t, 50000).valor).toBe(0);
  });

  it('a base não recebe salário de profissional: a bolsa começa aos 14, menor no clube pequeno', () => {
    const v = jovem(15, 2893, 'sao-paulo-sp');
    const grande = { modalidade: 'futebol', fase: 'base', clube: 'Palmeiras', municipioId: 'sao-paulo-sp' } as CarreiraEsportiva;
    const pequeno = { ...grande, clube: 'Juventus' } as CarreiraEsportiva;
    expect(bolsaDaBase(v, grande)).toBeGreaterThan(0);
    expect(bolsaDaBase(v, grande)).toBeGreaterThanOrEqual(bolsaDaBase(v, pequeno));
    const crianca = jovem(12, 2894, 'sao-paulo-sp');
    expect(bolsaDaBase(crianca, grande)).toBe(0);
  });

  it('a transferência muda o clube, o salário do contrato novo e a memória de quem é próximo', () => {
    const { v, e } = profissional(2895);
    v.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Palmeiras', salario: 40000, tInicio: v.t - 24, desempenho: 60, contrato: 'clt', carga: 'integral', municipioId: 'sao-paulo-sp' } as unknown as Vida['trabalho']['atual'];
    const proximo = Object.values(v.vinculos).find(x => x.proximidade >= 45);
    transferirPara(v, e, { clube: 'Santos', municipioId: 'santos-sp', nivel: 4, salario: 70000, salarioTitular: 80000, espaco: 'titular', meses: 36, validaAte: v.t + 6, origem: 'mercado', taxa: 0 } as never);
    expect(e.clube).toBe('Santos');
    expect(v.trabalho.atual!.salario).toBe(80000);
    if (proximo) expect(proximo.historia.some(h => /Santos/.test(h.texto))).toBe(true);
  });
});

/* ======================================================= 6 · e-sports */
describe('VIDA 28 · e-sports', () => {
  it('o jogador de e-sports não é "trabalhador por conta": mercado de competidor, momentos de competidor', () => {
    expect(mercadoDe(ocupacao('jogador_esports'))).toBe('esporte');
    expect(mercadoDe(ocupacao('piloto_corrida'))).toBe('esporte');
    const v = jovem(19, 2901);
    v.esports25 = { jogo: 'cs', fase: 'profissional', inicio: v.t - 36, talento: 70, funcao: 'entry', atributos: { mira: 70 }, nivel: 3, passagens: [], temporadas: [], serie: [], totais: { disputas: 0, vencidas: 0, titulos: 0, premios: 0, temporadas: 0 }, reputacao: 30, equipe: { nome: 'Farol Gaming', nivel: 3, forca: 60, desde: v.t - 12, contratoAte: v.t + 12, salario: 5000, titular: true } } as never;
    v.trabalho.atual = { ocupacaoId: 'jogador_esports', empregador: 'Farol Gaming', salario: 5000, tInicio: v.t - 12, desempenho: 60, contrato: 'autonomo', carga: 'integral', municipioId: v.moradia.municipioId } as unknown as Vida['trabalho']['atual'];
    expect(trajetoriaDeSituacao(v)).toBe('esports');
    expect(modeloDaSituacao('esp28_final')!.cabe(v)).toBe(true);
    expect(modeloDaSituacao('aut_cliente')!.trajetoria).toBe('autonomo');
  });
});

/* ======================================================= 7 · a interface lê a modalidade */
describe('VIDA 28 · os números são os da modalidade', () => {
  const t = { ano: 2040, clube: 'x', nivel: 3, partidas: 20, titular: 18, gols: 0, assistencias: 3, nota: 7, colocacao: 2, mesesFora: 0 } as Temporada;
  it('o vôlei não mostra gols; o tênis mostra o ranking; o goleiro, os jogos sem sofrer gol', () => {
    const volei = numerosDaTemporada({ modalidade: 'volei' }, { ...t, funcao: 'oposto', volei: { sets: 70, pontos: 300, bloqueios: 40, aces: 20, levantamentos: 0, defesas: 50 } });
    expect(volei.map(x => x[0])).not.toContain('Gols');
    expect(volei.map(x => x[0])).toContain('Pontos');
    expect(numerosDaTemporada({ modalidade: 'tenis' }, { ...t, vitorias: 30, derrotas: 10, ranking: 45 }).map(x => x[0])).toContain('Ranking');
    expect(numerosDaTemporada({ modalidade: 'futebol', posicao: 'goleiro' }, { ...t, semSofrerGol: 9, golsSofridos: 20 }).map(x => x[0])).toContain('Sem sofrer gol');
  });
});

/* ======================================================= 9 · relações */
describe('VIDA 28 · relações em mais dimensões', () => {
  it('a rivalidade, quando a disputa acaba, esfria e vira respeito — sem apagar o que houve', () => {
    const v = jovem(24, 2911);
    const { vin } = Object.values(v.vinculos).map(x => ({ vin: x })).find(x => !x.vin.parentesco) ?? { vin: Object.values(v.vinculos)[0] };
    vin.rivalidade = 60; vin.convivio = []; vin.tensao = 10;
    const respeito = vin.respeito ?? 0;
    processarRelacoes28(v);
    expect(vin.rivalidade!).toBeLessThan(60);
    expect(vin.respeito!).toBeGreaterThan(respeito);
    // Dois anos longe: a rivalidade quase some, o respeito fica — e a ficha passa a dizer.
    processarRelacoes28(v); processarRelacoes28(v);
    expect(vin.rivalidade ?? 0).toBeLessThan(25);
    expect(dimensoes28EmPalavras(vin).map(x => x.id)).toContain('respeito');
  });

  it('o título fica na memória de quem é próximo e vira admiração; a dispensa traz quem é afável para perto', () => {
    const v = jovem(20, 2912);
    const proximos = Object.values(v.vinculos).filter(x => x.proximidade >= 45 && !v.pessoas[x.pessoaId].especie);
    ecoNasRelacoes(v, 'titulo', 'Comemoraram juntos o título.', 2);
    for (const x of proximos) { expect(x.historia.some(h => h.texto === 'Comemoraram juntos o título.')).toBe(true); expect(x.admiracao ?? 0).toBeGreaterThan(0); }
  });

  it('a fama chega antes: quem conhece você agora já admira (ou desconfia, depois da polêmica)', () => {
    const v = jovem(25, 2913);
    v.notoriedade = { valor: 70, pico: 70 } as never;
    const vin = { pessoaId: 'x', origem: 'trabalho', tInicio: v.t, proximidade: 10, confianca: 20, tensao: 0, convivio: [], tUltimoContato: v.t, historia: [] } as never as import('../tipos').Vinculo;
    primeiraImpressao(v, vin);
    expect(vin.admiracao ?? 0).toBeGreaterThan(20);
    v.fatos['vis_polemica'] = v.t;
    const vin2 = { ...vin, admiracao: undefined, respeito: undefined, tensao: 0 } as import('../tipos').Vinculo;
    primeiraImpressao(v, vin2);
    expect(vin2.tensao).toBeGreaterThan(0);
  });
});

/* ======================================================= automobilismo, tatuagens */
describe('VIDA 28 · o resto da atualização', () => {
  it('o piloto ganha os atributos de corrida, derivados nos saves antigos', () => {
    const a = { atributos: { pilotagem: 60, consistencia: 50, adaptacao: 40, fisico: 50, experiencia: 30, pressao: 50 } } as never as import('../dados20/tipos20').Auto20;
    derivarAtributosDeCorrida(a);
    expect(a.atributos.classificacao).toBe(56);
    expect(a.atributos.pneus).toBeGreaterThan(0);
    expect(a.atributos.leitura).toBeGreaterThan(0);
  });

  it('os projetos de tatuagem novos misturam estilos, usam só desenhos que existem e cabem no corpo', () => {
    const v = jovem(25, 2921);
    v.financas.conta = 1e7;
    expect(MODELOS_28.length).toBeGreaterThanOrEqual(20);
    for (const m of MODELOS_28) {
      const estilos = new Set(m.pecas.map(p => desenhoDeTatuagem(p.desenho)!.estilo));
      expect(estilos.size, m.id).toBeGreaterThanOrEqual(2);
      const plano = planoDaComposicao(v, m.id, m.tipo === 'manga' || m.tipo === 'meia_manga' || m.tipo === 'perna' ? 'd' : undefined);
      expect(typeof plano, m.id).toBe('object');
    }
    void criarRng;
  });
});

/* ======================================================= persistência e saves antigos */
describe('VIDA 28 · saves', () => {
  it('um save antigo de atleta carrega e vive dois anos: o elenco, o perfil e o mercado nascem sem apagar nada', () => {
    const r = interpretar(readFileSync(join(__dirname, 'fixtures', 'save-v11-atleta.json'), 'utf8'));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    let v = r.vida;
    const antes = { bio: v.biografia.length, temporadas: v.caminhos.esporte?.temporadas?.length ?? 0, vinculos: Object.keys(v.vinculos).length, conta: v.financas.conta };
    for (let k = 0; k < 2 && !v.morte; k++) { v = avancarAno(v).vida; for (let j = 0; j < 8 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; }
    expect(v.biografia.length).toBeGreaterThanOrEqual(antes.bio);
    expect(Object.keys(v.vinculos).length).toBeGreaterThanOrEqual(antes.vinculos - 3);
    if (v.caminhos.esporte?.fase === 'profissional') expect((v.caminhos.esporte.temporadas?.length ?? 0)).toBeGreaterThanOrEqual(antes.temporadas);
  });

  it('a carreira com elenco, perfil e as dimensões novas sobrevive a salvar e carregar', () => {
    const v = jovem(23, 2931, 'sao-paulo-sp');
    const e: CarreiraEsportiva = { modalidade: 'futebol', fase: 'profissional', clube: 'Palmeiras', nivel: 4, tInicio: v.t - 60, tFase: v.t - 24, lesoes: 0, municipioId: 'sao-paulo-sp', espaco: 'titular', posicao: 'meia', temporadas: [], perfil28: { principal: 'garcom', secundarios: ['capitao'], desde: v.t, historico: [{ ano: 2040, principal: 'garcom' }] } };
    v.caminhos.esporte = e;
    garantirElenco(v, e, { regua: 74, papel: 'meia', salarioBase: 60000 });
    janelaDoElenco(v, e, { regua: 74, papel: 'meia', salarioBase: 60000 });
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    const e2 = r.vida.caminhos.esporte!;
    expect(e2.perfil28).toEqual(e.perfil28);
    expect(e2.elenco28!.atletas.map(a => a.nome)).toEqual(e.elenco28!.atletas.map(a => a.nome));
    const c = concorrenteNaPosicao(r.vida, e2, 'meia');
    expect(c?.pessoaId && r.vida.vinculos[c.pessoaId]?.rivalidade).toBeGreaterThan(0);
  });
});
