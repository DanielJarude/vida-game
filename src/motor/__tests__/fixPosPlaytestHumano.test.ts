/**
 * FIX pós-playtest humano — os testes causais (seção 24 do pedido). Cada teste segue uma cadeia: a ação → a reação do
 * mundo → a consequência → o que persiste (salvar e reabrir). Os testes usam sementes fixas: nada depende de sorte.
 */
import { describe, expect, it } from 'vitest';
import { criarRng } from '../rng';
import { criarVida, previaDoNascimento, sortearNascimento } from '../criacao';
import { cidadesDoPais, municipio, existeMunicipio } from '../dados/lugares';
import { nomeDaMateria } from '../mundo/materias';
import { instituicoesTecnicas, ofertaIntegrada } from '../sistemas/ensinoTecnico';
import { instituicaoAtual } from '../sistemas/formacao';
import { paisDoCatalogo, temPerfil } from '../mundo/registro';
import { interpretar } from '../save';
import type { Vida, Visual } from '../tipos';
import { rngDe } from '../rng';
import { geneticaDe, tracoUniversal, visualDaAncestralidade, visualDosPais } from '../sistemas/identidade';
import { processarGestacoes } from '../sistemas/familia';
import { nova, viverAte } from './ajuda';
import { adulto, comFilho, comParente } from './cenarios';
import { ofertasDeVeiculos } from '../sistemas/mercado';
import { formaDaVersao, versaoVeiculo } from '../dados/bens';
import { continuarComo } from '../sistemas/sucessao';
import { transacao } from '../nucleo';
import { interacoesPara, prioridadesDaFicha } from '../sistemas/interacoes';
import { grupoDaInteracao } from '../sistemas/juntos';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { encaixe, folegoDaSemana, ORDEM_DA_FAIXA, PEDACO_LEVE } from '../sistemas/semana';
import { atividadeExiste, podeComecarRotina, ROTINAS } from '../sistemas/rotinas';
import { leituraDaSobrecarga } from '../sistemas/sobrecarga';
import { alvoCabeca } from '../sistemas/estado';

const reabrir = (v: Vida) => { const r = interpretar(JSON.stringify(v)); expect(r.tipo, r.tipo === 'invalido' ? r.motivo : '').toBe('ok'); return (r as { vida: Vida }).vida; };

/* ================================================================ A — Tudo ao acaso */

describe('A — "Tudo ao acaso" sorteia o mundo, não o Brasil', () => {
  const sorteios = Array.from({ length: 120 }, (_, k) => sortearNascimento(criarRng(1000 + k)));

  it('120 sementes → muitos países, e o Brasil é só um deles', () => {
    const paises = new Map<string, number>();
    for (const s of sorteios) { const p = municipio(s.municipioId).pais; paises.set(p, (paises.get(p) ?? 0) + 1); }
    expect(paises.size).toBeGreaterThanOrEqual(15);
    expect(paises.get('BR') ?? 0).toBeLessThan(sorteios.length * 0.2);
    // Continentes diferentes aparecem (não é só a vizinhança).
    const regioes = new Set([...paises.keys()].map(p => paisDoCatalogo(p).regiao));
    expect(regioes.size).toBeGreaterThanOrEqual(5);
  });

  it('a cidade é do país sorteado, existe, e o país pode ser vivido; o nome segue o lugar', () => {
    for (const s of sorteios) {
      expect(existeMunicipio(s.municipioId)).toBe(true);
      const m = municipio(s.municipioId);
      expect(temPerfil(m.pais)).toBe(true);
      expect(s.nome.length).toBeGreaterThan(0);
      expect(s.sobrenome.length).toBeGreaterThan(0);
    }
  });

  it('o sorteio nasce: país, divisão e cidade coerentes; a família tem origem plausível; reabrir preserva', () => {
    for (const s of sorteios.slice(0, 12)) {
      const v = criarVida({ ...s, herdarCores: true });
      expect(v.moradia.municipioId).toBe(s.municipioId);
      expect(v.eu.nacionalidades?.includes(municipio(s.municipioId).pais)).toBe(true);
      expect(v.eu.ancestralidade && Object.keys(v.eu.ancestralidade).length).toBeGreaterThan(0);
      expect(reabrir(v).eu.visual).toEqual(v.eu.visual);
    }
  });

  it('a prévia da tela é o mesmo nascimento: o bebê e os pais que aparecem são os que nascem', () => {
    const s = sorteios[3];
    const o = { ...s, herdarCores: true };
    const p = previaDoNascimento(o);
    const v = criarVida(o);
    expect(p.eu).toEqual(v.eu.visual);
    const mae = Object.entries(v.vinculos).find(([, x]) => x.parentesco === 'mae')![0];
    expect(p.mae).toEqual(v.pessoas[mae].visual);
  });
});

