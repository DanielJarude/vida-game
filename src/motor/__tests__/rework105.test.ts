/**
 * REWORK 10.5 — Coerência, interfaces, fama e consequências.
 *
 * Cada bloco reproduz um problema relatado no playtest (o ID do pedido no título) e prova a correção no motor — o
 * estado guardado, não só a tela.
 */

import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, pessoaNova } from './cenarios';
import { ctxPessoa, interacoesPara } from '../sistemas/interacoes';
import { brigaFisica, escalar } from '../sistemas/convivio';
import { iniciarCaso } from '../sistemas/romance';
import { firmarCompromisso } from '../sistemas/afetos';
import { parceiro } from '../nucleo';
import { vincular } from '../pessoas';
import { avancarAno } from '../ano';
import { buscasPossiveisNoAno } from '../sistemas/busca';
import { estadosContextuais, procuraComoSeNada, sincronizarMagoa } from '../sistemas/magoas';
import { nova, viver, viverAte } from './ajuda';
import { disponibilidade, executar } from '../acoes';
import { diagnosticar } from '../sistemas/saude';
import { transacao } from '../nucleo';
import { interpretar } from '../save';
import type { Vida } from '../tipos';
import { efetivarMatricula } from '../sistemas/escola';
import { criarRng } from '../rng';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { analisarEntrada, mesmaCarreiraArtistica } from '../sistemas/compromissos';
import { acoesDoTrabalho, modoDoTrabalho } from '../sistemas/profissao';
import { verbosDoOficio } from '../sistemas/noOficio';
import { candidatosDoAno } from '../sistemas/situacoes';
import { emConstrucao } from '../sistemas/caminhosDeVida';
import { conteudosPossiveis, exposicaoDoAno, leituraDoBalanco, processarRedes } from '../sistemas/redes';
import { contaAtiva } from '../sistemas/redesBase';
import { anoDe } from '../tempo';
import { modeloDaSituacao, textoDaSituacao } from '../sistemas/situacoes';
import { categoriaDoPremio, continuacaoPossivel, premioDoTrabalho, textoDoPremio, tituloNovo } from '../sistemas/producoes';
import { memoriaDasUltimasVidas } from '../save';
import { novaProposta, processarAudiovisual } from '../sistemas/audiovisual';
import { papelPelaTrajetoria, prestigioArtistico } from '../sistemas/cena';
import type { ContratoAV } from '../tipos';
import { causasDoDesgaste, desgastar, esfriarNoAno } from '../sistemas/desgastePolitico';
import { acoesPoliticas } from '../sistemas/politica';
import { marcar } from '../sistemas/marcas';
import { conquistasDoAno } from '../sistemas/fechamento';
import { trajetoriasDaVida } from '../sistemas/legado';
import { creditosDoCurso, disciplinasDoAno, gradeDoCurso, historicoDe, registrosDoCurso } from '../sistemas/historicoAcademico';

const em = (v: Vida, f: (x: Vida) => void): Vida => transacao(v, x => { f(x); }).vida;
const recarregar = (v: Vida): Vida => { const l = interpretar(JSON.stringify(v)); if (l.tipo !== 'ok') throw new Error('save não abriu'); return l.vida; };
const naFaculdade = (cursoId = 'direito', semente = 7): Vida => em(adulto(18, { semente }), x => {
  x.educacao.matricula = undefined;
  x.trabalho.atual = undefined;
  efetivarMatricula(x, { tipo: 'curso', cursoId, via: 'sisu', modalidade: 'presencial', rede: 'publica', mensalidade: 0, municipioId: x.moradia.municipioId, instituicao: 'a universidade federal' });
});

