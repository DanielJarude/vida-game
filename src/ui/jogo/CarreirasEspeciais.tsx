/**
 * REWORK 11.5 · UI-01 — AS CARREIRAS ESPECIAIS COM CARA PRÓPRIA. Cada uma abre com o lugar dela, desenhado (traço
 * simples, sem marca nem escudo real), e com o que o motor tem daquele ofício — nada aqui é enfeite sem dado:
 *
 *   CampoDoAtleta      o campo (ou a quadra) com a posição marcada, o escudo genérico do clube, a temporada pela
 *                      posição (o goleiro conta jogos sem sofrer gol; o atacante, gols), o que se disputa no ano
 *   PranchetaDoTecnico a prancheta: a formação de cada estratégia (que muda os jogos no motor), o vestiário, a diretoria,
 *                      os rivais da divisão, o campeão do ano — e o treinador de goleiros, quando é o caso
 *   ClaqueteDoAtor     o set: o que está em produção, as propostas, a crítica e o público do último trabalho, os prêmios
 *   PalcoDoMusico      o palco: o papel na música, os shows do ano, os freelas, os direitos, o repertório (crítica × público)
 *   PlenarioDoPolitico o plenário: o mandato, a aprovação, a próxima eleição, as alianças e as promessas — com as ações
 *
 * Os painéis de antes (`Trabalho`) seguem embaixo, com o detalhe; estes são a cabeça de cada carreira.
 */
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { BotaoAcao } from '../comum';
import { anoDe } from '../../motor/tempo';
import { dinheiroCurto } from '../leituraMaterial';
import { hashMisturado } from '../../motor/rng';
import { paisDaCidade } from '../../motor/dados/lugares';
import { nomePosicao } from '../../motor/sistemas/esporte';
import { competicaoDe } from '../../motor/sistemas/palmares';
import { classificadoParaContinental, nomeDaCompeticao, idDaCopa, confederacaoDe, idContinental } from '../../motor/sistemas/competicoes';
import { EFEITO_DO_ESTILO, FORMACAO_DO_ESTILO, passagemAtual, type EstiloDeJogo } from '../../motor/sistemas/tecnico';
import { leituraDoTreinadorDeGoleiros } from '../../motor/sistemas/treinadorDeGoleiros';
import { papelNaMusica, rendaDeDireitos } from '../../motor/sistemas/musica';
import { leituraDasAliancas } from '../../motor/sistemas/aliancas';
import { leituraPolitica, proximaEleicao } from '../../motor/sistemas/politica';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** O escudo genérico: a forma e as iniciais, a cor tirada do nome (nunca o escudo real). */
export function Escudo({ nome, tamanho = 44 }: { nome: string; tamanho?: number }) {
  const h = Math.floor(hashMisturado(`escudo:${nome}`) * 360);
  const iniciais = nome.replace(/^(o|a|os|as|equipe de [a-zôê]+ de) /i, '').split(/\s+/).filter(p => p.length > 2 || /^[A-Z]/.test(p)).slice(0, 2).map(p => p[0]).join('').toUpperCase() || nome.slice(0, 2).toUpperCase();
  return (
    <svg className="escudo" width={tamanho} height={tamanho * 1.15} viewBox="0 0 40 46" role="img" aria-label={`Escudo de ${nome} (desenho genérico)`}>
      <path d="M20 2 L37 8 L35 28 Q31 40 20 44 Q9 40 5 28 L3 8 Z" fill={`hsl(${h} 45% 38%)`} stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12 L32 12" stroke={`hsl(${(h + 40) % 360} 60% 75%)`} strokeWidth="3" />
      <text x="20" y="31" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">{iniciais}</text>
    </svg>
  );
}

/* ---------------------------------------------------------------- o atleta */

/** Onde cada posição fica no campo (de baixo para cima: o gol é embaixo). */
const NO_CAMPO: Record<string, [number, number]> = { goleiro: [50, 92], zagueiro: [50, 76], lateral: [18, 70], volante: [50, 60], meia: [50, 44], ponta: [82, 30], atacante: [50, 16] };

