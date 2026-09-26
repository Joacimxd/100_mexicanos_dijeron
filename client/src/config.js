export function getServerUrl() {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  const host = window.location.hostname;
  return `http://${host}:3001`;
}

export function getWsUrl() {
  if (import.meta.env.VITE_BACKEND_URL) {
    const url = new URL(import.meta.env.VITE_BACKEND_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    // Remove trailing slash if present
    return url.href.replace(/\/$/, '');
  }
  const host = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${host}:3001`;
}
