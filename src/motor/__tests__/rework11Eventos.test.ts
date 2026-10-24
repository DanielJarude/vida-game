/**
 * REWORK 11 · Fase F — eventos e memória.
 *
 *   CAR-11.9  momentos da carreira: o ano ocupado adia (não apaga) a cena; as cenas que lembram leem dados reais; a lista
 *             agrupa por carreira (decisões, consequências, marcos); Caminhos mostra todos os desfechos.
 *   EVT-11.1  memória entre vidas: o recomeço registra o que se viu; `vistosDaVida` não perde a infância.
 *   EVT-11.7  premissas: o sonho realizado não recebe o texto do sonho abandonado; os ecos checam o que veio depois.
 *   NPC-11.1  vínculos: o companheiro de clube é colega de equipe, não "do trabalho"; a base é "na base".
 *   NPC-11.2  quem morreu deixa de ser citado como vivo pelos registros em curso.
 */
import { describe, expect, it } from 'vitest';
import { adulto, pessoaNova } from './cenarios';
import { idade, transacao } from '../nucleo';
import { anoDe } from '../tempo';
import { criarRng } from '../rng';
import type { Vida } from '../tipos';
import { avancarAno } from '../ano';
import { executar } from '../acoes';
import { criarVida } from '../criacao';
import { garantirFrente } from '../sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../sistemas/esporte';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { txt } from '../conteudo/base';
import { vincular } from '../pessoas';
import { registrarEco } from '../sistemas/ecos';
import { destinoDoSonho, premissaVale } from '../sistemas/premissas';
import { candidatosDoAno, modeloDaSituacao, momentosPorCarreira, processarSituacoes, situacaoAberta, textoDaSituacao } from '../sistemas/situacoes';
import { trajetoriasDaVida } from '../sistemas/legado';
import { lerEstatisticas, memoriaDasUltimasVidas, registrarVidaPassada, registrarVidaRecomecada, vistosDaVida, type Armazenamento } from '../save';
import { colegaDeEquipe, descricaoOrigem } from '../sistemas/social';
import { rotuloDe } from '../../ui/apresentar';
import { citadosEmRegistrosVivos, esquecerMorto, pessoaCitavel } from '../sistemas/citacoes';
import { processarDistantes } from '../sistemas/indiretos';

const PREFS = ['aceitar', 'renovar', 'assinar', 'continuar', 'seguir', 'ficar'];

/** Um atleta que entra no profissional aos 18 e vive `anos` anos de carreira, respondendo a tudo (as cenas pela 1ª intenção). */
function carreiraDeFutebol(semente: number, anos: number): Vida {
  let v = criarVida({ nome: 'Teste', sobrenome: 'Silva', genero: semente % 2 ? 'feminino' : 'masculino', municipioId: 'recife-pe', semente });
  const responder = () => { for (let j = 0; j < 12 && v.momento && !v.morte; j++) { const m = v.momento; const ls = m.opcoes.filter(o => !o.bloqueio); const p = m.situacaoId !== 'car_situacao' ? PREFS.map(id => ls.find(o => o.id === id)).find(Boolean) : undefined; v = executar(v, { tipo: 'decidir', opcaoId: (p ?? ls[0] ?? m.opcoes[0]).id }).vida; } };
  for (let k = 0; k < 18 && !v.morte; k++) { v = avancarAno(v).vida; responder(); }
  v = transacao(v, (x, r) => {
    garantirFrente(x, 'futebol');
    Object.assign(x.caminhos.frentes.futebol!, { habilidade: 90, interesse: 95, meses: 160, auge: 92 });
    x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = [];
    x.financas.conta += 100000;
    entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport');
    profissionalizar(x, r, 3);
    x.momento = null;
  }).vida;
  for (let k = 0; k < anos && !v.morte; k++) { v = avancarAno(v).vida; responder(); }
  return v;
}

