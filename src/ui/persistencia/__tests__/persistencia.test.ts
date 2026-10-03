/**
 * A camada de persistência (PWA): IndexedDB de verdade (fake-indexeddb, a
 * mesma API do navegador, em memória), a reserva no localStorage, a migração
 * do localStorage v19, a gravação interrompida, a recuperação do save
 * anterior e a fila.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { Persistencia } from '../index';
import { CHAVES_LOCAIS } from '../armazens';
import { abrirSalva } from '../abrir';
import { CHAVE_BACKUP, CHAVE_ESTATISTICAS, CHAVE_SAVE, interpretar, VERSAO_SAVE } from '../../../motor/save';
import { nova } from '../../../motor/__tests__/ajuda';
import type { Vida } from '../../../motor/tipos';

/** Um localStorage em memória (o Node não tem um). */
class Local implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
}

const validar = (b: string) => { const r = interpretar(b); return r.tipo === 'invalido' ? r.motivo : null; };
const VIDA = nova();
/** Duas vidas diferentes (o mesmo nascimento, um nome diferente) — saves válidos de verdade. */
const vida = (nome: string): string => JSON.stringify({ ...VIDA, eu: { ...VIDA.eu, nome } } satisfies Vida);
const nomeDe = (bruto: string | null) => bruto === null ? null : (JSON.parse(bruto) as Vida).eu.nome;

function criar(o: { idb?: IDBFactory | null; local?: Storage | null } = {}) {
  return new Persistencia({ validar, indexedDB: o.idb === undefined ? new IDBFactory() : o.idb, localStorage: o.local === undefined ? new Local() : o.local, pedirPersistencia: false });
}

afterEach(() => vi.restoreAllMocks());

describe('chaves', () => {
  it('as chaves do localStorage são as do motor (os saves de antes continuam sendo achados)', () => {
    expect(CHAVES_LOCAIS.principal).toBe(CHAVE_SAVE);
    expect(CHAVES_LOCAIS.backup).toBe(CHAVE_BACKUP);
    expect(CHAVES_LOCAIS.estatisticas).toBe(CHAVE_ESTATISTICAS);
  });
});

