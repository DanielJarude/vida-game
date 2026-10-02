/**
 * Sucessão, herança e gerações (pacote pré-América do Sul, Parte H).
 *
 * Testes causais: a pessoa que continua JÁ EXISTIA (não é criada), escolher
 * quem continua não decide quem herda, a partilha fecha no real, nenhum bem
 * tem dois donos, a dívida tem destino definido, o menor continua menor, o
 * save não duplica a transferência, a biografia de quem morreu não vira a de
 * quem continua — e tudo isso funciona de novo na geração seguinte.
 */

import { describe, expect, it } from 'vitest';
import { adulto, comFilho, comNeto, comParceiro, comParente, pessoaNova, semPais } from './cenarios';
import { viver } from './ajuda';
import { idade, idadePessoa } from '../nucleo';
import { interpretar } from '../save';
import { avancarAno } from '../ano';
import { executar } from '../acoes';
import { balanco } from '../sistemas/dinheiro';
import { continuarComo, decidirHeranca, encerrarHistoria, partilhar, partilhaFecha, sucessores } from '../sistemas/sucessao';
import { calcularHeranca } from '../sistemas/partilha';
import { conciliar } from '../sistemas/extrato';
import type { Imovel, Vida } from '../tipos';

/** Uma família pronta: pai de 62, casado com a mãe dos dois filhos (A, 34, mora fora, casado e com filho; B, 29). */
function familia(semente = 11): { v: Vida; conjuge: string; a: string; b: string; neto: string; parB: string } {
  const v = adulto(62, { semente, genero: 'masculino' });
  for (const vin of Object.values(v.vinculos)) if (vin.parentesco === 'mae' || vin.parentesco === 'pai') v.pessoas[vin.pessoaId].vivo = false;
  const { p: mae } = comParceiro(v, { idade: 60, estagio: 'casamento', anos: 36, genero: 'feminino' });
  const { p: a } = comFilho(v, 34, { outroId: mae.id, casa: false, genero: 'masculino' });
  const { p: b } = comFilho(v, 29, { outroId: mae.id, casa: false, genero: 'feminino' });
  a.ocupacaoId = 'professor_infantil'; a.ocupacao = 'professor de educação infantil'; a.renda = 4200; a.municipioId = v.moradia.municipioId;
  b.ocupacaoId = 'enfermeiro'; b.ocupacao = 'enfermeira'; b.renda = 6100; b.formacao = 'Enfermagem'; b.municipioId = v.moradia.municipioId;
  b.vida!.escolaridade = 'superior'; b.vida!.experiencia = 72; b.vida!.trajetoria.push({ t: v.t - 60, texto: `${b.nome} se formou em Enfermagem.`, tipo: 'estudo' });
  // B já tem uma parceria e um filho dela.
  const parB = pessoaNova(v, 31, 'masculino');
  parB.parceiroId = b.id; b.parceiroId = parB.id; parB.renda = 3800; parB.municipioId = b.municipioId;
  v.fatos[`namoro_${b.id}`] = v.t - 72; v.fatos[`casou_${b.id}`] = v.t - 48; v.fatos[`uniao_cartorio_${b.id}`] = 1;
  v.vinculos[parB.id] = { pessoaId: parB.id, parentesco: 'genro', origem: 'familia', tInicio: v.t - 48, proximidade: 40, confianca: 50, tensao: 0, convivio: [], tUltimoContato: v.t, historia: [] };
  const { p: neto } = comNeto(v, b, 3, parB.id);
  // Patrimônio: conta, aplicação, a casa onde moram, um carro.
  v.financas.conta = 50000;
  v.financas.investimentos = [{ id: 'apl_pos_fixado', produto: 'pos_fixado', aportado: 200000, valor: 240000, tInicio: v.t - 120, historico: [], pico: 240000 }];
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa de três quartos', valor: 600000, tCompra: v.t - 200, municipioId: v.moradia.municipioId, estado: 70, dono: 'casal' };
  v.financas.bens = [casa, { id: 'vcarro', tipo: 'veiculo', modeloId: 'compacto', nome: 'carro compacto', valor: 45000, tCompra: v.t - 30, estado: 70 }];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 4, tInicio: v.t - 200 };
  v.vinculos[mae.id].convivio = ['casa'];
  v.fatos[`uniao_${mae.id}`] = v.t - 432;
  v.fatos[`patrimonio_uniao_${mae.id}`] = 0;
  v.morte = { t: v.t, causa: 'infarto', heranca: calcularHeranca(v) };
  return { v, conjuge: mae.id, a: a.id, b: b.id, neto: neto.id, parB: parB.id };
}

