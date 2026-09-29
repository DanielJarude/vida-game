/**
 * Cenários visuais do FIX pós-REWORK 2: o jogador profissional (temporada,
 * posição, contrato, lesão), a semana sobrecarregada e o ex na ficha.
 *   npx esbuild scripts/playtest/gerarFixPosRework2.ts --bundle --platform=node --outfile=/tmp/gf.cjs && SP=/tmp/vida-fix node /tmp/gf.cjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import { entrarNaBase, fecharTemporada, profissionalizar } from '../../src/motor/sistemas/esporte';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { lesionar } from '../../src/motor/sistemas/lesoes';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import type { Vida } from '../../src/motor/tipos';

const SP = process.env.SP ?? '/tmp/vida-fix';
mkdirSync(SP, { recursive: true });
function viva(i: number, semente: number, genero: 'masculino' | 'feminino' = 'masculino'): Vida {
  let v = criarVida({ nome: genero === 'feminino' ? 'Lia' : 'Davi', sobrenome: 'Moura', genero, municipioId: 'belo-horizonte-mg', semente });
  for (let k = 0; k < i; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.trabalho.atual = undefined; v.educacao.matricula = undefined; v.educacao.basica = undefined; v.rotinas = [];
  return v;
}
const atleta = transacao(viva(24, 5), x => {
  garantirFrente(x, 'futebol'); const f = x.caminhos.frentes.futebol!; f.habilidade = 86; f.meses = 150; f.auge = 86; f.interesse = 90;
  entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Clube Atlético Mineiro'); profissionalizar(x, criarRng(3), 4); x.caminhos.esporte!.posicao = 'ponta';
  for (let k = 0; k < 3; k++) { x.t += 12; fecharTemporada(x, criarRng(k), x.caminhos.esporte!); }
  lesionar(x, criarRng(4), 2, 'profissional');
}).vida;
atleta.momento = null;
writeFileSync(`${SP}/atleta.json`, JSON.stringify(atleta));
const carregada = transacao(viva(30, 6, 'feminino'), x => {
  contratar(x, criarRng(1), ocupacao('assistente_adm'));
  x.educacao.matricula = { cursoId: 'medicina', instituicao: 'UFMG', rede: 'publica', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 60, mensalidade: 0, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId };
  x.trabalho.horasExtras = true; x.mente.sobrecarga = { anos: 3, t: x.t };
}).vida;
writeFileSync(`${SP}/carregada.json`, JSON.stringify(carregada));
console.log('ok', SP);