/* ================================================================ F, G — Rotina: uma conta só */

describe('F/G — a semana: "cabe" e "não cabe" vêm da mesma conta', () => {
  const adolescenteTecnico = (nivelBola: 1 | 2 | 3) => {
    const v = viverAte(nova({ semente: 7 }), 15);
    v.momento = null;
    v.educacao.basica = { ...(v.educacao.basica as NonNullable<Vida['educacao']['basica']>), integrado: 'tec_mecanica' };
    v.rotinas = [{ id: 'futebol', tInicio: v.t, nivel: nivelBola }];
    return v;
  };

  it('o caso do playtest: técnico integral + bola "a sério", estresse baixo → o painel e a lista concordam', () => {
    const v = adolescenteTecnico(3);
    const f = folegoDaSemana(v);
    expect(v.mente.estresse).toBeLessThan(30);
    expect(f.texto).not.toMatch(/teto/);
    const leves = ROTINAS.filter(m => m.niveis[0].tempo <= PEDACO_LEVE && atividadeExiste(v, m) && !v.rotinas.some(r => r.id === m.id));
    const livres = leves.filter(m => podeTentar(podeComecarRotina(v, m.id, 1)));
    expect(livres.length).toBeGreaterThan(3);
    // E a palavra do painel é a da faixa (nunca "cabe" com a lista dizendo que não).
    expect(leituraDaSobrecarga(v).palavra).toBe(f.palavra);
  });

  it('transversal: em dezenas de semanas, o painel diz "teto" ⇔ nenhuma atividade leve é selecionável por tempo', () => {
    let casos = 0;
    for (const idadeAlvo of [9, 13, 15, 17, 22, 34]) {
      const base = viverAte(nova({ semente: 70 + idadeAlvo }), idadeAlvo);
      base.momento = null;
      const disponiveis = ROTINAS.filter(m => atividadeExiste(base, m) && podeComecarRotina(base, m.id, 1).grau !== 'impossivel');
      for (let k = 0; k <= Math.min(7, disponiveis.length); k++) {
        const v = structuredClone(base);
        v.rotinas = disponiveis.slice(0, k).map(m => ({ id: m.id, tInicio: v.t, nivel: (m.niveis.length > 1 ? 2 : 1) as 1 | 2 }));
        const f = folegoDaSemana(v);
        // (A terapia passa do teto de propósito — é para isso — e o painel diz; o resto segue a conta.)
        const porTempo = ROTINAS.filter(m => m.id !== 'terapia' && !v.rotinas.some(r => r.id === m.id) && m.niveis[0].tempo <= PEDACO_LEVE && atividadeExiste(v, m))
          .map(m => podeComecarRotina(v, m.id, 1))
          .filter(d => d.grau !== 'impossivel' && d.grau !== 'requisito');
        if (!porTempo.length) continue;
        casos++;
        const algumaEntra = porTempo.some(d => podeTentar(d) || d.grau === 'irregular');
        expect(/teto/.test(f.texto), `${idadeAlvo} anos, ${k} atividades: "${f.texto}"`).toBe(!algumaEntra);
        // A faixa desenhada, a palavra do painel e o veredito leem o mesmo encaixe.
        expect(encaixe(v, 0).faixa).toBe(f.faixa);
      }
    }
    expect(casos).toBeGreaterThan(20);
  });

  it('F — semana cheia: dá para assumir com custo → a atividade entra → o estresse e o treino respondem → reabrir preserva', () => {
    let v = adulto(24, { semente: 31 });
    // A semana enchendo, uma escolha de cada vez, até quase não sobrar folga.
    for (const id of ['academia', 'musica', 'corrida', 'leitura', 'xadrez', 'fotografia']) {
      if (encaixe(v, 0).folga < 0.5) break;
      v.rotinas.push({ id, tInicio: v.t, nivel: 2 });
    }
    const s0 = encaixe(v, 0);
    expect(['ocupada', 'cheia']).toContain(s0.faixa);
    expect(folegoDaSemana(v).texto).toMatch(/assumir|Cabe/);
    const d = podeComecarRotina(v, 'teatro', 1);
    expect(podeTentar(d), d.motivo).toBe(true);
    const antes = alvoCabeca(v);
    v = executar(v, { tipo: 'rotina', id: 'teatro', ativa: true, nivel: 1 }).vida;
    expect(v.rotinas.some(r => r.id === 'teatro')).toBe(true);
    const depois = encaixe(v, 0);
    expect(ORDEM_DA_FAIXA.indexOf(depois.faixa)).toBeGreaterThanOrEqual(ORDEM_DA_FAIXA.indexOf(s0.faixa));
    if (depois.folga < 0) expect(alvoCabeca(v)).toBeGreaterThan(antes);
    const r = reabrir(v);
    expect(r.rotinas).toEqual(v.rotinas);
    expect(folegoDaSemana(r)).toEqual(folegoDaSemana(v));
  });

  it('G — impossível de verdade: bloqueia, e o motivo diz o que ocupa os dias e o que largar', () => {
    const v = adulto(30, { semente: 33 });
    v.rotinas = [
      { id: 'academia', tInicio: v.t, nivel: 3 }, { id: 'musica', tInicio: v.t, nivel: 3 }, { id: 'corrida', tInicio: v.t, nivel: 3 },
      { id: 'teatro', tInicio: v.t, nivel: 3 }, { id: 'voluntariado', tInicio: v.t, nivel: 2 }
    ].filter(x => ROTINAS.some(m => m.id === x.id)) as Vida['rotinas'];
    const e = encaixe(v, 1);
    expect(e.possivel).toBe(false);
    const d = podeComecarRotina(v, 'natacao', 1);
    expect(d.grau).toBe('incompativel');
    expect(d.motivo).toMatch(/Não há horas na semana/);
    expect(d.motivo).toMatch(/largar|mais de uma coisa/);
    expect(folegoDaSemana(v).texto).toMatch(/teto/);
    // Terapia continua possível (é para isso).
    expect(podeTentar(podeComecarRotina(v, 'terapia', 1))).toBe(true);
  });

  it('criança: a semana enche, não estoura — e o porquê é a idade, não um número', () => {
    const v = viverAte(nova({ semente: 12 }), 9);
    v.momento = null;
    const dispo = ROTINAS.filter(m => atividadeExiste(v, m) && podeComecarRotina(v, m.id, 1).grau !== 'impossivel' && podeComecarRotina(v, m.id, 1).grau !== 'requisito');
    v.rotinas = dispo.slice(0, 5).map(m => ({ id: m.id, tInicio: v.t, nivel: 1 }));
    const prox = dispo.slice(5).find(m => m.niveis[0].tempo >= 0.5);
    if (!prox) return;
    const d = podeComecarRotina(v, prox.id, 1);
    if (!podeTentar(d)) expect(d.motivo).toMatch(/Com 9 anos/);
  });
});

