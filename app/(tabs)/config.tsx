import { etiquetaConexion, useConexionGaraje } from '@/hooks/use-conexion-garaje';
import { limpiarHistorial } from '@/src/services/historyApi';
import { normalizarIp } from '@/src/services/httpGaraje';
import { borrarConfig, cargarConfig, guardarConfig } from '@/src/services/storage';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function enmascararToken(token: string) {
  if (!token) return '—';
  if (token.length <= 4) return '••••';
  return '••••' + token.slice(-4);
}

export default function ConfigScreen() {
  const [ip, setIp] = useState('');
  const [token, setToken] = useState('');
  const [tokenGuardado, setTokenGuardado] = useState('');
  const [visible, setVisible] = useState(false);
  const [editandoToken, setEditandoToken] = useState(false);

  const [monitoreoActivo, setMonitoreoActivo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const { estado, puerta, verificar, conectado } = useConexionGaraje(monitoreoActivo);
  const conexion = etiquetaConexion(estado);
  const probando = estado === 'comprobando' && !cargando;

  const revisarConexion = useCallback((ipActual: string, tokenActual: string) => {
    return verificar(
      true,
      { ip: ipActual.trim(), token: tokenActual.trim() },
    );
  }, [verificar]);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setMonitoreoActivo(true);
      (async () => {
        setCargando(true);
        setError('');
        setExito('');
        const cfg = await cargarConfig();
        if (!activo) return;
        setIp(cfg.ip);
        setTokenGuardado(cfg.token);
        setToken('');
        setEditandoToken(false);
        await revisarConexion(cfg.ip, cfg.token);
        if (activo) setCargando(false);
      })();
      return () => {
        activo = false;
        setMonitoreoActivo(false);
      };
    }, [revisarConexion]),
  );

  const tokenEfectivo = editandoToken ? token : tokenGuardado;

  const guardar = async () => {
    const ipFinal = normalizarIp(ip);
    const tokenFinal = (editandoToken ? token : tokenGuardado).trim();

    if (!ipFinal) {
      setError('Ingresa la IP del garaje.');
      setExito('');
      return;
    }
    if (tokenFinal.length < 6) {
      setError('El token debe tener al menos 6 caracteres.');
      setExito('');
      return;
    }

    setGuardando(true);
    setError('');
    setExito('');

    const resultado = await revisarConexion(ipFinal, tokenFinal);
    if (resultado.estado !== 'conectado') {
      setError(
        resultado.estado === 'sin_red'
          ? 'Sin red en el dispositivo. Activa Wi‑Fi o datos.'
          : 'No se pudo conectar. Revisa IP, token y que estés en la misma red.',
      );
      setGuardando(false);
      return;
    }

    await guardarConfig(ipFinal, tokenFinal);
    setTokenGuardado(tokenFinal);
    setToken('');
    setEditandoToken(false);
    setExito('Configuración guardada correctamente.');
    setGuardando(false);
  };

  const desconectar = () => {
    Alert.alert(
      'Desconectar',
      'Se borrarán la IP y el token de este dispositivo. Tendrás que volver a conectar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            await borrarConfig();
            router.replace('/login');
          },
        },
      ],
    );
  };

  const limpiarHistorialConfirm = () => {
    Alert.alert(
      'Borrar historial',
      '¿Eliminar todos los registros de apertura?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await limpiarHistorial();
            setExito('Historial borrado.');
            setError('');
          },
        },
      ],
    );
  };

  const estadoPuertaLabel =
    puerta === 'open' ? 'Abierta' :
    puerta === 'closed' ? 'Cerrada' : '—';

  const estadoPuertaColor =
    puerta === 'open' ? '#22c55e' :
    puerta === 'closed' ? '#EF4444' : '#8E8E93';

  const tituloEstado =
    estado === 'conectado' ? 'Garaje en línea' : conexion.label;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.containerHeader}>
          <View>
            <Text style={styles.textTitle}>AJUSTES</Text>
            <Text style={styles.textTitleBottom}>GARAJE</Text>
          </View>
          <TouchableOpacity
            onPress={() => revisarConexion(ip, tokenEfectivo)}
            disabled={probando || cargando}
            hitSlop={12}
          >
            {probando ? (
              <ActivityIndicator size="small" color="#22c55e" />
            ) : (
              <Feather name="refresh-cw" size={20} color="#8E8E93" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.connDot, { backgroundColor: conexion.color }]} />
            <Text style={[styles.statusTitulo, { color: conexion.color }]}>
              {cargando ? 'Cargando…' : tituloEstado}
            </Text>
            <Feather
              name={conexion.icon}
              size={16}
              color={conexion.color}
            />
          </View>
          {!cargando && estado === 'sin_red' && (
            <Text style={styles.statusAyuda}>{conexion.detalle}</Text>
          )}
          {!cargando && estado === 'garaje_offline' && (
            <Text style={styles.statusAyuda}>{conexion.detalle}</Text>
          )}
          {conectado && !cargando && (
            <View style={styles.statusDetail}>
              <Feather name="home" size={14} color="#555" />
              <Text style={styles.statusDetailText}>
                Puerta: <Text style={{ color: estadoPuertaColor, fontWeight: '700' }}>
                  {estadoPuertaLabel}
                </Text>
              </Text>
            </View>
          )}
          {ip ? (
            <Text style={styles.ipActual}>IP actual: {ip}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONEXIÓN</Text>
          <View style={styles.card}>
            <Text style={styles.etiqueta}>Dirección IP</Text>
            <TextInput
              style={styles.input}
              value={ip}
              onChangeText={t => { setIp(t); setError(''); setExito(''); }}
              placeholder="192.168.1.100"
              placeholderTextColor="#C7C7CC"
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.etiqueta}>Token de acceso</Text>
            {editandoToken ? (
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={token}
                  onChangeText={t => { setToken(t); setError(''); setExito(''); }}
                  placeholder="Nuevo token"
                  placeholderTextColor="#C7C7CC"
                  secureTextEntry={!visible}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setVisible(v => !v)} style={styles.ojito}>
                  <Feather name={visible ? 'eye-off' : 'eye'} size={18} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.tokenRow}>
                <Text style={styles.tokenMask}>{enmascararToken(tokenGuardado)}</Text>
                <TouchableOpacity
                  onPress={() => { setEditandoToken(true); setToken(''); }}
                  style={styles.cambiarBtn}
                >
                  <Text style={styles.cambiarText}>Cambiar</Text>
                </TouchableOpacity>
              </View>
            )}
            {editandoToken && (
              <TouchableOpacity
                onPress={() => { setEditandoToken(false); setToken(''); setError(''); }}
                style={styles.cancelarToken}
              >
                <Text style={styles.cancelarTokenText}>Cancelar cambio de token</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.ayuda}>
              El ESP8266 debe estar en la misma red Wi‑Fi que tu teléfono.
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.textoError}>{error}</Text> : null}
        {exito ? <Text style={styles.textoExito}>{exito}</Text> : null}

        <TouchableOpacity
          style={[styles.botonPrimario, guardando && styles.botonDisabled]}
          onPress={guardar}
          disabled={guardando || cargando}
          activeOpacity={0.75}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="save" size={18} color="#fff" />
              <Text style={styles.botonPrimarioText}>Guardar cambios</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATOS</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.accionRow} onPress={limpiarHistorialConfirm}>
              <Feather name="clock" size={18} color="#3A3A3C" />
              <Text style={styles.accionText}>Borrar historial de aperturas</Text>
              <Feather name="chevron-right" size={18} color="#C7C7CC" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.accionRow} onPress={desconectar}>
              <Feather name="log-out" size={18} color="#EF4444" />
              <Text style={[styles.accionText, { color: '#EF4444' }]}>Desconectar garaje</Text>
              <Feather name="chevron-right" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="cpu" size={14} color="#8E8E93" />
            <Text style={styles.infoText}>Dispositivo: ESP8266</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="info" size={14} color="#8E8E93" />
            <Text style={styles.infoText}>Secure Touch · v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scroll: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 50,
    gap: 16,
  },
  containerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTitulo: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  statusDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDetailText: {
    fontSize: 13,
    color: '#3A3A3C',
  },
  statusAyuda: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 17,
  },
  ipActual: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 14,
    fontSize: 16,
    color: '#1C1C1E',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  ojito: {
    padding: 10,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  tokenMask: {
    fontSize: 16,
    color: '#1C1C1E',
    letterSpacing: 2,
  },
  cambiarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cambiarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
  },
  cancelarToken: {
    alignSelf: 'flex-start',
  },
  cancelarTokenText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  ayuda: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 17,
    marginTop: 4,
  },
  textoError: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
  },
  textoExito: {
    color: '#15803d',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  botonPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803d',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#22c55e',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  botonDisabled: {
    opacity: 0.6,
  },
  botonPrimarioText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  accionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  accionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
