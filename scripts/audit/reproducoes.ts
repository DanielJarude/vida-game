/**
 * AUDITORIA — reproduções mínimas e determinísticas dos casos suspeitos.
 * DIAGNÓSTICO TEMPORÁRIO, fora da suíte do jogo.
 */
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../src/utils/random';
import { criarEducacaoInicial, ingressarCurso, processarAnoEducacao } from '../../src/systems/educationSystem';
import { instanteDe } from '../../src/systems/tempo/instante';
import { candidatarEmprego, criarCarreiraInicial } from '../../src/systems/careerSystem';
import { criarEconomiaInicial, processarAnoEconomia } from '../../src/systems/economySystem';
import { listarVagasCompativeis } from '../../src/systems/availabilitySystem';
import { criarPersonagemTeste, criarFamiliaTeste } from '../../src/systems/__tests__/fixtures';
import { CURSOS_DISPONIVEIS } from '../../src/data/coursesData';
import { TODAS_PROFISSOES } from '../../src/data/careersData';
import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
import { naturezaDoEvento } from '../../src/systems/events/nature';
import { processarEnvelhecimentoFamilia } from '../../src/systems/familySystem';
import type { EducationState, EducationLevel } from '../../src/types';

const L = (s: string) => console.log(s);
const H = (s: string) => console.log(`\n${'='.repeat(70)}\n${s}\n${'='.repeat(70)}`);

definirFonteAleatoria(() => 0.5);

// ════════════════════════════════════════════════════ R1 — DURAÇÃO DE CURSOS
H('R1 — duração real de cada curso do catálogo (anos de jogo até a formatura)');
L('| curso | tipo | semestres declarados | anos esperados | ANOS MEDIDOS |');
L('| --- | --- | --- | --- | --- |');
for (const curso of CURSOS_DISPONIVEIS) {
  // Fase 2 — a matrícula é um FATO TEMPORAL: precisa de `matriculaInicio`.
  // Antes esta reprodução montava o estado à mão sem esse campo, o que fazia o
  // motor tratá-la como save legado e retroagir o início de forma
  // conservadora, custando um ano extra em TODOS os cursos. Medir o motor real
  // exige matricular como o jogo matricula.
  let char = criarPersonagemTeste({ idade: 18 });
  let edu: EducationState = {
    ...criarEducacaoInicial(),
    nivelAtual: curso.tipo === 'pos' ? 'superior_completo' : 'medio_completo',
    emCurso: true, tipoCurso: curso.tipo, nomeCurso: curso.nome,
    instituicao: 'X', isPublica: true, semestreAtual: 1,
    matriculaInicio: instanteDe(char.idade),
    totalSemestres: curso.duracaoSemestres, desempenho: 80, anoIngresso: 2044
  };
  let anosDecorridos = 0;
  for (let i = 0; i < 20; i++) {
    anosDecorridos++;
    char = { ...char, idade: char.idade + 1 };
    const r = processarAnoEducacao(edu, char, 2044 + anosDecorridos);
    edu = r.educacaoAtualizada; char = r.personagemAtualizado;
    if (!edu.emCurso) break;
  }
  const esperado = (curso.duracaoSemestres / 2).toFixed(1);
  const marca = anosDecorridos < Number(esperado) ? ' ⚠️' : '';
  L(`| ${curso.nome} | ${curso.tipo} | ${curso.duracaoSemestres} | ${esperado} | **${anosDecorridos}**${marca} |`);
}

// ══════════════════════════════════════ R2 — CURSO NÃO CONVERSA COM PROFISSÃO
H('R2 — o emprego ignora QUAL curso a pessoa fez (só o nível)');
{
  const edu: EducationState = {
    ...criarEducacaoInicial(),
    nivelAtual: 'superior_completo',
    cursosConcluidos: [
      { nome: 'Ensino Fundamental', tipo: 'Educação Básica', anoConclusao: 2040 },
      { nome: 'Ensino Médio', tipo: 'Educação Básica', anoConclusao: 2043 },
      { nome: 'Pedagogia / Licenciatura', tipo: 'superior', anoConclusao: 2047 }
    ]
  };
  const char = criarPersonagemTeste({ idade: 22, stats: { felicidade: 80, saude: 90, inteligencia: 95, aparencia: 70 } });
  const vagas = listarVagasCompativeis({ personagem: char, educacao: edu, carreira: criarCarreiraInicial(), economia: criarEconomiaInicial('classe_media'), familia: [] });
  L(`Formada SÓ em Pedagogia, 22 anos, 0 anos de experiência. Vagas que o jogo oferece (${vagas.length}):`);
  for (const v of vagas.sort((a, b) => b.salarioMensal - a.salarioMensal)) {
    L(`  · ${v.titulo} — R$ ${v.salarioMensal}/mês (exige ${v.experienciaNecessaria} anos de experiência)`);
  }
  const medico = TODAS_PROFISSOES.find(j => j.id === 'medico_geral')!;
  definirFonteAleatoria(() => 0.0); // garante sucesso na rolagem
  const r = candidatarEmprego(medico, char, edu, 2048, criarCarreiraInicial());
  L(`\nCandidatura a "${medico.titulo}" (R$ ${medico.salarioMensal}/mês) com diploma de Pedagogia: ${r.sucesso ? 'APROVADA ⚠️' : 'recusada'}`);
  L(`  → ${r.mensagem}`);
  definirFonteAleatoria(() => 0.5);
}

