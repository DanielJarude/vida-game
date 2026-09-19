import { EducationLevel, LifeStage, SocialClass } from '../types';

export function formatarDinheiro(valor: number): string {
  const isNegative = valor < 0;
  const absVal = Math.abs(valor);
  const formatted = absVal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
  return isNegative ? `-${formatted}` : formatted;
}

export function formatarIdade(idade: number): string {
  if (idade === 0) return 'Recém-nascido (0 anos)';
  if (idade === 1) return '1 ano';
  return `${idade} anos`;
}

export function getLifeStage(idade: number): LifeStage {
  if (idade <= 5) return 'primeira_infancia';
  if (idade <= 11) return 'infancia';
  if (idade <= 17) return 'adolescencia';
  if (idade <= 29) return 'jovem_adulto';
  if (idade <= 59) return 'adulto';
  return 'terceira_idade';
}

export function getLifeStageLabel(stage: LifeStage): string {
  switch (stage) {
    case 'primeira_infancia': return 'Primeira Infância';
    case 'infancia': return 'Infância';
    case 'adolescencia': return 'Adolescência';
    case 'jovem_adulto': return 'Jovem Adulto';
    case 'adulto': return 'Adulto';
    case 'terceira_idade': return 'Terceira Idade';
  }
}

export function getEducationLabel(nivel: EducationLevel): string {
  switch (nivel) {
    case 'nenhuma': return 'Sem escolaridade';
    case 'fundamental_incompleto': return 'Ensino Fundamental Incompleto';
    case 'fundamental_completo': return 'Ensino Fundamental Completo';
    case 'medio_incompleto': return 'Ensino Médio Incompleto';
    case 'medio_completo': return 'Ensino Médio Completo';
    case 'tecnico': return 'Ensino Técnico';
    case 'superior_incompleto': return 'Ensino Superior Incompleto';
    case 'superior_completo': return 'Ensino Superior Completo';
    case 'pos_graduacao': return 'Pós-Graduação / Especialização';
  }
}

export function getSocialClassLabel(classe: SocialClass): string {
  switch (classe) {
    case 'vulneravel': return 'Classe Baixa';
    case 'trabalhadora': return 'Classe Trabalhadora';
    case 'classe_media_baixa': return 'Classe Média Baixa';
    case 'classe_media': return 'Classe Média';
    case 'classe_alta': return 'Classe Alta';
  }
}

export function getStatColor(value: number): string {
  if (value >= 75) return '#10b981'; // Green
  if (value >= 50) return '#3b82f6'; // Blue
  if (value >= 25) return '#f59e0b'; // Amber / Orange
  return '#ef4444'; // Red
}

export function getStatClass(value: number): string {
  if (value >= 75) return 'stat-high';
  if (value >= 50) return 'stat-med-high';
  if (value >= 25) return 'stat-med-low';
  return 'stat-low';
}
