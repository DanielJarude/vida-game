/**
 * O MUNDO na interface — nunca uma aba de selects: ele aparece onde a vida
 * pergunta por ele.
 *
 *   - Nascer: em que país (busca ou região → país), em que estado/província,
 *     em que cidade.
 *   - Você: onde nasceu, de onde é (as nacionalidades), onde mora, há
 *     quanto tempo, as línguas, as mudanças de país.
 *   - Vida · Cidade: quanto custa viver aqui (na moeda daqui) e, para quem
 *     quer, mudar de país — o motivo → o país (com a porta de cada um, dita
 *     antes) → a cidade → o que muda → confirmar.
 *
 * Os países são os do catálogo (os 193 da ONU); os que ainda não podem ser
 * vividos aparecem contados, não listados como botões mortos.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MotivoMigracao, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { ORDEM_REGIOES, ROTULO_REGIAO, nomeDoPais, noPais, paisDoCatalogo, paisesVivenciaveis, perfilDoPais, todosOsPaises, gentilico } from '../../motor/mundo/registro';
import { cidadesDoPais, economiaLocal, municipio, nomeDaDivisao, nomeLugar, rotuloPerfil, NOMES_UF, MUNICIPIOS } from '../../motor/dados/lugares';
import { converterEntrePaises, formatarDinheiroCurto, nomeDaMoeda, simboloDaMoeda } from '../../motor/mundo/moeda';
import { salarioMinimoDoPais } from '../../motor/mundo/economia';
import { anosNoPais, linguasDaPessoa, nacionalidadesDaVida, paisDaVida, paisNatal } from '../../motor/mundo/vida';
import { avaliarMigracao, custoDeVidaMensal, podeNaturalizar, ROTULO_MOTIVO } from '../../motor/sistemas/migracao';
import { anoDe } from '../../motor/tempo';
import { idade } from '../../motor/nucleo';
import { BotaoAcao, Secao } from '../comum';
import { dinheiroCurto } from '../apresentar';
import type { PaisDoCatalogo, RegiaoMundial } from '../../motor/mundo/tipos';
import '../material.css';

const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function Seta() {
  return <svg className="viagem__seta" viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;
}

/**
 * Escolher um país sem despejar 190 nomes: busca por nome, ou a região e,
 * dentro dela, os países que podem ser vividos. `detalhe` escreve a linha de
 * baixo de cada país (a porta da migração, a moeda...).
 */
