/**
 * REWORK 11 · Fase C — futebol e esportes profissionais, e a transição para treinador.
 *
 *   ESP-11.1  a colocação do clube da vida sai da MESMA tabela do país (a régua do mundo + a contribuição de quem joga);
 *             o goleiro conta os jogos sem sofrer gol a partir dos gols que o time sofre; basquete e vôlei sem a força
 *             de clube de acesso.
 *   ESP-11.2  os atributos da posição entram na nota e no que a temporada produz.
 *   ESP-11.3  copas com fases, nomes por país e id estável; a vaga continental vem da tabela do ano anterior.
 *   ESP-11.4  o torneio de seleções com a força do país; os jogos do torneio somam na seleção.
 *   ESP-11.5  Brasil → Espanha → Itália → Brasil: a liga certa em cada temporada, luvas sem perda cambial, euro = euro.
 *   ESP-11.6  os lances dos momentos entram na temporada em curso (e nos totais), nunca na que fechou; troféu com id.
 *   sem clube o atleta sem contrato continua atleta (sem clube atual falso), com ações; outro trabalho encerra a carreira.
 *   ESP-11.7  a comissão técnica de clube concreto; o técnico sem ações corporativas; o comando sem mudança à força.
 *   ESP-11.8  a copa do técnico fora do Brasil: zebra rara para a terceira divisão; o nome do torneio; o placar no texto.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { CarreiraEsportiva, PropostaDeClube, Temporada, Vida } from '../tipos';
import { executar, disponibilidade } from '../acoes';
import { abrirDecisao, conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { clubeAtual, encerrarCarreira, fecharTemporada, ficarSemClube, linhaDaTemporada, processarEsporte, semSofrerGolDe, ultimoClubeDe } from '../sistemas/esporte';
import { registrarTemporada } from '../sistemas/palmares';
import { colocacaoNaTabela, ligaDe } from '../sistemas/ligas';
import { aCompeticaoId, campanhaDaSelecao, classificadoParaContinental, copaContinental, copaNacional, idDaSelecao, nomeDaCompeticao } from '../sistemas/competicoes';
import { perfilDeAtributos } from '../sistemas/atributosEsportivos';
import { verbosDoOficio, executarOficio } from '../sistemas/noOficio';
import { acoesDoTrabalho, leituraDoTrabalho, modoDoTrabalho } from '../sistemas/profissao';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { clubePorNome } from '../dados/clubes';
import { converterEntrePaises, formatarDinheiro } from '../mundo/moeda';
import { decidirFinal, passagemAtual, processarTecnico, trabalhoDoTecnico } from '../sistemas/tecnico';
import { avancarLicenca, nivelDaLicenca } from '../sistemas/oficioDoTecnico';
import { exportarVida, importarVida } from '../save';
import { habilidade } from '../sistemas/frentes';

const recarregar = (v: Vida): Vida => { const l = importarVida(exportarVida(v)); if (l.tipo !== 'ok') throw new Error(`save: ${l.tipo}`); return l.vida; };
const abrir = (v: Vida, id: string): Vida => transacao(v, (x, r) => { const d = conteudoPorId(id); if (d?.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); }).vida;
const decidir = (v: Vida, opcaoId: string): Vida => executar(v, { tipo: 'decidir', opcaoId }).vida;

const bases = new Map<string, Vida>();
const pessoa = (municipioId: string, idade = 26): Vida => structuredClone(bases.get(`${municipioId}:${idade}`) ?? bases.set(`${municipioId}:${idade}`, adulto(idade, { municipioId, genero: 'masculino', semente: 21 })).get(`${municipioId}:${idade}`)!);

/** Um atleta profissional no clube dito, titular, com a técnica dita (o emprego de jogador junto). */
function atleta(o: { clube: string; cidade: string; nivel?: 1 | 2 | 3 | 4; tecnica: number; posicao?: CarreiraEsportiva['posicao']; mod?: CarreiraEsportiva['modalidade']; espaco?: 'titular' | 'reserva'; id?: string; base?: Vida }): Vida {
  const v = structuredClone(o.base ?? pessoa(o.cidade));
  if (o.id) v.id = o.id;
  const mod = o.mod ?? 'futebol';
  v.caminhos.frentes[mod] = { habilidade: o.tecnica, interesse: 70, meses: 200, auge: o.tecnica, tInicio: v.t - 200 } as never;
  v.corpo.forma = 75;
  v.caminhos.esporte = { modalidade: mod, fase: 'profissional', clube: o.clube, nivel: o.nivel ?? 4, tInicio: v.t - 72, tFase: v.t - 60, lesoes: 0, municipioId: o.cidade, reputacao: 55, espaco: o.espaco ?? 'titular', contratoAte: v.t + 36, posicao: mod === 'futebol' ? o.posicao ?? 'goleiro' : undefined, temporadas: [] };
  v.trabalho.atual = { ocupacaoId: mod === 'futebol' ? 'jogador_futebol' : mod === 'basquete' ? 'jogador_basquete' : 'atleta', empregador: `o ${o.clube}`, contrato: 'clt', salario: 30000, tInicio: v.t - 60, desempenho: 70, municipioId: o.cidade, carga: 'integral' };
  return v;
}