describe('EDU-05 · o boletim e o histórico na faculdade', () => {
  it('cada ano de faculdade vira registro com disciplinas da área, notas e situação — até a formatura', () => {
    let v = naFaculdade('direito');
    const m = v.educacao.matricula!;
    v = viver(v, 6);
    const anos = registrosDoCurso(v, 'direito', m.tInicio).filter(x => x.disciplinas.length);
    expect(anos.length).toBeGreaterThanOrEqual(5);
    // Disciplinas de Direito, não as matérias da escola nem a inteligência.
    const nomes = anos.flatMap(x => x.disciplinas.map(d => d.nome));
    expect(nomes).toContain('Direito Constitucional');
    expect(nomes.some(n => /exatas|linguagens/i.test(n))).toBe(false);
    for (const x of anos) for (const d of x.disciplinas) { expect(d.nota).toBeGreaterThanOrEqual(0); expect(d.nota).toBeLessThanOrEqual(10); }
    // Formou: o último registro é a conclusão, e o histórico continua lá sem a matrícula.
    expect(v.educacao.matricula).toBeUndefined();
    expect(anos[anos.length - 1].situacao).toBe('concluido');
    expect(v.educacao.concluidos.some(c => c.cursoId === 'direito')).toBe(true);
    expect(creditosDoCurso(v, 'direito', m.tInicio).aprovados).toBeGreaterThan(0);
  });

  it('a nota acompanha a reprovação: o ano que atrasa tem disciplina reprovada; o que passa, nenhuma abaixo de 5', () => {
    const v = naFaculdade('eng_civil');
    const grade = gradeDoCurso('engenharia_civil', 'superior');
    const ruim = disciplinasDoAno(v, grade, 2, 5, 30, true);
    expect(ruim.some(d => d.situacao === 'reprovada' && d.nota < 5)).toBe(true);
    const bom = disciplinasDoAno(v, grade, 2, 5, 30, false);
    expect(bom.every(d => d.nota >= 5 && d.situacao === 'aprovada')).toBe(true);
  });

  it('reprovar conta: a matrícula guarda as disciplinas reprovadas e o histórico as mostra', () => {
    let v = em(naFaculdade('direito', 11), x => { x.mente.cognicao = 10; x.educacao.postura = 'relaxada'; for (const f of Object.values(x.caminhos.frentes)) if (f) f.habilidade = 5; });
    const m = v.educacao.matricula!;
    v = viver(v, 4, x => (x.educacao.postura !== 'relaxada' ? [{ tipo: 'postura', valor: 'relaxada' }] : []));
    const regs = registrosDoCurso(v, 'direito', m.tInicio).filter(x => x.disciplinas.length);
    const reprovadas = regs.flatMap(x => x.disciplinas).filter(d => d.situacao === 'reprovada').length;
    expect(reprovadas).toBeGreaterThan(0);
    expect(v.educacao.matricula?.reprovacoes ?? 0).toBe(reprovadas);
    expect(regs.some(x => x.situacao === 'reprovado')).toBe(true);
    expect(regs.length).toBeGreaterThan(0);
  });

  it('trancar e abandonar ficam no histórico; o save devolve tudo igual', () => {
    let v = naFaculdade('administracao');
    v = viver(v, 2);
    v = executar(v, { tipo: 'trancar' } as never).vida;
    v = executar(v, { tipo: 'destrancar' } as never).vida;
    v = executar(v, { tipo: 'abandonar_curso' } as never).vida;
    const cursos = historicoDe(v, 'cursos');
    expect(cursos.map(x => x.situacao)).toEqual(expect.arrayContaining(['trancado', 'abandonado']));
    expect(cursos.filter(x => x.disciplinas.length).length).toBeGreaterThanOrEqual(2);
    const w = recarregar(v);
    expect(w.educacao.historicoAcademico).toEqual(v.educacao.historicoAcademico);
  });

  it('os boletins da escola continuam depois do médio — inclusive o último ano, que antes nem era fotografado', () => {
    let v = nova({ semente: 5 });
    v = viverAte(v, 19);
    const escola = historicoDe(v, 'escola');
    expect(v.educacao.basica).toBeUndefined();
    expect(escola.length).toBeGreaterThanOrEqual(9);
    expect(escola.filter(x => x.disciplinas.length).length).toBeGreaterThanOrEqual(8);
    // O médio concluído é o último registro da escola, com notas.
    const ultimo = escola[escola.length - 1];
    if (v.educacao.escolaridade !== 'fundamental_incompleto' && !v.educacao.evadiu) {
      expect(ultimo.situacao).toBe('concluido');
      expect(ultimo.disciplinas.length).toBeGreaterThan(0);
    }
    expect(recarregar(v).educacao.historicoAcademico?.length).toBe(v.educacao.historicoAcademico?.length);
  });

  it('save antigo (sem histórico) abre e continua: o histórico começa no próximo ano letivo', () => {
    let v = em(naFaculdade('computacao'), x => { delete x.educacao.historicoAcademico; });
    v = recarregar(v);
    expect(v.educacao.historicoAcademico).toBeUndefined();
    v = viver(v, 1);
    expect(historicoDe(v, 'cursos').length).toBe(1);
  });
});

describe('SAU-02 · o caminho até o atendimento médico', () => {
  const comSinal = (i: number, semente: number, id = 'cancer'): Vida => em(viverAte(nova({ semente }), i), x => {
    x.corpo.condicoes = x.corpo.condicoes.filter(c => c.id !== id);
    x.corpo.condicoes.push({ id, nome: id === 'cancer' ? 'câncer' : id, tInicio: x.t - 6, cronica: true, gravidade: 3, tratando: false, diagnosticada: false });
  });

  it('uma criança de 8 anos com sintomas persistentes pode pedir aos responsáveis — e o atendimento acontece', () => {
    for (const semente of [3, 4, 5, 6]) {
      const v = comSinal(8, semente);
      expect(disponibilidade(v, { tipo: 'cuidar', cuidado: 'consulta' }).grau).toBe('permitido');
      const w = executar(v, { tipo: 'cuidar', cuidado: 'consulta' }).vida;
      const c = w.corpo.condicoes.find(x => x.id === 'cancer')!;
      // Ou fechou o diagnóstico e o tratamento começou com a família, ou os exames ficaram para o ano que vem (a procura fica registrada).
      if (c.diagnosticada === false) expect(c.procurou).toBe(v.t);
      else { expect(c.tratando).toBe(true); expect(c.tarde).toBe(false); }
    }
  });

  it('o adolescente diagnosticado é tratado (antes, recebia o nome da doença e ficava sem tratamento até os 18)', () => {
    let tratados = 0;
    for (const semente of [11, 12, 13, 14, 15]) {
      const w = executar(comSinal(15, semente, 'diabetes'), { tipo: 'cuidar', cuidado: 'consulta' }).vida;
      const c = w.corpo.condicoes.find(x => x.id === 'diabetes')!;
      if (c.diagnosticada !== false) { expect(c.tratando).toBe(true); tratados++; }
    }
    expect(tratados).toBeGreaterThan(0);
  });

  it('procurar cedo conta: a demora dos exames não vira "descoberto tarde"', () => {
    const v = em(comSinal(30, 21), x => { const c = x.corpo.condicoes.find(y => y.id === 'cancer')!; c.procurou = c.tInicio + 3; });
    const c = v.corpo.condicoes.find(y => y.id === 'cancer')!;
    const w = em(v, x => { x.t += 24; diagnosticar(x, x.corpo.condicoes.find(y => y.id === 'cancer')!, 'consulta'); });
    expect(w.corpo.condicoes.find(y => y.id === 'cancer')!.tarde).toBe(false);
    expect(c.diagnosticada).toBe(false);
  });

  it('o bebê não "pede" médico — a mensagem diz quem leva', () => {
    const v = viverAte(nova({ semente: 2 }), 2);
    const d = disponibilidade(v, { tipo: 'cuidar', cuidado: 'consulta' });
    expect(d.grau).toBe('impossivel');
    expect(d.motivo).toMatch(/adultos da casa/);
  });
});

