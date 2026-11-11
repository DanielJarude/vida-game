/** VIDA 16 · ofícios por dentro (direito, docência, tecnologia) e carreiras religiosas (por tradição). */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { avancarAno } from '../ano';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { anoDe } from '../tempo';
import { pastaDe16, ramoDe16 } from '../v16/oficios/oficios16';
import { caminhosPossiveis16, etapaAtual16 } from '../v16/religiao/religiao16';
import { TRADICOES16 } from '../dados16/religiao/tradicoes16';
import { crencaDe } from '../v14/crencas/crencas';
import type { Vida } from '../tipos';

function comEmprego(v: Vida, ocupacaoId: string, contrato: 'clt' | 'autonomo' | 'servidor' = 'clt'): Vida {
  v.trabalho.atual = { ocupacaoId, empregador: 'um lugar', contrato, salario: 6000, tInicio: v.t - 36, desempenho: 60, municipioId: v.moradia.municipioId, carga: 'integral' };
  return v;
}
const ano = (v: Vida) => { const x = avancarAno(v).vida; x.momento = null; (x as Vida & { fila?: unknown }).fila = undefined; return x; };

describe('VIDA 16 · ofícios por dentro', () => {
  it('cada ramo tem a sua pasta; estágio e quem não é do ramo não têm', () => {
    const v = structuredClone(adulto(30));
    expect(ramoDe16(comEmprego(structuredClone(v), 'advogado', 'autonomo'))).toBe('direito');
    expect(ramoDe16(comEmprego(structuredClone(v), 'professor_fund'))).toBe('docencia');
    expect(ramoDe16(comEmprego(structuredClone(v), 'dev_pleno'))).toBe('tecnologia');
    expect(ramoDe16(comEmprego(structuredClone(v), 'estagio_direito'))).toBeUndefined();
    expect(ramoDe16(comEmprego(structuredClone(v), 'vendedor'))).toBeUndefined();
    // Ler a pasta não grava nada (quem não abre a pasta não tem a vida mexida).
    const d = comEmprego(structuredClone(v), 'advogado', 'autonomo');
    const p = pastaDe16(d)!;
    expect(p.itens.filter(x => x.tipo === 'caso').length).toBe(3);
    expect(d.oficio16).toBeUndefined();
    expect(JSON.stringify(pastaDe16(d))).toBe(JSON.stringify(p));
  });

  it('direito: pegar o caso, acordo ou julgamento (decidido na virada), honorários de quem advoga por conta, recurso', () => {
    let vitorias = 0, derrotas = 0, acordos = 0;
    for (let s = 1; s <= 10; s++) {
      let v = comEmprego(structuredClone(adulto(34, { semente: s })), 'advogado', 'autonomo');
      const casos = pastaDe16(v)!.itens.filter(x => x.tipo === 'caso');
      v = executar(v, { tipo: 'oficio16', oque: { op: 'aceitar', id: casos[0].id } }).vida;
      v = executar(v, { tipo: 'oficio16', oque: { op: 'aceitar', id: casos[1].id } }).vida;
      expect(podeTentar(disponibilidade(v, { tipo: 'oficio16', oque: { op: 'aceitar', id: casos[2].id } }))).toBe(false);
      const conta = v.financas.conta;
      v = executar(v, { tipo: 'oficio16', oque: { op: 'estrategia', id: casos[0].id, escolha: 'acordo' } }).vida;
      expect(v.financas.conta).toBeGreaterThan(conta);
      v = executar(v, { tipo: 'oficio16', oque: { op: 'estrategia', id: casos[1].id, escolha: 'julgamento' } }).vida;
      v = executar(v, { tipo: 'oficio16', oque: { op: 'preparar', id: casos[1].id } }).vida;
      const anoAntes = anoDe(v.t);
      v = ano(v);
      expect(anoDe(v.t)).toBe(anoAntes + 1);
      // (a vida segue: quem perdeu o emprego no ano não tem pasta para fechar)
      if (ramoDe16(v) !== 'direito') { vitorias++; acordos++; continue; }
      const julgado = v.oficio16!.itens.find(x => x.id === casos[1].id)!;
      expect(julgado.estado).toBe('resolvido');
      if (julgado.bom) vitorias++; else derrotas++;
      acordos += v.oficio16!.placar!.acordos;
      // A pasta do ano novo é outra; a reputação e o placar continuam.
      const nova = pastaDe16(v)!;
      expect(nova.ano).toBe(anoDe(v.t));
      expect(nova.placar).toEqual(v.oficio16!.placar);
      expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
    }
    expect(vitorias + derrotas).toBe(10);
    expect(vitorias).toBeGreaterThan(0);
    expect(acordos).toBe(10);
  });

  it('docência: a abordagem certa para a turma rende mais; o aluno ajudado pode reaparecer', () => {
    let somaBoa = 0, somaRuim = 0;
    for (let s = 1; s <= 16; s++) {
      for (const ab of ['reforco', 'tradicional'] as const) {
        let v = comEmprego(structuredClone(adulto(35, { semente: s })), 'professor_fund');
        const p = pastaDe16(v)!;
        for (const t of p.itens.filter(x => x.tipo === 'turma')) t.perfil = 'defasada';
        v.oficio16 = p;
        v = executar(v, { tipo: 'oficio16', oque: { op: 'abordagem', escolha: ab } }).vida;
        expect(podeTentar(disponibilidade(v, { tipo: 'oficio16', oque: { op: 'abordagem', escolha: 'projetos' } }))).toBe(false);
        const d0 = v.trabalho.atual!.desempenho;
        v = ano(v);
        const dd = (v.trabalho.atual?.desempenho ?? d0) - d0;
        if (ab === 'reforco') somaBoa += dd; else somaRuim += dd;
      }
    }
    expect(somaBoa).toBeGreaterThan(somaRuim);
  });

  it('tecnologia: o ritmo "prazo" acumula dívida técnica; "qualidade" paga', () => {
    let v = comEmprego(structuredClone(adulto(30, { semente: 3 })), 'dev_pleno');
    v = executar(v, { tipo: 'oficio16', oque: { op: 'ritmo', escolha: 'prazo' } }).vida;
    const d0 = v.oficio16!.divida!;
    v = ano(v);
    expect(v.oficio16!.divida!).toBeGreaterThan(d0);
    v = executar(v, { tipo: 'oficio16', oque: { op: 'ritmo', escolha: 'qualidade' } }).vida;
    const d1 = v.oficio16!.divida!;
    v = ano(v);
    expect(v.oficio16!.divida!).toBeLessThan(d1);
  });
});