/** N temporadas do mesmo cenário (outra vida a cada uma: o mundo e o acaso mudam). */
function temporadas(n: number, o: Parameters<typeof atleta>[0], ajustar?: (v: Vida) => void): Temporada[] {
  const base = atleta(o);
  const out: Temporada[] = [];
  for (let k = 0; k < n; k++) {
    const v = structuredClone(base);
    v.id = `${o.clube}:${o.posicao ?? ''}:${o.espaco ?? ''}:${k}`;
    ajustar?.(v);
    out.push(transacao(v, x => fecharTemporada(x, criarRng(500 + k), x.caminhos.esporte!)).valor);
  }
  return out;
}
const media = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const corr = (a: number[], b: number[]) => { const ma = media(a), mb = media(b); let c = 0, va = 0, vb = 0; for (let i = 0; i < a.length; i++) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; } return c / Math.sqrt(va * vb || 1); };
const fracao = (ts: Temporada[], f: (t: Temporada) => boolean) => ts.filter(f).length / ts.length;

describe('ESP-11.1 · a colocação sai da tabela do país', () => {
  it('grande clube na elite: perto do topo, rebaixamento raro mas possível (e igual ao do mundo); o tradicional, pior', () => {
    const barca = temporadas(220, { clube: 'Barcelona', cidade: 'es:barcelona', tecnica: 89 });
    expect(media(barca.map(t => t.colocacao))).toBeLessThanOrEqual(5.5);
    expect(fracao(barca, t => t.colocacao >= 17)).toBeLessThanOrEqual(0.04);
    expect(fracao(barca, t => t.colocacao === 1)).toBeGreaterThanOrEqual(0.12);
    // No Brasil, o catálogo põe 15 grandes nas 20 vagas da elite: um grande é, em média, um clube do meio de cima — e cai
    // na mesma proporção que os outros grandes do mundo caem (a régua é uma só).
    const cruzeiro = temporadas(220, { clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 89 });
    const america = temporadas(220, { clube: 'América Mineiro', cidade: 'belo-horizonte-mg', tecnica: 89 });
    expect(media(cruzeiro.map(t => t.colocacao))).toBeLessThanOrEqual(9.8);
    expect(fracao(cruzeiro, t => t.colocacao >= 17)).toBeLessThanOrEqual(0.13);
    expect(fracao(cruzeiro, t => t.colocacao >= 17)).toBeGreaterThan(0);
    expect(media(america.map(t => t.colocacao))).toBeGreaterThan(media(cruzeiro.map(t => t.colocacao)) + 3);
  });

  it('a colocação lida antes é a que a temporada grava na tabela (o mesmo sorteio do país)', () => {
    const v = atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 89 });
    const w = transacao(v, (x, r) => {
      const e = x.caminhos.esporte!;
      const t = fecharTemporada(x, r, e);
      const de_novo = colocacaoNaTabela(x, 'BR', t.ano, e.clube, e.nivel, 0, 0);
      registrarTemporada(x, r, e, t);
      return { t, de_novo, campeao: ligaDe(x, 'BR').ultima?.campeoes[4] };
    }).valor;
    expect(w.t.pais).toBe('BR');
    expect(w.t.competicaoId).toBe('liga:BR:4');
    if (w.t.colocacao === 1) expect(w.campeao).toBe('Cruzeiro');
    else expect(w.campeao).not.toBe('Cruzeiro');
    expect(w.de_novo).toBeGreaterThanOrEqual(1);
  });

  it('quem joga pesa: o titular de técnica alta melhora a colocação do time; o reserva, quase nada', () => {
    const tit = temporadas(200, { clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 95, posicao: 'meia' });
    const res = temporadas(200, { clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 95, posicao: 'meia', espaco: 'reserva' });
    expect(media(res.map(t => t.colocacao)) - media(tit.map(t => t.colocacao))).toBeGreaterThanOrEqual(1.2);
  });

  it('o goleiro: jogos sem sofrer gol saem dos gols que o time sofre com ele em campo', () => {
    const ts = temporadas(220, { clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 89 });
    for (const t of ts) {
      expect(t.semSofrerGol).toBeDefined();
      expect(t.defesa).toBeUndefined();
      expect(t.semSofrerGol!).toBeLessThanOrEqual(t.titular + t.partidas);
      expect(t.golsSofridos!).toBeGreaterThanOrEqual(0);
    }
    expect(corr(ts.map(t => t.semSofrerGol!), ts.map(t => t.golsSofridos! / Math.max(1, t.titular)))).toBeLessThanOrEqual(-0.6);
    expect(corr(ts.map(t => t.semSofrerGol!), ts.map(t => t.colocacao))).toBeLessThanOrEqual(-0.55);
    // Doze jogos sem sofrer gol na zona de rebaixamento: quase impossível.
    expect(fracao(ts, t => t.colocacao >= 17 && t.semSofrerGol! >= 12)).toBeLessThanOrEqual(0.01);
    // A leitura da temporada diz os dois números.
    const v = atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 89 });
    expect(linhaDaTemporada(v, ts[0], 'futebol')).toMatch(/sem sofrer gol · \d+ gols? sofridos?/);
    expect(semSofrerGolDe({ ...ts[0], semSofrerGol: undefined, defesa: 7 })).toBe(7);
  });

  it('basquete e vôlei: a equipe fora do catálogo joga com a força média da divisão (não cai dois terços das vezes)', () => {
    for (const mod of ['basquete', 'volei'] as const) {
      const ts = temporadas(200, { clube: `equipe de ${mod} de São Paulo`, cidade: 'sao-paulo-sp', tecnica: 82 + 4, mod });
      expect(fracao(ts, t => t.colocacao >= 17)).toBeLessThanOrEqual(0.15);
      expect(media(ts.map(t => t.colocacao))).toBeGreaterThanOrEqual(7);
      expect(media(ts.map(t => t.colocacao))).toBeLessThanOrEqual(12);
    }
  });
});

