/**
 * Cenários visuais da generalização de carreiras e legado:
 *   veterana     62 anos: ex-tenista, depois contadora, depois vereadora — Você · "O que você construiu"
 *   pivo         jogador de basquete profissional — Trabalho · "A carreira no esporte" por equipe
 *   atriz        a filmografia, o primeiro protagonista, a indicação — Você
 *   pesquisador  a obra acadêmica item por item — Você
 *   npx esbuild scripts/playtest/gerarGeneralizacao.ts --bundle --platform=node --outfile=/tmp/gg.cjs && SP=/tmp/vida-gen node /tmp/gg.cjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { encerrarCarreira, entrarNaBase, fecharTemporada, processarEsporte, profissionalizar } from '../../src/motor/sistemas/esporte';
import { registrarTemporada } from '../../src/motor/sistemas/palmares';
import { processarSelecao } from '../../src/motor/sistemas/selecao';
import { entrarNaPolitica, registrarNoMandato } from '../../src/motor/sistemas/politica';
import { contratar, encerrarEmprego, registrarPosto } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { concluirProducao, iniciarProducao, novaProposta } from '../../src/motor/sistemas/audiovisual';
import { executarAcademia, processarAcademia, vidaAcademica } from '../../src/motor/sistemas/academia';
import type { Dominio, Vida } from '../../src/motor/tipos';
import { anoDe } from '../../src/motor/tempo';

const SP = process.env.SP ?? '/tmp/vida-gen';
mkdirSync(SP, { recursive: true });
function viva(i: number, semente: number, genero: 'masculino' | 'feminino' = 'feminino', municipioId = 'sao-paulo-sp'): Vida {
  let v = criarVida({ nome: genero === 'feminino' ? 'Helena' : 'Rui', sobrenome: 'Bastos', genero, municipioId, semente });
  for (let k = 0; k < i; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  return v;
}
const salvar = (nome: string, v: Vida) => { v.momento = null; v.caminhos.pendente = undefined; writeFileSync(`${SP}/${nome}.json`, JSON.stringify(v)); };
function profissional(x: Vida, d: Dominio, h: number, clube: string, anos: number): void {
  garantirFrente(x, d); Object.assign(x.caminhos.frentes[d]!, { habilidade: h, interesse: 90, meses: 140, auge: h });
  x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = []; x.financas.conta += 400000;
  entrarNaBase(x, d, x.moradia.municipioId, clube); profissionalizar(x, criarRng(1), 3);
  const e = x.caminhos.esporte!;
  // O ano de verdade (a temporada, o palmarés, a seleção, o mercado): o mesmo processamento do jogo.
  for (let k = 0; k < anos; k++) { x.t += 12; processarEsporte(x, criarRng(70 + k)); }
  void e; void fecharTemporada; void registrarTemporada; void processarSelecao;
}

// A veterana: o circuito de tênis (dos 20 aos 31), a contabilidade (dos 33 aos 55, com promoção dentro da empresa), a Câmara (aos 58).
salvar('veterana', transacao(viva(20, 11), (x, r) => {
  profissional(x, 'tenis', 90, 'academia de tênis de São Paulo', 11);
  encerrarCarreira(x, x.caminhos.esporte!, 'escolha');
  x.t += 24;
  x.educacao.concluidos.push({ cursoId: 'contabilidade', nome: 'Ciências Contábeis', nivel: 'superior', area: 'contabilidade', tFim: x.t, instituicao: 'uma faculdade particular de São Paulo' });
  const e = contratar(x, r, ocupacao('assistente_adm'), 'vaga'); e.empregador = 'a Distribuidora Paulista';
  x.t += 72; registrarPosto(x, e); e.ocupacaoId = 'analista_adm'; e.tPosto = x.t;
  x.t += 96; registrarPosto(x, e); e.ocupacaoId = 'contador'; e.tPosto = x.t;
  x.t += 96; encerrarEmprego(x, 'aposentadoria');
  x.notoriedade = { valor: 30, pico: 62, fonte: 'esporte', t: x.t, origens: { esporte: 62 } };
  entrarNaPolitica(x, 'notoriedade');
  const p = x.caminhos.politica!;
  x.t += 24;
  p.historico.push({ t: x.t, cargo: 'vereador', resultado: 'eleito' });
  p.mandato = { cargo: 'vereador', tInicio: x.t + 1, tFim: x.t + 49, aprovacao: 61, feito: 2 };
  x.trabalho.atual = { ocupacaoId: 'vereador', empregador: 'a Câmara Municipal de São Paulo', contrato: 'eletivo', salario: 20000, tInicio: x.t + 1, desempenho: 60, municipioId: x.moradia.municipioId, carga: 'integral' };
  x.t += 12;
  registrarNoMandato(x, `${anoDe(x.t)} · saiu do papel: as quadras de tênis públicas dos bairros`);
}).vida);

salvar('pivo', transacao(viva(22, 12, 'masculino'), x => { profissional(x, 'basquete', 90, 'Pinheiros', 6); }).vida);

salvar('atriz', transacao(viva(34, 13), x => {
  garantirFrente(x, 'teatro'); Object.assign(x.caminhos.frentes.teatro!, { habilidade: 88, meses: 160, interesse: 90, auge: 88 });
  x.rotinas.push({ id: 'teatro', tInicio: x.t - 120, nivel: 2 });
  const tipos = ['teatro', 'curta', 'publicidade', 'serie', 'novela', 'filme', 'serie', 'filme', 'novela', 'filme'] as const;
  const papeis = ['elenco', 'elenco', 'elenco', 'coadjuvante', 'coadjuvante', 'protagonista', 'protagonista', 'coadjuvante', 'protagonista', 'protagonista'];
  tipos.forEach((tipo, k) => { const c = novaProposta(x, { tipo, porte: Math.min(3, 1 + Math.floor(k / 3)) as 0 | 1 | 2 | 3, papel: papeis[k], casa: tipo === 'novela' ? 'uma emissora de TV aberta' : tipo === 'filme' ? 'uma produtora de cinema' : 'uma plataforma de streaming', titulo: '' }); c.titulo = ['O Quarto de Cima', 'Rota 116', 'Comercial de uma rede de farmácias', 'Laços de Maré', 'Os Herdeiros da Serra', 'Horizonte Partido', 'Fronteira Sul', 'Sol de Inverno', 'A Cidade Acorda', 'Terra Vermelha'][k]; iniciarProducao(x, c); concluirProducao(x, c, criarRng(300 + k)); x.t += 8; });
}).vida);

salvar('pesquisador', transacao(viva(45, 14, 'masculino'), (x, r) => {
  x.mente.cognicao = 88;
  x.educacao.concluidos.push({ cursoId: 'doutorado', nome: 'Doutorado em Ciências Biológicas', nivel: 'doutorado', area: 'biologia', tFim: x.t - 120, instituicao: 'a universidade federal' });
  contratar(x, r, ocupacao('professor_univ'), 'concurso');
  x.trabalho.atual!.tInicio = x.t - 110;
  for (let k = 0; k < 10; k++) { if (!vidaAcademica(x).projeto) executarAcademia(x, r, 'projeto'); if (k % 3 === 1 && !vidaAcademica(x).projeto?.financiado) executarAcademia(x, r, 'financiamento'); x.t += 12; processarAcademia(x); }
}).vida);
