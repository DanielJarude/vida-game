/**
 * O único estado da interface: a vida (e em que tela estamos).
 *
 * Toda mudança passa pelo motor (`executar`, `avancarAno`); este hook só
 * guarda o resultado, salva e mostra avisos. Nenhuma regra de jogo mora aqui.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Vida } from '../motor/tipos';
import { criarVida, type OpcoesCriacao } from '../motor/criacao';
import { avancarAno } from '../motor/ano';
import { executar, type Acao } from '../motor/acoes';
import { apagarSave, ler, registrarVidaPassada, salvar } from '../motor/save';
import { idade } from '../motor/nucleo';
import { patrimonio } from '../motor/sistemas/dinheiro';
import { nomeLugar } from '../motor/dados/lugares';
import { descricaoEmprego } from '../motor/sistemas/trabalho';
import { anoDe } from '../motor/tempo';
import { sound } from './util/som';

export type Tela = 'inicio' | 'criacao' | 'jogo' | 'vidas';

export interface Aviso { id: number; texto: string; tom: 'bom' | 'ruim' | 'neutro' }

export function useVida() {
  const [tela, setTela] = useState<Tela>('inicio');
  const [vida, setVida] = useState<Vida | null>(null);
  const [salva, setSalva] = useState<{ nome: string; idade: number } | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [resultado, setResultado] = useState<{ titulo: string; texto: string; pessoaId?: string } | null>(null);
  /** Primeira entrada da biografia gerada pelo último ano vivido (para destacar). */
  const [marcaAno, setMarcaAno] = useState<number>(0);
  const [avisoSave, setAvisoSave] = useState<string | null>(null);
  const [som, setSom] = useState<boolean>(() => {
    try { return localStorage.getItem('VIDA_SOM') !== '0'; } catch { return true; }
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { sound.enabled = som; try { localStorage.setItem('VIDA_SOM', som ? '1' : '0'); } catch { /* sem armazenamento */ } }, [som]);

  useEffect(() => {
    const r = ler();
    if (r.tipo === 'ok') setSalva({ nome: r.vida.eu.nome, idade: idade(r.vida) });
    if (r.tipo === 'invalido') setAvisoSave(`Não foi possível abrir a vida salva: ${r.motivo} Uma cópia foi guardada.`);
    if (r.tipo === 'ok' && r.migrado) setAvisoSave('Sua vida salva veio de uma versão anterior do jogo e foi convertida. Alguns detalhes foram aproximados.');
  }, []);

  const avisar = useCallback((texto: string, tom: Aviso['tom'] = 'neutro') => {
    setAviso({ id: Date.now(), texto, tom });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAviso(null), 4200);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /** Aplica uma vida nova: salva, trata a morte. */
  const aplicar = useCallback((nova: Vida) => {
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
  }, []);

  const nascer = useCallback((o: Omit<OpcoesCriacao, 'semente'> & { semente?: number }) => {
    const v = criarVida({ ...o, semente: o.semente ?? Math.floor(Math.random() * 2 ** 31) });
    setMarcaAno(0);
    aplicar(v);
    setTela('jogo');
    sound.playSuccess();
  }, [aplicar]);

  const continuar = useCallback(() => {
    const r = ler();
    if (r.tipo !== 'ok') { avisar('Não há vida salva para continuar.', 'ruim'); return; }
    setVida(r.vida);
    setMarcaAno(r.vida.biografia.length);
    setTela('jogo');
  }, [avisar]);

  const avancar = useCallback(() => {
    if (!vida) return;
    const antes = vida.biografia.length;
    const r = avancarAno(vida);
    if (r.aviso) { avisar(r.aviso.texto, r.aviso.tom); return; }
    setMarcaAno(antes);
    aplicar(r.vida);
    if (r.vida.morte) sound.playDeath();
    else if (r.vida.momento) sound.playEvent();
    else sound.playAgeUp();
  }, [vida, aplicar, avisar]);

  const agir = useCallback((a: Acao): boolean => {
    if (!vida) return false;
    // O título do resultado é o do processo, sem a etapa ("Entrevista: vendedora", não "· 3 de 3").
    const titulo = (vida.momento?.titulo ?? '').replace(/ · .*$/, '');
    const r = executar(vida, a);
    if (r.vida === vida) {
      if (r.aviso) avisar(r.aviso.texto, 'ruim');
      return false;
    }
    aplicar(r.vida);
    if (r.resultado) {
      // Resultado de decisão aparece dentro do próprio momento (o modal decide);
      // resultado de ação que não abriu decisão vira aviso.
      if (a.tipo === 'decidir') setResultado({ titulo, texto: r.resultado });
      else if (r.titulo) setResultado({ titulo: r.titulo, texto: r.resultado, pessoaId: r.pessoaId });
      else avisar(r.resultado, 'neutro');
    } else if (r.aviso) avisar(r.aviso.texto, r.aviso.tom);
    sound.playClick();
    return true;
  }, [vida, aplicar, avisar]);

  const recomecar = useCallback(() => {
    apagarSave();
    setVida(null);
    setSalva(null);
    setResultado(null);
    setTela('inicio');
  }, []);

  return {
    tela, setTela, vida, salva, aviso, avisoSave, setAvisoSave, resultado, fecharResultado: () => setResultado(null),
    marcaAno, som, setSom, nascer, continuar, avancar, agir, recomecar, avisar
  };
}

export type ControleVida = ReturnType<typeof useVida>;