/* ================================================================ H — Japão: a escola não pensa em português */

describe('H — estudar no Japão: nenhuma matéria pressupõe português', () => {
  it('uma vida inteira de escola no Japão (várias sementes) → nem a Linha da Vida nem as pessoas falam de "português"', () => {
    for (const semente of [3, 8, 21]) {
      const cidade = cidadesDoPais('JP')[semente % cidadesDoPais('JP').length].id;
      let v = criarVida({ nome: 'Yua', sobrenome: 'Sato', genero: 'feminino', municipioId: cidade, semente });
      v = viverAte(v, 19);
      const textos = [...v.biografia.map(e => e.texto), ...Object.values(v.vinculos).flatMap(x => x.historia.map(h => h.texto)), ...Object.values(v.pessoas).map(p => p.ocupacao ?? '')];
      const vaza = textos.filter(t => /portugu[eê]s|redação/i.test(t));
      expect(vaza, vaza.join(' | ')).toEqual([]);
    }
  });

  it('a fonte única: no Japão a língua da escola é japonês; no Brasil, português; em Portugal, português; nos EUA, a estrangeira não é inglês', () => {
    expect(nomeDaMateria('linguagens', 'curta', 'JP')).toBe('japonês');
    expect(nomeDaMateria('linguagens', 'aula', 'BR')).toBe('português e redação');
    expect(nomeDaMateria('linguagens', 'curta', 'PT')).toBe('português');
    expect(nomeDaMateria('idiomas', 'curta', 'US')).not.toBe('inglês');
    expect(nomeDaMateria('idiomas', 'curta', 'JP')).toBe('inglês');
  });
});

/* ================================================================ I — Formação técnica */

