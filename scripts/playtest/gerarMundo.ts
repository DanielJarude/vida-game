/**
 * Saves para as capturas do ATT Mundo (scripts/playtest/mundo.mjs).
 *   npx esbuild scripts/playtest/gerarMundo.ts --bundle --platform=node --outfile=/tmp/gm.cjs && SP=/tmp/vida-mundo node /tmp/gm.cjs
 *
 *   argentina  nasceu em Córdoba, 34 anos, vivendo lá
 *   migrante   nasceu em Curitiba, foi para Lisboa aos 30 (pela CPLP), 3 anos lá
 *   jogador    argentino, joga num clube espanhol (Madri) — a seleção continua a argentina
 *   japao      nasceu em Osaka, 24 anos (formação, trabalho, nomes)
 *   legado     brasileiro de Uberaba que morreu; a filha mora em Buenos Aires
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade, transacao } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { clubesDoPais } from '../../src/motor/dados/clubes';
import { migrar } from '../../src/motor/sistemas/migracao';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import { criarRng } from '../../src/motor/rng';
import { garantirVida } from '../../src/motor/sistemas/filhos';
import type { Vida } from '../../src/motor/tipos';

const SP = process.env.SP ?? '/tmp/vida-mundo';
mkdirSync(SP, { recursive: true });
const maior = (p: string) => (cidadesDoPais(p).find(m => m.perfil === 'metropole') ?? cidadesDoPais(p)[0]).id;
const cidade = (p: string, nome: string) => cidadesDoPais(p).find(m => m.nome === nome)!.id;

function viverAte(v: Vida, alvo: number): Vida {
  while (!v.morte && idade(v) < alvo) {
    for (let k = 0; k < 12 && v.momento; k++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida;
    v = avancarAno(v).vida;
  }
  for (let k = 0; k < 12 && v.momento; k++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida;
  return v;
}
const salvar = (nome: string, v: Vida) => { writeFileSync(`${SP}/${nome}.json`, JSON.stringify(v)); console.log(nome, idade(v), v.moradia.municipioId); };
const adulta = (v: Vida) => transacao(v, x => {
  x.momento = null;
  if (x.moradia.tipo === 'pais' || x.moradia.tipo === 'parente') {
    x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1500, padrao: 3, tInicio: x.t };
    for (const vin of Object.values(x.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  }
}).vida;

async function main() {
  await carregarMundo();

  salvar('argentina', viverAte(criarVida({ nome: 'Valentina', sobrenome: 'Ferreyra Paz', genero: 'feminino', municipioId: cidade('AR', 'Córdoba'), semente: 3101 }), 34));

  let m = adulta(viverAte(criarVida({ nome: 'Joana', sobrenome: 'Kowalski Prado', genero: 'feminino', municipioId: 'curitiba-pr', semente: 3207 }), 30));
  m = transacao(m, x => { x.financas.conta += 40000; }).vida;
  m = executar(m, { tipo: 'migrar', municipioId: maior('PT'), motivo: 'trabalho' }).vida;
  if (m.moradia.municipioId !== maior('PT')) m = executar(m, { tipo: 'migrar', municipioId: maior('PT'), motivo: 'pessoal' }).vida;
  salvar('migrante', viverAte(m, 33));

  let j = adulta(viverAte(criarVida({ nome: 'Thiago', sobrenome: 'Almada Ríos', genero: 'masculino', municipioId: maior('AR'), semente: 3301 }), 24));
  j = transacao(j, (x, r) => {
    const clube = clubesDoPais('ES').find(c => c.porte === 'grande')!;
    x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: clube.nome, nivel: 4, tInicio: x.t - 60, tFase: x.t - 60, lesoes: 0, municipioId: clube.cidade, reputacao: 72, espaco: 'titular', posicao: 'meia' };
    x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: `o ${clube.nome}`, contrato: 'clt', salario: 90000, tInicio: x.t - 12, desempenho: 72, municipioId: clube.cidade, carga: 'integral' };
    migrar(x, r, clube.cidade, 'esporte');
  }).vida;
  salvar('jogador', viverAte(j, 26));

  salvar('japao', viverAte(criarVida({ nome: 'Haruto', sobrenome: 'Yamamoto', genero: 'masculino', municipioId: cidade('JP', 'Osaka'), semente: 3401 }), 24));

  let l = adulta(viverAte(criarVida({ nome: 'Bento', sobrenome: 'Silva', genero: 'masculino', municipioId: 'uberaba-mg', semente: 3501 }), 58));
  l = transacao(l, x => {
    const r = criarRng(9);
    const filha = criarPessoa(x, r, { genero: 'feminino', idade: 31, municipioId: maior('AR'), sobrenome: 'Silva' });
    filha.genitores = ['eu'];
    filha.municipioNatal = 'uberaba-mg';
    filha.nacionalidades = ['BR'];
    vincular(x, filha, { parentesco: 'filho', origem: 'familia', proximidade: 70 });
    garantirVida(filha);
    x.financas.conta += 180000;
    x.morte = { t: x.t, causa: 'infarto' };
  }).vida;
  salvar('legado', l);
}
void main();
