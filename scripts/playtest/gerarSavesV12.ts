/**
 * Saves v12 REAIS, gerados com o motor do PLAYTEST #3 (9518411), para a
 * migração v12 → v13 ser testada com o que o jogo de fato produzia.
 */
import { writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { abrirNegocio, contratarFuncionario } from '../../src/motor/sistemas/negocio';
import { entrarNaPolitica } from '../../src/motor/sistemas/politica';
import { adotarPet } from '../../src/motor/sistemas/pets';
import { criarPessoa, vincular } from '../../src/motor/pessoas';

const DIR = process.env.DIR ?? 'src/motor/__tests__/fixtures';
const QUIETAS = ['ficar', 'recusar', 'nao', 'seguir', 'aguentar', 'depois', 'manter', 'renovar', 'assinar'];
function viver(v: Vida, ate: number): Vida {
  while (!v.morte && idade(v) < ate) {
    v = avancarAno(v).vida;
    while (v.momento) { const livres = v.momento.opcoes.filter(o => !o.bloqueio); const o = livres.find(x => QUIETAS.includes(x.id)) ?? livres[0]; v = executar(v, { tipo: 'decidir', opcaoId: o.id }).vida; }
  }
  return v;
}
const nasce = (s: number, genero: 'masculino' | 'feminino', municipioId: string) => criarVida({ nome: genero === 'feminino' ? 'Luana' : 'Ravi', sobrenome: 'Souza', genero, municipioId, semente: s });
const r = criarRng(12);
const limpo = (x: Vida) => { x.caminhos.processo = undefined; x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = []; x.justica = undefined; x.caminhos.envolvimento = undefined; x.trabalho.pausa = undefined; x.caminhos.militar = undefined; x.caminhos.negocio = undefined; x.corpo.saude = Math.max(75, x.corpo.saude); };
const gravar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${DIR}/${nome}`, JSON.stringify(v)); console.log(nome, 'versão', v.versao, 'idade', idade(v), v.trabalho.atual?.ocupacaoId ?? '—', v.caminhos.negocio?.nome ?? '', v.caminhos.negocio?.estrategia ?? ''); };

// 1. Dono de loja on-line com sócio e equipe, que vendia "também pela internet" (o bug do playtest).
{
  let v = viver(nasce(821, 'masculino', 'salvador-ba'), 30);
  v = transacao(v, x => {
    limpo(x); x.trabalho.experiencia['comercio'] = 60; x.financas.conta = Math.max(x.financas.conta, 30000);
    const socio = criarPessoa(x, r, { idade: 31, municipioId: x.moradia.municipioId, nome: 'Lucca', sobrenome: 'Prado', genero: 'masculino' });
    vincular(x, socio, { origem: 'amizade' as never, proximidade: 60, estagio: 'amigo_proximo' });
    abrirNegocio(x, r, 'loja_online', { modo: 'socio', socioId: socio.id });
    x.caminhos.negocio!.estrategia = 'online';
    x.caminhos.negocio!.clientela = 60; x.caminhos.negocio!.caixa = 25000; x.caminhos.negocio!.reputacao = 60;
    if (x.trabalho.atual) x.trabalho.atual.clientela = 60;
    contratarFuncionario(x, r, 'jovem');
  }).vida;
  v = viver(v, 31);
  gravar('save-v12-loja-online.json', v);
}
// 2. Filiada a partido fictício, sem bandeira (o "undefined" do playtest).
{
  let v = viver(nasce(822, 'feminino', 'recife-pe'), 32);
  v = transacao(v, x => { limpo(x); contratar(x, r, ocupacao('professor_concursado'), 'concurso'); const p = entrarNaPolitica(x, 'comunidade', 1); p.partido = 'Partido Ipê'; p.tFiliacao = x.t - 12; p.fase = 'filiado'; p.prioridade = undefined; }).vida;
  v = viver(v, 34);
  gravar('save-v12-politica.json', v);
}
// 3. Soldado no serviço inicial, com faculdade (o trancamento silencioso do playtest) e uma gata.
{
  let v = viver(nasce(823, 'masculino', 'natal-rn'), 18);
  v = transacao(v, x => {
    limpo(x); x.educacao.basica = undefined; x.educacao.escolaridade = 'superior_incompleto';
    x.educacao.matricula = { cursoId: 'administracao', instituicao: 'a universidade federal em Natal', rede: 'publica', modalidade: 'presencial', tInicio: x.t - 12, mesesRestantes: 36, mensalidade: 0, desempenho: 60, trancado: true, tTrancou: x.t, municipioId: x.moradia.municipioId };
    contratar(x, r, ocupacao('soldado_ep'), 'oportunidade');
    adotarPet(x, r, { especie: 'gato', nome: 'Mia', genero: 'feminino', idade: 0, porte: 'pequeno', jeito: 'curiosa', historia: 'do abrigo' }, 'abrigo');
  }).vida;
  gravar('save-v12-soldado.json', v);
}