describe('I — a escola técnica tem identidade, catálogo próprio e consequência', () => {
  const PAISES_T = ['BR', 'JP', 'DE', 'US', 'MX', 'FR', 'NG', 'IN', 'AU', 'PT'];
  const escolas = PAISES_T.flatMap(p => cidadesDoPais(p).slice(0, 12).flatMap(c => instituicoesTecnicas(c.id)));

  it('o trio Mecânica/Eletrotécnica/Administração não domina: catálogos variados entre escolas e países', () => {
    expect(escolas.length).toBeGreaterThan(80);
    const trio = new Set(['tec_mecanica', 'tec_eletrotecnica', 'tec_administracao']);
    const soTrio = escolas.filter(e => e.cursos.length > 0 && e.cursos.every(id => trio.has(id)));
    expect(soTrio.length / escolas.length).toBeLessThan(0.05);
    const comTrio = escolas.filter(e => [...trio].every(id => e.cursos.includes(id)));
    expect(comTrio.length / escolas.length).toBeLessThan(0.15);
    const cursos = new Set(escolas.flatMap(e => e.cursos));
    expect(cursos.size).toBeGreaterThanOrEqual(18);
    // Informática / desenvolvimento existe (a pergunta do playtest): em muitas escolas.
    expect(escolas.filter(e => e.cursos.some(id => id === 'tec_informatica' || id === 'tec_desenvolvimento')).length).toBeGreaterThan(escolas.length * 0.25);
    // Duas escolas da mesma cidade grande não têm o mesmo catálogo.
    const grande = cidadesDoPais('BR').find(c => c.perfil === 'metropole')!;
    const ali = instituicoesTecnicas(grande.id);
    expect(new Set(ali.map(e => e.cursos.join(','))).size).toBe(ali.length);
  });

  it('a mesma escola preserva o catálogo (identidade da cidade, não da vida) e o nome segue a rota do país', () => {
    const c = cidadesDoPais('JP')[0].id;
    expect(JSON.stringify(instituicoesTecnicas(c))).toBe(JSON.stringify(instituicoesTecnicas(c)));
    expect(instituicoesTecnicas(c).some(e => /Kōsen|Senmon|técnica/.test(e.nome))).toBe(true);
    expect(instituicoesTecnicas(cidadesDoPais('DE')[0].id)[0].nome).toMatch(/Berufsschule|profissional/);
    expect(instituicoesTecnicas(cidadesDoPais('BR')[0].id).every(e => !/Mecânica, Eletrotécnica e Administração/.test(e.nome))).toBe(true);
  });

  it('a seleção no Japão → passa → a escola tem nome e catálogo dela → o curso pratica → formar abre a área → reabrir preserva', () => {
    const cidade = cidadesDoPais('JP').find(c => ofertaIntegrada(c.id).length > 0)!.id;
    let v = criarVida({ nome: 'Haruto', sobrenome: 'Ito', genero: 'masculino', municipioId: cidade, semente: 5 });
    v = viverAte(v, 14);
    const of = ofertaIntegrada(cidade)[0];
    v.educacao.basica = { ...v.educacao.basica!, integrado: of.curso.id, integradoInst: of.inst.chave, rede: 'publica' };
    const inst = instituicaoAtual(v)!;
    expect(inst.nome).toBe(of.inst.nome);
    expect(inst.nome).not.toMatch(/Instituto Federal/);
    const r = reabrir(v);
    expect(r.educacao.basica?.integradoInst).toBe(of.inst.chave);
    expect(instituicaoAtual(r)!.nome).toBe(of.inst.nome);
  });
});

/* ================================================================ D — Microcena */

