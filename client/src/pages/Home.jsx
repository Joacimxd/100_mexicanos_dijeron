import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServerUrl } from '../config';

const homeSound = new Audio('/home.wav');

export default function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    homeSound.currentTime = 0;
    const playPromise = homeSound.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const playOnInteract = () => {
          homeSound.play().catch(() => {});
          document.removeEventListener('click', playOnInteract);
        };
        document.addEventListener('click', playOnInteract);
      });
    }
    return () => homeSound.pause();
  }, []);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    try {
      let questions = null;
      if (file) {
        const text = await file.text();
        const json = JSON.parse(text);
        if (!json.questions || !Array.isArray(json.questions)) {
          throw new Error('El archivo JSON debe contener un arreglo "questions".');
        }
        questions = json.questions;
      }

      const res = await fetch(`${getServerUrl()}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });

      if (!res.ok) throw new Error('Error al crear la sala.');

      const data = await res.json();
      navigate(`/board/${data.roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    navigate(`/control/${joinCode.toUpperCase()}`);
  };

  return (
    <div className="home-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'white', padding: '2rem' }}>
      <img src="/logo.png" alt="Logo" style={{ maxWidth: '300px', marginBottom: '2rem' }} />
      
      {error && <div style={{ color: '#ff4444', marginBottom: '1rem', background: 'rgba(255,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* CREATE ROOM SECTION */}
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ margin: 0, textAlign: 'center', color: '#ffcb00' }}>CREAR JUEGO</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc', textAlign: 'center' }}>Inicia una nueva partida y usa tu TV o PC como tablero.</p>
          
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={(e) => setFile(e.target.files[0])}
          />
          
          <button 
            onClick={() => fileInputRef.current.click()}
            style={{ padding: '0.8rem', background: '#2a2a2a', border: '1px solid #444', color: 'white', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {file ? `📎 ${file.name}` : '📁 Subir preguntas (Opcional)'}
          </button>
          {file && (
             <button onClick={() => setFile(null)} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.8rem' }}>Quitar archivo</button>
          )}

          <button 
            onClick={handleCreateRoom}
            disabled={loading}
            style={{ padding: '1rem', background: '#ffcb00', border: 'none', color: '#000', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: 'auto' }}
          >
            {loading ? 'CREANDO...' : 'CREAR TABLERO'}
          </button>
        </div>

        {/* JOIN ROOM SECTION */}
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ margin: 0, textAlign: 'center', color: '#ffcb00' }}>UNIRSE</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc', textAlign: 'center' }}>Únete desde tu celular para controlar el tablero.</p>
          
          <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <input 
              type="text" 
              placeholder="CÓDIGO DE SALA" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              style={{ padding: '1rem', background: '#2a2a2a', border: '1px solid #444', color: 'white', borderRadius: '8px', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.2rem', fontWeight: 'bold' }}
            />
            
            <button 
              type="submit"
              disabled={!joinCode || joinCode.length < 4}
              style={{ padding: '1rem', background: joinCode.length >= 4 ? '#00cc66' : '#2a2a2a', border: 'none', color: joinCode.length >= 4 ? '#000' : '#888', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: joinCode.length >= 4 ? 'pointer' : 'not-allowed', marginTop: 'auto' }}
            >
              ENTRAR AL CONTROL
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
