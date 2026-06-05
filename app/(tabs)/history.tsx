import { limpiarHistorial, obtenerHistorial } from '@/src/services/historyApi';
import { Entypo, Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type EventoHistorial = {
  tipo: string;
  exito: boolean;
  error: string | null;
  timestamp: string;
  fecha: string;
};

function formatearFecha(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  const esMismoDia = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (esMismoDia(d, hoy)) return 'Hoy';
  if (esMismoDia(d, ayer)) return 'Ayer';

  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined,
  });
}

export default function History() {
  const [eventos, setEventos] = useState<EventoHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    const todo = await obtenerHistorial();
    const aperturas = todo
      .filter((e: EventoHistorial) => e.tipo === 'abrir')
      .reverse();
    setEventos(aperturas);
    setCargando(false);
    setRefrescando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const onRefresh = () => {
    setRefrescando(true);
    cargar(true);
  };

  const confirmarLimpiar = () => {
    Alert.alert(
      'Limpiar historial',
      '¿Borrar todos los registros de apertura?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await limpiarHistorial();
            setEventos([]);
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: EventoHistorial }) => {
    const ok = item.exito;
    return (
      <View style={styles.eventoCard}>
        <View style={[styles.iconWrap, ok ? styles.iconOk : styles.iconFail]}>
          <Entypo
            name={ok ? 'arrow-bold-up' : 'cross'}
            size={18}
            color={ok ? '#15803d' : '#EF4444'}
          />
        </View>
        <View style={styles.eventoBody}>
          <Text style={styles.eventoTitulo}>
            {ok ? 'Puerta abierta' : 'Apertura fallida'}
          </Text>
          <Text style={styles.eventoHora}>
            {formatearFecha(item.fecha)} · {item.timestamp}
          </Text>
          {!ok && item.error ? (
            <Text style={styles.eventoError} numberOfLines={2}>
              {item.error}
            </Text>
          ) : null}
        </View>
        <View style={[styles.badgeMini, ok ? styles.badgeOk : styles.badgeFail]}>
          <Text style={[styles.badgeMiniText, { color: ok ? '#22c55e' : '#EF4444' }]}>
            {ok ? 'OK' : 'Error'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.containerHeader}>
        <View>
          <Text style={styles.textTitle}>HISTORIAL</Text>
          <Text style={styles.textTitleBottom}>APERTURAS</Text>
        </View>
        {eventos.length > 0 && (
          <TouchableOpacity onPress={confirmarLimpiar} hitSlop={12}>
            <Feather name="trash-2" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{eventos.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#22c55e' }]}>
            {eventos.filter(e => e.exito).length}
          </Text>
          <Text style={styles.statLabel}>Exitosas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#EF4444' }]}>
            {eventos.filter(e => !e.exito).length}
          </Text>
          <Text style={styles.statLabel}>Fallidas</Text>
        </View>
      </View>

      {cargando ? (
        <ActivityIndicator style={styles.loader} color="#22c55e" />
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(item) => item.fecha}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            eventos.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={onRefresh}
              tintColor="#22c55e"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Feather name="clock" size={40} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>Sin aperturas aún</Text>
              <Text style={styles.emptyText}>
                Cada vez que abras el garaje desde Control, aparecerá aquí con la hora.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  containerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  textTitle: {
    fontWeight: '800',
    fontSize: 20,
    color: '#1C1C1E',
    letterSpacing: 3,
  },
  textTitleBottom: {
    fontWeight: '800',
    fontSize: 13,
    color: '#22c55e',
    letterSpacing: 5,
    marginTop: -2,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  listContent: {
    paddingBottom: 40,
    gap: 10,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  eventoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOk: {
    backgroundColor: '#DCFCE7',
  },
  iconFail: {
    backgroundColor: '#FEE2E2',
  },
  eventoBody: {
    flex: 1,
    gap: 2,
  },
  eventoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  eventoHora: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  eventoError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
  },
  badgeMini: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeOk: {
    backgroundColor: '#0D3F1D',
  },
  badgeFail: {
    backgroundColor: '#3F0D0D',
  },
  badgeMiniText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3A3A3C',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  loader: {
    marginTop: 40,
  },
});
