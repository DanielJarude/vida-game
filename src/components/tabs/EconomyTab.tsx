import React, { useState } from 'react';
import { OPCOES_INVESTIMENTO } from '../../data/assetsData';
import { AssetShopModal } from '../modals/AssetShopModal';
import { Character, EconomyState } from '../../types';
import { calcularPatrimonioLiquido } from '../../systems/economySystem';
import { formatarDinheiro } from '../../utils/formatters';
import {
  ContextoAcao,
  getActionAvailability,
  IDADE_MINIMA_COMPRA_BENS
} from '../../systems/availabilitySystem';
import {
  Building,
  Car,
  TrendingUp,
  ShoppingBag,
  Ticket
} from 'lucide-react';

interface EconomyTabProps {
  personagem: Character;
  economia: EconomyState;
  ctx: ContextoAcao;
  onComprarBem: (itemId: string) => void;
  onVenderBem: (propId: string) => void;
  onInvestir: (tipoId: 'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto', valor: number) => void;
  onResgatarInvestimento: (tipoId: string, valor: number) => void;
  onJogarLoteria: () => void;
}

export const EconomyTab: React.FC<EconomyTabProps> = ({
  personagem,
  economia,
  ctx,
  onComprarBem,
  onVenderBem,
  onInvestir,
  onResgatarInvestimento,
  onJogarLoteria
}) => {
  const [showShopModal, setShowShopModal] = useState(false);
  const [selectedInvTipo, setSelectedInvTipo] = useState<'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto'>('tesouro_selic');
  const [investValor, setInvestValor] = useState<string>('1000');

  const idade = personagem.idade;
  const patrimonioTotal = calcularPatrimonioLiquido(economia);
  const imoveis = economia.propriedades.filter(p => p.tipo === 'imovel');
  const veiculos = economia.propriedades.filter(p => p.tipo === 'veiculo');

  const mostrarCompras = idade >= IDADE_MINIMA_COMPRA_BENS - 1;
  const dispLoteria = getActionAvailability(ctx, 'jogar_loteria');
  const podeLoteria = dispLoteria.kind === 'disponivel';
  const motivoLoteria = dispLoteria.kind === 'bloqueado' ? dispLoteria.motivo : undefined;

  const handleAplicar = () => {
    const val = parseFloat(investValor);
    if (!isNaN(val) && val > 0) {
      onInvestir(selectedInvTipo, val);
    }
  };

  const renderBotaoVender = (propId: string) => {
    const disp = getActionAvailability(ctx, 'vender_bem', { propId });
    const pode = disp.kind === 'disponivel';
    const motivo = disp.kind === 'bloqueado' ? disp.motivo : undefined;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        <button
          onClick={() => onVenderBem(propId)}
          disabled={!pode}
          className={pode ? 'btn-acao-perigo' : 'btn-acao-desabilitada'}
        >
          Vender
        </button>
        {motivo && <span className="acao-bloqueada-motivo">{motivo}</span>}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Resumo Financeiro Geral */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #111827 0%, #1e293b 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Saldo em Conta Corrente</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              {formatarDinheiro(economia.dinheiro)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Patrimônio Líquido Total</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
              {formatarDinheiro(patrimonioTotal)}
            </div>
          </div>
        </div>

        {/* Botões de compra e loteria (política central) */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          {mostrarCompras && (
            <button
              onClick={() => setShowShopModal(true)}
              disabled={idade < IDADE_MINIMA_COMPRA_BENS}
              className={idade >= IDADE_MINIMA_COMPRA_BENS ? 'btn-acao-primaria' : 'btn-acao-desabilitada'}
              style={{ flex: '1 1 200px' }}
              title={idade < IDADE_MINIMA_COMPRA_BENS ? 'Compras de imóveis e veículos abrem aos 18 anos' : undefined}
            >
              <ShoppingBag size={18} />
              <span>{idade >= IDADE_MINIMA_COMPRA_BENS ? 'Comprar Imóveis & Carros' : 'Compras aos 18 anos'}</span>
            </button>
          )}

          {idade >= 18 && (
            <button
              onClick={onJogarLoteria}
              disabled={!podeLoteria}
              className={podeLoteria ? 'btn-acao-loteria' : 'btn-acao-desabilitada'}
              style={{ flex: '1 1 200px' }}
              title={motivoLoteria}
            >
              <Ticket size={18} />
              <span>Apostar na Mega-Sena (R$ 15)</span>
            </button>
          )}
        </div>
        {idade >= 18 && motivoLoteria && (
          <div className="acao-bloqueada-motivo" style={{ marginTop: '8px' }}>{motivoLoteria}</div>
        )}
      </div>

      {/* Investimentos do Mercado Financeiro */}
      <div className="card">
        <h3 className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--primary)" />
            Investimentos & Rendimentos
          </span>
        </h3>

        {/* Investimentos Ativos */}
        {economia.investimentos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {economia.investimentos.map(inv => (
              <div
                key={inv.id}
                style={{
                  background: 'var(--bg-card-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{inv.nome}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Rendimento estimado: {(inv.rendimentoMedioAnual * 100).toFixed(1)}% ao ano
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {formatarDinheiro(inv.saldo)}
                  </div>
                </div>

                <button
                  onClick={() => onResgatarInvestimento(inv.tipo, inv.saldo)}
                  className="btn-acao-secundaria"
                >
                  Resgatar Tudo
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Você não possui investimentos ativos no momento. Aplique seu saldo para render juros compostos.
          </div>
        )}

        {/* Formulário de Aplicação */}
        {idade >= 18 && (
          <div style={{ background: 'var(--bg-card-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
              Fazer Nova Aplicação Financeira:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                value={selectedInvTipo}
                onChange={e => setSelectedInvTipo(e.target.value as typeof selectedInvTipo)}
                aria-label="Tipo de investimento"
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  color: '#fff'
                }}
              >
                {OPCOES_INVESTIMENTO.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.nome} ({op.riscoDesc})
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Valor em R$"
                  value={investValor}
                  onChange={e => setInvestValor(e.target.value)}
                  aria-label="Valor a aplicar"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)'
                  }}
                />
                <button onClick={handleAplicar} className="btn-acao-primaria">
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Imóveis Próprios */}
      {imoveis.length > 0 && (
        <div className="card">
          <h3 className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={20} color="var(--accent-blue)" />
              Imóveis Próprios ({imoveis.length})
            </span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {imoveis.map(prop => (
              <div
                key={prop.id}
                style={{
                  background: 'var(--bg-card-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{prop.nome}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Comprado em {prop.anoCompra} • Manutenção: {formatarDinheiro(prop.custoAnualManutencao)}/ano
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                    Valor de Mercado: {formatarDinheiro(prop.valorAtual)}
                  </div>
                </div>
                {renderBotaoVender(prop.id)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Veículos Próprios */}
      {veiculos.length > 0 && (
        <div className="card">
          <h3 className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Car size={20} color="var(--accent-amber)" />
              Garagem & Veículos ({veiculos.length})
            </span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {veiculos.map(vec => (
              <div
                key={vec.id}
                style={{
                  background: 'var(--bg-card-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{vec.nome}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    IPVA/Manutenção: {formatarDinheiro(vec.custoAnualManutencao)}/ano
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                    Valor Atual: {formatarDinheiro(vec.valorAtual)}
                  </div>
                </div>
                {renderBotaoVender(vec.id)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Compras */}
      {showShopModal && (
        <AssetShopModal
          saldoDisponivel={economia.dinheiro}
          onClose={() => setShowShopModal(false)}
          onComprar={onComprarBem}
        />
      )}
    </div>
  );
};
