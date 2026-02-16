import { Routes, Route } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import Home from './components/Home';
import GameBoard from './components/GameBoard';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';

function AppContent() {
  const { isConnected } = useGame();

  return (
    <>
      <div className="min-h-screen bg-felt">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:gameId" element={<GameBoard />} />
        </Routes>
      </div>
      <ConnectionStatus isConnected={isConnected} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </ErrorBoundary>
  );
}

export default App;
