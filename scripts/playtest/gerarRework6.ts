/**
 * Saves para as capturas do REWORK 6 (`rework6.mjs`) — uma vida para cada tela da auditoria visual:
 *   bebe     — recém-nascida (a tela do nascimento: o retrato que nasce é o mesmo que cresce)
 *   crianca  — 9 anos, na escola (Linha da Vida curta, Formação)
 *   jovem    — 20 anos (Formação, Pessoas, Tempo livre)
 *   vivida   — 38 anos, vida comum
 *   idosa    — 80 anos de biografia (Linha da Vida longa: o botão de avançar precisa continuar à mão)
 *   decisao  — 30 anos, com uma decisão aberta (o modal)
 *   atleta / presa / rica — os casos do REWORK 5 (carreira especial, prisão, dinheiro grande e redes)
 *   npx esbuild scripts/playtest/gerarRework6.ts --bundle --platform=node --outfile=<scratch>/g6.cjs && OUT=<pasta> node <scratch>/g6.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { executar } from '../../src/motor/acoes';
import { avancarAno } from '../../src/motor/ano';
import { transacao } from '../../src/motor/nucleo';
import { viverAte, nova, responderTudo } from '../../src/motor/__tests__/ajuda';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { criarProposta, fecharTemporada } from '../../src/motor/sistemas/esporte';
import type { Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida, manterMomento = false) => { if (!manterMomento) v.momento = null; writeFileSync(`${OUT}/vida-r6-${nome}.json`, JSON.stringify(v)); };

async function principal() {
  await carregarMundo();
  salvar('bebe', nova({ semente: 7310, genero: 'masculino' }));
  salvar('crianca', responderTudo(viverAte(nova({ semente: 4417 }), 9)));
  salvar('jovem', responderTudo(viverAte(nova({ semente: 5120, genero: 'masculino', municipioId: 'sao-paulo-sp' }), 20)));
  salvar('vivida', responderTudo(viverAte(nova({ semente: 9091 }), 37)));
  // uma vida que acabou (a tela do fim e do legado)
  for (let s = 2024; s < 2060; s++) { const v = responderTudo(viverAte(nova({ semente: s, genero: 'feminino', municipioId: 'salvador-ba' }), 95)); if (v.morte) { salvar('morta', v); break; } }
  // a primeira semente cuja vida chega viva aos 80
  for (let s = 2024; s < 2060; s++) { const v = responderTudo(viverAte(nova({ semente: s, genero: 'feminino', municipioId: 'salvador-ba' }), 80)); if (!v.morte) { salvar('idosa', v); break; } }
  // decisão: vive até haver um momento aberto aos 30 e poucos
  let d = viverAte(nova({ semente: 3303 }), 29);
  for (let k = 0; k < 15 && !d.momento; k++) d = avancarAno(d).vida;
  salvar('decisao', d, true);
  // presa
  let p = adulto(28, { semente: 48 });
  p.justica = { antecedentes: [{ t: p.t - 14, categoria: 'mercado', desfecho: 'prisao', anos: 5 }], prisao: { tInicio: p.t - 14, tFim: p.t + 30, regime: 'fechado', penaMeses: 60, disciplina: 72, pendente: 'faccao', tPendente: p.t } };
  p.trabalho.atual = undefined;
  p = executar(p, { tipo: 'prisao', oque: 'estudar' }).vida;
  salvar('presa', p);
  // atleta
  let a = adulto(24, { semente: 52, genero: 'masculino' });
  a = transacao(a, (x, r) => {
    x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Sport', nivel: 3, tInicio: x.t - 96, tFase: x.t - 48, lesoes: 1, municipioId: x.moradia.municipioId, reputacao: 58, contratoAte: x.t + 30, espaco: 'titular', posicao: 'meia' };
    x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Sport', contrato: 'clt', salario: 18000, tInicio: x.t - 48, desempenho: 70, municipioId: x.moradia.municipioId, carga: 'integral' };
    const f = x.caminhos.frentes.futebol ?? (x.caminhos.frentes.futebol = { interesse: 80, meses: 0, habilidade: 0, tInicio: x.t - 16 * 12, tUltimo: x.t, retomadas: 0, auge: 0 });
    f.habilidade = 82; f.auge = 82; f.meses = 200; f.tInicio = x.t - 16 * 12;
    for (let k = 4; k >= 1; k--) { x.t -= 12 * k; fecharTemporada(x, r, x.caminhos.esporte!); x.t += 12 * k; }
    criarProposta(x, x.caminhos.esporte!, 4, 'maior');
  }).vida;
  salvar('atleta', a);
  // rica
  let rica = adulto(50, { semente: 53 });
  rica.financas.conta = 3_400_000_000;
  rica = executar(rica, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } } as Parameters<typeof executar>[1]).vida;
  rica.redes!.contas.instagram.seguidores = 2_300_000;
  for (let k = 0; k < 2; k++) { rica = avancarAno(rica).vida; rica = responderTudo(rica); }
  salvar('rica', rica);
}
void principal();