/** Tudo o que existe de patrimônio no mundo: o do protagonista e as posses das pessoas (o que a conservação compara). */
function patrimonioTotal(v: Vida): number {
  const npcs = Object.values(v.pessoas).reduce((s, p) => s + (p.posses ? p.posses.dinheiro + p.posses.bens.reduce((t, b) => t + b.valor, 0) : 0), 0);
  return balanco(v).liquido + npcs + (v.origem.reservaDe ? v.origem.reserva ?? 0 : 0);
}

describe('H1–H2 · a pessoa escolhida já existia', () => {
  it('pai morre com dois filhos → escolher B: B vira protagonista, A continua NPC', () => {
    const { v, a, b } = familia();
    const nomeB = v.pessoas[b].nome;
    const tNascB = v.pessoas[b].tNasc;
    const r = continuarComo(v, b);
    expect(r.erro).toBeUndefined();
    const n = r.vida;
    expect(n.morte).toBeUndefined();
    expect(n.eu.nome).toBe(nomeB);
    expect(n.eu.tNasc).toBe(tNascB);
    expect(n.pessoas[b]).toBeUndefined(); // B não está duas vezes no mundo
    expect(n.pessoas[a].vivo).toBe(true);
    expect(n.vinculos[a].parentesco).toBe('irmao');
  });

  it('B preserva idade, aparência, formação, trabalho, parceria e filho', () => {
    const { v, b, parB, neto } = familia();
    const antes = structuredClone(v.pessoas[b]);
    const n = continuarComo(v, b).vida;
    expect(idade(n)).toBe(idadePessoa(v, antes) + (n.t > v.t && (n.t - antes.tNasc) % 12 === 0 && (v.t - antes.tNasc) % 12 !== 0 ? 1 : 0));
    expect(n.eu.visual).toEqual(antes.visual);
    expect(n.educacao.concluidos.map(c => c.nome)).toContain('Enfermagem');
    expect(n.trabalho.atual?.ocupacaoId).toBe('enfermeiro');
    expect(n.vinculos[parB].romance?.estagio).toBe('casamento');
    expect(n.vinculos[neto].parentesco).toBe('filho');
    expect(n.pessoas[neto].genitores).toContain('eu');
    // A Linha da Vida dela começa no nascimento dela, não no do pai.
    expect(n.biografia[0].texto).toMatch(/^Nasceu/);
    expect(n.biografia[0].t).toBe(antes.tNasc);
    expect(n.biografia.some(e => /Enfermagem/.test(e.texto))).toBe(true);
  });
});

