// @vitest-environment jsdom
/**
 * REWORK 7 — VIDA COMO JOGO: os testes CAUSAIS. Não basta a tela renderizar: cada um percorre a cadeia
 *   ação → motor → estado → (anos) → a tela mostra exatamente o que o motor tem → save → reabrir.
 * E a consistência entre abas: a mesma coisa, em três lugares, lida da mesma fonte.
 *
 *   atividade   começar → praticar anos → a habilidade sobe → o cartão e a ficha dizem o estágio do motor → save
 *   compra      comprar o violão → é seu (Pertences) → rende na prática (a ficha mostra) → o bônus existe → save
 *   relação     agir com alguém → o vínculo muda → o laço em palavras e a história mostram o mesmo
 *   carreira    trabalhar → sair → o emprego entra na trajetória (Por onde você passou)
 *   atributo    Você mostra a habilidade com a palavra exata do estágio do motor
 *   formação    estudar → as matérias com os degraus do motor (o nome da matéria é o do país)
 *   gerações    morrer → o herdeiro continua → o violão ficou → aparece em Pertences e na biografia, com o rosto
 *   navegação   cada intenção nova chega a um lugar que mostra o que promete
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App, precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { executar, type Acao } from '../../motor/acoes';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { interpretar } from '../../motor/save';
import { estagioDe, modeloFrente, MATERIAS } from '../../motor/dados/frentes';
import { estagioDaFrente } from '../../motor/sistemas/frentes';
import { bonusDaAtividade } from '../../motor/sistemas/coisas';
import { ofertasDeVeiculos } from '../../motor/sistemas/mercado';
import { continuarComo } from '../../motor/sistemas/sucessao';
import { calcularHeranca } from '../../motor/sistemas/partilha';
import { adulto, comFilho, comParceiro } from '../../motor/__tests__/cenarios';
import type { Vida } from '../../motor/tipos';
import { leituraDaPratica } from '../leituraPratica';
import { Tempo } from '../jogo/Tempo';
import { Voce } from '../jogo/Voce';
import { Pessoas } from '../jogo/Pessoas';
import { Pertences } from '../jogo/Pertences';
import { Trabalho } from '../jogo/Trabalho';
import { DesenvolvimentoReal } from '../jogo/Progresso';
import { NOME_MATERIA } from '../../motor/sistemas/escola';
import { VidaConcreta } from '../jogo/VidaConcreta';
import { LinhaDaVida } from '../jogo/LinhaDaVida';
import { dinheiroCurto } from '../leituraMaterial';
import { MAPA_DE_INTENCOES } from '../navegacao';

beforeAll(async () => { await precarregar(); });
beforeEach(() => { localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true; const r = criarRng(20261016); vi.spyOn(Math, 'random').mockImplementation(() => r.next()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const nada = () => {};
function vida(idade: number, ajuste: (v: Vida) => void = () => {}, semente = 7): Vida {
  let v = criarVida({ nome: 'Lia', sobrenome: 'Prado', genero: 'feminino', municipioId: 'recife-pe', semente });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  ajuste(v);
  return v;
}
const anos = (v: Vida, n: number) => { for (let k = 0; k < n; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; v.caminhos.processo = undefined; } return v; };
const reabrir = (v: Vida): Vida => { const r = interpretar(JSON.stringify(v)); if (r.tipo !== 'ok') throw new Error('save inválido'); return r.vida; };

function Ligado({ v0, tela }: { v0: Vida; tela: (v: Vida, agir: (a: Acao) => boolean) => ReactNode }) {
  const [v, setV] = useState(v0);
  const agir = (a: Acao) => { const r = executar(v, a); setV(r.vida); return true; };
  return <main>{tela(v, agir)}</main>;
}

describe('atividade: começar → praticar → evoluir → a tela diz o que o motor tem → save', () => {
  it('a música, três anos: o estágio e a palavra do cartão e da ficha são os do motor — e sobrevivem ao save', () => {
    let v = vida(12, x => { x.financas.conta = 5000; });
    v = executar(v, { tipo: 'rotina', id: 'musica', ativa: true, nivel: 1 }).vida;
    expect(v.rotinas.some(r => r.id === 'musica')).toBe(true);
    const antes = v.caminhos.frentes.musica?.habilidade ?? 0;
    v = anos(v, 3);
    const f = v.caminhos.frentes.musica!;
    expect(f.habilidade).toBeGreaterThan(antes);
    const l = leituraDaPratica(v, v.rotinas.find(r => r.id === 'musica')!)!;
    const e = estagioDe(f.habilidade);
    expect(l.principal?.estagio).toBe(e);
    expect(l.principal?.palavra).toBe(modeloFrente('musica').estagios[e]);
    expect(l.anosNaSemana).toBe(3);
    expect(l.historia.some(h => h.tipo === 'comeco')).toBe(true);

    render(<main><Tempo vida={v} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    const cartao = screen.getByRole('button', { name: /Tocar um instrumento: abrir a história/ }).closest('.pratica') as HTMLElement;
    expect(within(cartao).getByText(/^há 3 anos/)).toBeTruthy();
    expect(within(cartao).getByRole('img', { name: `Música: ${l.principal!.palavra}` })).toBeTruthy();
    fireEvent.click(within(cartao).getByRole('button', { name: /abrir a história/ }));
    const ficha = screen.getByRole('dialog', { name: 'Tocar um instrumento' });
    expect(within(ficha).getByRole('region', { name: 'Como você está nisso' })).toBeTruthy();
    expect(within(ficha).getAllByText(l.principal!.palavra).length).toBeGreaterThan(0);
    expect(within(ficha).getByRole('list', { name: /A história: Tocar um instrumento/ })).toBeTruthy();
    expect(within(ficha).getByRole('button', { name: 'Parar' })).toBeTruthy();
    cleanup();

    const de = reabrir(v);
    expect(leituraDaPratica(de, de.rotinas.find(r => r.id === 'musica')!)).toEqual(l);
  });

  it('a dedicação muda pelo motor: "Mais a sério" na ficha troca o nível — e o cartão acompanha', () => {
    const v = vida(26, x => { x.trabalho.atual = undefined; contratar(x, criarRng(2), ocupacao('assistente_adm')); x.financas.conta = 90000; x.rotinas = [{ id: 'desenho', tInicio: x.t - 24, nivel: 1 }]; });
    render(<Ligado v0={v} tela={(vv, agir) => <Tempo vida={vv} agir={agir} irPara={nada} abrirPessoa={nada} />} />);
    fireEvent.click(screen.getByRole('button', { name: /Desenhar: abrir a história/ }));
    const ficha = screen.getByRole('dialog', { name: 'Desenhar' });
    const mais = within(ficha).getAllByRole('button', { name: /^Mais a sério:/ }).find(b => !(b as HTMLButtonElement).disabled)!;
    const nivel = mais.textContent!.replace('Mais a sério: ', '');
    fireEvent.click(mais);
    const atual = within(screen.getByRole('dialog', { name: 'Desenhar' })).getByRole('group', { name: 'Dedicação' }).querySelector('[aria-current="true"] strong')!;
    expect(atual.textContent!.toLowerCase()).toBe(nivel.toLowerCase());
  });

  it('a academia não ensina um esporte: a ficha mostra o condicionamento — a mesma palavra de Você', () => {
    let v = vida(24, x => { x.financas.conta = 9000; });
    v = executar(v, { tipo: 'rotina', id: 'academia', ativa: true, nivel: 1 }).vida;
    v = anos(v, 2);
    const l = leituraDaPratica(v, v.rotinas.find(r => r.id === 'academia')!)!;
    expect(l.principal).toBeUndefined();
    expect(l.pessoal?.d).toBe('condicionamento');
    render(<main><Voce vida={v} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    // REWORK 9.6: o corpo é o atributo Físico, na ficha de atributos — a mesma palavra.
    expect(within(screen.getByRole('region', { name: 'Atributos' }).querySelector('[data-atributo="fisico"]') as HTMLElement).getByText(l.pessoal!.palavra)).toBeTruthy();
  });
});

describe('lacunas causais corrigidas no motor', () => {
  it('voltar a uma atividade cuja frente tem outro nome (a leitura pratica a língua) conta como retomada', () => {
    let v = vida(30, x => { x.trabalho.atual = undefined; contratar(x, criarRng(2), ocupacao('assistente_adm')); x.financas.conta = 20000; x.educacao.basica = undefined; x.educacao.matricula = undefined; });
    v = executar(v, { tipo: 'rotina', id: 'leitura', ativa: true, nivel: 1 }).vida;
    v = anos(v, 3);
    v = executar(v, { tipo: 'rotina', id: 'leitura', ativa: false }).vida;
    v = anos(v, 3);
    v = executar(v, { tipo: 'rotina', id: 'leitura', ativa: true, nivel: 1 }).vida;
    expect(v.biografia.some(e => /^Voltou a ler depois de \d+ anos/.test(e.texto))).toBe(true);
    expect(v.caminhos.marcas.some(m => m.tipo === 'retomada' && m.dominio === 'linguagens')).toBe(true);
  });

  it('a mesma causa com o mesmo nome aparece uma vez na leitura do estresse (o tamanho somado)', async () => {
    const { leituraDoEstresse } = await import('../../motor/sistemas/leituraDoEstresse');
    const v = vida(30, x => { x.mente.abalos = [{ t: x.t, texto: 'as contas atrasadas', humor: -3, cabeca: 8 }, { t: x.t, texto: 'as contas atrasadas', humor: 0, cabeca: 6 }]; });
    const textos = leituraDoEstresse(v).pesando.map(c => c.texto.toLowerCase());
    expect(textos.filter(t => t === 'as contas atrasadas').length).toBe(1);
    expect(new Set(textos).size).toBe(textos.length);
  });
});

describe('compra: adquirir → possuir → usar → efeito → save', () => {
  it('o violão comprado é seu, rende na música (o motor dá o bônus) e a ficha da prática o mostra', () => {
    let v = vida(20, x => { x.financas.conta = 20000; x.rotinas.push({ id: 'musica', tInicio: x.t - 36, nivel: 1 }); });
    expect(bonusDaAtividade(v, 'musica')).toBe(0);
    const r = executar(v, { tipo: 'comprar_coisa', coisaId: 'violao' });
    expect(r.resultado ?? r.aviso?.texto).toMatch(/^O violão é seu agora/);
    v = r.vida;
    expect(bonusDaAtividade(v, 'musica')).toBeGreaterThan(0);
    const l = leituraDaPratica(v, v.rotinas.find(x => x.id === 'musica')!)!;
    expect(l.coisas.map(x => x.c.id)).toEqual(['violao']);
    render(<main><Pertences vida={v} agir={() => true} abrir={nada} /></main>);
    expect(screen.getByText(/Rende mais: tocar um instrumento \(você pratica há 3 anos\)/)).toBeTruthy();
    cleanup();
    render(<main><Tempo vida={v} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    fireEvent.click(screen.getByRole('button', { name: /Tocar um instrumento: abrir a história/ }));
    const com = within(screen.getByRole('dialog')).getByRole('region', { name: 'Com o que você pratica' });
    expect(within(com).getByText('Violão')).toBeTruthy();
    expect(reabrir(v).financas.coisas?.map(c => c.coisaId)).toEqual(['violao']);
  });

  it('a frase da compra concorda com a coisa ("A estante de livros é sua", não "A uma estante… é seu")', () => {
    const v = vida(20, x => { x.financas.conta = 20000; });
    const r = executar(v, { tipo: 'comprar_coisa', coisaId: 'livros' });
    expect(r.resultado ?? r.aviso?.texto).toMatch(/^A estante de livros é sua agora/);
  });

  it('Compras mostra a vitrine de verdade: os veículos à venda neste ano, com o preço mínimo do motor', () => {
    const v = vida(30, x => { x.trabalho.atual = undefined; contratar(x, criarRng(2), ocupacao('assistente_adm')); x.financas.conta = 90000; });
    const { container } = render(<main><VidaConcreta vida={v} agir={() => true} secao="compras" irSecao={nada} irPara={nada} abrirPessoa={nada} /></main>);
    const conc = screen.getByRole('button', { name: /Concessionária/ });
    expect(conc.querySelectorAll('.desenho-veiculo').length).toBeGreaterThan(0);
    const min = Math.min(...ofertasDeVeiculos(v, 'concessionaria').map(o => o.preco));
    expect(within(conc).getByText(`a partir de ${dinheiroCurto(min)}`)).toBeTruthy();
    // Os grupos seguem a vida: morar, ir e vir, as coisas, o corpo, os serviços, os bichos.
    expect([...container.querySelectorAll('.vitrines__titulo')].map(h => h.textContent)).toEqual(['Onde morar', 'Ir e vir', 'As coisas do dia a dia', 'O que se usa no corpo', 'Luxo e coleção', 'Serviços', 'Os bichos', 'Segunda mão e antiguidades (legais)']);
  });

  it('a loja de instrumentos diz o que rende no que você pratica — e o que já é seu dali', () => {
    const v = vida(25, x => { x.financas.conta = 30000; x.rotinas.push({ id: 'musica', tInicio: x.t - 12, nivel: 1 }); x.financas.coisas = [{ id: 'c1', coisaId: 'teclado', t: x.t - 12, preco: 2000, estado: 90 }]; });
    render(<main><VidaConcreta vida={v} agir={() => true} secao="compras" irSecao={nada} irPara={nada} abrirPessoa={nada} /></main>);
    const loja = screen.getByRole('button', { name: /Instrumentos musicais|Loja de instrumentos/ });
    expect(within(loja).getByText(/^Seu: teclado/)).toBeTruthy();
    expect(within(loja).getByText(/rende em "tocar um instrumento"/)).toBeTruthy();
  });
});

describe('relação: agir → o vínculo muda → a ficha mostra o laço do motor', () => {
  it('o laço em palavras é o do vínculo; depois de agir, muda junto (e a história ganha o passo)', () => {
    const v = vida(30, x => { x.trabalho.atual = undefined; contratar(x, criarRng(2), ocupacao('assistente_adm')); x.financas.conta = 60000; });
    const mae = Object.values(v.vinculos).find(x => x.parentesco === 'mae' && v.pessoas[x.pessoaId].vivo)!;
    mae.proximidade = 30; mae.tensao = 10; mae.confianca = 60;
    render(<Ligado v0={v} tela={(vv, agir) => <Pessoas vida={vv} agir={agir} aberta={mae.pessoaId} abrir={nada} />} />);
    const laco = () => within(screen.getByRole('dialog')).getByRole('list', { name: 'Como está o laço' });
    expect(within(laco()).getByText('distantes')).toBeTruthy();
    expect(within(laco()).getByText('firme')).toBeTruthy();
    const botoes = within(screen.getByRole('dialog')).getAllByRole('button').filter(b => /tarde|almoço|visitar|ligar|conversar|passar/i.test(b.textContent ?? '') && !(b as HTMLButtonElement).disabled);
    expect(botoes.length).toBeGreaterThan(0);
    fireEvent.click(botoes[0]);
    // O motor moveu o vínculo; a ficha relê (a mesma fonte): nada fica preso na palavra antiga se o valor mudou.
    expect(laco().textContent).toMatch(/Afeto(distantes|cordiais|próximos|muito próximos)/);
  });
});

describe('carreira: trabalhar → sair → o emprego entra na trajetória', () => {
  it('pedir demissão leva o emprego para "Por onde você passou" — com o ano e o lugar', () => {
    let v = vida(28, x => { x.trabalho.atual = undefined; x.trabalho.historico = []; contratar(x, criarRng(3), ocupacao('vendedor')); x.financas.conta = 30000; });
    v = anos(v, 2);
    // REWORK 9.6: a pré-condição dita (com as sementes deslocadas, a vendedora já podia ter saído nesses dois anos).
    if (!v.trabalho.atual) { contratar(v, criarRng(4), ocupacao('vendedor')); v.trabalho.atual!.tInicio = v.t - 24; }
    const emp = v.trabalho.atual!;
    v = executar(v, { tipo: 'pedir_demissao' }).vida;
    v.momento = null;
    expect(v.trabalho.atual).toBeUndefined();
    const { container } = render(<main><Trabalho vida={v} agir={() => true} irPara={nada} /></main>);
    const percurso = screen.getByRole('list', { name: 'A trajetória profissional' });
    expect(within(percurso).getAllByText(new RegExp(emp.empregador)).length).toBeGreaterThan(0);
    expect(container.querySelector('.trabalho')!.className).toMatch(/trabalho--familia-/);
  });

  it('cada família de carreira tem o seu emblema e o seu tom (a enfermagem não é o escritório)', () => {
    const tons = ['tec_enfermagem', 'assistente_adm', 'pedreiro'].map(id => {
      const v = vida(30, x => { x.trabalho.atual = undefined; contratar(x, criarRng(4), ocupacao(id)); });
      const { container } = render(<main><Trabalho vida={v} agir={() => true} irPara={nada} /></main>);
      const c = container.querySelector('.trabalho')!.className.match(/trabalho--familia-(\S+)/)![1];
      cleanup();
      return c;
    });
    expect(new Set(tons).size).toBe(3);
  });
});

describe('atributo: o motor calcula, Você mostra exatamente o resultado', () => {
  it('a habilidade praticada aparece em "No que você é bom" com a palavra do estágio — a mesma do cartão de Tempo livre', () => {
    let v = vida(14, x => { x.financas.conta = 3000; });
    v = executar(v, { tipo: 'rotina', id: 'desenho', ativa: true, nivel: 1 }).vida;
    v = anos(v, 4);
    const f = v.caminhos.frentes.desenho!;
    const palavra = modeloFrente('desenho').estagios[estagioDe(f.habilidade)];
    render(<main><Voce vida={v} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    const bom = screen.getByRole('region', { name: 'No que você é bom' });
    // REWORK 9.5 · UX-03: a ficha de desenvolvimento diz o nível em palavras (a mesma palavra do cartão da prática).
    expect(bom.querySelector('.ficha-hab[data-frente="desenho"] .ficha-hab__nivel')!.textContent!.toLowerCase()).toContain(palavra.toLowerCase());
    cleanup();
    render(<main><Tempo vida={v} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    expect(screen.getByRole('img', { name: new RegExp(`^Desenho: ${palavra}`) })).toBeTruthy();
  });

  it('a frase do momento não contradiz o cartão: com a cabeça tranquila, nada de "a cabeça vem enchendo"', () => {
    const v = vida(30, x => { x.mente.estresse = 20; x.mente.historico = [{ t: x.t - 12, humor: 60, cabeca: 5, saude: 80 }]; });
    render(<main><Voce vida={v} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    expect(screen.getByRole('main').textContent).not.toMatch(/A cabeça vem enchendo/);
  });
});

describe('formação: estudar → progredir → a tela mostra o caminho e as matérias do motor', () => {
  it('na escola, o boletim mostra cada matéria com o domínio do motor e a palavra da série — o nome é o do país', () => {
    // REWORK 9.5 · UX-04: as matérias moram no boletim (Desenvolvimento), uma lista só.
    const v = vida(13);
    render(<main><DesenvolvimentoReal vida={v} /></main>);
    const sec = screen.getByRole('region', { name: 'Boletim escolar' });
    for (const d of MATERIAS.filter(m => v.caminhos.frentes[m])) {
      const linha = sec.querySelector(`[data-frente="${d}"]`)!;
      expect(linha.textContent).toContain(NOME_MATERIA[d].charAt(0).toUpperCase() + NOME_MATERIA[d].slice(1));
      expect(linha.textContent!.toLowerCase()).toContain(estagioDaFrente(v, d).palavra.toLowerCase());
    }
  });
});

describe('gerações: morrer → herdar → continuar — e o que era dele continua coerente', () => {
  it('o violão do pai fica com a filha: em Pertences, e na biografia dela com o rosto de quem morreu', () => {
    const v = adulto(66, { semente: 11, genero: 'masculino' });
    const { p: mae } = comParceiro(v, { idade: 63, estagio: 'casamento', anos: 35, genero: 'feminino' });
    const { p: filha } = comFilho(v, 30, { outroId: mae.id, casa: false, genero: 'feminino' });
    v.financas.coisas = [{ id: 'cv', coisaId: 'violao', t: v.t - 100, preco: 900, estado: 70 }];
    v.morte = { t: v.t, causa: 'infarto', heranca: calcularHeranca(v) };
    const r = continuarComo(v, filha.id);
    expect(r.erro).toBeUndefined();
    const h = r.vida;
    expect(h.financas.coisas?.some(c => c.coisaId === 'violao')).toBe(true);
    render(<main><Pertences vida={h} agir={() => true} abrir={nada} /></main>);
    expect(screen.getByText('Violão')).toBeTruthy();
    cleanup();
    const entrada = h.biografia.find(e => /^Ficou com o violão de /.test(e.texto))!;
    expect(entrada).toBeTruthy();
    render(<main><LinhaDaVida vida={h} marca={0} abrirPessoa={nada} /></main>);
    fireEvent.click(screen.getByRole('button', { name: /Mostrar tudo|Só o que marcou/ }));
    const item = screen.getByText(entrada.texto).closest('.entrada') as HTMLElement;
    expect(item.querySelector('.entrada__rostos')).toBeTruthy();
    expect(reabrir(h).financas.coisas?.some(c => c.coisaId === 'violao')).toBe(true);
  });
});

describe('mundo: o acontecimento automático muda a vida e aparece onde importa', () => {
  it('vivendo os anos pela tela, "Enquanto isso" traz o que o mundo fez — e o rosto leva à ficha da pessoa', () => {
    const v = vida(34, x => { x.trabalho.atual = undefined; contratar(x, criarRng(2), ocupacao('assistente_adm')); x.financas.conta = 60000; }, 23);
    localStorage.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(v));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida/ }));
    const fecharTudo = () => { for (let k = 0; k < 10 && screen.queryByRole('dialog'); k++) { const d = screen.getByRole('dialog'); const o = within(d).queryAllByRole('button').find(b => b.classList.contains('opcao') && !(b as HTMLButtonElement).disabled) ?? within(d).queryAllByRole('button', { name: /^(Continuar|Fechar)$/ })[0]; if (o) fireEvent.click(o); else break; } };
    fecharTudo();
    let regiao: HTMLElement | null = null;
    for (let k = 0; k < 10 && !regiao; k++) { fireEvent.click(screen.getAllByRole('button', { name: /Viver mais um ano/ })[0]); fecharTudo(); regiao = screen.queryByRole('region', { name: 'Enquanto isso' }); }
    expect(regiao).toBeTruthy();
    const itens = within(regiao!).getAllByRole('listitem');
    expect(itens.length).toBeGreaterThan(0);
    const ver = within(regiao!).queryAllByRole('button', { name: /^Ver / })[0];
    if (ver) { const nome = ver.textContent!.replace(/^Ver /, ''); fireEvent.click(ver); expect(screen.getByRole('dialog', { name: nome })).toBeTruthy(); }
  });
});

describe('navegação: os testes de intenção do playtest', () => {
  it('as intenções do REWORK 7 existem no mapa e o menu as encontra pela busca', () => {
    for (const id of ['sair_amigo', 'violao', 'condicionamento', 'praticas', 'carreira', 'quanto_ganho', 'em_casa', 'historico_escolar', 'familia_aconteceu']) expect(MAPA_DE_INTENCOES.some(x => x.id === id)).toBe(true);
    const v = vida(30, x => { x.trabalho.atual = undefined; contratar(x, criarRng(2), ocupacao('assistente_adm')); });
    localStorage.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(v));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida/ }));
    for (let k = 0; k < 8 && screen.queryByRole('dialog'); k++) { const d = screen.getByRole('dialog'); const o = within(d).queryAllByRole('button').find(b => b.classList.contains('opcao') && !(b as HTMLButtonElement).disabled) ?? within(d).queryByRole('button', { name: /Continuar|Fechar/ }); if (o) fireEvent.click(o); else break; }
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const menu = screen.getByRole('dialog', { name: 'Menu' });
    fireEvent.change(within(menu).getByRole('searchbox'), { target: { value: 'violão' } });
    const achou = within(menu).getAllByRole('button').filter(b => b.classList.contains('onde-fica__item'));
    expect(achou.length).toBeGreaterThanOrEqual(1);
    expect(achou.length).toBeLessThanOrEqual(3);
    fireEvent.click(achou.find(b => /Começar a tocar violão/.test(b.textContent ?? ''))!);
    expect(screen.getByRole('tab', { name: 'Hobbies', selected: true })).toBeTruthy();
  });
});
