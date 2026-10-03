/**
 * Conteúdo por país: uma vida no Japão, na Alemanha ou nos Estados Unidos
 * não fala de SUS, Pix, Detran, FGTS, ENEM nem de reais — o conteúdo lê o
 * perfil do país onde a pessoa mora. E o Brasil continua falando deles.
 *
 * Também: a viagem "pelo país" é pelo país onde se mora (viajar não é
 * migrar), e "para fora" é o mundo menos esse país — o Brasil incluído.
 */

import { describe, expect, it } from 'vitest';
import { criarVida } from '../criacao';
import { avancarAno } from '../ano';
import { executar } from '../acoes';
import { transacao } from '../nucleo';
import { cidadesDoPais, municipio } from '../dados/lugares';
import { paisDaCidade } from '../dados/lugares';
import { definirPaisCorrente } from '../mundo/moeda';
import { catalogoDeViagem, escolhasDaExperiencia, nomeDaExperiencia } from '../sistemas/experiencias';
import { editalAberto } from '../sistemas/concurso';
import { ocupacao } from '../dados/ocupacoes';
import { nomeDaForca } from '../dados/forcas';
import { MUNIC_POR_INDICE, indiceDaGuarnicao } from '../sistemas/militar';
import type { Vida } from '../tipos';

const PROIBIDOS = ['SUS', 'Pix', 'Polícia Federal', 'Polícia Militar', 'Detran', 'FGTS', 'INSS', 'carteira assinada', 'ENEM', 'ProUni', 'FIES', 'R$', 'São João', 'reais'];
const achar = (t: string) => PROIBIDOS.filter(p => (p === 'SUS' || p === 'Pix' || p === 'reais' ? new RegExp(`\\b${p.replace('$', '\\$')}\\b`).test(t) : t.includes(p)));

/** Vive `anos` anos respondendo a primeira opção livre; guarda tudo o que a tela mostrou. */
function viver(municipioId: string, semente: number, anos: number): { v: Vida; textos: string[] } {
  let v = criarVida({ nome: 'Alex', sobrenome: 'Teste', genero: semente % 2 ? 'masculino' : 'feminino', municipioId, semente });
  const textos: string[] = [];
  for (let a = 0; a < anos && !v.morte; a++) {
    for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
      const m = v.momento;
      textos.push(m.titulo, m.texto, ...m.opcoes.flatMap(o => [o.texto, o.detalhe ?? '', o.bloqueio ?? '']));
      const op = m.opcoes.find(o => !o.bloqueio) ?? m.opcoes[0];
      v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
    }
    if (v.morte) break;
    v = avancarAno(v).vida;
  }
  textos.push(...v.biografia.map(b => b.texto));
  return { v, textos };
}

describe('Conteúdo brasileiro não vaza para outros países', () => {
  for (const pais of ['JP', 'DE', 'US']) {
    // (viver() guarda o que a tela mostrou: os momentos e a biografia inteira)
    it(`vidas em ${pais}: nenhum termo institucional brasileiro em 60 anos`, () => {
      const cidades = cidadesDoPais(pais);
      expect(cidades.length).toBeGreaterThan(0);
      const ruins: string[] = [];
      for (let k = 0; k < 3; k++) {
        const { v, textos } = viver(cidades[(k * 7) % cidades.length].id, 4100 + k * 13 + pais.charCodeAt(0), 60);
        expect(paisDaCidade(v.moradia.municipioId) === pais || v.mundo !== undefined).toBe(true);
        for (const t of textos) if (achar(t).length) ruins.push(`${achar(t).join(',')}: ${t}`);
      }
      expect(ruins).toEqual([]);
    }, 300_000);
  }

  it('no Brasil, os mesmos termos continuam aparecendo (sanidade)', () => {
    const vistos = new Set<string>();
    for (let k = 0; k < 2; k++) {
      const { textos } = viver('recife-pe', 4200 + k, 60);
      for (const t of textos) for (const p of achar(t)) vistos.add(p);
    }
    expect(vistos.size).toBeGreaterThan(0);
    expect(vistos.has('R$')).toBe(true);
  }, 300_000);
});

describe('Instituições pelo perfil do país', () => {
  it('concurso: sem edital onde o serviço público não entra por concurso; a PM só existe no Brasil', () => {
    const us = criarVida({ nome: 'A', sobrenome: 'B', genero: 'feminino', municipioId: cidadesDoPais('US')[0].id, semente: 3 });
    const fr = criarVida({ nome: 'A', sobrenome: 'B', genero: 'feminino', municipioId: cidadesDoPais('FR')[0].id, semente: 3 });
    for (let ano = 0; ano < 30; ano++) {
      const t = (x: Vida) => ({ ...x, t: x.t + ano * 12 });
      expect(editalAberto(t(us), ocupacao('tecnico_publico'))).toBe(false);
      expect(editalAberto(t(fr), ocupacao('aluno_pm'))).toBe(false);
      expect(editalAberto(t(fr), ocupacao('policial_rodoviario'))).toBe(false);
    }
  });

  it('as Forças levam o nome do país; a guarnição de fora tem índice próprio', () => {
    expect(nomeDaForca('aeronautica', 'BR')).toBe('a Aeronáutica');
    expect(nomeDaForca('marinha', 'CO')).toBe('a Armada da Colômbia');
    const bogota = cidadesDoPais('CO')[3].id;
    expect(MUNIC_POR_INDICE(indiceDaGuarnicao(bogota))).toBe(bogota);
    expect(MUNIC_POR_INDICE(indiceDaGuarnicao('recife-pe'))).toBe('recife-pe');
  });
});

