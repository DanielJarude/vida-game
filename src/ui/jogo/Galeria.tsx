/**
 * REWORK 11.5 · TRO-01 — A GALERIA DE CONQUISTAS. Cada competição tem a sua FORMA de troféu (desenhos originais, sem
 * marca): a copa do mundo de seleções com o globo, a continental de seleções alta e de alças finas, a de clubes da
 * Europa de alças largas, a da América com a figura no alto, a copa nacional em urna com tampa, a liga em placa e
 * escudo, o acesso em taça pequena, as copas de quadra com a bola, o prêmio individual em medalha; na arte, a estatueta
 * e o disco. Tudo vem do que o motor registrou (`palmares`, `trofeuId`, `competicaoId`; os prêmios do currículo e das
 * obras; os títulos do técnico) — nada é concedido para preencher a galeria.
 */
import type { ConquistaEsportiva, Vida } from '../../motor/tipos';
import { anoDe } from '../../motor/tempo';

type Forma = 'mundo' | 'selecao' | 'orelhas' | 'figura' | 'urna' | 'liga' | 'acesso' | 'quadra' | 'medalha' | 'estatueta' | 'disco' | 'banco' | 'bola' | 'chuteira' | 'the_best' | 'golden_boy';

/** A forma pelo id estável (a apresentação muda; o id não). */
export function formaDoTrofeu(c: Pick<ConquistaEsportiva, 'tipo' | 'competicaoId' | 'competicao'>): Forma {
  // HOTFIX 11.5.1: os prêmios do futebol do mundo, cada um com a sua forma (a bola dourada, a chuteira, o globo e a
  // figura do The Best, a figura jovem do Golden Boy); os outros prêmios, a medalha.
  if (c.competicaoId === 'premio:bola_de_ouro') return 'bola';
  if (c.competicaoId === 'premio:chuteira_de_ouro') return 'chuteira';
  if (c.competicaoId === 'premio:the_best') return 'the_best';
  if (c.competicaoId === 'premio:golden_boy') return 'golden_boy';
  if (c.tipo === 'premio') return 'medalha';
  if (c.tipo === 'acesso') return 'acesso';
  const id = c.competicaoId ?? '';
  if (id.endsWith(':basquete') || id.endsWith(':volei')) return 'quadra';
  if (id === 'sel:mundial') return 'mundo';
  if (id.startsWith('sel:')) return 'selecao';
  if (id === 'cont:UEFA') return 'orelhas';
  if (id.startsWith('cont:')) return 'figura';
  if (id.startsWith('copa:')) return 'urna';
  if (id.startsWith('liga:')) return Number(id.split(':')[2]) >= 4 ? 'liga' : 'acesso';
  if (/mundial|copa do mundo/i.test(c.competicao)) return 'mundo';
  return 'liga';
}

