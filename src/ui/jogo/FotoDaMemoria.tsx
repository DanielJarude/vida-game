/**
 * VIDA 12.6 — A FOTO DA MEMÓRIA. Antes, a "foto" do álbum era um quadro tingido com o ícone da categoria. Agora é um
 * retrato do momento REGISTRADO: quem estava (você e a pessoa da memória, quando ela existe), cada um com a idade que
 * tinha naquele dia, num cenário da categoria (o céu da viagem, o arco do casamento, a sala de aula da formatura, a mesa
 * do trabalho, o gramado do esporte). Na memória de uma tatuagem, o próprio desenho. Nada é inventado: sem pessoa
 * registrada, só você; sem nada a mostrar, o ícone de antes.
 */
import type { Vida } from '../../motor/tipos';
import type { Memoria } from '../../motor/sistemas/albumDaVida';
import { Retrato } from '../avatar/Retrato';
import { DesenhoDaTatuagem, caixaNativa } from '../avatar/tatuagens';
import { desenhoDeTatuagem } from '../../motor/dados/tatuagens';
import { IconeDaMemoria } from './IconeDaMemoria';

const CENARIO: Record<string, [string, string]> = {
  familia: ['#f3e3cf', '#e7c9a4'], relacionamentos: ['#f6dbe0', '#e9b8c2'], educacao: ['#dfe7f1', '#b9c9dd'], carreira: ['#e6e3da', '#cfc8b5'],
  esportes: ['#d9ecd4', '#9fca94'], patrimonio: ['#ece4d6', '#d3c2a3'], viagens: ['#d6e9f5', '#f3d9a8'], conquistas: ['#f4ead0', '#e3c77d'], especiais: ['#e9e2f1', '#c9bce0']
};

function Cena({ categoria, tipo }: { categoria: string; tipo: string }) {
  const [a, b] = CENARIO[categoria] ?? CENARIO.especiais;
  return (
    <g>
      <rect width={160} height={120} fill={a} />
      {categoria === 'viagens' && <><rect y={78} width={160} height={42} fill={b} /><circle cx={130} cy={28} r={12} fill="#f7c55a" opacity={0.85} /><path d="M0 80 Q40 66 80 78 T160 74 V80 H0 Z" fill="#8fb3c9" opacity={0.6} /></>}
      {categoria === 'relacionamentos' && (/casa|uniao/.test(tipo) ? <><path d="M30 120 V48 Q80 6 130 48 V120" fill="none" stroke="#fff" strokeWidth={7} opacity={0.75} />{[38, 56, 104, 122].map(x => <circle key={x} cx={x} cy={x < 80 ? 40 - (x - 38) * 0.4 : 40 - (122 - x) * 0.4} r={5} fill="#f2a7b8" />)}</> : <rect y={84} width={160} height={36} fill={b} />)}
      {categoria === 'educacao' && <><rect x={20} y={14} width={120} height={46} rx={3} fill="#3f5a4a" opacity={0.85} /><path d="M32 30 h40 M32 40 h60" stroke="#e9efe8" strokeWidth={2} opacity={0.7} /></>}
      {categoria === 'carreira' && <><rect y={86} width={160} height={34} fill={b} /><rect x={104} y={62} width={40} height={26} rx={2} fill="#59606b" /><rect x={108} y={66} width={32} height={18} fill="#9fc4de" /></>}
      {categoria === 'esportes' && <><rect y={74} width={160} height={46} fill={b} /><path d="M0 96 H160" stroke="#fff" strokeWidth={2} opacity={0.6} /></>}
      {categoria === 'patrimonio' && <><path d="M98 64 L128 40 L158 64 V100 H98 Z" fill={b} /><rect x={120} y={76} width={14} height={24} fill="#7a5a3a" /></>}
      {categoria === 'familia' && <><rect y={88} width={160} height={32} fill={b} /><rect x={12} y={20} width={30} height={22} rx={2} fill="#fff" opacity={0.6} /></>}
      {categoria === 'conquistas' && <><path d="M118 30 h22 v10 a11 11 0 0 1 -22 0 Z" fill="#d9a520" /><rect x={126} y={50} width={6} height={10} fill="#b8861a" /><rect x={120} y={60} width={18} height={4} fill="#8a6414" /></>}
    </g>
  );
}

export function FotoDaMemoria({ vida, m }: { vida: Vida; m: Memoria }) {
  const outra = m.pessoaId ? vida.pessoas[m.pessoaId] : undefined;
  const idadeOutra = outra ? Math.max(0, Math.floor((m.t - outra.tNasc) / 12)) : 0;
  const entrada = m.entradaId ? vida.biografia.find(e => e.id === m.entradaId) : undefined;
  const tatu = entrada?.fato?.tipo === 'm_tatuagem' ? desenhoDeTatuagem(String(entrada.fato.dados.desenho)) : undefined;
  // Quem não existia ainda não aparece (o bebê aparece bebê; o morto aparece como era naquele dia).
  const mostrarOutra = !!outra && !outra.especie && m.t >= outra.tNasc;
  const eu = Math.max(0, m.idade);
  return (
    <svg className="retro-foto__cena" viewBox="0 0 160 120" role="img" aria-label={`${m.titulo}, ${m.ano}`} preserveAspectRatio="xMidYMid slice">
      <Cena categoria={m.categoria} tipo={m.tipo} />
      {tatu ? (() => { const [w, h] = caixaNativa(tatu); const k = 70 / Math.max(w, h); return <g transform={`translate(${80 - (w * k) / 2} ${60 - (h * k) / 2}) scale(${k})`}><DesenhoDaTatuagem id={tatu.id} tinta="#22262b" cor={c => c} /></g>; })() : (
        <>
          <g transform={`translate(${mostrarOutra ? 14 : 44} 30)`}><Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={eu} semente={vida.eu.semente ?? 'eu'} tamanho={72} rotulo="" /></g>
          {mostrarOutra && <g transform={`translate(${idadeOutra <= 2 ? 86 : 74} ${idadeOutra <= 2 ? 56 : 30})`}><Retrato visual={outra!.visual} genero={outra!.genero} idade={idadeOutra} semente={outra!.id} tamanho={idadeOutra <= 2 ? 50 : 72} rotulo="" /></g>}
        </>
      )}
      <g transform="translate(130 92)" className="retro-foto__selo"><circle cx={12} cy={12} r={13} fill="#fffaf0" opacity={0.92} /><g transform="translate(2 2)"><IconeDaMemoria categoria={m.categoria} tamanho={20} /></g></g>
    </svg>
  );
}