function Campo({ posicao, quadra }: { posicao?: string; quadra?: 'basquete' | 'volei' }) {
  const [x, y] = posicao ? NO_CAMPO[posicao] ?? [50, 50] : [50, 50];
  if (quadra) return (
    <svg className="gramado gramado--quadra" viewBox="0 0 100 60" role="img" aria-label={quadra === 'basquete' ? 'A quadra de basquete' : 'A quadra de vôlei'}>
      <rect x="2" y="2" width="96" height="56" rx="2" className="gramado__grama" />
      <line x1="50" y1="2" x2="50" y2="58" className="gramado__linha" />
      {quadra === 'basquete' ? <><circle cx="50" cy="30" r="8" className="gramado__linha" /><path d="M2 14 Q22 30 2 46" className="gramado__linha" /><path d="M98 14 Q78 30 98 46" className="gramado__linha" /></> : <><line x1="35" y1="2" x2="35" y2="58" className="gramado__linha" /><line x1="65" y1="2" x2="65" y2="58" className="gramado__linha" /></>}
      <circle cx="30" cy="30" r="4" className="gramado__voce" />
    </svg>
  );
  return (
    <svg className="gramado" viewBox="0 0 100 100" role="img" aria-label={posicao ? `O campo, com a sua posição: ${posicao}` : 'O campo'}>
      <rect x="2" y="2" width="96" height="96" rx="2" className="gramado__grama" />
      <line x1="2" y1="50" x2="98" y2="50" className="gramado__linha" />
      <circle cx="50" cy="50" r="10" className="gramado__linha" />
      <rect x="30" y="82" width="40" height="16" className="gramado__linha" />
      <rect x="30" y="2" width="40" height="16" className="gramado__linha" />
      <circle cx={x} cy={y} r="4.5" className="gramado__voce" />
    </svg>
  );
}

export function CampoDoAtleta({ vida }: { vida: Vida }) {
  const es = vida.caminhos.esporte;
  if (!es || es.fase !== 'profissional') return null;
  const t = es.temporadas?.[es.temporadas.length - 1];
  const futebol = es.modalidade === 'futebol';
  const quadra = es.modalidade === 'basquete' || es.modalidade === 'volei' ? es.modalidade : undefined;
  if (!futebol && !quadra) return null;
  const pais = paisDaCidade(es.municipioId);
  const ano = anoDe(vida.t);
  // O que se disputa nesta temporada (as mesmas regras do motor: a liga da divisão; a copa nacional de quem joga as
  // divisões nacionais; a continental de quem se classificou no ano anterior).
  const disputas = [competicaoDe(es.modalidade, es.nivel, pais), ...(futebol && es.nivel >= 2 ? [nomeDaCompeticao(idDaCopa(pais))] : []), ...(futebol && classificadoParaContinental(vida, pais, ano, es.clube) ? [nomeDaCompeticao(idContinental(confederacaoDe(pais)))] : [])];
  const titulos = (vida.caminhos.palmares ?? []).filter(c => c.tipo === 'titulo' && c.modalidade === es.modalidade).length;
  const goleiro = es.posicao === 'goleiro';
  const defensor = es.posicao === 'zagueiro' || es.posicao === 'lateral' || es.posicao === 'volante';
  const numeros: [string, string][] = !t ? [] : goleiro
    ? [['Jogos', String(t.partidas)], ['Sem sofrer gol', String(t.semSofrerGol ?? '—')], ['Gols sofridos', String(t.golsSofridos ?? '—')], ['Nota', t.nota.toFixed(1)]]
    : es.modalidade === 'basquete'
      ? [['Jogos', String(t.partidas)], ['Pontos/jogo', String(t.pontos ?? '—')], ['Rebotes/jogo', String(t.rebotes ?? '—')], ['Assist./jogo', String(t.assistencias)]]
      : defensor
        ? [['Jogos', String(t.partidas)], ['Desarmes', String(t.defesa ?? '—')], ['Gols', String(t.gols)], ['Nota', t.nota.toFixed(1)]]
        : [['Jogos', String(t.partidas)], ['Gols', String(t.gols)], ['Assistências', String(t.assistencias)], ['Nota', t.nota.toFixed(1)]];
  return (
    <section className="carreira-especial carreira-especial--campo" aria-label="Em campo">
      <div className="carreira-especial__cena">
        <Campo posicao={futebol ? es.posicao : undefined} quadra={quadra} />
        <div className="carreira-especial__identidade">
          <Escudo nome={es.clube} />
          <div>
            <p className="carreira-especial__nome">{es.clube}</p>
            <p className="carreira-especial__sub">{futebol && es.posicao ? cap(nomePosicao(vida, es.posicao)) : cap(es.modalidade === 'basquete' ? 'basquete' : 'vôlei')} · {es.espaco === 'titular' ? 'titular' : 'reserva'}{es.contratoAte ? ` · contrato até ${anoDe(es.contratoAte)}` : ''}</p>
          </div>
        </div>
      </div>
      {t && (
        <div className="placar-da-temporada" aria-label={`A temporada ${t.ano}`}>
          <p className="placar-da-temporada__titulo">Temporada {t.ano} · {t.colocacao}º lugar</p>
          <dl className="placar-da-temporada__numeros">{numeros.map(([k, n]) => <div key={k}><dt>{k}</dt><dd>{n}</dd></div>)}</dl>
        </div>
      )}
      <p className="carreira-especial__nota">Nesta temporada: {disputas.join(' · ')}. {titulos ? `${titulos} ${titulos === 1 ? 'título' : 'títulos'} na carreira (a galeria está no Histórico).` : 'Nenhum título ainda.'}</p>
    </section>
  );
}

