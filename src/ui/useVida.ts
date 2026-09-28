/**
 * O único estado da interface: a vida (e em que tela estamos).
 *
 * Toda mudança passa pelo motor (`executar`, `avancarAno`); este hook só
 * guarda o resultado, salva e mostra avisos. Nenhuma regra de jogo mora aqui.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Vida } from '../motor/tipos';
import type { OpcoesCriacao } from '../motor/criacao';
import type { Acao } from '../motor/acoes';
import { sound } from './util/som';
import { carregarMotor, motorCarregado, type Motor } from './motor';

export type Tela = 'inicio' | 'criacao' | 'jogo' | 'vidas';

export interface Aviso { id: number; texto: string; tom: 'bom' | 'ruim' | 'neutro' }

export function useVida() {
  const [tela, setTela] = useState<Tela>('inicio');
  const [vida, setVida] = useState<Vida | null>(null);
  const [salva, setSalva] = useState<{ nome: string; idade: number } | null>(null);
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

  useEffect(() => { sound.enabled = som; try { localStorage.setItem('VIDA_SOM', som ? '1' : '0'); } catch { /* sem armazenamento */ } }, [som]);

  useEffect(() => {
    if (!motor) return;
    const { ler, idade } = motor;
    const r = ler();
    if (r.tipo === 'ok') setSalva({ nome: r.vida.eu.nome, idade: idade(r.vida) });
    if (r.tipo === 'invalido') setAvisoSave(`Não foi possível abrir a vida salva: ${r.motivo} Uma cópia foi guardada.`);
    if (r.tipo === 'ok' && r.migrado) setAvisoSave('Sua vida salva veio de uma versão anterior do jogo e foi convertida. Alguns detalhes foram aproximados.');
  }, [motor]);

  const avisar = useCallback((texto: string, tom: Aviso['tom'] = 'neutro') => {
    setAviso({ id: Date.now(), texto, tom });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAviso(null), 4200);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /** Aplica uma vida nova: salva, trata a morte. */
  const aplicar = useCallback((nova: Vida) => {
    if (!motor) return;
    const { apagarSave, registrarVidaPassada, idade, nomeLugar, descricaoEmprego, patrimonio, anoDe, salvar } = motor;
    setVida(nova);
    if (nova.morte) {
      apagarSave();
      setSalva(null);
      const e = nova.trabalho.atual ?? nova.trabalho.historico[nova.trabalho.historico.length - 1];
      registrarVidaPassada({
        id: nova.id, nome: `${nova.eu.nome} ${nova.eu.sobrenome}`, idadeMorte: idade(nova), lugar: nomeLugar(nova.moradia.municipioId),
        profissao: e ? descricaoEmprego(nova).split(' · ')[0] : '—', patrimonio: patrimonio(nova), causa: nova.morte.causa, ano: anoDe(nova.t)
      });
    } else {
      salvar(nova);
      setSalva({ nome: nova.eu.nome, idade: idade(nova) });
    }
  }, [motor]);

  const nascer = useCallback((o: Omit<OpcoesCriacao, 'semente'> & { semente?: number }) => {
    if (!motor) return;
    const v = motor.criarVida({ ...o, semente: o.semente ?? Math.floor(Math.random() * 2 ** 31) });
    setMarcaAno(0);
    aplicar(v);
    setTela('jogo');
    sound.playSuccess();
  }, [aplicar, motor]);

  const continuar = useCallback(() => {
    if (!motor) return;
    const r = motor.ler();
    if (r.tipo !== 'ok') { avisar('Não há vida salva para continuar.', 'ruim'); return; }
    setVida(r.vida);
    setMarcaAno(r.vida.biografia.length);
    setTela('jogo');
  }, [avisar, motor]);

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

  const recomecar = useCallback(() => {
    motor?.apagarSave();
    setVida(null);
    setSalva(null);
    setResultado(null);
    setTela('inicio');
  }, [motor]);

  return {
    pronto: !!motor, estatisticas: motor ? motor.lerEstatisticas() : null,
    tela, setTela, vida, salva, aviso, avisoSave, setAvisoSave, resultado, fecharResultado: () => setResultado(null),
    marcaAno, som, setSom, nascer, continuar, avancar, agir, recomecar, avisar, exportar, previaImportacao, importar
  };
}

export type ControleVida = ReturnType<typeof useVida>;