// ══════════════════════════════════════════ R3 — MESTRE DE OBRAS AOS 18 ANOS
H('R3 — o caso relatado no playtest humano: "Mestre de Obras e Empreiteiro" aos 18');
{
  const edu: EducationState = {
    ...criarEducacaoInicial(), nivelAtual: 'tecnico',
    cursosConcluidos: [{ nome: 'Técnico em Desenvolvimento de Sistemas', tipo: 'tecnico', anoConclusao: 2044 }]
  };
  const char = criarPersonagemTeste({ idade: 18, stats: { felicidade: 80, saude: 90, inteligencia: 60, aparencia: 70 } });
  const mestre = TODAS_PROFISSOES.find(j => j.id === 'mestre_obras')!;
  definirFonteAleatoria(() => 0.0);
  const r = candidatarEmprego(mestre, char, edu, 2044, criarCarreiraInicial());
  L(`18 anos · técnico em TI · 0 anos de experiência`);
  L(`Vaga exige: escolaridade "${mestre.escolaridadeMinima}", ${mestre.experienciaNecessaria} anos de experiência`);
  L(`Resultado: ${r.sucesso ? 'CONTRATADO ⚠️' : 'recusado'} — R$ ${mestre.salarioMensal}/mês`);
  definirFonteAleatoria(() => 0.5);
}

// ═══════════════════════════════ R4 — EXPERIÊNCIA NUNCA É VERIFICADA (TODAS)
H('R4 — quantas profissões exigem experiência que o jogo nunca confere');
{
  const comExp = TODAS_PROFISSOES.filter(j => j.experienciaNecessaria > 0);
  L(`${comExp.length} de ${TODAS_PROFISSOES.length} profissões declaram \`experienciaNecessaria > 0\`.`);
  L(`Nenhuma checagem de \`experienciaNecessaria\` existe fora de \`careersData.ts\` e dos testes.`);
  L(`Salário máximo alcançável sem 1 dia de experiência, apenas com o diploma certo:`);
  const semChecagem = [...comExp].sort((a, b) => b.salarioMensal - a.salarioMensal).slice(0, 6);
  for (const j of semChecagem) L(`  · ${j.titulo} — R$ ${j.salarioMensal}/mês (exigiria ${j.experienciaNecessaria} anos)`);
}

// ═══════════════════════════════════ R5 — ECONOMIA DO MENOR DE IDADE
H('R5 — "de onde veio o dinheiro?" — o menor de idade não tem despesa alguma');
{
  let eco = criarEconomiaInicial('classe_media');
  const linhas: string[] = [];
  for (let idade = 16; idade <= 21; idade++) {
    const char = criarPersonagemTeste({ idade });
    // 16-17: jovem aprendiz; 18+: técnico judiciário concursado (exige só médio)
    const salarioMensal = idade < 18 ? 950 : 7500;
    const r = processarAnoEconomia(eco, char, criarFamiliaTeste(), salarioMensal * 13, 0, 2040 + idade);
    eco = r.economiaAtualizada;
    linhas.push(`  ${idade} anos · salário R$ ${salarioMensal}/mês (R$ ${salarioMensal * 13}/ano) · despesas aplicadas: ${idade < 18 ? 'NENHUMA ⚠️' : 'R$ 14.000 (padrão confortável)'} · saldo: R$ ${Math.round(eco.dinheiro).toLocaleString('pt-BR')}`);
  }
  linhas.forEach(L);
  L(`\n  A pessoa MORA COM OS PAIS o tempo todo, mas:`);
  L(`   · antes dos 18 o jogo não cobra nada e credita 100% do salário;`);
  L(`   · aos 18 em ponto passa a cobrar R$ 14.000/ano de "custo de vida" como se morasse sozinha.`);
  L(`   · nenhuma renda dos pais, nenhuma mesada, nenhuma contribuição para a casa é modelada.`);
}

