// VIDA 28 — saves de QA: o oposto de vôlei profissional (os números da modalidade, o perfil), o meia de futebol com
// elenco e janela de transferências, a jogadora de e-sports, e duas vidas históricas (1915 e 1965) para a casa e a rua
// da época. OUT=<pasta>.
import { nova, viver } from '../../src/motor/__tests__/ajuda';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { criarRng } from '../../src/motor/rng';
import { executar } from '../../src/motor/acoes';
import type { CarreiraEsportiva, Vida } from '../../src/motor/tipos';
import { mkdirSync, writeFileSync } from 'node:fs';
await carregarMundo();
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/v28/saves`; mkdirSync(OUT, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-${nome}.json`, JSON.stringify(v)); console.log(nome, v.t, v.caminhos.esporte?.clube ?? '', v.caminhos.esporte?.perfil28?.principal ?? ''); };
function atleta(semente: number, genero: 'masculino' | 'feminino', municipioId: string, modalidade: CarreiraEsportiva['modalidade'], clube: string, nivel: 1 | 2 | 3 | 4, extra: Partial<CarreiraEsportiva>, h: number): Vida {
  let v = nova({ semente, genero, municipioId } as never);
  v = viver(v, 21);
  v.trabalho.atual = undefined;
  garantirFrente(v, modalidade).habilidade = h;
  v.caminhos.esporte = { modalidade, fase: 'profissional', clube, nivel, tInicio: v.t - 96, tFase: v.t - 36, lesoes: 0, municipioId, espaco: 'titular', reputacao: 55, temporadas: [], ...extra };
  const emp = contratar(v, criarRng(semente), ocupacao(modalidade === 'futebol' ? 'jogador_futebol' : modalidade === 'basquete' ? 'jogador_basquete' : 'atleta'), 'oportunidade');
  emp.empregador = clube; emp.salario = 30000;
  v.caminhos.esporte.contratoAte = v.t + 36;
  return viver(v, 3);
}
salvar('v28-volei', atleta(2801, 'feminino', 'rio-de-janeiro-rj', 'volei', 'equipe de vôlei do Rio de Janeiro', 4, {}, 82));
salvar('v28-futebol', atleta(2802, 'masculino', 'sao-paulo-sp', 'futebol', 'Palmeiras', 4, { posicao: 'meia' }, 80));
// A jogadora de e-sports: começa aos 15, treina com foco, faz peneira todo ano.
{
  let v = nova({ semente: 2803, genero: 'feminino', municipioId: 'campinas-sp' } as never);
  v = viver(v, 15);
  v = executar(v, { tipo: 'esports25', oque: { op: 'comecar', jogo: 'cs' } } as never).vida;
  for (let k = 0; k < 6; k++) {
    const r = v.rotinas.find(x => x.id === 'esports'); if (r) r.nivel = 3;
    for (const oque of [{ op: 'treinar', foco: 'mecanica' }, { op: 'aceitar' }, { op: 'peneira' }, { op: 'aceitar' }]) v = executar(v, { tipo: 'esports25', oque } as never).vida;
    v = viver(v, 1);
  }
  salvar('v28-esports', v);
}
salvar('v28-1915', viver(nova({ semente: 2804, genero: 'masculino', municipioId: 'sao-paulo-sp', ano: 1900, era: true } as never), 15));
salvar('v28-1965', viver(nova({ semente: 2805, genero: 'feminino', municipioId: 'belo-horizonte-mg', ano: 1935, era: true } as never), 30));