/* ------------------------------------------------------------- Viagens */

function adultaEm(municipioId: string): Vida {
  let v = criarVida({ nome: 'Lia', sobrenome: 'Prado', genero: 'feminino', municipioId, semente: 7 });
  for (let i = 0; i < 30; i++) { v = avancarAno(v).vida; v.momento = null; }
  v.caminhos.pendente = undefined;
  return transacao(v, x => { x.financas.conta = 900000; x.trabalho.atual = undefined; x.moradia = { ...x.moradia, municipioId }; }).vida;
}

describe('Viagens: pelo país onde se mora, e para o mundo', () => {
  it('quem mora na Espanha viaja pela Espanha; para fora, o Brasil aparece; viajar não muda a casa', () => {
    const madri = cidadesDoPais('ES').find(m => m.capitalNacional)!.id;
    const v = adultaEm(madri);
    definirPaisCorrente('ES');
    expect(nomeDaExperiencia('viagem_pais')).toBe('Uma viagem pela Espanha');
    const dentro = catalogoDeViagem(v, 'viagem_pais');
    expect(dentro.grupos.length).toBeGreaterThan(0);
    expect(dentro.perguntaGrupo).toBe('Para que parte da Espanha?');
    for (const g of dentro.grupos) for (const l of g.lugares) expect(paisDaCidade(l.id.replace('.', ':'))).toBe('ES');
    const fora = catalogoDeViagem(v, 'viagem_exterior');
    expect(fora.grupos.some(g => g.id === 'brasil')).toBe(true);
    expect(fora.grupos.some(g => g.nome === 'Espanha')).toBe(false);
    const escolha = escolhasDaExperiencia(v, 'viagem_pais')[0];
    const r = executar(v, { tipo: 'experiencia', id: 'viagem_pais', escolha: escolha.id });
    expect(r.vida.moradia.municipioId).toBe(madri);
    expect(v.financas.conta - r.vida.financas.conta).toBe(escolha.custo);
    const rio = escolhasDaExperiencia(r.vida, 'viagem_exterior').find(e => e.id === 'rio:semana')!;
    expect(rio).toBeTruthy();
    const r2 = executar({ ...r.vida, fatos: { ...r.vida.fatos, exp_viagem_exterior: -999 } }, { tipo: 'experiencia', id: 'viagem_exterior', escolha: 'rio:semana' });
    expect(r2.vida.moradia.municipioId).toBe(madri);
    expect(r2.vida.biografia.slice(-4).some(b => b.texto.includes('Rio de Janeiro'))).toBe(true);
    definirPaisCorrente('BR');
  }, 120_000);

  it('quem mora no Brasil vê as mesmas opções, com os mesmos preços de antes', () => {
    const v = adultaEm('recife-pe');
    definirPaisCorrente('BR');
    expect(nomeDaExperiencia('viagem_pais')).toBe('Uma viagem pelo Brasil');
    const aqui = municipio(v.moradia.municipioId);
    const longe = aqui.perfil === 'pequena' || aqui.perfil === 'polo' ? 1 : 0;
    const gente = 1 + 0.8 * catalogoDeViagem(v, 'viagem_pais').companhia.length;
    const fora = catalogoDeViagem(v, 'viagem_exterior');
    const DE_SEMPRE = ['argentina', 'uruguai', 'chile', 'peru', 'colombia', 'mexico', 'estados_unidos', 'portugal', 'franca', 'italia', 'japao'];
    // Os de sempre, na ordem de sempre (os países novos entram no continente deles).
    expect(fora.grupos.map(g => g.id).filter(id => DE_SEMPRE.includes(id))).toEqual(['argentina', 'uruguai', 'chile', 'peru', 'colombia', 'mexico', 'estados_unidos', 'portugal', 'franca', 'italia', 'japao']);
    expect(fora.perguntaGrupo).toBe('Para qual país?');
    const xs = escolhasDaExperiencia(v, 'viagem_exterior');
    const preco = (id: string) => xs.find(e => e.id === id)!.custo;
    expect(preco('lisboa:semana')).toBe(Math.round(((5600 + longe * 700) + 760 * 7) * gente / 100) * 100);
    expect(preco('buenos_aires:curta')).toBe(Math.round(((2400 + longe * 700) + 520 * 4) * gente / 100) * 100);
    expect(xs.some(e => e.id === 'toquio:curta')).toBe(false);
    const dentro = catalogoDeViagem(v, 'viagem_pais');
    expect(dentro.perguntaGrupo).toBe('Para que parte do Brasil?');
    expect(dentro.grupos.map(g => g.id)).toEqual(['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']);
    const ys = escolhasDaExperiencia(v, 'viagem_pais');
    // Recife (PE): Noronha é PE (fica, por ser ilha), Ouro Preto é de outra região.
    expect(ys.find(e => e.id === 'noronha:semana')!.custo).toBe(Math.round((650 + longe * 450 + 900 + 1150 * 7) * gente / 100) * 100);
    expect(ys.find(e => e.id === 'ouro_preto:semana')!.custo).toBe(Math.round((1500 + longe * 450 + 290 * 7) * gente / 100) * 100);
  }, 120_000);
});
