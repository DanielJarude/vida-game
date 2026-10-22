/**
 * Vida: a vida concreta, numa área só, com seções internas estáveis —
 * Casa · Dinheiro · Compras · Patrimônio · Cidade · Viagens (REWORK 9; Patrimônio no 9.5). Antes eram três abas no
 * topo (Casa, Tempo, Cidade) e o dinheiro morava em Você; agora "onde eu
 * moro", "quanto eu tenho", "onde compro", "o que faço da semana" e "onde
 * vivo" ficam lado a lado, sem mudar de lugar com a idade (o que muda é o
 * que dá para fazer — e o porquê, quando ainda não dá).
 */

import { Compras } from './Compras';
import { emCasa } from '../leitura';
import { rotuloDe } from '../apresentar';
import { idadePessoa } from '../../motor/nucleo';
import { Retrato } from '../avatar/Retrato';
import { coisasDaVida } from '../../motor/sistemas/coisas';
import { coisa } from '../../motor/dados/coisas';
import { varianteDe } from '../../motor/sistemas/pertences';
import { DesenhoObjeto } from './material/Objetos';
import { Pertences } from './Pertences';
import { useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { independencia } from '../../motor/sistemas/independencia';
import { contribuicaoEsperada, leituraDaOrigem, MOTIVOS_DE_AJUDA, necessidadeDe, ROTULO_MOTIVO, principal, mesadaDaFamilia, recursosDaFamilia } from '../../motor/sistemas/origem';
import { rendaPropriaMensal } from '../../motor/sistemas/dinheiro';
import { AUTONOMIA } from '../../motor/sistemas/autonomia';
import { BotaoAcao, CabecaDaArea, navegarAbas, Secao } from '../comum';
import { recenteDe, TEMAS_VIDA } from '../area';
import { ondeMora } from '../apresentar';
import { nomeLugar } from '../../motor/dados/lugares';
import { balanco, seguranca } from '../../motor/sistemas/dinheiro';
import { leituraDaSeguranca } from '../leituraMaterial';
import { Lar, OQueTem, ViverACasa } from './Casa';
import { ODinheiro } from './Dinheiro';
import { Cidade } from './Cidade';
import { Lugar, type QualLugar } from './material/Lugares';
import { dinheiroCurto } from '../leituraMaterial';
import { SECOES_VIDA, type Aba, type SecaoVida } from '../navegacao';
import { Experiencias } from './Tempo';
import '../material.css';
import { sobDemanda } from '../util/sobDemanda';

/** REWORK 10 · JOG-01: os jogos num pacote à parte (só carregam quando se abre a seção; o service worker guarda para o offline). */
const Apostas = sobDemanda(() => import('./Apostas').then(m => m.Apostas));

interface Props { vida: Vida; agir: (a: Acao) => boolean; secao: SecaoVida; irSecao: (s: SecaoVida) => void; irPara: (a: Aba) => void; abrirPessoa: (id: string) => void }

export function VidaConcreta({ vida, agir, secao, irSecao, abrirPessoa }: Props) {
  const [lugar, setLugar] = useState<QualLugar | null>(null);
  const i = idade(vida);
  return (
    <div className={`vida-concreta vida-concreta--${secao} material`}>
      <CabecaVida vida={vida} secao={secao} irSecao={irSecao} />
      <nav className="subnav" aria-label="Seções de Vida">
        <ul role="tablist" className="subnav__lista" onKeyDown={navegarAbas}>
          {SECOES_VIDA.map(s => (
            <li key={s.id} role="presentation">
              <button type="button" role="tab" id={`subnav-${s.id}`} aria-selected={secao === s.id} tabIndex={secao === s.id ? 0 : -1} aria-controls={`secao-${s.id}`} className={`subnav__item${secao === s.id ? ' subnav__item--ativo' : ''}`} onClick={() => irSecao(s.id)} title={s.oque}>
                {s.rotulo}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div role="tabpanel" id={`secao-${secao}`} aria-labelledby={`subnav-${secao}`}>
        {secao === 'casa' && (
          <div className="casa">
            <Lar vida={vida} agir={agir} abrir={setLugar} />
            <QuemMoraAqui vida={vida} abrirPessoa={abrirPessoa} />
            <NaCasa vida={vida} irSecao={irSecao} />
            <Independencia vida={vida} agir={agir} irSecao={irSecao} />
            {i >= 18 && <ViverACasa vida={vida} agir={agir} />}
          </div>
        )}
        {secao === 'dinheiro' && (
          <div className="casa">
            {i >= 8 ? <ODinheiro vida={vida} agir={agir} irParaCasa={() => irSecao('casa')} /> : <p className="nota">Dinheiro, por enquanto, é assunto dos adultos da casa. O seu é o do cofrinho.</p>}
            {i >= 6 && i < 16 && <DinheiroDaCrianca vida={vida} agir={agir} irCompras={() => irSecao('compras')} />}
            <AFamilia vida={vida} agir={agir} abrirPessoa={abrirPessoa} />
            {i >= 12 && <p className="nota">Os bens, o aplicado e o balanço do que é seu estão em <button type="button" className="link" onClick={() => irSecao('pertences')}>Patrimônio →</button></p>}
          </div>
        )}
        {secao === 'compras' && <Compras vida={vida} agir={agir} abrir={setLugar} />}
        {/* REWORK 9.5: o patrimônio é um inventário — o balanço e os bens grandes (imóveis, veículos, aplicações, dívidas
            presas a bens) e, depois, os objetos (usar, cuidar, vender). Antes, metade disso morava em Dinheiro. */}
        {secao === 'pertences' && (
          <div className="patrimonio">
            {i >= 12 && <OQueTem vida={vida} agir={agir} abrir={setLugar} />}
            <Pertences vida={vida} agir={agir} abrir={setLugar} semVeiculos={i >= 12} />
          </div>
        )}
        {secao === 'cidade' && <Cidade vida={vida} agir={agir} irCompras={() => irSecao('compras')} abrir={setLugar} />}
        {/* REWORK 9: as viagens são experiência material (destino, custo, com quem) — saíram de Tempo livre. */}
        {secao === 'viagens' && (i >= 12 ? <Experiencias vida={vida} agir={agir} /> : <p className="nota">Viajar, por enquanto, é com a família — quando ela decide ir.</p>)}
        {secao === 'apostas' && <Apostas vida={vida} agir={agir} />}
      </div>
      {lugar && <Lugar vida={vida} agir={agir} qual={lugar} aoFechar={() => setLugar(null)} trocar={setLugar} />}
    </div>
  );
}

/**
 * REWORK 10 · UX-13 — a cabeça de Vida: onde mora, como está o dinheiro e o que é seu (o líquido), o que mudou há pouco
 * na casa e no dinheiro, e o próximo passo quando o dinheiro aperta (ou quando sair de casa já cabe).
 */
function CabecaVida({ vida, secao, irSecao }: { vida: Vida; secao: SecaoVida; irSecao: (s: SecaoVida) => void }) {
  const i = idade(vida);
  const seg = leituraDaSeguranca(vida);
  const nivel = seguranca(vida).nivel;
  const aperta = i >= 18 && (nivel === 'no_vermelho' || nivel === 'apertado');
  const liquido = i >= 12 ? balanco(vida).liquido : 0;
  const emCasaDosPais = vida.moradia.tipo === 'pais' || vida.moradia.tipo === 'parente';
  return (
    <CabecaDaArea area="Vida" kicker={SECOES_VIDA.find(x => x.id === secao)!.rotulo.toLowerCase()} titulo={`${ondeMora(vida).charAt(0).toUpperCase()}${ondeMora(vida).slice(1)}, em ${nomeLugar(vida.moradia.municipioId)}`}
      fatos={[
        ...(i >= 8 ? [{ rotulo: 'O dinheiro', valor: seg.palavra, tom: aperta ? 'ruim' as const : undefined }] : []),
        ...(i >= 12 && liquido !== 0 ? [{ rotulo: 'O que é seu', valor: dinheiroCurto(liquido), tom: liquido < 0 ? 'ruim' as const : undefined }] : []),
        ...(i >= 16 ? [{ rotulo: 'Quem paga a casa', valor: independencia(vida).palavra }] : [])
      ]}
      recente={recenteDe(vida, TEMAS_VIDA)}
      proximo={aperta && secao !== 'dinheiro' ? { texto: 'O mês não fecha: o extrato diz para onde vai o dinheiro e o que dá para cortar.', rotulo: 'Ver o dinheiro', ir: () => irSecao('dinheiro') }
        : emCasaDosPais && i >= 18 && rendaPropriaMensal(vida) > 0 && secao !== 'casa' ? { texto: 'Com renda própria, dá para pensar em sair de casa.', rotulo: 'Ver a casa', ir: () => irSecao('casa') } : undefined} />
  );
}

/* ------------------------------------------------- Quem mora, o que há (REWORK 7) */

/** Quem divide a casa com você: os rostos (e os bichos), um toque abre a ficha — a casa é gente antes de ser imóvel. */
function QuemMoraAqui({ vida, abrirPessoa }: { vida: Vida; abrirPessoa: (id: string) => void }) {
  const c = emCasa(vida);
  if (!c.pessoas.length) return null;
  return (
    <Secao titulo="Quem mora com você">
      <ul className="moradores">
        {c.pessoas.map(p => {
          const vin = vida.vinculos[p.id];
          return (
            <li key={p.id}>
              <button type="button" className="morador" onClick={() => abrirPessoa(p.id)}>
                <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.pet?.semente ?? p.id} tamanho={56} especie={p.especie} porte={p.pet?.porte} rotulo={p.nome} />
                <span className="morador__nome">{p.nome || 'Bebê'}</span>
                {vin && <span className="morador__papel">{rotuloDe(vida, p, vin)}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </Secao>
  );
}

/** O que há dentro de casa: as coisas (as suas e as da casa), como objetos — o uso e a venda moram em Patrimônio. */
function NaCasa({ vida, irSecao }: { vida: Vida; irSecao: (s: SecaoVida) => void }) {
  const lista = coisasDaVida(vida);
  if (!lista.length) return null;
  return (
    <Secao titulo="O que há em casa">
      <ul className="na-casa">
        {lista.slice(0, 10).map(t => { const c = coisa(t.coisaId); const x = varianteDe(t); return c ? <li key={t.id} title={c.nome}><DesenhoObjeto coisaId={t.coisaId} cor={x.cor} tamanho={52} rotulo={`${c.nome}, ${x.nome}`} /><span>{c.nome.charAt(0).toUpperCase() + c.nome.slice(1)}</span></li> : null; })}
      </ul>
      <button type="button" className="link" onClick={() => irSecao('pertences')}>Usar, cuidar, vender — em Patrimônio →</button>
    </Secao>
  );
}

/* ---------------------------------------------------------- Independência */

/** Quem paga a casa onde você mora — a transição, não uma data (`independencia`). */
function Independencia({ vida, agir, irSecao }: { vida: Vida; agir: (a: Acao) => boolean; irSecao: (s: SecaoVida) => void }) {
  const l = independencia(vida);
  const i = idade(vida);
  const emCasa = vida.moradia.tipo === 'pais' || vida.moradia.tipo === 'parente';
  const renda = rendaPropriaMensal(vida);
  const esperado = contribuicaoEsperada(vida);
  const c = vida.origem.contribuicao ?? 'combinado';
  const mudanca = necessidadeDe(vida, 'mudanca');
  return (
    <Secao titulo="Quem paga a casa">
      <p className={`independencia independencia--${l.fase}`}><strong>{l.palavra}.</strong> {l.texto}</p>
      {emCasa && i >= AUTONOMIA.contribuir.idade && renda > 0 && (
        <div className="grupo-acoes grupo-acoes--linha" aria-label="Quanto você põe em casa">
          <span className="rotulo-pequeno">Nas contas de casa{esperado > 0 ? ` (a casa precisaria de uns ${dinheiroCurto(renda * esperado)}/mês)` : ''}:</span>
          {c !== 'combinado' && <BotaoAcao vida={vida} acao={{ tipo: 'contribuicao', valor: 'combinado' }} agir={agir} variante="discreto">{esperado > 0 ? 'Pôr o combinado' : 'Não pôr nada (a casa não precisa)'}</BotaoAcao>}
          {c !== 'mais' && <BotaoAcao vida={vida} acao={{ tipo: 'contribuicao', valor: 'mais' }} agir={agir} variante="discreto">Pôr mais</BotaoAcao>}
          {c !== 'nada' && esperado > 0 && <BotaoAcao vida={vida} acao={{ tipo: 'contribuicao', valor: 'nada' }} agir={agir} variante="discreto">Não pôr nada</BotaoAcao>}
        </div>
      )}
      {mudanca && i >= 18 && (
        <p className="nota">Sair de casa pede {dinheiroCurto(mudanca.valor)} a mais do que você tem ({mudanca.texto}). <button type="button" className="link" onClick={() => irSecao('dinheiro')}>Pedir ajuda à família, em Dinheiro →</button></p>
      )}
    </Secao>
  );
}

/* ------------------------------------------------------------- O dinheiro da criança (REWORK 10.5 · ECO-04) */

/**
 * O que a criança pode fazer com e por dinheiro — sempre pela família: pedir, ganhar com uma tarefa ou com brigadeiros
 * (um adulto ajudando), guardar e, com o que guardou, comprar o que é da idade (a chuteira, o tabuleiro, o violino).
 */
function DinheiroDaCrianca({ vida, agir, irCompras }: { vida: Vida; agir: (a: Acao) => boolean; irCompras: () => void }) {
  return (
    <Secao titulo="O seu dinheiro">
      <p className="nota">No cofrinho: <strong>{dinheiroCurto(Math.max(0, vida.financas.conta))}</strong>. Com o que guardar, dá para comprar o que é da sua idade — com a família junto.</p>
      {/* REWORK 10.6 · INF-03: de onde vem o dinheiro (e com que frequência): o que é seu, o que é da casa. */}
      <ul className="origem-do-dinheiro" aria-label="De onde vem o seu dinheiro">
        {mesadaDaFamilia(vida) > 0 ? <li><strong>Mesada</strong> · {dinheiroCurto(mesadaDaFamilia(vida))} todo mês, da família (uns 40% sobram para guardar; o resto vai em lanche e miudezas)</li> : <li><strong>Mesada</strong> · {idade(vida) < 8 ? 'a partir dos 8 anos' : 'a casa não tem folga para mesada agora'}</li>}
        <li><strong>Pedir aos responsáveis</strong> · uma vez por ano{vida.anoAtual.acoes.includes('crianca:pedir') ? ' (já pedido este ano)' : ''}; para algo da loja, o pedido é na própria loja</li>
        <li><strong>Tarefas pagas e brigadeiros</strong> · uma vez por ano cada, sempre com um adulto</li>
        <li><strong>Presentes</strong> · no aniversário, às vezes (os avós)</li>
        <li><strong>O dinheiro da casa</strong> · {['está no limite', 'está apertado', 'dá para o mês', 'sobra um pouco', 'sobra bastante'][recursosDaFamilia(vida).folga] ?? 'é da família'} — é dos adultos, não seu</li>
      </ul>
      <div className="grupo-acoes">
        <BotaoAcao vida={vida} acao={{ tipo: 'crianca', oque: 'pedir' }} agir={agir} variante="secundario">Pedir dinheiro aos responsáveis</BotaoAcao>
        <BotaoAcao vida={vida} acao={{ tipo: 'crianca', oque: 'tarefas' }} agir={agir} variante="discreto">Combinar tarefas de casa pagas</BotaoAcao>
        <BotaoAcao vida={vida} acao={{ tipo: 'crianca', oque: 'brigadeiro' }} agir={agir} variante="discreto">Vender brigadeiros (com um adulto ajudando)</BotaoAcao>
      </div>
      {idade(vida) >= 8 && <button type="button" className="link" onClick={irCompras}>Ver o que dá para comprar →</button>}
    </Secao>
  );
}

/* ------------------------------------------------------------- A família */

/** A casa de onde você veio: como ela está hoje, o que já passou entre vocês, e o pedido (quando há uma necessidade). */
function AFamilia({ vida, agir, abrirPessoa }: { vida: Vida; agir: (a: Acao) => boolean; abrirPessoa: (id: string) => void }) {
  const i = idade(vida);
  const pr = principal(vida);
  const apoios = (vida.origem.apoios ?? []).filter(a => a.sentido !== 'negado' || vida.t - a.t <= 36).slice(-4).reverse();
  const motivos = MOTIVOS_DE_AJUDA.filter(m => necessidadeDe(vida, m));
  return (
    <Secao titulo="A família">
      <p className="nota">{leituraDaOrigem(vida)}{vida.origem.bairro ? ` Você cresceu ${vida.origem.bairro}.` : ''}</p>
      {apoios.length > 0 && (
        <ul className="apoios">
          {apoios.map((a, k) => {
            const p = a.pessoaId ? vida.pessoas[a.pessoaId] : undefined;
            return <li key={k}><span className="apoios__ano">{anoDe(a.t)}</span> {a.sentido === 'recebeu' ? `${p?.nome ?? 'A família'} ajudou ${ROTULO_MOTIVO[a.motivo]}: ${dinheiroCurto(a.valor)}` : a.sentido === 'deu' ? `Você ajudou ${p?.nome ?? 'a família'}: ${dinheiroCurto(a.valor)}` : `Pediu ajuda ${ROTULO_MOTIVO[a.motivo]}; não houve como`}</li>;
          })}
        </ul>
      )}
      {i >= AUTONOMIA.pedir_ajuda.idade && pr && motivos.length > 0 && (
        <div className="grupo-acoes">
          {motivos.map(m => <BotaoAcao key={m} vida={vida} acao={{ tipo: 'pedir_ajuda_familia', motivo: m }} agir={agir} variante="secundario" mostrarChance>{`Pedir ajuda a ${pr.p.nome} ${ROTULO_MOTIVO[m]} (${dinheiroCurto(necessidadeDe(vida, m)!.valor)})`}</BotaoAcao>)}
        </div>
      )}
      {pr && <button type="button" className="link" onClick={() => abrirPessoa(pr.p.id)}>Falar com {pr.p.nome}, em Pessoas →</button>}
    </Secao>
  );
}
