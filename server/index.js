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

const PORT = process.env.PORT || 3001;

// ─── Default Questions ───────────────────────────────────────────
const defaultQuestionsData = JSON.parse(
  readFileSync(join(__dirname, 'data', 'questions.json'), 'utf-8')
);
const defaultQuestions = defaultQuestionsData.questions;

// ─── Room State Management ───────────────────────────────────────
const rooms = new Map();

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createInitialState(questionsArray) {
  return {
    currentQuestionIndex: 0,
    questions: questionsArray.map((q) => ({
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
    totalQuestions: questionsArray.length,
    gameOver: false,
  };
}

function getCurrentQuestion(room) {
  return room.gameState.questions[room.gameState.currentQuestionIndex];
}

function recalcRoundPoints(room) {
  const q = getCurrentQuestion(room);
  room.gameState.roundPoints = q.answers
    .filter((a) => a.revealed)
    .reduce((sum, a) => sum + a.points, 0);
}

// ─── REST Endpoints ──────────────────────────────────────────────
app.post('/api/rooms', (req, res) => {
  let customQuestions = req.body.questions;
  
  // Basic validation if custom questions are provided
  if (customQuestions) {
    if (!Array.isArray(customQuestions) || customQuestions.length === 0) {
      return res.status(400).json({ error: 'Invalid questions format' });
    }
  } else {
    customQuestions = defaultQuestions;
  }

  let roomId;
  do {
    roomId = generateRoomId();
  } while (rooms.has(roomId));

  const newRoom = {
    id: roomId,
    gameState: createInitialState(customQuestions),
    clients: new Set(),
    originalQuestions: customQuestions,
  };

  rooms.set(roomId, newRoom);
  
  // Cleanup old empty rooms occasionally
  if (rooms.size > 100) {
     for (const [id, room] of rooms.entries()) {
        if (room.clients.size === 0) rooms.delete(id);
     }
  }

  res.json({ roomId });
});

app.get('/api/state/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room.gameState);
});

app.get('/api/network', (req, res) => {
  const nets = networkInterfaces();
  let lanIp = null;
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (!net.internal && net.family === 'IPv4') {
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

function broadcast(room) {
  const data = JSON.stringify({ type: 'state_update', payload: room.gameState });
  for (const ws of room.clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  }
}

wss.on('connection', (ws, req) => {
  // Extract roomId from URL query, e.g. /?room=ABCD
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomId = url.searchParams.get('room');

  if (!roomId || !rooms.has(roomId)) {
    ws.close(1008, 'Invalid Room ID');
    return;
  }

  const room = rooms.get(roomId);
  room.clients.add(ws);
  console.log(`Client connected to room ${roomId}. Room clients: ${room.clients.size}`);

  // Send current state immediately on connect
  ws.send(JSON.stringify({ type: 'state_update', payload: room.gameState }));

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'reveal_answer': {
        const q = getCurrentQuestion(room);
        const idx = msg.answerIndex;
        if (idx >= 0 && idx < q.answers.length && !q.answers[idx].revealed) {
          q.answers[idx].revealed = true;
          recalcRoundPoints(room);
          room.gameState.showStrikes = false;
          room.gameState.strikes = 0;
        }
        break;
      }

      case 'add_strike': {
        if (room.gameState.strikes < 3) {
          room.gameState.strikes += 1;
          room.gameState.showStrikes = true;
          setTimeout(() => {
            if (rooms.has(roomId)) {
               room.gameState.showStrikes = false;
               broadcast(room);
            }
          }, 2000);
        }
        break;
      }

      case 'clear_strikes': {
        room.gameState.strikes = 0;
        room.gameState.showStrikes = false;
        break;
      }

      case 'award_points': {
        const team = msg.team;
        if (team === 'team1' || team === 'team2') {
          room.gameState.scores[team] += room.gameState.roundPoints * room.gameState.multiplier;
        }
        break;
      }

      case 'next_question': {
        if (room.gameState.currentQuestionIndex < room.gameState.totalQuestions - 1) {
          room.gameState.currentQuestionIndex += 1;
          room.gameState.strikes = 0;
          room.gameState.showStrikes = false;
          room.gameState.roundPoints = 0;
          room.gameState.multiplier = 1;
        } else {
          room.gameState.gameOver = true;
        }
        break;
      }

      case 'set_multiplier': {
        const m = parseInt(msg.value, 10);
        if (m >= 1 && m <= 4) {
          room.gameState.multiplier = m;
        }
        break;
      }

      case 'set_team_name': {
        const team = msg.team;
        if ((team === 'team1' || team === 'team2') && msg.name) {
          room.gameState.teamNames[team] = msg.name;
        }
        break;
      }

      case 'reset_game': {
        room.gameState = createInitialState(room.originalQuestions);
        break;
      }

      default:
        console.log('Unknown message type:', msg.type);
    }

    broadcast(room);
  });

  ws.on('close', () => {
    room.clients.delete(ws);
    console.log(`Client disconnected from room ${roomId}. Room clients: ${room.clients.size}`);
  });
});

// ─── Start ───────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 100 Mexicanos Dijeron — Server running on port ${PORT}`);
});
