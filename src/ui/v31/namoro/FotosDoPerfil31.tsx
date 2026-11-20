/**
 * VIDA 31 · AS FOTOS DO PERFIL (o app de namoro): em vez de um rosto só, um carrossel — o rosto, o corpo inteiro, uma foto
 * num lugar que a pessoa curte (dos interesses que o perfil já mostra) e uma sorrindo. O corpo da figura é ESTÁVEL por
 * pessoa (sai do id e dos interesses, sem tocar no sorteio do jogo): a mesma pessoa tem sempre o mesmo corpo, em
 * qualquer foto e em qualquer ano.
 */
import { useState } from 'react';
import type { Pessoa } from '../../../motor/tipos';
import type { TipoDeCorpo } from '../../../motor/sistemas/silhueta';
import { Retrato } from '../../avatar/Retrato';
import { FiguraSobDemanda as Figura } from '../../avatar/figuraSobDemanda';
import './namoro31.css';

/** Um número estável de 0 a 1 para a pessoa (hash do id + chave). */
function estavel(id: string, chave: string): number {
  let h = 2166136261;
  for (const ch of `${id}:${chave}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

/** O corpo da figura da pessoa: os interesses puxam (academia → musculoso; corrida, trilha, bicicleta, dança, yoga → atlético). */
export function corpoDoPerfil31(p: Pessoa, interesses: string[], idade: number): TipoDeCorpo {
  const x = estavel(p.id, 'corpo31');
  if (interesses.includes('academia')) return x < 0.55 ? 'musculoso' : 'atletico';
  if (interesses.some(t => ['corrida', 'trilha', 'bicicleta', 'dança', 'yoga', 'futebol'].includes(t))) return x < 0.7 ? 'atletico' : 'mediano';
  const acima = idade >= 40 ? 0.3 : 0.18;
  return x < 0.22 ? 'magro' : x < 1 - acima ? 'mediano' : 'acima_do_peso';
}

const CENAS: Record<string, { cena: string; legenda: string }> = {
  praia: { cena: 'praia', legenda: 'na praia' }, trilha: { cena: 'trilha', legenda: 'numa trilha' }, viajar: { cena: 'viagem', legenda: 'viajando' },
  academia: { cena: 'academia', legenda: 'na academia' }, corrida: { cena: 'parque', legenda: 'depois da corrida' }, bicicleta: { cena: 'parque', legenda: 'de bicicleta no parque' },
  café: { cena: 'cafe', legenda: 'num café' }, cozinhar: { cena: 'cozinha', legenda: 'cozinhando' }, vinho: { cena: 'noite', legenda: 'num jantar' },
  'música ao vivo': { cena: 'show', legenda: 'num show' }, rock: { cena: 'show', legenda: 'num show' }, samba: { cena: 'show', legenda: 'numa roda de samba' }, sertanejo: { cena: 'show', legenda: 'num show' },
  dança: { cena: 'show', legenda: 'dançando' }, bares: { cena: 'noite', legenda: 'num bar com amigos' }, futebol: { cena: 'campo', legenda: 'na pelada' },
  yoga: { cena: 'parque', legenda: 'no yoga do parque' }, plantas: { cena: 'jardim', legenda: 'entre as plantas' }, cachorros: { cena: 'parque', legenda: 'passeando com o cachorro' },
  museus: { cena: 'museu', legenda: 'num museu' }, teatro: { cena: 'museu', legenda: 'antes do teatro' }, fotografia: { cena: 'viagem', legenda: 'fotografando a cidade' }
};

export function FotosDoPerfil31({ p, idade, interesses, nome }: { p: Pessoa; idade: number; interesses: string[]; nome: string }) {
  const [k, setK] = useState(0);
  const corpo = corpoDoPerfil31(p, interesses, idade);
  const lugar = interesses.map(t => CENAS[t]).find(Boolean) ?? { cena: 'cidade', legenda: 'na cidade' };
  const visual = p.visual!;
  const fotos = [
    { id: 'rosto', rotulo: 'Rosto', el: <Retrato visual={visual} genero={p.genero} idade={idade} semente={p.id} tamanho={230} rotulo={nome} especie={p.especie} /> },
    { id: 'corpo', rotulo: 'Corpo inteiro', el: <Figura visual={visual} genero={p.genero} idade={idade} semente={p.id} corpo={corpo} pecas={[]} largura={134} semFundo rotulo={`${nome}, corpo inteiro`} /> },
    { id: 'lugar', rotulo: lugar.legenda, el: <Figura visual={visual} genero={p.genero} idade={idade} semente={p.id} corpo={corpo} pecas={[]} largura={106} semFundo rotulo={`${nome} ${lugar.legenda}`} /> },
    { id: 'sorriso', rotulo: 'Sorrindo', el: <Retrato visual={visual} genero={p.genero} idade={idade} semente={p.id} tamanho={200} rotulo={`${nome} sorrindo`} expressao="bem" especie={p.especie} /> }
  ];
  const atual = fotos[k];
  const ir = (d: number) => setK(x => (x + d + fotos.length) % fotos.length);
  return (
    <div className={`fotos31 fotos31--${atual.id}${atual.id === 'lugar' ? ` fotos31--cena-${lugar.cena}` : ''}`} aria-roledescription="carrossel" aria-label={`Fotos de ${nome}`}>
      <ol className="fotos31__pontos" aria-hidden>{fotos.map((f, j) => <li key={f.id} className={j === k ? 'ativo' : ''} />)}</ol>
      <div className="fotos31__quadro" aria-live="polite">{atual.el}</div>
      {atual.id !== 'rosto' && <span className="fotos31__legenda">{atual.rotulo}</span>}
      <button type="button" className="fotos31__lado fotos31__lado--antes" onClick={() => ir(-1)} aria-label="Foto anterior" />
      <button type="button" className="fotos31__lado fotos31__lado--depois" onClick={() => ir(1)} aria-label={`Próxima foto (${k + 1} de ${fotos.length})`} />
    </div>
  );
}
