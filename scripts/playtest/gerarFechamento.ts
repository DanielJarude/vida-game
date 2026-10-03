/**
 * Saves para as capturas do fechamento do ATT Mundo (scripts/playtest/fechamento.mjs).
 *   npx esbuild scripts/playtest/gerarFechamento.ts --bundle --platform=node --outfile=/tmp/gf.cjs && SP=/tmp/vida-fechamento node /tmp/gf.cjs
 *
 *   chicago   nasceu no Recife, mudou-se com a família para Chicago aos 8; aos 17, no ensino médio americano
 *             (o SAT, a carteira de Illinois); amigas, uma ex-amiga depois de uma briga, um rival, um interesse
 *             romântico; um cachorro e um gato da casa
 *   adulta    a mesma vida aos 26, morando sozinha em Chicago (Pessoas com tipos e estados; os bichos dela; as coisas dela)
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade, transacao } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { migrarComAFamilia } from '../../src/motor/sistemas/migracao';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import { criarRng } from '../../src/motor/rng';
import { adotarPet } from '../../src/motor/sistemas/pets';
import { romper } from '../../src/motor/sistemas/lacos';
import type { Pessoa, Vida, Vinculo } from '../../src/motor/tipos';

const SP = process.env.SP ?? '/tmp/vida-fechamento';
mkdirSync(SP, { recursive: true });

function viverAte(v: Vida, alvo: number): Vida {
  while (!v.morte && idade(v) < alvo) {
    for (let k = 0; k < 12 && v.momento; k++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida;
    v = avancarAno(v).vida;
  }
  for (let k = 0; k < 12 && v.momento; k++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida;
  return v;
}
const salvar = (nome: string, v: Vida) => { writeFileSync(`${SP}/${nome}.json`, JSON.stringify(v)); console.log(nome, idade(v), v.moradia.municipioId); };

function gente(x: Vida, nome: string, idadeP: number, genero: Pessoa['genero'], o: { estagio: Vinculo['estagio']; prox: number; conf: number; anos: number; convivio: Vinculo['convivio']; origem: Vinculo['origem'] }): { p: Pessoa; vin: Vinculo } {
  const p = criarPessoa(x, criarRng(x.seq + 101), { idade: idadeP, genero, municipioId: x.moradia.municipioId });
  p.nome = nome;
  const vin = vincular(x, p, { origem: o.origem, proximidade: o.prox, convivio: o.convivio });
  vin.estagio = o.estagio; vin.confianca = o.conf; vin.tInicio = x.t - o.anos * 12;
  return { p, vin };
}

function rede(x: Vida): void {
  const melhor = gente(x, 'Emily', idade(x), 'feminino', { estagio: 'amigo_proximo', prox: 86, conf: 88, anos: 7, convivio: ['escola'], origem: 'escola' });
  melhor.vin.historia.push({ t: x.t - 80, texto: 'Viraram amigas na escola nova, quando você ainda tropeçava no inglês.', tipo: 'amizade', peso: 3 },
    { t: x.t - 40, texto: 'Ela segurou a sua mão no enterro da avó.', tipo: 'apoio', peso: 3 },
    { t: x.t - 20, texto: 'Vocês têm um caderno de músicas que ninguém mais lê.', tipo: 'ritual', peso: 2 });
  const ex = gente(x, 'Madison', idade(x), 'feminino', { estagio: 'amigo', prox: 70, conf: 70, anos: 5, convivio: [], origem: 'escola' });
  ex.vin.historia.push({ t: x.t - 50, texto: 'Viraram amigas no time de vôlei.', tipo: 'amizade', peso: 2 });
  romper(x, ex.p, ex.vin, 'A amizade acabou numa briga por causa de um segredo que vazou.', 'ambos');
  const rival = gente(x, 'Tyler', idade(x), 'masculino', { estagio: 'rival', prox: 25, conf: 20, anos: 3, convivio: ['escola'], origem: 'escola' });
  rival.vin.tensao = 50;
  const colega = gente(x, 'Sofia', idade(x), 'feminino', { estagio: 'colega', prox: 34, conf: 40, anos: 1, convivio: ['escola'], origem: 'escola' });
  void colega;
  const brigada = gente(x, 'Grace', idade(x), 'feminino', { estagio: 'amigo', prox: 64, conf: 60, anos: 4, convivio: ['escola'], origem: 'escola' });
  brigada.vin.conflito = { t: x.t, assunto: 'um plano desmarcado de novo', gravidade: 2, quem: 'eu' };
  brigada.vin.tensao = 48;
  const crush = gente(x, 'Noah', idade(x), 'masculino', { estagio: 'conhecido', prox: 30, conf: 35, anos: 0, convivio: ['escola'], origem: 'escola' });
  crush.vin.romance = { estagio: 'interesse', tEstagio: x.t, envolvimento: 30 };
}

async function main() {
  await carregarMundo();
  let v = viverAte(criarVida({ nome: 'Ana', sobrenome: 'Lima Duarte', genero: 'feminino', municipioId: 'recife-pe', semente: 4401 }), 8);
  v = transacao(v, x => { migrarComAFamilia(x, 'us:chicago', 'A mãe'); }).vida;
  v = viverAte(v, 17);
  v = transacao(v, (x, r) => {
    x.momento = null;
    if (x.educacao.basica) { x.educacao.basica.etapa = 'medio'; x.educacao.basica.serie = 3; }
    rede(x);
    adotarPet(x, r, { especie: 'cachorro', nome: 'Pepper', genero: 'feminino', idade: 4, porte: 'medio', jeito: 'late para o carteiro e depois pede desculpas', historia: 'veio do abrigo' }, 'abrigo');
    adotarPet(x, r, { especie: 'gato', nome: 'Biscoito', genero: 'masculino', idade: 2, porte: 'pequeno', jeito: 'dorme no teclado', historia: 'achado na garagem' }, 'rua');
  }).vida;
  salvar('chicago', v);

  let a = viverAte(v, 26);
  a = transacao(a, (x, r) => {
    x.momento = null;
    if (x.moradia.tipo === 'pais' || x.moradia.tipo === 'parente') {
      x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1500, padrao: 3, tInicio: x.t, aceitaPet: true };
      for (const vin of Object.values(x.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
    }
    x.financas.conta += 30000;
    // As coisas da vida dela (`sistemas/coisas`): o notebook de trabalho, o violão da adolescência, a máquina de lavar.
    x.financas.coisas = [{ id: 'cs1', coisaId: 'notebook', t: x.t - 24, preco: 3800, estado: 62 }, { id: 'cs2', coisaId: 'violao', t: x.t - 96, preco: 900, estado: 55 }, { id: 'cs3', coisaId: 'maquina_lavar', t: x.t - 12, preco: 2500, estado: 90 }];
    rede(x);
    for (const [k, nome] of ['Bolt', 'Luna', 'Rex', 'Mia'].entries()) adotarPet(x, r, { especie: k % 2 ? 'gato' : 'cachorro', nome, genero: k % 2 ? 'feminino' : 'masculino', idade: 1 + k, porte: (['grande', 'pequeno', 'pequeno', 'pequeno'] as const)[k], jeito: 'curioso', historia: 'adoção' }, 'abrigo');
  }).vida;
  salvar('adulta', a);
}

main();
