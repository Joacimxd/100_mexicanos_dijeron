import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── QR Modal ────────────────────────────────────────────────────
function QRModal({ url, onClose }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}&color=1a2048&bgcolor=ffffff&format=svg&margin=8`;

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qr-close-btn" onClick={onClose}>✕</button>
        <div className="qr-modal-header">
          <h3>Escanea para unirte</h3>
        </div>
        <div className="qr-modal-body">
          <div className="qr-code-container">
            <img src={qrUrl} alt="QR Code" className="qr-image" />
          </div>
          <div className="qr-url">{url}</div>
          <div className="qr-hint">Escanea el código con tu celular para abrir el juego</div>
        </div>
      </div>
    </div>
  );
}

// ─── Sound Effects ───────────────────────────────────────────────
const sounds = {
  reveal: new Audio('/reveal_answer.wav'),
  strike: new Audio('/strike_sound.wav'),
  points: new Audio('/give_points.wav'),
  newRound: new Audio('/start_of_the_round.wav'),
};

// Pre-configure all sounds
Object.values(sounds).forEach((s) => {
  s.preload = 'auto';
});

function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(() => {
    // Ignore autoplay restrictions — sound will play after first user interaction
  });
}

// ─── WebSocket Hook ──────────────────────────────────────────────
function useWebSocket() {
  const [gameState, setGameState] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    // Connect to the WebSocket server (via Vite proxy or direct)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:3001`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Board: WebSocket connected');
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'state_update') {
        setGameState(msg.payload);
      }
    };

    ws.onclose = () => {
      console.log('Board: WebSocket disconnected, reconnecting...');
      reconnectTimeout.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  return gameState;
}

