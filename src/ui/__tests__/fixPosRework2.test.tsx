// @vitest-environment jsdom
/**
 * FIX pós-REWORK 2 — se duas telas falam da mesma coisa, falam da mesma realidade.
 *
 * O salário do atleta (Trabalho ↔ contrato ↔ Dinheiro), a temporada e a
 * posição, a lesão (Trabalho ↔ Você), a semana sobrecarregada (Tempo livre ↔
 * motor), as ações de um ex (Pessoas), o "Pede atenção" que não persegue.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { criarRng } from '../../motor/rng';
import { transacao } from '../../motor/nucleo';
import { criarPessoa, vincular } from '../../motor/pessoas';
import { entrarNaBase, fecharTemporada, profissionalizar } from '../../motor/sistemas/esporte';
import { garantirFrente } from '../../motor/sistemas/frentes';
import { lesionar } from '../../motor/sistemas/lesoes';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { leituraDaSobrecarga } from '../../motor/sistemas/sobrecarga';
import { terminar } from '../../motor/sistemas/romance';
import { dinheiroCurto } from '../apresentar';
import type { Vida } from '../../motor/tipos';
import { Trabalho } from '../jogo/Trabalho';
import { Tempo } from '../jogo/Tempo';
import { Voce } from '../jogo/Voce';
import { Pessoas } from '../jogo/Pessoas';
import { FechamentoDoAno } from '../telas/Jogo';
import { temporadaDePalco } from '../../motor/sistemas/palco';
import { remuneracaoDe } from '../../motor/sistemas/renda';

afterEach(() => cleanup());
const nada = () => {};

function viva(i: number, semente = 41): Vida {
  // (REWORK 3: uma vida viva na idade pedida — a semente seguinte, se esta não chegou lá.)
  let v = criarVida({ nome: 'Rui', sobrenome: 'Lopes', genero: 'masculino', municipioId: 'belo-horizonte-mg', semente });
  for (let k = 0; k < i; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  if (v.morte) return viva(i, semente + 1);
  v.rotinas = []; v.corpo.condicoes = []; v.anoAtual = { acoes: [] }; v.trabalho.atual = undefined; v.educacao.matricula = undefined; v.educacao.basica = undefined;
  for (const vin of Object.values(v.vinculos)) { vin.chamado = undefined; if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined; }
  return v;
}

function atleta(): Vida {
  return transacao(viva(22), x => {
    garantirFrente(x, 'futebol');
    const f = x.caminhos.frentes.futebol!; f.habilidade = 84; f.meses = 150; f.auge = 84; f.interesse = 90;
    x.rotinas.push({ id: 'futebol', tInicio: x.t - 60, nivel: 3 });
    entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Clube Atlético Mineiro');
    profissionalizar(x, criarRng(3), 3);
    x.caminhos.esporte!.posicao = 'meia';
    fecharTemporada(x, criarRng(5), x.caminhos.esporte!);
  }).vida;
}

describe('atleta: um salário, uma temporada, uma posição', () => {
  it('Trabalho mostra o salário do contrato (bruto) com o nome certo, a temporada e a posição — e não há "treino de base" em Tempo livre', () => {
    const v = atleta();
    render(<main><Trabalho vida={v} agir={() => true} irPara={nada} /></main>);
    const painel = screen.getByRole('region', { name: 'A carreira no esporte' });
    expect(within(painel).getByText('Salário do contrato')).toBeTruthy();
    expect(within(painel).getByText(`${dinheiroCurto(v.trabalho.atual!.salario)}/mês, bruto`)).toBeTruthy();
    expect(within(painel).queryByText('No bolso')).toBeNull(); // o líquido está no topo, uma vez só
    expect(within(painel).getByText(/Temporada \d{4} —/)).toBeTruthy();
    expect(within(painel).getByText(/meia/)).toBeTruthy();
    expect(screen.getAllByText('No bolso').length).toBe(1);
    cleanup();
    render(<main><Tempo vida={v} agir={() => true} /></main>);
    expect(screen.queryByText(/treino de base/i)).toBeNull();
  });
  it('a lesão aparece em Trabalho e em Você com o mesmo nome', () => {
    const v = transacao(atleta(), (x, r) => { lesionar(x, r, 2, 'profissional'); }).vida;
    const parte = v.corpo.condicoes.find(c => c.lesao)!.lesao!.parte;
    render(<main><Trabalho vida={v} agir={() => true} irPara={nada} /></main>);
    expect(within(screen.getByRole('region', { name: 'A carreira no esporte' })).getByText(new RegExp(parte))).toBeTruthy();
    cleanup();
    render(<main><Voce vida={v} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    expect(screen.getAllByText(new RegExp(parte)).length).toBeGreaterThan(0);
  });
  it('o fechamento do ano conta a temporada em poucos números', () => {
    const v = atleta();
    render(<main><FechamentoDoAno vida={v} /></main>);
    expect(screen.getByText(/Temporada \d{4} — .* · meia/)).toBeTruthy();
    expect(screen.getByText(/jogos · \d+ como titular/)).toBeTruthy();
  });
});

describe('Tempo livre ↔ motor: a semana sobrecarregada tem significado', () => {
  it('a palavra da semana é a do motor', () => {
    const v = viva(30, 43);
    contratar(v, criarRng(1), ocupacao('assistente_adm'));
    v.educacao.matricula = { cursoId: 'medicina', instituicao: 'UF', rede: 'publica', modalidade: 'presencial', tInicio: v.t, mesesRestantes: 60, mensalidade: 0, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId };
    v.trabalho.horasExtras = true;
    v.mente.sobrecarga = { anos: 3, t: v.t };
    const l = leituraDaSobrecarga(v);
    render(<main><Tempo vida={v} agir={() => true} /></main>);
    const semana = screen.getByRole('region', { name: 'Sua semana' });
    expect(within(semana).getByText(new RegExp(`^${l.palavra.charAt(0).toUpperCase() + l.palavra.slice(1)}\\.`))).toBeTruthy();
    expect(within(semana).getByText(/Há 3 anos assim/)).toBeTruthy();
  });
});

describe('Pessoas: um ex é um ex', () => {
  it('a ficha do ex não oferece "passar a tarde junto"; oferece conversar sobre o que ficou', () => {
    const v = viva(35, 44);
    const p = criarPessoa(v, criarRng(9), { idade: 35, genero: 'feminino', municipioId: v.moradia.municipioId });
    p.nome = 'Clara';
    const vin = vincular(v, p, { origem: 'romance', proximidade: 60, convivio: [] });
    vin.romance = { estagio: 'namoro', tEstagio: v.t - 36, tInicio: v.t - 36, envolvimento: 60 };
    terminar(v, p, vin, 'jogador');
    render(<main><Pessoas vida={v} agir={() => true} aberta={p.id} abrir={nada} /></main>);
    expect(screen.queryByText(/Passar um tempo com Clara|Viajar para ver Clara|Mandar mensagem para Clara/)).toBeNull();
    expect(screen.getAllByText(/Conversar com Clara sobre o que ficou entre vocês|Ligar para Clara e falar do que ficou/).length).toBeGreaterThan(0);
  });
});

describe('correção pós-FIX: ação bloqueada e palco nas telas', () => {
  it('a ação conhecida sem dinheiro aparece desabilitada, com o motivo', () => {
    const v = viva(34, 45);
    v.educacao.concluidos.push({ cursoId: 'odontologia', nome: 'Odontologia', nivel: 'superior', area: 'odontologia', tFim: v.t - 60, instituicao: 'x' });
    v.educacao.escolaridade = 'superior'; v.trabalho.licencas.push('cro'); v.trabalho.experiencia['odontologia'] = 72;
    contratar(v, criarRng(1), ocupacao('dentista'));
    v.trabalho.atual!.clientela = 85; v.financas.conta = 0; v.financas.investimentos = [];
    render(<main><Trabalho vida={v} agir={() => true} irPara={nada} /></main>);
    const botao = screen.getByText(/Montar um consultório odontológico/).closest('button')!;
    expect(botao.hasAttribute('disabled')).toBe(true);
    expect(within(botao).getByText(/capital/)).toBeTruthy();
  });
  it('o palco diz o valor contratado, os custos e o que ficou — e "No bolso" é o que ficou', () => {
    let v = transacao(viva(28, 46), x => {
      garantirFrente(x, 'musica'); x.caminhos.frentes.musica!.habilidade = 82;
      x.rotinas = [{ id: 'musica', tInicio: x.t, nivel: 3 }];
      x.caminhos.arte = { linguagem: 'musica', nome: 'Maré', tipo: 'banda', tInicio: x.t - 60, publico: 60, membros: [], ativo: true };
      contratar(x, criarRng(1), ocupacao('musico_profissional')); x.trabalho.atual!.clientela = 60;
    }).vida;
    for (let s = 1; s < 20 && !(v.caminhos.palco?.apresentacoes); s++) v = transacao(v, x => { temporadaDePalco(x, criarRng(s)); }).vida;
    render(<main><Trabalho vida={v} agir={() => true} irPara={nada} /></main>);
    const bloco = screen.getByLabelText('O palco no último ano');
    expect(within(bloco).getByText(/valor contratado/)).toBeTruthy();
    expect(within(bloco).getByText(/Custos \(equipe/)).toBeTruthy();
    expect(within(bloco).getByText(new RegExp(`Ficou para você: ${dinheiroCurto(v.caminhos.palco!.artista).replace(/[.$]/g, m => '\\' + m)}`))).toBeTruthy();
    expect(screen.getAllByText(new RegExp(remuneracaoDe(v.trabalho.atual!).liquido.toLocaleString('pt-BR').replace('.', '\\.'))).length).toBeGreaterThan(0);
  });
});