describe('CAR-12 · a carreira de ator não é um emprego concorrente', () => {
  const ator = (ocupacaoId: 'ator' | 'ator_reconhecido', semente = 51): Vida => em(adulto(38, { semente }), x => {
    x.educacao.matricula = undefined;
    x.trabalho.atual = undefined;
    contratar(x, criarRng(5), ocupacao(ocupacaoId), 'convite');
    x.caminhos.frentes.teatro = { interesse: 90, meses: 240, habilidade: 82, tInicio: x.t - 240, tUltimo: x.t, retomadas: 0, auge: 82 };
  });
  it('o ator conhecido diante de um papel de ator: nenhum "deixar o trabalho de ator conhecido"', () => {
    const v = ator('ator_reconhecido');
    const conflitos = analisarEntrada(v, { tipo: 'emprego', ocupacaoId: 'ator', via: 'convite' });
    expect(conflitos.find(c => c.com === 'emprego')).toBeUndefined();
  });
  it('o ator chamado para a TV (ator conhecido): é o degrau seguinte, não um conflito', () => {
    const v = ator('ator');
    expect(analisarEntrada(v, { tipo: 'emprego', ocupacaoId: 'ator_reconhecido', via: 'convite' }).find(c => c.com === 'emprego')).toBeUndefined();
    expect(mesmaCarreiraArtistica('ator', 'ator_reconhecido')).toBe(true);
  });
  it('o conflito de verdade continua: um emprego integral de outra área ainda pergunta', () => {
    const v = ator('ator_reconhecido');
    expect(analisarEntrada(v, { tipo: 'emprego', ocupacaoId: 'professor_fund', via: 'convite' }).find(c => c.com === 'emprego')).toBeTruthy();
  });
});

describe('CAR-13 / UX-19 · o vocabulário de cada profissão (e o mesmo painel em toda a carreira de atuação)', () => {
  const comOcupacao = (ocupacaoId: string, dominio: 'teatro' | 'musica' | 'danca', semente = 61): Vida => em(adulto(32, { semente }), x => {
    x.educacao.matricula = undefined;
    x.trabalho.atual = undefined;
    contratar(x, criarRng(7), ocupacao(ocupacaoId), 'convite');
    x.caminhos.frentes[dominio] = { interesse: 90, meses: 200, habilidade: 74, tInicio: x.t - 200, tUltimo: x.t, retomadas: 0, auge: 74 };
  });
  const textosDe = (v: Vida) => {
    const a = acoesDoTrabalho(v, disponibilidade);
    return [...a.agora, ...a.mais, ...a.saidas].map(x => `${x.rotulo} ${x.porque ?? ''}`).concat(verbosDoOficio(v).map(x => `${x.rotulo} ${x.porque}`)).join(' | ');
  };
  it('o ator conhecido continua artista (testes, propostas, agente) — não vira "empregado" com chefia e curso da empresa', () => {
    for (const oc of ['ator', 'ator_reconhecido']) {
      const v = comOcupacao(oc, 'teatro');
      expect(modoDoTrabalho(v), oc).toBe('artista');
      const t = textosDe(v);
      expect(t, oc).toMatch(/teste de elenco/);
      expect(t, oc).not.toMatch(/chefia|curso da empresa|freguesia|no bairro|cliente exigente|Formalizar como MEI|Cobrar mais/);
      expect(t, oc).not.toMatch(/\btoca\b|disco|show numa casa/);
    }
  });
  it('a música não ganha o set de filmagem, e o teatro não ganha a palavra da música', () => {
    const musico = comOcupacao('musico_profissional', 'musica');
    const cenasDoMusico = candidatosDoAno(musico, 'cena').map(x => x.m.id);
    // As cenas da música (a casa vazia, a parceria) — nenhuma do set de filmagem ou do teste de elenco.
    expect(cenasDoMusico.some(id => id.startsWith('cena_'))).toBe(false);
    expect(cenasDoMusico.some(id => id.startsWith('mus_'))).toBe(true);
    const ator = em(comOcupacao('ator', 'teatro'), x => { x.trabalho.atual = undefined; x.rotinas.push({ id: 'teatro', nivel: 3, tInicio: x.t - 60 }); });
    const textos = emConstrucao(ator, disponibilidade).map(c => c.onde).join(' ');
    expect(textos).not.toMatch(/toca com outras pessoas|Na teatro/);
  });
});

