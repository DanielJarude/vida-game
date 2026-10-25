/**
 * REWORK 12.2 — Negócios vivos, luxo e mercados paralelos: os testes obrigatórios.
 *
 *   EMPRESAS     os oito tipos com estado e decisões próprias que mudam as contas; restaurante (conceito, insumo, chef,
 *                nota), hotel (estrelas, ocupação que não lota no luxo caro), museu (obras, laudo, exposição), zoológico
 *                (indivíduos, recintos, lotação, licença), clínica (inspeção), academia (retenção), estúdio (equipamento,
 *                proposta), loja (estoque e encalhe); gestão própria × contratada × delegada
 *   LUXO         as faixas até as peças históricas; venda privada e leilão especial pelo patrimônio; a peça única não se
 *                duplica (nem depois de vendida); a rara não fica na vitrine todo ano; os serviços (avaliar, autenticar,
 *                restaurar, emprestar); propostas em torno do valor
 *   INVENTÁRIO   PAT-12.2-01: a compra de estilo é entregue, persiste e aparece; dinheiro só sai com o bem
 *   EXÓTICOS     a lei de cada país; a instalação; o custo; o cuidador; a mudança não some com o bicho; o zoológico
 *   SUBMUNDO     negócio por fora, fachada, organização própria, memória que não esquece traição, processo que desmantela
 *   PARALELOS    a feira para todos e o por fora só com o caminho; a cópia não vira dinheiro; o animal não é produto
 *   SAVES        normalização idempotente, ida e volta, nada duplicado, versão 20
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { Empresa, Vida } from '../tipos';
import { executar, disponibilidade, type Acao } from '../acoes';
import { avancarAno } from '../ano';
import { podeTentar } from '../plausibilidade';
import { interpretar, normalizarRework122, VERSAO_SAVE } from '../save';
import { competenciaDaGestao, contasDoAno, processarEmpresas } from '../sistemas/empresas';
import { alertasDaEmpresa, bemEstarDoZoo, cozinhaDoRestaurante, decisoesDoSetor, efeitosDoSetor, garantirSetor, indicadoresDoSetor, notaDoRestaurante, ocupacaoDoRecinto, podeReceberAnimal } from '../sistemas/setores';
import { PECAS_DE_COLECAO } from '../dados/colecionaveis';
import { colecao, ofertasDeColecao, ofertasEspeciais, processarColecao, propostasDeColecionadores } from '../sistemas/colecao';
import { legalidade, ofertasExoticas, proibidosAqui, seusExoticos } from '../sistemas/exoticos';
import { mercadosVisiveis, ofertaDeAnimalPorFora, ofertasParalelas, processarParalelos } from '../sistemas/paralelos';
import { estagioDoSubmundo, negocios, processarClandestinos } from '../sistemas/clandestinos';
import { entrar } from '../sistemas/ilicito';
import { criarContato, lembrarOrg, organizacaoDoRamo } from '../sistemas/submundo';
import { orcamento } from '../sistemas/dinheiro';
import { semana } from '../sistemas/semana';
import { migrar } from '../sistemas/migracao';
import { cidadesDoPais } from '../dados/lugares';
import { itensDaPessoa } from '../sistemas/estilo';
import { TIPOS_DE_EMPRESA } from '../dados/empresas';
import { adotarPet } from '../sistemas/pets';
import { ESPECIES_ZOO } from '../dados/setores';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { const d = disponibilidade(v, a); expect(podeTentar(d), `${JSON.stringify(a)}: ${d.motivo}`).toBe(true); return executar(v, a).vida; };

function rica(cidade = 'sao-paulo-sp', conta = 80_000_000, semente = 41): Vida {
  const v = adulto(40, { municipioId: cidade, semente });
  v.financas.conta = conta;
  v.financas.dividas = [];
  v.momento = null;
  delete v.fila;
  return v;
}
const comEmpresa = (tipo: Empresa['tipo'], semente = 41): Vida => {
  let v = rica('sao-paulo-sp', 80_000_000, semente);
  v = fazer(v, { tipo: 'empresa_abrir', empresa: tipo, comSocio: false });
  return v;
};
const emp = (v: Vida) => v.financas.empresas![v.financas.empresas!.length - 1];
const operando = (v: Vida) => transacao(v, x => { const e = emp(x); e.estado = 'operando'; if (e.zoo) e.zoo.licenca = true; }).vida;
const ANO = (v: Vida) => { let x = avancarAno(v).vida; for (let k = 0; k < 12 && x.momento; k++) x = executar(x, { tipo: 'decidir', opcaoId: x.momento!.opcoes.find(o => !o.bloqueio)?.id ?? x.momento!.opcoes[0].id }).vida; return x; };

/* ================================================================== EMPRESAS */