describe('D — fazer algo junto é uma cena, não uma barra', () => {
  const amigaDe = (v: Vida, prox = 62) => {
    const { p, vin } = comParente(v, 'irmao', 26, 'feminino', prox);
    vin.parentesco = undefined; vin.estagio = 'amigo'; vin.origem = 'escola'; vin.convivio = []; vin.tInicio = v.t - 120;
    p.municipioId = v.moradia.municipioId;
    return { p, vin };
  };

  it('ir ao cinema com uma amiga → cena com título e texto concretos → a relação muda → a mesma cena não se repete em seguida → reabrir guarda o necessário', () => {
    let v = adulto(26, { semente: 41 });
    v.financas.conta = 50000;
    const { p } = amigaDe(v);
    const tipos: string[] = [];
    const textos: string[] = [];
    for (let ano = 0; ano < 6; ano++) {
      const antes = { ...v.vinculos[p.id] };
      const r = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'cinema' });
      expect(r.titulo).toMatch(/Cinema com/);
      v = r.vida;
      const vin = v.vinculos[p.id];
      expect(vin.cenas!.length).toBeGreaterThan(0);
      tipos.push(vin.cenas![vin.cenas!.length - 1].split(".")[0]);
      textos.push(r.resultado ?? "");
      // Alguma coisa da relação se moveu (proximidade, confiança, tensão ou o que você sabe).
      expect(vin.proximidade !== antes.proximidade || vin.confianca !== antes.confianca || vin.tensao !== antes.tensao || (vin.sabe?.length ?? 0) !== (antes.sabe?.length ?? 0)).toBe(true);
      v.t += 12; v.anoAtual = { acoes: [] };
    }
    for (let k = 1; k < tipos.length; k++) expect(tipos[k], tipos.join(',')).not.toBe(tipos[k - 1]);
    expect(new Set(tipos).size).toBeGreaterThanOrEqual(3);
    expect(new Set(textos).size, JSON.stringify([tipos, textos])).toBe(textos.length);
    const rr = reabrir(v);
    expect(rr.vinculos[p.id].cenas).toEqual(v.vinculos[p.id].cenas);
    expect(rr.vinculos[p.id].cenas!.length).toBeLessThanOrEqual(4);
  });

  it('o que a cena revela entra no que você sabe; a cidade de origem volta à conversa depois', () => {
    let achouRevelacao = false; let achouLembranca = false;
    for (let s = 0; s < 14 && !(achouRevelacao && achouLembranca); s++) {
      let v = adulto(27, { semente: 41 });
      v.id = `${v.id}-cena${s}`; v.financas.conta = 50000;
      const { p } = amigaDe(v, 70);
      p.municipioNatal = cidadesDoPais('JP')[0].id;
      for (let ano = 0; ano < 6; ano++) {
        const prog = ['cinema', 'jantar_fora', 'caminhar_junto'][ano % 3];
        const r = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: prog });
        v = r.vida;
        const ult = v.vinculos[p.id].cenas!.slice(-1)[0].split(".")[0];
        if (ult === 'revelacao') { achouRevelacao = true; expect(v.vinculos[p.id].sabe?.length).toBeGreaterThan(0); }
        if (ult === 'lembranca') { achouLembranca = true; expect(r.resultado).toContain(municipio(p.municipioNatal!).nome); }
        v.t += 12; v.anoAtual = { acoes: [] };
      }
    }
    expect(achouRevelacao).toBe(true);
    expect(achouLembranca).toBe(true);
  });

  it('a noite comum não vira Linha da Vida; só o que é biografia entra', () => {
    let v = adulto(26, { semente: 43 });
    v.financas.conta = 50000;
    const { p } = amigaDe(v);
    const antes = v.biografia.length;
    for (let ano = 0; ano < 5; ano++) { v = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'caminhar_junto' }).vida; v.t += 12; v.anoAtual = { acoes: [] }; }
    const novas = v.biografia.slice(antes).filter(e => e.pessoas?.includes(p.id));
    expect(novas.length).toBeLessThanOrEqual(2);
  });
});

/* ================================================================ E — Romance a partir da amizade */

describe('E — da amizade ao romance: dá para tentar, e a resposta não é garantida', () => {
  const amigaDe = (v: Vida, prox: number, atracao?: 'homens' | 'mulheres' | 'ambos') => {
    const { p, vin } = comParente(v, 'irmao', 27, 'feminino', prox);
    vin.parentesco = undefined; vin.estagio = prox >= 60 ? 'amigo_proximo' : 'amigo'; vin.origem = 'escola'; vin.convivio = []; vin.tInicio = v.t - 120;
    p.municipioId = v.moradia.municipioId; p.parceiroId = undefined;
    if (atracao) p.atracao = atracao;
    return { p, vin };
  };

  it('uma amiga próxima de anos: "demonstrar interesse" aparece na ficha, no lugar do romance', () => {
    const v = adulto(27, { semente: 51, genero: 'masculino' });
    const { p } = amigaDe(v, 70, 'mulheres');
    const ids = interacoesPara(v, p.id).map(x => x.id);
    expect(ids).toContain('demonstrar_interesse');
    expect(grupoDaInteracao('demonstrar_interesse')).toBe('romance');
  });

  it('o resultado depende da outra pessoa: quem não sente atração diz que não (com honestidade); quem sente pode retribuir; nada é garantido', () => {
    const resultados = { sim: 0, tempo: 0, nao: 0 };
    for (let k = 0; k < 24; k++) {
      let v = adulto(27, { semente: 51, genero: 'masculino' });
      v.rng = (v.rng + k * 7919) >>> 0;
      const { p } = amigaDe(v, 72, 'homens');
      v = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'demonstrar_interesse' }).vida;
      const rom = v.vinculos[p.id].romance;
      if (rom?.estagio === 'interesse' && rom.pediuTempo === undefined) resultados.sim++;
      else if (rom?.pediuTempo !== undefined) resultados.tempo++;
      else resultados.nao++;
    }
    expect(resultados.sim).toBeGreaterThan(0);
    expect(resultados.sim).toBeLessThan(24);
    // Orientação incompatível: nunca vira romance, a amizade fica.
    for (let k = 0; k < 8; k++) {
      let v = adulto(27, { semente: 51, genero: 'masculino' });
      v.rng = (v.rng + k * 104729) >>> 0;
      const { p } = amigaDe(v, 72, 'mulheres');
      const r = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'demonstrar_interesse' });
      v = r.vida;
      expect(v.vinculos[p.id].romance).toBeUndefined();
      expect(v.vinculos[p.id].proximidade).toBeGreaterThanOrEqual(65);
      expect(r.resultado).toMatch(/não desse jeito/);
    }
  });

  it('retribuiu → o próximo passo (chamar para sair) aparece e é a prioridade da ficha → o estado sobrevive ao reabrir', () => {
    for (let k = 0; k < 40; k++) {
      let v = adulto(27, { semente: 51, genero: 'masculino' });
      v.rng = (v.rng + k * 7919) >>> 0;
      const { p } = amigaDe(v, 75, 'homens');
      v = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'demonstrar_interesse' }).vida;
      const rom = v.vinculos[p.id].romance;
      if (rom?.estagio !== 'interesse' || rom.pediuTempo !== undefined) continue;
      expect(interacoesPara(v, p.id).map(x => x.id)).toContain('convidar');
      expect(prioridadesDaFicha(v, p.id).ids[0]).toBe('convidar');
      expect(reabrir(v).vinculos[p.id].romance).toEqual(rom);
      return;
    }
    throw new Error('nenhuma tentativa retribuída em 40 — o caminho está fechado demais');
  });
});

