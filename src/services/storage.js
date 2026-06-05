// src/services/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Las "llaves" con las que se guardan los datos en el teléfono
const CLAVE_IP    = '@toque_secure:ip';
const CLAVE_TOKEN = '@toque_secure:token';

// GUARDAR — se llama cuando el usuario conecta exitosamente
export async function guardarConfig(ip, token) {
  await AsyncStorage.setItem(CLAVE_IP, ip);
  await AsyncStorage.setItem(CLAVE_TOKEN, token);
}

// LEER — se llama al abrir la app para ver si ya hay datos
export async function cargarConfig() {
  const ip    = await AsyncStorage.getItem(CLAVE_IP);
  const token = await AsyncStorage.getItem(CLAVE_TOKEN);
  return {
    ip:    ip    ?? '',
    token: token ?? '',
  };
}

// BORRAR — útil para un botón "cerrar sesión" o "desconectar"
export async function borrarConfig() {
  await AsyncStorage.removeItem(CLAVE_IP);
  await AsyncStorage.removeItem(CLAVE_TOKEN);
}