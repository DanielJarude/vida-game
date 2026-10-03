/**
 * O único estado da interface: a vida (e em que tela estamos).
 *
 * Toda mudança passa pelo motor (`executar`, `avancarAno`); este hook só
 * guarda o resultado, salva e mostra avisos. Nenhuma regra de jogo mora aqui.
 *
 * PWA: quem lê e grava é a camada de persistência (`persistencia/`), com
 * IndexedDB e o localStorage de reserva; o motor só transforma texto em vida
 * (`interpretar`) e vida em texto. Com o localStorage (testes, navegadores sem
 * IndexedDB) a carga é síncrona como sempre foi; com o IndexedDB, a tela
 * inicial espera a leitura junto com o motor.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DecisoesDeHeranca, Vida } from '../motor/tipos';
import type { Armazenamento, Estatisticas } from '../motor/save';
import type { OpcoesCriacao } from '../motor/criacao';
import type { Acao } from '../motor/acoes';
import { sound } from './util/som';
import { carregarMotor, motorCarregado, type Motor } from './motor';
import { persistenciaDoJogo, type Carga } from './persistencia';
import { abrirSalva } from './persistencia/abrir';

export type Tela = 'inicio' | 'criacao' | 'jogo' | 'vidas';

export interface Aviso { id: number; texto: string; tom: 'bom' | 'ruim' | 'neutro' }

/** As estatísticas em texto, com a cara de um armazenamento — para o motor ler e registrar nelas sem saber de onde vieram. */
function gaveta(bruto: string | null): Armazenamento & { bruto: string | null } {
  return { bruto, getItem() { return this.bruto; }, setItem(_k: string, v: string) { this.bruto = v; }, removeItem() { this.bruto = null; } };
}

