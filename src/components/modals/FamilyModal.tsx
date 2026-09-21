import React, { useState } from 'react';
import { FamilyInteractionType, FamilyMember } from '../../types';
import { Disponibilidade } from '../../systems/availabilitySystem';
import { apresentarRelacionamento } from '../../presentation/relationshipPresentation';
import {
  rotularInteracao,
  rotularInteracaoPet,
  ordenarInteracoesPorFase,
  ordenarInteracoesComPet
} from '../../presentation/interactionPresentation';
import { useModalBehavior } from '../common/useModalBehavior';
import { X, Lock } from 'lucide-react';

interface FamilyModalProps {
  membro: FamilyMember;
  onClose: () => void;
  onInteragir: (
    tipo: FamilyInteractionType,
    presenteTipo?: 'barato' | 'medio' | 'luxo'
  ) => void;
  onPedirCasamento?: () => void;
  onTerFilho?: () => void;
  onTerminar?: () => void;
  idadeJogador: number;
  verificarInteracao: (tipo: FamilyInteractionType) => Disponibilidade;
}

const PRESENTES = [
  { tipo: 'barato' as const, titulo: 'Lembrança simples', valor: 'R$ 50' },
  { tipo: 'medio' as const, titulo: 'Presente especial', valor: 'R$ 250' },
  { tipo: 'luxo' as const, titulo: 'Presente de luxo', valor: 'R$ 1.200' }
];

/**
 * Interações com uma pessoa.
 *
 * A pessoa vem primeiro (quem é, que relação, em que contexto); as ações
 * vêm depois, como linhas — não como cartões independentes.
 *
 * O componente **não decide** o que é permitido: toda linha passa por
 * `verificarInteracao`, que consulta a política central. Rótulos vêm da
 * camada de apresentação e mudam com a idade.
 */
