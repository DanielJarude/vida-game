import React from 'react';
import { Baby, PersonStanding, User, UserRound, PawPrint } from 'lucide-react';
import type { RelationType } from '../../types';
import type { AparenciaAvatar } from '../../data/avatar/avatarData';
import { derivarAparenciaDeSemente } from '../../data/avatar/avatarData';
import {
  obterCategoriaAvatar,
  obterRotuloAvatar,
  CategoriaAvatar
} from '../../presentation/avatarPresentation';
import { AvatarFace } from './AvatarFace';

interface PersonAvatarProps {
  nome: string;
  idade: number;
  tipo?: RelationType;
  /** Tamanho do avatar em pixels (largura = altura). */
  tamanho?: number;
  /**
   * Personalização real (B4-FIX2): tom de pele, cabelo, olhos. Quando
   * ausente (save anterior a este PR, membro de família sem preferência,
   * pet), cai no símbolo automático por fase de vida do B4-FIX1 — o
   * FALLBACK, não mais o comportamento principal.
   */
  aparencia?: AparenciaAvatar;
  /**
   * Avatar 2.0 — semente estável (normalmente o id do NPC) para DERIVAR um
   * rosto quando não há aparência salva.
   *
   * Até aqui só o personagem do jogador tinha rosto: pai, mãe, irmãos,
   * amigos e colegas caíam todos no mesmo ícone genérico por fase de vida,
   * o que faz as pessoas da vida parecerem linhas numa lista em vez de
   * personagens. Derivando do id, cada uma ganha um rosto próprio, igual em
   * todas as sessões, sem um byte de persistência e sem migração de save.
   */
  semente?: string;
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
 * Avatar da pessoa.
 *
 * Quando há `aparencia` definida, desenha um rosto vetorial (SVG)
 * personalizado — tom de pele, cabelo e olhos escolhidos na criação da
 * vida — que se adapta à fase (rosto de bebê mais redondo, cabelo grisalho
 * a partir dos 65). Sem `aparencia` (fallback do B4-FIX1: saves antigos,
 * pets, membros de família sem preferência), usa o símbolo por fase da
 * vida — nenhum rosto gerado, nenhuma imagem externa.
 *
 * Cosmético em ambos os casos: nenhuma das duas formas afeta stats,
 * personalidade, classe social ou qualquer regra de jogo.
 */
export const PersonAvatar: React.FC<PersonAvatarProps> = ({
  nome,
  idade,
  tipo,
  tamanho = 84,
  aparencia,
  semente
}) => {
  const categoria = obterCategoriaAvatar(idade, tipo);
  const rotulo = obterRotuloAvatar(nome, categoria);
  // Prioridade: aparência salva > rosto derivado da semente > ícone por fase.
  // Um pet nunca recebe rosto humano, por mais que tenha id.
  const aparenciaEfetiva =
    categoria === 'pet'
      ? undefined
      : aparencia ?? (semente ? derivarAparenciaDeSemente(semente) : undefined);
  const usaRostoPersonalizado = !!aparenciaEfetiva;
  const Icone = ICONE_POR_CATEGORIA[categoria];

  return (
    <div
      className="person-avatar"
      style={{ width: tamanho, height: tamanho }}
      role="img"
      aria-label={rotulo}
      data-categoria={categoria}
      data-personalizado={usaRostoPersonalizado || undefined}
    >
      {usaRostoPersonalizado ? (
        <AvatarFace idade={idade} aparencia={aparenciaEfetiva!} tamanho={tamanho} />
      ) : (
        <Icone
          size={Math.round(tamanho * 0.5)}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
