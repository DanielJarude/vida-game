/**
 * REWORK 12.4 — VIDA PERSONALIZADA, na tela. Pacote carregado sob demanda (só quando a casa, o guarda-roupa, a garagem
 * ou os gostos aparecem), com a mesma regra em todos os painéis: VER primeiro, MEXER só quando se pede.
 *
 *   CasaPorDentro        o conforto (e o porquê, recolhido), os cômodos como uma fileira de nomes; um cômodo de cada vez
 *                        abre o seu painel (o que tem nele; e, num segundo clique, os acabamentos e o uso). Ampliar a casa
 *                        fica recolhido.
 *   OrganizarObjetos     o inventário para organizar: busca, filtros (tipo, onde está), ordem, páginas de 12; um objeto
 *                        de cada vez abre a ficha (onde está, de onde veio, a história, o valor afetivo) e as ações.
 *   PersonalizarVeiculos um veículo de cada vez; o estético separado do funcional; o nome; coleção; a garagem.
 *   GuardaRoupa          o estilo que as peças dizem, as fases; e o que vestir em cada ocasião (só se quiser).
 *   MusicaEArte          os gostos, as descobertas; ouvir, ir a um programa, produzir uma obra.
 *
 * Nada aqui calcula regra: preços, bloqueios e efeitos são os do motor (`sistemas/personalizacao`, `lar`, `gostos`).
 */

import { useMemo, useState } from 'react';
import type { Acao } from '../../motor/acoes';
import type { AspectoDoComodo, CoisaTida, Colecionavel, ItemDeEstilo, Ocasiao, Veiculo, Vida } from '../../motor/tipos';
import { idade, idadePessoa } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { coisa } from '../../motor/dados/coisas';
import { variantesDaCoisa } from '../../motor/dados/pertences';
import { COMODOS, type TipoComodo } from '../../motor/dados/lar';
import { ESTILOS, itemEstilo, lugaresDoItem, NOME_OCASIAO, adequacaoDaRoupa, estiloDominante, nomeDoEstilo } from '../../motor/dados/estilo';
import { modeloVeiculo } from '../../motor/dados/bens';
import { economiaLocal } from '../../motor/dados/lugares';
import { pecasDaCategoria, opcaoDaPeca } from '../../motor/dados/personalizacaoVeiculo';
import { GENEROS, LINGUAGENS } from '../../motor/dados/gostos';
import { ocupacaoOuNula } from '../../motor/dados/ocupacoes';
import { ACABAMENTOS, ASPECTOS, acabamentoDoComodo, coisasPorComodo, comodoEquipado, comodosDaCasa, confortoDaCasa, donoDoLar, poderSobreACasa, precoDoAcabamento, terrenoLivre, plantaDaCasa } from '../../motor/sistemas/lar';
import { custoDaPeca, custoDeConstruir, custoDeConverter, custoDeRepaginar, leituraDaPlanta, locaisPara, nomeDoLocal, type RefObjeto } from '../../motor/sistemas/personalizacao';
import { afetoDe, origemEmPalavras, palavraDoAfeto } from '../../motor/sistemas/memoriaDosObjetos';
import { valorDeRevenda } from '../../motor/sistemas/coisas';
import { colecao } from '../../motor/sistemas/colecao';
import { textoVeiculo } from '../../motor/sistemas/veiculos';
import { generosPreferidos, gostosDe, hobbiesQueViramOficio, NOME_DO_GOSTO, precoDoPrograma, programasPossiveis } from '../../motor/sistemas/gostos';
import { BotaoAcao } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';
import '../personalizar.css';

interface Props { vida: Vida; agir: (a: Acao) => boolean }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const agirCom = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });

/* ===================================================================== a casa */

