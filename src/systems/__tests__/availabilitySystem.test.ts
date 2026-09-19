import { describe, expect, it } from 'vitest';
import {
  getActionAvailability,
  getAbasDisponiveis,
  getAtividadesVisiveis,
  listarVagasCompativeis,
  descreverSituacaoAtual
} from '../availabilitySystem';
import { criarEstadoTeste } from './fixtures';
import { FamilyMember } from '../../types';

// ---------------------------------------------------------------------------
// Cenário: personagem de 0 anos contra todas as ações adultas (política central)
// ---------------------------------------------------------------------------
describe('Política central: bebê de 0 anos não acessa ações adultas', () => {
  const estado = criarEstadoTeste({ idade: 0 });
  const acoesAdultas: {
    acao: Parameters<typeof getActionAvailability>[1];
    params?: Parameters<typeof getActionAvailability>[2];
    nome: string;
  }[] = [
    { acao: 'comprar_bem', params: { itemId: 'prop_kitnet' }, nome: 'comprar imóvel' },
    { acao: 'comprar_bem', params: { itemId: 'vec_moto_160' }, nome: 'comprar veículo' },
    { acao: 'investir', nome: 'investir' },
    { acao: 'resgatar_investimento', nome: 'resgatar investimento' },
    { acao: 'jogar_loteria', nome: 'jogar na loteria' },
    { acao: 'candidatar_emprego', params: { jobId: 'atendente' }, nome: 'emprego adulto' },
    { acao: 'fazer_bico', params: { bicoId: 'bico_entregas' }, nome: 'bico adulto' },
    { acao: 'ingressar_curso', params: { cursoId: 'sup_medicina' }, nome: 'entrar na universidade' },
    { acao: 'iniciar_namoro', nome: 'iniciar relacionamento adulto' },
    { acao: 'pedir_casamento', params: { membroId: 'fam_pai_1' }, nome: 'casar' },
    { acao: 'ter_filho', nome: 'ter filhos' },
    { acao: 'executar_atividade', params: { atividadeId: 'act_balada_barzinho' }, nome: 'atividade adulta' },
    { acao: 'interagir_familia', params: { membroId: 'fam_pai_1', tipoInteracao: 'pedir_dinheiro' }, nome: 'pedir dinheiro' }
  ];

  it.each(acoesAdultas.map(a => [a.nome, a] as const))(
    'recusa "%s" sem expor a ação (oculto ou bloqueado, nunca disponível)',
    (_nome, acao) => {
      const disp = getActionAvailability(estado, acao.acao, acao.params);
      expect(disp.kind).not.toBe('disponivel');
    }
  );

  it('não mostra abas de Finanças nem Estudos para o bebê', () => {
    const abas = getAbasDisponiveis(estado);
    expect(abas).not.toContain('financas');
    expect(abas).not.toContain('carreira');
    expect(abas).toContain('timeline');
    expect(abas).toContain('familia');
  });

  it('situação atual do bebê é coerente (nunca "Sem ocupação formal")', () => {
    const situacao = descreverSituacaoAtual(estado);
    expect(situacao).toBe('Bebê — vive com os pais');
  });

  it('atividades visíveis para o bebê não incluem lazer adulto', () => {
    const visiveis = getAtividadesVisiveis(estado).flatMap(g => g.itens.map(i => i.atividade.id));
    expect(visiveis).not.toContain('act_balada_barzinho');
    expect(visiveis).not.toContain('act_ferias_praia');
    expect(visiveis).not.toContain('act_leitura');
  });
});