describe('CAR-11.9 · momentos da carreira', () => {
  it('futebol, ~20 temporadas: ≥ 15 momentos registrados e visíveis na carreira (decisões, consequências e marcos)', () => {
    let longas = 0;
    for (const s of [31, 47, 83]) {
      const v = carreiraDeFutebol(s, 21);
      const temporadas = v.caminhos.esporte?.totais?.temporadas ?? v.caminhos.esporte?.temporadas?.length ?? 0;
      const g = momentosPorCarreira(v).find(x => x.trajetoria === 'futebol');
      if (temporadas < 16) continue;
      longas++;
      expect(g, `semente ${s}`).toBeDefined();
      expect(g!.itens.length, `semente ${s}: ${temporadas} temporadas`).toBeGreaterThanOrEqual(15);
      // As três naturezas aparecem separadas: marcos (o motor registrou), decisões vividas.
      expect(g!.itens.some(i => i.tipo === 'marco')).toBe(true);
      expect(g!.itens.some(i => i.tipo === 'decisao')).toBe(true);
      // Caminhos: o bloco "Momentos" mostra o que foi vivido, não só o ótimo e o péssimo.
      const tr = trajetoriasDaVida(v).find(t => t.area === 'esporte' && /profissional/.test(t.titulo));
      const registrados = (v.caminhos.situacoes ?? []).filter(x => x.trajetoria === 'futebol').length;
      expect(tr?.detalhe.find(d => d.titulo === 'Momentos')?.linhas.length ?? 0).toBeGreaterThanOrEqual(Math.min(registrados, 14));
    }
    expect(longas).toBeGreaterThanOrEqual(1);
  }, 400000);

  const jogador = (): Vida => transacao(adulto(26, { semente: 41, genero: 'masculino' }), (x, r) => {
    garantirFrente(x, 'futebol');
    Object.assign(x.caminhos.frentes.futebol!, { habilidade: 86, interesse: 90, meses: 160, auge: 86 });
    x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = []; x.educacao.matricula = undefined;
    entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport');
    profissionalizar(x, r, 3);
    x.caminhos.esporte!.espaco = 'titular';
    x.momento = null;
  }).vida;

  it('o ano da renovação não apaga o momento: ele é sorteado e espera o ano seguinte', () => {
    let achou = false;
    for (let s = 1; s <= 30 && !achou; s++) {
      // O sorteio do ano ocupado é derivado (da vida e do ano): cada ano, um sorteio.
      let v = transacao(jogador(), x => { x.t += s * 12; x.fatos['esp_renovacao'] = x.t; x.caminhos.situacoes = [{ id: 'fut_jornalista', t: x.t - 60, trajetoria: 'futebol', intencao: '—', desfecho: 'bom', texto: '—' }]; }).vida;
      v = transacao(v, x => processarSituacoes(x, criarRng(s))).vida;
      if (!v.caminhos.situacao) continue;
      achou = true;
      expect(v.caminhos.situacao.dados._ocupado).toBe(1);
      // Neste ano, a cena não abre (a renovação é a cena do ano)...
      expect(situacaoAberta(v)).toBeUndefined();
      // ... e no seguinte, sem renovação, ela volta.
      const id = v.caminhos.situacao.id;
      v = transacao(v, x => { x.t += 12; processarSituacoes(x, criarRng(s + 100)); }).vida;
      expect(v.caminhos.situacao?.id).toBe(id);
      expect(v.caminhos.situacao?.dados._adiada).toBe(1);
      expect(situacaoAberta(v)).toBeDefined();
    }
    expect(achou).toBe(true);
  });

  it('a cena que lembra lê o estado real: o ex-clube na mesma divisão, com as temporadas e os gols de lá', () => {
    const v = transacao(jogador(), x => {
      const es = x.caminhos.esporte!;
      const ano = anoDe(x.t);
      es.temporadas = [
        { ano: ano - 3, clube: 'Náutico', nivel: es.nivel, partidas: 30, titular: 25, gols: 9, assistencias: 3, nota: 7, colocacao: 5, mesesFora: 0 },
        { ano: ano - 2, clube: 'Náutico', nivel: es.nivel, partidas: 32, titular: 28, gols: 11, assistencias: 4, nota: 7.2, colocacao: 4, mesesFora: 0 },
        { ano: ano - 1, clube: es.clube, nivel: es.nivel, partidas: 30, titular: 26, gols: 8, assistencias: 5, nota: 7, colocacao: 6, mesesFora: 0 }
      ];
    }).vida;
    const c = candidatosDoAno(v, 'futebol').find(x => x.m.id === 'fut11_ex_clube');
    expect(c).toBeDefined();
    const m = modeloDaSituacao('fut11_ex_clube')!;
    expect(m.natureza).toBe('consequencia');
    const d = m.contexto!(v, criarRng(1));
    const texto = textoDaSituacao(v, m, d);
    expect(texto).toMatch(/Náutico/);
    expect(texto).toMatch(/2 temporadas/);
    expect(texto).toMatch(/20 gols/);
  });

  it('ex-jogador que virou técnico vê as duas carreiras, separadas, com todos os momentos de cada uma', () => {
    const v = transacao(adulto(40, { semente: 9 }), x => {
      x.caminhos.situacoes = [
        ...Array.from({ length: 6 }, (_, k) => ({ id: 'fut_jornalista', t: x.t - 200 + k * 12, trajetoria: 'futebol', intencao: 'Responder', desfecho: 'bom' as const, texto: `Jogo ${k}.` })),
        ...Array.from({ length: 8 }, (_, k) => ({ id: 'tec_crise', t: x.t - 90 + k * 12, trajetoria: 'tecnico', intencao: 'Mexer', desfecho: 'ruim' as const, texto: `Banco ${k}.` }))
      ];
    }).vida;
    const g = momentosPorCarreira(v);
    expect(g.find(x => x.trajetoria === 'futebol')?.itens.length).toBe(6);
    expect(g.find(x => x.trajetoria === 'tecnico')?.itens.length).toBe(8);
  });
});

