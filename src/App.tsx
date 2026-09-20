import { useState } from 'react';
import { useGame } from './hooks/useGame';
import { GameShell } from './components/shell/GameShell';
import { SectionRouter } from './components/shell/SectionRouter';
import { EventExperience } from './components/events/EventExperience';
import { AnnualSummary } from './components/feedback/AnnualSummary';
import { DatingModal } from './components/modals/DatingModal';
import { HomeScreen } from './components/screens/HomeScreen';
import { CharacterCreationScreen } from './components/screens/CharacterCreationScreen';
import { DeathScreen } from './components/screens/DeathScreen';
import { StatsScreen } from './components/screens/StatsScreen';
import {
  descreverSituacaoAtual,
  getAbasDisponiveis
} from './systems/availabilitySystem';

/**
 * App — composição da aplicação.
 *
 * Responsabilidade: escolher a tela e montar o shell do jogo ativo.
 * Não contém markup de seção, lógica de evento, regra de idade nem economia.
 * Tudo isso vive em `systems/` (regras) e nos componentes de domínio (UI).
 */
export function App() {
  const jogo = useGame();
  const [mostrarEncontros, setMostrarEncontros] = useState(false);

  // ------------------------------------------------------------ Telas fora do jogo
  if (jogo.screen === 'home') {
    return (
      <HomeScreen
        hasSavedGame={jogo.hasSavedGame}
        onNovaVida={() => jogo.setScreen('create')}
        onContinuar={jogo.continuarJogoSalvo}
        onEstatisticas={() => jogo.setScreen('stats')}
        onGerarAleatorio={jogo.gerarVidaAleatoria}
      />
    );
  }

  if (jogo.screen === 'create') {
    return (
      <CharacterCreationScreen
        onCriarVida={jogo.criarVida}
        onVoltar={() => jogo.setScreen('home')}
      />
    );
  }

  if (jogo.screen === 'stats') {
    return (
      <StatsScreen
        onVoltar={() => jogo.setScreen(jogo.personagem ? 'game' : 'home')}
      />
    );
  }

  if (jogo.isDead && jogo.resumoMorte) {
    return (
      <DeathScreen
        resumo={jogo.resumoMorte}
        onJogarNovamente={jogo.reiniciarJogo}
        onVerEstatisticas={() => jogo.setScreen('stats')}
      />
    );
  }

  if (!jogo.personagem) return null;

  // ------------------------------------------------- Contexto e política central
  const ctx = jogo.construirContexto();
  if (!ctx) return null;

  // Navegação derivada exclusivamente da política de disponibilidade por idade.
  const abasVisiveis = getAbasDisponiveis(ctx);
  const abaAtiva = abasVisiveis.includes(jogo.activeTab)
    ? jogo.activeTab
    : 'timeline';
  const situacao = descreverSituacaoAtual(ctx);

  const eventoAberto = !!jogo.eventoAtivo;

  return (
    <GameShell
      personagem={jogo.personagem}
      educacao={jogo.educacao}
      carreira={jogo.carreira}
      economia={jogo.economia}
      familia={jogo.familia}
      personalidade={jogo.personalidade}
      situacao={situacao}
      variacaoAtributos={jogo.variacaoAtributos}
      abas={abasVisiveis}
      abaAtiva={abaAtiva}
      onSelecionarAba={jogo.setActiveTab}
      somLigado={jogo.somLigado}
      onToggleSom={jogo.toggleSom}
      onGoHome={() => jogo.setScreen('home')}
      onOpenStats={() => jogo.setScreen('stats')}
      feedback={jogo.feedbackMensagem}
      overlays={
        <>
          {jogo.eventoAtivo && (
            <EventExperience
              evento={jogo.eventoAtivo}
              personagem={jogo.personagem}
              economia={jogo.economia}
              personalidade={jogo.personalidade}
              onEscolherOpcao={jogo.responderEvento}
              onContinuar={jogo.fecharEvento}
            />
          )}

          {/* O resumo anual espera o evento do ano ser resolvido. */}
          {!eventoAberto && jogo.resumoAnual && (
            <AnnualSummary
              resumo={jogo.resumoAnual}
              onFechar={jogo.fecharResumoAnual}
            />
          )}

          {mostrarEncontros && (
            <DatingModal
              personagem={jogo.personagem}
              onClose={() => setMostrarEncontros(false)}
              onIniciarNamoro={jogo.iniciarNamoroExec}
            />
          )}
        </>
      }
    >
      <SectionRouter
        aba={abaAtiva}
        ctx={ctx}
        personagem={jogo.personagem}
        familia={jogo.familia}
        educacao={jogo.educacao}
        carreira={jogo.carreira}
        economia={jogo.economia}
        timeline={jogo.timeline}
        eventoAberto={eventoAberto}
        onEnvelhecer={jogo.envelhecerAno}
        onInteragirFamilia={jogo.acaoFamilia}
        onPedirCasamento={jogo.pedirCasamentoExec}
        onTerFilho={jogo.terFilhoExec}
        onTerminarRelacionamento={jogo.terminarRelacionamentoExec}
        onAbrirEncontros={() => setMostrarEncontros(true)}
        onAcaoEscola={jogo.acaoEscolaExec}
        onMatricularCurso={jogo.matricularCursoExec}
        onCandidatarVaga={jogo.candidatarVagaExec}
        onTrabalharMais={jogo.trabalharMaisExec}
        onPedirAumento={jogo.pedirAumentoExec}
        onPedirDemissao={jogo.pedirDemissaoExec}
        onFazerBico={jogo.fazerBicoExec}
        onComprarBem={jogo.comprarBemExec}
        onVenderBem={jogo.venderBemExec}
        onInvestir={jogo.investirExec}
        onResgatarInvestimento={jogo.resgatarInvestimentoExec}
        onJogarLoteria={jogo.jogarLoteriaExec}
        onExecutarAtividade={jogo.executarAtividade}
      />
    </GameShell>
  );
}