export function CasaPorDentro({ vida, agir }: Props) {
  const [aberto, setAberto] = useState<string | null>(null);
  const comodos = comodosDaCasa(vida);
  const poder = poderSobreACasa(vida);
  if (!comodos.length || idade(vida) < 16) return null;
  const conf = confortoDaCasa(vida);
  const planta = leituraDaPlanta(vida);
  const porComodo = coisasPorComodo(vida);
  const atual = comodos.find(c => c.id === aberto);
  return (
    <section className="secao pz-casa" aria-labelledby="pz-casa-titulo">
      <header className="secao__cabeca"><h2 className="secao__titulo" id="pz-casa-titulo">A casa por dentro</h2></header>
      <div className="secao__corpo">
        <p className="pz-linha">
          <strong>{cap(conf.palavra)}</strong> <span className="nota">· conforto {conf.valor} de 100 · {comodos.length} {comodos.length === 1 ? 'cômodo' : 'cômodos'}{planta.vagas ? ` · ${planta.vagas} ${planta.vagas === 1 ? 'vaga' : 'vagas'}` : ''}{planta.terreno ? ` · ${planta.terreno} m² de terreno livre` : ''}</span>
        </p>
        <details className="detalhes pz-detalhes">
          <summary>De onde vem esse conforto</summary>
          <ul className="pz-partes">{conf.partes.map(p => <li key={p.rotulo}><span>{p.rotulo}</span><strong>{p.valor > 0 ? `+${p.valor}` : p.valor}</strong></li>)}</ul>
          <p className="nota">O conforto sai do que a casa é e do que tem dentro — não do saldo da conta. {poder === 'superficie' ? 'Casa alugada: pintura, luz e o uso dos quartos são seus; piso e obra, do dono.' : ''}</p>
        </details>
        <ul className="pz-comodos" aria-label="Os cômodos">
          {comodos.map(c => {
            const n = porComodo.get(c.id)?.length ?? 0;
            const pede = !!COMODOS[c.tipo]?.pede;
            const ok = pede && comodoEquipado(vida, c, porComodo);
            return (
              <li key={c.id}>
                <button type="button" className={`pz-comodo${aberto === c.id ? ' pz-comodo--aberto' : ''}`} aria-expanded={aberto === c.id} aria-controls="pz-painel-comodo" onClick={() => setAberto(a => (a === c.id ? null : c.id))}>
                  <span>{cap(c.nome)}</span>
                  <span className="pz-comodo__conta">{n ? `${n} ${n === 1 ? 'coisa' : 'coisas'}` : pede ? 'vazio' : ''}{ok ? ' · em uso' : ''}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {atual && <PainelDoComodo key={atual.id} vida={vida} agir={agir} comodoId={atual.id} aoFechar={() => setAberto(null)} />}
        {poder === 'tudo' && planta.terreno > 0 && <AmpliarACasa vida={vida} agir={agir} />}
      </div>
    </section>
  );
}

function PainelDoComodo({ vida, agir, comodoId, aoFechar }: Props & { comodoId: string; aoFechar: () => void }) {
  const [editar, setEditar] = useState(false);
  const comodos = comodosDaCasa(vida);
  const cm = comodos.find(c => c.id === comodoId);
  if (!cm) return null;
  const m = COMODOS[cm.tipo];
  const coisas = coisasPorComodo(vida).get(cm.id) ?? [];
  const poder = poderSobreACasa(vida);
  const c = economiaLocal(vida.moradia.municipioId).custo;
  const aspectos = ASPECTOS.filter(a => !['jardim', 'piscina', 'garagem', 'lazer'].includes(cm.tipo) || a === 'luz');
  const conversivel = cm.tipo === 'quarto_extra' || cm.de === 'conversao' || (cm.de === 'obra' && !!m.conversao);
  const destinos = (Object.values(COMODOS) as { tipo: TipoComodo; nome: string; conversao?: number }[]).filter(x => x.conversao && x.tipo !== cm.tipo && x.tipo !== 'quarto_extra');
  return (
    <div className="pz-painel" id="pz-painel-comodo" role="region" aria-label={`${cap(cm.nome)}: o que tem e o que dá para fazer`}>
      <div className="pz-painel__cabeca">
        <h3 className="subtitulo">{cap(cm.nome)}</h3>
        <button type="button" className="botao botao--discreto" onClick={aoFechar}>Fechar</button>
      </div>
      <p className="nota">{m.descricao}{m.pede && !comodoEquipado(vida, cm) ? ` Vazio, é só metro quadrado: falta ${m.pede.slice(0, 3).map(id => coisa(id)?.nome ?? id).join(', ')}…` : ''}</p>
      {coisas.length > 0 ? (
        <ul className="pz-lista">
          {coisas.map(t => <ItemDoComodo key={t.id} vida={vida} agir={agir} t={t} comodoAtual={cm.id} />)}
        </ul>
      ) : <p className="nota">Nada seu aqui.</p>}
      {poder !== 'nada' && idade(vida) >= 18 && !editar && <button type="button" className="botao botao--secundario" onClick={() => setEditar(true)}>Personalizar {cm.nome}</button>}
      {editar && (
        <div className="pz-edicao">
          {aspectos.map(a => <Acabamento key={a} vida={vida} agir={agir} comodoId={cm.id} aspecto={a} />)}
          {conversivel && (
            <details className="detalhes">
              <summary>Mudar o uso deste quarto</summary>
              <div className="grupo-acoes grupo-acoes--linha">
                {cm.tipo !== 'quarto_extra' && <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'converter', comodo: cm.id, tipo: 'quarto_extra' })} variante="discreto">Voltar a ser quarto ({dinheiroCurto(Math.round(1500 * c))})</BotaoAcao>}
                {destinos.map(x => <BotaoAcao key={x.tipo} vida={vida} agir={agir} acao={agirCom({ o: 'converter', comodo: cm.id, tipo: x.tipo })} variante="discreto" ocultarImpossivel>{cap(x.nome)} ({dinheiroCurto(custoDeConverter(vida, x.tipo))})</BotaoAcao>)}
              </div>
            </details>
          )}
          <button type="button" className="botao botao--discreto" onClick={() => setEditar(false)}>Pronto</button>
        </div>
      )}
    </div>
  );
}

function ItemDoComodo({ vida, agir, t, comodoAtual }: Props & { t: CoisaTida; comodoAtual: string }) {
  const [mover, setMover] = useState(false);
  const outros = comodosDaCasa(vida).filter(c => c.id !== comodoAtual);
  const nome = coisa(t.coisaId)?.nome ?? t.coisaId;
  return (
    <li className="pz-item">
      <span><strong>{cap(nome)}</strong>{t.apelido ? ` "${t.apelido}"` : ''}{t.acabamento ? <span className="nota"> · {t.acabamento}</span> : null}{t.lembranca ? <span className="nota"> · lembrança</span> : null}</span>
      {!mover ? <button type="button" className="botao botao--discreto" onClick={() => setMover(true)}>Mudar de cômodo</button> : (
        <span className="pz-mover">
          {outros.map(c => <BotaoAcao key={c.id} vida={vida} agir={agir} acao={agirCom({ o: 'por_no_comodo', coisa: t.id, comodo: c.id })} variante="discreto" aoAgir={() => setMover(false)}>{cap(c.nome)}</BotaoAcao>)}
          <button type="button" className="botao botao--discreto" onClick={() => setMover(false)}>Deixar</button>
        </span>
      )}
    </li>
  );
}

function Acabamento({ vida, agir, comodoId, aspecto }: Props & { comodoId: string; aspecto: AspectoDoComodo }) {
  const atual = acabamentoDoComodo(vida, comodoId, aspecto);
  const [escolha, setEscolha] = useState(atual);
  const cm = comodosDaCasa(vida).find(c => c.id === comodoId)!;
  const c = economiaLocal(vida.moradia.municipioId).custo;
  const opcoes = ACABAMENTOS[aspecto].opcoes;
  const nomeAtual = opcoes.find(o => o.id === atual)?.nome ?? atual;
  const preco = escolha !== atual ? precoDoAcabamento(vida.moradia.modeloId, cm, aspecto, escolha, c) : 0;
  return (
    <div className="pz-acabamento">
      <label className="campo">
        <span className="campo__rotulo">{ACABAMENTOS[aspecto].nome} · hoje: {nomeAtual}</span>
        <select value={escolha} onChange={e => setEscolha(e.target.value)}>
          {opcoes.map(o => <option key={o.id} value={o.id}>{cap(o.nome)}</option>)}
        </select>
      </label>
      {aspecto === 'parede' && <span className="pz-amostra" style={{ background: opcoes.find(o => o.id === escolha)?.cor }} aria-hidden />}
      {escolha !== atual && <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'acabamento', comodo: comodoId, aspecto, opcao: escolha })} variante="principal">Fazer ({dinheiroCurto(preco)})</BotaoAcao>}
    </div>
  );
}