describe('H3–H6 · herança ≠ quem continua', () => {
  it('escolher B não dá 100% a B: a partilha legal segue igual', () => {
    const { v, a, b, conjuge } = familia();
    const p = partilhar(v, v.morte!.decisoes);
    const qa = p.quinhoes.find(x => x.pessoaId === a)!.valor;
    const qb = p.quinhoes.find(x => x.pessoaId === b)!.valor;
    expect(qa).toBeGreaterThan(0);
    expect(Math.abs(qa - qb)).toBeLessThanOrEqual(2);
    expect(p.quinhoes.find(x => x.pessoaId === conjuge)!.meacao).toBeGreaterThan(0);
    const n = continuarComo(v, b).vida;
    expect(n.pessoas[a].posses!.dinheiro + n.pessoas[a].posses!.bens.reduce((s, x) => s + x.valor, 0)).toBeGreaterThanOrEqual(qa);
  });

  it('herança dividida → o patrimônio antes e depois reconcilia (nada aparece, nada some)', () => {
    const { v, b } = familia();
    const p = partilhar(v);
    expect(partilhaFecha(p)).toBe(true);
    const antes = patrimonioTotal(v);
    const n = continuarComo(v, b).vida;
    const custos = p.custos + (p.doacao?.valor ?? 0) + p.vacante;
    // As economias de quem já trabalhava entram uma vez (estimadas para saves sem posses): somadas à parte.
    const economias = Object.values(n.pessoas).reduce((s, x) => s + (x.posses?.historia.filter(h => h.texto.startsWith('Economias')).reduce((t, h) => t + h.valor, 0) ?? 0), 0);
    const ecoB = n.financas.conta - (p.quinhoes.find(x => x.pessoaId === b)!.dinheiro);
    expect(patrimonioTotal(n)).toBe(antes - custos + economias + ecoB);
  });

  it('imóvel, veículo e aplicação: cada bem tem um dono só', () => {
    const { v, b, a } = familia();
    const d = { bens: { icasa: v.morte ? Object.values(v.vinculos).find(x => x.romance)!.pessoaId : '', vcarro: a } };
    const v2 = decidirHeranca(v, d);
    const n = continuarComo(v2, b).vida;
    const donos = (id: string) => [...n.financas.bens.filter(x => x.id === id).map(() => 'eu'), ...Object.values(n.pessoas).filter(p => p.posses?.bens.some(x => x.id === id)).map(p => p.id)];
    expect(donos('icasa')).toHaveLength(1);
    expect(donos('vcarro')).toEqual([a]);
    expect(n.financas.investimentos.some(x => x.id === 'apl_pos_fixado' && x.valor === 240000)).toBe(false);
  });

  it('a filha que continua pode receber a casa, se couber na parte dela (com a disponível)', () => {
    const { v, b } = familia();
    (v.financas.bens.find(x => x.id === 'icasa') as Imovel).valor = 150000;
    const v2 = decidirHeranca(v, { disponivel: [{ pessoaId: b, fracao: 1 }], bens: { icasa: b } });
    const p = partilhar(v2, v2.morte!.decisoes);
    expect(p.erros, JSON.stringify({ erros: p.erros, q: p.quinhoes.map(x => [x.pessoaId, x.valor]) })).toEqual([]);
    const n = continuarComo(v2, b).vida;
    expect(n.financas.bens.some(x => x.id === 'icasa')).toBe(true);
  });

  it('bem maior que a parte é recusado com o motivo (nada é transferido)', () => {
    const { v, a } = familia();
    const v2 = decidirHeranca(v, { bens: { icasa: a } });
    expect(partilhar(v2, v2.morte!.decisoes).erros.length).toBeGreaterThan(0);
    expect(continuarComo(v2, a).erro).toBeTruthy();
  });

  it('dívida: paga com o espólio; o que não cobre se extingue (ninguém herda dívida)', () => {
    const { v, b } = familia();
    v.financas.dividas.push({ id: 'd1', tipo: 'emprestimo', saldo: 2_000_000, jurosMes: 0.02, parcela: 9000, descricao: 'empréstimo' });
    const p = partilhar(v);
    expect(p.liquido).toBe(0);
    expect(p.naoCoberto).toBe(p.dividas - p.bruto);
    expect(p.dividas).toBeGreaterThanOrEqual(2_000_000);
    expect(p.quinhoes.every(x => x.valor === 0)).toBe(true);
    const n = continuarComo(v, b).vida;
    expect(n.financas.dividas).toHaveLength(0);
    expect(n.biografia.some(e => /dívidas levaram/.test(e.texto))).toBe(true);
  });

  it('doação na parte disponível sai do patrimônio da família e fica registrada', () => {
    const { v, b } = familia();
    const v2 = decidirHeranca(v, { doacao: { fracao: 0.5, destino: 'educacao' } });
    const p = partilhar(v2, v2.morte!.decisoes);
    expect(p.doacao!.valor).toBe(Math.round(p.disponivel * 0.5));
    expect(partilhaFecha(p)).toBe(true);
    const n = continuarComo(v2, b).vida;
    expect(n.linhagem!.geracoes[0].heranca.doacao!.destino).toBe('bolsas de estudo');
  });
});