describe('REL-07 · a briga fica na memória da relação', () => {
  /** Um amigo próximo, de outra cidade, com quem houve uma briga séria há `meses`. */
  const brigados = (semente: number, quem: 'eu' | 'outro' = 'eu', meses = 30): { v: Vida; id: string } => {
    let id = '';
    const v = em(adulto(35, { semente }), x => {
      const p = pessoaNova(x, 34, 'feminino', { temperamento: { extroversao: 0.6, afabilidade: 0.5, responsabilidade: 0.2, abertura: 0.2, estabilidade: 0.3 } });
      const vin = vincular(x, p, { origem: 'escola', proximidade: 62, estagio: 'amigo_proximo' });
      vin.conflito = { t: x.t - meses, assunto: 'o dinheiro emprestado', gravidade: 3, quem };
      vin.tensao = 20; vin.tUltimoContato = x.t - meses;
      sincronizarMagoa(vin);
      id = p.id;
    });
    return { v, id };
  };

  it('a tensão esfria em um ano; a mágoa da briga grave, não', () => {
    let { v, id } = brigados(71);
    v = viver(v, 3);
    const vin = v.vinculos[id];
    expect(vin.magoa).toBeTruthy();
    expect(vin.magoa!.motivo).toBe('o dinheiro emprestado');
    expect(vin.magoa!.ressentimento).toBeGreaterThanOrEqual(25);
    expect(recarregar(v).vinculos[id].magoa).toEqual(vin.magoa);
  });

  it('quem está magoado não manda "sumiu, hein?" nem convite: cobra, pede desculpas — ou fica em silêncio', () => {
    const genericos = new Set(['reclamacao', 'convite', 'pedido_ajuda', 'apoio', 'interesse', 'aproximacao', 'reaparecer']);
    let chamados = 0;
    for (const semente of [81, 82, 83, 84, 85, 86, 87, 88]) {
      for (const quem of ['eu', 'outro'] as const) {
        let { v, id } = brigados(semente, quem);
        for (let ano = 0; ano < 3; ano++) {
          v = avancarAno(v).vida;
          const ch = v.vinculos[id]?.chamado;
          if (ch && ch.t === v.t) { chamados++; expect(genericos.has(ch.tipo), `${semente}/${quem}: ${ch.tipo} — ${ch.texto}`).toBe(false); }
          v = em(v, x => { if (x.vinculos[id]) x.vinculos[id].chamado = undefined; x.momento = null; });
        }
      }
    }
    // E ela age: em algum desses anos, alguém procurou — pela briga.
    expect(chamados).toBeGreaterThan(0);
  });

  it('a pessoa reconhece a briga: pede desculpas pelo motivo certo, e a tentativa fica registrada', () => {
    const { v, id } = brigados(91, 'outro', 6);
    const w = em(v, x => { x.vinculos[id].chamado = { tipo: 'desculpas', t: x.t, texto: 'quer pedir desculpas' }; });
    const z = executar(w, { tipo: 'pessoa', pessoaId: id, interacao: 'chamado_sim' }).vida;
    const m = z.vinculos[id].magoa!;
    expect(m.tentativas?.[m.tentativas.length - 1]).toMatchObject({ quem: 'outro', resultado: 'aceita' });
    expect(m.ressentimento).toBeLessThan(v.vinculos[id].magoa!.ressentimento);
    expect(procuraComoSeNada(z, z.vinculos[id])).toBe(z.vinculos[id].magoa!.ressentimento < 25 && !z.vinculos[id].conflito);
  });

  it('estados contextuais: dá para estar brigados e magoados — e o afeto continua o mesmo', () => {
    const { v, id } = brigados(92);
    const vin = v.vinculos[id];
    expect(estadosContextuais(v, vin)).toEqual(expect.arrayContaining(['brigados', 'magoada']));
    expect(vin.proximidade).toBe(62);
  });
});

describe('REL-08 · conhecer gente mais de uma vez no ano', () => {
  const solteira = (semente = 101): Vida => em(adulto(26, { semente }), x => {
    for (const vin of Object.values(x.vinculos)) if (vin.romance) vin.romance = undefined;
    for (const p of Object.values(x.pessoas)) if (p.parceiroId === 'eu') p.parceiroId = undefined;
    x.eu.atracao = 'homens'; x.financas.conta = 5000; x.trabalho.atual = undefined; x.educacao.matricula = undefined;
  });
  it('dá para procurar em mais de um lugar no mesmo ano — não no mesmo lugar duas vezes, e não sem fim', () => {
    let v = solteira();
    expect(buscasPossiveisNoAno(v)).toBeGreaterThanOrEqual(2);
    v = executar(v, { tipo: 'conhecer_alguem', contexto: 'app' }).vida;
    v = em(v, x => { for (const vin of Object.values(x.vinculos)) if (vin.romance?.estagio === 'interesse') vin.romance = undefined; });
    expect(disponibilidade(v, { tipo: 'conhecer_alguem', contexto: 'app' }).grau).toBe('incompativel');
    expect(disponibilidade(v, { tipo: 'conhecer_alguem', contexto: 'noite' }).grau).not.toBe('incompativel');
    v = executar(v, { tipo: 'conhecer_alguem', contexto: 'noite' }).vida;
    expect(v.anoAtual.acoes.filter(a => a.startsWith('buscar:')).length).toBe(2);
    // O teto existe: a semana cheia (trabalho integral e faculdade) tem menos noites.
    const cheia = em(solteira(), x => { x.trabalho.atual = { ...(x.trabalho.historico[0] ?? {}), ocupacaoId: 'vendedor', carga: 'integral' } as never; x.mente.estresse = 80; });
    expect(buscasPossiveisNoAno(cheia)).toBeLessThan(buscasPossiveisNoAno(solteira()));
  });
});

