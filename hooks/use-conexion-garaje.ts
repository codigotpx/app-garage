import { consultarEstado } from '@/src/services/garaceApi';
import { cargarConfig } from '@/src/services/storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

export type EstadoConexion = 'comprobando' | 'sin_red' | 'garaje_offline' | 'conectado';

export type PuertaEstado = 'open' | 'closed' | null;

function tieneRed(state: NetInfoState) {
  return state.isConnected === true;
}

export function etiquetaConexion(estado: EstadoConexion) {
  switch (estado) {
    case 'conectado':
      return {
        label: 'Conectado',
        detalle: 'Garaje en línea',
        color: '#22c55e',
        icon: 'wifi' as const,
      };
    case 'sin_red':
      return {
        label: 'Sin red',
        detalle: 'Activa Wi‑Fi o datos móviles',
        color: '#EF4444',
        icon: 'wifi-off' as const,
      };
    case 'garaje_offline':
      return {
        label: 'Sin conexión',
        detalle: 'Garaje no responde',
        color: '#EF4444',
        icon: 'wifi-off' as const,
      };
    default:
      return {
        label: 'Comprobando…',
        detalle: 'Verificando enlace…',
        color: '#8E8E93',
        icon: 'wifi' as const,
      };
  }
}

/**
 * Escucha cambios de red del teléfono y comprueba si el garaje responde.
 * @param activo — si false, no hace polling (p. ej. pestaña en segundo plano)
 */
export function useConexionGaraje(activo = true, intervaloMs = 5000) {
  const [estado, setEstado] = useState<EstadoConexion>('comprobando');
  const [puerta, setPuerta] = useState<PuertaEstado>(null);

  const verificar = useCallback(async (
    mostrarCarga = false,
    credenciales?: { ip: string; token: string },
  ) => {
    if (mostrarCarga) setEstado('comprobando');

    const net = await NetInfo.fetch();
    if (!tieneRed(net)) {
      setEstado('sin_red');
      setPuerta(null);
      return { estado: 'sin_red' as const, puerta: null };
    }

    const cfg = credenciales ?? await cargarConfig();
    if (!cfg.ip || !cfg.token) {
      setEstado('garaje_offline');
      setPuerta(null);
      return { estado: 'garaje_offline' as const, puerta: null };
    }

    const res = await consultarEstado(cfg.ip, cfg.token);
    if (res.exito && res.datos?.door) {
      const p: PuertaEstado = res.datos.door === 'open' ? 'open' : 'closed';
      setEstado('conectado');
      setPuerta(p);
      return { estado: 'conectado' as const, puerta: p };
    }

    setEstado('garaje_offline');
    setPuerta(null);
    return { estado: 'garaje_offline' as const, puerta: null };
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      if (!tieneRed(state)) {
        setEstado('sin_red');
        setPuerta(null);
      } else if (activo) {
        verificar(false);
      }
    });
    return unsub;
  }, [activo, verificar]);

  useEffect(() => {
    if (!activo) return;

    verificar(true);
    const id = setInterval(() => {
      if (AppState.currentState === 'active') {
        verificar(false);
      }
    }, intervaloMs);

    return () => clearInterval(id);
  }, [activo, verificar, intervaloMs]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active' && activo) verificar(false);
    });
    return () => sub.remove();
  }, [activo, verificar]);

  return {
    estado,
    puerta,
    verificar,
    conectado: estado === 'conectado',
  };
}
