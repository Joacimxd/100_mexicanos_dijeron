import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function QRModal({ url, onClose }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}&bgcolor=0a0e27&color=f5c842&format=svg`;

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qr-close-btn" onClick={onClose}>✕</button>
        <h3 className="qr-title">Escanea con tu teléfono</h3>
        <div className="qr-code-container">
          <img src={qrUrl} alt="QR Code" className="qr-image" />
        </div>
        <p className="qr-url">{url}</p>
        <p className="qr-hint">Abre la cámara de tu teléfono y apunta al código QR</p>
      </div>
    </div>
  );
}

const homeSound = new Audio('/home.wav');

export default function Home() {
  const [showQR, setShowQR] = useState(false);
  const [qrTarget, setQrTarget] = useState('');
  const [networkBase, setNetworkBase] = useState('');
  const [loading, setLoading] = useState(true);

  // Play background music
  useEffect(() => {
    homeSound.currentTime = 0;
    const playPromise = homeSound.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked, wait for user interaction
        const playOnInteract = () => {
          homeSound.play();
          document.removeEventListener('click', playOnInteract);
        };
        document.addEventListener('click', playOnInteract);
      });
    }

    return () => {
      homeSound.pause();
    };
  }, []);

  // Fetch the actual LAN IP from the server
  useEffect(() => {
    const host = window.location.hostname;
    const serverUrl = `http://${host}:3001/api/network`;

    fetch(serverUrl)
      .then((res) => res.json())
      .then((data) => {
        setNetworkBase(`http://${data.ip}:${data.port}`);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to current window location
        const port = window.location.port;
        const protocol = window.location.protocol;
        setNetworkBase(`${protocol}//${host}${port ? ':' + port : ''}`);
        setLoading(false);
      });
  }, []);

  const handleShowQR = (path) => {
    setQrTarget(`${networkBase}${path}`);
    setShowQR(true);
  };

  return (
    <div className="home-container">
      {/* Top Right QR Button */}
      <button
        className="home-top-qr-btn"
        onClick={() => handleShowQR('/')}
        disabled={loading}
        title="Compartir enlace de red"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <span>QR</span>
      </button>

      {/* SVG Image Buttons */}
      <div className="home-buttons-grid">
        <Link to="/board" className="home-image-btn">
          <img src="/board.svg" alt="Abrir Tablero" />
        </Link>
        <Link to="/control" className="home-image-btn">
          <img src="/control.svg" alt="Abrir Control" />
        </Link>
      </div>

      {/* QR Modal */}
      {showQR && <QRModal url={qrTarget} onClose={() => setShowQR(false)} />}
    </div>
  );
}
