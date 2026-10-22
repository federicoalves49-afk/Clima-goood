# ClimaApp 🌦️

Aplicación web de clima con diseño adaptable, datos meteorológicos reales de Open-Meteo y soporte básico para PWA.

## Funciones

- Clima actual, sensación térmica, humedad y viento.
- Pronóstico por hora y de 7 días.
- Búsqueda de ciudades mediante geocodificación.
- Ubicación actual con permiso del usuario.
- Cambio entre Celsius y Fahrenheit.
- Tema claro y oscuro.
- Diseño responsive para celular y computadora.
- Manifiesto PWA y service worker para caché de archivos estáticos.

## Ejecutar localmente

Podés usar VS Code con la extensión Live Server o cualquier servidor estático. También podés ejecutar `python -m http.server 8000` desde esta carpeta y abrir `http://localhost:8000`.

No es recomendable abrir `index.html` con `file://`, porque el service worker y la ubicación requieren un contexto seguro/servidor.

## Publicar en GitHub y Netlify

1. Creá un repositorio nuevo en GitHub.
2. Subí el contenido de esta carpeta a la raíz del repositorio (no hace falta subir la carpeta contenedora `ClimaApp`).
3. En Netlify, elegí **Add new site → Import an existing project** y conectá el repositorio.
4. Build command: dejar vacío.
5. Publish directory: `.` (raíz del repositorio).
6. Publicá el sitio.

También podés desplegar la carpeta directamente con Netlify Drop: https://app.netlify.com/drop

## Crear APK más adelante

Este paquete está preparado para publicar la versión web y como PWA. Para un APK nativo, se puede envolver el sitio con Capacitor en una computadora con Node.js, Android Studio y Android SDK. Esta versión ZIP no incluye un APK precompilado.

## API y atribución

Los datos se obtienen de [Open-Meteo](https://open-meteo.com/). Se requiere internet para obtener datos nuevos. La caché del service worker guarda recursos de la aplicación, no garantiza pronósticos sin conexión.

Consultá los términos de Open-Meteo para confirmar que tu uso y cualquier redistribución cumplan sus condiciones: https://open-meteo.com/en/terms
