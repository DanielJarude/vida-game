/**
 * VIDA 25 · a CARTEIRA DE MOTORISTA lembrada na hora certa (o jogador esquecia que podia tirá-la: a porta morava só em
 * Compras · Veículos). O motor diz se há motivo (`autoescola.lembrarDaCnh`: tem veículo e não pode dirigir; acabou de
 * chegar à idade; adulto sem carteira); aqui, um cartão discreto no painel "Agora", com o custo no botão e um "agora não"
 * que cala AQUELE motivo nesta vida (um motivo novo — comprar um carro — volta a aparecer uma vez).
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { habilitacaoDaVida, lembrarDaCnh } from '../../../motor/sistemas/autoescola';
import { BotaoAcao } from '../../comum';
import './lembreteCnh25.css';

const chave = (id: string) => `vida.cnh.dispensa.${id}`;
function dispensados(id: string): string[] { try { return JSON.parse(localStorage.getItem(chave(id)) ?? '[]') as string[]; } catch { return []; } }
function dispensar(id: string, motivo: string): void { try { localStorage.setItem(chave(id), JSON.stringify([...new Set([...dispensados(id), motivo])])); } catch { /* sem armazenamento: some só nesta sessão */ } }

export function LembreteCnh25({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [calado, setCalado] = useState<string | undefined>();
  const l = lembrarDaCnh(vida);
  if (!l || calado === l.motivo || dispensados(vida.id).includes(l.motivo)) return null;
  const h = habilitacaoDaVida(vida);
  return (
    <section className="lembrete-cnh" aria-label={`Tirar ${h.a}`} data-motivo={l.motivo}>
      <p className="lembrete-cnh__texto"><span aria-hidden>🚗 </span>{l.texto}</p>
      <div className="lembrete-cnh__botoes">
        <BotaoAcao vida={vida} agir={agir} acao={{ tipo: 'cnh' }} variante="secundario" ocultarImpossivel>{`Começar ${h.naEscola}`}</BotaoAcao>
        <button type="button" className="botao botao--discreto" onClick={() => { dispensar(vida.id, l.motivo); setCalado(l.motivo); }}>Agora não</button>
      </div>
    </section>
  );
}