/** O desenho de cada forma (traço simples, a mesma paleta: ouro para o título, prata para a final, bronze para o prêmio). */
export function Trofeu({ forma, metal = 'ouro', rotulo }: { forma: Forma; metal?: 'ouro' | 'prata' | 'bronze'; rotulo: string }) {
  const corpo = (() => {
    switch (forma) {
      case 'mundo': return <><circle cx="20" cy="12" r="8" /><path d="M14 19 Q20 30 16 38 L24 38 Q20 30 26 19 Z" /><rect x="12" y="38" width="16" height="6" rx="1" /></>;
      case 'selecao': return <><path d="M12 6 L28 6 L26 22 Q20 28 14 22 Z" /><path d="M12 8 Q6 10 10 18 M28 8 Q34 10 30 18" fill="none" strokeWidth="1.6" /><rect x="18" y="26" width="4" height="10" /><rect x="11" y="36" width="18" height="7" rx="1" /></>;
      case 'orelhas': return <><path d="M13 6 L27 6 L26 24 Q20 29 14 24 Z" /><path d="M13 9 Q2 12 12 24 M27 9 Q38 12 28 24" fill="none" strokeWidth="3" /><rect x="17" y="28" width="6" height="8" /><rect x="12" y="36" width="16" height="7" rx="1" /></>;
      case 'figura': return <><circle cx="20" cy="5" r="3" /><path d="M17 8 L23 8 L22 14 L18 14 Z" /><path d="M12 14 L28 14 L26 26 Q20 30 14 26 Z" /><rect x="18" y="29" width="4" height="7" /><rect x="11" y="36" width="18" height="7" rx="1" /></>;
      case 'urna': return <><path d="M15 4 L25 4 L24 8 L16 8 Z" /><path d="M12 9 L28 9 Q30 22 22 27 L18 27 Q10 22 12 9 Z" /><path d="M12 11 Q5 14 12 20 M28 11 Q35 14 28 20" fill="none" strokeWidth="1.8" /><rect x="17" y="27" width="6" height="9" /><rect x="12" y="36" width="16" height="7" rx="1" /></>;
      case 'liga': return <><path d="M8 6 L32 6 L30 26 Q20 34 10 26 Z" /><path d="M14 12 L26 12 M14 18 L26 18" fill="none" strokeWidth="1.6" /><rect x="10" y="36" width="20" height="7" rx="1" /></>;
      case 'acesso': return <><path d="M14 14 L26 14 L25 24 Q20 28 15 24 Z" /><rect x="18" y="27" width="4" height="8" /><rect x="13" y="35" width="14" height="7" rx="1" /></>;
      case 'quadra': return <><circle cx="20" cy="9" r="6" /><path d="M14 9 L26 9 M20 3 L20 15" fill="none" strokeWidth="1.2" /><path d="M14 17 L26 17 L24 27 Q20 30 16 27 Z" /><rect x="18" y="29" width="4" height="6" /><rect x="12" y="35" width="16" height="7" rx="1" /></>;
      case 'medalha': return <><path d="M14 2 L20 14 L26 2" fill="none" strokeWidth="3" /><circle cx="20" cy="24" r="11" /><circle cx="20" cy="24" r="6" fill="none" strokeWidth="1.4" /></>;
      case 'estatueta': return <><circle cx="20" cy="6" r="4" /><path d="M16 11 L24 11 L23 30 L17 30 Z" /><rect x="13" y="30" width="14" height="4" /><rect x="11" y="34" width="18" height="8" rx="1" /></>;
      case 'disco': return <><circle cx="20" cy="20" r="15" /><circle cx="20" cy="20" r="5" fill="none" strokeWidth="1.6" /><circle cx="20" cy="20" r="1.5" /><rect x="8" y="38" width="24" height="5" rx="1" /></>;
      case 'bola': return <><circle cx="20" cy="17" r="12" /><path d="M20 9 L25 13 L23 19 L17 19 L15 13 Z M20 5 L20 9 M25 13 L31 11 M23 19 L27 25 M17 19 L13 25 M15 13 L9 11" fill="none" strokeWidth="1.1" /><path d="M14 30 L26 30 L28 36 L12 36 Z" /><rect x="10" y="36" width="20" height="7" rx="1" /></>;
      case 'chuteira': return <><path d="M7 14 L19 14 L21 20 Q30 20 34 24 Q36 28 32 29 L7 29 Q5 22 7 14 Z" /><path d="M10 29 L10 31 M15 29 L15 31 M22 29 L22 31 M28 29 L28 31" fill="none" strokeWidth="1.6" /><path d="M12 18 L18 18 M12 22 L20 22" fill="none" strokeWidth="1" /><rect x="9" y="34" width="22" height="9" rx="1" /></>;
      case 'the_best': return <><circle cx="20" cy="9" r="6" /><path d="M14 9 Q20 13 26 9 M20 3 Q23 9 20 15" fill="none" strokeWidth="1" /><path d="M15 16 Q20 18 25 16 L23 30 L17 30 Z" /><path d="M16 22 Q11 18 12 13 M24 22 Q29 18 28 13" fill="none" strokeWidth="2" /><rect x="12" y="31" width="16" height="4" /><rect x="10" y="35" width="20" height="8" rx="1" /></>;
      case 'golden_boy': return <><circle cx="20" cy="6" r="3.6" /><path d="M16 10 L24 10 L23 22 L21 22 L21 32 L19 32 L19 22 L17 22 Z" /><path d="M16 12 L10 6 M24 12 L30 6" fill="none" strokeWidth="2.2" strokeLinecap="round" /><circle cx="26" cy="31" r="3" /><rect x="11" y="34" width="18" height="9" rx="1" /></>;
      case 'banco': return <><path d="M10 6 L30 6 L28 22 Q20 28 12 22 Z" /><path d="M14 12 L26 12" fill="none" strokeWidth="1.4" /><rect x="17" y="26" width="6" height="9" /><rect x="11" y="35" width="18" height="8" rx="1" /></>;
    }
  })();
  return <svg className={`trofeu trofeu--${metal}`} data-forma={forma} viewBox="0 0 40 46" role="img" aria-label={rotulo}>{corpo}</svg>;
}

export interface ItemDaGaleria { id: string; forma: Forma; metal: 'ouro' | 'prata' | 'bronze'; nome: string; ano: number; onde?: string; papel?: string; tipo: 'coletivo' | 'individual' | 'tecnico' | 'arte' }