/* ---------------------------------------------------------------- o técnico */

const FORMACOES: Record<EstiloDeJogo, [number, number][]> = {
  ofensivo: [[50, 92], [15, 72], [38, 76], [62, 76], [85, 72], [30, 52], [50, 56], [70, 52], [20, 26], [50, 20], [80, 26]],
  equilibrado: [[50, 92], [15, 72], [38, 76], [62, 76], [85, 72], [15, 48], [38, 52], [62, 52], [85, 48], [38, 24], [62, 24]],
  defensivo: [[50, 92], [10, 66], [30, 76], [50, 78], [70, 76], [90, 66], [30, 50], [50, 52], [70, 50], [38, 24], [62, 24]]
};

function Prancheta({ estilo }: { estilo: EstiloDeJogo }) {
  return (
    <svg className="prancheta__desenho" viewBox="0 0 100 100" role="img" aria-label={`A formação: ${FORMACAO_DO_ESTILO[estilo]}`}>
      <rect x="2" y="2" width="96" height="96" rx="3" className="prancheta__fundo" />
      <line x1="2" y1="50" x2="98" y2="50" className="prancheta__linha" />
      <circle cx="50" cy="50" r="10" className="prancheta__linha" />
      <rect x="30" y="82" width="40" height="16" className="prancheta__linha" />
      {FORMACOES[estilo].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="3.6" className="prancheta__peca" />)}
    </svg>
  );
}

