/**
 * REWORK 7 — O QUE VOCÊ PRATICA: cada atividade da semana como uma parte contínua da vida, não um item de catálogo.
 *
 * O cartão (na semana e em cada aba de Tempo livre) diz, de relance: o que é, há quanto tempo, como você está nisso
 * (os degraus da habilidade, com a palavra), o que está acontecendo agora (a etapa do time, o último marco) e o que a
 * atividade faz com a sua vida. Um toque abre a FICHA DA PRÁTICA: a evolução, o que ela muda, com o que se pratica
 * (o violão, a chuteira), quem você conheceu ali, a história — e o que dá para fazer em seguida (a dedicação, a
 * porta aberta, parar).
 *
 * Tudo vem de `leituraDaPratica` (o estado que o motor guarda); os botões são as ações do motor de sempre.
 */

import { useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idadePessoa } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { MODS as MODS_ESPORTE } from '../../motor/sistemas/oportunidades';
import { usosDaCoisa } from '../../motor/dados/pertences';
import { podeTentar } from '../../motor/plausibilidade';
import { disponibilidadeUsarCoisa, varianteDe } from '../../motor/sistemas/pertences';
import { precoDaCoisa } from '../../motor/sistemas/coisas';
import { ultimaDevolutiva } from '../../motor/sistemas/devolutivas';
import { BotaoAcao, Degraus, Folha, Percurso } from '../comum';
import { dinheiroCurto, rotuloDe } from '../apresentar';
import { Retrato } from '../avatar/Retrato';
import { DesenhoObjeto } from './material/Objetos';
import { Emblema } from './Emblemas';
import type { LeituraPratica } from '../leituraPratica';
import type { Aba } from '../navegacao';
import { Trajetoria } from './Voce';

const CATEGORIA: Record<LeituraPratica['categoria'], string> = {
  esporte: 'Esporte', arte: 'Arte', estudo: 'Estudo', social: 'Gente e comunidade', oficio: 'Ofício', corpo: 'Corpo', lazer: 'Lazer', renda: 'Dinheiro por fora', cuidado: 'Cuidado'
};

const ESTADO_COISA = (e: number) => (e >= 80 ? 'nova' : e >= 50 ? 'boa' : e >= 25 ? 'gasta' : 'no fim');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "há 4 anos", "começou este ano". */
export const tempoNaSemana = (l: LeituraPratica) => (l.anosNaSemana < 1 ? 'começou este ano' : `há ${l.anosNaSemana} ${l.anosNaSemana === 1 ? 'ano' : 'anos'}`);

/** O que está acontecendo agora nessa prática, numa linha: a etapa do time, o último marco recente, a porta aberta. */
export function agoraNaPratica(vida: Vida, l: LeituraPratica): string | undefined {
  if (l.portas.length) return `Uma porta aberta: ${l.portas[0].titulo.charAt(0).toLowerCase()}${l.portas[0].titulo.slice(1)}.`;
  if (l.arco) return `Agora: ${l.arco}.`;
  const recente = l.historia.find(h => h.tipo !== 'comeco' && vida.t - h.t <= 24);
  return recente ? recente.texto : undefined;
}

interface PropsCartao { vida: Vida; l: LeituraPratica; abrir: () => void; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void; leitura?: string }

