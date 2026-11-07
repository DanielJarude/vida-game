/**
 * VIDA 12.9.1 · Cidades dos campi — os municípios dos campi reais da 12.9 entraram no mapa: o ingresso os oferece, dá para
 * morar, trabalhar e estudar neles, e os sorteios do mundo (nascer, de onde vem alguém) continuam os de sempre.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { adulto } from './cenarios';
import { executar } from '../acoes';
import { avancarAno } from '../ano';
import { transacao } from '../nucleo';
import { interpretar } from '../save';
import { criarRng } from '../rng';
import type { Vida } from '../tipos';
import { INSTITUICOES_129 } from '../dados/instituicoes129';
import { MUNICIPIOS_1291 } from '../dados/municipios1291';
import {
  cidadesDoPais, cidadesNoMapa, codigoDoMunicipio, economiaLocal, existeMunicipio, municipio, municipioDoCodigo, municipioPorNome,
  MUNICIPIOS, nivelDeOferta, nomeLugar, sortearMunicipio
} from '../dados/lugares';
import { AREAS_ENEM } from '../sistemas/escola';
import { instituicoesTecnicas } from '../sistemas/ensinoTecnico';
import { vagasDisponiveis } from '../sistemas/trabalho';
import { ofertasDeImoveis } from '../sistemas/mercado';
import { campiNoJogo129, opcoes129 } from '../sistemas/estudos129';

const em = (v: Vida, f: (x: Vida) => void): Vida => transacao(v, x => { f(x); }).vida;

function candidata(cidade: string, preparo: number): Vida {
  return em(adulto(18, { semente: 23, municipioId: cidade }), x => {
    x.educacao.basica = undefined; x.educacao.matricula = undefined; x.educacao.aprovacao = undefined; x.educacao.escolaridade = 'medio';
    x.trabalho.atual = undefined; x.financas.conta = 200000; x.mente.cognicao = preparo;
    for (const a of AREAS_ENEM) x.caminhos.frentes[a] = { ...(x.caminhos.frentes[a] ?? {}), habilidade: preparo } as never;
    x.educacao.enem = [{ t: x.t, nota: 300 + preparo * 6, areas: Object.fromEntries(AREAS_ENEM.map(a => [a, 300 + preparo * 6])) as never, pais: 'BR' }];
  });
}

const NOVAS = cidadesNoMapa('BR').slice(MUNICIPIOS.length);

describe('As cidades dos campi no mapa', () => {
  it('todo campus do catálogo fica numa cidade do mapa (nenhum fica de fora)', () => {
    let n = 0;
    for (const i of INSTITUICOES_129) {
      for (const c of i.campi) { n++; expect(existeMunicipio(c.municipioId), `${i.sigla} ${c.nome} → ${c.municipioId}`).toBe(true); }
      expect(campiNoJogo129(i).length).toBe(i.campi.length);
    }
    expect(n).toBe(62);
  });

  it('as 20 cidades novas: reais, sem duplicata (nome+UF, id), no fim da lista, com economia e oferta coerentes', () => {
    expect(NOVAS.length).toBe(MUNICIPIOS_1291.length);
    expect(NOVAS.length).toBe(20);
    const todas = cidadesNoMapa('BR');
    expect(new Set(todas.map(m => `${m.nome}|${m.uf}`)).size).toBe(todas.length);
    expect(new Set(todas.map(m => m.id)).size).toBe(todas.length);
    for (const m of NOVAS) {
      expect(m.pais).toBe('BR');
      expect(m.regiao).toBeTruthy();
      expect(m.capital).toBeUndefined();
      if (m.metropole) expect(existeMunicipio(m.metropole)).toBe(true);
      const e = economiaLocal(m.id);
      expect(e.custo).toBeGreaterThan(0.6); expect(e.custo).toBeLessThan(1.4);
      expect(e.aluguel).toBeGreaterThan(400);
      expect([0, 1, 3]).toContain(nivelDeOferta(m.id));
      // Código numérico estável: depois das cidades de sempre, e volta para a mesma cidade.
      expect(codigoDoMunicipio(m.id)).toBeGreaterThanOrEqual(MUNICIPIOS.length);
      expect(municipioDoCodigo(codigoDoMunicipio(m.id))).toBe(m.id);
      expect(municipioPorNome(m.nome, m.uf)?.id).toBe(m.id);
    }
    expect(nomeLugar('sao-carlos-sp')).toBe('São Carlos, SP');
    expect(municipio('camacari-ba')).toMatchObject({ perfil: 'metropolitana', metropole: 'salvador-ba', regiao: 'Nordeste' });
    expect(municipio('barueri-sp').metropole).toBe('sao-paulo-sp');
    expect(municipio('betim-mg').metropole).toBe('belo-horizonte-mg');
    // As cidades antigas mantêm o código de sempre.
    expect(codigoDoMunicipio('rio-branco-ac')).toBe(0);
    expect(codigoDoMunicipio(MUNICIPIOS[MUNICIPIOS.length - 1].id)).toBe(MUNICIPIOS.length - 1);
  });

  it('campi da mesma cidade apontam para a mesma localidade; o DF (Ceilândia) fica em Brasília', () => {
    const toledo = INSTITUICOES_129.flatMap(i => i.campi.filter(c => /Toledo/.test(c.nome)).map(c => c.municipioId));
    expect(toledo.length).toBe(2);
    expect(new Set(toledo)).toEqual(new Set(['toledo-pr']));
    const ceilandia = INSTITUICOES_129.find(i => i.id === 'unb')!.campi.find(c => /Ceilândia/.test(c.nome))!;
    expect(ceilandia.municipioId).toBe('brasilia-df');
    expect(existeMunicipio('ceilandia-df')).toBe(false);
    // Uma cidade do mapa por nome+UF: cada municipioId de campus resolve para um município só.
    const porNome = new Map<string, string>();
    for (const i of INSTITUICOES_129) for (const c of i.campi) {
      const m = municipio(c.municipioId); const k = `${m.nome}|${m.uf}`;
      expect(porNome.get(k) ?? c.municipioId).toBe(c.municipioId); porNome.set(k, c.municipioId);
    }
  });

  it('os sorteios do mundo continuam os de sempre (nascimento com a mesma semente dá a mesma cidade)', () => {
    expect(cidadesDoPais('BR').map(m => m.id)).toEqual(MUNICIPIOS.map(m => m.id));
    for (let s = 1; s <= 300; s++) {
      const r = criarRng(s);
      const m = sortearMunicipio(() => r.next());
      expect(NOVAS.some(n => n.id === m.id)).toBe(false);
    }
  });
});

describe('O ingresso agora oferece os campi antes fora do mapa', () => {
  it('USP São Carlos (Fuvest) aparece para Computação, com aviso de mudança de cidade; e dá para se candidatar', () => {
    const v = candidata('sao-paulo-sp', 95);
    const ops = opcoes129(v, 'computacao');
    const sc = ops.find(o => o.inst?.id === 'usp' && o.campus?.id === 'sao-carlos' && o.processo === 'fuvest');
    expect(sc).toBeTruthy();
    expect(sc!.municipioId).toBe('sao-carlos-sp');
    expect(sc!.observacao).toMatch(/São Carlos, SP.*mudar de cidade/);
    const depois = executar(v, { tipo: 'estudos129', oque: 'candidatar', chave: sc!.chave }).vida;
    const p = depois.educacao.processos129!.slice(-1)[0]!;
    expect(p.nome).toBe('Fuvest');
    if (p.aprovado) {
      expect(depois.educacao.aprovacao?.novo.inst129).toMatchObject({ id: 'usp', campus: 'sao-carlos' });
      const conf = executar(depois, { tipo: 'confirmar_matricula' }).vida;
      if (conf.educacao.matricula) expect(conf.educacao.matricula.municipioId).toBe('sao-carlos-sp');
    }
  });

  it('outros campi novos também entram (Unicamp Limeira, UFRJ Macaé, UFPR Toledo, Mackenzie Alphaville)', () => {
    const v = candidata('sao-paulo-sp', 80);
    const cursosDe = (inst: string, campus: string) => INSTITUICOES_129.find(i => i.id === inst)!.campi.find(c => c.id === campus)!.cursos;
    for (const [inst, campus] of [['unicamp', 'limeira'], ['ufrj', 'macae'], ['ufpr', 'toledo'], ['mackenzie', 'alphaville']] as const) {
      const insti = INSTITUICOES_129.find(i => i.id === inst)!;
      const c = insti.campi.find(x => x.id === campus)!;
      const curso = cursosDe(insti.id, campus)[0];
      expect(opcoes129(v, curso).some(o => o.inst?.id === insti.id && o.campus?.id === c.id), `${inst}/${campus}/${curso}`).toBe(true);
    }
  });
});

describe('Morar numa cidade nova', () => {
  it('mudar para São Carlos funciona; lá há vagas, imóveis e escolas técnicas; o ano passa; o save reabre', () => {
    let v = em(adulto(30, { semente: 41, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 100000; });
    v = executar(v, { tipo: 'mudar_cidade', municipioId: 'sao-carlos-sp' }).vida;
    expect(v.moradia.municipioId).toBe('sao-carlos-sp');
    expect(vagasDisponiveis(v).length).toBeGreaterThan(0);
    expect(ofertasDeImoveis(v, 'aluguel').length).toBeGreaterThan(0);
    expect(instituicoesTecnicas('sao-carlos-sp').length).toBe(2);
    for (const m of NOVAS) expect(instituicoesTecnicas(m.id).length).toBeGreaterThan(0);
    for (let k = 0; k < 3; k++) v = avancarAno(v).vida;
    expect(existeMunicipio(v.moradia.municipioId)).toBe(true);
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo).toBe('ok');
  });

  it('nascer (escolhendo) numa cidade nova e viver alguns anos', () => {
    let v = adulto(20, { semente: 7, municipioId: 'russas-ce' });
    expect(v.eu.municipioNatal).toBe('russas-ce');
    for (let k = 0; k < 3; k++) v = avancarAno(v).vida;
    expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
  });

  it('saves antigos abrem (as fixtures de sempre)', () => {
    const dir = join(__dirname, 'fixtures');
    const arquivos = readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const f of arquivos) {
      const l = interpretar(readFileSync(join(dir, f), 'utf8'));
      expect(l.tipo, f).toBe('ok');
    }
  });
});