export function EscolherPais({ aoEscolher, excluir, detalhe, pergunta = 'Em que país?' }: { aoEscolher: (pais: string) => void; excluir?: string; detalhe?: (p: PaisDoCatalogo) => string; pergunta?: string }) {
  const [busca, setBusca] = useState('');
  const [regiao, setRegiao] = useState<RegiaoMundial | ''>('');
  const vivos = useMemo(() => paisesVivenciaveis().filter(p => p.id !== excluir).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), [excluir]);
  const todos = useMemo(() => todosOsPaises(), []);
  const achados = busca.trim().length >= 2 ? vivos.filter(p => normal(p.nome).includes(normal(busca.trim()))) : [];
  const semPerfil = busca.trim().length >= 2 ? todos.filter(p => normal(p.nome).includes(normal(busca.trim())) && !vivos.some(x => x.id === p.id) && p.id !== excluir) : [];
  const daRegiao = regiao ? vivos.filter(p => p.regiao === regiao) : [];
  const lista = busca.trim().length >= 2 ? achados : daRegiao;
  return (
    <div className="viagem mundo">
      <h3 className="viagem__pergunta">{pergunta}</h3>
      <label className="campo">
        <span className="campo__rotulo">Buscar pelo nome</span>
        <input value={busca} onChange={e => { setBusca(e.target.value); setRegiao(''); }} placeholder="Argentina, Japão, Portugal…" autoComplete="off" />
      </label>
      {busca.trim().length < 2 && !regiao && (
        <ul className="viagem__opcoes">
          {ORDEM_REGIOES.map(r => {
            const n = vivos.filter(p => p.regiao === r);
            if (!n.length) return null;
            return (
              <li key={r}>
                <button type="button" className="viagem__opcao" onClick={() => setRegiao(r)}>
                  <span className="viagem__nome">{ROTULO_REGIAO[r]}<span className="viagem__sub">{n.map(p => p.nome).join(', ')}</span></span>
                  <Seta />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {regiao && busca.trim().length < 2 && <button type="button" className="link viagem__voltar" onClick={() => setRegiao('')}>← Outras regiões</button>}
      {lista.length > 0 && (
        <ul className="viagem__opcoes">
          {lista.map(p => (
            <li key={p.id}>
              <button type="button" className="viagem__opcao" onClick={() => aoEscolher(p.id)}>
                <span className="viagem__nome">{p.nome}<span className="viagem__sub">{detalhe ? detalhe(p) : `${perfilDoPais(p.id).idiomas[0]} · ${nomeDaMoeda(p.moeda)}`}</span></span>
                <Seta />
              </button>
            </li>
          ))}
        </ul>
      )}
      {busca.trim().length >= 2 && !achados.length && <p className="nota">{semPerfil.length ? `${semPerfil.map(p => p.nome).join(', ')}: ainda não dá para viver lá no jogo.` : 'Nenhum país com esse nome.'}</p>}
      {busca.trim().length >= 2 && achados.length > 0 && semPerfil.length > 0 && <p className="nota">Ainda sem vida possível: {semPerfil.map(p => p.nome).join(', ')}.</p>}
      <p className="nota mundo__rodape">{vivos.length + (excluir ? 1 : 0)} países podem ser vividos; os outros {todos.length - vivos.length - (excluir ? 1 : 0)} do mundo existem — de onde vem alguém, para onde se viaja — e ainda não têm uma vida própria no jogo.</p>
    </div>
  );
}

/** As cidades de um país, por divisão (estado, província...). */
function divisoesDe(pais: string): { codigo: string; nome: string }[] {
  if (pais === 'BR') return [...new Set(MUNICIPIOS.map(m => m.uf))].sort((a, b) => NOMES_UF[a].localeCompare(NOMES_UF[b])).map(u => ({ codigo: u, nome: NOMES_UF[u] }));
  const usadas = new Set(cidadesDoPais(pais).map(m => m.uf));
  return [...usadas].map(c => ({ codigo: c, nome: nomeDaDivisao(cidadesDoPais(pais).find(m => m.uf === c)!) })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/** Nascer: país, divisão, cidade. O Brasil vem escolhido (é onde o VIDA começou); trocar é um passo. */
export function LugarDeNascimento({ cidade, aoMudar }: { cidade: string; aoMudar: (municipioId: string) => void }) {
  const m = municipio(cidade);
  const [trocando, setTrocando] = useState(false);
  const divisoes = useMemo(() => divisoesDe(m.pais), [m.pais]);
  const cidades = cidadesDoPais(m.pais).filter(x => x.uf === m.uf);
  const tipo = perfilDoPais(m.pais).divisao.tipo[0];
  if (trocando) return (
    <>
      <button type="button" className="link viagem__voltar" onClick={() => setTrocando(false)}>← Manter {nomeDoPais(m.pais)}</button>
      <EscolherPais pergunta="Em que país você nasce?" aoEscolher={p => { const c = cidadesDoPais(p).find(x => x.perfil === 'metropole') ?? cidadesDoPais(p)[0]; aoMudar(c.id); setTrocando(false); }} />
    </>
  );
  return (
    <div className="mundo-nascer">
      <div className="mundo-nascer__pais">
        <span className="campo__rotulo">País</span>
        <strong>{nomeDoPais(m.pais)}</strong>
        <button type="button" className="link" onClick={() => setTrocando(true)}>Trocar o país</button>
      </div>
      <div className="campos-linha">
        <label className="campo">
          <span className="campo__rotulo">{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
          <select value={m.uf} onChange={e => aoMudar(cidadesDoPais(m.pais).find(x => x.uf === e.target.value)!.id)}>
            {divisoes.map(d => <option key={d.codigo} value={d.codigo}>{d.nome}</option>)}
          </select>
        </label>
        <label className="campo">
          <span className="campo__rotulo">Cidade</span>
          <select value={cidade} onChange={e => aoMudar(e.target.value)}>
            {cidades.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

/** Uma linha do país para quem vai nascer: porte da cidade, língua, moeda — e que o lugar muda a vida. */
export function notaDoLugar(municipioId: string): string {
  const m = municipio(municipioId);
  const p = perfilDoPais(m.pais);
  const pc = paisDoCatalogo(m.pais);
  return `${m.nome}: ${rotuloPerfil(m.perfil)}${m.regiao ? ` no ${m.regiao}` : ''}, ${noPais(m.pais)}. Fala-se ${p.idiomas[0]}; a moeda é o ${nomeDaMoeda(pc.moeda)}. O lugar muda escola, faculdade, trabalho, custo de vida — e as portas que existem.`;
}

/* --------------------------------------------------------------- Você */

const ROTULO_VIA: Record<string, string> = { livre: 'livre circulação', trabalho: 'visto de trabalho', estudo: 'visto de estudante', familia: 'pela família', cidadania: 'pela nacionalidade', residencia: 'residência' };

/** Onde nasceu, de onde é, onde mora — três coisas diferentes, ditas uma vez. */
export function QuemNoMundo({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const natal = paisNatal(vida);
  const mora = paisDaVida(vida);
  const nac = nacionalidadesDaVida(vida);
  const fem = (vida.eu.tratamento ?? vida.eu.genero) === 'feminino';
  const migr = vida.mundo?.migracoes ?? [];
  const linguas = linguasDaPessoa(vida);
  const anos = anosNoPais(vida);
  const nat = podeNaturalizar(vida);
  return (
    <Secao titulo="No mundo" recolhivel aberta={migr.length > 0 || natal !== 'BR'}>
      <dl className="dados">
        <div className="dado"><dt>Nasceu em</dt><dd>{nomeLugar(vida.eu.municipioNatal)}</dd></div>
        <div className="dado"><dt>Nacionalidade</dt><dd>{nac.map(n => gentilico(n, fem)).join(' e ')}</dd></div>
        <div className="dado"><dt>Mora em</dt><dd>{nomeLugar(vida.moradia.municipioId)}{mora !== natal || migr.length ? ` · há ${anos} ${anos === 1 ? 'ano' : 'anos'} ${noPais(mora)}` : ''}</dd></div>
        <div className="dado"><dt>Fala</dt><dd>{linguas.join(', ')}</dd></div>
      </dl>
      {migr.length > 0 && (
        <ul className="mundo__mudancas">
          {migr.map((x, k) => (
            <li key={k}>{anoDe(x.t)} · {municipio(x.de).nome} → {nomeLugar(x.para)} · {ROTULO_MOTIVO[x.motivo].replace(/^para /, '')} ({ROTULO_VIA[x.via] ?? x.via})</li>
          ))}
        </ul>
      )}
      {vida.mundo?.naturalizacao && <p className="nota">O pedido de nacionalidade {noPais(vida.mundo.naturalizacao.pais).replace(/^(no|na|nos|nas|em) /, 'de ')} sai em {anoDe(vida.mundo.naturalizacao.t)}.</p>}
      {mora !== natal && !nac.includes(mora) && nat.grau !== 'impossivel' && (
        <BotaoAcao vida={vida} acao={{ tipo: 'naturalizar' }} agir={agir}>Pedir a nacionalidade {mora === 'BR' ? 'brasileira' : gentilico(mora, true)}</BotaoAcao>
      )}
    </Secao>
  );
}

/* -------------------------------------------------------- Vida · Cidade */

/** Quanto custa viver aqui, na moeda daqui. */
export function CustoDeViverAqui({ vida }: { vida: Vida }) {
  const pais = paisDaVida(vida);
  const p = perfilDoPais(pais);
  const pc = paisDoCatalogo(pais);
  const ec = economiaLocal(vida.moradia.municipioId);
  const sm = salarioMinimoDoPais(pais);
  const saude = p.saude.sistema === 'universal' ? `${p.saude.redePublica} atende todos` : p.saude.sistema === 'misto' ? `${p.saude.redePublica} atende todos; quem pode, paga um plano` : 'a saúde depende de seguro: sem plano, a conta vem cheia';
  return (
    <p className="nota mundo__custo">
      {`Aqui a moeda é o ${nomeDaMoeda(pc.moeda)} (${simboloDaMoeda(pc.moeda)}). Viver sozinho, de aluguel, custa uns ${dinheiroCurto(Math.round(ec.aluguel * 0.8 + 2200 * ec.custo))} por mês; ${p.economia.salarioMinimo !== undefined ? `o salário mínimo é ${dinheiroCurto(sm)}` : `não há salário mínimo nacional; o piso de fato fica perto de ${dinheiroCurto(sm)}`}. Na saúde, ${saude}.`}
    </p>
  );
}

const MOTIVOS: { id: MotivoMigracao; rotulo: string }[] = [
  { id: 'trabalho', rotulo: 'Trabalhar' }, { id: 'estudo', rotulo: 'Estudar' }, { id: 'familia', rotulo: 'Ficar perto da família' },
  { id: 'relacionamento', rotulo: 'Viver com quem ama' }, { id: 'oportunidade', rotulo: 'Tentar a vida' }, { id: 'pessoal', rotulo: 'Decisão própria' }
];

/** Mudar de país, em passos: o motivo → o país (com a porta dita) → a cidade → o que muda → confirmar. */
export function MudarDePais({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [motivo, setMotivo] = useState<MotivoMigracao | ''>('');
  const [pais, setPais] = useState('');
  const [cidade, setCidade] = useState('');
  const titulo = useRef<HTMLHeadingElement>(null);
  const aqui = paisDaVida(vida);
  const passo = !motivo ? 'motivo' : !pais ? 'pais' : !cidade ? 'cidade' : 'resumo';
  useEffect(() => { titulo.current?.focus(); }, [passo]);
  if (idade(vida) < 18) return null;
  const voltar = () => (cidade ? setCidade('') : pais ? setPais('') : setMotivo(''));
  const av = cidade && motivo ? avaliarMigracao(vida, cidade, motivo) : undefined;
  const trilha = [MOTIVOS.find(x => x.id === motivo)?.rotulo, pais && nomeDoPais(pais), cidade && municipio(cidade).nome].filter(Boolean).join(' · ');
  const porta = (p: PaisDoCatalogo) => {
    const c = cidadesDoPais(p.id).find(x => x.capitalNacional) ?? cidadesDoPais(p.id)[0];
    const a = avaliarMigracao(vida, c.id, motivo as MotivoMigracao);
    return a.via ? `${ROTULO_VIA[a.via] ?? a.via} · custa uns ${dinheiroCurto(a.custo)}` : `porta fechada: ${a.veredito.motivo ?? ''}`;
  };
  return (
    <Secao titulo="Mudar de país" recolhivel aberta={false}>
      <p className="nota">Mudar de país não é viajar: a casa, o trabalho, o dinheiro e a língua mudam juntos. Viagem não muda onde você mora; isto muda.</p>
      {passo !== 'motivo' && (
        <div className="viagem__trilha">
          <button type="button" className="link viagem__voltar" onClick={voltar}>← Voltar</button>
          <span className="viagem__onde">{trilha}</span>
        </div>
      )}
      {passo === 'motivo' && (
        <div className="viagem">
          <h3 ref={titulo} tabIndex={-1} className="viagem__pergunta">Para quê?</h3>
          <ul className="viagem__opcoes">
            {MOTIVOS.map(x => <li key={x.id}><button type="button" className="viagem__opcao" onClick={() => setMotivo(x.id)}><span className="viagem__nome">{x.rotulo}</span><Seta /></button></li>)}
          </ul>
        </div>
      )}
      {passo === 'pais' && <EscolherPais pergunta="Para onde?" excluir={aqui} detalhe={porta} aoEscolher={setPais} />}
      {passo === 'cidade' && (
        <div className="viagem">
          <h3 ref={titulo} tabIndex={-1} className="viagem__pergunta">Qual cidade?</h3>
          <ul className="viagem__opcoes">
            {cidadesDoPais(pais).filter(x => x.perfil !== 'pequena' || x.capital).map(x => (
              <li key={x.id}><button type="button" className="viagem__opcao" onClick={() => setCidade(x.id)}>
                <span className="viagem__nome">{x.nome}<span className="viagem__sub">{nomeDaDivisao(x)} · {rotuloPerfil(x.perfil)}</span></span>
                <span className="viagem__preco">aluguel {formatarDinheiroCurto(economiaLocal(x.id).aluguel, pais)}/mês</span>
                <Seta />
              </button></li>
            ))}
          </ul>
        </div>
      )}
      {passo === 'resumo' && av && (
        <div className="viagem__resumo">
          <h3 ref={titulo} tabIndex={-1} className="viagem__pergunta">{nomeLugar(cidade)}</h3>
          <p className="nota">{av.via ? `A porta: ${ROTULO_VIA[av.via] ?? av.via}.` : av.veredito.motivo} Lá, viver sozinho custa uns {formatarDinheiroCurto(custoDeVidaMensal(pais), pais)} por mês — perto de {dinheiroCurto(converterEntrePaises(custoDeVidaMensal(pais), pais, aqui))} do seu dinheiro de hoje, pelo câmbio.</p>
          {av.partes.length > 0 && <ul className="mundo__partes">{av.partes.map((x, k) => <li key={k}>{x}</li>)}</ul>}
          <div className="consequencias">
            <p className="consequencias__titulo">Se você se mudar {noPais(pais).replace(/^(no|na|nos|nas|em) /, (m: string) => ({ 'no ': 'para o ', 'na ': 'para a ', 'nos ': 'para os ', 'nas ': 'para as ', 'em ': 'para ' } as Record<string, string>)[m])}:</p>
            <ul>{av.consequencias.map((x, k) => <li key={k}>{x}</li>)}</ul>
          </div>
          <p className="viagem__total"><span>A mudança custa uns</span> <strong>{dinheiroCurto(av.custo)}</strong></p>
          <BotaoAcao vida={vida} acao={{ tipo: 'migrar', municipioId: cidade, motivo: motivo as MotivoMigracao }} agir={agir} variante="principal" aoAgir={() => { setMotivo(''); setPais(''); setCidade(''); }}>Mudar para {municipio(cidade).nome}</BotaoAcao>
        </div>
      )}
    </Secao>
  );
}
