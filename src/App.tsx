import { useState, type ReactNode } from 'react';
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
import { descreverSituacaoAtual, getAbasDisponiveis } from './systems/availabilitySystem';
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
    personalidade,
    timeline,
    eventoAtivo,
    isDead,
    resumoMorte,
    feedbackMensagem,
    construirContexto,

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

  // Contexto e política central: abas e ações derivadas da fase da vida
  const ctx = construirContexto();
  if (!ctx) return null;

  const abasVisiveis = getAbasDisponiveis(ctx);
  const abaAtiva = abasVisiveis.includes(activeTab) ? activeTab : 'timeline';
  const situacaoAtual = descreverSituacaoAtual(ctx);

  const rotulosAbas: Record<typeof abaAtiva, { icone: ReactNode; titulo: string }> = {
    timeline: { icone: <Calendar size={16} />, titulo: 'Linha da Vida' },
    familia: { icone: <Users size={16} />, titulo: 'Relacionamentos' },
    carreira: { icone: <Briefcase size={16} />, titulo: 'Estudos & Carreira' },
    financas: { icone: <Wallet size={16} />, titulo: 'Finanças' },
    atividades: { icone: <Activity size={16} />, titulo: 'Atividades' }
  };

  return (
    <div className="app-container">
      {/* Toast de Feedback */}
      {feedbackMensagem && (
        <div
          className={`feedback-toast toast-${feedbackMensagem.tipo}`}
          role="status"
        >
          {feedbackMensagem.tipo === 'sucesso' && <CheckCircle size={16} />}
          {feedbackMensagem.tipo === 'erro' && <AlertCircle size={16} />}
          {feedbackMensagem.tipo === 'info' && <Info size={16} />}
          <span>{feedbackMensagem.texto}</span>
        </div>
      )}

      {/* Header Superior com identidade (nome, idade, local, situação, saldo) */}
      <Header
        personagem={personagem}
        economia={economia}
        situacao={situacaoAtual}
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
          personalidade={personalidade}
        />

        {/* Área Central com Abas */}
        <main className="main-content-area">
          {/* Navegação por Abas (somente as pertinentes à fase da vida) */}
          <nav className="tabs-nav" aria-label="Seções do jogo">
            {abasVisiveis.map(aba => (
              <button
                key={aba}
                className={`tab-btn ${abaAtiva === aba ? 'active' : ''}`}
                onClick={() => setActiveTab(aba)}
              >
                {rotulosAbas[aba].icone}
                <span>{rotulosAbas[aba].titulo}</span>
              </button>
            ))}
          </nav>

          {/* Conteúdo da Aba Ativa */}
          {abaAtiva === 'timeline' && (
            <TimelineTab
              timeline={timeline}
              onEnvelhecer={envelhecerAno}
              bloqueado={!!eventoAtivo}
            />
          )}

          {abaAtiva === 'familia' && (
            <FamilyTab
              personagem={personagem}
              familia={familia}
              ctx={ctx}
              onInteragir={acaoFamilia}
              onPedirCasamento={pedirCasamentoExec}
              onTerFilho={terFilhoExec}
              onTerminar={terminarRelacionamentoExec}
              onOpenDatingModal={() => setShowDatingModal(true)}
            />
          )}

          {abaAtiva === 'carreira' && (
            <CareerTab
              personagem={personagem}
              educacao={educacao}
              carreira={carreira}
              ctx={ctx}
              onAcaoEscola={acaoEscolaExec}
              onMatricularCurso={matricularCursoExec}
              onCandidatarVaga={candidatarVagaExec}
              onTrabalharMais={trabalharMaisExec}
              onPedirAumento={pedirAumentoExec}
              onPedirDemissao={pedirDemissaoExec}
              onFazerBico={fazerBicoExec}
            />
          )}

          {abaAtiva === 'financas' && (
            <EconomyTab
              personagem={personagem}
              economia={economia}
              ctx={ctx}
              onComprarBem={comprarBemExec}
              onVenderBem={venderBemExec}
              onInvestir={investirExec}
              onResgatarInvestimento={resgatarInvestimentoExec}
              onJogarLoteria={jogarLoteriaExec}
            />
          )}

          {abaAtiva === 'atividades' && (
            <ActivitiesTab
              personagem={personagem}
              economia={economia}
              ctx={ctx}
              onExecutarAtividade={executarAtividade}
            />
          )}
        </main>
      </div>

      {/* Modal de Decisão de Evento Ativo */}
      {eventoAtivo && (
        <EventModal
          evento={eventoAtivo}
          personagem={personagem}
          economia={economia}
          personalidade={personalidade}
          onEscolherOpcao={responderEvento}
        />
      )}

      {/* Modal de Conhecer Pessoas / Namoro (adultos) */}
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
