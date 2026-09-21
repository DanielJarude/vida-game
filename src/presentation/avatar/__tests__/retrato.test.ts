/**
 * Avatar 2.0 — o retrato vetorial.
 *
 * Desenho é difícil de testar automaticamente: nenhuma asserção prova que
 * um rosto "parece humano". O que estes testes protegem são as PROPRIEDADES
 * estruturais das quais a qualidade depende, e que regridem em silêncio:
 *
 * - a proporção realmente muda com a idade (senão o envelhecimento é só
 *   trocar a cor do cabelo, que era o estado anterior);
 * - o cabelo cacheado não é uma cadeia de círculos (o bug nomeado);
 * - todo caminho gerado é um path SVG válido e finito (uma medida NaN
 *   produz `M NaN NaN`, que o navegador simplesmente não desenha — falha
 *   invisível, a pior espécie);
 * - a mesma pessoa continua a mesma pessoa em todas as idades.
 *
 * A avaliação estética real é feita por inspeção visual — ver
 * `src/__visual__/gerarAvatares.test.tsx` e o roteiro de playtest.
 */

import { describe, expect, it } from 'vitest';
import { alturaCabeca, proporcoesNaIdade } from '../faceProportions';
import { construirBarba, construirCabelo } from '../hairPaths';
import { construirEspecificacaoAvatar } from '../../avatarRenderer';
import {
  APARENCIA_PADRAO,
  CORES_CABELO,
  CORES_OLHOS,
  ESTILOS_BARBA,
  ESTILOS_CABELO,
  TONS_PELE,
  derivarAparenciaDeSemente,
  normalizarAparencia
} from '../../../data/avatar/avatarData';

const IDADES = [0, 1, 2, 3, 5, 8, 11, 14, 17, 20, 24, 30, 40, 50, 60, 65, 70, 80, 95, 110];

/** Um path só é desenhável se todos os seus números forem finitos. */
function pathValido(d: string): boolean {
  if (!d || d.trim() === '') return false;
  if (/NaN|Infinity|undefined/.test(d)) return false;
  return /^[Mm]/.test(d.trim());
}

function todosOsCaminhos(idade: number, aparencia = APARENCIA_PADRAO): string[] {
  const spec = construirEspecificacaoAvatar(idade, aparencia);
  return [
    spec.cabeca,
    spec.sombraLateral,
    spec.pescoco,
    spec.sombraPescoco,
    spec.ombros,
    spec.nariz,
    spec.boca.linha,
    spec.boca.labioInferior,
    spec.boca.filtro,
    ...spec.sobrancelhas,
    ...spec.orelhas.flatMap(o => [o.forma, o.concha]),
    ...spec.olhos.flatMap(o => [o.abertura, o.palpebraSuperior, o.vinco]),
    ...spec.cabelo.atrasTodos,
    ...spec.cabelo.frenteTodos,
    ...spec.cabelo.textura,
    ...spec.barba,
    ...spec.marcas.nasogenianos,
    ...spec.marcas.pesDeGalinha,
    ...spec.marcas.testa,
    ...spec.marcas.olheiras
  ];
}

