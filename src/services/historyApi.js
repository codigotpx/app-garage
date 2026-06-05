// src/services/historyApi.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@toque_secure:history';

/**
 * Obtiene el timestamp formateado
 * @returns {string} HH:MM:SS
 */
function obtenerTimestamp() {
  const ahora = new Date();
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0');
  return `${horas}:${minutos}:${segundos}`;
}

/**
 * Guarda un evento en el historial
 * @param {string} tipo - 'abrir' o 'cerrar'
 * @param {boolean} exito - Si el comando fue exitoso
 * @param {string} error - Mensaje de error (opcional)
 */
export async function guardarEvento(tipo, exito, error = null) {
  try {
    const datos = await AsyncStorage.getItem(HISTORY_KEY);
    const historial = datos ? JSON.parse(datos) : [];

    const evento = {
      tipo,
      exito,
      error,
      timestamp: obtenerTimestamp(),
      fecha: new Date().toISOString(),
    };

    historial.push(evento);

    // Mantener solo los últimos 100 eventos
    if (historial.length > 100) {
      historial.shift();
    }

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(historial));
  } catch (err) {
    console.error('Error guardando evento:', err);
  }
}

/**
 * Obtiene todo el historial
 * @returns {Promise<Array>}
 */
export async function obtenerHistorial() {
  try {
    const datos = await AsyncStorage.getItem(HISTORY_KEY);
    return datos ? JSON.parse(datos) : [];
  } catch (err) {
    console.error('Error obteniendo historial:', err);
    return [];
  }
}

/**
 * Limpia el historial
 */
export async function limpiarHistorial() {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error('Error limpiando historial:', err);
  }
}