describe('EVT-11.1 · memória entre vidas', () => {
  const gaveta = (): Armazenamento & { bruto: string | null } => ({ bruto: null, getItem() { return this.bruto; }, setItem(_k: string, x: string) { this.bruto = x; }, removeItem() { this.bruto = null; } });

  it('recomeçar registra o que a vida abandonada viu (só na memória: não conta como vida jogada)', () => {
    const s = gaveta();
    registrarVidaPassada({ id: 'a', nome: 'A', idadeMorte: 70, lugar: '', profissao: '', patrimonio: 0, causa: '', ano: 2000, vistos: ['x'] }, s);
    registrarVidaRecomecada(['bb_primeira_palavra', 'inf_passarinho'], s);
    const e = lerEstatisticas(s);
    expect(e.vidasJogadas).toBe(1);
    expect(memoriaDasUltimasVidas(e)).toEqual(expect.arrayContaining(['bb_primeira_palavra', 'inf_passarinho', 'x']));
    // A vida nova nasce com essa memória (é o que `useVida.nascer` passa à criação).
    const v = criarVida({ nome: 'B', sobrenome: 'C', genero: 'feminino', municipioId: 'recife-pe', semente: 5, memoria: memoriaDasUltimasVidas(e) });
    expect(v.memoriaDeVidas).toContain('inf_passarinho');
  });

  it('vistosDaVida não perde a infância numa vida com muitos ids', () => {
    const v = adulto(30, { semente: 3 });
    v.ocorrencias = [
      { id: 'bb_primeira_palavra', t: 24, idade: 2 }, { id: 'inf_passarinho', t: 90, idade: 7 },
      ...Array.from({ length: 260 }, (_, k) => ({ id: `adulto_${k}`, t: 200 + k, idade: 20 }))
    ];
    const vs = vistosDaVida(v);
    expect(vs.length).toBeLessThanOrEqual(200);
    expect(vs).toContain('bb_primeira_palavra');
    expect(vs).toContain('inf_passarinho');
    expect(vs).toContain('adulto_259');
  });

  it('a infância nova (contextualizada) não gasta o gerador do ano e só aparece no lugar certo', () => {
    const c = conteudoPorId('inf11_cidade_nova')!;
    const v = adulto(30, { semente: 3 });
    expect(preparar(c, v, criarRng(1))).toBeNull();
    const avo = conteudoPorId('inf11_avo_doente')!;
    expect(avo.papeis?.avo && (avo.papeis.avo as { fixo?: boolean }).fixo).toBe(true);
  });
});

