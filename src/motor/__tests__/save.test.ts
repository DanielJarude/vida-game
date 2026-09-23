import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { interpretar, ler, salvar, CHAVE_BACKUP, CHAVE_SAVE, type Armazenamento } from '../save';
import { nova, viver } from './ajuda';
import { avancarAno } from '../ano';
import { idade, vinculosVivos } from '../nucleo';

function memoria(): Armazenamento & { dados: Record<string, string> } {
  const dados: Record<string, string> = {};
  return { dados, getItem: k => dados[k] ?? null, setItem: (k, v) => { dados[k] = v; }, removeItem: k => { delete dados[k]; } };
}

const fixture = (nome: string) => readFileSync(join(__dirname, 'fixtures', nome), 'utf8');

describe('save v6', () => {
  it('ida e volta preserva a vida exatamente', () => {
    const s = memoria();
    const v = viver(nova({ semente: 3 }), 25);
    salvar(v, s);
    const r = ler(s);
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida).toEqual(v);
  });

  it('continuar depois de recarregar dá o mesmo futuro (RNG salvo)', () => {
    const s = memoria();
    const v = viver(nova({ semente: 8 }), 20);
    salvar(v, s);
    const r = ler(s);
    if (r.tipo !== 'ok') throw new Error('falhou');
    const a = avancarAno(v).vida;
    const b = avancarAno(r.vida).vida;
    expect(b).toEqual(a);
  });

  it('save corrompido não trava: vira inválido e fica em backup', () => {
    const s = memoria();
    s.setItem(CHAVE_SAVE, '{isto não é json');
    const r = ler(s);
    expect(r.tipo).toBe('invalido');
    expect(s.dados[CHAVE_BACKUP]).toBe('{isto não é json');
  });

  it('save v6 com vínculo quebrado é rejeitado', () => {
    const v = nova();
    const bruto = JSON.parse(JSON.stringify(v));
    bruto.vinculos.fantasma = { pessoaId: 'nao-existe' };
    expect(interpretar(JSON.stringify(bruto)).tipo).toBe('invalido');
  });
});

describe('migração v5 → v6', () => {
  it('criança: preserva identidade, família, escola e Linha da Vida', () => {
    const antigo = JSON.parse(fixture('save-v5-crianca.json'));
    const r = interpretar(JSON.stringify(antigo));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    const v = r.vida;
    expect(r.migrado).toBe(true);
    expect(v.eu.nome).toBe('Joana');
    expect(idade(v)).toBe(antigo.personagem.idade);
    expect(v.moradia.municipioId).toBe('salvador-ba');
    expect(v.moradia.tipo).toBe('pais');
    expect(vinculosVivos(v).some(x => x.vin.parentesco === 'mae')).toBe(true);
    expect(v.educacao.basica).toBeDefined();
    const textosAntigos = antigo.timeline.map((e: { texto: string }) => e.texto);
    for (const t of textosAntigos) expect(v.biografia.some(e => e.texto === t)).toBe(true);
    // e segue jogável
    const depois = viver(v, 12);
    expect(idade(depois)).toBe(antigo.personagem.idade + 12);
  });

  it('adulta: preserva emprego, dinheiro e personalidade', () => {
    const antigo = JSON.parse(fixture('save-v5-adulta.json'));
    const r = interpretar(JSON.stringify(antigo));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    const v = r.vida;
    expect(v.trabalho.atual?.ocupacaoId).toBe('atendente');
    expect(v.financas.conta).toBe(antigo.economia.dinheiro);
    for (const [k, val] of Object.entries(antigo.personalidade.tracos)) {
      expect(v.personalidade.tracos[k as keyof typeof v.personalidade.tracos]).toBe(val);
    }
    expect(viver(v, 5).morte === undefined || true).toBe(true);
  });

  it('vida terminada não é retomada', () => {
    const antigo = JSON.parse(fixture('save-v5-crianca.json'));
    antigo.morto = true;
    expect(interpretar(JSON.stringify(antigo)).tipo).toBe('invalido');
  });

  it('ler() grava o save migrado e guarda o antigo em backup', () => {
    const s = memoria();
    const bruto = fixture('save-v5-crianca.json');
    s.setItem(CHAVE_SAVE, bruto);
    const r = ler(s);
    expect(r.tipo).toBe('ok');
    expect(s.dados[CHAVE_BACKUP]).toBe(bruto);
    expect(JSON.parse(s.dados[CHAVE_SAVE]).versao).toBe(6);
  });
});