describe('REL-06 · infidelidade, relações paralelas e acordos', () => {
  const casado = (semente: number, extra: (x: Vida, parId: string, outraId: string) => void = () => {}): { v: Vida; par: string; outra: string } => {
    let par = '', outra = '';
    const v = em(adulto(32, { semente, genero: 'masculino' }), x => {
      x.eu.atracao = 'mulheres';
      const c = comParceiro(x, { genero: 'feminino' });
      const o2 = pessoaNova(x, 30, 'feminino', { atracao: 'homens' });
      vincular(x, o2, { origem: 'trabalho', proximidade: 45, estagio: 'colega', convivio: ['trabalho'] });
      par = c.p.id; outra = o2.id;
      extra(x, par, outra);
    });
    return { v, par, outra };
  };
  it('flertar estando casado existe, é dito como fora do combinado — e a resposta é da outra pessoa', () => {
    const { v, outra } = casado(201);
    expect(interacoesPara(v, outra).map(x => x.id)).toContain('flertar_comprometido');
    const d = disponibilidade(v, { tipo: 'pessoa', pessoaId: outra, interacao: 'flertar_comprometido' });
    expect(d.grau).toBe('irregular');
    expect(d.motivo).toMatch(/combinado/);
  });
  it('o acordo aberto é consentido: depois dele, sair com outra pessoa não é segredo nem traição', () => {
    let aceitou: Vida | undefined;
    for (const semente of [211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222]) {
      const { v, par } = casado(semente, (x, p) => { x.pessoas[p].temperamento.abertura = 1; x.vinculos[p].romance!.envolvimento = 90; });
      const w = executar(v, { tipo: 'pessoa', pessoaId: par, interacao: 'propor_acordo_aberto' }).vida;
      if (w.vinculos[par].romance?.acordo === 'aberto') { aceitou = w; break; }
      // Recusado: fica a tensão e o assunto.
      expect(w.vinculos[par].tensao).toBeGreaterThan(v.vinculos[par].tensao);
    }
    expect(aceitou).toBeTruthy();
    const v = aceitou!;
    const outra = Object.values(v.pessoas).find(p => v.vinculos[p.id]?.convivio.includes('trabalho') && p.atracao === 'homens')!.id;
    const conv = disponibilidade(v, { tipo: 'pessoa', pessoaId: outra, interacao: 'convidar' });
    expect(conv.grau).toBe('permitido');
    const par = parceiro(v)!;
    const w = em(v, x => iniciarCaso(x, x.pessoas[outra], x.vinculos[outra]));
    expect(parceiro(w)!.vin.romance!.segredo).toBeUndefined();
    expect(w.biografia[w.biografia.length - 1].texto).toMatch(/dentro do combinado/);
    void par;
  });
  it('a parceria também pode trair — e, descoberta, a relação sente (sem acordo aberto)', () => {
    let { v, par } = casado(231, (x, p) => { x.vinculos[p].romance!.infiel = { t: x.t - 12 }; x.vinculos[p].convivio = ['casa']; x.vinculos[p].confianca = 70; });
    let abriu = false;
    for (let k = 0; k < 8 && !abriu; k++) {
      v = avancarAno(v).vida;
      if (v.momento?.situacaoId === 'rom105_infiel') abriu = true;
      else v = em(v, x => { x.momento = null; });
    }
    expect(abriu).toBe(true);
    const vin = v.vinculos[par];
    expect(vin.confianca).toBeLessThan(50);
    expect(vin.conflito?.assunto).toBe('a traição');
    expect(vin.conflito?.quem).toBe('outro');
  });
});

describe('REL-09 · intimidade, compromisso — e o casamento não dá confiança máxima', () => {
  it('desabafar aproxima por dentro muito mais que um cinema', () => {
    let id = '';
    const v = em(adulto(30, { semente: 241 }), x => { const p = pessoaNova(x, 30, 'feminino'); const vin = vincular(x, p, { origem: 'escola', proximidade: 65, estagio: 'amigo_proximo' }); vin.confianca = 60; id = p.id; });
    const a = executar(v, { tipo: 'pessoa', pessoaId: id, interacao: 'desabafar' }).vida.vinculos[id];
    const b = executar(v, { tipo: 'pessoa', pessoaId: id, interacao: 'cinema' }).vida.vinculos[id];
    expect(a.intimidade ?? 0).toBeGreaterThan(b.intimidade ?? 0);
  });
  it('anos de casamento sem tensão não devolvem a confiança total depois de uma traição', () => {
    let par = '';
    let v = em(adulto(35, { semente: 251 }), x => { const c = comParceiro(x); c.vin.confianca = 30; c.vin.historia.push({ t: x.t - 12, texto: 'Descobriu a traição.', tipo: 'traicao', peso: 3 }); par = c.p.id; });
    v = viver(v, 6);
    if (v.vinculos[par]?.romance && v.vinculos[par].romance!.estagio !== 'ex') expect(v.vinculos[par].confianca).toBeLessThan(55);
  });
  it('o casamento firma o compromisso', () => {
    const v = em(adulto(30, { semente: 261 }), x => { const c = comParceiro(x, { estagio: 'namoro' }); firmarCompromisso(c.vin, 'casamento'); });
    expect(Object.values(v.vinculos).find(x => x.romance)!.compromisso).toBe(80);
  });
});

describe('REL-10 · a briga física tem consequência do tamanho dela', () => {
  const comPavioCurto = (semente: number): { v: Vida; id: string } => {
    let id = '';
    const v = em(adulto(28, { semente }), x => {
      const p = pessoaNova(x, 30, 'masculino', { temperamento: { extroversao: 0.3, afabilidade: -0.8, responsabilidade: -0.2, abertura: 0, estabilidade: -0.9 } });
      const vin = vincular(x, p, { origem: 'vizinhanca', proximidade: 30, estagio: 'conhecido' });
      vin.tensao = 80; vin.conflito = { t: x.t, assunto: 'a vaga da garagem', gravidade: 2, quem: 'eu' };
      id = p.id;
    });
    return { v, id };
  };
  it('quando a outra pessoa parte para cima, acontece de verdade: o registro, o conflito dela, o medo', () => {
    let achou = false;
    for (let s = 0; s < 400 && !achou; s++) {
      const { v, id } = comPavioCurto(300 + (s % 7));
      const w = em(v, x => { const c = ctxPessoa(x, id)!; const d = escalar(c, 3, 'a vaga da garagem', criarRng(1000 + s)); if (d === 'agressao') achou = true; });
      if (!achou) continue;
      expect(w.fatos[`agressao_dela_${id}`]).toBe(w.t);
      expect(w.vinculos[id].conflito).toMatchObject({ assunto: 'a briga física', quem: 'outro' });
      expect(estadosContextuais(w, w.vinculos[id])).toContain('medo');
    }
    expect(achou).toBe(true);
  });
  it('a gravidade muda o estrago: a briga que fratura custa mais confiança do que a que não deixa marca', () => {
    const perdas: { lesao: number; perda: number }[] = [];
    for (let s = 0; s < 40; s++) {
      const { v, id } = comPavioCurto(400);
      let lesao = 0;
      const antes = v.vinculos[id].confianca;
      const w = em(v, x => { x.vinculos[id].confianca = 80; const c = ctxPessoa(x, id)!; const d = brigaFisica(c, criarRng(2000 + s), 'eu'); lesao = Math.max(d.lesaoDela, d.lesaoSua); });
      void antes;
      perdas.push({ lesao, perda: 80 - w.vinculos[id].confianca });
    }
    const leve = perdas.filter(x => x.lesao === 0).map(x => x.perda), grave = perdas.filter(x => x.lesao >= 2).map(x => x.perda);
    if (leve.length && grave.length) expect(Math.min(...grave)).toBeGreaterThan(Math.max(...leve));
    expect(new Set(perdas.map(x => x.perda)).size).toBeGreaterThan(1);
  });
});