describe('IndexedDB', () => {
  it('salva e carrega; o save de antes fica no anterior; o localStorage não é tocado', async () => {
    const idb = new IDBFactory();
    const local = new Local();
    const p = criar({ idb, local });
    expect(await p.tipoDeArmazem()).toBe('indexeddb');
    expect(p.carregarJa()).toBeNull(); // assíncrono: nada na hora
    expect(await p.salvar(vida('Ana'))).toBe(true);
    expect(await p.salvar(vida('Bia'))).toBe(true);
    // Outra abertura (como uma página recarregada) lê do disco, não da memória.
    const c = await criar({ idb, local }).carregar();
    expect(c.armazem).toBe('indexeddb');
    expect(nomeDe(c.principal)).toBe('Bia');
    expect(nomeDe(c.anterior)).toBe('Ana');
    expect(local.length).toBe(0);
  });

  it('apagar leva o principal e o anterior; estatísticas e backup ficam', async () => {
    const idb = new IDBFactory();
    const p = criar({ idb });
    await p.salvar(vida('Ana'));
    await p.salvar(vida('Bia'));
    await p.salvarEstatisticas('{"vidasJogadas":3}');
    await p.guardarBackup('lixo');
    await p.apagar();
    const c = await criar({ idb }).carregar();
    expect(c.principal).toBeNull();
    expect(c.anterior).toBeNull();
    expect(c.estatisticas).toBe('{"vidasJogadas":3}');
  });

  it('gravação interrompida no meio da transação: o principal e o anterior de antes continuam lá', async () => {
    const idb = new IDBFactory();
    const p = criar({ idb });
    await p.salvar(vida('Ana'));
    await p.salvar(vida('Bia'));
    // A cópia para o anterior entra na transação; a gravação do principal falha (disco cheio, aba fechada...).
    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, valor: unknown, chave?: IDBValidKey) {
      if (chave === 'principal') throw new DOMException('Sem espaço', 'QuotaExceededError');
      return put.call(this, valor, chave);
    });
    expect(await p.salvar(vida('Cris'))).toBe(false);
    vi.restoreAllMocks();
    const c = await criar({ idb }).carregar();
    expect(nomeDe(c.principal)).toBe('Bia');
    expect(nomeDe(c.anterior)).toBe('Ana'); // a cópia do meio foi desfeita junto
    // E o jogo segue gravando normalmente depois.
    expect(await p.salvar(vida('Duda'))).toBe(true);
    expect(nomeDe((await criar({ idb }).carregar()).principal)).toBe('Duda');
  });

  it('principal corrompido: abre o anterior, e o texto danificado vai para o backup', async () => {
    const idb = new IDBFactory();
    const p = criar({ idb });
    await p.salvar(vida('Ana'));
    await p.salvar('{"versao": 19, "eu": {"nome": "trunc'); // uma gravação que chegou pela metade
    const c = await criar({ idb }).carregar();
    const r = abrirSalva(c, interpretar);
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    expect(r.recuperado).toBe(true);
    expect(r.vida.eu.nome).toBe('Ana');
    expect(r.descartado).toContain('trunc');
    // Sem anterior bom, é inválido — com o texto para o backup, nunca descartado em silêncio.
    expect(abrirSalva({ principal: '{x', anterior: null }, interpretar)).toMatchObject({ tipo: 'invalido', descartado: '{x' });
    expect(abrirSalva({ principal: null, anterior: null }, interpretar)).toEqual({ tipo: 'vazio' });
  });

  it('fila: gravações seguidas não se cruzam e a última vence', async () => {
    const idb = new IDBFactory();
    const p = criar({ idb });
    await p.salvar(vida('Ana'));
    const gravados: string[] = [];
    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, valor: unknown, chave?: IDBValidKey) {
      if (chave === 'principal') gravados.push(nomeDe((valor as { bruto: string }).bruto)!);
      return put.call(this, valor, chave);
    });
    const promessas = ['B1', 'B2', 'B3', 'B4', 'B5'].map(n => p.salvar(vida(n)));
    expect(await Promise.all(promessas)).toEqual([true, true, true, true, true]);
    // As do meio, que nunca chegaram a gravar, foram trocadas pela mais nova: a ordem se mantém e a última é a que fica.
    expect(gravados[gravados.length - 1]).toBe('B5');
    expect(gravados.length).toBeLessThan(5);
    const ordem = ['B1', 'B2', 'B3', 'B4', 'B5'];
    expect([...gravados].sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b))).toEqual(gravados);
    expect(nomeDe((await criar({ idb }).carregar()).principal)).toBe('B5');
  });

  it('fila: apagar entre dois saves respeita a ordem (nada gravado antes volta depois)', async () => {
    const idb = new IDBFactory();
    const p = criar({ idb });
    void p.salvar(vida('Ana'));
    void p.apagar();
    void p.salvar(vida('Bia'));
    await p.aguardarGravacoes();
    expect(nomeDe((await criar({ idb }).carregar()).principal)).toBe('Bia');
    void p.salvar(vida('Cris'));
    void p.apagar();
    await p.aguardarGravacoes();
    expect((await criar({ idb }).carregar()).principal).toBeNull();
  });

  it('aguardarGravacoes: quando resolve, o que foi pedido já está no disco', async () => {
    const idb = new IDBFactory();
    const p = criar({ idb });
    void p.salvar(vida('Ana'));
    void p.salvarEstatisticas('{"vidasJogadas":1}');
    await p.aguardarGravacoes();
    const c = await criar({ idb }).carregar();
    expect(nomeDe(c.principal)).toBe('Ana');
    expect(c.estatisticas).toBe('{"vidasJogadas":1}');
  });
});