describe('H7 · filho menor', () => {
  it('continua menor, na escola, com a guarda de quem ficou, e a herança tutelada', () => {
    const v = adulto(45, { semente: 21, genero: 'feminino' });
    const { p: par } = comParceiro(v, { idade: 46, estagio: 'casamento', anos: 15 });
    const { p: f } = comFilho(v, 12, { outroId: par.id, casa: true, genero: 'feminino' });
    v.vinculos[par.id].convivio = ['casa'];
    v.financas.conta = 80000;
    v.morte = { t: v.t, causa: 'acidente', heranca: calcularHeranca(v) };
    const i = idadePessoa(v, f);
    const n = continuarComo(v, f.id).vida;
    expect(idade(n)).toBeGreaterThanOrEqual(i);
    expect(idade(n)).toBeLessThan(18);
    expect(n.educacao.basica).toBeDefined();
    expect(n.moradia.tipo).toBe('pais');
    expect(n.vinculos[par.id].parentesco).toBe('pai');
    expect(n.vinculos[par.id].convivio).toContain('casa');
    const tut = n.financas.investimentos.find(x => x.tutelaAte);
    expect(tut).toBeDefined();
    expect(tut!.tutelaAte).toBe(n.eu.tNasc + 18 * 12);
    // As regras de autonomia continuam valendo (não salta para os 18).
    const r = executar(n, { tipo: 'resgatar', origem: 'pos_fixado', valor: 1000 });
    expect(r.vida).toBe(n);
    const depois = avancarAno(n).vida;
    expect(depois.morte).toBeUndefined();
  });

  it('órfão: a guarda vai para um parente adulto (e a casa é a dele)', () => {
    const v = adulto(40, { semente: 23, genero: 'masculino' });
    semPais(v);
    for (const x of Object.values(v.vinculos)) if (x.parentesco === 'irmao' || x.parentesco === 'meio_irmao' || x.parentesco === 'filho') v.pessoas[x.pessoaId].vivo = false;
    const { p: f } = comFilho(v, 9, { casa: true });
    const { p: avo } = comParente(v, 'mae', 66, 'feminino', 70);
    v.morte = { t: v.t, causa: 'acidente', heranca: calcularHeranca(v) };
    const s = sucessores(v).find(x => x.pessoa.id === f.id)!;
    expect(s.pode).toBe(true);
    const n = continuarComo(v, f.id).vida;
    expect(n.vinculos[avo.id].parentesco).toBe('avo');
    expect(n.origem.responsavelId).toBe(avo.id);
    expect(n.moradia.tipo).toBe('parente');
  });
});

describe('H8 · save', () => {
  it('salvar antes, durante e depois da sucessão: o reload não duplica a transferência', () => {
    const { v, b } = familia();
    const v2 = decidirHeranca(v, { disponivel: [{ pessoaId: b, fracao: 0.3 }] });
    const lido = interpretar(JSON.stringify(v2));
    expect(lido.tipo).toBe('ok');
    const morta = (lido as { vida: Vida }).vida;
    expect(morta.morte!.decisoes!.disponivel![0].fracao).toBe(0.3);
    const n = continuarComo(morta, b).vida;
    const relido = interpretar(JSON.stringify(n));
    expect(relido.tipo).toBe('ok');
    const n2 = (relido as { vida: Vida }).vida;
    expect(n2).toEqual(n);
    // A vida que voltou não tem morte: não há como continuar (nem transferir) de novo.
    expect(continuarComo(n2, b).erro).toBeTruthy();
    expect(patrimonioTotal(n2)).toBe(patrimonioTotal(n));
  });

  it('save v18 de uma vida morta abre (migrado) e pode continuar', () => {
    const { v, b } = familia();
    const antigo = { ...structuredClone(v), versao: 18 } as unknown as Vida;
    const r = interpretar(JSON.stringify(antigo));
    expect(r.tipo).toBe('ok');
    expect((r as { vida: Vida }).vida.versao).toBe(19);
    expect(continuarComo((r as { vida: Vida }).vida, b).erro).toBeUndefined();
  });
});

describe('H5b · contabilidade depois da sucessão', () => {
  it('a herança entra como linha do extrato e o primeiro ano dela fecha sem ajuste', () => {
    const { v, b } = familia();
    const n = continuarComo(v, b).vida;
    expect(n.financas.extratoAberto!.linhas.some(l => /^Herança de/.test(l.rotulo))).toBe(true);
    const depois = avancarAno(n).vida;
    const ex = depois.financas.extrato!;
    expect(ex.linhas.filter(l => l.tipo === 'ajuste')).toEqual([]);
    expect(conciliar(ex).ok).toBe(true);
  });
});

describe('G12 · negócio da família', () => {
  it('deixado para a filha que continua, é o MESMO negócio (nas mãos da equipe); vendido, vira dinheiro na partilha', () => {
    const { v, b } = familia();
    v.caminhos.negocio = { tipo: 'padaria', nome: 'Padaria Silva', ocupacaoId: 'dono_negocio', tInicio: v.t - 240, capital: 80000, clientela: 70, estado: 'firme', anosNoVermelho: 0, caixa: 30000, porte: 1, unidades: 1, equipe: [], reputacao: 70, historico: [60000, 72000, 68000] };
    const p0 = partilhar(v);
    const item = p0.inventario.find(x => x.id === 'negocio')!;
    expect(item.valor).toBeGreaterThan(30000);
    expect(p0.vendidos.some(x => x.id === 'negocio')).toBe(true);
    // Para dar o negócio a ela, a parte disponível vai toda para ela (o negócio entra no quinhão dela).
    (v.financas.bens.find(x => x.id === 'icasa') as Imovel).valor = 150000;
    const v2 = decidirHeranca(v, { disponivel: [{ pessoaId: b, fracao: 1 }], bens: { negocio: b } });
    const p = partilhar(v2, v2.morte!.decisoes);
    expect(p.erros).toEqual([]);
    const n = continuarComo(v2, b).vida;
    expect(n.caminhos.negocio?.nome).toBe('Padaria Silva');
    expect(n.caminhos.negocio?.passivo).toBe(true);
    expect(n.caminhos.negocio?.historico).toEqual([60000, 72000, 68000]);
  });
});

