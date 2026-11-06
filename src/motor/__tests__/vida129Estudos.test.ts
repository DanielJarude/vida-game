/**
 * VIDA 12.9 · Estudos — instituições reais, processos seletivos, semestres, recuperação, jubilamento, FIES ao sair,
 * troca de curso, técnicos novos e saves antigos.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar } from '../acoes';
import { avancarAno } from '../ano';
import { transacao } from '../nucleo';
import { interpretar } from '../save';
import type { Matricula, Vida } from '../tipos';
import { CURSOS, cursoOuNulo } from '../dados/cursos';
import { INSTITUICOES_129 } from '../dados/instituicoes129';
import { OCUPACOES } from '../dados/ocupacoes';
import { cidadesDoPais } from '../dados/lugares';
import { AREAS_ENEM, ganchos129 } from '../sistemas/escola';
import { registrarAnoLetivo } from '../sistemas/historicoAcademico';
import { instituicoesTecnicas } from '../sistemas/ensinoTecnico';
import { podeTentar } from '../plausibilidade';
import {
  depoisDoCurso129, dividaProporcional129, limiteDeReprovacoes129, opcoes129, semestres129, textoDeTrancar129, trocasInternas129, temCatalogo129
} from '../sistemas/estudos129';

const em = (v: Vida, f: (x: Vida) => void): Vida => transacao(v, x => { f(x); }).vida;
const recarregar = (v: Vida): Vida => { const l = interpretar(JSON.stringify(v)); if (l.tipo !== 'ok') throw new Error('save não abriu'); return l.vida; };

/** Uma adulta que acabou o médio, morando em `cidade`, com o preparo dado (0..100) em todas as matérias da prova. */
function candidata(cidade: string, preparo: number, extra?: (x: Vida) => void): Vida {
  return em(adulto(18, { semente: 23, municipioId: cidade }), x => {
    x.educacao.basica = undefined; x.educacao.matricula = undefined; x.educacao.aprovacao = undefined; x.educacao.escolaridade = 'medio';
    x.trabalho.atual = undefined; x.financas.conta = 200000; x.mente.cognicao = preparo;
    for (const a of AREAS_ENEM) x.caminhos.frentes[a] = { ...(x.caminhos.frentes[a] ?? {}), habilidade: preparo } as never;
    x.educacao.enem = [{ t: x.t, nota: 300 + preparo * 6, areas: Object.fromEntries(AREAS_ENEM.map(a => [a, 300 + preparo * 6])) as never, pais: 'BR' }];
    extra?.(x);
  });
}

function matricula(x: Vida, m: Partial<Matricula> & { cursoId: string }): Matricula {
  const c = cursoOuNulo(m.cursoId)!;
  x.educacao.matricula = { instituicao: 'a universidade federal em Recife', rede: 'publica', modalidade: 'presencial', tInicio: x.t - 24, mesesRestantes: c.meses - 24, mensalidade: 0, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId, ...m };
  return x.educacao.matricula;
}
function anoFechado(x: Vida, m: Matricula, k: number, notas: number[]) {
  registrarAnoLetivo(x, { nivel: 'superior', instituicao: m.instituicao, cursoId: m.cursoId, tInicioCurso: m.tInicio, rotulo: `${k}º ano`, disciplinas: notas.map((n, j) => ({ nome: `Disciplina ${k}.${j}`, nota: n, situacao: n >= 5 ? 'aprovada' : 'reprovada' })), situacao: 'aprovado', t: m.tInicio + 12 * k });
}

