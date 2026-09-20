import React, { useMemo, useState } from 'react';
import { valorAleatorio } from '../../utils/random';
import { AvatarAppearance, Gender } from '../../types';
import { sortearNome, sortearSobrenome } from '../../data/brazilianData';
import { listarEstados, listarCidadesPorEstado } from '../../data/locations';
import { criarAvatarPadrao, sortearAvatar } from '../../systems/avatarSystem';
import { AvatarPicker } from '../avatar/AvatarPicker';
import { ArrowLeft, Shuffle } from 'lucide-react';

interface CharacterCreationScreenProps {
  onCriarVida: (
    nome: string,
    sobrenome: string,
    genero: Gender,
    cidade: string,
    estado: string,
    avatar: AvatarAppearance
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
  const estados = useMemo(() => listarEstados(), []);

  const [genero, setGenero] = useState<Gender>('masculino');
  const [nome, setNome] = useState<string>(() => sortearNome('masculino'));
  const [sobrenome, setSobrenome] = useState<string>(() => sortearSobrenome());
  const [estado, setEstado] = useState<string>(() => estados[0].sigla);
  const [cidade, setCidade] = useState<string>(
    () => listarCidadesPorEstado(estados[0].sigla)[0].cidade
  );
  const [avatar, setAvatar] = useState<AvatarAppearance>(criarAvatarPadrao);

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
    setAvatar(sortearAvatar());
  };

  const handleTrocaGenero = (novoGen: Gender) => {
    setGenero(novoGen);
    setNome(sortearNome(novoGen));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !sobrenome.trim()) return;
    // Exatamente o que está na tela — sem nenhuma randomização posterior.
    onCriarVida(nome.trim(), sobrenome.trim(), genero, cidade, estado, avatar);
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
          <section className="creation-section">
            <h2 className="creation-section__title">Identidade</h2>

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
          </section>

          <section className="creation-section">
            <h2 className="creation-section__title">Aparência</h2>
            <AvatarPicker avatar={avatar} onChange={setAvatar} />
          </section>

          <section className="creation-section">
            <h2 className="creation-section__title">Nascimento</h2>

            <div className="creation-grid">
              <div className="field">
                <label className="field__label" htmlFor="campo-estado">
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
                      {uf.nome} ({uf.sigla})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="campo-cidade">
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
          </section>

          <button type="submit" className="btn btn--hero">
            Começar a viver
          </button>
        </form>
      </div>
    </div>
  );
};
