/**
 * Cenários visuais do pacote pós-playtest: o volante campeão (palmarés,
 * histórico por clube, seleção, momentos da carreira), o ex-jogador famoso
 * na política (o mesmo nome em Você e na Política), a viajante (as portas
 * das experiências), a estudante no time da escola (a história da
 * atividade) e o match do aplicativo (a trajetória em Pessoas).
 *   npx esbuild scripts/playtest/gerarPacotePlaytest.ts --bundle --platform=node --outfile=/tmp/gpp.cjs && SP=/tmp/vida-pp node /tmp/gpp.cjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { encerrarCarreira, entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { registrarTemporada } from '../../src/motor/sistemas/palmares';
import { entrarNaPolitica } from '../../src/motor/sistemas/politica';
import { anoDaAtividade } from '../../src/motor/sistemas/formacao';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import type { Temporada, Vida } from '../../src/motor/tipos';

const SP = process.env.SP ?? '/tmp/vida-pp';
mkdirSync(SP, { recursive: true });
function viva(i: number, semente: number, genero: 'masculino' | 'feminino' = 'masculino', municipioId = 'sao-paulo-sp'): Vida {
  let v = criarVida({ nome: genero === 'feminino' ? 'Lia' : 'Davi', sobrenome: 'Moura', genero, municipioId, semente });
  for (let k = 0; k < i; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  return v;
}
const salvar = (nome: string, v: Vida) => { v.momento = null; v.caminhos.pendente = undefined; writeFileSync(`${SP}/${nome}.json`, JSON.stringify(v)); };
const atleta = (x: Vida, h = 90) => {
  garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: h, interesse: 90, meses: 140, auge: h });
  x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = [];
  entrarNaBase(x, 'futebol', 'sao-paulo-sp', 'São Paulo'); profissionalizar(x, criarRng(1), 4); x.caminhos.esporte!.posicao = 'volante';
};
const temporada = (o: Partial<Temporada>): Temporada => ({ ano: 2045, clube: 'São Paulo', nivel: 4, posicao: 'volante', partidas: 32, titular: 28, gols: 2, assistencias: 3, defesa: 68, nota: 7.8, colocacao: 1, mesesFora: 0, ...o });

salvar('campeao', transacao(viva(31, 3), (x, r) => {
  atleta(x);
  const e = x.caminhos.esporte!;
  for (const [k, t] of [temporada({ ano: 2041, clube: 'Guarani', nivel: 3, colocacao: 3, defesa: 55 }), temporada({ ano: 2042, clube: 'Guarani', nivel: 3, colocacao: 2, defesa: 61 }), temporada({ ano: 2043, colocacao: 6, defesa: 60 }), temporada({ ano: 2044, colocacao: 4, defesa: 66, nota: 8.1 }), temporada({ ano: 2045 })].entries()) { void k; (e.temporadas ??= []).push(t); registrarTemporada(x, r, e, t); }
  e.selecao = { radar: x.t - 36, convocacoes: 3, jogos: 7, gols: 0, tPrimeira: x.t - 24, tEstreia: x.t - 24, tUltima: x.t, titular: false, torneios: [{ ano: 2046, nome: 'o torneio mundial de seleções', campanha: 'caiu nas quartas', jogos: 2 }] };
  x.caminhos.situacoes = [{ id: 'fut_lance_construcao', t: x.t - 12, trajetoria: 'futebol', intencao: 'Tentar o passe arriscado', desfecho: 'otimo', texto: 'Deu a assistência decisiva aos 78 minutos de um clássico, pelo São Paulo.' }, { id: 'fut_jornalista', t: x.t, trajetoria: 'futebol', intencao: 'Responder com diplomacia', desfecho: 'bom', texto: 'Resposta pronta, sem notícia.' }];
  x.notoriedade = { valor: 58, pico: 60, fonte: 'esporte', t: x.t, origens: { esporte: 60 } };
}).vida);

salvar('politico', transacao(viva(38, 4), x => {
  atleta(x);
  encerrarCarreira(x, x.caminhos.esporte!, 'escolha');
  x.notoriedade = { valor: 66, pico: 82, fonte: 'esporte', t: x.t, origens: { esporte: 82 } };
  entrarNaPolitica(x, 'notoriedade');
  x.financas.conta = 80000;
}).vida);

salvar('viajante', transacao(viva(40, 5, 'feminino', 'recife-pe'), x => { x.financas.conta = 400000; }).vida);

salvar('estudante', transacao(viva(13, 6, 'feminino', 'recife-pe'), x => {
  garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: 66, interesse: 85, meses: 50 });
  x.rotinas.push({ id: 'time_escola', tInicio: x.t - 36, nivel: 1 });
  for (let k = 0; k < 3; k++) anoDaAtividade(x, 'time_escola', 1);
}).vida);

salvar('app', transacao(viva(28, 8), x => {
  x.eu.atracao = 'mulheres';
  const p = criarPessoa(x, criarRng(3), { idade: 27, genero: 'feminino', municipioId: x.moradia.municipioId });
  p.nome = 'Aurora'; p.atracao = 'homens';
  const vin = vincular(x, p, { origem: 'online', proximidade: 30, estagio: 'conhecido' });
  vin.contexto = { via: 'app', abertura: 0.78, busca: 'relacionamento', etapa: 'conversa' };
  vin.fases = [{ fase: 'conhecido', t: x.t }, { fase: 'match', t: x.t }, { fase: 'conversa', t: x.t }];
  vin.romance = { estagio: 'interesse', tEstagio: x.t, envolvimento: 58 };
}).vida);
console.log(`cenários em ${SP}`);
