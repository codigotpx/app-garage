# Secure Touch 🔐

Aplicación móvil para control remoto de puertas de garaje mediante un microcontrolador **ESP8266/ESP32** en la red Wi-Fi local. Construida con **Expo** y **React Native**.

## ✨ Funcionalidades

- **Control remoto** — Abre y cierra tu puerta de garaje desde cualquier lugar de tu red local.
- **Estado en tiempo real** — Consulta si la puerta está abierta o cerrada con indicadores LED animados.
- **Historial de eventos** — Registro cronológico de aperturas con estado (éxito/fallo) y estadísticas.
- **Autenticación por token** — Comunicación segura mediante token secreto compartido entre la app y el ESP.
- **Configuración persistente** — La IP y el token se guardan localmente con AsyncStorage.
- **Soporte multiplataforma** — Android, iOS y Web.
- **Retroalimentación háptica** — Respuesta táctil en las acciones principales (iOS).

## 📱 Capturas de pantalla

| Control | Historial | Configuración | Login |
|---------|-----------|---------------|-------|
| *(pendiente)* | *(pendiente)* | *(pendiente)* | *(pendiente)* |

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/secure-touch.git
cd secure-touch

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start
```

Escanea el código QR con **Expo Go** o presiona `a` para Android / `i` para iOS.

## 🔧 Requisitos del servidor (ESP8266/ESP32)

El microcontrolador debe exponer los siguientes endpoints HTTP en su IP local:

| Endpoint | Método | Parámetros | Descripción |
|----------|--------|-------------|-------------|
| `/ping` | GET | `token` | Verifica conectividad y token |
| `/open` | GET | `token` | Abre la puerta |
| `/close` | GET | `token` | Cierra la puerta |
| `/status` | GET | `token` | Consulta estado (open/closed) |

> **Nota:** La comunicación es HTTP plano (sin TLS). Se requiere habilitar `android:usesCleartextTraffic="true"` en Android (ya configurado).

## 📁 Estructura del proyecto

```
secure-touch/
├── app/                  # Expo Router (rutas basadas en archivos)
│   ├── _layout.tsx       # Layout raíz con splash y verificación
│   ├── login.tsx         # Pantalla de inicio de sesión
│   └── (tabs)/
│       ├── _layout.tsx   # Navegación por pestañas
│       ├── index.tsx     # Control de la puerta
│       ├── history.tsx   # Historial de eventos
│       └── config.tsx    # Configuración
├── components/           # Componentes reutilizables
│   └── haptic-tab.tsx    # Botón de tab con feedback háptico
├── hooks/                # Custom hooks
│   └── use-conexion-garaje.ts  # Monitoreo de conexión y estado
├── src/
│   └── services/         # Servicios
│       ├── garaceApi.js  # API de comunicación con el garaje
│       ├── historyApi.js # Gestión de historial local
│       ├── httpGaraje.js # Utilidades HTTP
│       └── storage.js    # Persistencia AsyncStorage
├── types/                # Declaraciones TypeScript
├── scripts/              # Scripts de utilidad
├── app.json              # Configuración de Expo
├── eas.json              # EAS Build
├── tsconfig.json         # TypeScript
└── package.json          # Dependencias
```

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo Expo |
| `npm run android` | Compila y ejecuta en Android |
| `npm run ios` | Compila y ejecuta en iOS |
| `npm run web` | Inicia servidor con soporte web |
| `npm run lint` | Ejecuta ESLint |
| `npm run generate-assets` | Genera assets desde `logo.png` |

## 🛠️ Stack tecnológico

- **Framework:** [Expo](https://expo.dev) SDK 55
- **UI:** React Native 0.83, react-native-reanimated, expo-blur
- **Navegación:** Expo Router, React Navigation (bottom tabs)
- **Persistencia:** AsyncStorage
- **Red:** Fetch nativo, NetInfo para monitoreo de conectividad
- **Lenguaje:** TypeScript, JavaScript
- **Linter:** ESLint con `eslint-config-expo`

## 🚢 Build para producción

```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Web
npx expo export --platform web
```

## 🤝 Contribuir

1. Haz un fork del proyecto.
2. Crea una rama con tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Haz commit de tus cambios: `git commit -m 'Agrega nueva funcionalidad'`
4. Haz push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request.

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

Desarrollado con ❤️ por [@codigotpx](https://github.com/codigotpx)
