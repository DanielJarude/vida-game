/**
 * Saves para as capturas do REWORK 5 (`rework5.mjs`):
 *   presa   — 28 anos, regime fechado, estudando na unidade, com uma situação do pavilhão à espera de resposta
 *   atleta  — 24 anos, futebol profissional com temporadas, totais e uma proposta com taxa de transferência
 *   vivida  — 38 anos, vida comum com amigos, colegas e família (o "Enquanto isso" aparece ao viver o ano)
 *   rica    — 50 anos, R$ 3,4 bilhões na conta (o valor que precisa caber no celular) e uma conta grande no Instagram
 *   npx esbuild scripts/playtest/gerarRework5.ts --bundle --platform=node --outfile=<scratch>/g5.cjs && OUT=<pasta> node <scratch>/g5.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { executar } from '../../src/motor/acoes';
import { avancarAno } from '../../src/motor/ano';
import { transacao } from '../../src/motor/nucleo';
import { viverAte, nova } from '../../src/motor/__tests__/ajuda';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { criarProposta, fecharTemporada } from '../../src/motor/sistemas/esporte';
import type { Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-r5-${nome}.json`, JSON.stringify(v)); };
const responder = (v: Vida) => { for (let k = 0; k < 10 && v.momento; k++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; return v; };

async function principal() {
  await carregarMundo();
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
  // vivida
  let v = viverAte(nova({ semente: 9091 }), 37);
  v = responder(v);
  salvar('vivida', v);
  // rica
  let rica = adulto(50, { semente: 53 });
  rica.financas.conta = 3_400_000_000;
  rica = executar(rica, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } } as Parameters<typeof executar>[1]).vida;
  rica.redes!.contas.instagram.seguidores = 2_300_000;
  for (let k = 0; k < 2; k++) { rica = avancarAno(rica).vida; rica = responder(rica); }
  salvar('rica', rica);
}
void principal();
