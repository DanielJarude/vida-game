/**
 * REWORK 12.2 — os lugares novos da cidade: a loja de animais exóticos (o que a lei do lugar deixa, a instalação que
 * cada espécie pede, o cuidado) e os mercados de procedência duvidosa (a feira, o antiquário dos papéis vagos, a
 * negociação privada, o mercado por fora). Nada aqui calcula regra: vem de `sistemas/exoticos` e `sistemas/paralelos`.
 */

import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { animal, palavraDoBicho } from '../../../motor/dados/animais';
import { economiaLocal } from '../../../motor/dados/lugares';
import { EXOTICOS, INSTALACOES, instalacao, lojaDeExoticosNaCidade, ofertasExoticas, precoDaInstalacao, proibidosAqui, temInstalacao } from '../../../motor/sistemas/exoticos';
import { custoDeInvestigar, MERCADOS_PARALELOS, ofertaDeAnimalPorFora, ofertasParalelas, resultadoDaInvestigacao, zoologicosParaResgate, type MercadoParalelo } from '../../../motor/sistemas/paralelos';
import { BotaoAcao } from '../../comum';
import { Retrato } from '../../avatar/Retrato';
import { dinheiroCurto } from '../../leituraMaterial';

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export function LojaDeExoticos({ vida, agir, aoComprar }: { vida: Vida; agir: (a: Acao) => boolean; aoComprar?: () => void }) {
  const lista = ofertasExoticas(vida);
  const proibidos = proibidosAqui(vida);
  const c = economiaLocal(vida.moradia.municipioId).custo;
  const [verInst, setVerInst] = useState(false);
  if (!lojaDeExoticosNaCidade(vida.moradia.municipioId)) return <p className="nota">Loja de exóticos, criadouro autorizado e veterinário que conheça a espécie, só nas cidades grandes.</p>;
  return (
    <div className="exoticos">
      <p className="nota">Só o que a lei daqui deixa vender, de criadouro autorizado e com documento. Cada espécie pede a sua instalação (sem ela, a loja não vende), veterinário que a conheça, custo todo mês e tempo — ou alguém pago para cuidar quando você viaja.</p>
      <ul className="animais">
        {lista.map(o => {
          const a = animal(o.especie);
          const r = EXOTICOS[o.especie]!;
          const inst = instalacao(o.instalacao)!;
          const tem = temInstalacao(vida, o.instalacao);
          return (
            <li key={o.id} className="animal">
              <Retrato visual={undefined} genero={o.genero} idade={o.idade} semente={o.id} tamanho={64} especie={o.especie} rotulo={o.nome} />
              <div className="animal__texto">
                <strong>{cap(palavraDoBicho(o.especie, o.genero, false))}</strong>
                <span>{a.descricao}</span>
                <span className="animal__jeito">Vive uns {a.vida[0]} a {a.vida[1]} anos · uns {dinheiroCurto(a.custo * c)}/mês · {r.alimentacao} · {r.social}{r.especialista ? ' · pede veterinário de exóticos' : ''}</span>
                <span className="animal__jeito">Precisa de: {inst.nome.toLowerCase()} ({tem ? 'você já tem' : `${dinheiroCurto(precoDaInstalacao(vida, o.instalacao))}, montado antes`}) · riscos: {r.riscos.fuga >= 0.05 ? 'foge pela menor fresta' : r.riscos.fuga > 0 ? 'fuga rara' : 'não foge'}{r.riscos.acidente ? ', pode machucar uma visita' : ''}</span>
                <span className="oferta__motivo">{o.legal === 'licenca' ? `Pede licença de mantenedor (${dinheiroCurto(o.licenca)}). ` : ''}Documentos: {o.documentos}.</span>
              </div>
              <BotaoAcao vida={vida} acao={{ tipo: 'exotico_comprar', ofertaId: o.id }} agir={a2 => { const ok = agir(a2); if (ok) aoComprar?.(); return ok; }}>{`Comprar (${dinheiroCurto(o.preco + o.licenca)})`}</BotaoAcao>
            </li>
          );
        })}
      </ul>
      {!lista.length && <p className="nota">Nada à venda este ano.</p>}
      <details className="detalhes" open={verInst} onToggle={ev => setVerInst((ev.target as HTMLDetailsElement).open)}>
        <summary>As instalações (montar antes de trazer o bicho)</summary>
        <ul className="ofertas">
          {INSTALACOES.map(x => (
            <li key={x.id} className="oferta oferta--estilo">
              <span className="oferta__texto"><strong>{x.nome}</strong><span>{x.descricao}</span><span className="nota">Depois, uns {dinheiroCurto(x.mensal * c)}/mês de luz, filtro e manutenção.</span></span>
              <span className="oferta__preco">{dinheiroCurto(precoDaInstalacao(vida, x.id))}</span>
              <span className="oferta__comprar">{temInstalacao(vida, x.id) ? <span className="nota">Já tem.</span> : <BotaoAcao vida={vida} acao={{ tipo: 'instalacao_comprar', instalacao: x.id }} agir={agir} variante="secundario">Montar</BotaoAcao>}</span>
            </li>
          ))}
        </ul>
      </details>
      {proibidos.length > 0 && (
        <div className="exoticos__proibidos">
          <p className="rotulo-pequeno">Não se vende aqui</p>
          <ul>{proibidos.map(p => <li key={p.especie}><strong>{cap(p.nome)}</strong>: {p.porque}.</li>)}</ul>
        </div>
      )}
    </div>
  );
}

