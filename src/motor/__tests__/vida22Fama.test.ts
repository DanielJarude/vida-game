/** VIDA 22 — a agenda pública: convites pela trajetória, requisitos, consequências, imprensa proporcional ao nome. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { disponibilidade, executar } from '../acoes';
import { convites22, imprensaDoAno22, MODELOS22 } from '../v22/fama/agenda22';
import type { Vida } from '../tipos';

const comNome = (fonte: 'esporte' | 'arte' | 'negocio' | 'politica' | 'rede', valor: number, semente = 2203): Vida => transacao(adulto(32, { semente, municipioId: 'sao-paulo-sp' }), x => {
  x.notoriedade = { valor, pico: valor, t: x.t, fonte, origens: { [fonte]: valor } } as never;
  x.momento = null;
}).vida;

describe('VIDA 22 · agenda pública', () => {
  it('anônimo não recebe convite; o tamanho do nome aumenta quantos chegam', () => {
    expect(convites22(comNome('esporte', 5))).toEqual([]);
    const pouco = convites22(comNome('esporte', 30)).length, muito = convites22(comNome('esporte', 85)).length;
    expect(pouco).toBeGreaterThan(0);
    expect(muito).toBeGreaterThan(pouco);
  });
  it('a origem do nome escolhe os convites: atleta não recebe fórum de negócios; empresário não recebe mesa-redonda esportiva', () => {
    const exclusivos = (tpl: string) => MODELOS22.find(m => m.id === tpl)!.origens;
    expect(exclusivos('forum')).toEqual(['empresarial']);
    for (let s = 0; s < 12; s++) {
      expect(convites22(comNome('esporte', 60, 3000 + s)).some(c => ['forum', 'economica', 'debate', 'publi'].includes(c.tpl))).toBe(false);
      expect(convites22(comNome('negocio', 60, 3000 + s)).some(c => ['mesa_esportiva', 'clinica', 'show_especial'].includes(c.tpl))).toBe(false);
    }
  });
  it('a premiação só vem com conquista recente; o talk show só depois de um auditório que deu certo', () => {
    for (let s = 0; s < 15; s++) {
      const cs = convites22(comNome('arte', 70, 4000 + s));
      expect(cs.some(c => c.tpl === 'premiacao')).toBe(false);
      expect(cs.some(c => c.tpl === 'talkshow')).toBe(false);
    }
  });
  it('aceitar tem consequência registrada e o convite sai da lista; recusar também sai', () => {
    let v = comNome('esporte', 60);
    const [c1, c2] = convites22(v);
    expect(disponibilidade(v, { tipo: 'fama22', oque: 'aceitar', id: c1.id }).grau).toBe('permitido');
    const antes = v.notoriedade!.valor;
    const r = executar(v, { tipo: 'fama22', oque: 'aceitar', id: c1.id });
    v = r.vida;
    expect(v.fama22!.feitos[0]).toMatchObject({ id: c1.id, aceitou: true });
    expect(['bom', 'ruim', 'neutro']).toContain(v.fama22!.feitos[0].tom);
    if (v.fama22!.feitos[0].tom === 'bom') expect(v.notoriedade!.valor).toBeGreaterThan(antes);
    if (v.fama22!.feitos[0].tom === 'ruim') expect(v.fatos['vis_polemica']).toBe(v.t);
    expect(convites22(v).some(c => c.id === c1.id)).toBe(false);
    v = executar(v, { tipo: 'fama22', oque: 'recusar', id: c2.id }).vida;
    expect(convites22(v).some(c => c.id === c2.id)).toBe(false);
    expect(disponibilidade(v, { tipo: 'fama22', oque: 'aceitar', id: c2.id }).grau).toBe('impossivel');
  });
  it('a imprensa do ano traz o que se respondeu e reações proporcionais ao nome', () => {
    let v = comNome('arte', 80);
    const c = convites22(v)[0];
    v = executar(v, { tipo: 'fama22', oque: 'aceitar', id: c.id }).vida;
    const notas = imprensaDoAno22(v);
    expect(notas.some(n => n.tipo === 'imprensa')).toBe(true);
    expect(notas.filter(n => n.tipo === 'rua').length).toBeGreaterThanOrEqual(2);
    expect(imprensaDoAno22(comNome('arte', 5))).toEqual([]);
  });
  it('variedade: em 20 vidas famosas aparecem pelo menos 12 tipos de convite', () => {
    const tipos = new Set<string>();
    const fontes = ['esporte', 'arte', 'negocio', 'politica', 'rede'] as const;
    for (let s = 0; s < 20; s++) for (const c of convites22(comNome(fontes[s % 5], 50 + s * 2, 5000 + s))) tipos.add(c.tpl);
    expect(tipos.size).toBeGreaterThanOrEqual(12);
  });
});
