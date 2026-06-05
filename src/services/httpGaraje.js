/**
 * Utilidades HTTP para hablar con el ESP8266 en la red local.
 */

export function normalizarIp(ip) {
  return ip
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .trim();
}

export function urlGaraje(ip, ruta, params = {}) {
  const host = normalizarIp(ip);
  const query = new URLSearchParams(params).toString();
  const base = `http://${host}${ruta}`;
  if (!query) return base;
  return `${base}${ruta.includes('?') ? '&' : '?'}${query}`;
}

export async function fetchGaraje(url, ms = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export function mensajeErrorRed(err) {
  if (err?.name === 'AbortError') {
    return 'Tiempo de espera agotado. ¿El garaje está encendido y en la misma red Wi‑Fi?';
  }
  const msg = String(err?.message ?? err ?? '');
  if (msg.includes('Network request failed') || msg.includes('Failed to connect')) {
    return 'No se pudo conectar al garaje. Usa la misma red Wi‑Fi, IP sin http:// (ej. 192.168.1.100) y verifica que el ESP esté encendido.';
  }
  return `Error de conexión: ${msg}`;
}
