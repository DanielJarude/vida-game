import React, { useState } from 'react';
import { Gender } from '../../types';
import { CIDADES_BRASILEIRAS, sortearNome, sortearSobrenome } from '../../data/brazilianData';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';

interface CharacterCreationScreenProps {
  onCriarVida: (nome: string, sobrenome: string, genero: Gender, cidade: string, estado: string) => void;
  onVoltar: () => void;
}

export const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({
  onCriarVida,
  onVoltar
}) => {
  const [genero, setGenero] = useState<Gender>('masculino');
  const [nome, setNome] = useState<string>(() => sortearNome('masculino'));
  const [sobrenome, setSobrenome] = useState<string>(() => sortearSobrenome());
  const [cidadeIndex, setCidadeIndex] = useState<number>(0);

  const handleSortearTudo = () => {
    const novoNome = sortearNome(genero);
    const novoSobrenome = sortearSobrenome();
    const novaCidade = Math.floor(Math.random() * CIDADES_BRASILEIRAS.length);
    setNome(novoNome);
    setSobrenome(novoSobrenome);
    setCidadeIndex(novaCidade);
  };

  const handleTrocaGenero = (novoGen: Gender) => {
    setGenero(novoGen);
    setNome(sortearNome(novoGen));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !sobrenome.trim()) return;
    const cidadeSel = CIDADES_BRASILEIRAS[cidadeIndex];
    onCriarVida(nome.trim(), sobrenome.trim(), genero, cidadeSel.cidade, cidadeSel.estado);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'radial-gradient(circle at top center, #13273e 0%, #090d16 80%)'
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onVoltar} className="btn-icon">
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800 }}>
            Criar Personagem
          </h2>
          <button onClick={handleSortearTudo} className="btn-icon" title="Sortear Tudo">
            <Sparkles size={18} color="var(--accent-amber)" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Escolha do Gênero */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Gênero:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {(['masculino', 'feminino', 'nao-binario'] as Gender[]).map(g => (
                <button
                  type="button"
                  key={g}
                  onClick={() => handleTrocaGenero(g)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 'var(--radius-sm)',
                    background: genero === g ? 'var(--primary)' : 'var(--bg-card-subtle)',
                    color: genero === g ? '#022c22' : 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textTransform: 'capitalize'
                  }}
                >
                  {g === 'nao-binario' ? 'Não-Binário' : g}
                </button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Primeiro Nome:
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-light)',
                fontSize: '1rem',
                fontWeight: 600
              }}
            />
          </div>

          {/* Sobrenome */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Sobrenome de Família:
            </label>
            <input
              type="text"
              required
              value={sobrenome}
              onChange={e => setSobrenome(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-light)',
                fontSize: '1rem',
                fontWeight: 600
              }}
            />
          </div>

          {/* Cidade e Estado */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Cidade e Estado de Nascimento:
            </label>
            <select
              value={cidadeIndex}
              onChange={e => setCidadeIndex(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-light)',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#fff'
              }}
            >
              {CIDADES_BRASILEIRAS.map((c, idx) => (
                <option key={idx} value={idx}>
                  {c.cidade}, {c.estado} ({c.regiao})
                </option>
              ))}
            </select>
          </div>

          {/* Botão de Criação */}
          <button
            type="submit"
            style={{
              marginTop: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#022c22',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 800,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Check size={20} strokeWidth={3} />
            <span>NASCER & COMEÇAR VIDA</span>
          </button>
        </form>
      </div>
    </div>
  );
};
