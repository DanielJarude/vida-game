/**
 * VIDA 34 · PATRIMÔNIO · EMPRESAS · ESPORTE, ORGANIZADO. Antes a aba empilhava tudo — o clube (ou a vitrine de compra),
 * os times de quadra, a organização de e-sports e a fundação — numa rolagem só. Agora ela abre numa central: em cima os
 * seus times, cada um um cartão (escudo, modalidade, divisão, caixa, o que pede atenção) que abre o painel daquele time;
 * embaixo as portas para começar outro (comprar um clube, fundar um time, montar ou comprar uma organização de e-sports).
 * Dentro de um time, a trilha "← Todos os times" volta e os outros times ficam a um toque.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { idade } from '../../../motor/nucleo';
import { anoDe } from '../../../motor/tempo';
import { divisaoDoNivel } from '../../../motor/dados/clubes';
import { nomeDaModalidade32, nomeDaDivisao32 } from '../../../motor/v32/equipes/equipe32';
import { nomeDaLiga31 } from '../../../motor/v31/esports/org31';
import { JOGOS25 } from '../../../motor/v25/esports/jogos25';
import { dinheiroCurto } from '../../apresentar';
import { Escudo30, registrarIdentidades33 } from '../../v30/escudos/Escudo30';
import { Clube20 } from '../../v20/clubes/Clube20';
import { CartaoEquipe32, FundarTime32 } from '../../v32/esporte/Esporte32';
import OrgEsports31, { Distintivo31 } from '../../v31/esports/OrgEsports31';
import { Trilha34 } from './NavTime34';
import './central34.css';

type Agir = (a: Acao) => boolean;
type Vista34 = 'inicio' | 'futebol' | 'esports' | 'fundar' | `quadra:${string}`;

/** A última tela aberta (a central volta onde estava quando o Patrimônio é reaberto na mesma sessão). */
let lembrada: Vista34 = 'inicio';

interface Time34 { vista: Vista34; nome: string; escudo: ReactElement; tipo: string; divisao: string; caixa: number; divida: number; atencao?: string }

function timesDoDono(vida: Vida): Time34[] {
  const ano = anoDe(vida.t);
  const out: Time34[] = [];
  const c = vida.clube20;
  if (c) {
    const h = c.historico[c.historico.length - 1];
    const mesa = c.mesa31?.length ?? 0;
    const div = h ? (divisaoDoNivel(h.divisao, c.pais) ?? '').replace(/^campeonato estadual$/i, 'Estadual') : '';
    out.push({ vista: 'futebol', nome: c.nome, escudo: <Escudo30 nome={c.nome} tamanho={52} />, tipo: 'Futebol', divisao: div || 'temporada em curso', caixa: c.caixa, divida: c.divida, atencao: c.conflito ? 'Conflito de interesses' : mesa ? `${mesa} ${mesa === 1 ? 'assunto' : 'assuntos'} na mesa` : undefined });
  }
  for (const e of vida.equipes32 ?? [])
    out.push({ vista: `quadra:${e.id}`, nome: e.nome, escudo: <Escudo30 nome={e.nome} tamanho={52} />, tipo: nomeDaModalidade32(e.modalidade), divisao: nomeDaDivisao32(e, e.nivel), caixa: e.caixa, divida: e.divida, atencao: e.caixa < 0 ? 'Caixa negativo' : !e.tecnico ? 'Sem técnico' : undefined });
  const o = vida.orgEsports31;
  if (o) {
    const jogos = o.linhas.map(l => JOGOS25[l.jogo].nome(ano)).join(' · ');
    const melhor = [...o.linhas].sort((a, b) => b.divisao - a.divisao)[0];
    out.push({ vista: 'esports', nome: o.nome, escudo: <Distintivo31 nome={o.nome} tamanho={52} identidade={o.identidade33} />, tipo: `E-sports · ${jogos}`, divisao: melhor ? nomeDaLiga31(melhor, ano) : '', caixa: o.caixa, divida: o.divida, atencao: o.mesa.length ? `${o.mesa.length} ${o.mesa.length === 1 ? 'assunto' : 'assuntos'} na mesa` : undefined });
  }
  return out;
}

