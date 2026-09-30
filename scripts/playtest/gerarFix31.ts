/**
 * Cenários visuais do FIX 3.1: a cirurgiã (residência, especialidade, faixa
 * de renda), a médica recém-formada diante do catálogo de residências, a
 * tenista profissional (circuito, ranking, prêmio e custos), o jogador de
 * basquete (função, estatura, estatística) e a atriz com agente e proposta
 * de novela na mesa.
 *   npx esbuild scripts/playtest/gerarFix31.ts --bundle --platform=node --outfile=/tmp/g31.cjs && SP=/tmp/vida-f31 node /tmp/g31.cjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { registrarNoCurriculo } from '../../src/motor/sistemas/cena';
import { entrarNaBase, processarEsporte, profissionalizar } from '../../src/motor/sistemas/esporte';
import { novaProposta } from '../../src/motor/sistemas/audiovisual';
import type { Vida } from '../../src/motor/tipos';

const SP = process.env.SP ?? '/tmp/vida-f31';
mkdirSync(SP, { recursive: true });
function viva(i: number, semente: number, genero: 'masculino' | 'feminino' = 'feminino', municipioId = 'recife-pe'): Vida {
  let v = criarVida({ nome: genero === 'feminino' ? 'Lia' : 'Davi', sobrenome: 'Moura', genero, municipioId, semente });
  for (let k = 0; k < i; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  return v;
}
const salvar = (nome: string, v: Vida) => { v.momento = null; v.caminhos.pendente = undefined; writeFileSync(`${SP}/${nome}.json`, JSON.stringify(v)); };
const formarMedica = (x: Vida) => {
  x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined;
  x.educacao.concluidos.push({ cursoId: 'medicina', nome: 'Medicina', nivel: 'superior', area: 'medicina', tFim: x.t - 96, instituicao: 'a UFPE', desempenho: 74 });
  x.educacao.escolaridade = 'superior';
  if (!x.trabalho.licencas.includes('crm')) x.trabalho.licencas.push('crm');
};

salvar('cirurgia', transacao(viva(36, 11), (x, r) => {
  formarMedica(x);
  x.educacao.concluidos.push({ cursoId: 'residencia', nome: 'Residência em Cirurgia Geral', nivel: 'residencia', area: 'medicina', tFim: x.t - 24, instituicao: 'o Hospital das Clínicas', desempenho: 78, especialidade: 'cirurgia' });
  x.educacao.escolaridade = 'pos'; x.trabalho.experiencia['medicina'] = 60;
  contratar(x, r, ocupacao('cirurgiao'), 'curriculo');
}).vida);

salvar('medica', transacao(viva(26, 12), x => { formarMedica(x); x.financas.conta = 15000; }).vida);

salvar('tenista', transacao(viva(22, 13, 'feminino', 'sao-paulo-sp'), (x, r) => {
  garantirFrente(x, 'tenis'); const f = x.caminhos.frentes.tenis!; f.habilidade = 84; f.interesse = 90; f.meses = 150;
  x.educacao.basica = undefined; x.trabalho.atual = undefined; x.financas.conta = 90000;
  entrarNaBase(x, 'tenis', x.moradia.municipioId, 'academia de tênis de São Paulo');
  profissionalizar(x, r, 2);
  for (let k = 0; k < 2; k++) { x.t += 12; processarEsporte(x, r); }
}).vida);

salvar('basquete', transacao(viva(24, 14, 'masculino', 'sao-paulo-sp'), (x, r) => {
  garantirFrente(x, 'basquete'); const f = x.caminhos.frentes.basquete!; f.habilidade = 84; f.interesse = 90; f.meses = 150;
  x.educacao.basica = undefined; x.trabalho.atual = undefined;
  entrarNaBase(x, 'basquete', x.moradia.municipioId, 'Esporte Clube Pinheiros');
  profissionalizar(x, r, 3);
  x.t += 12; processarEsporte(x, r);
}).vida);

salvar('atriz', transacao(viva(30, 15), (x, r) => {
  x.trabalho.atual = undefined;
  garantirFrente(x, 'teatro'); x.caminhos.frentes.teatro!.habilidade = 76;
  x.rotinas = x.rotinas.filter(z => z.id !== 'teatro'); x.rotinas.push({ id: 'teatro', tInicio: x.t - 96, nivel: 2 });
  contratar(x, r, ocupacao('ator'), 'convite');
  for (const [t, tipo, papel] of [['O Quarto de Cima', 'teatro', 'protagonista'], ['Rota 116', 'serie', 'coadjuvante'], ['Comercial de um banco digital', 'publicidade', 'elenco']] as const) registrarNoCurriculo(x, { tipo, titulo: t, papel, onde: 'uma plataforma de streaming', repercussao: 1 });
  x.caminhos.audiovisual = { contratos: [], agente: { nome: 'Regina Prado', rede: 2, comissao: 0.15, tInicio: x.t - 24 } };
  novaProposta(x, { tipo: 'novela', porte: 2, papel: 'coadjuvante', casa: 'uma emissora de TV aberta', titulo: 'Sol de Inverno' });
  novaProposta(x, { tipo: 'curta', porte: 0, papel: 'protagonista', casa: 'uma produtora independente', titulo: 'Pelas Margens' });
}).vida);
console.log('ok', SP);
