import { describe, expect, it } from 'vitest';
import { getActionAvailability } from '../availabilitySystem';
import { executarPassagemDeAno } from '../agingSystem';
import { definirPosturaEscolar, processarAnoEducacao } from '../educationSystem';
import { escolherBico, processarAnoCarreira, trabalharMais } from '../careerSystem';
import { definirFonteAleatoria } from '../../utils/random';
import { criarEstadoTeste } from './fixtures';

// ---------------------------------------------------------------------------
// Anti-exploit: sem Energia, cada ação suscetível vira decisão anual.
// Repetir no mesmo ano é recusado; a passagem do ano resolve os compromissos
// exatamente uma vez.
// ---------------------------------------------------------------------------
describe('Repetição de ações no mesmo ano (sem Energia e sem cota universal)', () => {
  it('atividade já realizada no ano é bloqueada com motivo', () => {
    const estado = criarEstadoTeste({
      idade: 20,
      economia: { dinheiro: 50000 },
      acoesRealizadasAno: ['atividade:act_academia']
    });
    const disp = getActionAvailability(estado, 'executar_atividade', { atividadeId: 'act_academia' });
    expect(disp.kind).toBe('bloqueado');
    if (disp.kind === 'bloqueado') expect(disp.motivo).toContain('neste ano');

    // outra atividade diferente continua liberada (não é cota universal)
    const outra = getActionAvailability(estado, 'executar_atividade', { atividadeId: 'act_leitura' });
    expect(outra.kind).toBe('disponivel');
  });

  it('aposta na loteria é única por ano', () => {
    const estado = criarEstadoTeste({ idade: 25, economia: { dinheiro: 500 }, acoesRealizadasAno: ['loteria_mega_sena'] });
    expect(getActionAvailability(estado, 'jogar_loteria').kind).toBe('bloqueado');
  });

  it('pedido de aumento é único por ano', () => {
    const estado = criarEstadoTeste({
      idade: 30,
      carreira: {
        empregado: true,
        anosNoCargo: 3,
        desempenhoTrabalho: 80,
        horasExtras: false,
        cargoAtual: {
          id: 'atendente', titulo: 'Atendente', setor: 'Comércio', salarioMensal: 1650,
          escolaridadeMinima: 'fundamental_completo', inteligenciaMinima: 15,
          experienciaNecessaria: 0, horasSemanais: 44, estresseNivel: 2
        }
      },
      acoesRealizadasAno: ['pedir_aumento']
    });
    expect(getActionAvailability(estado, 'pedir_aumento').kind).toBe('bloqueado');
  });

  it('interação com familiar é única por tipo/membro/ano', () => {
    const estado = criarEstadoTeste({ idade: 10, acoesRealizadasAno: ['familia:fam_mae_1:conversar'] });
    const repetida = getActionAvailability(estado, 'interagir_familia', { membroId: 'fam_mae_1', tipoInteracao: 'conversar' });
    expect(repetida.kind).toBe('bloqueado');
    // outro tipo com o mesmo membro: liberado
    const outroTipo = getActionAvailability(estado, 'interagir_familia', { membroId: 'fam_mae_1', tipoInteracao: 'passar_tempo' });
    expect(outroTipo.kind).toBe('disponivel');
  });

  it('horas extras: compromisso único; segunda tentativa no mesmo ano recusada', () => {
    const estado = criarEstadoTeste({
      idade: 30,
      carreira: {
        empregado: true,
        anosNoCargo: 1,
        desempenhoTrabalho: 60,
        horasExtras: false,
        cargoAtual: {
          id: 'atendente', titulo: 'Atendente', setor: 'Comércio', salarioMensal: 1650,
          escolaridadeMinima: 'fundamental_completo', inteligenciaMinima: 15,
          experienciaNecessaria: 0, horasSemanais: 44, estresseNivel: 2
        }
      }
    });
    const primeira = trabalharMais(estado.carreira, estado.personagem);
    expect(primeira.sucesso).toBe(true);
    expect(primeira.carreiraAtualizada!.horasExtras).toBe(true);

    const segunda = trabalharMais(primeira.carreiraAtualizada!, estado.personagem);
    expect(segunda.sucesso).toBe(false);
    // sem efeitos duplicados: desempenho ainda é 60 (efeito só na virada do ano)
    expect(primeira.carreiraAtualizada!.desempenhoTrabalho).toBe(60);
  });

  it('postura escolar: uma escolha por ano', () => {
    const estado = criarEstadoTeste({
      idade: 10,
      educacao: { nivelAtual: 'fundamental_incompleto' as const, emCurso: true, tipoCurso: 'fundamental' as const, nomeCurso: 'Ensino Fundamental', desempenho: 60 }
    });
    const primeira = definirPosturaEscolar('estudar', estado.educacao);
    expect(primeira.sucesso).toBe(true);
    expect(primeira.educacaoAtualizada!.posturaAno).toBe('estudar');

    const segunda = definirPosturaEscolar('matar_aula', primeira.educacaoAtualizada!);
    expect(segunda.sucesso).toBe(false);
    expect(segunda.educacaoAtualizada).toBeUndefined();
  });

  it('bico: apenas um por ano', () => {
    const estado = criarEstadoTeste({
      idade: 25,
      educacao: { nivelAtual: 'medio_completo' as const, emCurso: false, desempenho: 70, cursosConcluidos: [] }
    });
    const primeiro = escolherBico('bico_entregas', estado.carreira, estado.personagem, estado.educacao, estado.economia);
    expect(primeiro.sucesso).toBe(true);
    expect(primeiro.carreiraAtualizada!.bicoAtivoId).toBe('bico_entregas');

    const segundo = escolherBico('bico_aulas', primeiro.carreiraAtualizada!, estado.personagem, estado.educacao, estado.economia);
    expect(segundo.sucesso).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Passagem de ano: incremento único e resolução única dos compromissos
// ---------------------------------------------------------------------------
describe('Passagem de ano (avanço de tempo)', () => {
  it('incrementa a idade e o ano exatamente uma vez', () => {
    definirFonteAleatoria(() => 0.5); // determinístico
    const estado = criarEstadoTeste({ idade: 5 });
    const res = executarPassagemDeAno(
      estado.personagem, estado.familia, estado.educacao, estado.carreira, estado.economia, []
    );
    expect(res.personagemAtualizado.idade).toBe(6);
    expect(res.personagemAtualizado.anoAtual).toBe(2027);
    expect(res.morreu).toBe(false);
    definirFonteAleatoria(null);
  });

  it('processa o bico do ano exatamente uma vez (pagamento único) e o reseta', () => {
    definirFonteAleatoria(() => 0.5);
    const estado = criarEstadoTeste({
      idade: 25,
      educacao: { nivelAtual: 'medio_completo' as const, emCurso: false, desempenho: 70, cursosConcluidos: [] },
      carreira: { bicoAtivoId: 'bico_entregas' }
    });
    const saldoAntes = estado.economia.dinheiro;

    const res = processarAnoCarreira(estado.carreira, estado.personagem, 2027, estado.educacao, estado.economia);
    expect(res.economiaAtualizada.dinheiro).toBe(saldoAntes + 7200);
    expect(res.carreiraAtualizada.bicoAtivoId ?? null).toBeNull();
    expect(res.logsCarreira.some(l => l.texto.includes('bico'))).toBe(true);
    definirFonteAleatoria(null);
  });

  it('sem bico comprometido, a economia não muda por bicos', () => {
    definirFonteAleatoria(() => 0.5);
    const estado = criarEstadoTeste({ idade: 25 });
    const res = processarAnoCarreira(estado.carreira, estado.personagem, 2027, estado.educacao, estado.economia);
    expect(res.economiaAtualizada.dinheiro).toBe(estado.economia.dinheiro);
    definirFonteAleatoria(null);
  });

  it('horas extras comprometidas elevam o desempenho uma única vez na virada', () => {
    definirFonteAleatoria(() => 0.5);
    const estado = criarEstadoTeste({
      idade: 30,
      carreira: {
        empregado: true,
        anosNoCargo: 1,
        desempenhoTrabalho: 50,
        horasExtras: true,
        cargoAtual: {
          id: 'atendente', titulo: 'Atendente', setor: 'Comércio', salarioMensal: 1650,
          escolaridadeMinima: 'fundamental_completo', inteligenciaMinima: 15,
          experienciaNecessaria: 0, horasSemanais: 44, estresseNivel: 2
        }
      }
    });
    const res = processarAnoCarreira(estado.carreira, estado.personagem, 2027, estado.educacao, estado.economia);
    expect(res.carreiraAtualizada.desempenhoTrabalho).toBeGreaterThan(50);
    expect(res.carreiraAtualizada.horasExtras).toBe(false);
    expect(res.logsCarreira.some(l => l.texto.includes('horas extras'))).toBe(true);
    definirFonteAleatoria(null);
  });

  it('postura escolar aplicada na virada: notas sobem com "estudar" e caem com "matar aula"', () => {
    definirFonteAleatoria(() => 0.5);
    const eduBase = {
      nivelAtual: 'fundamental_incompleto' as const,
      emCurso: true,
      tipoCurso: 'fundamental' as const,
      nomeCurso: 'Ensino Fundamental',
      desempenho: 60,
      cursosConcluidos: [] as { nome: string; tipo: string; anoConclusao: number }[]
    };
    const personagem = criarEstadoTeste({ idade: 10 }).personagem;

    const resEstudar = processarAnoEducacao({ ...eduBase, posturaAno: 'estudar' }, personagem, 2027);
    const resMatar = processarAnoEducacao({ ...eduBase, posturaAno: 'matar_aula' }, personagem, 2027);
    const resNeutro = processarAnoEducacao({ ...eduBase, posturaAno: null }, personagem, 2027);

    expect(resEstudar.educacaoAtualizada.desempenho).toBeGreaterThan(resNeutro.educacaoAtualizada.desempenho);
    expect(resMatar.educacaoAtualizada.desempenho).toBeLessThan(resNeutro.educacaoAtualizada.desempenho);
    // postura consumida (reset para o próximo ano)
    expect(resEstudar.educacaoAtualizada.posturaAno ?? null).toBeNull();
    // B4-FIX2 — o texto agora varia entre algumas frases (item 6: evitar
    // repetição textual idêntica em anos próximos); o teste verifica que
    // existe um log de escola positivo sobre o ano, não uma frase fixa.
    const logEscola = resEstudar.logsEducacao.find(l => l.categoria === 'escola');
    expect(logEscola).toBeTruthy();
    expect(logEscola!.tipo).toBe('positivo');
    expect(logEscola!.texto.length).toBeGreaterThan(10);
    definirFonteAleatoria(null);
  });

  it('atravessa a transição de fase: bebê → escola aos 6 com matrícula automática', () => {
    definirFonteAleatoria(() => 0.5);
    const estado = criarEstadoTeste({ idade: 5 });
    const res = executarPassagemDeAno(
      estado.personagem, estado.familia, estado.educacao, estado.carreira, estado.economia, []
    );
    expect(res.educacaoAtualizada.emCurso).toBe(true);
    expect(res.educacaoAtualizada.tipoCurso).toBe('fundamental');
    // menus acompanham a fase: aos 6 a aba de estudos aparece
    const estadoAos6 = criarEstadoTeste({ idade: 6 });
    const disp = getActionAvailability(
      { ...estadoAos6, educacao: res.educacaoAtualizada },
      'definir_postura_escolar'
    );
    expect(disp.kind).toBe('disponivel');
    definirFonteAleatoria(null);
  });
});