export function useVida() {
  const [tela, setTela] = useState<Tela>('inicio');
  const [vida, setVida] = useState<Vida | null>(null);
  const [salva, setSalva] = useState<{ nome: string; idade: number; morta?: boolean } | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [resultado, setResultado] = useState<{ titulo: string; texto: string; pessoaId?: string; mudancas?: string[] } | null>(null);
  /** Primeira entrada da biografia gerada pelo último ano vivido (para destacar). */
  const [marcaAno, setMarcaAno] = useState<number>(0);
  const [avisoSave, setAvisoSave] = useState<string | null>(null);
  const [som, setSom] = useState<boolean>(() => {
    try { return localStorage.getItem('VIDA_SOM') !== '0'; } catch { return true; }
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // O motor chega num pacote à parte: a tela inicial abre antes dele.
  const [motor, setMotor] = useState<Motor | null>(motorCarregado);
  useEffect(() => { if (!motor) { let vivo = true; void carregarMotor().then(m => { if (vivo) setMotor(m); }); return () => { vivo = false; }; } return undefined; }, [motor]);
  // A persistência nasce com o motor: é ele quem diz se um save abre.
  const persist = useMemo(() => motor ? persistenciaDoJogo(b => { const r = motor.interpretar(b); return r.tipo === 'invalido' ? r.motivo : null; }) : null, [motor]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  /** A vida salva já foi lida (até lá, a tela inicial espera — não se nasce por cima de uma vida que ainda vai aparecer). */
  const [carregado, setCarregado] = useState(false);
  /** A última vida salva (para continuar sem reler o IndexedDB). */
  const salvaRef = useRef<Vida | null>(null);
  const avisouFalhaAoSalvar = useRef(false);

  useEffect(() => { sound.enabled = som; try { localStorage.setItem('VIDA_SOM', som ? '1' : '0'); } catch { /* sem armazenamento */ } }, [som]);

  useEffect(() => {
    if (!motor || !persist) return;
    const { idade, interpretar, lerEstatisticas } = motor;
    const abrir = (c: Carga) => {
      setCarregado(true);
      setEstatisticas(lerEstatisticas(gaveta(c.estatisticas)));
      if (c.migracaoInvalida) setAvisoSave(`A vida salva neste navegador não pôde ser trazida para o armazenamento novo: ${c.migracaoInvalida} Uma cópia foi guardada.`);
      const r = abrirSalva(c, interpretar);
      if (r.tipo === 'invalido') {
        void persist.guardarBackup(r.descartado);
        setAvisoSave(`Não foi possível abrir a vida salva: ${r.motivo} Uma cópia foi guardada.`);
        return;
      }
      if (r.tipo !== 'ok') return;
      salvaRef.current = r.vida;
      setSalva({ nome: r.vida.eu.nome, idade: idade(r.vida), morta: !!r.vida.morte });
      // O texto que não abriu (ou o original de um save convertido) vai para o backup; a vida aberta volta a ser o principal.
      const guardar = r.descartado ?? (r.migrado ? r.bruto : null);
      if (guardar !== null) void persist.guardarBackup(guardar);
      if (r.recuperado || r.migrado) void persist.salvar(JSON.stringify(r.vida));
      if (r.recuperado) setAvisoSave('A última gravação da sua vida estava danificada e não abriu. O jogo voltou ao salvamento anterior — o último passo pode ter se perdido. Uma cópia da gravação danificada foi guardada.');
      else if (r.migrado) setAvisoSave('Sua vida salva veio de uma versão anterior do jogo e foi convertida. Alguns detalhes foram aproximados.');
    };
    // localStorage: na hora (a primeira tela já abre com o "Continuar"). IndexedDB: quando a leitura chegar.
    const ja = persist.carregarJa();
    if (ja) { abrir(ja); return; }
    let vivo = true;
    void persist.carregar().then(c => { if (vivo) abrir(c); });
    return () => { vivo = false; };
  }, [motor, persist]);

  const avisar = useCallback((texto: string, tom: Aviso['tom'] = 'neutro') => {
    setAviso({ id: Date.now(), texto, tom });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAviso(null), 4200);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /** Grava a vida (na fila da persistência). Se não der, avisa uma vez — e sugere exportar. */
  const salvar = useCallback((v: Vida) => {
    if (!persist) return;
    salvaRef.current = v;
    void persist.salvar(JSON.stringify(v)).then(ok => {
      if (ok || avisouFalhaAoSalvar.current) return;
      avisouFalhaAoSalvar.current = true;
      setAvisoSave('Não foi possível salvar neste navegador (o espaço pode ter acabado). Exporte a vida num arquivo, pelo menu, para não perdê-la.');
    });
  }, [persist]);

  const apagarSave = useCallback(() => { salvaRef.current = null; void persist?.apagar(); }, [persist]);

  /** Aplica uma vida nova: salva, trata a morte. */
  const aplicar = useCallback((nova: Vida) => {
    if (!motor || !persist) return;
    const { registrarVidaPassada, lerEstatisticas, idade, nomeLugar, descricaoEmprego, patrimonio, anoDe, paisDaCidade } = motor;
    setVida(nova);
    if (nova.morte) {
      // Sucessão: a vida que terminou fica salva até o jogador decidir (encerrar ou continuar a família) —
      // recarregar volta à tela do legado, com as decisões da partilha que já tomou.
      if (nova.morte.encerrada) { apagarSave(); setSalva(null); } else { salvar(nova); setSalva({ nome: nova.eu.nome, idade: idade(nova), morta: true }); }
      if (vida?.morte) return; // a morte já foi registrada (aqui só mudaram as decisões da partilha)
      const e = nova.trabalho.atual ?? nova.trabalho.historico[nova.trabalho.historico.length - 1];
      const g = gaveta(persist.estatisticas());
      registrarVidaPassada({
        id: nova.id, nome: `${nova.eu.nome} ${nova.eu.sobrenome}`, idadeMorte: idade(nova), lugar: nomeLugar(nova.moradia.municipioId),
        profissao: e ? descricaoEmprego(nova).split(' · ')[0] : '—', patrimonio: patrimonio(nova), causa: nova.morte.causa, ano: anoDe(nova.t), pais: paisDaCidade(nova.moradia.municipioId)
      }, g);
      if (g.bruto !== null) void persist.salvarEstatisticas(g.bruto);
      setEstatisticas(lerEstatisticas(g));
    } else {
      salvar(nova);
      setSalva({ nome: nova.eu.nome, idade: idade(nova) });
    }
  }, [motor, persist, vida, salvar, apagarSave]);

  const nascer = useCallback((o: Omit<OpcoesCriacao, 'semente'> & { semente?: number }) => {
    if (!motor) return;
    const v = motor.criarVida({ ...o, semente: o.semente ?? Math.floor(Math.random() * 2 ** 31) });
    setMarcaAno(0);
    aplicar(v);
    setTela('jogo');
    sound.playSuccess();
  }, [aplicar, motor]);

  const continuar = useCallback(() => {
    if (!motor || !persist) return;
    // Armazém síncrono: relê (como sempre foi). IndexedDB: a vida já aberta na carga, ou a última salva.
    const ja = persist.carregarJa();
    const r = ja ? abrirSalva(ja, motor.interpretar) : null;
    const v = r ? (r.tipo === 'ok' ? r.vida : null) : salvaRef.current;
    if (!v) { avisar('Não há vida salva para continuar.', 'ruim'); return; }
    setVida(v);
    setMarcaAno(v.biografia.length);
    setTela('jogo');
  }, [avisar, motor, persist]);

  const avancar = useCallback(() => {
    if (!vida || !motor) return;
    const antes = vida.biografia.length;
    const r = motor.avancarAno(vida);
    if (r.aviso) { avisar(r.aviso.texto, r.aviso.tom); return; }
    setMarcaAno(antes);
    aplicar(r.vida);
    if (r.vida.morte) sound.playDeath();
    else if (r.vida.momento) sound.playEvent();
    else sound.playAgeUp();
  }, [vida, aplicar, avisar, motor]);

  const agir = useCallback((a: Acao): boolean => {
    if (!vida || !motor) return false;
    // O título do resultado é o do processo, sem a etapa ("Entrevista: vendedora", não "· 3 de 3").
    const titulo = (vida.momento?.titulo ?? '').replace(/ · .*$/, '');
    const r = motor.executar(vida, a);
    if (r.vida === vida) {
      if (r.aviso) avisar(r.aviso.texto, 'ruim');
      return false;
    }
    aplicar(r.vida);
    // O que a ação mudou na vida (as consequências, como ficaram na Linha da Vida).
    const mudancas = (r.mudancas ?? []).filter(m => m !== r.resultado);
    if (r.resultado) {
      // Resultado de decisão aparece dentro do próprio momento (o modal decide);
      // resultado de ação que não abriu decisão vira aviso — a não ser que tenha mudado coisas na vida.
      if (a.tipo === 'decidir') setResultado({ titulo, texto: r.resultado, mudancas });
      else if (r.titulo || mudancas.length >= 2) setResultado({ titulo: r.titulo ?? 'O que aconteceu', texto: r.resultado, pessoaId: r.pessoaId, mudancas });
      else avisar(r.resultado, 'neutro');
    } else if (r.aviso) {
      if (mudancas.length >= 2 && !r.vida.momento) setResultado({ titulo: 'O que mudou', texto: r.aviso.texto, mudancas });
      else avisar(r.aviso.texto, r.aviso.tom);
    }
    sound.playClick();
    return true;
  }, [vida, aplicar, avisar, motor]);

  /** Baixa a vida atual num arquivo JSON (para continuar em outro navegador ou aparelho). */
  const exportar = useCallback(() => {
    if (!vida || !motor) return;
    const { exportarVida, anoDe } = motor;
    try {
      const blob = new Blob([exportarVida(vida)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vida-${vida.eu.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${anoDe(vida.t)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      avisar('Vida exportada: o arquivo foi baixado.', 'bom');
    } catch {
      avisar('Não foi possível exportar agora.', 'ruim');
    }
  }, [vida, avisar, motor]);

  /** Lê um arquivo e diz de quem é a vida (sem trocar nada ainda). */
  const previaImportacao = useCallback((texto: string): { tipo: 'ok'; resumo: string } | { tipo: 'erro'; motivo: string } => {
    if (!motor) return { tipo: 'erro', motivo: 'O jogo ainda está carregando.' };
    const { importarVida, idade, nomeLugar, anoDe } = motor;
    const r = importarVida(texto);
    if (r.tipo !== 'ok') return { tipo: 'erro', motivo: r.tipo === 'invalido' ? r.motivo : 'O arquivo está vazio.' };
    const v = r.vida;
    return { tipo: 'ok', resumo: `A vida de ${v.eu.nome} ${v.eu.sobrenome}, ${idade(v)} anos, em ${nomeLugar(v.moradia.municipioId)}, no ano de ${anoDe(v.t)}.${r.migrado ? ' Veio de uma versão anterior do jogo e será convertida.' : ''}` };
  }, [motor]);

  /** Importa (depois de confirmado): a vida do arquivo passa a ser a vida salva. */
  const importar = useCallback((texto: string): boolean => {
    if (!motor) return false;
    const r = motor.importarVida(texto);
    if (r.tipo !== 'ok') { avisar(r.tipo === 'invalido' ? r.motivo : 'O arquivo está vazio.', 'ruim'); return false; }
    setResultado(null);
    setMarcaAno(r.vida.biografia.length);
    aplicar(r.vida);
    setTela('jogo');
    avisar(`A vida de ${r.vida.eu.nome} continua aqui.`, 'bom');
    return true;
  }, [aplicar, avisar, motor]);

  /** O destino do patrimônio (a partilha, dentro da regra do país): guardado na vida que terminou. */
  const decidirHeranca = useCallback((d: DecisoesDeHeranca) => {
    if (!vida || !motor) return;
    aplicar(motor.decidirHeranca(vida, d));
  }, [vida, aplicar, motor]);

  /** Continuar a família como um filho ou filha que já vive no mundo (a partilha é feita agora). */
  const continuarComo = useCallback((pessoaId: string): boolean => {
    if (!vida || !motor) return false;
    const r = motor.continuarComo(vida, pessoaId);
    if (r.erro) { avisar(r.erro, 'ruim'); return false; }
    setResultado(null);
    setMarcaAno(0);
    aplicar(r.vida);
    setTela('jogo');
    sound.playSuccess();
    return true;
  }, [vida, aplicar, avisar, motor]);

  /** Encerrar a história aqui (a partilha é feita e registrada; nada continua). */
  const encerrar = useCallback(() => {
    if (!vida || !motor) return;
    const r = motor.encerrarHistoria(vida);
    if (r.erro) { avisar(r.erro, 'ruim'); return; }
    aplicar(r.vida);
  }, [vida, aplicar, avisar, motor]);

  const recomecar = useCallback(() => {
    apagarSave();
    setVida(null);
    setSalva(null);
    setResultado(null);
    setTela('inicio');
  }, [apagarSave]);

  return {
    pronto: !!motor && carregado, estatisticas,
    tela, setTela, vida, salva, aviso, avisoSave, setAvisoSave, resultado, fecharResultado: () => setResultado(null),
    marcaAno, som, setSom, nascer, continuar, avancar, agir, recomecar, avisar, exportar, previaImportacao, importar, decidirHeranca, continuarComo, encerrar
  };
}

export type ControleVida = ReturnType<typeof useVida>;
