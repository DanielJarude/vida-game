/**
 * Cenários visuais do FIX pós-REWORK 3: a professora universitária que atua
 * em paralelo (trajetórias, currículo, vida acadêmica), a milionária (barco,
 * relógio, experiências) e o adolescente que tenta a peneira (objetivo, treino).
 *   npx esbuild scripts/playtest/gerarFixPosRework3.ts --bundle --platform=node --outfile=/tmp/g3.cjs && SP=/tmp/vida-f3 node /tmp/g3.cjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { propor, resolverPendente } from '../../src/motor/sistemas/compromissos';
import { registrarNoCurriculo } from '../../src/motor/sistemas/cena';
import { registrarDevolutiva } from '../../src/motor/sistemas/devolutivas';
import { comprarItem } from '../../src/motor/sistemas/estilo';
import { catalogoDeVeiculos } from '../../src/motor/sistemas/mercado';
import { executar } from '../../src/motor/acoes';
import { modeloVeiculo } from '../../src/motor/dados/bens';
import type { Vida } from '../../src/motor/tipos';

const SP = process.env.SP ?? '/tmp/vida-f3';
mkdirSync(SP, { recursive: true });
function viva(i: number, semente: number, genero: 'masculino' | 'feminino' = 'feminino', municipioId = 'recife-pe'): Vida {
  let v = criarVida({ nome: genero === 'feminino' ? 'Lia' : 'Davi', sobrenome: 'Moura', genero, municipioId, semente });
  for (let k = 0; k < i; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  return v;
}

const prof = transacao(viva(41, 7), (x, r) => {
  x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined;
  x.educacao.concluidos.push({ cursoId: 'letras', nome: 'Letras (bacharelado)', nivel: 'superior', area: 'letras', tFim: x.t - 180, instituicao: 'a UFPE', desempenho: 72 });
  x.educacao.concluidos.push({ cursoId: 'mestrado', nome: 'Mestrado em Letras', nivel: 'mestrado', area: 'letras', tFim: x.t - 140, instituicao: 'a UFPE', desempenho: 80 });
  x.educacao.concluidos.push({ cursoId: 'doutorado', nome: 'Doutorado em Letras', nivel: 'doutorado', area: 'letras', tFim: x.t - 96, instituicao: 'a UFPE', desempenho: 82 });
  x.educacao.escolaridade = 'doutorado';
  contratar(x, criarRng(3), ocupacao('professor_univ'));
  garantirFrente(x, 'teatro'); x.caminhos.frentes.teatro!.habilidade = 72;
  propor(x, r, { tipo: 'emprego', ocupacaoId: 'ator', via: 'convite', extra: 'arte' });
  resolverPendente(x, r, x.caminhos.pendente!.planos.findIndex(p => p.larga.includes('novo_paralela')));
  registrarNoCurriculo(x, { tipo: 'teatro', titulo: 'O Quarto de Cima', papel: 'protagonista', onde: 'um teatro do centro, em Recife', repercussao: 2 });
  registrarNoCurriculo(x, { tipo: 'serie', titulo: 'Pelas Margens', papel: 'coadjuvante', onde: 'uma plataforma de streaming', repercussao: 1 });
  x.caminhos.academia = { linha: 'letras', projetos: 2, orientacoes: 3, orientandos: [], publicacoes: 7, colaboracoes: 1, financiamentos: 1, ultimas: {} };
  x.caminhos.obras = [{ t: x.t - 24, titulo: 'A Casa Vazia', linguagem: 'teatro', recepcao: 2, renda: 8000 }];
}).vida;
prof.momento = null;
writeFileSync(`${SP}/professora.json`, JSON.stringify(prof));

let rica = transacao(viva(45, 8, 'feminino', 'recife-pe'), x => {
  x.financas.conta = 4_000_000; x.trabalho.licencas.push('cnh');
  comprarItem(x, 'relogio_luxo'); comprarItem(x, 'brincos_ouro'); comprarItem(x, 'oculos_aviador');
}).vida;
for (const o of [catalogoDeVeiculos(rica, 'nautica').find(z => modeloVeiculo(z.modeloId).id === 'lancha'), catalogoDeVeiculos(rica, 'concessionaria').find(z => z.versaoId === 'toyota_hilux'), catalogoDeVeiculos(rica, 'motos').find(z => z.versaoId === 'honda_pcx')]) {
  if (o) rica = executar(rica, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false }).vida;
}
rica.momento = null;
writeFileSync(`${SP}/rica.json`, JSON.stringify(rica));

const ado = transacao(viva(15, 9, 'masculino'), x => {
  garantirFrente(x, 'futebol'); const f = x.caminhos.frentes.futebol!; f.habilidade = 57; f.interesse = 90; f.meses = 70;
  x.rotinas = x.rotinas.filter(r => r.id !== 'futebol'); x.rotinas.push({ id: 'futebol', tInicio: x.t - 48, nivel: 2 });
  x.caminhos.esporte = undefined; x.financas.conta = 5000;
  registrarDevolutiva(x, { tipo: 'peneira', titulo: 'A peneira do Sport', texto: '"Lê bem o jogo, mas a técnica ainda é de escolinha." A técnica está "de escolinha".', passou: false, falta: 'tecnica', dominio: 'futebol', nivel: 1 });
}).vida;
ado.momento = null;
writeFileSync(`${SP}/adolescente.json`, JSON.stringify(ado));
console.log('ok', SP);