describe('Avatar 2.0 · integridade geométrica', () => {
  it('todo caminho de todo retrato é um path SVG desenhável', () => {
    for (const idade of IDADES) {
      for (const estiloCabelo of ESTILOS_CABELO) {
        for (const barba of ESTILOS_BARBA) {
          const caminhos = todosOsCaminhos(idade, {
            ...APARENCIA_PADRAO,
            estiloCabelo: estiloCabelo.id,
            barba: barba.id
          });
          for (const d of caminhos) {
            expect(pathValido(d), `idade ${idade}, ${estiloCabelo.id}/${barba.id}: "${d.slice(0, 60)}"`).toBe(true);
          }
        }
      }
    }
  });

  it('nenhuma combinação de aparência faz o renderer lançar', () => {
    for (const idade of IDADES) {
      for (const tom of TONS_PELE) {
        for (const cor of CORES_CABELO) {
          for (const olhos of CORES_OLHOS) {
            expect(() =>
              construirEspecificacaoAvatar(idade, {
                ...APARENCIA_PADRAO,
                tomPele: tom.id,
                corCabelo: cor.id,
                corOlhos: olhos.id
              })
            ).not.toThrow();
          }
        }
      }
    }
  });

  it('idade negativa ou absurda não quebra o retrato', () => {
    for (const idade of [-5, 0, 150, 1000]) {
      expect(() => construirEspecificacaoAvatar(idade, APARENCIA_PADRAO)).not.toThrow();
      for (const d of todosOsCaminhos(Math.max(0, idade))) {
        expect(pathValido(d)).toBe(true);
      }
    }
  });

  it('toda cor da paleta é um hexadecimal válido', () => {
    const spec = construirEspecificacaoAvatar(30, APARENCIA_PADRAO);
    for (const [nome, valor] of Object.entries(spec.paleta)) {
      expect(valor, `paleta.${nome}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('Avatar 2.0 · a proporção envelhece, não só a cor do cabelo', () => {
  it('a cabeça de um bebê é proporcionalmente mais larga que a de um adulto', () => {
    const bebe = proporcoesNaIdade(0);
    const adulto = proporcoesNaIdade(30);
    const larguraRelativa = (p: ReturnType<typeof proporcoesNaIdade>) =>
      (p.wCranio * 2) / alturaCabeca(p);
    expect(larguraRelativa(bebe)).toBeGreaterThan(larguraRelativa(adulto));
  });

  it('a linha dos olhos do bebê fica ABAIXO da metade da cabeça; a do adulto, perto da metade', () => {
    const posicaoRelativa = (idade: number) => {
      const p = proporcoesNaIdade(idade);
      return (p.yOlhos - p.yTopo) / alturaCabeca(p);
    };
    expect(posicaoRelativa(0)).toBeGreaterThan(0.6);
    expect(posicaoRelativa(30)).toBeLessThan(0.58);
    expect(posicaoRelativa(30)).toBeGreaterThan(0.44);
  });

  it('a mandíbula do bebê é muito mais larga em relação ao crânio que a do adulto', () => {
    const relacao = (idade: number) => {
      const p = proporcoesNaIdade(idade);
      return p.wQueixo / p.wCranio;
    };
    expect(relacao(0)).toBeGreaterThan(relacao(24) * 1.4);
  });

  it('a proporção muda de forma CONTÍNUA — não há degrau de um ano para o outro', () => {
    let maiorSalto = 0;
    for (let idade = 1; idade <= 90; idade++) {
      const a = proporcoesNaIdade(idade - 1);
      const b = proporcoesNaIdade(idade);
      for (const chave of Object.keys(a) as (keyof typeof a)[]) {
        maiorSalto = Math.max(maiorSalto, Math.abs(b[chave] - a[chave]));
      }
    }
    // Nenhuma medida pula mais de 1 unidade (de 100) num único aniversário.
    expect(maiorSalto).toBeLessThan(1);
  });

  it('marcas de idade aparecem gradualmente, não num interruptor único', () => {
    const marcas = (idade: number) => construirEspecificacaoAvatar(idade, APARENCIA_PADRAO).marcas;
    expect(marcas(25).nasogenianos).toHaveLength(0);
    expect(marcas(25).testa).toHaveLength(0);
    expect(marcas(42).nasogenianos.length).toBeGreaterThan(0);
    expect(marcas(42).testa).toHaveLength(0);
    expect(marcas(55).pesDeGalinha.length).toBeGreaterThan(0);
    expect(marcas(65).testa.length).toBeGreaterThan(0);
    expect(marcas(80).testa.length).toBeGreaterThan(marcas(65).testa.length);
  });

  it('o cabelo recua devagar com a idade, sem trocar de penteado', () => {
    const espec = (idade: number) => construirEspecificacaoAvatar(idade, APARENCIA_PADRAO);
    // Mesmo estilo, mesma quantidade de peças: é a mesma pessoa.
    expect(espec(30).cabelo.frenteTodos.length).toBe(espec(80).cabelo.frenteTodos.length);
    // Mas o desenho não é idêntico — a implantação mudou.
    expect(espec(30).cabelo.frenteTodos[0]).not.toBe(espec(80).cabelo.frenteTodos[0]);
  });
});

describe('Avatar 2.0 · cabelo cacheado não é uma fileira de bolinhas', () => {
  const p = proporcoesNaIdade(24);
  const cacheado = construirCabelo('cacheado', p, 24);

  it('não usa comandos de arco circular (o bug nomeado: "a6 6 0 1 1")', () => {
    // O renderer anterior desenhava o cacheado com seis arcos `a6 6 ...`
    // de raio idêntico — círculos tangentes, que é exatamente a aparência
    // de bolinhas coladas.
    const todos = [...cacheado.atras, ...cacheado.frente].join(' ');
    expect(/[Aa]\s*\d/.test(todos), 'silhueta cacheada voltou a usar arcos').toBe(false);
  });

  it('a silhueta é uma massa contínua com lóbulos de tamanhos DIFERENTES', () => {
    const silhueta = cacheado.frente[0];
    // Extrai os raios implícitos: distância de cada ponto ao centro do crânio.
    const numeros = silhueta.match(/-?\d+(\.\d+)?/g)!.map(Number);
    const raios: number[] = [];
    for (let i = 0; i + 1 < numeros.length; i += 2) {
      const dx = numeros[i] - 50;
      const dy = numeros[i + 1] - p.yTempora;
      raios.push(Math.hypot(dx, dy));
    }
    const distintos = new Set(raios.map(r => Math.round(r)));
    // Lóbulos iguais produziriam pouquíssimos raios distintos.
    expect(distintos.size).toBeGreaterThan(5);
  });

  it('tem textura interna além do contorno — é o movimento que lê como cacho', () => {
    expect(cacheado.textura.length).toBeGreaterThanOrEqual(5);
    for (const d of cacheado.textura) {
      expect(pathValido(d)).toBe(true);
      // Textura é TRAÇO, nunca forma fechada: um Z aqui viraria mais uma bolinha.
      expect(d.trim().endsWith('Z')).toBe(false);
    }
  });

  it('o cacheado tem mais volume que o cabelo liso da mesma cabeça', () => {
    const extensao = (d: string) => {
      const numeros = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      const xs = numeros.filter((_, i) => i % 2 === 0);
      return Math.max(...xs) - Math.min(...xs);
    };
    const curto = construirCabelo('curto', p, 24);
    expect(extensao(cacheado.frente[0])).toBeGreaterThan(extensao(curto.frente[0]));
  });
});

describe('Avatar 2.0 · implantação, barba e careca', () => {
  const p = proporcoesNaIdade(30);

  it('careca não desenha nenhum fio', () => {
    const espec = construirEspecificacaoAvatar(30, { ...APARENCIA_PADRAO, estiloCabelo: 'careca' });
    expect(espec.cabelo.atrasTodos).toEqual([]);
    expect(espec.cabelo.frenteTodos).toEqual([]);
    expect(espec.cabelo.textura).toEqual([]);
    // Compatibilidade com o renderer anterior.
    expect(espec.cabelo.atras).toBeUndefined();
    expect(espec.cabelo.frente).toBeUndefined();
  });

  it('todo estilo com cabelo desenha ao menos um caminho', () => {
    for (const estilo of ESTILOS_CABELO) {
      if (estilo.id === 'careca') continue;
      const espec = construirEspecificacaoAvatar(30, { ...APARENCIA_PADRAO, estiloCabelo: estilo.id });
      expect(
        espec.cabelo.atrasTodos.length + espec.cabelo.frenteTodos.length,
        estilo.id
      ).toBeGreaterThan(0);
    }
  });

  it('a linha de implantação deixa a testa à mostra (o cabelo não é um capacete)', () => {
    // O ponto mais baixo do cabelo frontal, no eixo central, tem de ficar
    // acima da sobrancelha — senão o cabelo cobriria a testa inteira.
    for (const estilo of ESTILOS_CABELO) {
      if (estilo.id === 'careca') continue;
      const caminhos = construirCabelo(estilo.id, p, 30);
      const numeros = caminhos.frente[0].match(/-?\d+(\.\d+)?/g)!.map(Number);
      const ys: number[] = [];
      for (let i = 1; i < numeros.length; i += 2) {
        // Só os pontos perto do eixo central (a testa).
        if (Math.abs(numeros[i - 1] - 50) < 6) ys.push(numeros[i]);
      }
      const maisBaixo = Math.max(...ys);
      expect(maisBaixo, `${estilo.id} cobre a testa inteira`).toBeLessThan(p.ySobrancelha);
    }
  });

  it('barba só existe a partir de uma idade plausível', () => {
    for (const idade of [5, 10, 14]) {
      const espec = construirEspecificacaoAvatar(idade, { ...APARENCIA_PADRAO, barba: 'cheia' });
      expect(espec.barba, `idade ${idade}`).toEqual([]);
    }
    expect(construirEspecificacaoAvatar(30, { ...APARENCIA_PADRAO, barba: 'cheia' }).barba.length).toBeGreaterThan(0);
  });

  it('cada estilo de barba produz um desenho distinto e "nenhuma" não desenha nada', () => {
    expect(construirBarba('nenhuma', p)).toEqual([]);
    const desenhos = new Set(
      ESTILOS_BARBA.filter(b => b.id !== 'nenhuma').map(b => construirBarba(b.id, p).join('|'))
    );
    expect(desenhos.size).toBe(3);
  });
});

describe('Avatar 2.0 · continua sendo a mesma pessoa (regra preservada do B4-FIX2)', () => {
  it('tom de pele e cor dos olhos são idênticos em toda a vida', () => {
    const aparencia = { ...APARENCIA_PADRAO, tomPele: 'negra' as const, corOlhos: 'verde' as const };
    const especs = IDADES.map(idade => construirEspecificacaoAvatar(idade, aparencia));
    expect(new Set(especs.map(e => e.corPele)).size).toBe(1);
    expect(new Set(especs.map(e => e.corOlhos)).size).toBe(1);
  });

  it('o cabelo embranquece a partir dos 65, e não antes', () => {
    const aparencia = { ...APARENCIA_PADRAO, corCabelo: 'ruivo' as const };
    const cor = (idade: number) => construirEspecificacaoAvatar(idade, aparencia).corCabelo;
    expect(cor(64)).not.toBe(cor(70));
    expect(cor(30)).toBe(cor(64));
    expect(cor(70)).toBe(cor(90));
  });

  it('o estilo escolhido nunca é reescrito pela idade — só a cor exibida muda', () => {
    const aparencia = { ...APARENCIA_PADRAO, estiloCabelo: 'coque' as const };
    const jovem = construirEspecificacaoAvatar(30, aparencia);
    const idoso = construirEspecificacaoAvatar(80, aparencia);
    expect(jovem.cabelo.atrasTodos.length).toBe(idoso.cabelo.atrasTodos.length);
    expect(jovem.cabelo.frenteTodos.length).toBe(idoso.cabelo.frenteTodos.length);
  });
});

describe('Avatar 2.0 · rostos derivados de id (NPCs)', () => {
  it('a mesma semente produz sempre a mesma aparência', () => {
    for (const semente of ['fam_pai', 'npc_colega_7', 'x']) {
      expect(derivarAparenciaDeSemente(semente)).toEqual(derivarAparenciaDeSemente(semente));
    }
  });

  it('sementes diferentes produzem variedade real de rostos', () => {
    const sementes = Array.from({ length: 60 }, (_, i) => `npc_${i}`);
    const combinacoes = new Set(
      sementes.map(s => {
        const a = derivarAparenciaDeSemente(s);
        return `${a.tomPele}|${a.estiloCabelo}|${a.corCabelo}|${a.corOlhos}`;
      })
    );
    expect(combinacoes.size).toBeGreaterThan(20);

    // E cada eixo realmente varia — não é só um deles mudando.
    for (const eixo of ['tomPele', 'estiloCabelo', 'corCabelo', 'corOlhos'] as const) {
      const valores = new Set(sementes.map(s => derivarAparenciaDeSemente(s)[eixo]));
      expect(valores.size, eixo).toBeGreaterThan(2);
    }
  });

  it('toda aparência derivada é válida para o renderer', () => {
    for (let i = 0; i < 40; i++) {
      const aparencia = derivarAparenciaDeSemente(`npc_${i}`);
      expect(normalizarAparencia(aparencia)).toEqual(aparencia);
      for (const d of todosOsCaminhos(32, aparencia)) {
        expect(pathValido(d)).toBe(true);
      }
    }
  });
});