describe('FAM-02 · seguidores: crescimento com causa, no ano certo', () => {
  const famosa = (posts: number, semente = 501): Vida => {
    let v = em(adulto(35, { semente }), x => { x.financas.conta = 1e8; x.notoriedade = { valor: 90, pico: 90, t: x.t, fonte: 'arte' }; });
    v = executar(v, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } } as Parameters<typeof executar>[1]).vida;
    v = em(v, x => { const c = contaAtiva(x, 'instagram')!; c.seguidores = 1_400_000; c.balanco = undefined; c.anos = []; });
    for (let i = 0; i < posts; i++) {
      const tema = conteudosPossiveis(v, 'instagram')[i % 3].tema;
      v = executar(v, { tipo: 'rede', op: { oque: 'publicar', plataforma: 'instagram', tema } } as Parameters<typeof executar>[1]).vida;
    }
    // A própria notoriedade escreveu sobre si ("Ficou famosa...") — isso não é causa de salto.
    return em(v, x => { x.biografia.push({ id: 'n', t: x.t, texto: 'Ficou famosa pela obra: gente que você nunca viu sabe o seu nome.', relevancia: 'marco', tema: 'trabalho' } as never); x.t += 12; processarRedes(x); });
  };
  it('o balanço é do ano em que as publicações aconteceram (antes: "zero publicações" no ano que tinha as três)', () => {
    const v = famosa(3);
    const c = contaAtiva(v, 'instagram')!;
    const b = leituraDoBalanco(v, c)!;
    expect(b.publicacoes).toBe(3);
    expect(b.ano).toBe(anoDe(c.anos![0].desde));
    expect(b.fecha).toBe(true);
  });
  it('com o nome parado em 90, o ano não traz centenas de milhares "pela notoriedade"', () => {
    for (const posts of [0, 3]) {
      const v = famosa(posts, 510 + posts);
      const b = contaAtiva(v, 'instagram')!.anos![0];
      expect(b.exposicao, `${posts} posts`).toBeLessThanOrEqual(1_400_000 * 0.06 * 1.2 + 4000);
    }
  });
  it('um acontecimento público com o nome subindo ainda permite o salto — e ele é explicado', () => {
    const sem = exposicaoDoAno('instagram', 40000, 64, 83, 0, 0.5, false);
    const com = exposicaoDoAno('instagram', 40000, 64, 83, 0, 0.5, true);
    expect(com).toBeGreaterThan(sem * 2);
    expect(exposicaoDoAno('instagram', 1_400_000, 90, 90, 3, 0.5, true)).toBeLessThanOrEqual(1_400_000 * 0.06 * 1.2 + 4000);
  });
});