/** O que a galeria mostra (só o que foi registrado de verdade). */
export function itensDaGaleria(v: Vida): ItemDaGaleria[] {
  const out: ItemDaGaleria[] = [];
  for (const c of v.caminhos.palmares ?? []) {
    // HOTFIX 11.5.1: os títulos pela seleção (Copa do Mundo, Copa América, Eurocopa...) também são troféus — antes, a
    // galeria só lia títulos de clube, e o campeão do mundo não via a taça.
    if (c.tipo === 'selecao' && c.competicaoId && /^Campe(ão|ã)/.test(c.texto)) {
      out.push({ id: c.trofeuId ?? `sel:${c.competicaoId}:${c.ano}`, forma: formaDoTrofeu({ ...c, tipo: 'titulo' }), metal: 'ouro', nome: c.competicao.replace(/^(o|a|os|as) /, '').replace(/^./, x => x.toUpperCase()), ano: c.ano, onde: 'pela seleção', papel: c.papel === 'protagonista' ? 'titular' : c.papel === 'elenco' ? 'no grupo' : undefined, tipo: 'coletivo' });
      continue;
    }
    if (c.tipo !== 'titulo' && c.tipo !== 'premio' && c.tipo !== 'acesso' && c.tipo !== 'final') continue;
    out.push({ id: c.trofeuId ?? `${c.tipo}:${c.competicao}:${c.ano}:${c.texto}`, forma: formaDoTrofeu(c), metal: c.tipo === 'final' ? 'prata' : c.tipo === 'premio' ? (c.competicaoId?.startsWith('premio:') ? 'ouro' : 'bronze') : 'ouro', nome: c.tipo === 'premio' ? c.texto : c.tipo === 'final' ? `Final: ${c.competicao}` : c.tipo === 'acesso' ? c.texto : c.competicao, ano: c.ano, onde: c.clube, papel: c.papel === 'protagonista' ? 'protagonista' : c.papel === 'elenco' ? 'no elenco' : undefined, tipo: c.tipo === 'premio' ? 'individual' : 'coletivo' });
  }
  for (const p of v.caminhos.tecnico?.passagens ?? []) for (const t of p.temporadas) for (const x of t.titulos ?? []) out.push({ id: `tec:${p.clube}:${t.ano}:${x}`, forma: 'banco', metal: 'ouro', nome: x.replace(/^Campeã?o /, ''), ano: t.ano, onde: p.clube, papel: 'no banco', tipo: 'tecnico' });
  for (const x of v.caminhos.curriculo ?? []) if (x.premio?.venceu) out.push({ id: `cv:${x.t}:${x.titulo}`, forma: 'estatueta', metal: 'ouro', nome: `${x.premio.nome}${x.premio.categoria ? ` · ${x.premio.categoria}` : ''}`, ano: x.premio.edicao ?? anoDe(x.t), onde: `"${x.titulo}"`, papel: x.papel, tipo: 'arte' });
  for (const o of v.caminhos.obras ?? []) if (o.premio?.venceu) out.push({ id: `obra:${o.t}:${o.titulo}`, forma: o.linguagem === 'musica' ? 'disco' : 'estatueta', metal: 'ouro', nome: o.premio.nome, ano: anoDe(o.t), onde: `"${o.titulo}"`, tipo: 'arte' });
  return out.sort((a, b) => b.ano - a.ano);
}

const GRUPO: Record<ItemDaGaleria['tipo'], string> = { coletivo: 'Títulos e campanhas', individual: 'Prêmios individuais', tecnico: 'Como técnico', arte: 'Prêmios artísticos' };

export function GaleriaDeConquistas({ vida }: { vida: Vida }) {
  const itens = itensDaGaleria(vida);
  if (!itens.length) return null;
  const grupos = (['coletivo', 'individual', 'tecnico', 'arte'] as const).map(g => ({ g, xs: itens.filter(i => i.tipo === g) })).filter(x => x.xs.length);
  return (
    <section className="galeria" aria-labelledby="titulo-galeria">
      <h2 id="titulo-galeria" className="secao-fio">A galeria</h2>
      {grupos.map(({ g, xs }) => (
        <div key={g} className="galeria__grupo">
          <h3 className="galeria__titulo">{GRUPO[g]} <span className="galeria__conta">{xs.length}</span></h3>
          <ul className="galeria__estante">
            {xs.map(i => (
              <li key={i.id} className="galeria__item">
                <Trofeu forma={i.forma} metal={i.metal} rotulo={`${i.nome} (${i.ano})`} />
                <p className="galeria__nome">{i.nome}</p>
                <p className="galeria__meta">{i.ano}{i.onde ? ` · ${i.onde}` : ''}{i.papel ? ` · ${i.papel}` : ''}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