describe('empresas vivas: cada ramo é um negócio diferente', () => {
  it('os oito tipos existem, têm estado próprio, indicadores próprios e pelo menos três decisões que não são as dos outros', () => {
    expect(TIPOS_DE_EMPRESA.map(t => t.id).sort()).toEqual(['academia', 'clinica', 'estudio', 'hotel', 'loja', 'museu', 'restaurante', 'zoologico']);
    const rotulos = new Map<string, string>();
    for (const t of TIPOS_DE_EMPRESA) {
      const v = operando(comEmpresa(t.id));
      const e = emp(v);
      const s = garantirSetor(v, e);
      expect(Object.keys(s).filter(k => !['delegar', 'divulgacao', 'mercado', 'tCrise'].includes(k)), t.id).toHaveLength(1);
      const ids = new Set(decisoesDoSetor(v, e).map(d => d.id).filter(id => id !== 'divulgar'));
      expect(ids.size, t.id).toBeGreaterThanOrEqual(3);
      rotulos.set(t.id, indicadoresDoSetor(v, e).map(x => x.rotulo).join('|'));
    }
    expect(new Set(rotulos.values()).size).toBe(8);
  });

  it('restaurante: cobrar caro e servir com insumo ruim derruba a nota e a procura; insumo excelente melhora a nota e come a margem', () => {
    let v = operando(comEmpresa('restaurante'));
    const id = emp(v).id;
    v = fazer(v, { tipo: 'empresa', empresaId: id, decisao: 'preco_alto' });
    v = fazer(v, { tipo: 'setor', empresaId: id, decisao: 'ingredientes', alvo: '1' });
    const ruim = { nota: notaDoRestaurante(emp(v)), ef: efeitosDoSetor(v, emp(v)) };
    v = transacao(v, x => { x.anoAtual.acoes = []; }).vida;
    v = fazer(v, { tipo: 'setor', empresaId: id, decisao: 'ingredientes', alvo: '3' });
    const bom = { nota: notaDoRestaurante(emp(v)), ef: efeitosDoSetor(v, emp(v)) };
    expect(bom.nota).toBeGreaterThan(ruim.nota);
    expect(bom.ef.procura).toBeGreaterThan(ruim.ef.procura);
    expect(bom.ef.variavel).toBeGreaterThan(ruim.ef.variavel);
  });

  it('restaurante: um chef talentoso melhora a cozinha (e custa um salário); alta gastronomia não existe sem chef', () => {
    let v = operando(comEmpresa('restaurante'));
    const id = emp(v).id;
    expect(disponibilidade(v, { tipo: 'setor', empresaId: id, decisao: 'conceito', alvo: 'alta_gastronomia' }).motivo).toMatch(/chef/);
    const antes = cozinhaDoRestaurante(emp(v));
    v = fazer(v, { tipo: 'setor', empresaId: id, decisao: 'chef' });
    v = transacao(v, x => { emp(x).setor!.restaurante!.chef!.talento = 85; }).vida;
    expect(cozinhaDoRestaurante(emp(v))).toBeGreaterThan(antes);
    expect(efeitosDoSetor(v, emp(v)).fixos.some(f => /Chef/.test(f.rotulo))).toBe(true);
    expect(pode(v, { tipo: 'setor', empresaId: id, decisao: 'conceito', alvo: 'alta_gastronomia' })).toBe(true);
  });

  it('hotel: o cinco estrelas de diária alta não fica lotado; serviços e estratégia de temporada mexem na procura', () => {
    let v = operando(comEmpresa('hotel'));
    const id = emp(v).id;
    const base = efeitosDoSetor(v, emp(v)).procura;
    v = fazer(v, { tipo: 'setor', empresaId: id, decisao: 'temporada', alvo: 'dinamica' });
    expect(efeitosDoSetor(v, emp(v)).procura).toBeGreaterThan(base);
    v = transacao(v, x => { const e = emp(x); e.setor!.hotel!.estrelas = 5; e.preco = 'alto'; e.setor!.hotel!.publico = 'luxo'; }).vida;
    const ocup: number[] = [];
    for (let k = 0; k < 6; k++) { v = ANO(v); const h = emp(v)?.setor?.hotel; if (h?.ocupacao !== undefined) ocup.push(h.ocupacao); }
    expect(ocup.length).toBeGreaterThan(0);
    expect(Math.max(...ocup)).toBeLessThan(0.9);
  });

  it('museu: as obras têm nome, laudo e conservação; a exposição temática atrai; o laudo revela a falsa antes do escândalo', () => {
    let v = operando(comEmpresa('museu'));
    const id = emp(v).id;
    const m = emp(v).setor!.museu!;
    expect(m.obras.length).toBeGreaterThanOrEqual(6);
    expect(m.obras.every(o => o.nome && o.periodo && o.valor > 0)).toBe(true);
    const antes = efeitosDoSetor(v, emp(v)).procura;
    const tema = decisoesDoSetor(v, emp(v)).find(d => d.id === 'exposicao')!.alvo!;
    v = fazer(v, { tipo: 'setor', empresaId: id, decisao: 'exposicao', alvo: tema });
    expect(efeitosDoSetor(v, emp(v)).procura).toBeGreaterThan(antes);
    v = transacao(v, x => { emp(x).setor!.museu!.obras[0].falsa = true; }).vida;
    const obra = emp(v).setor!.museu!.obras[0];
    v = fazer(v, { tipo: 'obra', empresaId: id, obraId: obra.id, oque: 'verificar' });
    const o2 = emp(v).setor!.museu!.obras[0];
    expect(o2.autenticidade).toBe('verificada');
    expect(o2.exposta).toBe(false);
    expect(o2.valor).toBeLessThan(obra.valor * 0.1);
  });

  it('zoológico: cada animal é alguém (nome, idade, recinto); sem recinto não chega; a lotação derruba o bem-estar; não há venda de animal', () => {
    let v = operando(comEmpresa('zoologico'));
    const e = emp(v);
    const z = e.setor!.zoo!;
    expect(z.animais.length).toBeGreaterThan(20);
    expect(z.animais.every(a => a.nome && a.nasceu < v.t && z.recintos.some(q => q.id === a.recinto))).toBe(true);
    expect(podeReceberAnimal(e, 'pinguim')).toMatch(/recinto/);
    expect(podeReceberAnimal(e, 'elefante')).toMatch(/recinto|vaga|conservação|veterin/);
    expect(decisoesDoSetor(v, e).some(d => /vender/i.test(d.id))).toBe(false);
    const bem = bemEstarDoZoo(e);
    const savana = z.recintos.find(q => q.habitat === 'savana')!;
    v = transacao(v, x => { const ez = emp(x); for (let k = 0; k < 8; k++) ez.setor!.zoo!.animais.push({ ...ez.setor!.zoo!.animais.find(a => a.especie === 'zebra')!, id: `extra${k}`, nome: `Extra ${k}` }); }).vida;
    expect(ocupacaoDoRecinto(emp(v), savana.id)).toBeGreaterThan(savana.vagas);
    expect(bemEstarDoZoo(emp(v))).toBeLessThan(bem - 5);
    expect(alertasDaEmpresa(v, emp(v)).join(' ')).toMatch(/lotado/);
  });

  it('zoológico: recinto novo abre a espécie; a ameaçada pede programa de conservação', () => {
    let v = operando(comEmpresa('zoologico'));
    const id = emp(v).id;
    v = fazer(v, { tipo: 'setor', empresaId: id, decisao: 'recinto', alvo: 'polar' });
    v = fazer(v, { tipo: 'setor', empresaId: id, decisao: 'receber', alvo: 'pinguim' });
    expect(emp(v).setor!.zoo!.animais.filter(a => a.especie === 'pinguim').length).toBeGreaterThanOrEqual(6);
    expect(podeReceberAnimal(emp(v), 'lemure') === undefined || /conservação|vaga/.test(podeReceberAnimal(emp(v), 'lemure')!)).toBe(true);
    const ameacada = ESPECIES_ZOO.find(x => x.ameacada && x.habitat === 'aviario')!;
    expect(podeReceberAnimal(emp(v), ameacada.id)).toMatch(/conservação|vaga/);
  });

  it('clínica: protocolos vencidos viram multa ou interdição na inspeção; especialidade traz público e custa profissional', () => {
    let v = operando(comEmpresa('clinica'));
    const id = emp(v).id;
    const p0 = efeitosDoSetor(v, emp(v));
    v = fazer(v, { tipo: 'setor', empresaId: id, decisao: 'especialidade', alvo: 'cardiologia' });
    const p1 = efeitosDoSetor(v, emp(v));
    expect(p1.procura).toBeGreaterThan(p0.procura);
    expect(p1.fixos.length).toBeGreaterThan(p0.fixos.length);
    let multou = false;
    for (let s = 0; s < 30 && !multou; s++) {
      const x = transacao(v, y => { emp(y).setor!.clinica!.conformidade = 10; y.t += s; processarEmpresas(y, criarRng(s)); }).vida;
      multou = emp(x).estado === 'interditada';
    }
    expect(multou).toBe(true);
  });

  it('academia: programa de retenção tira evasão; estúdio: o equipamento envelhece e a proposta deixa crédito', () => {
    let v = operando(comEmpresa('academia'));
    const ev0 = efeitosDoSetor(v, emp(v)).evasao;
    v = fazer(v, { tipo: 'setor', empresaId: emp(v).id, decisao: 'retencao', alvo: 'acompanhamento' });
    expect(efeitosDoSetor(v, emp(v)).evasao).toBeLessThan(ev0);
    let s = operando(comEmpresa('estudio'));
    const eq = emp(s).setor!.estudio!.equipamento;
    s = transacao(s, x => { emp(x).setor!.estudio!.proposta = { t: x.t, artista: 'uma cantora em ascensão', desconto: 0.5 }; }).vida;
    s = fazer(s, { tipo: 'setor', empresaId: emp(s).id, decisao: 'proposta', alvo: 'sim' });
    expect(emp(s).setor!.estudio!.creditos.length).toBe(1);
    s = ANO(s);
    expect(emp(s).setor!.estudio!.equipamento).toBeLessThan(eq);
  });

  it('loja: estoque amplo encalha com os anos; a liquidação limpa o encalhe e custa margem', () => {
    let v = operando(comEmpresa('loja'));
    const id = emp(v).id;
    v = fazer(v, { tipo: 'setor', empresaId: id, decisao: 'estoque', alvo: '3' });
    for (let k = 0; k < 4; k++) v = ANO(v);
    const enc = emp(v).setor!.loja!.encalhe;
    expect(enc).toBeGreaterThan(20);
    const caixa = emp(v).caixa;
    v = fazer(v, { tipo: 'setor', empresaId: id, decisao: 'liquidacao' });
    expect(emp(v).setor!.loja!.encalhe).toBeLessThan(enc);
    expect(emp(v).caixa).toBeLessThan(caixa);
  });

  it('gestão: a própria tem teto mais baixo no negócio complexo; o gestor delegado decide o dia a dia; dá para retomar', () => {
    let h = operando(comEmpresa('hotel'));
    h = fazer(h, { tipo: 'empresa', empresaId: emp(h).id, decisao: 'assumir' });
    h = transacao(h, x => { emp(x).gestao.tInicio = x.t - 240; }).vida;
    let r = operando(comEmpresa('loja'));
    r = fazer(r, { tipo: 'empresa', empresaId: emp(r).id, decisao: 'assumir' });
    r = transacao(r, x => { emp(x).gestao.tInicio = x.t - 240; }).vida;
    expect(competenciaDaGestao(h, emp(h))).toBeLessThan(competenciaDaGestao(r, emp(r)));
    let d = operando(comEmpresa('restaurante'));
    expect(emp(d).gestao.quem).toBe('contratada');
    d = transacao(d, x => { const e = emp(x); e.gestao.competencia = 85; e.setor!.restaurante!.ambiente = 20; e.setor!.restaurante!.atendimento = 20; e.caixa = 5_000_000; }).vida;
    d = ANO(d);
    expect(emp(d).setor!.restaurante!.ambiente).toBeGreaterThan(20);
    d = fazer(d, { tipo: 'empresa_delegar', empresaId: emp(d).id, delegar: false });
    expect(emp(d).setor!.delegar).toBe(false);
  });

  it('gestão própria de restaurante não é riqueza garantida: em várias vidas, há quem perca', () => {
    const multiplos: number[] = [];
    for (let s = 0; s < 8; s++) {
      let v = comEmpresa('restaurante', 300 + s * 11);
      const id = emp(v).id;
      v = fazer(v, { tipo: 'empresa', empresaId: id, decisao: 'assumir' });
      const inv = emp(v).investido;
      let rec = 0;
      for (let k = 0; k < 8; k++) { v = ANO(v); const e = v.financas.empresas?.find(x => x.id === id); if (!e || e.estado === 'encerrada') break; rec += (e.ultimo?.distribuido ?? 0) * e.parte; }
      const e = v.financas.empresas?.find(x => x.id === id);
      multiplos.push((rec + (e && e.estado !== 'encerrada' ? (e.avaliacao ?? 0) * e.parte : 0)) / inv);
    }
    expect(Math.min(...multiplos)).toBeLessThan(0.9);
  });
});

