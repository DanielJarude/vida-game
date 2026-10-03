/**
 * Persistência da vida — a camada entre a interface e o armazenamento.
 *
 * O motor não sabe onde a vida fica: ele transforma texto em vida
 * (`interpretar`, `importarVida`) e vida em texto (`JSON.stringify`,
 * `exportarVida`). Quem lê e grava é esta camada, com uma API assíncrona
 * (carregar, salvar, apagar, backup, estatísticas) sobre o IndexedDB — e,
 * quando ele não existe ou falha (modo privado, navegador antigo, jsdom dos
 * testes), sobre o localStorage, que é o que o jogo sempre usou.
 *
 * Garantias:
 *   · fila: duas gravações nunca se cruzam; se várias chegam enquanto uma
 *     grava, só a última é escrita (a vida mais nova vence);
 *   · atomicidade: o save novo e a cópia do anterior entram na mesma
 *     transação (ver `armazens.ts`);
 *   · `aguardarGravacoes()`: espera a fila esvaziar — antes de atualizar o
 *     jogo (PWA) e quando a página é escondida ou fechada;
 *   · migração: na primeira vez com IndexedDB, o que estiver no localStorage
 *     (save, backup, estatísticas) é copiado para lá — validado antes, e a
 *     cópia do localStorage NÃO é apagada (fica como reserva por pelo menos
 *     uma versão; ver docs/notas/PWA-OFFLINE.md).
 */

import { abrirBanco, armazemIndexado, armazemLocal, CHAVES_LOCAIS, type Armazem, type Gaveta } from './armazens';

/** O que a interface precisa para abrir o jogo: os dois saves (o atual e o de antes) e o placar. */
export interface Carga {
  principal: string | null;
  anterior: string | null;
  estatisticas: string | null;
  /** Onde ficou guardado (para o diagnóstico e os testes). */
  armazem: Armazem['tipo'] | 'nenhum';
  /** O save do localStorage foi copiado agora e não abriu: o texto foi guardado no backup. */
  migracaoInvalida?: string;
}

/** Diz por que um save não abre (null = abre). É o motor quem sabe — a interface o passa para cá. */
export type Validador = (bruto: string) => string | null;

export interface OpcoesPersistencia {
  validar: Validador;
  /** Para os testes: um IndexedDB falso. Ausente, usa o do navegador (se houver). Null: sem IndexedDB. */
  indexedDB?: IDBFactory | null;
  /** Para os testes: outro localStorage (ou null, sem nenhum). */
  localStorage?: Storage | null;
  /** Pedir ao navegador que não apague os dados sozinho (padrão: sim, uma vez, em silêncio). */
  pedirPersistencia?: boolean;
}

function fabricaPadrao(): IDBFactory | null {
  try { return typeof indexedDB !== 'undefined' ? indexedDB : null; } catch { return null; }
}

