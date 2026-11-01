/**
 * HOTFIX 11.5.1 — O ESTÚDIO DE TATUAGEM (Você · Aparência). Escolher o desenho (pelo estilo), a parte do corpo e o lado,
 * ver como fica — de frente e de costas, sem a camisa — e tatuar; ver o que já tem, de que ano, e tirar no laser. O
 * motor decide o que cabe e quanto custa (`sistemas/tatuagens`); aqui é só a escolha e a prévia.
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { DESENHOS, desenhoDeTatuagem, LOCAIS, NOME_ESTILO, type EstiloDeTatuagem, type Lado, type LocalDeTatuagem } from '../../motor/dados/tatuagens';
import { IDADE_PARA_TATUAR, ondeEsta, precoDaRemocao, precoDaTatuagem, tatuagensDe, tatuagensNaFigura } from '../../motor/sistemas/tatuagens';
import { tipoDeCorpo } from '../../motor/sistemas/silhueta';
import { itensDaPessoa } from '../../motor/sistemas/estilo';
import { Figura } from '../avatar/Figura';
import { BotaoAcao, Escolha } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';

const TAMANHO = { 1: 'pequena', 2: 'média', 3: 'grande', 4: 'braço inteiro' } as const;

export function EstudioDeTatuagem({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  const [estilo, setEstilo] = useState<EstiloDeTatuagem | ''>('');
  const [desenho, setDesenho] = useState(DESENHOS[0].id);
  const d = desenhoDeTatuagem(desenho)!;
  const [local, setLocal] = useState<LocalDeTatuagem>(d.locais[0]);
  const [lado, setLado] = useState<Lado>('d');
  const minhas = tatuagensDe(vida);
  const desenhos = DESENHOS.filter(x => !estilo || x.estilo === estilo);
  const localValido = d.locais.includes(local) ? local : d.locais[0];
  const prevista = { id: 'previa', desenho, local: localValido, ...(LOCAIS[localValido].lados ? { lado } : {}), anos: 0, clareou: 0 };
  const naPele = tatuagensNaFigura(vida);
  const comPrevia = [...naPele, prevista];
  const pecas = itensDaPessoa(vida).filter(x => x.usando);
  const acao: Acao = { tipo: 'tatuar', desenho, local: localValido, ...(LOCAIS[localValido].lados ? { lado } : {}) };
  const costasNaPrevia = !LOCAIS[localValido].frente;
  const fig = useMemo(() => ({ visual: vida.eu.visual, genero: vida.eu.genero, idade: i, semente: vida.eu.semente ?? 'eu', corpo: tipoDeCorpo(vida) }), [vida, i]);
  if (i < 16 && !minhas.length) return null;
  return (
    <section className="estudio-tatuagem" aria-labelledby="estudio-titulo">
      <h3 id="estudio-titulo" className="voce-subtitulo">Tatuagens</h3>
      {i < IDADE_PARA_TATUAR && <p className="nota">A partir dos {IDADE_PARA_TATUAR}: estúdio sério não tatua menor de idade.</p>}
      <div className="estudio-tatuagem__corpo">
        <div className="estudio-tatuagem__previa" aria-label="Prévia">
          <figure><Figura {...fig} pecas={pecas} semCima tatuagens={i >= IDADE_PARA_TATUAR ? comPrevia : naPele} largura={118} semFundo rotulo="De frente" /><figcaption className="nota">De frente</figcaption></figure>
          <figure><Figura {...fig} pecas={pecas} semCima vista="costas" tatuagens={i >= IDADE_PARA_TATUAR ? comPrevia : naPele} largura={118} semFundo rotulo="De costas" /><figcaption className="nota">De costas{costasNaPrevia ? ' · onde ela fica' : ''}</figcaption></figure>
        </div>
        {i >= IDADE_PARA_TATUAR && (
          <div className="estudio-tatuagem__escolhas">
            <Escolha rotulo="Estilo" valor={estilo} aoMudar={x => { setEstilo(x); const p = DESENHOS.find(y => !x || y.estilo === x); if (p) { setDesenho(p.id); setLocal(p.locais[0]); } }} opcoes={[{ id: '' as const, rotulo: 'Todos' }, ...(Object.keys(NOME_ESTILO) as EstiloDeTatuagem[]).map(e => ({ id: e, rotulo: NOME_ESTILO[e] }))]} />
            <label className="campo">
              <span className="campo__rotulo">Desenho</span>
              <select value={desenho} onChange={e => { setDesenho(e.target.value); const n = desenhoDeTatuagem(e.target.value)!; if (!n.locais.includes(local)) setLocal(n.locais[0]); }}>
                {desenhos.map(x => <option key={x.id} value={x.id}>{x.nome} — {TAMANHO[x.tamanho]}{x.colorida ? ', colorida' : ''} · {dinheiroCurto(precoDaTatuagem(vida, x.id))}</option>)}
              </select>
              <span className="campo__nota">{NOME_ESTILO[d.estilo]}: {d.descricao}</span>
            </label>
            <label className="campo">
              <span className="campo__rotulo">Onde</span>
              <select value={localValido} onChange={e => setLocal(e.target.value as LocalDeTatuagem)}>
                {d.locais.map(l => <option key={l} value={l}>{LOCAIS[l].nome.replace(/^./, x => x.toUpperCase())}</option>)}
              </select>
            </label>
            {LOCAIS[localValido].lados && <Escolha rotulo="Lado" valor={lado} aoMudar={setLado} opcoes={[{ id: 'd' as const, rotulo: 'Direito' }, { id: 'e' as const, rotulo: 'Esquerdo' }]} />}
            <BotaoAcao vida={vida} acao={acao} agir={agir} variante="principal">{`Tatuar ${ondeEsta(localValido, LOCAIS[localValido].lados ? lado : undefined)} (${dinheiroCurto(precoDaTatuagem(vida, desenho))})`}</BotaoAcao>
            <p className="nota">A prévia mostra o desenho já no lugar. Cada parte tem o espaço dela: o que não couber sem ficar por cima de outra tatuagem, o estúdio não faz.</p>
          </div>
        )}
      </div>
      {minhas.length > 0 && (
        <ul className="estudio-tatuagem__lista">
          {minhas.map(t => {
            const x = desenhoDeTatuagem(t.desenho);
            return (
              <li key={t.id} data-tatuagem={t.desenho}>
                <span><strong>{x?.nome ?? t.desenho}</strong> {ondeEsta(t.local, t.lado)} <span className="nota">· desde {anoDe(t.t)}{t.removida !== undefined ? ' · saindo no laser' : ''}</span></span>
                {t.removida === undefined && <BotaoAcao vida={vida} acao={{ tipo: 'remover_tatuagem', id: t.id }} agir={agir} variante="discreto">{`Tirar no laser (${dinheiroCurto(precoDaRemocao(vida, t))})`}</BotaoAcao>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