export default function CentralEsporte34({ vida, agir }: { vida: Vida; agir: Agir }) {
  registrarIdentidades33(vida);
  const times = timesDoDono(vida);
  const [vista, setVistaLocal] = useState<Vista34>(() => (lembrada !== 'inicio' && vistaExiste(vida, lembrada) ? lembrada : 'inicio'));
  const setVista = (v: Vista34) => { lembrada = v; setVistaLocal(v); };
  // Depois de comprar ou fundar, a central abre o time novo (e não fica na tela da compra).
  const antes = useRef(times.map(t => t.vista));
  useEffect(() => {
    const agora = times.map(t => t.vista);
    const novo = agora.find(v => !antes.current.includes(v));
    antes.current = agora;
    if (novo && (vista === 'fundar' || vista === 'futebol' || vista === 'esports')) setVista(novo);
    else if (vista.startsWith('quadra:') && !agora.includes(vista)) setVista('inicio');
  });
  const adulto = idade(vida) >= 18;
  const tem = (v: Vista34) => times.some(t => t.vista === v);
  const atual = times.find(t => t.vista === vista);

  if (vista !== 'inicio') {
    const outros = times.filter(t => t.vista !== vista);
    const onde = atual ? <>{atual.nome}</> : vista === 'futebol' ? 'Comprar um clube de futebol' : vista === 'esports' ? 'Organização de e-sports' : 'Fundar um time';
    const equipe = vista.startsWith('quadra:') ? (vida.equipes32 ?? []).find(e => `quadra:${e.id}` === vista) : undefined;
    return (
      <div className="central34">
        <Trilha34 voltar={() => setVista('inicio')} onde={onde} outros={outros.length ? outros.map(t => <button key={t.vista} type="button" className="central34__troca" onClick={() => setVista(t.vista)} title={`Abrir ${t.nome}`}>{t.nome}</button>) : undefined} />
        {vista === 'futebol' && <Clube20 vida={vida} agir={agir} />}
        {vista === 'esports' && <OrgEsports31 vida={vida} agir={agir} />}
        {vista === 'fundar' && <FundarTime32 vida={vida} agir={agir} />}
        {equipe && <CartaoEquipe32 vida={vida} agir={agir} e={equipe} />}
      </div>
    );
  }

  const portas: { vista: Vista34; titulo: string; texto: string; icone: Icone34 }[] = [];
  if (adulto && !tem('futebol')) portas.push({ vista: 'futebol', icone: 'bola', titulo: 'Comprar um clube de futebol', texto: 'Qualquer clube em que se pode jogar, de cada país: filtre por divisão, porte e bolso.' });
  if (adulto) portas.push({ vista: 'fundar', icone: 'mais', titulo: 'Fundar um time', texto: `Do zero, com escudo e cores seus: ${tem('futebol') ? '' : 'futebol, '}basquete, vôlei ou futsal. Nasce na última divisão.` });
  if (adulto && !tem('esports')) portas.push({ vista: 'esports', icone: 'controle', titulo: 'Organização de e-sports', texto: 'Funde a sua ou compre uma que já disputa as ligas — CS, Valorant, LoL e outros.' });

  return (
    <div className="central34">
      {times.length > 0 && (
        <section className="central34__secao" aria-labelledby="central34-meus">
          <h3 id="central34-meus" className="central34__titulo">{times.length === 1 ? 'Seu time' : `Seus times · ${times.length}`}</h3>
          <ul className="central34__times">
            {times.map(t => (
              <li key={t.vista}>
                <button type="button" className="central34__time" onClick={() => setVista(t.vista)} aria-label={`Abrir o painel do ${t.nome}`}>
                  <span className="central34__escudo">{t.escudo}</span>
                  <span className="central34__quem">
                    <strong>{t.nome}</strong>
                    <span>{t.tipo}</span>
                    {t.divisao && <span className="central34__div">{t.divisao}</span>}
                  </span>
                  <span className="central34__num"><small>Caixa</small><b className={t.caixa < 0 ? 'central34__ruim' : undefined}>{dinheiroCurto(t.caixa)}</b>{t.divida > 0 && <small>dívida {dinheiroCurto(t.divida)}</small>}</span>
                  {t.atencao && <span className="central34__atencao">{t.atencao}</span>}
                  <span className="central34__abrir" aria-hidden="true">Abrir o painel →</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {portas.length > 0 && (
        <section className="central34__secao" aria-labelledby="central34-novo">
          <h3 id="central34-novo" className="central34__titulo">{times.length ? 'Começar outro' : 'Ter um time'}</h3>
          {!times.length && <p className="nota">Um clube de futebol, um time de quadra ou uma organização de e-sports é uma empresa como as outras: o caixa é do time, o lucro só vira seu quando distribuído.</p>}
          <ul className="central34__portas">
            {portas.map(p => (
              <li key={p.vista}>
                <button type="button" className="central34__porta" onClick={() => setVista(p.vista)}>
                  <span className="central34__porta-icone" aria-hidden="true"><Icone i={p.icone} /></span>
                  <span><strong>{p.titulo}</strong><span>{p.texto}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!times.length && !portas.length && <p className="vazio">Ter um time é coisa de adulto: a partir dos 18 anos.</p>}
    </div>
  );
}

type Icone34 = 'bola' | 'mais' | 'controle';
/** Os ícones das portas (desenho, não emoji: nem toda tela tem a fonte). */
function Icone({ i }: { i: Icone34 }) {
  const t = i === 'bola' ? <><circle cx="12" cy="12" r="9" /><path d="M12 7.5l3.5 2.5-1.3 4h-4.4l-1.3-4z" /></> : i === 'mais' ? <path d="M12 5v14M5 12h14" /> : <><rect x="3" y="8" width="18" height="10" rx="5" /><path d="M8 11v4M6 13h4" /><circle cx="15.5" cy="12" r=".8" /><circle cx="17.5" cy="14" r=".8" /></>;
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">{t}</svg>;
}

function vistaExiste(vida: Vida, v: Vista34): boolean {
  if (v.startsWith('quadra:')) return (vida.equipes32 ?? []).some(e => `quadra:${e.id}` === v);
  return true;
}