/** O cartão de uma prática: reconhecível de relance, com o que importa — e a ficha a um toque. */
export function CartaoPratica({ vida, l, abrir, agir, irPara, leitura }: PropsCartao) {
  const agora = agoraNaPratica(vida, l);
  // A frase da frente que só repete o degrau ("Rabisca por gosto.") não aparece duas vezes.
  const repete = (x?: string) => !!x && !!l.principal && x.replace(/\.$/, '').toLowerCase() === l.principal.palavra.toLowerCase();
  if (repete(leitura)) leitura = undefined;
  const bom = l.efeitos.filter(e => e.id !== 'semana' && e.id !== 'corpo' && e.id !== 'mente').slice(0, 2);
  return (
    <li className={`pratica pratica--${l.categoria}`}>
      <button type="button" className="pratica__abrir" onClick={abrir} aria-label={`${l.nome}: abrir a história desta prática`}>
        <Emblema id={l.id} categoria={l.categoria} tamanho={44} />
        <span className="pratica__cabeca">
          <strong className="pratica__nome">{l.nome}</strong>
          <span className="pratica__tempo">{tempoNaSemana(l)}{l.niveis.length > 1 ? ` · ${l.rotuloNivel.toLowerCase()}` : ''}</span>
        </span>
        {l.principal ? <Degraus estagio={l.principal.estagio} auge={l.principal.auge} rotulo={cap(l.principal.nome)} palavra={l.principal.palavra} />
          : l.pessoal && <Degraus estagio={l.pessoal.nivel - 1} total={5} rotulo={l.pessoal.nome} palavra={`${l.pessoal.nome.toLowerCase()}: ${l.pessoal.palavra}`} compacto={!!leitura && leitura.toLowerCase().includes(l.pessoal.nome.toLowerCase())} />}
      </button>
      <div className="pratica__corpo">
        <p className="pratica__linha">{l.dose}{l.custoMes ? ` · ${dinheiroCurto(l.custoMes)}/mês` : l.id === 'terapia' && l.niveis[0].custo === 0 ? ' · na rede pública, de graça' : ''}{l.renda ? ` · rende uns ${dinheiroCurto(l.renda)}/mês` : ''}</p>
        {bom.length > 0 && <p className="pratica__efeitos">{bom.map(e => <span key={e.id} className={`pratica__efeito pratica__efeito--${e.tom}`}>{e.texto}</span>)}</p>}
        {leitura && <p className="pratica__leitura rotina__leitura">{leitura}</p>}
        {agora && <p className="pratica__agora">{agora}</p>}
        {l.daFormacao && irPara && <button type="button" className="link pratica__ir" onClick={() => irPara('formacao')}>ver em Caminhos →</button>}
        {!l.daFormacao && l.niveis.length > 1 && l.nivel < l.niveis.length && (
          <div className="pratica__acao">
            <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: l.id, ativa: true, nivel: (l.nivel + 1) as 2 | 3 }} agir={agir} variante="discreto" ocultarBloqueado>{`Mais a sério: ${l.niveis[l.nivel].rotulo.toLowerCase()}`}</BotaoAcao>
          </div>
        )}
      </div>
    </li>
  );
}

interface PropsFicha { vida: Vida; l: LeituraPratica; agir: (a: Acao) => boolean; aoFechar: () => void; irPara?: (a: Aba) => void; abrirPessoa?: (id: string) => void }