describe('migração do localStorage (saves v19 de antes do PWA)', () => {
  function localComSave() {
    const local = new Local();
    local.setItem(CHAVE_SAVE, vida('Ana'));
    local.setItem(CHAVE_BACKUP, 'um backup antigo');
    local.setItem(CHAVE_ESTATISTICAS, '{"vidasJogadas":2}');
    return local;
  }

  it('copia save, backup e estatísticas para o IndexedDB e mantém a cópia do localStorage', async () => {
    expect(JSON.parse(vida('Ana')).versao).toBe(VERSAO_SAVE);
    const idb = new IDBFactory();
    const local = localComSave();
    const c = await criar({ idb, local }).carregar();
    expect(c.armazem).toBe('indexeddb');
    expect(nomeDe(c.principal)).toBe('Ana');
    expect(c.estatisticas).toBe('{"vidasJogadas":2}');
    expect(c.migracaoInvalida).toBeUndefined();
    // A reserva fica: nada foi apagado do localStorage.
    expect(nomeDe(local.getItem(CHAVE_SAVE))).toBe('Ana');
    expect(local.getItem(CHAVE_BACKUP)).toBe('um backup antigo');
  });

  it('migra uma vez só: depois, o IndexedDB manda (e uma vida apagada não volta do localStorage)', async () => {
    const idb = new IDBFactory();
    const local = localComSave();
    const p = criar({ idb, local });
    await p.carregar();
    await p.salvar(vida('Bia'));
    expect(nomeDe((await criar({ idb, local }).carregar()).principal)).toBe('Bia');
    await p.apagar();
    // O apagar leva a cópia antiga junto; e, mesmo que ela estivesse lá, a marca impede uma segunda cópia.
    expect(local.getItem(CHAVE_SAVE)).toBeNull();
    local.setItem(CHAVE_SAVE, vida('Antiga'));
    expect((await criar({ idb, local }).carregar()).principal).toBeNull();
  });

  it('não sobrescreve um save que o IndexedDB já tem', async () => {
    const idb = new IDBFactory();
    await criar({ idb, local: new Local() }).salvar(vida('Nova'));
    const c = await criar({ idb, local: localComSave() }).carregar();
    expect(nomeDe(c.principal)).toBe('Nova');
  });

  it('um save do localStorage que não abre vai para o backup e a interface é avisada', async () => {
    const idb = new IDBFactory();
    const local = new Local();
    local.setItem(CHAVE_SAVE, '{"versao":19,"quebrado":true}');
    const c = await criar({ idb, local }).carregar();
    expect(c.principal).toBeNull();
    expect(c.migracaoInvalida).toBeTruthy();
    expect(local.getItem(CHAVE_SAVE)).toBe('{"versao":19,"quebrado":true}');
  });
});

describe('reserva no localStorage (sem IndexedDB: modo privado, navegador antigo, jsdom)', () => {
  it('sem IndexedDB, usa o localStorage — síncrono, com as mesmas chaves de sempre', async () => {
    const local = new Local();
    local.setItem(CHAVE_SAVE, vida('Ana'));
    const p = criar({ idb: null, local });
    expect(await p.tipoDeArmazem()).toBe('localstorage');
    const ja = p.carregarJa();
    expect(nomeDe(ja!.principal)).toBe('Ana');
    // Grava na hora (antes de qualquer await): quem lê o localStorage logo depois já vê.
    void p.salvar(vida('Bia'));
    expect(nomeDe(local.getItem(CHAVE_SAVE))).toBe('Bia');
    expect(nomeDe(local.getItem(CHAVES_LOCAIS.anterior))).toBe('Ana');
    await p.apagar();
    expect(local.getItem(CHAVE_SAVE)).toBeNull();
  });

  it('IndexedDB que falha ao abrir: cai no localStorage, sem erro', async () => {
    const quebrado = { open() { throw new Error('SecurityError'); } } as unknown as IDBFactory;
    const local = new Local();
    local.setItem(CHAVE_SAVE, vida('Ana'));
    const p = criar({ idb: quebrado, local });
    const c = await p.carregar();
    expect(c.armazem).toBe('localstorage');
    expect(nomeDe(c.principal)).toBe('Ana');
    expect(await p.salvar(vida('Bia'))).toBe(true);
    expect(nomeDe(local.getItem(CHAVE_SAVE))).toBe('Bia');
  });

  it('sem espaço para o anterior, abre mão dele — o principal novo entra', async () => {
    const local = new Local();
    local.setItem(CHAVE_SAVE, vida('Ana'));
    const set = local.setItem.bind(local);
    local.setItem = (k: string, v: string) => { if (k === CHAVES_LOCAIS.anterior) throw new DOMException('cheio', 'QuotaExceededError'); set(k, v); };
    const p = criar({ idb: null, local });
    expect(await p.salvar(vida('Bia'))).toBe(true);
    expect(nomeDe(local.getItem(CHAVE_SAVE))).toBe('Bia');
    expect(local.getItem(CHAVES_LOCAIS.anterior)).toBeNull();
  });

  it('sem armazenamento nenhum: carrega vazio e salvar diz que não deu', async () => {
    const p = criar({ idb: null, local: null });
    expect((await p.carregar()).principal).toBeNull();
    expect(await p.salvar(vida('Ana'))).toBe(false);
  });
});