describe('O catálogo de instituições (só o verificado)', () => {
  it('cada curso de campus existe no jogo; mensalidade só em particular; o ENEM não verificado ficou fora', () => {
    expect(INSTITUICOES_129.length).toBeGreaterThanOrEqual(20);
    for (const i of INSTITUICOES_129) {
      for (const c of i.campi) {
        for (const id of c.cursos) expect(cursoOuNulo(id), `${i.sigla}:${id}`).toBeTruthy();
        for (const id of Object.keys(c.mensalidades ?? {})) { expect(['federal', 'estadual'].includes(i.tipo)).toBe(false); expect(c.cursos).toContain(id); }
      }
    }
    const fgv = INSTITUICOES_129.find(i => i.id === 'fgv')!;
    expect(fgv.ingresso).not.toContain('enem_privada');
    const usp = INSTITUICOES_129.find(i => i.id === 'usp')!;
    expect(usp.campi.filter(c => c.cursos.includes('medicina')).map(c => c.municipioId).sort()).toEqual(['bauru-sp', 'ribeirao-preto-sp', 'sao-paulo-sp']);
    expect(INSTITUICOES_129.find(i => i.id === 'insper')!.campi[0].mensalidades?.eng_producao?.fraca).toBe(true);
  });
});

describe('Escolher instituição, curso e campus; processos diferentes', () => {
  it('Medicina em São Paulo: Fuvest (USP), Comvest (Unicamp), SISU (federais), vestibular da PUC-SP com a mensalidade verificada', () => {
    const v = candidata('sao-paulo-sp', 80);
    expect(temCatalogo129(v)).toBe(true);
    const ops = opcoes129(v, 'medicina');
    const fuvest = ops.find(o => o.inst?.id === 'usp' && o.processo === 'fuvest' && o.campus?.id === 'sao-paulo');
    expect(fuvest).toBeTruthy();
    expect(ops.some(o => o.inst?.id === 'unicamp' && o.processo === 'comvest')).toBe(true);
    expect(ops.some(o => o.inst?.id === 'ufrj' && o.processo === 'sisu')).toBe(true);
    const puc = ops.find(o => o.inst?.id === 'pucsp' && o.processo === 'vestibular_privada')!;
    expect(puc.mensalidade).toBe(12749);
    expect(puc.mensalidadeVerificada?.ano).toBe(2026);
    // A USP é mais disputada que a federal mediana: o corte de jogo é maior.
    const ufc = ops.find(o => o.inst?.id === 'ufc' && o.processo === 'sisu')!;
    expect(fuvest!.corte!).toBeGreaterThan(ufc.corte! - 45 /* cota */ - 1);
    // Campus noutra cidade pede mudança (dito na opção).
    expect(ops.find(o => o.inst?.id === 'usp' && o.campus?.id === 'bauru')!.observacao).toMatch(/mudar de cidade/);
  });

  it('cada processo tem fases próprias: Fuvest (1ª e 2ª fase), SISU (a nota do ENEM), particular (prova e redação)', () => {
    let v = candidata('sao-paulo-sp', 95);
    v = executar(v, { tipo: 'estudos129', oque: 'candidatar', chave: 'inst:usp:sao-paulo:direito:fuvest' }).vida;
    const f = v.educacao.processos129!.at(-1)!;
    expect(f.nome).toBe('Fuvest');
    expect(f.fases[0].nome).toMatch(/1ª fase/);
    expect(f.fases[0].max).toBe(90);
    let w = em(candidata('sao-paulo-sp', 95), x => { x.educacao.aprovacao = undefined; });
    w = executar(w, { tipo: 'estudos129', oque: 'candidatar', chave: 'inst:ufrj:rio-de-janeiro:direito:sisu' }).vida;
    expect(w.educacao.processos129!.at(-1)!.fases[0].nome).toMatch(/ENEM/);
    let p = candidata('sao-paulo-sp', 70);
    p = executar(p, { tipo: 'estudos129', oque: 'candidatar', chave: 'inst:pucsp:monte-alegre:direito:vestibular_privada' }).vida;
    expect(p.educacao.processos129!.at(-1)!.fases.map(x => x.nome)).toEqual(['Prova objetiva', 'Redação']);
  });

  it('aprovação e reprovação seguem o preparo; aprovada, a vaga espera; confirmada, a matrícula leva a instituição real', () => {
    let forte = candidata('sao-paulo-sp', 95);
    forte = executar(forte, { tipo: 'estudos129', oque: 'candidatar', chave: 'inst:pucsp:monte-alegre:administracao:vestibular_privada', turno: 'noite' }).vida;
    expect(forte.educacao.processos129!.at(-1)!.aprovado).toBe(true);
    expect(forte.educacao.aprovacao?.novo.inst129?.id).toBe('pucsp');
    // Tentar de novo no mesmo ano: bloqueado (uma vez por ano por processo).
    const fraca = candidata('sao-paulo-sp', 5);
    const ops = opcoes129(fraca, 'medicina');
    const fuv = ops.find(o => o.chave === 'inst:usp:sao-paulo:medicina:fuvest')!;
    expect(fuv.veredito.chance!).toBeLessThan(0.05);
    const depois = executar(fraca, { tipo: 'estudos129', oque: 'candidatar', chave: fuv.chave }).vida;
    expect(depois.educacao.processos129!.at(-1)!.aprovado).toBe(false);
    expect(depois.educacao.aprovacao).toBeUndefined();
    expect(podeTentar(opcoes129(depois, 'medicina').find(o => o.chave === fuv.chave)!.veredito)).toBe(false);
    // Confirmar: a matrícula tem a instituição, o campus e o turno.
    const conf = executar(forte, { tipo: 'confirmar_matricula' }).vida;
    if (!conf.caminhos.pendente) {
      const m = conf.educacao.matricula!;
      expect(m.inst129).toMatchObject({ id: 'pucsp', campus: 'monte-alegre', turno: 'noite' });
      expect(m.instituicao).toMatch(/Pontifícia|PUC-SP/);
      expect(m.mensalidade).toBe(3450);
      expect(recarregar(conf).educacao.matricula?.inst129?.id).toBe('pucsp');
    }
  });

  it('a duração da instituição vale quando a fonte dá um número único (PUCPR: Direito em 5 anos)', () => {
    let v = candidata('curitiba-pr', 90);
    v = executar(v, { tipo: 'estudos129', oque: 'candidatar', chave: 'inst:pucpr:curitiba:direito:vestibular_privada' }).vida;
    if (v.educacao.aprovacao) expect(v.educacao.aprovacao.novo.inst129?.meses).toBe(60);
  });

  it('fora do Brasil, o ingresso genérico de sempre', () => {
    const v = candidata(cidadesDoPais('PT')[0].id, 70);
    expect(temCatalogo129(v)).toBe(false);
    const ops = opcoes129(v, 'direito');
    expect(ops.length).toBeGreaterThan(0);
    expect(ops.every(o => o.generica && !o.inst)).toBe(true);
  });
});

