import React, { useMemo, useState } from 'react';
import { valorAleatorio } from '../../utils/random';
import { Gender } from '../../types';
import {
  listarEstadosDisponiveis,
  listarCidadesPorEstado,
  sortearNome,
  sortearSobrenome
} from '../../data/brazilianData';
import { ArrowLeft, Shuffle } from 'lucide-react';

interface CharacterCreationScreenProps {
  onCriarVida: (
    nome: string,
    sobrenome: string,
    genero: Gender,
    cidade: string,
    estado: string
  ) => void;
  onVoltar: () => void;
}

const ROTULO_GENERO: Record<Gender, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  'nao-binario': 'Não binário'
};

/**
 * Criação de uma nova vida.
 *
 * Tudo aqui é escolha do jogador. O sorteio existe como atalho explícito
 * ("Sortear tudo"), nunca como algo que acontece por baixo: o que estiver
 * selecionado na tela é exatamente o que o motor recebe.
 *
 * A localização é derivada dos dados (`brazilianData`), em dois passos —
 * estado, depois cidade — para continuar escalável conforme a lista cresce.
 */
export const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({
  onCriarVida,
  onVoltar
}) => {
  const estados = useMemo(() => listarEstadosDisponiveis(), []);

  const [genero, setGenero] = useState<Gender>('masculino');
  const [nome, setNome] = useState<string>(() => sortearNome('masculino'));
  const [sobrenome, setSobrenome] = useState<string>(() => sortearSobrenome());
  const [estado, setEstado] = useState<string>(() => estados[0].sigla);
  const [cidade, setCidade] = useState<string>(
    () => listarCidadesPorEstado(estados[0].sigla)[0].cidade
  );

  const cidadesDoEstado = useMemo(
    () => listarCidadesPorEstado(estado),
    [estado]
  );

  const handleTrocaEstado = (novoEstado: string) => {
    setEstado(novoEstado);
    // A cidade selecionada precisa pertencer ao novo estado.
    setCidade(listarCidadesPorEstado(novoEstado)[0].cidade);
  };

  const handleSortearTudo = () => {
    setNome(sortearNome(genero));
    setSobrenome(sortearSobrenome());

    const estadoSorteado =
      estados[Math.floor(valorAleatorio() * estados.length)].sigla;
    const cidades = listarCidadesPorEstado(estadoSorteado);

    setEstado(estadoSorteado);
    setCidade(cidades[Math.floor(valorAleatorio() * cidades.length)].cidade);
  };

  const handleTrocaGenero = (novoGen: Gender) => {
    setGenero(novoGen);
    setNome(sortearNome(novoGen));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !sobrenome.trim()) return;
    // Exatamente o que está na tela — sem nenhuma randomização posterior.
    onCriarVida(nome.trim(), sobrenome.trim(), genero, cidade, estado);
  };

  return (
    <div className="screen screen--scroll">
      <div className="screen__inner" style={{ paddingTop: 'var(--space-8)' }}>
        <div className="screen__topbar">
          <button onClick={onVoltar} className="icon-button" aria-label="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="section__title">Quem você vai ser</h1>
          <button
            onClick={handleSortearTudo}
            className="icon-button"
            aria-label="Sortear tudo"
            title="Sortear tudo"
          >
            <Shuffle size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="creation-form">
          <div className="field">
            <span className="field__label" id="label-genero">
              Gênero
            </span>
            <div className="choice-group" role="group" aria-labelledby="label-genero">
              {(['masculino', 'feminino', 'nao-binario'] as Gender[]).map(g => (
                <button
                  type="button"
                  key={g}
                  className="choice-chip"
                  aria-pressed={genero === g}
                  onClick={() => handleTrocaGenero(g)}
                >
                  {ROTULO_GENERO[g]}
                </button>
              ))}
            </div>
          </div>

          <div className="creation-grid">
            <div className="field">
              <label className="field__label" htmlFor="campo-nome">
                Nome
              </label>
              <input
                id="campo-nome"
                className="field__control"
                value={nome}
                onChange={e => setNome(e.target.value)}
                maxLength={20}
                required
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="campo-sobrenome">
                Sobrenome
              </label>
              <input
                id="campo-sobrenome"
                className="field__control"
                value={sobrenome}
                onChange={e => setSobrenome(e.target.value)}
                maxLength={20}
                required
              />
            </div>
          </div>

          <div className="field">
            <span className="field__label">Onde você nasce</span>
            <div className="creation-grid">
              <div className="field field--nested">
                <label className="field__sublabel" htmlFor="campo-estado">
                  Estado
                </label>
                <select
                  id="campo-estado"
                  className="field__control"
                  value={estado}
                  onChange={e => handleTrocaEstado(e.target.value)}
                >
                  {estados.map(uf => (
                    <option key={uf.sigla} value={uf.sigla}>
                      {uf.sigla} · {uf.regiao}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field field--nested">
                <label className="field__sublabel" htmlFor="campo-cidade">
                  Cidade
                </label>
                <select
                  id="campo-cidade"
                  className="field__control"
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                >
                  {cidadesDoEstado.map(c => (
                    <option key={c.cidade} value={c.cidade}>
                      {c.cidade}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="field__note">
              Sua vida começa exatamente onde você escolher.
            </p>
          </div>

          <button type="submit" className="btn btn--hero">
            Começar a viver
          </button>
        </form>
      </div>
    </div>
  );
};
