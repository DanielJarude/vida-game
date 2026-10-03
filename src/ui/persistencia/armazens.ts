/**
 * Onde a vida fica guardada: IndexedDB (o principal) ou localStorage (a reserva).
 *
 * Os dois falam a mesma língua — `Armazem` — e só guardam TEXTO: o save cru,
 * do jeito que o motor o serializa. Ler, validar e migrar continua sendo do
 * motor (`interpretar`); aqui não se sabe o que é uma vida.
 *
 * Gavetas:
 *   principal    — o save atual;
 *   anterior     — o save bom de antes da última gravação (recuperação);
 *   backup       — um save que não abriu ou que veio de versão antiga (nunca se perde);
 *   estatisticas — as vidas passadas (o placar global).
 *
 * A gravação do save é ATÔMICA no IndexedDB: uma transação só copia o
 * principal para o anterior e grava o novo principal — se ela cair no meio, o
 * navegador desfaz tudo e os dois saves de antes continuam lá.
 */

export type Gaveta = 'principal' | 'anterior' | 'backup' | 'estatisticas';

/**
 * As chaves do localStorage. São as MESMAS do motor (`save.ts`: CHAVE_SAVE, CHAVE_BACKUP,
 * CHAVE_ESTATISTICAS) — repetidas aqui de propósito, para a interface não puxar o pacote do motor só por três
 * textos. Um teste confere que não se separaram.
 */
export const CHAVES_LOCAIS: Record<Gaveta, string> = {
  principal: 'VIDA_GAME_SAVE_V1',
  anterior: 'VIDA_GAME_SAVE_ANTERIOR',
  backup: 'VIDA_GAME_SAVE_BACKUP',
  estatisticas: 'VIDA_GLOBAL_STATS_V1'
};

export interface Armazem {
  readonly tipo: 'indexeddb' | 'localstorage';
  /** Síncrono (o localStorage): dá para ler na hora, sem esperar — a primeira tela abre já com a vida salva. */
  readonly sincrono: boolean;
  ler(g: Gaveta): Promise<string | null>;
  /** Só nos síncronos. */
  lerJa?(g: Gaveta): string | null;
  /** Grava o save: o principal de agora vira o anterior, o novo vira o principal — tudo ou nada. */
  gravarSave(bruto: string): Promise<void>;
  /** Grava (ou apaga, com null) uma gaveta qualquer. */
  gravar(g: Gaveta, bruto: string | null): Promise<void>;
  /** Apaga a vida (principal e anterior); o backup e as estatísticas ficam. */
  apagarSave(): Promise<void>;
  /** Marca de migração (só o IndexedDB tem). */
  lerMeta?(): Promise<Meta | null>;
  gravarMeta?(m: Meta): Promise<void>;
}

export interface Meta {
  /** Quando os dados do localStorage foram copiados para cá (nunca se copiam de novo). */
  migradoDoLocalStorage?: number;
}

/* ------------------------------------------------------------ localStorage */

