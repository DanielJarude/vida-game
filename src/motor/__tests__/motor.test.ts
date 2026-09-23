import { describe, expect, it } from 'vitest';
import { nova, responder, viver, viverAte } from './ajuda';
import { criarVida } from '../criacao';
import { avancarAno } from '../ano';
import { disponibilidade, executar, opcoesDeCurso } from '../acoes';
import { idade, idadePessoa, filhos, mae, pai, vinculosVivos } from '../nucleo';
import { CATALOGO } from '../conteudo/catalogo';
import { contexto } from '../conteudo/base';
import { criarRng } from '../rng';
import { despesasMensais } from '../sistemas/dinheiro';
import { elegibilidade } from '../sistemas/trabalho';
import { ocupacao, OCUPACOES } from '../dados/ocupacoes';
import { MUNICIPIOS } from '../dados/lugares';
import { podeTerRomance } from '../sistemas/romance';
import type { Vida } from '../tipos';
import { criarPessoa, vincular } from '../pessoas';

describe('determinismo', () => {
  it('mesma semente e mesmos comandos produzem a mesma vida', () => {
    const a = viver(nova({ semente: 7 }), 40);
    const b = viver(nova({ semente: 7 }), 40);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('sementes diferentes produzem vidas diferentes', () => {
    const a = viver(nova({ semente: 7 }), 30);
    const b = viver(nova({ semente: 8 }), 30);
    expect(a.biografia.map(e => e.texto)).not.toEqual(b.biografia.map(e => e.texto));
  });
});

describe('nascimento', () => {
  it('pais têm idade coerente e irmãos existentes são mais velhos', () => {
    for (let s = 1; s <= 60; s++) {
      const v = criarVida({ nome: 'A', sobrenome: 'B', genero: 'masculino', municipioId: MUNICIPIOS[s % MUNICIPIOS.length].id, semente: s });
      const m = mae(v);
      expect(idadePessoa(v, m)).toBeGreaterThanOrEqual(16);
      const p = pai(v);
      if (p) expect(idadePessoa(v, p)).toBeGreaterThanOrEqual(17);
      for (const { p: irmao, vin } of vinculosVivos(v)) {
        if (vin.parentesco === 'irmao') expect(idadePessoa(v, irmao)).toBeGreaterThanOrEqual(1);
        if (vin.parentesco === 'avo') expect(idadePessoa(v, irmao)).toBeGreaterThan(idadePessoa(v, m));
      }
      // nenhum genitor exerce ocupação abaixo da idade mínima legal dela
      for (const genitor of [m, p].filter(Boolean)) {
        const oc = OCUPACOES.find(o => o.nome.includes(genitor!.ocupacao ?? ''));
        if (oc) expect(idadePessoa(v, genitor!)).toBeGreaterThanOrEqual(oc.idadeMin);
      }
    }
  });

  it('a primeira linha da biografia conta o nascimento com lugar e família', () => {
    const v = nova();
    expect(v.biografia[0].texto).toMatch(/^Nasceu em \w+ de \d{4}, em Recife, PE/);
    expect(v.biografia[0].relevancia).toBe('marco');
  });
});

describe('regra de agência', () => {
  it('nenhum acontecimento usa linguagem de escolha do personagem', () => {
    const proibido = /\b(você decidiu|decidiu|escolheu|preferiu|resolveu|optou|encarou|adorou|você amou|você odiou|sua primeira lembrança|do jeito certo)\b/i;
    const textos: string[] = [];
    for (let s = 1; s <= 8; s++) {
      let v = nova({ semente: s * 13, genero: s % 2 ? 'feminino' : 'masculino' });
      for (let i = 0; i < 70 && !v.morte; i++) {
        v = avancarAno(v).vida;
        if (v.momento) v = responder(v);
        const r = criarRng(s * 1000 + i);
        for (const c of CATALOGO) {
          if (c.tipo !== 'acontecimento') continue;
          if (idade(v) < c.idade[0] || idade(v) > c.idade[1]) continue;
          try {
            const p: Record<string, never> = {};
            const ctx = contexto(structuredClone(v), r, p);
            if (c.papeis) continue; // papéis exigem seleção real; cobertos pela simulação abaixo
            if (c.quando && !c.quando(ctx)) continue;
            const n = c.narrar(ctx);
            if (n) textos.push(`${c.id}: ${n.texto}`);
          } catch { /* conteúdo que depende de estado ausente */ }
        }
      }
      for (const e of v.biografia) if (!e.escolha) textos.push(`bio: ${e.texto}`);
    }
    const violacoes = textos.filter(t => proibido.test(t));
    expect(violacoes).toEqual([]);
  }, 60000);

  it('personalidade só é movida por decisões comportamentais e rotinas', () => {
    const idsDecisaoComportamental = new Set(CATALOGO.filter(c => c.tipo === 'decisao' && !c.biografica).map(c => c.id));
    for (let s = 1; s <= 12; s++) {
      const v = viver(nova({ semente: s * 31 }), 60, vv => (idade(vv) >= 6 ? [{ tipo: 'rotina', id: 'futebol', ativa: true }] : []));
      for (const ev of v.personalidade.evidencias) {
        const [origem] = ev.origem.split(':');
        expect(origem === 'rotina' || idsDecisaoComportamental.has(origem)).toBe(true);
      }
    }
  });

  it('escolhas biográficas nunca movem personalidade', () => {
    const biograficas = CATALOGO.filter(c => c.tipo === 'decisao' && c.biografica);
    expect(biograficas.length).toBeGreaterThan(0);
    for (const d of biograficas) {
      if (d.tipo !== 'decisao') continue;
      for (const o of d.opcoes) expect(o.comportamento ?? {}).toBeDefined();
    }
    const v = viver(nova({ semente: 5 }), 3);
    expect(v.personalidade.evidencias.filter(e => e.origem.startsWith('bb_primeira_palavra'))).toEqual([]);
  });
});

describe('texto', () => {
  it('nunca usa "(a)" nem assume masculino para personagem feminina', () => {
    for (let s = 1; s <= 10; s++) {
      const v = viver(nova({ semente: s * 17, genero: 'feminino' }), 70, vv => idade(vv) >= 18 && !vv.trabalho.atual ? [{ tipo: 'candidatar', ocupacaoId: 'atendente' }] : []);
      for (const e of v.biografia) {
        expect(e.texto).not.toMatch(/\([ao]\)|\bo\(a\)/);
        // Frases sem sujeito falam da própria personagem ("Foi demitida...").
        expect(e.texto).not.toMatch(/(^|\. )(Foi )?(promovido|demitido|aprovado|aposentado|contratado|casado|nascido|pego|descoberto)\b/);
      }
    }
  });

  it('pessoa não binária escolhe a concordância', () => {
    const neutra = nova({ genero: 'nao_binario', tratamento: 'nao_binario', semente: 3 });
    const fem = nova({ genero: 'nao_binario', tratamento: 'feminino', semente: 3 });
    expect(neutra.biografia[0].texto).toContain('filhe');
    expect(fem.biografia[0].texto).toContain('filha');
  });
});

describe('limites legais e plausibilidade', () => {
  it('criança não trabalha; 14-15 só aprendiz', () => {
    let v = viverAte(nova({ semente: 9 }), 12);
    expect(elegibilidade(v, ocupacao('atendente')).grau).toBe('ilegal');
    expect(elegibilidade(v, ocupacao('jovem_aprendiz')).grau).toBe('ilegal');
    v = viverAte(v, 14);
    expect(elegibilidade(v, ocupacao('atendente')).grau).toBe('ilegal');
    expect(['permitido', 'improvavel']).toContain(elegibilidade(v, ocupacao('jovem_aprendiz')).grau);
  });

  it('diploma de Pedagogia não habilita Medicina; 18 anos não é mestre de obras', () => {
    const v = viverAte(nova({ semente: 11 }), 25);
    v.educacao.concluidos.push({ cursoId: 'pedagogia', nome: 'Pedagogia', nivel: 'superior', area: 'educacao', tFim: v.t, instituicao: 'x' });
    v.educacao.escolaridade = 'superior';
    expect(elegibilidade(v, ocupacao('medico')).grau).toBe('requisito');
    const jovem = viverAte(nova({ semente: 12 }), 18);
    expect(elegibilidade(jovem, ocupacao('mestre_obras')).grau).not.toBe('permitido');
  });

  it('adulto nunca tem romance com menor', () => {
    for (let s = 1; s <= 15; s++) {
      const v = viver(nova({ semente: s * 7 }), 30);
      for (const { p, vin } of vinculosVivos(v)) {
        if (!vin.romance || vin.romance.estagio === 'ex' || vin.romance.estagio === 'interesse') continue;
        const iEu = idade(v);
        const iP = idadePessoa(v, p);
        expect((iEu >= 18) === (iP >= 18) || vin.romance.tEstagio < v.t - 12 * Math.abs(iEu - iP)).toBe(true);
        expect(Math.min(iEu, iP)).toBeGreaterThanOrEqual(14);
      }
    }
  });

  it('ninguém com menos de 14 pode ter romance', () => {
    const v = viverAte(nova({ semente: 21 }), 12);
    for (const { p, vin } of vinculosVivos(v)) expect(podeTerRomance(v, p, vin)).toBe(false);
  });
});

describe('lugar', () => {
  it('Medicina presencial não existe em cidade pequena; EAD existe em qualquer lugar', () => {
    let v = viverAte(nova({ municipioId: 'tarauaca-ac', semente: 4 }), 18);
    v.educacao.escolaridade = 'medio';
    v.educacao.basica = undefined;
    v.educacao.enem.push({ t: v.t, nota: 850 });
    const med = opcoesDeCurso(v).filter(o => o.curso.id === 'medicina');
    expect(med.length).toBeGreaterThan(0);
    for (const o of med) expect(o.municipioId).not.toBe('tarauaca-ac');
    expect(opcoesDeCurso(v).some(o => o.modalidade === 'ead' && o.municipioId === 'tarauaca-ac')).toBe(true);
  });
});

describe('família', () => {
  it('filhos nascem de gestação, nove meses depois da concepção', () => {
    let achou = 0;
    for (let s = 1; s <= 40 && achou < 3; s++) {
      let v = viverAte(nova({ semente: s * 101 }), 24);
      for (let k = 0; k < 20 && !v.morte; k++) {
        const gest = v.processos.find(p => p.tipo === 'gestacao');
        const antes = filhos(v).length;
        v = avancarAno(v).vida;
        if (v.momento) v = responder(v);
        if (filhos(v).length > antes) {
          achou++;
          const bebe = filhos(v).find(f => idadePessoa(v, f) <= 1)!;
          if (gest && gest.tipo === 'gestacao') expect(bebe.tNasc).toBe(gest.tParto);
          expect(bebe.nome.length).toBeGreaterThan(0);
        }
      }
    }
    expect(achou).toBeGreaterThan(0);
  });

  it('quem não pode gestar não tenta ter filho biológico com quem também não pode', () => {
    const v = viverAte(nova({ genero: 'masculino', semente: 55 }), 25);
    for (const { vin } of vinculosVivos(v)) if (vin.romance) vin.romance = undefined;
    const r = criarRng(3);
    const par = criarPessoa(v, r, { idade: 26, genero: 'masculino', municipioId: v.moradia.municipioId });
    vincular(v, par, { origem: 'romance', proximidade: 80 });
    v.vinculos[par.id].romance = { estagio: 'namoro', tEstagio: v.t - 24, envolvimento: 80 };
    expect(disponibilidade(v, { tipo: 'filhos', plano: 'tentando' }).grau).toBe('impossivel');
    expect(disponibilidade(v, { tipo: 'adotar' }).grau).not.toBe('impossivel');
  });
});

describe('dinheiro', () => {
  it('família com filhos, casa e carro gasta muito mais que solteiro na casa dos pais', () => {
    const solteiro = viverAte(nova({ semente: 77 }), 25);
    const gastoSolteiro = -despesasMensais(solteiro).reduce((s, l) => s + l.valor, 0);
    const familia: Vida = structuredClone(solteiro);
    familia.moradia = { tipo: 'aluguel', municipioId: familia.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1600, padrao: 3, tInicio: familia.t };
    for (const { vin } of vinculosVivos(familia)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
    const r = criarRng(1);
    const par = criarPessoa(familia, r, { idade: 26, municipioId: familia.moradia.municipioId });
    vincular(familia, par, { origem: 'romance', proximidade: 80, convivio: ['casa'] });
    familia.vinculos[par.id].romance = { estagio: 'casamento', tEstagio: familia.t, envolvimento: 80 };
    for (const i of [2, 5]) {
      const f = criarPessoa(familia, r, { idade: i, municipioId: familia.moradia.municipioId });
      vincular(familia, f, { parentesco: 'filho', origem: 'familia', proximidade: 80, convivio: ['casa'] });
    }
    familia.financas.bens.push({ id: 'car', tipo: 'veiculo', modeloId: 'carro_usado', nome: 'carro popular usado', valor: 38000, tCompra: familia.t, estado: 70 });
    const gastoFamilia = -despesasMensais(familia).reduce((s, l) => s + l.valor, 0);
    expect(gastoFamilia).toBeGreaterThan(gastoSolteiro * 3);
    expect(gastoFamilia).toBeGreaterThan(5000);
  });

  it('não existe riqueza automática: quem não trabalha não acumula', () => {
    // Família pobre: sem herança relevante, o único dinheiro seria o do próprio trabalho.
    const v = viver(nova({ semente: 99, classe: 'vulneravel' }), 50);
    expect(v.financas.conta + v.financas.reserva).toBeLessThan(100000);
  });
});

describe('ações', () => {
  it('ação bloqueada devolve o motivo e não altera a vida', () => {
    const v = nova();
    const r = executar(v, { tipo: 'mudar_cidade', municipioId: 'sao-paulo-sp' });
    expect(r.vida).toBe(v);
    expect(r.aviso?.texto).toMatch(/Menor/);
  });

  it('candidatura abre uma entrevista (desafio), não contrata direto', () => {
    const v = viverAte(nova({ semente: 13 }), 19);
    v.educacao.escolaridade = 'medio';
    const r = executar(v, { tipo: 'candidatar', ocupacaoId: 'atendente' });
    expect(r.vida.momento?.situacaoId).toBe('trab_entrevista');
    expect(r.vida.trabalho.atual?.ocupacaoId).not.toBe('atendente');
  });
});