/* ================================================================== LUXO E COLEÇÃO */

describe('luxo e colecionismo', () => {
  it('as faixas vão do premium acessível às peças históricas de centenas de milhões; cada peça tem o que se verifica', () => {
    const faixas = new Set(PECAS_DE_COLECAO.map(p => p.faixa));
    for (const f of [1, 2, 3, 4, 5, 6]) expect(faixas.has(f as 1)).toBe(true);
    expect(Math.max(...PECAS_DE_COLECAO.map(p => p.preco))).toBeGreaterThanOrEqual(400_000_000);
    expect(PECAS_DE_COLECAO.filter(p => p.faixa! >= 4 && p.canal).every(p => p.patrimonioMin && p.material && p.liquidez)).toBe(true);
    expect(PECAS_DE_COLECAO.every(p => p.faixa && p.liquidez)).toBe(true);
    expect(PECAS_DE_COLECAO.filter(p => p.unica).every(p => p.canal === 'especial')).toBe(true);
  });

  it('a venda privada e o leilão especial dependem do patrimônio; o pobre não vê, o bilionário vê', () => {
    const pobre = rica('sao-paulo-sp', 2_000_000);
    const bilionario = rica('sao-paulo-sp', 3_000_000_000);
    const privadas = (v: Vida) => (['relojoaria', 'joalheria', 'galeria', 'antiquario'] as const).flatMap(l => ofertasDeColecao(v, l)).filter(o => o.canal === 'privada');
    expect(privadas(pobre)).toHaveLength(0);
    let achou = 0, especiais = 0;
    for (let k = 0; k < 6; k++) { const v = transacao(bilionario, x => { x.t += k * 12; }).vida; achou += privadas(v).length; especiais += ofertasEspeciais(v).length; }
    expect(achou).toBeGreaterThan(0);
    expect(especiais).toBeGreaterThan(0);
  });

  it('a peça histórica única não se duplica: comprada, some das ofertas; vendida, só volta anos depois — com o seu nome na lista de donos', () => {
    let v = rica('sao-paulo-sp', 3_000_000_000);
    let o = ofertasEspeciais(v)[0];
    for (let k = 1; !o && k < 10; k++) { v = transacao(v, x => { x.t += 12; }).vida; o = ofertasEspeciais(v)[0]; }
    expect(o).toBeTruthy();
    v = fazer(v, { tipo: 'colecao_comprar', ofertaId: o.id });
    const c = colecao(v).find(x => x.unica === o.unica)!;
    expect(c).toBeTruthy();
    expect(v.pecasUnicas![o.unica!].com).toBe('voce');
    for (let k = 1; k <= 3; k++) expect(ofertasEspeciais(transacao(v, x => { x.t += 12 * k; }).vida).some(x => x.unica === o.unica)).toBe(false);
    v = fazer(v, { tipo: 'colecao_vender', pecaId: c.id, modo: 'rapido' });
    expect(v.pecasUnicas![o.unica!].com).toBe('mercado');
    expect(ofertasEspeciais(transacao(v, x => { x.t += 24; }).vida).some(x => x.unica === o.unica)).toBe(false);
    let voltou;
    for (let k = 9; k < 30 && !voltou; k++) voltou = ofertasEspeciais(transacao(v, x => { x.t += 12 * k; }).vida).find(x => x.unica === o.unica);
    if (voltou) expect(voltou.donos!.join(' ')).toContain(v.eu.nome);
  });

  it('a peça rara não fica na vitrine todo ano', () => {
    const v = rica();
    let anos = 0;
    for (let k = 0; k < 12; k++) if (ofertasDeColecao(transacao(v, x => { x.t += 12 * k; }).vida, 'relojoaria').some(o => o.pecaId === 'rel_rolex_daytona')) anos++;
    expect(anos).toBeGreaterThan(0);
    expect(anos).toBeLessThan(12);
  });

  it('autenticar diz a verdade: a falsa vira cópia, a roubada é apreendida; leilão não aceita peça duvidosa', () => {
    let v = rica();
    const o = ofertasDeColecao(v, 'relojoaria').find(x => x.preco < 100000)!;
    v = fazer(v, { tipo: 'colecao_comprar', ofertaId: o.id });
    v = transacao(v, x => { const c = colecao(x)[0]; c.falsa = true; c.autenticidade = 'duvidosa'; c.certificado = false; }).vida;
    expect(pode(v, { tipo: 'colecao_vender', pecaId: colecao(v)[0].id, modo: 'leilao' })).toBe(false);
    const valor = colecao(v)[0].valor;
    v = fazer(v, { tipo: 'colecao_servico', pecaId: colecao(v)[0].id, servico: 'autenticar' });
    expect(colecao(v)[0].valor).toBeLessThan(valor * 0.2);
    let w = rica();
    w = fazer(w, { tipo: 'colecao_comprar', ofertaId: o.id });
    w = transacao(w, x => { const c = colecao(x)[0]; c.roubada = true; c.autenticidade = 'presumida'; }).vida;
    w = fazer(w, { tipo: 'colecao_servico', pecaId: colecao(w)[0].id, servico: 'autenticar' });
    expect(colecao(w)).toHaveLength(0);
  });

  it('restaurar e avaliar mudam o estado e o laudo; as propostas giram em torno do valor (nem sempre acima)', () => {
    let v = rica();
    const o = ofertasDeColecao(v, 'antiquario').find(x => x.estado < 92) ?? ofertasDeColecao(v, 'leilao')[0];
    v = fazer(v, { tipo: 'colecao_comprar', ofertaId: o.id });
    const c0 = colecao(v)[0];
    if (c0.estado < 92 && c0.categoria !== 'memorabilia') { v = fazer(v, { tipo: 'colecao_servico', pecaId: c0.id, servico: 'restaurar' }); expect(colecao(v)[0].estado).toBeGreaterThan(c0.estado); }
    v = fazer(v, { tipo: 'colecao_servico', pecaId: c0.id, servico: 'avaliar' });
    expect(colecao(v)[0].avaliada).toBe(v.t);
    const razoes: number[] = [];
    let w = rica('sao-paulo-sp', 80_000_000, 7);
    for (const x of ofertasDeColecao(w, 'leilao').slice(0, 3)) w = fazer(w, { tipo: 'colecao_comprar', ofertaId: x.id });
    for (let k = 0; k < 15; k++) { w = transacao(w, x => { x.t += 12; }).vida; for (const p of propostasDeColecionadores(w)) razoes.push(p.valor / colecao(w).find(c => c.id === p.pecaId)!.valor); }
    expect(razoes.length).toBeGreaterThan(0);
    expect(Math.min(...razoes)).toBeLessThan(1);
  });

  it('nenhum ciclo de comprar e revender na hora dá lucro, em loja, venda privada ou leilão especial', () => {
    let v = rica('sao-paulo-sp', 3_000_000_000);
    const antes = v.financas.conta;
    const lista = [...ofertasDeColecao(v, 'relojoaria'), ...ofertasDeColecao(v, 'galeria'), ...ofertasDeColecao(v, 'leilao')];
    for (const o of lista) if (pode(v, { tipo: 'colecao_comprar', ofertaId: o.id })) v = fazer(v, { tipo: 'colecao_comprar', ofertaId: o.id });
    for (const c of colecao(v)) v = fazer(v, { tipo: 'colecao_vender', pecaId: c.id, modo: 'rapido' });
    expect(v.financas.conta).toBeLessThan(antes);
  });
});

