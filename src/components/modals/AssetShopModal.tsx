import React, { useState } from 'react';
import { IMOVEIS_LOJA, VEICULOS_LOJA } from '../../data/assetsData';
import { formatarDinheiro } from '../../utils/formatters';
import { useModalBehavior } from '../common/useModalBehavior';
import { X } from 'lucide-react';

interface AssetShopModalProps {
  saldoDisponivel: number;
  onClose: () => void;
  onComprar: (itemId: string) => void;
}

export const AssetShopModal: React.FC<AssetShopModalProps> = ({
  saldoDisponivel,
  onClose,
  onComprar
}) => {
  const containerRef = useModalBehavior<HTMLDivElement>({ onClose });
  const [tab, setTab] = useState<'imoveis' | 'veiculos'>('imoveis');
  const itens = tab === 'imoveis' ? IMOVEIS_LOJA : VEICULOS_LOJA;

  const tituloId = 'loja-titulo';

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--space-4)'
          }}
        >
          <div>
            <h2 className="event-scene__title" id={tituloId} style={{ marginBottom: 'var(--space-1)' }}>
              Imóveis e veículos
            </h2>
            <p className="action-row__detail">
              Saldo disponível: {formatarDinheiro(saldoDisponivel)}
            </p>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="choice-group" style={{ marginTop: 'var(--space-4)' }}>
          <button
            className="choice-chip"
            aria-pressed={tab === 'imoveis'}
            onClick={() => setTab('imoveis')}
          >
            Imóveis
          </button>
          <button
            className="choice-chip"
            aria-pressed={tab === 'veiculos'}
            onClick={() => setTab('veiculos')}
          >
            Veículos
          </button>
        </div>

        <div className="event-scene__divider" role="presentation" />

        <div className="action-list">
          {itens.map(item => {
            const podeComprar = saldoDisponivel >= item.preco;
            return (
              <div key={item.id} className="action-row">
                <div className="action-row__body">
                  <p className="action-row__title">{item.nome}</p>
                  <p className="action-row__detail">{item.descricao}</p>
                  <p className="action-row__detail">
                    {formatarDinheiro(item.preco)} · manutenção{' '}
                    {formatarDinheiro(item.custoAnualManutencao)}/ano
                  </p>
                </div>
                <div className="action-row__action">
                  <button
                    disabled={!podeComprar}
                    onClick={() => {
                      onComprar(item.id);
                      onClose();
                    }}
                    className={`btn ${podeComprar ? 'btn--primary' : 'btn--ghost'}`}
                  >
                    {podeComprar ? 'Comprar' : 'Sem saldo'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