describe('EVT-11.7 · premissas que o futuro desmente', () => {
  /** Dispensado da base aos 14; depois (opcional) profissional por 20 temporadas, com título. */
  const dispensado = (depoisPro: boolean): Vida => transacao(adulto(48, { semente: 21, genero: 'masculino' }), x => {
    const t14 = x.eu.tNasc + 14 * 12;
    x.caminhos.esporte = undefined; x.caminhos.carreirasEsportivas = undefined; x.caminhos.palmares = [];
    x.caminhos.marcas = x.caminhos.marcas.filter(m => m.dominio !== 'futebol');
    x.caminhos.marcas.push({ t: t14, tipo: 'fracasso', texto: 'Dispensado da base do Sport, aos 14. O sonho de viver do futebol ficou para trás.', peso: 3, dominio: 'futebol' });
    x.rotinas = x.rotinas.filter(r => r.id !== 'futebol');
    if (depoisPro) {
      const ano0 = anoDe(x.eu.tNasc + 18 * 12);
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'encerrada', clube: 'Náutico', nivel: 4, tInicio: x.eu.tNasc + 17 * 12, tFase: x.eu.tNasc + 18 * 12, tFim: x.eu.tNasc + 38 * 12, lesoes: 0, municipioId: x.moradia.municipioId, motivoFim: 'idade',
        temporadas: Array.from({ length: 20 }, (_, k) => ({ ano: ano0 + k, clube: 'Náutico', nivel: 4 as const, partidas: 30, titular: 28, gols: 8, assistencias: 4, nota: 7, colocacao: 3, mesesFora: 0 })) };
      x.caminhos.palmares = [{ tipo: 'titulo', modalidade: 'futebol', ano: ano0 + 6, t: x.eu.tNasc + 25 * 12, competicao: 'Série A', clube: 'Náutico', papel: 'protagonista', texto: 'Campeão da Série A com o Náutico' }];
      x.caminhos.marcas.push({ t: x.eu.tNasc + 38 * 12, tipo: 'fim_carreira', texto: 'Pendurou as chuteiras.', peso: 3, dominio: 'futebol' });
    }
    x.momento = null;
  }).vida;
  const abrir = (v: Vida) => { const c = conteudoPorId('bio_sonho_para_tras')!; const ctx = preparar(c, v, criarRng(2)); return ctx && c.tipo === 'decisao' ? { ctx, c } : undefined; };

  it('dispensado aos 14 e depois profissional e campeão: a cena reconhece a virada (não é o sonho abandonado)', () => {
    const v = dispensado(true);
    expect(destinoDoSonho(v, 'futebol', v.eu.tNasc + 14 * 12)).toBe('realizado');
    expect(premissaVale(v, { tipo: 'sonho', d: 'futebol', t: v.eu.tNasc + 14 * 12 })).toBe(false);
    const a = abrir(v);
    expect(a).toBeDefined();
    const texto = txt(a!.c.texto, a!.ctx);
    const titulo = txt(a!.c.titulo, a!.ctx);
    expect(titulo).not.toBe('O sonho que ficou para trás');
    expect(texto).not.toMatch(/ficou para trás|ainda sabe como é/);
    expect(texto).toMatch(/20 temporadas no profissional/);
    expect(texto).toMatch(/Série A/);
    // A opção de voltar a jogar não fala em "desistir do sonho".
    const voltar = a!.c.opcoes.find(o => o.id === 'voltar')!;
    const res = voltar.resolver(a!.ctx);
    expect(res.memoria ?? '').not.toMatch(/desistir do sonho/);
  });

  it('só dispensado (nada depois): o texto do sonho que ficou para trás', () => {
    const v = dispensado(false);
    const a = abrir(v);
    expect(a).toBeDefined();
    expect(txt(a!.c.titulo, a!.ctx)).toBe('O sonho que ficou para trás');
    expect(txt(a!.c.texto, a!.ctx)).toMatch(/ainda sabe como é jogar bola/);
  });

  it('propriedade: um fato posterior contrário faz a premissa cair (ou trocar de variante)', () => {
    const v = dispensado(false);
    const t = v.eu.tNasc + 14 * 12;
    expect(premissaVale(v, { tipo: 'sonho', d: 'futebol', t })).toBe(true);
    const comoTecnico = transacao(v, x => { x.trabalho.historico.push({ ocupacaoId: 'treinador_escolinha', empregador: 'a escolinha do bairro', contrato: 'clt', salario: 2000, tInicio: t + 120, tFim: t + 200, desempenho: 60, municipioId: x.moradia.municipioId, carga: 'integral', motivo: 'saiu' } as never); }).vida;
    expect(destinoDoSonho(comoTecnico, 'futebol', t)).toBe('transformado');
    const voltou = transacao(v, x => { x.caminhos.marcas.push({ t: t + 100, tipo: 'retomada', texto: 'Voltou a jogar bola.', peso: 2, dominio: 'futebol' }); }).vida;
    expect(destinoDoSonho(voltou, 'futebol', t)).toBe('retomado');
    const a = abrir(voltou);
    if (a) expect(txt(a.c.texto, a.ctx)).not.toMatch(/ainda sabe como é/);
  });

  it('o eco da promoção recusada só volta no mesmo empregador, e sem promoção depois', () => {
    const base = transacao(adulto(35, { semente: 5 }), (x, r) => { x.trabalho.atual = undefined; contratar(x, r, ocupacao('analista_adm'), 'curriculo'); x.trabalho.atual!.tInicio = x.t - 120; }).vida;
    const c = conteudoPorId('eco10_recusou')!;
    const com = (f: (x: Vida) => void) => transacao(base, x => { const emp = x.trabalho.atual!.empregador; x.t -= 48; registrarEco(x, 'recusou', { texto: 'a promoção', de: 3, ate: 8, empregador: emp }); x.t += 48; f(x); }).vida;
    expect(preparar(c, com(() => {}), criarRng(1))).not.toBeNull();
    const trocou = com(x => { const e = x.trabalho.atual!; x.trabalho.historico.push({ ...e, tFim: x.t - 12, motivo: 'pediu demissão' } as never); x.trabalho.atual = { ...e, empregador: 'Outra Empresa', tInicio: x.t - 12 }; });
    expect(preparar(c, trocou, criarRng(1))).toBeNull();
    const promovido = com(x => { x.caminhos.marcas.push({ t: x.t - 12, tipo: 'promocao', texto: 'Promovido.', peso: 2 }); });
    expect(preparar(c, promovido, criarRng(1))).toBeNull();
  });

  it('o eco da troca de curso só diz "a decisão mais lúcida" se o curso novo existe e não foi largado', () => {
    const base = transacao(adulto(24, { semente: 8 }), (x, r) => { x.trabalho.atual = undefined; contratar(x, r, ocupacao('analista_adm'), 'curriculo'); x.educacao.matricula = undefined; }).vida;
    const c = conteudoPorId('eco10_mudou_de_curso')!;
    const com = (f: (x: Vida) => void) => transacao(base, x => { x.t -= 48; registrarEco(x, 'mudou_de_curso', { texto: 'Direito', cursoId: 'direito', de: 3, ate: 10 }); x.t += 48; f(x); }).vida;
    // Largou e não começou outro (ou largou o novo também): não abre.
    expect(preparar(c, com(() => {}), criarRng(1))).toBeNull();
    // Concluiu outro curso depois: abre.
    const formou = com(x => { x.educacao.concluidos.push({ cursoId: 'administracao', nome: 'Administração', nivel: 'superior', area: 'negocios', tFim: x.t - 6, instituicao: 'a faculdade' } as never); });
    expect(preparar(c, formou, criarRng(1))).not.toBeNull();
  });
});

