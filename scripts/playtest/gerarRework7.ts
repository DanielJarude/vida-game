/**
 * Saves das jornadas do REWORK 7 (`rework7.mjs`): as dez vidas do playtest adversarial, cada uma vivida pelo motor
 * (as atividades começam por ação, os anos passam por `avancarAno`, as compras são compras) — nada montado à mão além
 * do que o cenário precisa para existir (o atleta, a pena, a fortuna):
 *   crianca     9 anos, futebol e desenho desde os 7
 *   adolescente 15 anos, música a sério e um violão próprio, o time da escola
 *   jovem       22 anos, academia, corrida, leitura e cozinha; livros e kit de academia em casa
 *   empregado   37 anos, trabalho comum, família, música por prazer, violão
 *   desempregado 31 anos, sem trabalho, procurando
 *   familia     42 anos com parceria e filhos
 *   varias      28 anos praticando cinco coisas ao mesmo tempo (a semana cheia)
 *   idosa       80 anos (a biografia longa)
 *   portugal    26 anos, nascida e criada em Portugal (instituições, moeda e matérias de lá)
 *   japao       16 anos, no Japão (a escola de lá)
 * Os casos especiais do REWORK 5/6 (atleta, presa, rica, decisão, morta) continuam vindo de `gerarRework6.ts`.
 *   npx esbuild scripts/playtest/gerarRework7.ts --bundle --platform=node --outfile=<scratch>/g7.cjs && OUT=<pasta> node <scratch>/g7.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { executar, type Acao } from '../../src/motor/acoes';
import { viverAte, nova, responderTudo, viver } from '../../src/motor/__tests__/ajuda';
import { adulto, comFilho, comParceiro } from '../../src/motor/__tests__/cenarios';
import { cidadesDoPais, capitalDoPais } from '../../src/motor/dados/lugares';
import type { Vida } from '../../src/motor/tipos';
import { conteudosPossiveis } from '../../src/motor/sistemas/redes';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-r7-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, Math.floor((v.t - v.eu.tNasc) / 12), v.rotinas.map(r => r.id).join(',')); };
const tentar = (v: Vida, a: Acao): Vida => { const r = executar(v, a); if (process.env.DEBUG) console.log(' ', JSON.stringify(a), '→', r.resultado ?? r.aviso?.texto ?? ''); return responderTudo(r.vida); };
const comecar = (v: Vida, id: string, nivel: 1 | 2 | 3 = 1) => tentar(v, { tipo: 'rotina', id, ativa: true, nivel });

async function principal() {
  await carregarMundo();

  let c = viverAte(nova({ semente: 4417 }), 7);
  c = comecar(comecar(c, 'futebol'), 'desenho');
  salvar('crianca', viverAte(c, 9));

  let a = viverAte(nova({ semente: 5120, genero: 'masculino', municipioId: 'sao-paulo-sp' }), 11);
  a = comecar(a, 'musica');
  a = viverAte(a, 13);
  a.financas.conta += 2000;
  a = tentar(a, { tipo: 'comprar_coisa', coisaId: 'violao' });
  a = viverAte(a, 14);
  a = comecar(a, 'time_escola');
  salvar('adolescente', viverAte(a, 15));

  let j = viverAte(nova({ semente: 5120, genero: 'masculino', municipioId: 'sao-paulo-sp' }), 19);
  for (const id of ['academia', 'corrida', 'leitura', 'cozinhar']) j = comecar(j, id);
  j.financas.conta += 6000;
  j = tentar(j, { tipo: 'comprar_coisa', coisaId: 'livros' });
  j = tentar(j, { tipo: 'comprar_coisa', coisaId: 'kit_academia' });
  salvar('jovem', viverAte(j, 22));

  let e = viverAte(nova({ semente: 9091 }), 33);
  e = comecar(e, 'musica');
  e.financas.conta += 3000;
  e = tentar(e, { tipo: 'comprar_coisa', coisaId: 'violao' });
  e = comecar(e, 'leitura');
  salvar('empregado', viverAte(e, 37));

  let d = adulto(31, { semente: 61 });
  d.trabalho.atual = undefined;
  salvar('desempregado', d);

  let f = adulto(40, { semente: 63 });
  comParceiro(f, { estagio: 'casamento', anos: 12 });
  comFilho(f, 9, { casa: true });
  comFilho(f, 5, { casa: true, genero: 'feminino' });
  f = comecar(f, 'tempo_familia');
  salvar('familia', viver(f, 2));

  let w = viverAte(nova({ semente: 7781, municipioId: 'recife-pe' }), 24);
  for (const id of ['corrida', 'teatro', 'escrever', 'xadrez', 'voluntariado']) w = comecar(w, id);
  salvar('varias', viverAte(w, 28));

  for (let s = 2024; s < 2060; s++) { const v = responderTudo(viverAte(nova({ semente: s, genero: 'feminino', municipioId: 'salvador-ba' }), 80)); if (!v.morte) { salvar('idosa', v); break; } }

  const lisboa = capitalDoPais('PT') ?? cidadesDoPais('PT')[0];
  let p = viverAte(nova({ semente: 3131, municipioId: lisboa.id }), 20);
  p = comecar(p, 'fotografia');
  p = comecar(p, 'danca');
  salvar('portugal', viverAte(p, 26));

  // influencer: três redes com publicações (o formato de cada uma: a grade, os vídeos, a linha do tempo)
  let r = adulto(27, { semente: 71 });
  r.financas.conta += 20000;
  for (const pl of ['instagram', 'youtube', 'x', 'tiktok'] as const) {
    r = tentar(r, { tipo: 'rede', op: { oque: 'criar', plataforma: pl } } as Acao);
    for (const tema of conteudosPossiveis(r, pl).slice(0, 4).map(x => x.tema)) r = tentar(r, { tipo: 'rede', op: { oque: 'publicar', plataforma: pl, tema, promover: false } } as Acao);
  }
  r = viver(r, 1);
  for (const tema of conteudosPossiveis(r, 'instagram').slice(0, 3).map(x => x.tema)) r = tentar(r, { tipo: 'rede', op: { oque: 'publicar', plataforma: 'instagram', tema, promover: false } } as Acao);
  salvar('influencer', r);

  const toquio = capitalDoPais('JP') ?? cidadesDoPais('JP')[0];
  let t = viverAte(nova({ semente: 3232, genero: 'masculino', municipioId: toquio.id }), 12);
  t = comecar(t, 'xadrez');
  t = comecar(t, 'basquete');
  salvar('japao', viverAte(t, 16));
}
void principal();