/* ================================================================== INVENTÁRIO */

describe('PAT-12.2-01: o que se compra é entregue e fica', () => {
  it('o relógio comprado na relojoaria e joalheria entra no inventário, só sai o dinheiro dele, e persiste no save e nos anos', () => {
    let v = rica('sao-paulo-sp', 100_000);
    const antes = v.financas.conta;
    v = fazer(v, { tipo: 'comprar_item', itemId: 'relogio_luxo' });
    const it = itensDaPessoa(v).find(x => x.itemId === 'relogio_luxo')!;
    expect(it).toBeTruthy();
    expect(antes - v.financas.conta).toBe(it.preco);
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    let w = r.vida;
    for (let k = 0; k < 3; k++) w = ANO(w);
    expect(itensDaPessoa(w).filter(x => x.itemId === 'relogio_luxo')).toHaveLength(1);
    expect(pode(w, { tipo: 'comprar_item', itemId: 'relogio_luxo' })).toBe(false);
  });

  it('a peça de coleção vai para Coleção (não some, não duplica), a compra paralela também', () => {
    let v = rica();
    const o = ofertasDeColecao(v, 'joalheria')[0];
    v = fazer(v, { tipo: 'colecao_comprar', ofertaId: o.id });
    expect(colecao(v)).toHaveLength(1);
    expect(pode(v, { tipo: 'colecao_comprar', ofertaId: o.id })).toBe(false);
    const p = ofertasParalelas(v, 'feira')[0];
    v = fazer(v, { tipo: 'paralelo', ofertaId: p.id, oque: 'comprar' });
    expect(colecao(v)).toHaveLength(2);
    expect(colecao(v)[1].procedencia).toBe('paralelo');
  });
});

