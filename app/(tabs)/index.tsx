import { etiquetaConexion, useConexionGaraje } from '@/hooks/use-conexion-garaje';
import { abrirPuerta, cerrarPuerta } from '@/src/services/garaceApi';
import { guardarEvento } from '@/src/services/historyApi';
import { cargarConfig } from '@/src/services/storage';
import { Entypo, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import house from '../../assets/images/house.png';

const DOOR = { OPEN: 'open', CLOSED: 'closed' };

export default function HomeScreen() {
  const [door, setDoor]     = useState(DOOR.CLOSED);
  const [config, setConfig] = useState<{ip: string, token: string} | null>(null);
  const [monitoreoActivo, setMonitoreoActivo] = useState(false);

  const { estado, puerta, verificar, conectado } = useConexionGaraje(monitoreoActivo);

  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const ledRedAnim   = useRef(new Animated.Value(1)).current;
  const ledGreenAnim = useRef(new Animated.Value(0)).current;

  const conexion = etiquetaConexion(estado);

  const aplicarPuerta = useCallback((nuevo: string) => {
    setDoor(nuevo);
    Animated.parallel([
      Animated.timing(ledRedAnim,   { toValue: nuevo === DOOR.CLOSED ? 1 : 0.15, duration: 300, useNativeDriver: true }),
      Animated.timing(ledGreenAnim, { toValue: nuevo === DOOR.OPEN   ? 1 : 0.15, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [ledRedAnim, ledGreenAnim]);

  useFocusEffect(
    useCallback(() => {
      setMonitoreoActivo(true);
      cargarConfig().then(setConfig);
      verificar(true);
      return () => setMonitoreoActivo(false);
    }, [verificar]),
  );

  useEffect(() => {
    if (puerta === 'open') aplicarPuerta(DOOR.OPEN);
    else if (puerta === 'closed') aplicarPuerta(DOOR.CLOSED);
  }, [puerta, aplicarPuerta]);

  const pulse = () => {
    Animated.sequence([
      Animated.spring(pulseAnim, { toValue: 1.05, useNativeDriver: true }),
      Animated.spring(pulseAnim, { toValue: 1,    useNativeDriver: true }),
    ]).start();
  };

  const handleAction = async (tipo: string) => {
    if (!config || !conectado) return;
    Vibration.vibrate(40);
    pulse();

    const res = tipo === 'abrir'
      ? await abrirPuerta(config.ip, config.token)
      : await cerrarPuerta(config.ip, config.token);

    if (tipo === 'abrir') {
      await guardarEvento('abrir', res.exito, res.error);
    }

    if (res.exito && res.datos) {
      const nuevo = res.datos.door === 'open' ? DOOR.OPEN : DOOR.CLOSED;
      aplicarPuerta(nuevo);
    }

    await verificar(false);
  };

  const isOpen   = door === DOOR.OPEN;
  const isClosed = door === DOOR.CLOSED;

  const badgeInfo = isOpen
    ? { label: 'ABIERTA', bg: '#0D3F1D', color: '#22c55e' }
    : { label: 'CERRADA', bg: '#3F0D0D', color: '#EF4444' };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

      <View style={styles.containerHeader}>
        <View>
          <Text style={styles.textTitle}>SECURE</Text>
          <Text style={styles.textTitleBottom}>TOUCH</Text>
        </View>
        <View style={styles.wifiRow}>
          <View style={[styles.connDot, { backgroundColor: conexion.color }]} />
          <Text style={[styles.wifiLabel, { color: conexion.color }]}>
            {conexion.label}
          </Text>
          <Feather name={conexion.icon} size={15} color={conexion.color} />
        </View>
      </View>

      <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
        <BlurView intensity={60} tint="light" style={styles.tarjetaCristal}>
          <Image source={house} style={styles.houseImg} />
          <View style={[styles.badgeEstado, { backgroundColor: badgeInfo.bg }]}>
            <Text style={[styles.badgeText, { color: badgeInfo.color }]}>{badgeInfo.label}</Text>
          </View>
          <Text style={styles.textGaraje}>Garaje Principal</Text>
        </BlurView>
      </Animated.View>

      <View style={styles.containerLeds}>
        <View style={styles.ledItem}>
          <Animated.View style={[styles.ledDot, styles.ledRed,   { opacity: ledRedAnim   }]} />
          <Text style={styles.textLed}>LED Rojo</Text>
        </View>
        <View style={styles.ledDivider} />
        <View style={styles.ledItem}>
          <Animated.View style={[styles.ledDot, styles.ledGreen, { opacity: ledGreenAnim }]} />
          <Text style={styles.textLed}>LED Verde</Text>
        </View>
      </View>

      <View style={styles.containerButton}>
        <TouchableOpacity
          style={[styles.buttonClick, styles.buttonOpen, (isOpen || !conectado) && styles.buttonDisabled]}
          onPress={() => handleAction('abrir')}
          disabled={isOpen || !conectado}
          activeOpacity={0.75}
        >
          <View style={styles.buttonInner}>
            <Entypo name="arrow-bold-up" size={20} color="#fff" />
            <Text style={styles.textButtonOpen}>ABRIR PUERTA</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonClick, styles.buttonClose, (isClosed || !conectado) && styles.buttonDisabled]}
          onPress={() => handleAction('cerrar')}
          disabled={isClosed || !conectado}
          activeOpacity={0.75}
        >
          <View style={styles.buttonInner}>
            <Entypo name="arrow-bold-down" size={20} color="#EF4444" />
            <Text style={styles.textButtonClose}>CERRAR PUERTA</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Feather name="cpu" size={14} color="#555" />
          <Text style={styles.cardText}>Dispositivo: ESP32</Text>
        </View>
        <View style={styles.cardRow}>
          <Feather name="radio" size={14} color={conexion.color} />
          <Text style={[styles.cardText, { color: conexion.color }]}>
            {conexion.detalle}
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 50,
    gap: 22,
  },
  containerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
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
  wifiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  wifiLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tarjetaCristal: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 30,
    paddingVertical: 28,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  houseImg: {
    width: 110,
    height: 100,
    resizeMode: 'contain',
  },
  badgeEstado: {
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 110,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  textGaraje: {
    fontWeight: '600',
    fontSize: 17,
    color: '#1C1C1E',
  },
  containerLeds: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  ledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ledDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  ledRed: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  ledGreen: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  ledDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  textLed: {
    fontWeight: '600',
    fontSize: 13,
    color: '#3A3A3C',
  },
  containerButton: {
    width: '100%',
    gap: 10,
  },
  buttonClick: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonOpen: {
    backgroundColor: '#15803d',
    shadowColor: '#22c55e',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonClose: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textButtonOpen: {
    fontWeight: '800',
    fontSize: 17,
    color: '#fff',
    letterSpacing: 1.5,
  },
  textButtonClose: {
    fontWeight: '800',
    fontSize: 17,
    color: '#EF4444',
    letterSpacing: 1.5,
  },
  card: {
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    width: '100%',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardText: {
    fontSize: 13,
    color: '#3A3A3C',
  },
});