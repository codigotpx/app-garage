// app/_layout.tsx  ← este es tu "App.js"
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import logo from '../assets/images/logo.png';
import { fetchGaraje, urlGaraje } from '../src/services/httpGaraje';
import { cargarConfig } from '../src/services/storage';

export default function RootLayout() {
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const revisar = async () => {
      const { ip, token } = await cargarConfig();

      if (ip && token) {
        try {
          const res = await fetchGaraje(
            urlGaraje(ip, '/ping', { token }),
            4000,
          );
          const datos = await res.json();
          // Tiene datos y el garaje responde → va a las tabs
          if (res.ok && datos.status === 'ok') {
            router.replace('/(tabs)');
          } else {
            router.replace('/login');
          }
        } catch {
          router.replace('/login');
        }
      } else {
        // Primera vez → login
        router.replace('/login');
      }

      setVerificando(false);
    };

    revisar();
  }, []);

  if (verificando) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Image
          source={logo}
          style={{ width: 120, height: 120, resizeMode: 'contain', borderRadius: 26 }}
        />
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}