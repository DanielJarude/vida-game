/**
 * Vida: a vida concreta, numa área só, com seções internas estáveis —
 * Casa · Dinheiro · Compras · Tempo livre · Cidade. Antes eram três abas no
 * topo (Casa, Tempo, Cidade) e o dinheiro morava em Você; agora "onde eu
 * moro", "quanto eu tenho", "onde compro", "o que faço da semana" e "onde
 * vivo" ficam lado a lado, sem mudar de lugar com a idade (o que muda é o
 * que dá para fazer — e o porquê, quando ainda não dá).
 */

import { useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { independencia } from '../../motor/sistemas/independencia';
import { contribuicaoEsperada, leituraDaOrigem, MOTIVOS_DE_AJUDA, necessidadeDe, ROTULO_MOTIVO, principal } from '../../motor/sistemas/origem';
import { rendaPropriaMensal } from '../../motor/sistemas/dinheiro';
import { AUTONOMIA } from '../../motor/sistemas/autonomia';
import { BotaoAcao, Secao } from '../comum';
import { Lar, OQueTem, ViverACasa } from './Casa';
import { ODinheiro } from './Dinheiro';
import { Cidade } from './Cidade';
import { Icone } from './material/Desenhos';
import { Lugar, type QualLugar } from './material/Lugares';
import { dinheiroCurto } from '../leituraMaterial';
import { SECOES_VIDA, type Aba, type SecaoVida } from '../navegacao';
import '../material.css';
import { leituraDaAutoescola } from '../../motor/sistemas/autoescola';
import { lojaNaCidade } from '../../motor/sistemas/mercado';
import { disponivel } from '../../motor/sistemas/dinheiro';
import { modeloVeiculo } from '../../motor/dados/bens';

const temRaro = (v: Vida, cat: 'embarcacao' | 'aeronave') => v.financas.bens.some(b => b.tipo === 'veiculo' && modeloVeiculo(b.modeloId).categoria === cat);

interface Props { vida: Vida; agir: (a: Acao) => boolean; secao: SecaoVida; irSecao: (s: SecaoVida) => void; irPara: (a: Aba) => void; abrirPessoa: (id: string) => void }

export function VidaConcreta({ vida, agir, secao, irSecao, abrirPessoa }: Props) {
  const [lugar, setLugar] = useState<QualLugar | null>(null);
  const i = idade(vida);
  return (
    <div className={`vida-concreta vida-concreta--${secao} material`}>
      <nav className="subnav" aria-label="Seções de Vida">
        <ul role="tablist" className="subnav__lista">
          {SECOES_VIDA.map(s => (
            <li key={s.id} role="presentation">
              <button type="button" role="tab" id={`subnav-${s.id}`} aria-selected={secao === s.id} aria-controls={`secao-${s.id}`} className={`subnav__item${secao === s.id ? ' subnav__item--ativo' : ''}`} onClick={() => irSecao(s.id)} title={s.oque}>
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
            <Independencia vida={vida} agir={agir} irSecao={irSecao} />
            {i >= 18 && <ViverACasa vida={vida} agir={agir} />}
          </div>
        )}
        {secao === 'dinheiro' && (
          <div className="casa">
            {i >= 8 ? <ODinheiro vida={vida} agir={agir} irParaCasa={() => irSecao('casa')} /> : <p className="nota">Dinheiro, por enquanto, é assunto dos adultos da casa. O seu é o do cofrinho.</p>}
            <AFamilia vida={vida} agir={agir} abrirPessoa={abrirPessoa} />
            {i >= 12 && <OQueTem vida={vida} agir={agir} abrir={setLugar} />}
          </div>
        )}
        {secao === 'compras' && <Compras vida={vida} agir={agir} abrir={setLugar} />}
        {secao === 'cidade' && <Cidade vida={vida} agir={agir} irCompras={() => irSecao('compras')} />}
      </div>
      {lugar && <Lugar vida={vida} agir={agir} qual={lugar} aoFechar={() => setLugar(null)} trocar={setLugar} />}
    </div>
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

/* --------------------------------------------------------------- Compras */

interface LugarDaCidade { id: QualLugar; nome: string; oque: string; icone: string; idadeMin: number; porque?: string }

/** As lojas úteis da vida (não um shopping): o que cada uma resolve, e quando ainda não é a sua hora. */
function Compras({ vida, agir, abrir }: { vida: Vida; agir: (a: Acao) => boolean; abrir: (l: QualLugar) => void }) {
  const i = idade(vida);
  const temVeiculo = vida.financas.bens.some(b => b.tipo === 'veiculo');
  const grupos: { titulo: string; lugares: LugarDaCidade[] }[] = [
    { titulo: 'Moradia', lugares: [{ id: 'alugar', nome: 'Imobiliária', oque: 'Alugar ou comprar onde morar', icone: 'imobiliaria', idadeMin: 18, porque: AUTONOMIA.moradia.antes }] },
    { titulo: 'Transporte', lugares: [
      { id: 'concessionaria', nome: 'Concessionária', oque: 'Carros zero', icone: 'concessionaria', idadeMin: 18, porque: 'Carro é a partir dos 18, com carteira.' },
      { id: 'usados', nome: 'Carros usados', oque: 'Anúncios, cada um com uma história', icone: 'usados', idadeMin: 18, porque: 'Carro é a partir dos 18, com carteira.' },
      { id: 'motos', nome: 'Motos e bicicletas', oque: 'Novas e usadas; bicicleta é de qualquer idade', icone: 'bicicleta', idadeMin: 10, porque: 'Com essa idade, a bicicleta vem da família.' },
      // Raros e contextuais: a loja náutica perto da água, o aeroclube na cidade grande — para quem tem com que (ou já tem um).
      ...(lojaNaCidade(vida.moradia.municipioId, 'nautica') && (disponivel(vida) >= 60000 || temRaro(vida, 'embarcacao')) ? [{ id: 'nautica' as QualLugar, nome: 'Loja náutica', oque: 'Moto aquática, lancha, veleiro', icone: 'nautica', idadeMin: 18, porque: 'A partir dos 18.' }] : []),
      ...(lojaNaCidade(vida.moradia.municipioId, 'aeroclube') && (disponivel(vida) >= 350000 || temRaro(vida, 'aeronave')) ? [{ id: 'aeroclube' as QualLugar, nome: 'Aeroclube e hangar', oque: 'Ultraleve, monomotor, a formação de piloto', icone: 'aeroclube', idadeMin: 18, porque: 'A partir dos 18.' }] : []),
      ...(temVeiculo ? [{ id: 'oficina' as QualLugar, nome: 'Oficina', oque: 'Revisão e conserto', icone: 'oficina', idadeMin: 0 }] : [])
    ] },
    { titulo: 'Você', lugares: [{ id: 'estilo', nome: 'Ótica, roupas e acessórios', oque: 'Óculos, chapéus, roupas, um relógio', icone: 'loja', idadeMin: AUTONOMIA.compra_pessoal.idade, porque: AUTONOMIA.compra_pessoal.antes }] },
    { titulo: 'Dinheiro', lugares: [{ id: 'banco', nome: 'Banco', oque: 'Guardar, investir, empréstimo', icone: 'banco', idadeMin: 18, porque: 'Conta e investimento no seu nome, a partir dos 18.' }] },
    { titulo: 'Animais', lugares: [
      { id: 'abrigo', nome: 'Abrigo de animais', oque: 'Adotar um cão, um gato — às vezes, outro bicho', icone: 'abrigo', idadeMin: 18, porque: 'Adotar é coisa de adulto.' },
      { id: 'pets', nome: 'Loja e criadouro de animais', oque: 'Aves, roedores, peixes; silvestres só com documento', icone: 'loja_pets', idadeMin: 18, porque: 'Comprar um animal é coisa de adulto.' }
    ] }
  ];
  return (
    <div className="compras">
      <header className="folio">
        <p className="folio__kicker"><span className="folio__area">Vida · Compras</span></p>
        <h1 className="folio__titulo">{i < 12 ? 'As compras são dos adultos da casa' : i < 18 ? 'O que dá para comprar com o seu dinheiro' : 'Onde se resolve a vida material'}</h1>
        <p className="folio__lede">Casa, transporte, o que se usa no corpo, o banco. O preço importa: o que não cabe aparece com o motivo.</p>
      </header>
      {grupos.map(g => (
        <Secao key={g.titulo} titulo={g.titulo}>
          <ul className="lugares">
            {g.lugares.map(l => {
              const cedo = i < l.idadeMin;
              return (
                <li key={l.id}>
                  <button type="button" className={`lugar-botao${cedo ? ' lugar-botao--bloqueado' : ''}`} onClick={() => abrir(l.id)} disabled={cedo} aria-describedby={cedo ? `porque-${l.id}` : undefined}>
                    <Icone nome={l.icone} tamanho={26} />
                    <span className="lugar-botao__nome">{l.nome}</span>
                    <span className="lugar-botao__oque" id={cedo ? `porque-${l.id}` : undefined}>{cedo ? l.porque : l.oque}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {g.titulo === 'Transporte' && i >= 17 && <BotaoAcao vida={vida} acao={{ tipo: 'cnh' }} agir={agir} variante="discreto" ocultarImpossivel>Tirar carteira de motorista (autoescola)</BotaoAcao>}
          {g.titulo === 'Transporte' && leituraDaAutoescola(vida) && (
            <div className="autoescola">
              <p className="nota">{leituraDaAutoescola(vida)}</p>
              <div className="grupo-acoes grupo-acoes--linha">
                <BotaoAcao vida={vida} acao={{ tipo: 'cnh_prova' }} agir={agir} variante="secundario" ocultarBloqueado ocultarImpossivel>Fazer a prova teórica</BotaoAcao>
                <BotaoAcao vida={vida} acao={{ tipo: 'cnh_preparar', como: 'teoria' }} agir={agir} variante="discreto" ocultarImpossivel>Estudar a apostila e fazer simulados</BotaoAcao>
                <BotaoAcao vida={vida} acao={{ tipo: 'cnh_preparar', como: 'pratica' }} agir={agir} variante="discreto" ocultarImpossivel>Fazer aulas extras de direção</BotaoAcao>
              </div>
            </div>
          )}
        </Secao>
      ))}
    </div>
  );
}