// ---------------------------------------------------------------------------
// Fronteiras de idade: mínimo - 1, mínimo, mínimo + 1
// ---------------------------------------------------------------------------
describe('Fronteiras de idade (17 / 18 / 19)', () => {
  it('compra de imóvel: oculto aos 17 não qualificados... bloqueado aos 17 na prévia, disponível aos 18', () => {
    // Aos 17 a política permite uma prévia bloqueada com motivo
    const aos17 = criarEstadoTeste({ idade: 17 });
    const disp17 = getActionAvailability(aos17, 'comprar_bem', { itemId: 'prop_kitnet' });
    expect(disp17.kind).toBe('bloqueado');
    if (disp17.kind === 'bloqueado') expect(disp17.motivo).toContain('18');

    const aos18 = criarEstadoTeste({ idade: 18, economia: { dinheiro: 500000 } });
    expect(getActionAvailability(aos18, 'comprar_bem', { itemId: 'prop_kitnet' }).kind).toBe('disponivel');

    const aos19 = criarEstadoTeste({ idade: 19, economia: { dinheiro: 500000 } });
    expect(getActionAvailability(aos19, 'comprar_bem', { itemId: 'prop_kitnet' }).kind).toBe('disponivel');
  });

  it('emprego adulto: recusado antes dos 18, liberado aos 18 (com escolaridade)', () => {
    const base = { educacao: { nivelAtual: 'medio_completo' as const, emCurso: false, desempenho: 70, cursosConcluidos: [] } };
    const aos17 = criarEstadoTeste({ idade: 17, ...base });
    expect(getActionAvailability(aos17, 'candidatar_emprego', { jobId: 'atendente' }).kind).not.toBe('disponivel');
    const aos18 = criarEstadoTeste({ idade: 18, ...base });
    expect(getActionAvailability(aos18, 'candidatar_emprego', { jobId: 'atendente' }).kind).toBe('disponivel');
  });

  it('universidade: exige 18 E escolaridade; aos 17 com médio completo só prévia', () => {
    const aos17 = criarEstadoTeste({
      idade: 17,
      educacao: { nivelAtual: 'medio_completo' as const, emCurso: false, desempenho: 70, cursosConcluidos: [] }
    });
    const disp17 = getActionAvailability(aos17, 'ingressar_curso', { cursoId: 'sup_medicina' });
    expect(disp17.kind).toBe('bloqueado');
    if (disp17.kind === 'bloqueado') expect(disp17.motivo).toContain('18');

    const aos18semMedio = criarEstadoTeste({
      idade: 18,
      educacao: { nivelAtual: 'medio_incompleto' as const, emCurso: false, desempenho: 70, cursosConcluidos: [] }
    });
    const disp18 = getActionAvailability(aos18semMedio, 'ingressar_curso', { cursoId: 'sup_medicina' });
    expect(disp18.kind).toBe('bloqueado');
    if (disp18.kind === 'bloqueado') expect(disp18.motivo.toLowerCase()).toContain('médio');
  });

  it('namoro adulto: oculto aos 17, disponível aos 18 (romance adolescente é pendência, não abre o sistema)', () => {
    const aos17 = criarEstadoTeste({ idade: 17 });
    expect(getActionAvailability(aos17, 'iniciar_namoro').kind).toBe('oculto');
    const aos18 = criarEstadoTeste({ idade: 18 });
    expect(getActionAvailability(aos18, 'iniciar_namoro').kind).toBe('disponivel');
  });

  it('jovem aprendiz: modalidade juvenil 16–24 (fronteira 15/16/25)', () => {
    const base = { educacao: { nivelAtual: 'fundamental_completo' as const, emCurso: false, desempenho: 70, cursosConcluidos: [] } };
    const aos15 = criarEstadoTeste({ idade: 15, ...base });
    expect(getActionAvailability(aos15, 'candidatar_emprego', { jobId: 'jovem_aprendiz' }).kind).not.toBe('disponivel');
    const aos16 = criarEstadoTeste({ idade: 16, ...base });
    expect(getActionAvailability(aos16, 'candidatar_emprego', { jobId: 'jovem_aprendiz' }).kind).toBe('disponivel');
    const aos25 = criarEstadoTeste({ idade: 25, ...base });
    const disp25 = getActionAvailability(aos25, 'candidatar_emprego', { jobId: 'jovem_aprendiz' });
    expect(disp25.kind).toBe('bloqueado');
  });

  it('bicos: ocultos antes dos 18 (nenhuma modalidade juvenil modelada)', () => {
    const aos17 = criarEstadoTeste({ idade: 17 });
    expect(getActionAvailability(aos17, 'fazer_bico', { bicoId: 'bico_entregas' }).kind).toBe('oculto');
  });

  it('bico com requisito de escolaridade informa motivo específico', () => {
    const adulto = criarEstadoTeste({
      idade: 30,
      educacao: { nivelAtual: 'medio_incompleto' as const, emCurso: false, desempenho: 70, cursosConcluidos: [] }
    });
    const disp = getActionAvailability(adulto, 'fazer_bico', { bicoId: 'bico_freela_design_ti' });
    expect(disp.kind).toBe('bloqueado');
    if (disp.kind === 'bloqueado') expect(disp.motivo).toContain('Ensino Técnico');
  });

  it('mercado de trabalho aos 16 lista apenas vagas juvenis', () => {
    const aos16 = criarEstadoTeste({
      idade: 16,
      educacao: { nivelAtual: 'fundamental_completo' as const, emCurso: false, desempenho: 70, cursosConcluidos: [] }
    });
    const vagas = listarVagasCompativeis(aos16);
    expect(vagas.length).toBeGreaterThan(0);
    expect(vagas.every(v => v.id === 'jovem_aprendiz')).toBe(true);
  });

  it('abas evoluem com a idade: estudos aos 6, finanças aos 18', () => {
    expect(getAbasDisponiveis(criarEstadoTeste({ idade: 5 }))).not.toContain('carreira');
    expect(getAbasDisponiveis(criarEstadoTeste({ idade: 6 }))).toContain('carreira');
    expect(getAbasDisponiveis(criarEstadoTeste({ idade: 17 }))).not.toContain('financas');
    expect(getAbasDisponiveis(criarEstadoTeste({ idade: 18 }))).toContain('financas');
  });

  it('menor com patrimônio legítito vê Finanças (leitura), mas não negocia bens', () => {
    const menorComBem = criarEstadoTeste({
      idade: 10,
      economia: {
        dinheiro: 100,
        propriedades: [
          {
            id: 'prop_heranca',
            tipo: 'imovel',
            nome: 'Casa herdada',
            valorCompra: 200000,
            valorAtual: 210000,
            custoAnualManutencao: 2000,
            anoCompra: 2030,
            quitado: true
          }
        ]
      }
    });
    expect(getAbasDisponiveis(menorComBem)).toContain('financas');
    const vender = getActionAvailability(menorComBem, 'vender_bem', { propId: 'prop_heranca' });
    expect(vender.kind).toBe('bloqueado');
  });

  it('atividade na fronteira: prévia bloqueada quando falta pouco, oculta quando falta muito', () => {
    const aos14 = criarEstadoTeste({ idade: 14 });
    // balada abre aos 16: a 2 anos, prévia com motivo
    const balada = getActionAvailability(aos14, 'executar_atividade', { atividadeId: 'act_balada_barzinho' });
    expect(balada.kind).toBe('bloqueado');
    // viagem ao exterior abre aos 18: a 4 anos, oculta
    const viagem = getActionAvailability(aos14, 'executar_atividade', { atividadeId: 'act_viagem_exterior' });
    expect(viagem.kind).toBe('oculto');
  });
});