describe('ESP-11.2 · os atributos da posição entram na nota e na produção', () => {
  it('o mesmo goleiro, o mesmo dia: com reflexo e posicionamento treinados, nota maior e menos gols sofridos', () => {
    const v = atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 88 });
    const melhor = structuredClone(v);
    melhor.caminhos.esporte!.atributos = { reflexos: 8, posicionamento: 8, saidas: 6, pes: 4 };
    const t0 = transacao(v, x => fecharTemporada(x, criarRng(9), x.caminhos.esporte!)).valor;
    const t1 = transacao(melhor, x => fecharTemporada(x, criarRng(9), x.caminhos.esporte!)).valor;
    expect(t1.nota).toBeGreaterThan(t0.nota);
    expect(t1.golsSofridos!).toBeLessThanOrEqual(t0.golsSofridos!);
    expect(t1.semSofrerGol!).toBeGreaterThanOrEqual(t0.semSofrerGol!);
    // O atacante: a finalização vira gols.
    const a = atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 88, posicao: 'atacante' });
    const af = structuredClone(a);
    af.caminhos.esporte!.atributos = { finalizacao: 10 };
    const g0 = transacao(a, x => fecharTemporada(x, criarRng(4), x.caminhos.esporte!)).valor.gols;
    const g1 = transacao(af, x => fecharTemporada(x, criarRng(4), x.caminhos.esporte!)).valor.gols;
    expect(g1).toBeGreaterThan(g0);
  });

  it('cada posição tem os seus atributos; o treino da função sobe os dela; save antigo: derivados da técnica', () => {
    const v = atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 88 });
    const e = v.caminhos.esporte!;
    expect(perfilDeAtributos(v, e, 88, 'goleiro').map(x => x.id)).toEqual(['reflexos', 'posicionamento', 'saidas', 'pes']);
    expect(perfilDeAtributos(v, e, 88, 'zagueiro').map(x => x.id)).toEqual(['marcacao', 'antecipacao', 'aereo']);
    expect(perfilDeAtributos(v, e, 88, 'meia').map(x => x.id)).toEqual(['passe', 'visao', 'resistencia']);
    expect(perfilDeAtributos(v, e, 88, 'atacante').map(x => x.id)).toEqual(['finalizacao', 'movimentacao', 'velocidade']);
    for (const x of perfilDeAtributos(v, e, 88, 'goleiro')) expect(Math.abs(x.valor - 88)).toBeLessThanOrEqual(4);
    const g = verbosDoOficio(v).find(x => x.oque === 'treino_finalizacao')!;
    expect(g.rotulo).toMatch(/goleiro/i);
    const w = transacao(v, (x, r) => { executarOficio(x, r, 'treino_finalizacao'); }).vida;
    expect(w.caminhos.esporte!.atributos?.reflexos ?? 0).toBeGreaterThan(0);
    // Saves de antes (sem atributos guardados) abrem iguais.
    expect(recarregar(v).caminhos.esporte!.atributos).toBeUndefined();
  });
});

