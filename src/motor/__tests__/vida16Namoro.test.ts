/** VIDA 16 · namoro com alguém em casa (sem bloqueio; rastro e descoberta contextuais), Mensagens (histórico, escrever) e Pede atenção (situação, não cópia). */
import { describe, expect, it } from 'vitest';
import { adulto, pessoaNova, comParceiro } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { vincular } from '../pessoas';
import { matches15, processarCelular15 } from '../v15/celular/celular15';
import { chanceDeDescobrir16, deixarRastro16 } from '../v16/romance/namoro16';
import { contatos16, historico16 } from '../v16/celular/mensagens16';
import { sinaisSociais } from '../../ui/leitura';
import { parceiro } from '../nucleo';
import type { Vida } from '../tipos';

function comMatches(semente: number, estado: 'solteiro' | 'namoro' | 'casamento' | 'aberto'): Vida {
  let v = structuredClone(adulto(29, { semente }));
  v.eu.atracao = 'mulheres';
  for (const vin of Object.values(v.vinculos)) if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined;
  if (estado !== 'solteiro') {
    const par = comParceiro(v, { genero: 'feminino', estagio: estado === 'aberto' ? 'casamento' : estado });
    if (estado === 'aberto') par.vin.romance!.acordo = 'aberto';
  }
  v = executar(v, { tipo: 'celular15', oque: { op: 'namoro_abrir' } }).vida;
  for (const pf of v.celular15!.deck!.perfis.slice(0, 6)) {
    if (matches15(v).length >= 3) break;
    v = executar(v, { tipo: 'celular15', oque: { op: 'curtir', pid: pf.pessoa.id } }).vida;
  }
  return v;
}

describe('VIDA 16 · o aplicativo de namoro em qualquer estado civil', () => {
  for (const estado of ['solteiro', 'namoro', 'casamento', 'aberto'] as const) {
    it(`${estado}: ver, curtir, dar match, conversar e marcar encontro — nada bloqueado`, () => {
      let conversou = 0, encontrou = 0;
      for (let s = 1; s <= 12; s++) {
        let v = comMatches(s, estado);
        expect(podeTentar(disponibilidade(v, { tipo: 'celular15', oque: { op: 'namoro_abrir' } }))).toBe(true);
        for (const m of matches15(v)) {
          const d = disponibilidade(v, { tipo: 'pessoa', pessoaId: m.p.id, interacao: 'app_conversar' });
          expect(podeTentar(d)).toBe(true);
          // (uma descoberta pode ter terminado a relação no meio do caminho: aí, já não há aviso)
          if ((estado === 'namoro' || estado === 'casamento') && parceiro(v)) expect(d.grau).toBe('irregular');
          v = executar(v, { tipo: 'pessoa', pessoaId: m.p.id, interacao: 'app_conversar' }).vida;
          if (v.vinculos[m.p.id].contexto?.etapa === 'conversa') {
            conversou++;
            if (podeTentar(disponibilidade(v, { tipo: 'pessoa', pessoaId: m.p.id, interacao: 'app_encontro' }))) {
              v = executar(v, { tipo: 'pessoa', pessoaId: m.p.id, interacao: 'app_encontro' }).vida;
              encontrou++;
            }
          }
        }
        expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
      }
      expect(conversou).toBeGreaterThan(0);
      expect(encontrou).toBeGreaterThan(0);
    });
  }

  it('com parceria exclusiva, o encontro que engata vira caso escondido; num acordo aberto, não há rastro', () => {
    let casos = 0;
    for (let s = 1; s <= 40; s++) {
      let v = comMatches(s, 'casamento');
      for (const m of matches15(v)) {
        v = executar(v, { tipo: 'pessoa', pessoaId: m.p.id, interacao: 'app_conversar' }).vida;
        if (v.vinculos[m.p.id].contexto?.etapa !== 'conversa') continue;
        v = executar(v, { tipo: 'pessoa', pessoaId: m.p.id, interacao: 'app_encontro' }).vida;
        if (v.vinculos[m.p.id].romance?.secreto) casos++;
      }
    }
    expect(casos).toBeGreaterThan(0);
    const a = comMatches(3, 'aberto');
    expect(a.celular15!.rastro16).toBeUndefined();
  });

  it('a chance de descobrir depende do que foi feito, do jeito da parceria e de morar junto', () => {
    const v = structuredClone(adulto(30, { semente: 2 }));
    const par = comParceiro(v, { genero: 'feminino' });
    const perfil = chanceDeDescobrir16(v, par, 'perfil');
    const encontro = chanceDeDescobrir16(v, par, 'encontro');
    expect(encontro).toBeGreaterThan(perfil);
    const longe = { ...par, vin: { ...par.vin, convivio: [] as typeof par.vin.convivio } };
    expect(chanceDeDescobrir16(v, longe, 'encontro')).toBeLessThan(encontro);
    const confiante = { ...par, vin: { ...par.vin, confianca: 90 } };
    const desconfiada = { ...par, vin: { ...par.vin, confianca: 20 } };
    expect(chanceDeDescobrir16(v, desconfiada, 'encontro')).toBeGreaterThan(chanceDeDescobrir16(v, confiante, 'encontro'));
  });

  it('a descoberta tem desfechos graduados — nem toda descoberta termina, e nem tudo é descoberto', () => {
    const desfechos: Record<string, number> = {};
    let semNada = 0;
    const base = structuredClone(adulto(30, { semente: 1 }));
    for (let s = 1; s <= 300; s++) {
      const v = structuredClone(base);
      v.id = `${base.id}_${s}`;
      const par = comParceiro(v, { genero: 'feminino' });
      const outra = pessoaNova(v, 29, 'feminino');
      vincular(v, outra, { origem: 'online', proximidade: 30 });
      const x = deixarRastro16(v, s % 3 === 0 ? 'encontro' : s % 3 === 1 ? 'mensagens' : 'perfil', outra.id);
      if (!x.desfecho) { semNada++; expect(par.vin.confianca).toBe(v.vinculos[par.p.id].confianca); continue; }
      desfechos[x.desfecho] = (desfechos[x.desfecho] ?? 0) + 1;
      expect(x.texto).toMatch(new RegExp(par.p.nome));
      if (x.desfecho === 'termino') expect(parceiro(v)).toBeUndefined();
      else expect(parceiro(v)?.p.id).toBe(par.p.id);
    }
    expect(semNada).toBeGreaterThan(150);
    expect(Object.keys(desfechos).length).toBeGreaterThanOrEqual(3);
    expect((desfechos.termino ?? 0)).toBeLessThan(Object.values(desfechos).reduce((a, b) => a + b, 0) / 2);
  });
});