// ═══════════════════════════ R6 — IRMÃOS EM SÉRIE (gestação inexistente)
H('R6 — a mãe pode parir todo ano, sem gestação nem intervalo');
{
  definirFonteAleatoria(() => 0.01); // força o rollChance(18)
  let familia = criarFamiliaTeste().map(f => f.tipo === 'mae' ? { ...f, idade: 28 } : f);
  const nascimentos: number[] = [];
  for (let idade = 1; idade <= 7; idade++) {
    const char = criarPersonagemTeste({ idade });
    const r = processarEnvelhecimentoFamilia(familia, char, 2026 + idade);
    familia = r.familiaAtualizada;
    for (const log of r.logsFamilia) if (/Nasceu/.test(log.texto)) nascimentos.push(idade);
  }
  L(`Nascimentos de irmãos nos anos em que o personagem tinha: ${nascimentos.join(', ')}`);
  L(`Total de irmãos ao fim: ${familia.filter(f => f.tipo === 'irmao' || f.tipo === 'irma').length}`);
  L(`Nenhuma checagem de gestação, intervalo entre partos, existência de pai, ou limite de filhos.`);
  definirFonteAleatoria(() => 0.5);
}

// ═════════════════════════════════════ R7 — CATÁLOGO: natureza × conteúdo
H('R7 — auditoria semântica do catálogo de eventos');
{
  const total = MASTER_EVENTS_LIST.length;
  const acont = MASTER_EVENTS_LIST.filter(e => naturezaDoEvento(e) === 'acontecimento');
  const dec = MASTER_EVENTS_LIST.filter(e => naturezaDoEvento(e) === 'decisao');
  L(`Total de eventos: ${total} · acontecimentos: ${acont.length} · decisões: ${dec.length}`);

  // Acontecimentos cujas "opções" ainda estão escritas como VERBOS DE ESCOLHA
  const verbos = /^(Aceitar|Recusar|Tentar|Decidir|Escolher|Ir |Não |Ficar|Pedir|Contar|Guardar|Falar|Convidar|Estudar|Fingir|Ignorar|Entrar|Chamar|Comprar|Assumir|Insistir|Devolver|Mentir|Esconder|Procurar|Juntar|Manter|Continuar|Sair|Voltar|Participar|Investir|Ajudar|Levar|Bater|Correr|Brincar|Enfrentar|Encarar|Arriscar|Apostar|Deixar|Evitar|Contar|Cobrar|Aproveitar|Preferir|Optar|Responder|Perguntar|Se )/i;
  const suspeitos = acont.filter(e => e.opcoes.some(o => verbos.test(o.texto.trim())));
  L(`\nAcontecimentos cujas OPÇÕES ainda são escritas como escolhas do jogador: ${suspeitos.length}/${acont.length}`);
  for (const e of suspeitos.slice(0, 12)) {
    L(`  · [${e.id}] "${e.titulo}" (${e.idadeMinima}-${e.idadeMaxima})`);
    for (const o of e.opcoes) L(`      opção-desfecho: "${o.texto}"`);
  }

  // Acontecimentos que ainda declaram impacto de personalidade (dado morto + armadilha)
  const comImpacto = acont.filter(e => e.opcoes.some(o => o.consequencias.impactosComportamentais));
  L(`\nAcontecimentos que ainda declaram \`impactosComportamentais\` (removido em runtime — dado morto): ${comImpacto.length}`);
  for (const e of comImpacto.slice(0, 10)) L(`  · ${e.id} — ${e.titulo}`);

  // Acontecimentos SEM peso declarado em nenhuma opção (desfecho uniforme)
  const semPeso = acont.filter(e => e.opcoes.length > 1 && e.opcoes.every(o => o.peso === undefined));
  L(`\nAcontecimentos com 2+ desfechos e NENHUM peso declarado (todos equiprováveis): ${semPeso.length}/${acont.length}`);

  // Decisões com opções que levam ao mesmo lugar (escolha falsa)
  const escolhaFalsa = dec.filter(e => {
    if (e.opcoes.length < 2) return true;
    const assinaturas = e.opcoes.map(o => JSON.stringify({ ...o.consequencias, adicionarLog: undefined }));
    return new Set(assinaturas).size < assinaturas.length;
  });
  L(`\nDecisões com opção única ou com duas opções de consequência idêntica: ${escolhaFalsa.length}`);
  for (const e of escolhaFalsa.slice(0, 10)) L(`  · ${e.id} — "${e.titulo}" (${e.opcoes.length} opções)`);

  // Cobertura por idade
  L(`\nCobertura do catálogo por idade (eventos elegíveis por janela etária):`);
  const linhas: string[] = [];
  for (let i = 0; i <= 95; i += 5) {
    const naFaixa = MASTER_EVENTS_LIST.filter(e => e.idadeMinima <= i && e.idadeMaxima >= i);
    const d = naFaixa.filter(e => naturezaDoEvento(e) === 'decisao').length;
    const a = naFaixa.length - d;
    linhas.push(`  ${String(i).padStart(2)} anos: ${String(naFaixa.length).padStart(3)} eventos (${d} decisão / ${a} acontecimento)`);
  }
  linhas.forEach(L);
}