describe('Semestres, recuperação e jubilamento', () => {
  it('dois anos fechados = quatro semestres; o atraso aparece', () => {
    const v = em(candidata('recife-pe', 60), x => { const m = matricula(x, { cursoId: 'direito' }); anoFechado(x, m, 1, [7, 6, 8, 5.5]); anoFechado(x, m, 2, [6, 4, 7]); m.mesesRestantes += 6; });
    const s = semestres129(v);
    expect(s.periodos).toHaveLength(4);
    expect(s.periodos[0].rotulo).toBe('1º semestre');
    expect(s.atual).toBe(5);
    expect(s.previstos).toBe(10);
    expect(s.atraso).toBe(1);
  });

  it('o exame final: com nota de recuperação, passa (às vezes); nota baixa demais não vai a exame', () => {
    let passou = 0;
    for (let k = 0; k < 20; k++) {
      const v = em(candidata('recife-pe', 60), x => { x.t += k; x.educacao.postura = 'dedicada'; matricula(x, { cursoId: 'direito', desempenho: 34 }); });
      const ds = [{ nome: 'Direito Civil I', nota: 4, situacao: 'reprovada' as const }, { nome: 'Teoria do Estado', nota: 7, situacao: 'aprovada' as const }];
      const todas = ganchos129.recuperacao!(v, v.educacao.matricula!, ds);
      if (todas) { passou++; expect(ds[0]).toMatchObject({ situacao: 'aprovada', rec: true, nota: 5 }); }
      const baixa = [{ nome: 'Economia', nota: 1.5, situacao: 'reprovada' as const }];
      expect(ganchos129.recuperacao!(v, v.educacao.matricula!, baixa)).toBe(false);
    }
    expect(passou).toBeGreaterThan(8);
  });

  it('reprovações demais cancelam a matrícula (o contador deixou de só crescer)', () => {
    const lim = limiteDeReprovacoes129(cursoOuNulo('direito')!);
    const v = em(candidata('recife-pe', 60), x => { matricula(x, { cursoId: 'direito', reprovacoes: lim }); depoisDoCurso129(x); });
    expect(v.educacao.matricula).toBeUndefined();
    expect(v.educacao.historicoAcademico!.at(-1)!.situacao).toBe('cancelado');
    expect(v.biografia.at(-1)!.texto).toMatch(/cancelada/);
  });

  it('a dependência nas férias: refaz as reprovadas e, passando, devolve o semestre', () => {
    let v = em(candidata('recife-pe', 60), x => { x.educacao.postura = 'dedicada'; const m = matricula(x, { cursoId: 'direito', desempenho: 85, mesesRestantes: 42 }); anoFechado(x, m, 2, [6, 3.5, 7]); x.t = m.tInicio + 24; });
    const antes = v.educacao.matricula!.mesesRestantes;
    v = executar(v, { tipo: 'estudos129', oque: 'dependencia' }).vida;
    expect(v.educacao.matricula!.dependencia129).toBe(v.t);
    expect([antes, antes - 6]).toContain(v.educacao.matricula!.mesesRestantes);
    expect(v.educacao.historicoAcademico!.at(-1)!.rotulo).toMatch(/Dependência nas férias/);
  });
});