function AmpliarACasa({ vida, agir }: Props) {
  const lar = donoDoLar(vida)?.lar;
  const livre = terrenoLivre(vida.moradia.modeloId, lar);
  const permitidas = plantaDaCasa(vida).obrasPermitidas;
  const obras = (Object.values(COMODOS) as (typeof COMODOS)[TipoComodo][]).filter(x => x.obra && (!permitidas || permitidas.includes(x.tipo)));
  return (
    <details className="detalhes pz-detalhes">
      <summary>Ampliar a casa ({livre} m² de terreno livre)</summary>
      <ul className="pz-lista">
        {obras.map(x => (
          <li key={x.tipo} className="pz-item">
            <span><strong>{cap(x.nome)}</strong><span className="nota"> · {x.obra!.terreno} m²{x.manutencao ? ` · manter: ${dinheiroCurto(Math.round(x.manutencao * economiaLocal(vida.moradia.municipioId).custo))}/mês` : ''}</span></span>
            <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'construir', tipo: x.tipo })} variante="discreto" ocultarImpossivel>Construir ({dinheiroCurto(custoDeConstruir(vida, x.tipo))})</BotaoAcao>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ===================================================================== os objetos */

type TipoInventario = 'todos' | 'casa' | 'instrumentos' | 'eletronicos' | 'esporte' | 'arte' | 'vestir';
type OndeInventario = 'todos' | 'casa' | 'guardado' | 'emprestado';
type Ordem = 'recente' | 'nome' | 'valor' | 'afeto';
interface Linha { ref: RefObjeto; nome: string; tipo: TipoInventario; onde: string; guardado: boolean; emprestado: boolean; valor: number; afeto: number; t: number }

function linhasDoInventario(v: Vida): Linha[] {
  const out: Linha[] = [];
  for (const t of v.financas.coisas ?? []) {
    const c = coisa(t.coisaId);
    const tipo: TipoInventario = c?.loja === 'instrumentos' ? 'instrumentos' : c?.loja === 'eletronicos' ? 'eletronicos' : c?.loja === 'esportes' ? 'esporte' : c?.loja === 'livraria' ? 'arte' : 'casa';
    const pessoa = t.emprestadaA ? v.pessoas[t.emprestadaA] : undefined;
    out.push({ ref: { tipo: 'coisa', id: t.id }, nome: `${c?.nome ?? t.coisaId}${t.apelido ? ` "${t.apelido}"` : ''}${t.quantidade ? ` (${t.quantidade * 25})` : ''}`, tipo, onde: pessoa ? `com ${pessoa.nome}` : nomeDoLocal(v, t.local), guardado: !!t.local, emprestado: !!t.emprestadaA, valor: valorDeRevenda(v, t), afeto: afetoDe(v, t), t: t.t });
  }
  for (const p of colecao(v)) out.push({ ref: { tipo: 'colecao', id: p.id }, nome: p.nome, tipo: 'arte', onde: p.emprestadaA || p.emprestadaFora ? 'num museu' : p.exposta ? 'em casa, à vista' : nomeDoLocal(v, p.local), guardado: !!p.local, emprestado: !!(p.emprestadaA || p.emprestadaFora), valor: p.valor, afeto: afetoDe(v, p), t: p.tCompra });
  for (const x of v.eu.estilo?.itens ?? []) { const it = itemEstilo(x.itemId); out.push({ ref: { tipo: 'estilo', id: x.id }, nome: it?.nome ?? x.itemId, tipo: 'vestir', onde: x.usando ? 'em uso' : nomeDoLocal(v, x.local), guardado: !!x.local, emprestado: false, valor: Math.round(x.preco * 0.2), afeto: afetoDe(v, x), t: x.t }); }
  return out;
}

const POR_PAGINA = 12;

export function OrganizarObjetos({ vida, agir }: Props) {
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<TipoInventario>('todos');
  const [onde, setOnde] = useState<OndeInventario>('todos');
  const [ordem, setOrdem] = useState<Ordem>('recente');
  const [paginas, setPaginas] = useState(1);
  const [aberto, setAberto] = useState<string | null>(null);
  const todas = useMemo(() => linhasDoInventario(vida), [vida]);
  const q = busca.trim().toLowerCase();
  const filtradas = todas.filter(l => (tipo === 'todos' || l.tipo === tipo) && (onde === 'todos' || (onde === 'casa' ? !l.guardado && !l.emprestado : onde === 'guardado' ? l.guardado : l.emprestado)) && (!q || l.nome.toLowerCase().includes(q)))
    .sort((a, b) => ordem === 'nome' ? a.nome.localeCompare(b.nome) : ordem === 'valor' ? b.valor - a.valor : ordem === 'afeto' ? b.afeto - a.afeto : b.t - a.t);
  const mostradas = filtradas.slice(0, paginas * POR_PAGINA);
  if (!todas.length) return <p className="nota">Nada para organizar ainda.</p>;
  return (
    <div className="pz-inventario">
      <div className="pz-filtros" role="search">
        <label className="campo pz-busca"><span className="campo__rotulo">Buscar</span><input type="search" value={busca} onChange={e => { setBusca(e.target.value); setPaginas(1); }} placeholder="violão, relógio, sofá…" /></label>
        <label className="campo"><span className="campo__rotulo">Tipo</span>
          <select value={tipo} onChange={e => { setTipo(e.target.value as TipoInventario); setPaginas(1); }}>
            <option value="todos">Todos</option><option value="casa">Casa e móveis</option><option value="instrumentos">Instrumentos e discos</option><option value="eletronicos">Eletrônicos</option><option value="esporte">Esporte e lazer</option><option value="arte">Arte, livros e coleção</option><option value="vestir">Roupas e acessórios</option>
          </select></label>
        <label className="campo"><span className="campo__rotulo">Onde</span>
          <select value={onde} onChange={e => { setOnde(e.target.value as OndeInventario); setPaginas(1); }}>
            <option value="todos">Em qualquer lugar</option><option value="casa">Em casa</option><option value="guardado">Guardados fora</option><option value="emprestado">Emprestados</option>
          </select></label>
        <label className="campo"><span className="campo__rotulo">Ordem</span>
          <select value={ordem} onChange={e => setOrdem(e.target.value as Ordem)}>
            <option value="recente">Mais recentes</option><option value="nome">Nome</option><option value="valor">Valor de mercado</option><option value="afeto">Valor afetivo</option>
          </select></label>
      </div>
      <p className="nota" aria-live="polite">{filtradas.length === todas.length ? `${todas.length} ${todas.length === 1 ? 'objeto' : 'objetos'}` : `${filtradas.length} de ${todas.length}`}</p>
      <ul className="pz-lista pz-lista--inventario">
        {mostradas.map(l => {
          const chave = `${l.ref.tipo}:${l.ref.id}`;
          const af = palavraDoAfeto(l.afeto);
          return (
            <li key={chave} className={`pz-linha-obj${aberto === chave ? ' pz-linha-obj--aberta' : ''}`}>
              <button type="button" className="pz-linha-obj__botao" aria-expanded={aberto === chave} onClick={() => setAberto(a => (a === chave ? null : chave))}>
                <span className="pz-linha-obj__nome">{cap(l.nome)}</span>
                <span className="pz-linha-obj__onde">{l.onde}{af ? ` · ${af}` : ''}</span>
              </button>
              {aberto === chave && <FichaDoObjeto vida={vida} agir={agir} refObj={l.ref} />}
            </li>
          );
        })}
      </ul>
      {filtradas.length > mostradas.length && <button type="button" className="dobra__botao" onClick={() => setPaginas(p => p + 1)}>Mostrar mais ({filtradas.length - mostradas.length})</button>}
    </div>
  );
}

/** As pessoas por perto (para emprestar e dar), da mais próxima à menos. */
function pessoasPerto(v: Vida): { id: string; nome: string }[] {
  return Object.values(v.vinculos).map(vin => ({ vin, p: v.pessoas[vin.pessoaId] }))
    .filter(({ vin, p }) => p?.vivo && !p.especie && vin.parentesco !== 'pet' && idadePessoa(v, p) >= 5 && (p.municipioId === v.moradia.municipioId || vin.convivio.includes('casa')) && (vin.parentesco || vin.romance || vin.proximidade >= 40))
    .sort((a, b) => b.vin.proximidade - a.vin.proximidade).slice(0, 10).map(({ p }) => ({ id: p.id, nome: p.nome }));
}

function FichaDoObjeto({ vida, agir, refObj }: Props & { refObj: RefObjeto }) {
  const [acao, setAcao] = useState<'mover' | 'emprestar' | 'doar' | 'nome' | 'repaginar' | null>(null);
  const [alvo, setAlvo] = useState('');
  const [nome, setNome] = useState('');
  const o = refObj.tipo === 'coisa' ? (vida.financas.coisas ?? []).find(x => x.id === refObj.id) : refObj.tipo === 'colecao' ? colecao(vida).find(x => x.id === refObj.id) : (vida.eu.estilo?.itens ?? []).find(x => x.id === refObj.id);
  if (!o) return null;
  const t = refObj.tipo === 'coisa' ? (o as CoisaTida) : undefined;
  const pc = refObj.tipo === 'colecao' ? (o as Colecionavel) : undefined;
  const desde = 'tCompra' in o ? (o as Colecionavel).tCompra : (o as CoisaTida | ItemDeEstilo).t;
  const af = afetoDe(vida, o);
  const origem = origemEmPalavras(o.memoria);
  const historia = (o.historia ?? []).slice(-6).reverse();
  const locais = locaisPara(vida, refObj);
  const pessoas = pessoasPerto(vida);
  const vs = t ? variantesDaCoisa(t.coisaId) : [];
  const comodos = comodosDaCasa(vida);
  return (
    <div className="pz-ficha">
      <dl className="pz-dados">
        <div><dt>Desde</dt><dd>{anoDe(desde)}</dd></div>
        {origem && <div><dt>De onde veio</dt><dd>{origem}</dd></div>}
        <div><dt>Vale no mercado</dt><dd>{t ? dinheiroCurto(valorDeRevenda(vida, t)) : pc ? dinheiroCurto(pc.valor) : 'pouco (roupa usada)'}</dd></div>
        <div><dt>Para você</dt><dd>{palavraDoAfeto(af) ?? 'um objeto como outro'}</dd></div>
      </dl>
      {historia.length > 0 && (
        <details className="detalhes"><summary>A história dele</summary>
          <ol className="pz-historia">{historia.map((h, k) => <li key={k}><span className="nota">{anoDe(h.t)}</span> {h.texto}</li>)}</ol>
        </details>
      )}
      <div className="pz-botoes" role="group" aria-label="O que fazer">
        {t?.emprestadaA ? <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'pedir_de_volta', coisa: t.id })} variante="secundario">Pedir de volta</BotaoAcao> : locais.length > 0 && <button type="button" className="botao botao--secundario" aria-pressed={acao === 'mover'} onClick={() => setAcao(a => (a === 'mover' ? null : 'mover'))}>Guardar ou levar</button>}
        {t && !t.emprestadaA && !coisa(t.coisaId)?.daCasa && pessoas.length > 0 && <button type="button" className="botao botao--discreto" aria-pressed={acao === 'emprestar'} onClick={() => { setAcao(a => (a === 'emprestar' ? null : 'emprestar')); setAlvo(pessoas[0].id); }}>Emprestar</button>}
        {pessoas.length > 0 && idade(vida) >= 12 && <button type="button" className="botao botao--discreto" aria-pressed={acao === 'doar'} onClick={() => { setAcao(a => (a === 'doar' ? null : 'doar')); setAlvo(pessoas[0].id); }}>Dar de presente</button>}
        {refObj.tipo !== 'estilo' && <button type="button" className="botao botao--discreto" aria-pressed={acao === 'nome'} onClick={() => setAcao(a => (a === 'nome' ? null : 'nome'))}>Dar um nome</button>}
        {t && vs.length > 1 && !t.lembranca && <button type="button" className="botao botao--discreto" aria-pressed={acao === 'repaginar'} onClick={() => setAcao(a => (a === 'repaginar' ? null : 'repaginar'))}>Repaginar</button>}
      </div>
      {acao === 'mover' && (
        <div className="grupo-acoes grupo-acoes--linha">
          {locais.map(l => <BotaoAcao key={l.id ?? 'casa'} vida={vida} agir={agir} acao={agirCom({ o: 'mover', ref: refObj, para: l.id })} variante="discreto" aoAgir={() => setAcao(null)}>{cap(l.nome.replace(/^em casa$/, 'para casa'))}{l.frete ? ` (frete ${dinheiroCurto(l.frete)})` : ''}</BotaoAcao>)}
        </div>
      )}
      {(acao === 'emprestar' || acao === 'doar') && (
        <div className="pz-acao-pessoa">
          <label className="campo"><span className="campo__rotulo">{acao === 'doar' ? 'Para quem' : 'A quem'}</span>
            <select value={alvo} onChange={e => setAlvo(e.target.value)}>{pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
          {acao === 'emprestar' && t ? <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'emprestar', coisa: t.id, pessoaId: alvo })} variante="principal" aoAgir={() => setAcao(null)}>Emprestar</BotaoAcao>
            : <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'doar', ref: refObj, pessoaId: alvo })} variante="principal" aoAgir={() => setAcao(null)}>Dar{af >= 45 ? ' (tem história: é para sempre)' : ''}</BotaoAcao>}
        </div>
      )}
      {acao === 'nome' && (
        <div className="pz-acao-pessoa">
          <label className="campo"><span className="campo__rotulo">Nome (até 24 letras)</span><input value={nome} maxLength={24} onChange={e => setNome(e.target.value)} /></label>
          <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'apelidar', ref: refObj, nome })} variante="principal" aoAgir={() => setAcao(null)}>{nome.trim() ? 'Dar o nome' : 'Tirar o nome'}</BotaoAcao>
        </div>
      )}
      {acao === 'repaginar' && t && (
        <div className="grupo-acoes grupo-acoes--linha">
          {vs.map((x, k) => x.cor !== t.cor && <BotaoAcao key={x.nome} vida={vida} agir={agir} acao={agirCom({ o: 'repaginar', coisa: t.id, variante: k })} variante="discreto" aoAgir={() => setAcao(null)}><span className="pz-amostra pz-amostra--mini" style={{ background: x.cor }} aria-hidden /> {cap(x.nome)} ({dinheiroCurto(custoDeRepaginar(vida, t))})</BotaoAcao>)}
        </div>
      )}
      {pc && (
        <div className="grupo-acoes grupo-acoes--linha">
          {!pc.local && !pc.emprestadaA && !pc.emprestadaFora && (pc.exposta
            ? <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'expor', colecao: pc.id, comodo: null })} variante="discreto">Tirar da parede</BotaoAcao>
            : comodos.filter(c => ['sala', 'escritorio', 'biblioteca', 'quarto', 'atelie', 'estudio', 'jogos', 'cinema'].includes(c.tipo)).slice(0, 4).map(c => <BotaoAcao key={c.id} vida={vida} agir={agir} acao={agirCom({ o: 'expor', colecao: pc.id, comodo: c.id })} variante="discreto">Expor n{COMODOS[c.tipo].artigo} {c.nome}</BotaoAcao>))}
          <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'de_familia', colecao: pc.id, sim: !pc.deFamilia })} variante="discreto">{pc.deFamilia ? 'Deixar de ser de família' : 'Guardar para a família (não vai a leilão na herança)'}</BotaoAcao>
        </div>
      )}
    </div>
  );
}

