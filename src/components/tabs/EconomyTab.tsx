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
import { Lock } from 'lucide-react';

interface EconomyTabProps {
  personagem: Character;
  economia: EconomyState;
  ctx: ContextoAcao;
  onComprarBem: (itemId: string) => void;
  onVenderBem: (propId: string) => void;
  onInvestir: (
    tipoId: 'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto',
    valor: number
  ) => void;
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
  const [selectedInvTipo, setSelectedInvTipo] = useState<
    'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto'
  >('tesouro_selic');
  const [investValor, setInvestValor] = useState<string>('1000');

  const idade = personagem.idade;
  const patrimonioTotal = calcularPatrimonioLiquido(economia);
  const imoveis = economia.propriedades.filter(p => p.tipo === 'imovel');
  const veiculos = economia.propriedades.filter(p => p.tipo === 'veiculo');

  const mostrarCompras = idade >= IDADE_MINIMA_COMPRA_BENS - 1;
  const podeComprar = idade >= IDADE_MINIMA_COMPRA_BENS;

  const dispLoteria = getActionAvailability(ctx, 'jogar_loteria');
  const podeLoteria = dispLoteria.kind === 'disponivel';
  const motivoLoteria =
    dispLoteria.kind === 'bloqueado' ? dispLoteria.motivo : undefined;
  const loteriaVisivel = dispLoteria.kind !== 'oculto';

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
      <div className="action-row__action">
        <button
          onClick={() => onVenderBem(propId)}
          disabled={!pode}
          className={`btn ${pode ? 'btn--danger' : 'btn--ghost'}`}
        >
          Vender
        </button>
        {motivo && (
          <p className="action-row__reason">
            <Lock size={12} aria-hidden="true" />
            {motivo}
          </p>
        )}
      </div>
    );
  };

  return (
    <div>
      <header className="section__header">
        <h2 className="section__title">Finanças</h2>
      </header>

      {/* Situação — valores reais do motor, nunca do mockup de referência */}
      <section className="section">
        <div>
          <p className="t-meta">Saldo em conta</p>
          <p className="finance-summary__balance">
            <span
              className={`finance-summary__amount${
                economia.dinheiro < 0 ? ' finance-summary__amount--negativo' : ''
              }`}
            >
              {formatarDinheiro(economia.dinheiro)}
            </span>
          </p>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <div className="data-row">
              <span className="data-row__label">Patrimônio líquido</span>
              <span className="data-row__value">
                {formatarDinheiro(patrimonioTotal)}
              </span>
            </div>
            <div className="data-row">
              <span className="data-row__label">Despesas anuais</span>
              <span className="data-row__value data-row__value--negativo">
                {formatarDinheiro(economia.despesasAnuaisPadrao)}
              </span>
            </div>
            {economia.dividas > 0 && (
              <div className="data-row">
                <span className="data-row__label">Dívidas</span>
                <span className="data-row__value data-row__value--negativo">
                  {formatarDinheiro(economia.dividas)}
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-5)',
              flexWrap: 'wrap'
            }}
          >
            {mostrarCompras && (
              <button
                onClick={() => setShowShopModal(true)}
                disabled={!podeComprar}
                className={`btn ${podeComprar ? 'btn--primary' : 'btn--ghost'}`}
              >
                {podeComprar ? 'Imóveis e veículos' : 'Compras a partir dos 18 anos'}
              </button>
            )}

            {loteriaVisivel && (
              <button
                onClick={onJogarLoteria}
                disabled={!podeLoteria}
                className={`btn ${podeLoteria ? 'btn--secondary' : 'btn--ghost'}`}
              >
                Apostar na Mega-Sena
              </button>
            )}
          </div>

          {loteriaVisivel && motivoLoteria && (
            <p className="action-row__reason">
              <Lock size={12} aria-hidden="true" />
              {motivoLoteria}
            </p>
          )}
        </div>
      </section>

      {/* Investimentos */}
      <section className="section">
        <div>
          <h3 className="subsection__title">Investimentos</h3>

          {economia.investimentos.length > 0 ? (
            <div className="action-list">
              {economia.investimentos.map(inv => (
                <div key={inv.id} className="action-row">
                  <div className="action-row__body">
                    <p className="action-row__title">{inv.nome}</p>
                    <p className="action-row__detail">
                      {formatarDinheiro(inv.saldo)} ·{' '}
                      {(inv.rendimentoMedioAnual * 100).toFixed(1)}% ao ano
                    </p>
                  </div>
                  <div className="action-row__action">
                    <button
                      onClick={() => onResgatarInvestimento(inv.tipo, inv.saldo)}
                      className="btn btn--secondary"
                    >
                      Resgatar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              Você ainda não tem investimentos.
            </p>
          )}

          {idade >= 18 && (
            <div style={{ marginTop: 'var(--space-5)' }}>
              <div className="field">
                <label className="field__label" htmlFor="tipo-investimento">
                  Nova aplicação
                </label>
                <select
                  id="tipo-investimento"
                  className="field__control"
                  value={selectedInvTipo}
                  onChange={e =>
                    setSelectedInvTipo(e.target.value as typeof selectedInvTipo)
                  }
                >
                  {OPCOES_INVESTIMENTO.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.nome} ({op.riscoDesc})
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-3)'
                }}
              >
                <input
                  type="number"
                  className="field__control"
                  placeholder="Valor em R$"
                  value={investValor}
                  onChange={e => setInvestValor(e.target.value)}
                  aria-label="Valor a aplicar"
                  style={{ flex: 1 }}
                />
                <button onClick={handleAplicar} className="btn btn--primary">
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {imoveis.length > 0 && (
        <section className="section">
          <div>
            <h3 className="subsection__title">Imóveis</h3>
            <div className="action-list">
              {imoveis.map(prop => (
                <div key={prop.id} className="action-row">
                  <div className="action-row__body">
                    <p className="action-row__title">{prop.nome}</p>
                    <p className="action-row__detail">
                      {formatarDinheiro(prop.valorAtual)} · comprado em{' '}
                      {prop.anoCompra} · manutenção{' '}
                      {formatarDinheiro(prop.custoAnualManutencao)}/ano
                    </p>
                  </div>
                  {renderBotaoVender(prop.id)}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {veiculos.length > 0 && (
        <section className="section">
          <div>
            <h3 className="subsection__title">Veículos</h3>
            <div className="action-list">
              {veiculos.map(vec => (
                <div key={vec.id} className="action-row">
                  <div className="action-row__body">
                    <p className="action-row__title">{vec.nome}</p>
                    <p className="action-row__detail">
                      {formatarDinheiro(vec.valorAtual)} · IPVA e manutenção{' '}
                      {formatarDinheiro(vec.custoAnualManutencao)}/ano
                    </p>
                  </div>
                  {renderBotaoVender(vec.id)}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