describe('EVT-05 / EVT-07 / CAR-11 · cenas de carreira, títulos e memória', () => {
  const atriz = (semente: number): Vida => em(adulto(30, { semente, genero: 'feminino' }), x => {
    x.educacao.matricula = undefined; x.trabalho.atual = undefined;
    contratar(x, criarRng(3), ocupacao('ator'), 'convite');
    x.caminhos.frentes.teatro = { interesse: 90, meses: 200, habilidade: 78, tInicio: x.t - 200, tUltimo: x.t, retomadas: 0, auge: 78 };
  });
  it('a atuação tem muitas cenas próprias — e a mesma cena quase não volta enquanto há outra possível', () => {
    let v = atriz(601);
    const nomes = candidatosDoAno(v, 'cena').map(x => x.m.id);
    expect(nomes.length).toBeGreaterThanOrEqual(6);
    v = em(v, x => { x.caminhos.situacoes = [{ id: 'cena_dificil', t: x.t - 72, trajetoria: 'cena', intencao: 'x', desfecho: 'bom', texto: 'A cena difícil.' }]; });
    const c = candidatosDoAno(v, 'cena');
    const repetida = c.find(x => x.m.id === 'cena_dificil')!;
    const nova = c.find(x => x.m.id === 'cena_estreia')!;
    expect(repetida.peso).toBeLessThan(nova.peso / 5);
  });
  it('"Conflito no set" tem colega com nome, a produção e o motivo — e o colega fica na vida', () => {
    let v = atriz(611);
    v = em(v, x => { x.caminhos.curriculo = [{ t: x.t - 12, tipo: 'serie', titulo: 'A Ponte do Sul', papel: 'coadjuvante', repercussao: 1 }]; });
    const m = modeloDaSituacao('cena_conflito')!;
    let d: Record<string, string | number> = {};
    v = em(v, x => { d = m.contexto!(x, criarRng(1)); });
    expect(String(d.titulo)).toBe('A Ponte do Sul');
    expect(v.pessoas[String(d.colega)]).toBeTruthy();
    expect(m.texto(v, d)).toContain(String(d.nome));
    expect(m.texto(v, d)).toContain('A Ponte do Sul');
  });
  it('a cena que volta diz que volta', () => {
    const v = em(atriz(621), x => { x.caminhos.situacoes = [{ id: 'cena_tipo', t: x.t - 96, trajetoria: 'cena', intencao: 'x', desfecho: 'ruim', texto: 'O rótulo ficou mais grudado.' }]; });
    const m = modeloDaSituacao('cena_tipo')!;
    expect(textoDaSituacao(v, m, { _antes: 2060, _antesDesfecho: 'ruim' })).toMatch(/^De novo, como em 2060/);
  });
  it('títulos não se repetem numa carreira (a não ser como continuação dita)', () => {
    let v = atriz(631);
    const vistos = new Set<string>();
    for (let k = 0; k < 40; k++) {
      const t = tituloNovo(v, 'serie', `t${k}`);
      expect(vistos.has(t), t).toBe(false);
      vistos.add(t);
      v = em(v, x => { x.caminhos.curriculo = [...(x.caminhos.curriculo ?? []), { t: x.t, tipo: 'serie', titulo: t, papel: 'coadjuvante', repercussao: 1 }]; });
    }
    const r = criarRng(7);
    let cont: ReturnType<typeof continuacaoPossivel>;
    v = em(v, x => { x.caminhos.curriculo = [{ t: x.t - 24, tipo: 'serie', titulo: 'Rota Norte', papel: 'protagonista', repercussao: 3, producaoId: 'av9' }]; });
    for (let k = 0; k < 20 && !cont!; k++) cont = continuacaoPossivel(v, ['serie'], r);
    expect(cont!.titulo).toBe('Rota Norte — 2ª temporada');
  });
  it('a vida nova lembra o que as duas anteriores viveram (e pesa menos)', () => {
    const v = nova({ semente: 77, memoria: ['bb_primeira_palavra', 'cena_dificil'] });
    expect(v.memoriaDeVidas).toEqual(['bb_primeira_palavra', 'cena_dificil']);
    const e = { vidasJogadas: 3, totalAnosVividos: 200, maiorIdade: 80, maiorPatrimonio: 0, historico: [{ id: 'a', nome: 'A', idadeMorte: 70, lugar: '', profissao: '', patrimonio: 0, causa: '', ano: 2000, vistos: ['x', 'y'] }, { id: 'b', nome: 'B', idadeMorte: 70, lugar: '', profissao: '', patrimonio: 0, causa: '', ano: 2000, vistos: ['y', 'z'] }, { id: 'c', nome: 'C', idadeMorte: 70, lugar: '', profissao: '', patrimonio: 0, causa: '', ano: 2000, vistos: ['w'] }] };
    expect(memoriaDasUltimasVidas(e)).toEqual(['x', 'y', 'z']);
  });
});

describe('CAR-06 / CAR-09 / CAR-14 · a proposta, o prêmio e a carreira que cresce', () => {
  const veterana = (semente: number): Vida => em(adulto(52, { semente, genero: 'feminino' }), x => {
    x.educacao.matricula = undefined; x.trabalho.atual = undefined;
    contratar(x, criarRng(3), ocupacao('ator_reconhecido'), 'convite');
    x.trabalho.atual!.tInicio = x.t - 25 * 12;
    x.caminhos.frentes.teatro = { interesse: 90, meses: 400, habilidade: 86, tInicio: x.t - 400, tUltimo: x.t, retomadas: 0, auge: 88 };
    x.notoriedade = { valor: 70, pico: 75, t: x.t, fonte: 'arte' };
    x.caminhos.curriculo = Array.from({ length: 14 }, (_, k) => ({ t: x.t - (14 - k) * 18, tipo: (['novela', 'filme', 'serie', 'teatro'] as const)[k % 4], titulo: `Obra ${k}`, papel: k % 3 ? 'coadjuvante' : 'protagonista', repercussao: (k % 4 === 0 ? 3 : 2) as 2 | 3, porte: 2 as const, ...(k % 5 === 0 ? { premio: { nome: 'o Troféu Antena', venceu: true } } : {}) }));
  });
  it('a proposta tem ficha: tipo, gênero, sinopse, personagem, canal, tempo, cachê e impacto', () => {
    let p: ContratoAV | undefined;
    const v = em(veterana(701), x => { p = novaProposta(x, { tipo: 'serie', porte: 2, papel: 'protagonista', casa: 'uma plataforma de streaming', titulo: 'Rota Norte' }); });
    expect(p!.genero).toBeTruthy(); expect(p!.sinopse).toBeTruthy(); expect(p!.personagem).toBeTruthy();
    const a = acoesDoTrabalho(v, disponibilidade).agora.concat(acoesDoTrabalho(v, disponibilidade).mais).find(x => x.id === `av_aceitar_${p!.id}`)!;
    expect(a.porque).toContain(p!.personagem!);
    expect(a.porque).toMatch(/carreira|currículo|nome/);
  });
  it('o prêmio é da obra e do papel: série ganha categoria de série, nunca prêmio de cinema; tem nome, edição e obra', () => {
    const v = veterana(711);
    let achou: ReturnType<typeof premioDoTrabalho>;
    for (let k = 0; k < 200 && !achou; k++) achou = premioDoTrabalho(v, { tipo: 'serie', papel: 'coadjuvante', porte: 2, titulo: 'Rota Norte' }, 3, 85, criarRng(k));
    expect(achou!.nome).toMatch(/Antena/);
    expect(achou!.categoria).toMatch(/coadjuvante em série/);
    expect(achou!.categoria).not.toMatch(/cinema|filme/i);
    expect(achou!.edicao).toBe(anoDe(v.t));
    expect(textoDoPremio(achou!)).toContain('Rota Norte');
    expect(categoriaDoPremio('filme', 'protagonista', 'feminino', false)).toBe('Melhor atriz');
  });
  it('a veterana premiada recebe papéis grandes e convites diretos — não só "coadjuvante" e "elenco de apoio"', () => {
    const v = veterana(721);
    const papeis = Array.from({ length: 60 }, (_, k) => papelPelaTrajetoria(v, criarRng(k), 86, 74));
    expect(papeis.filter(x => x === 'protagonista').length).toBeGreaterThan(10);
    const iniciante = em(adulto(22, { semente: 722 }), x => { x.caminhos.frentes.teatro = { interesse: 80, meses: 30, habilidade: 70, tInicio: x.t - 30, tUltimo: x.t, retomadas: 0, auge: 70 }; });
    const deIniciante = Array.from({ length: 60 }, (_, k) => papelPelaTrajetoria(iniciante, criarRng(k), 70, 74));
    expect(deIniciante.filter(x => x === 'protagonista').length).toBeLessThan(papeis.filter(x => x === 'protagonista').length);
    expect(prestigioArtistico(v)).toBeGreaterThan(prestigioArtistico(iniciante) + 0.3);
    // Convite direto (sem teste) em algum dos anos.
    let convidou = false;
    for (let k = 0; k < 8 && !convidou; k++) {
      const w = em(veterana(730 + k), x => processarAudiovisual(x, criarRng(k)));
      convidou = (w.caminhos.audiovisual?.contratos ?? []).some(c => c.convite);
    }
    expect(convidou).toBe(true);
  });
});