/* ===================================================================== os veículos */

export function PersonalizarVeiculos({ vida, agir }: Props) {
  const lista = vida.financas.bens.filter((b): b is Veiculo => b.tipo === 'veiculo');
  const [qual, setQual] = useState<string | null>(null);
  if (!lista.length || idade(vida) < 18) return null;
  const b = lista.find(x => x.id === qual);
  return (
    <div className="pz-veiculos">
      {!qual ? (
        <div className="grupo-acoes grupo-acoes--linha">
          <span className="rotulo-pequeno">Personalizar</span>
          {lista.map(x => <button key={x.id} type="button" className="botao botao--discreto" onClick={() => setQual(x.id)}>{cap(textoVeiculo(x))}{x.apelido ? ` "${x.apelido}"` : ''}</button>)}
        </div>
      ) : b ? <PainelDoVeiculo vida={vida} agir={agir} b={b} aoFechar={() => setQual(null)} /> : null}
    </div>
  );
}

function PainelDoVeiculo({ vida, agir, b, aoFechar }: Props & { b: Veiculo; aoFechar: () => void }) {
  const cat = modeloVeiculo(b.modeloId).categoria;
  const pecas = pecasDaCategoria(cat);
  const [grupo, setGrupo] = useState<'estetica' | 'funcional' | 'mais'>('estetica');
  const [nome, setNome] = useState(b.apelido ?? '');
  const garagens = vida.financas.bens.filter(x => x.tipo === 'imovel' && x.id !== vida.moradia.imovelId && !x.alugadoPor);
  const historia = (b.historia ?? []).slice(-5).reverse();
  return (
    <div className="pz-painel" role="region" aria-label={`Personalizar ${textoVeiculo(b)}`}>
      <div className="pz-painel__cabeca">
        <h3 className="subtitulo">{cap(textoVeiculo(b))}{b.apelido ? ` "${b.apelido}"` : ''}</h3>
        <button type="button" className="botao botao--discreto" onClick={aoFechar}>Fechar</button>
      </div>
      <div className="escolha" role="radiogroup" aria-label="O que mexer">
        {([['estetica', 'Aparência'], ['funcional', 'Mecânica'], ['mais', 'Nome, garagem e história']] as const).map(([id, r]) => <button key={id} type="button" role="radio" aria-checked={grupo === id} className={`escolha__item${grupo === id ? ' escolha__item--ativo' : ''}`} onClick={() => setGrupo(id)}>{r}</button>)}
      </div>
      {grupo !== 'mais' && (
        <>
          <p className="nota">{grupo === 'estetica' ? 'Muda a cara. Na revenda, gosto de dono vale pouco.' : 'Muda o comportamento: o quanto dá problema, o quanto gasta, o quanto vale.'}</p>
          <ul className="pz-lista">{pecas.filter(p => p.tipo === grupo).map(p => <PecaDoVeiculo key={p.id} vida={vida} agir={agir} b={b} pecaId={p.id} />)}</ul>
        </>
      )}
      {grupo === 'mais' && (
        <div className="pz-mais">
          <div className="pz-acao-pessoa">
            <label className="campo"><span className="campo__rotulo">Nome (até 24 letras)</span><input value={nome} maxLength={24} onChange={e => setNome(e.target.value)} /></label>
            <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'apelidar', ref: { tipo: 'veiculo', id: b.id }, nome })} variante="discreto">{nome.trim() ? 'Dar o nome' : 'Sem nome'}</BotaoAcao>
          </div>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'veiculo_colecao', bem: b.id, sim: !b.papel })} variante="discreto" ocultarImpossivel>{b.papel ? 'Voltar ao uso' : 'Tornar de coleção (sai pouco, gasta devagar)'}</BotaoAcao>
            {(cat === 'carro' || cat === 'moto') && garagens.map(g => <BotaoAcao key={g.id} vida={vida} agir={agir} acao={agirCom({ o: 'veiculo_garagem', bem: b.id, imovel: b.garagem === g.id ? null : g.id })} variante="discreto" ocultarImpossivel>{b.garagem === g.id ? 'Trazer para a garagem de casa' : `Guardar ${nomeDoLocal(vida, `im:${g.id}`)}`}</BotaoAcao>)}
          </div>
          {historia.length > 0 && <ol className="pz-historia" aria-label="Manutenção e história">{historia.map((h, k) => <li key={k}><span className="nota">{anoDe(h.t)}</span> {h.texto}</li>)}</ol>}
        </div>
      )}
    </div>
  );
}

