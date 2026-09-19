import { useState } from 'react';
import { useGame } from './hooks/useGame';
import { Header } from './components/layout/Header';
import { StatsSidebar } from './components/layout/StatsSidebar';
import { EventModal } from './components/modals/EventModal';
import { DatingModal } from './components/modals/DatingModal';
import { TimelineTab } from './components/tabs/TimelineTab';
import { FamilyTab } from './components/tabs/FamilyTab';
import { CareerTab } from './components/tabs/CareerTab';
import { EconomyTab } from './components/tabs/EconomyTab';
import { ActivitiesTab } from './components/tabs/ActivitiesTab';
import { HomeScreen } from './components/screens/HomeScreen';
import { CharacterCreationScreen } from './components/screens/CharacterCreationScreen';
import { DeathScreen } from './components/screens/DeathScreen';
import { StatsScreen } from './components/screens/StatsScreen';
import {
  Calendar,
  Users,
  Briefcase,
  Wallet,
  Activity,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

export function App() {
  const {
    screen,
    setScreen,
    activeTab,
    setActiveTab,
    hasSavedGame,
    somLigado,
    toggleSom,
    personagem,
    familia,
    educacao,
    carreira,
    economia,
    timeline,
    eventoAtivo,
    isDead,
    resumoMorte,
    feedbackMensagem,

    // Ações
    criarVida,
    gerarVidaAleatoria,
    continuarJogoSalvo,
    envelhecerAno,
    responderEvento,
    acaoFamilia,
    acaoEscolaExec,
    matricularCursoExec,
    candidatarVagaExec,
    trabalharMaisExec,
    pedirAumentoExec,
    pedirDemissaoExec,
    fazerBicoExec,
    comprarBemExec,
    venderBemExec,
    investirExec,
    resgatarInvestimentoExec,
    jogarLoteriaExec,
    executarAtividade,
    iniciarNamoroExec,
    pedirCasamentoExec,
    terFilhoExec,
    terminarRelacionamentoExec,
    reiniciarJogo
  } = useGame();

  const [showDatingModal, setShowDatingModal] = useState(false);

  // 1. Tela Inicial
  if (screen === 'home') {
    return (
      <HomeScreen
        hasSavedGame={hasSavedGame}
        onNovaVida={() => setScreen('create')}
        onContinuar={continuarJogoSalvo}
        onEstatisticas={() => setScreen('stats')}
        onGerarAleatorio={gerarVidaAleatoria}
      />
    );
  }

  // 2. Tela de Criação de Personagem
  if (screen === 'create') {
    return (
      <CharacterCreationScreen
        onCriarVida={criarVida}
        onVoltar={() => setScreen('home')}
      />
    );
  }

  // 3. Tela de Estatísticas / Hall da Fama
  if (screen === 'stats') {
    return (
      <StatsScreen
        onVoltar={() => setScreen(personagem ? 'game' : 'home')}
      />
    );
  }

  // 4. Tela de Morte / Obituário
  if (isDead && resumoMorte) {
    return (
      <DeathScreen
        resumo={resumoMorte}
        onJogarNovamente={reiniciarJogo}
        onVerEstatisticas={() => setScreen('stats')}
      />
    );
  }

  // 5. Tela Principal de Jogo Ativo
  if (!personagem) {
    return null;
  }

  return (
    <div className="app-container">
      {/* Toast de Feedback */}
      {feedbackMensagem && (
        <div className={`feedback-toast toast-${feedbackMensagem.tipo}`}>
          {feedbackMensagem.tipo === 'sucesso' && <CheckCircle size={16} />}
          {feedbackMensagem.tipo === 'erro' && <AlertCircle size={16} />}
          {feedbackMensagem.tipo === 'info' && <Info size={16} />}
          <span>{feedbackMensagem.texto}</span>
        </div>
      )}

      {/* Header Superior */}
      <Header
        personagem={personagem}
        economia={economia}
        somLigado={somLigado}
        onToggleSom={toggleSom}
        onGoHome={() => setScreen('home')}
        onOpenStats={() => setScreen('stats')}
      />

      {/* Grid Principal */}
      <div className="game-layout">
        {/* Painel Lateral / Stats */}
        <StatsSidebar
          personagem={personagem}
          carreira={carreira}
          educacao={educacao}
        />

        {/* Área Central com Abas */}
        <main className="main-content-area">
          {/* Navegação por Abas */}
          <nav className="tabs-nav">
            <button
              className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <Calendar size={16} />
              <span>Linha da Vida</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'familia' ? 'active' : ''}`}
              onClick={() => setActiveTab('familia')}
            >
              <Users size={16} />
              <span>Relacionamentos</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'carreira' ? 'active' : ''}`}
              onClick={() => setActiveTab('carreira')}
            >
              <Briefcase size={16} />
              <span>Carreira & Estudo</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'financas' ? 'active' : ''}`}
              onClick={() => setActiveTab('financas')}
            >
              <Wallet size={16} />
              <span>Finanças</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'atividades' ? 'active' : ''}`}
              onClick={() => setActiveTab('atividades')}
            >
              <Activity size={16} />
              <span>Atividades</span>
            </button>
          </nav>

          {/* Conteúdo da Aba Ativa */}
          {activeTab === 'timeline' && (
            <TimelineTab
              timeline={timeline}
              onEnvelhecer={envelhecerAno}
              bloqueado={!!eventoAtivo}
            />
          )}

          {activeTab === 'familia' && (
            <FamilyTab
              personagem={personagem}
              familia={familia}
              onInteragir={acaoFamilia}
              onPedirCasamento={pedirCasamentoExec}
              onTerFilho={terFilhoExec}
              onTerminar={terminarRelacionamentoExec}
              onOpenDatingModal={() => setShowDatingModal(true)}
            />
          )}

          {activeTab === 'carreira' && (
            <CareerTab
              personagem={personagem}
              educacao={educacao}
              carreira={carreira}
              onAcaoEscola={acaoEscolaExec}
              onMatricularCurso={matricularCursoExec}
              onCandidatarVaga={candidatarVagaExec}
              onTrabalharMais={trabalharMaisExec}
              onPedirAumento={pedirAumentoExec}
              onPedirDemissao={pedirDemissaoExec}
              onFazerBico={fazerBicoExec}
            />
          )}

          {activeTab === 'financas' && (
            <EconomyTab
              personagem={personagem}
              economia={economia}
              onComprarBem={comprarBemExec}
              onVenderBem={venderBemExec}
              onInvestir={investirExec}
              onResgatarInvestimento={resgatarInvestimentoExec}
              onJogarLoteria={jogarLoteriaExec}
            />
          )}

          {activeTab === 'atividades' && (
            <ActivitiesTab
              personagem={personagem}
              economia={economia}
              onExecutarAtividade={executarAtividade}
            />
          )}
        </main>
      </div>

      {/* Modal de Decisão de Evento Ativo */}
      {eventoAtivo && (
        <EventModal
          evento={eventoAtivo}
          onEscolherOpcao={responderEvento}
        />
      )}

      {/* Modal de Conhecer Pessoas / Namoro */}
      {showDatingModal && (
        <DatingModal
          personagem={personagem}
          onClose={() => setShowDatingModal(false)}
          onIniciarNamoro={iniciarNamoroExec}
        />
      )}
    </div>
  );
}