describe('VIDA 16 · Mensagens e Pede atenção', () => {
  it('escrever para alguém: a mensagem vai, a resposta vem, fica na conversa; uma por pessoa por ano', () => {
    let v = structuredClone(adulto(30, { semente: 4 }));
    const p = pessoaNova(v, 31, 'feminino');
    const vin = vincular(v, p, { origem: 'escola', proximidade: 62, estagio: 'amigo_proximo' });
    vin.tUltimoContato = v.t - 20;
    const c = contatos16(v).find(x => x.p.id === p.id)!;
    expect(c.intencoes).toContain('saudade');
    const a = { tipo: 'celular15' as const, oque: { op: 'escrever' as const, pid: p.id, intencao: 'saudade' as const } };
    expect(podeTentar(disponibilidade(v, a))).toBe(true);
    v = executar(v, a).vida;
    const fio = historico16(v).filter(x => x.m.de === p.id);
    expect(fio.length).toBeGreaterThanOrEqual(1);
    expect(fio[0].m.tipo).toBe('escrita');
    expect(fio[0].m.resposta?.texto.length).toBeGreaterThan(3);
    expect(v.vinculos[p.id].tUltimoContato).toBe(v.t);
    expect(podeTentar(disponibilidade(v, a))).toBe(false);
  });

  it('o histórico guarda o que sai do ano (e os chamados respondidos), com a resposta', () => {
    const v = structuredClone(adulto(28, { semente: 6 }));
    for (let k = 0; k < 6; k++) { const p = pessoaNova(v, 27 + k, k % 2 ? 'feminino' : 'masculino'); const vin = vincular(v, p, { origem: 'trabalho', proximidade: 60, estagio: 'amigo' }); vin.tUltimoContato = v.t - 30; }
    v.t += 12; processarCelular15(v);
    const antes = v.celular15!.msgs.length;
    v.t += 24; processarCelular15(v);
    v.t += 12; processarCelular15(v);
    expect((v.celular15!.arquivo16 ?? []).length).toBeGreaterThanOrEqual(antes);
    expect(historico16(v).length).toBeGreaterThanOrEqual(antes);
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo === 'ok' && (l.vida.celular15!.arquivo16 ?? []).length).toBe((v.celular15!.arquivo16 ?? []).length);
  });

  it('Pede atenção diz a situação, não repete a mensagem do chamado', () => {
    const v = structuredClone(adulto(30, { semente: 8 }));
    const p = pessoaNova(v, 30, 'masculino');
    const vin = vincular(v, p, { origem: 'escola', proximidade: 70, estagio: 'amigo_proximo' });
    vin.chamado = { tipo: 'reclamacao', t: v.t, texto: `"Você sumiu, hein? Nem lembra mais de mim."` };
    const s = sinaisSociais(v, 6).find(x => x.pessoaId === p.id)!;
    expect(s.texto).not.toBe(vin.chamado.texto);
    expect(s.texto).toMatch(/falta/);
    expect(s.noCelular).toBe(true);
    expect(s.porque).toBeTruthy();
  });
});
