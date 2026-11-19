// VIDA 27 — saves de QA (OUT=<pasta>/saves). As cenas que abrem uma decisão guardam o `momento` (a tela abre nela).
import { nova, viver } from '../../src/motor/__tests__/ajuda';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { transacao } from '../../src/motor/nucleo';
import { executar } from '../../src/motor/acoes';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { garantirCidade, orgsDaCidade, relacaoCom, definirNivel } from '../../src/motor/sistemas/faccoes';
import { espolio21 } from '../../src/motor/v21/crime/espolio21';
import { MODELOS_ESPOLIO21 } from '../../src/motor/dados21/crime/espolio21';
import { proporEncomenda } from '../../src/motor/sistemas/encomendas';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { contratarEmParalela } from '../../src/motor/sistemas/paralelas';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { pessoaNova } from '../../src/motor/__tests__/cenarios';
import { vincular } from '../../src/motor/pessoas';
import { abrirDecisao, conteudoPorId } from '../../src/motor/conteudo/motor';
import { contexto } from '../../src/motor/conteudo/base';
import { escolhasDaExperiencia, viverExperiencia } from '../../src/motor/sistemas/experiencias';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { mkdirSync, writeFileSync } from 'node:fs';
await carregarMundo();
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/v27/saves`; mkdirSync(OUT, { recursive: true });
const salvar = (nome: string, v: Vida, comMomento = false) => { if (!comMomento) v.momento = null; delete v.fila; writeFileSync(`${OUT}/vida-${nome}.json`, JSON.stringify(v)); console.log(nome, v.t, v.momento?.situacaoId ?? ''); };
const abrir = (v: Vida, id: string, papeis: Record<string, string> = {}) => { const d = conteudoPorId(id)!; const p = Object.fromEntries(Object.entries(papeis).map(([k, x]) => [k, v.pessoas[x]])); abrirDecisao(v, d as never, contexto(v, criarRng(1), p)); };

// 1. Crime: segundo no comando, com bens para vender em lote e pedidos com contexto.
{
  let v = viver(nova({ semente: 2701, genero: 'masculino', municipioId: 'sao-paulo-sp' } as never), 32);
  v.financas.conta = 80_000; v.momento = null;
  v = transacao(v, (x, r) => { entrar(x, 'grupo', undefined, r); garantirCidade(x); }).vida;
  const o = orgsDaCidade(v)[0];
  const rel = relacaoCom(v, o); rel.relacao = 'membro'; rel.lealdade = 75; definirNivel(v, rel, 5);
  const es = espolio21(v);
  const m = (id: string, k: number) => { const x = MODELOS_ESPOLIO21.find(y => y.id === id)!; return { id: `q${k}`, modelo: id, categoria: x.categoria, nome: x.nome, valor: x.preco ?? 3000, t: v.t - 2, origem: 'teste', rastreavel: x.rastreavel, calor: 30, estado: 'escondido' as const, local: 'casa_media' as const, conservacao: 0.8 }; };
  es.bens = [m('cel_medio', 1), m('cel_medio', 2), m('cel_medio', 3), m('notebook', 4), m('fone', 5), m('carro_popular', 6), m('rel_mergulho', 7)];
  es.reputacao = 10;
  v = transacao(v, (x, r) => { proporEncomenda(x, r, 'organizado', { orgId: o.id }); proporEncomenda(x, r, 'furtos', {}); }).vida;
  salvar('v27-crime', v);
}
// 2. Joalheria: adulta com dinheiro em São Paulo.
{
  const v = viver(nova({ semente: 2702, genero: 'feminino', municipioId: 'sao-paulo-sp' } as never), 30);
  v.financas.conta = 500_000;
  salvar('v27-joias', v);
}
// 3. Duas carreiras: atleta com o e-sports em paralelo.
{
  let v = viver(nova({ semente: 2703, genero: 'masculino', municipioId: 'recife-pe' } as never), 23);
  v = transacao(v, (x, r) => { contratar(x, r, ocupacao('atleta'), 'oportunidade'); contratarEmParalela(x, () => contratar(x, r, ocupacao('jogador_esports'), 'oportunidade')); }).vida;
  salvar('v27-carreiras', v);
}
// 4. Saúde mental: uma crise (e a cena da crise aberta).
{
  let v = viver(nova({ semente: 2704, genero: 'feminino', municipioId: 'porto-alegre-rs' } as never), 34);
  v.corpo.condicoes.push({ id: 'depressao', nome: 'depressão', tInicio: v.t - 24, cronica: true, gravidade: 2, tratando: false, diagnosticada: false });
  v.mente.felicidade = 18; v.luto = [{ pessoaId: 'x', t: v.t, peso: 80 } as never];
  v.mente.crise27 = { nivel: 2, t: v.t, inicio: v.t - 12, historico: [{ t: v.t, nivel: 2, texto: 'Os dias ficaram pesados demais — uma crise.' }] };
  salvar('v27-mente', structuredClone(v));
  v.fatos['mente27_crise'] = v.t;
  abrir(v, 'mental27_crise');
  salvar('v27-crise', v, true);
}
// 5. Separação: casados há dez anos, com bens dos dois lados (a cena do resumo aberta).
{
  let v = viver(nova({ semente: 2705, genero: 'masculino', municipioId: 'curitiba-pr' } as never), 42);
  v.momento = null;
  const p = pessoaNova(v, 41, 'feminino');
  const vin = vincular(v, p, { origem: 'romance', proximidade: 60, convivio: ['casa'] });
  vin.romance = { estagio: 'casamento', tEstagio: v.t - 120, tInicio: v.t - 130, envolvimento: 50 };
  v.fatos[`uniao_${p.id}`] = v.t - 120; v.fatos[`liquido_uniao_${p.id}`] = 20_000; v.fatos[`patrimonio_uniao_${p.id}`] = 20_000; v.fatos[`herdado_ate_uniao_${p.id}`] = 0; v.fatos[`posses_par_uniao_${p.id}`] = 10_000;
  p.posses = { dinheiro: 90_000, bens: [], historia: [] };
  v.financas.conta = 140_000;
  v.financas.bens.push({ id: 'ap27', tipo: 'imovel', modeloId: 'apto_2q', nome: 'apartamento', valor: 420_000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 } as never);
  v = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'terminar' }).vida;
  salvar('v27-separacao', v, true);
}
// 6. O encontro por acaso no shopping (a cena aberta).
{
  const v = viver(nova({ semente: 2706, genero: 'feminino', municipioId: 'salvador-ba' } as never), 27);
  v.momento = null;
  const p = pessoaNova(v, 28, 'feminino');
  const vin = vincular(v, p, { origem: 'escola', proximidade: 55 });
  vin.tUltimoContato = v.t - 72;
  (v.celular15 ??= { ano: 0, msgs: [] } as never).encontro27 = { t: v.t, lugar: 'shopping', pid: p.id };
  abrir(v, 'enc27_acaso', { pessoa: p.id });
  salvar('v27-encontro', v, true);
}
// 7. O passaporte com várias viagens (o mesmo país duas vezes).
{
  const v = viver(nova({ semente: 2707, genero: 'masculino', municipioId: 'belo-horizonte-mg' } as never), 38);
  v.financas.conta = 400_000;
  const ids = [...new Set(escolhasDaExperiencia(v, 'viagem_exterior').map(e => e.id.split(':')[0]))];
  for (const [k, d] of [ids[0], ids[1], ids[0], ids[2]].entries()) { const esc = escolhasDaExperiencia(v, 'viagem_exterior').find(e => e.id.startsWith(d))!; viverExperiencia(v, criarRng(k), 'viagem_exterior', esc.id); v.t += 3; }
  const nac = escolhasDaExperiencia(v, 'viagem_pais')[0]; viverExperiencia(v, criarRng(9), 'viagem_pais', nac.id);
  salvar('v27-passaporte', v);
}
// 8–9. A casa em outro lugar: um subúrbio americano e um sítio.
{
  const v = viver(nova({ semente: 2708, genero: 'feminino', municipioId: 'sao-paulo-sp' } as never), 35);
  salvar('v27-casa-sp', v);
}
