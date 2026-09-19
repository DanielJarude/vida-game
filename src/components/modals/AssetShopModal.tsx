import React, { useState } from 'react';
import { IMOVEIS_LOJA, VEICULOS_LOJA } from '../../data/assetsData';
import { formatarDinheiro } from '../../utils/formatters';
import { X, Home, Car } from 'lucide-react';

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
  const [tab, setTab] = useState<'imoveis' | 'veiculos'>('imoveis');
  const itens = tab === 'imoveis' ? IMOVEIS_LOJA : VEICULOS_LOJA;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="modal-title">Concessionária & Imobiliária</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Saldo em Conta: <strong style={{ color: 'var(--accent-amber)' }}>{formatarDinheiro(saldoDisponivel)}</strong>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`tab-btn ${tab === 'imoveis' ? 'active' : ''}`}
            onClick={() => setTab('imoveis')}
          >
            <Home size={16} />
            <span>Imóveis Residenciais</span>
          </button>
          <button
            className={`tab-btn ${tab === 'veiculos' ? 'active' : ''}`}
            onClick={() => setTab('veiculos')}
          >
            <Car size={16} />
            <span>Carros & Motos</span>
          </button>
        </div>

        {/* Lista de Bens */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto' }}>
          {itens.map(item => {
            const podeComprar = saldoDisponivel >= item.preco;
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {item.nome}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {item.descricao}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Manutenção/IPTU/IPVA anual: {formatarDinheiro(item.custoAnualManutencao)}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--accent-amber)', marginTop: '4px' }}>
                    {formatarDinheiro(item.preco)}
                  </div>
                </div>

                <button
                  disabled={!podeComprar}
                  onClick={() => {
                    onComprar(item.id);
                    onClose();
                  }}
                  style={{
                    background: podeComprar ? 'var(--primary)' : 'var(--bg-card-hover)',
                    color: podeComprar ? '#022c22' : 'var(--text-muted)',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: podeComprar ? 'pointer' : 'not-allowed'
                  }}
                >
                  {podeComprar ? 'Comprar à Vista' : 'Sem Saldo'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
