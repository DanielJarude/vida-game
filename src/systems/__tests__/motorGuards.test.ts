import { describe, expect, it } from 'vitest';
import {
  candidatarEmprego,
  escolherBico,
  trabalharMais
} from '../careerSystem';
import { ingressarCurso } from '../educationSystem';
import {
  aplicarInvestimento,
  comprarBem,
  jogarMegaSena,
  resgatarInvestimento,
  venderBem
} from '../economySystem';
import { iniciarNamoro, pedirEmCasamento, terFilho } from '../relationshipSystem';
import { interagirComFamiliar } from '../familySystem';
import { FamilyMember } from '../../types';
import { IMOVEIS_LOJA, VEICULOS_LOJA } from '../../data/assetsData';
import { TODAS_PROFISSOES, BICOS_DISPONIVEIS } from '../../data/careersData';
import { CURSOS_DISPONIVEIS } from '../../data/coursesData';
import { criarEstadoTeste } from './fixtures';

// ---------------------------------------------------------------------------
// Cenário: chamada DIRETA ao motor tentando contornar a UI com um bebê de 0 anos.
// Toda função precisa recusar sem efeitos parciais (saldo, atributos e vínculos
// inalterados).
// ---------------------------------------------------------------------------
describe('Motor revalida a política: bebê de 0 anos', () => {
  const bebemRico = criarEstadoTeste({
    idade: 0,
    economia: { dinheiro: 1000000 }
  });
  const { personagem, educacao, carreira, economia, familia } = bebemRico;

  it('comprarBem recusa imóvel mesmo com saldo abundante', () => {
    const imovel = IMOVEIS_LOJA[0];
    const res = comprarBem(imovel, economia, personagem, personagem.anoAtual);
    expect(res.sucesso).toBe(false);
    expect(res.economiaAtualizada).toBeUndefined();
    expect(economia.dinheiro).toBe(1000000);
    expect(economia.propriedades).toHaveLength(0);
  });

  it('comprarBem recusa veículo', () => {
    const veiculo = VEICULOS_LOJA[0];
    const res = comprarBem(veiculo, economia, personagem, personagem.anoAtual);
    expect(res.sucesso).toBe(false);
    expect(economia.propriedades).toHaveLength(0);
  });

  it('venderBem recusa negociação de bem herdado (possuir não é poder agir)', () => {
    const ecoComBem = {
      ...economia,
      propriedades: [
        {
          id: 'prop_1',
          tipo: 'imovel' as const,
          nome: 'Casa herdada',
          valorCompra: 100000,
          valorAtual: 100000,
          custoAnualManutencao: 1000,
          anoCompra: 2026,
          quitado: true
        }
      ]
    };
    const res = venderBem('prop_1', ecoComBem, personagem, personagem.anoAtual);
    expect(res.sucesso).toBe(false);
    expect(ecoComBem.propriedades).toHaveLength(1);
    expect(ecoComBem.dinheiro).toBe(1000000);
  });

  it('aplicarInvestimento e resgatarInvestimento recusam', () => {
    expect(aplicarInvestimento('poupanca', 500, economia, personagem).sucesso).toBe(false);
    expect(resgatarInvestimento('poupanca', 500, economia, personagem).sucesso).toBe(false);
    expect(economia.dinheiro).toBe(1000000);
  });

  it('jogarMegaSena recusa aposta', () => {
    const res = jogarMegaSena(economia, personagem, personagem.anoAtual);
    expect(res.sucesso).toBe(false);
    expect(economia.dinheiro).toBe(1000000);
  });

  it('candidatarEmprego recusa vaga adulta (sem depender da UI filtrar)', () => {
    const vaga = TODAS_PROFISSOES.find(j => j.id === 'atendente')!;
    const res = candidatarEmprego(vaga, personagem, educacao, personagem.anoAtual);
    expect(res.sucesso).toBe(false);
    expect(carreira.empregado).toBe(false);
  });

  it('candidatarEmprego recusa jovem aprendiz para bebê (janela 16–24)', () => {
    const vaga = TODAS_PROFISSOES.find(j => j.id === 'jovem_aprendiz')!;
    const res = candidatarEmprego(vaga, personagem, educacao, personagem.anoAtual);
    expect(res.sucesso).toBe(false);
  });

  it('escolherBico recusa bico adulto', () => {
    const res = escolherBico(BICOS_DISPONIVEIS[0].id, carreira, personagem, educacao, economia);
    expect(res.sucesso).toBe(false);
    expect(carreira.bicoAtivoId ?? null).toBeNull();
  });

  it('ingressarCurso recusa universidade', () => {
    const curso = CURSOS_DISPONIVEIS.find(c => c.tipo === 'superior')!;
    const res = ingressarCurso(curso, 'publica', personagem, educacao, personagem.anoAtual);
    expect(res.sucesso).toBe(false);
    expect(educacao.emCurso).toBe(false);
  });

  it('iniciarNamoro recusa (sistema adulto; romance adolescente é pendência)', () => {
    const res = iniciarNamoro(
      { nome: 'Rui', sobrenome: 'Lima', genero: 'masculino', idade: 25, profissao: 'Advogado', aparencia: 80, inteligencia: 80, personalidade: 'Divertido' },
      personagem,
      personagem.anoAtual
    );
    expect(res.sucesso).toBe(false);
    expect(familia).toHaveLength(2);
  });

  it('pedirEmCasamento recusa casamento infantil', () => {
    const res = pedirEmCasamento(familia[0], personagem, personagem.anoAtual);
    expect(res.sucesso).toBe(false);
  });

  it('terFilho recusa', () => {
    const res = terFilho(null, personagem, undefined, undefined, personagem.anoAtual);
    expect(res.sucesso).toBe(false);
    expect(familia).toHaveLength(2);
  });

  it('interagirComFamiliar recusa pedir dinheiro de bebê sem efeitos', () => {
    const mae = familia.find(f => f.tipo === 'mae')!;
    const antes = { ...mae };
    const res = interagirComFamiliar(mae, personagem, 'pedir_dinheiro');
    expect(res.sucesso).toBe(false);
    expect(res.dinheiroGanho).toBe(0);
    expect(mae.relacionamento).toBe(antes.relacionamento);
  });

  it('trabalharMais recusa sem emprego', () => {
    const res = trabalharMais(carreira, personagem);
    expect(res.sucesso).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Escolaridade como fonte de verdade real (não flag congelada)
// ---------------------------------------------------------------------------
describe('Escolaridade e candidatura a emprego', () => {
  it('usa o estado real de educação, ignorando flag legada congelada', () => {
    const estado = criarEstadoTeste({
      idade: 25,
      personagem: { flags: { escolaridade: 'nenhuma' } }, // flag legada mentindo
      educacao: { nivelAtual: 'medio_completo' as const, emCurso: false, desempenho: 70, cursosConcluidos: [] }
    });
    const vaga = TODAS_PROFISSOES.find(j => j.id === 'vendedor')!; // exige medio_completo
    const res = candidatarEmprego(vaga, estado.personagem, estado.educacao, 2026);
    // Pode ser contratado ou não (sorteio), mas NUNCA recusado por escolaridade
    expect(res.mensagem).not.toContain('exige');
  });

  it('recusa duramente candidatura abaixo da escolaridade exigida', () => {
    const estado = criarEstadoTeste({
      idade: 30,
      educacao: { nivelAtual: 'fundamental_completo' as const, emCurso: false, desempenho: 70, cursosConcluidos: [] }
    });
    const vaga = TODAS_PROFISSOES.find(j => j.escolaridadeMinima === 'superior_completo')!;
    const res = candidatarEmprego(vaga, estado.personagem, estado.educacao, 2026);
    expect(res.sucesso).toBe(false);
    expect(res.mensagem).toContain('exige');
    expect(estado.carreira.empregado).toBe(false);
  });

  it('bebe com inteligência alta e flag falsa continua impedido pela escolaridade real', () => {
    const estado = criarEstadoTeste({
      idade: 18,
      personagem: { flags: { escolaridade: 'pos_graduacao' }, stats: { felicidade: 80, saude: 90, inteligencia: 95, aparencia: 70 } },
      educacao: { nivelAtual: 'nenhuma' as const, emCurso: false, desempenho: 70, cursosConcluidos: [] }
    });
    const vaga = TODAS_PROFISSOES.find(j => j.escolaridadeMinima === 'medio_completo')!;
    const res = candidatarEmprego(vaga, estado.personagem, estado.educacao, 2026);
    expect(res.sucesso).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Decisões familiares adultas: parceiro romântico é pré-requisito (M9) e o
// progresso de relacionamento é relativo, nunca um set absoluto (M5)
// ---------------------------------------------------------------------------
describe('Relacionamentos adultos no motor (chamada direta)', () => {
  const adulto = criarEstadoTeste({ idade: 30 });
  const parceira: FamilyMember = {
    id: 'fam_parceira_1',
    nome: 'Rita',
    sobrenome: 'Nunes',
    genero: 'feminino',
    tipo: 'namorada',
    idade: 28,
    relacionamento: 70,
    vivo: true,
    profissao: 'Dentista',
    renda: 90000
  };

  it('terFilho recusa adulto solteiro (sem parceiro) sem efeitos', () => {
    const res = terFilho(null, adulto.personagem, undefined, undefined, 2026);
    expect(res.sucesso).toBe(false);
    expect(res.novoFilho).toBeUndefined();
    expect(res.personagemAtualizado).toBeUndefined();
  });

  it('terFilho recusa quando o alvo é familiar sem vínculo romântico (ex.: pai)', () => {
    const res = terFilho(adulto.familia[0], adulto.personagem, undefined, undefined, 2026);
    expect(res.sucesso).toBe(false);
    expect(res.novoFilho).toBeUndefined();
  });

  it('terFilho recusa parceiro falecido', () => {
    const res = terFilho({ ...parceira, vivo: false }, adulto.personagem, undefined, undefined, 2026);
    expect(res.sucesso).toBe(false);
  });

  it('terFilho aceita com parceiro romântico vivo', () => {
    const res = terFilho({ ...parceira }, adulto.personagem, 'Luna', 'feminino', 2026);
    expect(res.sucesso).toBe(true);
    expect(res.novoFilho).toBeDefined();
    expect(res.novoFilho?.tipo).toBe('filha');
  });

  it('casamento aplica progresso relativo (70 + 15 = 85), sem teleporte para 100', () => {
    const res = pedirEmCasamento({ ...parceira }, adulto.personagem, 2026);
    expect(res.sucesso).toBe(true);
    expect(res.parceiroAtualizado?.relacionamento).toBe(85);
    // felicidade também relativa: 80 + 30 = 110 → clamp em 100
    expect(res.personagemAtualizado?.stats.felicidade).toBe(100);
  });

  it('casamento recusa vínculo fraco (abaixo de 65) mesmo sendo adulto', () => {
    const res = pedirEmCasamento({ ...parceira, relacionamento: 40 }, adulto.personagem, 2026);
    expect(res.sucesso).toBe(false);
  });
});