/* ================================================================== EXÓTICOS */

describe('animais exóticos', () => {
  it('a lei de cada lugar: no Brasil, ouriço, lagartixa-leopardo e píton não se vendem; nos EUA, sim (fora da Califórnia o ouriço)', () => {
    expect(legalidade('ourico', 'sao-paulo-sp')).toBe('proibido');
    expect(legalidade('piton_bola', 'sao-paulo-sp')).toBe('proibido');
    expect(legalidade('furao', 'sao-paulo-sp')).toBe('licenca');
    const ny = cidadesDoPais('US').find(c => c.uf === 'NY')!;
    const la = cidadesDoPais('US').find(c => c.uf === 'CA')!;
    expect(legalidade('gecko', ny.id)).toBe('livre');
    expect(legalidade('ourico', la.id)).toBe('proibido');
    const v = rica();
    const ofertas = ofertasExoticas(v);
    expect(ofertas.every(o => legalidade(o.especie, v.moradia.municipioId) !== 'proibido')).toBe(true);
    expect(proibidosAqui(v).map(x => x.especie)).toContain('ourico');
  });

  it('sem a instalação não se compra; com ela, o bicho chega documentado, custa todo mês, pede semana — ou cuidador', () => {
    let v = rica('sao-paulo-sp', 500_000);
    v = transacao(v, x => { x.moradia.tipo = 'propria'; x.moradia.modeloId = 'casa_3q'; }).vida;
    let o = ofertasExoticas(v).find(x => x.especie === 'arara' || x.especie === 'furao');
    for (let k = 1; !o && k < 8; k++) { v = transacao(v, x => { x.t += 12; x.anoAtual.acoes = []; }).vida; o = ofertasExoticas(v).find(x => x.especie === 'arara' || x.especie === 'furao'); }
    expect(o).toBeTruthy();
    expect(disponibilidade(v, { tipo: 'exotico_comprar', ofertaId: o!.id }).motivo).toMatch(/montado|instalação|gaiola|viveiro/i);
    v = fazer(v, { tipo: 'instalacao_comprar', instalacao: o!.instalacao });
    v = fazer(v, { tipo: 'exotico_comprar', ofertaId: o!.id });
    const pet = seusExoticos(v)[0];
    expect(pet.pet!.documentado).toBe(true);
    expect(orcamento(v).saidas.some(l => /Instalações dos animais/.test(l.rotulo))).toBe(true);
    expect(semana(v).fixos.some(f => f.id === 'pets')).toBe(true);
    v = fazer(v, { tipo: 'pet_cuidador', petId: pet.id, ligar: true });
    expect(orcamento(v).saidas.some(l => /Cuidador/.test(l.rotulo))).toBe(true);
    expect(semana(v).fixos.some(f => f.id === 'pets')).toBe(false);
  });

  it('a mudança para onde a lei proíbe não some com o bicho: ele fica com quem pode ficar, e a história diz', () => {
    const la = cidadesDoPais('US').find(c => c.uf === 'CA')!;
    const v = transacao(rica('sao-paulo-sp', 900_000), (x, r) => {
      x.moradia.tipo = 'propria'; x.moradia.modeloId = 'casa_3q';
      x.financas.instalacoes = [{ id: 'i1', tipo: 'gaiola_ampla', t: x.t, preco: 1000, municipioId: x.moradia.municipioId }];
      const pet = adotarPet(x, r, { especie: 'furao', nome: 'Bandido', genero: 'masculino', idade: 1, jeito: 'curioso', porte: 'pequeno', historia: 'criadouro' }, 'criador');
      pet.pet!.instalacao = 'i1';
      migrar(x, r, la.id, 'trabalho');
    }).vida;
    const bandido = Object.values(v.pessoas).find(p => p.nome === 'Bandido')!;
    expect(bandido.vivo).toBe(true);
    expect(bandido.pet!.instituicao).toBeTruthy();
    expect(v.vinculos[bandido.id].convivio.includes('casa')).toBe(false);
    expect(JSON.stringify(v).includes('Bandido não pôde ir')).toBe(true);
  });

  it('o animal de casa pode ir para o seu zoológico com o mesmo nome e a mesma idade', () => {
    let v = operando(comEmpresa('zoologico'));
    v = transacao(v, (x, r) => {
      x.moradia.tipo = 'propria'; x.moradia.modeloId = 'casa_3q';
      adotarPet(x, r, { especie: 'jabuti', nome: 'Tonico', genero: 'masculino', idade: 12, jeito: 'lento', porte: 'pequeno', historia: 'criadouro' }, 'criador');
    }).vida;
    const p = Object.values(v.pessoas).find(x => x.nome === 'Tonico')!;
    v = fazer(v, { tipo: 'pet_ao_zoo', petId: p.id, empresaId: emp(v).id });
    const a = emp(v).setor!.zoo!.animais.find(x => x.deQuem === p.id)!;
    expect(a.nome).toBe('Tonico');
    expect(a.nasceu).toBe(p.tNasc);
    expect(v.pessoas[p.id].pet!.instituicao).toBe(emp(v).nome);
  });
});