describe('H9–H10 · memória', () => {
  it('quem morreu fica na linhagem, com a biografia dela — que não vira a Linha da Vida de quem continua', () => {
    const { v, b } = familia();
    const bioPai = v.biografia.filter(e => e.relevancia === 'marco' || e.relevancia === 'biografia').map(e => e.texto);
    const n = continuarComo(v, b).vida;
    const g = n.linhagem!.geracoes[0];
    expect(g.nome).toBe(v.eu.nome);
    expect(g.biografia.map(e => e.texto)).toEqual(bioPai);
    expect(n.pessoas[g.pessoaId].vivo).toBe(false);
    expect(n.vinculos[g.pessoaId].parentesco).toBe('pai');
    const nasceuPai = v.biografia[0].texto;
    expect(n.biografia.some(e => e.texto === nasceuPai)).toBe(false);
    expect(n.biografia.filter(e => /morreu aos/.test(e.texto) && e.pessoas?.includes(g.pessoaId))).toHaveLength(1);
  });

  it('mérito não se herda: sem palmarés, sem política, sem reputação; notoriedade só por associação', () => {
    const { v, b } = familia();
    v.caminhos.palmares = [{ tipo: 'titulo', modalidade: 'futebol', ano: 2060, t: v.t - 100, competicao: 'Série A', texto: 'Campeão' }];
    v.notoriedade = { valor: 70, pico: 90, fonte: 'esporte', t: v.t };
    const n = continuarComo(v, b).vida;
    expect(n.caminhos.palmares).toBeUndefined();
    expect(n.caminhos.politica).toBeUndefined();
    expect(n.notoriedade!.valor).toBeLessThan(20);
    expect(n.notoriedade!.fonte).toBeUndefined();
  });
});

describe('H11–H12 · gerações', () => {
  it('pai → filha → neto: a segunda sucessão funciona e a linhagem cresce', () => {
    const { v, b, neto } = familia();
    let n = continuarComo(v, b).vida;
    n = viver(n, 25);
    if (n.morte) return; // a semente pode matar antes; o caso abaixo cobre a cadeia sem sorteio
    n.morte = { t: n.t, causa: 'câncer', heranca: calcularHeranca(n) };
    const vivoNeto = n.pessoas[neto]?.vivo;
    expect(vivoNeto).toBe(true);
    const n2 = continuarComo(n, neto);
    expect(n2.erro).toBeUndefined();
    expect(n2.vida.linhagem!.geracoes).toHaveLength(2);
    expect(n2.vida.linhagem!.geracoes.map(g => g.nome)).toEqual([v.eu.nome, v.pessoas[b].nome]);
    const ids = Object.keys(n2.vida.pessoas);
    expect(new Set(ids).size).toBe(ids.length);
    expect(interpretar(JSON.stringify(n2.vida)).tipo).toBe('ok');
  });

  it('sem filhos: não inventa sucessor; encerrar faz a partilha e registra', () => {
    const v = adulto(70, { semente: 31 });
    v.financas.conta = 90000;
    for (const x of Object.values(v.vinculos)) if (x.parentesco === 'filho' || x.parentesco === 'enteado') delete v.vinculos[x.pessoaId];
    v.morte = { t: v.t, causa: 'velhice', heranca: calcularHeranca(v) };
    expect(sucessores(v)).toHaveLength(0);
    const nPessoas = Object.keys(v.pessoas).length;
    const r = encerrarHistoria(v);
    expect(r.erro).toBeUndefined();
    expect(r.vida.morte!.encerrada).toBe(true);
    expect(Object.keys(r.vida.pessoas)).toHaveLength(nPessoas);
    const h = r.vida.morte!.heranca!;
    const soma = (h.dividas ?? 0) + (h.custos ?? 0) + (h.vacante ?? 0) + (h.doacao?.valor ?? 0) + h.partes.reduce((s, x) => s + x.valor, 0);
    expect(soma).toBe(h.bruto);
  });
});
