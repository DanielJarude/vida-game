/**
 * VIDA 31 · AS PÁGINAS INICIAIS de Vida, Pessoas e Eu — o molde da Minha Trajetória (`Inicio31`), cada uma com a cena
 * viva da área: a rua com a casa (Vida), a constelação das pessoas (Pessoas), o retrato e as barras da vida (Eu).
 * Tudo aqui é leitura do estado e navegação para as seções de sempre.
 */
import { useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { nomeLugar } from '../../motor/dados/lugares';
import { balanco, seguranca, rendaPropriaMensal } from '../../motor/sistemas/dinheiro';
import { independencia } from '../../motor/sistemas/independencia';
import { sinaisDoCorpo } from '../../motor/sistemas/saude';
import { agendaDaSemana } from '../../motor/sistemas/agenda';
import { temCelular15 } from '../../motor/v15/celular/celular15';
import { leituraDaFama13 } from '../../motor/sistemas/reconhecimento13';
import { dinheiroCurto, leituraDaSeguranca } from '../leituraMaterial';
import { faseDaVida, ondeMora } from '../apresentar';
import { emCasa, sinaisSociais, situacaoAfetiva } from '../leitura';
import { expressaoDe, momentoAtual } from '../estadoPessoal';
import { SECOES_TEMPO, SECOES_VIDA, type Aba, type SecaoTempo, type SecaoVida } from '../navegacao';
import { Lar } from '../jogo/Casa';
import { Lugar, type QualLugar } from '../jogo/material/Lugares';
import { ConstelacaoDePessoas } from '../v17/areas/Capas17';
import { PARTES_PESSOAS, type PartePessoas } from '../jogo/Pessoas';
import type { ParteVoce } from '../jogo/Voce';
import { pessoasQueImportam } from '../jogo/RetratoDaVida';
import { RetratoDoJogador17 } from '../avatar/RetratoDoJogador17';
import { StatusDaVida31 } from './StatusDaVida31';
import { Inicio31, type CartaoAgora31, type Destino31, type Passo31 } from './Inicio31';

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Os ícones das seções (o mesmo traço da barra). */
export const ICONE31: Record<string, string> = {
  casa: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z',
  dinheiro: 'M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6 10v4M18 10v4',
  compras: 'M6 8h12l-1 12H7zM9 8a3 3 0 0 1 6 0',
  pertences: 'M4 9l8-5 8 5v11H4zM9 20v-6h6v6',
  cidade: 'M3 21h18M5 21V9l5-3v15M10 21V4l9 4v13M13 9h3M13 12h3M13 15h3',
  viagens: 'M2 16l20-6-4-2-6 2-5-4-2 1 3 5-4 1-2-1-1 1z',
  campo: 'M3 20h18M5 20c0-6 3-9 7-9s7 3 7 9M12 11V4M9 6l3-2 3 2',
  apostas: 'M5 4h14v16H5zM9 8h.01M15 8h.01M12 12h.01M9 16h.01M15 16h.01',
  circulo: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  deles: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3',
  nossa: 'M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4z',
  resumo: 'M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6',
  saude: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10zM9 11h6M12 8v6',
  habilidades: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  aparencia: 'M12 3a5 5 0 0 1 5 5c0 4-5 6-5 6s-5-2-5-6a5 5 0 0 1 5-5zM6 21a6 6 0 0 1 12 0',
  gostos: 'M9 18V6l10-2v12M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  objetivos: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  fama: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  mundo: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  semana: 'M4 6.5h16V20H4zM4 10.5h16M8.5 4v4M15.5 4v4',
  corpo: 'M13 4a2 2 0 1 0 0 .01M8 21l3-7 3 2v5M10 10l3-2 3 3 3 1M11 14l-3-3',
  atividades: 'M9 18V6l10-2v12M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  gente: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5',
  redes: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2'
};

/* ================================================================ Vida: Minha vida */

export function VidaInicio31({ vida, agir, irSecao }: { vida: Vida; agir: (a: Acao) => boolean; irSecao: (s: SecaoVida) => void }) {
  const [lugar, setLugar] = useState<QualLugar | null>(null);
  const i = idade(vida);
  const seg = leituraDaSeguranca(vida);
  const nivel = seguranca(vida).nivel;
  const aperta = i >= 18 && (nivel === 'no_vermelho' || nivel === 'apertado');
  const liquido = i >= 12 ? balanco(vida).liquido : 0;
  const cidade = nomeLugar(vida.moradia.municipioId);
  const emCasaDosPais = vida.moradia.tipo === 'pais' || vida.moradia.tipo === 'parente';
  const agora: CartaoAgora31[] = [
    { id: 'casa', rotulo: 'Casa', titulo: cap(ondeMora(vida)), detalhe: emCasa(vida).pessoas.length ? `com ${emCasa(vida).pessoas.map(p => p.nome).filter(Boolean).slice(0, 3).join(', ')}` : 'sozinho(a)', icone: ICONE31.casa, ir: () => irSecao('casa') },
    ...(i >= 8 ? [{ id: 'dinheiro', rotulo: 'Dinheiro', titulo: seg.palavra, detalhe: i >= 16 ? `quem paga a casa: ${independencia(vida).palavra.toLowerCase()}` : undefined, icone: ICONE31.dinheiro, ir: () => irSecao('dinheiro'), tom: aperta ? 'ruim' as const : undefined }] : []),
    ...(i >= 12 ? [{ id: 'pertences', rotulo: 'O que é seu', titulo: dinheiroCurto(liquido), detalhe: 'imóveis, veículos, aplicações e objetos', icone: ICONE31.pertences, ir: () => irSecao('pertences'), tom: liquido < 0 ? 'ruim' as const : undefined }] : []),
    { id: 'cidade', rotulo: 'Cidade', titulo: cidade, detalhe: 'o custo de viver aqui, o trajeto, mudar', icone: ICONE31.cidade, ir: () => irSecao('cidade') }
  ];
  const passos: Passo31[] = [];
  if (aperta) passos.push({ id: 'aperto', rotulo: 'O mês não fecha: ver para onde vai o dinheiro', nota: 'o extrato e o que dá para cortar', ir: () => irSecao('dinheiro'), destaque: true });
  else if (emCasaDosPais && i >= 18 && rendaPropriaMensal(vida) > 0) passos.push({ id: 'sair', rotulo: 'Com renda própria, dá para pensar em sair de casa', nota: 'procurar um lugar para morar', ir: () => setLugar('alugar'), destaque: true });
  if (i >= 18) passos.push({ id: 'morar', rotulo: 'Procurar um lugar para morar', nota: 'alugar ou comprar', ir: () => setLugar('alugar') });
  if (i >= 8) passos.push({ id: 'compras', rotulo: 'Ir às compras', nota: 'lojas da cidade e pela internet', ir: () => irSecao('compras') });
  if (i >= 12) passos.push({ id: 'viagem', rotulo: 'Planejar uma viagem', nota: 'destino, duração, com quem', ir: () => irSecao('viagens') });
  if (i >= 16) passos.push({ id: 'cidade', rotulo: 'Mudar de cidade ou de país', nota: 'o que muda na vida', ir: () => irSecao('cidade') });
  const estado: Partial<Record<SecaoVida, string>> = { casa: cap(ondeMora(vida)), dinheiro: i >= 8 ? seg.palavra : 'é dos adultos da casa', pertences: i >= 12 ? dinheiroCurto(liquido) : undefined, cidade };
  const destinos: Destino31[] = SECOES_VIDA.map(s => ({ id: s.id, rotulo: s.rotulo, oque: s.oque, estado: estado[s.id], icone: ICONE31[s.id], ir: () => irSecao(s.id) }));
  return (
    <>
      <Inicio31 area="Vida" classe="inicio31--vida" kicker="minha vida" titulo={`${cap(ondeMora(vida))}, em ${cidade}`}
        cena={<Lar vida={vida} agir={agir} abrir={setLugar} />}
        agora={agora} passos={passos} destinos={destinos} tituloExplorar="Explorar a vida" buscaDica="Procurar: aluguel, carro, loja, viagem, fazenda…"
        abas={SECOES_VIDA.map(s => ({ id: s.id, rotulo: s.rotulo, ir: () => irSecao(s.id) }))} rotuloAbas="Seções de Vida" />
      {lugar && <Lugar vida={vida} agir={agir} qual={lugar} aoFechar={() => setLugar(null)} trocar={setLugar} verNoPatrimonio={() => { setLugar(null); irSecao('pertences'); }} />}
    </>
  );
}

/* ================================================================ Pessoas: Minhas pessoas */

export function PessoasInicio31({ vida, abrir, irParte, irPara }: { vida: Vida; abrir: (id: string) => void; irParte: (p: PartePessoas) => void; irPara: (a: Aba) => void }) {
  const i = idade(vida);
  const casa = emCasa(vida);
  const afeto = situacaoAfetiva(vida);
  const perto = i >= 3 ? pessoasQueImportam(vida) : [];
  const sinais = sinaisSociais(vida, 6).filter(x => x.pessoaId && vida.pessoas[x.pessoaId]);
  const agora: CartaoAgora31[] = [
    { id: 'casa', rotulo: 'Em casa', titulo: casa.pessoas.map(p => p.nome).filter(Boolean).slice(0, 3).join(', ') || 'Ninguém', detalhe: casa.pessoas.length > 3 ? `e mais ${casa.pessoas.length - 3}` : undefined, icone: ICONE31.casa, ir: () => irParte('circulo') },
    ...(i >= 14 ? [{ id: 'amor', rotulo: 'No amor', titulo: afeto ? cap(afeto) : 'Sem ninguém agora', icone: ICONE31.saude, ir: () => irParte('circulo') }] : []),
    ...(perto.length ? [{ id: 'perto', rotulo: 'Quem mais importa', titulo: perto.map(x => x.p.nome).join(', '), icone: ICONE31.circulo, ir: () => abrir(perto[0].p.id) }] : [])
  ];
  const pede: Passo31[] = sinais.map((s, k) => ({ id: `s${k}`, rotulo: s.texto, nota: s.porque, ir: () => abrir(s.pessoaId!) }));
  const passos: Passo31[] = [];
  if (i >= 15 && !vida.justica?.prisao) passos.push({ id: 'conhecer', rotulo: 'Conhecer alguém', nota: 'pelos amigos, saindo, ou pelo aplicativo', ir: () => { irParte('circulo'); requestAnimationFrame?.(() => document.getElementById('conhecer-alguem')?.scrollIntoView?.({ block: 'start' })); } });
  if (i >= 18 && temCelular15(vida) && !vida.justica?.prisao) passos.push({ id: 'namoro', rotulo: 'Abrir o aplicativo de namoro', nota: 'perfis com fotos, matches e conversas', ir: () => window.dispatchEvent(new CustomEvent('vida:celular', { detail: 'namoro' })) });
  if (i >= 6) passos.push({ id: 'amizades', rotulo: 'Fazer amizades', nota: 'onde dá para conhecer gente', ir: () => irParte('circulo') });
  if (i >= 8) passos.push({ id: 'sair', rotulo: 'Receber gente e sair junto', nota: 'programas, noite, família', ir: () => irPara('gente') });
  return (
    <Inicio31 area="Pessoas" classe="inicio31--pessoas" kicker="minhas pessoas" titulo={casa.pessoas.length ? `Perto: ${casa.pessoas.map(p => p.nome).filter(Boolean).slice(0, 2).join(' e ')}` : 'Quem está na sua vida'}
      cena={<ConstelacaoDePessoas vida={vida} abrir={abrir} />}
      agora={agora} pede={pede} tituloPede="Pedem atenção" passos={passos}
      destinos={PARTES_PESSOAS.map(p => ({ id: p.id, rotulo: p.rotulo, oque: p.oque, icone: ICONE31[p.id], ir: () => irParte(p.id) }))}
      tituloExplorar="Explorar as pessoas" buscaDica="Procurar"
      abas={PARTES_PESSOAS.map(p => ({ id: p.id, rotulo: p.rotulo, ir: () => irParte(p.id) }))} rotuloAbas="Partes de Pessoas"
      />
  );
}

/* ================================================================ Eu */

const PARTES_EU: { id: ParteVoce; rotulo: string; oque: string; desde?: number }[] = [
  { id: 'resumo', rotulo: 'Resumo', oque: 'Os atributos, a cabeça, a crença, a semana e o dinheiro' },
  { id: 'saude', rotulo: 'Saúde', oque: 'O prontuário: o que o corpo sinaliza, o que tem nome, o médico' },
  { id: 'habilidades', rotulo: 'Habilidades', oque: 'No que você é bom e o seu jeito' },
  { id: 'aparencia', rotulo: 'Aparência', oque: 'O corpo, o rosto, o cabelo, a roupa, tatuagens e piercings' },
  { id: 'gostos', rotulo: 'Gostos e cultura', oque: 'O que você ouve e gosta; shows, exposições, obras', desde: 8 },
  { id: 'objetivos', rotulo: 'Objetivos', oque: 'As metas que você escolheu e o quanto falta', desde: 12 },
  { id: 'fama', rotulo: 'Fama', oque: 'O nome público: a imagem, o que a fama traz e cobra' },
  { id: 'mundo', rotulo: 'No mundo', oque: 'A época, os lugares, o que construiu, a família' }
];

export function EuInicio31({ vida, irParte, irPara }: { vida: Vida; irParte: (p: ParteVoce) => void; irPara: (a: Aba) => void }) {
  const i = idade(vida);
  const fama = leituraDaFama13(vida);
  const sinais = sinaisDoCorpo(vida);
  const condicoes = vida.corpo.condicoes.filter(c => c.diagnosticada !== false);
  const ag = agendaDaSemana(vida);
  const livres = Math.round(ag.livre.reduce((s, x) => s + x, 0) / 60);
  const agora: CartaoAgora31[] = [
    { id: 'saude', rotulo: 'Saúde', titulo: condicoes.length ? `${condicoes.length} ${condicoes.length === 1 ? 'condição' : 'condições'}` : sinais.length ? `${sinais.length} ${sinais.length === 1 ? 'sinal do corpo' : 'sinais do corpo'}` : 'Nada pedindo atenção', detalhe: condicoes.map(c => c.nome).slice(0, 2).join(', ') || undefined, icone: ICONE31.saude, ir: () => irParte('saude'), tom: condicoes.length || sinais.length ? 'alerta' : undefined },
    ...(i >= 6 ? [{ id: 'semana', rotulo: 'A semana', titulo: ag.blocos.length ? `${ag.blocos.length} ${ag.blocos.length === 1 ? 'compromisso fixo' : 'compromissos fixos'}` : 'Semana em branco', detalhe: `${livres} h livres entre 7h e 23h`, icone: ICONE31.semana, ir: () => irPara('semana'), tom: ag.conflitos.length ? 'ruim' as const : undefined }] : []),
    ...(fama.relevante ? [{ id: 'fama', rotulo: 'Fama', titulo: fama.imagem ? cap(fama.imagem.palavra) : 'Conhecido(a)', detalhe: 'o nome público', icone: ICONE31.fama, ir: () => irParte('fama') }] : [])
  ];
  const passos: Passo31[] = [];
  if (sinais.length || condicoes.some(c => !c.tratando)) passos.push({ id: 'medico', rotulo: 'Cuidar da saúde', nota: 'o prontuário e o médico', ir: () => irParte('saude'), destaque: true });
  if (vida.mente.estresse >= 60) passos.push({ id: 'estresse', rotulo: 'Aliviar a cabeça', nota: 'o que pesa e o que ajuda, na semana', ir: () => irPara('semana'), destaque: !passos.length });
  passos.push({ id: 'visual', rotulo: 'Mudar o visual', nota: 'cabelo, roupa, tatuagem, piercing', ir: () => irParte('aparencia') });
  if (i >= 4) passos.push({ id: 'corpo', rotulo: 'Cuidar do corpo', nota: 'esporte, academia, corrida, descanso', ir: () => irPara('corpo') });
  if (i >= 6) passos.push({ id: 'hobby', rotulo: 'Começar um hobby', nota: 'arte, música, leitura, jogos, ofícios', ir: () => irPara('atividades') });
  if (i >= 12) passos.push({ id: 'meta', rotulo: 'Escolher um objetivo', nota: 'metas de vida, com o progresso medido', ir: () => irParte('objetivos') });
  const destinos: Destino31[] = [
    ...PARTES_EU.filter(p => (p.desde ?? 0) <= i && (p.id !== 'fama' || fama.relevante)).map(p => ({ id: p.id, rotulo: p.rotulo, oque: p.oque, icone: ICONE31[p.id], ir: () => irParte(p.id) })),
    ...(i >= 3 ? SECOES_TEMPO.map(s => ({ id: `tempo-${s.id}`, rotulo: s.id === 'semana' ? 'Agenda da semana' : s.rotulo, oque: s.oque.split(' (')[0], estado: 'Minha Semana', icone: ICONE31[s.id], ir: () => irPara(s.id as SecaoTempo) })) : [])
  ];
  return (
    <Inicio31 area="Eu" classe="inicio31--eu" kicker={`${i} ${i === 1 ? 'ano' : 'anos'} · ${faseDaVida(i)}`} titulo={momentoAtual(vida)}
      cena={
        <div className="eu31">
          <button type="button" className="eu31__retrato" onClick={() => irParte('aparencia')} aria-label="Ver a aparência">
            <RetratoDoJogador17 vida={vida} visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} tamanho={96} rotulo={`${vida.eu.nome} aos ${i}`} expressao={expressaoDe(vida)} />
          </button>
          <div className="eu31__barras"><p className="eu31__nome">{vida.eu.nome} {vida.eu.sobrenome}</p><StatusDaVida31 vida={vida} irPara={irPara} /></div>
        </div>
      }
      agora={agora} passos={passos} destinos={destinos} tituloExplorar="Explorar" buscaDica="Procurar: saúde, cabelo, tatuagem, academia, agenda, redes…"
      abas={PARTES_EU.filter(p => (p.desde ?? 0) <= i && (p.id !== 'fama' || fama.relevante)).map(p => ({ id: p.id, rotulo: p.rotulo, ir: () => irParte(p.id) }))} rotuloAbas="Partes do retrato" />
  );
}

