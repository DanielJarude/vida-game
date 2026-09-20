import React from 'react';
import { Baby, PersonStanding, User, UserRound, PawPrint } from 'lucide-react';
import type { RelationType } from '../../types';
import {
  obterCategoriaAvatar,
  obterRotuloAvatar,
  CategoriaAvatar
} from '../../presentation/avatarPresentation';

interface PersonAvatarProps {
  nome: string;
  idade: number;
  tipo?: RelationType;
  /** Tamanho do avatar em pixels (largura = altura). */
  tamanho?: number;
}

const ICONE_POR_CATEGORIA: Record<CategoriaAvatar, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  bebe: Baby,
  crianca: PersonStanding,
  adolescente: UserRound,
  adulto: User,
  idoso: UserRound,
  pet: PawPrint
};

/**
 * Avatar da pessoa — símbolo consistente com a fase da vida, não uma foto.
 *
 * Continua a decisão do B4: nenhum rosto gerado, nenhuma imagem externa,
 * nenhuma dependência de API de imagem. A diferença para a versão anterior
 * (só iniciais) é que agora existe uma forma reconhecível — bebê, criança,
 * adolescente, adulto, pessoa idosa ou pet — sobre a mesma composição de
 * gradiente e textura já usada na identidade.
 *
 * O ícone é sempre decorativo (`aria-hidden`); o significado acessível vem
 * do `aria-label` no contêiner, lido por leitor de tela.
 */
export const PersonAvatar: React.FC<PersonAvatarProps> = ({
  nome,
  idade,
  tipo,
  tamanho = 84
}) => {
  const categoria = obterCategoriaAvatar(idade, tipo);
  const Icone = ICONE_POR_CATEGORIA[categoria];
  const rotulo = obterRotuloAvatar(nome, categoria);

  return (
    <div
      className="person-avatar"
      style={{ width: tamanho, height: tamanho }}
      role="img"
      aria-label={rotulo}
      data-categoria={categoria}
    >
      <Icone size={Math.round(tamanho * 0.5)} strokeWidth={1.75} aria-hidden="true" />
    </div>
  );
};