function PecaDoVeiculo({ vida, agir, b, pecaId }: Props & { b: Veiculo; pecaId: string }) {
  const cat = modeloVeiculo(b.modeloId).categoria;
  const p = pecasDaCategoria(cat).find(x => x.id === pecaId)!;
  const atual = b.mods?.[pecaId] ?? 'original';
  const [escolha, setEscolha] = useState(atual);
  const o = opcaoDaPeca(cat, pecaId, escolha);
  const efeito = o && escolha !== atual ? [(o.fragilidade ?? 1) > 1 ? 'mais oficina' : (o.fragilidade ?? 1) < 1 ? 'menos problema' : '', (o.uso ?? 1) > 1 ? 'gasta mais' : '', (o.valor ?? 1) < 1 ? 'vale menos na revenda' : (o.valor ?? 1) > 1 ? 'segura um pouco de valor' : ''].filter(Boolean).join(', ') : '';
  return (
    <li className="pz-item pz-item--peca">
      <label className="campo">
        <span className="campo__rotulo">{p.nome} · hoje: {opcaoDaPeca(cat, pecaId, atual)?.nome}</span>
        <select value={escolha} onChange={e => setEscolha(e.target.value)}>{p.opcoes.map(x => <option key={x.id} value={x.id}>{cap(x.nome)}</option>)}</select>
      </label>
      {escolha !== atual && <><span className="nota">{efeito}</span><BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'veiculo_peca', bem: b.id, peca: pecaId, opcao: escolha })} variante="principal">Fazer ({dinheiroCurto(custoDaPeca(vida, b, pecaId, escolha))})</BotaoAcao></>}
    </li>
  );
}

