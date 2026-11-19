/**
 * VIDA 28 · o arquétipo emergente na ficha (o atleta, o jogador de e-sports, o piloto): o principal, o que ele é, o que
 * ele FAZ na temporada (`arquetipos.oQueOPerfilFaz`) e os traços secundários. Sem perfil ainda (a primeira temporada
 * não fechou, ou nada se destaca), diz isso — não inventa rótulo.
 */
import { arquetipo, nomeDoArquetipo, oQueOPerfilFaz, type PerfilGuardado } from '../../motor/sistemas/arquetipos';

export function Perfil28({ perfil, genero }: { perfil?: PerfilGuardado; genero?: string }) {
  if (!perfil) return null;
  if (!perfil.principal) return <p className="nota" data-perfil28="">Perfil: ainda nenhum traço se destaca — o jeito de jogar se forma com as temporadas.</p>;
  const a = arquetipo(perfil.principal);
  const faz = oQueOPerfilFaz(perfil);
  return (
    <p className="nota" data-perfil28={perfil.principal}>
      <strong>Perfil: {nomeDoArquetipo(perfil.principal, genero)}</strong>{a ? ` — ${a.sobre}` : ''}
      {faz.length ? ` Na temporada: ${faz.join(', ')}.` : ''}
      {perfil.secundarios.length ? ` Também: ${perfil.secundarios.map(id => nomeDoArquetipo(id, genero).toLowerCase()).join(', ')}.` : ''}
    </p>
  );
}