// ---------------------------------------------------------------------------
// Política central: ter filhos exige parceiro romântico ativo (M9)
// ---------------------------------------------------------------------------
describe('Política central: ter filhos exige parceiro romântico', () => {
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
  const ctxComParceira = { ...adulto, familia: [...adulto.familia, parceira] };

  it('adulto com parceiro romântico vivo: disponível', () => {
    const disp = getActionAvailability(ctxComParceira, 'ter_filho', { membroId: 'fam_parceira_1' });
    expect(disp.kind).toBe('disponivel');
  });

  it('adulto apontando familiar sem vínculo romântico (pai): oculto', () => {
    const disp = getActionAvailability(ctxComParceira, 'ter_filho', { membroId: 'fam_pai_1' });
    expect(disp.kind).toBe('oculto');
  });

  it('adulto sem informar parceiro: oculto', () => {
    const disp = getActionAvailability(adulto, 'ter_filho');
    expect(disp.kind).toBe('oculto');
  });

  it('adulto com parceiro falecido: oculto', () => {
    const ctxViuvo = { ...adulto, familia: [...adulto.familia, { ...parceira, vivo: false }] };
    const disp = getActionAvailability(ctxViuvo, 'ter_filho', { membroId: 'fam_parceira_1' });
    expect(disp.kind).toBe('oculto');
  });
});
