import React from 'react';
import { MapPin, GraduationCap, Briefcase, HeartPulse, Users } from 'lucide-react';
import type {
  CareerState,
  Character,
  EconomyState,
  EducationState,
  FamilyMember
} from '../../types';
import {
  formatarDinheiro,
  getEducationLabel,
  getSocialClassLabel
} from '../../utils/formatters';
import {
  obterPerfilDeFase,
  deveMostrarSaldoNaIdentidade
} from '../../presentation/lifeStagePresentation';

interface CharacterIdentityProps {
  personagem: Character;
  educacao: EducationState;
  carreira: CareerState;
  familia: FamilyMember[];
  economia: EconomyState;
  /** Situação atual descrita pela política central (coerente com a fase). */
  situacao: string;
}

/**
 * Apresentação da pessoa — não é uma "ficha".
 *
 * Hierarquia: retrato → nome → IDADE (peso máximo) → fatos secundários.
 * Cada fato só aparece quando é relevante na fase; nada é exibido com o
 * mesmo peso de tudo o mais.
 *
 * O retrato não usa foto: presença vem de composição, iniciais e textura.
 * Não há geração de rosto, banco de imagens nem dependência externa.
 */
export const CharacterIdentity: React.FC<CharacterIdentityProps> = ({
  personagem,
  educacao,
  carreira,
  familia,
  economia,
  situacao
}) => {
  const perfil = obterPerfilDeFase(personagem.idade);
  const iniciais = `${personagem.nome.charAt(0)}${personagem.sobrenome.charAt(0)}`.toUpperCase();

  const unidadeIdade = personagem.idade === 1 ? 'ano' : 'anos';

  // Escolaridade só interessa quando já existe alguma trajetória escolar.
  const mostrarEscolaridade =
    educacao.nivelAtual !== 'nenhuma' || educacao.emCurso;

  // Ocupação só quando há vínculo real; nunca inventar "desempregado" p/ bebê.
  const mostrarOcupacao = carreira.empregado || carreira.aposentado;

  const doencas = personagem.doencas;

  // Convivência: quem realmente está vivo ao redor da pessoa.
  const vivos = familia.filter(m => m.vivo).length;

  // Saldo junto da identidade quando o dinheiro já significa algo nesta
  // fase — decisão da camada de apresentação, não deste componente.
  const temPatrimonio =
    economia.propriedades.length > 0 || economia.investimentos.length > 0;
  const mostrarSaldo = deveMostrarSaldoNaIdentidade(
    personagem.idade,
    temPatrimonio
  );

  return (
    <section className="identity" aria-label="Quem é você">
      <div className="identity__portrait" aria-hidden="true">
        <span className="identity__initials">{iniciais}</span>
      </div>

      <div>
        <h1 className="identity__name">
          {personagem.nome} {personagem.sobrenome}
        </h1>

        <p className="identity__age">
          <span className="identity__age-number">{personagem.idade}</span>
          <span className="identity__age-unit">
            {unidadeIdade} · {perfil.rotulo}
          </span>
        </p>

        {/* Saldo pessoal na mesma linha de leitura da identidade: fácil de
            achar, sem virar um painel financeiro. */}
        {mostrarSaldo && (
          <p className="identity__balance">
            <span className="identity__balance-label">Saldo</span>
            <span
              className={`identity__balance-value${
                economia.dinheiro < 0 ? ' identity__balance-value--negativo' : ''
              }`}
            >
              {formatarDinheiro(economia.dinheiro)}
            </span>
          </p>
        )}

        <div className="identity__facts">
          <p className="identity__fact">
            <MapPin size={14} aria-hidden="true" />
            <span className="identity__fact-value">
              {personagem.cidade}, {personagem.estado}
            </span>
          </p>

          <p className="identity__fact">
            <Users size={14} aria-hidden="true" />
            <span className="identity__fact-value">
              {situacao}
            </span>
          </p>

          {mostrarEscolaridade && (
            <p className="identity__fact">
              <GraduationCap size={14} aria-hidden="true" />
              <span className="identity__fact-value">
                {educacao.emCurso && educacao.nomeCurso
                  ? educacao.nomeCurso
                  : getEducationLabel(educacao.nivelAtual)}
              </span>
            </p>
          )}

          {mostrarOcupacao && (
            <p className="identity__fact">
              <Briefcase size={14} aria-hidden="true" />
              <span className="identity__fact-value">
                {carreira.aposentado
                  ? 'Aposentado(a)'
                  : carreira.cargoAtual?.titulo}
              </span>
            </p>
          )}

          {doencas.length > 0 && (
            <p className="identity__fact identity__fact--alerta">
              <HeartPulse size={14} aria-hidden="true" />
              <span className="identity__fact-value">{doencas.join(', ')}</span>
            </p>
          )}
        </div>

        {/*
          Camada poética: discreta, derivada do estado real (origem social e
          convivência), nunca frase motivacional genérica. Aparece só quando
          há algo verdadeiro a dizer.
        */}
        {vivos > 0 && (
          <p className="identity__quote poetic-note">
            {getSocialClassLabel(personagem.classeSocial)} ·{' '}
            {vivos === 1 ? '1 pessoa por perto' : `${vivos} pessoas por perto`}
          </p>
        )}
      </div>
    </section>
  );
};