describe('ESP-11.3/11.4 · competições com fases, nomes por país e id estável', () => {
  it('a copa nacional e a continental de cada país têm o nome certo (e o genérico onde não é inequívoco)', () => {
    expect(nomeDaCompeticao('copa:BR')).toBe('Copa do Brasil');
    expect(nomeDaCompeticao('copa:ES')).toBe('Copa del Rey');
    expect(nomeDaCompeticao('copa:IT')).toBe('Coppa Italia');
    expect(nomeDaCompeticao('copa:KE')).toBe('copa nacional');
    expect(nomeDaCompeticao('cont:CONMEBOL')).toBe('Copa Libertadores');
    expect(nomeDaCompeticao('cont:UEFA')).toBe('Champions League');
    expect(nomeDaCompeticao('cont:AFC')).toMatch(/copa continental de clubes/);
    expect(nomeDaCompeticao('liga:IT:2')).toBe('Serie C');
    expect(nomeDaCompeticao(idDaSelecao('mundial'))).toBe('Copa do Mundo');
    expect(aCompeticaoId('sel:UEFA')).toBe('a Eurocopa');
    expect(aCompeticaoId('sel:CONMEBOL')).toBe('a Copa América');
  });

  it('a copa nacional é jogada fase a fase; a vaga continental vem da tabela da elite do ano anterior', () => {
    const v = atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 89 });
    const fases = new Set<string>();
    for (let k = 0; k < 40; k++) {
      const w = structuredClone(v); w.id = `copa${k}`;
      const c = transacao(w, x => copaNacional(x, 'BR', 2050, 'Cruzeiro', 4, 0)).valor!;
      expect(c.id).toBe('copa:BR');
      expect(c.jogos).toBe(c.v + c.e + c.d);
      fases.add(c.fase);
    }
    expect(fases.size).toBeGreaterThanOrEqual(3);
    // Uma temporada nas vagas da elite → a continental no ano seguinte (e só então).
    let x = v;
    x = transacao(x, (y, r) => { const e = y.caminhos.esporte!; const t = fecharTemporada(y, r, e); t.colocacao = 2; registrarTemporada(y, r, e, t); }).vida;
    const ano = ligaDe(x, 'BR').ultima!.ano + 1;
    expect(classificadoParaContinental(x, 'BR', ano, 'Cruzeiro')).toBe(true);
    const cont = transacao(x, y => copaContinental(y, 'BR', ano, 'Cruzeiro', 0)).valor!;
    expect(cont.id).toBe('cont:CONMEBOL');
    expect(['primeira fase', 'oitavas', 'quartas', 'semifinal', 'vice', 'campeão']).toContain(cont.fase);
    const fora = Object.entries(ligaDe(x, 'BR').div).find(([, n]) => n === 2)![0];
    expect(transacao(x, y => copaContinental(y, 'BR', ano, fora, 0)).valor).toBeUndefined();
    // A temporada seguinte guarda as copas que jogou.
    const t2 = transacao(x, (y, r) => { y.t += 12; return fecharTemporada(y, r, y.caminhos.esporte!); }).valor;
    expect((t2.copas ?? []).map(c => c.id)).toEqual(expect.arrayContaining(['copa:BR', 'cont:CONMEBOL']));
  });

  it('o título de copa entra no palmarés com o id da competição e um id de troféu', () => {
    let achou = false;
    for (let k = 0; k < 120 && !achou; k++) {
      const v = atleta({ clube: 'Barcelona', cidade: 'es:barcelona', tecnica: 92, posicao: 'meia', id: `trofeu${k}` });
      const w = transacao(v, (x, r) => { const e = x.caminhos.esporte!; const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); return t; });
      if (w.valor.copas?.some(c => c.fase === 'campeão')) {
        const c = (w.vida.caminhos.palmares ?? []).find(p => p.competicaoId === 'copa:ES' && p.tipo === 'titulo')!;
        expect(c).toBeDefined();
        expect(c.texto).toMatch(/Copa del Rey/);
        expect(c.trofeuId).toBe(`copa:ES:${w.valor.ano}:barcelona`);
        achou = true;
      }
    }
    expect(achou).toBe(true);
  });

  it('o torneio de seleções usa a força do país: o Brasil ganha muito mais que um país pequeno', () => {
    let br = 0, pequeno = 0;
    for (let k = 0; k < 400; k++) {
      if (campanhaDaSelecao(criarRng(k), 'sel:mundial', 'BR', 0).fase === 'campeão') br++;
      if (campanhaDaSelecao(criarRng(k), 'sel:mundial', 'DO', 0).fase === 'campeão') pequeno++;
    }
    expect(br).toBeGreaterThanOrEqual(3 * Math.max(1, pequeno));
    const c = campanhaDaSelecao(criarRng(3), 'sel:mundial', 'BR', 0);
    expect(c.jogos).toBe(c.v + c.e + c.d);
  });
});

/** Uma proposta concreta de um clube (o que se viu é o que se assina). */
const propostaDe = (v: Vida, clube: string, pais: string, luvas: number): PropostaDeClube => {
  const c = clubePorNome(clube, pais)!;
  return { id: `p${clube}`, clube, municipioId: c.cidade, nivel: 4, meses: 36, salario: 90000, salarioTitular: 90000, espaco: 'titular', t: v.t, validaAte: v.t + 11, origem: 'mercado', taxa: 2_000_000, luvas };
};
function aceitar(v: Vida, clube: string, pais: string, luvas: number): Vida {
  v = transacao(v, x => { x.caminhos.esporte!.proposta = propostaDe(x, clube, pais, luvas); x.fatos['esp_proposta_hoje'] = x.t; }).vida;
  v = abrir(v, 'esp_proposta');
  return decidir(v, 'aceitar');
}
const temporadaNoClube = (v: Vida): Vida => transacao(v, (x, r) => { const e = x.caminhos.esporte!; const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); x.t += 12; }).vida;