const SINAL_DA_INVESTIGACAO = { legitima: 'nada de errado encontrado', falsificada: 'o especialista diz que é cópia', roubada: 'consta numa lista de peças procuradas', sem_nota: 'entrou no país sem nota' } as const;

export function MercadoParaleloDaCidade({ vida, agir, mercado, aoComprar }: { vida: Vida; agir: (a: Acao) => boolean; mercado: MercadoParalelo; aoComprar?: () => void }) {
  const cfg = MERCADOS_PARALELOS[mercado];
  const lista = ofertasParalelas(vida, mercado);
  const bicho = mercado === 'feira' || mercado === 'por_fora' ? ofertaDeAnimalPorFora(vida) : undefined;
  const zoos = bicho ? zoologicosParaResgate(vida, bicho) : [];
  return (
    <div className={`mercado-incerto mercado-incerto--${mercado}`}>
      <p className="nota">{cfg.frase}</p>
      <p className="nota">{cfg.legal ? 'Comprar aqui não é crime. Mas barato não é garantia: há cópia, há peça roubada — e quem compra o que é roubado perde a peça quando ela é achada.' : 'Aqui, comprar sem perguntar é receptação: a peça pode ser apreendida, e quem comprou sabendo responde.'} Investigar custa e acerta quase sempre — não sempre.</p>
      <ul className="ofertas">
        {lista.map(o => {
          const inv = resultadoDaInvestigacao(vida, o);
          const resolvida = vida.fatos[`pp_feito_${o.id}`] !== undefined;
          return (
            <li key={o.id} className="oferta oferta--estilo mercado-incerto__oferta">
              <span className="oferta__texto">
                <strong>{cap(o.nome)}</strong>
                <span className="nota">Numa loja de verdade, com papel, valeria uns {dinheiroCurto(o.valorDeMercado)}.</span>
                <span className="nota">O que se vê: {o.sinais.join('; ')}.</span>
                {inv && <span className={`oferta__motivo${inv === 'legitima' ? '' : ' oferta__motivo--ruim'}`}>A investigação: {SINAL_DA_INVESTIGACAO[inv]}.</span>}
              </span>
              <span className="oferta__preco">{dinheiroCurto(o.preco)}</span>
              <span className="oferta__comprar grupo-acoes">
                {resolvida ? <span className="nota">Resolvido.</span> : <>
                  <BotaoAcao vida={vida} acao={{ tipo: 'paralelo', ofertaId: o.id, oque: 'investigar' }} agir={agir} variante="discreto" ocultarBloqueado>{`Investigar a procedência (${dinheiroCurto(custoDeInvestigar(vida, o))})`}</BotaoAcao>
                  <BotaoAcao vida={vida} acao={{ tipo: 'paralelo', ofertaId: o.id, oque: 'comprar' }} agir={a => { const ok = agir(a); if (ok) aoComprar?.(); return ok; }} variante="secundario">Comprar</BotaoAcao>
                  <BotaoAcao vida={vida} acao={{ tipo: 'paralelo', ofertaId: o.id, oque: 'denunciar' }} agir={agir} variante="discreto">Denunciar</BotaoAcao>
                </>}
              </span>
            </li>
          );
        })}
      </ul>
      {!lista.length && <p className="nota">Nada interessante hoje.</p>}
      {bicho && (
        <div className="mercado-incerto__bicho" role="group" aria-label="Uma oferta de animal">
          <p><strong>Alguém oferece {bicho.bicho}</strong>, {bicho.texto}.</p>
          <p className="nota">Não é produto: é animal tirado da natureza ou trazido sem documento — comprar é crime e alimenta quem tira. Dá para recusar, ou denunciar (o resgate é do órgão ambiental).</p>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={{ tipo: 'animal_por_fora', oque: 'recusar' }} agir={agir} variante="discreto" ocultarBloqueado>Recusar</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'animal_por_fora', oque: 'denunciar' }} agir={agir} variante="secundario" ocultarBloqueado>Denunciar à polícia ambiental</BotaoAcao>
            {zoos.map(e => <BotaoAcao key={e.id} vida={vida} acao={{ tipo: 'animal_por_fora', oque: 'acolher', empresaId: e.id }} agir={agir} variante="secundario" ocultarBloqueado>{`Acolher o resgatado no ${e.nome}`}</BotaoAcao>)}
          </div>
        </div>
      )}
    </div>
  );
}