describe('POL-04 · o desgaste político tem causa e volta', () => {
  const militante = (semente = 801): Vida => em(adulto(40, { semente }), x => {
    x.caminhos.politica = { fase: 'filiado', tInicio: x.t - 60, origem: 'convite', reputacao: 40, apoio: 30, desgaste: 0, historico: [], partidos: [], partido: 'PX' } as never;
  });
  it('o desgaste diz de onde vem — e quem só faz base não acumula desgaste de governante', () => {
    let v = militante();
    v = em(v, x => { desgastar(x.caminhos.politica!, 20, 'exposicao'); desgastar(x.caminhos.politica!, 10, 'campanha'); });
    const p = v.caminhos.politica!;
    expect(causasDoDesgaste(p).map(x => x.causa)).toEqual(['exposicao', 'campanha']);
    expect(p.causasDesgaste?.mandato).toBeUndefined();
  });
  it('as respostas existem, custam e funcionam pela causa; o tempo também ajuda', () => {
    let v = em(militante(802), x => { desgastar(x.caminhos.politica!, 40, 'exposicao'); });
    const ids = acoesPoliticas(v, disponibilidade).map(x => x.id);
    expect(ids).toEqual(expect.arrayContaining(['pol_bases', 'pol_recolher', 'pol_propostas', 'pol_responder', 'pol_afastar']));
    const w = executar(v, { tipo: 'politica', oque: 'recolher' } as never).vida;
    expect(w.caminhos.politica!.desgaste).toBeLessThan(v.caminhos.politica!.desgaste);
    expect(w.caminhos.politica!.reputacao).toBeLessThan(v.caminhos.politica!.reputacao);
    // Uma por ano.
    expect(disponibilidade(w, { tipo: 'politica', oque: 'bases' } as never).grau).toBe('incompativel');
    // A exposição esfria rápido com o tempo; o escândalo, devagar.
    v = em(militante(803), x => { desgastar(x.caminhos.politica!, 30, 'exposicao'); desgastar(x.caminhos.politica!, 30, 'escandalo'); esfriarNoAno(x.caminhos.politica!, { emMandato: false, entregou: false, emCampanha: false, nasBases: false }); });
    const c = v.caminhos.politica!.causasDesgaste!;
    expect(c.exposicao!).toBeLessThan(c.escandalo!);
  });
});

describe('CRI-02 · o Submundo é encontrável', () => {
  it('procurar um contato abre a proposta (a mesma de quando ela vem sozinha); a criança não tem essa porta', () => {
    const v = adulto(25, { semente: 901 });
    expect(disponibilidade(v, { tipo: 'margem', oque: 'procurar_contato' }).grau).toBe('irregular');
    const w = executar(v, { tipo: 'margem', oque: 'procurar_contato' }).vida;
    expect(w.momento?.situacaoId).toBe('ilic_proposta');
    expect(disponibilidade(viverAte(nova({ semente: 902 }), 12), { tipo: 'margem', oque: 'procurar_contato' }).grau).toBe('impossivel');
  });
});

describe('EVT-06 / EVT-08 · conquistas avisadas e cronologia', () => {
  it('a conquista do ano aparece no fechamento do ano', () => {
    const v = em(adulto(30, { semente: 951 }), x => { marcar(x, 'conquista', 'Um conto seu venceu o concurso literário de Recife.', 3, { dominio: 'escrita' }); });
    expect(conquistasDoAno(v)).toContain('Um conto seu venceu o concurso literário de Recife.');
  });
  it('quem só tem o prêmio literário não tem a escrita "desde o ano atual" (o prêmio é anterior)', () => {
    const v = em(adulto(40, { semente: 952 }), x => { x.fatos['premio_literario'] = x.t - 24; x.rotinas.push({ id: 'escrever', nivel: 2, tInicio: x.t - 60 }); });
    const t = trajetoriasDaVida(v).find(x => x.id === 'arte:escrita')!;
    expect(t.de).toBeLessThanOrEqual(anoDe(v.t - 60));
  });
});