describe('ESP-11.5 · Brasil → Espanha → Itália → Brasil', () => {
  it('cada temporada mostra a liga do país em que foi jogada; luvas sem perda cambial; euro → euro é o mesmo euro', () => {
    let v = atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 92, posicao: 'meia', id: 'cadeia' });
    v = temporadaNoClube(v);
    // Luvas: a mesma mudança com e sem luvas — a diferença na conta é exatamente o valor das luvas (na moeda de lá).
    const semLuvas = aceitar(structuredClone(v), 'Barcelona', 'ES', 0);
    v = aceitar(v, 'Barcelona', 'ES', 50_000);
    expect(v.caminhos.esporte!.clube).toBe('Barcelona');
    expect(v.moradia.municipioId.startsWith('es:')).toBe(true);
    expect(Math.abs((v.financas.conta - semLuvas.financas.conta) - 50_000)).toBeLessThanOrEqual(1);
    v = temporadaNoClube(v);
    // Espanha → Itália: a proposta diz "a mesma moeda", sem "(uns … daqui)"; a remessa não é cobrada.
    v = transacao(v, x => { x.caminhos.esporte!.proposta = propostaDe(x, 'Juventus', 'IT', 40_000); x.fatos['esp_proposta_hoje'] = x.t; }).vida;
    v = abrir(v, 'esp_proposta');
    const op = (conteudoPorId('esp_proposta') as { opcoes: { id: string; consequencia?: (c: ReturnType<typeof contexto>) => string | undefined }[] }).opcoes.find(o => o.id === 'aceitar')!;
    const txt = transacao(v, (x, r) => op.consequencia?.(contexto(x, r)) ?? '').valor;
    expect(txt).toMatch(/a mesma moeda/);
    expect(txt).not.toMatch(/outra moeda|daqui\)/);
    const semLuvasIT = decidir(transacao(v, x => { x.caminhos.esporte!.proposta!.luvas = 0; }).vida, 'aceitar');
    v = decidir(v, 'aceitar');
    expect(v.caminhos.esporte!.clube).toBe('Juventus');
    expect(Math.abs((v.financas.conta - semLuvasIT.financas.conta) - 40_000)).toBeLessThanOrEqual(1);
    v = temporadaNoClube(v);
    v = aceitar(v, 'Cruzeiro', 'BR', 30_000);
    v = temporadaNoClube(v);
    const ts = v.caminhos.esporte!.temporadas!;
    const linhas = ts.map(t => `${t.clube}: ${linhaDaTemporada(v, t).split(' · ')[0]}`);
    expect(linhas).toEqual(['Cruzeiro: Série A', 'Barcelona: Primera División', 'Juventus: Serie A', 'Cruzeiro: Série A']);
    expect(ts.map(t => t.pais)).toEqual(['BR', 'ES', 'IT', 'BR']);
    // A taxa guarda o país do comprador (a moeda em que foi paga).
    expect(v.caminhos.esporte!.transferencias!.map(x => x.pais)).toEqual(['ES', 'IT', 'BR']);
    // Salvar e abrir não muda a liga das temporadas.
    expect(recarregar(v).caminhos.esporte!.temporadas!.map(t => linhaDaTemporada(v, t).split(' · ')[0])).toEqual(['Série A', 'Primera División', 'Serie A', 'Série A']);
  });

  it('converterEntrePaises: a mesma moeda é identidade exata; moedas diferentes atravessam o câmbio', () => {
    for (const [a, b] of [['ES', 'IT'], ['IT', 'ES'], ['ES', 'DE'], ['PT', 'FR']]) {
      const x = converterEntrePaises(1000, a, b);
      expect(formatarDinheiro(x, b)).toBe(formatarDinheiro(1000, a));
    }
    expect(formatarDinheiro(converterEntrePaises(1000, 'BR', 'GB'), 'GB')).not.toBe(formatarDinheiro(1000, 'BR'));
    expect(converterEntrePaises(1000, 'BR', 'BR')).toBe(1000);
  });

  it('save antigo: a temporada sem país ganha o do clube (a liga certa no histórico)', () => {
    const v = atleta({ clube: 'Barcelona', cidade: 'es:barcelona', tecnica: 90 });
    const e = v.caminhos.esporte!;
    e.temporadas = [{ ano: 2040, clube: 'Cruzeiro', nivel: 4, posicao: 'goleiro', partidas: 30, titular: 30, gols: 0, assistencias: 0, defesa: 9, nota: 6.5, colocacao: 5, mesesFora: 0 }, { ano: 2041, clube: 'Barcelona', nivel: 4, posicao: 'goleiro', partidas: 30, titular: 30, gols: 0, assistencias: 0, defesa: 11, nota: 6.8, colocacao: 3, mesesFora: 0 }];
    const w = recarregar(v);
    expect(w.caminhos.esporte!.temporadas!.map(t => t.pais)).toEqual(['BR', 'ES']);
    expect(linhaDaTemporada(w, w.caminhos.esporte!.temporadas![0]).split(' · ')[0]).toBe('Série A');
    expect(linhaDaTemporada(w, w.caminhos.esporte!.temporadas![0])).toMatch(/9 sem sofrer gol/);
  });
});