function localDisponivel(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/**
 * A reserva: síncrona, pequena (uns 5 MB por origem) e sem transação. A ordem
 * da gravação compensa: o anterior é escrito ANTES do principal, e um
 * `setItem` que falha não mexe no valor que já estava lá — o principal de
 * antes só some quando o novo já entrou. Se faltar espaço, o anterior é
 * sacrificado primeiro (a vida de agora importa mais que a de um ano atrás).
 */
export function armazemLocal(s: Storage | null = localDisponivel()): Armazem | null {
  if (!s) return null;
  const lerJa = (g: Gaveta): string | null => { try { return s.getItem(CHAVES_LOCAIS[g]); } catch { return null; } };
  return {
    tipo: 'localstorage',
    sincrono: true,
    lerJa,
    ler: async g => lerJa(g),
    async gravarSave(bruto) {
      const atual = lerJa('principal');
      if (atual !== null && atual !== bruto) {
        try { s.setItem(CHAVES_LOCAIS.anterior, atual); } catch { try { s.removeItem(CHAVES_LOCAIS.anterior); } catch { /* segue */ } }
      }
      try {
        s.setItem(CHAVES_LOCAIS.principal, bruto);
      } catch {
        // Sem espaço: abre mão do anterior e tenta de novo uma vez.
        try { s.removeItem(CHAVES_LOCAIS.anterior); } catch { /* segue */ }
        s.setItem(CHAVES_LOCAIS.principal, bruto);
      }
    },
    async gravar(g, bruto) {
      if (bruto === null) s.removeItem(CHAVES_LOCAIS[g]);
      else s.setItem(CHAVES_LOCAIS[g], bruto);
    },
    async apagarSave() {
      try { s.removeItem(CHAVES_LOCAIS.principal); s.removeItem(CHAVES_LOCAIS.anterior); } catch { /* sem armazenamento */ }
    }
  };
}

/* --------------------------------------------------------------- IndexedDB */

export const NOME_BANCO = 'VIDA';
const VERSAO_BANCO = 1;
const LOJA = 'gavetas';

/** O registro de cada gaveta: o texto e quando foi gravado (para diagnóstico; ninguém decide nada por ele). */
interface Registro { bruto: string; em: number }

const pedido = <T>(r: IDBRequest<T>): Promise<T> => new Promise((ok, falha) => {
  r.onsuccess = () => ok(r.result);
  r.onerror = () => falha(r.error ?? new Error('IndexedDB'));
});

/** A transação inteira: resolve quando o navegador confirma (complete), falha se ela abortar. */
const concluida = (tx: IDBTransaction): Promise<void> => new Promise((ok, falha) => {
  tx.oncomplete = () => ok();
  tx.onabort = () => falha(tx.error ?? new Error('Transação abortada.'));
  tx.onerror = () => falha(tx.error ?? new Error('Transação falhou.'));
});

/**
 * Abre o banco. Alguns navegadores travam o `open` sem responder (Safari antigo,
 * modos privados): passado o prazo, desiste e a interface cai no localStorage.
 */
export function abrirBanco(fabrica: IDBFactory, prazoMs = 4000): Promise<IDBDatabase> {
  return new Promise((ok, falha) => {
    let resolvido = false;
    const prazo = setTimeout(() => { if (!resolvido) { resolvido = true; falha(new Error('IndexedDB não respondeu.')); } }, prazoMs);
    let r: IDBOpenDBRequest;
    try { r = fabrica.open(NOME_BANCO, VERSAO_BANCO); } catch (e) { clearTimeout(prazo); falha(e); return; }
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(LOJA)) r.result.createObjectStore(LOJA); };
    r.onsuccess = () => {
      clearTimeout(prazo);
      if (resolvido) { r.result.close(); return; }
      resolvido = true;
      // Outra aba com versão nova do banco pede passagem: fecha esta conexão em vez de travar a outra.
      r.result.onversionchange = () => r.result.close();
      ok(r.result);
    };
    r.onerror = () => { clearTimeout(prazo); if (!resolvido) { resolvido = true; falha(r.error ?? new Error('IndexedDB')); } };
    r.onblocked = () => { /* espera a outra aba soltar — o prazo cuida do pior caso */ };
  });
}

export function armazemIndexado(db: IDBDatabase): Armazem {
  // `durability: 'strict'`: a transação só se diz concluída depois de o navegador gravar em disco
  // (o padrão 'relaxed' pode confirmar antes). Um save por ano vivido — a pressa não vale o risco.
  const tx = (modo: IDBTransactionMode) => db.transaction(LOJA, modo, modo === 'readwrite' ? { durability: 'strict' } : undefined);
  const lerRegistro = async (chave: string): Promise<unknown> => pedido(tx('readonly').objectStore(LOJA).get(chave));
  const confirmar = (t: IDBTransaction) => { try { t.commit?.(); } catch { /* já concluída */ } };
  /** Grava numa transação; se uma operação lançar no meio, aborta (nada do que veio antes fica). */
  const escrever = (operar: (loja: IDBObjectStore) => void): Promise<void> => {
    const t = tx('readwrite');
    const fim = concluida(t);
    try { operar(t.objectStore(LOJA)); confirmar(t); } catch (e) { try { t.abort(); } catch { /* já abortada */ } return fim.then(() => { throw e; }, () => { throw e; }); }
    return fim;
  };
  return {
    tipo: 'indexeddb',
    sincrono: false,
    async ler(g) {
      const r = await lerRegistro(g) as Registro | undefined;
      return r && typeof r.bruto === 'string' ? r.bruto : null;
    },
    gravarSave(bruto) {
      const t = tx('readwrite');
      const fim = concluida(t);
      try {
        const loja = t.objectStore(LOJA);
        const atual = loja.get('principal');
        // Ler e escrever na MESMA transação: ninguém grava entre a cópia para o anterior e o novo principal.
        atual.onsuccess = () => {
          try {
            const antes = atual.result as Registro | undefined;
            if (antes && antes.bruto !== bruto) loja.put(antes, 'anterior');
            loja.put({ bruto, em: Date.now() } satisfies Registro, 'principal');
            confirmar(t);
          } catch (e) {
            try { t.abort(); } catch { /* já abortada */ }
            void e;
          }
        };
      } catch (e) {
        try { t.abort(); } catch { /* já abortada */ }
        return fim.then(() => { throw e; }, () => { throw e; });
      }
      return fim;
    },
    gravar(g, bruto) {
      return escrever(loja => { if (bruto === null) loja.delete(g); else loja.put({ bruto, em: Date.now() } satisfies Registro, g); });
    },
    apagarSave() {
      return escrever(loja => { loja.delete('principal'); loja.delete('anterior'); });
    },
    async lerMeta() {
      const m = await lerRegistro('meta');
      return m && typeof m === 'object' ? m as Meta : null;
    },
    gravarMeta(m) {
      return escrever(loja => { loja.put(m, 'meta'); });
    }
  };
}
