/**
 * VIDA 13 — a tela da empresa de verdade no navegador (interativa): uma indústria e uma montadora com decisões tomadas,
 * o painel com as abas, o catálogo de produtos e as linhas. `?tema=escuro`, `?empresa=montadora|restaurante`, `?aba=N`.
 * esbuild scripts/playtest/galeria13Empresas.tsx --bundle --format=esm --outdir=<pasta> → <pasta>/galeria13Empresas.{js,css}
 */
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import '../../src/ui/fontes.css';
import '../../src/ui/vida.css';
import '../../src/ui/sistema.css';
import '../../src/ui/experiencia.css';
import '../../src/ui/objetos.css';
import '../../src/ui/possibilidades.css';
import '../../src/ui/patrimonio.css';
import '../../src/ui/material.css';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { executar, type Acao } from '../../src/motor/acoes';
import { transacao } from '../../src/motor/nucleo';
import { processarEmpresas } from '../../src/motor/sistemas/empresas';
import type { Vida } from '../../src/motor/tipos';
import { PainelDaEmpresa129, FundarOuAdquirir129 } from '../../src/ui/jogo/Empresas129';

const q = new URLSearchParams(location.search);
document.documentElement.dataset.tema = q.get('tema') === 'escuro' ? 'escuro' : 'claro';
document.documentElement.dataset.paleta = q.get('tema') === 'escuro' ? 'escuro' : 'claro';
await carregarMundo();

const anos = (v: Vida, n: number) => { for (let k = 0; k < n; k++) { v.t += 12; v.anoAtual = { acoes: [] }; v = transacao(v, (x, r) => processarEmpresas(x, r)).vida; } return v; };
function montar(): Vida {
  let v = adulto(40, { municipioId: 'sao-paulo-sp', semente: 41 });
  v.financas.conta = 20e9; v.financas.dividas = []; v.financas.negativado = false; v.momento = null; delete v.fila;
  const qual = q.get('empresa') ?? 'industria';
  if (qual === 'restaurante') {
    v = executar(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false }).vida;
    v = anos(v, 1);
    return v;
  }
  v = executar(v, { tipo: 'fundar129', setor: qual === 'montadora' ? 'montadora' : 'industria', item: qual === 'montadora' ? 'hatch' : 'biscoitos', comSocio: false }).vida;
  v = anos(v, qual === 'montadora' ? 4 : 2);
  const e = v.financas.empresas!.find(x => !!x.corp)!;
  e.estrategia!.delegar = false;
  e.caixa = qual === 'montadora' ? 8e9 : 300e6;
  const pid = e.corp!.projetos.find(p => p.estado === 'ativo')!.id;
  if (q.get('decidir') !== '0') {
    v = executar(v, { tipo: 'empresa129', empresaId: e.id, oque: 'linha', alvo: qual === 'montadora' ? 'suv_compacto' : 'salgadinhos' }).vida;
    v = executar(v, { tipo: 'empresa129', empresaId: e.id, oque: 'preco', alvo: `${pid}:+` }).vida;
  }
  return v;
}

function Tela() {
  const [v, setV] = useState<Vida>(montar);
  const agir = (a: Acao) => { const r = executar(v, a); setV(structuredClone(r.vida)); (window as unknown as { ultimo: string }).ultimo = JSON.stringify(r).slice(0, 400); return true; };
  const e = v.financas.empresas![0];
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
      <article className={`pat-empresa pat-empresa--${e.estado}`}>
        <header className="pat-empresa__cabeca"><div><h3>{e.nome}</h3><p className="nota">{e.tipo} · sua</p></div></header>
        <PainelDaEmpresa129 vida={v} agir={agir} e={e} />
      </article>
      {q.get('fundar') === '1' && <FundarOuAdquirir129 vida={v} agir={agir} />}
    </main>
  );
}
createRoot(document.getElementById('root')!).render(<Tela />);
