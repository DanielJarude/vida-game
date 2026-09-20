import React, { useState } from 'react';
import { Character, FamilyMember, Gender } from '../../types';
import { FamilyInteractionType } from '../../types';
import { FamilyModal } from '../modals/FamilyModal';
import {
  ContextoAcao,
  getActionAvailability,
  IDADE_MINIMA_RELACIONAMENTO_ADULTO
} from '../../systems/availabilitySystem';
import { apresentarRelacionamento } from '../../presentation/relationshipPresentation';

interface FamilyTabProps {
  personagem: Character;
  familia: FamilyMember[];
  ctx: ContextoAcao;
  onInteragir: (
    membroId: string,
    tipoAcao: FamilyInteractionType,
    presenteTipo?: 'barato' | 'medio' | 'luxo'
  ) => void;
  onPedirCasamento: (parceiroId: string) => void;
  onTerFilho: (parceiroId?: string, nome?: string, genero?: Gender) => void;
  onTerminar: (parceiroId: string) => void;
  onOpenDatingModal: () => void;
}

/** Uma pessoa da vida do personagem — nome, vínculo e proximidade em palavras. */
const PessoaRow: React.FC<{
  membro: FamilyMember;
  detalhe?: string;
  onAbrir: (m: FamilyMember) => void;
}> = ({ membro, detalhe, onAbrir }) => {
  const p = apresentarRelacionamento(membro);
  const modificador =
    p.proximidade === 'muito_proxima' || p.proximidade === 'proxima'
      ? ' relationship__closeness--proxima'
      : p.proximidade === 'conflituosa'
      ? ' relationship__closeness--dificil'
      : '';

  return (
    <button className="action-row unit-card--interactive" onClick={() => onAbrir(membro)}>
      <span className="action-row__body">
        <span className="action-row__title">
          {membro.nome} {membro.sobrenome}
        </span>
        <span className="action-row__detail">
          {p.relacao}
          {detalhe ? ` · ${detalhe}` : ''}
        </span>
      </span>
      <span className={`relationship__closeness${modificador}`}>
        {p.rotuloProximidade}
      </span>
    </button>
  );
};

export const FamilyTab: React.FC<FamilyTabProps> = ({
  personagem,
  familia,
  ctx,
  onInteragir,
  onPedirCasamento,
  onTerFilho,
  onTerminar,
  onOpenDatingModal
}) => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const vivos = familia.filter(f => f.vivo);
  const falecidos = familia.filter(f => !f.vivo);

  const parceiros = vivos.filter(f =>
    ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'].includes(f.tipo)
  );
  const filhos = vivos.filter(f => f.tipo === 'filho' || f.tipo === 'filha');
  const paisEirmaos = vivos.filter(f =>
    ['pai', 'mae', 'irmao', 'irma'].includes(f.tipo)
  );
  const pets = vivos.filter(f => f.tipo === 'pet');

  const abrirModal = (membro: FamilyMember) => setSelectedMember(membro);

  const verificarInteracao = (tipo: FamilyInteractionType) => {
    if (!selectedMember) return { kind: 'oculto', reasonCode: 'sem_membro' } as const;
    return getActionAvailability(ctx, 'interagir_familia', {
      membroId: selectedMember.id,
      tipoInteracao: tipo
    });
  };

  const idadeTexto = (n: number) => (n === 1 ? '1 ano' : `${n} anos`);

  return (
    <div>
      <header className="section__header">
        <h2 className="section__title">Relacionamentos</h2>
        <p className="section__subtitle">
          As pessoas que caminham com você ao longo da vida.
        </p>
      </header>

      {/* Encontros: sistema adulto (18+), conforme a política de idade */}
      {personagem.idade >= IDADE_MINIMA_RELACIONAMENTO_ADULTO && (
        <section className="section">
          <button className="btn btn--primary" onClick={onOpenDatingModal}>
            Conhecer novas pessoas
          </button>
        </section>
      )}

      {parceiros.length > 0 && (
        <section className="section">
          <div>
            <h3 className="subsection__title">Vida a dois</h3>
            <div className="action-list">
              {parceiros.map(m => (
                <PessoaRow
                  key={m.id}
                  membro={m}
                  detalhe={`${idadeTexto(m.idade)}${m.profissao ? ` · ${m.profissao}` : ''}`}
                  onAbrir={abrirModal}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {filhos.length > 0 && (
        <section className="section">
          <div>
            <h3 className="subsection__title">Filhos</h3>
            <div className="action-list">
              {filhos.map(m => (
                <PessoaRow
                  key={m.id}
                  membro={m}
                  detalhe={idadeTexto(m.idade)}
                  onAbrir={abrirModal}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {paisEirmaos.length > 0 && (
        <section className="section">
          <div>
            <h3 className="subsection__title">Família de origem</h3>
            <div className="action-list">
              {paisEirmaos.map(m => (
                <PessoaRow
                  key={m.id}
                  membro={m}
                  detalhe={`${idadeTexto(m.idade)}${m.profissao ? ` · ${m.profissao}` : ''}`}
                  onAbrir={abrirModal}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {pets.length > 0 && (
        <section className="section">
          <div>
            <h3 className="subsection__title">Animais de estimação</h3>
            <div className="action-list">
              {pets.map(m => (
                <PessoaRow
                  key={m.id}
                  membro={m}
                  detalhe={idadeTexto(m.idade)}
                  onAbrir={abrirModal}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {falecidos.length > 0 && (
        <section className="section">
          <div>
            <h3 className="subsection__title">Em memória</h3>
            <ul className="action-list">
              {falecidos.map(m => (
                <li key={m.id} className="action-row relationship--falecido">
                  <span className="action-row__body">
                    <span className="action-row__title">
                      {m.nome} {m.sobrenome}
                    </span>
                    <span className="action-row__detail">
                      {apresentarRelacionamento(m).relacao} · faleceu aos{' '}
                      {idadeTexto(m.idade)} em {m.anoMorte}
                      {m.causaMorte ? ` · ${m.causaMorte}` : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {selectedMember && (
        <FamilyModal
          membro={selectedMember}
          onClose={() => setSelectedMember(null)}
          onInteragir={(tipo, pres) => onInteragir(selectedMember.id, tipo, pres)}
          onPedirCasamento={() => onPedirCasamento(selectedMember.id)}
          onTerFilho={() => onTerFilho(selectedMember.id)}
          onTerminar={() => onTerminar(selectedMember.id)}
          idadeJogador={personagem.idade}
          verificarInteracao={verificarInteracao}
        />
      )}
    </div>
  );
};
