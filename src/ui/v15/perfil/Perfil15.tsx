/**
 * VIDA 15 · O PERFIL — a faixa de "perfil pessoal" logo abaixo do retrato, em Você: os números da vida social (amigos,
 * família, seguidores), o estado civil, o tamanho do nome e os objetivos — cada um é um ATALHO para a tela que já cuida
 * dele (nada é recalculado nem repetido aqui).
 */
import type { Vida } from '../../../motor/tipos';
import { idade, parceiro, vinculosVivos } from '../../../motor/nucleo';
import { flex } from '../../../motor/texto';
import { leituraDaFama13 } from '../../../motor/sistemas/reconhecimento13';
import type { Aba } from '../../navegacao';

type Parte = 'aparencia' | 'fama' | 'objetivos';

function compacto(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (n >= 10_000) return `${Math.round(n / 1000)} mil`;
  if (n >= 1000) return `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return String(n);
}

export function Perfil15({ vida, irPara, irParte }: { vida: Vida; irPara: (a: Aba) => void; irParte: (p: Parte) => void }) {
  const i = idade(vida);
  if (i < 6) return null;
  const vivos = vinculosVivos(vida).filter(x => !x.p.especie);
  const amigos = vivos.filter(x => x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo').length;
  const familia = vivos.filter(x => x.vin.parentesco).length;
  const seguidores = Object.values(vida.redes?.contas ?? {}).reduce((s, c) => s + (c.apagada ? 0 : c.seguidores), 0);
  const par = parceiro(vida);
  const g = vida.eu.genero;
  const civil = par ? (par.vin.romance!.estagio === 'casamento' ? flex(g, 'casado', 'casada', 'casade') : par.vin.romance!.estagio === 'morando_junto' ? 'morando junto' : 'namorando') : i >= 16 ? flex(g, 'solteiro', 'solteira', 'solteire') : undefined;
  const fama = leituraDaFama13(vida);
  const objetivos = vida.conquistas14?.objetivos?.filter(o => o.estado === 'ativo').length ?? 0;
  const itens: { k: string; valor: string; rotulo: string; ir: () => void }[] = [
    { k: 'amigos', valor: String(amigos), rotulo: amigos === 1 ? 'amigo' : 'amigos', ir: () => irPara('pessoas') },
    { k: 'familia', valor: String(familia), rotulo: 'família', ir: () => irPara('pessoas') },
    ...(seguidores > 0 ? [{ k: 'seguidores', valor: compacto(seguidores), rotulo: 'seguidores', ir: () => irPara('redes') }] : []),
    ...(civil ? [{ k: 'civil', valor: civil, rotulo: par ? `com ${par.p.nome}` : 'estado civil', ir: () => irPara('pessoas') }] : []),
    ...(fama.relevante ? [{ k: 'fama', valor: fama.palavra, rotulo: 'fama', ir: () => irParte('fama') }] : []),
    ...(i >= 12 ? [{ k: 'objetivos', valor: String(objetivos), rotulo: objetivos === 1 ? 'objetivo' : 'objetivos', ir: () => irParte('objetivos') }] : [])
  ];
  return (
    <nav className="perfil15" aria-label="O seu perfil">
      <ul className="perfil15__numeros">
        {itens.map(x => (
          <li key={x.k}><button type="button" className={`perfil15__item perfil15__item--${x.k}`} onClick={x.ir}><strong>{x.valor}</strong><span>{x.rotulo}</span></button></li>
        ))}
      </ul>
      <div className="perfil15__atalhos">
        <button type="button" className="perfil15__atalho" onClick={() => irParte('aparencia')}>Aparência</button>
        <button type="button" className="perfil15__atalho" onClick={() => irPara('linha')}>Minha história</button>
        <button type="button" className="perfil15__atalho" onClick={() => window.dispatchEvent(new CustomEvent('vida:celular', { detail: 'inicio' }))}>Celular</button>
      </div>
    </nav>
  );
}