describe('ESP-11.6 · os momentos entram na temporada em curso', () => {
  it('o gol do momento soma na temporada seguinte e nos totais (nunca na temporada já fechada e premiada)', () => {
    let v = atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 90, posicao: 'atacante' });
    v = temporadaNoClube(v);
    const fechada = structuredClone(v.caminhos.esporte!.temporadas!.slice(-1)[0]);
    v = transacao(v, x => { x.caminhos.esporte!.lances = { gols: 2, assistencias: 1 }; }).vida;
    expect(v.caminhos.esporte!.temporadas!.slice(-1)[0]).toEqual(fechada);
    const semLance = transacao(v, x => { x.caminhos.esporte!.lances = undefined; }).vida;
    const a = transacao(v, (x, r) => fecharTemporada(x, criarRng(7), x.caminhos.esporte!)).vida;
    const b = transacao(semLance, (x, r) => fecharTemporada(x, criarRng(7), x.caminhos.esporte!)).vida;
    const ta = a.caminhos.esporte!.temporadas!.slice(-1)[0], tb = b.caminhos.esporte!.temporadas!.slice(-1)[0];
    expect(ta.gols - tb.gols).toBe(2);
    expect(a.caminhos.esporte!.totais!.gols - b.caminhos.esporte!.totais!.gols).toBe(2);
    expect(a.caminhos.esporte!.lances).toBeUndefined();
    // Invariante: a soma das temporadas é o total da carreira.
    const e = a.caminhos.esporte!;
    expect(e.temporadas!.reduce((s, t) => s + t.gols, 0)).toBe(e.totais!.gols);
  });
});

describe('sem clube · o atleta sem contrato continua atleta', () => {
  function semClube(): Vida {
    const v = atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 70, posicao: 'meia', id: 'semclube' });
    return transacao(v, (x, r) => { const e = x.caminhos.esporte!; e.reputacao = 5; e.temporadas = [{ ano: 2040, clube: 'Cruzeiro', nivel: 4, posicao: 'meia', partidas: 4, titular: 0, gols: 0, assistencias: 0, nota: 3, colocacao: 12, mesesFora: 0 }]; e.contratoAte = x.t - 13; processarEsporte(x, r); }).vida;
  }

  it('o contrato venceu e ninguém renovou: modo atleta, "sem clube", o último clube guardado — e nenhum clube atual falso', () => {
    const v = semClube();
    const e = v.caminhos.esporte!;
    expect(v.trabalho.atual).toBeUndefined();
    expect(e.fase).toBe('profissional');
    expect(modoDoTrabalho(v)).toBe('atleta');
    expect(clubeAtual(v, e)).toBeUndefined();
    expect(ultimoClubeDe(e)?.clube).toBe('Cruzeiro');
    const l = leituraDoTrabalho(v);
    expect(l.titulo).toMatch(/sem clube/);
    expect(l.titulo).not.toMatch(/Sem trabalho|Procurando/);
    const a = acoesDoTrabalho(v, disponibilidade);
    const todas = [...a.agora, ...a.mais, ...a.saidas];
    expect(todas.some(x => x.id === 'procurar_clube')).toBe(true);
    expect(todas.some(x => x.id === 'pendurar')).toBe(true);
    expect(todas.some(x => /bicos|concursos/i.test(x.rotulo))).toBe(false);
    // Encerrar a carreira sem clube: a decisão abre e a carreira acaba com biografia.
    const fim = executar(v, { tipo: 'profissao', oque: 'pendurar' } as never).vida;
    const fim2 = decidir(fim, 'encerrar');
    expect(fim2.caminhos.esporte!.fase).toBe('encerrada');
  });

  it('aceitar outro trabalho estando sem clube encerra a carreira COM biografia (e o "sem clube" se resolve)', () => {
    let v = semClube();
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('garcom')); x.t += 12; processarEsporte(x, r); }).vida;
    const e = v.caminhos.esporte!;
    expect(e.fase).toBe('encerrada');
    expect(e.motivoFim).toBe('escolha');
    expect(v.fatos['esp_sem_clube']).toBeUndefined();
    expect(v.biografia.some(b => /Pendurou as chuteiras|Encerrou a carreira/.test(b.texto))).toBe(true);
  });

  it('a renovação é perguntada sempre que o contrato venceu (não só no mês em que o ano marcou)', () => {
    const v = atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 88 });
    const d = conteudoPorId('esp_renovacao')!;
    const venceu = transacao(v, (x, r) => { x.caminhos.esporte!.contratoAte = x.t - 3; return d.quando!(contexto(x, r)); }).valor;
    const vale = transacao(v, (x, r) => { x.caminhos.esporte!.contratoAte = x.t + 10; return d.quando!(contexto(x, r)); }).valor;
    expect(venceu).toBe(true);
    expect(vale).toBe(false);
  });

  it('ficar sem clube e voltar: o último clube sai ao assinar', () => {
    const v = transacao(atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 88 }), x => { ficarSemClube(x, x.caminhos.esporte!); }).vida;
    expect(v.caminhos.esporte!.ultimoClube?.clube).toBe('Cruzeiro');
    expect(recarregar(v).caminhos.esporte!.ultimoClube?.clube).toBe('Cruzeiro');
  });
});