// ═══════════════════════════════════ R8 — PRÉ-REQUISITO DE PÓS-GRADUAÇÃO
H('R8 — pós-graduação sem relação com a graduação feita');
{
  const edu: EducationState = {
    ...criarEducacaoInicial(), nivelAtual: 'superior_completo',
    cursosConcluidos: [{ nome: 'Pedagogia / Licenciatura', tipo: 'superior', anoConclusao: 2047 }]
  };
  const char = criarPersonagemTeste({ idade: 23, stats: { felicidade: 80, saude: 90, inteligencia: 95, aparencia: 70 } });
  const residencia = CURSOS_DISPONIVEIS.find(c => c.id === 'pos_especializacao_medica')!;
  definirFonteAleatoria(() => 0.99);
  const r = ingressarCurso(residencia, 'privada', char, edu, 2048);
  L(`Formada em Pedagogia tenta "${residencia.nome}": ${r.sucesso ? 'ACEITA ⚠️' : 'recusada'}`);
  L(`  → ${r.mensagem}`);
  definirFonteAleatoria(() => 0.5);
}

// ═══════════════════════════════════ R9 — VESTIBULAR ILIMITADO NO MESMO ANO
H('R9 — vestibular/ENEM pode ser prestado quantas vezes quiser no mesmo ano');
{
  const edu: EducationState = { ...criarEducacaoInicial(), nivelAtual: 'medio_completo' };
  const char = criarPersonagemTeste({ idade: 18, stats: { felicidade: 80, saude: 90, inteligencia: 72, aparencia: 70 } });
  const medicina = CURSOS_DISPONIVEIS.find(c => c.id === 'sup_medicina')!;
  let tentativas = 0; let aprovado = false;
  const notas: number[] = [];
  const rngSeq = (() => { let i = 0; return () => { i++; return (Math.sin(i * 12.9898) * 43758.5453) % 1 < 0 ? -((Math.sin(i * 12.9898) * 43758.5453) % 1) : (Math.sin(i * 12.9898) * 43758.5453) % 1; }; })();
  definirFonteAleatoria(rngSeq);
  while (tentativas < 200 && !aprovado) {
    tentativas++;
    const r = ingressarCurso(medicina, 'publica', char, edu, 2044);
    const nota = Number(/ENEM \((\d+)\)/.exec(r.mensagem)?.[1] ?? /foi (\d+)/.exec(r.mensagem)?.[1] ?? 0);
    if (nota) notas.push(nota);
    if (r.sucesso) aprovado = true;
  }
  L(`Inteligência 72 (abaixo do mínimo 75 de Medicina), nota de corte ${medicina.notaCorteEnem}.`);
  L(`Tentativas necessárias, TODAS no mesmo ano de jogo: ${tentativas} → ${aprovado ? 'APROVADO EM MEDICINA ⚠️' : 'não aprovado'}`);
  L(`Notas sorteadas (amostra): ${notas.slice(0, 12).join(', ')}`);
  L(`Nenhum estado persistente de "já prestei o ENEM este ano". Nenhum custo, nenhum limite, nenhum cursinho.`);
  definirFonteAleatoria(() => 0.5);
}

// ══════════════════════════════ R10 — NÍVEIS INTERMEDIÁRIOS NUNCA EXISTEM
H('R10 — a escala de escolaridade tem níveis que o jogo nunca atribui');
{
  const niveis: EducationLevel[] = ['nenhuma', 'fundamental_incompleto', 'fundamental_completo', 'medio_incompleto', 'medio_completo', 'tecnico', 'superior_incompleto', 'superior_completo', 'pos_graduacao'];
  const atribuidos = new Set(['nenhuma', 'fundamental_completo', 'medio_completo', 'tecnico', 'superior_completo', 'pos_graduacao']);
  for (const n of niveis) {
    L(`  ${n}: ${atribuidos.has(n) ? 'atribuído pelo motor' : 'NUNCA atribuído ⚠️ — mas é requisito de vagas'}`);
  }
  const vagasOrfas = TODAS_PROFISSOES.filter(j => !atribuidos.has(j.escolaridadeMinima));
  L(`\nVagas cujo requisito de escolaridade o motor nunca produz naturalmente: ${vagasOrfas.length}`);
  for (const v of vagasOrfas) L(`  · ${v.titulo} exige "${v.escolaridadeMinima}"`);
  L(`\n(uma criança de 7 anos matriculada no Fundamental tem nivelAtual = "nenhuma", não "fundamental_incompleto";`);
  L(` um universitário no 6º semestre tem "medio_completo", não "superior_incompleto")`);
}

resetarFonteAleatoria();
