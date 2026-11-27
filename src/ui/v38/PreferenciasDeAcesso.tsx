import { useState } from 'react';
import { lerPreferencias, guardarPreferencias, type Preferencias } from './acessibilidade';
import './acessibilidade.css';

/** Três interruptores no menu: texto maior, alto contraste, menos animações. */
export function PreferenciasDeAcesso() {
  const [p, setP] = useState<Preferencias>(() => lerPreferencias());
  const mudar = (chave: keyof Preferencias) => {
    const proximo = { ...p, [chave]: !p[chave] };
    setP(proximo);
    guardarPreferencias(proximo);
  };
  const itens: { chave: keyof Preferencias; rotulo: string }[] = [
    { chave: 'textoMaior', rotulo: 'Texto maior' },
    { chave: 'altoContraste', rotulo: 'Alto contraste' },
    { chave: 'semAnimacao', rotulo: 'Sem animações' },
  ];
  return (
    <fieldset className="acessibilidade">
      <legend className="subtitulo">Acessibilidade</legend>
      {itens.map(i => (
        <label key={i.chave} className="acessibilidade__item">
          <input type="checkbox" checked={p[i.chave]} onChange={() => mudar(i.chave)} /> {i.rotulo}
        </label>
      ))}
    </fieldset>
  );
}
