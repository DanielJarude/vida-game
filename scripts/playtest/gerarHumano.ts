/**
 * Saves para as capturas do FIX pós-playtest humano (`humano.mjs`):
 *   tecnico   — 15 anos no Japão, kōsen + bola "a sério" (Formação, A semana, Hobbies)
 *   amiga     — 28 anos: amiga próxima de anos, cenas vividas, carro verde comprado, Instagram, dinheiro para a clínica
 *   faculdade — 19 anos, na faculdade (a trilha da Formação e o "Viver mais um ano" no fim)
 *   npx esbuild scripts/playtest/gerarHumano.ts --bundle --platform=node --outfile=<scratch>/gh.cjs && OUT=<pasta> node <scratch>/gh.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarVida } from '../../src/motor/criacao';
import { executar } from '../../src/motor/acoes';
import { viverAte } from '../../src/motor/__tests__/ajuda';
import { adulto, comParente } from '../../src/motor/__tests__/cenarios';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { ofertaIntegrada } from '../../src/motor/sistemas/ensinoTecnico';
import { ofertasDeVeiculos } from '../../src/motor/sistemas/mercado';
import type { Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-humano-${nome}.json`, JSON.stringify(v)); };

async function principal() {
  await carregarMundo();
  // técnico no Japão
  const cidade = cidadesDoPais('JP').find(c => ofertaIntegrada(c.id).length > 0)!.id;
  let t = viverAte(criarVida({ nome: 'Haruto', sobrenome: 'Ito', genero: 'masculino', municipioId: cidade, semente: 5 }), 15);
  const of = ofertaIntegrada(cidade)[0];
  t.educacao.basica = { ...t.educacao.basica!, integrado: of.curso.id, integradoInst: of.inst.chave, rede: 'publica' };
  t.rotinas = [{ id: 'futebol', tInicio: t.t, nivel: 3 }, { id: 'musica', tInicio: t.t, nivel: 1 }];
  salvar('tecnico', t);
  // a amiga
  let a = adulto(28, { semente: 41, genero: 'masculino' });
  a.financas.conta = 400000; a.trabalho.licencas.push('cnh');
  const { p, vin } = comParente(a, 'irmao', 27, 'feminino', 74);
  vin.parentesco = undefined; vin.estagio = 'amigo_proximo'; vin.origem = 'escola'; vin.convivio = []; vin.tInicio = a.t - 150;
  p.municipioId = a.moradia.municipioId; p.parceiroId = undefined; p.atracao = 'homens'; p.nome = 'Yua'; p.municipioNatal = cidadesDoPais('JP').find(c => /Hiroshima/.test(c.nome))?.id ?? cidadesDoPais('JP')[3].id;
  for (const prog of ['cinema', 'jantar_fora']) { a = executar(a, { tipo: 'pessoa', pessoaId: p.id, interacao: prog }).vida; a.t += 12; a.anoAtual = { acoes: [] }; }
  const verde = ofertasDeVeiculos(a, 'concessionaria').find(o => /verde/.test(o.corNome)) ?? ofertasDeVeiculos(a, 'concessionaria')[0];
  a = executar(a, { tipo: 'comprar_veiculo', ofertaId: verde.id, financiar: false }).vida;
  a = executar(a, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } } as Parameters<typeof executar>[1]).vida;
  a = executar(a, { tipo: 'rede', op: { oque: 'publicar', plataforma: 'instagram', tema: 'cotidiano' } } as Parameters<typeof executar>[1]).vida;
  a.eu.visual.orelhas = 'de_abano';
  salvar('amiga', a);
  // faculdade
  const f = adulto(19, { semente: 13 });
  f.educacao.escolaridade = 'medio';
  f.educacao.matricula = { cursoId: 'enfermagem', instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial', tInicio: f.t, mesesRestantes: 60, mensalidade: 0, desempenho: 60, trancado: false, municipioId: f.moradia.municipioId };
  salvar('faculdade', f);
}
void principal();