describe('Trancar, abandonar com FIES, trocar de curso', () => {
  it('trancar o técnico não diz "faculdade"', () => {
    const v = em(candidata('recife-pe', 60), x => { matricula(x, { cursoId: 'tec_enfermagem', instituicao: 'Escola Técnica Estadual de Recife', mesesRestantes: 12 }); });
    expect(textoDeTrancar129(v, v.educacao.matricula!)).toMatch(/curso técnico/);
    const t = executar(v, { tipo: 'trancar' }).vida;
    expect(t.biografia.some(b => /Trancou a matrícula do curso técnico/.test(b.texto))).toBe(true);
  });

  it('abandonar com FIES deixa a dívida do que foi cursado (antes, escapava)', () => {
    const v = em(candidata('recife-pe', 60), x => { const m = matricula(x, { cursoId: 'direito', rede: 'privada', financiamento: 'fies', mensalidade: 1200 }); anoFechado(x, m, 1, [7, 7, 7]); anoFechado(x, m, 2, [7, 7, 7]); });
    const esperado = dividaProporcional129(v, v.educacao.matricula!);
    expect(esperado).toBe(Math.round(1200 * 24 * 0.85));
    const d = executar(v, { tipo: 'abandonar_curso' }).vida;
    const fies = d.financas.dividas.filter(x => x.tipo === 'fies');
    expect(fies).toHaveLength(1);
    expect(fies[0].saldo).toBe(esperado);
  });

  it('transferência interna: mesmo campus, aproveita disciplinas; o curso antigo fica no histórico como troca', () => {
    let v = em(candidata('sao-paulo-sp', 80), x => {
      const m = matricula(x, { cursoId: 'eng_civil', instituicao: 'Universidade de São Paulo (USP), campus São Paulo', inst129: { id: 'usp', campus: 'sao-paulo', processo: 'fuvest' }, desempenho: 95, municipioId: 'sao-paulo-sp' });
      anoFechado(x, m, 1, [8, 8, 8]); anoFechado(x, m, 2, [8, 8, 8]);
    });
    const ts = trocasInternas129(v);
    expect(ts.map(t => t.curso.id)).toContain('arquitetura');
    expect(ts.map(t => t.curso.id)).not.toContain('eng_civil');
    let feito = false;
    for (let k = 0; k < 6 && !feito; k++) {
      const r = executar(v, { tipo: 'estudos129', oque: 'trocar_interna', cursoId: 'eng_mecanica' }).vida;
      if (r.educacao.matricula?.cursoId === 'eng_mecanica') { v = r; feito = true; } else v = em(r, x => { x.t += 12; });
    }
    expect(feito).toBe(true);
    const m = v.educacao.matricula!;
    expect(m.inst129?.campus).toBe('sao-paulo');
    expect(m.mesesRestantes).toBeLessThan(cursoOuNulo('eng_mecanica')!.meses);
    expect(v.educacao.historicoAcademico!.some(h => h.cursoId === 'eng_civil' && h.situacao === 'transferido')).toBe(true);
  });

  it('troca por outro processo seletivo: a vaga nova só fecha o curso de agora ao confirmar', () => {
    let v = candidata('sao-paulo-sp', 95, x => { matricula(x, { cursoId: 'pedagogia', municipioId: 'sao-paulo-sp' }); });
    expect(podeTentar(opcoes129(v, 'administracao').find(o => o.chave === 'inst:pucsp:monte-alegre:administracao:vestibular_privada')!.veredito)).toBe(false);
    v = executar(v, { tipo: 'estudos129', oque: 'candidatar', chave: 'inst:pucsp:monte-alegre:administracao:vestibular_privada', troca: true }).vida;
    expect(v.educacao.aprovacao?.troca129).toBe(true);
    expect(v.educacao.matricula?.cursoId).toBe('pedagogia');
    const c = executar(v, { tipo: 'confirmar_matricula' }).vida;
    expect(c.educacao.historicoAcademico!.some(h => h.cursoId === 'pedagogia' && h.situacao === 'transferido')).toBe(true);
    if (!c.caminhos.pendente) expect(c.educacao.matricula?.cursoId).toBe('administracao');
  });
});