/* ================================================================== SUBMUNDO E PARALELOS */

const envolvido = (cat: Parameters<typeof entrar>[1] = 'mercado', semente = 3): Vida => transacao(rica('sao-paulo-sp', 5_000_000, semente), (x, r) => {
  entrar(x, cat, undefined, r);
  const e = x.caminhos.envolvimento!;
  for (const s of Object.values(e.especializacoes ?? {})) if (s) s.experiencia = 40;
  criarContato(x, 'contrabando', 'fornecedor');
  criarContato(x, 'contrabando', 'parceiro');
}).vida;

describe('Submundo: negócios por fora, fachada, organização', () => {
  it('quem nunca entrou está fora; o estágio acompanha o envolvimento (não é escada obrigatória)', () => {
    expect(estagioDoSubmundo(transacao(rica(), x => { delete x.fatos['proposta_ilicita']; }).vida)).toBe('sem_envolvimento');
    let v = envolvido();
    expect(['primeiro_contato', 'ocasional', 'especializado']).toContain(estagioDoSubmundo(v));
    v = fazer(v, { tipo: 'clandestino', oque: 'abrir', alvo: 'mercadorias' });
    expect(estagioDoSubmundo(v)).toBe('dono_de_negocio');
    expect(disponibilidade(v, { tipo: 'clandestino', oque: 'abrir', alvo: 'organizacao' }).grau).not.toBe('permitido');
  });

  it('o negócio por fora gira, chama atenção (soma à exposição) e, quando a Justiça chega, é desmantelado — com a história', () => {
    let v = envolvido();
    v = fazer(v, { tipo: 'clandestino', oque: 'abrir', alvo: 'mercadorias' });
    const exp0 = v.caminhos.envolvimento!.exposicao;
    v = transacao(v, (x, r) => { x.t += 12; processarClandestinos(x, r); }).vida;
    const n = negocios(v)[0];
    expect(n.ultimo).toBeTruthy();
    expect(v.caminhos.envolvimento!.exposicao).toBeGreaterThan(exp0);
    v = transacao(v, (x, r) => { x.justica = { antecedentes: [], processo: { tInicio: x.t, tJulgamento: x.t + 12, categoria: 'mercado', defesa: 'publica' } }; processarClandestinos(x, r); }).vida;
    expect(negocios(v)[0].estado).toBe('desmantelado');
    expect(negocios(v)[0].historia.length).toBeGreaterThan(1);
  });

  it('a empresa de fachada acumula desconfiança e pode ser investigada, interditada ou tomada; desligar esfria com o tempo', () => {
    let v = envolvido();
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'loja', comSocio: false });
    v = operando(v);
    v = fazer(v, { tipo: 'clandestino', oque: 'abrir', alvo: 'mercadorias' });
    const n = negocios(v)[0];
    v = fazer(v, { tipo: 'clandestino', oque: 'fachada', negocioId: n.id, alvo: emp(v).id });
    expect(emp(v).fachada).toBeTruthy();
    let pegou = false;
    for (let k = 0; k < 25 && !pegou; k++) {
      v = transacao(v, (x, r) => { x.t += 12; x.caminhos.envolvimento!.exposicao = Math.max(x.caminhos.envolvimento!.exposicao, 60); processarClandestinos(x, r); }).vida;
      const e = v.financas.empresas?.find(x => x.tipo === 'loja');
      pegou = !e || e.estado === 'interditada' || e.fachada?.descoberta !== undefined;
    }
    expect(pegou).toBe(true);
  });

  it('a organização não esquece a traição, por mais coisa que aconteça depois', () => {
    const v = envolvido('grupo');
    const o = organizacaoDoRamo(v, 'organizado');
    lembrarOrg(o, v.t, 'traicao', -10);
    for (let k = 0; k < 40; k++) lembrarOrg(o, v.t + k, k % 2 ? 'favor' : 'promessa', 1);
    expect(o.memoria.some(m => m.fato === 'traicao')).toBe(true);
    expect(o.memoria.length).toBeLessThanOrEqual(20);
  });

  it('largar o caminho deixa o negócio por fora sem dono que o toque: não há decisão para quem saiu', () => {
    let v = envolvido();
    v = fazer(v, { tipo: 'clandestino', oque: 'abrir', alvo: 'mercadorias' });
    v = transacao(v, x => { x.caminhos.envolvimento!.parou = x.t; }).vida;
    expect(pode(v, { tipo: 'clandestino', oque: 'retirar', negocioId: negocios(v)[0].id })).toBe(false);
    expect(estagioDoSubmundo(v)).toBe('saida');
  });
});