describe('NPC-11.1 / NPC-11.2 · vínculos coerentes e mortos que não voltam', () => {
  const atleta = (): Vida => transacao(adulto(25, { semente: 12, genero: 'masculino' }), (x, r) => {
    garantirFrente(x, 'futebol');
    Object.assign(x.caminhos.frentes.futebol!, { habilidade: 86, interesse: 90, meses: 160, auge: 86 });
    x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = [];
    entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport');
    profissionalizar(x, r, 3);
    x.momento = null;
  }).vida;

  it('o companheiro de clube é colega de equipe (e ex-colega, depois) — não "do trabalho"', () => {
    let v = atleta();
    const e = v.trabalho.atual!;
    let pid = '';
    v = transacao(v, x => { const p = pessoaNova(x, 24); pid = p.id; const vin = vincular(x, p, { origem: 'trabalho', proximidade: 30, convivio: ['trabalho'], estagio: 'colega' }); vin.ambiente = `trabalho:${e.empregador}:${e.tInicio}`; }).vida;
    const p = v.pessoas[pid];
    const vin = v.vinculos[p.id];
    expect(descricaoOrigem(v, vin)).toBe('no time');
    expect(colegaDeEquipe(v, vin)).toBe('atual');
    expect(rotuloDe(v, v.pessoas[p.id], vin)).toBe('colega de equipe');
    v = transacao(v, x => { const a = x.trabalho.atual!; x.trabalho.historico.push({ ...a, tFim: x.t, motivo: 'transferência' } as never); x.trabalho.atual = { ...a, empregador: 'Outro Clube', tInicio: x.t }; }).vida;
    expect(rotuloDe(v, v.pessoas[p.id], v.vinculos[p.id])).toBe('ex-colega de equipe');
    expect(descricaoOrigem(v, v.vinculos[p.id])).not.toBe('no trabalho');
  });

  it('quem se conheceu no futebol durante a base é "da base", não só "no futebol"', () => {
    const v = transacao(adulto(15, { semente: 4, genero: 'feminino' }), x => {
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'base', clube: 'Sport', nivel: 2, tInicio: x.t - 24, tFase: x.t - 24, lesoes: 0, municipioId: x.moradia.municipioId };
    }).vida;
    let pid = '';
    const w = transacao(v, x => { const p = pessoaNova(x, 15, 'feminino'); pid = p.id; const vin = vincular(x, p, { origem: 'rotina', proximidade: 30, convivio: ['rotina'], estagio: 'amigo' }); vin.ambiente = `rotina:futebol:${x.moradia.municipioId}`; vin.tInicio = x.t - 12; }).vida;
    expect(descricaoOrigem(w, w.vinculos[pid])).toBe('na base');
  });

  it('o morto deixa de ser citado pelos registros em curso; quem está num registro em curso não morre "sem notícia"', () => {
    const v = transacao(adulto(40, { semente: 6 }), x => {
      const velho = pessoaNova(x, 104);
      const agente = pessoaNova(x, 60);
      x.caminhos.audiovisual = { agente: { nome: agente.nome, pessoaId: agente.id, rede: 2, comissao: 0.15, tInicio: x.t - 24 }, contratos: [{ id: 'av1', tipo: 'serie', titulo: 'Rota Norte', casa: 'uma emissora', papel: 'elenco', porte: 1, meses: 6, integral: false, bruto: 10000, comissao: 1500, despesas: 500, status: 'proposta', tProposta: x.t, pessoaId: velho.id }] };
    }).vida;
    const velhoId = v.caminhos.audiovisual!.contratos[0].pessoaId!;
    const agenteId = v.caminhos.audiovisual!.agente!.pessoaId!;
    expect(citadosEmRegistrosVivos(v)).toEqual(expect.arrayContaining([velhoId, agenteId]));
    // 104 anos e protegido pela proposta em curso: vinte anos de "mundo que envelhece" e segue vivo.
    let w = v;
    for (let k = 0; k < 20; k++) w = transacao(w, x => { x.t += 12; processarDistantes(x); }).vida;
    expect(pessoaCitavel(w, velhoId)).toBeDefined();
    // Quando morre (por qualquer caminho), a proposta e o agente deixam de citá-lo.
    w = transacao(v, x => { x.pessoas[velhoId].vivo = false; esquecerMorto(x, velhoId); x.pessoas[agenteId].vivo = false; esquecerMorto(x, agenteId); }).vida;
    expect(w.caminhos.audiovisual!.contratos[0].pessoaId).toBeUndefined();
    expect(w.caminhos.audiovisual!.agente).toBeUndefined();
    expect(pessoaCitavel(w, velhoId)).toBeUndefined();
    expect(idade(w)).toBe(40);
  });
});
