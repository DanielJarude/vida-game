/**
 * Saves v13 REAIS, gerados com o motor da base do PLAYTEST #4 (619ed5f), para a
 * migração v13 → v14 ser testada com o que o jogo de fato produzia: o dono do
 * salão com carro (o caso do playtest), o político que perdia eleição, quem tem
 * um milhão aplicado.
 */
import { writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { abrirNegocio } from '../../src/motor/sistemas/negocio';
import { entrarNaPolitica } from '../../src/motor/sistemas/politica';
import { aplicar } from '../../src/motor/sistemas/investimentos';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
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
const nasce = (s: number, genero: 'masculino' | 'feminino', municipioId: string) => criarVida({ nome: genero === 'feminino' ? 'Lara' : 'Lucca', sobrenome: 'Moreira', genero, municipioId, semente: s });
const r = criarRng(13);
const limpo = (x: Vida) => { x.caminhos.processo = undefined; x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = []; x.justica = undefined; x.caminhos.envolvimento = undefined; x.trabalho.pausa = undefined; x.caminhos.militar = undefined; x.caminhos.negocio = undefined; x.corpo.saude = Math.max(75, x.corpo.saude); };
const gravar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${DIR}/${nome}`, JSON.stringify(v)); console.log(nome, 'versão', v.versao, 'idade', idade(v), v.trabalho.atual?.ocupacaoId ?? '—', v.caminhos.negocio?.nome ?? '', v.financas.bens.map(b => b.nome).join(',')); };

// 1. Dono de salão que vai bem, com carro e carteira (o caso do playtest).
{
  let v = viver(nasce(931, 'masculino', 'salvador-ba'), 34);
  v = transacao(v, x => {
    limpo(x); x.trabalho.experiencia['beleza'] = 120; x.financas.conta = Math.max(x.financas.conta, 60000);
    abrirNegocio(x, r, 'salao', { modo: 'guardado' });
    x.caminhos.negocio!.clientela = 66; x.caminhos.negocio!.caixa = 18000; x.caminhos.negocio!.reputacao = 62;
    if (x.trabalho.atual) x.trabalho.atual.clientela = 66;
    if (!x.trabalho.licencas.includes('cnh')) x.trabalho.licencas.push('cnh');
    x.financas.bens.push({ id: 'b-carro', tipo: 'veiculo', modeloId: 'carro_compacto', nome: 'carro compacto', valor: 62000, tCompra: x.t - 24, estado: 78, anoFabricacao: Math.floor(x.t / 12) - 3, usado: true, precoPago: 70000, historia: [] });
  }).vida;
  v = viver(v, 36);
  gravar('save-v13-salao-carro.json', v);
}
// 2. Político com base grande, derrotado, filiado há anos.
{
  let v = viver(nasce(932, 'feminino', 'recife-pe'), 44);
  v = transacao(v, x => { limpo(x); contratar(x, r, ocupacao('professor_concursado'), 'concurso'); const p = entrarNaPolitica(x, 'comunidade', 1); p.partido = 'PSD'; p.tFiliacao = x.t - 60; p.fase = 'entre_mandatos'; p.apoio = 82; p.reputacao = 55; p.historico = [{ t: x.t - 30, cargo: 'vereador', resultado: 'derrotado' }]; x.fatos['pol_partido_porte'] = 2; }).vida;
  v = viver(v, 45);
  gravar('save-v13-politica.json', v);
}
// 3. Um milhão aplicado, pouco na conta, família.
{
  let v = viver(nasce(933, 'masculino', 'campinas-sp'), 55);
  v = transacao(v, x => {
    limpo(x); x.financas.conta = 1_010_000; aplicar(x, 'pos_fixado', 1_000_000);
    const f = criarPessoa(x, r, { idade: 28, municipioId: x.moradia.municipioId, genero: 'feminino' });
    vincular(x, f, { parentesco: 'filho', origem: 'familia', proximidade: 70 }); f.genitores = ['eu'];
  }).vida;
  v = viver(v, 56);
  gravar('save-v13-investidor.json', v);
}