/** A ficha da prática: a evolução, o que muda, com o quê, com quem, a história — e o que dá para fazer agora. */
export function FichaPratica({ vida, l, agir, aoFechar, irPara, abrirPessoa }: PropsFicha) {
  const [verPessoas, setVerPessoas] = useState(false);
  const p = l.principal;
  const peneira = ultimaDevolutiva(vida, 'peneira', 36);
  const fundamentos = p && MODS_ESPORTE.includes(p.d) && !l.daFormacao;
  const usos = l.coisas.flatMap(({ t }) => usosDaCoisa(t.coisaId).filter(u => !u.com && podeTentar(disponibilidadeUsarCoisa(vida, t.id, u.id))).map(u => ({ t, u }))).slice(0, 3);
  const carreira = (l.categoria === 'arte' || l.categoria === 'esporte') && p && p.estagio >= 3 && !vida.caminhos.esporte && !vida.caminhos.arte?.ativo;
  const ir = (a: Aba) => { aoFechar(); irPara?.(a); };
  return (
    <Folha rotulo={l.nome} aoFechar={aoFechar} largura="larga">
      <article className={`ficha-pratica pratica--${l.categoria}`}>
        <header className="ficha-pratica__topo">
          <Emblema id={l.id} categoria={l.categoria} tamanho={60} />
          <div className="ficha-pratica__titulos">
            <p className="ficha-pratica__kicker">{CATEGORIA[l.categoria]} · na semana desde {anoDe(l.desde)}{l.idadeDesde > 0 ? `, aos ${l.idadeDesde}` : ''}</p>
            <h2 className="ficha-pratica__nome">{l.nome}</h2>
            <p className="ficha-pratica__agora">{l.niveis.length > 1 ? `${l.rotuloNivel} · ` : ''}{l.dose}{l.custoMes ? ` · ${dinheiroCurto(l.custoMes)}/mês` : ' · de graça'}{l.renda ? ` · rende uns ${dinheiroCurto(l.renda)}/mês` : ''}</p>
          </div>
        </header>

        <div className="ficha-pratica__colunas">
          <div className="ficha-pratica__coluna">
            {p && (
              <section className="ficha-pratica__bloco" aria-label="Como você está nisso">
                <h3 className="ficha-pratica__sub">Como você está nisso</h3>
                <Degraus estagio={p.estagio} auge={p.auge} rotulo={cap(p.nome)} palavra={p.palavra} />
                {!p.frase.toLowerCase().startsWith(p.palavra.toLowerCase()) && <p className="ficha-pratica__frase">{p.frase}</p>}
                <p className="nota">{p.anos >= 1 ? `${p.anos} ${p.anos === 1 ? 'ano' : 'anos'} de prática de verdade` : 'Menos de um ano de prática'}{p.auge > p.estagio ? ` · já esteve melhor: ${p.palavraAuge}` : ''}{p.retomadas > 0 ? ` · parou e voltou ${p.retomadas === 1 ? 'uma vez' : `${p.retomadas} vezes`}` : ''}.</p>
              </section>
            )}
            {!p && l.pessoal && (
              <section className="ficha-pratica__bloco" aria-label="Como você está nisso">
                <h3 className="ficha-pratica__sub">O que isso desenvolve: {l.pessoal.nome.toLowerCase()}</h3>
                <Degraus estagio={l.pessoal.nivel - 1} total={5} rotulo={l.pessoal.nome} palavra={l.pessoal.palavra} />
                <Trajetoria pontos={l.pessoal.pontos} nome={l.pessoal.nome} />
                <p className="nota">{l.pessoal.d === 'condicionamento' ? 'O condicionamento é o corpo inteiro: esta prática conta junto com o resto do que você faz (e com a idade, o sono, a saúde).' : 'O aprendizado sobe devagar, com os anos — e a cabeça cheia o derruba.'}</p>
              </section>
            )}
            {l.arco && <p className="ficha-pratica__arco"><span className="rotulo-pequeno">Agora</span> {cap(l.arco)}.</p>}
            {l.relacionadas.length > 0 && (
              <section className="ficha-pratica__bloco" aria-label="O que mais isso exercita">
                <h3 className="ficha-pratica__sub">{p ? 'Exercita também' : 'O que isso exercita'}</h3>
                <ul className="ficha-pratica__habilidades">
                  {l.relacionadas.map(h => <li key={h.d}><span className="ficha-pratica__hab">{cap(h.nome)}</span><Degraus estagio={h.estagio} auge={h.auge} rotulo={cap(h.nome)} palavra={h.palavra} /></li>)}
                </ul>
              </section>
            )}
            <section className="ficha-pratica__bloco" aria-label="O que isso muda na sua vida">
              <h3 className="ficha-pratica__sub">O que isso muda na sua vida</h3>
              <ul className="ficha-pratica__efeitos">{l.efeitos.map(e => <li key={e.id} className={`ficha-pratica__efeito--${e.tom}`}>{cap(e.texto)}</li>)}</ul>
            </section>
            {(l.coisas.length > 0 || l.ajudaria) && (
              <section className="ficha-pratica__bloco" aria-label="Com o que você pratica">
                <h3 className="ficha-pratica__sub">Com o que você pratica</h3>
                {l.coisas.length > 0 ? (
                  <ul className="ficha-pratica__coisas">
                    {l.coisas.map(({ t, c }) => { const vari = varianteDe(t); return (
                      <li key={t.id}><DesenhoObjeto coisaId={t.coisaId} cor={vari.cor} tamanho={48} rotulo={`${c.nome}, ${vari.nome}`} /><span><strong>{cap(c.nome)}</strong><span className="nota">{vari.nome} · {ESTADO_COISA(t.estado)} · desde {anoDe(t.t)}</span></span></li>
                    ); })}
                  </ul>
                ) : l.ajudaria && (
                  <p className="nota ficha-pratica__ajudaria"><DesenhoObjeto coisaId={l.ajudaria.c.id} tamanho={40} /> <span>Sem equipamento próprio. {cap(l.ajudaria.c.nome)} ({dinheiroCurto(precoDaCoisa(vida, l.ajudaria.c.id))}) faria a prática render mais.{irPara && <> <button type="button" className="link" onClick={() => ir('compras')}>Ver nas lojas →</button></>}</span></p>
                )}
                {usos.length > 0 && <div className="grupo-acoes grupo-acoes--linha">{usos.map(({ t, u }) => <BotaoAcao key={`${t.id}:${u.id}`} vida={vida} acao={{ tipo: 'usar_coisa', coisaTidaId: t.id, uso: u.id }} agir={agir} variante="secundario">{u.rotulo}</BotaoAcao>)}</div>}
              </section>
            )}
            {l.pessoas.length > 0 && (
              <section className="ficha-pratica__bloco" aria-label="Gente que você conheceu aqui">
                <h3 className="ficha-pratica__sub">Gente que você conheceu aqui</h3>
                <ul className="ficha-pratica__gente">
                  {(verPessoas ? l.pessoas : l.pessoas.slice(0, 4)).map(({ p: q, vin }) => (
                    <li key={q.id}>
                      <button type="button" className="ficha-pratica__pessoa" onClick={() => { aoFechar(); abrirPessoa?.(q.id); }} disabled={!abrirPessoa}>
                        <Retrato visual={q.visual} genero={q.genero} idade={idadePessoa(vida, q)} semente={q.id} tamanho={40} rotulo={q.nome} especie={q.especie} />
                        <span><strong>{q.nome}</strong><span className="nota">{rotuloDe(vida, q, vin)}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
                {l.pessoas.length > 4 && <button type="button" className="botao botao--discreto" onClick={() => setVerPessoas(x => !x)}>{verPessoas ? 'Menos' : `Todos (${l.pessoas.length})`}</button>}
              </section>
            )}
          </div>

          <div className="ficha-pratica__coluna ficha-pratica__coluna--agir">
            <section className="ficha-pratica__bloco ficha-pratica__agir" aria-label="O que dá para fazer">
              <h3 className="ficha-pratica__sub">O que dá para fazer</h3>
              {l.portas.map(o => (
                <div key={o.id} className="ficha-pratica__porta">
                  <p><strong>{o.titulo}</strong> <span className="nota">até {anoDe(o.tFim)}</span></p>
                  <BotaoAcao vida={vida} acao={{ tipo: 'oportunidade', id: o.id, aceitar: true }} agir={agir} variante="principal">Aceitar</BotaoAcao>
                </div>
              ))}
              {l.daFormacao ? (
                <p className="nota">Esta atividade é da sua formação: a dedicação e a saída ficam em {irPara ? <button type="button" className="link" onClick={() => ir('formacao')}>Caminhos →</button> : 'Caminhos'}.</p>
              ) : (
                <>
                  {l.niveis.length > 1 && (
                    <div className="dedicacao" role="group" aria-label="Dedicação">
                      <p className="rotulo-pequeno">Dedicação</p>
                      <ul className="dedicacao__niveis">
                        {l.niveis.map(x => (
                          <li key={x.n} className={`dedicacao__nivel${x.n === l.nivel ? ' dedicacao__nivel--atual' : ''}`}>
                            {x.n === l.nivel
                              ? <span className="dedicacao__atual" aria-current="true"><strong>{x.rotulo}</strong><span>{x.dose}{x.custo ? ` · ${dinheiroCurto(x.custo)}/mês` : ''} · agora</span></span>
                              : <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: l.id, ativa: true, nivel: x.n }} agir={agir} variante="secundario">{x.n > l.nivel ? `Mais a sério: ${x.rotulo.toLowerCase()}` : `Mais leve: ${x.rotulo.toLowerCase()}`}</BotaoAcao>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {fundamentos && <BotaoAcao vida={vida} acao={{ tipo: 'perseguir', oque: 'treino_fundamentos', valor: p!.d } as unknown as Acao} agir={agir} variante={peneira?.falta === 'tecnica' ? 'secundario' : 'discreto'} ocultarImpossivel>Programa de fundamentos, com treinador (dura o próximo ano)</BotaoAcao>}
                  {carreira && irPara && <button type="button" className="botao botao--discreto" onClick={() => ir('oportunidades')}>{l.categoria === 'esporte' ? 'Tentar ir mais longe (peneiras, clubes) — em Caminhos' : 'Tentar viver disso (banda, grupo, editais) — em Caminhos'}</button>}
                  <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: l.id, ativa: false }} agir={agir} variante="discreto" aoAgir={aoFechar}>Parar</BotaoAcao>
                </>
              )}
            </section>
            <section className="ficha-pratica__bloco" aria-label="A história desta prática">
              <h3 className="ficha-pratica__sub">A história</h3>
              <Percurso rotulo={`A história: ${l.nome}`} passos={l.historia.map((h, k) => ({ chave: `${h.t}:${k}`, quando: anoDe(h.t), texto: h.texto, peso: h.peso, tipo: h.tipo }))} mostrar={6} />
            </section>
          </div>
        </div>
      </article>
    </Folha>
  );
}
