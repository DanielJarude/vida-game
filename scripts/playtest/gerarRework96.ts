/**
 * Saves das cenas do REWORK 9.6 (`rework96.mjs`), vividos pelo motor — os de CONTEÚDO DIFÍCIL que a captura do
 * playtest pediu (o texto sobreposto da vaga passou por auditorias que nunca abriam uma vaga):
 *   vaga-longa   nome e sobrenome longos, na cidade de nome mais longo do mundo do jogo, empregada e num curso à noite:
 *                as vagas abertas trazem conflito de horário, requisitos múltiplos e "deixar o trabalho"
 *   escolhida    nascida com os cinco atributos escolhidos (extremos), aos 12: a ficha de atributos, o boletim
 *   briga        16 anos, machucada numa briga (a decisão de cuidado aberta; condições no prontuário)
 *   doente       58 anos, várias condições crônicas e sinais (o prontuário cheio), carreira longa (o currículo)
 *   *-0          os mesmos, recém-nascidos com atributos escolhidos (a ficha de um bebê)
 *   npx esbuild scripts/playtest/gerarRework96.ts --bundle --platform=node --outfile=<scratch>/g96.cjs && OUT=<pasta> node <scratch>/g96.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { paisesVivenciaveis } from '../../src/motor/mundo/registro';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { nova, viverAte } from '../../src/motor/__tests__/ajuda';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { idade, transacao } from '../../src/motor/nucleo';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { machucarNaBriga, lesionar } from '../../src/motor/sistemas/lesoes';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-r96-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), v.moradia.municipioId, JSON.stringify(v).length); };

async function principal() {
  await carregarMundo();
  // A cidade de nome mais longo entre os países vivíveis.
  const longa = paisesVivenciaveis().flatMap(p => cidadesDoPais(p.id)).sort((a, b) => b.nome.length - a.nome.length)[0];

  let v = viverAte(nova({ semente: 961, nome: 'Maria Eduarda Valentina', sobrenome: 'Albuquerque de Vasconcelos Figueiredo', municipioId: longa.id }), 26);
  v = transacao(v, (x, r) => {
    x.trabalho.atual = undefined; x.educacao.escolaridade = 'medio';
    contratar(x, r, ocupacao('aux_adm'));
    x.educacao.matricula = { cursoId: 'administracao', instituicao: 'Faculdade Comunitária de Ciências Administrativas e Contábeis', rede: 'privada', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 36, mensalidade: 900, desempenho: 62, trancado: false, municipioId: x.moradia.municipioId };
    x.financas.conta = 20000;
  }).vida;
  salvar('vaga-longa', v);

  const extremos = { saude: 98, fisico: 12, felicidade: 35, beleza: 92, inteligencia: 18 };
  salvar('escolhida-0', nova({ semente: 962, atributos: extremos, municipioId: 'porto-alegre-rs' }));
  salvar('escolhida', viverAte(nova({ semente: 962, atributos: extremos, municipioId: 'porto-alegre-rs' }), 12));

  let b = viverAte(nova({ semente: 963, genero: 'masculino', municipioId: 'belem-pa' }), 16);
  b = transacao(b, (x, r) => { x.corpo.condicoes = []; let k = 0; while (!machucarNaBriga(x, r, 3) && k++ < 20) { /* até machucar */ } }).vida;
  salvar('briga', b);

  let d = adulto(58, { semente: 964 });
  d = transacao(d, (x, r) => {
    x.corpo.condicoes = [
      { id: 'hipertensao', nome: 'pressão alta', tInicio: x.t - 60, cronica: true, gravidade: 2, tratando: true },
      { id: 'diabetes', nome: 'diabetes tipo 2', tInicio: x.t - 30, cronica: true, gravidade: 2, tratando: false },
      { id: 'coluna', nome: 'hérnia de disco na lombar', tInicio: x.t - 24, cronica: true, gravidade: 1, tratando: true },
      { id: 'depressao', nome: 'depressão', tInicio: x.t - 10, cronica: false, gravidade: 2, tratando: false, diagnosticada: false }
    ];
    lesionar(x, criarRng(5), 2, 'trabalho');
    if (!x.trabalho.atual) contratar(x, r, ocupacao('aux_adm'));
  }).vida;
  salvar('doente', d);
}
void principal();