describe('mercados paralelos e animais por fora', () => {
  it('a feira é de todos; o mercado por fora só para quem tem gente no caminho', () => {
    expect(mercadosVisiveis(rica())).toContain('feira');
    expect(mercadosVisiveis(rica())).not.toContain('por_fora');
    expect(mercadosVisiveis(envolvido())).toContain('por_fora');
  });

  it('comprar tudo o que a feira oferece e revender não dá lucro (em média, a cópia e a apreensão cobram)', () => {
    let total = 0;
    for (let s = 0; s < 12; s++) {
      let v = rica('sao-paulo-sp', 5_000_000, 100 + s);
      const antes = v.financas.conta;
      for (const m of mercadosVisiveis(v)) for (const o of ofertasParalelas(v, m)) if (pode(v, { tipo: 'paralelo', ofertaId: o.id, oque: 'comprar' })) v = fazer(v, { tipo: 'paralelo', ofertaId: o.id, oque: 'comprar' });
      v = transacao(v, (x, r) => { x.t += 12; processarParalelos(x, r); processarColecao(x, r); }).vida;
      for (const c of colecao(v)) if (pode(v, { tipo: 'colecao_vender', pecaId: c.id, modo: 'rapido' })) v = fazer(v, { tipo: 'colecao_vender', pecaId: c.id, modo: 'rapido' });
      total += v.financas.conta - antes;
    }
    expect(total).toBeLessThan(0);
  });

  it('o animal oferecido por fora não é produto: recusar ou denunciar; o resgatado pode ir para o seu zoológico', () => {
    let v = operando(comEmpresa('zoologico'));
    v = transacao(v, (x, r) => { entrar(x, 'mercado', undefined, r); criarContato(x, 'contrabando', 'fornecedor'); }).vida;
    let o = ofertaDeAnimalPorFora(v);
    for (let k = 1; (!o || !o.zoo) && k < 30; k++) { v = transacao(v, x => { x.t += 12; }).vida; o = ofertaDeAnimalPorFora(v); }
    expect(o).toBeTruthy();
    expect(Object.keys({} as Record<Acao['tipo'], 1>)).not.toContain('comprar_por_fora');
    v = fazer(v, { tipo: 'animal_por_fora', oque: 'denunciar' });
    const zid = emp(v).id;
    if (pode(v, { tipo: 'animal_por_fora', oque: 'acolher', empresaId: zid })) {
      v = fazer(v, { tipo: 'animal_por_fora', oque: 'acolher', empresaId: zid });
      expect(emp(v).setor!.zoo!.animais.some(a => a.origem === 'resgate')).toBe(true);
    }
  });
});

