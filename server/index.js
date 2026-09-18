import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// ─── Load Questions ──────────────────────────────────────────────
const questionsData = JSON.parse(
  readFileSync(join(__dirname, 'data', 'questions.json'), 'utf-8')
);
const questions = questionsData.questions;

// ─── Game State ──────────────────────────────────────────────────
let gameState = createInitialState();

function createInitialState() {
  return {
    currentQuestionIndex: 0,
    questions: questions.map((q) => ({
      question: q.question,
      totalAnswers: q.answers.length,
      answers: q.answers.map((a) => ({
        text: a.text,
        points: a.points,
        revealed: false,
      })),
    })),
    scores: { team1: 0, team2: 0 },
    teamNames: { team1: 'Equipo 1', team2: 'Equipo 2' },
    strikes: 0,
    showStrikes: false,
    roundPoints: 0,
    multiplier: 1,
    totalQuestions: questions.length,
    gameOver: false,
  };
}

function getCurrentQuestion() {
  return gameState.questions[gameState.currentQuestionIndex];
}

function recalcRoundPoints() {
  const q = getCurrentQuestion();
  gameState.roundPoints = q.answers
    .filter((a) => a.revealed)
    .reduce((sum, a) => sum + a.points, 0);
}

// ─── REST Endpoints ──────────────────────────────────────────────
app.get('/api/state', (req, res) => {
  res.json(gameState);
});

app.get('/api/questions', (req, res) => {
  res.json(questions);
});

app.get('/api/network', (req, res) => {
  const nets = networkInterfaces();
  let lanIp = null;
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4
      if (!net.internal && net.family === 'IPv4') {
        // Prefer 192.168.x.x addresses
        if (net.address.startsWith('192.168')) {
          lanIp = net.address;
          break;
        }
        if (!lanIp) lanIp = net.address;
      }
    }
    if (lanIp && lanIp.startsWith('192.168')) break;
  }
  res.json({ ip: lanIp || 'localhost', port: 5173 });
});

// ─── WebSocket Server ────────────────────────────────────────────
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();

function broadcast() {
  const data = JSON.stringify({ type: 'state_update', payload: gameState });
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  }
}

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`Client connected. Total: ${clients.size}`);

  // Send current state immediately on connect
  ws.send(JSON.stringify({ type: 'state_update', payload: gameState }));

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'reveal_answer': {
        const q = getCurrentQuestion();
        const idx = msg.answerIndex;
        if (idx >= 0 && idx < q.answers.length && !q.answers[idx].revealed) {
          q.answers[idx].revealed = true;
          recalcRoundPoints();
          // Clear any active strikes when revealing
          gameState.showStrikes = false;
          gameState.strikes = 0;
        }
        break;
      }

      case 'add_strike': {
        if (gameState.strikes < 3) {
          gameState.strikes += 1;
          gameState.showStrikes = true;
          // Auto-hide strikes after 2 seconds
          setTimeout(() => {
            gameState.showStrikes = false;
            broadcast();
          }, 2000);
        }
        break;
      }

      case 'clear_strikes': {
        gameState.strikes = 0;
        gameState.showStrikes = false;
        break;
      }

      case 'award_points': {
        const team = msg.team; // 'team1' or 'team2'
        if (team === 'team1' || team === 'team2') {
          gameState.scores[team] += gameState.roundPoints * gameState.multiplier;
          // After awarding, move to next or end
        }
        break;
      }

      case 'next_question': {
        if (gameState.currentQuestionIndex < gameState.totalQuestions - 1) {
          gameState.currentQuestionIndex += 1;
          gameState.strikes = 0;
          gameState.showStrikes = false;
          gameState.roundPoints = 0;
          gameState.multiplier = 1;
        } else {
          gameState.gameOver = true;
        }
        break;
      }

      case 'set_multiplier': {
        const m = parseInt(msg.value, 10);
        if (m >= 1 && m <= 4) {
          gameState.multiplier = m;
        }
        break;
      }

      case 'set_team_name': {
        const team = msg.team;
        if ((team === 'team1' || team === 'team2') && msg.name) {
          gameState.teamNames[team] = msg.name;
        }
        break;
      }

      case 'reset_game': {
        gameState = createInitialState();
        break;
      }

      default:
        console.log('Unknown message type:', msg.type);
    }

    broadcast();
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total: ${clients.size}`);
  });
});

// ─── Start ───────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 100 Mexicanos Dijeron — Server running`);
  console.log(`   REST API:   http://localhost:${PORT}/api/state`);
  console.log(`   WebSocket:  ws://localhost:${PORT}`);
  console.log(`   Ready for connections!\n`);
});