/* ===================================================================== o guarda-roupa */

const OCASIOES: Ocasiao[] = ['trabalho', 'estudo', 'festa', 'evento', 'esporte', 'encontro'];

export function GuardaRoupa({ vida, agir }: Props) {
  const [estilo, setEstilo] = useState('');
  const [ocasiao, setOcasiao] = useState<Ocasiao | ''>('');
  const itens = vida.eu.estilo?.itens ?? [];
  const roupas = itens.filter(x => itemEstilo(x.itemId)?.categoria === 'roupa' || itemEstilo(x.itemId)?.categoria === 'chapeu' || itemEstilo(x.itemId)?.categoria === 'acessorio' || itemEstilo(x.itemId)?.categoria === 'oculos');
  if (!roupas.length || idade(vida) < 10) return null;
  const dominante = estiloDominante(itens.filter(x => x.usando));
  const fases = vida.eu.estilo?.fases ?? [];
  const meusEstilos = ESTILOS.filter(e => roupas.some(x => itemEstilo(x.itemId)?.estilos?.includes(e.id)));
  const visiveis = estilo ? roupas.filter(x => itemEstilo(x.itemId)?.estilos?.includes(estilo)) : roupas;
  return (
    <details className="detalhes pz-guarda-roupa">
      <summary>Guarda-roupa: estilo e ocasiões{dominante ? ` · ${nomeDoEstilo(dominante).toLowerCase()}` : ''}</summary>
      {fases.length > 1 && <p className="nota">As fases: {fases.map(f => `${nomeDoEstilo(f.estilo).toLowerCase()} (${anoDe(f.t)})`).join(' → ')}.</p>}
      {meusEstilos.length > 1 && (
        <label className="campo"><span className="campo__rotulo">Ver as peças de um estilo</span>
          <select value={estilo} onChange={e => setEstilo(e.target.value)}><option value="">Todas ({roupas.length})</option>{meusEstilos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
      )}
      <ul className="pz-lista">{visiveis.slice(0, 20).map(x => { const it = itemEstilo(x.itemId)!; return <li key={x.id} className="pz-item"><span><strong>{it.nome}</strong><span className="nota"> · {lugaresDoItem(it).map(l => ({ tronco: 'em cima', pernas: 'embaixo', casaco: 'por cima', pes: 'nos pés', cabeca: 'na cabeça', rosto: 'no rosto', pulso: 'no pulso', joia: 'no pescoço' } as Record<string, string>)[l] ?? '').filter(Boolean).join(' e ')}{x.usando ? ' · em uso' : ''}</span></span></li>; })}</ul>
      <label className="campo"><span className="campo__rotulo">Separar a roupa de uma ocasião (opcional)</span>
        <select value={ocasiao} onChange={e => setOcasiao(e.target.value as Ocasiao | '')}><option value="">—</option>{OCASIOES.map(o => <option key={o} value={o}>{cap(NOME_OCASIAO[o])}</option>)}</select></label>
      {ocasiao && <LookDaOcasiao key={ocasiao} vida={vida} agir={agir} ocasiao={ocasiao} />}
    </details>
  );
}

function LookDaOcasiao({ vida, agir, ocasiao }: Props & { ocasiao: Ocasiao }) {
  const itens = vida.eu.estilo?.itens ?? [];
  const [marcados, setMarcados] = useState<string[]>(vida.eu.estilo?.looks?.[ocasiao] ?? []);
  const roupas = itens.filter(x => itemEstilo(x.itemId)?.categoria !== 'oculos' || !itemEstilo(x.itemId)?.receita);
  const leitura = adequacaoDaRoupa(itens.filter(x => marcados.includes(x.id)), ocasiao);
  const alternar = (id: string) => setMarcados(m => {
    if (m.includes(id)) return m.filter(x => x !== id);
    // Uma peça por parte do corpo: a nova tira a que ocupava o mesmo lugar.
    const it = itemEstilo(itens.find(x => x.id === id)!.itemId)!;
    const la = lugaresDoItem(it);
    return [...m.filter(x => !lugaresDoItem(itemEstilo(itens.find(y => y.id === x)!.itemId)!).some(l => la.includes(l))), id];
  });
  return (
    <div className="pz-look">
      <ul className="pz-marcar">{roupas.map(x => <li key={x.id}><label className="marcar"><input type="checkbox" checked={marcados.includes(x.id)} onChange={() => alternar(x.id)} /> {itemEstilo(x.itemId)!.nome}</label></li>)}</ul>
      {marcados.length > 0 && <p className="nota">Para {NOME_OCASIAO[ocasiao]}: {leitura === 'adequada' ? 'cai bem.' : leitura === 'destoa' ? 'destoa — vai chamar atenção (às vezes é o que se quer).' : 'nada demais.'}</p>}
      <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'look', ocasiao, itens: marcados })} variante="secundario">{marcados.length ? 'Separar' : 'Usar a de todo dia'}</BotaoAcao>
    </div>
  );
}