export function PranchetaDoTecnico({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const c = vida.caminhos.tecnico;
  const p = passagemAtual(vida);
  const g = leituraDoTreinadorDeGoleiros(vida);
  const goleiros = vida.trabalho.atual?.ocupacaoId === 'treinador_goleiros';
  if (!p && !(goleiros && g)) return null;
  const estilo = c?.estilo ?? 'equilibrado';
  const ult = p?.temporadas[p.temporadas.length - 1];
  return (
    <section className="carreira-especial carreira-especial--prancheta" aria-label="A prancheta">
      {p && (
        <>
          <div className="carreira-especial__cena">
            <Prancheta estilo={estilo} />
            <div className="carreira-especial__identidade">
              <Escudo nome={p.clube} />
              <div>
                <p className="carreira-especial__nome">{p.clube}</p>
                <p className="carreira-especial__sub">No comando · {FORMACAO_DO_ESTILO[estilo]} · {EFEITO_DO_ESTILO[estilo]}</p>
              </div>
            </div>
          </div>
          <div className="grupo-acoes prancheta__estrategias" role="group" aria-label="A estratégia">
            {(['ofensivo', 'equilibrado', 'defensivo'] as EstiloDeJogo[]).map(x => (
              <BotaoAcao key={x} vida={vida} acao={{ tipo: 'tatica', estilo: x }} agir={agir} variante={x === estilo ? 'principal' : 'secundario'} semAviso>{`${FORMACAO_DO_ESTILO[x]} (${x})`}</BotaoAcao>
            ))}
          </div>
          <dl className="placar-da-temporada__numeros">
            <div><dt>Vestiário</dt><dd>{p.vestiario >= 65 ? 'fechado com você' : p.vestiario >= 45 ? 'sem queixas' : 'dividido'}</dd></div>
            <div><dt>Diretoria</dt><dd>{p.pressao >= 70 ? 'o cargo balança' : p.pressao >= 50 ? 'cobrando' : 'confiante'}</dd></div>
            {ult && <div><dt>Temporada {ult.ano}</dt><dd>{ult.colocacao ? `${ult.colocacao}º` : '—'} · {ult.v}V {ult.e}E {ult.d}D</dd></div>}
            {ult?.campeao && <div><dt>Campeão</dt><dd>{ult.campeao}</dd></div>}
          </dl>
          {ult?.rivais && ult.rivais.length > 0 && <p className="carreira-especial__nota">Os rivais mais fortes da divisão: {ult.rivais.join(', ')}.</p>}
          {c?.proposta && <p className="carreira-especial__nota">Há uma proposta de outro clube na mesa (em "O que dá para fazer agora").</p>}
        </>
      )}
      {goleiros && g && (
        <div className="prancheta__goleiros">
          <p className="carreira-especial__nome">Treinador de goleiros · {g.clube}</p>
          <p className="carreira-especial__sub">{cap(g.degrau)} desde {g.desde} · {g.revelados ? `${g.revelados} ${g.revelados === 1 ? 'goleiro revelado' : 'goleiros revelados'}` : 'nenhum goleiro revelado ainda'} · {g.tecnicos} {g.tecnicos === 1 ? 'técnico' : 'técnicos'} no clube</p>
          <ol className="sub-diario">{g.historico.slice(0, 5).map((h, k) => <li key={k}><span className="margem__ano">{h.ano}</span> {h.texto}</li>)}</ol>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- o ator */

const NOTA = ['passou em branco', 'teve público', 'repercutiu', 'marcou'];

export function ClaqueteDoAtor({ vida }: { vida: Vida }) {
  const av = vida.caminhos.audiovisual;
  const cv = vida.caminhos.curriculo ?? [];
  const ultimo = cv[cv.length - 1];
  const producao = (av?.contratos ?? []).filter(c => c.status === 'em_producao');
  const propostas = (av?.contratos ?? []).filter(c => c.status === 'proposta').length;
  const premios = cv.filter(x => x.premio?.venceu).length;
  return (
    <section className="carreira-especial carreira-especial--set" aria-label="No set">
      <div className="claquete" aria-hidden>
        <span className="claquete__topo" />
        <span className="claquete__texto">{producao.length ? `"${producao[0].titulo}"` : 'Entre trabalhos'}</span>
      </div>
      <dl className="placar-da-temporada__numeros">
        <div><dt>Em produção</dt><dd>{producao.length || 'nada'}</dd></div>
        <div><dt>Propostas</dt><dd>{propostas || 'nenhuma'}</dd></div>
        <div><dt>Trabalhos</dt><dd>{cv.length}</dd></div>
        <div><dt>Prêmios</dt><dd>{premios || 'nenhum'}</dd></div>
      </dl>
      {ultimo && <p className="carreira-especial__nota">O último trabalho: "{ultimo.titulo}" ({ultimo.papel}). Crítica: {NOTA[ultimo.repercussao]} · público: {NOTA[ultimo.publico ?? ultimo.repercussao]}{ultimo.cache ? ` · cachê de ${dinheiroCurto(ultimo.cache)}` : ''}.</p>}
    </section>
  );
}

/* ---------------------------------------------------------------- o músico */

const PAPEL: Record<string, string> = { solo: 'carreira solo', banda: 'na banda', contratado: 'contratado por outros artistas', compositor: 'compositor' };

export function PalcoDoMusico({ vida }: { vida: Vida }) {
  const papel = papelNaMusica(vida);
  const p = vida.caminhos.palco;
  const obras = (vida.caminhos.obras ?? []).filter(o => o.linguagem === 'musica');
  const direitos = rendaDeDireitos(vida);
  const premios = obras.filter(o => o.premio?.venceu).length;
  return (
    <section className="carreira-especial carreira-especial--palco" aria-label="No palco">
      <svg className="ribalta" viewBox="0 0 100 40" role="img" aria-label="O palco">
        <path d="M0 40 L10 26 L90 26 L100 40 Z" className="ribalta__chao" />
        <path d="M20 0 L34 26 L46 26 Z" className="ribalta__luz" />
        <path d="M80 0 L54 26 L66 26 Z" className="ribalta__luz" />
        <circle cx="50" cy="20" r="4" className="ribalta__voce" />
      </svg>
      <dl className="placar-da-temporada__numeros">
        <div><dt>Na música</dt><dd>{papel ? PAPEL[papel] : '—'}</dd></div>
        <div><dt>Shows em {p?.ano ?? '—'}</dt><dd>{p ? p.apresentacoes : '—'}</dd></div>
        <div><dt>O que ficou</dt><dd>{p ? dinheiroCurto(p.artista + (p.freelas ?? 0)) : '—'}</dd></div>
        <div><dt>Direitos</dt><dd>{direitos ? `${dinheiroCurto(direitos)}/mês` : 'nenhum'}</dd></div>
      </dl>
      {p?.freelas ? <p className="carreira-especial__nota">Além dos shows, aulas e gravações para outros artistas: {dinheiroCurto(p.freelas)} no ano.</p> : null}
      {obras.length > 0 && (
        <div>
          <p className="carreira-especial__sub">O repertório{premios ? ` · ${premios} ${premios === 1 ? 'prêmio' : 'prêmios'}` : ''}</p>
          <ol className="repertorio">{[...obras].reverse().slice(0, 5).map((o, k) => <li key={k}><span className="margem__ano">{anoDe(o.t)}</span> "{o.titulo}" — crítica: {NOTA[o.recepcao]}; público: {NOTA[o.comercial ?? o.recepcao]}</li>)}</ol>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- o político */

export function PlenarioDoPolitico({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const l = leituraPolitica(vida);
  const p = vida.caminhos.politica;
  if (!l || !p) return null;
  const m = p.mandato;
  const prox = proximaEleicao(vida.t);
  const al = leituraDasAliancas(vida);
  const ativas = al.aliancas.filter(a => a.rompida === undefined);
  return (
    <section className="carreira-especial carreira-especial--plenario" aria-label="O plenário">
      <div className="carreira-especial__cena">
        <svg className="plenario__selo" viewBox="0 0 60 60" role="img" aria-label="O selo do cargo (desenho genérico)">
          <circle cx="30" cy="30" r="27" className="plenario__aro" />
          <path d="M14 40 L46 40 M17 36 L43 36 M20 22 L20 36 M26 22 L26 36 M34 22 L34 36 M40 22 L40 36 M16 22 L30 13 L44 22 Z" className="plenario__traco" />
        </svg>
        <div>
          <p className="carreira-especial__nome">{l.titulo}</p>
          <p className="carreira-especial__sub">{m ? `Mandato até ${anoDe(m.tFim)} · aprovação ${Math.round(m.aprovacao)}%` : l.etapa}{` · próxima eleição em ${prox.ano}`}</p>
        </div>
      </div>
      <div className="plenario__bloco">
        <p className="carreira-especial__sub">Alianças</p>
        {ativas.length === 0 && <p className="carreira-especial__nota">Nenhuma aliança agora.</p>}
        <ul className="sub-contatos">
          {al.aliancas.map(a => (
            <li key={a.id} className={`sub-contato${a.rompida !== undefined ? ' sub-contato--afastado' : ''}`}>
              <p className="sub-contato__nome"><span>{a.nome}</span><span className="sub-contato__papel">{a.grupo} · desde {a.desde}{a.rompida !== undefined ? ` · rompida em ${a.rompida} (${a.porQuem === 'voce' ? 'por você' : 'pelo aliado'})` : ` · confiança ${a.confianca}${a.favores > 0 ? ` · deve-lhe ${a.favores}` : a.favores < 0 ? ` · você deve ${-a.favores}` : ''}`}</span></p>
              {a.rompida === undefined && (
                <div className="grupo-acoes">
                  <BotaoAcao vida={vida} acao={{ tipo: 'alianca', oque: 'pedir_apoio', id: a.id }} agir={agir} variante="discreto" ocultarImpossivel>Pedir apoio na campanha</BotaoAcao>
                  <BotaoAcao vida={vida} acao={{ tipo: 'alianca', oque: 'romper', id: a.id }} agir={agir} variante="discreto" ocultarImpossivel>Romper a aliança</BotaoAcao>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="grupo-acoes">
          <BotaoAcao vida={vida} acao={{ tipo: 'alianca', oque: 'formar' }} agir={agir} variante="secundario" ocultarImpossivel>Fechar uma aliança</BotaoAcao>
          <BotaoAcao vida={vida} acao={{ tipo: 'alianca', oque: 'prometer' }} agir={agir} variante="secundario" ocultarImpossivel>Fazer uma promessa ao eleitor</BotaoAcao>
        </div>
      </div>
      {al.promessas.length > 0 && (
        <div className="plenario__bloco">
          <p className="carreira-especial__sub">Promessas</p>
          <ul className="sub-contatos">
            {al.promessas.slice(0, 6).map(x => (
              <li key={x.id} className={`sub-contato sub-contato--${x.estado === 'aberta' ? 'ativo' : x.estado === 'quebrada' ? 'traiu' : 'ativo'}`}>
                <p className="sub-contato__nome"><span>{cap(x.texto)}</span><span className="sub-contato__papel">{x.origem === 'campanha' ? 'ao eleitor' : 'a um aliado'} · {x.estado === 'aberta' ? `prazo: ${x.prazo}` : x.estado}</span></p>
                {x.estado === 'aberta' && x.origem === 'alianca' && <BotaoAcao vida={vida} acao={{ tipo: 'alianca', oque: 'cumprir', id: x.id }} agir={agir} variante="discreto" ocultarImpossivel>Cumprir agora</BotaoAcao>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