/* ================================================================ B — Genética e família */

const TRACOS_TODOS = ['corCabelo', 'olhos', 'textura', 'olhosForma', 'nariz', 'boca', 'rosto', 'sobrancelha', 'olhosTam', 'olhosDist', 'sobrancelhaForma', 'bocaLarg', 'queixo', 'orelhas', 'linhaCabelo', 'calvicie'] as const;
const tr = (v: Visual | undefined, k: (typeof TRACOS_TODOS)[number]) => tracoUniversal(v, k) ?? v?.[k];
const iguais = (a: Visual, b: Visual) => TRACOS_TODOS.filter(k => tr(a, k) !== undefined && tr(a, k) === tr(b, k)).length / TRACOS_TODOS.length;

describe('B — os traços vêm dos pais, atravessam gerações e sobrevivem ao reabrir', () => {
  const mae = visualDaAncestralidade(rngDe('mae-b'), 'feminino', { eu: 1 });
  const pai = visualDaAncestralidade(rngDe('pai-b'), 'masculino', { af: 1 });
  const anc = { eu: 0.5, af: 0.5 };
  const filhos = Array.from({ length: 40 }, (_, k) => visualDosPais(rngDe('filho-b', k), k % 2 ? 'masculino' : 'feminino', anc, mae, pai));

  it('cada traço do filho vem de um dos pais (quase sempre), e os irmãos não são clones', () => {
    let deUmDosPais = 0, total = 0;
    for (const f of filhos) for (const k of TRACOS_TODOS) { if (tr(f, k) === undefined) continue; total++; if (tr(f, k) === tr(mae, k) || tr(f, k) === tr(pai, k)) deUmDosPais++; }
    expect(deUmDosPais / total).toBeGreaterThan(0.85);
    const unicos = new Set(filhos.map(f => TRACOS_TODOS.map(k => tr(f, k)).join('|')));
    expect(unicos.size).toBeGreaterThan(30);
    // Os traços novos da Aparência 2.0 existem e variam entre irmãos.
    for (const k of ['olhosTam', 'queixo', 'orelhas', 'linhaCabelo'] as const) { expect(filhos.every(f => tr(f, k) !== undefined), k).toBe(true); expect(new Set(filhos.map(f => tr(f, k))).size, k).toBeGreaterThan(1); }
  });

  it('parentes se parecem mais que estranhos do mesmo lugar; netos guardam parte da família', () => {
    const irmaos = filhos.slice(0, 20).map((f, k) => iguais(f, filhos[k + 20]));
    const estranhos = filhos.slice(0, 20).map((_f, k) => iguais(visualDaAncestralidade(rngDe('x', k), 'feminino', anc), visualDaAncestralidade(rngDe('y', k), 'masculino', anc)));
    const media = (x: number[]) => x.reduce((s, y) => s + y, 0) / x.length;
    expect(media(irmaos)).toBeGreaterThan(media(estranhos) + 0.1);
    const conj = visualDaAncestralidade(rngDe('conj-b'), 'masculino', { ea: 1 });
    const netos = Array.from({ length: 20 }, (_, k) => visualDosPais(rngDe('neto-b', k), 'feminino', { eu: 0.25, af: 0.25, ea: 0.5 }, filhos[0], conj));
    expect(media(netos.map(n => iguais(n, filhos[0])))).toBeGreaterThan(media(netos.map(n => iguais(n, visualDaAncestralidade(rngDe('z', n.nariz ?? ''), 'feminino', { eu: 0.25, af: 0.25, ea: 0.5 })))));
  });

  it('nascer → os traços dos pais vão para quem nasce → reabrir preserva visual e genes', () => {
    const v = criarVida({ nome: 'Ana', sobrenome: 'Okafor', genero: 'feminino', municipioId: cidadesDoPais('BR')[0].id, semente: 77, herdarCores: true });
    const mae = Object.entries(v.vinculos).find(([, x]) => x.parentesco === 'mae')![0];
    const pai = Object.entries(v.vinculos).find(([, x]) => x.parentesco === 'pai')?.[0];
    const doPais = TRACOS_TODOS.filter(k => tr(v.eu.visual, k) !== undefined && (tr(v.eu.visual, k) === tr(v.pessoas[mae].visual, k) || (pai && tr(v.eu.visual, k) === tr(v.pessoas[pai].visual, k)))).length;
    expect(doPais).toBeGreaterThan(TRACOS_TODOS.length * 0.6);
    expect(reabrir(v).eu.visual).toEqual(v.eu.visual);
  });

  it('migrar não muda a genética (o rosto de quem vai para o Japão é o mesmo)', () => {
    const v = criarVida({ nome: 'Ana', sobrenome: 'Silva', genero: 'feminino', municipioId: cidadesDoPais('BR')[0].id, semente: 78, herdarCores: true });
    const antes = structuredClone(v.eu.visual);
    v.moradia.municipioId = cidadesDoPais('JP')[0].id;
    expect(geneticaDe(v.eu)).toEqual(geneticaDe({ visual: antes }));
  });
});