export default function Board() {
  const gameState = useWebSocket();
  const [prevScores, setPrevScores] = useState({ team1: 0, team2: 0 });
  const [scoreAnimating, setScoreAnimating] = useState({ team1: false, team2: false });
  const [justRevealed, setJustRevealed] = useState(new Set());
  const prevRevealedRef = useRef({});
  const prevQuestionIndex = useRef(0);
  const prevStrikes = useRef(0);
  const isFirstRender = useRef(true);

  // QR Modal state
  const [showQR, setShowQR] = useState(false);
  const [qrTarget, setQrTarget] = useState('');
  const [networkBase, setNetworkBase] = useState('');
  const [networkLoading, setNetworkLoading] = useState(true);

  // Fetch the LAN IP for QR sharing
  useEffect(() => {
    const host = window.location.hostname;
    const serverUrl = `http://${host}:3001/api/network`;

    fetch(serverUrl)
      .then((res) => res.json())
      .then((data) => {
        setNetworkBase(`http://${data.ip}:${data.port}`);
        setNetworkLoading(false);
      })
      .catch(() => {
        const port = window.location.port;
        const protocol = window.location.protocol;
        setNetworkBase(`${protocol}//${host}${port ? ':' + port : ''}`);
        setNetworkLoading(false);
      });
  }, []);

  const handleShowQR = (path) => {
    setQrTarget(`${networkBase}${path}`);
    setShowQR(true);
  };

  // Detect newly revealed answers → play reveal sound
  useEffect(() => {
    if (!gameState) return;

    const q = gameState.questions[gameState.currentQuestionIndex];
    const prevRevealed = prevRevealedRef.current[gameState.currentQuestionIndex] || [];

    const newlyRevealed = new Set();
    q.answers.forEach((a, i) => {
      if (a.revealed && !prevRevealed[i]) {
        newlyRevealed.add(i);
      }
    });

    if (newlyRevealed.size > 0) {
      setJustRevealed(newlyRevealed);
      playSound(sounds.reveal);
      setTimeout(() => setJustRevealed(new Set()), 800);
    }

    // Track revealed state
    prevRevealedRef.current[gameState.currentQuestionIndex] = q.answers.map((a) => a.revealed);
  }, [gameState]);

  // Detect score changes → play points sound
  useEffect(() => {
    if (!gameState) return;

    const anims = { team1: false, team2: false };
    if (gameState.scores.team1 !== prevScores.team1) anims.team1 = true;
    if (gameState.scores.team2 !== prevScores.team2) anims.team2 = true;

    if ((anims.team1 || anims.team2) && !isFirstRender.current) {
      setScoreAnimating(anims);
      playSound(sounds.points);
      setTimeout(() => setScoreAnimating({ team1: false, team2: false }), 4000);
    }

    setPrevScores({ ...gameState.scores });
  }, [gameState?.scores.team1, gameState?.scores.team2]);

  // Detect new question → play new round sound
  useEffect(() => {
    if (!gameState) return;

    if (gameState.currentQuestionIndex !== prevQuestionIndex.current && !isFirstRender.current) {
      playSound(sounds.newRound);
    }
    prevQuestionIndex.current = gameState.currentQuestionIndex;
  }, [gameState?.currentQuestionIndex]);

  // Detect strikes → play strike sound
  useEffect(() => {
    if (!gameState) return;

    if (gameState.showStrikes && gameState.strikes > prevStrikes.current) {
      playSound(sounds.strike);
    }
    prevStrikes.current = gameState.strikes;
  }, [gameState?.strikes, gameState?.showStrikes]);

  // Mark first render done after initial state
  useEffect(() => {
    if (gameState && isFirstRender.current) {
      playSound(sounds.newRound);
      // Use a small timeout so the first state_update doesn't trigger sounds
      setTimeout(() => {
        isFirstRender.current = false;
      }, 500);
    }
  }, [gameState]);

  if (!gameState) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">Conectando al servidor...</div>
      </div>
    );
  }

  const currentQ = gameState.questions[gameState.currentQuestionIndex];
  const answerSlots = currentQ.answers.slice();
  
  const hasLongAnswer = currentQ.answers.some(a => a.text && a.text.length > 18);

  const padScore = (score) => String(score).padStart(3, '0');

  return (
    <div className="board-container">

      {/* Top Right QR Button */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
        <button
          className="home-top-qr-btn"
          style={{ position: 'static' }}
          onClick={() => handleShowQR('/control')}
          disabled={networkLoading}
          title="Compartir enlace de control"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <span>QR</span>
        </button>
      </div>

      {/* QR Modal */}
      {showQR && <QRModal url={qrTarget} onClose={() => setShowQR(false)} />}

      <div className="game-board-frame">
        <div className="game-board-svg"></div>

        <div className="board-top-marquee">
          <div className="ear-score">{padScore(gameState.roundPoints)}</div>
        </div>

        <div className="board-left-ear">
          <div className="ear-score">{padScore(gameState.scores.team1)}</div>
        </div>

        <div className="board-right-ear">
          <div className="ear-score">{padScore(gameState.scores.team2)}</div>
        </div>

        <div className="board-main-inner">
          <div className="answers-list">
            {answerSlots.map((answer, idx) => {
              const isRevealed = answer.revealed;
              const isJustRevealed = justRevealed.has(idx);

              return (
                <div
                  key={`${gameState.currentQuestionIndex}-${idx}`}
                  className={`answer-row ${isRevealed ? 'revealed' : ''} ${isJustRevealed ? 'just-revealed' : ''}`}
                >
                  <div className="answer-row-index">{idx + 1}.</div>
                  {isRevealed ? (
                    <>
                      <div className={`answer-row-text ${hasLongAnswer ? 'small-text' : ''}`}>{answer.text}</div>
                      <div className="answer-row-dots"></div>
                      <div className="answer-row-points">{answer.points}</div>
                    </>
                  ) : (
                    <div className="answer-row-dots"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {/* Strike Overlay */}
      {gameState.showStrikes && gameState.strikes > 0 && (
        <div className="strike-overlay">
          {Array.from({ length: gameState.strikes }).map((_, i) => (
            <span key={i} className="strike-x">✕</span>
          ))}
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState.gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-title">¡Juego Terminado!</div>
          <div className="game-over-winner">
            {gameState.scores.team1 > gameState.scores.team2
              ? `🏆 ${gameState.teamNames.team1} Gana 🏆`
              : gameState.scores.team2 > gameState.scores.team1
              ? `🏆 ${gameState.teamNames.team2} Gana 🏆`
              : '¡Empate!'}
          </div>
          <div className="game-over-score">
            {gameState.scores.team1} — {gameState.scores.team2}
          </div>
        </div>
      )}
      
      {/* Flashing light effect when scoring */}
      {scoreAnimating.team1 && <div className="flash-overlay team1" />}
      {scoreAnimating.team2 && <div className="flash-overlay team2" />}
    </div>
  );
}