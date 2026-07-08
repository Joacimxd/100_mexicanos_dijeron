import React, { useState, useEffect, useRef, useCallback } from 'react';

function useControlWebSocket() {
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:3001`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Control: WebSocket connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'state_update') {
        setGameState(msg.payload);
      }
    };

    ws.onclose = () => {
      console.log('Control: WebSocket disconnected');
      setConnected(false);
      reconnectTimeout.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  const send = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  return { gameState, connected, send };
}

export default function Control() {
  const { gameState, connected, send } = useControlWebSocket();
  const [confirmReset, setConfirmReset] = useState(false);

  if (!gameState) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">Conectando al servidor...</div>
      </div>
    );
  }

  const currentQ = gameState.questions[gameState.currentQuestionIndex];

  const handleReveal = (index) => {
    send({ type: 'reveal_answer', answerIndex: index });
  };

  const handleStrike = () => {
    send({ type: 'add_strike' });
  };

  const handleClearStrikes = () => {
    send({ type: 'clear_strikes' });
  };

  const handleAwardPoints = (team) => {
    send({ type: 'award_points', team });
  };

  const handleNextQuestion = () => {
    send({ type: 'next_question' });
  };

  const handleSetMultiplier = (value) => {
    send({ type: 'set_multiplier', value });
  };

  const handleReset = () => {
    if (confirmReset) {
      send({ type: 'reset_game' });
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  return (
    <div className="control-container">

      {/* Current Question */}
      <div className="control-header">
        <div className="ctrl-title">
          Pregunta {gameState.currentQuestionIndex + 1} / {gameState.totalQuestions}
        </div>
        <h2>{currentQ.question}</h2>
      </div>


      {/* Multiplier */}
      <div className="multiplier-section">
        <span className="mult-label">Multiplicador</span>
        {[1, 2, 3, 4].map((m) => (
          <button
            key={m}
            className={`mult-btn ${gameState.multiplier === m ? 'active' : ''}`}
            onClick={() => handleSetMultiplier(m)}
          >
            ×{m}
          </button>
        ))}
      </div>

      {/* Answer Reveal Buttons */}
      <div className="control-answers">
        {currentQ.answers.map((answer, idx) => (
          <button
            key={idx}
            className="ctrl-answer-btn"
            disabled={answer.revealed}
            onClick={() => handleReveal(idx)}
          >
            <span className="btn-number">{idx + 1}</span>
            <span className="btn-text">{answer.text}</span>
            <span className="btn-points">{answer.points} pts</span>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="control-actions">
        {/* Strike */}
        <button className="action-btn btn-strike" onClick={handleStrike}>
          ✕ Strike ({gameState.strikes}/3)
        </button>

        {gameState.strikes > 0 && (
          <button
            className="action-btn btn-next"
            onClick={handleClearStrikes}
            style={{ fontSize: '0.85rem' }}
          >
            Quitar Strikes
          </button>
        )}

        {/* Award Points */}
        <div className="action-row">
          <button
            className="action-btn btn-award"
            onClick={() => handleAwardPoints('team1')}
          >
            🏆 Dar puntos a<br />{gameState.teamNames.team1}
          </button>
          <button
            className="action-btn btn-award"
            onClick={() => handleAwardPoints('team2')}
          >
            🏆 Dar puntos a<br />{gameState.teamNames.team2}
          </button>
        </div>

        {/* Next Question */}
        <button className="action-btn btn-next" onClick={handleNextQuestion}>
          Siguiente Pregunta →
        </button>

        {/* Reset */}
        <button className="action-btn btn-reset" onClick={handleReset}>
          {confirmReset ? '¿Estás seguro? Toca otra vez' : 'Reiniciar Juego'}
        </button>
      </div>
    </div>
  );
}