describe('ESP-11.7 · a comissão técnica', () => {
  function exJogador(): Vida {
    const v = atleta({ clube: 'Cruzeiro', cidade: 'belo-horizonte-mg', tecnica: 86, posicao: 'meia', base: pessoa('belo-horizonte-mg', 36) });
    return transacao(v, (x, r) => { const e = x.caminhos.esporte!; e.reputacao = 70; for (let k = 0; k < 3; k++) fecharTemporada(x, r, e); e.reputacao = 70; encerrarCarreira(x, e, 'escolha'); x.trabalho.experiencia['treino'] = 36; }).vida;
  }

  it('o auxiliar trabalha num clube concreto (o último clube de quem jogou, se fica perto) — não "um clube"', () => {
    const v = transacao(exJogador(), (x, r) => { contratar(x, r, ocupacao('auxiliar_tecnico')); }).vida;
    const e = v.trabalho.atual!;
    expect(e.clube).toBe('Cruzeiro');
    expect(e.empregador).toBe('o Cruzeiro');
    expect(e.municipioId).toBe(clubePorNome('Cruzeiro', 'BR')!.cidade);
    expect(e.empregador).not.toMatch(/um clube|uma equipe profissional/);
  });

  it('promovido a técnico, o comando é no mesmo clube, sem mudança de cidade', () => {
    let v = transacao(exJogador(), (x, r) => { contratar(x, r, ocupacao('auxiliar_tecnico')); }).vida;
    const casa = v.moradia.municipioId;
    v = transacao(v, (x, r) => { const e = x.trabalho.atual!; e.postos = [{ ocupacaoId: 'auxiliar_tecnico', t: e.tInicio }] as never; e.ocupacaoId = 'tecnico_futebol'; processarTecnico(x, r); }).vida;
    expect(passagemAtual(v)?.clube).toBe('Cruzeiro');
    expect(v.moradia.municipioId).toBe(casa);
  });

  it('sem clube concreto (um save antigo), o comando vira proposta — a vida não muda de cidade sem perguntar', () => {
    let v = transacao(exJogador(), (x, r) => { contratar(x, r, ocupacao('auxiliar_tecnico')); }).vida;
    const casa = v.moradia.municipioId;
    v = transacao(v, (x, r) => { const e = x.trabalho.atual!; e.clube = undefined; e.empregador = 'um clube'; e.ocupacaoId = 'tecnico_futebol'; processarTecnico(x, r); }).vida;
    // Ou um clube da própria cidade (assume, sem mudança), ou uma proposta (a vida não muda de cidade sem a resposta).
    expect(v.moradia.municipioId).toBe(casa);
    const p = passagemAtual(v);
    if (p) expect(p.municipioId).toBe(casa);
    else {
      expect(v.caminhos.tecnico?.proposta).toBeDefined();
      expect(v.trabalho.atual?.ocupacaoId).toBe('auxiliar_tecnico');
      expect(conteudoPorId('tec_proposta')!.quando!(transacao(v, (x, r) => contexto(x, r)).valor)).toBe(true);
    }
  });

  it('o técnico no comando não vê ações de empresa — vê as do banco (licença, análise, elenco, diretoria)', () => {
    let v = transacao(exJogador(), (x, r) => { contratar(x, r, ocupacao('tecnico_futebol')); processarTecnico(x, r); }).vida;
    expect(passagemAtual(v)).toBeDefined();
    expect(modoDoTrabalho(v)).toBe('tecnico');
    const a = acoesDoTrabalho(v, disponibilidade);
    const rotulos = [...a.agora, ...a.mais, ...a.saidas].map(x => x.rotulo).join(' | ');
    expect(rotulos).not.toMatch(/chefia|empresa|horas extras|aumento|promoção|Reduzir a jornada/i);
    expect(rotulos).toMatch(/licença/);
    expect(rotulos).toMatch(/análise tática/);
    expect(verbosDoOficio(v).map(x => x.oque)).not.toEqual(expect.arrayContaining(['chefia', 'capacitacao']));
    // "A empresa pagou um curso" não cabe.
    const curso = conteudoPorId('car_curso_empresa')!;
    expect(transacao(v, (x, r) => curso.quando!(contexto(x, criarRng(1)))).valor).toBe(false);
    // A licença: paga, cursa, conclui — e pesa no trabalho do técnico.
    const antes = transacao(v, x => trabalhoDoTecnico(x)).valor;
    v = transacao(v, x => { x.financas.conta = 1e6; }).vida;
    v = executar(v, { tipo: 'profissao', oque: 'banco', valor: 'licenca' } as never).vida;
    expect(v.caminhos.licencaDeTreinador?.emCurso?.nivel).toBe(1);
    v = transacao(v, x => { x.t += 12; avancarLicenca(x); }).vida;
    expect(nivelDaLicenca(v)).toBe(1);
    expect(transacao(v, x => trabalhoDoTecnico(x)).valor).toBeGreaterThan(antes);
    // A análise tática no comando prepara a próxima temporada.
    v = executar(v, { tipo: 'profissao', oque: 'banco', valor: 'analise' } as never).vida;
    expect(v.fatos[`banco:analise:${Math.floor(v.t / 12)}`]).toBeDefined();
  });

  it('o ex-jogador começa com o vestiário a favor — não com mais vitórias garantidas', () => {
    const ex = transacao(exJogador(), (x, r) => { contratar(x, r, ocupacao('tecnico_futebol')); processarTecnico(x, r); }).vida;
    const p = ex.caminhos.tecnico!.passagens[0];
    expect(p.vestiario).toBeGreaterThan(55);
  });
});