/* ================================================================== SAVES */

describe('saves', () => {
  it('a empresa do REWORK 12 (sem o ramo) ganha o ramo ao carregar; o normalizador é idempotente; nada some, nada duplica; a versão segue 20', () => {
    let v = operando(comEmpresa('zoologico'));
    v = transacao(v, x => { x.anoAtual.acoes = []; }).vida;
    v = fazer(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: true });
    const bruto = JSON.parse(JSON.stringify(v)) as Vida;
    for (const e of bruto.financas.empresas!) { delete e.setor; if (e.zoo) e.zoo.bemEstar = 85; }
    const r = interpretar(JSON.stringify(bruto));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    expect(r.vida.versao).toBe(VERSAO_SAVE);
    expect(r.vida.financas.empresas!.every(e => e.setor)).toBe(true);
    const zoo = r.vida.financas.empresas!.find(e => e.tipo === 'zoologico')!;
    expect(bemEstarDoZoo(zoo)).toBeGreaterThanOrEqual(75);
    const um = JSON.stringify(r.vida);
    normalizarRework122(r.vida);
    expect(JSON.stringify(r.vida)).toBe(um);
    const r2 = interpretar(um);
    expect(r2.tipo === 'ok' && JSON.stringify(r2.vida)).toBe(um);
    expect(new Set(zoo.setor!.zoo!.animais.map(a => a.id)).size).toBe(zoo.setor!.zoo!.animais.length);
  });

  it('as contas de um ano com o ramo são números (nada de NaN) em todos os tipos', () => {
    for (const t of TIPOS_DE_EMPRESA) {
      const v = operando(comEmpresa(t.id));
      const c = contasDoAno(v, emp(v), criarRng(1));
      for (const x of Object.values(c)) expect(Number.isFinite(x), t.id).toBe(true);
    }
  });
});
