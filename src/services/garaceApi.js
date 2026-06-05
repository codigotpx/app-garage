// Funciones para comunicarse con el ESP8266 del garaje

import {
  fetchGaraje,
  mensajeErrorRed,
  normalizarIp,
  urlGaraje,
} from './httpGaraje';

export { normalizarIp, mensajeErrorRed };

/**
 * Prueba conexión con el garaje (ping)
 */
export async function pingGaraje(ip, token) {
  try {
    const res = await fetchGaraje(
      urlGaraje(ip, '/ping', { token: token.trim() }),
    );
    const datos = await res.json();
    return res.ok && datos.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Abre la puerta del garaje
 */
export async function abrirPuerta(ip, token) {
  try {
    const res = await fetchGaraje(
      urlGaraje(ip, '/open', { token: token.trim() }),
    );
    const datos = await res.json();
    if (res.ok && datos.door) {
      return { exito: true, datos: { door: datos.door } };
    }
    return { exito: false, error: 'El garaje rechazó el comando' };
  } catch (err) {
    return {
      exito: false,
      error: err.name === 'AbortError'
        ? 'Timeout: El garaje no responde'
        : mensajeErrorRed(err),
    };
  }
}

/**
 * Cierra la puerta del garaje
 */
export async function cerrarPuerta(ip, token) {
  try {
    const res = await fetchGaraje(
      urlGaraje(ip, '/close', { token: token.trim() }),
    );
    const datos = await res.json();
    if (res.ok && datos.door) {
      return { exito: true, datos: { door: datos.door } };
    }
    return { exito: false, error: 'El garaje rechazó el comando' };
  } catch (err) {
    return {
      exito: false,
      error: err.name === 'AbortError'
        ? 'Timeout: El garaje no responde'
        : mensajeErrorRed(err),
    };
  }
}

/**
 * Consulta el estado actual de la puerta
 */
export async function consultarEstado(ip, token) {
  try {
    const res = await fetchGaraje(
      urlGaraje(ip, '/status', { token: token.trim() }),
    );
    const datos = await res.json();
    if (res.ok && datos.door) {
      return { exito: true, datos: { door: datos.door } };
    }
    return { exito: false, error: 'No se pudo obtener el estado' };
  } catch (err) {
    return {
      exito: false,
      error: err.name === 'AbortError'
        ? 'Timeout: El garaje no responde'
        : mensajeErrorRed(err),
    };
  }
}
