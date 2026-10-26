/**
 * Saves das cenas do QA visual do REWORK 12.25 (`rework125.mjs`), todos vividos pelo motor depois de montados:
 *   profissional  São Paulo, 34: furtos e contrabando, contatos com ficha (favores, amizade), propostas abertas, uma encomenda
 *                 correndo, família que sabe
 *   lider         Rio, 45: na liderança de uma organização (posto 5), com disputa aberta, território e prioridade
 *   processado    Recife, 32: respondendo a processo no ano da audiência (as etapas, a estratégia, a audiência)
 *   procurado     São Paulo, 30: faltou à audiência — há um mandado
 *   preso         Recife, 38: cumprindo pena (cartas, saúde, a rotina de dentro)
 *   ex            Belo Horizonte, 44: saiu aos poucos; o histórico e a ficha
 *   nunca         São Paulo, 25: nunca entrou (a porta)
 *   npx esbuild scripts/playtest/gerarRework125.ts --bundle --platform=node --format=esm --outfile=<scratch>/g.mjs && SP=<pasta> node <scratch>/g.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto, comParente } from '../../src/motor/__tests__/cenarios';
import { idade, transacao } from '../../src/motor/nucleo';
import { criarRng, rngDe } from '../../src/motor/rng';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { avancarAno } from '../../src/motor/ano';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { criarContato } from '../../src/motor/sistemas/submundo';
import { garantirCidade, orgsDaCidade, relacaoCom, orgViva } from '../../src/motor/sistemas/faccoes';
import { proporEncomenda, TIPOS } from '../../src/motor/sistemas/encomendas';
import { abrirProcesso } from '../../src/motor/sistemas/justica';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa125`;
mkdirSync(`${SP}/saves`, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; delete v.fila; v.caminhos.pendente = undefined; writeFileSync(`${SP}/saves/vida-r125-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const tenta = (v: Vida, a: Acao): Vida => { if (!podeTentar(disponibilidade(v, a))) { console.log('  não deu:', JSON.stringify(a).slice(0, 100), disponibilidade(v, a).motivo); return v; } const r = executar(v, a).vida; r.momento = null; delete r.fila; return r; };
const responder = (v: Vida) => { for (let k = 0; k < 12 && v.momento; k++) { const op = v.momento.opcoes.find(o => !o.bloqueio && !/parar|largar|sair|faltar|prometer|mudar|denunciar|cooperar|entregar|assumir|cortar/.test(o.id)) ?? v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida; } return v; };
const ano = (v: Vida) => { v = responder(avancarAno(v).vida); v.momento = null; delete v.fila; return v; };
const base = (i: number, semente: number, cidade: string, conta = 150_000) => {
  const v = adulto(i, { semente, municipioId: cidade });
  v.trabalho.atual = undefined;
  contratar(v, criarRng(semente), ocupacao('assistente_adm'));
  v.financas = { ...v.financas, conta, dividas: [], negativado: false };
  v.momento = null; delete v.fila; v.justica = undefined; v.caminhos.envolvimento = undefined;
  return v;
};
const crime = (acao: Extract<Acao, { tipo: 'crime' }>['acao']): Acao => ({ tipo: 'crime', acao });

// O profissional: anos de caminho vividos pelo motor, depois as propostas e uma encomenda correndo.
{
  let v = base(30, 71, 'sao-paulo-sp');
  comParente(v, 'mae', 62, 'feminino', 70);
  v = transacao(v, (x, r) => { entrar(x, 'patrimonial', undefined, r); garantirCidade(x); const a = criarContato(x, 'furtos', 'parceiro'); x.caminhos.envolvimento!.fichas![a].confianca = 65; }).vida;
  for (let k = 0; k < 4; k++) {
    for (const x of v.caminhos.envolvimento!.encomendas?.filter(e => e.estado === 'aberta') ?? []) v = tenta(v, crime({ area: 'encomenda', oque: 'aceitar', id: x.id }));
    v = tenta(v, { tipo: 'submundo', oque: 'servico_pequeno', ramo: 'furtos' });
    v = ano(v);
  }
  v = tenta(v, { tipo: 'submundo', oque: 'entrar_ramo', ramo: 'contrabando' });
  v = transacao(v, x => {
    const e = x.caminhos.envolvimento!;
    const f = criarContato(x, 'contrabando', 'fornecedor', 3); e.fichas![f].favores = 1; e.fichas![f].amizade = 55; e.fichas![f].confianca = 58;
    const c = criarContato(x, 'contrabando', 'comprador', 4); e.fichas![c].favores = -1;
    proporEncomenda(x, rngDe('qa', 1), 'furtos', {}, 1);
    proporEncomenda(x, rngDe('qa', 2), 'contrabando', { pessoaId: f }, 2);
    e.familia = { [Object.keys(x.vinculos).find(id => x.vinculos[id].parentesco === 'mae')!]: { sabe: 2, postura: 'preocupada', t: x.t } };
  }).vida;
  const quem = Object.entries(v.caminhos.envolvimento!.fichas!).find(([id, f]) => f.afastado === undefined && f.traiu === undefined && f.confianca >= 30 && v.pessoas[id]?.vivo);
  if (quem) v = tenta(v, crime({ area: 'encomenda', oque: 'delegar', pessoaId: quem[0], trabalho: TIPOS[quem[1].especialidade][0].id }));
  salvar('profissional', v);
}

// O líder: posto 5 numa organização do Rio, disputa aberta, a presença na própria região.
{
  let v = base(42, 72, 'rio-de-janeiro-rj', 2_000_000);
  v = transacao(v, (x, r) => {
    entrar(x, 'grupo', undefined, r); garantirCidade(x);
    const e = x.caminhos.envolvimento!;
    for (const s of Object.values(e.especializacoes ?? {})) if (s) { s.experiencia = 70; s.posto = 4; }
    e.reputacao = 75;
    const o = orgsDaCidade(x).find(z => z.ramo === 'organizado')!;
    const rel = relacaoCom(x, o); rel.relacao = 'membro'; rel.nivel = 5; rel.lealdade = 72;
    criarContato(x, 'organizado', 'protegido'); criarContato(x, 'organizado', 'parceiro', 1);
  }).vida;
  for (let k = 0; k < 3; k++) v = ano(v);
  v = transacao(v, x => { const o = orgsDaCidade(x).find(z => z.ramo === 'organizado')!; const ov = orgViva(x, o.id)!; const cands = ov.quadro.filter(q => q.estado === 'ativo' && q.nivel < 6).slice(0, 2).map(q => q.id); ov.disputa = { t: x.t, candidatos: [...cands, 'jogador'], motivo: 'quem mandava foi preso' }; ov.coesao = 38; }).vida;
  salvar('lider', v);
}

// Processado, no ano da audiência.
{
  let v = base(31, 73, 'recife-pe');
  v = transacao(v, (x, r) => { entrar(x, 'mercado', undefined, r); garantirCidade(x); x.t += 36; abrirProcesso(x, r, 'mercado'); if (x.justica!.prisao) x.justica!.prisao = undefined; x.justica!.processo!.tJulgamento = x.t + 6; }).vida;
  salvar('processado', v);
  // E o mesmo, depois de faltar à audiência: o mandado.
  const w = tenta(v, crime({ area: 'justica', oque: 'audiencia_faltar' }));
  salvar('procurado', w);
}

// Preso.
{
  let v = base(36, 74, 'recife-pe');
  comParente(v, 'mae', 60, 'feminino', 65);
  v = transacao(v, (x, r) => { entrar(x, 'patrimonial', undefined, r); x.caminhos.envolvimento!.parou = x.t; x.justica = { antecedentes: [{ t: x.t, categoria: 'patrimonial', desfecho: 'prisao', anos: 4 }], prisao: { tInicio: x.t - 12, tFim: x.t + 24, regime: 'fechado', penaMeses: 48, disciplina: 70 } }; }).vida;
  salvar('preso', v);
}

// Ex: saiu aos poucos, com ficha antiga.
{
  let v = base(40, 75, 'belo-horizonte-mg');
  v = transacao(v, (x, r) => { entrar(x, 'patrimonial', undefined, r); garantirCidade(x); criarContato(x, 'furtos', 'parceiro'); x.justica = { antecedentes: [{ t: x.t - 60, categoria: 'patrimonial', desfecho: 'alternativa' }] }; }).vida;
  for (let k = 0; k < 2; k++) v = ano(v);
  v = tenta(v, crime({ area: 'rumo', oque: 'sair_aos_poucos' }));
  for (let k = 0; k < 2; k++) v = ano(v);
  salvar('ex', v);
}

// Nunca entrou.
salvar('nunca', base(25, 76, 'sao-paulo-sp'));