/* ================================================================ C — Cirurgia ≠ genética */

describe('C — a cirurgia muda o rosto, não a genética', () => {
  const comNariz = () => {
    const v = adulto(30, { semente: 61 });
    v.financas.conta = 500000;
    v.eu.visual.nariz = 'curvo';
    return v;
  };
  const operada = () => {
    for (let s = 0; s < 40; s++) {
      const v = comNariz();
      const d = disponibilidade(v, { tipo: 'estetica', id: 'rinoplastia', clinica: 'renomada', alvo: 'fino' });
      expect(podeTentar(d), d.motivo).toBe(true);
      v.rng = (v.rng + s * 7919) >>> 0;
      const r = executar(v, { tipo: 'estetica', id: 'rinoplastia', clinica: 'renomada', alvo: 'fino' });
      if (r.vida.eu.procedimentos?.slice(-1)[0].resultado === 'satisfatorio') return r;
    }
    throw new Error('nenhuma rinoplastia satisfatória em 40 — o resultado bom ficou raro demais');
  };

  it('rinoplastia → o retrato muda (nariz fino) → os genes guardam o nariz de nascença → a Linha da Vida conta → reabrir preserva', () => {
    const r = operada();
    const v = r.vida;
    expect(r.titulo).toBe('Rinoplastia');
    expect(v.eu.visual.nariz).toBe('fino');
    expect(v.eu.genes?.nariz).toBe('curvo');
    expect(geneticaDe(v.eu)!.nariz).toBe('curvo');
    expect(v.biografia.slice(-3).some(e => /rinoplastia/.test(e.texto))).toBe(true);
    const rr = reabrir(v);
    expect(rr.eu.visual.nariz).toBe('fino');
    expect(rr.eu.genes?.nariz).toBe('curvo');
  });

  it('o filho de quem operou nasce IGUAL ao filho de quem não operou (mesma semente): herda a genética, não a cirurgia', () => {
    const op = operada().vida;
    const sem = comNariz();
    sem.rng = op.rng;
    // O MESMO pai nos dois mundos (a única diferença entre eles é a cirurgia).
    const { p, vin } = comParente(op, 'irmao', 31, 'masculino', 80);
    vin.parentesco = undefined;
    sem.pessoas[p.id] = structuredClone(p); sem.vinculos[p.id] = structuredClone(vin);
    for (const v of [op, sem]) v.processos.push({ tipo: 'gestacao', id: 'g1', gestanteId: 'eu', outroId: p.id, tConcepcao: v.t - 9, tParto: v.t, planejada: true, descoberta: true } as never);
    let comparados = 0;
    for (let s = 0; s < 20 && comparados < 6; s++) {
      const a = structuredClone(op), b = structuredClone(sem);
      const ba = processarGestacoes(a, criarRng(900 + s)), bb = processarGestacoes(b, criarRng(900 + s));
      if (!ba || !bb) continue;
      comparados++;
      expect(ba.visual).toEqual(bb.visual);
    }
    expect(comparados).toBeGreaterThan(2);
  });

  it('o resultado não é garantido: em muitas tentativas aparecem resultados diferentes, e a complicação existe', () => {
    const resultados = new Map<string, number>();
    for (let s = 0; s < 80; s++) {
      const v = comNariz();
      v.rng = (v.rng + s * 104729) >>> 0;
      const x = executar(v, { tipo: 'estetica', id: 'rinoplastia', clinica: 'popular', alvo: 'pequeno' }).vida;
      const res = x.eu.procedimentos!.slice(-1)[0].resultado;
      resultados.set(res, (resultados.get(res) ?? 0) + 1);
    }
    expect(resultados.size).toBeGreaterThanOrEqual(3);
    expect(resultados.get('satisfatorio') ?? 0).toBeGreaterThan(10);
  });

  it('o que não faz sentido não aparece: orelha que não é de abano não opera; menor de idade não faz rinoplastia', () => {
    const v = comNariz();
    v.eu.visual.orelhas = 'medias';
    expect(podeTentar(disponibilidade(v, { tipo: 'estetica', id: 'otoplastia', clinica: 'boa' }))).toBe(false);
    const jovem = viverAte(nova({ semente: 4 }), 15);
    jovem.momento = null;
    expect(disponibilidade(jovem, { tipo: 'estetica', id: 'rinoplastia', clinica: 'boa', alvo: 'fino' }).grau).toBe('impossivel');
  });
});