export const FamilyModal: React.FC<FamilyModalProps> = ({
  membro,
  onClose,
  onInteragir,
  onPedirCasamento,
  onTerFilho,
  onTerminar,
  idadeJogador,
  verificarInteracao
}) => {
  const containerRef = useModalBehavior<HTMLDivElement>({ onClose });
  const [showPresenteMenu, setShowPresenteMenu] = useState(false);

  const isParceiro = [
    'namorado',
    'namorada',
    'noivo',
    'noiva',
    'esposo',
    'esposa'
  ].includes(membro.tipo);
  const isCasado = ['esposo', 'esposa'].includes(membro.tipo);
  const ehPet = membro.tipo === 'pet';

  const pessoa = apresentarRelacionamento(membro);
  const tituloId = 'familia-modal-titulo';

  /** Linha de interação; motivo de bloqueio sempre em texto. */
  const Acao: React.FC<{
    tipo: FamilyInteractionType;
    titulo: string;
    descricao: string;
    onClick?: () => void;
  }> = ({ tipo, titulo, descricao, onClick }) => {
    const disp = verificarInteracao(tipo);
    if (disp.kind === 'oculto') return null;

    const desabilitado = disp.kind !== 'disponivel';
    const motivo = disp.kind === 'bloqueado' ? disp.motivo : undefined;

    return (
      <button
        className="event-choice"
        onClick={() => {
          if (desabilitado) return;
          if (onClick) {
            onClick();
            return;
          }
          onInteragir(tipo);
          onClose();
        }}
        disabled={desabilitado}
      >
        <span className="event-choice__indicator" aria-hidden="true" />
        <span className="event-choice__body">
          <span className="event-choice__title">{titulo}</span>
          <span className="event-choice__hint">{descricao}</span>
          {motivo && (
            <span className="event-choice__reason">
              <Lock size={12} aria-hidden="true" />
              {motivo}
            </span>
          )}
        </span>
      </button>
    );
  };

  /** Linha livre (casamento, filho, término) — já filtrada pelo chamador. */
  const AcaoLivre: React.FC<{
    titulo: string;
    descricao: string;
    onClick: () => void;
  }> = ({ titulo, descricao, onClick }) => (
    <button
      className="event-choice"
      onClick={() => {
        onClick();
        onClose();
      }}
    >
      <span className="event-choice__indicator" aria-hidden="true" />
      <span className="event-choice__body">
        <span className="event-choice__title">{titulo}</span>
        <span className="event-choice__hint">{descricao}</span>
      </span>
    </button>
  );

  /** Uma interação comum, com rótulo adequado à idade. */
  const renderInteracao = (tipo: FamilyInteractionType) => {
    // Pedir dinheiro só faz sentido com quem cria você.
    if (
      tipo === 'pedir_dinheiro' &&
      membro.tipo !== 'pai' &&
      membro.tipo !== 'mae'
    ) {
      return null;
    }

    const rotulo = ehPet
      ? rotularInteracaoPet(tipo)
      : rotularInteracao(tipo, idadeJogador);

    // O presente abre um submenu em vez de agir direto — mas continua
    // sujeito à mesma verificação de disponibilidade.
    if (tipo === 'dar_presente') {
      if (showPresenteMenu) return null;
      return (
        <Acao
          key={tipo}
          tipo={tipo}
          titulo={rotulo.titulo}
          descricao={rotulo.descricao}
          onClick={() => setShowPresenteMenu(true)}
        />
      );
    }

    return (
      <Acao
        key={tipo}
        tipo={tipo}
        titulo={rotulo.titulo}
        descricao={rotulo.descricao}
      />
    );
  };

  const ordem = ehPet
    ? ordenarInteracoesComPet()
    : ordenarInteracoesPorFase(idadeJogador);
  const dispPresente = verificarInteracao('dar_presente');

  return (
    <div className="modal-overlay">
      <div
        className="modal-surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        ref={containerRef}
        tabIndex={-1}
      >
        {/* A pessoa antes das ações: quem é, que relação, que contexto. */}
        <div className="person-head">
          <div className="person-head__main">
            <h2 className="person-head__name" id={tituloId}>
              {membro.nome} {membro.sobrenome}
            </h2>
            <p className="person-head__relation">{pessoa.relacao}</p>
            <p className="person-head__context">
              {membro.idade === 1 ? '1 ano' : `${membro.idade} anos`}
              {membro.profissao ? ` · ${membro.profissao}` : ''}
              {' · relação '}
              {pessoa.rotuloProximidade.toLowerCase()}
            </p>
          </div>

          <button onClick={onClose} className="icon-button" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="event-scene__divider" role="presentation" />

        <div className="event-choices">
          {showPresenteMenu && dispPresente.kind === 'disponivel' ? (
            <>
              {PRESENTES.map(p => (
                <button
                  key={p.tipo}
                  className="event-choice"
                  onClick={() => {
                    onInteragir('dar_presente', p.tipo);
                    onClose();
                  }}
                >
                  <span className="event-choice__indicator" aria-hidden="true" />
                  <span className="event-choice__body">
                    <span className="event-choice__title">{p.titulo}</span>
                    <span className="event-choice__hint">{p.valor}</span>
                  </span>
                </button>
              ))}
              <button
                className="event-choice event-choice--quiet"
                onClick={() => setShowPresenteMenu(false)}
              >
                <span className="event-choice__indicator" aria-hidden="true" />
                <span className="event-choice__body">
                  <span className="event-choice__title">Voltar</span>
                </span>
              </button>
            </>
          ) : (
            ordem.map(renderInteracao)
          )}

          {!showPresenteMenu && isParceiro && idadeJogador >= 18 && (
            <>
              {!isCasado && onPedirCasamento && (
                <AcaoLivre
                  titulo="Pedir em casamento"
                  descricao="Oficializar a relação"
                  onClick={onPedirCasamento}
                />
              )}
              {onTerFilho && (
                <AcaoLivre
                  titulo="Ter um filho"
                  descricao="Aumentar a família"
                  onClick={onTerFilho}
                />
              )}
              {onTerminar && (
                <AcaoLivre
                  titulo="Terminar o relacionamento"
                  descricao="Encerrar a relação"
                  onClick={onTerminar}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
