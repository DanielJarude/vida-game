import React from 'react';
import type { AvatarAppearance } from '../../types';
import {
  TONS_DE_PELE,
  CORES_DE_CABELO,
  CORES_DE_OLHOS,
  ESTILOS_DE_CABELO,
  type OpcaoAparencia
} from '../../data/avatar/avatarOptions';
import { AvatarPortrait } from './AvatarPortrait';

interface AvatarPickerProps {
  avatar: AvatarAppearance;
  onChange: (avatar: AvatarAppearance) => void;
}

interface SeletorCorProps {
  titulo: string;
  opcoes: readonly OpcaoAparencia[];
  selecionado: string;
  onSelect: (id: string) => void;
}

/**
 * Faixa de amostras de cor.
 *
 * As opções são lidas dos dados: acrescentar uma cor em
 * `avatarOptions` a faz aparecer aqui sem alterar este arquivo.
 */
const SeletorCor: React.FC<SeletorCorProps> = ({
  titulo,
  opcoes,
  selecionado,
  onSelect
}) => (
  <div className="avatar-picker__row">
    <span className="avatar-picker__label" id={`avatar-${titulo}`}>
      {titulo}
    </span>
    <div
      className="avatar-picker__swatches"
      role="radiogroup"
      aria-labelledby={`avatar-${titulo}`}
    >
      {opcoes.map(o => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={selecionado === o.id}
          aria-label={o.nome}
          title={o.nome}
          className="avatar-swatch"
          data-selected={selecionado === o.id}
          style={{ backgroundColor: o.cor }}
          onClick={() => onSelect(o.id)}
        />
      ))}
    </div>
  </div>
);

/**
 * Personalização da aparência.
 *
 * Conjunto pequeno e deliberado: tom de pele, estilo e cor de cabelo, cor
 * dos olhos. Nada aqui altera atributo de jogo — é só como a pessoa é
 * vista.
 */
export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  avatar,
  onChange
}) => {
  const atualizar = (campo: keyof AvatarAppearance) => (valor: string) =>
    onChange({ ...avatar, [campo]: valor });

  return (
    <div className="avatar-picker">
      <div className="avatar-picker__preview">
        <AvatarPortrait
          avatar={avatar}
          idade={22}
          tamanho={112}
          rotulo="Prévia do seu avatar"
        />
      </div>

      <div className="avatar-picker__controls">
        <SeletorCor
          titulo="Pele"
          opcoes={TONS_DE_PELE}
          selecionado={avatar.tomDePele}
          onSelect={atualizar('tomDePele')}
        />

        <div className="avatar-picker__row">
          <span className="avatar-picker__label" id="avatar-estilo-cabelo">
            Cabelo
          </span>
          <div
            className="avatar-picker__styles"
            role="radiogroup"
            aria-labelledby="avatar-estilo-cabelo"
          >
            {ESTILOS_DE_CABELO.map(e => (
              <button
                key={e.id}
                type="button"
                role="radio"
                aria-checked={avatar.estiloCabelo === e.id}
                className="avatar-style"
                data-selected={avatar.estiloCabelo === e.id}
                onClick={() => atualizar('estiloCabelo')(e.id)}
              >
                {e.nome}
              </button>
            ))}
          </div>
        </div>

        <SeletorCor
          titulo="Cor do cabelo"
          opcoes={CORES_DE_CABELO}
          selecionado={avatar.corCabelo}
          onSelect={atualizar('corCabelo')}
        />

        <SeletorCor
          titulo="Olhos"
          opcoes={CORES_DE_OLHOS}
          selecionado={avatar.corOlhos}
          onSelect={atualizar('corOlhos')}
        />
      </div>
    </div>
  );
};