/* ================================================================ J — Materialidade (veículo) */

describe('J — o carro É da cor do anúncio: vitrine → garagem → uso → reabrir', () => {
  it('compra um compacto colorido → a cor e a forma ficam com o bem → usar não repinta → reabrir mantém', () => {
    let v = adulto(30, { semente: 71 });
    v.financas.conta = 400000; v.trabalho.licencas.push('cnh');
    const lista = ofertasDeVeiculos(v, 'concessionaria');
    const o = lista.find(x => formaDaVersao(versaoVeiculo(x.versaoId), x.modeloId) === 'compacto') ?? lista[0];
    v = executar(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false }).vida;
    const b = v.financas.bens.find(x => x.tipo === 'veiculo')!;
    expect(b.tipo === 'veiculo' && b.cor).toBe(o.cor);
    let usou = 0;
    for (const oque of ['passear', 'viajar'] as const) { const a = { tipo: 'usar_veiculo' as const, bemId: b.id, oque }; if (podeTentar(disponibilidade(v, a))) { v = executar(v, a).vida; usou++; } }
    expect(usou).toBeGreaterThan(0);
    const b2 = reabrir(v).financas.bens.find(x => x.id === b.id)!;
    expect(b2.tipo === 'veiculo' && b2.cor).toBe(o.cor);
  });
});

/* ================================================================ K — Sucessão */

describe('K — morrer e continuar como descendente: genética, história, pertences certos; redes não herdadas', () => {
  it('a mãe operou o nariz; o filho continua: o rosto dele é o dele, os genes da mãe guardam o nariz de nascença', () => {
    let v = adulto(45, { semente: 81 });
    v.financas.conta = 500000; v.eu.visual.nariz = 'curvo';
    v = executar(v, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } } as Parameters<typeof executar>[1]).vida;
    v = executar(v, { tipo: 'estetica', id: 'rinoplastia', clinica: 'renomada', alvo: 'fino' }).vida;
    expect(v.eu.genes?.nariz).toBe('curvo');
    const { p: filho } = comFilho(v, 20, { casa: false });
    v.pessoas[filho.id].municipioId = v.moradia.municipioId;
    const visualDoFilho = structuredClone(v.pessoas[filho.id].visual);
    v = transacao(v, x => { x.morte = { t: x.t, causa: 'infarto' }; }).vida;
    const r = continuarComo(v, filho.id);
    expect(r.erro).toBeUndefined();
    const n = r.vida;
    expect(n.eu.visual).toEqual(visualDoFilho);
    expect(n.redes).toBeUndefined();
    // Quem morreu virou pessoa da família — com os genes (é deles que os netos herdam).
    const mae = Object.values(n.pessoas).find(p => !p.vivo && p.nome === v.eu.nome)!;
    expect(mae.genes?.nariz).toBe('curvo');
    expect(geneticaDe(mae)!.nariz).toBe('curvo');
    expect(reabrir(n).pessoas[mae.id].genes?.nariz).toBe('curvo');
  });
});
