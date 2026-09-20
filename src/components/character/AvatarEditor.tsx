import React from 'react';
import {
  AparenciaAvatar,
  CORES_CABELO,
  CORES_OLHOS,
  ESTILOS_CABELO,
  TONS_PELE,
  CorCabelo,
  CorOlhos,
  EstiloCabelo,
  TomPele
} from '../../data/avatar/avatarData';
import { AvatarFace } from './AvatarFace';

interface AvatarEditorProps {
  aparencia: AparenciaAvatar;
  onMudar: (aparencia: AparenciaAvatar) => void;
}

/**
 * Editor de aparência na criação de Nova Vida (B4-FIX2 item 17).
 *
 * Quatro escolhas simples — tom de pele, estilo de cabelo, cor do cabelo,
 * cor dos olhos — com uma pré-visualização ao vivo. Nada aqui é IA, upload
 * ou editor 3D: é seleção entre um catálogo pequeno e fixo de opções
 * vetoriais. Puramente cosmético — a tela não lê nem grava nenhum stat.
 */
export const AvatarEditor: React.FC<AvatarEditorProps> = ({
  aparencia,
  onMudar
}) => {
  const atualizar = <K extends keyof AparenciaAvatar>(
    campo: K,
    valor: AparenciaAvatar[K]
  ) => onMudar({ ...aparencia, [campo]: valor });

  return (
    <div className="avatar-editor">
      <div className="avatar-editor__preview">
        <AvatarFace idade={20} aparencia={aparencia} tamanho={96} />
      </div>

      <div className="avatar-editor__controls">
        <div className="field">
          <span className="field__label" id="label-tom-pele">
            Tom de pele
          </span>
          <div
            className="choice-group choice-group--swatches"
            role="group"
            aria-labelledby="label-tom-pele"
          >
            {TONS_PELE.map(t => (
              <button
                type="button"
                key={t.id}
                className="swatch-chip"
                style={{ backgroundColor: t.hex }}
                aria-pressed={aparencia.tomPele === t.id}
                aria-label={t.rotulo}
                title={t.rotulo}
                onClick={() => atualizar('tomPele', t.id as TomPele)}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label" id="label-estilo-cabelo">
            Cabelo
          </span>
          <div
            className="choice-group"
            role="group"
            aria-labelledby="label-estilo-cabelo"
          >
            {ESTILOS_CABELO.map(e => (
              <button
                type="button"
                key={e.id}
                className="choice-chip"
                aria-pressed={aparencia.estiloCabelo === e.id}
                onClick={() => atualizar('estiloCabelo', e.id as EstiloCabelo)}
              >
                {e.rotulo}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label" id="label-cor-cabelo">
            Cor do cabelo
          </span>
          <div
            className="choice-group choice-group--swatches"
            role="group"
            aria-labelledby="label-cor-cabelo"
          >
            {CORES_CABELO.map(c => (
              <button
                type="button"
                key={c.id}
                className="swatch-chip"
                style={{ backgroundColor: c.hex }}
                aria-pressed={aparencia.corCabelo === c.id}
                aria-label={c.rotulo}
                title={c.rotulo}
                onClick={() => atualizar('corCabelo', c.id as CorCabelo)}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label" id="label-cor-olhos">
            Cor dos olhos
          </span>
          <div
            className="choice-group choice-group--swatches"
            role="group"
            aria-labelledby="label-cor-olhos"
          >
            {CORES_OLHOS.map(c => (
              <button
                type="button"
                key={c.id}
                className="swatch-chip"
                style={{ backgroundColor: c.hex }}
                aria-pressed={aparencia.corOlhos === c.id}
                aria-label={c.rotulo}
                title={c.rotulo}
                onClick={() => atualizar('corOlhos', c.id as CorOlhos)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