describe('Técnicos ligados a vagas do jogo', () => {
  it('os técnicos novos existem, levam a áreas com ocupação, e as escolas técnicas os oferecem sem perder o catálogo de antes', () => {
    for (const id of ['tec_refrigeracao', 'tec_cozinha', 'tec_agronegocio', 'tec_informatica_internet']) {
      const c = cursoOuNulo(id)!;
      expect(c.nivel).toBe('tecnico');
      expect(OCUPACOES.some(o => o.area?.includes(c.area))).toBe(true);
    }
    const escolas = ['sao-paulo-sp', 'recife-pe', 'campinas-sp', 'curitiba-pr'].flatMap(instituicoesTecnicas);
    const novos = new Set(CURSOS.filter(c => c.id.startsWith('tec_') && ['tec_refrigeracao', 'tec_energia_renovavel', 'tec_telecomunicacoes', 'tec_eletromecanica', 'tec_manutencao_automotiva', 'tec_soldagem', 'tec_agronegocio', 'tec_zootecnia', 'tec_cozinha', 'tec_informatica_internet', 'tec_jogos_digitais', 'tec_recursos_humanos', 'tec_comercio', 'tec_marketing', 'tec_agrimensura'].includes(c.id)).map(c => c.id));
    expect(escolas.some(e => e.cursos.some(id => novos.has(id)))).toBe(true);
  });
});

describe('Saves antigos', () => {
  it('uma matrícula em andamento sem instituição continua: abre, avança o ano, mostra semestres', () => {
    const v0 = em(candidata('recife-pe', 60), x => { const m = matricula(x, { cursoId: 'administracao', instituicao: 'uma faculdade particular em Recife', rede: 'privada', mensalidade: 900 }); anoFechado(x, m, 1, [7, 7, 7]); delete (m as Partial<Matricula>).inst129; });
    const v = recarregar(v0);
    expect(v.educacao.matricula?.inst129).toBeUndefined();
    expect(semestres129(v).atual).toBe(3);
    const d = avancarAno(v).vida;
    expect(d.educacao.matricula?.cursoId ?? d.educacao.concluidos.at(-1)?.cursoId).toBe('administracao');
  });
});
