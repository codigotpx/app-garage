// src/screens/LoginScreen.js
import { fetchGaraje, mensajeErrorRed, normalizarIp, urlGaraje } from '@/src/services/httpGaraje';
import { guardarConfig } from '@/src/services/storage';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import logo from '../assets/images/logo.png';

export default function LoginScreen({ navigation }) {
  const [ip, setIp]             = useState('');
  const [token, setToken]       = useState('');
  const [visible, setVisible]   = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');

  const conectar = async () => {
    if (!ip.trim()) {
      setError('Ingresa la IP del ESP8266.');
      return;
    }
    if (token.length < 6) {
      setError('El token debe tener al menos 6 caracteres.');
      return;
    }

    setCargando(true);
    setError('');

    const ipLimpia = normalizarIp(ip);

    try {
      const res = await fetchGaraje(
        urlGaraje(ipLimpia, '/ping', { token: token.trim() }),
      );
      const datos = await res.json();

      if (res.ok && datos.status === 'ok') {
        await guardarConfig(ipLimpia, token.trim());
        router.replace('/');
      } else {
        setError('Token incorrecto. El garaje rechazó la conexión.');
      }
    } catch (err: unknown) {
      setError(mensajeErrorRed(err));
    }

    setCargando(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoWrap}>
        <Image source={logo} style={styles.logoImg} />
        <Text style={styles.titulo}>SECURE</Text>
        <Text style={styles.tituloVerde}>TOUCH</Text>
      </View>

      <View style={styles.grupo}>
        <Text style={styles.etiqueta}>DIRECCIÓN IP DEL GARAJE</Text>
        <TextInput
          style={styles.input}
          value={ip}
          onChangeText={t => { setIp(t); setError(''); }}
          placeholder="192.168.1.100"
          placeholderTextColor="#bbb"
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.ayuda}>
          Solo la IP (ej. 192.168.1.100), sin http://. Mismo Wi‑Fi que el ESP8266.
        </Text>
      </View>

      <View style={styles.grupo}>
        <Text style={styles.etiqueta}>TOKEN DE ACCESO</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={token}
            onChangeText={t => { setToken(t); setError(''); }}
            placeholder="Token secreto"
            placeholderTextColor="#bbb"
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setVisible(v => !v)} style={styles.ojito}>
            <Text style={{ fontSize: 18 }}>{visible ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.textoError}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.boton, cargando && { opacity: 0.6 }]}
        onPress={conectar}
        disabled={cargando}
      >
        {cargando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.textoBoton}>Conectar al garaje</Text>
        }
      </TouchableOpacity>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F2F2F7',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoImg: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    borderRadius: 22,
    marginBottom: 12,
  },
  titulo:      { fontSize: 24, fontWeight: '800', color: '#1C1C1E', letterSpacing: 4 },
  tituloVerde: { fontSize: 12, fontWeight: '700', color: '#22c55e', letterSpacing: 5 },
  grupo:       { width: '100%', marginBottom: 16 },
  etiqueta: {
    fontSize: 10, fontWeight: '700', color: '#aaa',
    letterSpacing: 1.5, marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#e0e0e0',
    padding: 14, fontSize: 16,
    color: '#1C1C1E', fontFamily: 'Courier',
    marginBottom: 4,
  },
  ayuda:   { fontSize: 11, color: '#bbb', lineHeight: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ojito:   { padding: 10 },
  textoError: {
    color: '#EF4444', fontSize: 13,
    textAlign: 'center', marginBottom: 12,
  },
  boton: {
    backgroundColor: '#15803d', borderRadius: 14,
    paddingVertical: 16, width: '100%',
    alignItems: 'center', marginTop: 4,
  },
  textoBoton: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});