function localPadrao(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

export class Persistencia {
  private readonly validar: Validador;
  private readonly local: Storage | null;
  /** O armazém escolhido; síncrono já no construtor quando não há IndexedDB. */
  private armazem: Armazem | null = null;
  private readonly pronto: Promise<Armazem | null>;
  private migracaoInvalida: string | undefined;
  /** As estatísticas em memória (o IndexedDB é assíncrono e a tela as lê a cada desenho). */
  private estatisticasEmMemoria: string | null = null;
  /** A fila: cada operação começa quando a anterior termina (com sucesso ou não). */
  private fila: Promise<unknown> = Promise.resolve();
  /** A gravação de save que ainda não começou — uma nova chegada só troca o texto dela. */
  private esperando: { bruto: string } | null = null;

  constructor(o: OpcoesPersistencia) {
    this.validar = o.validar;
    this.local = o.localStorage === undefined ? localPadrao() : o.localStorage;
    const fabrica = o.indexedDB === undefined ? fabricaPadrao() : o.indexedDB;
    if (!fabrica) {
      this.armazem = armazemLocal(this.local);
      this.pronto = Promise.resolve(this.armazem);
    } else {
      this.pronto = this.iniciar(fabrica);
    }
    this.fila = this.pronto;
    if (o.pedirPersistencia !== false) pedirPersistencia();
  }

  /** Abre o IndexedDB e migra o localStorage; qualquer falha cai no localStorage, sem barulho. */
  private async iniciar(fabrica: IDBFactory): Promise<Armazem | null> {
    try {
      const idb = armazemIndexado(await abrirBanco(fabrica));
      await this.migrar(idb);
      this.armazem = idb;
    } catch {
      this.armazem = armazemLocal(this.local);
    }
    return this.armazem;
  }

  /**
   * Primeira vez com IndexedDB: copia o save, o backup e as estatísticas do localStorage — só se o IndexedDB
   * ainda não tem save e a cópia nunca foi feita (a marca impede que uma vida já apagada volte). O save é
   * validado antes; um que não abre vai para o backup (não se perde) e a interface avisa.
   */
  private async migrar(idb: Armazem): Promise<void> {
    const meta = await idb.lerMeta?.();
    if (meta?.migradoDoLocalStorage) return;
    const ls = armazemLocal(this.local);
    const bruto = ls?.lerJa?.('principal') ?? null;
    const backup = ls?.lerJa?.('backup') ?? null;
    const estat = ls?.lerJa?.('estatisticas') ?? null;
    if (bruto === null && backup === null && estat === null) return;
    if (bruto !== null && (await idb.ler('principal')) === null) {
      const erro = this.validar(bruto);
      if (erro) { await idb.gravar('backup', bruto); this.migracaoInvalida = erro; }
      else await idb.gravarSave(bruto); // confirmado pela transação antes de seguir
    }
    if (backup !== null && (await idb.ler('backup')) === null && !this.migracaoInvalida) await idb.gravar('backup', backup);
    if (estat !== null && (await idb.ler('estatisticas')) === null) await idb.gravar('estatisticas', estat);
    // A marca vem por último: se algo acima falhar, a próxima abertura tenta de novo. O localStorage fica intacto.
    await idb.gravarMeta?.({ migradoDoLocalStorage: Date.now() });
  }

  /** Põe uma operação na fila (depois de tudo o que já está nela). */
  private enfileirar<T>(op: (a: Armazem) => Promise<T>): Promise<T> {
    const p = this.fila.then(async () => {
      const a = await this.pronto;
      if (!a) throw new Error('Sem armazenamento.');
      return op(a);
    });
    this.fila = p.catch(() => undefined);
    return p;
  }

  /** Lê tudo de uma vez — na hora, se o armazém é síncrono (null se não for). */
  carregarJa(): Carga | null {
    const a = this.armazem;
    if (!a?.sincrono || !a.lerJa) return null;
    const estatisticas = a.lerJa('estatisticas');
    this.estatisticasEmMemoria = estatisticas;
    return { principal: a.lerJa('principal'), anterior: a.lerJa('anterior'), estatisticas, armazem: a.tipo };
  }

  async carregar(): Promise<Carga> {
    return this.enfileirar(async a => {
      const [principal, anterior, estatisticas] = await Promise.all([a.ler('principal'), a.ler('anterior'), a.ler('estatisticas')]);
      this.estatisticasEmMemoria = estatisticas;
      const c: Carga = { principal, anterior, estatisticas, armazem: a.tipo };
      if (this.migracaoInvalida) { c.migracaoInvalida = this.migracaoInvalida; this.migracaoInvalida = undefined; }
      return c;
    }).catch((): Carga => ({ principal: null, anterior: null, estatisticas: null, armazem: 'nenhum' }));
  }

  /**
   * Salva o texto da vida. No armazém síncrono grava na hora (o localStorage já é serial); no IndexedDB entra
   * na fila — e, se já há um save esperando a vez, só troca o texto dele (a última vida vence, sem gravar as
   * do meio). Resolve com false se não deu para gravar.
   */
  salvar(bruto: string): Promise<boolean> {
    const a = this.armazem;
    if (a?.sincrono) return a.gravarSave(bruto).then(() => true, () => false);
    if (this.esperando) { this.esperando.bruto = bruto; return this.fila.then(() => this.ultimoResultado); }
    const vez = { bruto };
    this.esperando = vez;
    return this.enfileirar(async arm => {
      if (this.esperando === vez) this.esperando = null;
      await arm.gravarSave(vez.bruto);
    }).then(() => (this.ultimoResultado = true), () => (this.ultimoResultado = false));
  }
  private ultimoResultado = true;

  /** Apaga a vida salva (principal e anterior). A cópia antiga do localStorage vai junto: quem apagou não a quer de volta. */
  apagar(): Promise<void> {
    // Um save que ainda não começou não pode ser gravado DEPOIS do apagar: o apagar entra na fila atrás dele, e o
    // próximo save abre uma vez nova (atrás do apagar).
    this.esperando = null;
    const a = this.armazem;
    if (a?.sincrono) return a.apagarSave();
    return this.enfileirar(async arm => {
      await arm.apagarSave();
      try { this.local?.removeItem(CHAVES_LOCAIS.principal); this.local?.removeItem(CHAVES_LOCAIS.anterior); } catch { /* sem localStorage */ }
    }).catch(() => undefined);
  }

  /** Guarda um texto no backup (um save que não abriu, ou o original de um save migrado de versão). */
  guardarBackup(bruto: string): Promise<void> {
    return this.gravarGaveta('backup', bruto);
  }

  /** As estatísticas como estão agora (lidas na carga; atualizadas por `salvarEstatisticas`). */
  estatisticas(): string | null {
    const a = this.armazem;
    if (a?.sincrono && a.lerJa) return a.lerJa('estatisticas');
    return this.estatisticasEmMemoria;
  }

  salvarEstatisticas(bruto: string): Promise<void> {
    this.estatisticasEmMemoria = bruto;
    return this.gravarGaveta('estatisticas', bruto);
  }

  private gravarGaveta(g: Gaveta, bruto: string | null): Promise<void> {
    const a = this.armazem;
    if (a?.sincrono) return a.gravar(g, bruto).catch(() => undefined);
    return this.enfileirar(arm => arm.gravar(g, bruto)).catch(() => undefined);
  }

  /** Espera tudo o que está na fila ser gravado (ou falhar). Nunca rejeita. */
  async aguardarGravacoes(): Promise<void> {
    // Uma operação pode entrar na fila enquanto esperamos: espera até ela parar de mudar.
    let f: Promise<unknown>;
    do { f = this.fila; await f.catch(() => undefined); } while (f !== this.fila);
  }

  /** Para os testes e o diagnóstico. */
  async tipoDeArmazem(): Promise<Armazem['tipo'] | 'nenhum'> {
    return (await this.pronto)?.tipo ?? 'nenhum';
  }
}

/** Pede, uma vez e em silêncio, que o navegador não despeje os dados do jogo quando faltar espaço. */
let persistenciaPedida = false;
function pedirPersistencia(): void {
  if (persistenciaPedida) return;
  persistenciaPedida = true;
  try {
    const st = typeof navigator !== 'undefined' ? navigator.storage : undefined;
    if (!st?.persist || !st.persisted) return;
    void st.persisted().then(ja => (ja ? true : st.persist())).catch(() => undefined);
  } catch { /* sem a API */ }
}

/* --------------------------------------------------------------- A do jogo */

let unica: Persistencia | null = null;

/**
 * A persistência do jogo (uma só por página). Criada quando o motor chega — é ele quem valida. Ao esconder
 * ou fechar a página, espera as gravações pendentes (o navegador costuma dar esse tempo).
 */
export function persistenciaDoJogo(validar: Validador): Persistencia {
  if (unica) return unica;
  const p = new Persistencia({ validar });
  unica = p;
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    const esvaziar = () => { void p.aguardarGravacoes(); };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') esvaziar(); });
    window.addEventListener('pagehide', esvaziar);
  }
  return p;
}

/** A persistência já criada (ou null, se o motor ainda não chegou): para quem só precisa esperar as gravações. */
export const persistenciaAtual = (): Persistencia | null => unica;

/** Espera as gravações pendentes do jogo (antes de atualizar a versão, por exemplo). */
export function aguardarGravacoes(): Promise<void> {
  return unica ? unica.aguardarGravacoes() : Promise.resolve();
}