describe('VIDA 16 · carreiras religiosas', () => {
  const comCrenca = (v: Vida, c: string) => { v.crenca14 = { ...crencaDe(v), atual: c as never, pratica: 'regular' }; return v; };

  it('cada tradição oferece os próprios caminhos; o sacerdócio católico respeita gênero e celibato', () => {
    const h = comCrenca(structuredClone(adulto(24, { genero: 'masculino' })), 'catolica');
    const caminhos = caminhosPossiveis16(h).map(x => x.t);
    expect(caminhos).toEqual(expect.arrayContaining(['catolica', 'catolica_diaconato', 'catolica_consagrada']));
    const m = comCrenca(structuredClone(adulto(24, { genero: 'feminino' })), 'catolica');
    expect(podeTentar(disponibilidade(m, { tipo: 'religiao16', oque: { op: 'entrar', tradicao: 'catolica' } }))).toBe(false);
    expect(TRADICOES16.catolica.etapas.some(e => e.id === 'papa')).toBe(true);
    expect(Object.entries(TRADICOES16).filter(([, t]) => t.etapas.some(e => e.id === 'papa')).map(([k]) => k)).toEqual(['catolica']);
  });

  it('candomblé: as obrigações têm custo e tempo; a liderança é abrir a casa ou a sucessão — não nomeação', () => {
    const T = TRADICOES16.candomble;
    expect(T.etapas.map(e => e.id)).toEqual(['abia', 'iao', 'ebomi', 'zelador']);
    expect(T.etapas.find(e => e.id === 'zelador')!.como).toBe('casa');
    expect(TRADICOES16.candomble_cargo.etapas.map(e => e.nome[1])).toContain('Equede confirmada');
  });

  it('uma carreira vivida: entrar, formar-se, subir por tempo; nomeação e eleição vêm (ou não) na virada; o save guarda', () => {
    let v = comCrenca(structuredClone(adulto(20, { genero: 'feminino', semente: 5 })), 'evangelica');
    const entrar = { tipo: 'religiao16' as const, oque: { op: 'entrar' as const, tradicao: 'evangelica' as const } };
    expect(podeTentar(disponibilidade(v, entrar))).toBe(true);
    v = executar(v, entrar).vida;
    expect(v.religiao16?.tradicao).toBe('evangelica');
    for (let k = 0; k < 14; k++) {
      for (const g of ['formar', 'servir', 'acolher'] as const) if (podeTentar(disponibilidade(v, { tipo: 'religiao16', oque: { op: 'gesto', g } }))) v = executar(v, { tipo: 'religiao16', oque: { op: 'gesto', g } }).vida;
      if (podeTentar(disponibilidade(v, { tipo: 'religiao16', oque: { op: 'avancar' } }))) v = executar(v, { tipo: 'religiao16', oque: { op: 'avancar' } }).vida;
      const q = v.religiao16?.questao;
      if (q) v = executar(v, { tipo: 'religiao16', oque: { op: 'questao', escolha: q.opcoes[0].id } }).vida;
      v = ano(v);
      if (v.morte || v.religiao16?.saiu) break;
    }
    const r = v.religiao16!;
    expect(r.etapa).toBeGreaterThanOrEqual(2);
    expect(r.historico.length).toBeGreaterThan(1);
    expect(etapaAtual16(r).nome[1]).toBeTruthy();
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo === 'ok' && l.vida.religiao16?.etapa).toBe(r.etapa);
  });

  it('com uma parceria, o caminho celibatário não começa; o diaconato permanente pede casamento', () => {
    const v = comCrenca(structuredClone(adulto(40, { genero: 'masculino' })), 'catolica');
    comParceiro(v, { genero: 'feminino', estagio: 'casamento' });
    expect(podeTentar(disponibilidade(v, { tipo: 'religiao16', oque: { op: 'entrar', tradicao: 'catolica' } }))).toBe(false);
    expect(podeTentar(disponibilidade(v, { tipo: 'religiao16', oque: { op: 'entrar', tradicao: 'catolica_diaconato' } }))).toBe(true);
  });
});