/* ===================================================================== música e arte */

export function MusicaEArte({ vida, agir }: Props) {
  const i = idade(vida);
  const [programa, setPrograma] = useState('');
  const [genero, setGenero] = useState('');
  const [com, setCom] = useState('');
  const [linguagem, setLinguagem] = useState('');
  if (i < 8) return null;
  const g = gostosDe(vida);
  const pref = generosPreferidos(vida, 3);
  const artes = Object.entries(g.arte).sort((a, b) => b[1] - a[1]).slice(0, 2).filter(([, x]) => x >= 35);
  const descobertas = (g.descobertas ?? []).slice(-4).reverse();
  const programas = programasPossiveis(vida);
  const pessoas = pessoasPerto(vida).filter(p => idadePessoa(vida, vida.pessoas[p.id]) >= 14);
  const oficios = hobbiesQueViramOficio(vida);
  const prog = programa || programas[0]?.id || '';
  const generoShow = genero || pref[0]?.id || '';
  const lingua = linguagem || LINGUAGENS[1].id;
  return (
    <section className="pz-gostos" aria-labelledby="pz-gostos-titulo">
      <h2 id="pz-gostos-titulo" className="voce-subtitulo">Música e arte</h2>
      <p>{pref.map((x, k) => <span key={x.id}>{k ? ', ' : ''}<strong>{x.nome}</strong> <span className="nota">({NOME_DO_GOSTO(x.valor)})</span></span>)}{artes.length ? <span className="nota"> · na arte: {artes.map(([id]) => LINGUAGENS.find(l => l.id === id)?.nome).join(' e ')}</span> : null}</p>
      {descobertas.length > 0 && (
        <details className="detalhes"><summary>Como o gosto foi mudando</summary>
          <ul className="pz-historia">{descobertas.map((d, k) => <li key={k}><span className="nota">{anoDe(d.t)}</span> {cap(d.oque)}, {d.como}.</li>)}</ul>
        </details>
      )}
      <div className="grupo-acoes grupo-acoes--linha">
        <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'cultural', oque: 'ouvir' })} variante="secundario" ocultarImpossivel>Montar a playlist do ano</BotaoAcao>
      </div>
      {i >= 14 && programas.length > 0 && (
        <details className="detalhes pz-detalhes">
          <summary>Sair: show, roda, baile, exposição</summary>
          <div className="pz-acao-pessoa">
            <label className="campo"><span className="campo__rotulo">Programa</span>
              <select value={prog} onChange={e => setPrograma(e.target.value)}>{programas.map(p => <option key={p.id} value={p.id}>{cap(p.nome)} ({p.preco ? dinheiroCurto(precoDoPrograma(vida, p.id)) : 'grátis'})</option>)}</select></label>
            {prog === 'show' && <label className="campo"><span className="campo__rotulo">De quê</span>
              <select value={generoShow} onChange={e => setGenero(e.target.value)}>{GENEROS.map(x => <option key={x.id} value={x.id}>{cap(x.nome)}</option>)}</select></label>}
            {pessoas.length > 0 && <label className="campo"><span className="campo__rotulo">Com quem</span>
              <select value={com} onChange={e => setCom(e.target.value)}><option value="">Sem companhia</option>{pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>}
            <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'cultural', oque: prog, ...(prog === 'show' ? { genero: generoShow } : {}), ...(com ? { pessoaId: com } : {}) })} variante="principal">Ir</BotaoAcao>
          </div>
        </details>
      )}
      <details className="detalhes pz-detalhes">
        <summary>Produzir uma obra</summary>
        <div className="pz-acao-pessoa">
          <label className="campo"><span className="campo__rotulo">Linguagem</span>
            <select value={lingua} onChange={e => setLinguagem(e.target.value)}>{LINGUAGENS.map(l => <option key={l.id} value={l.id}>{cap(l.nome)}</option>)}</select></label>
          <BotaoAcao vida={vida} agir={agir} acao={agirCom({ o: 'obra', linguagem: lingua })} variante="principal">Produzir</BotaoAcao>
        </div>
        <p className="nota">A obra fica sua (Patrimônio · Coleção): dá para expor em casa ou dar de presente. Compor música é na prática da música e no estúdio.</p>
      </details>
      {oficios.length > 0 && <p className="nota">O hobby já pode virar ofício: {oficios.map(x => ocupacaoOuNula(x.oficio)?.nome[0] ?? x.oficio).join(', ')} — em Caminhos · Trabalho.</p>}
    </section>
  );
}