describe('ESP-11.8 · a copa do técnico fora do Brasil', () => {
  function tecnicoNaItalia(clube: string, nivel: 2 | 3 | 4, id: string): Vida {
    const c = clubePorNome(clube, 'IT')!;
    const v = structuredClone(pessoa(c.cidade, 42));
    v.id = id;
    return transacao(v, x => {
      x.caminhos.tecnico = { tInicio: x.t - 60, origem: 'convite', reputacao: 45, passagens: [{ clube, municipioId: c.cidade, nivel, desde: x.t - 24, contratoAte: x.t + 36, salario: 20000, temporadas: [], pressao: 20, vestiario: 55 }] };
      x.trabalho.atual = { ocupacaoId: 'tecnico_futebol', empregador: `o ${clube}`, clube, contrato: 'clt', salario: 20000, tInicio: x.t - 24, desempenho: 60, municipioId: c.cidade, carga: 'integral' };
    }).vida;
  }

  it('o Sassuolo na Serie C: copa com todos os clubes do país, título raríssimo; o nome é o da Itália (nunca "estadual")', () => {
    let titulos = 0, finais = 0;
    const N = 160;
    for (let k = 0; k < N; k++) {
      const v = tecnicoNaItalia('Sassuolo', 2, `sassuolo${k}`);
      transacao(v, (x, r) => {
        processarTecnico(x, r);
        const p = passagemAtual(x);
        const t = p?.temporadas.slice(-1)[0];
        if (t) { expect(t.estadual).toBeUndefined(); expect(t.copa?.id).toBe('copa:IT'); }
        if (p?.decisao) {
          finais++;
          expect(p.decisao.competicao).toBe('Coppa Italia');
          if (decidirFinal(x, r, 'neutro')?.venceu) titulos++;
        }
      });
    }
    expect(titulos / N).toBeLessThanOrEqual(0.04);
    expect(finais / N).toBeLessThanOrEqual(0.1);
  });

  it('a final do momento: o texto do desfecho conta o placar que o motor jogou (sem lance inventado)', () => {
    const v = tecnicoNaItalia('Juventus', 4, 'juve');
    const w = transacao(v, (x, r) => {
      const p = passagemAtual(x)!;
      p.temporadas.push({ ano: 2050, nivel: 4, jogos: 0, v: 0, e: 0, d: 0, copa: { id: 'copa:IT', fase: 'vice' } });
      p.decisao = { competicao: 'Coppa Italia', adversario: 'Milan', forca: 0.5, ano: 2050, t: x.t, unica: true };
      return decidirFinal(x, r, 'bom');
    }).valor!;
    expect(w.venceu).toBe(true);
    expect(w.unica).toBe(true);
    expect(w.placar).toMatch(/^Jogo único: \d+ a \d+/);
    const [a, b] = w.placar.match(/(\d+) a (\d+)/)!.slice(1).map(Number);
    expect(a > b || w.placar.includes('pênaltis')).toBe(true);
    // O modelo do momento não afirma detalhe que o motor não gerou.
    const m = JSON.stringify(conteudoPorId('car_situacao') ?? {});
    expect(m).not.toMatch(/bola parada/);
  });
});

void habilidade;
